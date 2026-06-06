import { useState, useEffect, useCallback } from 'react';

const FORECAST_URL =
  'https://air-quality-api.open-meteo.com/v1/air-quality' +
  '?latitude=16.44&longitude=102.82' +
  '&hourly=pm2_5,dust' +
  '&timezone=Asia%2FBangkok' +
  '&forecast_days=2';

export function usePM25Forecast() {
  const [forecast, setForecast] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(FORECAST_URL, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const times = json.hourly.time;   // "YYYY-MM-DDTHH:00"
      const pm25s = json.hourly.pm2_5;

      // Find current hour index
      const now         = new Date();
      const padded      = (n) => String(n).padStart(2, '0');
      const currentKey  = `${now.getFullYear()}-${padded(now.getMonth()+1)}-${padded(now.getDate())}T${padded(now.getHours())}:00`;
      let startIdx      = times.findIndex(t => t === currentKey);
      if (startIdx < 0) startIdx = 0;

      // 24 hours from now
      const slice = times.slice(startIdx, startIdx + 24).map((t, i) => ({
        time:  new Date(t),
        pm25:  pm25s[startIdx + i] ?? null,
        isCurrent: i === 0,
      }));

      setForecast(slice);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60 * 60 * 1000); // refresh every hour
    return () => clearInterval(id);
  }, [load]);

  return { forecast, loading, error, refresh: load };
}
