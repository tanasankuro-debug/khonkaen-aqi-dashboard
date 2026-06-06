import { useState } from 'react';
import { AQI_LEVELS } from '../utils/aqiUtils';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useDraggable } from '../hooks/useDraggable';

export default function MapLegend({ isDarkMode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { offset, dragHandleProps } = useDraggable({ onToggle: () => setCollapsed(c => !c) });

  const th = {
    text1:    isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.85)',
    text2:    isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.55)',
    labelClr: (lvl) => isDarkMode ? lvl.textColor : lvl.darkTextColor,
    border:   isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
    shadow:   isDarkMode ? '0 8px 32px rgba(0,0,0,0.45)' : '0 8px 32px rgba(0,0,0,0.14)',
  };

  return (
    <div
      className="absolute bottom-10 right-3 z-[1000] pointer-events-auto"
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <div className="relative">

        {/* Blue handle — auto-height, protrudes LEFT */}
        <button
          {...dragHandleProps}
          title={collapsed ? 'แสดงระดับ AQI' : 'ซ่อนระดับ AQI'}
          className="absolute right-full top-0 bottom-0 z-20 w-6 rounded-l-xl
                     flex flex-col items-center justify-center gap-[3px]
                     hover:brightness-110 active:scale-95 transition-all duration-150"
          style={{
            ...dragHandleProps.style,
            background: 'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 100%)',
            color:      '#ffffff',
            boxShadow:  '-3px 0 14px rgba(14,165,233,0.45), 0 2px 6px rgba(0,0,0,0.18)',
            minHeight:  36,
          }}
        >
          <span className="block w-[3px] h-[3px] rounded-full bg-white/60" />
          <span className="block w-[3px] h-[3px] rounded-full bg-white/60" />
          <span className="block w-[3px] h-[3px] rounded-full bg-white/60" />
          <span className="mt-0.5">
            {collapsed
              ? <FiChevronLeft  size={13} strokeWidth={2.5} />
              : <FiChevronRight size={13} strokeWidth={2.5} />}
          </span>
        </button>

        {/* Glass panel */}
        <div
          className="glass rounded-2xl overflow-hidden"
          style={{ minWidth: 190, boxShadow: th.shadow }}
        >
          <div
            className="flex items-center px-4 py-2.5"
            style={{ borderBottom: collapsed ? 'none' : `1px solid ${th.border}`, color: th.text1 }}
          >
            <span className="text-xs font-bold uppercase tracking-widest">ระดับ AQI</span>
          </div>

          {!collapsed && (
            <div className="px-4 py-3 flex flex-col gap-2">
              {AQI_LEVELS.map((lvl) => (
                <div key={lvl.id} className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-md flex-shrink-0"
                    style={{ background: lvl.color, boxShadow: `0 0 7px ${lvl.color}80` }}
                  />
                  <div className="flex items-baseline gap-2 min-w-0 flex-1">
                    <span className="text-xs font-mono tabular-nums flex-shrink-0" style={{ color: th.text2 }}>
                      {lvl.min}–{lvl.max > 500 ? '300+' : lvl.max}
                    </span>
                    <span className="text-xs font-semibold truncate" style={{ color: th.labelClr(lvl) }}>
                      {lvl.labelTH}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
