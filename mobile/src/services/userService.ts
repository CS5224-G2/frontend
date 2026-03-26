// =============================================================================
// USER SERVICE — Mobile (Expo/React Native)
// Adapter pattern: maps between backend snake_case and frontend camelCase.
// Gated by EXPO_PUBLIC_USE_MOCKS — set to 'true' to skip real network calls.
// =============================================================================

import type { UserProfile } from '../../../shared/types/index';
import { USE_MOCKS } from '../config/runtime';
import { deleteLocalAccount, getActiveMockAccountId, getLocalDb } from './localDb';

export type { UserProfile };

// ---------------------------------------------------------------------------
// Backend shapes (internal)
// ---------------------------------------------------------------------------

type BackendUserProfileResponse = {
  user_id: string;
  full_name: string;
  email_address: string;
  city_name: string;
  member_since: string;
  cycling_preference: 'Leisure' | 'Commuter' | 'Performance';
  weekly_goal_km: number;
  bio_text: string;
  avatar_url: string | null;
  avatar_color: string;
  ride_stats: {
    total_rides: number;
    total_distance_km: number;
    favorite_trails_count: number;
  };
};

type LocalUserProfileRow = Omit<BackendUserProfileResponse, 'ride_stats'> & {
  total_rides: number;
  total_distance_km: number;
  favorite_trails_count: number;
};

type BackendAvatarUploadResponse = {
  avatar_url: string;
};

type BackendUserProfileUpdatePayload = {
  full_name: string;
  city_name: string;
  cycling_preference: 'Leisure' | 'Commuter' | 'Performance';
  weekly_goal_km: number;
  bio_text: string;
  avatar_color: string;
};

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

const toFrontendProfile = (payload: BackendUserProfileResponse): UserProfile => ({
  userId: payload.user_id,
  fullName: payload.full_name,
  email: payload.email_address,
  location: payload.city_name,
  memberSince: payload.member_since,
  cyclingPreference: payload.cycling_preference,
  weeklyGoalKm: payload.weekly_goal_km,
  bio: payload.bio_text,
  avatarUrl: payload.avatar_url,
  avatarColor: payload.avatar_color,
  stats: {
    totalRides: payload.ride_stats.total_rides,
    totalDistanceKm: payload.ride_stats.total_distance_km,
    favoriteTrails: payload.ride_stats.favorite_trails_count,
  },
});

const toBackendUpdatePayload = (profile: UserProfile): BackendUserProfileUpdatePayload => ({
  full_name: profile.fullName.trim(),
  city_name: profile.location.trim(),
  cycling_preference: profile.cyclingPreference,
  weekly_goal_km: profile.weeklyGoalKm,
  bio_text: profile.bio.trim(),
  avatar_color: profile.avatarColor,
});

const wait = async (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const getMimeType = (imageUri: string): string => {
  const normalised = imageUri.toLowerCase();
  if (normalised.endsWith('.png')) return 'image/png';
  if (normalised.endsWith('.heic')) return 'image/heic';
  if (normalised.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getUserProfile(token?: string): Promise<UserProfile> {
  if (USE_MOCKS) {
    await wait(350);
    const db = await getLocalDb();
    const accountId = await getActiveMockAccountId();
    const row = await db.getFirstAsync<LocalUserProfileRow>(
      `SELECT
        user_id,
        full_name,
        email_address,
        city_name,
        member_since,
        cycling_preference,
        weekly_goal_km,
        bio_text,
        avatar_url,
        avatar_color,
        total_rides,
        total_distance_km,
        favorite_trails_count
      FROM user_profiles
      WHERE account_id = ?`,
      accountId,
    );

    if (!row) {
      throw new Error('User profile not found in the local database.');
    }

    return toFrontendProfile({
      ...row,
      ride_stats: {
        total_rides: row.total_rides,
        total_distance_km: row.total_distance_km,
        favorite_trails_count: row.favorite_trails_count,
      },
    });
  }

  const { httpClient } = await import('./httpClient');
  const response = await httpClient.get<BackendUserProfileResponse>('/user/profile', token);
  return toFrontendProfile(response);
}

export async function updateUserProfile(
  profile: UserProfile,
  token?: string,
): Promise<UserProfile> {
  if (USE_MOCKS) {
    await wait(450);
    const db = await getLocalDb();
    const accountId = await getActiveMockAccountId();

    await db.runAsync(
      `UPDATE user_profiles
       SET
         full_name = ?,
         city_name = ?,
         cycling_preference = ?,
         weekly_goal_km = ?,
         bio_text = ?,
         avatar_color = ?,
         updated_at = ?
       WHERE account_id = ?`,
      profile.fullName.trim(),
      profile.location.trim(),
      profile.cyclingPreference,
      profile.weeklyGoalKm,
      profile.bio.trim(),
      profile.avatarColor,
      new Date().toISOString(),
      accountId,
    );

    return getUserProfile(token);
  }

  const { httpClient } = await import('./httpClient');
  const payload = toBackendUpdatePayload(profile);
  const response = await httpClient.put<BackendUserProfileResponse>(
    '/user/profile',
    payload,
    token,
  );
  return toFrontendProfile(response);
}

export async function uploadUserProfileAvatar(
  imageUri: string,
  token?: string,
): Promise<string> {
  if (USE_MOCKS) {
    await wait(350);
    const db = await getLocalDb();
    const accountId = await getActiveMockAccountId();
    await db.runAsync(
      `UPDATE user_profiles
       SET avatar_url = ?, updated_at = ?
       WHERE account_id = ?`,
      imageUri,
      new Date().toISOString(),
      accountId,
    );
    return imageUri;
  }

  const fileName = imageUri.split('/').pop() || 'profile-avatar.jpg';
  const formData = new FormData();
  formData.append(
    'avatar',
    {
      uri: imageUri,
      name: fileName,
      type: getMimeType(imageUri),
    } as any,
  );

  const { httpClient } = await import('./httpClient');
  const response = await httpClient.post<BackendAvatarUploadResponse>(
    '/user/profile/avatar',
    formData,
    token,
  );
  return response.avatar_url;
}

export async function deleteUserProfileAvatar(token?: string): Promise<void> {
  if (USE_MOCKS) {
    await wait(250);
    const db = await getLocalDb();
    const accountId = await getActiveMockAccountId();
    await db.runAsync(
      `UPDATE user_profiles
       SET avatar_url = NULL, updated_at = ?
       WHERE account_id = ?`,
      new Date().toISOString(),
      accountId,
    );
    return;
  }

  const { httpClient } = await import('./httpClient');
  await httpClient.delete<void>('/user/profile/avatar', token);
}

export async function deleteAccount(token?: string): Promise<void> {
  if (USE_MOCKS) {
    await wait(350);
    const accountId = await getActiveMockAccountId();
    await deleteLocalAccount(accountId);
    return;
  }

  const { httpClient } = await import('./httpClient');
  await httpClient.delete<void>('/user/account', token);
}

// Utility: serialise profile for navigation params
export function serializeUserProfile(profile: UserProfile): string {
  return encodeURIComponent(JSON.stringify(profile));
}

export function parseUserProfileParam(param?: string | string[]): UserProfile | null {
  if (!param) return null;
  const value = Array.isArray(param) ? param[0] : param;
  try {
    return JSON.parse(decodeURIComponent(value)) as UserProfile;
  } catch {
    return null;
  }
}
