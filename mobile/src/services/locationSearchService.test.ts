/// <reference types="jest" />

jest.mock('../config/runtime', () => ({
  getOneMapApiKey: jest.fn(() => 'expired-token'),
  getOneMapApiKeyOptional: jest.fn(() => 'expired-token'),
  getOneMapBaseUrl: jest.fn(() => 'https://www.onemap.gov.sg'),
  getOneMapCredentialsOptional: jest.fn(() => ({
    email: 'tester@example.com',
    password: 'super-secret',
  })),
}));

globalThis.fetch = jest.fn();

import { searchLocations } from './locationSearchService';

const mockFetch = globalThis.fetch as jest.Mock;
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);

describe('locationSearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  it('returns an empty list for very short queries', async () => {
    await expect(searchLocations('a')).resolves.toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('refreshes the OneMap token and retries when the current token is unauthorized', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'fresh-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          results: [
            {
              BUILDING: 'NUS Computing',
              ADDRESS: '13 Computing Drive',
              LATITUDE: '1.2948',
              LONGITUDE: '103.7737',
            },
          ],
        }),
      });

    await expect(searchLocations('NUS')).resolves.toEqual([
      {
        name: 'NUS Computing',
        lat: 1.2948,
        lng: 103.7737,
        source: 'search',
      },
    ]);

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/api/common/elastic/search?'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'expired-token' }),
      }),
    );

    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://www.onemap.gov.sg/api/auth/post/getToken',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );

    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('/api/common/elastic/search?'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'fresh-token' }),
      }),
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[OneMap] API key is outdated or unauthorized; refreshing token (attempt 1/3).',
    );
    expect(consoleInfoSpy).toHaveBeenCalledWith('[OneMap] API key updated successfully.');
  });

  it('retries token refresh up to 3 times before throwing an error', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'fresh-token-1' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'fresh-token-2' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'fresh-token-3' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

    await expect(searchLocations('NUS')).rejects.toThrow(
      'OneMap API key could not be refreshed after 3 attempts.',
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[OneMap] API key is outdated or unauthorized; refreshing token (attempt 1/3).',
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[OneMap] API key is outdated or unauthorized; refreshing token (attempt 2/3).',
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[OneMap] API key is outdated or unauthorized; refreshing token (attempt 3/3).',
    );
  });
});
