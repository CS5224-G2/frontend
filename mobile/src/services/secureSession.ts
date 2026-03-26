// =============================================================================
// SECURE SESSION SERVICE
// Stores and retrieves auth tokens and user info via expo-secure-store.
// Tokens and session secrets are NEVER written to SQLite.
// =============================================================================

import type { AuthResult, AuthUser } from '../../../shared/types/index';

const KEY_ACCESS_TOKEN = 'cl_access_token';
const KEY_REFRESH_TOKEN = 'cl_refresh_token';
const KEY_EXPIRES_IN = 'cl_expires_in';
const KEY_USER_JSON = 'cl_user_json';

const ALL_KEYS = [KEY_ACCESS_TOKEN, KEY_REFRESH_TOKEN, KEY_EXPIRES_IN, KEY_USER_JSON];

async function getSecureStore() {
  const SecureStore = await import('expo-secure-store');
  return SecureStore;
}

/**
 * Persists an auth session (tokens + user info) in the secure enclave.
 */
export async function saveSession(result: AuthResult): Promise<void> {
  const SecureStore = await getSecureStore();
  await SecureStore.setItemAsync(KEY_ACCESS_TOKEN, result.accessToken);
  await SecureStore.setItemAsync(KEY_REFRESH_TOKEN, result.refreshToken);
  await SecureStore.setItemAsync(KEY_EXPIRES_IN, String(result.expiresIn));
  await SecureStore.setItemAsync(KEY_USER_JSON, JSON.stringify(result.user));
}

/**
 * Restores a previously saved session from secure storage.
 * Returns null if no session is stored.
 */
export async function loadSession(): Promise<AuthResult | null> {
  const SecureStore = await getSecureStore();
  const accessToken = await SecureStore.getItemAsync(KEY_ACCESS_TOKEN);
  if (!accessToken) return null;

  const refreshToken = (await SecureStore.getItemAsync(KEY_REFRESH_TOKEN)) ?? '';
  const expiresIn = Number((await SecureStore.getItemAsync(KEY_EXPIRES_IN)) ?? '3600');
  const userJson = await SecureStore.getItemAsync(KEY_USER_JSON);
  if (!userJson) return null;

  try {
    const user = JSON.parse(userJson) as AuthUser;
    return { accessToken, refreshToken, expiresIn, user };
  } catch {
    return null;
  }
}

/**
 * Wipes all session secrets from secure storage. Call on logout.
 */
export async function clearSession(): Promise<void> {
  const SecureStore = await getSecureStore();
  await Promise.all(ALL_KEYS.map((key) => SecureStore.deleteItemAsync(key)));
}
