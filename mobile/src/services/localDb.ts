import type { SQLiteDatabase } from 'expo-sqlite';
import { hashPassword } from '../utils/passwordHash';
import {
  mockAdminUser,
  mockAuthUser,
  mockBusinessUser,
  mockMonthlyData,
  mockPrivacySettings,
  mockRideHistory,
  mockRoutes,
  mockStoredPassword,
  mockUserProfile,
  mockWeeklyData,
} from '../../../shared/mocks/index';

const DATABASE_NAME = 'cyclelink-local.db';
const DEFAULT_ACCOUNT_ID = mockAuthUser.id;
const IS_TEST_ENV = Boolean(process.env.JEST_WORKER_ID);

// Schema version — bump when DDL changes require a migration.
// v1: added password_hash, removed plaintext token columns from users.
// v2: migration now drops ALL seeded tables (not just users) to avoid
//     UNIQUE constraint failures on user_profiles when reseeding.
// v3: add route_points_of_interest table for ride details POI rendering.
const SCHEMA_VERSION = 3;

type DatabaseLike = Pick<
  SQLiteDatabase,
  'execAsync' | 'runAsync' | 'getFirstAsync' | 'getAllAsync' | 'withTransactionAsync'
>;

type UserRow = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  password_hash: string;
  onboarding_complete: number;
  role: 'user' | 'admin' | 'business';
  created_at: string;
  updated_at: string;
};

type AppSessionRow = {
  current_account_id: string;
  updated_at: string;
};

type UserProfileRow = {
  account_id: string;
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
  total_rides: number;
  total_distance_km: number;
  favorite_trails_count: number;
  updated_at: string;
};

type UserPrivacySettingsRow = {
  account_id: string;
  third_party_ads_opt_out: number;
  data_improvement_opt_out: number;
  notifications_managed_in_os: number;
  updated_at: string;
};

type RouteRow = {
  id: string;
  name: string;
  description: string;
  distance_km: number;
  elevation_m: number;
  estimated_time_min: number;
  rating: number;
  review_count: number;
  start_lat: number;
  start_lng: number;
  start_name: string;
  end_lat: number;
  end_lng: number;
  end_name: string;
  cyclist_type: 'recreational' | 'commuter' | 'fitness' | 'general';
  shade_pct: number;
  air_quality_index: number;
};

type RouteCheckpointRow = {
  id: string;
  route_id: string;
  sort_order: number;
  name: string;
  lat: number;
  lng: number;
  description: string;
};

type RoutePointOfInterestRow = {
  id: string;
  route_id: string;
  sort_order: number;
  name: string;
  description: string;
  lat: number;
  lng: number;
};

type RideHistoryRow = {
  id: string;
  account_id: string;
  route_id: string;
  route_name: string;
  completion_date: string;
  completion_time: string;
  start_time: string | null;
  end_time: string | null;
  total_time_min: number;
  distance_km: number;
  avg_speed_kmh: number;
  checkpoints_visited: number;
  user_rating: number | null;
  user_review: string | null;
};

type DistanceStatRow = {
  id: string;
  account_id: string;
  period: 'week' | 'month';
  label: string;
  distance_km: number;
  sort_order: number;
};

type RideFeedbackRow = {
  id: number;
  account_id: string;
  route_id: string;
  rating: number;
  review_text: string;
  created_at: string;
};

type TestState = {
  users: UserRow[];
  appSession: AppSessionRow | null;
  userProfiles: UserProfileRow[];
  userPrivacySettings: UserPrivacySettingsRow[];
  routes: RouteRow[];
  routeCheckpoints: RouteCheckpointRow[];
  routePointsOfInterest: RoutePointOfInterestRow[];
  rideHistory: RideHistoryRow[];
  distanceStats: DistanceStatRow[];
  rideFeedback: RideFeedbackRow[];
  nextFeedbackId: number;
};

let databasePromise: Promise<DatabaseLike> | null = null;
let synchronizeFromMocksPromise: Promise<void> | null = null;

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const nowIso = () => new Date().toISOString();

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim().toUpperCase();
}

function sortRoutes(rows: RouteRow[]): RouteRow[] {
  return [...rows].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.review_count - a.review_count;
  });
}

// Pre-computed SHA-256 of the seeded mock credential (mockStoredPassword = 'CycleLink123').
// Used by the in-memory test database so createSeedState() can be synchronous.
// This is a hash digest, not a credential.
// Computed via: createHash('sha256').update('CycleLink123').digest('hex')
const SEED_CREDENTIAL_DIGEST = 'bb63bcbb3d935953e5d2141dda133be2ae42747d439c51c3d5364681a5419916';

