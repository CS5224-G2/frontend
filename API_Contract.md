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
| `limit` | number | No | Maximum number of routes to return; max `3`, default `3` |

#### Ideal JSON Response — `200 OK`

```json
[
  {
    "route_id": "route_001",
    "name": "Riverside Park Loop",
    "description": "A scenic route along the river with plenty of shade.",
    "distance": 12.5,
    "estimated_time": 45,
    "elevation": "dont-care",
    "shade": "reduce-shade",
    "air_quality": "care",
    "cyclist_type": "recreational",
    "review_count": 234,
    "rating": 4.8,
    "checkpoints": [
      {
        "checkpoint_id": "cp_001",
        "checkpoint_name": "Boathouse Cafe",
        "description": "Great place for a quick break",
        "lat": 40.7738,
        "lng": -73.9686
      },
      {
        "checkpoint_id": "cp_002",
        "checkpoint_name": "Bethesda Fountain",
        "description": "Beautiful fountain and photo spot",
        "lat": 40.7734,
        "lng": -73.9714
      }
    ],
    "points_of_interest_visited": [
      {
        "name": "Boathouse Cafe",
        "description": "Popular stop for drinks and light snacks",
        "lat": 40.7738,
        "lng": -73.9686
      },
      {
        "name": "Bethesda Fountain",
        "description": "Iconic scenic landmark inside the park",
        "lat": 40.7734,
        "lng": -73.9714
      }
    ],
    "start_point": { "lat": 40.7829, "lng": -73.9654, "name": "Central Park South" },
    "end_point": { "lat": 40.7829, "lng": -73.9654, "name": "Central Park South" }
  }
]
```

> Response is a JSON array of route objects.
> `elevation` must be: `"lower"` | `"dont-care"` | `"higher"`.
> `shade` must be: `"reduce-shade"` | `"dont-care"`.
> `air_quality` must be: `"care"` | `"dont-care"`.
> `checkpoints` includes `checkpoint_id`, `checkpoint_name`, `description`, `lat`, `lng` for route preview and checkpoint summaries.
> `points_of_interest_visited` is optional and includes `name`, `description`, `lat`, `lng` for route preview cards and map markers.
> This is a summary list endpoint; use `GET /routes/:routeId` for full route details including `route_path` and detailed `points_of_interest_visited`.

---

### `GET /routes/popular`

**Purpose**: Fetch the most popular routes for homepage highlights and discovery sections.  
**Client(s)**: Mobile  
**Auth**: Optional

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `limit` | number | No | Maximum number of popular routes to return; max `3`, default `3` |

#### Ideal JSON Response — `200 OK`

```json
[
  {
    "route_id": "route_001",
    "name": "Riverside Park Loop",
    "description": "A scenic route along the river with plenty of shade.",
    "distance": 12.5,
    "estimated_time": 45,
    "elevation": "dont-care",
    "shade": "reduce-shade",
    "air_quality": "care",
    "cyclist_type": "recreational",
    "review_count": 234,
    "rating": 4.8,
    "checkpoints": [
      {
        "checkpoint_id": "cp_001",
        "checkpoint_name": "Boathouse Cafe",
        "description": "Great place for a quick break",
        "lat": 40.7738,
        "lng": -73.9686
      }
    ],
    "points_of_interest_visited": [
      {
        "name": "Boathouse Cafe",
        "description": "Popular stop for drinks and light snacks",
        "lat": 40.7738,
        "lng": -73.9686
      }
    ],
    "start_point": { "lat": 40.7829, "lng": -73.9654, "name": "Central Park South" },
    "end_point": { "lat": 40.7829, "lng": -73.9654, "name": "Central Park South" }
  },
  {
    "route_id": "route_002",
    "name": "City Breeze Connector",
    "description": "Balanced city ride with park connectors and moderate shade.",
    "distance": 12.4,
    "estimated_time": 42,
    "elevation": "higher",
    "shade": "reduce-shade",
    "air_quality": "care",
    "cyclist_type": "recreational",
    "review_count": 320,
    "rating": 4.6,
    "checkpoints": [],
    "points_of_interest_visited": [],
    "start_point": { "lat": 1.2837, "lng": 103.8515, "name": "Raffles Place MRT" },
    "end_point": { "lat": 1.3025, "lng": 103.9128, "name": "East Coast Park" }
  }
]
```

