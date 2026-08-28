import type { Coordinate, HazardAlert, IncidentReportInput, SafetyData } from "../types/api";
import { locationService } from "./locationService";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

async function backendFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not configured — cannot reach the RakshaPath backend.");
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("Backend request timed out.");
    }
    throw new Error("Could not reach the RakshaPath backend.");
  } finally {
    window.clearTimeout(timeout);
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Backend error ${response.status}: ${text || response.statusText}`);
  }
  return response.json() as Promise<T>;
}

interface BackendReport {
  id: number;
  report_type: string;
  description: string;
  severity: string;
  status: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

function toHazardAlert(r: BackendReport): HazardAlert {
  const severityMap: Record<string, HazardAlert["severity"]> = {
    low: "Low", medium: "Moderate", moderate: "Moderate", high: "High", critical: "Critical"
  };
  const typeMap: Record<string, HazardAlert["type"]> = {
    flood: "Waterlogging", waterlogging: "Waterlogging", accident: "Accident",
    "road block": "Road Block", blockage: "Road Block", lighting: "Low Lighting",
    crime: "Unsafe Zone", construction: "Construction"
  };
  const normalizedType = r.report_type?.toLowerCase() || "";
  const resolvedType: HazardAlert["type"] = normalizedType.startsWith("lost & found")
    ? "Lost & Found"
    : typeMap[normalizedType] || "Road Block";
  return {
    id: String(r.id),
    type: resolvedType,
    severity: severityMap[r.severity?.toLowerCase()] || "Moderate",
    location: { lat: r.latitude, lng: r.longitude },
    locationName: `Reported location (${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)})`,
    message: r.description,
    timestamp: r.created_at,
    isDemo: false
  };
}

export const safetyService = {
  /**
   * Real safety intelligence: fetches actual community hazard reports from
   * the backend (GET /reports/). The backend has no dedicated "lighting
   * index / patrol coverage / crowd density" endpoint, so those fields are
   * left undefined rather than filled with fabricated numbers — the Safety
   * page renders "—" for whatever isn't real data. The overall score is a
   * simple, clearly-derived heuristic (100 minus a penalty per open report),
   * not an AI-measured value.
   */
  async getSafetyForLocation(coord?: Coordinate | null): Promise<SafetyData> {
    const reports = await backendFetch<BackendReport[]>("/reports/");
    const hazards = reports.map(toHazardAlert);

    let relevant = hazards;
    if (coord) {
      const withinRoughly5km = (h: HazardAlert) =>
        Math.abs(h.location.lat - coord.lat) < 0.05 && Math.abs(h.location.lng - coord.lng) < 0.05;
      relevant = hazards.filter(withinRoughly5km);
    }

    const score = Math.max(0, 100 - relevant.length * 8);

    return {
      score,
      hazards: relevant,
      incidents: []
    };
  },

  /** Submits a real incident report to the backend (POST /reports/). */
  async submitReport(report: IncidentReportInput): Promise<{ success: boolean; id: string; message: string }> {
    if (!report.location.trim()) throw new Error("Location is required.");
    if (!report.description.trim()) throw new Error("Description is required.");

    const resolved = await locationService.resolveLocation(report.location);

    const result = await backendFetch<{ message: string; report_id: number }>("/reports/", {
      method: "POST",
      body: JSON.stringify({
        report_type: report.type.toLowerCase(),
        description: report.description,
        severity: report.severity.toLowerCase(),
        latitude: resolved.coordinate.lat,
        longitude: resolved.coordinate.lng
      })
    });

    return { success: true, id: String(result.report_id), message: result.message };
  }
};
