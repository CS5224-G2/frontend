# Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Insert a non-skippable profile onboarding screen between registration success and app entry so new users never land on an empty profile.

**Architecture:** `RegisterPage` navigates to `OnboardingPage` (passing the `AuthResult` as a route param) instead of calling `login()` directly. `OnboardingPage` collects location (with GPS fill), cycling preference, weekly goal, and bio — then calls `updateUserProfile(profile, token)` before calling `login(authResult)`, which triggers `RootNavigator` to swap to `AppNavigator`.

**Tech Stack:** React Navigation (`useNavigation`, `useRoute`), `expo-location` (already installed at `~19.0.8`), `@testing-library/react-native`, Jest.

---

### Task 1: Update RegisterPage to navigate to Onboarding instead of logging in

**Files:**

- Modify: `mobile/src/app/pages/RegisterPage.tsx`
- Modify: `mobile/src/app/pages/RegisterPage.test.tsx`

---

- [ ] **Step 1: Update the test — replace "calls login" assertion with "navigates to Onboarding"**

Open `mobile/src/app/pages/RegisterPage.test.tsx`.

Find the test named `'calls login from AuthContext with the full AuthResult upon successful registration'` (line ~128) and replace it entirely with:

```ts
it('navigates to Onboarding with authResult upon successful registration', async () => {
  renderWithAuth(<RegisterPage />);
  const submitButton = screen.getAllByText('Create Account')[1];

  fireEvent.changeText(screen.getByPlaceholderText('Alex'), 'Alex');
  fireEvent.changeText(screen.getByPlaceholderText('Johnson'), 'Tan');
  fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'alex@example.com');
  fireEvent.changeText(screen.getByPlaceholderText('At least 8 characters'), TEST_CRED);
  fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), TEST_CRED);
  fireEvent.press(screen.getByText(/I agree to the/i));
  fireEvent.press(submitButton);

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('Onboarding', { authResult: mockAuthResult });
  });
});
```

- [ ] **Step 2: Run the updated test to confirm it fails**

```bash
cd mobile && npx jest --watchman=false RegisterPage.test --no-coverage 2>&1 | tail -20
```

Expected: FAIL — `expect(mockNavigate).toHaveBeenCalledWith('Onboarding', ...)` — navigate was not called.

- [ ] **Step 3: Update RegisterPage to use useNavigation and navigate to Onboarding**

Open `mobile/src/app/pages/RegisterPage.tsx`.

Add `useNavigation` to the imports at the top of the file:

```ts
import { useNavigation } from '@react-navigation/native';
```

Add `const navigation = useNavigation<any>();` alongside the other hooks at the top of the component body (after `const router = useRouter()`):

```ts
const navigation = useNavigation<any>();
```

Inside `handleRegister`, replace `await login(result);` with:

```ts
navigation.navigate('Onboarding', { authResult: result });
```

The `login` import from `AuthContext` stays — it is still used by `handleOAuth`.

- [ ] **Step 4: Run the test to confirm it passes**

```bash
cd mobile && npx jest --watchman=false RegisterPage.test --no-coverage 2>&1 | tail -20
```

Expected: PASS — all 3 tests in the suite green.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/app/pages/RegisterPage.tsx mobile/src/app/pages/RegisterPage.test.tsx
git commit -m "feat: navigate to onboarding after registration instead of logging in directly"
```

---

### Task 2: Rewrite OnboardingPage with profile fields, GPS location, and auth handoff

**Files:**

- Modify: `mobile/src/app/pages/OnboardingPage.tsx` (full rewrite)
- Create: `mobile/src/app/pages/OnboardingPage.test.tsx`

---

- [ ] **Step 1: Write the OnboardingPage test file**

Create `mobile/src/app/pages/OnboardingPage.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import OnboardingPage from './OnboardingPage';
import { AuthContext } from '../AuthContext';
import * as userService from '../../services/userService';
import * as Location from 'expo-location';

const mockLogin = jest.fn().mockResolvedValue(undefined);
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({
    params: {
      authResult: {
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        expiresIn: 3600,
        user: {
          id: 'user_001',
          firstName: 'Alex',
          lastName: 'Tan',
          fullName: 'Alex Tan',
          email: 'alex@example.com',
          onboardingComplete: false,
          role: 'user' as const,
        },
      },
    },
  }),
}));

