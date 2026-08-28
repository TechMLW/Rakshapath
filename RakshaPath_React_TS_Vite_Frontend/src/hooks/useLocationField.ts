import { useCallback, useState } from "react";
import { GeocodeError, geocodeLocation } from "../services/geocoding";
import type { Coordinate } from "../types/api";

export type LocationStatus = "idle" | "resolving" | "resolved" | "not_found" | "error";

export interface LocationFieldState {
  query: string;
  status: LocationStatus;
  coord: Coordinate | null;
  displayName: string | null;
  errorMessage: string | null;
}

export function useLocationField(initial: LocationFieldState) {
  const [state, setState] = useState<LocationFieldState>(initial);

  const setQuery = useCallback((query: string) => {
    setState({ query, status: "idle", coord: null, displayName: null, errorMessage: null });
  }, []);

  const setResolved = useCallback((query: string, coord: Coordinate, displayName: string) => {
    setState({ query, status: "resolved", coord, displayName, errorMessage: null });
  }, []);

  const resolve = useCallback(
    async (region?: string): Promise<Coordinate | null> => {
      if (state.status === "resolved" && state.coord) return state.coord;
      if (!state.query.trim()) {
        setState((s) => ({ ...s, status: "error", errorMessage: "Enter a location." }));
        return null;
      }
      setState((s) => ({ ...s, status: "resolving", errorMessage: null }));
      try {
        const result = await geocodeLocation(state.query, region);
        const coord = { lat: result.lat, lng: result.lng };
        setState({ query: state.query, status: "resolved", coord, displayName: result.displayName, errorMessage: null });
        return coord;
      } catch (e) {
        const isNotFound = e instanceof GeocodeError && e.code === "NOT_FOUND";
        const message = e instanceof GeocodeError ? e.message : "Could not resolve this location.";
        setState((s) => ({ ...s, status: isNotFound ? "not_found" : "error", errorMessage: message }));
        return null;
      }
    },
    [state.query, state.status, state.coord]
  );

  return { ...state, setQuery, setResolved, resolve };
}
