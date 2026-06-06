import { useState, useEffect, useCallback, useRef } from 'react';
import { MOCK_DATA } from '../data/mockData';

const API_URL = '/api/air4thai/services/getNewAQI_JSON.php';
const REFRESH_MS = 5 * 60 * 1000;

async function fetchStations() {
  const res = await fetch(API_URL, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const stations = json?.stations ?? json?.data ?? (Array.isArray(json) ? json : null);
  if (!stations?.length) throw new Error('No stations in response');
  return stations;
}

export function useAirQualityMap() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [useMock, setUseMock]   = useState(false);
  const timerRef = useRef(null);

  const load = useCallback(async (forceMock = false) => {
    setLoading(true);
    setError(null);
    if (forceMock) {
      await new Promise((r) => setTimeout(r, 400));
      setStations(MOCK_DATA.stations);
      setLastUpdated(new Date());
      setUseMock(true);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchStations();
      setStations(data);
      setLastUpdated(new Date());
      setUseMock(false);
    } catch (err) {
      console.warn('API failed, using mock:', err.message);
      setStations(MOCK_DATA.stations);
      setLastUpdated(new Date());
      setUseMock(true);
      setError('ไม่สามารถเชื่อมต่อ Air4Thai API ได้ — แสดงข้อมูลตัวอย่าง');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    timerRef.current = setInterval(() => load(useMock), REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    clearInterval(timerRef.current);
    load(useMock);
    timerRef.current = setInterval(() => load(useMock), REFRESH_MS);
  }, [load, useMock]);

  const toggleMock = useCallback(() => {
    const next = !useMock;
    clearInterval(timerRef.current);
    load(next);
    timerRef.current = setInterval(() => load(next), REFRESH_MS);
  }, [load, useMock]);

  return { stations, loading, error, lastUpdated, useMock, refresh, toggleMock };
}
