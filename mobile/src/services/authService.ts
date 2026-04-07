// =============================================================================
// AUTH SERVICE — Mobile (Expo/React Native)
// Adapter pattern: maps between backend snake_case and frontend camelCase.
// =============================================================================

import type { LoginFormValues, RegisterFormValues, AuthResult } from '../../../shared/types/index';
import { getApiBaseUrl } from '../config/runtime';
import { httpClient } from './httpClient';
import { saveSession } from './secureSession';

export type { LoginFormValues, RegisterFormValues, AuthResult };
export type { AuthUser } from '../../../shared/types/index';

// ---------------------------------------------------------------------------
// Backend shapes (internal)
// ---------------------------------------------------------------------------

type BackendLoginPayload = {
  email: string;
  password: string;
  remember_me: boolean;
  client: 'mobile_app';
};

type BackendRegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
  agreed_to_terms: boolean;
  client: 'mobile_app';
};

type BackendForgotPasswordPayload = {
  email: string;
};

type BackendResetPasswordPayload = {
  token: string;
  new_password: string;
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

type BackendMessageResponse = {
  message?: string;
  detail?: string;
};

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const toLoginPayload = (values: LoginFormValues): BackendLoginPayload => ({
  email: normalizeEmail(values.email),
  password: values.password,
  remember_me: values.rememberMe ?? false,
  client: 'mobile_app',
});

const toRegisterPayload = (values: RegisterFormValues): BackendRegisterPayload => ({
  first_name: values.firstName.trim(),
  last_name: values.lastName.trim(),
  email: normalizeEmail(values.email),
  password: values.password,
  confirm_password: values.confirmPassword,
  agreed_to_terms: values.agreedToTerms,
  client: 'mobile_app',
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

const INVALID_LOGIN_PATTERNS = [
  /invalid credentials/i,
  /invalid email or password/i,
  /wrong email or password/i,
  /incorrect email or password/i,
  /incorrect password/i,
  /user not found/i,
];

function isInvalidLoginError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorWithStatus = error as { status?: unknown };
  const status = typeof errorWithStatus?.status === 'number'
    ? errorWithStatus.status
    : null;

  if (status === 401) {
    return true;
  }

  return INVALID_LOGIN_PATTERNS.some((pattern) => pattern.test(error.message));
}

async function readBackendMessage(response: Response, fallback: string): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => null) as BackendMessageResponse | null;
    if (typeof payload?.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
    if (typeof payload?.detail === 'string' && payload.detail.trim()) {
      return payload.detail;
    }
  }

  const text = (await response.text().catch(() => '')).trim();
  return text || fallback;
}

async function postPublicMessage(
  path: string,
  payload: BackendForgotPasswordPayload | BackendResetPasswordPayload,
  failureMessage: string,
  successMessage: string,
): Promise<string> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readBackendMessage(response, failureMessage));
  }

  return readBackendMessage(response, successMessage);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function loginUser(values: LoginFormValues): Promise<AuthResult> {
  if (!values.email || !values.password) {
    throw new Error('Email and password are required.');
  }

  const payload = toLoginPayload(values);

  try {
    const response = await httpClient.post<BackendAuthResponse>('/auth/login', payload);
    const result = toAuthResult(response);
    await saveSession(result);
    return result;
  } catch (error) {
    if (isInvalidLoginError(error)) {
      throw new Error('Wrong email or password');
    }

    throw error;
  }
}

export async function registerUser(values: RegisterFormValues): Promise<AuthResult> {
  if (!values.firstName || !values.lastName || !values.email || !values.password || !values.confirmPassword) {
    throw new Error('All fields are required.');
  }

  if (values.password !== values.confirmPassword) {
    throw new Error('Passwords do not match.');
  }

  if (!values.agreedToTerms) {
    throw new Error('You must accept the terms to continue.');
  }

  const payload = toRegisterPayload(values);
  const response = await httpClient.post<BackendAuthResponse>('/auth/register', payload);
  const result = toAuthResult(response);
  await saveSession(result);
  return result;
}

export async function requestPasswordReset(email: string): Promise<string> {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error('Email is required.');
  }

  return postPublicMessage(
    '/auth/forgot-password',
    { email: normalizedEmail },
    'Failed to send reset token.',
    'If an account exists, a reset token has been sent.',
  );
}

export async function resetPassword(token: string, newPassword: string): Promise<string> {
  const trimmedToken = token.trim();
  const trimmedPassword = newPassword.trim();

  if (!trimmedToken) {
    throw new Error('Reset token is required.');
  }

  if (!trimmedPassword) {
    throw new Error('New password is required.');
  }

  return postPublicMessage(
    '/auth/reset-password',
    {
      token: trimmedToken,
      new_password: trimmedPassword,
    },
    'Password reset failed.',
    'Password reset successful.',
  );
}
