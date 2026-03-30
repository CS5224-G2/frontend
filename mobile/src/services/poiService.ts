// =============================================================================
// POI SERVICE — Mobile (Expo/React Native)
// Discovers Points of Interest near a given coordinate via the CycleLink API.
// Endpoints: /hawker-centres/nearby, /historic-sites/nearby,
//            /parks/nearby, /tourist-attractions/nearby
// =============================================================================

import { httpClient } from './httpClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PointOfInterest = {
  name: string;
  description: string;
  lat: number;
  lng: number;
  category: string;
};

type BackendPoi = {
  name: string;
  description: string;
  lat: number;
  lng: number;
  category: string;
};

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

const toFrontendPoi = (p: BackendPoi): PointOfInterest => ({
  name: p.name,
  description: p.description,
  lat: p.lat,
  lng: p.lng,
  category: p.category,
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getNearbyHawkerCentres(
  lat: number,
  lng: number,
  token?: string,
): Promise<PointOfInterest[]> {
  const response = await httpClient.get<BackendPoi[]>(
    `/hawker-centres/nearby?lat=${lat}&lng=${lng}`,
    token,
  );
  return response.map(toFrontendPoi);
}

export async function getNearbyHistoricSites(
  lat: number,
  lng: number,
  token?: string,
): Promise<PointOfInterest[]> {
  const response = await httpClient.get<BackendPoi[]>(
    `/historic-sites/nearby?lat=${lat}&lng=${lng}`,
    token,
  );
  return response.map(toFrontendPoi);
}

export async function getNearbyParks(
  lat: number,
  lng: number,
  token?: string,
): Promise<PointOfInterest[]> {
  const response = await httpClient.get<BackendPoi[]>(
    `/parks/nearby?lat=${lat}&lng=${lng}`,
    token,
  );
  return response.map(toFrontendPoi);
}

export async function getNearbyTouristAttractions(
  lat: number,
  lng: number,
  token?: string,
): Promise<PointOfInterest[]> {
  const response = await httpClient.get<BackendPoi[]>(
    `/tourist-attractions/nearby?lat=${lat}&lng=${lng}`,
    token,
  );
  return response.map(toFrontendPoi);
}