function createSeedState(): TestState {
  const createdAt = nowIso();
  const authUsers = [mockAuthUser, mockAdminUser, mockBusinessUser];
  const users = authUsers.map<UserRow>((user) => ({
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    full_name: user.fullName,
    email: normalizeEmail(user.email),
    password_hash: SEED_CREDENTIAL_DIGEST,
    onboarding_complete: user.onboardingComplete ? 1 : 0,
    role: user.role,
    created_at: createdAt,
    updated_at: createdAt,
  }));

  const userProfiles: UserProfileRow[] = [
    {
      account_id: DEFAULT_ACCOUNT_ID,
      user_id: mockUserProfile.userId,
      full_name: mockUserProfile.fullName,
      email_address: normalizeEmail(mockAuthUser.email),
      city_name: mockUserProfile.location,
      member_since: mockUserProfile.memberSince,
      cycling_preference: mockUserProfile.cyclingPreference,
      weekly_goal_km: mockUserProfile.weeklyGoalKm,
      bio_text: mockUserProfile.bio,
      avatar_url: mockUserProfile.avatarUrl,
      avatar_color: mockUserProfile.avatarColor,
      total_rides: mockUserProfile.stats.totalRides,
      total_distance_km: mockUserProfile.stats.totalDistanceKm,
      favorite_trails_count: mockUserProfile.stats.favoriteTrails,
      updated_at: createdAt,
    },
  ];

  const userPrivacySettings: UserPrivacySettingsRow[] = [
    {
      account_id: DEFAULT_ACCOUNT_ID,
      third_party_ads_opt_out: mockPrivacySettings.noThirdPartyAds ? 1 : 0,
      data_improvement_opt_out: mockPrivacySettings.noDataImprovement ? 1 : 0,
      notifications_managed_in_os: mockPrivacySettings.notificationsManagedInDeviceSettings ? 1 : 0,
      updated_at: createdAt,
    },
  ];

  const routes = mockRoutes.map<RouteRow>((route) => ({
    id: route.id,
    name: route.name,
    description: route.description,
    distance_km: route.distance,
    elevation_m: route.elevation,
    estimated_time_min: route.estimatedTime,
    rating: route.rating,
    review_count: route.reviewCount,
    start_lat: route.startPoint.lat,
    start_lng: route.startPoint.lng,
    start_name: route.startPoint.name,
    end_lat: route.endPoint.lat,
    end_lng: route.endPoint.lng,
    end_name: route.endPoint.name,
    cyclist_type: route.cyclistType,
    shade_pct: route.shade,
    air_quality_index: route.airQuality,
  }));

  const routeCheckpoints = mockRoutes.flatMap<RouteCheckpointRow>((route) =>
    route.checkpoints.map((checkpoint, index) => ({
      id: checkpoint.id,
      route_id: route.id,
      sort_order: index,
      name: checkpoint.name,
      lat: checkpoint.lat,
      lng: checkpoint.lng,
      description: checkpoint.description,
    })),
  );

  const routePointsOfInterest = mockRoutes.flatMap<RoutePointOfInterestRow>((route) =>
    (route.pointsOfInterestVisited ?? []).map((point, index) => ({
      id: `poi-${route.id}-${index + 1}`,
      route_id: route.id,
      sort_order: index,
      name: point.name,
      description: point.description ?? point.name,
      lat: route.startPoint.lat,
      lng: route.startPoint.lng,
    })),
  );

  const rideHistory = mockRideHistory.map<RideHistoryRow>((ride) => ({
    id: ride.id,
    account_id: DEFAULT_ACCOUNT_ID,
    route_id: ride.routeId,
    route_name: ride.routeName,
    completion_date: ride.completionDate,
    completion_time: ride.completionTime,
    start_time: ride.startTime ?? null,
    end_time: ride.endTime ?? null,
    total_time_min: ride.totalTime,
    distance_km: ride.distance,
    avg_speed_kmh: ride.avgSpeed,
    checkpoints_visited: ride.checkpoints,
    user_rating: ride.userRating ?? null,
    user_review: ride.userReview ?? null,
  }));

  const distanceStats: DistanceStatRow[] = [
    ...mockWeeklyData.map((point, index) => ({
      id: point.id,
      account_id: DEFAULT_ACCOUNT_ID,
      period: 'week' as const,
      label: 'day' in point ? point.day : point.week,
      distance_km: point.distance,
      sort_order: index,
    })),
    ...mockMonthlyData.map((point, index) => ({
      id: point.id,
      account_id: DEFAULT_ACCOUNT_ID,
      period: 'month' as const,
      label: 'week' in point ? point.week : point.day,
      distance_km: point.distance,
      sort_order: index,
    })),
  ];

  return {
    users,
    appSession: {
      current_account_id: DEFAULT_ACCOUNT_ID,
      updated_at: createdAt,
    },
    userProfiles,
    userPrivacySettings,
    routes,
    routeCheckpoints,
    routePointsOfInterest,
    rideHistory,
    distanceStats,
    rideFeedback: [],
    nextFeedbackId: 1,
  };
}

