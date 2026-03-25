# Dark Mode Implementation Design

**Date:** 2026-03-25
**Branch:** divide-moble-and-web
**Scope:** Mobile app (`/mobile`) only

## Goal

Add system-wide dark mode to the CycleLink mobile app. Follows the OS color scheme by default, with a manual in-app override. Uses AMOLED (true black) dark palette for battery saving during live route tracking.

---

## 1. Approach

NativeWind v4 `dark:` variants with `colorScheme` API for programmatic override.

- `tailwind.config.js`: add `darkMode: 'class'` — required for manual override via `colorScheme.set()`. (`darkMode: 'media'` throws a runtime error when `setColorScheme` is called.)
- `colorScheme.set()` from `nativewind` controls the active scheme at runtime
- User preference stored in AsyncStorage, restored on launch
- Toggle UI on Profile page (quick) and Privacy & Security page (full)

---

## 2. Color Palette

All dark variants are written inline as `dark:` Tailwind classes — no new config tokens needed.

### Semantic tokens

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

### Hardcoded hex values (appear across multiple pages)

| Value | Used as | Dark mapping |
|---|---|---|
| `#0f172a`, `#1e293b`, `#334155` | Primary text | `dark:text-slate-100` |
| `#475569`, `#64748b`, `#94a3b8` | Secondary / muted text | `dark:text-slate-400` |
| `#F3F4F6` | Page-level ScrollView background | `dark:bg-black` |
| `#F8FAFC` | Input backgrounds (variant of bg-light) | `dark:bg-[#1a1a1a]` |
| `#f1f5f9` | Input/surface background | `dark:bg-[#1a1a1a]` |
| `#DBEAFE` | Info/highlight banners | `dark:bg-[#1e293b]` |
| `#111827` | Apple button background | stays (already dark-safe) |

### Status badge colors (UserProfilePage stat cards)

| Light | Dark |
|---|---|
| `bg-[#DCFCE7]` (green bg) | `dark:bg-[#14532d]` |
| `text-[#166534]` (green text) | `dark:text-[#86efac]` |
| `bg-[#FEF3C7]` (amber bg) | `dark:bg-[#78350f]` |
| `text-[#92400E]` (amber text) | `dark:text-[#fcd34d]` |

Shadow props (`shadowColor`, `elevation`) and animated/computed values stay as `style={}` — not expressible in NativeWind.

---

## 3. Files to Create / Modify

### New
- `mobile/src/app/ThemeContext.tsx`

### Modified
- `mobile/tailwind.config.js` — add `darkMode: 'class'`
- `mobile/src/app/App.tsx` — wrap with `ThemeProvider`; update `StatusBar` style
- `mobile/src/app/navigation.tsx` — pass dark/light theme to `NavigationContainer`
- `mobile/src/app/pages/UserProfilePage.tsx` — add Appearance toggle row + `dark:` variants
- `mobile/src/app/pages/PrivacySecurityPage.tsx` — add segmented Appearance control + `dark:` variants
- All 12 remaining pages — add `dark:` variants
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

**Wiring:** `ThemeProvider` wraps `RootNavigatorWithProvider` in `App.tsx` as an outer wrapper:

```tsx
// App.tsx
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootNavigatorWithProvider />
        <StatusBar ... />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
```

`StatusBar` is inside `ThemeProvider` so it can read `useColorScheme()` from `nativewind` and react to preference changes. `ThemeContext` is accessible from all pages without touching `navigation.tsx` internals.

`colorScheme.set('system')` is a valid argument (confirmed in NativeWind v4 source) — it calls `Appearance.setColorScheme(null)` on iOS 13+ to restore OS-following behaviour.

---

## 5. React Navigation Dark Theme

`navigation.tsx` reads `useColorScheme()` imported from **`nativewind`** (not `react-native`) so it reflects NativeWind's override, not just the OS scheme.

Passes `theme` to `NavigationContainer`:

**Dark theme values:**
- `background`: `#000000`
- `card`: `#111111`
- `text`: `#f1f5f9`
- `border`: `#2d2d2d`
- `primary`: `#3b82f6`
- `notification`: `#3b82f6`

