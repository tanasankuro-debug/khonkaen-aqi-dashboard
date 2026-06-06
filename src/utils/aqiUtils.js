// Thailand PCD official AQI thresholds
export const AQI_LEVELS = [
  {
    id: 'verygood', min: 0,   max: 25,
    label: 'Very Good',  labelTH: 'ดีมาก',
    color: '#3B82F6', fillColor: '#3B82F6',
    bgColor: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.4)',
    textColor: '#93C5FD', darkTextColor: '#1D4ED8',
    emoji: '😊',
    description: 'คุณภาพอากาศดีมาก เหมาะสำหรับกิจกรรมกลางแจ้ง',
  },
  {
    id: 'good', min: 26, max: 50,
    label: 'Good',       labelTH: 'ดี',
    color: '#22C55E', fillColor: '#22C55E',
    bgColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.4)',
    textColor: '#86EFAC', darkTextColor: '#15803D',
    emoji: '🙂',
    description: 'คุณภาพอากาศดี เหมาะสำหรับกิจกรรมกลางแจ้งทั่วไป',
  },
  {
    id: 'moderate', min: 51, max: 100,
    label: 'Moderate',   labelTH: 'ปานกลาง',
    color: '#EAB308', fillColor: '#EAB308',
    bgColor: 'rgba(234,179,8,0.15)', borderColor: 'rgba(234,179,8,0.4)',
    textColor: '#FDE047', darkTextColor: '#A16207',
    emoji: '😐',
    description: 'ผู้มีโรคประจำตัวควรลดกิจกรรมกลางแจ้ง',
  },
  {
    id: 'unhealthy', min: 101, max: 200,
    label: 'Unhealthy',  labelTH: 'มีผลกระทบต่อสุขภาพ',
    color: '#F97316', fillColor: '#F97316',
    bgColor: 'rgba(249,115,22,0.15)', borderColor: 'rgba(249,115,22,0.4)',
    textColor: '#FDBA74', darkTextColor: '#C2410C',
    emoji: '😷',
    description: 'ทุกคนอาจได้รับผลกระทบต่อสุขภาพ',
  },
  {
    id: 'very_unhealthy', min: 201, max: 9999,
    label: 'Very Unhealthy', labelTH: 'มีผลกระทบต่อสุขภาพมาก',
    color: '#EF4444', fillColor: '#EF4444',
    bgColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)',
    textColor: '#FCA5A5', darkTextColor: '#B91C1C',
    emoji: '⚠️',
    description: 'ทุกคนควรหลีกเลี่ยงกิจกรรมกลางแจ้ง',
  },
];

export function getAQILevel(aqi) {
  const v = parseInt(aqi, 10);
  if (isNaN(v) || v < 0) return AQI_LEVELS[0];
  return AQI_LEVELS.find((l) => v >= l.min && v <= l.max) ?? AQI_LEVELS[4];
}

export const POLLUTANTS = [
  { key: 'PM25', label: 'PM2.5', unit: 'μg/m³', safeMax: 50,  icon: '💨', description: 'Fine Particulate Matter' },
  { key: 'PM10', label: 'PM10',  unit: 'μg/m³', safeMax: 100, icon: '🌫️', description: 'Coarse Particulate Matter' },
  { key: 'O3',   label: 'O₃',   unit: 'ppb',   safeMax: 70,  icon: '☁️', description: 'Ozone' },
  { key: 'CO',   label: 'CO',   unit: 'ppm',   safeMax: 9.4, icon: '🏭', description: 'Carbon Monoxide' },
  { key: 'NO2',  label: 'NO₂',  unit: 'ppb',   safeMax: 100, icon: '🚗', description: 'Nitrogen Dioxide' },
  { key: 'SO2',  label: 'SO₂',  unit: 'ppb',   safeMax: 75,  icon: '⚗️', description: 'Sulfur Dioxide' },
];

export function getPollutantPct(key, value) {
  const p = POLLUTANTS.find((x) => x.key === key);
  if (!p) return 0;
  const v = parseFloat(value);
  if (isNaN(v)) return 0;
  return Math.min(100, Math.round((v / (p.safeMax * 2)) * 100));
}

export function getPollutantColor(key, value) {
  const p = POLLUTANTS.find((x) => x.key === key);
  if (!p) return AQI_LEVELS[1].color;
  const v = parseFloat(value);
  if (isNaN(v)) return AQI_LEVELS[0].color;
  const pct = v / p.safeMax;
  if (pct <= 0.5) return AQI_LEVELS[1].color;
  if (pct <= 1.0) return AQI_LEVELS[2].color;
  if (pct <= 2.0) return AQI_LEVELS[3].color;
  return AQI_LEVELS[4].color;
}

// Stat summary for TopBar
export function getAQISummary(stations) {
  const counts = { verygood: 0, good: 0, moderate: 0, unhealthy: 0, very_unhealthy: 0, nodata: 0 };
  stations.forEach((s) => {
    const aqi = parseInt(s.AQILast?.AQI?.aqi, 10);
    if (isNaN(aqi)) { counts.nodata++; return; }
    const level = getAQILevel(aqi);
    counts[level.id]++;
  });
  return counts;
}
