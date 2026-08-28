import type { Coordinate, HazardAlert, RouteOption, RoutePreference, RouteResponse } from "../types/api";
import { locationService } from "./locationService";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const DEFAULT_REGION = "bhubaneswar"; // the only region with a cached graph on the backend (data/graphs/)

async function backendRequest<T>(path: string, body: unknown): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not configured — cannot reach the RakshaPath backend.");
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("Backend request timed out.");
    }
    throw new Error("Could not reach the RakshaPath backend. Is it running on " + (API_BASE_URL || "(unconfigured)") + "?");
  } finally {
    window.clearTimeout(timeout);
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Backend error ${response.status}: ${text || response.statusText}`);
  }
  return response.json() as Promise<T>;
}

function toRouteOption(profileName: string, r: { polyline?: [number, number][]; coordinates?: [number, number][]; analytics: Record<string, any> }, id: string, isRecommended: boolean): RouteOption {
  const a = r.analytics || {};
  const points = r.polyline || r.coordinates || [];
  return {
    id,
    label: `${profileName.charAt(0).toUpperCase()}${profileName.slice(1)} Route`,
    description: `Computed via A* over the live routing graph (${a.node_count ?? points.length} nodes, cost ${a.routing_cost ?? "?"}).`,
    preferenceType: (profileName as RoutePreference) || "balanced",
    geometry: points.map(([lat, lng]) => ({ lat, lng })),
    isRecommended,
    analytics: {
      distanceMeters: a.actual_distance_meters ?? Math.round((a.actual_distance_km ?? 0) * 1000),
      durationSeconds: a.estimated_time_seconds ?? Math.round((a.estimated_time_minutes ?? 0) * 60),
      cost: a.routing_cost ?? 0,
      safetyScore: a.safety_score ?? 0,
      // safetyTier / safetyHighlights / safetyMetrics intentionally omitted:
      // the backend does not compute per-route lighting/CCTV/patrol data —
      // showing fabricated values here would misrepresent them as real.
      metadata: a
    }
  };
}

export interface PlanRouteParams {
  origin: string;
  destination: string;
  preference?: RoutePreference;
  activeHazard?: HazardAlert | null;
}

export const routeService = {
  /** Plans routes via the real FastAPI backend (/routes/optimize) and the existing A* routing service. */
  async planRoute(params: PlanRouteParams): Promise<RouteResponse> {
    const { origin, destination, preference = "safest" } = params;
    const profile = preference === "normal" ? "balanced" : preference;

    const resolvedOrigin = await locationService.resolveLocation(origin);
    const resolvedDest = await locationService.resolveLocation(destination);

    const raw = await backendRequest<any>("/routes/optimize", {
      start_latitude: resolvedOrigin.coordinate.lat,
      start_longitude: resolvedOrigin.coordinate.lng,
      destination_latitude: resolvedDest.coordinate.lat,
      destination_longitude: resolvedDest.coordinate.lng,
      profile,
      region: DEFAULT_REGION,
      dynamic_weights: null
    });

    const recommendedProfile = raw.recommended || profile;
    const routeEntries = Object.entries(raw.routes || {}) as [string, any][];
    const routes: RouteOption[] = routeEntries.map(([profileName, r]) =>
      toRouteOption(profileName, r, `route-${profileName}`, profileName === recommendedProfile)
    );

    if (routes.length === 0) {
      throw new Error("The backend returned no routes for this origin/destination.");
    }

    return {
      routes,
      recommendation: `route-${recommendedProfile}`,
      confidence: undefined,
      activeHazard: params.activeHazard ?? null,
      raw
    };
  },

  /**
   * Real backend reroute via /routes/reroute using the backend's own
   * dynamic_weights hazard-penalty mechanism (src/routing/edge_weights.py
   * `_get_dynamic_factor`: `{hazard_type, penalty_factor}` scales that
   * factor on every edge). This is a GLOBAL multiplier, not a localized one —
   * /routes/optimize does not return per-edge node IDs to the frontend, so a
   * geographically-targeted detour cannot be requested without changing the
   * backend (out of scope for this integration test). Whatever geometry the
   * backend actually returns — changed or unchanged — is shown as-is; this
   * function does not fabricate a detour client-side.
   */
  async triggerDemoHazard(
    currentRoutes: RouteOption[],
    hazardType: "Waterlogging" | "Road Block" = "Waterlogging"
  ): Promise<{ hazard: HazardAlert; newRoutes: RouteOption[] }> {
    const reference = currentRoutes.find(r => r.geometry.length >= 2);
    if (!reference) {
      throw new Error("Plan a route first before simulating a hazard reroute.");
    }
    const origin: Coordinate = reference.geometry[0];
    const destination: Coordinate = reference.geometry[reference.geometry.length - 1];
    const factorKey = hazardType === "Waterlogging" ? "flood" : "hazard";

    const raw = await backendRequest<any>("/routes/reroute", {
      current_latitude: origin.lat,
      current_longitude: origin.lng,
      destination_latitude: destination.lat,
      destination_longitude: destination.lng,
      current_route: null,
      current_node_index: 0,
      profile: "safest",
      region: DEFAULT_REGION,
      dynamic_weights: { hazard_type: factorKey, penalty_factor: 3.5 },
      cost_increase_threshold: 1.15
    });

    const rerouted = Boolean(raw.rerouted);
    const hazardsDetected = Array.isArray(raw.hazards_detected) ? raw.hazards_detected.length : 0;

    const hazard: HazardAlert = {
      id: `hazard-${Date.now()}`,
      type: hazardType,
      severity: "High",
      location: origin,
      locationName: "Simulated on the active route (backend-applied globally, not geo-targeted)",
      message: rerouted
        ? `Backend recomputed the route under a ${factorKey} penalty (3.5x) and returned a fresh path (hazards_detected: ${hazardsDetected}).`
        : `Backend applied the ${factorKey} penalty (3.5x) but returned the SAME path — this penalty shape is a global multiplier (see src/routing/edge_weights.py), so it does not always change which path is shortest.`,
      timestamp: "just now",
      isDemo: false
    };

    const newRoute = toRouteOption("safest", raw, "route-rerouted", true);
    const others = currentRoutes.filter(r => r.id !== "route-safest" && r.id !== "route-rerouted");

    return { hazard, newRoutes: [newRoute, ...others] };
  }
};
