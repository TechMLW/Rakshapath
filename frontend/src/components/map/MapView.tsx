import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GeoJSONFeatureCollection, RouteProfile, HazardReport, GPSPoint } from '../../types';

interface MapViewProps {
  origin: GPSPoint | null;
  destination: GPSPoint | null;
  selectedProfile: RouteProfile;
  geojsonData: GeoJSONFeatureCollection | null;
  hazards: HazardReport[];
  liveLocation?: GPSPoint | null;
  onMapClick?: (lat: number, lng: number) => void;
  onSelectProfile?: (profile: RouteProfile) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  origin,
  destination,
  selectedProfile,
  geojsonData,
  hazards,
  liveLocation,
  onMapClick,
  onSelectProfile,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center: Bhubaneswar
    const defaultCenter: [number, number] = [20.2961, 85.8245];
    const tileUrl = (import.meta as any).env?.VITE_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
    const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
    });

    // Standard OpenStreetMap Tile Layer
    const tileLayer = L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Layer group for pins
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Map click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update GeoJSON Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
      geojsonLayerRef.current = null;
    }

    if (geojsonData && geojsonData.features && geojsonData.features.length > 0) {
      const layer = L.geoJSON(geojsonData as any, {
        style: (feature) => {
          const profile = feature?.properties?.profile as RouteProfile;
          const isSelected = profile === selectedProfile;

          if (isSelected) {
            return {
              color: '#4edea3', // Emerald green for selected
              weight: 6,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round',
            };
          } else {
            return {
              color: '#7e7d7f', // Muted gray for alternative
              weight: 4,
              opacity: 0.65,
              dashArray: '6, 8',
              lineCap: 'round',
              lineJoin: 'round',
            };
          }
        },
        onEachFeature: (feature, featureLayer) => {
          const profile = feature?.properties?.profile as RouteProfile;
          const analytics = feature?.properties?.analytics;

          if (analytics) {
            featureLayer.bindTooltip(
              `<div style="padding: 4px 8px; font-weight: 600; text-transform: capitalize;">
                ${profile} Route: ${analytics.estimated_time_minutes?.toFixed(0)} min (${analytics.actual_distance_km?.toFixed(1)} km)
                <br/><span style="color: #4edea3;">Safety: ${analytics.safety_score?.toFixed(0)}/100</span>
              </div>`,
              { sticky: true, className: 'glass-panel' }
            );
          }

          featureLayer.on('click', () => {
            if (onSelectProfile && profile) {
              onSelectProfile(profile);
            }
          });
        },
      }).addTo(map);

      geojsonLayerRef.current = layer;

      // Fit map bounds to show complete route
      try {
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
        }
      } catch (e) {
        // bounds error ignore
      }
    }
  }, [geojsonData, selectedProfile]);

  // Update Markers (Origin, Destination, Hazards, Live Location)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // Origin Marker
    if (origin) {
      const originIcon = L.divIcon({
        className: 'custom-origin-icon',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="background: rgba(18, 20, 21, 0.85); color: #e2e2e3; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid rgba(255, 255, 255, 0.15); margin-bottom: 4px; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
              ${origin.name || 'Start'}
            </div>
            <div style="width: 16px; height: 16px; background: #adc6ff; border: 3px solid #121415; border-radius: 50%; box-shadow: 0 0 12px #0566d9;"></div>
          </div>
        `,
        iconSize: [80, 42],
        iconAnchor: [40, 42],
      });

      L.marker([origin.latitude, origin.longitude], { icon: originIcon })
        .bindPopup(`<b>Origin</b><br/>${origin.name || `${origin.latitude}, ${origin.longitude}`}`)
        .addTo(markersLayer);
    }

    // Destination Marker
    if (destination) {
      const destIcon = L.divIcon({
        className: 'custom-dest-icon',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="background: rgba(18, 20, 21, 0.85); color: #4edea3; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; border: 1px solid rgba(78, 222, 163, 0.3); margin-bottom: 4px; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
              ${destination.name || 'Destination'}
            </div>
            <div class="safe-pulse" style="width: 18px; height: 18px; background: #4edea3; border: 3px solid #121415; border-radius: 50%; box-shadow: 0 0 16px rgba(78, 222, 163, 0.8);"></div>
          </div>
        `,
        iconSize: [90, 44],
        iconAnchor: [45, 44],
      });

      L.marker([destination.latitude, destination.longitude], { icon: destIcon })
        .bindPopup(`<b>Destination</b><br/>${destination.name || `${destination.latitude}, ${destination.longitude}`}`)
        .addTo(markersLayer);
    }

    // Live Location Indicator
    if (liveLocation) {
      const liveIcon = L.divIcon({
        className: 'live-location-icon',
        html: `
          <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(173, 198, 255, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #0566d9; border: 2px solid #ffffff; box-shadow: 0 0 10px #adc6ff;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([liveLocation.latitude, liveLocation.longitude], { icon: liveIcon })
        .bindPopup(`<b>Current Location</b>`)
        .addTo(markersLayer);
    }

    // Hazard / Incident Markers
    if (hazards && hazards.length > 0) {
      hazards.forEach((hazard) => {
        const isCritical = hazard.severity === 'high' || hazard.severity === 'critical';
        const color = isCritical ? '#ffb4ab' : '#fbbc04';
        const bgColor = isCritical ? 'rgba(147, 0, 10, 0.8)' : 'rgba(251, 188, 4, 0.8)';
        const iconName = hazard.report_type === 'flood' ? 'water' : hazard.report_type === 'accident' ? 'car_crash' : 'warning';

        const hazardIcon = L.divIcon({
          className: 'hazard-icon',
          html: `
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${bgColor}; border: 1.5px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px ${color}80;">
              <span class="material-symbols-outlined" style="font-size: 18px; color: #ffffff;">${iconName}</span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        L.marker([hazard.latitude, hazard.longitude], { icon: hazardIcon })
          .bindPopup(`
            <div style="padding: 2px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="color: ${color}; font-weight: 700; text-transform: uppercase; font-size: 11px;">
                  ⚠️ ${hazard.report_type} (${hazard.severity})
                </span>
              </div>
              <p style="margin: 0; font-size: 12px; color: #c8c6ca;">${hazard.description}</p>
              ${hazard.distance_meters ? `<span style="font-size: 10px; color: #7e7d7f; margin-top: 4px; display: block;">${hazard.distance_meters.toFixed(0)}m from corridor</span>` : ''}
            </div>
          `)
          .addTo(markersLayer);
      });
    }
  }, [origin, destination, liveLocation, hazards]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      {/* Subtle bottom vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#121415]/90 via-transparent to-transparent pointer-events-none z-10" />
    </div>
  );
};
