import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Coordinate, HazardAlert, RouteOption } from "../types/api";

const DEFAULT_CENTER: [number, number] = [20.2961, 85.8245];

// Fixed profile → color mapping. Do not swap these meanings.
export const PROFILE_COLORS: Record<string, string> = {
  safest: "#2563eb",   // blue
  fastest: "#dc2626",  // red
  balanced: "#16a34a"  // green
};
const DEFAULT_ROUTE_COLOR = "#64748b"; // fallback for an unrecognized profile

export function colorForRoute(route: { id: string; preferenceType?: string }): string {
  const key = (route.preferenceType || route.id.replace(/^route-/, "").replace(/-rerouted$/, "")).toLowerCase();
  return PROFILE_COLORS[key] || DEFAULT_ROUTE_COLOR;
}

interface MapViewProps {
  routes?: RouteOption[];
  selectedId?: string | null;
  origin?: Coordinate | null;
  destination?: Coordinate | null;
  activeHazard?: HazardAlert | null;
  onSelectRoute?: (id: string) => void;
  className?: string;
}

export function MapView({
  routes = [],
  selectedId,
  origin,
  destination,
  activeHazard,
  onSelectRoute,
  className = ""
}: MapViewProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map instance once
  useEffect(() => {
    if (!container.current || mapRef.current) return;

    const map = L.map(container.current, {
      zoomControl: false,
      attributionControl: true
    }).setView(DEFAULT_CENTER, 13);

    // OpenStreetMap standard tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    layersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container.current);

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map layers when routes, pins, or hazards change
  useEffect(() => {
    const map = mapRef.current;
    const layers = layersRef.current;
    if (!map || !layers) return;

    layers.clearLayers();
    const boundsPoints: L.LatLng[] = [];

    // 1. Render alternative routes first (behind selected route)
    const sortedRoutes = [...routes].sort((a, b) => {
      if (a.id === selectedId) return 1;
      if (b.id === selectedId) return -1;
      return 0;
    });

    sortedRoutes.forEach(route => {
      if (!route.geometry || route.geometry.length < 2) return;

      const isSelected = route.id === selectedId;
      const polylineCoords: [number, number][] = route.geometry.map(p => [p.lat, p.lng]);
      const routeColor = colorForRoute(route);

      const polyline = L.polyline(polylineCoords, {
        color: routeColor,
        weight: isSelected ? 6 : 4,
        opacity: isSelected ? 1.0 : 0.45,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(layers);

      polyline.bindTooltip(
        `<b>${route.label}</b><br/>${Math.round((route.analytics.durationSeconds || 0) / 60)} min • Safety: ${route.analytics.safetyScore || "—"}`,
        { direction: "top", sticky: true }
      );

      if (onSelectRoute) {
        polyline.on("click", () => onSelectRoute(route.id));
      }

      const pts = polyline.getLatLngs() as L.LatLng[];
      boundsPoints.push(...pts);
    });

    // Helper for custom DivIcon markers
    const createMarker = (p: Coordinate, color: string, label: string, title?: string) => {
      const icon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `<div class="map-pin" style="--pin:${color}"><span>${label}</span></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
      const marker = L.marker([p.lat, p.lng], { icon, title }).addTo(layers);
      if (title) {
        marker.bindTooltip(`<b>${title}</b>`, { permanent: false, direction: "top" });
      }
      boundsPoints.push(L.latLng(p.lat, p.lng));
    };

    // 2. Render Origin (A) and Destination (B) markers
    if (origin) {
      createMarker(origin, "#10b981", "A", "Origin");
    } else if (routes.length > 0 && routes[0].geometry.length > 0) {
      createMarker(routes[0].geometry[0], "#10b981", "A", "Origin");
    }

    if (destination) {
      createMarker(destination, "#ef4444", "B", "Destination");
    } else if (routes.length > 0 && routes[0].geometry.length > 0) {
      const lastPoint = routes[0].geometry[routes[0].geometry.length - 1];
      createMarker(lastPoint, "#ef4444", "B", "Destination");
    }

    // 3. Render Active Hazard Pin if present (Demo / Live simulation)
    if (activeHazard && activeHazard.location) {
      const hazardIcon = L.divIcon({
        className: "custom-leaflet-hazard",
        html: `<div class="map-pin-hazard" title="${activeHazard.message}">⚠️</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });
      const hazardMarker = L.marker([activeHazard.location.lat, activeHazard.location.lng], {
        icon: hazardIcon,
        zIndexOffset: 1000
      }).addTo(layers);

      hazardMarker.bindPopup(
        `<div style="font-family:inherit;padding:4px;">
          <div style="font-weight:700;color:#ef4444;font-size:13px;">⚠️ ${activeHazard.type} (${activeHazard.severity})</div>
          <div style="font-size:11px;color:#334155;margin-top:4px;">${activeHazard.message}</div>
          <div style="font-size:10px;color:#64748b;margin-top:4px;">${activeHazard.locationName}</div>
        </div>`
      );
      boundsPoints.push(L.latLng(activeHazard.location.lat, activeHazard.location.lng));
    }

    // 4. Fit map bounds to encompass all active routes and markers
    if (boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints);
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 15,
        animate: true
      });
    }
  }, [routes, selectedId, origin, destination, activeHazard, onSelectRoute]);

  return <div ref={container} className={`leaflet-container ${className}`} />;
}
