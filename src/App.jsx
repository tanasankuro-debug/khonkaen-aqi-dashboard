import { useState, useCallback, lazy, Suspense } from 'react';
import { useAirQualityMap } from './hooks/useAirQualityMap';
import { useRealtimeWeather } from './hooks/useRealtimeWeather';
import BottomNav from './components/BottomNav';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import StationDrawer from './components/StationDrawer';
import HomeView from './components/HomeView';
import SimulationView from './components/SimulationView';
import RiskAreasView from './components/RiskAreasView';
import RecurringView from './components/RecurringView';
import ChatBotView from './components/ChatBotView';
import ForecastTimePicker, { toApiStr } from './components/ForecastTimePicker';
import MonthPicker from './components/MonthPicker';

const WindMapView = lazy(() => import('./components/WindMapView'));

export default function App() {
  // ── AQI data (for map tab's MapView) ──────────────────────────
  const { stations, error } = useAirQualityMap();

  // ── Weather/tambon data (for Sidebar + Home + Risk tabs) ──────
  const { tambons, forecast, status: weatherStatus, lastUpdated, refresh: refreshWeather } =
    useRealtimeWeather();

  // ── UI state ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('home');
  const [activeLayers, setActiveLayers] = useState(new Set());
  const [infoLayer, setInfoLayer] = useState('temperature');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [layerSettings, setLayerSettings] = useState({
    temperature:  { visible: true, opacity: 0.75 },
    pm25:         { visible: true, opacity: 0.78 },
    heat:         { visible: true, opacity: 0.78 },
    stream:       { visible: true, opacity: 0.85 },
    monthly_temp: { visible: true, opacity: 0.80 },
    hotspot:      { visible: true, opacity: 0.90 },
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [forecastDatetime, setForecastDatetime] = useState(() => {
    const now = new Date();
    const h = Math.floor(now.getUTCHours() / 3) * 3;
    return toApiStr(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h)));
  });
  const [flyToTarget, setFlyToTarget] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const updateLayerSetting = useCallback((id, key, value) => {
    setLayerSettings(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  }, []);

  const handleLayerToggle = useCallback((id) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setInfoLayer(id);
  }, []);

  const handleFlyTo = useCallback(({ lat, lng }) => setFlyToTarget({ lat, lng, ts: Date.now() }), []);
  const handleMapClick = useCallback(() => setSelectedDistrict(null), []);
  const handleDistrictSelect = useCallback((district) => {
    setSelectedDistrict(district);
    if (district) {
      setSearchQuery('');
      setFlyToTarget({ lat: district.lat, lng: district.lng, ts: Date.now() });
    }
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    if (tab === 'map') setSidebarOpen(true);
  }, []);

  const handleSelectStation = useCallback((s) => {
    setSelectedStation(s);
    setDrawerOpen(true);
  }, []);

  const onMap = activeTab === 'map';

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#f8faff]">

      {/* ── Map tab ── */}
      {onMap && (
        <>
          <div className="absolute top-0 right-0"
            style={{ left: 'var(--nav-x)', bottom: 'var(--nav-bottom)' }}>
            <MapView
              stations={stations}
              selectedStation={selectedStation}
              onSelectStation={handleSelectStation}
              activeLayers={activeLayers}
              tambons={tambons}
              layerSettings={layerSettings}
              selectedDistrict={selectedDistrict}
              onDistrictClick={handleDistrictSelect}
              flyToTarget={flyToTarget}
              selectedMonth={selectedMonth}
            />
          </div>
          <Sidebar
            activeLayers={activeLayers}
            infoLayer={infoLayer}
            onLayerToggle={handleLayerToggle}
            tambons={tambons}
            weatherStatus={weatherStatus}
            lastUpdated={lastUpdated}
            onRefreshWeather={refreshWeather}
            onFlyTo={handleFlyTo}
            selectedDistrict={selectedDistrict}
            onDistrictSelect={handleDistrictSelect}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(v => !v)}
            layerSettings={layerSettings}
            onLayerSettingChange={updateLayerSetting}
          />
          {activeLayers.has('temperature') && (
            <ForecastTimePicker datetime={forecastDatetime} onChange={setForecastDatetime} sidebarOpen={sidebarOpen} />
          )}
          {activeLayers.has('monthly_temp') && (
            <MonthPicker selectedMonth={selectedMonth} onChange={setSelectedMonth} sidebarOpen={sidebarOpen} />
          )}
          {error && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-medium shadow-lg"
              style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d',
                marginLeft: 'calc(var(--nav-x) / 2)' }}>
              ⚠️ {error}
            </div>
          )}
        </>
      )}

      {/* ── Home tab ── */}
      {activeTab === 'home' && (
        <HomeView
          tambons={tambons}
          forecast={forecast}
          weatherStatus={weatherStatus}
          lastUpdated={lastUpdated}
          onRefresh={refreshWeather}
        />
      )}

      {/* ── Wind map tab ── */}
      {activeTab === 'wind' && (
        <div className="absolute top-0 right-0" style={{ left: 'var(--nav-x)', bottom: 'var(--nav-bottom)' }}>
          <Suspense fallback={<div className="flex items-center justify-center h-full text-slate-400 text-sm">กำลังโหลดแผนที่...</div>}>
            <WindMapView />
          </Suspense>
        </div>
      )}

      {/* ── Simulation tab ── */}
      {activeTab === 'simulation' && <SimulationView />}

      {/* ── Risk Areas tab ── */}
      {activeTab === 'risk-areas' && <RiskAreasView tambons={tambons} />}

      {/* ── Recurring tab ── */}
      {activeTab === 'recurring' && <RecurringView />}

      {/* ── ChatBot tab ── */}
      {activeTab === 'chatbot' && <ChatBotView />}

      {/* ── Bottom / side nav ── */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* ── Station detail drawer ── */}
      <StationDrawer
        station={selectedStation}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
