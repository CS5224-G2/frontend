// =============================================================================
// AUTH EVENTS
// Module-level callback registry so the httpClient (a plain service, not a
// React component) can notify AuthContext when a session has expired.
// =============================================================================

type SessionExpiredCallback = () => void;

let _onSessionExpired: SessionExpiredCallback | null = null;

export function registerSessionExpiredHandler(cb: SessionExpiredCallback): void {
  _onSessionExpired = cb;
}

export function notifySessionExpired(): void {
  _onSessionExpired?.();
}
