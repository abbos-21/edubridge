import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { isLang, type Lang } from '@edubridge/shared';
import { normalizeProfile, type StudentProfile } from '../lib/profile';
import type { GrowthPlan } from '../lib/growth/plan';

export type Theme = 'system' | 'light' | 'dark';

/** Saved under `edubridge:v1`. On load it is merged with initial(), so a new field only needs a default here. */
export type AppState = {
  lang: Lang;
  theme: Theme;
  compare: string[]; // university ids, max 3
  saved: string[]; // university / grant ids
  /** The student's profile (null until the wizard is finished). Synced to the account when signed in. */
  profile: StudentProfile | null;
  /** Wizard progress, kept in this browser only. */
  onboardingDraft: StudentProfile | null;
  /** Key of the fictional demo student in use ("A", "B", "C"), or null. Demo data is never uploaded. */
  demo: string | null;
  /** The profile-builder plan: chosen ideas and their start months. */
  growth: GrowthPlan;
};

export const STORAGE_KEY = 'edubridge:v1';
export const MAX_COMPARE = 3;

export const initial = (): AppState => ({ lang: 'uz', theme: 'system', compare: [], saved: [], profile: null, onboardingDraft: null, demo: null, growth: { items: [] } });

function load(): AppState {
  const base = initial();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<AppState> & Record<string, unknown>;
    return {
      ...base,
      ...parsed,
      lang: isLang(parsed.lang) ? parsed.lang : base.lang,
      compare: Array.isArray(parsed.compare) ? parsed.compare.filter((x): x is string => typeof x === 'string').slice(0, MAX_COMPARE) : [],
      saved: Array.isArray(parsed.saved) ? parsed.saved.filter((x): x is string => typeof x === 'string') : [],
      profile: normalizeProfile(parsed.profile),
      onboardingDraft: normalizeProfile(parsed.onboardingDraft),
      demo: typeof parsed.demo === 'string' ? parsed.demo : null,
      growth: normalizeGrowth(parsed.growth),
    };
  } catch {
    return base; // private window / blocked storage / corrupt value
  }
}

export function normalizeGrowth(raw: unknown): GrowthPlan {
  const items = (raw as { items?: unknown } | null)?.items;
  if (!Array.isArray(items)) return { items: [] };
  return {
    items: items
      .filter((x): x is { ideaId: string; start: number } => !!x && typeof (x as { ideaId?: unknown }).ideaId === 'string' && Number.isInteger((x as { start?: unknown }).start))
      .map((x) => ({ ideaId: x.ideaId, start: x.start })),
  };
}

function persist(state: AppState, previous: Record<string, unknown>) {
  try {
    // Keep fields written by later versions of the app; only overwrite the ones we own.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...previous, ...state }));
  } catch {
    /* storage unavailable: the app keeps working in memory */
  }
}

type Store = AppState & {
  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
  toggleCompare: (id: string) => 'added' | 'removed' | 'full';
  clearCompare: () => void;
  toggleSaved: (id: string) => void;
  resetAll: () => void;
  /** Apply data that came from the server (account sync). Unknown/invalid fields are ignored. */
  applyRemote: (patch: Partial<Pick<AppState, 'lang' | 'theme' | 'compare' | 'saved' | 'profile' | 'growth'>>) => void;
  setProfile: (p: StudentProfile) => void;
  clearProfile: () => void;
  saveDraft: (p: StudentProfile | null) => void;
  startDemo: (key: string, profile: StudentProfile) => void;
  exitDemo: () => void;
  setGrowth: (g: GrowthPlan) => void;
};

const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    let previous: Record<string, unknown> = {};
    try {
      previous = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    } catch {
      /* ignore */
    }
    persist(state, previous);
  }, [state]);

  // The result of toggleCompare must be known synchronously, so it is decided from a ref to the latest state
  // (a value computed inside a setState updater would not be available yet when the function returns).
  const latest = useRef(state);
  latest.current = state;
  const toggleCompare = useCallback((id: string): 'added' | 'removed' | 'full' => {
    const cur = latest.current.compare;
    if (cur.includes(id)) {
      const next = cur.filter((x) => x !== id);
      latest.current = { ...latest.current, compare: next };
      setState((s) => ({ ...s, compare: s.compare.filter((x) => x !== id) }));
      return 'removed';
    }
    if (cur.length >= MAX_COMPARE) return 'full';
    latest.current = { ...latest.current, compare: [...cur, id] };
    setState((s) => (s.compare.includes(id) || s.compare.length >= MAX_COMPARE ? s : { ...s, compare: [...s.compare, id] }));
    return 'added';
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      setLang: (lang) => setState((s) => ({ ...s, lang })),
      setTheme: (theme) => setState((s) => ({ ...s, theme })),
      toggleCompare,
      clearCompare: () => setState((s) => ({ ...s, compare: [] })),
      toggleSaved: (id) => setState((s) => ({ ...s, saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })),
      applyRemote: (patch) =>
        setState((s) => ({
          ...s,
          ...(isLang(patch.lang) ? { lang: patch.lang } : {}),
          ...(patch.theme === 'system' || patch.theme === 'light' || patch.theme === 'dark' ? { theme: patch.theme } : {}),
          ...(Array.isArray(patch.compare) ? { compare: patch.compare.filter((x): x is string => typeof x === 'string').slice(0, MAX_COMPARE) } : {}),
          ...(Array.isArray(patch.saved) ? { saved: patch.saved.filter((x): x is string => typeof x === 'string') } : {}),
          // a profile/plan that arrives from the account replaces a local demo student
          ...('profile' in patch ? { profile: normalizeProfile(patch.profile), demo: null } : {}),
          ...('growth' in patch ? { growth: normalizeGrowth(patch.growth) } : {}),
        })),
      setProfile: (profile) => setState((s) => ({ ...s, profile: { ...profile, completedAt: profile.completedAt ?? new Date().toISOString().slice(0, 10) }, onboardingDraft: null, demo: null })),
      clearProfile: () => setState((s) => ({ ...s, profile: null, onboardingDraft: null, demo: null, growth: { items: [] } })),
      saveDraft: (onboardingDraft) => setState((s) => ({ ...s, onboardingDraft })),
      startDemo: (key, profile) => setState((s) => ({ ...s, profile, demo: key, onboardingDraft: null, growth: { items: [] } })),
      exitDemo: () => setState((s) => ({ ...s, profile: null, demo: null, growth: { items: [] } })),
      setGrowth: (growth) => setState((s) => ({ ...s, growth })),
      resetAll: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        setState(initial());
      },
    }),
    [state, toggleCompare],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('AppStoreProvider missing');
  return v;
}
