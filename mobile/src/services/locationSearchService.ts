import { getOneMapApiKey } from '../config/runtime';

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

export async function searchLocations(query: string): Promise<RouteRequestLocation[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return [];
  }

  const apiToken = getOneMapApiKey();
  const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(trimmedQuery)}&returnGeom=Y&getAddrDetails=Y`;
  const response = await fetch(url, {
    headers: { Authorization: apiToken },
  });

  if (!response.ok) {
    throw new Error(`OneMap search failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as OneMapSearchResponse;

  if (payload.error) {
    throw new Error(payload.error);
  }

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
