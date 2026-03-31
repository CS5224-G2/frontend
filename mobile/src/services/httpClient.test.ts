jest.mock('./secureSession', () => ({
  getAccessToken: jest.fn(),
}));

jest.mock('../config/runtime', () => ({
  getApiBaseUrl: jest.fn(() => 'https://api.example.com'),
}));

global.fetch = jest.fn();

import { httpClient } from './httpClient';
import { getAccessToken } from './secureSession';

const mockFetch = global.fetch as jest.Mock;
const mockGetAccessToken = getAccessToken as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com';
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    headers: { get: () => null },
    json: async () => ({ ok: true }),
  });
});

describe('httpClient — auto token injection', () => {
  it('injects Authorization header from SecureStore when no token passed', async () => {
    mockGetAccessToken.mockResolvedValue('stored-token-abc');
    await httpClient.get('/test');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer stored-token-abc' }),
      }),
    );
  });

  it('uses explicitly passed token over stored token', async () => {
    mockGetAccessToken.mockResolvedValue('stored-token-abc');
    await httpClient.get('/test', 'explicit-token');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer explicit-token' }),
      }),
    );
  });

  it('sends no Authorization header when no token stored and none passed', async () => {
    mockGetAccessToken.mockResolvedValue(null);
    await httpClient.get('/test');
    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.headers?.Authorization).toBeUndefined();
  });
});