> Response is a JSON array of up to `3` route objects, ordered by popularity.
> `limit` max is `3` and defaults to `3` when omitted.
> Response items use the same summary route shape as `GET /routes`.

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

```json
{
  "route_id": "route_001",
  "name": "City Breeze Connector",
  "description": "Balanced city ride with park connectors and moderate shade.",
  "distance": 12.4,
  "estimated_time": 42,
  "elevation": "higher",
  "shade": "reduce-shade",
  "air_quality": "care",
  "cyclist_type": "recreational",
  "review_count": 320,
  "rating": 4.6,
  "checkpoints": [
    {
      "checkpoint_id": "cp_001",
      "checkpoint_name": "Lau Pa Sat Hawker Centre",
      "description": "Historic outdoor hawker market with diverse local food",
      "lat": 1.2846,
      "lng": 103.8498
    },
    {
      "checkpoint_id": "cp_002",
      "checkpoint_name": "Merlion Park",
      "description": "Iconic landmark and best photo spot",
      "lat": 1.2869,
      "lng": 103.8545
    }
  ],
  "points_of_interest_visited": [
    {
      "name": "Lau Pa Sat Hawker Centre",
      "description": "Historic outdoor hawker market with diverse local food",
      "lat": 1.2846,
      "lng": 103.8498
    },
    {
      "name": "Merlion Park",
      "description": "Iconic landmark and best photo spot",
      "lat": 1.2869,
      "lng": 103.8545
    }
  ],
  "route_path": [
    { "lat": 1.2837, "lng": 103.8515 },
    { "lat": 1.2840, "lng": 103.8520 },
    { "lat": 1.2846, "lng": 103.8498 },
    { "lat": 1.2860, "lng": 103.8530 },
    { "lat": 1.2869, "lng": 103.8545 },
    { "lat": 1.2900, "lng": 103.8570 },
    { "lat": 1.3025, "lng": 103.9128 }
  ]
}
```

