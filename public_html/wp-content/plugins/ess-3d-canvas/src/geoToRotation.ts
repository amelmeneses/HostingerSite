export interface Rotation3D {
  x: number;
  y: number;
  z: number;
}

const ROTATION_LIMITS = {
  maxX: Math.PI / 5,   // ±36°
  maxY: Math.PI / 3,   // ±60°
  maxZ: Math.PI / 8,   // ±22.5°
} as const;

export function latLngToRotation(lat: number, lng: number): Rotation3D {
  const normLat = clamp(lat / 90, -1, 1);
  const normLng = clamp(lng / 180, -1, 1);

  const x = normLat * ROTATION_LIMITS.maxX;
  const y = normLng * ROTATION_LIMITS.maxY;
  const z = (normLat * normLng) * ROTATION_LIMITS.maxZ;

  return { x, y, z };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
