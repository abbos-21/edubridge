import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError } from '../lib/api';

export type Me = {
  id: string;
  lang: string;
  role: 'student' | 'editor' | 'admin';
  createdAt: string;
  aiSuspended: boolean;
  identities: Array<{ provider: 'telegram' | 'google'; createdAt: string }>;
};
export type Providers = { telegram: { botUsername: string } | null; google: boolean; dev: boolean };

type AuthState = {
  status: 'loading' | 'ready';
  me: Me | null;
  providers: Providers | null;
  /** The API could not be reached (guests keep working offline). */
  offline: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);
/** The single-file claude.ai build has no API: accounts are off there. */
const NO_API = import.meta.env.MODE === 'single';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Pick<AuthState, 'status' | 'me' | 'providers' | 'offline'>>({
    status: NO_API ? 'ready' : 'loading',
    me: null,
    providers: null,
    offline: NO_API,
  });

  const refresh = useCallback(async () => {
    if (NO_API) return;
    let me: Me | null = null;
    let offline = false;
    try {
      me = (await api<{ user: Me | null }>('/auth/session')).user;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) me = null;
      else offline = true;
    }
    let providers: Providers | null = null;
    if (!offline) {
      try {
        providers = await api<Providers>('/auth/providers');
      } catch {
        /* optional */
      }
    }
    setState({ status: 'ready', me, providers, offline });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST', body: {} });
    } finally {
      await refresh();
    }
  }, [refresh]);

  const value = useMemo(() => ({ ...state, refresh, logout }), [state, refresh, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('AuthProvider missing');
  return v;
}
