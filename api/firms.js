// Vercel serverless function — proxies NASA FIRMS API to bypass CORS
export default async function handler(req, res) {
  const firmsKey = process.env.VITE_NASA_FIRMS_KEY;
  if (!firmsKey) {
    return res.status(400).json({ error: 'VITE_NASA_FIRMS_KEY not set in Vercel environment' });
  }

  const AREA      = '97,12,107,22';
  const DAY_RANGE = 1;
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${firmsKey}/VIIRS_SNPP_NRT/${AREA}/${DAY_RANGE}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Cache-Control', 's-maxage=10800, stale-while-revalidate');
    return res.send(text);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
