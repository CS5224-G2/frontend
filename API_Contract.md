# CycleLink API Contract

> **Revision**: 1.2 · **Date**: 2026-03-26  
> **Status**: Design by Contract — Defines the idealised JSON shapes the frontend adapters expect.  
> Both the Mobile (Expo/React Native) and Web App (Vite/React) frontends are written against this contract.  
> The backend team MUST conform to these exactly; the adapter layer maps backend → frontend types and will break if shapes deviate.

---

## Base URL

| Environment | URL |
|---|---|
| Production | `https://api.cyclelink.example.com` |
| Staging | `https://staging-api.cyclelink.example.com` |

All requests require `Content-Type: application/json` unless explicitly marked as multipart upload.  
Authenticated endpoints require `Authorization: Bearer <access_token>`.

---

## 1. Authentication

### `POST /auth/login`

**Purpose**: Authenticate a user with email + password.  
**Client(s)**: Mobile, Web App  
**Auth**: None required

#### Request Body

```json
{
  "email": "alex@example.com",
  "password": "securePassword123",
  "remember_me": false,
  "client": "mobile_app"
}
```

> `client` field must be `"mobile_app"` from Expo or `"web_app"` from the web.

#### Ideal JSON Response — `200 OK`

```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "dGhpcyBp...",
  "expires_in": 3600,
  "user": {
    "id": "user_001",
    "first_name": "Alex",
    "last_name": "Rider",
    "email": "alex@example.com",
    "onboarding_complete": true,
    "role": "user"
  }
}
```

> `role` must be one of: `"user"` | `"admin"` | `"business"`

#### Error Responses

| Status | Condition |
|---|---|
| `400` | Missing or invalid fields |
| `401` | Invalid credentials |

---

### `POST /auth/register`

**Purpose**: Create a new user account.  
**Client(s)**: Mobile  
**Auth**: None required

#### Request Body

```json
{
  "first_name": "Alex",
  "last_name": "Johnson",
  "email": "alex@example.com",
  "password": "securePassword123",
  "confirm_password": "securePassword123",
  "agreed_to_terms": true,
  "client": "mobile_app"
}
```

#### Ideal JSON Response — `201 Created`

```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "dGhpcyBp...",
  "expires_in": 3600,
  "user": {
    "id": "user_002",
    "first_name": "Alex",
    "last_name": "Johnson",
    "email": "alex@example.com",
    "onboarding_complete": false,
    "role": "user"
  }
}
```

#### Error Responses

| Status | Condition |
|---|---|
| `400` | Passwords do not match / missing fields |
| `409` | Email already registered |

---

### `POST /auth/google` *(OAuth — not yet live)*

**Purpose**: Exchange a Google ID token for a CycleLink session.
**Client(s)**: Mobile
**Auth**: None required

#### Request Body

```json
{
  "id_token": "<Google ID token from expo-auth-session>",
  "client": "mobile_app"
}
```

#### Ideal JSON Response — `200 OK`

Same shape as `POST /auth/login`.

#### Error Responses

| Status | Condition |
|---|---|
| `400` | Missing or invalid token |
| `401` | Token verification failed |

---

### `POST /auth/apple` *(OAuth — not yet live)*

**Purpose**: Exchange an Apple identity token for a CycleLink session.
**Client(s)**: Mobile (iOS only)
**Auth**: None required

> Apple only returns `full_name` and `email` on the **first** sign-in. Cache them on the backend.

#### Request Body

```json
{
  "identity_token": "<Apple identity token>",
  "authorization_code": "<Apple authorization code>",
  "full_name": {
    "givenName": "Alex",
    "familyName": "Johnson"
  },
  "client": "mobile_app"
}
```

> `full_name` fields may be `null` on repeat sign-ins.

#### Ideal JSON Response — `200 OK`

Same shape as `POST /auth/login`.

#### Error Responses

| Status | Condition |
|---|---|
| `400` | Missing or invalid token |
| `401` | Token verification failed |

---

### Session & Token Storage (Mobile)

Tokens returned from any `/auth/*` endpoint are stored in **`expo-secure-store`**
(iOS Keychain / Android Keystore) — never in SQLite.

