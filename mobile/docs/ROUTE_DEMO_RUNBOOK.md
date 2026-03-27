# Route Flow Demo Runbook (Expo)

This runbook shows how to run and demo the mobile route flow end-to-end:

1. `RouteConfigPage`
2. `RouteConfirmedPage`
3. `LiveMapPage` (Mapbox)

---

## 1) Prerequisites

- Node.js + npm installed
- Expo CLI available via `npx expo ...`
- Mobile device with Expo Go installed
- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` set in `mobile/.env`

Example `.env` entries:

```env
EXPO_PUBLIC_API_BASE_URL=https://api.cyclelink.example.com
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.xxxxx
EXPO_PUBLIC_USE_MOCKS=false
EXPO_PUBLIC_API_LOGGING=false
```

> `EXPO_PUBLIC_*` variables are loaded into the app at bundle time. Restart Expo after changes.

---

## 2) Install and start Expo

From project root:

```bash
cd "Group Project/frontend/mobile"
npm install
npx expo start --clear
```

If QR scan is slow or stuck on hotspot/LAN:

```bash
npx expo start --tunnel --clear
```

Then scan the QR code from Expo terminal using Expo Go.

---

## 3) Log in and reach Home

When app opens:

1. Go through login screen (mock login is fine for demo)
2. Complete onboarding if prompted
3. Ensure you land on Home tab

---

## 4) Demo flow script (exact clicks)

### A. Route Config

1. On Home, tap **Create Custom Route**
2. On Route Config page:
   - Update **Start Point**
   - Update **End Point**
   - Change **Cyclist Type**
   - Adjust sliders (shade/elevation/distance/air quality)
3. Tap **Find Routes**

Expected:
- Navigates to Route Recommendation list
- Preferences are persisted (going back to config shows saved values)

### B. Route Confirmed

1. On Route Recommendation list, tap one route card
2. On Route Details, tap **Confirm route**
3. On Route Confirmed page:
   - Verify route summary (distance/time/checkpoints)
   - Optionally tap **View Route on Google / Apple Maps**
4. Tap **Start Cycling Now**

Expected:
- Navigates to Live Map page

### C. Live Map (Mapbox)

1. Live Map opens
2. Verify top progress card and moving progress
3. Verify bottom stats (elapsed time, distance)
4. Verify checkpoint toast/banner appears during progress
5. Tap **Stop Cycling**

Expected:
- If route completed: feedback flow appears
- If not completed: exit confirmation modal appears

---

## 5) Verification checklist (QA)

Use this checklist during demo:

- [ ] Route Config renders with all controls
- [ ] Start/end points editable
- [ ] Cyclist type selection toggles correctly
- [ ] All 4 sliders update displayed values
- [ ] Find Routes navigates to recommendation list
- [ ] Route list is visible and selectable
- [ ] Route Details shows selected route info
- [ ] Confirm route navigates to Route Confirmed
- [ ] Route Confirmed shows summary values
- [ ] Start Cycling Now opens Live Map
- [ ] Live Map shows map (with valid Mapbox token + supported build)
- [ ] Progress/time/distance update on screen
- [ ] Stop Cycling opens correct modal/feedback transition

---

## 6) Troubleshooting

### QR scan opens but app stalls

- Restart Expo with `--tunnel`
- Disable VPN on laptop and phone
- Keep both devices on same network path

### Live Map shows token-required fallback

- Confirm `.env` has `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`
- Restart Expo with `npx expo start --clear`
- Reopen app from QR

### Live Map does not render in Expo Go

`@rnmapbox/maps` may require a development build on some setups.

Use:

```bash
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

Then run the same demo flow in the dev build.

---

## 7) Optional confidence checks before demo

```bash
cd "Group Project/frontend/mobile"
npm test -- --watchman=false --no-watch --runInBand
npx tsc --noEmit
```

If both pass, your route flow code and types are in a good state for demo.
