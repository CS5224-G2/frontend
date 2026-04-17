# CycleLink mobile — `feat-livemap` vs `main` & runbook

## Brief summary: `feat-livemap` compared to `main`

`feat-livemap` is **ahead of `main`** (it includes all of `main` plus additional work). Against `main`, the branch is a **large integration**: on the order of **~190+ files** and **tens of thousands of insertions** across the repo—not only live map work.

**Themes of what changed relative to `main`:**

| Area | What landed |
|------|-------------|
| **Live navigation** | `LiveMapPage` (Expo Go fallback vs dev build Mapbox), `LiveMapMapbox`, `LiveMapExpoGoScreen`, `useLiveMapRideState` (progress, checkpoints, exit/complete modals, feedback handoff), `routeGeometry` for polylines. |
| **Mobile app shell** | `src/app/navigation.tsx` (tabs + stacks, liquid tab bar), `AuthContext` / `RequireAuth`, pages under `src/app/pages/` (home, route config → recommendation → details → confirmed → live map → feedback, history, profile, onboarding, auth). |
| **Data & API** | `httpClient`, `routeService`, `rideService`, `userService`, `settingsService`, `poiService`, `localDb`, secure session; shared types/mocks; env-driven `EXPO_PUBLIC_*` (API base, mocks, Mapbox, OneMap). |
| **Route UX** | Route lookup, reverse geocode labels, floating tab bar insets, safe back stack for Route Details, feedback fallbacks, tests across pages. |
| **Tooling & docs** | Jest setup/mocks (Mapbox, secure store, etc.), `TESTING.md`, Maestro flows, NativeWind/tailwind, `app/` expo-router shells wiring into `src/app/App.tsx`. |
| **Repo beyond mobile** | `web-app/` (Vite admin/business dashboards), expanded `API_Contract.md`, GitHub Actions (`web-ci.yml`), design/plan docs under `docs/`. |

**Net:** `main` is the older baseline; **`feat-livemap` is the feature branch that carries the full current mobile journey, live map (Mapbox in dev builds), backend-oriented services, and supporting web/docs/CI.**

---

## Step-by-step runbook (mobile app)

Use these steps to run and verify the **CycleLink mobile** package. Paths assume the [frontend](https://github.com/CS5224-G2/frontend) monorepo layout: the app lives in **`mobile/`**. If your checkout is only the mobile folder, run commands from that folder and skip the `cd mobile` step.

### 1. Prerequisites

1. Install **Node.js** (LTS recommended) and **npm**.
2. Install **Watchman** (recommended on macOS for Metro).
3. For **iOS**: macOS, **Xcode**, CocoaPods (`sudo gem install cocoapods` or via Homebrew).
4. For **Android**: **Android Studio** (SDK, emulator or USB device).
5. Clone the repository and check out the branch you need, e.g. `feat-livemap`:
   ```bash
   git clone https://github.com/CS5224-G2/frontend.git
   cd frontend
   ```

### 2. Install dependencies

1. Go to the mobile app directory:
   ```bash
   cd mobile
   ```
2. Install packages:
   ```bash
   npm ci
   ```
   (Use `npm install` if you do not rely on a lockfile snapshot.)

### 3. Environment variables

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. Edit **`.env`** (do not commit secrets). Typical keys:
   - **`EXPO_PUBLIC_API_BASE_URL`** — backend base URL when using the real API.
   - **`EXPO_PUBLIC_USE_MOCKS`** — `true` to avoid network calls and use mocks/local data; set `false` when pointing at a real backend.
   - **`EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`** — required for **native Mapbox** in a dev build (see below). Not used in Expo Go’s live-map fallback UI.
   - **`EXPO_PUBLIC_LIVE_MAP_PROGRESS_SIMULATION`** — optional QA/demo flag; set `true` only if you want the rider marker / progress HUD to auto-advance.
   - **`EXPO_PUBLIC_ONEMAP_API_KEY`** — optional; enables OneMap place search in route configuration (see `README.md`).
   - **`EXPO_PUBLIC_API_LOGGING`** — optional structured API logging (`true` / `false`).
3. Restart Metro after changing `.env` (`npx expo start` with a full restart).

### 4. Start Metro (development server)

1. From `mobile/`:
   ```bash
   npm start
   ```
2. In the terminal UI, press **`i`** (iOS simulator), **`a`** (Android), or scan the QR code with a dev client.

### 5. Run on iOS (simulator or device)

1. **Expo Go (quick UI, limited native features):**
   ```bash
   npm run ios
   ```
   - `@rnmapbox/maps` is not available inside standard Expo Go.
   - On **Android Expo Go**, `expo-notifications` features removed in SDK 53+ are disabled in this repo; use a **development build** if you need real native notification behavior.
   Or open the project in Xcode only after a native prebuild (step 6).

2. **Development build (Mapbox live map / native notifications):** Use a **dev client**:
   ```bash
   npx expo prebuild
   npx expo run:ios
   ```
   - Ensure **`EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`** is set in `.env` before building.
   - If Mapbox SDK download fails, see **`docs/TESTING.md`** for `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` and Mapbox install notes.

### 6. Run on Android

1. Start an emulator or connect a device with USB debugging.
2. From `mobile/`:
   ```bash
   npm run android
   ```
3. For Mapbox, use **`npx expo prebuild`** then **`npx expo run:android`** with the same token guidance as iOS.

### 7. Run on web (optional)

```bash
npm run web
```

Note: Live Map and some native modules are limited or stubbed on web; use iOS/Android for full journey testing.

### 8. Automated tests

From `mobile/`:

```bash
npm run test:ci
```

See **`docs/TESTING.md`** for Jest details, Mapbox mocks, and **Maestro** E2E flows under `.maestro/`.

### 9. Common verification path (happy path)

1. Log in (or register and complete onboarding if enabled).
2. **Home** → open a route or **Customize Route** → **Recommendations** → **Route Details** → **Confirm** → **Start Cycling** (Live Map).
3. In **Expo Go**, expect the **fallback** live-ride HUD (no Mapbox map). In a **dev build** with a token, expect the **Mapbox** map and `live-map-mapview` (see `TESTING.md`).
4. Use **Stop Cycling** / exit flows and **Feedback** as needed.

### 10. Troubleshooting quick reference

| Symptom | Check |
|--------|--------|
| Metro connection refused from Xcode | Start **`npm start`** (Metro) before running the native app, or use `npx expo run:ios` which coordinates the bundler. |
| Live map is blank / no map | Use a **dev build**, set **`EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`**, run **prebuild** after plugin/env changes. |
| API errors / 502 | Confirm **`EXPO_PUBLIC_API_BASE_URL`** and backend health; temporarily set **`EXPO_PUBLIC_USE_MOCKS=true`**. |
| Tab bar covers bottom buttons | Scrolling padding is handled via **`floatingTabBarInset`**; if a new screen adds bottom CTAs, reuse **`useFloatingTabBarScrollPadding`**. |
| Back from Route Details does nothing | Cross-tab opens should build a stack with **Home** under **Route Details**; in-app **safe back** resets to **Home** when `canGoBack` is false. |

---

## Related docs

- **`docs/TESTING.md`** — Jest, Maestro, Mapbox, app id.
- **`README.md`** (mobile) — OneMap, architecture overview.
- **`.env.example`** — All `EXPO_PUBLIC_*` variables.
