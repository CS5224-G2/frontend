# CycleLink mobile — testing & QC

This document covers **Expo / Jest unit tests**, **Maestro UI flows**, and **Mapbox-specific checks** for route configuration, confirmation, and live navigation.

## Prerequisites

- **Mapbox:** Create a [Mapbox access token](https://account.mapbox.com/access-tokens/) and set `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` in `.env` (see `.env.example`).
- **Native build:** `@rnmapbox/maps` requires native code. Use a **development build** (not Expo Go): `npx expo prebuild` then `npx expo run:ios` / `run:android`, or EAS Build. After adding the Mapbox plugin, run prebuild again so `Podfile` / Gradle pick up the config.
- **Optional download token:** For some iOS/Android SDK installs, set `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` in the environment when running `prebuild` (see [rnmapbox install docs](https://rnmapbox.github.io/docs/install)).

## Unit tests (Jest + Expo)

```bash
cd mobile
npm test -- --watchman=false --no-watch
```

- **Preset:** `jest-expo` (see `package.json`).
- **Setup:** `jest.setup.js` stubs `@rnmapbox/maps`, `@react-native-async-storage/async-storage`, and `@react-native-community/slider`, and removes `global.MessageChannel` to avoid test hangs.
- **Route / map logic:** `src/utils/routeGeometry.test.ts` validates polyline construction and interpolation used by `LiveMapPage`.
- **Screens:** `src/app/pages/RouteConfigPage.test.tsx`, `RouteConfirmedPage.test.tsx`, and `LiveMapPage.test.tsx` cover persistence, React Navigation, and Mapbox UI when a token is present (mocked `MapView`).

## Maestro (mobile UI / E2E)

[Maestro](https://maestro.mobile.dev/) drives the app on a simulator or device.

### Install

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

### App ID

- **Custom dev build:** `sg.edu.nus.cyclelink` (from `app.json`).
- **Expo Go:** use Maestro’s docs for the Expo Go package id on your platform (not recommended for Mapbox, which needs a dev client).

### Flows

Flows live in `.maestro/`:

| Flow | Purpose |
|------|--------|
| `route-journey.yaml` | Happy path: Home → configure route → recommendations → confirm → **live map** (assert `live-map-mapview` when token is set). |

**Important:** The default entry screen is **Login** (`app/index.tsx`). For the bundled flow you must either:

1. Sign in once and leave the app on **Home** before running Maestro, or  
2. Extend the flow with your own login steps (add `testID`s to login fields if needed), or  
3. Temporarily point `index` at Home for QA (do not commit that for production).

Run:

```bash
cd mobile
maestro test .maestro/route-journey.yaml
```

### UI QC: route on map after confirmation

After **Start Cycling Now**, Maestro asserts:

- `live-map-root` is visible.
- `live-map-mapview` is visible **when** `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` is configured in the build.
- Without a token, the screen shows `live-map-no-token` (copy explains how to enable the map).

## Manual QC checklist

1. **RouteConfigPage:** Change start/end, sliders, cyclist type → **Find Routes** → lands on recommendation list.
2. **Route list:** Tap a card → **RouteConfirmedPage** shows correct distance / time / checkpoints.
3. **External maps:** **View Route on Google / Apple Maps** opens the native maps app (platform-dependent URL).
4. **LiveMapPage:** Blue **LineString** follows start → checkpoints → end; checkpoint banner and completion modal behave as in the wireframe. Enable `EXPO_PUBLIC_LIVE_MAP_PROGRESS_SIMULATION=true` only if you want the old simulated rider movement during QA.
5. **Stop / exit:** **Stop Cycling** → completion or exit modal → **Feedback** screen.

## CI tips

- Run Jest in CI with `npm test -- --watchman=false --ci`.
- Maestro is best run on a macOS runner with an Android emulator or iOS simulator; cache the Maestro CLI and use a development build artifact.
