// =============================================================================
// OAUTH SERVICE — Mobile (Expo/React Native)
// Foundation for Google Sign-In (expo-auth-session) and Apple Sign-In
// (expo-apple-authentication).
//
// CURRENT STATE: mock / stub only.
// When connecting to the real backend:
//   1. Replace GOOGLE_CLIENT_IDS with real values from Google Cloud Console.
//   2. Replace the mock POST bodies with the real /auth/google and /auth/apple
//      endpoint payloads defined in the backend auth contract.
//   3. Remove the USE_MOCKS guard — or extend it as you see fit.
// =============================================================================

import type { AuthResult } from '../../../shared/types/index';
import { USE_MOCKS } from '../config/runtime';
import { saveSession } from './secureSession';

// ---------------------------------------------------------------------------
// Google — replace with real client IDs from Google Cloud Console
// ---------------------------------------------------------------------------

// TODO: fill in before connecting to real backend
const GOOGLE_CLIENT_IDS = {
  ios: 'TODO_IOS_CLIENT_ID.apps.googleusercontent.com',
  android: 'TODO_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  web: 'TODO_WEB_CLIENT_ID.apps.googleusercontent.com',
};

export type OAuthProvider = 'google' | 'apple';

export class OAuthNotImplementedError extends Error {
  constructor(provider: OAuthProvider) {
    super(
      `${provider} sign-in is not yet connected to the backend. ` +
      'Fill in the client IDs and backend endpoint in oauthService.ts.',
    );
    this.name = 'OAuthNotImplementedError';
  }
}

// ---------------------------------------------------------------------------
// Google Sign-In
// Uses expo-auth-session (browser-based OAuth2 PKCE flow).
// ---------------------------------------------------------------------------

export async function loginWithGoogle(): Promise<AuthResult> {
  if (USE_MOCKS) {
    // In mock mode: return a stub result so UI can be exercised.
    // Remove this block once the real flow is wired.
    const result: AuthResult = {
      accessToken: 'mock-google-access-token',
      refreshToken: 'mock-google-refresh-token',
      expiresIn: 3600,
      user: {
        id: 'google_mock_001',
        firstName: 'Google',
        lastName: 'User',
        fullName: 'Google User',
        email: 'google.user@example.com',
        onboardingComplete: false,
        role: 'user',
      },
    };
    await saveSession(result);
    return result;
  }

  // --- Real implementation skeleton ---
  // Uncomment and fill in when connecting to the real backend.
  //
  // const { Platform } = await import('react-native');
  // const { makeRedirectUri, useAuthRequest } = await import('expo-auth-session');
  // const Google = await import('expo-auth-session/providers/google');
  //
  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   clientId: Platform.OS === 'ios'     ? GOOGLE_CLIENT_IDS.ios
  //           : Platform.OS === 'android' ? GOOGLE_CLIENT_IDS.android
  //           :                             GOOGLE_CLIENT_IDS.web,
  //   redirectUri: makeRedirectUri({ scheme: 'cyclelink' }),
  // });
  //
  // const authResponse = await promptAsync();
  // if (authResponse?.type !== 'success') throw new Error('Google sign-in cancelled.');
  //
  // const { httpClient } = await import('./httpClient');
  // const backendResult = await httpClient.post<BackendAuthResponse>('/auth/google', {
  //   id_token: authResponse.params.id_token,
  //   client: 'mobile_app',
  // });
  // const result = toAuthResult(backendResult);
  // await saveSession(result);
  // return result;

  throw new OAuthNotImplementedError('google');
}

// ---------------------------------------------------------------------------
// Apple Sign-In
// Uses expo-apple-authentication (native iOS only).
// ---------------------------------------------------------------------------

export async function loginWithApple(): Promise<AuthResult> {
  if (USE_MOCKS) {
    const result: AuthResult = {
      accessToken: 'mock-apple-access-token',
      refreshToken: 'mock-apple-refresh-token',
      expiresIn: 3600,
      user: {
        id: 'apple_mock_001',
        firstName: 'Apple',
        lastName: 'User',
        fullName: 'Apple User',
        email: 'apple.user@privaterelay.appleid.com',
        onboardingComplete: false,
        role: 'user',
      },
    };
    await saveSession(result);
    return result;
  }

  // --- Real implementation skeleton ---
  // Uncomment and fill in when connecting to the real backend.
  //
  // const AppleAuth = await import('expo-apple-authentication');
  // const credential = await AppleAuth.signInAsync({
  //   requestedScopes: [
  //     AppleAuth.AppleAuthenticationScope.FULL_NAME,
  //     AppleAuth.AppleAuthenticationScope.EMAIL,
  //   ],
  // });
  // if (!credential.identityToken) throw new Error('Apple sign-in failed: no identity token.');
  //
  // const { httpClient } = await import('./httpClient');
  // const backendResult = await httpClient.post<BackendAuthResponse>('/auth/apple', {
  //   identity_token: credential.identityToken,
  //   authorization_code: credential.authorizationCode,
  //   full_name: credential.fullName,
  //   client: 'mobile_app',
  // });
  // const result = toAuthResult(backendResult);
  // await saveSession(result);
  // return result;

  throw new OAuthNotImplementedError('apple');
}
