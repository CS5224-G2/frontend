# NativeWind v4 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install NativeWind v4 and migrate all active mobile app pages and shared components from `StyleSheet.create()` to Tailwind `className` props — strict 1:1 conversion, no visual changes.

**Architecture:** NativeWind v4 wires into Metro and Babel to process a `global.css` file and enable `className` on all React Native core components. Custom design tokens from the existing `Common.tsx` style object are extracted into `tailwind.config.js` so class names map to the exact same values. Shared components (`Common.tsx`, `FormComponents.tsx`) are converted first since pages depend on them; shadow props, dynamic style callbacks, and component API props stay as `style={}`.

**Tech Stack:** React Native 0.81, Expo SDK 54, expo-router v6, NativeWind v4, Tailwind CSS, `react-native-reanimated` v4

**Spec:** `docs/superpowers/specs/2026-03-25-nativewind-migration-design.md`

---

## Conversion Rules Reference

Keep this open while converting pages:

**Stays as `style={}`:**
- Shadow: `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`
- Dynamic Pressable: `({ pressed, hovered }) => [...]`
- Transforms: `transform: [{ scale: ... }]`
- RN props (not styles): `placeholderTextColor`, `minimumTrackTintColor`, `maximumTrackTintColor`, `thumbTintColor`, `trackColor`, `thumbColor`
- LinearGradient props: `colors`, `start`, `end`
- Fractional/computed percentages: `width: '48%'`, `minWidth: '45%'`, `` `${n}%` `` → use `style={{ width: '48%' }}`
- Arbitrary one-off pixel values: `width: 180`, `height: 220` → use `style={{}}`

**`width: '100%'` → `w-full` (className, NOT style)**
**`borderRadius: 999` → `rounded-full` (className)**

**Custom token classes:**
- Colors: `bg-primary`, `text-primary`, `bg-bg-page`, `bg-bg-light`, `bg-bg-base`, `border-border`, `border-border-light`, `text-text-primary`, `text-text-secondary`, `bg-bubble-top`, `bg-bubble-bottom`
- Spacing: `p-cy-md`, `px-cy-xl`, `py-cy-sm`, etc. (prefix `cy-`)
- Border radius: `rounded-cy-md`, `rounded-cy-xl`, `rounded-cy-2xl`, etc. (prefix `cy-`)

---

## File Map

**New files:**
- `mobile/tailwind.config.js`
- `mobile/global.css`
- `mobile/metro.config.js`
- `mobile/nativewind-env.d.ts`
- `mobile/__mocks__/fileMock.js`

**Modified files:**
- `mobile/package.json` — add nativewind deps + jest CSS mock
- `mobile/babel.config.js` — add nativewind/babel plugin
- `mobile/app/_layout.tsx` — import global.css
- `mobile/src/app/components/native/Common.tsx` — remove token object, convert to className
- `mobile/src/app/components/native/FormComponents.tsx` — convert to className
- `mobile/src/app/pages/LoginPage.tsx`
- `mobile/src/app/pages/RegisterPage.tsx`
- `mobile/src/app/pages/UserProfilePage.tsx`
- `mobile/src/app/pages/EditProfilePage.tsx`
- `mobile/src/app/pages/ChangePasswordPage.tsx`
- `mobile/src/app/pages/PrivacySecurityPage.tsx`
- `mobile/src/app/pages/HomePage.tsx`
- `mobile/src/app/pages/OnboardingPage.tsx`
- `mobile/src/app/pages/RouteConfigPage.tsx`
- `mobile/src/app/pages/RouteRecommendationPage.tsx`
- `mobile/src/app/pages/RouteFeedbackPage.tsx`
- `mobile/src/app/pages/RouteHistoryDetailsPage.tsx`
- `mobile/src/app/pages/RideHistoryPage.tsx`
- `mobile/src/app/pages/RouteDetailsPage.tsx`

---

## Task 1: Install NativeWind and create config files

**Files:**
- Create: `mobile/tailwind.config.js`
- Create: `mobile/global.css`
- Create: `mobile/metro.config.js`
- Create: `mobile/nativewind-env.d.ts`
- Create: `mobile/__mocks__/fileMock.js`
- Modify: `mobile/package.json`

- [ ] **Step 1: Install dependencies**

```bash
cd mobile && npm install nativewind tailwindcss postcss
```

Expected: packages added to `node_modules`, `package.json` dependencies updated.

- [ ] **Step 2: Create `mobile/tailwind.config.js`**

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

