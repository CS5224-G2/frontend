# CycleLink Mobile (Expo)

Expo (React Native) app for CycleLink. The app uses the CycleLink icon from `design/Icon.png` (stored in `assets/icon.png`). Placeholder screens and services are in place; implement UI and API calls as needed.

## Setup

```bash
npm install
npx expo start
```

- **Test on iPhone:** Scan the QR code with the Camera app → Open in Expo Go. Full steps (including optional standalone build): **[../docs/TEST_DEPLOY.md](../docs/TEST_DEPLOY.md)**.
- Create a `.env` (see `.env.example`) for `EXPO_PUBLIC_API_BASE_URL` when the backend is available.

**npm install warnings or audit issues?** See **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** (deprecation warnings are from the Expo/React Native toolchain and can be ignored; run `npm audit fix` for vulnerabilities).

## Structure

- **`app/`** — Expo Router screens. Do not remove or rename route files so others can merge easily.
  - `index.tsx` — entry (redirect to onboarding or home)
  - `onboarding.tsx` — cyclist type + preferences
  - `home.tsx` — discover / customise routes
  - `route.tsx` — show route, export to Google/Apple Maps
  - `feedback.tsx` — post-ride rating
- **`src/services/`** — API client (`api.ts`), maps URL builder and open (`maps.ts`)
- **`src/types/`** — shared types (e.g. preferences, cyclist type)

## Export to maps

Use `openRouteInMaps()` from `src/services/maps.ts` with origin, destination, and waypoints from the backend. Build the URL with `buildGoogleMapsUrl` or `buildAppleMapsUrl` as needed.

## Backend

Point `EXPO_PUBLIC_API_BASE_URL` at the ALB when ready. Implement `getRouteRecommendation` and `submitRating` in `src/services/api.ts` to match backend contracts.