| SecureStore key    | Contents              |
|--------------------|-----------------------|
| `cl_access_token`  | Bearer token          |
| `cl_refresh_token` | Refresh token         |
| `cl_expires_in`    | Expiry in seconds     |
| `cl_user_json`     | Serialised user object|

On app launch `AuthContext` restores the session from these keys automatically.
Logout wipes all four keys.

---

## 2. User Profile

### `GET /user/profile`

**Purpose**: Fetch the authenticated user's profile.  
**Client(s)**: Mobile  
**Auth**: Bearer token required

#### Ideal JSON Response — `200 OK`

```json
{
  "user_id": "rider_1024",
  "full_name": "Alex Johnson",
  "email_address": "alex.johnson@example.com",
  "city_name": "San Francisco, CA",
  "member_since": "January 2025",
  "cycling_preference": "Leisure",
  "weekly_goal_km": 80,
  "bio_text": "Weekend rider focused on scenic waterfront routes.",
  "avatar_url": "https://cdn.cyclelink.example.com/profile/rider_1024/avatar.jpg",
  "avatar_color": "#1D4ED8",
  "ride_stats": {
    "total_rides": 47,
    "total_distance_km": 385.6,
    "favorite_trails_count": 28
  }
}
```

> `cycling_preference` must be one of: `"Leisure"` | `"Commuter"` | `"Performance"`
> `avatar_url` may be `null` if the user has not uploaded a profile photo yet.

---

### `PUT /user/profile`

**Purpose**: Update the authenticated user's profile.  
**Client(s)**: Mobile  
**Auth**: Bearer token required

#### Request Body

```json
{
  "full_name": "Alex Johnson",
  "city_name": "San Francisco, CA",
  "cycling_preference": "Leisure",
  "weekly_goal_km": 80,
  "bio_text": "Updated bio text.",
  "avatar_color": "#1D4ED8"
}
```

#### Ideal JSON Response — `200 OK`

Same shape as `GET /user/profile`.

---

### `POST /user/profile/avatar`

**Purpose**: Upload or replace the authenticated user's profile photo.  
**Client(s)**: Mobile  
**Auth**: Bearer token required  
**Content-Type**: `multipart/form-data`

#### Multipart Body

| Field | Type | Required | Notes |
|---|---|---|---|
| `avatar` | file | Yes | Image file, square crop preferred; accept `image/jpeg`, `image/png`, `image/webp`, `image/heic` |

#### Ideal JSON Response — `201 Created`

```json
{
  "avatar_url": "https://cdn.cyclelink.example.com/profile/rider_1024/avatar.jpg"
}
```

#### Error Responses

| Status | Condition |
|---|---|
| `400` | Missing file or unsupported media type |
| `413` | File too large |

---

### `DELETE /user/profile/avatar`

**Purpose**: Remove the authenticated user's profile photo and fall back to avatar color/initials.  
**Client(s)**: Mobile  
**Auth**: Bearer token required

#### Ideal JSON Response — `204 No Content`

No body.

#### Error Responses

| Status | Condition |
|---|---|
| `404` | No avatar exists for the user |

---

### `DELETE /user/account`

**Purpose**: Permanently delete the authenticated user's account and all associated data (profile, ride history, stats, privacy settings).
**Client(s)**: Mobile
**Auth**: Bearer token required

> **Note — Sign out**: Sign-out is client-only. The mobile app clears the local session (SecureStore keys) and resets auth state without calling a backend endpoint.

#### Ideal JSON Response — `204 No Content`

No body.

#### Error Responses

| Status | Condition |
|---|---|
| `401` | Token missing or expired |
| `404` | Account not found |

---

## 3. User Settings

### `POST /user/password`

**Purpose**: Change the authenticated user's password.  
**Client(s)**: Mobile  
**Auth**: Bearer token required

#### Request Body

```json
{
  "current_password": "OldPassword123",
  "new_password": "NewPassword456",
  "confirm_new_password": "NewPassword456"
}
```

#### Ideal JSON Response — `200 OK`

