import type { Route } from '../../../../shared/types/index';

export function formatRouteElevation(e: Route['elevation']): string {
  if (typeof e === 'number') return `${Math.round(e)} m`;
  if (e === 'higher') return 'Higher climbs';
  if (e === 'lower') return 'Flatter';
  return '—';
}

export function hasRouteCoordinates(lat: number, lng: number): boolean {
  return lat !== 0 || lng !== 0;
}

/** Secondary line under place names (matches Route Details). */
export function routeCoordinateSubtitle(lat: number, lng: number): string | null {
  if (!hasRouteCoordinates(lat, lng)) return null;
  return `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`;
}
