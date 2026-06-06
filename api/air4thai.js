// Vercel serverless function — proxies Air4Thai API to bypass CORS
export default async function handler(req, res) {
  try {
    const response = await fetch(
      'http://air4thai.pcd.go.th/services/getNewAQI_JSON.php',
      {
        headers: {
          'User-Agent':  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
          'Accept':      'application/json, */*',
          'Referer':     'http://air4thai.pcd.go.th/',
        },
        signal: AbortSignal.timeout(25000),
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
