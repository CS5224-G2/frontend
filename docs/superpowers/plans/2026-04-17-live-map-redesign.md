# Live Map Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the live map's generic rider dot with the user's profile picture, add full dark mode support (Mapbox Night style + dark glass overlays), and apply the app's liquid glass theme to all overlay surfaces.

**Architecture:** A new `RiderMarker` component (extracted to `components/native/RiderMarker.tsx`) is pinned to the rider's GPS coordinate via `MarkerView` from `@rnmapbox/maps`. `LiveMapMapbox.tsx` fetches the user profile once on mount to supply avatar data, reads `colorScheme` from nativewind to toggle `StyleURL.Night`, and wraps all overlay surfaces in `GlassView` from `expo-glass-effect` (with a plain `View` fallback). The `StyleSheet` is converted to a `getStyles(isDark)` factory.

**Tech Stack:** React Native, `@rnmapbox/maps` (`MarkerView`), `expo-glass-effect` (`GlassView`, `isLiquidGlassAvailable`, `isGlassEffectAPIAvailable`), nativewind (`useColorScheme`), existing `getUserProfile` service, existing `getProfileAvatarSource` utility.

---

## File Map

| File | Action |
|---|---|
| `mobile/__mocks__/rnmapbox-maps.js` | Add `StyleURL.Night` to mock |
| `mobile/src/app/components/native/RiderMarker.tsx` | **Create** — new component |
| `mobile/src/app/components/native/RiderMarker.test.tsx` | **Create** — unit tests for RiderMarker |
| `mobile/src/app/pages/LiveMapPage.test.tsx` | Modify — add glass, nativewind, userService mocks |
| `mobile/src/app/pages/LiveMapMapbox.tsx` | Modify — all implementation changes |

---

## Task 1: Extend the Mapbox mock with `StyleURL.Night`

**Files:**
- Modify: `mobile/__mocks__/rnmapbox-maps.js`

- [ ] **Step 1: Update the StyleURL object**

Open `mobile/__mocks__/rnmapbox-maps.js`. Change the `StyleURL` line from:

```js
StyleURL: { Street: 'mapbox://styles/mapbox/streets-v11' },
```

to:

```js
StyleURL: {
  Street: 'mapbox://styles/mapbox/streets-v11',
  Night: 'mapbox://styles/mapbox/navigation-night-v1',
},
```

- [ ] **Step 2: Verify existing tests still pass**

```bash
cd mobile && npx jest --watchman=false --testPathPattern="LiveMapPage" --no-coverage
```

Expected: all 3 existing tests pass (green).

- [ ] **Step 3: Commit**

```bash
git add mobile/__mocks__/rnmapbox-maps.js
git commit -m "test: add StyleURL.Night to rnmapbox-maps mock"
```

---

## Task 2: Add missing mocks to `LiveMapPage.test.tsx`

The test file currently lacks mocks for `nativewind`, `expo-glass-effect`, and `userService`. These are needed before any new tests can run.

**Files:**
- Modify: `mobile/src/app/pages/LiveMapPage.test.tsx`

- [ ] **Step 1: Add the three mocks after the existing `jest.mock('react-native-safe-area-context', ...)` block**

```tsx
jest.mock('nativewind', () => ({
  useColorScheme: () => ({ colorScheme: 'light' }),
}));

jest.mock('expo-glass-effect', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GlassView: ({ children, ...props }: any) =>
      React.createElement(View, { ...props, testID: props.testID ?? 'glass-view' }, children),
    isLiquidGlassAvailable: () => false,
    isGlassEffectAPIAvailable: () => false,
  };
});

jest.mock('../../services/userService', () => ({
  getUserProfile: jest.fn().mockResolvedValue({
    userId: 'rider_1024',
    fullName: 'Alex Johnson',
    email: 'alex@example.com',
    location: 'Singapore',
    memberSince: 'January 2025',
    cyclingPreference: 'Leisure',
    weeklyGoalKm: 80,
    bio: 'Weekend rider.',
    avatarUrl: null,
    avatarColor: '#7c3aed',
    stats: { totalRides: 5, totalDistanceKm: 42.0, favoriteTrails: 2 },
  }),
}));
```

