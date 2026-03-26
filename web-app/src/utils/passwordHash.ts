/**
 * SHA-256 hash of a plaintext string using the Web Crypto API.
 * This app runs in browser-compatible environments, so avoid Node-only imports
 * that break the Vite client build.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  const data = new TextEncoder().encode(plaintext)

  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto API is unavailable in this environment.')
  }

  const buf = await globalThis.crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
