# CycleLink Frontend

Frontend repository for **CycleLink** — intelligent cycling route recommendations (CS5224 Group Project). This is a minimal, abstract framework so frontend contributors can add implementation without large structural changes.

## Design summary (from Prelim Report)

- **Mobile app:** Expo (React Native). User flow: onboarding (cyclist type + preferences) → home (discover/customise routes) → export route to **Google Maps / Apple Maps** via deep link → post-ride return to app for checkpoint feedback and **route rating**.
- **Navigation:** We recommend the route; turn-by-turn navigation runs in the external map app (Approach B).
- **Admin dashboard:** Web app for usage stats, sponsor admin, developer monitoring; to be hosted on S3 + CloudFront.


## Repo structure

```
frontend/
├── mobile/              # Expo (React Native) — main user-facing app
├── admin-dashboard/     # Web app — S3/CloudFront (placeholder)
└── docs/                # Design notes and contracts
```

## Getting started

### Mobile app (with CycleLink icon)

The app icon is set from `design/Icon.png` (copied to `mobile/assets/icon.png`). To run and test on your **iPhone**:

```bash
cd mobile
npm install
npx expo start
```

Then scan the QR code with your iPhone camera and open in **Expo Go**, or press **i** for iOS Simulator. For a full step-by-step (including optional standalone build for device), see **[docs/TEST_DEPLOY.md](docs/TEST_DEPLOY.md)**.

Implement screens and services under `mobile/src/` as needed. Backend base URL and env are configured via `.env` (see `mobile/README.md`).

### Admin dashboard

See `admin-dashboard/README.md`. Static site intended for S3 + CloudFront; add your stack (e.g. React/Vite) when ready.

## Where to implement what

| Area | Location | Notes |
|------|----------|--------|
| Onboarding (cyclist type, preferences) | `mobile/src/screens/onboarding/` | Persist to local storage; sync to backend when available |
| Home & route discovery | `mobile/src/screens/home/` | Recommended routes, customise start/end and checkpoints |
| Route config & export | `mobile/src/screens/route/` or `services/maps.ts` | Build Google/Apple Maps URL; open via `Linking.openURL()` |
| Post-ride feedback & rating | `mobile/src/screens/feedback/` | Checkpoint summary + rating submission |
| API client | `mobile/src/services/api.ts` | Point at ALB; auth (e.g. Cognito) when backend is ready |
| Admin stats & dashboards | `admin-dashboard/` | Usage, sponsor customisation, health/monitoring |

## Backend contract (placeholder)

Mobile app will call:

- Route recommendation (origin, destination, preferences, optional waypoints) → scored route + waypoints for export.
- Optional: trip/telemetry (batched location) and rating submission.

Exact endpoints and payloads to be aligned with backend team; keep API client in `mobile/src/services/` and types in `mobile/src/types/`.

## Contributing

1. Create a branch, implement under the existing folders (screens, components, services).
2. Avoid renaming or removing the top-level screens/navigation slots so others can merge easily.
3. Add env vars to `.env.example` only (never commit secrets).