- [ ] **Step 2: Verify existing tests still pass**

```bash
cd mobile && npx jest --watchman=false --testPathPattern="LiveMapPage" --no-coverage
```

Expected: all 3 existing tests still pass.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/app/pages/LiveMapPage.test.tsx
git commit -m "test: add nativewind, glass-effect, userService mocks to LiveMapPage tests"
```

---

## Task 3: `RiderMarker` component (TDD)

**Files:**
- Create: `mobile/src/app/components/native/RiderMarker.test.tsx`
- Create: `mobile/src/app/components/native/RiderMarker.tsx`

- [ ] **Step 1: Write the failing tests**

Create `mobile/src/app/components/native/RiderMarker.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RiderMarker from './RiderMarker';

jest.mock('../../../app/utils/profileAvatar', () => ({
  getProfileAvatarSource: (url: string | null | undefined) =>
    url ? { uri: url } : null,
}));

describe('RiderMarker', () => {
  it('renders an Image when avatarUrl is provided', () => {
    render(
      <RiderMarker
        avatarUrl="https://example.com/photo.jpg"
        avatarColor="#7c3aed"
        initials="AJ"
      />
    );
    expect(screen.getByTestId('rider-marker-image')).toBeTruthy();
    expect(screen.queryByTestId('rider-marker-initials')).toBeNull();
  });

  it('renders initials text when avatarUrl is null', () => {
    render(
      <RiderMarker
        avatarUrl={null}
        avatarColor="#7c3aed"
        initials="AJ"
      />
    );
    expect(screen.getByTestId('rider-marker-initials')).toBeTruthy();
    expect(screen.queryByTestId('rider-marker-image')).toBeNull();
  });

  it('applies avatarColor as background when showing initials', () => {
    render(
      <RiderMarker
        avatarUrl={null}
        avatarColor="#7c3aed"
        initials="AJ"
      />
    );
    const fallback = screen.getByTestId('rider-marker-fallback');
    expect(fallback.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#7c3aed' }),
      ])
    );
  });

  it('renders the initials text value', () => {
    render(
      <RiderMarker
        avatarUrl={null}
        avatarColor="#1D4ED8"
        initials="TK"
      />
    );
    expect(screen.getByText('TK')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
cd mobile && npx jest --watchman=false --testPathPattern="RiderMarker" --no-coverage
```

Expected: FAIL — `Cannot find module './RiderMarker'`

- [ ] **Step 3: Implement `RiderMarker`**

Create `mobile/src/app/components/native/RiderMarker.tsx`:

```tsx
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getProfileAvatarSource } from '../../utils/profileAvatar';

interface RiderMarkerProps {
  avatarUrl?: string | null;
  avatarColor: string;
  initials: string;
}

export default function RiderMarker({ avatarUrl, avatarColor, initials }: RiderMarkerProps) {
  const source = avatarUrl ? getProfileAvatarSource(avatarUrl) : null;

  return (
    <View style={styles.container}>
      <View style={styles.halo} />
      <View style={styles.midRing} />
      <View style={styles.avatar}>
        {source ? (
          <Image
            source={source}
            style={styles.avatarImage}
            testID="rider-marker-image"
          />
        ) : (
          <View
            style={[styles.avatarFallback, { backgroundColor: avatarColor }]}
            testID="rider-marker-fallback"
          >
            <Text style={styles.initialsText} testID="rider-marker-initials">
              {initials}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(37,99,235,0.18)',
  },
  midRing: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(147,197,253,0.65)',
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: '#ffffff',
    overflow: 'hidden',
    zIndex: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
cd mobile && npx jest --watchman=false --testPathPattern="RiderMarker" --no-coverage
```

Expected: 4 tests pass (green).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/app/components/native/RiderMarker.tsx \
        mobile/src/app/components/native/RiderMarker.test.tsx
git commit -m "feat: add RiderMarker component with avatar photo and initials fallback"
```

---

## Task 4: Profile fetching in `LiveMapMapbox.tsx`

**Files:**
- Modify: `mobile/src/app/pages/LiveMapMapbox.tsx`
- Modify: `mobile/src/app/pages/LiveMapPage.test.tsx`

- [ ] **Step 1: Write the failing test**

Add this test inside the `describe('LiveMapPage', ...)` block in `mobile/src/app/pages/LiveMapPage.test.tsx`:

```tsx
import * as userService from '../../services/userService';

// (add inside describe block)
it('fetches user profile on mount', async () => {
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN = 'pk.test_jest_token';

  render(<LiveMapScreen />);

  await waitFor(() => {
    expect(userService.getUserProfile).toHaveBeenCalledTimes(1);
  });

  delete process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
});
```

- [ ] **Step 2: Run to confirm it fails**

```bash
cd mobile && npx jest --watchman=false --testPathPattern="LiveMapPage" --no-coverage
```

Expected: FAIL — `getUserProfile` not called (function not imported in the component yet).

- [ ] **Step 3: Add profile fetching to `LiveMapMapbox.tsx`**

At the top of the file, add to imports:

```tsx
import { getUserProfile, type UserProfile } from '../../../../shared/../services/userService';
```

The correct relative path from `mobile/src/app/pages/LiveMapMapbox.tsx` to the service is:
```tsx
import { getUserProfile, type UserProfile } from '../../services/userService';
```

After the existing `useEffect` for `setAccessToken`, add:

```tsx
const [profile, setProfile] = useState<UserProfile | null>(null);

useEffect(() => {
  getUserProfile()
    .then(setProfile)
    .catch(() => {
      // Failure is non-fatal — rider marker falls back to plain blue circle
    });
}, []);

const initials = profile?.fullName
  ? profile.fullName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  : '';
```

Also add `useState` to the React import if it's not already there. The file currently uses `useMemo` and `useEffect` — check the first line and add `useState` to the destructured import.

- [ ] **Step 4: Run to confirm the test passes**

```bash
cd mobile && npx jest --watchman=false --testPathPattern="LiveMapPage" --no-coverage
```

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/app/pages/LiveMapMapbox.tsx \
        mobile/src/app/pages/LiveMapPage.test.tsx
git commit -m "feat: fetch user profile on live map mount for rider marker data"
```

---

## Task 5: Replace rider `ShapeSource` blocks with `MarkerView + RiderMarker`

**Files:**
- Modify: `mobile/src/app/pages/LiveMapMapbox.tsx`
- Modify: `mobile/src/app/pages/LiveMapPage.test.tsx`

- [ ] **Step 1: Write a failing test for the rider marker**

Add to the `describe` block in `LiveMapPage.test.tsx`:

```tsx
it('renders rider marker when token is set', async () => {
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN = 'pk.test_jest_token';

  render(<LiveMapScreen />);

  await waitFor(() => {
    expect(screen.getByTestId('rider-marker-container')).toBeTruthy();
  });

  delete process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
});
```

- [ ] **Step 2: Run to confirm it fails**

```bash
cd mobile && npx jest --watchman=false --testPathPattern="LiveMapPage" --no-coverage
```

Expected: FAIL — `Unable to find an element with testID: rider-marker-container`

- [ ] **Step 3: Add the import and remove the old rider layers**

At the top of `LiveMapMapbox.tsx`, add to the `@rnmapbox/maps` import:

```tsx
import {
  Camera,
  CircleLayer,
  Images,
  LineLayer,
  MapView,
  MarkerView,       // ← add
  ShapeSource,
  StyleURL,
  SymbolLayer,
  setAccessToken,
} from '@rnmapbox/maps';
```

Add the `RiderMarker` import below the other local imports:

```tsx
import RiderMarker from '../components/native/RiderMarker';
```

Delete the `riderHalo` memo (lines ~101-104):

```tsx
// DELETE this block:
const riderHalo = useMemo(
  () => (riderHasFix && riderLngLat ? liveMapRiderHaloFeature(riderLngLat) : null),
  [riderLngLat, riderHasFix],
);
```

Also remove `liveMapRiderHaloFeature` from the `@/utils/liveMapGeojson` import since it's no longer used.

- [ ] **Step 4: Replace the rider JSX inside `<MapView>`**

Find and delete the existing rider ShapeSource blocks (currently at the bottom of the `<MapView>` children, after `foodPoiGeo`):

```tsx
// DELETE this entire block:
{riderHalo ? (
  <>
    <ShapeSource id="riderHalo" shape={riderHalo}>
      <CircleLayer id="riderHaloLayer" style={{ circleRadius: 22, circleColor: '#2563eb', circleOpacity: 0.22 }} />
    </ShapeSource>
    <ShapeSource id="riderPoint" shape={riderPoint}>
      <CircleLayer id="riderCircleOuter" style={{ circleRadius: 14, circleColor: '#93c5fd', circleOpacity: 0.9 }} />
      <CircleLayer
        id="riderCircle"
        style={{ circleRadius: 9, circleColor: '#1d4ed8', circleStrokeWidth: 3, circleStrokeColor: '#ffffff' }}
      />
    </ShapeSource>
  </>
) : null}
```

Replace with:

```tsx
{riderHasFix && riderLngLat ? (
  <MarkerView coordinate={riderLngLat} anchor={{ x: 0.5, y: 0.5 }}>
    <View testID="rider-marker-container">
      <RiderMarker
        avatarUrl={profile?.avatarUrl}
        avatarColor={profile?.avatarColor ?? '#2563eb'}
        initials={initials}
      />
    </View>
  </MarkerView>
) : null}
```

Also remove `riderPoint,` from the `useLiveMapRideState` destructure at the top of the component (it was used only by the deleted ShapeSource). The destructure currently includes:

```tsx
riderPoint,
riderLngLat,
```

Remove the `riderPoint,` line — `riderLngLat` is still needed for the `MarkerView` coordinate and `navBounds` calculation.

- [ ] **Step 5: Run all LiveMapPage tests**

```bash
cd mobile && npx jest --watchman=false --testPathPattern="LiveMapPage" --no-coverage
```

Expected: all 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/app/pages/LiveMapMapbox.tsx \
        mobile/src/app/pages/LiveMapPage.test.tsx
git commit -m "feat: replace rider CircleLayer with MarkerView showing profile picture"
```

---

## Task 6: Dark mode map style

**Files:**
- Modify: `mobile/src/app/pages/LiveMapMapbox.tsx`
- Modify: `mobile/src/app/pages/LiveMapPage.test.tsx`

- [ ] **Step 1: Write a smoke test for dark mode rendering**

Add to the `describe` block in `LiveMapPage.test.tsx`. This test re-mocks nativewind to return `dark` for one render:

```tsx
it('renders map view in dark mode without crashing', async () => {
  jest.resetModules();
  jest.doMock('nativewind', () => ({
    useColorScheme: () => ({ colorScheme: 'dark' }),
  }));

  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN = 'pk.test_jest_token';

  // Re-import after mock reset
  const { default: LiveMapScreenDark } = await import('./LiveMapPage');
  render(<LiveMapScreenDark />);

  await waitFor(() => {
    expect(screen.getByTestId('live-map-mapview')).toBeTruthy();
  });

  delete process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
  jest.resetModules();
});
```

- [ ] **Step 2: Run to confirm the test passes even before implementation (smoke test)**

```bash
cd mobile && npx jest --watchman=false --testPathPattern="LiveMapPage" --no-coverage
```

Expected: passes (map still renders even without the dark style toggle since `StyleURL.Night` is now in the mock).

- [ ] **Step 3: Add `useColorScheme` and the dark style toggle to `LiveMapMapbox.tsx`**

Add import at the top of the file:

```tsx
import { useColorScheme } from 'nativewind';
```

At the top of the `LiveMapMapboxScreen` function body (after the route params), add:

```tsx
const { colorScheme } = useColorScheme();
const isDark = colorScheme === 'dark';
```

Change the `MapView` `styleURL` prop from:

```tsx
styleURL={StyleURL.Street}
```

to:

```tsx
styleURL={isDark ? StyleURL.Night : StyleURL.Street}
```

- [ ] **Step 4: Run all LiveMapPage tests**

```bash
cd mobile && npx jest --watchman=false --testPathPattern="LiveMapPage" --no-coverage
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/app/pages/LiveMapMapbox.tsx \
        mobile/src/app/pages/LiveMapPage.test.tsx
git commit -m "feat: switch live map to Mapbox Night style in dark mode"
```

---

## Task 7: Glass overlays and `getStyles(isDark)` factory

**Files:**
- Modify: `mobile/src/app/pages/LiveMapMapbox.tsx`

This is the largest single change. It converts all overlay surfaces to `GlassView` and makes the entire `StyleSheet` theme-aware.

- [ ] **Step 1: Run existing tests to establish baseline**

```bash
cd mobile && npx jest --watchman=false --testPathPattern="LiveMapPage" --no-coverage
```

Expected: all 6 tests pass. Note output — these must still pass after Task 7.

- [ ] **Step 2: Add glass imports to `LiveMapMapbox.tsx`**

Add to the top of the file:

```tsx
import { Platform } from 'react-native';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
```

`Platform` may already be imported — check and add only what's missing.

Immediately after the imports (before the component function), add the glass capability check:

```tsx
const supportsNativeGlass =
  Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
```

- [ ] **Step 3: Replace the `StyleSheet.create` block at the bottom of the file**

Delete the entire existing `const styles = StyleSheet.create({ ... });` block and replace it with this factory function:

```tsx
function getStyles(isDark: boolean) {
  return StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    },
    root: { flex: 1, backgroundColor: isDark ? '#0f172a' : '#e2e8f0' },
    mapFallback: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? '#1e293b' : '#dbeafe',
      justifyContent: 'center',
      padding: 24,
    },
    fallbackTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: isDark ? '#93c5fd' : '#1e3a8a',
      marginBottom: 8,
    },
    fallbackBody: { fontSize: 14, color: isDark ? '#60a5fa' : '#1e40af', lineHeight: 20 },
    topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
    statsCard: {
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.12,
      shadowRadius: 8,
      elevation: 6,
    },
    statsCardInner: { padding: 14 },
    statsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    statsTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#f1f5f9' : '#0f172a',
      marginRight: 8,
    },
    statsPct: { fontSize: 13, color: '#64748b', fontWeight: '600' },
    progressTrack: {
      height: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: isDark ? '#3b82f6' : '#2563eb', borderRadius: 3 },
    statsFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    statsMeta: { fontSize: 12, color: '#64748b' },
    startEndRow: { marginTop: 10, gap: 6 },
    startEndItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    routeDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#ffffff' },
    routeDotStart: { backgroundColor: isDark ? '#22c55e' : '#16a34a' },
    routeDotEnd: { backgroundColor: isDark ? '#f87171' : '#dc2626' },
    startEndLabel: { flex: 1, fontSize: 11, color: isDark ? '#94a3b8' : '#475569', fontWeight: '600' },
    banner: {
      marginHorizontal: 16,
      marginTop: 10,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? '#166534' : '#86efac',
    },
    bannerInner: { padding: 12 },
    bannerTitle: { fontWeight: '800', color: isDark ? '#bbf7d0' : '#166534', marginBottom: 4 },
    bannerBody: { fontSize: 13, color: isDark ? '#86efac' : '#15803d' },
    warnBanner: {
      marginHorizontal: 16,
      marginTop: 10,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? '#92400e' : '#fcd34d',
    },
    warnBannerInner: { padding: 12 },
    warnTitle: { fontWeight: '800', color: isDark ? '#fde68a' : '#92400e', marginBottom: 4 },
    warnBody: { fontSize: 13, color: isDark ? '#fcd34d' : '#a16207', lineHeight: 18 },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      overflow: 'hidden',
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    },
    bottomInner: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
    bottomGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    bottomLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
    bottomValueBlue: { fontSize: 22, fontWeight: '800', color: isDark ? '#3b82f6' : '#2563eb' },
    bottomValueGreen: { fontSize: 22, fontWeight: '800', color: isDark ? '#22c55e' : '#16a34a' },
    stopBtn: { backgroundColor: '#dc2626', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    pauseBtn: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#0f172a',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent',
    },
    resumeBtn: { backgroundColor: isDark ? '#15803d' : '#16a34a' },
    pauseBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
    stopBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
    missing: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    },
    missingText: { fontSize: 16, color: isDark ? '#94a3b8' : '#475569', marginBottom: 16 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    modalCard: {
      borderRadius: 20,
      overflow: 'hidden',
      width: '100%',
      maxWidth: 360,
    },
    modalCardInner: { padding: 24 },
    modalCelebration: { alignItems: 'center', marginBottom: 12 },
    modalTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: isDark ? '#f1f5f9' : '#0f172a',
      marginBottom: 8,
    },
    modalSub: { fontSize: 14, color: '#64748b', marginBottom: 16, lineHeight: 20 },
    modalMeta: { fontSize: 14, color: isDark ? '#94a3b8' : '#334155', marginBottom: 4 },
    primaryBtn: {
      backgroundColor: isDark ? '#3b82f6' : '#2563eb',
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
      alignItems: 'center',
      flex: 1,
    },
    primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
    modalActions: { gap: 10, marginTop: 8 },
    secondaryBtn: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    secondaryBtnText: { fontWeight: '700', color: isDark ? '#f1f5f9' : '#0f172a' },
    dangerBtn: { backgroundColor: '#dc2626', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    dangerBtnText: { color: '#ffffff', fontWeight: '800' },
  });
}
```

- [ ] **Step 4: Call the factory inside the component**

At the top of the `LiveMapMapboxScreen` function body (right after `const isDark = colorScheme === 'dark';`), add:

```tsx
const styles = getStyles(isDark);
```

- [ ] **Step 5: Add a `GlassSurface` helper inside the component file**

Add this helper function immediately above `LiveMapMapboxScreen` (after the `supportsNativeGlass` constant):

```tsx
function GlassSurface({
  isDark,
  tintLight,
  tintDark,
  fallbackLight,
  fallbackDark,
  style,
  children,
}: {
  isDark: boolean;
  tintLight: string;
  tintDark: string;
  fallbackLight: string;
  fallbackDark: string;
  style?: any;
  children?: React.ReactNode;
}) {
  const tintColor = isDark ? tintDark : tintLight;
  const fallbackBg = isDark ? fallbackDark : fallbackLight;

  if (!supportsNativeGlass) {
    return (
      <View style={[style, { backgroundColor: fallbackBg }]}>
        {children}
      </View>
    );
  }

  return (
    <GlassView
      style={style}
      glassEffectStyle="clear"
      colorScheme={isDark ? 'dark' : 'light'}
      tintColor={tintColor}
    >
      {children}
    </GlassView>
  );
}
```

- [ ] **Step 6: Update the stats card JSX**

Find the stats card `<View style={styles.statsCard}>` block. Wrap it with `GlassSurface`:

```tsx
<GlassSurface
  isDark={isDark}
  tintLight="rgba(255,255,255,0.72)"
  tintDark="rgba(15,23,42,0.78)"
  fallbackLight="rgba(255,255,255,0.92)"
  fallbackDark="rgba(15,23,42,0.92)"
  style={styles.statsCard}
>
  <View style={styles.statsCardInner} testID="live-map-stats-card">
    {/* existing content unchanged, just move testID here */}
  </View>
</GlassSurface>
```

- [ ] **Step 7: Update the bottom bar JSX**

Find `<SafeAreaView style={styles.bottomBar} edges={['bottom']}>`. The `bottomBar` style now has `overflow: 'hidden'`. Wrap the inner content with `GlassSurface`:

```tsx
<SafeAreaView style={styles.bottomBar} edges={['bottom']}>
  <GlassSurface
    isDark={isDark}
    tintLight="rgba(255,255,255,0.72)"
    tintDark="rgba(15,23,42,0.78)"
    fallbackLight="rgba(255,255,255,0.92)"
    fallbackDark="rgba(15,23,42,0.92)"
    style={StyleSheet.absoluteFill}
  />
  <View style={[styles.bottomInner, { paddingBottom: 16 + bottomTabLift }]}>
    {/* existing content unchanged */}
  </View>
</SafeAreaView>
```

- [ ] **Step 8: Update the checkpoint banner JSX**

Replace `<View style={styles.banner}>` with:

```tsx
<GlassSurface
  isDark={isDark}
  tintLight="rgba(220,252,231,0.82)"
  tintDark="rgba(20,83,45,0.82)"
  fallbackLight="#dcfce7"
  fallbackDark="#14532d"
  style={styles.banner}
>
  <View style={styles.bannerInner} testID="live-map-checkpoint-banner">
    <Text style={styles.bannerTitle}>Checkpoint reached!</Text>
    <Text style={styles.bannerBody}>{checkpointBanner}</Text>
  </View>
</GlassSurface>
```

- [ ] **Step 9: Update the warning banners JSX**

Replace both `<View style={styles.warnBanner}>` occurrences (location denied and off-route):

```tsx
{/* Location denied */}
<GlassSurface
  isDark={isDark}
  tintLight="rgba(254,243,199,0.82)"
  tintDark="rgba(120,53,15,0.82)"
  fallbackLight="#fef3c7"
  fallbackDark="#78350f"
  style={styles.warnBanner}
>
  <View style={styles.warnBannerInner} testID="live-map-location-denied">
    <Text style={styles.warnTitle}>Location off</Text>
    <Text style={styles.warnBody}>Enable location permission to see your position and progress on the route.</Text>
  </View>
</GlassSurface>

{/* Off-route */}
<GlassSurface
  isDark={isDark}
  tintLight="rgba(254,243,199,0.82)"
  tintDark="rgba(120,53,15,0.82)"
  fallbackLight="#fef3c7"
  fallbackDark="#78350f"
  style={styles.warnBanner}
>
  <View style={styles.warnBannerInner} testID="live-map-off-route">
    <Text style={styles.warnTitle}>Off route</Text>
    <Text style={styles.warnBody}>You are far from the planned route. Head back toward the blue line when safe.</Text>
  </View>
</GlassSurface>
```

- [ ] **Step 10: Update both modal cards**

Replace `<View style={styles.modalCard}>` in both modals (completion and exit) with:

```tsx
<GlassSurface
  isDark={isDark}
  tintLight="rgba(255,255,255,0.88)"
  tintDark="rgba(15,23,42,0.92)"
  fallbackLight="#ffffff"
  fallbackDark="#0f172a"
  style={styles.modalCard}
>
  <View style={styles.modalCardInner}>
    {/* existing modal content unchanged */}
  </View>
</GlassSurface>
```

- [ ] **Step 11: Run all LiveMapPage tests**

```bash
cd mobile && npx jest --watchman=false --testPathPattern="LiveMapPage" --no-coverage
```

Expected: all 6 tests pass.

- [ ] **Step 12: Run the full test suite to check for regressions**

```bash
cd mobile && npx jest --watchman=false --no-coverage
```

Expected: no new failures.

- [ ] **Step 13: Commit**

```bash
git add mobile/src/app/pages/LiveMapMapbox.tsx
git commit -m "feat: apply liquid glass theme and full dark mode to live map overlays"
```

---

## Done

After all tasks are committed, the live map screen will:
- Show the user's profile photo as their GPS position marker (with avatar colour + initials fallback)
- Switch the Mapbox base map to Night style in dark mode
- Render all overlay panels (stats card, bottom bar, banners, modals) with the liquid glass effect matching the rest of the app