function createTestDatabase(): DatabaseLike {
  const state = createSeedState();

  const db: DatabaseLike = {
    execAsync: async () => undefined,
    withTransactionAsync: async (task) => {
      await task();
    },
    runAsync: async (source: string, ...params: any[]) => {
      const sql = normalizeSql(source);

      if (sql.startsWith('INSERT INTO APP_SESSION')) {
        state.appSession = {
          current_account_id: params[0],
          updated_at: params[1],
        };
        return { lastInsertRowId: 1, changes: 1 } as any;
      }

      if (sql.startsWith('INSERT INTO USERS')) {
        state.users.push({
          id: params[0],
          first_name: params[1],
          last_name: params[2],
          full_name: params[3],
          email: params[4],
          password_hash: params[5],
          onboarding_complete: params[6],
          role: params[7],
          created_at: params[8],
          updated_at: params[9],
        });
        return { lastInsertRowId: 1, changes: 1 } as any;
      }

      if (sql.startsWith('INSERT INTO USER_PROFILES')) {
        state.userProfiles.push({
          account_id: params[0],
          user_id: params[1],
          full_name: params[2],
          email_address: params[3],
          city_name: params[4],
          member_since: params[5],
          cycling_preference: params[6],
          weekly_goal_km: params[7],
          bio_text: params[8],
          avatar_url: params[9],
          avatar_color: params[10],
          total_rides: params[11],
          total_distance_km: params[12],
          favorite_trails_count: params[13],
          updated_at: params[14],
        });
        return { lastInsertRowId: 1, changes: 1 } as any;
      }

      if (sql.startsWith('INSERT INTO USER_PRIVACY_SETTINGS')) {
        state.userPrivacySettings.push({
          account_id: params[0],
          third_party_ads_opt_out: params[1],
          data_improvement_opt_out: params[2],
          notifications_managed_in_os: params[3],
          updated_at: params[4],
        });
        return { lastInsertRowId: 1, changes: 1 } as any;
      }

      if (sql.startsWith('INSERT INTO DISTANCE_STATS')) {
        state.distanceStats.push({
          id: params[0],
          account_id: params[1],
          period: params[2],
          label: params[3],
          distance_km: params[4],
          sort_order: params[5],
        });
        return { lastInsertRowId: 1, changes: 1 } as any;
      }

      if (sql.startsWith('UPDATE USERS SET PASSWORD_HASH')) {
        const user = state.users.find((item) => item.id === params[2]);
        if (user) {
          user.password_hash = params[0];
          user.updated_at = params[1];
        }
        return { lastInsertRowId: 0, changes: user ? 1 : 0 } as any;
      }

      if (sql.startsWith('UPDATE USER_PROFILES SET FULL_NAME')) {
        const profile = state.userProfiles.find((item) => item.account_id === params[7]);
        if (profile) {
          profile.full_name = params[0];
          profile.city_name = params[1];
          profile.cycling_preference = params[2];
          profile.weekly_goal_km = params[3];
          profile.bio_text = params[4];
          profile.avatar_color = params[5];
          profile.updated_at = params[6];
        }
        return { lastInsertRowId: 0, changes: profile ? 1 : 0 } as any;
      }

      if (sql.startsWith('UPDATE USER_PROFILES SET AVATAR_URL = ?')) {
        const profile = state.userProfiles.find((item) => item.account_id === params[2]);
        if (profile) {
          profile.avatar_url = params[0];
          profile.updated_at = params[1];
        }
        return { lastInsertRowId: 0, changes: profile ? 1 : 0 } as any;
      }

      if (sql.startsWith('UPDATE USER_PROFILES SET AVATAR_URL = NULL')) {
        const profile = state.userProfiles.find((item) => item.account_id === params[1]);
        if (profile) {
          profile.avatar_url = null;
          profile.updated_at = params[0];
        }
        return { lastInsertRowId: 0, changes: profile ? 1 : 0 } as any;
      }

      if (sql.startsWith('UPDATE USER_PRIVACY_SETTINGS SET')) {
        const settings = state.userPrivacySettings.find((item) => item.account_id === params[4]);
        if (settings) {
          settings.third_party_ads_opt_out = params[0];
          settings.data_improvement_opt_out = params[1];
          settings.notifications_managed_in_os = params[2];
          settings.updated_at = params[3];
        }
        return { lastInsertRowId: 0, changes: settings ? 1 : 0 } as any;
      }

      if (sql.startsWith('INSERT INTO RIDE_FEEDBACK')) {
        const id = state.nextFeedbackId;
        state.nextFeedbackId += 1;
        state.rideFeedback.push({
          id,
          account_id: params[0],
          route_id: params[1],
          rating: params[2],
          review_text: params[3],
          created_at: params[4],
        });
        return { lastInsertRowId: id, changes: 1 } as any;
      }

      if (sql.startsWith('DELETE FROM RIDE_FEEDBACK WHERE ACCOUNT_ID = ?')) {
        const before = state.rideFeedback.length;
        state.rideFeedback = state.rideFeedback.filter((r) => r.account_id !== params[0]);
        return { lastInsertRowId: 0, changes: before - state.rideFeedback.length } as any;
      }

      if (sql.startsWith('DELETE FROM DISTANCE_STATS WHERE ACCOUNT_ID = ?')) {
        const before = state.distanceStats.length;
        state.distanceStats = state.distanceStats.filter((r) => r.account_id !== params[0]);
        return { lastInsertRowId: 0, changes: before - state.distanceStats.length } as any;
      }

      if (sql.startsWith('DELETE FROM RIDE_HISTORY WHERE ACCOUNT_ID = ?')) {
        const before = state.rideHistory.length;
        state.rideHistory = state.rideHistory.filter((r) => r.account_id !== params[0]);
        return { lastInsertRowId: 0, changes: before - state.rideHistory.length } as any;
      }

      if (sql.startsWith('DELETE FROM USER_PRIVACY_SETTINGS WHERE ACCOUNT_ID = ?')) {
        const before = state.userPrivacySettings.length;
        state.userPrivacySettings = state.userPrivacySettings.filter((r) => r.account_id !== params[0]);
        return { lastInsertRowId: 0, changes: before - state.userPrivacySettings.length } as any;
      }

      if (sql.startsWith('DELETE FROM USER_PROFILES WHERE ACCOUNT_ID = ?')) {
        const before = state.userProfiles.length;
        state.userProfiles = state.userProfiles.filter((r) => r.account_id !== params[0]);
        return { lastInsertRowId: 0, changes: before - state.userProfiles.length } as any;
      }

      if (sql.startsWith('DELETE FROM USERS WHERE ID = ?')) {
        const before = state.users.length;
        state.users = state.users.filter((r) => r.id !== params[0]);
        return { lastInsertRowId: 0, changes: before - state.users.length } as any;
      }

      if (sql.startsWith('DELETE FROM APP_SESSION')) {
        state.appSession = null;
        return { lastInsertRowId: 0, changes: 1 } as any;
      }

      return { lastInsertRowId: 0, changes: 0 } as any;
    },
    getFirstAsync: async <T>(source: string, ...params: any[]) => {
      const rows = await db.getAllAsync<T>(source, ...params);
      return rows[0] ?? null;
    },
    getAllAsync: async <T>(source: string, ...params: any[]) => {
      const sql = normalizeSql(source);

      if (sql === 'SELECT COUNT(*) AS COUNT FROM USERS') {
        return [{ count: state.users.length }] as T[];
      }

      if (sql.startsWith('SELECT CURRENT_ACCOUNT_ID FROM APP_SESSION')) {
        return state.appSession ? ([{ current_account_id: state.appSession.current_account_id }] as T[]) : [];
      }

      if (sql.includes('FROM USERS WHERE EMAIL = ?')) {
        return state.users.filter((item) => item.email === params[0]) as T[];
      }

      if (sql.includes('FROM USERS WHERE ID = ?')) {
        return state.users.filter((item) => item.id === params[0]) as T[];
      }

      if (sql.includes('FROM USER_PROFILES') && sql.includes('WHERE ACCOUNT_ID = ?')) {
        return state.userProfiles.filter((item) => item.account_id === params[0]) as T[];
      }

      if (sql.includes('FROM USER_PRIVACY_SETTINGS') && sql.includes('WHERE ACCOUNT_ID = ?')) {
        return state.userPrivacySettings.filter((item) => item.account_id === params[0]) as T[];
      }

      if (sql.includes('FROM ROUTE_CHECKPOINTS')) {
        return state.routeCheckpoints
          .filter((item) => item.route_id === params[0])
          .sort((a, b) => a.sort_order - b.sort_order) as T[];
      }

      if (sql.includes('FROM ROUTE_POINTS_OF_INTEREST')) {
        return state.routePointsOfInterest
          .filter((item) => item.route_id === params[0])
          .sort((a, b) => a.sort_order - b.sort_order) as T[];
      }

      if (sql.includes('FROM ROUTES WHERE ID = ?')) {
        return state.routes.filter((item) => item.id === params[0]) as T[];
      }

      if (sql.includes('FROM ROUTES WHERE CYCLIST_TYPE = ?')) {
        return sortRoutes(
          state.routes.filter(
            (item) =>
              item.cyclist_type === params[0] &&
              item.distance_km <= params[1] &&
              item.air_quality_index >= params[2],
          ),
        ) as T[];
      }

      if (sql.includes('FROM ROUTES')) {
        return sortRoutes(state.routes) as T[];
      }

      if (sql.includes('FROM RIDE_HISTORY') && sql.includes('WHERE ACCOUNT_ID = ? AND ID = ?')) {
        return state.rideHistory
          .filter((item) => item.account_id === params[0] && item.id === params[1])
          .map((item) => ({
            ride_id: item.id,
            route_id: item.route_id,
            route_name: item.route_name,
            completion_date: item.completion_date,
            completion_time: item.completion_time,
            start_time: item.start_time,
            end_time: item.end_time,
            total_time: item.total_time_min,
            distance: item.distance_km,
            avg_speed: item.avg_speed_kmh,
            checkpoints_visited: item.checkpoints_visited,
            rating: item.user_rating,
            review: item.user_review,
          })) as T[];
      }

      if (sql.includes('FROM RIDE_HISTORY') && sql.includes('WHERE ACCOUNT_ID = ?')) {
        return [...state.rideHistory]
          .filter((item) => item.account_id === params[0])
          .sort((a, b) => Number(b.id) - Number(a.id))
          .map((item) => ({
            ride_id: item.id,
            route_id: item.route_id,
            route_name: item.route_name,
            completion_date: item.completion_date,
            completion_time: item.completion_time,
            start_time: item.start_time,
            end_time: item.end_time,
            total_time: item.total_time_min,
            distance: item.distance_km,
            avg_speed: item.avg_speed_kmh,
            checkpoints_visited: item.checkpoints_visited,
            rating: item.user_rating,
            review: item.user_review,
          })) as T[];
      }

      if (sql.includes('FROM DISTANCE_STATS')) {
        return state.distanceStats
          .filter((item) => item.account_id === params[0] && item.period === params[1])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => ({
            period_id: item.id,
            label: item.label,
            distance: item.distance_km,
          })) as T[];
      }

      return [] as T[];
    },
  };

  return db;
}

