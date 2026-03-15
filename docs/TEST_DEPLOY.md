# CycleLink — Step-by-step: Test-deploy on iPhone with Expo

This guide walks you through running the CycleLink mobile app and test-deploying it on a physical **iPhone** using Expo. The app uses the project icon from `design/Icon.png`.

---

## Prerequisites

- **Node.js** 20.19+ and **npm** (or yarn/pnpm) — required for Expo SDK 54
- **Expo Go** installed on your iPhone ([App Store](https://apps.apple.com/app/expo-go/id982107779))
- **Expo Go and project must use the same SDK version.** If you see "Project is incompatible with this version of Expo Go", see [Troubleshooting: Expo Go SDK mismatch](#troubleshooting-expo-go-sdk-mismatch) below.
- iPhone and Mac on the **same Wi‑Fi network** (for “Expo Go” flow)
- Optional: **Apple Developer account** and **Xcode** (only needed for a standalone development build or App Store build)

---

## Step 1: Open the frontend project

From the **Group Project** root (or the repo root that contains `frontend/`):

```bash
cd frontend/mobile
```

---

## Step 2: Install dependencies

```bash
npm install
```

Wait for install to finish. If you see peer dependency warnings, they can be ignored for this test-deploy.

---

## Step 3: Start the Expo dev server

```bash
npx expo start
```

You should see:

- A QR code in the terminal
- Options like “Press s to switch to development build” and “Press i │ open iOS simulator”

---

## Step 4: Run on your iPhone (Expo Go — quick test)

1. **Unlock your iPhone** and open the **Camera** app (or any QR scanner).
2. **Scan the QR code** shown in the terminal (or in the browser tab Expo opened).
3. When prompted, tap **“Open in Expo Go”** (install Expo Go from the App Store if you haven’t).
4. The app will load in Expo Go with the **CycleLink icon** and splash. You can tap through the placeholder screens (Onboarding → Home → Route → Feedback).

**Troubleshooting:**

- If the phone can’t connect, ensure iPhone and Mac are on the **same Wi‑Fi** and that your network allows device-to-device communication.
- Alternatively, run with tunnel: `npx expo start --tunnel` (requires signing in with Expo when prompted).

---

## Step 5 (optional): Run in iOS Simulator on Mac

If you have **Xcode** installed:

1. With `npx expo start` running, press **`i`** in the terminal to open the iOS Simulator.
2. Or run directly: `npx expo start --ios`

The simulator will show the same app and icon.

---

## Step 6: Development build for a standalone app on iPhone (optional)

If you want an installable build that **doesn’t require Expo Go** and uses the CycleLink icon as the real app icon:

1. **Install EAS CLI** (Expo Application Services):
   ```bash
   npm install -g eas-cli
   ```

2. **Log in to Expo** (create a free account at [expo.dev](https://expo.dev) if needed):
   ```bash
   eas login
   ```

3. **Configure the project** (one-time):
   ```bash
   eas build:configure
   ```
   Choose **All** or **iOS** when asked. This creates `eas.json` in `mobile/`.

4. **Build for iOS (simulator or device)**:
   - For **physical iPhone** (TestFlight or ad-hoc; requires Apple Developer account):
     ```bash
     eas build --platform ios --profile development
     ```
   - For **iOS Simulator** only (no Apple Developer account needed):
     ```bash
     eas build --platform ios --profile development-simulator
     ```
     Then download the `.tar.gz` from the EAS build page and run the app in Xcode’s iOS Simulator.

   For device install you need an **Apple Developer account** linked in EAS; follow the prompts to add credentials.

5. **Install on device**:
   - EAS will give you a link to the build. On your iPhone, open that link and install the app (you may need to trust the developer in **Settings → General → VPN & Device Management**).
   - Or submit to **TestFlight** for internal testers: `eas submit --platform ios --latest`.

---

## Summary: minimal path to “see it on my iPhone”

| Step | Command / action |
|------|-------------------|
| 1 | `cd frontend/mobile` |
| 2 | `npm install` |
| 3 | `npx expo start` |
| 4 | Scan QR code with iPhone Camera → Open in Expo Go |

The app icon and splash in this flow are the CycleLink icon from `design/Icon.png` (copied to `mobile/assets/icon.png`). For a **standalone** install with the icon on the home screen (no Expo Go), use **Step 6** (EAS development build).

---

## Troubleshooting: Expo Go SDK mismatch

If scanning the QR code shows:

**“Project is incompatible with this version of Expo Go — The installed version of Expo Go is for SDK 54.0.0 — The project you opened use SDK52”**

The project has been upgraded to **Expo SDK 54** so it matches Expo Go. From `frontend/mobile` run:

```bash
rm -rf node_modules package-lock.json
npm install
npx expo install --fix
npx expo start
```

Then scan the QR code again with your phone. If you ever need to match an older Expo Go (e.g. SDK 52), set the project back to that SDK in `package.json` and run `npx expo install --fix`.