> `elevation`, `shade`, and `air_quality` use the same string enums as preference values (not numeric).  
> `checkpoints` includes `checkpoint_id`, `checkpoint_name`, `description`, `lat`, `lng` for map markers and checkpoint content.  
> `route_path` is an ordered array of lat/lon coordinate pairs for drawing the route polyline on the map.  
> `points_of_interest_visited` is optional and includes location coordinates for marking POI on the map.

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
    "source": "current-location"
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
    "shade_preference": "reduce-shade",
    "elevation_preference": "higher",
    "air_quality_preference": "care",
    "max_distance": 15,
    "points_of_interest": {
      "allow_hawker_center": true,
      "allow_park": false,
      "allow_historic_site": true,
      "allow_tourist_attraction": false
    }
  },
  "limit": 3
}
```

> `start_point.source` and `end_point.source` must be one of: `"current-location"` | `"search"` | `"map"`.
> `checkpoints[].source` must be one of: `"search"` | `"map"`.
> `preferences.shade_preference` must be: `"reduce-shade"` | `"dont-care"`.
> `preferences.elevation_preference` must be: `"lower"` | `"dont-care"` | `"higher"`.
> `preferences.air_quality_preference` must be: `"care"` | `"dont-care"`.
> `limit` max is 3 (default 3).

#### Ideal JSON Response — `200 OK`

```json
[
  {
    "route_id": "route_001",
    "name": "City Breeze Connector",
    "description": "Balanced city ride with park connectors and moderate shade.",
    "distance": 12.4,
    "estimated_time": 42,
    "elevation": "higher",
    "shade": "reduce-shade",
    "air_quality": "care",
    "cyclist_type": "recreational",
    "review_count": 320,
    "rating": 4.6,
    "points_of_interest_visited": [
      { "name": "Lau Pa Sat Hawker Centre" },
      { "name": "Merlion Park" }
    ]
  },
  {
    "route_id": "route_002",
    "name": "Coastal Easy Loop",
    "description": "Flatter loop with clean air and optional scenic stopovers.",
    "distance": 10.1,
    "estimated_time": 36,
    "elevation": "lower",
    "shade": "dont-care",
    "air_quality": "dont-care",
    "cyclist_type": "general",
    "review_count": 579,
    "rating": 4.8,
    "points_of_interest_visited": []
  }
]
```

> Response is a JSON array of up to 3 route recommendation objects.
> `elevation` must be: `"lower"` | `"dont-care"` | `"higher"`.
> `shade` must be: `"reduce-shade"` | `"dont-care"`.
> `air_quality` must be: `"care"` | `"dont-care"`.
> `points_of_interest_visited` is optional.

---

### `POST /routes/save`

**Purpose**: Save a route to the authenticated user's saved routes / favorites list.  
**Client(s)**: Mobile  
**Auth**: Bearer token required

#### Request Body

```json
{
  "route_id": "route_001",
  "name": "City Breeze Connector",
  "description": "Balanced city ride with park connectors and moderate shade.",
  "distance": 12.4,
  "estimated_time": 42,
  "elevation": "higher",
  "shade": "reduce-shade",
  "air_quality": "care",
  "cyclist_type": "recreational",
  "checkpoints": [
    {
      "checkpoint_id": "cp_001",
      "checkpoint_name": "Lau Pa Sat Hawker Centre",
      "description": "Historic outdoor hawker market with diverse local food",
      "lat": 1.2846,
      "lng": 103.8498
    },
    {
      "checkpoint_id": "cp_002",
      "checkpoint_name": "Merlion Park",
      "description": "Iconic landmark and best photo spot",
      "lat": 1.2869,
      "lng": 103.8545
    }
  ],
  "points_of_interest_visited": [
    {
      "name": "Lau Pa Sat Hawker Centre",
      "description": "Historic outdoor hawker market with diverse local food",
      "lat": 1.2846,
      "lng": 103.8498
    }
  ],
  "route_path": [
    { "lat": 1.2837, "lng": 103.8515 },
    { "lat": 1.2840, "lng": 103.8520 },
    { "lat": 1.2846, "lng": 103.8498 },
    { "lat": 1.2860, "lng": 103.8530 },
    { "lat": 1.2869, "lng": 103.8545 }
  ]
}
```

> This endpoint saves the route snapshot so the user can revisit the same route later even if recommendation ordering changes.
> `elevation`, `shade`, and `air_quality` use the same string enums as the route APIs.
> `checkpoints`, `points_of_interest_visited`, and `route_path` should be persisted together with the route metadata.

#### Ideal JSON Response — `201 Created`

```json
{
  "saved_route_id": "saved_route_001",
  "route_id": "route_001",
  "saved_at": "2026-03-28T09:15:00.000Z",
  "status": "saved"
}
```

#### Error Responses

| Status | Condition |
|---|---|
| `400` | Missing required route fields |
| `401` | Token missing or expired |
| `409` | Route already saved by the user |

---

## 5. Ride History

### `POST /rides`

**Purpose**: Save a completed ride to the user's ride history after they finish cycling.  
**Client(s)**: Mobile  
**Auth**: Bearer token required

#### Request Body

```json
{
  "route_id": "route_001",
  "start_time": "2026-03-28T09:42:00.000Z",
  "end_time": "2026-03-28T10:30:00.000Z",
  "distance": 12.5,
  "avg_speed": 15.6,
  "checkpoints_visited": [
    {
      "checkpoint_id": "cp_001",
      "checkpoint_name": "Pier 25",
      "description": "Waterfront viewing area",
      "lat": 1.2849,
      "lng": 103.8501
    },
    {
      "checkpoint_id": "cp_002",
      "checkpoint_name": "Hudson River Park",
      "description": "Popular park area along the route",
      "lat": 1.2862,
      "lng": 103.8534
    }
  ],
  "points_of_interest_visited": [
    {
      "name": "Pier 25",
      "description": "Waterfront viewing area",
      "lat": 1.2849,
      "lng": 103.8501
    }
  ]
}
```

> `route_id` is required and must reference an existing route.
> `start_time` and `end_time` are ISO 8601 timestamps; `total_time` (minutes) is calculated server-side.
> `distance` (km) and `avg_speed` (km/h) are captured from the cycling session.
> `checkpoints_visited` and `points_of_interest_visited` are optional arrays of checkpoint/POI objects visited during the ride.

#### Ideal JSON Response — `201 Created`

```json
{
  "ride_id": "ride_1001",
  "route_id": "route_001",
  "route_name": "Waterfront Loop",
  "completion_date": "March 28, 2026",
  "completion_time": "10:30 AM",
  "start_time": "2026-03-28T09:42:00.000Z",
  "end_time": "2026-03-28T10:30:00.000Z",
  "total_time": 48,
  "distance": 12.5,
  "avg_speed": 15.6,
  "checkpoints_visited": 2,
  "status": "completed"
}
```

> `ride_id` is auto-generated and unique.
> `total_time` is calculated from `end_time - start_time` in minutes.
> `checkpoints_visited` is the count of checkpoints from the request.
> `status` is always `"completed"` for newly created rides.

#### Error Responses

| Status | Condition |
|---|---|
| `400` | Missing required fields (route_id, start_time, end_time) or invalid time range |
| `401` | Token missing or expired |
| `404` | Route not found |

---

### `POST /rides/location`

**Purpose**: Post the current location of the user while actively cycling on a route.  
**Client(s)**: Mobile  
**Auth**: Bearer token required

#### Request Body

```json
{
  "ride_id": "ride_1001",
  "lat": 1.2849,
  "lng": 103.8501,
  "timestamp": "2026-03-28T09:52:30.000Z",
  "speed": 16.5,
  "accuracy": 10.5
}
```

> `ride_id` is required and must correspond to an active ride in progress.
> `lat` and `lng` are the current GPS coordinates (WGS84).
> `timestamp` is the ISO 8601 timestamp when the location was captured.
> `speed` (km/h) is optional and represents the current/instantaneous speed.
> `accuracy` (meters) is optional and indicates GPS accuracy/confidence radius.

#### Ideal JSON Response — `204 No Content`

No body. The server acknowledges the location update.

#### Error Responses

| Status | Condition |
|---|---|
| `400` | Missing required fields (ride_id, lat, lng, timestamp) or invalid coordinates |
| `401` | Token missing or expired |
| `404` | Ride not found or not owned by user |
| `409` | Ride is not active (already completed) |

---

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
    "total_time": 48,
    "distance": 12.5,
    "avg_speed": 15.6,
    "checkpoints_visited": 3,
    "checkpoints": [
      {
        "checkpoint_id": "cp_001",
        "checkpoint_name": "Pier 25",
        "description": "Waterfront viewing area",
        "lat": 1.2849,
        "lng": 103.8501
      },
      {
        "checkpoint_id": "cp_002",
        "checkpoint_name": "Hudson River Park",
        "description": "Popular park area along the route",
        "lat": 1.2862,
        "lng": 103.8534
      }
    ],
    "points_of_interest_visited": [
      {
        "name": "Pier 25",
        "description": "Waterfront viewing area",
        "lat": 1.2849,
        "lng": 103.8501
      }
    ],
    "rating": 5,
    "review": "Absolutely loved this route!"
  }
]
```

