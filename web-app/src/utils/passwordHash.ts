/**
 * SHA-256 hash of a plaintext string.
 * Uses the Web Crypto API in browsers and Node.js 19+;
 * falls back to the Node.js built-in crypto module in older environments.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  const data = new TextEncoder().encode(plaintext)

  if (globalThis.crypto?.subtle) {
    const buf = await globalThis.crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // Fallback for environments without Web Crypto (Node.js < 19, older CI runners)
  const { createHash } = await import('node:crypto')
  return createHash('sha256').update(plaintext).digest('hex')
}
