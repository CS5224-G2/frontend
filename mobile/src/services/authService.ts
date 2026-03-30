// =============================================================================
// AUTH SERVICE — Mobile (Expo/React Native)
// Adapter pattern: maps between backend snake_case and frontend camelCase.
// =============================================================================

import type { LoginFormValues, RegisterFormValues, AuthResult } from '../../../shared/types/index';
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function loginUser(values: LoginFormValues): Promise<AuthResult> {
  if (!values.email || !values.password) {
    throw new Error('Email and password are required.');
  }

  const payload = toLoginPayload(values);
  const response = await httpClient.post<BackendAuthResponse>('/auth/login', payload);
  const result = toAuthResult(response);
  await saveSession(result);
  return result;
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