```json
{
  "status": "ok",
  "message": "Password updated successfully.",
  "updated_at": "2026-03-25T10:15:00.000Z"
}
```

#### Error Responses

| Status | Condition |
|---|---|
| `400` | Passwords do not match |
| `401` | Current password incorrect |

---

### `GET /user/privacy`

**Purpose**: Fetch the user's privacy and notification settings.  
**Client(s)**: Mobile  
**Auth**: Bearer token required

#### Ideal JSON Response — `200 OK`

```json
{
  "privacy_controls": {
    "third_party_ads_opt_out": false,
    "data_improvement_opt_out": false
  },
  "device_permissions": {
    "notifications_managed_in_os": true
  }
}
```

---

### `PUT /user/privacy`

**Purpose**: Update the user's privacy settings.  
**Client(s)**: Mobile  
**Auth**: Bearer token required

#### Request Body

```json
{
  "privacy_controls": {
    "third_party_ads_opt_out": true,
    "data_improvement_opt_out": false
  }
}
```

#### Ideal JSON Response — `200 OK`

Same shape as `GET /user/privacy`.

---

## 4. Routes

### `GET /routes`

**Purpose**: Fetch available cycling routes, optionally filtered by user preferences.  
**Client(s)**: Mobile  
**Auth**: Optional (personalisation improves with auth)

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `cyclist_type` | string | No | Filter by `recreational` / `commuter` / `fitness` / `general` |
| `max_distance` | number | No | Maximum route distance in km |
| `min_air_quality` | number | No | Minimum air quality index (0–100) |

#### Ideal JSON Response — `200 OK`

```json
[
  {
    "route_id": "1",
    "route_name": "Riverside Park Loop",
    "description": "A scenic route along the river.",
    "distance_km": 12.5,
    "elevation_m": 45,
    "estimated_time_min": 45,
    "rating": 4.8,
    "review_count": 234,
    "start_point": { "lat": 40.7829, "lng": -73.9654, "name": "Central Park South" },
    "end_point": { "lat": 40.7829, "lng": -73.9654, "name": "Central Park South" },
    "checkpoints": [
      {
        "checkpoint_id": "cp1",
        "checkpoint_name": "Boathouse Cafe",
        "latitude": 40.7738,
        "longitude": -73.9686,
        "description": "Great place for a quick break"
      }
    ],
    "cyclist_type": "recreational",
    "shade_pct": 80,
    "air_quality_index": 85
  }
]
```

---

### `GET /routes/:routeId`

**Purpose**: Fetch a single route by ID (for detail and feedback pages).  
**Client(s)**: Mobile  
**Auth**: Optional

#### Route Parameters

| Parameter | Type | Description |
|---|---|---|
| `routeId` | string | Unique route identifier |

#### Ideal JSON Response — `200 OK`

Same shape as a single element from `GET /routes`.

#### Error Responses

| Status | Condition |
|---|---|
| `404` | Route not found |

---

### `POST /routes/recommendations`

**Purpose**: Get AI/algorithm-ranked route recommendations based on user preferences.  
**Client(s)**: Mobile  
**Auth**: Optional

#### Request Body

```json
{
  "cyclist_type": "recreational",
  "preferred_shade": 60,
  "elevation_preference": 40,
  "preferred_distance_km": 15,
  "min_air_quality": 70,
  "limit": 3
}
```

> This is the payload currently sent by `mobile/src/services/routeService.ts`.
> The mobile app stores a fuller local request object (`startPoint`, `endPoint`, `checkpoints`, `preferences`) but only `preferences` + `limit` are posted to this endpoint in v1.

#### Planned Extension (v2 — location-aware recommendations)

```json
{
  "start_point": {
    "name": "Raffles Place MRT",
    "lat": 1.2837,
    "lng": 103.8515,
    "source": "search"
  },
  "end_point": {
    "name": "East Coast Park",
    "lat": 1.3025,
    "lng": 103.9128,
    "source": "search"
  },
  "checkpoints": [
    {
      "id": "checkpoint-1",
      "name": "Marina Barrage",
      "lat": 1.2808,
      "lng": 103.8707,
      "source": "map"
    }
  ],
  "preferences": {
    "cyclist_type": "recreational",
    "preferred_shade": 60,
    "elevation_preference": 40,
    "preferred_distance_km": 15,
    "min_air_quality": 70
  },
  "limit": 3
}
```

