export type RoutePreference = "fastest" | "safest" | "balanced" | "normal";

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface RouteAnalytics {
  distanceMeters?: number;
  durationSeconds?: number;
  cost?: number;
  safetyScore?: number | null;
  riskLevel?: string;
  actual_distance_km?: number;
  estimated_time_minutes?: number;
  safety_score?: number | null;
  metadata?: Record<string, unknown>;
}

export interface RouteOption {
  id: string;
  label: string;
  geometry: Coordinate[];
  analytics: RouteAnalytics;
  routeNodes?: number[];
  color?: string;
}

export interface RouteResponse {
  message?: string;
  recommended: string;
  region?: string;
  routes: RouteOption[];
  geojson?: {
    type: string;
    features: Array<{
      type: string;
      geometry: {
        type: string;
        coordinates: [number, number][];
      };
      properties: {
        profile: string;
        recommended: boolean;
        analytics: any;
      };
    }>;
  };
  distance_km?: number;
  estimated_time_minutes?: number;
  safety_score?: number | null;
  risk_level?: string;
  nearby_hazards?: HazardItem[];
  hazard_data_status?: string;
  hazard_data_message?: string;
}

export interface HazardItem {
  id?: number | string;
  report_type?: string;
  type?: string;
  severity?: string;
  description?: string;
  message?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  distance_meters?: number;
}

export interface SafetyData {
  score?: number | null;
  confidence?: number;
  hazards?: HazardItem[];
  traffic?: string;
  weather?: string;
  incidents?: HazardItem[];
  hazard_data_status?: string;
}

export interface IncidentReportInput {
  location?: string;
  type: string;
  report_type?: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical" | string;
  latitude?: number;
  longitude?: number;
  photo?: File;
}