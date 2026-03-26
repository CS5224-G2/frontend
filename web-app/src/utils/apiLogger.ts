// =============================================================================
// API LOGGER — Web App (Vite/React)
// Structured request/response metadata logging for backend API calls.
//
// Enabled by:  VITE_API_LOGGING=true
// Default:     OFF (nothing logged beyond minimal failure warnings)
//
// NEVER logged: Authorization headers, passwords, tokens, request bodies,
//               response bodies, user profile payloads, or any secret.
//
// Always-on minimal failure log (even when disabled): endpoint + HTTP status
// only. Intentionally kept to catch backend integration failures without
// requiring full logging. Contains no sensitive data.
// =============================================================================

const loggingEnabled = (): boolean => import.meta.env.VITE_API_LOGGING === 'true';
const ENV: string = import.meta.env.MODE ?? 'unknown';

type ApiLogEntry = {
  event: 'api_request_start' | 'api_request_success' | 'api_request_failure';
  endpoint: string;
  method: string;
  platform: 'web';
  env: string;
  status?: number;
  duration_ms?: number;
  request_id?: string;
  error?: string;
};

function emit(entry: ApiLogEntry): void {
  console.log('[CycleLink/api]', JSON.stringify(entry));
}

export function logStart(endpoint: string, method: string): void {
  if (!loggingEnabled()) return;
  emit({ event: 'api_request_start', endpoint, method, platform: 'web', env: ENV });
}

export function logSuccess(
  endpoint: string,
  method: string,
  status: number,
  duration_ms: number,
  request_id?: string | null,
): void {
  if (!loggingEnabled()) return;
  const entry: ApiLogEntry = {
    event: 'api_request_success',
    endpoint,
    method,
    platform: 'web',
    env: ENV,
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
  if (loggingEnabled()) {
    const entry: ApiLogEntry = {
      event: 'api_request_failure',
      endpoint,
      method,
      platform: 'web',
      env: ENV,
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