> Field names use base units without suffix: `total_time` (minutes), `distance` (km), `avg_speed` (km/h).
> `checkpoints` includes checkpoint detail objects with `checkpoint_id`, `checkpoint_name`, `description`, `lat`, `lng`.
> `points_of_interest_visited` is optional and includes `name`, `description`, `lat`, `lng`.
> `rating` and `review` are optional — omitted if user has not reviewed the ride.

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

```json
{
  "ride_id": "1",
  "route_id": "route_001",
  "route_name": "Waterfront Loop",
  "completion_date": "March 12, 2026",
  "completion_time": "10:30 AM",
  "start_time": "9:42 AM",
  "end_time": "10:30 AM",
  "total_time": 48,
  "distance": 12.5,
  "avg_speed": 15.6,
  "checkpoints_visited": 3,
  "rating": 5,
  "review": "Absolutely loved this route!",
  "route_details": {
    "route_id": "route_001",
    "name": "Waterfront Loop",
    "description": "A scenic route along the river with plenty of shade.",
    "distance": 12.5,
    "estimated_time": 45,
    "elevation": "dont-care",
    "shade": "reduce-shade",
    "air_quality": "care",
    "cyclist_type": "recreational",
    "review_count": 234,
    "rating": 4.8,
    "checkpoints": [
      {
        "checkpoint_id": "cp_001",
        "checkpoint_name": "Pier 25",
        "description": "Waterfront viewing area",
        "lat": 1.2849,
        "lng": 103.8501
      },
      {
        "checkpoint_id": "cp_002",
        "checkpoint_name": "Hudson River Park",
        "description": "Popular park area along the route",
        "lat": 1.2862,
        "lng": 103.8534
      }
    ],
    "points_of_interest_visited": [
      {
        "name": "Pier 25",
        "description": "Waterfront viewing area",
        "lat": 1.2849,
        "lng": 103.8501
      }
    ],
    "route_path": [
      { "lat": 1.3025, "lng": 103.9128 },
      { "lat": 1.3020, "lng": 103.9120 },
      { "lat": 1.2849, "lng": 103.8501 },
      { "lat": 1.2750, "lng": 103.8450 }
    ]
  }
}
```

