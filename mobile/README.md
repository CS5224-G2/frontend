
# User Journey

This is an Expo-based React Native mobile application for cycling route recommendation and user journey mapping. The original design is available at <https://www.figma.com/design/XdnwPzGPGYGu3E1bwy2arg/User-Journey>.

## Running the code

### Prerequisites

- Node.js 16+ and npm
- For iOS development: macOS with Xcode
- For Android development: Android Studio or Android SDK

### Setup

Run `npm install` or `npm ci` to install dependencies.

To enable live place search in the route planner, configure OneMap in `mobile/.env`:

```bash
EXPO_PUBLIC_ONEMAP_BASE_URL=https://www.onemap.gov.sg
EXPO_PUBLIC_ONEMAP_API_KEY=your_current_onemap_token
EXPO_PUBLIC_ONEMAP_API_EMAIL=your_onemap_login_email
EXPO_PUBLIC_ONEMAP_API_PASSWORD=your_onemap_login_password
```

The app now reuses the current token when it still works and automatically requests a fresh one when OneMap rejects it. Without a token or refresh credentials, map search will show a configuration error and users can still drop a custom pin manually.

### Development

#### Run on Web (Browser)

```bash
npm run web
```

#### Run on iOS (Simulator)

```bash
npm run ios
```

#### Run on iOS (Physical Device)

> **⚠️ Do NOT use Expo Go (`npm start`) for testing on a physical iPhone.**
> Features like `expo-notifications` and background location do not work in Expo Go.
> Always use a native build.

```bash
# Debug build (with Metro console for logs)
npm run ios -- --device <DEVICE_ID>

# Release build (standalone, no Metro needed)
npm run ios:release -- --device <DEVICE_ID>
```

**Find your device ID:**

```bash
xcrun devicectl list devices
```

**First-time setup on device:**
After installing, go to **Settings → General → VPN & Device Management** → tap the developer team → **Trust**.

**⚠️ Xcode JS Bundle Caching:**
When you only change JS/TS files (no native code), Xcode may skip re-bundling and ship a **stale cached bundle**. Your code changes silently won't appear on the device. Always clean before rebuilding:

```bash
cd ios && xcodebuild clean -workspace CycleLink.xcworkspace -scheme CycleLink -configuration Release && cd ..
npm run ios:release -- --device <DEVICE_ID>
```

To verify your bundle is fresh:

```bash
# Search for a unique string you added in your latest change
grep -c "YOUR_STRING" ~/Library/Developer/Xcode/DerivedData/CycleLink-*/Build/Products/Release-iphoneos/CycleLink.app/main.jsbundle
```

If it returns `0`, the bundle is stale — clean and rebuild.

#### Run on Android

```bash
npm run android
```

#### Interactive Expo Menu

```bash
npm start
# or
expo start
```

### Building

#### Build for Web

```bash
npm run build
```

#### Build for iOS/Android

Use Expo's build service (requires Expo account):

```bash
expo build:ios
expo build:android
```

## Architecture

This application uses:

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Bottom Tabs + Native Stacks)
- **State Management**: AsyncStorage for persistence
- **Styling**: React Native StyleSheet (platform-native styling)
- **Icons**: Expo Vector Icons (Material Community Icons)

## Project Structure

```text
src/
├── app/
│   ├── App.tsx              # Root component
│   ├── navigation.tsx       # Navigation configuration
│   ├── types.ts            # Type definitions
│   ├── components/
│   │   ├── native/         # React Native components
│   │   └── figma/          # Figma integration components
│   └── pages/              # Screen components
├── styles/                 # (Empty - use StyleSheet instead)
index.js                    # Expo entry point
app.json                    # Expo configuration
babel.config.js            # Babel configuration
```

## Migration Notes

This project was migrated from Vite (web) to Expo (React Native). See [EXPO_MIGRATION.md](./EXPO_MIGRATION.md) for detailed migration information including:

- Changes in build system and dependencies
- Component migration examples
- Navigation changes
- Styling migration

## Features

- Route discovery and recommendations
- User preference-based route matching
- Favorite routes management
- Route details and checkpoints
- User profile management
- Ride history tracking
- Live map view
- Route feedback and ratings

## Key Dependencies

- `expo` - Development platform and runtime
- `react-native` - Core mobile framework
- `@react-navigation/*` - Navigation libraries
- `@react-native-async-storage/async-storage` - Data persistence
- `react-native-maps` - Map functionality
- `expo-location` - Location services
- `react-native-paper` - Material Design components

## Testing

This project uses **Jest** and **React Native Testing Library**.

- **Running Tests**: `npm test` from the `mobile` directory.
- **Documentation**: See [TESTING.md](./TESTING.md) for mocking patterns and established examples.

## Available Scripts

- `npm start` - Start Expo development server
- `npm run web` - Run on web (browser)
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run build` - Build for web deployment

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [React Navigation Documentation](https://reactnavigation.org)
- [Original Figma Design](https://www.figma.com/design/XdnwPzGPGYGu3E1bwy2arg/User-Journey)