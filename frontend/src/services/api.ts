import type { IncidentReportInput, RoutePreference, RouteResponse, SafetyData } from "../types/api";
import { routeService } from "./routeService";
import { safetyService } from "./safetyService";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export const apiConfigured = Boolean(API_BASE_URL);

/**
 * High-level API facade over routeService/safetyService, which call the real
 * RakshaPath FastAPI backend at VITE_API_BASE_URL.
 */
export async function calculateRoutes(payload: {
  origin: string;
  destination: string;
  preference: RoutePreference;
}): Promise<RouteResponse> {
  return routeService.planRoute({
    origin: payload.origin,
    destination: payload.destination,
    preference: payload.preference
  });
}

export async function reroute(payload: {
  routeId: string;
  origin: { lat: number; lng: number };
  destination: string;
  preference: RoutePreference;
}): Promise<RouteResponse> {
  return routeService.planRoute({
    origin: `${payload.origin.lat}, ${payload.origin.lng}`,
    destination: payload.destination,
    preference: payload.preference
  });
}

export async function getSafety(params?: { lat: number; lng: number }): Promise<SafetyData> {
  return safetyService.getSafetyForLocation(params);
}

export async function submitIncident(report: IncidentReportInput): Promise<unknown> {
  return safetyService.submitReport(report);
}

export { routeService, safetyService };