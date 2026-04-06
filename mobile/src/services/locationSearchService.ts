import { getOneMapBaseUrl } from '../config/runtime';
import { getUsableOneMapApiKey } from './oneMapTokenService';

import type { RouteRequestLocation } from '../../../shared/types/index';

type OneMapSearchResponse = {
  found?: number;
  totalNumPages?: number;
  pageNum?: number;
  results?: Array<{
    SEARCHVAL?: string;
    ADDRESS?: string;
    BUILDING?: string;
    ROAD_NAME?: string;
    POSTAL?: string;
    LATITUDE?: string;
    LONGITUDE?: string;
  }>;
  error?: string;
};

function isTokenAccessError(message: string | undefined): boolean {
  return Boolean(message && /(token|unauthori[sz]ed|expire)/i.test(message));
}

function mapResultsToLocations(payload: OneMapSearchResponse, trimmedQuery: string): RouteRequestLocation[] {
  const locations: RouteRequestLocation[] = [];

  for (const result of payload.results ?? []) {
    const lat = result.LATITUDE ? parseFloat(result.LATITUDE) : NaN;
    const lng = result.LONGITUDE ? parseFloat(result.LONGITUDE) : NaN;

    if (!isFinite(lat) || !isFinite(lng)) {
      continue;
    }

    const name =
      result.BUILDING && result.BUILDING !== 'NIL'
        ? result.BUILDING
        : result.ADDRESS || result.SEARCHVAL || trimmedQuery;

    locations.push({
      name,
      lat,
      lng,
      source: 'search',
    });
  }

  return locations.slice(0, 5);
}

async function performSearch(
  url: string,
  apiToken: string,
): Promise<{ response: Response; payload: OneMapSearchResponse | null }> {
  const response = await fetch(url, {
    headers: { Authorization: apiToken },
  });

  if (!response.ok) {
    return { response, payload: null };
  }

  const payload = (await response.json()) as OneMapSearchResponse;
  return { response, payload };
}

export async function searchLocations(query: string): Promise<RouteRequestLocation[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return [];
  }

  const url = `${getOneMapBaseUrl()}/api/common/elastic/search?searchVal=${encodeURIComponent(trimmedQuery)}&returnGeom=Y&getAddrDetails=Y`;

  let apiToken = await getUsableOneMapApiKey();
  let { response, payload } = await performSearch(url, apiToken);

  if (response.status === 401 || response.status === 403 || isTokenAccessError(payload?.error)) {
    console.error('[OneMap] API key is outdated or unauthorized; refreshing token.');
    apiToken = await getUsableOneMapApiKey({ forceRefresh: true });
    ({ response, payload } = await performSearch(url, apiToken));
  }

  if (!response.ok) {
    throw new Error(`OneMap search failed with status ${response.status}.`);
  }

  if (payload?.error) {
    throw new Error(payload.error);
  }

  return mapResultsToLocations(payload ?? {}, trimmedQuery);
}
