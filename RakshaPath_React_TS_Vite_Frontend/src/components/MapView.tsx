import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Coordinate, HazardItem, RouteOption } from "../types/api";

const DEFAULT_CENTER: [number, number] = [20.2961, 85.8245];
export const DEFAULT_TILE_URL = import.meta.env.VITE_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const DEFAULT_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function MapView({
  routes,
  selectedId,
  origin,
  destination,
  hazards = [],
  onMapClick,
  className = ""
}: {
  routes: RouteOption[];
  selectedId?: string | null;
  origin?: Coordinate | null;
  destination?: Coordinate | null;
  hazards?: HazardItem[];
  onMapClick?: (coords: Coordinate) => void;
  className?: string;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!container.current || mapRef.current) return;
    
    const map = L.map(container.current, { 
      zoomControl: true,
      attributionControl: true
    }).setView(DEFAULT_CENTER, 13);

    // Standard OpenStreetMap Tile Layer
    L.tileLayer(DEFAULT_TILE_URL, {
      attribution: DEFAULT_TILE_ATTRIBUTION,
      maxZoom: 19
    }).addTo(map);

    layersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Handle map clicks
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    // Resize observer ensures map is never stuck with blank tiles
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(container.current);

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Layers & Features
  useEffect(() => {
    const map = mapRef.current;
    const layers = layersRef.current;
    if (!map || !layers) return;
    
    layers.clearLayers();
    const boundsPoints: L.LatLngExpression[] = [];

    // Render Routes
    routes.forEach(route => {
      if (!route.geometry || route.geometry.length < 2) return;
      const isSelected = route.id === selectedId || (routes.length === 1 && route.id === "rerouted");
      
      const polyCoords = route.geometry.map(p => [p.lat, p.lng] as [number, number]);
      
      // Halo for selected route
      if (isSelected) {
        L.polyline(polyCoords, {
          color: route.id === "safest" ? "#4edea3" : route.id === "fastest" ? "#ffb4ab" : "#aec6ff",
          weight: 9,
          opacity: 0.35
        }).addTo(layers);
      }

      const polyline = L.polyline(polyCoords, {
        color: isSelected 
          ? (route.id === "safest" ? "#4edea3" : route.id === "fastest" ? "#ffb4ab" : "#0566d9")
          : "#6f7275",
        weight: isSelected ? 5 : 3,
        opacity: isSelected ? 1.0 : 0.45,
        dashArray: isSelected ? undefined : "6 8"
      }).addTo(layers);

      boundsPoints.push(...polyline.getLatLngs().map(x => x as L.LatLng));
    });

    // Render Hazards
    hazards.forEach(h => {
      const hLat = h.lat || h.latitude;
      const hLng = h.lng || h.longitude;
      if (hLat && hLng) {
        const isCritical = h.severity === "critical" || h.severity === "high";
        const hazardMarker = L.circleMarker([hLat, hLng], {
          radius: 8,
          color: isCritical ? "#ffb4ab" : "#fbbc04",
          fillColor: isCritical ? "#93000a" : "#fbbc04",
          fillOpacity: 0.85,
          weight: 2
        }).addTo(layers);

        hazardMarker.bindPopup(`
          <div style="font-family: Inter, sans-serif; font-size: 12px; color: #121415;">
            <strong style="text-transform: capitalize; color: ${isCritical ? '#93000a' : '#b27b00'}">${h.type || h.report_type || 'Hazard'}</strong>
            <p style="margin: 4px 0 0; color: #444;">${h.description || h.message || 'Active road hazard reported.'}</p>
          </div>
        `);
      }
    });

    // Render Origin Pin
    if (origin) {
      const startMarker = L.circleMarker([origin.lat, origin.lng], {
        radius: 8,
        color: "#ffffff",
        fillColor: "#4edea3",
        fillOpacity: 1,
        weight: 3
      }).addTo(layers);
      startMarker.bindPopup('<strong style="color: #121415;">Origin Point</strong>');
      boundsPoints.push(startMarker.getLatLng());
    }

    // Render Destination Pin
    if (destination) {
      const destMarker = L.circleMarker([destination.lat, destination.lng], {
        radius: 8,
        color: "#ffffff",
        fillColor: "#ffb4ab",
        fillOpacity: 1,
        weight: 3
      }).addTo(layers);
      destMarker.bindPopup('<strong style="color: #121415;">Destination Point</strong>');
      boundsPoints.push(destMarker.getLatLng());
    }

    if (boundsPoints.length > 0) {
      map.fitBounds(L.latLngBounds(boundsPoints), { padding: [50, 50], maxZoom: 16 });
    }
  }, [routes, selectedId, origin, destination, hazards]);

  return <div ref={container} className={`leaflet-map w-full ${className}`} />;
}