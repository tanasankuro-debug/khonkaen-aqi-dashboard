import { useState, useMemo } from 'react';
import { Input, Select } from 'antd';
import { FiSearch, FiMapPin, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getAQILevel } from '../utils/aqiUtils';

const FILTER_OPTIONS = [
  { value: 'all',           label: 'ทั้งหมด' },
  { value: 'verygood',      label: 'ดีมาก (0–25)' },
  { value: 'good',          label: 'ดี (26–50)' },
  { value: 'moderate',      label: 'ปานกลาง (51–100)' },
  { value: 'unhealthy',     label: 'มีผลกระทบ (101–200)' },
  { value: 'very_unhealthy',label: 'มีผลกระทบมาก (>200)' },
];

const PARAM_OPTIONS = [
  { value: 'AQI',  label: 'AQI' },
  { value: 'PM25', label: 'PM2.5' },
  { value: 'PM10', label: 'PM10' },
  { value: 'O3',   label: 'O₃' },
  { value: 'CO',   label: 'CO' },
  { value: 'NO2',  label: 'NO₂' },
];

export default function Sidebar({ stations, selectedId, onSelect, isDarkMode, isCollapsed, onToggleCollapse }) {
  const [query,       setQuery]       = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [param,       setParam]       = useState('AQI');

  const th = {
    text1:   isDarkMode ? '#f1f5f9'               : '#0f172a',
    text2:   isDarkMode ? '#94a3b8'               : '#475569',
    text3:   isDarkMode ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.40)',
    border:  isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
    hover:   isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)',
    inputBg:  isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
    inputBdr: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    selBg:    isDarkMode ? 'rgba(56,189,248,0.10)'  : 'rgba(99,102,241,0.07)',
  };

  const filtered = useMemo(() => {
    return stations
      .filter((s) => {
        const q = query.toLowerCase();
        const match =
          !q ||
          s.nameEN?.toLowerCase().includes(q) ||
          s.nameTH?.includes(q) ||
          s.areaEN?.toLowerCase().includes(q) ||
          s.areaTH?.includes(q);
        if (!match) return false;
        if (levelFilter !== 'all') {
          const level = getAQILevel(parseInt(s.AQILast?.AQI?.aqi, 10));
          if (level.id !== levelFilter) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const av = parseInt(a.AQILast?.AQI?.aqi, 10) || 0;
        const bv = parseInt(b.AQILast?.AQI?.aqi, 10) || 0;
        return bv - av;
      });
  }, [stations, query, levelFilter]);

  function getValue(s) {
    if (param === 'AQI') return s.AQILast?.AQI?.aqi ?? '—';
    return s.AQILast?.[param]?.value ?? '—';
  }
  function getUnit() {
    if (param === 'AQI') return '';
    return { PM25: 'μg/m³', PM10: 'μg/m³', O3: 'ppb', CO: 'ppm', NO2: 'ppb' }[param] ?? '';
  }

  /* ── Handle tab (sits outside overflow-hidden so it can protrude) ── */
  const handle = (
    <button
      onClick={onToggleCollapse}
      title={isCollapsed ? 'เปิดแถบสถานี' : 'ปิดแถบสถานี'}
      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full z-20
                 flex flex-col items-center justify-center gap-[3px]
                 w-6 h-14 rounded-r-xl
                 hover:brightness-110 active:scale-95 transition-all duration-150"
      style={{
        background: 'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 100%)',
        color:      '#ffffff',
        boxShadow:  '3px 0 14px rgba(14,165,233,0.45), 0 2px 6px rgba(0,0,0,0.18)',
      }}
    >
      <span className="block w-[3px] h-[3px] rounded-full bg-white/60" />
      <span className="block w-[3px] h-[3px] rounded-full bg-white/60" />
      <span className="block w-[3px] h-[3px] rounded-full bg-white/60" />
      <span className="mt-0.5">
        {isCollapsed
          ? <FiChevronRight size={13} strokeWidth={2.5} />
          : <FiChevronLeft  size={13} strokeWidth={2.5} />}
      </span>
    </button>
  );

  /* ── Collapsed strip ──────────────────────────────────────────────── */
  if (isCollapsed) {
    return (
      <div className="relative h-full w-full">
        <div
          className="glass flex flex-col items-center h-full w-full overflow-hidden"
          style={{ borderRight: `1px solid ${th.border}`, transition: 'background 0.3s ease' }}
        >
          <div
            className="text-[10px] font-semibold select-none mt-16"
            style={{
              color: th.text3,
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              letterSpacing: 1,
            }}
          >
            สถานี {stations.length}
          </div>
        </div>
        {handle}
      </div>
    );
  }

  /* ── Expanded ─────────────────────────────────────────────────────── */
  return (
    <div className="relative h-full w-full">
      <div
        className="glass flex flex-col h-full w-full overflow-hidden"
        style={{ borderRight: `1px solid ${th.border}`, transition: 'background 0.3s ease' }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: `1px solid ${th.border}` }}>
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: th.text1 }}>
            <FiMapPin size={14} className="text-sky-500" />
            สถานีตรวจวัด
            <span className="ml-auto font-normal text-xs" style={{ color: th.text3 }}>
              {filtered.length}/{stations.length}
            </span>
          </h2>

          <Input
            placeholder="ค้นหาสถานี / จังหวัด..."
            prefix={<FiSearch size={13} style={{ color: th.text3 }} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            allowClear
            style={{
              background:   th.inputBg,
              border:       `1px solid ${th.inputBdr}`,
              color:        th.text1,
              borderRadius: 8,
              fontSize:     12,
            }}
            className="mb-2"
          />

          <div className="flex gap-2">
            <Select
              value={param}
              onChange={setParam}
              options={PARAM_OPTIONS}
              size="small"
              style={{ flex: 1, fontSize: 11 }}
              popupMatchSelectWidth={false}
            />
            <Select
              value={levelFilter}
              onChange={setLevelFilter}
              options={FILTER_OPTIONS}
              size="small"
              style={{ flex: 2, fontSize: 11 }}
              popupMatchSelectWidth={false}
            />
          </div>
        </div>

        {/* Station list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="text-xs text-center py-8" style={{ color: th.text3 }}>
              ไม่พบสถานี
            </div>
          )}

          {filtered.map((s) => {
            const aqi        = parseInt(s.AQILast?.AQI?.aqi, 10);
            const level      = getAQILevel(aqi);
            const val        = getValue(s);
            const isSelected = s.stationID === selectedId;
            const badgeText  = isDarkMode ? level.textColor : level.darkTextColor;

            return (
              <button
                key={s.stationID + s.lat}
                onClick={() => onSelect(s)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150"
                style={{
                  borderBottom: `1px solid ${th.border}`,
                  borderLeft:   `3px solid ${isSelected ? level.color : 'transparent'}`,
                  background:   isSelected ? th.selBg : 'transparent',
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = th.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? th.selBg : 'transparent'; }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs"
                  style={{
                    background: level.bgColor,
                    border:     `1px solid ${level.borderColor}`,
                    color:      badgeText,
                  }}
                >
                  {isNaN(aqi) ? '—' : aqi}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate leading-tight" style={{ color: th.text1 }}>
                    {s.nameTH}
                  </p>
                  <p className="text-[10px] truncate leading-tight" style={{ color: th.text3 }}>
                    {s.areaTH}
                  </p>
                </div>

                <div className="flex-shrink-0 text-right">
                  <span className="text-xs font-semibold tabular-nums" style={{ color: badgeText }}>
                    {val}
                  </span>
                  {getUnit() && (
                    <span className="text-[9px] ml-0.5" style={{ color: th.text3 }}>
                      {getUnit()}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {handle}
    </div>
  );
}
