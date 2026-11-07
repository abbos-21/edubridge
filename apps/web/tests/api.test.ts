import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '../src/lib/api';

const ok = (body: unknown, status = 200) => new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

beforeEach(() => {
  document.cookie = 'eb_csrf=tok123; path=/';
});
afterEach(() => {
  vi.restoreAllMocks();
  document.cookie = 'eb_csrf=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
});

describe('api client', () => {
  it('sends cookies, and echoes the CSRF cookie in a header for writes only', async () => {
    const f = vi.fn().mockImplementation(() => Promise.resolve(ok({ ok: true })));
    vi.stubGlobal('fetch', f);
    await api('/me');
    await api('/me', { method: 'PATCH', body: { lang: 'en' } });
    const [, getInit] = f.mock.calls[0]!;
    const [, patchInit] = f.mock.calls[1]!;
    expect(getInit.credentials).toBe('include');
    expect(getInit.headers['x-csrf-token']).toBeUndefined();
    expect(patchInit.headers['x-csrf-token']).toBe('tok123');
    expect(patchInit.headers['content-type']).toBe('application/json');
  });
  it('maps API errors to ApiError with code, status and details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ error: { code: 'version_conflict', message: 'changed', details: { server: { version: 3 } } } }, 409)));
    await expect(api('/me/settings', { method: 'PUT', body: {} })).rejects.toMatchObject({ status: 409, code: 'version_conflict', details: { server: { version: 3 } } });
  });
  it('handles 204 and non-JSON error bodies', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(ok(null, 204)).mockResolvedValueOnce(new Response('<html>bad gateway</html>', { status: 502 })));
    await expect(api('/auth/logout', { method: 'POST', body: {} })).resolves.toBeUndefined();
    await expect(api('/me')).rejects.toMatchObject({ status: 502, code: 'http_502' });
  });
  it('reports a network failure as status 0, never a thrown TypeError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const err = (await api('/me').catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
  });
});
