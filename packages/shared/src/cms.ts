import { LEVELS, zGrant, zUniversity, type University } from './catalogue';
import { checkUniversity } from './rules';

/** One reason a draft cannot be saved or published. `path` points into the record (dot path). */
export type CmsIssue = { rule: string; path: string; message: string };

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const httpUrl = (s: unknown): s is string => {
  if (typeof s !== 'string') return false;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

function validDate(s: unknown, today: string): string | null {
  if (typeof s !== 'string' || !isoDate.test(s) || Number.isNaN(Date.parse(s))) return 'must be a date like 2026-10-30';
  if (s > today) return 'cannot be in the future';
  return null;
}

/** Walks a value and calls fn for every localized pair {en, uz, ru?} with its dot path. */
function eachPair(value: unknown, path: string, fn: (p: string, v: { en?: unknown; uz?: unknown; ru?: unknown }) => void) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) return value.forEach((x, i) => eachPair(x, `${path}.${i}`, fn));
  const o = value as Record<string, unknown>;
  const keys = Object.keys(o);
  if ('en' in o && 'uz' in o && keys.every((k) => k === 'en' || k === 'uz' || k === 'ru')) return fn(path, o);
  for (const k of keys) eachPair(o[k], path ? `${path}.${k}` : k, fn);
}

const get = (o: unknown, path: string): unknown => path.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), o);
const nonEmpty = (x: unknown) => typeof x === 'string' && x.trim().length > 0;

/**
 * Language rule (ToR part J): a localized text that is NEW or CHANGED must have English, Uzbek and Russian.
 * Texts that are unchanged from the published record are left alone: the records imported from the first
 * release keep Russian in the interface dictionary, not in the record, and are not blocked from other edits.
 */
function languageIssues(next: unknown, prev: unknown): CmsIssue[] {
  const out: CmsIssue[] = [];
  eachPair(next, '', (path, v) => {
    const before = prev ? get(prev, path) : undefined;
    const same = before && typeof before === 'object' && JSON.stringify(before) === JSON.stringify(v);
    if (same) return;
    for (const lang of ['en', 'uz', 'ru'] as const) {
      if (!nonEmpty(v[lang])) out.push({ rule: 'J-language', path: `${path}.${lang}`, message: `Missing ${lang.toUpperCase()} text` });
    }
  });
  return out;
}

/** Every string that is a link to a source must be an http(s) URL. */
function universityUrlIssues(u: University): CmsIssue[] {
  const out: CmsIssue[] = [];
  const chk = (p: string, v: unknown) => {
    if (v != null && v !== '' && !httpUrl(v)) out.push({ rule: 'C-url', path: p, message: 'Must be an http(s) link' });
  };
  chk('website', u.website);
  chk('admissions', u.admissions);
  chk('apply', u.apply);
  chk('fee.source', u.fee?.source);
  chk('ranking.source.url', u.ranking?.source?.url);
  chk('ranking.url', u.ranking?.url);
  for (const lvl of LEVELS) {
    const l = u.levels[lvl];
    if (!l) continue;
    (l.sources ?? []).forEach((s, i) => chk(`levels.${lvl}.sources.${i}`, s));
    chk(`levels.${lvl}.tuition.source`, l.tuition?.source);
    chk(`levels.${lvl}.deadline.source`, l.deadline?.source);
    chk(`levels.${lvl}.apply`, l.apply);
    chk(`levels.${lvl}.example.url`, l.example?.url);
  }
  return out;
}

export type ValidateOpts = { today?: string; published?: unknown };

/**
 * Everything that must hold before a university draft can be SAVED (and again before it is published).
 * An official value without a source, a missing check date, a bad link or a changed text without all
 * three languages is refused. Structural fields (id, country, order, tier) cannot change here.
 */