**Light theme:** React Navigation `DefaultTheme` with `primary: '#2563eb'`.

Tab bar in `screenOptions`:
- `tabBarActiveTintColor`: `#3b82f6` (dark) / `#2563eb` (light)
- `tabBarInactiveTintColor`: `#6b7280` (both)
- `tabBarStyle`: `{ backgroundColor: '#111111' }` (dark) / default (light)

---

## 6. Toggle UI

### Profile page — quick toggle row

Added as a new row inside the 'Account settings' card, after the Password row (line ~200 of `UserProfilePage.tsx`), before the closing `</View>` of that card. Separated by a `<View className="h-px bg-border" />` divider.

```
Appearance          [System]
```

A single tappable row. Tapping cycles: `system → light → dark → system`. Displays current label and a chevron. Uses `useTheme()` from `ThemeContext`.

### Privacy & Security page — segmented control

A labelled row with three inline buttons:

```
Appearance
[ System ]  [ Light ]  [ Dark ]
```

Active option: `bg-primary text-white rounded-md`
Inactive option: `bg-bg-light text-text-secondary rounded-md`

Uses `useTheme()` from `ThemeContext`.

---

## 7. Page & Component Conversion Rules

For each page/component, apply these substitutions to every `className`:

1. **Page wrappers** (`SafeAreaView`, outermost `View`): add `dark:bg-black`
2. **Cards / surfaces**: add `dark:bg-[#111111]`
3. **Inputs / form fields**: add `dark:bg-[#1a1a1a] dark:border-[#2d2d2d] dark:text-slate-100`
4. **Body text (primary)**: add `dark:text-slate-100`
5. **Body text (secondary/muted)**: add `dark:text-slate-400`
6. **Dividers / separators**: add `dark:bg-[#2d2d2d]`
7. **Bubble decorations**: add `dark:bg-[#1e293b]` or `dark:bg-[#0f172a]`
8. **Hardcoded hex text colors**: lift semantic `style={{ color: '#...' }}` into `className` + `dark:` using the mapping table in Section 2. Non-semantic values (shadows, icon tints, computed widths) stay in `style`.

9. **Static string arrays** (e.g. `statCards` in `UserProfilePage.tsx`): add `dark:` variants directly into the string literals — Tailwind's scanner finds them because they are static source strings, not runtime-computed values:
```ts
{ bgClassName: 'bg-[#DBEAFE] dark:bg-[#1e293b]', textClassName: 'text-primary-dark dark:text-blue-400' }
{ bgClassName: 'bg-[#DCFCE7] dark:bg-[#14532d]', textClassName: 'text-[#166534] dark:text-[#86efac]' }
{ bgClassName: 'bg-[#FEF3C7] dark:bg-[#78350f]', textClassName: 'text-[#92400E] dark:text-[#fcd34d]' }
```

### Native component color props

`Switch`, `ActivityIndicator`, and similar components use native props (`trackColor`, `thumbColor`, `tintColor`) that cannot be targeted by `dark:` classes. Read the resolved scheme and set conditionally:

```ts
import { useColorScheme } from 'nativewind';
const { colorScheme } = useColorScheme();
const isDark = colorScheme === 'dark';

<Switch
  trackColor={{ false: '#CBD5E1', true: isDark ? '#1D4ED8' : '#93C5FD' }}
  thumbColor={value ? (isDark ? '#60A5FA' : '#1D4ED8') : '#F8FAFC'}
/>
```

---

## 8. StatusBar

`App.tsx` currently uses `<StatusBar style="auto" />`. Change to a dynamic value so the status bar text colour reflects NativeWind's override (not just the OS scheme):

```tsx
import { useColorScheme } from 'nativewind';

const { colorScheme } = useColorScheme();
<StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
```

---

## 9. Out of Scope

- Animated transitions between themes (separate task)
- Per-component custom dark palettes — token-based conversion only
- Web app (`/web-app`) — untouched
- Placeholder pages (LiveMap, UserJourney, RouteConfirmed)
