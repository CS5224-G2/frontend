import Constants from 'expo-constants';

const PLACEHOLDER_API_BASE_URL = 'https://api.cyclelink.example.com';

function readBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value === 'true';
}

function normalizeBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, '');
}

const expoApiBaseUrl = normalizeBaseUrl(Constants.expoConfig?.extra?.apiBaseUrl as string | undefined);
const envApiBaseUrl = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
const expoOneMapApiKey = (Constants.expoConfig?.extra?.oneMapApiKey as string | undefined)?.trim() || null;
const envOneMapApiKey = process.env.EXPO_PUBLIC_ONEMAP_API_KEY?.trim() || null;

export const USE_MOCKS = readBooleanEnv(process.env.EXPO_PUBLIC_USE_MOCKS, true);

export function getApiBaseUrl(): string {
  const baseUrl = expoApiBaseUrl ?? envApiBaseUrl;

  if (!baseUrl || baseUrl === PLACEHOLDER_API_BASE_URL) {
    throw new Error(
      'Missing EXPO_PUBLIC_API_BASE_URL. Add mobile/.env with your backend URL or set EXPO_PUBLIC_USE_MOCKS=true for local mock mode.',
    );
  }

  return baseUrl;
}

export function getOneMapApiKeyOptional(): string | null {
  return expoOneMapApiKey ?? envOneMapApiKey;
}

export function getOneMapApiKey(): string {
  const apiKey = getOneMapApiKeyOptional();

  if (!apiKey) {
    throw new Error(
      'Missing EXPO_PUBLIC_ONEMAP_API_KEY. Add your OneMap API token to mobile/.env to enable live place search.',
    );
  }

  return apiKey;
}
