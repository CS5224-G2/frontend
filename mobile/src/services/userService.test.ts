jest.mock('./httpClient', () => ({
  httpClient: { get: jest.fn(), put: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

import { httpClient } from './httpClient';
import {
  getUserProfile, updateUserProfile, uploadUserProfileAvatar,
  deleteUserProfileAvatar, deleteAccount, getCachedUserProfile, clearCachedUserProfile,
} from './userService';

const mockGet = httpClient.get as jest.Mock;
const mockPut = httpClient.put as jest.Mock;
const mockPost = httpClient.post as jest.Mock;
const mockDelete = httpClient.delete as jest.Mock;

const backendProfile = {
  user_id: 'u1',
  full_name: 'Alice Smith',
  email_address: 'alice@test.com',
  city_name: 'Singapore',
  member_since: '2024-01-01',
  cycling_preference: 'Leisure' as const,
  weekly_goal_km: 50,
  bio_text: 'Cyclist',
  avatar_url: null,
  avatar_color: '#FF5733',
  ride_stats: { total_rides: 10, total_distance_km: 120.5, favorite_trails_count: 3 },
};

beforeEach(() => {
  jest.clearAllMocks();
  clearCachedUserProfile();
});

describe('getUserProfile()', () => {
  it('maps BackendUserProfileResponse to UserProfile camelCase shape', async () => {
    mockGet.mockResolvedValueOnce(backendProfile);
    const profile = await getUserProfile();
    expect(profile.userId).toBe('u1');
    expect(profile.fullName).toBe('Alice Smith');
    expect(profile.email).toBe('alice@test.com');
    expect(profile.location).toBe('Singapore');
    expect(profile.stats.totalRides).toBe(10);
    expect(profile.stats.totalDistanceKm).toBe(120.5);
    expect(profile.stats.favoriteTrails).toBe(3);
    expect(mockGet).toHaveBeenCalledWith('/user/profile', undefined);
    expect(getCachedUserProfile()).toEqual(profile);
  });
});

describe('updateUserProfile()', () => {
  it('sends snake_case PUT payload and returns mapped profile', async () => {
    mockPut.mockResolvedValueOnce(backendProfile);
    const result = await updateUserProfile({
      userId: 'u1', fullName: '  Alice Smith  ', email: 'alice@test.com',
      location: '  Singapore  ', memberSince: '2024-01-01', cyclingPreference: 'Leisure',
      weeklyGoalKm: 50, bio: '  Cyclist  ', avatarUrl: null, avatarColor: '#FF5733',
      stats: { totalRides: 10, totalDistanceKm: 120.5, favoriteTrails: 3 },
    });
    expect(mockPut).toHaveBeenCalledWith(
      '/user/profile',
      expect.objectContaining({ full_name: 'Alice Smith', city_name: 'Singapore', bio_text: 'Cyclist' }),
      undefined,
    );
    expect(result.fullName).toBe('Alice Smith');
  });
});

describe('uploadUserProfileAvatar()', () => {
  it('posts FormData to /user/profile/avatar and returns avatar_url', async () => {
    mockPost.mockResolvedValueOnce({ avatar_url: 'https://cdn.example.com/avatar.jpg' });
    const url = await uploadUserProfileAvatar('file:///photos/photo.jpg');
    expect(mockPost).toHaveBeenCalledWith('/user/profile/avatar', expect.any(FormData), undefined);
    expect(url).toBe('https://cdn.example.com/avatar.jpg');
  });

  it('updates the cached avatar url when a profile is already cached', async () => {
    mockGet.mockResolvedValueOnce(backendProfile);
    await getUserProfile();

    mockPost.mockResolvedValueOnce({ avatar_url: 'https://cdn.example.com/avatar.jpg' });
    await uploadUserProfileAvatar('file:///photos/photo.jpg');

    expect(getCachedUserProfile()).toEqual(
      expect.objectContaining({ avatarUrl: 'https://cdn.example.com/avatar.jpg' })
    );
  });
});

describe('deleteUserProfileAvatar()', () => {
  it('calls DELETE /user/profile/avatar', async () => {
    mockDelete.mockResolvedValueOnce(undefined);
    await deleteUserProfileAvatar();
    expect(mockDelete).toHaveBeenCalledWith('/user/profile/avatar', undefined);
  });

  it('clears the cached avatar url when one exists', async () => {
    mockGet.mockResolvedValueOnce({
      ...backendProfile,
      avatar_url: 'https://cdn.example.com/avatar.jpg',
    });
    await getUserProfile();

    mockDelete.mockResolvedValueOnce(undefined);
    await deleteUserProfileAvatar();

    expect(getCachedUserProfile()).toEqual(expect.objectContaining({ avatarUrl: null }));
  });
});

describe('deleteAccount()', () => {
  it('calls DELETE /user/account', async () => {
    mockDelete.mockResolvedValueOnce(undefined);
    await deleteAccount();
    expect(mockDelete).toHaveBeenCalledWith('/user/account', undefined);
  });
});