- [ ] **Step 3: Create `mobile/global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Create `mobile/metro.config.js`**

NativeWind v4 requires Metro to process the CSS pipeline. Without this, `className` props have no effect.

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

- [ ] **Step 5: Create `mobile/nativewind-env.d.ts`**

```ts
/// <reference types="nativewind/types" />
```

- [ ] **Step 6: Create `mobile/__mocks__/fileMock.js`**

Prevents Jest from choking on CSS imports.

```js
module.exports = '';
```

- [ ] **Step 7: Add Jest CSS mock to `mobile/package.json`**

In `package.json`, find the `"jest"` block and add the CSS entry to `moduleNameMapper`:

```json
"moduleNameMapper": {
  "^@/(.*)$": "<rootDir>/src/$1",
  "\\.css$": "<rootDir>/__mocks__/fileMock.js"
}
```

- [ ] **Step 8: Commit**

```bash
cd mobile && git add tailwind.config.js global.css metro.config.js nativewind-env.d.ts __mocks__/fileMock.js package.json && git commit -m "feat(mobile): add NativeWind v4 config files"
```

---

## Task 2: Wire up Babel and layout entry point

**Files:**
- Modify: `mobile/babel.config.js`
- Modify: `mobile/app/_layout.tsx`

- [ ] **Step 1: Update `mobile/babel.config.js`**

`nativewind/babel` must come before `react-native-reanimated/plugin` — Reanimated must always be last.

```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

Note: `nativewind/babel` is a preset-shaped export, not a plugin — it must go in `presets`, not `plugins`. Reanimated stays as the sole plugin (plugins run after presets in Babel, so Reanimated remains last).

- [ ] **Step 2: Add CSS import to `mobile/app/_layout.tsx`**

Add this as the very first line of the file:

```ts
import '../global.css';
```

The rest of `_layout.tsx` stays unchanged.

- [ ] **Step 3: Run the full test suite to verify setup hasn't broken anything**

```bash
cd mobile && npm test -- --watchAll=false
```

Expected: all existing tests pass. If any fail, check that `__mocks__/fileMock.js` exists and the `moduleNameMapper` in `package.json` is correct.

- [ ] **Step 4: Commit**

```bash
cd mobile && git add babel.config.js app/_layout.tsx && git commit -m "feat(mobile): wire NativeWind into Babel and layout entry"
```

---

## Task 3: Convert `Common.tsx` — shared components

**Files:**
- Modify: `mobile/src/app/components/native/Common.tsx`

**Important:** The `styles` export object at the top of this file (`primaryColor`, `spacing`, `radiusMd`, etc.) is used by `FormComponents.tsx` and some pages. After this task, those references will no longer exist. Downstream files will be fixed in their own tasks. Do NOT remove the `styles` export yet — leave it in place until Task 4 (FormComponents) is done, then remove it in Task 5.

Actually — to avoid a broken intermediate state, convert `Common.tsx` components to `className` but keep the `styles` export object until FormComponents.tsx is also converted. Remove it in Task 4.

- [ ] **Step 1: Run tests to establish baseline**

```bash
cd mobile && npm test -- --watchAll=false
```

Note how many pass. All should pass before you start.

- [ ] **Step 2: Convert `Card` component**

Replace:
```tsx
const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: styles.radiusMd,
    borderWidth: 1,
    borderColor: styles.borderColor,
    padding: styles.spacing.md,
    marginVertical: styles.spacing.sm,
  },
});

export const Card = ({ children, style }: CardProps) => (
  <View style={[cardStyles.container, style]}>
    {children}
  </View>
);
```

With:
```tsx
export const Card = ({ children, style }: CardProps) => (
  <View className="bg-bg-base rounded-cy-md border border-border p-cy-md my-cy-sm" style={style}>
    {children}
  </View>
);
```

- [ ] **Step 3: Convert `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`**

```tsx
export const CardHeader = ({ children }: CardHeaderProps) => (
  <View className="mb-cy-md">
    {children}
  </View>
);

export const CardTitle = ({ children, style }: CardTitleProps) => (
  <Text className="text-xl font-semibold text-text-primary" style={style}>
    {children}
  </Text>
);

export const CardDescription = ({ children }: CardDescriptionProps) => (
  <Text className="text-sm text-text-secondary mt-cy-xs">
    {children}
  </Text>
);

export const CardContent = ({ children }: CardContentProps) => (
  <View className="gap-cy-md">
    {children}
  </View>
);
```

- [ ] **Step 4: Convert `Button` component**

The `pressed` state callback must stay as `style={}` since it's dynamic. Apply static variant classes via `className`, dynamic pressed state via the style callback:

