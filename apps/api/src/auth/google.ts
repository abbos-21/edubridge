import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Config } from '../config';

export type GoogleIdentity = { sub: string; nonce?: string };

/** Injectable so tests never call Google. Only the stable user id is used; the email is NOT kept. */
export interface GoogleClient {
  enabled: boolean;
  authUrl(p: { state: string; challenge: string; nonce: string }): string;
  exchange(code: string, verifier: string): Promise<GoogleIdentity>;
}

const AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN = 'https://oauth2.googleapis.com/token';
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export function createGoogleClient(c: Pick<Config, 'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET' | 'GOOGLE_REDIRECT_URI'>): GoogleClient {
  const enabled = !!(c.GOOGLE_CLIENT_ID && c.GOOGLE_CLIENT_SECRET && c.GOOGLE_REDIRECT_URI);
  return {
    enabled,
    authUrl({ state, challenge, nonce }) {
      const q = new URLSearchParams({
        client_id: c.GOOGLE_CLIENT_ID,
        redirect_uri: c.GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid', // no email/profile requested: nothing to store
        state,
        nonce,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        prompt: 'select_account',
      });
      return `${AUTH}?${q}`;
    },
    async exchange(code, verifier) {
      const res = await fetch(TOKEN, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: c.GOOGLE_CLIENT_ID,
          client_secret: c.GOOGLE_CLIENT_SECRET,
          redirect_uri: c.GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
          code_verifier: verifier,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`google token exchange failed (${res.status})`);
      const body = (await res.json()) as { id_token?: string };
      if (!body.id_token) throw new Error('google response has no id_token');
      const { payload } = await jwtVerify(body.id_token, JWKS, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: c.GOOGLE_CLIENT_ID,
      });
      if (!payload.sub) throw new Error('id_token has no subject');
      return { sub: payload.sub, nonce: typeof payload.nonce === 'string' ? payload.nonce : undefined };
    },
  };
}
