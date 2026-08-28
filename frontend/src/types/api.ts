export type RoutePreference = "fastest" | "safest" | "balanced" | "normal";

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface SafetyMetrics {
  streetLightingScore: number; // 0 - 100
  patrolFrequency: string; // e.g. "High (Every 15m)", "Moderate"
  cctvCoverage: string; // e.g. "92% Corridor Coverage"
  crowdDensity: "Low" | "Moderate" | "High";
  emergencyResponseMinutes: number;
  safeHavensCount: number; // Hospitals, police booths, 24/7 pharmacies
}

export interface RouteAnalytics {
  distanceMeters: number;
  durationSeconds: number;
  cost: number;
  safetyScore: number; // 0 - 100
  safetyTier?: "Maximum Safety" | "High Safety" | "Standard";
  safetyHighlights?: string[];
  safetyMetrics?: SafetyMetrics;
  metadata?: Record<string, unknown>;
}

export interface RouteOption {
  id: string;
  label: string;
  description: string;
  preferenceType: RoutePreference;
  geometry: Coordinate[];
  analytics: RouteAnalytics;
  isRecommended?: boolean;
}

export interface HazardAlert {
  id: string;
  type: "Road Block" | "Waterlogging" | "Low Lighting" | "Accident" | "Unsafe Zone" | "Construction" | "Lost & Found";
  severity: "Low" | "Moderate" | "High" | "Critical";
  location: Coordinate;
  locationName: string;
  message: string;
  timestamp: string;
  isDemo?: boolean;
}

export interface RouteResponse {
  routes: RouteOption[];
  recommendation?: string;
  confidence?: number;
  activeHazard?: HazardAlert | null;
  raw?: unknown;
}

export interface SafetyData {
  score: number;
  confidence?: number;
  // The backend has no lighting/patrol/crowd/traffic/weather data source.
  // These are optional and left undefined rather than filled with fabricated
  // numbers when there is no real measurement behind them.
  lightingIndex?: number;
  patrolCoverage?: string;
  crowdActivity?: string;
  traffic?: string;
  weather?: string;
  hazards: HazardAlert[];
  incidents: Array<{ id?: string; type: string; message: string; location?: Coordinate; timestamp?: string }>;
}

export interface IncidentReportInput {
  location: string;
  type: string;
  description: string;
  severity: string;
  photo?: File;
}

export interface LocationPreset {
  id: string;
  name: string;
  origin: string;
  destination: string;
  originCoord: Coordinate;
  destCoord: Coordinate;
  description: string;
}