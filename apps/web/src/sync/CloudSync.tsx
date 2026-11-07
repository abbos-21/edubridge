import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../auth/AuthProvider';
import { STORAGE_KEY, useStore } from '../store/AppStore';
import type { StudentProfile } from '../lib/profile';
import type { GrowthPlan } from '../lib/growth/plan';

type SyncStatus = 'idle' | 'syncing' | 'error';
type Versioned<T> = { data: T; version: number };
type Settings = { lang?: string; theme?: string; compare?: string[] };

type Cloud = {
  status: SyncStatus;
  /** A new account with data on this device: offer to upload it. */
  needsUpload: boolean;
  upload: () => Promise<{ imported: Record<string, number | boolean> } | null>;
  dismissUpload: () => void;
};

const Ctx = createContext<Cloud>({ status: 'idle', needsUpload: false, upload: async () => null, dismissUpload: () => {} });
export const useCloud = () => useContext(Ctx);

const DEBOUNCE_MS = 800;

/**
 * Keeps the student's data in sync with their account: settings (language, theme, compare list), saved items,
 * the profile and the profile-builder plan. Rules: the server copy wins when a stale write is rejected (409);
 * nothing is sent for guests; a fictional demo student is never uploaded.
 */
export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const store = useStore();
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [needsUpload, setNeedsUpload] = useState(false);
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const hydrating = useRef<string | null>(null);
  const apply = store.applyRemote;

  const versions = useRef<{ settings: number | null; profile: number | null; growth: number | null }>({ settings: null, profile: null, growth: null });
  const lastSent = useRef<{ settings: string; saved: string; profile: string; growth: string }>({ settings: '', saved: '', profile: '', growth: '' });

  const settingsValue: Settings = useMemo(() => ({ lang: store.lang, theme: store.theme, compare: store.compare }), [store.lang, store.theme, store.compare]);
  const profileValue: StudentProfile | null = store.demo ? null : store.profile;

  // ---------------------------------------------------------------- pull on sign-in
  const hydrate = useCallback(
    async (userId: string) => {
      setStatus('syncing');
      try {
        const got = async <T,>(path: string): Promise<Versioned<T> | null> => {
          try {
            return await api<Versioned<T>>(path);
          } catch (e) {
            if (e instanceof ApiError && e.status === 404) return null;
            throw e;
          }
        };
        const [settings, profile, growth, saved] = await Promise.all([
          got<Settings>('/me/settings'),
          got<StudentProfile>('/me/profile'),
          got<GrowthPlan>('/me/growth'),
          api<{ items: Array<{ ref: string }> }>('/me/saved'),
        ]);
        versions.current = { settings: settings?.version ?? null, profile: profile?.version ?? null, growth: growth?.version ?? null };
        if (settings) apply({ lang: settings.data.lang as never, theme: settings.data.theme as never, compare: settings.data.compare });
        if (saved.items.length || settings) apply({ saved: saved.items.map((i) => i.ref) });
        if (profile) apply({ profile: profile.data });
        if (growth) apply({ growth: growth.data });

        // Local data that the account does not have yet is OFFERED for upload, never uploaded silently.
        const localProfile = !store.demo && store.profile ? 1 : 0;
        const localGrowth = store.growth.items.length > 0 ? 1 : 0;
        const offer = (!settings && (store.saved.length > 0 || store.compare.length > 0)) || (!profile && localProfile > 0) || (!growth && localGrowth > 0);
        setNeedsUpload(offer);
        lastSent.current = { settings: '', saved: '', profile: '', growth: '' };
        setHydratedFor(userId);
        setStatus('idle');
      } catch {
        setStatus('error');
      } finally {
        hydrating.current = null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apply],
  );

  useEffect(() => {
    if (!me) {
      setHydratedFor(null);
      versions.current = { settings: null, profile: null, growth: null };
      setNeedsUpload(false);
      return;
    }
    if (hydratedFor !== me.id && hydrating.current !== me.id) {
      hydrating.current = me.id;
      void hydrate(me.id);
    }
  }, [me, hydratedFor, hydrate]);

  const ready = !!me && hydratedFor === me.id && !needsUpload;

  // ---------------------------------------------------------------- push on change
  /** Debounced write of one versioned resource; the server copy wins on a conflict. */
  const usePush = <T,>(key: 'settings' | 'profile' | 'growth', path: string, value: T | null, onServer: (v: T) => void) => {
    const json = JSON.stringify(value);
    useEffect(() => {
      if (!ready || json === lastSent.current[key]) return;
      setStatus('syncing'); // a change is waiting to be sent: never claim "synced" in the meantime
      const t = setTimeout(async () => {
        try {
          if (value === null) {
            if (versions.current[key] != null) await api(path, { method: 'DELETE' });
            versions.current[key] = null;
          } else {
            const v = versions.current[key];
            const r = await api<Versioned<T>>(path, { method: 'PUT', body: { data: value, ...(v != null ? { version: v } : {}) } });
            versions.current[key] = r.version;
          }
          lastSent.current[key] = json;
          setStatus('idle');
        } catch (e) {
          const server = e instanceof ApiError && e.status === 409 ? (e.details as { server?: Versioned<T> } | undefined)?.server : undefined;
          if (server) {
            versions.current[key] = server.version;
            onServer(server.data);
            lastSent.current[key] = '';
            setStatus('idle');
          } else setStatus('error');
        }
      }, DEBOUNCE_MS);
      return () => clearTimeout(t);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [json, ready]);
  };

  usePush<Settings>('settings', '/me/settings', settingsValue, (s) => apply({ lang: s.lang as never, theme: s.theme as never, compare: s.compare }));
  usePush<StudentProfile>('profile', '/me/profile', profileValue, (p) => apply({ profile: p }));
  usePush<GrowthPlan>('growth', '/me/growth', store.growth.items.length || versions.current.growth != null ? store.growth : null, (g) => apply({ growth: g }));

  // saved items are a plain set: last write wins
  const savedJson = JSON.stringify(store.saved);
  useEffect(() => {
    if (!ready || savedJson === lastSent.current.saved) return;
    setStatus('syncing');
    const t = setTimeout(async () => {
      try {
        await api('/me/saved', { method: 'PUT', body: { items: store.saved.map((ref) => ({ kind: 'any', ref })) } });
        lastSent.current.saved = savedJson;
        setStatus('idle');
      } catch {
        setStatus('error');
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedJson, ready]);

  const upload = useCallback(async () => {
    if (!me) return null;
    try {
      setStatus('syncing');
      let state: Record<string, unknown> = {};
      try {
        state = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      } catch {
        /* empty */
      }
      if (store.demo) delete state.profile; // fictional data is never uploaded
      delete state.onboardingDraft;
      const r = await api<{ imported: Record<string, number | boolean> }>('/me/import-local', { method: 'POST', body: { state } });
      setNeedsUpload(false);
      setHydratedFor(null);
      return r;
    } catch {
      setStatus('error');
      return null;
    }
  }, [me, store.demo]);

  const value = useMemo<Cloud>(() => ({ status, needsUpload, upload, dismissUpload: () => setNeedsUpload(false) }), [status, needsUpload, upload]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
