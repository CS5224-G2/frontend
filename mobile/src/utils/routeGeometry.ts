import type { Route } from '../app/types';

/** GeoJSON positions as [lng, lat] for Mapbox. */
export type LngLat = [number, number];

export function routeToLineCoordinates(route: Route): LngLat[] {
  const coords: LngLat[] = [
    [route.startPoint.lng, route.startPoint.lat],
    ...route.checkpoints.map((c) => [c.lng, c.lat] as LngLat),
    [route.endPoint.lng, route.endPoint.lat],
  ];
  return coords;
}

function segmentLength(a: LngLat, b: LngLat): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Position along the polyline at progress t ∈ [0, 1] (planar lng/lat — fine for short urban routes).
 */
export function interpolateAlongRoute(coordinates: LngLat[], t: number): LngLat {
  if (coordinates.length === 0) return [0, 0];
  if (coordinates.length === 1) return coordinates[0];
  const clamped = Math.min(1, Math.max(0, t));
  const lengths: number[] = [];
  let total = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const len = segmentLength(coordinates[i - 1], coordinates[i]);
    lengths.push(len);
    total += len;
  }
  if (total === 0) return coordinates[0];
  let target = clamped * total;
  for (let i = 0; i < lengths.length; i++) {
    if (target <= lengths[i] || i === lengths.length - 1) {
      const segLen = lengths[i] || 1;
      const u = segLen > 0 ? Math.min(1, target / segLen) : 0;
      const a = coordinates[i];
      const b = coordinates[i + 1];
      return [a[0] + u * (b[0] - a[0]), a[1] + u * (b[1] - a[1])];
    }
    target -= lengths[i];
  }
  return coordinates[coordinates.length - 1];
}

export function boundsFromCoordinates(coords: LngLat[]): {
  ne: LngLat;
  sw: LngLat;
} {
  if (!coords.length) {
    return { ne: [-73.9, 40.8], sw: [-74.05, 40.7] };
  }
  let minLng = coords[0][0];
  let maxLng = coords[0][0];
  let minLat = coords[0][1];
  let maxLat = coords[0][1];
  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  const padLng = Math.max(0.002, (maxLng - minLng) * 0.15);
  const padLat = Math.max(0.002, (maxLat - minLat) * 0.15);
  return {
    ne: [maxLng + padLng, maxLat + padLat],
    sw: [minLng - padLng, minLat - padLat],
  };
}
