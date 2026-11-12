/**
 * The student's working papers besides the profile: budget scenarios, statement drafts (with revisions), the CV text
 * and roadmap ticks. They live in the app store, stay in this browser for guests and sync to the account for
 * signed-in students (as two documents: plans+budgets, and writing).
 */
export const LINE_KEYS = ['tuition', 'accommodation', 'food', 'transport', 'insurance', 'visa', 'travel', 'other'] as const;
export type LineKey = (typeof LINE_KEYS)[number];
export type Line = { value: number | null; basis: 'official' | 'estimate' };
export type Scenario = { id: string; name: string; oppId?: string; currency: string; years: number; lines: Record<LineKey, Line>; family: number | null; award: number | null; awardCovers: 'none' | 'tuition' | 'all' };

export type Draft = { text: string; answers: Record<string, string>; revisions: Array<{ at: string; words: number; text: string }>; wordLimit?: number };

export type SavedComparison = { id: string; name: string; ids: string[]; level: 'bachelor' | 'master' };
export type Workspace = { budgets: Scenario[]; drafts: Record<string, Draft>; cv: string; roadmap: Record<string, boolean>; docChecks: Record<string, boolean>; reminderDays: number; comparisons: SavedComparison[]; guide: Guide };
export type Guide = 'duo' | 'male' | 'female';
export const GUIDES: Guide[] = ['duo', 'male', 'female'];
export const emptyWorkspace = (): Workspace => ({ budgets: [], drafts: {}, cv: '', roadmap: {}, docChecks: {}, reminderDays: 30, comparisons: [], guide: 'duo' });

export const normalizeComparisons = (raw: unknown): SavedComparison[] =>
  Array.isArray(raw)
    ? raw
        .filter((x): x is SavedComparison => isObj(x) && typeof x.id === 'string' && typeof x.name === 'string' && Array.isArray(x.ids))
        .map((x) => ({ id: x.id, name: x.name.slice(0, 80), ids: x.ids.filter((i): i is string => typeof i === 'string').slice(0, 3), level: (x.level === 'master' ? 'master' : 'bachelor') as 'bachelor' | 'master' }))
        .slice(0, 30)
    : [];

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);

export function normalizeBudgets(raw: unknown): Scenario[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is Scenario => isObj(x) && typeof x.id === 'string' && isObj(x.lines) && typeof x.currency === 'string');
}

export function normalizeDrafts(raw: unknown): Record<string, Draft> {
  if (!isObj(raw)) return {};
  const out: Record<string, Draft> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!isObj(v)) continue;
    out[k] = {
      text: typeof v.text === 'string' ? v.text : '',
      answers: isObj(v.answers) ? (v.answers as Record<string, string>) : {},
      revisions: Array.isArray(v.revisions) ? (v.revisions as Draft['revisions']).filter((r) => isObj(r) && typeof r.text === 'string') : [],
      wordLimit: typeof v.wordLimit === 'number' ? v.wordLimit : undefined,
    };
  }
  return out;
}

export const normalizeRoadmap = (raw: unknown): Record<string, boolean> => (isObj(raw) ? Object.fromEntries(Object.entries(raw).filter(([, v]) => typeof v === 'boolean')) as Record<string, boolean> : {});

export function normalizeWorkspace(raw: unknown): Workspace {
  const r = isObj(raw) ? raw : {};
  return { budgets: normalizeBudgets(r.budgets), drafts: normalizeDrafts(r.drafts), cv: typeof r.cv === 'string' ? r.cv : '', roadmap: normalizeRoadmap(r.roadmap), docChecks: normalizeRoadmap(r.docChecks), reminderDays: [7, 14, 30, 60].includes(r.reminderDays as number) ? (r.reminderDays as number) : 30, comparisons: normalizeComparisons(r.comparisons), guide: (GUIDES as unknown[]).includes(r.guide) ? (r.guide as Guide) : 'duo' };
}

/** The server accepts about 500 KB per document: drop the oldest saved revisions first so a push is never refused for size. */
export function fitWriting(doc: { drafts: Record<string, Draft>; cv: string; roadmap: Record<string, boolean>; docChecks?: Record<string, boolean>; reminderDays?: number; comparisons?: SavedComparison[]; guide?: Guide }, limit = 450_000) {
  let d = doc;
  for (let keep = 10; keep >= 0 && JSON.stringify(d).length > limit; keep -= 2) {
    d = { ...d, drafts: Object.fromEntries(Object.entries(d.drafts).map(([k, v]) => [k, { ...v, revisions: v.revisions.slice(0, keep) }])) };
  }
  return d;
}

/** Before these lived in the store they had their own browser keys; read them once so nothing is lost. */
export function legacyWorkspace(): Partial<Workspace> {
  const read = (k: string) => {
    try {
      const v = localStorage.getItem(k);
      return v == null ? undefined : JSON.parse(v);
    } catch {
      return undefined;
    }
  };
  return { budgets: normalizeBudgets(read('edubridge:budget')), drafts: normalizeDrafts(read('edubridge:drafts')), cv: (() => { try { return localStorage.getItem('edubridge:cv') ?? ''; } catch { return ''; } })(), roadmap: normalizeRoadmap(read('edubridge:roadmap')), docChecks: normalizeRoadmap(read('edubridge:doc-checks')) };
}
