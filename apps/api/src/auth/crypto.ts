import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const sha256hex = (s: string) => createHash('sha256').update(s).digest('hex');
export const hmacHex = (key: Buffer | string, data: string) => createHmac('sha256', key).update(data).digest('hex');

/** Constant-time string comparison (different lengths are simply unequal). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export const s256Challenge = (verifier: string) => createHash('sha256').update(verifier).digest('base64url');
