import { useState, useEffect, useCallback, useRef } from "react";
import { MOCK_DATA } from "../data/mockData";

const STATION_ID = "46t";
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// CORS proxies to try in order
const PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
];

const AIR4THAI_URL =
  `http://air4thai.pcd.go.th/services/getNewAQI_JSON.php?stationID=${STATION_ID}`;

async function tryFetch(url) {
  // Try direct first (works in some environments)
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (_) {/* CORS or network, fall through */}

  // Try each proxy
  for (const buildProxy of PROXIES) {
    try {
      const proxyUrl = buildProxy(url);
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const raw = await res.json();
      // allorigins wraps in { contents: "..." }
      if (typeof raw.contents === "string") return JSON.parse(raw.contents);
      return raw;
    } catch (_) {/* try next proxy */}
  }

  throw new Error("All proxies failed");
}

function parseStation(json) {
  // Air4Thai returns { stations: [...] } or { data: [...] } depending on endpoint
  const stations = json?.stations || json?.data || (Array.isArray(json) ? json : null);
  if (stations?.length) return stations[0];
  // Single station response
  if (json?.stationID || json?.AQILast) return json;
  return null;
}

export function useAirQuality() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [useMock, setUseMock] = useState(false);
  const timerRef = useRef(null);

  const fetchData = useCallback(async (forceMock = false) => {
    setLoading(true);
    setError(null);

    if (forceMock) {
      await new Promise((r) => setTimeout(r, 600));
      setData(MOCK_DATA);
      setLastUpdated(new Date());
      setUseMock(true);
      setLoading(false);
      return;
    }

    try {
      const json = await tryFetch(AIR4THAI_URL);
      const station = parseStation(json);
      if (!station) throw new Error("Unexpected API response structure");
      setData(station);
      setLastUpdated(new Date());
      setUseMock(false);
    } catch (err) {
      console.warn("Live API failed, falling back to mock data:", err.message);
      setData(MOCK_DATA);
      setLastUpdated(new Date());
      setUseMock(true);
      setError("Live data unavailable — showing demo data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh
  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(() => fetchData(), REFRESH_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [fetchData]);

  const refresh = useCallback(() => {
    clearInterval(timerRef.current);
    fetchData(useMock);
    timerRef.current = setInterval(() => fetchData(useMock), REFRESH_INTERVAL);
  }, [fetchData, useMock]);

  const toggleMock = useCallback(() => {
    const next = !useMock;
    clearInterval(timerRef.current);
    fetchData(next);
    timerRef.current = setInterval(() => fetchData(next), REFRESH_INTERVAL);
  }, [fetchData, useMock]);

  return { data, loading, error, lastUpdated, useMock, refresh, toggleMock };
}
