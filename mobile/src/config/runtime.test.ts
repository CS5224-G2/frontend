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
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('defaults to mock mode when EXPO_PUBLIC_USE_MOCKS is unset', () => {
    const { USE_MOCKS } = require('./runtime') as typeof import('./runtime');

    expect(USE_MOCKS).toBe(true);
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
});
