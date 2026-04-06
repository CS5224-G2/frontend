import Constants from 'expo-constants';

const PLACEHOLDER_API_BASE_URL = 'https://api.cyclelink.example.com';
const DEFAULT_ONEMAP_BASE_URL = 'https://www.onemap.gov.sg';

function readBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value === 'true';
}

function normalizeBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, '');
}

function readStringEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

const expoApiBaseUrl = normalizeBaseUrl(Constants.expoConfig?.extra?.apiBaseUrl as string | undefined);
const envApiBaseUrl = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
const expoOneMapBaseUrl = normalizeBaseUrl(Constants.expoConfig?.extra?.oneMapBaseUrl as string | undefined);
const envOneMapBaseUrl = normalizeBaseUrl(process.env.EXPO_PUBLIC_ONEMAP_BASE_URL);
const expoOneMapApiKey = readStringEnv(Constants.expoConfig?.extra?.oneMapApiKey as string | undefined);
const envOneMapApiKey = readStringEnv(process.env.EXPO_PUBLIC_ONEMAP_API_KEY);
const expoOneMapApiEmail = readStringEnv(Constants.expoConfig?.extra?.oneMapApiEmail as string | undefined);
const envOneMapApiEmail = readStringEnv(process.env.EXPO_PUBLIC_ONEMAP_API_EMAIL);
const expoOneMapApiPassword = readStringEnv(Constants.expoConfig?.extra?.oneMapApiPassword as string | undefined);
const envOneMapApiPassword = readStringEnv(process.env.EXPO_PUBLIC_ONEMAP_API_PASSWORD);

export const USE_MOCKS = readBooleanEnv(process.env.EXPO_PUBLIC_USE_MOCKS, false);

export function getApiBaseUrl(): string {
  const baseUrl = expoApiBaseUrl ?? envApiBaseUrl;

  if (!baseUrl || baseUrl === PLACEHOLDER_API_BASE_URL) {
    throw new Error(
      'Missing EXPO_PUBLIC_API_BASE_URL. Add mobile/.env with your backend URL or set EXPO_PUBLIC_USE_MOCKS=true for local mock mode.',
    );
  }

  return baseUrl;
}

export function getOneMapBaseUrl(): string {
  return expoOneMapBaseUrl ?? envOneMapBaseUrl ?? DEFAULT_ONEMAP_BASE_URL;
}

export function getOneMapCredentialsOptional(): { email: string; password: string } | null {
  const email = expoOneMapApiEmail ?? envOneMapApiEmail;
  const password = expoOneMapApiPassword ?? envOneMapApiPassword;

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

export function getOneMapApiKeyOptional(): string | null {
  return expoOneMapApiKey ?? envOneMapApiKey;
}

export function getOneMapApiKey(): string {
  const apiKey = getOneMapApiKeyOptional();

  if (!apiKey) {
    throw new Error(
      'Missing OneMap configuration. Add EXPO_PUBLIC_ONEMAP_API_KEY or EXPO_PUBLIC_ONEMAP_API_EMAIL and EXPO_PUBLIC_ONEMAP_API_PASSWORD to mobile/.env to enable live place search.',
    );
  }

  return apiKey;
}
