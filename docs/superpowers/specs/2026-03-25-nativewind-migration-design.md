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
Extends default Tailwind theme with existing design tokens from `Common.tsx`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
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
        'slate-50': '#f8fafc',
        'slate-100': '#f1f5f9',
        'slate-200': '#e2e8f0',
        'slate-300': '#cbd5e1',
        'slate-400': '#94a3b8',
        'slate-500': '#64748b',
        'slate-600': '#475569',
        'slate-700': '#334155',
        'slate-800': '#1e293b',
        'slate-900': '#0f172a',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '28px',
        full: '9999px',
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

**`mobile/app/_layout.tsx`** (modify)
Add `import '../global.css'` at the top.

**`mobile/babel.config.js`** (modify)
Add `'nativewind/babel'` to the plugins array.

**`mobile/nativewind-env.d.ts`** (new)
```ts
/// <reference types="nativewind/types" />
```

**`mobile/tsconfig.json`** (modify if needed)
Ensure `include` covers `nativewind-env.d.ts`.

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
| `width`, `height` | `w-*`, `h-*` |
| `maxWidth` | `max-w-*` |
| `position: 'absolute'` | `absolute` |
| `top`, `right`, `bottom`, `left` | `top-*`, `right-*`, etc. |
| `gap` | `gap-*` |
| `textAlign: 'center'` | `text-center` |
| `alignSelf: 'center'` | `self-center` |

### What stays as `style={}`

These cannot be expressed in NativeWind v4 and must remain as inline style props:

- **Shadow props:** `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`
- **Animated transforms:** `transform: [{ scale: ... }]`
- **Pressable state callbacks:** `({ pressed, hovered }) => [...]` — dynamic style arrays
- **`placeholderTextColor`** — this is a direct RN prop, not a style class
- Exact pixel values that have no clean Tailwind equivalent (use `style` for one-off values like `width: 180`)

### Common.tsx token object removal

The `styles` export in `Common.tsx` (colors, spacing, radii as JS object) is replaced by the tailwind config. Components in `Common.tsx` and `FormComponents.tsx` that currently reference `styles.primaryColor`, `styles.spacing.md`, etc. will use className equivalents instead. The `styles` export is deleted.

---

## 3. Files In Scope

### Config / setup (new/modified)
- `mobile/tailwind.config.js` — new
- `mobile/global.css` — new
- `mobile/nativewind-env.d.ts` — new
- `mobile/app/_layout.tsx` — add CSS import
- `mobile/babel.config.js` — add NativeWind babel plugin

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

### Skipped (placeholders / no styles)
- `mobile/src/app/pages/RouteDetailsPage.tsx` — placeholder (teammates WIP)
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
