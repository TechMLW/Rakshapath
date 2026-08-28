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

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const REQUEST_TIMEOUT_MS = 8000;
const MIN_REQUEST_INTERVAL_MS = 1100; // Nominatim usage policy: max 1 request/sec

let lastRequestAt = 0;
async function throttle() {
  const wait = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

// Leading "lat, lng" — trailing text (e.g. "(GPS)") is tolerated.
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
 * Resolves free-text to real coordinates via OpenStreetMap Nominatim.
 * Throws GeocodeError — never fabricates a coordinate for unresolved input.
 */
export async function geocodeLocation(query: string, regionHint?: string): Promise<GeocodeResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new GeocodeError("NOT_FOUND", "Enter a location.");
  }

  const direct = parseLatLng(trimmed);
  if (direct) {
    return { query: trimmed, lat: direct.lat, lng: direct.lng, displayName: `${direct.lat.toFixed(5)}, ${direct.lng.toFixed(5)}` };
  }

  const q = regionHint ? `${trimmed}, ${regionHint}` : trimmed;

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
