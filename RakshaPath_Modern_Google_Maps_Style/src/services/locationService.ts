import type { Coordinate, LocationPreset } from "../types/api";
import { KNOWN_LANDMARKS, PRESET_ROUTES } from "./mockData";
import { GeocodeError, geocodeLocation, parseLatLng } from "./geocoding";

export interface ResolvedLocation {
  displayName: string;
  coordinate: Coordinate;
  isCustom?: boolean;
}

const REGION_HINT = "Bhubaneswar, Odisha, India"; // only region with a cached backend graph

export const locationService = {
  getPresets(): LocationPreset[] {
    return PRESET_ROUTES;
  },

  getPresetById(id: string): LocationPreset | undefined {
    return PRESET_ROUTES.find(p => p.id === id);
  },

  getSuggestions(query: string): string[] {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    return Object.keys(KNOWN_LANDMARKS).filter(k => k.includes(q)).slice(0, 5);
  },

  /**
   * Resolves free text to real coordinates.
   * 1. "lat, lng" is parsed directly.
   * 2. An EXACT match (case-insensitive) against a known preset landmark uses
   *    its pre-vetted coordinate — a convenience shortcut, not a fallback for
   *    arbitrary text (no substring matching: that previously caused unrelated
   *    inputs like "X campus 25" / "X campus 6" to collide on a shared word).
   * 3. Everything else is geocoded for real via OpenStreetMap Nominatim.
   * Throws on failure — never fabricates a coordinate for unresolved input.
   */
  async resolveLocation(input: string): Promise<ResolvedLocation> {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error("Please enter a location name or coordinates.");
    }

    const direct = parseLatLng(trimmed);
    if (direct) {
      return {
        displayName: `${direct.lat.toFixed(4)}, ${direct.lng.toFixed(4)}`,
        coordinate: direct,
        isCustom: true
      };
    }

    const lower = trimmed.toLowerCase();
    if (KNOWN_LANDMARKS[lower]) {
      return { displayName: trimmed, coordinate: KNOWN_LANDMARKS[lower], isCustom: false };
    }

    try {
      const result = await geocodeLocation(trimmed, REGION_HINT);
      return { displayName: result.displayName, coordinate: { lat: result.lat, lng: result.lng }, isCustom: true };
    } catch (e) {
      throw new Error(e instanceof GeocodeError ? e.message : "Could not resolve this location.");
    }
  }
};
