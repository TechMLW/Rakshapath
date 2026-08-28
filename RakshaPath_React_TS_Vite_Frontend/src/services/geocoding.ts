import type { Coordinate } from "../types/api";

export type GeocodeErrorCode = "NOT_FOUND" | "TIMEOUT" | "NETWORK_ERROR" | "RATE_LIMITED" | "SERVICE_ERROR";

export class GeocodeError extends Error {
  code: GeocodeErrorCode;
  constructor(code: GeocodeErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "GeocodeError";
  }
}

export interface GeocodeResult {
  query: string;
  lat: number;
  lng: number;
  displayName: string;
}

/*
 * Query-biasing hints only (mirrors src/graph/config.py REGIONS[*].place_name).
 * These narrow the geocoder search to the region the backend actually has a
 * routable graph for — they do NOT replace geocoding with a lookup table.
 */
const REGION_QUERY_HINT: Record<string, string> = {
  bhubaneswar: "Bhubaneswar, Odisha, India",
  assam: "Assam, India",
  meghalaya: "Meghalaya, India",
  arunachal_pradesh: "Arunachal Pradesh, India",
  nagaland: "Nagaland, India",
  manipur: "Manipur, India",
  mizoram: "Mizoram, India",
  tripura: "Tripura, India",
  sikkim: "Sikkim, India",
};

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const REQUEST_TIMEOUT_MS = 8000;
const MIN_REQUEST_INTERVAL_MS = 1100; // Nominatim usage policy: max 1 request/sec

let lastRequestAt = 0;
async function throttle() {
  const wait = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

// Leading "lat, lng" (e.g. from map-click pick or GPS) — trailing text like " (GPS)" is tolerated.
const LATLNG_PATTERN = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/;

export function parseLatLng(value: string): Coordinate | null {
  const m = value.match(LATLNG_PATTERN);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

/**
 * Resolves a free-text place name to real coordinates via OpenStreetMap Nominatim.
 * Throws GeocodeError (never silently substitutes a default/preset location).
 */
export async function geocodeLocation(query: string, region?: string): Promise<GeocodeResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new GeocodeError("NOT_FOUND", "Enter a location.");
  }

  const direct = parseLatLng(trimmed);
  if (direct) {
    return { query: trimmed, lat: direct.lat, lng: direct.lng, displayName: `${direct.lat.toFixed(5)}, ${direct.lng.toFixed(5)}` };
  }

  const hint = region ? REGION_QUERY_HINT[region] : undefined;
  const q = hint ? `${trimmed}, ${hint}` : trimmed;

  await throttle();

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(
      `${NOMINATIM_ENDPOINT}?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`,
      { signal: controller.signal, headers: { Accept: "application/json" } }
    );
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new GeocodeError("TIMEOUT", `Geocoding timed out for "${trimmed}". Check your connection and try again.`);
    }
    throw new GeocodeError("NETWORK_ERROR", `Could not reach the geocoding service for "${trimmed}".`);
  } finally {
    window.clearTimeout(timeout);
  }

  if (response.status === 429) {
    throw new GeocodeError("RATE_LIMITED", "Geocoding service rate limit reached. Wait a moment and try again.");
  }
  if (!response.ok) {
    throw new GeocodeError("SERVICE_ERROR", `Geocoding service error (HTTP ${response.status}).`);
  }

  const results = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!results.length) {
    throw new GeocodeError("NOT_FOUND", `Location not found: "${trimmed}".`);
  }

  const top = results[0];
  return { query: trimmed, lat: Number(top.lat), lng: Number(top.lon), displayName: top.display_name };
}

export interface RoutePreset {
  label: string;
  region: string;
  origin: { query: string; lat: number; lng: number };
  destination: { query: string; lat: number; lng: number };
}

/*
 * Convenience shortcuts only. Selecting one sets pre-vetted coordinates
 * directly (no geocoding round-trip) — typed text that happens to match
 * one of these labels is NOT special-cased and still goes through
 * geocodeLocation() above.
 */
export const ROUTE_PRESETS: RoutePreset[] = [
  {
    label: "Master Canteen → Infocity",
    region: "bhubaneswar",
    origin: { query: "Master Canteen", lat: 20.2644, lng: 85.8396 },
    destination: { query: "Infocity", lat: 20.3537, lng: 85.8195 },
  },
  {
    label: "KIIT University → Kalinga Stadium",
    region: "bhubaneswar",
    origin: { query: "KIIT University", lat: 20.3537, lng: 85.8195 },
    destination: { query: "Kalinga Stadium", lat: 20.2961, lng: 85.8245 },
  },
  {
    label: "Patia → Janpath",
    region: "bhubaneswar",
    origin: { query: "Patia", lat: 20.3588, lng: 85.8333 },
    destination: { query: "Janpath", lat: 20.2885, lng: 85.8362 },
  },
];
