# Onboarding Flow Design

**Date:** 2026-03-31
**Status:** Approved

## Problem

After registration, `RegisterPage` calls `login(result)` immediately, dropping the user into the main app with an empty profile (no location, no cycling preference, no bio). The existing `OnboardingPage` exists in the navigator but is never shown. The result is an awkward first-time experience with blank profile fields.

## Solution

Insert the `OnboardingPage` between registration success and app entry. The user must complete onboarding before entering the app — it is not skippable.

## Navigation Flow

```text
RegisterPage
  → registerUser() success
  → navigation.navigate('Onboarding', { authResult })   ← replaces login() call
      → user fills onboarding form
      → updateUserProfile(preferences)
      → login(authResult)
          → RootNavigator detects isLoggedIn = true
          → AppNavigator (Home tab)
```

The `Onboarding` screen is already registered in `AuthNavigator` in [navigation.tsx](../../mobile/src/app/navigation.tsx). No navigator changes needed.

## OnboardingPage Fields

Single screen, not skippable. All fields except bio are required.

| Field | Component | Required | Notes |
| --- | --- | --- | --- |
| Location | `TextInput` + "📍 Use Current" button | Yes | GPS via `expo-location`, reverse-geocoded to human-readable area. Editable after fill. |
| Cycling preference | Pill selector | Yes | Options: Leisure / Commuter / Performance. Maps to `UserProfile.cyclingPreference`. |
| Weekly goal (km) | Number `TextInput` | Yes | Default: 80 |
| Bio | Multiline `TextInput` | No | Placeholder: "Tell other riders about your style…" |

Note: "Riding style" (Recreational/Commuter/Fitness/General) was dropped — it has no mapping in the backend profile payload and overlaps with Cycling Preference.

**"Get Started" button behaviour:**

1. Validate location, cyclingPreference, weeklyGoalKm are non-empty
2. Call `updateUserProfile({ location, cyclingPreference, weeklyGoalKm, bio })`
3. Call `login(authResult)` — triggers `RootNavigator` to mount `AppNavigator`

## RegisterPage Change

Replace:

```ts
await login(result);
```

With:

```ts
navigation.navigate('Onboarding', { authResult: result });
```

## Location UX

- "📍 Use Current" button requests `expo-location` foreground permission
- On grant: reverse-geocode current coords to a neighbourhood/district string (e.g. "Tampines, Singapore")
- On deny: field stays empty, user types manually
- Field remains editable after GPS fill
- App is Singapore-only — no country picker needed

## What Does Not Change

- `AuthContext` — no new state
- `RootNavigator` — no changes, reacts to `isLoggedIn` as before
- `userService.ts` — `updateUserProfile` is already available
- `UserProfilePage` / `EditProfilePage` — fields already match what onboarding collects

## Files to Touch

| File | Change |
| --- | --- |
| `mobile/src/app/pages/RegisterPage.tsx` | Replace `login(result)` with `navigation.navigate('Onboarding', { authResult: result })` |
| `mobile/src/app/pages/OnboardingPage.tsx` | Full rewrite — new fields, GPS location, `authResult` param, calls `updateUserProfile` then `login` |
