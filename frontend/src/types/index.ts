export interface GPSPoint {
  latitude: number;
  longitude: number;
  name?: string;
}

export type RouteProfile = 'fastest' | 'safest' | 'balanced';

export interface RouteAnalytics {
  actual_distance_m: number;
  actual_distance_km: number;
  estimated_time_minutes: number;
  safety_score: number;
  node_count: number;
  profile?: RouteProfile;
}

export interface RouteOption {
  route: number[];
  cost: number;
  analytics: RouteAnalytics;
}

export interface GeoJSONGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // [longitude, latitude]
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    profile: RouteProfile;
    recommended: boolean;
    analytics: RouteAnalytics;
    stroke?: string;
    'stroke-width'?: number;
    'stroke-opacity'?: number;
    'stroke-dasharray'?: string;
    [key: string]: any;
  };
  geometry: GeoJSONGeometry;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface HazardReport {
  id: number;
  report_type: 'hazard' | 'accident' | 'flood' | 'blockage' | 'lighting' | 'crime' | 'harassment' | 'other' | string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  description: string;
  latitude: number;
  longitude: number;
  distance_meters?: number;
  status?: string;
  created_at?: string;
}

export interface OptimizeRouteRequest {
  start_latitude: number;
  start_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  profile?: RouteProfile;
  region?: string;
  dynamic_weights?: Record<string, any> | null;
}

export interface OptimizeRouteResponse {
  message: string;
  recommended: RouteProfile;
  start: GPSPoint;
  destination: GPSPoint;
  distance_km: number;
  estimated_time_minutes: number;
  safety_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  routes: {
    fastest?: RouteOption;
    safest?: RouteOption;
    balanced?: RouteOption;
    [key: string]: RouteOption | undefined;
  };
  geojson: GeoJSONFeatureCollection;
  nearby_hazards: HazardReport[];
}

export interface RerouteRequest {
  current_latitude: number;
  current_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  current_route?: number[] | null;
  current_node_index?: number;
  profile?: RouteProfile;
  region?: string;
  dynamic_weights?: Record<string, any> | null;
  cost_increase_threshold?: number;
}

export interface RerouteResponse {
  message: string;
  rerouted: boolean;
  route: number[];
  coordinates: [number, number][]; // [latitude, longitude]
  distance_km: number;
  estimated_time_minutes: number;
  safety_score: number;
  hazards_detected: any[];
  analytics: RouteAnalytics;
}

export interface ReportCreateRequest {
  report_type: string;
  description: string;
  severity: string;
  latitude: number;
  longitude: number;
}

export interface ReportCreateResponse {
  message: string;
  report_id: number;
}

export interface AdminStats {
  total_reports: number;
  pending_reports: number;
  verified_reports: number;
  resolved_reports: number;
}

export interface SafetyPreferences {
  womensSafetyMode: boolean;
  nightTravelProtocols: boolean;
  avoidFloodProneAreas: boolean;
  wellLitRoutesOnly: boolean;
}
