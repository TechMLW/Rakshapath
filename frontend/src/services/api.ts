import {
  OptimizeRouteRequest,
  OptimizeRouteResponse,
  RerouteRequest,
  RerouteResponse,
  ReportCreateRequest,
  ReportCreateResponse,
  HazardReport,
  AdminStats,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // fallback to statusText
    }
    throw new Error(`API Error (${res.status}): ${errorDetail}`);
  }
  return res.json();
}

export async function checkBackendHealth(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<{ message: string }>(res);
}

export async function optimizeRoute(req: OptimizeRouteRequest): Promise<OptimizeRouteResponse> {
  const res = await fetch(`${API_BASE_URL}/routes/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start_latitude: req.start_latitude,
      start_longitude: req.start_longitude,
      destination_latitude: req.destination_latitude,
      destination_longitude: req.destination_longitude,
      profile: req.profile || 'balanced',
      region: req.region || 'bhubaneswar',
      dynamic_weights: req.dynamic_weights || null,
    }),
  });
  return handleResponse<OptimizeRouteResponse>(res);
}

export async function reroute(req: RerouteRequest): Promise<RerouteResponse> {
  const res = await fetch(`${API_BASE_URL}/routes/reroute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current_latitude: req.current_latitude,
      current_longitude: req.current_longitude,
      destination_latitude: req.destination_latitude,
      destination_longitude: req.destination_longitude,
      current_route: req.current_route || null,
      current_node_index: req.current_node_index || 0,
      profile: req.profile || 'balanced',
      region: req.region || 'bhubaneswar',
      dynamic_weights: req.dynamic_weights || null,
      cost_increase_threshold: req.cost_increase_threshold || 1.15,
    }),
  });
  return handleResponse<RerouteResponse>(res);
}

export async function createReport(report: ReportCreateRequest): Promise<ReportCreateResponse> {
  const res = await fetch(`${API_BASE_URL}/reports/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      report_type: report.report_type,
      description: report.description,
      severity: report.severity,
      latitude: report.latitude,
      longitude: report.longitude,
    }),
  });
  return handleResponse<ReportCreateResponse>(res);
}

export async function getReports(): Promise<HazardReport[]> {
  const res = await fetch(`${API_BASE_URL}/reports/`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<HazardReport[]>(res);
}

export async function getNearbyReports(
  latitude: number,
  longitude: number,
  radius_km: number = 5
): Promise<{ count: number; radius_km: number; reports: HazardReport[] }> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    radius_km: radius_km.toString(),
  });
  const res = await fetch(`${API_BASE_URL}/reports/nearby?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<{ count: number; radius_km: number; reports: HazardReport[] }>(res);
}

export async function getAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API_BASE_URL}/admin/statistics`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<AdminStats>(res);
}
