// =============================================================================
// SETTINGS SERVICE — Mobile (Expo/React Native)
// Adapter pattern: maps between backend snake_case and frontend camelCase.
// =============================================================================

import type { ChangePasswordInput, PasswordUpdateResult, PrivacySecuritySettings } from '../../../shared/types/index';
import { httpClient } from './httpClient';

export type { ChangePasswordInput, PasswordUpdateResult, PrivacySecuritySettings };

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
    notifications_managed_in_os: boolean;
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

const toFrontendPrivacySettings = (payload: BackendPrivacySecurityResponse): PrivacySecuritySettings => ({
  noThirdPartyAds: payload.privacy_controls.third_party_ads_opt_out,
  noDataImprovement: payload.privacy_controls.data_improvement_opt_out,
  notificationsManagedInDeviceSettings: payload.device_permissions.notifications_managed_in_os,
});

const toBackendPrivacyPayload = (settings: PrivacySecuritySettings): BackendPrivacySecurityPayload => ({
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
// Public API
// ---------------------------------------------------------------------------

export async function updatePassword(input: ChangePasswordInput, token?: string): Promise<PasswordUpdateResult> {
  const payload = toBackendPasswordPayload(input);
  const response = await httpClient.post<BackendPasswordUpdateResponse>('/user/password', payload, token);
  return toPasswordUpdateResult(response);
}

export async function getPrivacySecuritySettings(token?: string): Promise<PrivacySecuritySettings> {
  const response = await httpClient.get<BackendPrivacySecurityResponse>('/user/privacy', token);
  return toFrontendPrivacySettings(response);
}

export async function updatePrivacySecuritySettings(
  settings: PrivacySecuritySettings,
  token?: string,
): Promise<PrivacySecuritySettings> {
  const payload = toBackendPrivacyPayload(settings);
  const response = await httpClient.put<BackendPrivacySecurityResponse>('/user/privacy', payload, token);
  return toFrontendPrivacySettings(response);
}
