// =============================================================================
// apiFetch — Web App (Vite/React)
// Drop-in fetch wrapper for the service layer.
// Adds structured API logging without touching service error-handling logic.
// Authorization headers and request bodies are never inspected or logged.
// =============================================================================

import { logFailure, logStart, logSuccess } from './apiLogger';

/**
 * Wraps fetch with structured lifecycle logging.
 * Returns the same Response object fetch would return — services handle
 * response.ok checks and body parsing exactly as before.
 */
export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  // Strip the scheme+host prefix so we log '/auth/login' not the full URL.
  const endpoint = url.replace(/^https?:\/\/[^/]+/, '') || url;
  const method = (init?.method ?? 'GET').toUpperCase();
  const startMs = Date.now();

  logStart(endpoint, method);

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    logFailure(endpoint, method, Date.now() - startMs, {
      error: err instanceof Error ? err.name : 'NetworkError',
    });
    throw err;
  }

  const duration_ms = Date.now() - startMs;
  const requestId =
    response.headers.get('x-request-id') ?? response.headers.get('x-correlation-id');

  if (response.ok) {
    logSuccess(endpoint, method, response.status, duration_ms, requestId);
  } else {
    logFailure(endpoint, method, duration_ms, { status: response.status });
  }

  // Return the untouched Response — the body stream is not consumed here.
  return response;
}
