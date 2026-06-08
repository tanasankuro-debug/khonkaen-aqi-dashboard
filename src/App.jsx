import { useState, useCallback } from 'react';
import { useAirQualityMap } from './hooks/useAirQualityMap';
import { useRealtimeWeather } from './hooks/useRealtimeWeather';
import BottomNav from './components/BottomNav';
import MapView from './components/MapView';
import StationDrawer from './components/StationDrawer';
import HomeView from './components/HomeView';
import SimulationView from './components/SimulationView';
import RiskAreasView from './components/RiskAreasView';
import RecurringView from './components/RecurringView';
import ChatBotView from './components/ChatBotView';

export default function App() {
  const { stations, error } = useAirQualityMap();
  const { tambons, forecast, status: weatherStatus, lastUpdated, refresh: refreshWeather } =
    useRealtimeWeather();

  const [activeTab,       setActiveTab]       = useState('home');
  const [selectedStation, setSelectedStation] = useState(null);
  const [drawerOpen,      setDrawerOpen]      = useState(false);

  const handleTabChange      = useCallback((tab) => setActiveTab(tab), []);
  const handleSelectStation  = useCallback((s) => { setSelectedStation(s); setDrawerOpen(true); }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#f8faff]">

      {/* ── Map ── */}
      {activeTab === 'map' && (
        <div className="absolute top-0 right-0"
          style={{ left: 'var(--nav-x)', bottom: 'var(--nav-bottom)' }}>
          <MapView
            stations={stations}
            selectedStation={selectedStation}
            onSelectStation={handleSelectStation}
          />
        </div>
      )}

      {/* ── Home ── */}
      {activeTab === 'home' && (
        <HomeView
          tambons={tambons}
          forecast={forecast}
          weatherStatus={weatherStatus}
          lastUpdated={lastUpdated}
          onRefresh={refreshWeather}
        />
      )}

      {/* ── Other tabs ── */}
      {activeTab === 'simulation' && <SimulationView />}
      {activeTab === 'risk-areas' && <RiskAreasView tambons={tambons} />}
      {activeTab === 'recurring'  && <RecurringView />}
      {activeTab === 'chatbot'    && <ChatBotView />}

      {/* ── Nav ── */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* ── Station drawer ── */}
      <StationDrawer
        station={selectedStation}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* ── Error banner ── */}
      {error && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-medium shadow-lg"
          style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d',
            marginLeft: 'calc(var(--nav-x) / 2)' }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
