import { useCallback, useState } from "react";
import { calculateRoutes, reroute } from "../services/api";
import type { Coordinate, HazardItem, RouteOption, RoutePreference, RouteResponse } from "../types/api";

export function useRoutePlanner() {
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hazards, setHazards] = useState<HazardItem[]>([]);
  const [hazardStatus, setHazardStatus] = useState<string>("active");
  const [recommendedProfile, setRecommendedProfile] = useState<string>("safest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = useCallback(async (
    origin: Coordinate,
    destination: Coordinate,
    preference: RoutePreference = "safest",
    region: string = "bhubaneswar",
    dynamic_weights?: Record<string, any>
  ): Promise<RouteResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await calculateRoutes({ origin, destination, preference, region, dynamic_weights });
      if (!Array.isArray(result.routes) || result.routes.length === 0) {
        throw new Error("No routes found between selected locations.");
      }
      setRoutes(result.routes);
      setHazards(result.nearby_hazards || []);
      setHazardStatus(result.hazard_data_status || "active");
      setRecommendedProfile(result.recommended || "safest");
      
      const defaultMatch = result.routes.find(r => r.id === result.recommended) || result.routes[0];
      setSelectedId(defaultMatch?.id ?? null);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "ROUTE_REQUEST_FAILED";
      setError(message);
      setRoutes([]);
      setHazards([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const replan = useCallback(async (
    origin: Coordinate,
    destination: Coordinate,
    preference: RoutePreference = "safest",
    region: string = "bhubaneswar",
    dynamic_weights?: Record<string, any>
  ): Promise<RouteResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const currentRouteNodes = routes.find(r => r.id === selectedId)?.routeNodes;
      const result = await reroute({
        origin,
        destination,
        preference,
        region,
        current_route: currentRouteNodes,
        dynamic_weights
      });
      if (!Array.isArray(result.routes) || result.routes.length === 0) {
        throw new Error("Rerouting did not find an alternate path.");
      }
      setRoutes(result.routes);
      setSelectedId(result.routes[0]?.id ?? "rerouted");
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "REROUTE_FAILED";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [routes, selectedId]);

  return {
    routes,
    selectedRoute: routes.find(r => r.id === selectedId) ?? (routes[0] || null),
    selectedId,
    setSelectedId,
    hazards,
    hazardStatus,
    recommendedProfile,
    loading,
    error,
    plan,
    replan
  };
}