import type { Route } from '../../../shared/types/index';
import type { Region } from 'react-native-maps';

/** GeoJSON positions as [lng, lat] for Mapbox. */
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

/** Coordinates for react-native-maps `Polyline` (uses `route_path` when present). */
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

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two WGS84 points (meters). */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

function segmentLength(a: LngLat, b: LngLat): number {
  return haversineMeters(a[1], a[0], b[1], b[0]);
}

/**
 * Closest point on segment AB to P, with distance in meters (local planar projection — fine for urban segments).
 * Returns t ∈ [0,1] along the segment by chord parameter (approximates arc for short segments).
 */
export function closestPointOnSegmentMeters(
  latP: number,
  lngP: number,
  latA: number,
  lngA: number,
  latB: number,
  lngB: number,
): { lat: number; lng: number; distM: number; t: number } {
  const lat0 = (latA + latB) / 2;
  const mPerDegLat = 111_320;
  const cosLat = Math.cos(toRad(lat0));
  const mPerDegLng = 111_320 * Math.max(0.2, cosLat);

  const px = (lngP - lngA) * mPerDegLng;
  const py = (latP - latA) * mPerDegLat;
  const vx = (lngB - lngA) * mPerDegLng;
  const vy = (latB - latA) * mPerDegLat;
  const len2 = vx * vx + vy * vy;
  let t = len2 > 1e-6 ? (px * vx + py * vy) / len2 : 0;
  t = Math.min(1, Math.max(0, t));
  const clat = latA + t * (latB - latA);
  const clng = lngA + t * (lngB - lngA);
  const distM = haversineMeters(latP, lngP, clat, clng);
  return { lat: clat, lng: clng, distM, t };
}

export type PolylineProjection = {
  nearest: LngLat;
  distToRouteM: number;
  cumulativeM: number;
  /** Progress 0–1 along total polyline length. */
  progress01: number;
};

/** Nearest point on polyline, cross-track distance (m), and distance along route from start (m). */
export function projectPointOntoPolyline(
  lat: number,
  lng: number,
  line: LngLat[],
): PolylineProjection {
  if (line.length === 0) {
    return { nearest: [0, 0], distToRouteM: Number.POSITIVE_INFINITY, cumulativeM: 0, progress01: 0 };
  }
  if (line.length === 1) {
    const d = haversineMeters(lat, lng, line[0][1], line[0][0]);
    return { nearest: line[0], distToRouteM: d, cumulativeM: 0, progress01: 0 };
  }

  let bestDist = Number.POSITIVE_INFINITY;
  let bestNearest: LngLat = line[0];
  let bestCumulative = 0;
  let cumulativeBeforeSeg = 0;

  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const segLen = haversineMeters(a[1], a[0], b[1], b[0]);
    const close = closestPointOnSegmentMeters(lat, lng, a[1], a[0], b[1], b[0]);
    if (close.distM < bestDist) {
      bestDist = close.distM;
      bestNearest = [close.lng, close.lat];
      bestCumulative = cumulativeBeforeSeg + close.t * segLen;
    }
    cumulativeBeforeSeg += segLen;
  }

  const totalLen = cumulativeBeforeSeg || 1;
  return {
    nearest: bestNearest,
    distToRouteM: bestDist,
    cumulativeM: bestCumulative,
    progress01: Math.min(1, Math.max(0, bestCumulative / totalLen)),
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
