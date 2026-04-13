import type { Route } from '../../../shared/types/index';
import { isLikelyHawkerCentre } from '@/app/utils/poiLabels';
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

export function liveMapCheckpointCollection(route: Route | null): PointFeatureCollection {
  if (!route) return emptyPointCollection();
  const features = route.checkpoints
    .filter((cp) => cp.lat !== 0 || cp.lng !== 0)
    .map((cp) => ({
      type: 'Feature' as const,
      properties: { title: cp.name, kind: 'checkpoint' as const },
      geometry: { type: 'Point' as const, coordinates: [cp.lng, cp.lat] as LngLat },
    }));
  return { type: 'FeatureCollection', features };
}

export function liveMapPoiCollections(route: Route | null): {
  hawker: PointFeatureCollection;
  other: PointFeatureCollection;
} {
  if (!route) {
    return { hawker: emptyPointCollection(), other: emptyPointCollection() };
  }
  const pois = route.pointsOfInterestVisited ?? [];
  const hawkerFeatures: PointFeatureCollection['features'] = [];
  const otherFeatures: PointFeatureCollection['features'] = [];
  pois.forEach((poi) => {
    if (typeof poi.lat !== 'number' || typeof poi.lng !== 'number') return;
    const f = {
      type: 'Feature' as const,
      properties: { title: poi.name, kind: 'poi' as const },
      geometry: { type: 'Point' as const, coordinates: [poi.lng, poi.lat] as LngLat },
    };
    if (isLikelyHawkerCentre(poi.name)) hawkerFeatures.push(f);
    else otherFeatures.push(f);
  });
  return {
    hawker: { type: 'FeatureCollection', features: hawkerFeatures },
    other: { type: 'FeatureCollection', features: otherFeatures },
  };
}

/** All food-related POIs along the route (hawker + restaurants) as one layer for map icons. */
export function liveMapFoodPoisAlongRoute(route: Route | null): PointFeatureCollection {
  if (!route) return emptyPointCollection();
  const { hawker, other } = liveMapPoiCollections(route);
  return {
    type: 'FeatureCollection',
    features: [...hawker.features, ...other.features],
  };
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
