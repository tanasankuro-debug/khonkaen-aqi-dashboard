import { useEffect, useRef, useState, useCallback } from 'react';
import { Map, MapStyle, config, Language } from '@maptiler/sdk';
import { WindLayer } from '@maptiler/weather';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { FiWind, FiNavigation, FiRefreshCw } from 'react-icons/fi';

config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY || '';
config.primaryLanguage = Language.THAI;

const KK_CENTER = [102.8236, 16.4322];

function windMeta(kmh) {
  if (kmh < 5)  return { color: '#64748b', label: 'สงบ' };
  if (kmh < 15) return { color: '#22c55e', label: 'อ่อน' };
  if (kmh < 25) return { color: '#eab308', label: 'ปานกลาง' };
  if (kmh < 40) return { color: '#f97316', label: 'แรง' };
  return               { color: '#ef4444', label: 'แรงมาก' };
}

function dirLabel(deg) {
  const dirs = ['เหนือ', 'NE', 'ตะวันออก', 'SE', 'ใต้', 'SW', 'ตะวันตก', 'NW'];
  return dirs[Math.round(((deg % 360) + 360) / 45) % 8];
}

async function fetchKKWind() {
  const res = await fetch(
    'https://api.open-meteo.com/v1/forecast' +
    '?latitude=16.44&longitude=102.82' +
    '&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m' +
    '&wind_speed_unit=kmh&timezone=Asia%2FBangkok',
    { signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()).current;
}

export default function WindMapView() {
  const containerRef   = useRef(null);
  const mapRef         = useRef(null);
  const windLayerRef   = useRef(null);
  const mapLoadedRef   = useRef(false);
  const showWindRef    = useRef(true);
  const windOpacityRef = useRef(0.65);

  const [wind,        setWind]        = useState(null);
  const [windLoading, setWindLoading] = useState(true);
  const [showWind,    setShowWind]    = useState(true);
  const [windOpacity, setWindOpacity] = useState(0.65);

  showWindRef.current    = showWind;
  windOpacityRef.current = windOpacity;

  // ── Fetch wind data ────────────────────────────────────────────
  const loadWind = useCallback(async () => {
    setWindLoading(true);
    try { setWind(await fetchKKWind()); } catch {}
    finally { setWindLoading(false); }
  }, []);

  useEffect(() => {
    loadWind();
    const id = setInterval(loadWind, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [loadWind]);

  // ── Init map ───────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    if (!config.apiKey) {
      containerRef.current.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#0f172a;color:#f87171;font-family:sans-serif;font-size:14px;padding:24px;text-align:center">' +
        '<div><div style="font-size:32px;margin-bottom:12px">⚠️</div>' +
        '<b>VITE_MAPTILER_API_KEY ไม่ถูกตั้งค่า</b><br><br>' +
        'เพิ่ม VITE_MAPTILER_API_KEY ใน .env แล้วรัน dev server ใหม่</div></div>';
      return;
    }

    const map = new Map({
      container: containerRef.current,
      style:     MapStyle.STREETS,
      center:    KK_CENTER,
      zoom:      9,
      attributionControl: true,
      navigationControl:  true,
    });
    mapRef.current = map;

    map.on('load', () => {
      mapLoadedRef.current = true;
      const wl = new WindLayer({
        opacity: windOpacityRef.current,
        density: 1.2,
        color:   [255, 255, 255, 160],
        size:    1.2,
        speed:   0.0008,
      });
      windLayerRef.current = wl;
      if (showWindRef.current) map.addLayer(wl);
    });

    return () => { mapLoadedRef.current = false; map?.remove(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toggle wind layer ──────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    if (showWind) {
      if (!windLayerRef.current || !map.getLayer(windLayerRef.current.id)) {
        const wl = new WindLayer({ opacity: windOpacityRef.current, density: 1.2, color: [255,255,255,160], size: 1.2, speed: 0.0008 });
        windLayerRef.current = wl;
        map.addLayer(wl);
      }
    } else {
      const wl = windLayerRef.current;
      if (wl && map.getLayer(wl.id)) map.removeLayer(wl.id);
    }
  }, [showWind]);

  // ── Update opacity ─────────────────────────────────────────────
  useEffect(() => {
    const wl = windLayerRef.current;
    if (!wl || !mapLoadedRef.current) return;
    wl.setOpacity?.(windOpacity);
  }, [windOpacity]);

  const speed = wind?.wind_speed_10m    ?? 0;
  const dir   = wind?.wind_direction_10m ?? 0;
  const gusts = wind?.wind_gusts_10m    ?? 0;
  const wm    = windMeta(speed);

  return (
    <div className="relative w-full h-full">
      {/* Map canvas */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Wind info card */}
      <div
        className="absolute z-10 rounded-2xl shadow-xl"
        style={{
          top: 12, right: 12,
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(14,165,233,0.15)',
          minWidth: 170,
          padding: '14px 16px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FiWind color={wm.color} size={15} />
            <span className="font-bold text-sm text-slate-800">กระแสลม</span>
          </div>
          <button
            onClick={loadWind}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
            title="รีเฟรช"
          >
            <FiRefreshCw size={11} color="#94a3b8"
              style={{ animation: windLoading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Speed */}
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-3xl font-black" style={{ color: wm.color }}>
            {speed.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400">km/h</span>
          <span
            className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ background: wm.color }}
          >
            {wm.label}
          </span>
        </div>

        {/* Direction */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
          <FiNavigation size={11} style={{ transform: `rotate(${dir}deg)`, color: '#38bdf8' }} />
          <span>{dirLabel(dir)} · {dir}°</span>
        </div>

        {/* Gusts */}
        <div className="text-xs text-slate-400 mb-3">
          กระโชก <span className="font-semibold text-slate-500">{gusts.toFixed(1)}</span> km/h
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setShowWind(v => !v)}
          className="w-full py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
          style={{
            background: showWind
              ? 'linear-gradient(135deg, #38bdf8, #0ea5e9)'
              : '#f1f5f9',
            color: showWind ? '#fff' : '#64748b',
            boxShadow: showWind ? '0 2px 8px rgba(14,165,233,0.3)' : 'none',
          }}
        >
          {showWind ? 'ซ่อนกระแสลม' : 'แสดงกระแสลม'}
        </button>

        {/* Opacity slider */}
        {showWind && (
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>ความเข้ม</span>
              <span>{Math.round(windOpacity * 100)}%</span>
            </div>
            <input
              type="range" min="0.1" max="1" step="0.05"
              value={windOpacity}
              onChange={e => setWindOpacity(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#0ea5e9' }}
            />
          </div>
        )}
      </div>

      {/* Spin keyframe for refresh icon */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
