# SQLite Mock Migration Artifact

Date: 2026-03-26
Scope: Mobile app data layer only. No UI, styling, or theme files are planned for modification.

## Planned File Modifications

- `mobile/package.json`
  - Add the `expo-sqlite` dependency.
- `mobile/package-lock.json`
  - Refresh lockfile entries for `expo-sqlite`.
- `mobile/index.js`
  - Kick off local SQLite synchronization during app startup without changing UI components.
- `mobile/src/services/localDb.ts`
  - New SQLite utility for database initialization, table creation, seeding, and query helpers.
- `mobile/src/services/authService.ts`
  - Replace direct static mock returns with SQLite-backed auth queries when `EXPO_PUBLIC_USE_MOCKS=true`.
- `mobile/src/services/userService.ts`
  - Replace in-memory profile state with SQLite reads and updates when `EXPO_PUBLIC_USE_MOCKS=true`.
- `mobile/src/services/settingsService.ts`
  - Replace in-memory password/privacy state with SQLite reads and updates when `EXPO_PUBLIC_USE_MOCKS=true`.
- `mobile/src/services/routeService.ts`
  - Replace static route arrays with SQLite queries when `EXPO_PUBLIC_USE_MOCKS=true`.
- `mobile/src/services/rideService.ts`
  - Replace static ride/stat arrays with SQLite queries when `EXPO_PUBLIC_USE_MOCKS=true`.

## Planned SQLite Schema

### `users`

Purpose: local auth records for mock login/register flows and password changes.

Columns:

- `id TEXT PRIMARY KEY`
- `first_name TEXT NOT NULL`
- `last_name TEXT NOT NULL`
- `full_name TEXT NOT NULL`
- `email TEXT NOT NULL UNIQUE`
- `password TEXT NOT NULL`
- `onboarding_complete INTEGER NOT NULL`
- `role TEXT NOT NULL`
- `access_token TEXT NOT NULL`
- `refresh_token TEXT NOT NULL`
- `expires_in INTEGER NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

### `app_session`

Purpose: persist the currently active local mock account so profile/settings adapters can resolve the right records without changing UI state management.

Columns:

- `id INTEGER PRIMARY KEY CHECK (id = 1)`
- `current_account_id TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

### `user_profiles`

Purpose: persistent profile data for each local account.

Columns:

- `account_id TEXT PRIMARY KEY`
- `user_id TEXT NOT NULL UNIQUE`
- `full_name TEXT NOT NULL`
- `email_address TEXT NOT NULL`
- `city_name TEXT NOT NULL`
- `member_since TEXT NOT NULL`
- `cycling_preference TEXT NOT NULL`
- `weekly_goal_km REAL NOT NULL`
- `bio_text TEXT NOT NULL`
- `avatar_url TEXT`
- `avatar_color TEXT NOT NULL`
- `total_rides INTEGER NOT NULL`
- `total_distance_km REAL NOT NULL`
- `favorite_trails_count INTEGER NOT NULL`
- `updated_at TEXT NOT NULL`

### `user_privacy_settings`

Purpose: persistent privacy/security toggles for each local account.

Columns:

- `account_id TEXT PRIMARY KEY`
- `third_party_ads_opt_out INTEGER NOT NULL`
- `data_improvement_opt_out INTEGER NOT NULL`
- `notifications_managed_in_os INTEGER NOT NULL`
- `updated_at TEXT NOT NULL`

### `routes`

Purpose: master route catalogue used by home, recommendations, and route detail flows.

Columns:

- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `description TEXT NOT NULL`
- `distance_km REAL NOT NULL`
- `elevation_m REAL NOT NULL`
- `estimated_time_min INTEGER NOT NULL`
- `rating REAL NOT NULL`
- `review_count INTEGER NOT NULL`
- `start_lat REAL NOT NULL`
- `start_lng REAL NOT NULL`
- `start_name TEXT NOT NULL`
- `end_lat REAL NOT NULL`
- `end_lng REAL NOT NULL`
- `end_name TEXT NOT NULL`
- `cyclist_type TEXT NOT NULL`
- `shade_pct INTEGER NOT NULL`
- `air_quality_index INTEGER NOT NULL`

### `route_checkpoints`

Purpose: ordered checkpoint records for each route.

Columns:

- `id TEXT PRIMARY KEY`
- `route_id TEXT NOT NULL`
- `sort_order INTEGER NOT NULL`
- `name TEXT NOT NULL`
- `lat REAL NOT NULL`
- `lng REAL NOT NULL`
- `description TEXT NOT NULL`

### `ride_history`

Purpose: historical ride records shown in the profile/history flows.

Columns:

- `id TEXT PRIMARY KEY`
- `account_id TEXT NOT NULL`
- `route_id TEXT NOT NULL`
- `route_name TEXT NOT NULL`
- `completion_date TEXT NOT NULL`
- `completion_time TEXT NOT NULL`
- `start_time TEXT`
- `end_time TEXT`
- `total_time_min INTEGER NOT NULL`
- `distance_km REAL NOT NULL`
- `avg_speed_kmh REAL NOT NULL`
- `checkpoints_visited INTEGER NOT NULL`
- `user_rating INTEGER`
- `user_review TEXT`

### `distance_stats`

Purpose: pre-seeded weekly/monthly chart data for the ride history page.

Columns:

- `id TEXT PRIMARY KEY`
- `account_id TEXT NOT NULL`
- `period TEXT NOT NULL`
- `label TEXT NOT NULL`
- `distance_km REAL NOT NULL`
- `sort_order INTEGER NOT NULL`

### `ride_feedback`

Purpose: store submitted route feedback locally while backend APIs are unavailable.

Columns:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `account_id TEXT NOT NULL`
- `route_id TEXT NOT NULL`
- `rating INTEGER NOT NULL`
- `review_text TEXT NOT NULL`
- `created_at TEXT NOT NULL`
