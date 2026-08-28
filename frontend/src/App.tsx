import React, { useState, useEffect } from 'react';
import {
  GPSPoint,
  RouteProfile,
  OptimizeRouteResponse,
  HazardReport,
  GeoJSONFeatureCollection,
} from './types';
import { optimizeRoute, reroute, getReports, checkBackendHealth } from './services/api';
import { MapView } from './components/map/MapView';
import { MapControls } from './components/map/MapControls';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { SOSModal } from './components/common/SOSModal';
import { HomePage } from './pages/HomePage';
import { RoutePlanningPanel, PRESET_LOCATIONS } from './components/routing/RoutePlanningPanel';
import { LiveNavigationHUD } from './components/navigation/LiveNavigationHUD';
import { RerouteToast } from './components/navigation/RerouteToast';
import { SafetyPage } from './pages/SafetyPage';
import { ProfilePage } from './pages/ProfilePage';
import { ReportIncidentModal } from './components/reports/ReportIncidentModal';
import { ReportSuccessModal } from './components/reports/ReportSuccessModal';

export const App: React.FC = () => {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<'explore' | 'routes' | 'safety' | 'profile' | 'navigate'>('explore');
  const [isNavigating, setIsNavigating] = useState(false);

  // Geographic Points (Default: Bhubaneswar Master Canteen to Infocity)
  const [origin, setOrigin] = useState<GPSPoint | null>(PRESET_LOCATIONS[0]);
  const [destination, setDestination] = useState<GPSPoint | null>(PRESET_LOCATIONS[1]);
  const [liveLocation, setLiveLocation] = useState<GPSPoint | null>(PRESET_LOCATIONS[0]);

  // Routing State
  const [selectedRegion, setSelectedRegion] = useState<string>('bhubaneswar');
  const [selectedProfile, setSelectedProfile] = useState<RouteProfile>('safest');
  const [routeResponse, setRouteResponse] = useState<OptimizeRouteResponse | null>(null);
  const [geojsonData, setGeojsonData] = useState<GeoJSONFeatureCollection | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Hazards & Reports
  const [hazards, setHazards] = useState<HazardReport[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<number | null>(null);

  // Rerouting State
  const [showRerouteToast, setShowRerouteToast] = useState(false);
  const [rerouteHazardMsg, setRerouteHazardMsg] = useState('');
  const [pendingRerouteData, setPendingRerouteData] = useState<any>(null);
  const [reroutingLoading, setReroutingLoading] = useState(false);

  // SOS Modal
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Initial Load: Check backend & fetch active hazards
  useEffect(() => {
    checkBackendHealth()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));

    getReports()
      .then((data) => {
        if (Array.isArray(data)) setHazards(data);
      })
      .catch(() => {
        // Fallback default demo hazards in corridor
        setHazards([
          {
            id: 101,
            report_type: 'flood',
            severity: 'high',
            description: 'Severe waterlogging at Jaydev Vihar underpass (1.5 ft water)',
            latitude: 20.3012,
            longitude: 85.8211,
          },
          {
            id: 102,
            report_type: 'lighting',
            severity: 'medium',
            description: 'Street light outage along Rasulgarh bypass lane',
            latitude: 20.2905,
            longitude: 85.8654,
          },
        ]);
      });
  }, []);

  // Compute Real Routes from Backend
  const handleCalculateRoute = async () => {
    if (!origin || !destination) return;

    setLoadingRoute(true);
    setRouteError(null);

    try {
      const res = await optimizeRoute({
        start_latitude: origin.latitude,
        start_longitude: origin.longitude,
        destination_latitude: destination.latitude,
        destination_longitude: destination.longitude,
        profile: selectedProfile,
        region: selectedRegion,
      });

      setRouteResponse(res);
      if (res.geojson) {
        setGeojsonData(res.geojson);
      }
      if (res.nearby_hazards && res.nearby_hazards.length > 0) {
        setHazards((prev) => [...prev, ...res.nearby_hazards]);
      }
    } catch (err: any) {
      setRouteError(err.message || 'Failed to compute routes from backend server.');
    } finally {
      setLoadingRoute(false);
    }
  };

  // Auto-calculate on initial load if origin and destination are set
  useEffect(() => {
    if (origin && destination && !routeResponse) {
      handleCalculateRoute();
    }
  }, []);

  // Handle map click to set pins
  const handleMapClick = (lat: number, lng: number) => {
    if (!origin) {
      setOrigin({ latitude: lat, longitude: lng, name: `Pin (${lat.toFixed(3)}, ${lng.toFixed(3)})` });
    } else if (!destination) {
      setDestination({ latitude: lat, longitude: lng, name: `Pin (${lat.toFixed(3)}, ${lng.toFixed(3)})` });
    }
  };

  // Start Live Navigation
  const handleStartNavigation = () => {
    setIsNavigating(true);
    setActiveTab('navigate');
  };

  // Exit Navigation
  const handleExitNavigation = () => {
    setIsNavigating(false);
    setShowRerouteToast(false);
    setActiveTab('routes');
  };

  // Simulate In-Transit Hazard & Call Real Reroute Backend
  const handleSimulateHazard = async () => {
    if (!origin || !destination) return;
    setReroutingLoading(true);

    try {
      // Simulate waterlogging penalty on current active route
      const dynamicPenalty = {
        hazard_type: 'flood',
        penalty_factor: 2.5,
      };

      const rerouteRes = await reroute({
        current_latitude: origin.latitude, // Current user position
        current_longitude: origin.longitude,
        destination_latitude: destination.latitude,
        destination_longitude: destination.longitude,
        profile: selectedProfile,
        region: selectedRegion,
        dynamic_weights: dynamicPenalty,
        cost_increase_threshold: 1.05,
      });

      setPendingRerouteData(rerouteRes);
      setRerouteHazardMsg('Sudden flood/hazard warning detected ahead. Cost increased. Safer alternative computed.');
      setShowRerouteToast(true);
    } catch (e: any) {
      // Show simulated alert if backend offline
      setRerouteHazardMsg('AI detected obstacle ahead. Safer alternative available.');
      setShowRerouteToast(true);
    } finally {
      setReroutingLoading(false);
    }
  };

  // Accept Reroute and Update Map Line
  const handleAcceptReroute = () => {
    if (pendingRerouteData && pendingRerouteData.coordinates) {
      // Convert [[lat, lon], ...] coordinates into GeoJSON LineString
      const newFeature: GeoJSONFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: pendingRerouteData.coordinates.map(([lat, lon]: [number, number]) => [lon, lat]),
            },
            properties: {
              profile: selectedProfile,
              recommended: true,
              analytics: pendingRerouteData.analytics || {
                actual_distance_km: pendingRerouteData.distance_km,
                estimated_time_minutes: pendingRerouteData.estimated_time_minutes,
                safety_score: pendingRerouteData.safety_score,
                node_count: pendingRerouteData.route?.length || 0,
                actual_distance_m: (pendingRerouteData.distance_km || 0) * 1000,
              },
            },
          },
        ],
      };

      setGeojsonData(newFeature);
      setShowRerouteToast(false);
      setPendingRerouteData(null);
    } else {
      setShowRerouteToast(false);
    }
  };

  // Report Submission Handler
  const handleReportSubmitted = (reportId: number) => {
    setIsReportModalOpen(false);
    setSubmittedReportId(reportId);
    setIsSuccessModalOpen(true);
    // Refresh hazard list
    getReports().then((data) => {
      if (Array.isArray(data)) setHazards(data);
    }).catch(() => {});
  };

  return (
    <div className="relative w-screen h-screen bg-[#121415] text-[#e2e2e3] overflow-hidden">
      {/* Full-Screen Interactive Leaflet Map */}
      <MapView
        origin={origin}
        destination={destination}
        selectedProfile={selectedProfile}
        geojsonData={geojsonData}
        hazards={hazards}
        liveLocation={isNavigating ? liveLocation : null}
        onMapClick={handleMapClick}
        onSelectProfile={(p) => setSelectedProfile(p)}
      />

      {/* Floating Map Controls */}
      <MapControls
        onSOSClick={() => setIsSOSOpen(true)}
      />

      {/* Desktop Glass Header (Hidden during live navigation) */}
      {!isNavigating && (
        <Header
          activeTab={activeTab}
          onSelectTab={(tab: any) => setActiveTab(tab)}
          onSOSClick={() => setIsSOSOpen(true)}
          onProfileClick={() => setActiveTab('profile')}
        />
      )}

      {/* Active View Container */}
      <main className="relative z-20 w-full h-full pointer-events-none">
        {/* Explore / Home Page View */}
        {activeTab === 'explore' && !isNavigating && (
          <HomePage
            origin={origin}
            destination={destination}
            onSetOrigin={(p) => setOrigin(p)}
            onSetDestination={(p) => setDestination(p)}
            onNavigateToRoutes={() => setActiveTab('routes')}
            onStartNavigation={handleStartNavigation}
            routes={routeResponse?.routes || null}
          />
        )}

        {/* Routes Planning Panel View */}
        {activeTab === 'routes' && !isNavigating && (
          <div className="absolute top-20 md:top-24 left-4 md:left-8 z-30 pointer-events-auto">
            <RoutePlanningPanel
              origin={origin}
              destination={destination}
              selectedRegion={selectedRegion}
              onSelectRegion={(reg) => {
                setSelectedRegion(reg);
                setRouteResponse(null);
                setGeojsonData(null);
              }}
              onSetOrigin={(p) => setOrigin(p)}
              onSetDestination={(p) => setDestination(p)}
              routes={routeResponse?.routes || null}
              selectedProfile={selectedProfile}
              onSelectProfile={(p) => setSelectedProfile(p)}
              onCalculateRoute={handleCalculateRoute}
              onStartNavigation={handleStartNavigation}
              loading={loadingRoute}
              error={routeError}
            />
          </div>
        )}

        {/* Safety Around You View */}
        {activeTab === 'safety' && !isNavigating && (
          <SafetyPage
            hazards={hazards}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        )}

        {/* Profile & Settings View */}
        {activeTab === 'profile' && !isNavigating && (
          <div className="pointer-events-auto">
            <ProfilePage
              onBack={() => setActiveTab('explore')}
              onSOSClick={() => setIsSOSOpen(true)}
            />
          </div>
        )}

        {/* Live Turn-by-Turn Navigation HUD */}
        {isNavigating && (
          <LiveNavigationHUD
            analytics={routeResponse?.routes[selectedProfile]?.analytics || null}
            onExitNavigation={handleExitNavigation}
            onTriggerSimulatedHazard={handleSimulateHazard}
          />
        )}

        {/* Dynamic In-Transit Rerouting Toast */}
        <RerouteToast
          isVisible={showRerouteToast}
          hazardDescription={rerouteHazardMsg}
          onAcceptReroute={handleAcceptReroute}
          onDismiss={() => setShowRerouteToast(false)}
          loading={reroutingLoading}
        />
      </main>

      {/* Mobile Bottom Navigation (Hidden in Navigation HUD) */}
      {!isNavigating && (
        <BottomNav
          activeTab={activeTab}
          onSelectTab={(tab: any) => setActiveTab(tab)}
          onSOSClick={() => setIsSOSOpen(true)}
        />
      )}

      {/* Report Incident Modal */}
      <ReportIncidentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={handleReportSubmitted}
        currentLocation={origin}
      />

      {/* Report Success Modal with AI Verification Progress */}
      <ReportSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        reportId={submittedReportId}
      />

      {/* Emergency SOS Modal */}
      <SOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        currentLocation={origin}
      />
    </div>
  );
};