> `source` must be one of: `"search"` | `"map"` | `"current-location"`.

#### Ideal JSON Response — `200 OK`

Array of Route objects (same shape as `GET /routes`), ordered by descending match score.

---

## 5. Ride History

### `GET /rides/history`

**Purpose**: Fetch the authenticated user's complete ride history.  
**Client(s)**: Mobile  
**Auth**: Bearer token required

#### Ideal JSON Response — `200 OK`

```json
[
  {
    "ride_id": "1",
    "route_id": "1",
    "route_name": "Waterfront Loop",
    "completion_date": "March 12, 2026",
    "completion_time": "10:30 AM",
    "start_time": "9:42 AM",
    "end_time": "10:30 AM",
    "total_time_min": 48,
    "distance_km": 12.5,
    "avg_speed_kmh": 15.6,
    "checkpoints_visited": 3,
    "user_rating": 5,
    "user_review": "Absolutely loved this route!"
  }
]
```

> `user_rating` and `user_review` are optional — omitted if user has not reviewed.

---

### `GET /rides/:rideId`

**Purpose**: Fetch a single historical ride entry by ID.  
**Client(s)**: Mobile  
**Auth**: Bearer token required

#### Route Parameters

| Parameter | Type | Description |
|---|---|---|
| `rideId` | string | Unique ride session identifier |

#### Ideal JSON Response — `200 OK`

Same shape as a single element from `GET /rides/history`.

#### Error Responses

| Status | Condition |
|---|---|
| `404` | Ride not found or not owned by user |

---

### `GET /rides/stats/distance`

**Purpose**: Fetch aggregated distance statistics for the chart on the Ride History page.  
**Client(s)**: Mobile  
**Auth**: Bearer token required

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `period` | string | Yes | `"week"` or `"month"` |

#### Ideal JSON Response — `200 OK` (week)

```json
[
  { "period_id": "mon", "label": "Mon", "distance_km": 0 },
  { "period_id": "tue", "label": "Tue", "distance_km": 8.2 },
  { "period_id": "wed", "label": "Wed", "distance_km": 0 },
  { "period_id": "thu", "label": "Thu", "distance_km": 18.3 },
  { "period_id": "fri", "label": "Fri", "distance_km": 0 },
  { "period_id": "sat", "label": "Sat", "distance_km": 12.5 },
  { "period_id": "sun", "label": "Sun", "distance_km": 0 }
]
```

#### Ideal JSON Response — `200 OK` (month)

```json
[
  { "period_id": "week1", "label": "Week 1", "distance_km": 45.5 },
  { "period_id": "week2", "label": "Week 2", "distance_km": 38.9 },
  { "period_id": "week3", "label": "Week 3", "distance_km": 52.3 },
  { "period_id": "week4", "label": "Week 4", "distance_km": 39.0 }
]
```

---

### `POST /rides/feedback`

**Purpose**: Submit post-ride star rating and optional written review.  
**Client(s)**: Mobile  
**Auth**: Bearer token required

#### Request Body

```json
{
  "route_id": "1",
  "rating": 5,
  "review_text": "Absolutely loved this route!"
}
```

> `rating` must be an integer 1–5.  
> `review_text` is optional (empty string is acceptable).

#### Ideal JSON Response — `204 No Content`

No body.

#### Error Responses

| Status | Condition |
|---|---|
| `400` | Rating out of range |
| `404` | Route not found |

---

## 6. Admin Dashboard

### `GET /admin/stats`

**Purpose**: Fetch platform-wide statistics for the Admin Overview panel.  
**Client(s)**: Web App (Admin role only)  
**Auth**: Bearer token required  `role: "admin"`

#### Ideal JSON Response — `200 OK`

```json
{
  "total_rides": 1280,
  "active_users": 452,
  "revenue_formatted": "$12.4k",
  "open_reports": 12
}
```

