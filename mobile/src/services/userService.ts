type BackendRideStats = {
  total_rides: number;
  total_distance_km: number;
  favorite_trails_count: number;
};

type BackendUserProfileResponse = {
  user_id: string;
  full_name: string;
  email_address: string;
  city_name: string;
  member_since: string;
  cycling_preference: 'Leisure' | 'Commuter' | 'Performance';
  weekly_goal_km: number;
  bio_text: string;
  avatar_color: string;
  ride_stats: BackendRideStats;
};

type BackendUserProfileUpdatePayload = {
  full_name: string;
  city_name: string;
  cycling_preference: 'Leisure' | 'Commuter' | 'Performance';
  weekly_goal_km: number;
  bio_text: string;
  avatar_color: string;
};

export type UserProfile = {
  userId: string;
  fullName: string;
  email: string;
  location: string;
  memberSince: string;
  cyclingPreference: 'Leisure' | 'Commuter' | 'Performance';
  weeklyGoalKm: number;
  bio: string;
  avatarColor: string;
  stats: {
    totalRides: number;
    totalDistanceKm: number;
    favoriteTrails: number;
  };
};

let mockBackendUserProfile: BackendUserProfileResponse = {
  user_id: 'rider_1024',
  full_name: 'Alex Johnson',
  email_address: 'alex.johnson@example.com',
  city_name: 'San Francisco, CA',
  member_since: 'January 2025',
  cycling_preference: 'Leisure',
  weekly_goal_km: 80,
  bio_text:
    'Weekend rider focused on scenic waterfront routes, coffee stops, and low-stress climbs.',
  avatar_color: '#1D4ED8',
  ride_stats: {
    total_rides: 47,
    total_distance_km: 385.6,
    favorite_trails_count: 28,
  },
};

const wait = async (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const toFrontendProfile = (payload: BackendUserProfileResponse): UserProfile => ({
  userId: payload.user_id,
  fullName: payload.full_name,
  email: payload.email_address,
  location: payload.city_name,
  memberSince: payload.member_since,
  cyclingPreference: payload.cycling_preference,
  weeklyGoalKm: payload.weekly_goal_km,
  bio: payload.bio_text,
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

export async function getUserProfile(): Promise<UserProfile> {
  await wait(350);
  return toFrontendProfile(mockBackendUserProfile);
}

export async function updateUserProfile(profile: UserProfile): Promise<UserProfile> {
  await wait(450);

  const backendPayload = toBackendUpdatePayload(profile);

  mockBackendUserProfile = {
    ...mockBackendUserProfile,
    ...backendPayload,
  };

  return toFrontendProfile(mockBackendUserProfile);
}

export function serializeUserProfile(profile: UserProfile): string {
  return encodeURIComponent(JSON.stringify(profile));
}

export function parseUserProfileParam(param?: string | string[]): UserProfile | null {
  if (!param) {
    return null;
  }

  const value = Array.isArray(param) ? param[0] : param;

  try {
    return JSON.parse(decodeURIComponent(value)) as UserProfile;
  } catch {
    return null;
  }
}