async function openDatabase(): Promise<DatabaseLike> {
  const SQLite = await import('expo-sqlite');
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // -- Schema migration --
  // If the stored user_version is below SCHEMA_VERSION the users table has
  // the old shape (plaintext password + token columns).  Drop it so it gets
  // recreated below; all other tables are append-only and survive.
  const versionRow = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  if ((versionRow?.user_version ?? 0) < SCHEMA_VERSION) {
    // Drop all seeded tables so the seed function starts from a clean slate.
    // Non-seeded state (app_session) is also dropped — the seed will recreate it.
    await db.execAsync(`
      DROP TABLE IF EXISTS ride_feedback;
      DROP TABLE IF EXISTS distance_stats;
      DROP TABLE IF EXISTS ride_history;
      DROP TABLE IF EXISTS route_points_of_interest;
      DROP TABLE IF EXISTS route_checkpoints;
      DROP TABLE IF EXISTS routes;
      DROP TABLE IF EXISTS user_privacy_settings;
      DROP TABLE IF EXISTS user_profiles;
      DROP TABLE IF EXISTS app_session;
      DROP TABLE IF EXISTS users;
    `);
  }

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA user_version = ${SCHEMA_VERSION};

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      onboarding_complete INTEGER NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_session (
      id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
      current_account_id TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      account_id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      email_address TEXT NOT NULL,
      city_name TEXT NOT NULL,
      member_since TEXT NOT NULL,
      cycling_preference TEXT NOT NULL,
      weekly_goal_km REAL NOT NULL,
      bio_text TEXT NOT NULL,
      avatar_url TEXT,
      avatar_color TEXT NOT NULL,
      total_rides INTEGER NOT NULL,
      total_distance_km REAL NOT NULL,
      favorite_trails_count INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_privacy_settings (
      account_id TEXT PRIMARY KEY NOT NULL,
      third_party_ads_opt_out INTEGER NOT NULL,
      data_improvement_opt_out INTEGER NOT NULL,
      notifications_managed_in_os INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      distance_km REAL NOT NULL,
      elevation_m REAL NOT NULL,
      estimated_time_min INTEGER NOT NULL,
      rating REAL NOT NULL,
      review_count INTEGER NOT NULL,
      start_lat REAL NOT NULL,
      start_lng REAL NOT NULL,
      start_name TEXT NOT NULL,
      end_lat REAL NOT NULL,
      end_lng REAL NOT NULL,
      end_name TEXT NOT NULL,
      cyclist_type TEXT NOT NULL,
      shade_pct INTEGER NOT NULL,
      air_quality_index INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS route_checkpoints (
      id TEXT PRIMARY KEY NOT NULL,
      route_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS route_points_of_interest (
      id TEXT PRIMARY KEY NOT NULL,
      route_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ride_history (
      id TEXT PRIMARY KEY NOT NULL,
      account_id TEXT NOT NULL,
      route_id TEXT NOT NULL,
      route_name TEXT NOT NULL,
      completion_date TEXT NOT NULL,
      completion_time TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      total_time_min INTEGER NOT NULL,
      distance_km REAL NOT NULL,
      avg_speed_kmh REAL NOT NULL,
      checkpoints_visited INTEGER NOT NULL,
      user_rating INTEGER,
      user_review TEXT
    );

    CREATE TABLE IF NOT EXISTS distance_stats (
      id TEXT PRIMARY KEY NOT NULL,
      account_id TEXT NOT NULL,
      period TEXT NOT NULL,
      label TEXT NOT NULL,
      distance_km REAL NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ride_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      account_id TEXT NOT NULL,
      route_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      review_text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_route_checkpoints_route_order
      ON route_checkpoints (route_id, sort_order);

    CREATE INDEX IF NOT EXISTS idx_route_poi_route_order
      ON route_points_of_interest (route_id, sort_order);

    CREATE INDEX IF NOT EXISTS idx_ride_history_account
      ON ride_history (account_id, completion_date);

    CREATE INDEX IF NOT EXISTS idx_distance_stats_account_period
      ON distance_stats (account_id, period, sort_order);
  `);

  return db;
}

async function seedDatabaseIfEmpty(db: DatabaseLike): Promise<void> {
  const usersCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM users',
  );

  if ((usersCount?.count ?? 0) > 0) {
    const session = await db.getFirstAsync<{ current_account_id: string }>(
      'SELECT current_account_id FROM app_session WHERE id = 1',
    );

    if (!session) {
      await setCurrentAccountId(DEFAULT_ACCOUNT_ID, db);
    }
    return;
  }

  const createdAt = nowIso();

  const seedHash = await hashPassword(mockStoredPassword);

  await db.withTransactionAsync(async () => {
    const authUsers = [mockAuthUser, mockAdminUser, mockBusinessUser];

    for (const user of authUsers) {
      await db.runAsync(
        `INSERT OR IGNORE INTO users (
          id,
          first_name,
          last_name,
          full_name,
          email,
          password_hash,
          onboarding_complete,
          role,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        user.id,
        user.firstName,
        user.lastName,
        user.fullName,
        normalizeEmail(user.email),
        seedHash,
        user.onboardingComplete ? 1 : 0,
        user.role,
        createdAt,
        createdAt,
      );
    }

    await db.runAsync(
      `INSERT OR IGNORE INTO user_profiles (
        account_id,
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
        favorite_trails_count,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      DEFAULT_ACCOUNT_ID,
      mockUserProfile.userId,
      mockUserProfile.fullName,
      normalizeEmail(mockAuthUser.email),
      mockUserProfile.location,
      mockUserProfile.memberSince,
      mockUserProfile.cyclingPreference,
      mockUserProfile.weeklyGoalKm,
      mockUserProfile.bio,
      mockUserProfile.avatarUrl,
      mockUserProfile.avatarColor,
      mockUserProfile.stats.totalRides,
      mockUserProfile.stats.totalDistanceKm,
      mockUserProfile.stats.favoriteTrails,
      createdAt,
    );

    await db.runAsync(
      `INSERT OR IGNORE INTO user_privacy_settings (
        account_id,
        third_party_ads_opt_out,
        data_improvement_opt_out,
        notifications_managed_in_os,
        updated_at
      ) VALUES (?, ?, ?, ?, ?)`,
      DEFAULT_ACCOUNT_ID,
      mockPrivacySettings.noThirdPartyAds ? 1 : 0,
      mockPrivacySettings.noDataImprovement ? 1 : 0,
      mockPrivacySettings.notificationsManagedInDeviceSettings ? 1 : 0,
      createdAt,
    );

    for (const route of mockRoutes) {
      await db.runAsync(
        `INSERT OR IGNORE INTO routes (
          id,
          name,
          description,
          distance_km,
          elevation_m,
          estimated_time_min,
          rating,
          review_count,
          start_lat,
          start_lng,
          start_name,
          end_lat,
          end_lng,
          end_name,
          cyclist_type,
          shade_pct,
          air_quality_index
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        route.id,
        route.name,
        route.description,
        route.distance,
        route.elevation,
        route.estimatedTime,
        route.rating,
        route.reviewCount,
        route.startPoint.lat,
        route.startPoint.lng,
        route.startPoint.name,
        route.endPoint.lat,
        route.endPoint.lng,
        route.endPoint.name,
        route.cyclistType,
        route.shade,
        route.airQuality,
      );

      for (const [index, checkpoint] of route.checkpoints.entries()) {
        await db.runAsync(
          `INSERT OR IGNORE INTO route_checkpoints (
            id,
            route_id,
            sort_order,
            name,
            lat,
            lng,
            description
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          checkpoint.id,
          route.id,
          index,
          checkpoint.name,
          checkpoint.lat,
          checkpoint.lng,
          checkpoint.description,
        );
      }

      for (const [index, point] of (route.pointsOfInterestVisited ?? []).entries()) {
        await db.runAsync(
          `INSERT OR IGNORE INTO route_points_of_interest (
            id,
            route_id,
            sort_order,
            name,
            description,
            lat,
            lng
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          `poi-${route.id}-${index + 1}`,
          route.id,
          index,
          point.name,
          point.description ?? point.name,
          route.startPoint.lat,
          route.startPoint.lng,
        );
      }
    }

    for (const ride of mockRideHistory) {
      await db.runAsync(
        `INSERT OR IGNORE INTO ride_history (
          id,
          account_id,
          route_id,
          route_name,
          completion_date,
          completion_time,
          start_time,
          end_time,
          total_time_min,
          distance_km,
          avg_speed_kmh,
          checkpoints_visited,
          user_rating,
          user_review
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ride.id,
        DEFAULT_ACCOUNT_ID,
        ride.routeId,
        ride.routeName,
        ride.completionDate,
        ride.completionTime,
        ride.startTime ?? null,
        ride.endTime ?? null,
        ride.totalTime,
        ride.distance,
        ride.avgSpeed,
        ride.checkpoints,
        ride.userRating ?? null,
        ride.userReview ?? null,
      );
    }

    for (const [index, point] of mockWeeklyData.entries()) {
      await db.runAsync(
        `INSERT OR IGNORE INTO distance_stats (
          id,
          account_id,
          period,
          label,
          distance_km,
          sort_order
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        point.id,
        DEFAULT_ACCOUNT_ID,
        'week',
        'day' in point ? point.day : point.week,
        point.distance,
        index,
      );
    }

    for (const [index, point] of mockMonthlyData.entries()) {
      await db.runAsync(
        `INSERT OR IGNORE INTO distance_stats (
          id,
          account_id,
          period,
          label,
          distance_km,
          sort_order
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        point.id,
        DEFAULT_ACCOUNT_ID,
        'month',
        'week' in point ? point.week : point.day,
        point.distance,
        index,
      );
    }

    await setCurrentAccountId(DEFAULT_ACCOUNT_ID, db);
  });
}

export async function getLocalDb(): Promise<DatabaseLike> {
  if (!databasePromise) {
    databasePromise = IS_TEST_ENV
      ? Promise.resolve(createTestDatabase())
      : (async () => {
          const db = await openDatabase();
          await seedDatabaseIfEmpty(db);
          return db;
        })();
  }

  return databasePromise;
}

export async function synchronizeLocalDbFromMocks(): Promise<void> {
  if (IS_TEST_ENV) {
    return;
  }

  if (synchronizeFromMocksPromise) {
    await synchronizeFromMocksPromise;
    return;
  }

  synchronizeFromMocksPromise = (async () => {
    const db = await getLocalDb();

    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM route_points_of_interest');
      await db.runAsync('DELETE FROM route_checkpoints');
      await db.runAsync('DELETE FROM routes');

      await db.runAsync('DELETE FROM ride_feedback WHERE account_id = ?', DEFAULT_ACCOUNT_ID);
      await db.runAsync('DELETE FROM distance_stats WHERE account_id = ?', DEFAULT_ACCOUNT_ID);
      await db.runAsync('DELETE FROM ride_history WHERE account_id = ?', DEFAULT_ACCOUNT_ID);

      for (const route of mockRoutes) {
        await db.runAsync(
        `INSERT OR IGNORE INTO routes (
          id,
          name,
          description,
          distance_km,
          elevation_m,
          estimated_time_min,
          rating,
          review_count,
          start_lat,
          start_lng,
          start_name,
          end_lat,
          end_lng,
          end_name,
          cyclist_type,
          shade_pct,
          air_quality_index
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        route.id,
        route.name,
        route.description,
        route.distance,
        route.elevation,
        route.estimatedTime,
        route.rating,
        route.reviewCount,
        route.startPoint.lat,
        route.startPoint.lng,
        route.startPoint.name,
        route.endPoint.lat,
        route.endPoint.lng,
        route.endPoint.name,
        route.cyclistType,
        route.shade,
        route.airQuality,
      );

        for (const [index, checkpoint] of route.checkpoints.entries()) {
          await db.runAsync(
          `INSERT OR IGNORE INTO route_checkpoints (
            id,
            route_id,
            sort_order,
            name,
            lat,
            lng,
            description
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          checkpoint.id,
          route.id,
          index,
          checkpoint.name,
          checkpoint.lat,
          checkpoint.lng,
          checkpoint.description,
        );
      }

        for (const [index, point] of (route.pointsOfInterestVisited ?? []).entries()) {
          await db.runAsync(
          `INSERT OR IGNORE INTO route_points_of_interest (
            id,
            route_id,
            sort_order,
            name,
            description,
            lat,
            lng
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          `poi-${route.id}-${index + 1}`,
          route.id,
          index,
          point.name,
          point.description ?? point.name,
          route.startPoint.lat,
          route.startPoint.lng,
        );
        }
      }

      for (const ride of mockRideHistory) {
        await db.runAsync(
        `INSERT OR IGNORE INTO ride_history (
          id,
          account_id,
          route_id,
          route_name,
          completion_date,
          completion_time,
          start_time,
          end_time,
          total_time_min,
          distance_km,
          avg_speed_kmh,
          checkpoints_visited,
          user_rating,
          user_review
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ride.id,
        DEFAULT_ACCOUNT_ID,
        ride.routeId,
        ride.routeName,
        ride.completionDate,
        ride.completionTime,
        ride.startTime ?? null,
        ride.endTime ?? null,
        ride.totalTime,
        ride.distance,
        ride.avgSpeed,
        ride.checkpoints,
        ride.userRating ?? null,
        ride.userReview ?? null,
      );
      }

      for (const [index, point] of mockWeeklyData.entries()) {
        await db.runAsync(
        `INSERT OR IGNORE INTO distance_stats (
          id,
          account_id,
          period,
          label,
          distance_km,
          sort_order
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        point.id,
        DEFAULT_ACCOUNT_ID,
        'week',
        'day' in point ? point.day : point.week,
        point.distance,
        index,
      );
      }

      for (const [index, point] of mockMonthlyData.entries()) {
        await db.runAsync(
        `INSERT OR IGNORE INTO distance_stats (
          id,
          account_id,
          period,
          label,
          distance_km,
          sort_order
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        point.id,
        DEFAULT_ACCOUNT_ID,
        'month',
        'week' in point ? point.week : point.day,
        point.distance,
        index,
      );
      }

      await setCurrentAccountId(DEFAULT_ACCOUNT_ID, db);
    });
  })();

  try {
    await synchronizeFromMocksPromise;
  } finally {
    synchronizeFromMocksPromise = null;
  }
}

async function setCurrentAccountId(
  accountId: string,
  dbOverride?: DatabaseLike,
): Promise<void> {
  const db = dbOverride ?? (await getLocalDb());
  const updatedAt = nowIso();

  await db.runAsync(
    `INSERT INTO app_session (id, current_account_id, updated_at)
     VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       current_account_id = excluded.current_account_id,
       updated_at = excluded.updated_at`,
    accountId,
    updatedAt,
  );
}

export async function setActiveMockAccountId(accountId: string): Promise<void> {
  await setCurrentAccountId(accountId);
}

export async function getActiveMockAccountId(): Promise<string> {
  const db = await getLocalDb();
  const session = await db.getFirstAsync<{ current_account_id: string }>(
    'SELECT current_account_id FROM app_session WHERE id = 1',
  );

  return session?.current_account_id ?? DEFAULT_ACCOUNT_ID;
}

/** Persist post-ride feedback locally (offline / demo / when API returns 404 for unknown route). */
export async function saveRideFeedbackLocal(input: {
  routeId: string;
  rating: number;
  reviewText: string;
}): Promise<void> {
  const db = await getLocalDb();
  const accountId = await getActiveMockAccountId();
  const createdAt = nowIso();
  await db.runAsync(
    `INSERT INTO ride_feedback (account_id, route_id, rating, review_text, created_at) VALUES (?, ?, ?, ?, ?)`,
    accountId,
    input.routeId,
    input.rating,
    input.reviewText,
    createdAt,
  );
}

export async function createLocalAccount(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<{ accountId: string; profileUserId: string }> {
  const db = await getLocalDb();
  const accountId = `user_${Date.now()}`;
  const profileUserId = `rider_${Date.now()}`;
  const createdAt = nowIso();
  const email = normalizeEmail(input.email);
  const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
  const newHash = await hashPassword(input.password);

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO users (
        id,
        first_name,
        last_name,
        full_name,
        email,
        password_hash,
        onboarding_complete,
        role,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      accountId,
      input.firstName.trim(),
      input.lastName.trim(),
      fullName,
      email,
      newHash,
      0,
      'user',
      createdAt,
      createdAt,
    );

    await db.runAsync(
      `INSERT INTO user_profiles (
        account_id,
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
        favorite_trails_count,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      accountId,
      profileUserId,
      fullName,
      email,
      mockUserProfile.location,
      mockUserProfile.memberSince,
      mockUserProfile.cyclingPreference,
      mockUserProfile.weeklyGoalKm,
      '',
      null,
      mockUserProfile.avatarColor,
      0,
      0,
      0,
      createdAt,
    );

    await db.runAsync(
      `INSERT INTO user_privacy_settings (
        account_id,
        third_party_ads_opt_out,
        data_improvement_opt_out,
        notifications_managed_in_os,
        updated_at
      ) VALUES (?, ?, ?, ?, ?)`,
      accountId,
      0,
      0,
      1,
      createdAt,
    );

    const emptyStats = [
      { id: `week-mon-${accountId}`, period: 'week', label: 'Mon', distance: 0, sortOrder: 0 },
      { id: `week-tue-${accountId}`, period: 'week', label: 'Tue', distance: 0, sortOrder: 1 },
      { id: `week-wed-${accountId}`, period: 'week', label: 'Wed', distance: 0, sortOrder: 2 },
      { id: `week-thu-${accountId}`, period: 'week', label: 'Thu', distance: 0, sortOrder: 3 },
      { id: `week-fri-${accountId}`, period: 'week', label: 'Fri', distance: 0, sortOrder: 4 },
      { id: `week-sat-${accountId}`, period: 'week', label: 'Sat', distance: 0, sortOrder: 5 },
      { id: `week-sun-${accountId}`, period: 'week', label: 'Sun', distance: 0, sortOrder: 6 },
      { id: `month-week1-${accountId}`, period: 'month', label: 'Week 1', distance: 0, sortOrder: 0 },
      { id: `month-week2-${accountId}`, period: 'month', label: 'Week 2', distance: 0, sortOrder: 1 },
      { id: `month-week3-${accountId}`, period: 'month', label: 'Week 3', distance: 0, sortOrder: 2 },
      { id: `month-week4-${accountId}`, period: 'month', label: 'Week 4', distance: 0, sortOrder: 3 },
    ];

    for (const stat of emptyStats) {
      await db.runAsync(
        `INSERT OR IGNORE INTO distance_stats (
          id,
          account_id,
          period,
          label,
          distance_km,
          sort_order
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        stat.id,
        accountId,
        stat.period,
        stat.label,
        stat.distance,
        stat.sortOrder,
      );
    }

    await setCurrentAccountId(accountId, db);
  });

  return { accountId, profileUserId };
}

export async function deleteLocalAccount(accountId: string): Promise<void> {
  const db = await getLocalDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM ride_feedback WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM distance_stats WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM ride_history WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM user_privacy_settings WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM user_profiles WHERE account_id = ?', accountId);
    await db.runAsync('DELETE FROM users WHERE id = ?', accountId);
    await db.runAsync('DELETE FROM app_session WHERE current_account_id = ?', accountId);
  });
  databasePromise = null;
}
