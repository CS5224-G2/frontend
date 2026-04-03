// fetchWithAuth.js
let _token = null;
let _refreshToken = null;
let _expiresAt = 0;
let _refreshTimer = null;

const BASE = 'https://d312yhw7tn0jis.cloudfront.net/v1';
const STORAGE_KEY = 'cyclelink_web_session';

export function setTokens({ accessToken, refreshToken, expiresIn }) {
  _token = accessToken;
  _refreshToken = refreshToken;
  _expiresAt = Date.now() + expiresIn * 1000;
  clearTimeout(_refreshTimer);
  _refreshTimer = setTimeout(doRefresh, (expiresIn - 60) * 1000);
}

export function clearTokens() {
  _token = null;
  _refreshToken = null;
  _expiresAt = 0;
  clearTimeout(_refreshTimer);
  // Also clear the AuthContext localStorage session so login page shows the form
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export function getToken() { return _token; }

export function isAuthenticated() {
  if (!!_token && Date.now() < _expiresAt) return true;
  // Bootstrap from localStorage after page reload
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const { accessToken, refreshToken } = JSON.parse(raw);
    if (accessToken) {
      setTokens({ accessToken, refreshToken, expiresIn: 1800 });
      return true;
    }
  } catch {}
  return false;
}

async function doRefresh() {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${_token}` },
      body: JSON.stringify({ refresh_token: _refreshToken }),
    });
    if (!res.ok) throw new Error('Refresh failed');
    const data = await res.json();
    setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in });
  } catch {
    clearTokens();
    window.location.href = '/login';
  }
}

export async function authFetch(path, opts = {}) {
  if (!_token) throw new Error('Not authenticated');
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: { ...opts.headers, Authorization: `Bearer ${_token}`, 'Content-Type': 'application/json' },
  });
  if (res.status === 401) { clearTokens(); window.location.href = '/login'; }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}
