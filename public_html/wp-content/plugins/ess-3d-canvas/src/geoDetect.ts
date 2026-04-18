interface GeoResult {
  lat: number;
  lng: number;
}

const FALLBACK: GeoResult = { lat: 40.7128, lng: -74.006 }; // New York

export async function fetchUserLocation(): Promise<GeoResult> {
  try {
    const res = await fetch(
      'http://ip-api.com/json/?fields=status,lat,lon',
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (data.status !== 'success') throw new Error('IP lookup failed');

    return { lat: data.lat, lng: data.lon };
  } catch (err) {
    console.warn('ESS 3D Canvas: IP geolocation failed, using fallback:', err);
    return FALLBACK;
  }
}
