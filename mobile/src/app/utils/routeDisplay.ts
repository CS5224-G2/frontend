import type { Route } from '../../../../shared/types/index';

/**
 * API contract: `elevation` is usually `"lower"` | `"dont-care"` | `"higher"`; numeric `elevation_m` may still appear from some backends.
 */
export function formatRouteElevation(e: Route['elevation'] | undefined | null): string {
  if (e === undefined || e === null) return 'Balanced';
  if (typeof e === 'number' && Number.isFinite(e)) return `${Math.round(e)} m`;
  if (e === 'higher') return 'Higher climbs';
  if (e === 'lower') return 'Flatter';
  if (e === 'dont-care') return 'Balanced';
  return 'Balanced';
}

export function hasRouteCoordinates(lat: number, lng: number): boolean {
  return lat !== 0 || lng !== 0;
}

/** Secondary line under place names (matches Route Details). */
export function routeCoordinateSubtitle(lat: number, lng: number): string | null {
  if (!hasRouteCoordinates(lat, lng)) return null;
  return `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`;
}
