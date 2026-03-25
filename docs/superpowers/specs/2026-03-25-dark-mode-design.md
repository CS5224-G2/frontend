# Dark Mode Implementation Design

**Date:** 2026-03-25
**Branch:** divide-moble-and-web
**Scope:** Mobile app (`/mobile`) only

## Goal

Add system-wide dark mode to the CycleLink mobile app. Follows the OS color scheme by default, with a manual in-app override. Uses AMOLED (true black) dark palette to conserve battery during live route tracking.

---

## 1. Approach

NativeWind v4 `dark:` variants with `colorScheme` API for programmatic override.

- `tailwind.config.js`: add `darkMode: 'media'`
- `colorScheme.set()` from `nativewind` controls the active scheme at runtime
- User preference stored in AsyncStorage, restored on launch
- Toggle UI on Profile page (quick) and Privacy & Security page (full)

---

## 2. Color Palette

All dark variants are written inline as `dark:` Tailwind classes — no new config tokens needed.

| Context | Light | Dark (AMOLED) |
|---|---|---|
| Page background | `bg-bg-page` (`#eef4ff`) | `dark:bg-black` |
| Card / surface | `bg-bg-base` (`#ffffff`) | `dark:bg-[#111111]` |
| Input background | `bg-bg-light` (`#f8fbff`) | `dark:bg-[#1a1a1a]` |
| Primary text | `text-text-primary` (`#1e293b`) | `dark:text-slate-100` |
| Secondary text | `text-text-secondary` (`#64748b`) | `dark:text-slate-400` |
| Border | `border-border` (`#e2e8f0`) | `dark:border-[#2d2d2d]` |
| Border light | `border-border-light` (`#dbe3f0`) | `dark:border-[#222222]` |
| Primary blue | `bg-primary` / `text-primary` (`#2563eb`) | `dark:bg-blue-500` / `dark:text-blue-400` |
| Bubble top | `bg-bubble-top` (`#d8e6ff`) | `dark:bg-[#1e293b]` |
| Bubble bottom | `bg-bubble-bottom` (`#dbeafe`) | `dark:bg-[#0f172a]` |
| Hardcoded text `#0f172a`, `#1e293b`, `#334155` | — | `dark:text-slate-100` |
| Hardcoded text `#475569`, `#64748b`, `#94a3b8` | — | `dark:text-slate-400` |
| Hardcoded bg `#f1f5f9` | — | `dark:bg-[#1a1a1a]` |
| Hardcoded bg `#111827` (Apple button) | stays | stays (already dark-safe) |

Shadow props (`shadowColor`, `elevation`) and animated/computed values stay as `style={}` — not expressible in NativeWind.

---

## 3. Files to Create / Modify

### New
- `mobile/src/app/ThemeContext.tsx`

### Modified
- `mobile/tailwind.config.js` — add `darkMode: 'media'`
- `mobile/src/app/App.tsx` — wrap with `ThemeProvider`
- `mobile/src/app/navigation.tsx` — pass dark/light theme to `NavigationContainer`
- `mobile/src/app/pages/UserProfilePage.tsx` — add Appearance toggle row
- `mobile/src/app/pages/PrivacySecurityPage.tsx` — add segmented Appearance control
- All 14 remaining pages — add `dark:` variants
- `mobile/src/app/components/native/Common.tsx` — add `dark:` variants
- `mobile/src/app/components/native/FormComponents.tsx` — add `dark:` variants

### Skipped
- `LiveMapPage.tsx`, `UserJourneyPage.tsx`, `RouteConfirmedPage.tsx` — placeholders, no styles

---

## 4. ThemeContext

**File:** `src/app/ThemeContext.tsx`

```ts
type ColorSchemePref = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  preference: ColorSchemePref;
  setPreference: (pref: ColorSchemePref) => void;
}
```

**Behaviour:**
- On mount: reads `AsyncStorage.getItem('colorScheme')`, defaults to `'system'`
- On change: saves to AsyncStorage, calls `colorScheme.set(pref)` from `nativewind`
- `colorScheme.set('system')` restores OS-following behaviour

**Wiring:** `ThemeProvider` wraps `RootNavigator` inside `App.tsx`, alongside `AuthProvider`.

---

## 5. React Navigation Dark Theme

`navigation.tsx` reads `useColorScheme()` from `react-native` (reflects the active resolved scheme after NativeWind's override). Passes `theme` to `NavigationContainer`:

**Dark theme values:**
- `background`: `#000000`
- `card`: `#111111`
- `text`: `#f1f5f9`
- `border`: `#2d2d2d`
- `primary`: `#3b82f6`
- `notification`: `#3b82f6`

**Light theme:** existing React Navigation `DefaultTheme` with `primary: '#2563eb'`.

Tab bar colors in `screenOptions`:
- `tabBarActiveTintColor`: `#3b82f6` (dark) / `#2563eb` (light)
- `tabBarInactiveTintColor`: `#6b7280` (both)
- `tabBarStyle`: `backgroundColor: #111111` (dark) / default (light)

---

## 6. Toggle UI

### Profile page — quick toggle row

Added at the bottom of the existing settings list, above the Sign Out button:

```
Appearance          [System ›]
                    [Light ›]
                    [Dark ›]
```

A single tappable row. Tapping cycles: `system → light → dark → system`. Shows current label and a `›` chevron. Uses `useTheme()`.

### Privacy & Security page — segmented control

A labelled row with three inline buttons:

```
Appearance
[ System ]  [ Light ]  [ Dark ]
```

Active option has `bg-primary text-white`, inactive has `bg-bg-light text-text-secondary`. Uses `useTheme()`.

---

## 7. Page & Component Conversion Rules

For each page/component, apply these substitutions to every `className`:

1. **Page wrappers** (`SafeAreaView`, outermost `View`): add `dark:bg-black`
2. **Cards / surfaces**: add `dark:bg-[#111111]`
3. **Inputs / form fields**: add `dark:bg-[#1a1a1a] dark:border-[#2d2d2d] dark:text-slate-100`
4. **Body text**: add `dark:text-slate-100` (primary) or `dark:text-slate-400` (secondary/muted)
5. **Dividers / separators**: add `dark:bg-[#2d2d2d]`
6. **Bubble decorations**: add `dark:bg-[#1e293b]` or `dark:bg-[#0f172a]`
7. **Hardcoded hex text colors**: replace inline `style={{ color: '#...' }}` with `className` + `dark:` where the hex is a semantic color (not an icon/illustration color)

Inline `style={{ backgroundColor/color: '#...' }}` values that duplicate a semantic color get lifted into `className` so dark mode applies. Non-semantic values (shadows, computed widths, brand icon colours) stay in `style`.

---

## 8. Out of Scope

- Animations / transitions between themes (separate task)
- Per-component custom dark palettes — strict token-based conversion only
- Web app (`/web-app`) — untouched
- Placeholder pages (LiveMap, UserJourney, RouteConfirmed)
