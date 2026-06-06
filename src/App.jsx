import { useState, useCallback, useEffect } from 'react';
import { Alert, ConfigProvider, theme as antdTheme } from 'antd';
import { useAirQualityMap } from './hooks/useAirQualityMap';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import StationDrawer from './components/StationDrawer';

export default function App() {
  const { stations, loading, error, lastUpdated, useMock, refresh, toggleMock } =
    useAirQualityMap();

  const [selectedStation,  setSelectedStation]  = useState(null);
  const [drawerOpen,       setDrawerOpen]       = useState(false);
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [isDarkMode,       setIsDarkMode]       = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleSelectStation = useCallback((s) => {
    setSelectedStation(s);
    setDrawerOpen(true);
    setSidebarOpen(false);
  }, []);

  const handleCloseDrawer  = useCallback(() => setDrawerOpen(false), []);
  const handleToggleTheme  = useCallback(() => setIsDarkMode(d => !d), []);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorBgElevated: isDarkMode ? '#1e293b' : '#ffffff',
          colorText:       isDarkMode ? '#f1f5f9' : '#0f172a',
          borderRadius: 8,
          fontFamily: 'Inter, system-ui, sans-serif',
        },
      }}
    >
      <div
        className="flex flex-col h-screen w-screen overflow-hidden"
        style={{ background: 'var(--t-bg)', transition: 'background 0.3s ease' }}
      >
        {/* ── Top Bar ─────────────────────────────────── */}
        <TopBar
          stations={stations}
          loading={loading}
          lastUpdated={lastUpdated}
          useMock={useMock}
          onRefresh={refresh}
          onToggleMock={toggleMock}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
        />

        {/* ── Error Banner ─────────────────────────────── */}
        {error && (
          <div className="px-3 py-1.5 z-50 flex-shrink-0">
            <Alert
              message={error}
              type="warning"
              showIcon
              closable
              style={{ fontSize: 12, padding: '4px 12px' }}
            />
          </div>
        )}

        {/* ── Main Content ─────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* Desktop sidebar */}
          <div
            className="hidden lg:flex flex-shrink-0 h-full transition-all duration-300"
            style={{ width: sidebarCollapsed ? 40 : 'clamp(256px, 20rem, 320px)' }}
          >
            <Sidebar
              stations={stations}
              selectedId={selectedStation?.stationID}
              onSelect={handleSelectStation}
              isDarkMode={isDarkMode}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(c => !c)}
            />
          </div>

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <>
              <div
                className="lg:hidden absolute inset-0 z-[900] backdrop-blur-sm"
                style={{ background: 'rgba(0,0,0,0.45)' }}
                onClick={() => setSidebarOpen(false)}
              />
              <div className="lg:hidden absolute left-0 top-0 bottom-0 w-72 z-[901] flex flex-col fade-in-up">
                <Sidebar
                  stations={stations}
                  selectedId={selectedStation?.stationID}
                  onSelect={handleSelectStation}
                  isDarkMode={isDarkMode}
                />
              </div>
            </>
          )}

          {/* Map — fills remaining space, includes AQI markers + wind layer */}
          <div className="flex-1 relative overflow-hidden">
            <MapView
              stations={stations}
              selectedStation={selectedStation}
              onSelectStation={handleSelectStation}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>

        {/* ── Station Drawer ───────────────────────────── */}
        <StationDrawer
          station={selectedStation}
          open={drawerOpen}
          onClose={handleCloseDrawer}
          isDarkMode={isDarkMode}
        />
      </div>
    </ConfigProvider>
  );
}
