# NativeWind v4 Migration Design

**Date:** 2026-03-25
**Branch:** divide-moble-and-web
**Scope:** Mobile app (`/mobile`) only

## Goal

Install NativeWind v4 and migrate all non-placeholder pages and shared components from `StyleSheet.create()` to Tailwind `className` props. Straight 1:1 conversion — no visual design changes.

---

## 1. Setup & Configuration

### Dependencies to install

```
nativewind@^4
tailwindcss
postcss
```

### Files to create / modify

**`mobile/tailwind.config.js`** (new)

Extends default Tailwind theme with existing design tokens. Note: custom spacing keys (`cy-xs`, `cy-sm`, etc.) are prefixed with `cy-` to avoid colliding with Tailwind's built-in spacing/breakpoint scale names (`sm`, `lg`, `xl`, `2xl`).

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './index.js',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        'primary-dark': '#1d4ed8',
        secondary: '#64748b',
        border: '#e2e8f0',
        'border-light': '#dbe3f0',
        'text-primary': '#1e293b',
        'text-secondary': '#64748b',
        'bg-base': '#ffffff',
        'bg-light': '#f8fbff',
        'bg-page': '#eef4ff',
        'bubble-top': '#d8e6ff',
        'bubble-bottom': '#dbeafe',
      },
      spacing: {
        'cy-xs': '4px',
        'cy-sm': '8px',
        'cy-md': '12px',
        'cy-lg': '16px',
        'cy-xl': '24px',
        'cy-2xl': '32px',
      },
      borderRadius: {
        'cy-sm': '6px',
        'cy-md': '8px',
        'cy-lg': '12px',
        'cy-xl': '16px',
        'cy-2xl': '28px',
      },
    },
  },
  plugins: [],
};
```

**`mobile/global.css`** (new)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**`mobile/metro.config.js`** (new — required for NativeWind v4)

NativeWind v4 requires Metro to be configured with its CSS preprocessing pipeline. Without this the app fails to start or `className` props have no effect.

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

**`mobile/app/_layout.tsx`** (modify)
Add `import '../global.css'` at the top.

**`mobile/babel.config.js`** (modify)

Add `'nativewind/babel'` **before** `'react-native-reanimated/plugin'`. Reanimated's plugin must always be last.

```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel', 'react-native-reanimated/plugin'],
  };
};
```

**`mobile/nativewind-env.d.ts`** (new)
```ts
/// <reference types="nativewind/types" />
```

**`mobile/tsconfig.json`** (verify)
Confirm `include` covers `nativewind-env.d.ts` (it should by default if `"include": ["."]`).

**`mobile/package.json`** — Jest config (modify)

NativeWind requires a CSS module mock so tests don't throw on `.css` imports. Add to the `jest` config block:

```json
"moduleNameMapper": {
  "^@/(.*)$": "<rootDir>/src/$1",
  "\\.css$": "<rootDir>/__mocks__/fileMock.js"
}
```

Create `mobile/__mocks__/fileMock.js`:
```js
module.exports = '';
```

---

## 2. Conversion Rules

### What converts to `className`

| StyleSheet property | Tailwind equivalent |
|---|---|
| `flex: 1` | `flex-1` |
| `flexDirection: 'row'` | `flex-row` |
| `alignItems: 'center'` | `items-center` |
| `justifyContent: 'center'` | `justify-center` |
| `padding`, `paddingHorizontal`, etc. | `p-*`, `px-*`, `py-*` |
| `margin`, `marginBottom`, etc. | `m-*`, `mb-*`, etc. |
| `backgroundColor` | `bg-*` |
| `color` (on Text) | `text-*` |
| `fontSize`, `fontWeight` | `text-*`, `font-*` |
| `borderRadius` | `rounded-*` |
| `borderWidth`, `borderColor` | `border`, `border-*` |
| `opacity` | `opacity-*` |
| `width`, `height` (fixed pixel values) | `w-*`, `h-*` |
| `maxWidth` (standard values) | `max-w-*` |
| `position: 'absolute'` | `absolute` |
| `top`, `right`, `bottom`, `left` | `top-*`, `right-*`, etc. |
| `gap` | `gap-*` |
| `textAlign: 'center'` | `text-center` |
| `alignSelf: 'center'` | `self-center` |
| `letterSpacing` | `tracking-*` |
| `lineHeight` | `leading-*` |
| `borderRadius: 999` (pill pattern) | `rounded-full` |

### What stays as `style={}`

These cannot be expressed in NativeWind v4 and must remain as inline style props or style arrays:

- **Shadow props:** `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`
- **Animated transforms:** `transform: [{ scale: ... }]`
- **Pressable state callbacks:** `({ pressed, hovered }) => [...]` — dynamic style arrays
- **`placeholderTextColor`** — direct RN prop, not a style class
- **`Slider` native color props:** `minimumTrackTintColor`, `maximumTrackTintColor`, `thumbTintColor` on `@react-native-community/slider` — these are component API props, not style properties
- **`LinearGradient` props:** `colors`, `start`, `end` on `expo-linear-gradient` — component API props
- **`Switch` native props:** `trackColor`, `thumbColor` on RN `Switch` — component API props
- **Percentage width values:** `width: '100%'` converts to `w-full` (use className). Fractional percentages like `width: '48%'`, `minWidth: '45%'` have no Tailwind equivalent — use `style={{ width: '48%' }}` directly. Runtime-computed percentages like `` width: `${percent}%` `` must also remain as style props
- **Arbitrary pixel values** with no clean Tailwind step (e.g. `width: 180`, `height: 220`) — use `style={}` for one-off values

### `Common.tsx` token object removal

The `styles` export in `Common.tsx` (colors, spacing, radii as a JS object) is replaced by the tailwind config. When removing this export:

- All `StyleSheet` references to `styles.primaryColor`, `styles.spacing.md`, etc. become `className` equivalents
- Any remaining `style={{}}` prop that previously used `styles.spacing.md` (a number) must use the numeric literal directly (e.g. `style={{ paddingVertical: 12 }}`) — the JS object is deleted so the runtime reference no longer exists

### Per-file `theme` objects

`UserProfilePage.tsx`, `EditProfilePage.tsx`, `ChangePasswordPage.tsx`, and `PrivacySecurityPage.tsx` each define a local `const theme = { ... }` with raw hex values. These are separate from the shared `styles` export. They should be removed and replaced with `className` equivalents using the custom tokens defined in the tailwind config.

---

## 3. Files In Scope

### Config / setup (new/modified)
- `mobile/tailwind.config.js` — new
- `mobile/global.css` — new
- `mobile/metro.config.js` — new
- `mobile/nativewind-env.d.ts` — new
- `mobile/__mocks__/fileMock.js` — new
- `mobile/app/_layout.tsx` — add CSS import
- `mobile/babel.config.js` — add NativeWind babel plugin (before reanimated)
- `mobile/package.json` — add CSS moduleNameMapper to jest config

### Shared components (convert first)
1. `mobile/src/app/components/native/Common.tsx`
2. `mobile/src/app/components/native/FormComponents.tsx`

### Pages (convert after shared components)
3. `mobile/src/app/pages/LoginPage.tsx`
4. `mobile/src/app/pages/RegisterPage.tsx`
5. `mobile/src/app/pages/UserProfilePage.tsx`
6. `mobile/src/app/pages/EditProfilePage.tsx`
7. `mobile/src/app/pages/ChangePasswordPage.tsx`
8. `mobile/src/app/pages/PrivacySecurityPage.tsx`
9. `mobile/src/app/pages/HomePage.tsx`
10. `mobile/src/app/pages/OnboardingPage.tsx`
11. `mobile/src/app/pages/RouteConfigPage.tsx`
12. `mobile/src/app/pages/RouteRecommendationPage.tsx`
13. `mobile/src/app/pages/RouteFeedbackPage.tsx`
14. `mobile/src/app/pages/RouteHistoryDetailsPage.tsx`
15. `mobile/src/app/pages/RideHistoryPage.tsx`
16. `mobile/src/app/pages/RouteDetailsPage.tsx`

### Skipped (placeholders / no styles)
- `mobile/src/app/pages/LiveMapPage.tsx` — placeholder (teammates WIP)
- `mobile/src/app/pages/UserJourneyPage.tsx` — placeholder (teammates WIP)
- `mobile/src/app/pages/RouteConfirmedPage.tsx` — placeholder (teammates WIP)
- `mobile/app/index.tsx` — redirect only, no styles
- `mobile/app/home.tsx` — stub, teammates WIP

---

## 4. Out of Scope

- Dark mode implementation (separate task)
- React Native animations (separate task)
- Web app (`/web-app`) — untouched
- Navigation, AuthContext, service files — no styles present
- Visual design changes — strict 1:1 conversion only
