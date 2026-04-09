jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {},
  },
}));

describe('runtime config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_USE_MOCKS;
    delete process.env.EXPO_PUBLIC_LIVE_MAP_PROGRESS_SIMULATION;
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    delete process.env.EXPO_PUBLIC_ONEMAP_BASE_URL;
    delete process.env.EXPO_PUBLIC_ONEMAP_API_KEY;
    delete process.env.EXPO_PUBLIC_ONEMAP_API_EMAIL;
    delete process.env.EXPO_PUBLIC_ONEMAP_API_PASSWORD;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('defaults to network mode when EXPO_PUBLIC_USE_MOCKS is unset', () => {
    const { USE_MOCKS, LIVE_MAP_PROGRESS_SIMULATION } = require('./runtime') as typeof import('./runtime');

    expect(USE_MOCKS).toBe(false);
    expect(LIVE_MAP_PROGRESS_SIMULATION).toBe(false);
  });

  it('enables live map progress simulation only when explicitly configured', () => {
    process.env.EXPO_PUBLIC_LIVE_MAP_PROGRESS_SIMULATION = 'true';

    const { LIVE_MAP_PROGRESS_SIMULATION } = require('./runtime') as typeof import('./runtime');

    expect(LIVE_MAP_PROGRESS_SIMULATION).toBe(true);
  });

  it('throws a clear error when network mode is enabled without a real API base URL', () => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'false';

    const { getApiBaseUrl } = require('./runtime') as typeof import('./runtime');

    expect(() => getApiBaseUrl()).toThrow(
      'Missing EXPO_PUBLIC_API_BASE_URL. Add mobile/.env with your backend URL or set EXPO_PUBLIC_USE_MOCKS=true for local mock mode.',
    );
  });

  it('uses the configured API base URL and strips trailing slashes', () => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'false';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:4000/';

    const { getApiBaseUrl } = require('./runtime') as typeof import('./runtime');

    expect(getApiBaseUrl()).toBe('http://localhost:4000');
  });

  it('defaults the OneMap base URL when unset', () => {
    const { getOneMapBaseUrl } = require('./runtime') as typeof import('./runtime');

    expect(getOneMapBaseUrl()).toBe('https://www.onemap.gov.sg');
  });

  it('throws a clear error when no OneMap token or refresh credentials are configured', () => {
    const { getOneMapApiKey } = require('./runtime') as typeof import('./runtime');

    expect(() => getOneMapApiKey()).toThrow(
      'Missing OneMap configuration. Add EXPO_PUBLIC_ONEMAP_API_KEY or EXPO_PUBLIC_ONEMAP_API_EMAIL and EXPO_PUBLIC_ONEMAP_API_PASSWORD to mobile/.env to enable live place search.',
    );
  });

  it('uses the configured OneMap API key', () => {
    process.env.EXPO_PUBLIC_ONEMAP_API_KEY = 'onemap-test-token';

    const { getOneMapApiKey, getOneMapApiKeyOptional } = require('./runtime') as typeof import('./runtime');

    expect(getOneMapApiKey()).toBe('onemap-test-token');
    expect(getOneMapApiKeyOptional()).toBe('onemap-test-token');
  });

  it('reads OneMap refresh credentials when provided', () => {
    process.env.EXPO_PUBLIC_ONEMAP_API_EMAIL = 'tester@example.com';
    process.env.EXPO_PUBLIC_ONEMAP_API_PASSWORD = 'secret';

    const { getOneMapCredentialsOptional } = require('./runtime') as typeof import('./runtime');

    expect(getOneMapCredentialsOptional()).toEqual({
      email: 'tester@example.com',
      password: 'secret',
    });
  });
});
