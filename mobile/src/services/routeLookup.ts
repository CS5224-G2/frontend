import type { Route } from '../../../shared/types/index';
import { getRouteById as getMockRouteById } from '../app/types';
import { finalizeRouteEndpoints, getRouteById } from './routeService';

/**
 * Resolves a route for detail / confirmation / live map flows.
 * Tries the API first (same IDs as Home / discovery), then local mock routes (e.g. tests, offline "1"–"6").
 */
export async function resolveRouteById(id: string | undefined, token?: string): Promise<Route | null> {
  if (!id) return null;
  const fromApi = await getRouteById(id, token);
  if (fromApi) return fromApi;
  const mock = getMockRouteById(id);
  return mock ? finalizeRouteEndpoints(mock as unknown as Route) : null;
}
