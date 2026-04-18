interface GeoResult {
  lat: number;
  lng: number;
}

const FALLBACK: GeoResult = { lat: -0.1807, lng: -78.4678 }; // Quito, Ecuador

export async function fetchUserLocation(): Promise<GeoResult> {
  // Try multiple HTTPS-compatible geo APIs
  const apis = [
    {
      url: 'https://ipapi.co/json/',
      parse: (data: Record<string, unknown>) => {
        if (data.error) throw new Error(String(data.reason));
        return { lat: Number(data.latitude), lng: Number(data.longitude) };
      },
    },
    {
      url: 'https://ipwho.is/',
      parse: (data: Record<string, unknown>) => {
        if (!data.success) throw new Error('lookup failed');
        return { lat: Number(data.latitude), lng: Number(data.longitude) };
      },
    },
  ];

  for (const api of apis) {
    try {
      const res = await fetch(api.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const result = api.parse(data);
      if (isFinite(result.lat) && isFinite(result.lng)) {
        return result;
      }
    } catch {
      // try next API
    }
  }

  console.warn('ESS 3D Canvas: All geo APIs failed, using fallback (Quito)');
  return FALLBACK;
}
