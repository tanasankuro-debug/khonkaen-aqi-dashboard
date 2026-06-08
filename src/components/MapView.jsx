import { useEffect, useRef, useState, useCallback } from 'react';
import { Map, MapStyle, config, Language, Popup } from '@maptiler/sdk';
import { WindLayer } from '@maptiler/weather';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { FiWind, FiNavigation, FiRefreshCw, FiMap, FiGlobe, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getAQILevel } from '../utils/aqiUtils';
import { useFirmsHotspots } from '../hooks/useFirmsHotspots';
import { useDraggable } from '../hooks/useDraggable';
import MapLegend from './MapLegend';
import ForecastPanel from './ForecastPanel';
import {
  getTemperatureColor, getPM25Color, getHeatColor,
  hotspots as localHotspots,
} from '../data/weatherData';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY || '';
config.apiKey = MAPTILER_KEY;
config.primaryLanguage = Language.THAI;

const KK_CENTER = [102.8236, 16.4322];

const KK_POLYGON = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [101.78, 16.98], [102.10, 17.02], [102.45, 17.08],
      [102.80, 17.05], [103.02, 16.92], [103.18, 16.68],
      [103.22, 16.42], [103.15, 16.10], [103.00, 15.85],
      [102.70, 15.72], [102.30, 15.75], [102.00, 15.88],
      [101.75, 16.08], [101.52, 16.28], [101.48, 16.58],
      [101.60, 16.80], [101.78, 16.98],
    ]],
  },
};

function resolveStyle(isDarkMode, mapType) {
  if (mapType === 'satellite') return MapStyle.HYBRID;
  return isDarkMode ? MapStyle.DARK : MapStyle.STREETS;
}

function dirLabel(deg) {
  const dirs = ['เหนือ', 'NE', 'ตะวันออก', 'SE', 'ใต้', 'SW', 'ตะวันตก', 'NW'];
  return dirs[Math.round(((deg % 360) + 360) / 45) % 8];
}
function windMeta(kmh) {
  if (kmh < 5)  return { color: '#64748b', label: 'สงบ' };
  if (kmh < 15) return { color: '#22c55e', label: 'อ่อน' };
  if (kmh < 25) return { color: '#eab308', label: 'ปานกลาง' };
  if (kmh < 40) return { color: '#f97316', label: 'แรง' };
  return               { color: '#ef4444', label: 'แรงมาก' };
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

function buildGeoJSON(stations, selectedStation) {
  return {
    type: 'FeatureCollection',
    features: stations.map(s => {
      const lat = parseFloat(s.lat);
      const lng = parseFloat(s.long);
      if (isNaN(lat) || isNaN(lng)) return null;
      const aqi   = parseInt(s.AQILast?.AQI?.aqi, 10);
      const level = getAQILevel(aqi);
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: {
          stationID:   s.stationID,
          isSelected:  selectedStation?.stationID === s.stationID ? 1 : 0,
          fillColor:   level.fillColor,
          strokeColor: level.color,
          aqiColor:    level.color,
          aqiLabel:    level.labelTH,
          nameTH:      s.nameTH  || '',
          areaTH:      s.areaTH  || '',
          aqi:         isNaN(aqi) ? -1 : aqi,
          pm25:        s.AQILast?.PM25?.value != null
                         ? parseFloat(s.AQILast.PM25.value)
                         : null,
        },
      };
    }).filter(Boolean),
  };
}

// FRP (Fire Radiative Power) → circle radius
function frpRadius(frp) {
  if (frp < 10)  return 4;
  if (frp < 50)  return 6;
  if (frp < 200) return 9;
  return 13;
}

function buildHotspotsGeoJSON(hotspots) {
  return {
    type: 'FeatureCollection',
    features: hotspots.map(h => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [h.lng, h.lat] },
      properties: {
        frp:     h.frp,
        radius:  frpRadius(h.frp),
        color:   h.conf === 'h' ? '#ef4444' : '#f97316',
        opacity: h.conf === 'h' ? 0.9 : h.conf === 'l' ? 0.5 : 0.72,
      },
    })),
  };
}

function buildTambonsGeoJSON(tambons) {
  return {
    type: 'FeatureCollection',
    features: (tambons || []).map(d => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
      properties: {
        id:          d.id,
        name:        d.name,
        temperature: d.temperature,
        pm25:        d.pm25,
        heatValue:   d.heatValue,
        humidity:    d.humidity,
        windSpeed:   d.windSpeed,
        tempColor:   getTemperatureColor(d.temperature),
        pm25Color:   getPM25Color(d.pm25),
        heatColor:   getHeatColor(d.heatValue),
      },
    })),
  };
}

function buildLocalHotspotsGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: (localHotspots || []).map(h => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [h.lng, h.lat] },
      properties: {
        id:          h.id,
        description: h.description,
        temperature: h.temperature,
        color:       h.intensity === 'extreme' ? '#ef4444' : '#f97316',
      },
    })),
  };
}

const TAMBON_LAYER_MAP = {
  temperature: ['layer-temperature'],
  pm25:        ['layer-pm25'],
  heat:        ['layer-heat'],
  hotspot:     ['layer-localhotspot-glow', 'layer-localhotspot-circle'],
  stream:      ['layer-stream'],
};

// ── Inner map (remounts on theme/mapType change) ─────────────────
function MapInstance({
  isDarkMode, mapType,
  stations, selectedStation, onSelectStation,
  showWind, windOpacity,
  hotspots, showHotspots,
  tambons, activeLayers, layerSettings, selectedDistrict, onDistrictClick, flyToTarget,
  selectedMonth,
}) {
  const containerRef    = useRef(null);
  const mapRef          = useRef(null);
  const mapLoadedRef    = useRef(false);
  const windLayerRef    = useRef(null);
  const streamLoadedRef = useRef(false);

  const stationsRef        = useRef(stations);
  const selectedRef        = useRef(selectedStation);
  const onSelectRef        = useRef(onSelectStation);
  const showWindRef        = useRef(showWind);
  const windOpacityRef     = useRef(windOpacity);
  const hotspotsRef        = useRef(hotspots);
  const showHotspotsRef    = useRef(showHotspots);
  const tambonsRef         = useRef(tambons);
  const activeLayersRef    = useRef(activeLayers);
  const layerSettingsRef   = useRef(layerSettings);
  const onDistrictClickRef = useRef(onDistrictClick);
  const selectedMonthRef   = useRef(selectedMonth);

  stationsRef.current        = stations;
  selectedRef.current        = selectedStation;
  onSelectRef.current        = onSelectStation;
  showWindRef.current        = showWind;
  windOpacityRef.current     = windOpacity;
  hotspotsRef.current        = hotspots;
  showHotspotsRef.current    = showHotspots;
  tambonsRef.current         = tambons;
  activeLayersRef.current    = activeLayers;
  layerSettingsRef.current   = layerSettings;
  onDistrictClickRef.current = onDistrictClick;
  selectedMonthRef.current   = selectedMonth;

  // ── Init map ─────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    if (!MAPTILER_KEY) {
      containerRef.current.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#0f172a;color:#f87171;font-family:sans-serif;font-size:14px;padding:24px;text-align:center">' +
        '<div><div style="font-size:32px;margin-bottom:12px">⚠️</div>' +
        '<b>VITE_MAPTILER_API_KEY ไม่ถูกตั้งค่า</b><br><br>' +
        'ไปที่ Vercel → Settings → Environment Variables<br>' +
        'แล้วเพิ่ม VITE_MAPTILER_API_KEY แล้ว Redeploy</div></div>';
      return;
    }
    let map;
    try {
      map = new Map({
        container: containerRef.current,
        style:     resolveStyle(isDarkMode, mapType),
        center:    KK_CENTER,
        zoom:      7,
        attributionControl: true,
        navigationControl:  true,
      });
    } catch (e) {
      console.error('Map init failed:', e);
      return;
    }
    mapRef.current = map;

    map.on('load', () => {
      mapLoadedRef.current = true;

      // 1. Wind layer
      const wl = new WindLayer({ opacity: windOpacityRef.current, density: 1.2, color: [255,255,255,160], size: 1.2, speed: 0.0008 });
      windLayerRef.current = wl;
      if (showWindRef.current) map.addLayer(wl);

      // 2. KK boundary
      map.addSource('kk-boundary', { type: 'geojson', data: KK_POLYGON });
      map.addLayer({ id: 'kk-fill',   type: 'fill', source: 'kk-boundary', paint: { 'fill-color': '#38bdf8', 'fill-opacity': 0.04 } });
      map.addLayer({ id: 'kk-border', type: 'line', source: 'kk-boundary', paint: { 'line-color': '#38bdf8', 'line-width': 1.5, 'line-dasharray': [4, 2] } });

      // 3. Road labels → KK province only
      try {
        map.getStyle().layers.forEach(layer => {
          if (layer.type !== 'symbol' || layer['source-layer'] !== 'transportation_name') return;
          const ex = map.getFilter(layer.id);
          const kk = ['within', KK_POLYGON];
          map.setFilter(layer.id, ex ? ['all', ex, kk] : kk);
        });
      } catch (_) {}

      // 4. NASA FIRMS hotspot circles
      map.addSource('hotspots', { type: 'geojson', data: buildHotspotsGeoJSON(hotspotsRef.current) });
      map.addLayer({
        id: 'hotspots-glow', type: 'circle', source: 'hotspots',
        layout: { visibility: showHotspotsRef.current ? 'visible' : 'none' },
        paint: {
          'circle-radius':   ['*', ['get', 'radius'], 2.2],
          'circle-color':    ['get', 'color'],
          'circle-opacity':  0.18,
          'circle-blur':     1,
        },
      });
      map.addLayer({
        id: 'hotspots-circle', type: 'circle', source: 'hotspots',
        layout: { visibility: showHotspotsRef.current ? 'visible' : 'none' },
        paint: {
          'circle-radius':       ['get', 'radius'],
          'circle-color':        ['get', 'color'],
          'circle-opacity':      ['get', 'opacity'],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff8',
        },
      });

      // 5. AQI station circles
      map.addSource('stations', { type: 'geojson', data: buildGeoJSON(stationsRef.current, selectedRef.current) });
      map.addLayer({ id: 'stations-halo', type: 'circle', source: 'stations',
        filter: ['==', ['get', 'isSelected'], 1],
        paint: { 'circle-radius': 20, 'circle-color': '#38bdf8', 'circle-opacity': 0.18 },
      });
      map.addLayer({ id: 'stations-circle', type: 'circle', source: 'stations',
        paint: {
          'circle-radius':       ['case', ['==', ['get', 'isSelected'], 1], 13, 9],
          'circle-color':        ['get', 'fillColor'],
          'circle-stroke-width': ['case', ['==', ['get', 'isSelected'], 1], 2.5, 1.5],
          'circle-stroke-color': ['case', ['==', ['get', 'isSelected'], 1], '#ffffff', ['get', 'strokeColor']],
          'circle-opacity':      ['case', ['==', ['get', 'isSelected'], 1], 1.0, 0.85],
        },
      });

      // 6. Tambon data layers (temperature / PM2.5 / heat / local hotspot)
      map.addSource('tambons', { type: 'geojson', data: buildTambonsGeoJSON(tambonsRef.current) });
      const circleStyle = (colorProp) => ({
        'circle-radius':         ['interpolate', ['linear'], ['zoom'], 8, 12, 13, 20],
        'circle-color':          ['get', colorProp],
        'circle-opacity':        0.82,
        'circle-stroke-width':   1.5,
        'circle-stroke-color':   '#ffffff',
        'circle-stroke-opacity': 0.7,
      });
      map.addLayer({ id: 'layer-temperature', type: 'circle', source: 'tambons', layout: { visibility: 'none' }, paint: circleStyle('tempColor') });
      map.addLayer({ id: 'layer-pm25',        type: 'circle', source: 'tambons', layout: { visibility: 'none' }, paint: circleStyle('pm25Color') });
      map.addLayer({ id: 'layer-heat',        type: 'circle', source: 'tambons', layout: { visibility: 'none' }, paint: circleStyle('heatColor') });

      map.addSource('local-hotspots', { type: 'geojson', data: buildLocalHotspotsGeoJSON() });
      map.addLayer({ id: 'layer-localhotspot-glow',   type: 'circle', source: 'local-hotspots', layout: { visibility: 'none' }, paint: { 'circle-radius': 24, 'circle-color': ['get', 'color'], 'circle-opacity': 0.20, 'circle-blur': 1 } });
      map.addLayer({ id: 'layer-localhotspot-circle', type: 'circle', source: 'local-hotspots', layout: { visibility: 'none' }, paint: { 'circle-radius': 11, 'circle-color': ['get', 'color'], 'circle-opacity': 0.90, 'circle-stroke-width': 1.5, 'circle-stroke-color': '#ffffff' } });

      // 7. Stream (waterway) line layer
      map.addSource('stream-data', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'layer-stream', type: 'line', source: 'stream-data',
        layout: { visibility: 'none', 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#38bdf8', 'line-width': 2, 'line-opacity': 0.85 },
      });

      // Tambon popups + clicks
      {
        let tamPop = null;
        const TLAYERS = [
          { id: 'layer-temperature', colorProp: 'tempColor', valueFn: p => `อุณหภูมิ: <b>${p.temperature}°C</b>` },
          { id: 'layer-pm25',        colorProp: 'pm25Color', valueFn: p => `PM2.5: <b>${p.pm25} µg/m³</b>` },
          { id: 'layer-heat',        colorProp: 'heatColor', valueFn: p => `ความร้อนสะสม: <b>${Math.round(p.heatValue * 100)}%</b>` },
        ];
        const bg  = isDarkMode ? '#0f172a' : '#ffffff';
        const bdr = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        const t1  = isDarkMode ? '#f1f5f9' : '#0f172a';
        const t2  = isDarkMode ? '#94a3b8' : '#64748b';

        TLAYERS.forEach(({ id, colorProp, valueFn }) => {
          map.on('mouseenter', id, (e) => {
            if (!map.getLayoutProperty(id, 'visibility') === 'visible') return;
            map.getCanvas().style.cursor = 'pointer';
            const p = e.features[0].properties;
            const c = p[colorProp];
            tamPop?.remove();
            tamPop = new Popup({ closeButton: false, offset: 14 })
              .setLngLat(e.features[0].geometry.coordinates.slice())
              .setHTML(`<div style="background:${bg};border:1px solid ${bdr};border-radius:10px;padding:10px 14px;font-family:Inter,sans-serif">
                <p style="color:${t1};font-weight:700;font-size:13px;margin:0">ต.${p.name}</p>
                <p style="color:${c};font-size:12px;margin:4px 0 0">${valueFn(p)}</p>
                <p style="color:${t2};font-size:10px;margin:3px 0 0">💧 ${p.humidity}% &nbsp;🌬️ ${p.windSpeed} km/h</p>
              </div>`)
              .addTo(map);
          });
          map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; tamPop?.remove(); tamPop = null; });
          map.on('click', id, (e) => {
            if (!e.features?.length) return;
            const props = e.features[0].properties;
            const tambon = tambonsRef.current?.find(t => t.id === props.id);
            if (tambon) onDistrictClickRef.current?.(tambon);
          });
        });

        // Local hotspot popup
        let hsPop2 = null;
        map.on('mouseenter', 'layer-localhotspot-circle', (e) => {
          map.getCanvas().style.cursor = 'pointer';
          const p = e.features[0].properties;
          hsPop2?.remove();
          hsPop2 = new Popup({ closeButton: false, offset: 14 })
            .setLngLat(e.features[0].geometry.coordinates.slice())
            .setHTML(`<div style="background:${bg};border:1px solid ${bdr};border-radius:10px;padding:10px 14px;font-family:Inter,sans-serif">
              <p style="color:#ef4444;font-weight:700;font-size:13px;margin:0">🔥 ${p.description}</p>
              <p style="color:#f97316;font-size:12px;margin:4px 0 0">อุณหภูมิ: <b>${p.temperature}°C</b></p>
            </div>`)
            .addTo(map);
        });
        map.on('mouseleave', 'layer-localhotspot-circle', () => { map.getCanvas().style.cursor = ''; hsPop2?.remove(); hsPop2 = null; });
      }

      // 7. Hotspot hover popup
      let hsPop = null;
      map.on('mouseenter', 'hotspots-circle', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const p = e.features[0].properties;
        const tipBg  = isDarkMode ? '#0f172a' : '#ffffff';
        const tipBdr = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        const tipT1  = isDarkMode ? '#f1f5f9' : '#0f172a';
        const tipT2  = isDarkMode ? '#94a3b8' : '#64748b';
        hsPop = new Popup({ closeButton: false, offset: 12 })
          .setLngLat(e.features[0].geometry.coordinates.slice())
          .setHTML(`<div style="background:${tipBg};border:1px solid ${tipBdr};border-radius:8px;padding:8px 12px;font-family:Inter,sans-serif">
            <p style="color:${tipT1};font-weight:700;font-size:12px;margin:0">🔥 จุดความร้อน</p>
            <p style="color:${tipT2};font-size:11px;margin:3px 0 0">FRP: <b style="color:#f97316">${p.frp?.toFixed(1)} MW</b></p>
            <p style="color:${tipT2};font-size:10px;margin:2px 0 0">ความเชื่อมั่น: ${p.opacity > 0.8 ? 'สูง' : p.opacity < 0.6 ? 'ต่ำ' : 'ปานกลาง'}</p>
          </div>`)
          .addTo(map);
      });
      map.on('mouseleave', 'hotspots-circle', () => { map.getCanvas().style.cursor = ''; hsPop?.remove(); hsPop = null; });

      // 7. AQI station hover popup
      let hoverPopup = null;
      const tipBg  = isDarkMode ? '#0f172a' : '#ffffff';
      const tipBdr = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
      const tipT1  = isDarkMode ? '#f1f5f9' : '#0f172a';
      const tipT2  = isDarkMode ? '#94a3b8' : '#64748b';

      map.on('mouseenter', 'stations-circle', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const p      = e.features[0].properties;
        const coords = e.features[0].geometry.coordinates.slice();
        const aqiTxt = p.aqi < 0 ? '—' : p.aqi;
        const pm25Row = p.pm25 != null
          ? `<p style="color:${tipT2};font-size:10px;margin:4px 0 0;border-top:1px solid ${tipBdr};padding-top:4px">PM2.5 · ${parseFloat(p.pm25).toFixed(1)} μg/m³</p>`
          : '';
        hoverPopup = new Popup({ closeButton: false, offset: 14, maxWidth: '240px' })
          .setLngLat(coords)
          .setHTML(`<div style="background:${tipBg};border:1px solid ${tipBdr};border-radius:10px;padding:10px 14px;min-width:160px;font-family:Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,${isDarkMode ? '.5' : '.12'})">
            <p style="color:${tipT1};font-weight:700;font-size:13px;margin:0;line-height:1.4">${p.nameTH}</p>
            ${p.areaTH ? `<p style="color:${tipT2};font-size:11px;margin:2px 0 6px">${p.areaTH}</p>` : ''}
            <div style="display:flex;align-items:baseline;gap:6px">
              <span style="color:${p.aqiColor};font-weight:800;font-size:26px;line-height:1">${aqiTxt}</span>
              <div>
                <div style="color:${p.aqiColor};font-size:11px;font-weight:600">AQI</div>
                <div style="color:${p.aqiColor};font-size:10px">${p.aqiLabel}</div>
              </div>
            </div>${pm25Row}
          </div>`)
          .addTo(map);
      });
      map.on('mouseleave', 'stations-circle', () => { map.getCanvas().style.cursor = ''; hoverPopup?.remove(); hoverPopup = null; });
      map.on('click', 'stations-circle', (e) => {
        if (!e.features?.length) return;
        const station = stationsRef.current.find(s => s.stationID === e.features[0].properties.stationID);
        if (station) onSelectRef.current(station);
      });
    });

    return () => { mapLoadedRef.current = false; map?.remove(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync AQI stations ────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => { const src = map.getSource('stations'); if (src) src.setData(buildGeoJSON(stations, selectedStation)); };
    mapLoadedRef.current ? update() : map.once('load', update);
  }, [stations, selectedStation]);

  // ── Sync hotspots ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => { const src = map.getSource('hotspots'); if (src) src.setData(buildHotspotsGeoJSON(hotspots)); };
    mapLoadedRef.current ? update() : map.once('load', update);
  }, [hotspots]);

  // ── FlyTo ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedStation) return;
    const lat = parseFloat(selectedStation.lat);
    const lng = parseFloat(selectedStation.long);
    if (!isNaN(lat) && !isNaN(lng))
      map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 11), duration: 1200 });
  }, [selectedStation]);

  // ── Toggle wind ──────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    if (showWind) {
      if (!windLayerRef.current || !map.getLayer(windLayerRef.current.id)) {
        const newWl = new WindLayer({ opacity: windOpacityRef.current, density: 1.2, color: [255,255,255,160], size: 1.2, speed: 0.0008 });
        windLayerRef.current = newWl;
        map.addLayer(newWl, 'hotspots-glow');
      }
    } else {
      const wl = windLayerRef.current;
      if (wl && map.getLayer(wl.id)) map.removeLayer(wl.id);
    }
  }, [showWind]);

  // ── Live opacity ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const wl  = windLayerRef.current;
    if (!map || !wl || !mapLoadedRef.current) return;
    if (map.getLayer(wl.id)) wl.setOpacity(windOpacity);
  }, [windOpacity]);

  // ── Toggle hotspot visibility ────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    const vis = showHotspots ? 'visible' : 'none';
    ['hotspots-glow', 'hotspots-circle'].forEach(id => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis);
    });
  }, [showHotspots]);

  // ── Sync tambon data ────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => { const src = map.getSource('tambons'); if (src) src.setData(buildTambonsGeoJSON(tambons)); };
    mapLoadedRef.current ? update() : map.once('load', update);
  }, [tambons]);

  // ── Toggle layer visibility ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    Object.entries(TAMBON_LAYER_MAP).forEach(([key, ids]) => {
      const vis = activeLayers?.has(key) ? 'visible' : 'none';
      ids.forEach(id => { if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis); });
    });
  }, [activeLayers]);

  // ── Sync opacity per layer ───────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    [['temperature', 'layer-temperature'], ['pm25', 'layer-pm25'], ['heat', 'layer-heat']].forEach(([key, id]) => {
      const s = layerSettings?.[key];
      if (!s || !map.getLayer(id)) return;
      const isOn = activeLayers?.has(key);
      map.setLayoutProperty(id, 'visibility', isOn && s.visible ? 'visible' : 'none');
      map.setPaintProperty(id, 'circle-opacity', (s.opacity ?? 0.75) * 0.9);
    });
    const sStream = layerSettings?.stream;
    if (sStream && map.getLayer('layer-stream') && activeLayers?.has('stream')) {
      map.setPaintProperty('layer-stream', 'line-opacity', sStream.opacity ?? 0.85);
    }
  }, [layerSettings, activeLayers]);

  // ── Fetch stream GeoJSON when layer activated ────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const doFetch = () => {
      if (!activeLayersRef.current?.has('stream')) return;
      if (streamLoadedRef.current) return;
      fetch('/geo.geojson')
        .then(r => r.json())
        .then(data => {
          streamLoadedRef.current = true;
          mapRef.current?.getSource('stream-data')?.setData(data);
        })
        .catch(err => console.error('stream fetch:', err));
    };
    mapLoadedRef.current ? doFetch() : map.once('load', doFetch);
  }, [activeLayers]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── NASA MODIS monthly temperature raster ────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    const isActive = activeLayers?.has('monthly_temp');
    const s = layerSettings?.monthly_temp ?? { visible: true, opacity: 0.80 };

    if (map.getLayer('layer-monthly-temp')) map.removeLayer('layer-monthly-temp');
    if (map.getSource('modis-raster'))      map.removeSource('modis-raster');

    if (!isActive || !selectedMonth || !s.visible) return;

    map.addSource('modis-raster', {
      type: 'raster',
      tiles: [
        `https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&BBOX={bbox-epsg-3857}&SRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=MODIS_Terra_L3_Land_Surface_Temp_Monthly_Day&FORMAT=image/png&TRANSPARENT=TRUE&TIME=${selectedMonth}-01T00:00:00Z`,
      ],
      tileSize: 256,
      attribution: '© NASA GIBS',
    });
    map.addLayer({
      id: 'layer-monthly-temp', type: 'raster', source: 'modis-raster',
      paint: { 'raster-opacity': s.opacity ?? 0.80 },
    }, 'kk-fill');
  }, [activeLayers, selectedMonth, layerSettings?.monthly_temp?.visible, layerSettings?.monthly_temp?.opacity]);

  // ── FlyTo from Sidebar search ────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToTarget) return;
    const do_fly = () => map.flyTo({ center: [flyToTarget.lng, flyToTarget.lat], zoom: Math.max(map.getZoom(), 12), duration: 1200 });
    mapLoadedRef.current ? do_fly() : map.once('load', do_fly);
  }, [flyToTarget?.ts]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Highlight selected district ──────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    const selId = selectedDistrict?.id ?? -1;
    ['layer-temperature', 'layer-pm25', 'layer-heat'].forEach(id => {
      if (!map.getLayer(id)) return;
      map.setPaintProperty(id, 'circle-radius', ['case', ['==', ['get', 'id'], selId],
        24,
        ['interpolate', ['linear'], ['zoom'], 8, 12, 13, 20],
      ]);
      map.setPaintProperty(id, 'circle-stroke-width', ['case', ['==', ['get', 'id'], selId], 3, 1.5]);
    });
  }, [selectedDistrict]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

