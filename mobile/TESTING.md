# Mobile Testing Guide

This project uses **Jest** and **React Native Testing Library** for unit and integration testing.

## Running Tests

From the `mobile` directory:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run a specific test file
npm test src/app/pages/HomePage.test.tsx
```

## Testing Patterns

### 1. Mocking Navigation

Most pages use `useNavigation` and `useRoute`. You must mock these to avoid errors and verify navigation calls.

```tsx
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: jest.fn((callback) => callback()),
}));
```

### 2. Mocking Authentication

Wrap your component in an `AuthContext.Provider` (from `src/app/AuthContext`) during render to provide a controlled authentication state.

`AuthContext` now exposes `isRestoring`, `user`, and async `login`/`logout`. Always include the full shape in test providers:

```tsx
<AuthContext.Provider
  value={{
    isRestoring: false,
    isLoggedIn: false,
    role: null,
    user: null,
    login: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn().mockResolvedValue(undefined),
  }}
>
  {component}
</AuthContext.Provider>
```

Also mock `oauthService` in any test that renders `LoginPage` or `RegisterPage`:

```ts
jest.mock('../../services/oauthService', () => ({
  loginWithGoogle: jest.fn().mockResolvedValue(undefined),
  loginWithApple:  jest.fn().mockResolvedValue(undefined),
  OAuthNotImplementedError: class OAuthNotImplementedError extends Error {},
}));
```

### 3. Mocking Secure Storage

`expo-secure-store` is automatically intercepted by `__mocks__/expo-secure-store.js` (an in-memory store). No extra setup is needed in test files. Call `require('expo-secure-store').__clear()` in `afterEach` if you need a clean slate between tests.

### 3. Isolated Integration

Instead of rendering the entire application, test transitions between specific pages by rendering a dedicated `Stack.Navigator` within your test case. This ensures stability while validating cross-page logic.

## Recommended Examples

- `src/app/pages/HomePage.test.tsx`: Focus effects and navigation.
- `src/app/pages/EditProfilePage.test.tsx`: Form handling and service mocks.
- `src/app/pages/RideHistoryPage.test.tsx`: Async data loading and state toggling.
