// =============================================================================
// PASSWORD HASH UTILITY
// Wraps expo-crypto for SHA-256 password hashing.
// Falls back to Node.js crypto in Jest/test environments.
// Passwords are NEVER stored or transmitted in plaintext.
// =============================================================================

const IS_TEST_ENV = Boolean(process.env.JEST_WORKER_ID);

/**
 * Returns a SHA-256 hex digest of the given plaintext string.
 * Used to hash passwords before storage/comparison in mock mode.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  if (IS_TEST_ENV) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createHash } = require('crypto') as typeof import('crypto');
    return createHash('sha256').update(plaintext).digest('hex');
  }
  const { digestStringAsync, CryptoDigestAlgorithm } = await import('expo-crypto');
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, plaintext);
}
