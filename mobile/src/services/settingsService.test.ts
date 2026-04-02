jest.mock('./httpClient', () => ({
  httpClient: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

import { httpClient } from './httpClient';
import { updatePassword, getPrivacySecuritySettings, updatePrivacySecuritySettings } from './settingsService';

const mockGet = httpClient.get as jest.Mock;
const mockPost = httpClient.post as jest.Mock;
const mockPut = httpClient.put as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('updatePassword()', () => {
  it('posts trimmed fields to /user/password and returns mapped result', async () => {
    mockPost.mockResolvedValueOnce({ status: 'ok', message: 'Updated.', updated_at: '2026-01-01T00:00:00Z' });
    const result = await updatePassword({
      currentPassword: ' OldPass1 ',
      newPassword: ' NewPass1 ',
      confirmNewPassword: ' NewPass1 ',
    });
    expect(mockPost).toHaveBeenCalledWith(
      '/user/password',
      { current_password: 'OldPass1', new_password: 'NewPass1', confirm_new_password: 'NewPass1' },
      undefined,
    );
    expect(result.status).toBe('ok');
    expect(result.updatedAt).toBe('2026-01-01T00:00:00Z');
  });
});

describe('getPrivacySecuritySettings()', () => {
  it('maps backend response to PrivacySecuritySettings', async () => {
    mockGet.mockResolvedValueOnce({
      privacy_controls: { third_party_ads_opt_out: true, data_improvement_opt_out: false },
      device_permissions: { notifications_managed_in_os: true },
    });
    const settings = await getPrivacySecuritySettings();
    expect(settings.noThirdPartyAds).toBe(true);
    expect(settings.noDataImprovement).toBe(false);
    expect(settings.notificationsManagedInDeviceSettings).toBe(true);
  });
});

describe('updatePrivacySecuritySettings()', () => {
  it('sends only privacy_controls (not device_permissions) to PUT /user/privacy', async () => {
    mockPut.mockResolvedValueOnce({
      privacy_controls: { third_party_ads_opt_out: true, data_improvement_opt_out: true },
      device_permissions: { notifications_managed_in_os: false },
    });
    await updatePrivacySecuritySettings({
      noThirdPartyAds: true,
      noDataImprovement: true,
      notificationsManagedInDeviceSettings: false,
    });
    expect(mockPut).toHaveBeenCalledWith(
      '/user/privacy',
      { privacy_controls: { third_party_ads_opt_out: true, data_improvement_opt_out: true } },
      undefined,
    );
  });
});
