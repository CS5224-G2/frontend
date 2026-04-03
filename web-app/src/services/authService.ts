// =============================================================================
// AUTH SERVICE — Web App (Vite/React)
// Full adapter pattern: maps between backend snake_case and frontend camelCase.
// Gated by VITE_USE_MOCKS — set to 'true' to skip real network calls.
// =============================================================================

import type { LoginFormValues, AuthUser, AuthResult } from '@shared/types/index';
import { findWebUserByEmail, getStoredAuthResult, verifyStoredPassword } from './localDb';
import { apiFetch } from '../utils/apiFetch';

export type { LoginFormValues, AuthUser, AuthResult };

// Vite exposes env vars through import.meta.env
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.cyclelink.example.com';
const shouldUseMocks = () => import.meta.env.VITE_USE_MOCKS === 'true';

// Re-export for consumers that used the old minimal type
export type LoginValues = LoginFormValues;

// ---------------------------------------------------------------------------
// Backend shapes (internal)
// ---------------------------------------------------------------------------

type BackendLoginPayload = {
  email: string;
  password: string;
  remember_me: boolean;
  client: 'web_app';
};

type BackendAuthResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    onboarding_complete: boolean;
    role: 'user' | 'admin' | 'business';
  };
};

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const toLoginPayload = (values: LoginFormValues): BackendLoginPayload => ({
  email: normalizeEmail(values.email),
  password: values.password,
  remember_me: values.rememberMe ?? false,
  client: 'web_app',
});

const toAuthResult = (response: BackendAuthResponse): AuthResult => ({
  accessToken: response.access_token,
  refreshToken: response.refresh_token,
  expiresIn: response.expires_in,
  user: {
    id: response.user.id,
    firstName: response.user.first_name,
    lastName: response.user.last_name,
    fullName: `${response.user.first_name} ${response.user.last_name}`.trim(),
    email: response.user.email,
    onboardingComplete: response.user.onboarding_complete,
    role: response.user.role,
  },
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Authenticate a user and return a normalised AuthResult. */
export async function loginUser(values: LoginFormValues): Promise<AuthResult> {
  const email = values.email.trim().toLowerCase();

  if (!email) throw new Error('Email is required.');
  if (!values.password.trim()) throw new Error('Password is required.');

  if (shouldUseMocks()) {
    await new Promise((r) => setTimeout(r, 600));

    const mockUser = await findWebUserByEmail(email)
    const passwordOk = await verifyStoredPassword(email, values.password)

    if (!mockUser || !passwordOk) {
      throw new Error('Invalid email or password.');
    }

    const authResult = await getStoredAuthResult(email)
    if (!authResult) {
      throw new Error('Invalid email or password.');
    }

    return authResult
  }

  const payload = toLoginPayload(values);
  const response = await apiFetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg: string;
    try {
      const body = await response.json() as Record<string, unknown>;
      const candidate = body.detail ?? body.message ?? body.error;
      errorMsg = typeof candidate === 'string' ? candidate : response.statusText;
    } catch {
      errorMsg = await response.text().catch(() => response.statusText);
    }
    throw new Error(errorMsg || 'Login failed.');
  }

  return toAuthResult(await response.json() as BackendAuthResponse);
}
