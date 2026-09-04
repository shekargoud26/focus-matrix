/**
 * Portable password hashing via WebCrypto PBKDF2 (SHA-256, 210k iterations).
 * Uses only `crypto.subtle` + `crypto.getRandomValues` so it runs unmodified
 * on Cloudflare Workers, Node.js, and Bun — no native C bindings.
 */

const ITERATIONS = 210_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const PREFIX = 'pbkdf2';

function bytesToB64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: ITERATIONS },
    key,
    KEY_BYTES * 8,
  );
  return `${PREFIX}$${ITERATIONS}$${bytesToB64(salt)}$${bytesToB64(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [prefix, iterStr, saltB64, hashB64] = stored.split('$');
    if (prefix !== PREFIX || !iterStr || !saltB64 || !hashB64) return false;
    const iterations = Number(iterStr);
    if (!Number.isInteger(iterations) || iterations <= 0) return false;
    const salt = b64ToBytes(saltB64);
    const expected = b64ToBytes(hashB64);
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
      'deriveBits',
    ]);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
      key,
      expected.length * 8,
    );
    const actual = new Uint8Array(bits);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
}
