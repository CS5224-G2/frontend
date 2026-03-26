// Jest mock for expo-apple-authentication (OAuth foundation — not used in tests yet).
module.exports = {
  signInAsync: jest.fn(async () => ({
    identityToken: 'mock-apple-identity-token',
    authorizationCode: 'mock-apple-auth-code',
    fullName: { givenName: 'Apple', familyName: 'User' },
    email: 'apple.user@privaterelay.appleid.com',
  })),
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
};
