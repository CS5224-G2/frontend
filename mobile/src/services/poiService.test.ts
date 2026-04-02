jest.mock('./httpClient', () => ({
  httpClient: { get: jest.fn() },
}));

import { httpClient } from './httpClient';
import {
  getNearbyHawkerCentres,
  getNearbyHistoricSites,
  getNearbyParks,
  getNearbyTouristAttractions,
} from './poiService';

const mockGet = httpClient.get as jest.Mock;

const backendPoi = {
  name: 'Maxwell Food Centre',
  description: 'Popular hawker centre in Tanjong Pagar',
  lat: 1.2801,
  lng: 103.8454,
  category: 'hawker-centre',
};

const coords = { lat: 1.2805, lng: 103.845 };

beforeEach(() => jest.clearAllMocks());

describe('getNearbyHawkerCentres()', () => {
  it('calls /hawker-centres/nearby with lat/lng and maps response', async () => {
    mockGet.mockResolvedValueOnce([backendPoi]);
    const results = await getNearbyHawkerCentres(coords.lat, coords.lng);
    expect(mockGet).toHaveBeenCalledWith(
      `/hawker-centres/nearby?lat=${coords.lat}&lng=${coords.lng}`,
      undefined,
    );
    expect(results[0].name).toBe('Maxwell Food Centre');
    expect(results[0].lat).toBe(1.2801);
    expect(results[0].category).toBe('hawker-centre');
  });
});

describe('getNearbyHistoricSites()', () => {
  it('calls /historic-sites/nearby with lat/lng', async () => {
    mockGet.mockResolvedValueOnce([]);
    await getNearbyHistoricSites(coords.lat, coords.lng);
    expect(mockGet).toHaveBeenCalledWith(
      `/historic-sites/nearby?lat=${coords.lat}&lng=${coords.lng}`,
      undefined,
    );
  });
});

describe('getNearbyParks()', () => {
  it('calls /parks/nearby with lat/lng', async () => {
    mockGet.mockResolvedValueOnce([]);
    await getNearbyParks(coords.lat, coords.lng);
    expect(mockGet).toHaveBeenCalledWith(
      `/parks/nearby?lat=${coords.lat}&lng=${coords.lng}`,
      undefined,
    );
  });
});

describe('getNearbyTouristAttractions()', () => {
  it('calls /tourist-attractions/nearby with lat/lng', async () => {
    mockGet.mockResolvedValueOnce([]);
    await getNearbyTouristAttractions(coords.lat, coords.lng);
    expect(mockGet).toHaveBeenCalledWith(
      `/tourist-attractions/nearby?lat=${coords.lat}&lng=${coords.lng}`,
      undefined,
    );
  });
});
