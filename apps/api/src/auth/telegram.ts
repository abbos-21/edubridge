import { createHash } from 'node:crypto';
import { hmacHex, safeEqual } from './crypto';

export type TelegramLoginPayload = {
  id: number | string;
  auth_date: number | string;
  hash: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export const TELEGRAM_MAX_AGE_SECONDS = 600; // 10 minutes

export type TelegramResult = { ok: true; id: string } | { ok: false; reason: 'bad_hash' | 'expired' | 'malformed' | 'not_configured' };

/**
 * Verifies a Telegram Login Widget payload: HMAC-SHA256 over the sorted fields with
 * a key derived from the bot token, and a freshness window on auth_date.
 * https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramLogin(payload: Record<string, unknown>, botToken: string, nowMs = Date.now()): TelegramResult {
  if (!botToken) return { ok: false, reason: 'not_configured' };
  const { hash, ...rest } = payload;
  if (typeof hash !== 'string' || !/^[0-9a-f]{64}$/i.test(hash)) return { ok: false, reason: 'malformed' };
  const id = rest.id;
  const authDate = Number(rest.auth_date);
  if ((typeof id !== 'number' && typeof id !== 'string') || String(id) === '' || !Number.isFinite(authDate)) {
    return { ok: false, reason: 'malformed' };
  }
  const dataCheckString = Object.keys(rest)
    .filter((k) => rest[k] !== undefined && rest[k] !== null)
    .sort()
    .map((k) => `${k}=${String(rest[k])}`)
    .join('\n');
  const secretKey = createHash('sha256').update(botToken).digest();
  const expected = hmacHex(secretKey, dataCheckString);
  if (!safeEqual(expected, hash.toLowerCase())) return { ok: false, reason: 'bad_hash' };
  const ageSeconds = nowMs / 1000 - authDate;
  if (ageSeconds > TELEGRAM_MAX_AGE_SECONDS || ageSeconds < -60) return { ok: false, reason: 'expired' };
  return { ok: true, id: String(id) };
}

/** Rejects a payload that was already used (replay). In-memory: fine for one API instance. */
export class ReplayGuard {
  private seen = new Map<string, number>();
  constructor(private ttlMs = TELEGRAM_MAX_AGE_SECONDS * 1000 + 60_000) {}
  /** Returns false when the key was already used. */
  use(key: string, nowMs = Date.now()): boolean {
    for (const [k, t] of this.seen) if (nowMs - t > this.ttlMs) this.seen.delete(k);
    if (this.seen.has(key)) return false;
    this.seen.set(key, nowMs);
    return true;
  }
}

/** Test helper: signs a payload exactly like Telegram does. */
export function signTelegramPayload(fields: Record<string, string | number>, botToken: string): Record<string, string | number> {
  const dcs = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n');
  const hash = hmacHex(createHash('sha256').update(botToken).digest(), dcs);
  return { ...fields, hash };
}
