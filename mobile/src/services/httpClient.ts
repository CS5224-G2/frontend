// =============================================================================
// HTTP CLIENT — Mobile (Expo/React Native)
// Thin wrapper around fetch that reads EXPO_PUBLIC_API_BASE_URL and attaches
// auth headers. Services use this when EXPO_PUBLIC_USE_MOCKS !== 'true'.
// =============================================================================

import { getApiBaseUrl } from '../config/runtime';
import { logFailure, logStart, logSuccess } from '../utils/apiLogger';
import { notifySessionExpired } from './authEvents';
import { clearSession, getAccessToken } from './secureSession';
import { loadActiveRideSession } from './activeRideSession';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const headers: Record<string, string> = {};

  const resolvedToken = token ?? (await getAccessToken());
  if (resolvedToken) {
    headers['Authorization'] = `Bearer ${resolvedToken}`;
  }

  if (body !== undefined && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const startMs = Date.now();
  logStart(path, method);

  let serializedBody: BodyInit | undefined;
  if (body !== undefined) {
    serializedBody = isFormData ? (body as BodyInit) : JSON.stringify(body);
  }

  let response: Response;
  try {
    const baseUrl = getApiBaseUrl();
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: serializedBody,
    });
  } catch (err) {
    const errorDetail =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    logFailure(path, method, Date.now() - startMs, {
      error: errorDetail,
    });
    throw err;
  }

  const duration_ms = Date.now() - startMs;
  const requestId =
    response.headers.get('x-request-id') ?? response.headers.get('x-correlation-id');

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    logFailure(path, method, duration_ms, { status: response.status, error: text });
    if (response.status === 401) {
      // Don't log the user out while they have an active ride — ride data is
      // stored locally and the session can be recovered after the ride ends.
      // Only clear the session when no ride is in progress.
      const activeRide = await loadActiveRideSession().catch(() => null);
      if (!activeRide) {
        clearSession().catch(() => {});
        notifySessionExpired();
      }
    }
    throw new ApiError(response.status, text);
  }

  logSuccess(path, method, response.status, duration_ms, requestId);

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const httpClient = {
  get: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'GET', token }),
  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'POST', body, token }),
  put: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'PUT', body, token }),
  patch: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'PATCH', body, token }),
  delete: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'DELETE', token }),
};
