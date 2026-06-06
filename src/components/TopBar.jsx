import { FiRefreshCw, FiWifi, FiWifiOff, FiMenu, FiX } from 'react-icons/fi';
import { FaSun, FaMoon } from 'react-icons/fa';
import { WiDaySunny } from 'react-icons/wi';
import { Tooltip } from 'antd';
import { AQI_LEVELS, getAQISummary } from '../utils/aqiUtils';

export default function TopBar({
  stations, loading, lastUpdated, useMock,
  onRefresh, onToggleMock, sidebarOpen, onToggleSidebar,
  isDarkMode, onToggleTheme,
}) {
  const summary = getAQISummary(stations);
  const ts = lastUpdated
    ? lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    : '—';

  // Theme-aware inline style values
  const text2   = isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.55)';
  const text3   = isDarkMode ? 'rgba(255,255,255,0.30)' : 'rgba(15,23,42,0.30)';
  const iconBtn = isDarkMode
    ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)';
  const iconBtnBdr = isDarkMode
    ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.10)';

  return (
    <div
      className="glass flex items-center gap-3 px-4 py-2.5 z-[1001] relative flex-shrink-0"
      style={{ borderBottom: `1px solid var(--t-glass-bdr)`, transition: 'background 0.3s ease' }}
    >
      {/* Sidebar toggle (mobile) */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-1.5 rounded-lg transition-colors"
        style={{ color: text2, background: iconBtn, border: `1px solid ${iconBtnBdr}` }}
      >
        {sidebarOpen ? <FiX size={17} /> : <FiMenu size={17} />}
      </button>

      {/* Brand */}
      <div className="flex items-center gap-2.5 mr-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-md">
          <WiDaySunny size={20} className="text-white" />
        </div>
        <div className="hidden sm:block">
          <p className="font-bold text-sm leading-none" style={{ color: 'var(--t-text1)' }}>
            แผนที่คุณภาพอากาศ
          </p>
          <p className="text-[10px] leading-none mt-0.5" style={{ color: text3 }}>
            ติดตามมลพิษทางอากาศ · Air4Thai
          </p>
        </div>
      </div>

      {/* AQI level summary dots */}
      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
        {AQI_LEVELS.map((lvl) => {
          const count = summary[lvl.id] ?? 0;
          const labelColor = isDarkMode ? lvl.textColor : lvl.darkTextColor;
          return (
            <Tooltip
              key={lvl.id}
              title={`${lvl.labelTH}: ${count} สถานี`}
              color={isDarkMode ? '#1e293b' : '#ffffff'}
              overlayInnerStyle={{ color: isDarkMode ? '#f1f5f9' : '#0f172a', fontSize: 12 }}
            >
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0 cursor-default select-none"
                style={{ background: lvl.bgColor, border: `1px solid ${lvl.borderColor}` }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: lvl.color }} />
                <span className="text-[11px] font-semibold" style={{ color: labelColor }}>
                  {count}
                </span>
              </div>
            </Tooltip>
          );
        })}
        <span className="text-[11px] flex-shrink-0 ml-1" style={{ color: text3 }}>
          {stations.length} สถานี
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Timestamp */}
        <span className="text-[11px] hidden md:block mr-1" style={{ color: text3 }}>
          อัปเดต {ts}
        </span>

        {/* Live / Demo badge */}
        <Tooltip
          title={useMock ? 'ใช้ข้อมูลจริง (Live API)' : 'ใช้ข้อมูลตัวอย่าง (Demo)'}
          color={isDarkMode ? '#1e293b' : '#ffffff'}
          overlayInnerStyle={{ color: isDarkMode ? '#f1f5f9' : '#0f172a', fontSize: 12 }}
        >
          <button
            onClick={onToggleMock}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
            style={
              useMock
                ? { background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.4)',
                    color: isDarkMode ? '#fde047' : '#a16207' }
                : { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)',
                    color: isDarkMode ? '#86efac' : '#15803d' }
            }
          >
            {useMock ? <FiWifiOff size={11} /> : <FiWifi size={11} />}
            <span className="hidden sm:inline">{useMock ? 'Demo' : 'Live'}</span>
          </button>
        </Tooltip>

        {/* ── Theme Toggle ── */}
        <Tooltip
          title={isDarkMode ? 'เปลี่ยนเป็น Light Mode' : 'เปลี่ยนเป็น Dark Mode'}
          color={isDarkMode ? '#1e293b' : '#ffffff'}
          overlayInnerStyle={{ color: isDarkMode ? '#f1f5f9' : '#0f172a', fontSize: 12 }}
        >
          <button
            onClick={onToggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
            style={{
              background: isDarkMode
                ? 'rgba(251,191,36,0.15)'
                : 'rgba(99,102,241,0.10)',
              border: `1px solid ${isDarkMode ? 'rgba(251,191,36,0.35)' : 'rgba(99,102,241,0.25)'}`,
              color: isDarkMode ? '#fbbf24' : '#6366f1',
            }}
          >
            {isDarkMode
              ? <FaSun size={13} />
              : <FaMoon size={13} />
            }
          </button>
        </Tooltip>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-40"
          style={{ color: text2, background: iconBtn, border: `1px solid ${iconBtnBdr}` }}
        >
          <FiRefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>
    </div>
  );
}