```tsx
export const Button = ({ onPress, children, variant = 'default', disabled = false, loading = false, style }: ButtonProps) => (
  <Pressable
    onPress={onPress}
    disabled={disabled || loading}
    className={[
      'px-cy-lg py-cy-md rounded-cy-md justify-center items-center',
      variant === 'default' && 'bg-primary',
      variant === 'secondary' && 'bg-slate-100 border border-border',
      variant === 'ghost' && 'bg-transparent',
      (disabled || loading) && 'opacity-50',
    ].filter(Boolean).join(' ')}
    style={({ pressed }) => [
      pressed && { opacity: 0.8 },
      style,
    ]}
  >
    {loading ? (
      <ActivityIndicator color="#ffffff" />
    ) : typeof children === 'string' ? (
      <Text className="text-white text-sm font-semibold">{children}</Text>
    ) : (
      children
    )}
  </Pressable>
);
```

- [ ] **Step 5: Remove all `StyleSheet.create()` calls and their variables from `Common.tsx`**

Delete: `cardStyles`, `cardHeaderStyles`, `cardTitleStyles`, `cardDescriptionStyles`, `cardContentStyles`, `buttonStyles`.
Remove the `StyleSheet` import from the RN import list (keep `View`, `Text`, `Pressable`, `ActivityIndicator`).

**Do NOT remove the `styles` export object yet** — FormComponents.tsx still references it.

- [ ] **Step 6: Run tests**

```bash
cd mobile && npm test -- --watchAll=false
```

Expected: same passing count as baseline. If any test fails, it is likely a snapshot test — update snapshots with `npm test -- --watchAll=false -u`.

- [ ] **Step 7: Commit**

```bash
cd mobile && git add src/app/components/native/Common.tsx && git commit -m "feat(mobile): convert Common.tsx shared components to NativeWind"
```

---

## Task 4: Convert `FormComponents.tsx` and remove the `styles` token export

**Files:**
- Modify: `mobile/src/app/components/native/FormComponents.tsx`
- Modify: `mobile/src/app/components/native/Common.tsx` (remove `styles` export)

- [ ] **Step 1: Convert `Input` component in `FormComponents.tsx`**

