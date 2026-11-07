import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { zUniversity } from '@edubridge/shared';
import type { Catalogue } from '../lib/types';

export type CatalogueState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: Catalogue; source: 'api' | 'snapshot'; snapshotDate?: string };

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';
/** The single-file build (claude.ai) has no reachable API: it always uses the dated snapshot. */
const SNAPSHOT_ONLY = import.meta.env.MODE === 'single';

async function getJson<T>(path: string, timeoutMs = 6000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/api/v1${path}`, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function loadFromApi(): Promise<Catalogue> {
  const [countries, unis, grants] = await Promise.all([
    getJson<{ version: number; items: Catalogue['countries'] }>('/catalog/countries'),
    getJson<{ items: unknown[] }>('/catalog/universities'),
    getJson<{ items: Catalogue['grants'] }>('/catalog/grants'),
  ]);
  return {
    version: countries.version,
    countries: countries.items,
    universities: unis.items.map((u) => zUniversity.parse(u)),
    grants: grants.items,
  };
}

async function loadSnapshot(): Promise<{ data: Catalogue; builtAt: string }> {
  const mod = await import('./snapshot.json');
  const s = mod.default as unknown as Catalogue & { builtAt: string };
  return { data: { ...s, universities: s.universities.map((u) => zUniversity.parse(u)) }, builtAt: s.builtAt };
}

const Ctx = createContext<{ state: CatalogueState; reload: () => void } | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogueState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (SNAPSHOT_ONLY) throw new Error('snapshot only');
        const data = await loadFromApi();
        if (!cancelled) setState({ status: 'ready', data, source: 'api' });
      } catch {
        try {
          const { data, builtAt } = await loadSnapshot();
          if (!cancelled) setState({ status: 'ready', data, source: 'snapshot', snapshotDate: builtAt });
        } catch (e) {
          if (!cancelled) setState({ status: 'error', message: e instanceof Error ? e.message : 'load failed' });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setNonce((n) => n + 1);
  }, []);
  const value = useMemo(() => ({ state, reload }), [state, reload]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalogState() {
  const v = useContext(Ctx);
  if (!v) throw new Error('CatalogProvider missing');
  return v;
}

/** Catalogue data for pages that render only when it is ready (see <CatalogGate>). */
export function useCatalog(): Catalogue {
  const { state } = useCatalogState();
  if (state.status !== 'ready') throw new Error('catalogue not ready');
  return state.data;
}
