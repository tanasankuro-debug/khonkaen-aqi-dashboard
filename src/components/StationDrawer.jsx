import { Drawer, Tag } from 'antd';
import { FiMapPin, FiClock, FiLayers, FiWind } from 'react-icons/fi';
import { getAQILevel, POLLUTANTS, getPollutantPct, getPollutantColor } from '../utils/aqiUtils';

export default function StationDrawer({ station, open, onClose, isDarkMode }) {
  if (!station) return null;

  const aqi   = parseInt(station.AQILast?.AQI?.aqi, 10);
  const level = getAQILevel(aqi);
  const last  = station.AQILast ?? {};

  // Theme values
  const th = {
    bg:       isDarkMode ? '#0f172a'              : '#ffffff',
    hdrBdr:   isDarkMode ? 'rgba(255,255,255,0.08)': 'rgba(0,0,0,0.08)',
    shadow:   isDarkMode ? '-8px 0 40px rgba(0,0,0,0.55)' : '-8px 0 40px rgba(0,0,0,0.14)',
    text1:    isDarkMode ? '#f1f5f9'              : '#0f172a',
    text2:    isDarkMode ? 'rgba(255,255,255,0.70)': 'rgba(15,23,42,0.70)',
    text3:    isDarkMode ? 'rgba(255,255,255,0.40)': 'rgba(15,23,42,0.40)',
    subtext:  isDarkMode ? 'rgba(255,255,255,0.30)': 'rgba(15,23,42,0.35)',
    bodyBdr:  isDarkMode ? 'rgba(255,255,255,0.08)': 'rgba(0,0,0,0.06)',
    trackBg:  isDarkMode ? 'rgba(255,255,255,0.10)': 'rgba(0,0,0,0.07)',
    coordBg:  isDarkMode ? 'rgba(255,255,255,0.05)': 'rgba(0,0,0,0.04)',
    coordBdr: isDarkMode ? 'rgba(255,255,255,0.10)': 'rgba(0,0,0,0.08)',
    titleClr: isDarkMode ? '#f1f5f9'              : '#0f172a',
    // For text on colored bg (badge label), use readable variant
    badgeText:   isDarkMode ? level.textColor : level.darkTextColor,
    heroBigClr:  level.color, // AQI number always uses saturated color
    descText: isDarkMode ? 'rgba(255,255,255,0.50)': 'rgba(15,23,42,0.55)',
    domText:  isDarkMode ? 'rgba(255,255,255,0.40)': 'rgba(15,23,42,0.40)',
  };

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: level.color, boxShadow: `0 0 8px ${level.color}` }}
          />
          <span className="font-semibold text-sm truncate" style={{ color: th.titleClr }}>
            {station.nameTH}
          </span>
        </div>
      }
      placement="right"
      width={390}
      open={open}
      onClose={onClose}
      styles={{
        body:    { background: th.bg, padding: 0 },
        header:  { background: th.bg, borderBottom: `1px solid ${th.hdrBdr}` },
        mask:    { background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' },
        wrapper: { boxShadow: th.shadow },
      }}
    >
      <div className="flex flex-col h-full overflow-y-auto">

        {/* ── AQI Hero ─────────────────────────────── */}
        <div
          className="relative px-6 py-6 flex flex-col items-center gap-2"
          style={{
            background: isDarkMode
              ? `linear-gradient(145deg, ${level.color}22, ${level.color}08)`
              : `linear-gradient(145deg, ${level.color}18, ${level.color}05)`,
            borderBottom: `1px solid ${level.borderColor}`,
          }}
        >
          {/* Big AQI number */}
          <div
            className="font-black tabular-nums leading-none"
            style={{
              fontSize: 68,
              color: th.heroBigClr,
              textShadow: isDarkMode ? `0 0 40px ${level.color}70` : `0 2px 12px ${level.color}40`,
            }}
          >
            {isNaN(aqi) ? '—' : aqi}
          </div>

          {/* Level badge */}
          <div
            className="px-4 py-1 rounded-full text-xs font-semibold"
            style={{
              background:  level.bgColor,
              border:      `1px solid ${level.borderColor}`,
              color:       th.badgeText,
            }}
          >
            {level.emoji} {level.label} · {level.labelTH}
          </div>

          {/* Description */}
          <p
            className="text-xs text-center leading-relaxed mt-1"
            style={{ maxWidth: 260, color: th.descText }}
          >
            {level.description}
          </p>

          {/* Dominant pollutant */}
          {last.AQI?.param && (
            <div className="flex items-center gap-1 text-[11px]" style={{ color: th.domText }}>
              <FiWind size={11} />
              ตัวชี้วัดหลัก:{' '}
              <strong style={{ color: th.badgeText }}>{last.AQI.param}</strong>
            </div>
          )}
        </div>

        {/* ── Pollutants ───────────────────────────── */}
        <div
          className="px-5 py-5 flex flex-col gap-3"
          style={{ borderBottom: `1px solid ${th.bodyBdr}` }}
        >
          <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: th.text3 }}>
            มลพิษทางอากาศ
          </h3>

          {POLLUTANTS.map((p) => {
            const raw   = last[p.key];
            const num   = parseFloat(raw?.value);
            const pct   = getPollutantPct(p.key, raw?.value);
            const color = getPollutantColor(p.key, raw?.value);

            return (
              <div key={p.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{p.icon}</span>
                    <span className="text-xs font-semibold" style={{ color: th.text2 }}>
                      {p.label}
                    </span>
                    <span className="text-[10px]" style={{ color: th.text3 }}>
                      {p.description}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold tabular-nums" style={{ color }}>
                      {isNaN(num) ? '—' : num.toFixed(1)}
                    </span>
                    <span className="text-[10px]" style={{ color: th.subtext }}>{p.unit}</span>
                  </div>
                </div>

                {/* Progress track */}
                <div
                  className="h-1.5 w-full rounded-full overflow-hidden"
                  style={{ background: th.trackBg }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color, boxShadow: `0 0 5px ${color}60` }}
                  />
                </div>
                <div className="text-right text-[9px] mt-0.5" style={{ color: th.subtext }}>
                  ค่ามาตรฐาน {p.safeMax} {p.unit}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Station metadata ────────────────────── */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: th.text3 }}>
            ข้อมูลสถานี
          </h3>

          <MetaRow icon={<FiMapPin size={12} />} label="ชื่อสถานี" th={th}>
            <p className="text-xs font-semibold" style={{ color: th.text2 }}>{station.nameTH}</p>
            <p className="text-[11px]" style={{ color: th.text3 }}>{station.nameEN}</p>
          </MetaRow>

          <MetaRow icon={<FiLayers size={12} />} label="จังหวัด / ประเภท" th={th}>
            <div className="flex items-center gap-2 flex-wrap">
              <Tag color="geekblue" style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>
                {station.areaTH}
              </Tag>
              <Tag style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>
                {station.stationType}
              </Tag>
            </div>
          </MetaRow>

          <MetaRow icon={<FiClock size={12} />} label="อัปเดตล่าสุด" th={th}>
            <p className="text-xs font-mono" style={{ color: th.text2 }}>
              {last.date} · {last.time}
            </p>
          </MetaRow>

          {station.lat && (
            <div
              className="px-3 py-2 rounded-lg"
              style={{ background: th.coordBg, border: `1px solid ${th.coordBdr}` }}
            >
              <p className="text-[10px] mb-1" style={{ color: th.subtext }}>พิกัด</p>
              <p className="text-xs font-mono" style={{ color: th.text2 }}>
                {parseFloat(station.lat).toFixed(4)}°N, {parseFloat(station.long).toFixed(4)}°E
              </p>
            </div>
          )}

          <p className="text-[10px] text-center mt-1" style={{ color: th.subtext }}>
            Station ID: <span className="font-mono">{station.stationID}</span> · Air4Thai PCD Thailand
          </p>
        </div>
      </div>
    </Drawer>
  );
}

function MetaRow({ icon, label, th, children }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex-shrink-0" style={{ color: th.text3 }}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: th.subtext }}>
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}
