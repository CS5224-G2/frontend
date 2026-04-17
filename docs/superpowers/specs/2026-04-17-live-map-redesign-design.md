# Live Map Redesign — Design Spec

**Date:** 2026-04-17  
**Branch:** live-map  
**File scope:** `mobile/src/app/pages/LiveMapMapbox.tsx`

---

## Overview

Three improvements to the live map screen:

1. **Profile picture as rider marker** — replace the generic blue `CircleLayer` dot with the user's profile photo (avatar colour + initials fallback).
2. **Dark mode support** — the map base style and all overlay panels respond to the app's colour scheme.
3. **Liquid glass theme** — all overlay surfaces (stats card, bottom bar, banners, modals) use `GlassView` from `expo-glass-effect`, matching the tab bar and ride history screen.

---

## 1. Rider Marker

### Approach

Replace the existing `ShapeSource`/`CircleLayer` rider marker with a `MarkerView` from `@rnmapbox/maps`. `MarkerView` pins any React Native view to a geographic coordinate; Mapbox handles all projection and keeps it anchored through pan/zoom.

### New component: `RiderMarker`

A standalone component co-located in `LiveMapMapbox.tsx` (or extracted to `components/native/RiderMarker.tsx` if it grows complex).

**Props:**
- `avatarUrl?: string | null` — profile photo URL (passed from `getUserProfile()` result)
- `avatarColor: string` — fallback background colour from profile
- `initials: string` — two-character fallback text

**Visual structure (three concentric layers):**
- Outer halo: large translucent circle, `circleRadius` ~26px, blue at 18–22% opacity
- Mid ring: medium circle, ~19px radius, lighter blue at 55–70% opacity
- Inner avatar circle: 18px radius, white 2.5px border
  - If `avatarUrl` is set: `Image` component with circular clip via `borderRadius`
  - If no `avatarUrl`: `View` with `backgroundColor = avatarColor`, centred `Text` showing `initials`

### Profile data fetching

`LiveMapMapbox.tsx` calls `getUserProfile()` once on mount (same service used by `UserProfilePage`). Store result in local state `profile`. Pass `profile?.avatarUrl`, `profile?.avatarColor`, and derived `initials` to `RiderMarker`.

Initials derivation: same logic as `UserProfilePage` — split `fullName` on spaces, take first char of each part, join, uppercase, slice to 2.

**Failure handling:** if `getUserProfile()` rejects, fall back to a plain blue circle (the current behaviour). The rider position is never blocked by a profile fetch failure.

### MarkerView placement

```tsx
{riderHasFix && riderLngLat ? (
  <MarkerView coordinate={riderLngLat} anchor={{ x: 0.5, y: 0.5 }}>
    <RiderMarker
      avatarUrl={profile?.avatarUrl}
      avatarColor={profile?.avatarColor ?? '#2563eb'}
      initials={initials}
    />
  </MarkerView>
) : null}
```

The existing `riderHalo` and `riderPoint` `ShapeSource`/`CircleLayer` blocks are both removed; the halo and avatar circle are now part of the `RiderMarker` component itself. The `riderHalo` memo and `riderPoint` shape variable in the component can also be deleted.

---

## 2. Dark Mode — Map Base Style

`LiveMapMapbox.tsx` currently uses `StyleURL.Street` unconditionally.

**Change:** read `colorScheme` from `nativewind`'s `useColorScheme()` and pass the appropriate style to `MapView`:

```tsx
const { colorScheme } = useColorScheme();
const isDark = colorScheme === 'dark';
// ...
<MapView styleURL={isDark ? StyleURL.Night : StyleURL.Street} ... />
```

`StyleURL.Night` is the standard Mapbox dark style; no additional tokens or dependencies required.

---

## 3. Glass Overlays

### Pattern

Matches the existing pattern in `RideHistoryPage.tsx` and `navigation.tsx` exactly:

```tsx
const supportsNativeGlass =
  Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
```

Where `supportsNativeGlass` is true, use `GlassView`. Where false, use a plain `View` with a semi-transparent background fallback.

### Surfaces and their styles

| Surface | Light glass tint | Dark glass tint | Fallback light | Fallback dark |
|---|---|---|---|---|
| Stats card | `rgba(255,255,255,0.72)` | `rgba(15,23,42,0.78)` | `rgba(255,255,255,0.92)` | `rgba(15,23,42,0.92)` |
| Bottom bar | `rgba(255,255,255,0.72)` | `rgba(15,23,42,0.78)` | `rgba(255,255,255,0.92)` | `rgba(15,23,42,0.92)` |
| Checkpoint banner | `rgba(220,252,231,0.82)` | `rgba(20,83,45,0.82)` | `#dcfce7` | `#14532d` |
| Warning banner | `rgba(254,243,199,0.82)` | `rgba(120,53,15,0.82)` | `#fef3c7` | `#78350f` |
| Modals | `rgba(255,255,255,0.88)` | `rgba(15,23,42,0.92)` | `#ffffff` | `#0f172a` |

All text colours switch on `isDark`:

- Card titles: `#0f172a` → `#f1f5f9`
- Meta/secondary text: `#64748b` (same both modes)
- Elapsed time value: `#2563eb` → `#3b82f6`
- Distance value: `#16a34a` → `#22c55e`
- Pause button background: `#0f172a` → `rgba(255,255,255,0.12)` with border `rgba(255,255,255,0.1)`

### StyleSheet approach

Keep `StyleSheet.create`. Replace hardcoded colour constants with a `getStyles(isDark)` factory function that returns the style object, called inside the component with the resolved `isDark` boolean. This avoids converting to nativewind (the file has too many dynamic layout values to benefit from it).

---

## 4. File Changes

| File | Change |
|---|---|
| `mobile/src/app/pages/LiveMapMapbox.tsx` | All changes above. Add `useColorScheme`, `getUserProfile`, `Platform`, `GlassView`/glass imports, `MarkerView`. Remove `riderHalo` and `riderPoint` ShapeSource blocks and their memos. Add `RiderMarker` component. Convert `StyleSheet` to `getStyles(isDark)` factory. |
| No other files change | `getProfileAvatarSource` and `getUserProfile` are reused as-is. |

---

## 5. Out of Scope

- `LiveMapExpoGoScreen.tsx` (the Expo Go fallback) — not touched
- Route map preview (`RouteMapPreviewMapbox.tsx`, `RoutePickerMapbox.tsx`) — separate screens, separate work
- Animated pulse on the rider halo — can be added later; not part of this spec