// ── Main export ─────────────────────────────────────────────────
export default function MapView({
  stations, selectedStation, onSelectStation, isDarkMode,
  activeLayers, tambons, layerSettings, selectedDistrict, onDistrictClick, flyToTarget,
  selectedMonth,
}) {
  const [wind,          setWind]          = useState(null);
  const [showWind,      setShowWind]      = useState(true);
  const [windLoading,   setWindLoading]   = useState(true);
  const [windOpacity,   setWindOpacity]   = useState(0.65);
  const [windCardOpen,  setWindCardOpen]  = useState(true);
  const [mapType,       setMapType]       = useState('streets');
  const [showHotspots,  setShowHotspots]  = useState(true);

  const { hotspots, loading: hsLoading, error: hsError, hasKey, refresh: hsRefresh } =
    useFirmsHotspots();

  const { offset: windOffset, dragHandleProps: windDrag } =
    useDraggable({ onToggle: () => setWindCardOpen(v => !v) });

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

  const th = isDarkMode
    ? { text1: '#f1f5f9', text2: '#94a3b8', text3: '#475569', bdr: 'rgba(255,255,255,0.10)', activeBg: 'rgba(56,189,248,0.15)', trackBg: 'rgba(255,255,255,0.12)' }
    : { text1: '#0f172a', text2: '#475569', text3: '#94a3b8', bdr: 'rgba(0,0,0,0.08)',       activeBg: 'rgba(56,189,248,0.12)', trackBg: 'rgba(0,0,0,0.06)' };

  const speed = wind?.wind_speed_10m    ?? 0;
  const dir   = wind?.wind_direction_10m ?? 0;
  const gusts = wind?.wind_gusts_10m    ?? 0;
  const wm    = windMeta(speed);

  const hsCount   = hotspots.length;
  const hsCountTH = hotspots.filter(h => h.lat >= 5.6 && h.lat <= 20.5 && h.lng >= 97.5 && h.lng <= 105.7).length;

  return (
    <div className="relative w-full h-full">
      <MapInstance
        key={`${isDarkMode ? 'dark' : 'light'}-${mapType}`}
        isDarkMode={isDarkMode}
        mapType={mapType}
        stations={stations}
        selectedStation={selectedStation}
        onSelectStation={onSelectStation}
        showWind={showWind}
        windOpacity={windOpacity}
        hotspots={hotspots}
        showHotspots={showHotspots}
        tambons={tambons}
        activeLayers={activeLayers}
        layerSettings={layerSettings}
        selectedDistrict={selectedDistrict}
        onDistrictClick={onDistrictClick}
        flyToTarget={flyToTarget}
        selectedMonth={selectedMonth}
      />

      {/* ── AQI Legend ──────────────────────────────── */}
      <MapLegend isDarkMode={isDarkMode} />

      {/* ── PM2.5 Forecast Panel ─────────────────────── */}
      <ForecastPanel isDarkMode={isDarkMode} />

      {/* ── Left controls ─────────────────────────────── */}
      <div className="absolute bottom-10 left-3 z-[1000] flex flex-col gap-2">

        {/* Map type switcher */}
        <div className="glass rounded-2xl p-1.5 flex gap-1">
          {[
            { value: 'streets',   icon: <FiMap size={16} />,   label: 'แผนที่' },
            { value: 'satellite', icon: <FiGlobe size={16} />, label: 'ดาวเทียม' },
          ].map(opt => {
            const active = mapType === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setMapType(opt.value)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{
                  color:      active ? '#38bdf8' : th.text3,
                  background: active ? th.activeBg : 'transparent',
                  border:     active ? '1px solid rgba(56,189,248,0.4)' : '1px solid transparent',
                  minWidth:   72, justifyContent: 'center',
                }}
              >
                {opt.icon}<span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Hotspot toggle */}
        <button
          onClick={() => { if (hasKey) setShowHotspots(v => !v); }}
          disabled={!hasKey}
          className="glass rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50"
          style={{
            color:      !hasKey ? th.text3 : showHotspots ? '#f97316' : th.text3,
            background: showHotspots && hasKey ? 'rgba(249,115,22,0.10)' : 'transparent',
            border:     showHotspots && hasKey ? '1px solid rgba(249,115,22,0.3)' : '1px solid transparent',
          }}
          title={!hasKey ? 'ต้องการ NASA FIRMS API Key (ฟรี)' : ''}
        >
          <span style={{ fontSize: 15 }}>🔥</span>
          <span>จุดความร้อน</span>
          {hasKey && !hsLoading && hsCount > 0 && (
            <span
              className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}
            >
              {hsCountTH} จุด
            </span>
          )}
          {hasKey && hsLoading && (
            <div className="ml-auto w-3 h-3 border-2 rounded-full spin"
              style={{ borderColor: '#f97316', borderTopColor: 'transparent' }} />
          )}
          {!hasKey && (
            <span className="ml-auto text-[10px]" style={{ color: th.text3 }}>ต้องการ Key</span>
          )}
        </button>

      </div>

      {/* ── Wind card — right side (below nav controls) ── */}
      <div className="absolute z-[1000]" style={{ top: 120, right: 12, transform: `translate(${windOffset.x}px, ${windOffset.y}px)` }}>
        <div className="relative">

          {/* Blue handle — auto-height, protrudes LEFT, drag+toggle */}
          <button
            {...windDrag}
            title={windCardOpen ? 'ซ่อนข้อมูลลม' : 'แสดงข้อมูลลม'}
            className="absolute right-full top-0 bottom-0 z-20
                       w-6 rounded-l-xl
                       flex flex-col items-center justify-center gap-[3px]
                       hover:brightness-110 active:scale-95 transition-all duration-150"
            style={{
              ...windDrag.style,
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
              {windCardOpen
                ? <FiChevronRight size={13} strokeWidth={2.5} />
                : <FiChevronLeft  size={13} strokeWidth={2.5} />}
            </span>
          </button>

          {/* Card */}
          <div
            className="glass rounded-2xl p-3 flex flex-col gap-2.5"
            style={{ minWidth: windCardOpen ? 220 : 'auto', color: th.text2 }}
          >
            {/* Header row — always visible */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWind(v => !v)}
                className="flex items-center gap-1.5 font-semibold text-sm"
                style={{ color: showWind ? '#38bdf8' : th.text3 }}
              >
                <FiWind size={15} />
                {windCardOpen && <span>กระแสลม</span>}
              </button>

              {/* Speed pill — compact when collapsed, full when open */}
              {wind && !windLoading && windCardOpen && (
                <div className="flex items-center gap-1.5 text-xs border-l pl-2 flex-1 min-w-0" style={{ borderColor: th.bdr }}>
                  <FiNavigation size={11} style={{ color: wm.color, flexShrink: 0 }} />
                  <span className="font-bold" style={{ color: wm.color }}>{speed.toFixed(1)}</span>
                  <span className="text-[11px]">km/h</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md ml-auto"
                    style={{ background: wm.color + '25', color: wm.color, whiteSpace: 'nowrap' }}>
                    {wm.label}
                  </span>
                </div>
              )}
              {wind && !windLoading && !windCardOpen && (
                <span className="text-xs font-bold tabular-nums" style={{ color: wm.color }}>
                  {speed.toFixed(0)}
                </span>
              )}

              <button
                onClick={loadWind}
                disabled={windLoading}
                className="disabled:opacity-40 flex-shrink-0"
                style={{ color: th.text3 }}
              >
                <FiRefreshCw size={12} className={windLoading ? 'spin' : ''} />
              </button>
            </div>

            {/* Direction + gusts — only when expanded */}
            {windCardOpen && wind && !windLoading && (
              <div className="flex items-center gap-2 text-xs" style={{ color: th.text3 }}>
                <span>ทิศ{dirLabel(dir)} ({dir.toFixed(0)}°)</span>
                {gusts > speed + 3 && (
                  <span className="ml-auto" style={{ color: '#f97316' }}>
                    กระโชก {gusts.toFixed(0)} km/h
                  </span>
                )}
              </div>
            )}

            {/* Opacity slider — only when expanded and wind on */}
            {windCardOpen && showWind && (
              <div className="flex items-center gap-2 text-xs pt-2 border-t" style={{ borderColor: th.bdr }}>
                <span style={{ color: th.text3, whiteSpace: 'nowrap' }}>ความเข้ม</span>
                <input
                  type="range" min="0" max="1" step="0.05" value={windOpacity}
                  onChange={e => setWindOpacity(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    accentColor: '#38bdf8',
                    background: `linear-gradient(to right, #38bdf8 ${windOpacity*100}%, ${th.trackBg} ${windOpacity*100}%)`,
                  }}
                />
                <span className="font-mono text-[11px] w-8 text-right flex-shrink-0" style={{ color: '#38bdf8' }}>
                  {Math.round(windOpacity * 100)}%
                </span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Loading overlay */}
      {stations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-[999] pointer-events-none">
          <div className="glass rounded-2xl px-6 py-4 flex items-center gap-3">
            <div className="w-4 h-4 border-2 rounded-full spin" style={{ borderColor: '#38bdf8', borderTopColor: 'transparent' }} />
            <span className="text-sm" style={{ color: 'var(--t-text2)' }}>กำลังโหลดข้อมูลสถานี...</span>
          </div>
        </div>
      )}
    </div>
  );
}