`placeholderTextColor` stays as a prop (it's not a style). Remove `inputStyles`.

```tsx
export const Input = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  editable = true,
  keyboardType = 'default',
  style,
}: InputProps) => (
  <TextInput
    className="border border-border rounded-cy-md px-cy-md py-cy-md text-sm text-text-primary bg-bg-base"
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor="#94a3b8"
    secureTextEntry={secureTextEntry}
    editable={editable}
    keyboardType={keyboardType}
    style={style}
  />
);
```

- [ ] **Step 2: Convert `Label`, `Badge`, `Separator`, `Checkbox`**

```tsx
export const Label = ({ children }: LabelProps) => (
  <Text className="text-sm font-medium text-text-primary mb-cy-sm">
    {children}
  </Text>
);

export const Badge = ({ children, variant = 'default', style }: BadgeProps) => (
  <View
    className={[
      'px-cy-md py-cy-xs rounded-full self-start',
      variant === 'default' && 'bg-primary',
      variant === 'secondary' && 'bg-slate-200',
      variant === 'destructive' && 'bg-red-500',
    ].filter(Boolean).join(' ')}
    style={style}
  >
    <Text className="text-white text-xs font-semibold">
      {typeof children === 'string' ? children : children}
    </Text>
  </View>
);

export const Separator = ({ style }: SeparatorProps) => (
  <View className="h-px bg-border my-cy-md" style={style} />
);

export const Checkbox = ({ value, onValueChange, disabled }: CheckboxProps) => (
  <Pressable
    onPress={() => !disabled && onValueChange(!value)}
    className={[
      'w-5 h-5 border rounded-cy-sm justify-center items-center bg-bg-base',
      value ? 'bg-primary border-primary' : 'border-border',
      disabled && 'opacity-50',
    ].filter(Boolean).join(' ')}
  >
    {value && <Text className="text-white font-bold">✓</Text>}
  </Pressable>
);
```

- [ ] **Step 3: Remove all `StyleSheet.create()` calls from `FormComponents.tsx`**

Delete: `inputStyles`, `labelStyles`, `badgeStyles`, `separatorStyles`, `checkboxStyles`.
Remove `StyleSheet` from the RN import. Remove the `import { styles } from './Common'` line.

- [ ] **Step 4: Remove the `styles` export from `Common.tsx`**

Delete the entire `export const styles = { ... }` block (lines 4–30 in the original file).
Remove any now-unused imports at the top of `Common.tsx` (e.g. `StyleSheet` if not already removed, `React` if not needed).

- [ ] **Step 5: Run tests**

```bash
cd mobile && npm test -- --watchAll=false
```

Expected: all pass. If TypeScript errors appear about `styles` being undefined, search the codebase for remaining references:

```bash
cd mobile && grep -r "from.*Common" src/ --include="*.tsx" | grep -v "Card\|Button\|CardHeader\|CardTitle\|CardDescription\|CardContent"
```

Any file that imports `styles` from Common still needs to be migrated — that will happen in their own tasks below.

- [ ] **Step 6: Commit**

```bash
cd mobile && git add src/app/components/native/FormComponents.tsx src/app/components/native/Common.tsx && git commit -m "feat(mobile): convert FormComponents to NativeWind, remove styles token object"
```

---

## Task 5: Convert `LoginPage.tsx`

**Files:**
- Modify: `mobile/src/app/pages/LoginPage.tsx`
- Test: `mobile/src/app/pages/LoginPage.test.tsx`

**Watch for in this file:**
- `shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius`/`elevation` on `logoCircle` and `card` → keep as `style={}`
- `Pressable` state callback on the Sign In button → keep dynamic `state.pressed` and `state.hovered` as `style=`
- `backgroundBubbleTop` and `backgroundBubbleBottom`: these use `position: absolute` + exact pixel offsets (`top: 20`, `right: -40`, etc.) — convert `position: 'absolute'` to `absolute` className, keep the pixel offset values as `style={}`
- `maxWidth: 480` on container → no exact Tailwind equivalent, use `style={{ maxWidth: 480 }}`
- `maxWidth: 280` on subtitle → keep as `style={{ maxWidth: 280 }}`
- `width: 72`, `height: 72` on logoCircle → use `style={{ width: 72, height: 72 }}`; or `w-[72px] h-[72px]` if NativeWind v4 supports arbitrary values

- [ ] **Step 1: Run the LoginPage tests to establish baseline**

```bash
cd mobile && npm test -- --watchAll=false --testPathPattern=LoginPage
```

Expected: pass.

- [ ] **Step 2: Remove `StyleSheet` import and the entire `const styles = StyleSheet.create({...})` block at the bottom**

Work top-to-bottom through the JSX, replacing each `style={styles.X}` with `className="..."`.

- [ ] **Step 3: Convert `SafeAreaView`, `KeyboardAvoidingView`, `ScrollView` wrappers**

```tsx
<SafeAreaView className="flex-1 bg-bg-page">
  <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      className="bg-bg-page"
    >
```

Note: `contentContainerStyle` cannot use `className` — keep as a style object.

- [ ] **Step 4: Convert container, background bubbles, header**

```tsx
<View className="flex-1 w-full self-center justify-center" style={{ maxWidth: 480 }}>
  <View className="absolute rounded-full bg-bubble-top" style={{ top: 20, right: -40, width: 180, height: 180 }} />
  <View className="absolute rounded-full bg-bubble-bottom" style={{ bottom: 40, left: -60, width: 220, height: 220 }} />

  <View className="items-center mb-7">
    <View
      className="rounded-full bg-primary items-center justify-center mb-4"
      style={{
        width: 72, height: 72,
        shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22, shadowRadius: 18, elevation: 8,
      }}
    >
      <Text className="text-white text-[22px] font-extrabold tracking-widest">CL</Text>
    </View>
    <Text className="text-[34px] font-extrabold text-primary mb-2">CycleLink</Text>
    <Text className="text-[15px] leading-snug text-slate-500 text-center" style={{ maxWidth: 280 }}>
      Welcome back. Sign in to continue your next ride.
    </Text>
  </View>
```

- [ ] **Step 5: Convert card, social buttons, divider, fields, meta row, primary button, footer**

Card:
```tsx
<View
  className="bg-bg-base rounded-cy-2xl px-[22px] py-cy-xl"
  style={{
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08, shadowRadius: 24, elevation: 8,
  }}
>
  <Text className="text-2xl font-bold text-slate-900 mb-1.5">Sign In</Text>
  <Text className="text-sm text-slate-500 mb-[18px]">Choose your preferred sign-in method</Text>
```

Social buttons:
```tsx
<Pressable className="flex-row items-center justify-center border border-border-light rounded-cy-xl py-[14px] px-cy-lg mb-3 bg-bg-base" onPress={...}>
  <View className="w-7 h-7 rounded-full bg-slate-100 items-center justify-center mr-3">
    <Text className="text-sm font-bold text-slate-900">G</Text>
  </View>
  <Text className="text-[15px] font-semibold text-slate-900">Continue with Google</Text>
</Pressable>
```

Divider:
```tsx
<View className="flex-row items-center my-5">
  <View className="flex-1 h-px bg-slate-200" />
  <Text className="mx-3 text-slate-400 text-xs font-semibold">Or continue with email</Text>
  <View className="flex-1 h-px bg-slate-200" />
</View>
```

Fields:
```tsx
<View className="mb-4">
  <Text className="text-sm font-semibold text-slate-700 mb-2">Email</Text>
  <TextInput
    className="border border-border-light rounded-cy-xl px-4 py-[15px] text-[15px] text-slate-900 bg-bg-light"
    placeholderTextColor="#94a3b8"
    ...
  />
</View>

<View className="mb-4">
  <Text className="text-sm font-semibold text-slate-700 mb-2">Password</Text>
  <View className="flex-row items-center border border-border-light rounded-cy-xl px-4 bg-bg-light">
    <TextInput
      className="flex-1 py-[15px] text-[15px] text-slate-900"
      placeholderTextColor="#94a3b8"
      ...
    />
    <Pressable onPress={...}>
      <Text className="text-primary text-[13px] font-bold">{showPassword ? 'Hide' : 'Show'}</Text>
    </Pressable>
  </View>
</View>
```

Meta row:
```tsx
<View className="flex-row items-center justify-between mb-5">
  <Pressable className="flex-row items-center" onPress={...}>
    <View className={`w-5 h-5 rounded-cy-sm border items-center justify-center mr-2 ${rememberMe ? 'bg-primary border-primary' : 'bg-bg-base border-slate-300'}`}>
      {rememberMe ? <Text className="text-white text-[11px] font-extrabold">x</Text> : null}
    </View>
    <Text className="text-slate-600 text-[13px]">Remember me</Text>
  </Pressable>
  <Pressable>
    <Text className="text-primary text-[13px] font-bold">Forgot password?</Text>
  </Pressable>
</View>
```

Primary button — keep pressed/hover dynamic styles as `style=`:
```tsx
<Pressable
  disabled={isSubmitting}
  onPress={handleLogin}
  className={`bg-primary rounded-[18px] items-center justify-center py-4 mb-[18px] ${isSubmitting ? 'opacity-70' : ''}`}
  style={(state: any) => [
    Platform.OS === 'web' && state.hovered && { backgroundColor: '#1d4ed8', transform: [{ scale: 1.02 }] },
    state.pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
  ]}
>
  {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white text-base font-bold">Sign In</Text>}
</Pressable>
```

Footer:
```tsx
<View className="flex-row justify-center items-center">
  <Text className="text-slate-500 text-[13px]">Do not have an account? </Text>
  <Pressable onPress={() => navigation.navigate('Register')}>
    <Text className="text-primary text-[13px] font-bold">Sign up</Text>
  </Pressable>
</View>
```

- [ ] **Step 6: Run tests**

```bash
cd mobile && npm test -- --watchAll=false --testPathPattern=LoginPage
```

Expected: pass. Update snapshots if needed with `-u`.

- [ ] **Step 7: Commit**

```bash
cd mobile && git add src/app/pages/LoginPage.tsx && git commit -m "feat(mobile): convert LoginPage to NativeWind"
```

---

## Task 6: Convert `RegisterPage.tsx`

**Files:**
- Modify: `mobile/src/app/pages/RegisterPage.tsx`
- Test: `mobile/src/app/pages/RegisterPage.test.tsx`

**Watch for:** Same pattern as LoginPage — shadow on card, Pressable state callbacks on the submit button. Password strength indicator may have a computed width (`` `${n}%` ``) → keep as `style={{ width: \`${n}%\` }}`.

- [ ] **Step 1: Run RegisterPage tests baseline**

```bash
cd mobile && npm test -- --watchAll=false --testPathPattern=RegisterPage
```

- [ ] **Step 2: Convert file**

Follow the same pattern as LoginPage:
- Wrappers: `flex-1 bg-bg-page` etc.
- Card: shadow stays in `style={}`, other card styles → className
- Fields: same input/label pattern
- Submit button: static `className` for bg/layout, dynamic pressed state in `style=` callback
- Remove `StyleSheet` import and `StyleSheet.create()` block

- [ ] **Step 3: Run tests**

```bash
cd mobile && npm test -- --watchAll=false --testPathPattern=RegisterPage
```

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/app/pages/RegisterPage.tsx && git commit -m "feat(mobile): convert RegisterPage to NativeWind"
```

---

## Task 7: Convert `UserProfilePage.tsx`

**Files:**
- Modify: `mobile/src/app/pages/UserProfilePage.tsx`

**Watch for:**
- Has a local `const theme = { background: '#F3F4F6', surface: '#FFFFFF', ... }` object at the top — delete it and use custom token classes instead
- Map: `theme.background` → `bg-[#F3F4F6]` or add `background: '#F3F4F6'` to tailwind config as a named color if used widely. Since this is a one-off local theme, use arbitrary values `bg-[#F3F4F6]` or use the nearest custom token (`bg-bg-page` = `#eef4ff` is different, so use arbitrary value)
- `theme.primary` is `#1D4ED8` (close to `primary-dark` = `#1d4ed8`) → use `bg-primary-dark` / `text-primary-dark`
- Shadow on stat cards and avatar → keep as `style={}`

- [ ] **Step 1: Run full test suite baseline**

```bash
cd mobile && npm test -- --watchAll=false
```

- [ ] **Step 2: Convert file**

1. Delete the `const theme = {...}` block
2. Replace all `theme.X` references in styles with className equivalents:
   - `theme.background` (`#F3F4F6`) → `bg-[#F3F4F6]`
   - `theme.surface` (`#FFFFFF`) → `bg-white`
   - `theme.primary` (`#1D4ED8`) → `bg-primary-dark` / `text-primary-dark`
   - `theme.primarySoft` (`#DBEAFE`) → `bg-[#DBEAFE]`
   - `theme.text` (`#0F172A`) → `text-slate-900`
   - `theme.textMuted` (`#64748B`) → `text-text-secondary`
   - `theme.border` (`#E2E8F0`) → `border-border`
   - `theme.successSoft` → `bg-[#DCFCE7]`, `theme.successText` → `text-[#166534]`
   - `theme.warningSoft` → `bg-[#FEF3C7]`, `theme.warningText` → `text-[#92400E]`
3. Convert all `StyleSheet.create()` to className props
4. Keep shadow props in `style={}`

- [ ] **Step 3: Run tests**

```bash
cd mobile && npm test -- --watchAll=false
```

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/app/pages/UserProfilePage.tsx && git commit -m "feat(mobile): convert UserProfilePage to NativeWind"
```

---

## Task 8: Convert `EditProfilePage.tsx`

**Files:**
- Modify: `mobile/src/app/pages/EditProfilePage.tsx`
- Test: `mobile/src/app/pages/EditProfilePage.test.tsx`

**Watch for:**
- May have a local `const theme = {...}` → delete and replace with className equivalents (same color mapping as Task 7)
- `borderRadius: 999` on avatar → `rounded-full`
- `placeholderTextColor` on inputs → keep as prop

- [ ] **Step 1: Run EditProfile tests baseline**

```bash
cd mobile && npm test -- --watchAll=false --testPathPattern=EditProfile
```

- [ ] **Step 2: Convert file** — same pattern as UserProfilePage. Delete local `theme` object, convert StyleSheet to className, keep shadow and dynamic styles in `style={}`.

- [ ] **Step 3: Run tests**

```bash
cd mobile && npm test -- --watchAll=false --testPathPattern=EditProfile
```

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/app/pages/EditProfilePage.tsx && git commit -m "feat(mobile): convert EditProfilePage to NativeWind"
```

---

## Task 9: Convert `ChangePasswordPage.tsx`

**Files:**
- Modify: `mobile/src/app/pages/ChangePasswordPage.tsx`
- Test: `mobile/src/app/pages/ChangePasswordPage.test.tsx`

**Watch for:**
- Local `const theme = {...}` → delete and replace
- Password strength bar: uses a computed width like `width: \`${passwordStrength.fillPercent}%\`` → MUST stay as `style={{ width: \`${n}%\` }}`
- `borderRadius: 999` → `rounded-full`

- [ ] **Step 1: Run ChangePassword tests baseline**

```bash
cd mobile && npm test -- --watchAll=false --testPathPattern=ChangePassword
```

- [ ] **Step 2: Convert file**

The password strength fill element will look like:
```tsx
<View
  className="h-2 rounded-full bg-primary"
  style={{ width: `${passwordStrength.fillPercent}%` }}
/>
```

All other styles → className. Delete `theme` object.

- [ ] **Step 3: Run tests**

```bash
cd mobile && npm test -- --watchAll=false --testPathPattern=ChangePassword
```

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/app/pages/ChangePasswordPage.tsx && git commit -m "feat(mobile): convert ChangePasswordPage to NativeWind"
```

---

## Task 10: Convert `PrivacySecurityPage.tsx`

**Files:**
- Modify: `mobile/src/app/pages/PrivacySecurityPage.tsx`
- Test: `mobile/src/app/pages/PrivacySecurityPage.test.tsx`

**Watch for:**
- Local `const theme = {...}` → delete and replace
- `Switch` component: `trackColor` and `thumbColor` are native props, NOT style properties — they must stay as props on `<Switch>`, they cannot become className
- Example:
  ```tsx
  <Switch
    value={settings.shareLocation}
    onValueChange={...}
    trackColor={{ false: '#e2e8f0', true: '#2563eb' }}
    thumbColor="#ffffff"
  />
  ```
  The `trackColor` and `thumbColor` lines stay exactly as-is.

- [ ] **Step 1: Run PrivacySecurity tests baseline**

```bash
cd mobile && npm test -- --watchAll=false --testPathPattern=PrivacySecurity
```

- [ ] **Step 2: Convert file** — delete `theme`, convert StyleSheet to className, leave Switch props untouched.

- [ ] **Step 3: Run tests**

```bash
cd mobile && npm test -- --watchAll=false --testPathPattern=PrivacySecurity
```

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/app/pages/PrivacySecurityPage.tsx && git commit -m "feat(mobile): convert PrivacySecurityPage to NativeWind"
```

---

## Task 11: Convert `HomePage.tsx`

**Files:**
- Modify: `mobile/src/app/pages/HomePage.tsx`
- Test: `mobile/src/app/pages/HomePage.test.tsx`

**Watch for:**
- `LinearGradient` component from `expo-linear-gradient`: `colors`, `start`, `end` props stay exactly as-is — do NOT attempt to convert these to className
  ```tsx
  <LinearGradient
    colors={['#1e40af', '#3b82f6']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    className="rounded-cy-xl p-cy-xl"
  >
  ```
  The `className` on `LinearGradient` is fine for layout; `colors`/`start`/`end` stay as props.
- `minWidth: '45%'` → keep as `style={{ minWidth: '45%' }}`
- Shadow on cards → keep as `style={}`
- Pressable state callbacks → keep dynamic parts in `style=`

- [ ] **Step 1: Run HomePage tests baseline**

```bash
cd mobile && npm test -- --watchAll=false --testPathPattern=HomePage
```

- [ ] **Step 2: Convert file** — focus on converting layout, spacing, color styles to className. Keep LinearGradient API props, shadows, and dynamic styles in style props.

- [ ] **Step 3: Run tests**

```bash
cd mobile && npm test -- --watchAll=false --testPathPattern=HomePage
```

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/app/pages/HomePage.tsx && git commit -m "feat(mobile): convert HomePage to NativeWind"
```

---

## Task 12: Convert `OnboardingPage.tsx`

**Files:**
- Modify: `mobile/src/app/pages/OnboardingPage.tsx`

**Watch for:**
- `Slider` from `@react-native-community/slider`: `minimumTrackTintColor`, `maximumTrackTintColor`, `thumbTintColor` are component API props — leave them exactly as-is
- `minWidth: '45%'` → keep as `style={{ minWidth: '45%' }}`
- `width: '100%'` → `w-full` (className)
- Shadow on cards → keep in `style={}`

- [ ] **Step 1: Run full test suite baseline**

```bash
cd mobile && npm test -- --watchAll=false
```

- [ ] **Step 2: Convert file** — layout and colors to className, Slider props and shadow stay in style.

- [ ] **Step 3: Run tests**

```bash
cd mobile && npm test -- --watchAll=false
```

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/app/pages/OnboardingPage.tsx && git commit -m "feat(mobile): convert OnboardingPage to NativeWind"
```

---

## Task 13: Convert `RouteConfigPage.tsx`

**Files:**
- Modify: `mobile/src/app/pages/RouteConfigPage.tsx`

**Watch for:**
- `Slider`: `minimumTrackTintColor`, `maximumTrackTintColor`, `thumbTintColor` → stay as props
- `width: '100%'` → `w-full`
- Shadow on cards → keep in `style={}`

- [ ] **Step 1: Run full test suite baseline**

```bash
cd mobile && npm test -- --watchAll=false
```

- [ ] **Step 2: Convert file**

- [ ] **Step 3: Run tests**

```bash
cd mobile && npm test -- --watchAll=false
```

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/app/pages/RouteConfigPage.tsx && git commit -m "feat(mobile): convert RouteConfigPage to NativeWind"
```

---

## Task 14: Convert `RouteRecommendationPage.tsx`

**Files:**
- Modify: `mobile/src/app/pages/RouteRecommendationPage.tsx`

**Watch for:** Standard conversion — shadow on cards, Pressable state callbacks, check for any percentage widths.

- [ ] **Step 1: Run full test suite baseline**

```bash
cd mobile && npm test -- --watchAll=false
```

- [ ] **Step 2: Convert file** — standard pattern, remove StyleSheet.create(), convert all styles to className, shadow/dynamic in style.

- [ ] **Step 3: Run tests**

```bash
cd mobile && npm test -- --watchAll=false
```

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/app/pages/RouteRecommendationPage.tsx && git commit -m "feat(mobile): convert RouteRecommendationPage to NativeWind"
```

---

## Task 15: Convert `RouteFeedbackPage.tsx`

**Files:**
- Modify: `mobile/src/app/pages/RouteFeedbackPage.tsx`

**Watch for:** Standard conversion. Check for any star-rating or progress-bar elements that use computed widths.

- [ ] **Step 1: Run full test suite baseline**

```bash
cd mobile && npm test -- --watchAll=false
```

- [ ] **Step 2: Convert file**

- [ ] **Step 3: Run tests**

```bash
cd mobile && npm test -- --watchAll=false
```

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/app/pages/RouteFeedbackPage.tsx && git commit -m "feat(mobile): convert RouteFeedbackPage to NativeWind"
```

---

## Task 16: Convert `RouteHistoryDetailsPage.tsx`

**Files:**
- Modify: `mobile/src/app/pages/RouteHistoryDetailsPage.tsx`

**Watch for:**
- `width: '48%'` → keep as `style={{ width: '48%' }}`
- Shadow on cards → keep in `style={}`

- [ ] **Step 1: Run full test suite baseline**

```bash
cd mobile && npm test -- --watchAll=false
```

- [ ] **Step 2: Convert file** — layout/colors to className, `width: '48%'` and shadows stay in style.

- [ ] **Step 3: Run tests**

```bash
cd mobile && npm test -- --watchAll=false
```

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/app/pages/RouteHistoryDetailsPage.tsx && git commit -m "feat(mobile): convert RouteHistoryDetailsPage to NativeWind"
```

---

## Task 17: Convert `RideHistoryPage.tsx`

**Files:**
- Modify: `mobile/src/app/pages/RideHistoryPage.tsx`
- Test: `mobile/src/app/pages/RideHistoryPage.test.tsx`

**Watch for:**
- `width: '48%'` (two instances) → keep as `style={{ width: '48%' }}`
- Computed bar width: `` width: `${(item.distance / maxDistance) * 100}%` `` → keep as `style={{ width: \`${n}%\` }}`
- `borderRadius: 999` → `rounded-full`

- [ ] **Step 1: Run RideHistory tests baseline**

```bash
cd mobile && npm test -- --watchAll=false --testPathPattern=RideHistory
```

- [ ] **Step 2: Convert file** — layout/colors to className, all percentage widths and shadows stay in style.

- [ ] **Step 3: Run tests**

```bash
cd mobile && npm test -- --watchAll=false --testPathPattern=RideHistory
```

- [ ] **Step 4: Commit**

```bash
cd mobile && git add src/app/pages/RideHistoryPage.tsx && git commit -m "feat(mobile): convert RideHistoryPage to NativeWind"
```

---

## Task 18: Convert `RouteDetailsPage.tsx`

**Files:**
- Modify: `mobile/src/app/pages/RouteDetailsPage.tsx`

This is a simple page with 4 style rules — the quickest conversion in the list.

- [ ] **Step 1: Run full test suite baseline**

```bash
cd mobile && npm test -- --watchAll=false
```

- [ ] **Step 2: Convert file**

Complete converted file:
```tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/native/Common';

type Props = NativeStackScreenProps<any, any>;

export default function Screen({ navigation }: Props) {
  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="p-cy-lg pt-10">
        <Text className="text-[28px] font-bold text-text-primary">Route Details</Text>
        <Text className="text-sm text-text-secondary mt-cy-sm">Page content</Text>
        <Button onPress={() => navigation.navigate("RouteFeedback")}>Route Feedback</Button>
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
cd mobile && npm test -- --watchAll=false
```

- [ ] **Step 4: Final full test suite run**

```bash
cd mobile && npm test -- --watchAll=false
```

Expected: all tests pass. This is the final verification that the entire migration is clean.

- [ ] **Step 5: Commit**

```bash
cd mobile && git add src/app/pages/RouteDetailsPage.tsx && git commit -m "feat(mobile): convert RouteDetailsPage to NativeWind"
```

---

## Verification Checklist

After all tasks are complete, verify the migration is clean:

- [ ] No `StyleSheet.create()` calls remain in converted files:
  ```bash
  cd mobile && grep -r "StyleSheet.create" src/ --include="*.tsx"
  ```
  Expected: no output (or only placeholder files that were intentionally skipped).

- [ ] No remaining references to the deleted `styles` token object:
  ```bash
  cd mobile && grep -r "styles\.primaryColor\|styles\.spacing\|styles\.radius\|styles\.borderColor\|styles\.textPrimary\|styles\.textSecondary\|styles\.backgroundColor" src/ --include="*.tsx"
  ```
  Expected: no output.

- [ ] Full test suite passes:
  ```bash
  cd mobile && npm test -- --watchAll=false
  ```
