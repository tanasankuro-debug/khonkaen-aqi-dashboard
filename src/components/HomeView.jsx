import { FaWind, FaTint, FaMapMarkerAlt, FaSun } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import { getTemperatureColor, getPM25Color, getPM25Level } from '../data/weatherData';

function hourEmoji(h) {
  if (h >= 5  && h < 7)  return '🌅';
  if (h >= 7  && h < 18) return '☀️';
  if (h >= 18 && h < 20) return '🌆';
  return '🌙';
}

function getUVLevel(uv) {
  if (uv <= 2)  return { label: 'ต่ำ',      color: '#22c55e' };
  if (uv <= 5)  return { label: 'ปานกลาง', color: '#eab308' };
  if (uv <= 7)  return { label: 'สูง',       color: '#f97316' };
  if (uv <= 10) return { label: 'สูงมาก',   color: '#ef4444' };
  return               { label: 'อันตราย', color: '#7c3aed' };
}

const DAY_TH   = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
const MONTH_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

/* ── Live status dot ────────────────────────────────────────── */
function LiveDot({ status, lastUpdated }) {
  const cfg = {
    loading:    { cls: 'bg-blue-400 animate-pulse', label: 'กำลังโหลด...' },
    refreshing: { cls: 'bg-blue-400 animate-pulse', label: 'กำลังรีเฟรช...' },
    ok:         { cls: 'bg-emerald-400 live-dot',   label: 'เรียลไทม์' },
    error:      { cls: 'bg-red-400',                label: 'ออฟไลน์' },
  }[status] ?? { cls: 'bg-slate-400', label: '—' };
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full inline-block flex-shrink-0 ${cfg.cls}`} />
      <span className="text-xs text-blue-600/60">{cfg.label}</span>
      {lastUpdated && status === 'ok' && (
        <span className="text-[10px] text-blue-400 hidden sm:inline">
          · {lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}

/* ── Weather illustration ───────────────────────────────────── */
function WeatherIllustration() {
  return (
    <svg width="68" height="56" viewBox="0 0 84 70" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="58" cy="22" r="18" fill="#FEF3C7" opacity="0.5" />
      <circle cx="58" cy="22" r="13" fill="#FDE68A" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const r = (Math.PI * deg) / 180;
        return <line key={i}
          x1={58+Math.cos(r)*16} y1={22+Math.sin(r)*16}
          x2={58+Math.cos(r)*21} y2={22+Math.sin(r)*21}
          stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" opacity="0.75" />;
      })}
      <ellipse cx="24" cy="50" rx="20" ry="13" fill="white" opacity="0.95" />
      <ellipse cx="40" cy="43" rx="18" ry="13" fill="white" opacity="0.92" />
      <ellipse cx="56" cy="51" rx="16" ry="11" fill="white" opacity="0.88" />
    </svg>
  );
}

/* ── Stat card ──────────────────────────────────────────────── */
function StatCard({ icon, label, value, unit, badge, badgeColor, accent, extra }) {
  return (
    <div
      className="rounded-2xl p-4 bg-white flex flex-col gap-2 transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        border: `1px solid ${accent}20`,
        boxShadow: `0 2px 12px ${accent}0a`,
      }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}12` }}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
        <div className="flex items-end gap-1 leading-none">
          <span className="text-2xl font-bold text-slate-700">{value ?? '--'}</span>
          <span className="text-xs text-slate-400 mb-0.5">{unit}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${badgeColor}14`, color: badgeColor }}>
            {badge}
          </span>
        )}
        {extra}
      </div>
    </div>
  );
}

/* ── Hourly forecast strip ──────────────────────────────────── */
function ForecastStrip({ forecast }) {
  if (!forecast || forecast.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-5" style={{ border: '1px solid #e0eaff' }}>
        <p className="text-sm font-bold text-slate-600 mb-3">พยากรณ์รายชั่วโมง</p>
        <p className="text-sm text-blue-300 animate-pulse text-center py-4">กำลังโหลดข้อมูลพยากรณ์...</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white" style={{ border: '1px solid #e0eaff', overflow: 'hidden' }}>
      {/* Header */}
      <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-slate-50">
        <p className="text-xs font-semibold text-slate-500">พยากรณ์รายชั่วโมง</p>
        <p className="text-[10px] text-slate-400">อุณหภูมิ · ความชื้น · PM2.5</p>
      </div>

      {/* Scrollable cards */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {forecast.map((h) => {
          const tc = getTemperatureColor(h.temperature);
          const pc = getPM25Color(h.pm25);
          return (
            <div key={h.time}
              className="flex-shrink-0 rounded-xl flex flex-col items-center gap-1.5 pt-3 pb-2.5 px-2.5"
              style={{
                width: '66px',
                background: h.isCurrent ? 'linear-gradient(160deg,#3b82f6,#1d4ed8)' : '#f8faff',
                border: h.isCurrent ? '1.5px solid #2563eb' : '1px solid #eef2ff',
                boxShadow: h.isCurrent ? '0 4px 16px rgba(59,130,246,0.25)' : 'none',
              }}>

              {/* Time */}
              <span className="text-[10px] font-medium leading-none"
                style={{ color: h.isCurrent ? 'rgba(255,255,255,0.75)' : '#94a3b8' }}>
                {String(h.hour).padStart(2,'0')}:00
              </span>

              {/* Weather icon */}
              <span className="text-sm leading-none">{hourEmoji(h.hour)}</span>

              {/* Temperature */}
              <span className="text-base font-bold leading-none"
                style={{ color: h.isCurrent ? 'white' : tc }}>
                {h.temperature}°
              </span>

              <div className="w-full h-px" style={{ background: h.isCurrent ? 'rgba(255,255,255,0.15)' : '#eef2ff' }} />

              {/* Humidity */}
              <span className="text-[10px] leading-none"
                style={{ color: h.isCurrent ? 'rgba(255,255,255,0.65)' : '#93c5fd' }}>
                {h.humidity}%
              </span>
              <span className="text-[9px] leading-none"
                style={{ color: h.isCurrent ? 'rgba(255,255,255,0.45)' : pc }}>
                PM{h.pm25}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main component
   ══════════════════════════════════════════════════════════════ */
export default function HomeView({ tambons, forecast, weatherStatus, lastUpdated, onRefresh }) {
  const now     = new Date();
  const dateStr = `วัน${DAY_TH[now.getDay()]} ${now.getDate()} ${MONTH_TH[now.getMonth()]} ${now.getFullYear() + 543}`;

  if (!tambons || tambons.length === 0) {
    return (
      <div className="absolute top-0 right-0 flex items-center justify-center"
        style={{ left: 'var(--nav-x)', bottom: 'var(--nav-bottom)', background: 'linear-gradient(180deg,#eff6ff,#f8faff)' }}>
        <div className="text-blue-300 text-sm animate-pulse">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  /* ── Derived averages ── */
  const temps  = tambons.map(d => d.temperature);
  const pm25s  = tambons.map(d => d.pm25);
  const humids = tambons.map(d => d.humidity ?? 0);
  const winds  = tambons.map(d => d.windSpeed ?? 0);

  const avgTemp     = (temps.reduce((s,v)=>s+v,0) / temps.length).toFixed(1);
  const minTemp     = Math.min(...temps);
  const maxTemp     = Math.max(...temps);
  const avgPM25     = (pm25s.reduce((s,v)=>s+v,0) / pm25s.length).toFixed(1);
  const avgHumidity = Math.round(humids.reduce((s,v)=>s+v,0) / humids.length);
  const avgWind     = (winds.reduce((s,v)=>s+v,0) / winds.length).toFixed(1);
  const pm25Level   = getPM25Level(parseFloat(avgPM25));
  const pm25Color   = getPM25Color(parseFloat(avgPM25));
  const tempPct     = Math.max(0, Math.min(100, ((parseFloat(avgTemp) - minTemp) / (maxTemp - minTemp || 1)) * 100));
  const currentUV   = forecast?.[0]?.uvIndex ?? null;
  const uvLevel     = currentUV !== null ? getUVLevel(currentUV) : null;

  return (
    <div className="absolute top-0 right-0 overflow-y-auto"
      style={{ left: 'var(--nav-x)', bottom: 'var(--nav-bottom)', background: 'linear-gradient(180deg,#eff6ff,#f8faff)' }}>

      <div className="w-full px-5 md:px-8 pt-6 pb-10 space-y-5">

        {/* ══ HEADER ══ */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <FaMapMarkerAlt className="text-blue-400" size={11} />
              <span className="text-slate-700 text-sm font-semibold">อ.เมืองขอนแก่น</span>
            </div>
            <p className="text-slate-400 text-xs ml-5">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <LiveDot status={weatherStatus} lastUpdated={lastUpdated} />
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="w-7 h-7 rounded-full bg-white border border-slate-100 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <FiRefreshCw size={11} className="text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* ══ TWO-COLUMN ══ */}
        <div className="md:flex md:gap-6 md:items-start">

          {/* ─ LEFT ─ */}
          <div className="md:flex-1 space-y-4 min-w-0">

            {/* Hero card */}
            <div className="rounded-3xl p-5 md:p-6" style={{
              background: 'linear-gradient(135deg,#dbeafe 0%,#bfdbfe 55%,#93c5fd 100%)',
              border: '1px solid rgba(147,197,253,0.5)',
              boxShadow: '0 8px 32px rgba(59,130,246,0.16)',
            }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-blue-600/70 text-xs mb-1">อุณหภูมิเฉลี่ย</p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-5xl font-bold text-blue-900 leading-none tabular-nums">{avgTemp}</span>
                    <span className="text-xl font-semibold text-blue-700 mb-1">°C</span>
                  </div>
                  <p className="text-blue-600/60 text-xs mt-1.5">{tambons.length} ตำบล · อ.เมืองขอนแก่น</p>
                </div>
                <WeatherIllustration />
              </div>
              <div className="mt-5">
                <div className="flex justify-between text-xs text-blue-600/60 mb-1.5">
                  <span>ต่ำสุด {minTemp}°C</span>
                  <span>สูงสุด {maxTemp}°C</span>
                </div>
                <div className="h-2 rounded-full bg-blue-200/50 overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{ width: '100%', background: 'linear-gradient(90deg,#60a5fa,#fb923c,#ef4444)', opacity: 0.85 }} />
                </div>
                <div className="relative h-0">
                  <div className="absolute -top-4 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-500 shadow-md"
                    style={{ left: `calc(${tempPct}% - 7px)` }} />
                </div>
              </div>
            </div>

            {/* 4 stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">

              {/* PM2.5 */}
              <StatCard
                icon={<FaWind style={{ color: pm25Color }} size={14} />}
                label="ฝุ่น PM2.5"
                value={avgPM25}
                unit="µg/m³"
                badge={pm25Level.label}
                badgeColor={pm25Level.color}
                accent={pm25Color}
              />

              {/* Humidity */}
              <StatCard
                icon={<FaTint className="text-blue-400" size={14} />}
                label="ความชื้น"
                value={avgHumidity}
                unit="%"
                accent="#3b82f6"
                badge={avgHumidity >= 80 ? 'สูง' : avgHumidity >= 60 ? 'ปานกลาง' : 'ต่ำ'}
                badgeColor="#3b82f6"
                extra={
                  <div className="flex-1 h-1 rounded-full bg-blue-100 overflow-hidden ml-1">
                    <div className="h-full rounded-full bg-blue-300 transition-all"
                      style={{ width: `${avgHumidity}%` }} />
                  </div>
                }
              />

              {/* Wind */}
              <StatCard
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round">
                    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
                  </svg>
                }
                label="ความเร็วลม"
                value={avgWind}
                unit="km/h"
                accent="#22c55e"
                badge={parseFloat(avgWind) < 5 ? 'สงบ' : parseFloat(avgWind) < 15 ? 'อ่อน' : parseFloat(avgWind) < 25 ? 'ปานกลาง' : 'แรง'}
                badgeColor="#22c55e"
              />

              {/* UV Index */}
              {uvLevel ? (
                <StatCard
                  icon={<FaSun style={{ color: uvLevel.color }} size={14} />}
                  label="UV Index"
                  value={currentUV}
                  unit="index"
                  badge={uvLevel.label}
                  badgeColor={uvLevel.color}
                  accent={uvLevel.color}
                />
              ) : (
                <div className="rounded-2xl p-4 bg-white flex flex-col gap-2"
                  style={{ border: '1px solid #e0eaff' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-yellow-50">
                    <FaSun className="text-yellow-300" size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">UV Index</p>
                    <p className="text-xs text-blue-300 animate-pulse">กำลังโหลด...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─ RIGHT: tambon list ─ */}
          <div className="mt-5 md:mt-0 md:w-64 lg:w-72 md:flex-shrink-0">

            {/* Sticky header */}
            <div className="sticky top-0 z-10 py-2 -mx-1 px-1"
              style={{ background: 'linear-gradient(180deg,#eff6ff 75%,transparent)' }}>
              <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest">
                ข้อมูลรายสถานี
                <span className="ml-1 text-blue-300 font-normal normal-case tracking-normal">
                  ({tambons.length} ตำบล)
                </span>
              </p>
            </div>

            <div className="space-y-2 md:max-h-[480px] md:overflow-y-auto mt-1"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#bfdbfe transparent' }}>
              {[...tambons].sort((a,b) => b.temperature - a.temperature).map((d, i) => {
                const tc = getTemperatureColor(d.temperature);
                const pc = getPM25Color(d.pm25);
                return (
                  <div key={d.id}
                    className="rounded-xl overflow-hidden bg-white flex items-stretch"
                    style={{ border: '1px solid #eef2ff' }}>

                    {/* Color strip */}
                    <div className="w-1 flex-shrink-0" style={{ background: tc, opacity: 0.7 }} />

                    {/* Content */}
                    <div className="flex items-center gap-2.5 px-3 py-2.5 flex-1 min-w-0">
                      <span className="text-[10px] font-bold w-4 text-center flex-shrink-0"
                        style={{ color: i < 3 ? '#ef4444' : '#d1d5db' }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-600 truncate">ต.{d.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400">{d.humidity}%</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-[10px]" style={{ color: pc }}>PM{d.pm25}</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold flex-shrink-0 tabular-nums"
                        style={{ color: tc }}>{d.temperature}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>{/* ════ END TWO-COLUMN ════ */}

        {/* ══ FORECAST STRIP ══ */}
        <ForecastStrip forecast={forecast} />

      </div>
    </div>
  );
}
