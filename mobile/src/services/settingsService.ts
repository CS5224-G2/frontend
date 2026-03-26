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
import { getActiveMockAccountId, getLocalDb } from './localDb';

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
    notifications_managed_in_os: boolean;
  };
};

type LocalPasswordRow = {
  password: string;
};

type LocalPrivacySettingsRow = {
  third_party_ads_opt_out: number;
  data_improvement_opt_out: number;
  notifications_managed_in_os: number;
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

    const db = await getLocalDb();
    const accountId = await getActiveMockAccountId();
    const row = await db.getFirstAsync<LocalPasswordRow>(
      'SELECT password FROM users WHERE id = ?',
      accountId,
    );

    if (!row || input.currentPassword !== row.password) {
      throw new Error('Current password is incorrect.');
    }

    await db.runAsync(
      `UPDATE users
       SET password = ?, updated_at = ?
       WHERE id = ?`,
      input.newPassword,
      new Date().toISOString(),
      accountId,
    );

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
    const db = await getLocalDb();
    const accountId = await getActiveMockAccountId();
    const row = await db.getFirstAsync<LocalPrivacySettingsRow>(
      `SELECT
        third_party_ads_opt_out,
        data_improvement_opt_out,
        notifications_managed_in_os
      FROM user_privacy_settings
      WHERE account_id = ?`,
      accountId,
    );

    if (!row) {
      throw new Error('Privacy settings not found in the local database.');
    }

    return toFrontendPrivacySettings({
      privacy_controls: {
        third_party_ads_opt_out: Boolean(row.third_party_ads_opt_out),
        data_improvement_opt_out: Boolean(row.data_improvement_opt_out),
      },
      device_permissions: {
        notifications_managed_in_os: Boolean(row.notifications_managed_in_os),
      },
    });
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
    const db = await getLocalDb();
    const accountId = await getActiveMockAccountId();

    await db.runAsync(
      `UPDATE user_privacy_settings
       SET
         third_party_ads_opt_out = ?,
         data_improvement_opt_out = ?,
         notifications_managed_in_os = ?,
         updated_at = ?
       WHERE account_id = ?`,
      payload.privacy_controls.third_party_ads_opt_out ? 1 : 0,
      payload.privacy_controls.data_improvement_opt_out ? 1 : 0,
      settings.notificationsManagedInDeviceSettings ? 1 : 0,
      new Date().toISOString(),
      accountId,
    );

    return getPrivacySecuritySettings(token);
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
