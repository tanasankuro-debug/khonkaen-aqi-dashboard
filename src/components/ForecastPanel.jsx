import { useState } from 'react';
import { FiChevronUp, FiChevronDown, FiRefreshCw } from 'react-icons/fi';
import { usePM25Forecast } from '../hooks/usePM25Forecast';
import { useDraggable } from '../hooks/useDraggable';

function pm25Meta(val) {
  if (val === null || val === undefined || isNaN(val))
    return { color: '#64748b', label: '—', bg: 'rgba(100,116,139,0.2)' };
  if (val <= 15)   return { color: '#3B82F6', label: 'ดีมาก',     bg: 'rgba(59,130,246,0.2)' };
  if (val <= 25)   return { color: '#22C55E', label: 'ดี',         bg: 'rgba(34,197,94,0.2)'  };
  if (val <= 37.5) return { color: '#EAB308', label: 'ปานกลาง',   bg: 'rgba(234,179,8,0.2)'  };
  if (val <= 75)   return { color: '#F97316', label: 'มีผลกระทบ', bg: 'rgba(249,115,22,0.2)' };
  return                  { color: '#EF4444', label: 'อันตราย',   bg: 'rgba(239,68,68,0.2)'  };
}

export default function ForecastPanel({ isDarkMode }) {
  const [open, setOpen] = useState(true);
  const { forecast, loading, error, refresh } = usePM25Forecast();
  const { offset, dragHandleProps } = useDraggable({ onToggle: () => setOpen(o => !o) });

  const th = {
    text1: isDarkMode ? '#f1f5f9' : '#0f172a',
    text2: isDarkMode ? '#94a3b8' : '#475569',
    text3: isDarkMode ? '#475569' : '#94a3b8',
    bdr:   isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
  };

  const maxVal = forecast ? Math.max(50, ...forecast.map(f => f.pm25 ?? 0)) : 50;
  const currentPM25 = forecast?.[0]?.pm25 ?? null;
  const currentMeta = pm25Meta(currentPM25);

  return (
    <div
      className="absolute bottom-10 left-1/2 z-[1000]"
      style={{
        transform: `translateX(-50%) translate(${offset.x}px, ${offset.y}px)`,
        minWidth: 360, maxWidth: 560, width: '44vw',
      }}
    >
      <div className="relative">

        {/* Blue handle — protrudes UP, horizontal, drag+toggle */}
        <button
          {...dragHandleProps}
          title={open ? 'ซ่อนกราฟ' : 'แสดงกราฟ'}
          className="absolute bottom-full left-1/2 -translate-x-1/2 z-20
                     h-6 w-16 rounded-t-xl
                     flex flex-row items-center justify-center gap-[3px]
                     hover:brightness-110 active:scale-95 transition-all duration-150"
          style={{
            ...dragHandleProps.style,
            background: 'linear-gradient(90deg, #38bdf8 0%, #0ea5e9 100%)',
            color:      '#ffffff',
            boxShadow:  '0 -3px 14px rgba(14,165,233,0.45), 0 2px 6px rgba(0,0,0,0.18)',
          }}
        >
          <span className="block w-[3px] h-[3px] rounded-full bg-white/60" />
          <span className="block w-[3px] h-[3px] rounded-full bg-white/60" />
          <span className="block w-[3px] h-[3px] rounded-full bg-white/60" />
          <span className="ml-0.5">
            {open
              ? <FiChevronDown size={13} strokeWidth={2.5} />
              : <FiChevronUp   size={13} strokeWidth={2.5} />}
          </span>
        </button>

        {/* Glass panel */}
        <div className="glass rounded-2xl overflow-hidden">

          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-2.5"
            style={{ borderBottom: open ? `1px solid ${th.bdr}` : 'none', color: th.text1 }}
          >
            <span className="text-xs font-bold tracking-wide flex-1 text-left">
              📊 PM2.5 คาดการณ์ 24 ชั่วโมง
            </span>
            {currentPM25 != null && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0"
                style={{ background: currentMeta.bg, color: currentMeta.color }}
              >
                ตอนนี้ {currentPM25.toFixed(1)} μg/m³
              </span>
            )}
            <span
              className="text-[10px] px-1.5 py-0.5 rounded hidden sm:inline flex-shrink-0"
              style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}
            >
              Open-Meteo
            </span>
            <button
              onClick={refresh}
              disabled={loading}
              className="disabled:opacity-40 flex-shrink-0"
              style={{ color: th.text3 }}
            >
              <FiRefreshCw size={11} className={loading ? 'spin' : ''} />
            </button>
          </div>

          {/* Body */}
          {open && (
            <div className="px-4 pt-3 pb-4">
              {loading && !forecast && (
                <div className="flex items-center gap-2 py-3" style={{ color: th.text3 }}>
                  <div className="w-3 h-3 border-2 rounded-full spin"
                    style={{ borderColor: '#38bdf8', borderTopColor: 'transparent' }} />
                  <span className="text-xs">กำลังโหลดข้อมูล...</span>
                </div>
              )}
              {error && !forecast && (
                <p className="text-xs py-2" style={{ color: '#f97316' }}>
                  โหลดไม่สำเร็จ — {error}
                </p>
              )}
              {forecast && (
                <>
                  <div className="flex items-end gap-[2px]" style={{ height: 72 }}>
                    {forecast.map((f, i) => {
                      const pct  = f.pm25 != null ? Math.max(3, (f.pm25 / maxVal) * 100) : 3;
                      const meta = pm25Meta(f.pm25);
                      const h    = f.time.getHours();
                      return (
                        <div
                          key={i}
                          className="relative flex-1 flex flex-col items-center justify-end group"
                          title={`${String(h).padStart(2,'0')}:00 — ${f.pm25 != null ? f.pm25.toFixed(1) + ' μg/m³' : '—'}`}
                          style={{ height: '100%' }}
                        >
                          <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none" style={{ zIndex: 20 }}>
                            <div className="glass rounded-lg px-2 py-1 text-[10px] whitespace-nowrap" style={{ color: th.text1 }}>
                              <span style={{ color: meta.color, fontWeight: 700 }}>
                                {f.pm25 != null ? f.pm25.toFixed(1) : '—'}
                              </span>{' '}μg/m³
                            </div>
                            <div style={{ width:0, height:0, borderLeft:'4px solid transparent', borderRight:'4px solid transparent', borderTop:`4px solid ${isDarkMode ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.88)'}` }} />
                          </div>
                          <div
                            style={{
                              width:'100%', height:`${pct}%`,
                              background: meta.color,
                              opacity: f.isCurrent ? 1 : 0.65,
                              borderRadius: '3px 3px 0 0',
                              outline: f.isCurrent ? `2px solid ${meta.color}` : 'none',
                              outlineOffset: 2,
                              transition: 'height 0.4s ease',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-[2px] mt-1">
                    {forecast.map((f, i) => {
                      const h = f.time.getHours();
                      return (
                        <div key={i} className="flex-1 flex justify-center">
                          <span
                            className="text-[9px] tabular-nums"
                            style={{ color: th.text3, visibility: h % 6 === 0 ? 'visible' : 'hidden' }}
                          >
                            {`${String(h).padStart(2,'0')}น.`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    className="flex items-center gap-x-3 gap-y-1 mt-2.5 flex-wrap"
                    style={{ borderTop: `1px solid ${th.bdr}`, paddingTop: 8 }}
                  >
                    <span className="text-[10px]" style={{ color: th.text3 }}>มาตรฐาน WHO 15 μg/m³</span>
                    {[
                      { color:'#3B82F6', label:'≤15 ดีมาก' },
                      { color:'#22C55E', label:'≤25 ดี' },
                      { color:'#EAB308', label:'≤37.5 ปานกลาง' },
                      { color:'#F97316', label:'≤75 มีผล' },
                      { color:'#EF4444', label:'>75 อันตราย' },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: l.color }} />
                        <span className="text-[10px]" style={{ color: th.text2 }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
