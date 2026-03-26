// =============================================================================
// API LOGGER — Mobile (Expo/React Native)
// Structured request/response metadata logging for backend API calls.
//
// Enabled by:  EXPO_PUBLIC_API_LOGGING=true
// Default:     OFF (nothing logged beyond minimal failure warnings)
//
// NEVER logged: Authorization headers, passwords, tokens, request bodies,
//               response bodies, user profile payloads, or any secret.
//
// Always-on minimal failure log (even when disabled): endpoint + HTTP status
// only. This is intentionally kept to help catch backend integration failures
// without requiring full logging to be turned on. Contains no sensitive data.
// =============================================================================

import Constants from 'expo-constants';

const LOGGING_ENABLED = process.env.EXPO_PUBLIC_API_LOGGING === 'true';
const APP_VERSION: string = Constants.expoConfig?.version ?? 'unknown';
const ENV: string = process.env.NODE_ENV ?? 'unknown';

type ApiLogEntry = {
  event: 'api_request_start' | 'api_request_success' | 'api_request_failure';
  endpoint: string;
  method: string;
  platform: 'mobile';
  env: string;
  app_version: string;
  status?: number;
  duration_ms?: number;
  request_id?: string;
  error?: string;
};

function emit(entry: ApiLogEntry): void {
  console.log('[CycleLink/api]', JSON.stringify(entry));
}

export function logStart(endpoint: string, method: string): void {
  if (!LOGGING_ENABLED) return;
  emit({ event: 'api_request_start', endpoint, method, platform: 'mobile', env: ENV, app_version: APP_VERSION });
}

export function logSuccess(
  endpoint: string,
  method: string,
  status: number,
  duration_ms: number,
  request_id?: string | null,
): void {
  if (!LOGGING_ENABLED) return;
  const entry: ApiLogEntry = {
    event: 'api_request_success',
    endpoint,
    method,
    platform: 'mobile',
    env: ENV,
    app_version: APP_VERSION,
    status,
    duration_ms,
  };
  if (request_id) entry.request_id = request_id;
  emit(entry);
}

export function logFailure(
  endpoint: string,
  method: string,
  duration_ms: number,
  options?: { status?: number; error?: string },
): void {
  if (LOGGING_ENABLED) {
    const entry: ApiLogEntry = {
      event: 'api_request_failure',
      endpoint,
      method,
      platform: 'mobile',
      env: ENV,
      app_version: APP_VERSION,
      duration_ms,
    };
    if (options?.status !== undefined) entry.status = options.status;
    if (options?.error) entry.error = options.error;
    emit(entry);
  } else {
    // Minimal always-on warning: endpoint + status only. No credentials or body.
    console.warn('[CycleLink/api] request_failed', method, endpoint, options?.status ?? options?.error ?? 'network_error');
  }
}
