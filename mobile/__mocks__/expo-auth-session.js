// Jest mock for expo-auth-session (OAuth foundation — not used in tests yet).
module.exports = {
  makeRedirectUri: jest.fn(() => 'cyclelink://'),
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
};
