import { useState, useEffect, useCallback } from 'react';

// Thailand + Laos + Myanmar border area (where fires that affect KK air originate)
const AREA      = '97,12,107,22'; // W,S,E,N
const DAY_RANGE = 1;               // last 24 hours

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const idx     = (key) => headers.indexOf(key);

  return lines.slice(1).map(line => {
    const cols = line.split(',');
    const lat  = parseFloat(cols[idx('latitude')]);
    const lng  = parseFloat(cols[idx('longitude')]);
    const frp  = parseFloat(cols[idx('frp')]) || 1;
    const conf = (cols[idx('confidence')] || 'n').trim().toLowerCase();
    const type = parseInt(cols[idx('type')]) || 0;

    if (isNaN(lat) || isNaN(lng)) return null;
    if (type === 1) return null; // skip volcanoes

    return { lat, lng, frp, conf };
  }).filter(Boolean);
}

export function useFirmsHotspots() {
  const [hotspots, setHotspots] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const firmsKey = import.meta.env.VITE_NASA_FIRMS_KEY;
  const hasKey   = Boolean(firmsKey && firmsKey.trim().length > 0);

  const load = useCallback(async () => {
    if (!hasKey) { setError('NO_KEY'); return; }

    setLoading(true);
    setError(null);
    try {
      // /api/firms → Vercel function (prod) or Vite proxy (dev)
      const url = `/api/firms`;
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setHotspots(parseCSV(text));
    } catch (e) {
      setError(e.message);
      setHotspots([]);
    } finally {
      setLoading(false);
    }
  }, [hasKey, firmsKey]);

  useEffect(() => {
    load();
    // VIIRS NRT data updates every ~3 hours
    const id = setInterval(load, 3 * 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  return { hotspots, loading, error, hasKey, refresh: load };
}
