import { useEffect, useRef, useState, useCallback } from 'react';
import { Map, MapStyle, config } from '@maptiler/sdk';
import { WindLayer } from '@maptiler/weather';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { FiWind, FiRefreshCw, FiNavigation } from 'react-icons/fi';

// ── MapTiler API Key ────────────────────────────────────────────
config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY || '';

// ── ทิศทางลม 8 ทิศ ─────────────────────────────────────────────
function dirLabel(deg) {
  const dirs = ['เหนือ','NE','ตะวันออก','SE','ใต้','SW','ตะวันตก','NW'];
  return dirs[Math.round(((deg % 360) + 360) / 45) % 8];
}

// ── ความเร็วลม → สีและคำอธิบาย ────────────────────────────────
function windMeta(kmh) {
  if (kmh <  5) return { color: '#64748b', label: 'สงบ' };
  if (kmh < 15) return { color: '#22c55e', label: 'อ่อน' };
  if (kmh < 25) return { color: '#eab308', label: 'ปานกลาง' };
  if (kmh < 40) return { color: '#f97316', label: 'แรง' };
  return               { color: '#ef4444', label: 'แรงมาก' };
}

// ── ดึงข้อมูลลม ณ ขอนแก่น จาก Open-Meteo ─────────────────────
async function fetchKKWind() {
  const res = await fetch(
    'https://api.open-meteo.com/v1/forecast' +
    '?latitude=16.44&longitude=102.82' +
    '&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m' +
    '&wind_speed_unit=kmh&timezone=Asia%2FBangkok',
    { signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.current;
}

// ── Inner map — แยก component เพื่อ key-remount เมื่อ theme เปลี่ยน ─
function MapInstance({ isDarkMode }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // MapTiler style: DARK vs BASIC (BASIC แสดงชื่อภาษาท้องถิ่น)
    const mapStyle = isDarkMode ? MapStyle.DARK : MapStyle.BASIC;

    const map = new Map({
      container:        containerRef.current,
      style:            mapStyle,
      center:           [102.82, 15.5], // center ไทย (ใต้ขอนแก่นเล็กน้อยให้เห็นทั้งประเทศ)
      zoom:             5.8,
      attributionControl: true,
      navigationControl: true,
    });

    const windLayer = new WindLayer();

    map.on('load', () => {
      map.addLayer(windLayer);
    });

    return () => {
      map.remove();
    };
  }, []); // deps ว่าง — รันครั้งเดียวต่อ mount cycle

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// ── Main Export ─────────────────────────────────────────────────
export default function WeatherMap({ isDarkMode }) {
  const [wind,    setWind]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [lastUp,  setLastUp]  = useState(null);

  const loadWind = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchKKWind();
      setWind(data);
      setLastUp(new Date());
    } catch (e) {
      setError('โหลดข้อมูลลมไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWind();
    const id = setInterval(loadWind, 10 * 60 * 1000); // refresh 10 นาที
    return () => clearInterval(id);
  }, [loadWind]);

  // ── Theme ──────────────────────────────────────────────────────
  const th = isDarkMode
    ? { text1: '#f1f5f9', text2: '#94a3b8', text3: '#475569',
        bdr: 'rgba(255,255,255,0.10)', cardBg: 'rgba(15,23,42,0.88)' }
    : { text1: '#0f172a', text2: '#475569', text3: '#94a3b8',
        bdr: 'rgba(0,0,0,0.08)',        cardBg: 'rgba(255,255,255,0.92)' };

  const speed = wind?.wind_speed_10m    ?? 0;
  const dir   = wind?.wind_direction_10m ?? 0;
  const gusts = wind?.wind_gusts_10m    ?? 0;
  const wm    = windMeta(speed);
  const ts    = lastUp?.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col w-full h-full">

      {/* ── Info Strip ──────────────────────────────────── */}
      <div
        className="glass flex items-center gap-3 px-4 py-2.5 flex-shrink-0 flex-wrap"
        style={{ borderBottom: `1px solid ${th.bdr}` }}
      >
        {/* Title */}
        <div className="flex items-center gap-2">
          <FiWind size={15} style={{ color: '#38bdf8' }} />
          <span className="font-semibold text-sm" style={{ color: th.text1 }}>
            แผนที่กระแสลม (Real-time)
          </span>
          <span className="text-[10px]" style={{ color: th.text3 }}>
            MapTiler WindLayer · ECMWF Model
          </span>
        </div>

        {/* Khon Kaen current wind pill */}
        {wind && !loading && (
          <div
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
            style={{ background: th.bdr, border: `1px solid ${wm.color}40` }}
          >
            <FiNavigation size={11} style={{ color: wm.color }} />
            <span className="font-medium" style={{ color: th.text2 }}>ขอนแก่น</span>
            <span className="font-bold text-sm" style={{ color: wm.color }}>
              {speed.toFixed(1)} km/h
            </span>
            <span style={{ color: th.text2 }}>
              ทิศ{dirLabel(dir)} ({dir.toFixed(0)}°)
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: wm.color + '25', color: wm.color }}
            >
              {wm.label}
            </span>
            {gusts > speed + 3 && (
              <span className="text-[10px]" style={{ color: '#f97316' }}>
                กระโชก {gusts.toFixed(0)} km/h
              </span>
            )}
          </div>
        )}

        {lastUp && (
          <span className="text-[11px] hidden md:block ml-auto" style={{ color: th.text3 }}>
            อัปเดต {ts}
          </span>
        )}

        {/* Refresh */}
        <button
          onClick={loadWind}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium disabled:opacity-40 ml-auto md:ml-0"
          style={{
            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            border:     `1px solid ${th.bdr}`,
            color:      th.text2,
          }}
        >
          <FiRefreshCw size={11} className={loading ? 'spin' : ''} />
          รีเฟรช
        </button>
      </div>

      {/* ── MapTiler Wind Map ────────────────────────────── */}
      {/* key สลับ dark/light ทำให้ MapInstance unmount+remount พร้อม style ใหม่ */}
      <div className="relative flex-1 overflow-hidden">
        <MapInstance key={isDarkMode ? 'dark' : 'light'} isDarkMode={isDarkMode} />

        {/* Source info card — bottom-left */}
        <div className="absolute bottom-8 left-3 z-[1000] pointer-events-none">
          <div
            className="glass rounded-xl px-3 py-2 text-[10px] leading-relaxed"
            style={{ color: th.text3, maxWidth: 190 }}
          >
            <p className="font-semibold mb-0.5" style={{ color: th.text2 }}>แหล่งข้อมูลลม</p>
            <p>โมเดล: ECMWF / GFS</p>
            <p>อัปเดตทุก 3 ชั่วโมง</p>
            <p>ระดับ 10m เหนือพื้นดิน</p>
          </div>
        </div>
      </div>
    </div>
  );
}
