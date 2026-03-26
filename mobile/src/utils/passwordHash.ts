// =============================================================================
// PASSWORD HASH UTILITY
// Wraps expo-crypto for SHA-256 password hashing.
// In Jest, __mocks__/expo-crypto.js intercepts this import automatically.
// Passwords are NEVER stored or transmitted in plaintext.
// =============================================================================

import { digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';

/**
 * Returns a SHA-256 hex digest of the given plaintext string.
 * Used to hash passwords before storage/comparison in mock mode.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, plaintext);
}
