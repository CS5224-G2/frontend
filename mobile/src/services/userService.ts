// =============================================================================
// USER SERVICE — Mobile (Expo/React Native)
// Adapter pattern: maps between backend snake_case and frontend camelCase.
// =============================================================================

import type { UserProfile } from '../../../shared/types/index';
import { httpClient } from './httpClient';

export type { UserProfile };

let cachedUserProfile: UserProfile | null = null;

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

function cacheUserProfile(profile: UserProfile | null): UserProfile | null {
  cachedUserProfile = profile;
  return profile;
}

const toBackendUpdatePayload = (profile: UserProfile): BackendUserProfileUpdatePayload => ({
  full_name: profile.fullName.trim(),
  city_name: profile.location.trim(),
  cycling_preference: profile.cyclingPreference,
  weekly_goal_km: profile.weeklyGoalKm,
  bio_text: profile.bio.trim(),
  avatar_color: profile.avatarColor,
});

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
  const response = await httpClient.get<BackendUserProfileResponse>('/user/profile', token);
  return cacheUserProfile(toFrontendProfile(response)) as UserProfile;
}

export async function updateUserProfile(profile: UserProfile, token?: string): Promise<UserProfile> {
  const payload = toBackendUpdatePayload(profile);
  const response = await httpClient.put<BackendUserProfileResponse>('/user/profile', payload, token);
  return cacheUserProfile(toFrontendProfile(response)) as UserProfile;
}

export async function uploadUserProfileAvatar(imageUri: string, token?: string): Promise<string> {
  const fileName = imageUri.split('/').pop() || 'profile-avatar.jpg';
  const formData = new FormData();
  formData.append('avatar', { uri: imageUri, name: fileName, type: getMimeType(imageUri) } as any);
  const response = await httpClient.post<BackendAvatarUploadResponse>('/user/profile/avatar', formData, token);
  if (cachedUserProfile) {
    cachedUserProfile = {
      ...cachedUserProfile,
      avatarUrl: response.avatar_url,
    };
  }
  return response.avatar_url;
}

export async function deleteUserProfileAvatar(token?: string): Promise<void> {
  await httpClient.delete<void>('/user/profile/avatar', token);
  if (cachedUserProfile) {
    cachedUserProfile = {
      ...cachedUserProfile,
      avatarUrl: null,
    };
  }
}

export async function deleteAccount(token?: string): Promise<void> {
  await httpClient.delete<void>('/user/account', token);
  cachedUserProfile = null;
}

export function getCachedUserProfile(): UserProfile | null {
  return cachedUserProfile;
}

export function clearCachedUserProfile(): void {
  cachedUserProfile = null;
}

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
