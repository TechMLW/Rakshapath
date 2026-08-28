import type { Coordinate, HazardItem, IncidentReportInput, RouteOption, RoutePreference, RouteResponse, SafetyData } from "../types/api";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export const apiConfigured = true;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      }
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`BACKEND_${response.status}: ${errText}`);
    }
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function calculateRoutes(payload: {
  origin: Coordinate;
  destination: Coordinate;
  preference?: RoutePreference;
  region?: string;
  dynamic_weights?: Record<string, any>;
}): Promise<RouteResponse> {
  const profile = payload.preference === "normal" ? "balanced" : (payload.preference || "balanced");
  const selectedRegion = payload.region || "bhubaneswar";

  const raw = await request<any>("/routes/optimize", {
    method: "POST",
    body: JSON.stringify({
      start_latitude: payload.origin.lat,
      start_longitude: payload.origin.lng,
      destination_latitude: payload.destination.lat,
      destination_longitude: payload.destination.lng,
      profile,
      region: selectedRegion,
      dynamic_weights: payload.dynamic_weights || null,
    })
  });

  const routes: RouteOption[] = [];
  const profileOrder = ["safest", "balanced", "fastest"] as const;

  for (const pName of profileOrder) {
    const r = raw.routes?.[pName];
    if (!r) continue;

    const coords: Coordinate[] = (r.coordinates || []).map((c: [number, number]) => ({
      lat: c[0],
      lng: c[1]
    }));

    const a = r.analytics || {};
    const distanceKm = Number(a.actual_distance_km || 0);
    const durationMin = Number(a.estimated_time_minutes || 0);
    const safetyScore = a.safety_score !== undefined ? Number(a.safety_score) : null;

    routes.push({
      id: pName,
      label: pName.charAt(0).toUpperCase() + pName.slice(1) + " Route",
      geometry: coords,
      routeNodes: r.route || [],
      color: pName === "safest" ? "#4edea3" : pName === "fastest" ? "#ffb4ab" : "#aec6ff",
      analytics: {
        distanceMeters: Math.round(distanceKm * 1000),
        durationSeconds: Math.round(durationMin * 60),
        actual_distance_km: distanceKm,
        estimated_time_minutes: durationMin,
        safety_score: safetyScore,
        safetyScore: safetyScore,
        cost: a.routing_cost,
        riskLevel: a.risk_level,
        metadata: a
      }
    });
  }

  const hazards: HazardItem[] = (raw.nearby_hazards || []).map((h: any) => ({
    id: h.id,
    type: h.report_type || "hazard",
    report_type: h.report_type || "hazard",
    severity: h.severity || "medium",
    description: h.description || "",
    message: h.description || "",
    lat: h.latitude,
    lng: h.longitude,
    latitude: h.latitude,
    longitude: h.longitude,
    distance_meters: h.distance_meters
  }));

  return {
    message: raw.message,
    recommended: raw.recommended || profile,
    region: raw.region || selectedRegion,
    routes,
    geojson: raw.geojson,
    distance_km: raw.distance_km,
    estimated_time_minutes: raw.estimated_time_minutes,
    safety_score: raw.safety_score,
    risk_level: raw.risk_level,
    nearby_hazards: hazards,
    hazard_data_status: raw.hazard_data_status,
    hazard_data_message: raw.hazard_data_message
  };
}

export async function reroute(payload: {
  routeId?: string;
  origin: Coordinate;
  destination: Coordinate;
  preference?: RoutePreference;
  region?: string;
  current_route?: number[];
  dynamic_weights?: Record<string, any>;
}): Promise<RouteResponse> {
  const profile = payload.preference === "normal" ? "balanced" : (payload.preference || "balanced");
  const selectedRegion = payload.region || "bhubaneswar";

  const raw = await request<any>("/routes/reroute", {
    method: "POST",
    body: JSON.stringify({
      current_latitude: payload.origin.lat,
      current_longitude: payload.origin.lng,
      destination_latitude: payload.destination.lat,
      destination_longitude: payload.destination.lng,
      current_route: payload.current_route || null,
      current_node_index: 0,
      profile,
      region: selectedRegion,
      dynamic_weights: payload.dynamic_weights || { hazard_type: "flood", penalty_factor: 2.5 },
      cost_increase_threshold: 1.15
    })
  });

  const coords: Coordinate[] = (raw.coordinates || []).map((c: [number, number]) => ({
    lat: c[0],
    lng: c[1]
  }));

  const a = raw.analytics || {};
  const distanceKm = Number(raw.distance_km || a.actual_distance_km || 0);
  const durationMin = Number(raw.estimated_time_minutes || a.estimated_time_minutes || 0);
  const safetyScore = raw.safety_score !== undefined ? Number(raw.safety_score) : null;

  const reroutedOption: RouteOption = {
    id: "rerouted",
    label: "Rerouted Safe Bypass",
    geometry: coords,
    routeNodes: raw.route || [],
    color: "#4edea3",
    analytics: {
      distanceMeters: Math.round(distanceKm * 1000),
      durationSeconds: Math.round(durationMin * 60),
      actual_distance_km: distanceKm,
      estimated_time_minutes: durationMin,
      safety_score: safetyScore,
      safetyScore: safetyScore,
      cost: a.routing_cost,
      metadata: a
    }
  };

  return {
    message: raw.message,
    recommended: "rerouted",
    routes: [reroutedOption],
    distance_km: distanceKm,
    estimated_time_minutes: durationMin,
    safety_score: safetyScore,
    nearby_hazards: raw.hazards_detected || []
  };
}

export async function getSafety(params: { lat: number; lng: number }): Promise<SafetyData> {
  try {
    const rawReports = await request<any[]>("/reports/");
    const hazards: HazardItem[] = (rawReports || []).map(r => ({
      id: r.id,
      type: r.report_type || "hazard",
      report_type: r.report_type || "hazard",
      severity: r.severity || "medium",
      description: r.description,
      message: r.description,
      lat: r.latitude,
      lng: r.longitude,
      latitude: r.latitude,
      longitude: r.longitude
    }));

    return {
      score: hazards.length > 0 ? Math.max(30, 100 - hazards.length * 10) : 95,
      confidence: 88,
      traffic: "Normal (Free Flow)",
      weather: "Clear (28°C)",
      hazards,
      incidents: hazards,
      hazard_data_status: "active"
    };
  } catch {
    return {
      score: 92,
      confidence: 75,
      traffic: "Moderate",
      weather: "Clear",
      hazards: [],
      incidents: [],
      hazard_data_status: "degraded"
    };
  }
}

export async function submitIncident(report: IncidentReportInput): Promise<{ message: string; report_id: number }> {
  const lat = report.latitude || 20.2961;
  const lon = report.longitude || 85.8245;

  return request<{ message: string; report_id: number }>("/reports/", {
    method: "POST",
    body: JSON.stringify({
      report_type: (report.report_type || report.type || "hazard").toLowerCase(),
      severity: (report.severity || "high").toLowerCase(),
      description: report.description,
      latitude: lat,
      longitude: lon
    })
  });
}