> Top-level fields contain ride-specific stats: `total_time` (minutes), `distance` (km), `avg_speed` (km/h), `checkpoints_visited` (count), `rating` (user's post-ride rating), `review` (user's review).
> Top-level `checkpoints` and `points_of_interest_visited` represent what was actually visited during this ride.
> `route_details` mirrors the route detail shape needed by the ride detail screen, including `estimated_time`, `rating`, route polyline (`route_path`), and `checkpoints` / `points_of_interest_visited` for map and content rendering.
> `points_of_interest_visited` (if present) includes `name`, `description`, `lat`, `lng` for marking all visited POI on the map.
> `checkpoints` includes `checkpoint_id`, `checkpoint_name`, `description`, `lat`, `lng` for the checkpoint list shown on the ride detail page.
> This endpoint should be sufficient for the ride detail screen without a second `GET /routes/:routeId` request.
> `rating` and `review` are optional — omitted if user has not reviewed the ride.

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
  { "period_id": "mon", "label": "Mon", "distance": 0 },
  { "period_id": "tue", "label": "Tue", "distance": 8.2 },
  { "period_id": "wed", "label": "Wed", "distance": 0 },
  { "period_id": "thu", "label": "Thu", "distance": 18.3 },
  { "period_id": "fri", "label": "Fri", "distance": 0 },
  { "period_id": "sat", "label": "Sat", "distance": 12.5 },
  { "period_id": "sun", "label": "Sun", "distance": 0 }
]
```

#### Ideal JSON Response — `200 OK` (month)

```json
[
  { "period_id": "week1", "label": "Week 1", "distance": 45.5 },
  { "period_id": "week2", "label": "Week 2", "distance": 38.9 },
  { "period_id": "week3", "label": "Week 3", "distance": 52.3 },
  { "period_id": "week4", "label": "Week 4", "distance": 39.0 }
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

## 8. External APIs

### OneMap Search API

**Purpose**: Provide Singapore-specific place and address lookup for the mobile route configuration map search.  
**Client(s)**: Mobile  
**Owned by**: Singapore Land Authority (OneMap)  
**CycleLink Auth**: None  
**Provider Auth**: OneMap API token required in `Authorization` header

> This is a third-party API integration used directly by the mobile client for location search.
> It is not a CycleLink-owned backend endpoint and must not be implemented by the backend team unless the integration is later proxied server-side.

#### Provider Endpoint

`GET https://www.onemap.gov.sg/api/common/elastic/search`

#### Required Headers

| Header | Value |
|---|---|
| `Authorization` | `<EXPO_PUBLIC_ONEMAP_API_KEY>` |

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `searchVal` | string | Yes | Free-text search term entered by the user |
| `returnGeom` | string | Yes | Must be `Y` |
| `getAddrDetails` | string | Yes | Must be `Y` |
| `pageNum` | integer | No | Page number for paginated search results |

#### Example Request

```http
GET /api/common/elastic/search?searchVal=East%20Coast%20Park&returnGeom=Y&getAddrDetails=Y HTTP/1.1
Host: www.onemap.gov.sg
Authorization: <EXPO_PUBLIC_ONEMAP_API_KEY>
```

#### Provider Response Shape — `200 OK`

```json
{
  "found": 2,
  "totalNumPages": 1,
  "pageNum": 1,
  "results": [
    {
      "SEARCHVAL": "EAST COAST PARK",
      "BLK_NO": "",
      "ROAD_NAME": "EAST COAST PARK SERVICE ROAD",
      "BUILDING": "EAST COAST PARK",
      "ADDRESS": "EAST COAST PARK SERVICE ROAD SINGAPORE",
      "POSTAL": "",
      "X": "40284.1234",
      "Y": "30876.5678",
      "LATITUDE": "1.302500",
      "LONGITUDE": "103.912800",
      "LONGTITUDE": "103.912800"
    }
  ]
}
```

#### Frontend Mapping Rules

The mobile app maps OneMap search results to the internal `RouteRequestLocation` shape as follows:

```json
{
  "name": "EAST COAST PARK",
  "lat": 1.3025,
  "lng": 103.9128,
  "source": "search"
}
```

Mapping notes:

| OneMap field | Internal field | Rule |
|---|---|---|
| `BUILDING` | `name` | Use when present and not `"NIL"` |
| `ADDRESS` | `name` | Fallback when `BUILDING` is empty or `"NIL"` |
| `SEARCHVAL` | `name` | Final fallback |
| `LATITUDE` | `lat` | Parse string to number |
| `LONGITUDE` | `lng` | Parse string to number |
| constant | `source` | Always `"search"` |

#### Provider Error Conditions

| Status | Condition |
|---|---|
| `400` | Invalid or missing query parameters |
| `403` | Token does not have access |
| `429` | Rate limit exceeded |
| `5xx` | OneMap provider failure |

#### Frontend Fallback Behaviour

- If OneMap search fails, the mobile app shows a search error state in the map modal.
- Users can still manually drop a pin on the map and continue route configuration.

---

## Endpoint Summary

> This table lists CycleLink-owned backend endpoints only. External provider APIs used directly by the frontend, such as OneMap Search, are documented separately above.

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
| `/routes/popular` | GET | Optional | ✅ | — |
| `/routes/:routeId` | GET | Optional | ✅ | — |
| `/routes/recommendations` | POST | Optional | ✅ | — |
| `/routes/save` | POST | Token | ✅ | — |
| `/rides` | POST | Token | ✅ | — |
| `/rides/location` | POST | Token | ✅ | — |
| `/rides/history` | GET | Token | ✅ | — |
| `/rides/:rideId` | GET | Token | ✅ | — |
| `/rides/stats/distance` | GET | Token | ✅ | — |
| `/rides/feedback` | POST | Token | ✅ | — |
| `/admin/stats` | GET | Token (admin) | — | ✅ |
| `/admin/users` | GET | Token (admin) | — | ✅ |
| `/business/stats` | GET | Token (business) | — | ✅ |
| `/business/locations` | GET | Token (business) | — | ✅ |

**Total: 24 endpoints across 2 clients (22 live + 2 planned OAuth)**
