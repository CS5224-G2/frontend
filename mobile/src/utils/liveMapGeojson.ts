import type { Route } from '../../../shared/types/index';
import type { LngLat } from './routeGeometry';

export type PointFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, string | undefined>;
    geometry: { type: 'Point'; coordinates: LngLat };
  }>;
};

function emptyPointCollection(): PointFeatureCollection {
  return { type: 'FeatureCollection', features: [] };
}

export function liveMapRiderHaloFeature(coords: LngLat) {
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'Point' as const, coordinates: coords },
  };
}

/** Single-point collection for route start (green marker on live map). */
export function liveMapStartPointCollection(route: Route | null): PointFeatureCollection {
  if (!route) return emptyPointCollection();
  const { lat, lng, name } = route.startPoint;
  if (lat === 0 && lng === 0) return emptyPointCollection();
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature' as const,
        properties: { title: name, kind: 'start' as const },
        geometry: { type: 'Point' as const, coordinates: [lng, lat] as LngLat },
      },
    ],
  };
}

/** Single-point collection for route end (red marker on live map). */
export function liveMapEndPointCollection(route: Route | null): PointFeatureCollection {
  if (!route) return emptyPointCollection();
  const { lat, lng, name } = route.endPoint;
  if (lat === 0 && lng === 0) return emptyPointCollection();
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature' as const,
        properties: { title: name, kind: 'end' as const },
        geometry: { type: 'Point' as const, coordinates: [lng, lat] as LngLat },
      },
    ],
  };
}
