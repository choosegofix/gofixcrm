/**
 * Free geocoding via OpenStreetMap's Nominatim service — no API key or
 * Google Cloud account needed. This is a best-effort lookup: it's called
 * once when a property is created, wrapped in try/catch by callers, so a
 * failed or slow lookup never blocks saving the record itself.
 *
 * Nominatim's usage policy caps this at ~1 request/second for light use;
 * fine for a small contractor adding properties one at a time. If GoFix
 * ever wants richer maps (satellite imagery, faster bulk geocoding), that's
 * a Google Maps API key swap — a separate, later decision.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "GoFixServicesCRM/1.0 (internal business tool)" },
    });
    if (!res.ok) return null;
    const results = (await res.json()) as { lat: string; lon: string }[];
    if (results.length === 0) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch {
    return null;
  }
}