---

### `GET /admin/users`

**Purpose**: Fetch all registered user accounts for the User Management table.  
**Client(s)**: Web App (Admin role only)  
**Auth**: Bearer token required · `role: "admin"`

#### Ideal JSON Response — `200 OK`

```json
[
  {
    "user_id": "u1",
    "email_address": "alex@email.com",
    "role": "user",
    "account_status": "Active",
    "joined_formatted": "Jan 2025"
  },
  {
    "user_id": "u4",
    "email_address": "admin@cyclink.com",
    "role": "admin",
    "account_status": "Active",
    "joined_formatted": "Jan 2025"
  }
]
```

> `account_status` must be `"Active"` | `"Inactive"`  
> `role` must be `"user"` | `"admin"` | `"business"`

---

## 7. Business Dashboard

### `GET /business/landing-stats`

**Purpose**: Fetch public marketing statistics for the business landing page.  
**Client(s)**: Web App (public landing page)  
**Auth**: None required

#### Ideal JSON Response — `200 OK`

```json
{
  "monthly_users": 5000,
  "monthly_route_requests": 50000,
  "active_partners": 8
}
```

> These are platform-level summary figures intended for the business landing page's
> "Platform at a glance" section.

---

### `GET /business/stats`

**Purpose**: Fetch sponsorship and reach statistics for the Business Overview panel.  
**Client(s)**: Web App (Business role only)  
**Auth**: Bearer token required · `role: "business"`

#### Ideal JSON Response — `200 OK`

```json
{
  "active_sponsors": 8,
  "data_points_formatted": "45.2k",
  "total_spent_formatted": "$3,420",
  "user_reach_formatted": "8.5k"
}
```

---

### `GET /business/locations`

**Purpose**: Fetch all sponsored checkpoint locations for the Sponsored Locations table.  
**Client(s)**: Web App (Business role only)  
**Auth**: Bearer token required · `role: "business"`

#### Ideal JSON Response — `200 OK`

```json
[
  {
    "location_id": "loc1",
    "venue_name": "Maxwell Food Centre",
    "district": "Tanjong Pagar",
    "view_count": "1,200",
    "click_count": "340",
    "campaign_status": "Live"
  },
  {
    "location_id": "loc2",
    "venue_name": "East Coast Park",
    "district": "Marine Parade",
    "view_count": "980",
    "click_count": "210",
    "campaign_status": "Pending"
  }
]
```

> `campaign_status` must be `"Live"` | `"Pending"`

---

## Endpoint Summary

| Endpoint | Method | Auth | Mobile | Web |
|---|---|---|---|---|
| `/auth/login` | POST | None | ✅ | ✅ |
| `/auth/register` | POST | None | ✅ | — |
| `/auth/google` *(planned)* | POST | None | ✅ | — |
| `/auth/apple` *(planned)* | POST | None | ✅ (iOS) | — |
| `/user/profile` | GET | Token | ✅ | — |
| `/user/profile` | PUT | Token | ✅ | — |
| `/user/account` | DELETE | Token | ✅ | — |
| `/user/password` | POST | Token | ✅ | — |
| `/user/privacy` | GET | Token | ✅ | — |
| `/user/privacy` | PUT | Token | ✅ | — |
| `/routes` | GET | Optional | ✅ | — |
| `/routes/:routeId` | GET | Optional | ✅ | — |
| `/routes/recommendations` | POST | Optional | ✅ | — |
| `/rides/history` | GET | Token | ✅ | — |
| `/rides/:rideId` | GET | Token | ✅ | — |
| `/rides/stats/distance` | GET | Token | ✅ | — |
| `/rides/feedback` | POST | Token | ✅ | — |
| `/admin/stats` | GET | Token (admin) | — | ✅ |
| `/admin/users` | GET | Token (admin) | — | ✅ |
| `/business/stats` | GET | Token (business) | — | ✅ |
| `/business/locations` | GET | Token (business) | — | ✅ |

**Total: 20 endpoints across 2 clients (18 live + 2 planned OAuth)**
