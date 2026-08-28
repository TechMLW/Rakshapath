import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import type { Coordinate, HazardAlert, LocationPreset, RouteOption, RoutePreference, RouteResponse } from "../types/api";
import { routeService } from "../services/routeService";
import { locationService } from "../services/locationService";
import { PRESET_ROUTES } from "../services/mockData";

export interface RoutePlannerContextType {
  origin: string;
  destination: string;
  originCoord: Coordinate | null;
  destinationCoord: Coordinate | null;
  preference: RoutePreference;
  routes: RouteOption[];
  selectedId: string | null;
  selectedRoute: RouteOption | null;
  loading: boolean;
  error: string | null;
  activeHazard: HazardAlert | null;
  isDemoHazardActive: boolean;
  presets: LocationPreset[];
  setOrigin: (origin: string) => void;
  setDestination: (destination: string) => void;
  setPreference: (preference: RoutePreference) => void;
  setSelectedId: (id: string | null) => void;
  plan: (origin?: string, destination?: string, preference?: RoutePreference) => Promise<RouteResponse | null>;
  replan: (routeId: string, origin: Coordinate, destination: string, preference: RoutePreference) => Promise<RouteResponse | null>;
  applyPreset: (preset: LocationPreset) => Promise<void>;
  triggerDemoHazard: (hazardType?: "Waterlogging" | "Road Block") => Promise<void>;
  clearHazard: () => Promise<void>;
}

const RoutePlannerContext = createContext<RoutePlannerContextType | undefined>(undefined);

export function RoutePlannerProvider({ children }: { children: React.ReactNode }) {
  const [origin, setOrigin] = useState<string>("Master Canteen, Station Square");
  const [destination, setDestination] = useState<string>("Infocity, Patia");
  const [originCoord, setOriginCoord] = useState<Coordinate | null>({ lat: 20.2678, lng: 85.8441 });
  const [destinationCoord, setDestinationCoord] = useState<Coordinate | null>({ lat: 20.3541, lng: 85.8189 });
  const [preference, setPreference] = useState<RoutePreference>("safest");
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeHazard, setActiveHazard] = useState<HazardAlert | null>(null);

  const presets = useMemo(() => locationService.getPresets(), []);

  // Main route planning function
  const plan = useCallback(
    async (
      customOrigin?: string,
      customDest?: string,
      customPref?: RoutePreference
    ): Promise<RouteResponse | null> => {
      const orig = customOrigin !== undefined ? customOrigin : origin;
      const dest = customDest !== undefined ? customDest : destination;
      const pref = customPref !== undefined ? customPref : preference;

      if (!orig.trim() || !dest.trim()) {
        setError("Please enter both origin and destination.");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const resolvedOrig = await locationService.resolveLocation(orig);
        const resolvedDest = await locationService.resolveLocation(dest);

        setOriginCoord(resolvedOrig.coordinate);
        setDestinationCoord(resolvedDest.coordinate);

        const response = await routeService.planRoute({
          origin: orig,
          destination: dest,
          preference: pref,
          activeHazard
        });

        setRoutes(response.routes);
        // Find default recommended route or first route
        const recommended = response.routes.find(r => r.isRecommended) || response.routes[0];
        setSelectedId(recommended ? recommended.id : null);
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Route planning failed.";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [origin, destination, preference, activeHazard]
  );

  // Apply a known preset route
  const applyPreset = useCallback(async (preset: LocationPreset) => {
    setOrigin(preset.origin);
    setDestination(preset.destination);
    setOriginCoord(preset.originCoord);
    setDestinationCoord(preset.destCoord);
    setActiveHazard(null);
    await plan(preset.origin, preset.destination, "safest");
  }, [plan]);

  // Replan / reroute
  const replan = useCallback(async (
    _routeId: string,
    originCoordParam: Coordinate,
    dest: string,
    pref: RoutePreference
  ): Promise<RouteResponse | null> => {
    return plan(`${originCoordParam.lat}, ${originCoordParam.lng}`, dest, pref);
  }, [plan]);

  // Trigger demo hazard
  const triggerDemoHazard = useCallback(async (hazardType: "Waterlogging" | "Road Block" = "Waterlogging") => {
    setLoading(true);
    try {
      const result = await routeService.triggerDemoHazard(routes, hazardType);
      setActiveHazard(result.hazard);
      setRoutes(result.newRoutes);
      // Select the updated safest route
      setSelectedId("route-safest");
    } finally {
      setLoading(false);
    }
  }, [routes]);

  // Clear demo hazard
  const clearHazard = useCallback(async () => {
    setActiveHazard(null);
    await plan(origin, destination, preference);
  }, [origin, destination, preference, plan]);

  // Initial load
  useEffect(() => {
    plan("Master Canteen, Station Square", "Infocity, Patia", "safest");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedRoute = useMemo(() => {
    return routes.find(r => r.id === selectedId) || (routes.length > 0 ? routes[0] : null);
  }, [routes, selectedId]);

  return (
    <RoutePlannerContext.Provider
      value={{
        origin,
        destination,
        originCoord,
        destinationCoord,
        preference,
        routes,
        selectedId,
        selectedRoute,
        loading,
        error,
        activeHazard,
        isDemoHazardActive: Boolean(activeHazard),
        presets,
        setOrigin,
        setDestination,
        setPreference,
        setSelectedId,
        plan,
        replan,
        applyPreset,
        triggerDemoHazard,
        clearHazard
      }}
    >
      {children}
    </RoutePlannerContext.Provider>
  );
}

export function useRoutePlannerContext(): RoutePlannerContextType {
  const context = useContext(RoutePlannerContext);
  if (!context) {
    throw new Error("useRoutePlannerContext must be used within a RoutePlannerProvider");
  }
  return context;
}

