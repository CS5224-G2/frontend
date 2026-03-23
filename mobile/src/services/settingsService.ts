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

type BackendPrivacySecurityResponse = {
  privacy_controls: {
    third_party_ads_opt_out: boolean;
    data_improvement_opt_out: boolean;
  };
  device_permissions: {
    notifications_managed_in_os: true;
  };
};

type BackendPrivacySecurityUpdatePayload = {
  privacy_controls: {
    third_party_ads_opt_out: boolean;
    data_improvement_opt_out: boolean;
  };
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type PrivacySecuritySettings = {
  noThirdPartyAds: boolean;
  noDataImprovement: boolean;
  notificationsManagedInDeviceSettings: boolean;
};

let mockStoredPassword = 'CycleLink123';

let mockPrivacySecuritySettings: BackendPrivacySecurityResponse = {
  privacy_controls: {
    third_party_ads_opt_out: false,
    data_improvement_opt_out: false,
  },
  device_permissions: {
    notifications_managed_in_os: true,
  },
};

const wait = async (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const toBackendPasswordPayload = (
  input: ChangePasswordInput
): BackendPasswordUpdatePayload => ({
  current_password: input.currentPassword.trim(),
  new_password: input.newPassword.trim(),
  confirm_new_password: input.confirmNewPassword.trim(),
});

const toFrontendPrivacySettings = (
  payload: BackendPrivacySecurityResponse
): PrivacySecuritySettings => ({
  noThirdPartyAds: payload.privacy_controls.third_party_ads_opt_out,
  noDataImprovement: payload.privacy_controls.data_improvement_opt_out,
  notificationsManagedInDeviceSettings: payload.device_permissions.notifications_managed_in_os,
});

const toBackendPrivacyPayload = (
  settings: PrivacySecuritySettings
): BackendPrivacySecurityUpdatePayload => ({
  privacy_controls: {
    third_party_ads_opt_out: settings.noThirdPartyAds,
    data_improvement_opt_out: settings.noDataImprovement,
  },
});

export async function updatePassword(
  input: ChangePasswordInput
): Promise<BackendPasswordUpdateResponse> {
  await wait(600);

  const payload = toBackendPasswordPayload(input);

  if (payload.new_password !== payload.confirm_new_password) {
    throw new Error('New password confirmation does not match.');
  }

  if (payload.current_password !== mockStoredPassword) {
    throw new Error('Current password is incorrect.');
  }

  mockStoredPassword = payload.new_password;

  return {
    status: 'ok',
    message: 'Password updated successfully.',
    updated_at: new Date().toISOString(),
  };
}

export async function getPrivacySecuritySettings(): Promise<PrivacySecuritySettings> {
  await wait(300);
  return toFrontendPrivacySettings(mockPrivacySecuritySettings);
}

export async function updatePrivacySecuritySettings(
  settings: PrivacySecuritySettings
): Promise<PrivacySecuritySettings> {
  await wait(450);

  const payload = toBackendPrivacyPayload(settings);

  mockPrivacySecuritySettings = {
    ...mockPrivacySecuritySettings,
    privacy_controls: {
      ...mockPrivacySecuritySettings.privacy_controls,
      ...payload.privacy_controls,
    },
  };

  return toFrontendPrivacySettings(mockPrivacySecuritySettings);
}
