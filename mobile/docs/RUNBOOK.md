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
   - **`EXPO_PUBLIC_ONEMAP_API_KEY`** — optional; enables OneMap place search in route configuration (see `README.md`).
   - **`EXPO_PUBLIC_API_LOGGING`** — optional structured API logging (`true` / `false`).
3. Restart Metro after changing `.env` (`npx expo start` with a full restart).

### 4. Start Metro (development server)

1. From `mobile/`:
   ```bash
   npm start
   ```
2. In the terminal UI, press **`i`** (iOS simulator), **`a`** (Android), or scan the QR code with a dev client.

---

### 5. Simulate on **iOS** (Xcode) and **Android** (not Xcode)

**Important:** **Xcode only builds and runs the iOS app.** Android simulators are driven by **Android Studio** (or the `emulator` CLI) plus **`npx expo run:android`** / Gradle. To confirm the project works on **both** platforms, run through **both** subsections below with the same `.env` and branch.

#### 5.0 When you need a native dev build

Standard **Expo Go** is enough for much of the UI, but **Mapbox** (`@rnmapbox/maps`) and some native modules require a **development build**. That means generated **`ios/`** and **`android/`** folders (from **`npx expo prebuild`**) and installing pods / Gradle deps once.

- Set **`EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`** in `.env` **before** prebuild/build if you want the live Mapbox map.
- If Mapbox SDK download fails on iOS, see **`docs/TESTING.md`** (`RNMAPBOX_MAPS_DOWNLOAD_TOKEN`).

#### 5.1 One-time native project generation (do this from `mobile/`)

1. Install JS dependencies (if you have not already):
   ```bash
   cd mobile
   npm ci
   ```
2. Ensure **`.env`** exists (see §3).
3. Generate native projects (creates or refreshes `ios/` and `android/`):
   ```bash
   npx expo prebuild
   ```
   Use **`npx expo prebuild --clean`** if you changed plugins, Mapbox config, or hit stale native state (you will lose manual edits inside `ios/` / `android/`).
4. **iOS pods:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

After this, you can use **Xcode** for iOS and **Android Studio** or **CLI** for Android.

#### 5.2 iOS — build and run in **Xcode** (Simulator)

1. Open the **workspace** (not the `.xcodeproj`). The name matches **`expo.name`** in `app.json` (this project: **CycleLink**):
   ```bash
   open ios/CycleLink.xcworkspace
   ```
   If the path differs, run `ls ios/*.xcworkspace` and open the file shown.
2. In the Xcode toolbar, open the **scheme** menu (next to the Stop/Run buttons) and select the **app target** (e.g. **CycleLink**), not a pod target.
3. Open the **destination** menu (device list) and choose an **iPhone Simulator** (e.g. **iPhone 16**). If the list is empty, install simulator runtimes via **Xcode → Settings → Platforms**.
4. **Product → Clean Build Folder** (hold **Option** if you do not see it under **Product**) when switching branches or after `pod install`.
5. **Product → Run** (⌘R). Xcode builds, launches the Simulator, and installs the app.
6. **JavaScript bundle:** Prefer having Metro running so reloads are fast:
   ```bash
   # From mobile/, in a separate terminal
   npm start
   ```
   If the app shows a connection error, confirm Metro is up and the simulator can reach your machine (same Wi‑Fi / localhost; for physical devices you may need LAN or tunnel—see Expo docs).
7. Repeat a short **smoke test** (login, open a route, open Live Map if you use Mapbox) on the simulator.

#### 5.3 iOS — same build without opening Xcode (optional)

From `mobile/`:

```bash
npx expo run:ios
```

This builds the native app and starts a simulator; it can start Metro for you. Use this for a quick loop; use **Xcode** when you need breakpoints, build logs, or signing issues.

#### 5.4 Android — emulator + run (**Android Studio**, not Xcode)

1. Install **Android Studio** and open **SDK Manager**; install a recent **Android SDK** and **Platform Tools**.
2. Open **Device Manager** (phone icon) → **Create Device** → pick a phone profile → choose a **system image** (e.g. latest API) → finish → **Play** to start the emulator. Leave it running.
3. From **`mobile/`**, install the app on the emulator:
   ```bash
   npx expo run:android
   ```
   First run may take several minutes (Gradle). Ensure **`JAVA_HOME`** points to a JDK Android Studio can use (often the embedded JBR).
