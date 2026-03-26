const DEFAULT_PLACEHOLDER_API_BASE_URL = 'https://api.cyclelink.example.com';

const devMode = typeof __DEV__ !== 'undefined' && __DEV__;
const envUseMocks = process.env.EXPO_PUBLIC_USE_MOCKS;

export const USE_MOCKS =
  envUseMocks === 'true' || (typeof envUseMocks === 'undefined' && devMode);

export function getApiBaseUrl(configBaseUrl?: string): string {
  return (configBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_PLACEHOLDER_API_BASE_URL)
    .trim();
}

export function assertBackendConfigured(baseUrl: string): void {
  if (USE_MOCKS) {
    return;
  }

  if (!baseUrl || baseUrl === DEFAULT_PLACEHOLDER_API_BASE_URL || baseUrl.endsWith('.example.com')) {
    throw new Error(
      'Backend is not configured. Set EXPO_PUBLIC_USE_MOCKS=true for local mock data, or set EXPO_PUBLIC_API_BASE_URL to a real API URL.',
    );
  }
}