export function validateUniversityDraft(input: unknown, opts: ValidateOpts = {}): { ok: true; record: University; issues: [] } | { ok: false; record?: University; issues: CmsIssue[] } {
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const parsed = zUniversity.safeParse(input);
  if (!parsed.success) {
    return { ok: false, issues: parsed.error.issues.map((i) => ({ rule: 'schema', path: i.path.join('.'), message: i.message })) };
  }
  const u = parsed.data;
  const issues: CmsIssue[] = [];
  for (const v of checkUniversity(u)) issues.push({ rule: v.rule, path: '', message: v.message });
  issues.push(...universityUrlIssues(u));
  if (!u.website) issues.push({ rule: 'C1-website', path: 'website', message: 'The official website is required' });
  const d = validDate(u.lastChecked, today);
  if (d) issues.push({ rule: 'C1-checked', path: 'lastChecked', message: `Check date ${d}` });
  const prev = opts.published as Record<string, unknown> | undefined;
  if (prev) {
    for (const f of ['id', 'country', 'order', 'tier'] as const) {
      if (prev[f] !== (u as Record<string, unknown>)[f]) issues.push({ rule: 'structure', path: f, message: `${f} cannot be changed in a draft` });
    }
  }
  issues.push(...languageIssues(u, prev));
  return issues.length ? { ok: false, record: u, issues } : { ok: true, record: u, issues: [] };
}

/** Sources of a grant: the shared grant schema uses `sources`, the secondary scholarships use url/infoUrl/applyUrl/source. */
export function grantSourceUrls(g: Record<string, unknown>): string[] {
  const urls = [g.url, g.infoUrl, g.applyUrl, g.source, ...(Array.isArray(g.sources) ? g.sources : [])];
  return urls.filter(httpUrl);
}

export function validateGrantDraft(input: unknown, opts: ValidateOpts & { checked?: unknown } = {}): { ok: boolean; issues: CmsIssue[] } {
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const parsed = zGrant.safeParse(input);
  if (!parsed.success) return { ok: false, issues: parsed.error.issues.map((i) => ({ rule: 'schema', path: i.path.join('.'), message: i.message })) };
  const g = parsed.data as Record<string, unknown>;
  const issues: CmsIssue[] = [];
  if (grantSourceUrls(g).length === 0) issues.push({ rule: 'C1-grant-source', path: 'sources', message: 'A scholarship needs at least one official source link' });
  for (const [k, v] of Object.entries({ url: g.url, infoUrl: g.infoUrl, applyUrl: g.applyUrl, source: g.source })) {
    if (v != null && v !== '' && !httpUrl(v)) issues.push({ rule: 'C-url', path: k, message: 'Must be an http(s) link' });
  }
  (Array.isArray(g.sources) ? g.sources : []).forEach((s, i) => {
    if (!httpUrl(s)) issues.push({ rule: 'C-url', path: `sources.${i}`, message: 'Must be an http(s) link' });
  });
  const d = validDate(g.checked, today);
  if (d) issues.push({ rule: 'C1-checked', path: 'checked', message: `Check date ${d}` });
  const prev = opts.published as Record<string, unknown> | undefined;
  if (prev && prev.id !== g.id) issues.push({ rule: 'structure', path: 'id', message: 'id cannot be changed in a draft' });
  issues.push(...languageIssues(g, prev));
  return { ok: issues.length === 0, issues };
}

// ---------------------------------------------------------------- diff

export type FieldChange = { path: string; before: unknown; after: unknown };

/** Flat list of changed leaves between two records (arrays compared as a whole when their elements are not objects). */
export function diffRecords(before: unknown, after: unknown, path = ''): FieldChange[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
  // A newly added (or removed) object is listed leaf by leaf, so a new note shows as note.en / note.uz / note.ru.
  const b0 = before == null && isObj(after) ? {} : before;
  const a0 = after == null && isObj(before) ? {} : after;
  if (isObj(b0) && isObj(a0)) {
    const keys = new Set([...Object.keys(b0), ...Object.keys(a0)]);
    return [...keys].sort().flatMap((k) => diffRecords(b0[k], a0[k], path ? `${path}.${k}` : k));
  }
  if (Array.isArray(before) && Array.isArray(after) && before.some((x) => x && typeof x === 'object') ) {
    const n = Math.max(before.length, after.length);
    return Array.from({ length: n }, (_, i) => diffRecords(before[i], after[i], `${path}.${i}`)).flat();
  }
  return [{ path, before: before ?? null, after: after ?? null }];
}
