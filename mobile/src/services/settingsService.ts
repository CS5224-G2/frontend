// =============================================================================
// SETTINGS SERVICE — Mobile (Expo/React Native)
// Adapter pattern: maps between backend snake_case and frontend camelCase.
// Gated by EXPO_PUBLIC_USE_MOCKS — set to 'true' to skip real network calls.
// =============================================================================

import type {
  ChangePasswordInput,
  PasswordUpdateResult,
  PrivacySecuritySettings,
} from '../../../shared/types/index';
import {
  mockPrivacySettings,
  mockStoredPassword,
} from '../../../shared/mocks/index';

export type { ChangePasswordInput, PasswordUpdateResult, PrivacySecuritySettings };

const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';

// ---------------------------------------------------------------------------
// Backend shapes (internal)
// ---------------------------------------------------------------------------

type BackendPasswordUpdatePayload = {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
};

type BackendPasswordUpdateResponse = {
  status: 'ok';
  message: string;
  updated_at: string;
};

type BackendPrivacySecurityPayload = {
  privacy_controls: {
    third_party_ads_opt_out: boolean;
    data_improvement_opt_out: boolean;
  };
};

type BackendPrivacySecurityResponse = {
  privacy_controls: {
    third_party_ads_opt_out: boolean;
    data_improvement_opt_out: boolean;
  };
  device_permissions: {
    notifications_managed_in_os: true;
  };
};

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

const toBackendPasswordPayload = (input: ChangePasswordInput): BackendPasswordUpdatePayload => ({
  current_password: input.currentPassword.trim(),
  new_password: input.newPassword.trim(),
  confirm_new_password: input.confirmNewPassword.trim(),
});

const toFrontendPrivacySettings = (
  payload: BackendPrivacySecurityResponse,
): PrivacySecuritySettings => ({
  noThirdPartyAds: payload.privacy_controls.third_party_ads_opt_out,
  noDataImprovement: payload.privacy_controls.data_improvement_opt_out,
  notificationsManagedInDeviceSettings: payload.device_permissions.notifications_managed_in_os,
});

const toBackendPrivacyPayload = (
  settings: PrivacySecuritySettings,
): BackendPrivacySecurityPayload => ({
  privacy_controls: {
    third_party_ads_opt_out: settings.noThirdPartyAds,
    data_improvement_opt_out: settings.noDataImprovement,
  },
});

const toPasswordUpdateResult = (r: BackendPasswordUpdateResponse): PasswordUpdateResult => ({
  status: r.status,
  message: r.message,
  updatedAt: r.updated_at,
});

// ---------------------------------------------------------------------------
// In-memory mock stores (only used in mock mode)
// ---------------------------------------------------------------------------

let _mockStoredPassword = mockStoredPassword;
let _mockPrivacySettings: BackendPrivacySecurityResponse = {
  privacy_controls: {
    third_party_ads_opt_out: mockPrivacySettings.noThirdPartyAds,
    data_improvement_opt_out: mockPrivacySettings.noDataImprovement,
  },
  device_permissions: { notifications_managed_in_os: true },
};

const wait = async (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function updatePassword(
  input: ChangePasswordInput,
  token?: string,
): Promise<PasswordUpdateResult> {
  if (USE_MOCKS) {
    await wait(600);
    if (input.newPassword !== input.confirmNewPassword) {
      throw new Error('New password confirmation does not match.');
    }
    if (input.currentPassword !== _mockStoredPassword) {
      throw new Error('Current password is incorrect.');
    }
    _mockStoredPassword = input.newPassword;
    return { status: 'ok', message: 'Password updated successfully.', updatedAt: new Date().toISOString() };
  }

  const { httpClient } = await import('./httpClient');
  const payload = toBackendPasswordPayload(input);
  const response = await httpClient.post<BackendPasswordUpdateResponse>(
    '/user/password',
    payload,
    token,
  );
  return toPasswordUpdateResult(response);
}

export async function getPrivacySecuritySettings(token?: string): Promise<PrivacySecuritySettings> {
  if (USE_MOCKS) {
    await wait(300);
    return toFrontendPrivacySettings(_mockPrivacySettings);
  }

  const { httpClient } = await import('./httpClient');
  const response = await httpClient.get<BackendPrivacySecurityResponse>('/user/privacy', token);
  return toFrontendPrivacySettings(response);
}

export async function updatePrivacySecuritySettings(
  settings: PrivacySecuritySettings,
  token?: string,
): Promise<PrivacySecuritySettings> {
  if (USE_MOCKS) {
    await wait(450);
    const payload = toBackendPrivacyPayload(settings);
    _mockPrivacySettings = {
      ..._mockPrivacySettings,
      privacy_controls: {
        ..._mockPrivacySettings.privacy_controls,
        ...payload.privacy_controls,
      },
    };
    return toFrontendPrivacySettings(_mockPrivacySettings);
  }

  const { httpClient } = await import('./httpClient');
  const payload = toBackendPrivacyPayload(settings);
  const response = await httpClient.put<BackendPrivacySecurityResponse>(
    '/user/privacy',
    payload,
    token,
  );
  return toFrontendPrivacySettings(response);
}
