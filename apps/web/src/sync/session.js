import { useSyncExternalStore } from 'react';
import { api } from '../lib/api';

/**
 * Who is signed in. A small external store (not part of the app state): the session lives in an HttpOnly cookie, the
 * browser only learns "who am I" from GET /me.
 */
let snapshot = { status: 'loading', me: null, providers: null };
const listeners = new Set();
const set = (next) => {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((l) => l());
};

export async function refreshSession() {
  const providers = await api('/auth/providers').catch(() => null);
  try {
    const me = await api('/me');
    set({ status: 'user', me, providers });
  } catch (e) {
    set({ status: e.status === 401 ? 'anon' : 'offline', me: null, providers });
  }
}

export async function logout() {
  try {
    await api('/auth/logout', { method: 'POST', body: {} });
  } finally {
    set({ status: 'anon', me: null });
  }
}

export async function devLogin(name) {
  await api('/auth/dev-login', { method: 'POST', body: { name } });
  await refreshSession();
}

export const getSession = () => snapshot;

export function useSession() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snapshot,
  );
}

void refreshSession();