jest.mock('../../services/userService', () => ({
  updateUserProfile: jest.fn().mockResolvedValue({}),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({ coords: { latitude: 1.3521, longitude: 103.8198 } }),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([{ district: 'Tampines', city: 'Singapore' }]),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

const renderWithAuth = (component: React.ReactElement) =>
  render(
    <AuthContext.Provider
      value={{
        isRestoring: false,
        isLoggedIn: false,
        role: null,
        user: null,
        login: mockLogin,
        logout: jest.fn().mockResolvedValue(undefined),
      }}
    >
      {component}
    </AuthContext.Provider>,
  );

describe('OnboardingPage', () => {
  const mockedUpdateUserProfile = userService.updateUserProfile as jest.MockedFunction<
    typeof userService.updateUserProfile
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
    mockedUpdateUserProfile.mockResolvedValue({} as any);
  });

  it('renders all onboarding fields', () => {
    renderWithAuth(<OnboardingPage />);
    expect(screen.getByPlaceholderText('Neighbourhood, Singapore')).toBeTruthy();
    expect(screen.getByText('Leisure')).toBeTruthy();
    expect(screen.getByText('Commuter')).toBeTruthy();
    expect(screen.getByText('Performance')).toBeTruthy();
    expect(screen.getByPlaceholderText('80')).toBeTruthy();
    expect(screen.getByPlaceholderText("Tell other riders about your style...")).toBeTruthy();
    expect(screen.getByText('Get Started')).toBeTruthy();
  });

  it('fills location field when Use Current Location is pressed and permission is granted', async () => {
    renderWithAuth(<OnboardingPage />);
    fireEvent.press(screen.getByText('Use Current Location'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Tampines, Singapore')).toBeTruthy();
    });
  });

  it('shows alert if Get Started pressed with empty location', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
    renderWithAuth(<OnboardingPage />);
    fireEvent.press(screen.getByText('Performance'));
    fireEvent.press(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Missing location', expect.any(String));
    });
  });

  it('shows alert if Get Started pressed with no cycling preference selected', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
    renderWithAuth(<OnboardingPage />);
    fireEvent.changeText(screen.getByPlaceholderText('Neighbourhood, Singapore'), 'Tampines, Singapore');
    fireEvent.press(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Missing preference', expect.any(String));
    });
  });

  it('calls updateUserProfile then login on valid submit', async () => {
    renderWithAuth(<OnboardingPage />);

    fireEvent.changeText(screen.getByPlaceholderText('Neighbourhood, Singapore'), 'Tampines, Singapore');
    fireEvent.press(screen.getByText('Leisure'));
    fireEvent.changeText(screen.getByPlaceholderText('80'), '100');
    fireEvent.press(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(mockedUpdateUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          location: 'Tampines, Singapore',
          cyclingPreference: 'Leisure',
          weeklyGoalKm: 100,
          fullName: 'Alex Tan',
          email: 'alex@example.com',
        }),
        'mock-token',
      );
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: 'mock-token' }),
      );
    });
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd mobile && npx jest --watchman=false OnboardingPage.test --no-coverage 2>&1 | tail -30
```

Expected: FAIL — `OnboardingPage` doesn't have the right fields yet.

- [ ] **Step 3: Rewrite OnboardingPage.tsx**

Replace the entire contents of `mobile/src/app/pages/OnboardingPage.tsx` with:

```tsx
import { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import * as Location from 'expo-location';

import { AuthContext } from '../AuthContext';
import { updateUserProfile } from '../../services/userService';
import type { AuthResult, CyclingPreference, UserProfile } from '../../../shared/types/index';

const PREFERENCE_OPTIONS: CyclingPreference[] = ['Leisure', 'Commuter', 'Performance'];

export default function OnboardingPage() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { login } = useContext(AuthContext);
  const { colorScheme } = useColorScheme();

  const authResult: AuthResult = route.params?.authResult;

  const [location, setLocation] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [cyclingPreference, setCyclingPreference] = useState<CyclingPreference | null>(null);
  const [weeklyGoalKm, setWeeklyGoalKm] = useState('80');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location access denied', 'Enter your neighbourhood manually.');
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({});
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      const area = geocode?.district ?? geocode?.subregion ?? geocode?.city ?? '';
      setLocation(area ? `${area}, Singapore` : 'Singapore');
    } catch {
      Alert.alert('Location unavailable', 'Enter your neighbourhood manually.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (!location.trim()) {
      Alert.alert('Missing location', 'Please enter your neighbourhood or tap Use Current Location.');
      return;
    }
    if (!cyclingPreference) {
      Alert.alert('Missing preference', 'Please select a cycling preference before continuing.');
      return;
    }
    const goal = parseInt(weeklyGoalKm, 10);
    if (!goal || goal <= 0) {
      Alert.alert('Invalid goal', 'Please enter a weekly goal greater than 0 km.');
      return;
    }

    setIsSubmitting(true);
    try {
      const profile: UserProfile = {
        userId: authResult.user.id,
        fullName: authResult.user.fullName,
        email: authResult.user.email,
        location: location.trim(),
        memberSince: '',
        cyclingPreference,
        weeklyGoalKm: goal,
        bio: bio.trim(),
        avatarUrl: null,
        avatarColor: '#3b82f6',
        stats: { totalRides: 0, totalDistanceKm: 0, favoriteTrails: 0 },
      };
      await updateUserProfile(profile, authResult.accessToken);
      await login(authResult);
    } catch (error) {
      Alert.alert(
        'Setup failed',
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'border border-border-light dark:border-[#2d2d2d] rounded-cy-xl px-cy-lg py-[15px] text-[15px] text-slate-900 dark:text-slate-100 bg-bg-light dark:bg-[#1a1a1a]';

  return (
    <SafeAreaView className="flex-1 bg-bg-page dark:bg-black">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-7">
            <View
              className="items-center justify-center mb-4 bg-primary dark:bg-blue-500"
              style={{ width: 72, height: 72, borderRadius: 36, shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 8 }}
            >
              <Text className="text-white text-[22px] font-extrabold tracking-widest">CL</Text>
            </View>
            <Text className="text-[34px] font-extrabold text-[#2563eb] dark:text-blue-400 mb-2">CycleLink</Text>
            <Text className="text-[15px] leading-[22px] text-[#475569] dark:text-slate-400 text-center" style={{ maxWidth: 300 }}>
              Let's personalise your experience before you start.
            </Text>
          </View>

          <View
            className="bg-bg-base dark:bg-[#111111] rounded-cy-2xl px-[22px] py-cy-xl"
            style={{ shadowColor: '#0f172a', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 8 }}
          >
            <Text className="text-[24px] font-bold text-slate-900 dark:text-slate-100 mb-1.5">Your Profile</Text>
            <Text className="text-[14px] text-text-secondary mb-[18px]">Takes about 30 seconds. You can update everything later.</Text>

            {/* Location */}
            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-[#334155] dark:text-slate-100 mb-2">Location</Text>
              <View className="flex-row" style={{ gap: 8 }}>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Neighbourhood, Singapore"
                  placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
                  className={`flex-1 ${inputClass}`}
                />
                <Pressable
                  onPress={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="items-center justify-center rounded-cy-xl px-cy-md bg-[#DBEAFE] dark:bg-[#1e293b] border border-[#2563eb]"
                  style={{ minWidth: 56 }}
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : (
                    <Text className="text-[#2563eb] dark:text-blue-400 text-[12px] font-bold text-center">Use Current Location</Text>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Cycling Preference */}
            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-[#334155] dark:text-slate-100 mb-2">Cycling Preference</Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {PREFERENCE_OPTIONS.map((option) => {
                  const isSelected = cyclingPreference === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setCyclingPreference(option)}
                      className={`px-cy-lg py-cy-md rounded-full border ${isSelected ? 'bg-[#DBEAFE] dark:bg-[#1e293b] border-[#2563eb]' : 'bg-bg-light dark:bg-[#1a1a1a] border-border-light dark:border-[#2d2d2d]'}`}
                    >
                      <Text className={`text-[14px] font-semibold ${isSelected ? 'text-[#2563eb] dark:text-blue-400' : 'text-text-secondary dark:text-slate-400'}`}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Weekly Goal */}
            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-[#334155] dark:text-slate-100 mb-2">Weekly Goal (km)</Text>
              <TextInput
                value={weeklyGoalKm}
                onChangeText={setWeeklyGoalKm}
                placeholder="80"
                placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
                keyboardType="number-pad"
                className={inputClass}
              />
            </View>

            {/* Bio */}
            <View className="mb-5">
              <Text className="text-[14px] font-semibold text-[#334155] dark:text-slate-100 mb-2">
                Bio <Text className="text-text-secondary font-normal">(optional)</Text>
              </Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell other riders about your style..."
                placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
                multiline
                textAlignVertical="top"
                className={inputClass}
                style={{ minHeight: 80 }}
              />
            </View>

            <Pressable
              disabled={isSubmitting}
              onPress={handleSubmit}
              className="bg-primary dark:bg-blue-500 rounded-[18px] items-center justify-center py-cy-lg"
              style={isSubmitting ? { opacity: 0.7 } : undefined}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-[16px] font-bold">Get Started</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
cd mobile && npx jest --watchman=false OnboardingPage.test --no-coverage 2>&1 | tail -30
```

Expected: PASS — all 5 tests green.

- [ ] **Step 5: Run the full RegisterPage test suite to confirm no regressions**

```bash
cd mobile && npx jest --watchman=false RegisterPage.test --no-coverage 2>&1 | tail -20
```

Expected: PASS — all 3 tests green.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/app/pages/OnboardingPage.tsx mobile/src/app/pages/OnboardingPage.test.tsx
git commit -m "feat: implement onboarding page with location, cycling preference, weekly goal, and bio"
```

---

### Task 3: Smoke-test the full flow manually

- [ ] **Step 1: Start the Expo dev server**

```bash
cd mobile && npx expo start
```

- [ ] **Step 2: Walk through the full registration → onboarding flow**

1. Open the app on a simulator or device
2. Tap "Create Account" on the home screen
3. Fill in the registration form and submit
4. Confirm the app navigates to the Onboarding screen (not directly to the main tabs)
5. Tap "Use Current Location" — confirm it fills the location field
6. Select a cycling preference pill — confirm it highlights
7. Adjust the weekly goal
8. Tap "Get Started" — confirm the app navigates to the Home tab
9. Navigate to the Profile tab — confirm location, cycling preference, weekly goal, and bio are all populated (not empty)

- [ ] **Step 3: Confirm validation gates work**

1. Return to registration, create a new account
2. On the Onboarding screen, tap "Get Started" with an empty location — confirm alert fires
3. Enter a location, tap "Get Started" with no preference selected — confirm alert fires
