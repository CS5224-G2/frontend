
# User Journey

This is an Expo-based React Native mobile application for cycling route recommendation and user journey mapping. The original design is available at https://www.figma.com/design/XdnwPzGPGYGu3E1bwy2arg/User-Journey.

## Running the code

### Prerequisites
- Node.js 16+ and npm
- For iOS development: macOS with Xcode
- For Android development: Android Studio or Android SDK

### Setup

Run `npm install` or `npm ci` to install dependencies.

Create a `.env` from `.env.example` when needed:
- `EXPO_PUBLIC_API_BASE_URL` — backend API (when available)
- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` — live Mapbox map on **RouteConfirmed → LiveMap** (development build; see **[docs/TESTING.md](docs/TESTING.md)**)

### Development

**Run on Web (Browser)**
```bash
npm run web
```

**Run on iOS**
```bash
npm run ios
```

**Run on Android**
```bash
npm run android
```

**Interactive Expo Menu**
```bash
npm start
# or
expo start
```

Full-device notes (QR / EAS): **[../docs/TEST_DEPLOY.md](../docs/TEST_DEPLOY.md)** when applicable.

### Building

**Build for Web**
```bash
npm run build
```

**Build for iOS/Android**
Use Expo Application Services (EAS) or `expo run:ios` / `expo run:android` after `expo prebuild` for native modules (Mapbox, maps, location).

## Architecture

This application uses:
- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Bottom Tabs + Native Stacks); entry is **`index.js` → `src/app/App.tsx`**
- **State Management**: AsyncStorage for persistence
- **Styling**: React Native StyleSheet (platform-native styling)
- **Icons**: `@expo/vector-icons` / Lucide

## Project Structure

```
src/
├── app/
│   ├── App.tsx              # Root component
│   ├── navigation.tsx       # Navigation configuration
│   ├── types.ts             # Types + mock routes (+ getRouteById)
│   ├── components/
│   │   ├── native/          # React Native components
│   │   └── figma/           # Figma integration components
│   └── pages/               # Screen components (RouteConfig, RouteConfirmed, LiveMap, …)
├── constants/               # e.g. route storage keys
├── services/                # maps URL helpers (maps.ts)
├── utils/                   # route geometry (Mapbox polyline)
├── styles/
index.js                     # Expo entry (registerRootComponent)
app.json                     # Expo configuration
babel.config.js              # Babel configuration
docs/TESTING.md              # Jest, Maestro, Mapbox QC
.maestro/                    # Maestro flows (optional)
```

## Migration Notes

This project was migrated from Vite (web) to Expo (React Native). See [EXPO_MIGRATION.md](./EXPO_MIGRATION.md) for detailed migration information.

## Features

- Route discovery and recommendations
- User preference-based route matching (**RouteConfig** tab stack)
- Route details → **RouteConfirmed** → **LiveMap** (Mapbox) → feedback
- User profile, ride history, onboarding

## Key Dependencies

- `expo` — development platform and runtime
- `react-native` — core mobile framework
- `@react-navigation/*` — navigation
- `@rnmapbox/maps` — live ride map
- `@react-native-async-storage/async-storage` — persistence
- `react-native-maps` — additional map use cases where applicable
- `expo-location` — location services
- `react-native-paper` — Material Design components

## Available Scripts

- `npm start` — start Expo development server
- `npm run web` — run on web (browser)
- `npm run ios` — run on iOS simulator
- `npm run android` — run on Android emulator
- `npm run build` — build for web deployment
- `npm test` / `npm run test:ci` — Jest (see `docs/TESTING.md`)

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [React Navigation Documentation](https://reactnavigation.org)
- [Original Figma Design](https://www.figma.com/design/XdnwPzGPGYGu3E1bwy2arg/User-Journey)
