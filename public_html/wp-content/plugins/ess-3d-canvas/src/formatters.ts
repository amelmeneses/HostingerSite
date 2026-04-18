export function decimalToDMS(decimal: number, isLat: boolean): string {
  const abs = Math.abs(decimal);
  const deg = Math.floor(abs);
  const minFull = (abs - deg) * 60;
  const min = Math.floor(minFull);
  const sec = Math.floor((minFull - min) * 60);

  const dir = isLat
    ? decimal >= 0 ? 'N' : 'S'
    : decimal >= 0 ? 'E' : 'W';

  const secStr = sec.toString().padStart(2, '0');
  return `${deg}°${min.toString().padStart(2, '0')}'${secStr}\u2033 ${dir}`;
}

export function latToDeclination(lat: number): string {
  const dec = Math.round(lat);
  return `${dec}°`;
}

export function lngToRA(lng: number): string {
  const norm = ((lng % 360) + 360) % 360;
  const totalHours = (norm / 360) * 24;
  const h = Math.floor(totalHours);
  const m = Math.floor((totalHours - h) * 60);
  return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
}
