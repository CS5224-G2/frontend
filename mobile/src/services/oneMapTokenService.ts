import * as SecureStore from 'expo-secure-store';

import {
  getOneMapApiKeyOptional,
  getOneMapBaseUrl,
  getOneMapCredentialsOptional,
} from '../config/runtime';

const KEY_ONE_MAP_API_TOKEN = 'cl_onemap_api_token';
const KEY_ONE_MAP_API_TOKEN_FETCHED_AT = 'cl_onemap_api_token_fetched_at';
const ONE_MAP_TOKEN_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const ONE_MAP_TOKEN_REFRESH_BUFFER_MS = 60 * 60 * 1000;
const ONE_MAP_TOKEN_REFRESH_RETRY_LIMIT = 3;

let inMemoryToken: string | null = getOneMapApiKeyOptional();
let inMemoryFetchedAt: number | null = null;
let refreshPromise: Promise<string> | null = null;

type OneMapCredentials = {
  email: string;
  password: string;
};

type StoredTokenRecord = {
  token: string | null;
  fetchedAt: number | null;
};

type OneMapTokenValidationResponse = {
  error?: string;
};

function isValidTimestamp(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isTokenStillFresh(fetchedAt: number | null): boolean {
  if (fetchedAt === null) {
    return false;
  }

  return Date.now() - fetchedAt < ONE_MAP_TOKEN_TTL_MS - ONE_MAP_TOKEN_REFRESH_BUFFER_MS;
}

function hasCredentials(value: OneMapCredentials | null): value is OneMapCredentials {
  return Boolean(value?.email && value?.password);
}

function hasTokenAccessError(value: string | undefined): boolean {
  return Boolean(value && /(token|unauthori[sz]ed|expire)/i.test(value));
}

async function loadStoredTokenRecord(): Promise<StoredTokenRecord> {
  const token = (await SecureStore.getItemAsync(KEY_ONE_MAP_API_TOKEN))?.trim() || null;
  const fetchedAtValue = Number(await SecureStore.getItemAsync(KEY_ONE_MAP_API_TOKEN_FETCHED_AT));

  return {
    token,
    fetchedAt: isValidTimestamp(fetchedAtValue) ? fetchedAtValue : null,
  };
}

async function persistToken(token: string): Promise<void> {
  const now = Date.now();

  await SecureStore.setItemAsync(KEY_ONE_MAP_API_TOKEN, token);
  await SecureStore.setItemAsync(KEY_ONE_MAP_API_TOKEN_FETCHED_AT, String(now));

  inMemoryToken = token;
  inMemoryFetchedAt = now;
}

async function clearStoredToken(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_ONE_MAP_API_TOKEN),
    SecureStore.deleteItemAsync(KEY_ONE_MAP_API_TOKEN_FETCHED_AT),
  ]);
}

export async function invalidateOneMapApiKey(): Promise<void> {
  inMemoryToken = getOneMapApiKeyOptional();
  inMemoryFetchedAt = null;
  await clearStoredToken();
}

export async function refreshOneMapApiKey(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const credentials = getOneMapCredentialsOptional();

    if (!hasCredentials(credentials)) {
      throw new Error(
        'Missing OneMap refresh credentials. Add EXPO_PUBLIC_ONEMAP_API_EMAIL and EXPO_PUBLIC_ONEMAP_API_PASSWORD to mobile/.env or provide EXPO_PUBLIC_ONEMAP_API_KEY.',
      );
    }

    let lastError: unknown;

    for (let attempt = 1; attempt <= ONE_MAP_TOKEN_REFRESH_RETRY_LIMIT; attempt += 1) {
      try {
        const response = await fetch(`${getOneMapBaseUrl()}/api/auth/post/getToken`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          throw new Error(`Unable to refresh OneMap token (status ${response.status}).`);
        }

        const payload = (await response.json()) as { access_token?: string };
        const accessToken = payload.access_token?.trim() ?? '';

        if (!accessToken) {
          throw new Error('OneMap token refresh succeeded but no access_token was returned.');
        }

        await persistToken(accessToken);
        console.info('[OneMap] API key updated successfully.');
        return accessToken;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError instanceof Error) {
      throw new Error(
        `OneMap API key could not be refreshed after ${ONE_MAP_TOKEN_REFRESH_RETRY_LIMIT} attempts. ${lastError.message}`,
      );
    }

    throw new Error(
      `OneMap API key could not be refreshed after ${ONE_MAP_TOKEN_REFRESH_RETRY_LIMIT} attempts.`,
    );
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function getUsableOneMapApiKey(options?: { forceRefresh?: boolean }): Promise<string> {
  const forceRefresh = options?.forceRefresh ?? false;

  if (!forceRefresh && inMemoryToken) {
    if (inMemoryFetchedAt === null || isTokenStillFresh(inMemoryFetchedAt)) {
      return inMemoryToken;
    }
  }

  if (!forceRefresh) {
    const storedToken = await loadStoredTokenRecord();

    if (storedToken.token && isTokenStillFresh(storedToken.fetchedAt)) {
      inMemoryToken = storedToken.token;
      inMemoryFetchedAt = storedToken.fetchedAt;
      return storedToken.token;
    }

    const envToken = getOneMapApiKeyOptional();

    if (envToken) {
      inMemoryToken = envToken;
      inMemoryFetchedAt = null;
      return envToken;
    }

    if (storedToken.token) {
      inMemoryToken = storedToken.token;
      inMemoryFetchedAt = storedToken.fetchedAt;
    }
  }

  if (hasCredentials(getOneMapCredentialsOptional())) {
    return refreshOneMapApiKey();
  }

  if (inMemoryToken) {
    return inMemoryToken;
  }

  const storedToken = await loadStoredTokenRecord();

  if (storedToken.token) {
    inMemoryToken = storedToken.token;
    inMemoryFetchedAt = storedToken.fetchedAt;
    return storedToken.token;
  }

  throw new Error(
    'Missing OneMap configuration. Add EXPO_PUBLIC_ONEMAP_API_KEY or EXPO_PUBLIC_ONEMAP_API_EMAIL and EXPO_PUBLIC_ONEMAP_API_PASSWORD to mobile/.env to enable live place search.',
  );
}

async function isOneMapApiKeyStillValid(apiToken: string): Promise<boolean> {
  const response = await fetch(
    `${getOneMapBaseUrl()}/api/common/elastic/search?searchVal=Singapore&returnGeom=N&getAddrDetails=N&pageNum=1`,
    {
      headers: { Authorization: apiToken },
    },
  );

  if (response.status === 401 || response.status === 403) {
    return false;
  }

  if (!response.ok) {
    return true;
  }

  const payload = (await response.json()) as OneMapTokenValidationResponse;
  return !hasTokenAccessError(payload.error);
}

export async function initializeOneMapApiKeyOnAppOpen(): Promise<void> {
  try {
    const apiToken = await getUsableOneMapApiKey();
    const isValid = await isOneMapApiKeyStillValid(apiToken);

    if (!isValid) {
      console.info('[OneMap] Cached API key is invalid or expired; refreshing token.');
      await getUsableOneMapApiKey({ forceRefresh: true });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[OneMap] Unable to initialize API key on app open: ${message}`);
  }
}
