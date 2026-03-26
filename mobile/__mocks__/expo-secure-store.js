// Jest mock for expo-secure-store.
// Backed by a plain in-memory object so tests are isolated and fast.
const store = {};

module.exports = {
  setItemAsync: jest.fn(async (key, value) => {
    store[key] = value;
  }),
  getItemAsync: jest.fn(async (key) => store[key] ?? null),
  deleteItemAsync: jest.fn(async (key) => {
    delete store[key];
  }),
  // Expose for test setup/teardown
  __clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
};
