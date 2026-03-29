
# User Journey

This is an Expo-based React Native mobile application for cycling route recommendation and user journey mapping. The original design is available at <https://www.figma.com/design/XdnwPzGPGYGu3E1bwy2arg/User-Journey>.

## Running the code

### Prerequisites

- Node.js 16+ and npm
- For iOS development: macOS with Xcode
- For Android development: Android Studio or Android SDK

### Setup

Run `npm install` or `npm ci` to install dependencies.

To enable live place search in the route planner, add your OneMap API token to `mobile/.env`:

```bash
EXPO_PUBLIC_ONEMAP_API_KEY=your_onemap_api_token
```

Get your token from the [OneMap API portal](https://www.onemap.gov.sg/apidocs/register). Place search uses this token. Without it, map search will show a configuration error and users can still drop a custom pin manually.

### Development

#### Run on Web (Browser)

```bash
npm run web
```

#### Run on iOS

```bash
npm run ios
```

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