import type { Route } from '../../../shared/types/index';
import type { Region } from 'react-native-maps';

/** GeoJSON positions as [lng, lat] for Mapbox. Prefers backend `routePath` when present. */
export type LngLat = [number, number];

export function routeToLineCoordinates(route: Route): LngLat[] {
  if (route.routePath && route.routePath.length >= 2) {
    return route.routePath.map((p) => [p.lng, p.lat] as LngLat);
  }

  const coords: LngLat[] = [
    [route.startPoint.lng, route.startPoint.lat],
    ...route.checkpoints.map((c) => [c.lng, c.lat] as LngLat),
    [route.endPoint.lng, route.endPoint.lat],
  ];
  return coords;
}

/** Coordinates for react-native-maps `Polyline` (uses `routePath` when present). */
export function routeToMapCoordinates(route: Route): { latitude: number; longitude: number }[] {
  if (route.routePath && route.routePath.length >= 2) {
    return route.routePath.map((p) => ({ latitude: p.lat, longitude: p.lng }));
  }
  return routeToLineCoordinates(route).map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
}

export function fitRegionForCoordinates(
  points: { latitude: number; longitude: number }[],
  padding = 1.45,
): Region {
  if (points.length === 0) {
    return {
      latitude: 1.3521,
      longitude: 103.8198,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    };
  }
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.008);
  const lngSpan = Math.max(maxLng - minLng, 0.008);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latSpan * padding,
    longitudeDelta: lngSpan * padding,
  };
}

function segmentLength(a: LngLat, b: LngLat): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

export function haversineDistanceKm(a: LngLat, b: LngLat): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function projectPointOntoRoute(
  coordinates: LngLat[],
  point: LngLat,
): { snappedPoint: LngLat; progress: number } {
  if (coordinates.length === 0) {
    return { snappedPoint: [0, 0], progress: 0 };
  }

  if (coordinates.length === 1) {
    return { snappedPoint: coordinates[0], progress: 0 };
  }

  const segmentLengths: number[] = [];
  let totalLength = 0;
  for (let i = 1; i < coordinates.length; i += 1) {
    const len = segmentLength(coordinates[i - 1], coordinates[i]);
    segmentLengths.push(len);
    totalLength += len;
  }

  if (totalLength === 0) {
    return { snappedPoint: coordinates[0], progress: 0 };
  }

  let bestDistanceSq = Number.POSITIVE_INFINITY;
  let bestPoint: LngLat = coordinates[0];
  let bestLengthAlong = 0;
  let traversed = 0;

  for (let i = 0; i < coordinates.length - 1; i += 1) {
    const a = coordinates[i];
    const b = coordinates[i + 1];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const segSq = dx * dx + dy * dy;
    const segLen = segmentLengths[i];

    if (segSq === 0) {
      traversed += segLen;
      continue;
    }

    const rawT = ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / segSq;
    const t = Math.max(0, Math.min(1, rawT));
    const snappedPoint: LngLat = [a[0] + t * dx, a[1] + t * dy];
    const distDx = point[0] - snappedPoint[0];
    const distDy = point[1] - snappedPoint[1];
    const distSq = distDx * distDx + distDy * distDy;

    if (distSq < bestDistanceSq) {
      bestDistanceSq = distSq;
      bestPoint = snappedPoint;
      bestLengthAlong = traversed + t * segLen;
    }

    traversed += segLen;
  }

  return {
    snappedPoint: bestPoint,
    progress: Math.max(0, Math.min(1, bestLengthAlong / totalLength)),
  };
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