4. **Metro:** Keep **`npm start`** in another terminal if you want fast refresh; otherwise `expo run:android` may start the bundler for you.
5. Run the **same smoke test** as on iOS (maps, navigation, API or mocks).

#### 5.5 Android — open in Android Studio (optional)

1. Open Android Studio → **Open** → select the **`mobile/android`** folder (the Gradle project Expo generated).
2. Wait for Gradle sync, pick the **app** configuration, choose your **AVD**, then **Run**. This is optional; **`npx expo run:android`** is usually enough.

#### 5.6 Expo Go (quick check, limited native features)

- **iOS:** `npm run ios` may target Expo Go depending on your setup; Live Map Mapbox will **not** load there.
- **Android:** `npm run android` similarly.

Use **§5.1–5.5** when validating **Mapbox** and full native parity.

#### 5.7 Checklist — “works on both platforms”

| Step | iOS (Simulator) | Android (Emulator) |
|------|-----------------|---------------------|
| App launches | ✓ (Xcode Run or `expo run:ios`) | ✓ (`expo run:android`) |
| Metro / JS loads | ✓ | ✓ |
| Core navigation (tabs, stacks) | ✓ | ✓ |
| Route flow through Live Map | ✓ with dev build + Mapbox token | ✓ with dev build + Mapbox token |
| External maps button (if used) | Opens Apple Maps | Opens Google Maps |

### 6. Run on web (optional)

```bash
npm run web
```

Note: Live Map and some native modules are limited or stubbed on web; use iOS/Android for full journey testing.

### 7. Automated tests

From `mobile/`:

```bash
npm run test:ci
```

See **`docs/TESTING.md`** for Jest details, Mapbox mocks, and **Maestro** E2E flows under `.maestro/`.

### 8. Common verification path (happy path)

1. Log in (or register and complete onboarding if enabled).
2. **Home** → open a route or **Customize Route** → **Recommendations** → **Route Details** → **Confirm** → **Start Cycling** (Live Map).
3. In **Expo Go**, expect the **fallback** live-ride HUD (no Mapbox map). In a **dev build** with a token, expect the **Mapbox** map and `live-map-mapview` (see `TESTING.md`).
4. Use **Stop Cycling** / exit flows and **Feedback** as needed.

### 9. Troubleshooting quick reference

| Symptom | Check |
|--------|--------|
| Metro connection refused from Xcode | Start **`npm start`** (Metro) before running the native app, or use `npx expo run:ios` which coordinates the bundler. |
| Live map is blank / no map | Use a **dev build**, set **`EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`**, run **prebuild** after plugin/env changes. |
| `PrivacyInfo.xcprivacy` missing under `expo-auth-session/...` | Run commands from **`mobile/`** (not `ios/`). Hoisted **`node_modules/expo-application/ios/PrivacyInfo.xcprivacy`** should exist; then **`rm -rf ios/Pods ios/Podfile.lock`** and **`pod install`**. See prior runbook notes on nested `expo-application`. |
| Android build fails (SDK / JAVA_HOME) | Open **Android Studio → SDK Manager**; set **`JAVA_HOME`** to Android Studio’s bundled JDK if needed. |
| API errors / 502 | Confirm **`EXPO_PUBLIC_API_BASE_URL`** and backend health; temporarily set **`EXPO_PUBLIC_USE_MOCKS=true`**. |
| Tab bar covers bottom buttons | Scrolling padding is handled via **`floatingTabBarInset`**; if a new screen adds bottom CTAs, reuse **`useFloatingTabBarScrollPadding`**. |
| Back from Route Details does nothing | Cross-tab opens should build a stack with **Home** under **Route Details**; in-app **safe back** resets to **Home** when `canGoBack` is false. |

---

## Related docs

- **`docs/TESTING.md`** — Jest, Maestro, Mapbox, app id.
- **`README.md`** (mobile) — OneMap, architecture overview.
- **`.env.example`** — All `EXPO_PUBLIC_*` variables.
