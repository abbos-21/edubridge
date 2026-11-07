import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { checkProfile } from '../src/lib/growth/check';
import { rankIdeas } from '../src/lib/growth/rank';
import { IDEAS, CATEGORIES, SIGNALS } from '../src/lib/growth/ideas';
import { buildMonthlyPlan, suggestStart } from '../src/lib/growth/plan';
import { DEFAULT_PROFILE, EXPERIENCE_KEYS, completeness, normalizeProfile, validateStep, type StudentProfile } from '../src/lib/profile';
import personas from '../src/data/demo-personas.json';
import fields from '../src/data/fields.json';

// The ORIGINAL functions from the previous build (generated fixture): the port must behave identically.
const original = createRequire(import.meta.url)('./fixtures/original-growth.cjs') as { jt: any[]; gz: (p: any, group: string, level: string) => any[]; yz: (c: any[], a: any) => any[] };

// A small deterministic generator, so failures are reproducible.
let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)]!;
const maybe = <T,>(v: T, p = 0.6): T | undefined => (rnd() < p ? v : undefined);

function randomProfile(): StudentProfile {
  const exp: Record<string, string> = {};
  for (const k of EXPERIENCE_KEYS) if (rnd() < 0.3) exp[k] = 'Did something real in 2025';
  return {
    ...DEFAULT_PROFILE(),
    field: pick(Object.keys(fields)),
    scale: pick(['percent', 'gpa4', 'gpa5', 'five_point_uz', 'other'] as const),
    score: maybe(Math.round(rnd() * 100 * 10) / 10),
    ielts: maybe(pick([4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8])),
    ieltsParts: maybe({ l: pick([5, 6, 7]), r: pick([5.5, 6.5, 7.5]), w: pick([5, 6]), s: pick([5.5, 6.5]) }, 0.4),
    toefl: maybe(Math.floor(rnd() * 120), 0.3),
    workYears: maybe(Math.floor(rnd() * 5), 0.5),
    experiences: exp,
  };
}

describe('profile check: the port equals the original', () => {
  it('returns the same items, statuses, signals and wording for 400 random profiles in every group and level', () => {
    for (let n = 0; n < 400; n++) {
      const p = randomProfile();
      const group = pick(['selective', 'middle', 'accessible'] as const);
      const level = pick(['bachelor', 'master'] as const);
      const a = checkProfile(p, group, level);
      const b = original.gz(p, group, level);
      expect(a.map((x) => x.id), `ids #${n}`).toEqual(b.map((x: any) => x.id));
      expect(a.map((x) => x.status), `status #${n} ${JSON.stringify(p)}`).toEqual(b.map((x: any) => x.status));
      expect(a.map((x) => x.signals)).toEqual(b.map((x: any) => x.signals));
      expect(a.map((x) => x.now.en)).toEqual(b.map((x: any) => x.now.en));
      expect(a.map((x) => x.now.uz)).toEqual(b.map((x: any) => x.now.uz));
      expect(a.map((x) => x.target)).toEqual(b.map((x: any) => x.target));
      expect(a.map((x) => x.why)).toEqual(b.map((x: any) => x.why));
    }
  });
  it('reports a missing value as "unknown"/"gap", never as a pass', () => {
    const none = checkProfile(DEFAULT_PROFILE(), 'selective', 'master');
    expect(none.find((c) => c.id === 'english')!.status).toBe('gap');
    expect(none.find((c) => c.id === 'grades')!.status).toBe('unknown');
  });
  it('never compares grades across scales (only percent and GPA/4 have a reference)', () => {
    for (const scale of ['gpa5', 'five_point_uz', 'other'] as const) {
      expect(checkProfile({ ...DEFAULT_PROFILE(), scale, score: 99 }, 'middle', 'bachelor').find((c) => c.id === 'grades')!.status).toBe('unknown');
    }
  });
});

describe('idea ranking: the port equals the original', () => {
  it('has the original 36 ideas, unchanged', () => {
    expect(IDEAS).toHaveLength(36);
    expect(IDEAS).toEqual(original.jt);
    expect(Object.keys(CATEGORIES)).toHaveLength(13);
    expect(Object.keys(SIGNALS)).toHaveLength(7);
  });
  it('orders the ideas, scores and reasons identically for 300 random cases', () => {
    for (let n = 0; n < 300; n++) {
      const p = randomProfile();
      const group = pick(['selective', 'middle', 'accessible'] as const);
      const level = pick(['bachelor', 'master'] as const);
      const input = { level, field: p.field, group, months: pick([2, 3, 6, 9, 12, 18]), hours: pick([2, 4, 6, 10]), cost: pick(['free', 'low', 'some'] as const) };
      const a = rankIdeas(checkProfile(p, group, level), input);
      const b = original.yz(original.gz(p, group, level), input);
      expect(a.map((x) => x.idea.id), `order #${n}`).toEqual(b.map((x: any) => x.idea.id));
      expect(a.map((x) => x.score)).toEqual(b.map((x: any) => x.score));
      expect(a.map((x) => x.fits)).toEqual(b.map((x: any) => x.fits));
      expect(a.map((x) => x.reasons)).toEqual(b.map((x: any) => x.reasons));
    }
  });
  it('puts the English plan first when English is the gap, and ranks gap-filling ideas above others', () => {
    const p = { ...DEFAULT_PROFILE(), ielts: 5, field: 'computing' };
    const ranked = rankIdeas(checkProfile(p, 'middle', 'master'), { level: 'master', field: 'computing', group: 'middle', months: 6, hours: 6, cost: 'free' });
    expect(ranked[0]!.idea.id).toBe('english-plan');
    expect(ranked[0]!.reasons.map((r) => r.en)).toContain('English is below your target — fix this first');
  });
  it('every idea is usable: three languages of text, steps, ladder, a CV line with placeholders', () => {
    for (const i of IDEAS) {
      for (const l of [i.title, i.what, i.cv, i.angle, i.pitfall, i.evidence, ...i.steps, ...i.ladder]) {
        expect(l.en.length, i.id).toBeGreaterThan(0);
        expect(l.uz.length, i.id).toBeGreaterThan(0);
      }
      expect(i.steps.length).toBeGreaterThanOrEqual(3);
      expect(i.ladder).toHaveLength(3);
      expect(CATEGORIES[i.cat], i.id).toBeTruthy();
      i.signals.forEach((s) => expect(SIGNALS[s], `${i.id}:${s}`).toBeTruthy());
      // no idea promises an outcome
      expect(JSON.stringify([i.title, i.what, i.angle, i.pitfall]).toLowerCase()).not.toMatch(/guarantee admission|will get in|certain to win/);
    }
  });
});

describe('monthly plan', () => {
  const ideas = IDEAS;
  it('spreads the steps of an idea over its months, in order', () => {
    const idea = ideas.find((i) => i.months >= 3)!;
    const { rows, overflow } = buildMonthlyPlan([{ ideaId: idea.id, start: 1 }], 6, ideas);
    expect(overflow).toEqual([]);
    const placed = rows.flatMap((r) => r.tasks.map((t) => t.stepNo));
    expect(placed).toEqual([...idea.steps.keys()].map((k) => k + 1));
    const months = rows.filter((r) => r.tasks.length).map((r) => r.month);
    expect(Math.max(...months)).toBeLessThanOrEqual(idea.months);
    expect(rows.slice(0, idea.months).every((r) => r.hoursPerWeek === idea.hours)).toBe(true);
    expect(rows.slice(idea.months).every((r) => r.hoursPerWeek === 0)).toBe(true);
  });
  it('adds hours when ideas overlap and flags an idea that does not fit in the time available', () => {
    const [a, b] = ideas;
    const both = buildMonthlyPlan([{ ideaId: a!.id, start: 1 }, { ideaId: b!.id, start: 1 }], 12, ideas);
    expect(both.rows[0]!.hoursPerWeek).toBe(a!.hours + b!.hours);
    const long = ideas.reduce((x, y) => (y.months > x.months ? y : x));
    expect(buildMonthlyPlan([{ ideaId: long.id, start: 1 }], 1, ideas).overflow).toHaveLength(1);
    expect(buildMonthlyPlan([{ ideaId: a!.id, start: 0 }], 12, ideas).overflow).toHaveLength(1);
  });
  it('suggests a later start when the hours would be overloaded', () => {
    const a = ideas.find((i) => i.months === 2)!;
    const b = ideas.find((i) => i.id !== a.id && i.months >= 2)!;
    const start = suggestStart([{ ideaId: a.id, start: 1 }], b, 12, a.hours + b.hours - 1, ideas);
    expect(start).toBeGreaterThan(1);
    expect(suggestStart([], b, 12, 100, ideas)).toBe(1);
  });
});

describe('profile model', () => {
  it('validates each wizard step the way the original wizard did', () => {
    const d = DEFAULT_PROFILE();
    expect(validateStep(0, d)).toMatchObject({ name: 'name' });
    expect(validateStep(0, { ...d, name: 'A', birthYear: 1900 })).toMatchObject({ birthYear: 'year' });
    expect(validateStep(0, { ...d, name: 'A', birthYear: 2008 })).toEqual({});
    expect(validateStep(1, { ...d, score: 101 })).toMatchObject({ score: 'score' });
    expect(validateStep(1, { ...d, scale: 'gpa4', score: 4.5 })).toMatchObject({ score: 'score' });
    expect(validateStep(1, { ...d, scale: 'gpa4', score: 3.9 })).toEqual({});
    expect(validateStep(2, { ...d, ielts: 6.3 })).toMatchObject({ ielts: 'ielts' });
    expect(validateStep(2, { ...d, ielts: 6.5, toefl: 130, sat: 300 })).toMatchObject({ toefl: 'toefl', sat: 'sat' });
    expect(validateStep(3, { ...d, tuitionBudget: 5000, totalBudget: 3000 })).toMatchObject({ totalBudget: 'total' });
    expect(validateStep(3, { ...d, tuitionBudget: -1 })).toMatchObject({ tuitionBudget: 'money' });
    expect(validateStep(5, { ...d, workYears: 80 })).toMatchObject({ workYears: 'work' });
  });
  it('normalizes old or partial stored data over the defaults', () => {
    expect(normalizeProfile(null)).toBeNull();
    expect(normalizeProfile([1])).toBeNull();
    const p = normalizeProfile({ name: 'X', preferredCountries: ['MY', 5], experiences: null })!;
    expect(p.name).toBe('X');
    expect(p.preferredCountries).toEqual(['MY']);
    expect(p.experiences).toEqual({});
    expect(p.citizenship).toBe('Uzbekistan');
  });
  it('completeness counts what matters and ends at 100 for a full profile', () => {
    expect(completeness(DEFAULT_PROFILE())).toBeLessThan(40);
    const full = { ...DEFAULT_PROFILE(), name: 'A', qualification: 'x', score: 90, ielts: 7, totalBudget: 5000, preferredCountries: ['MY'], experiences: { research: 'did' } };
    expect(completeness(full)).toBe(100);
  });
  it('the three demo students are fictional, labelled "(demo)", and pass the profile validation', () => {
    expect(personas.Fg).toHaveLength(3);
    for (const d of personas.Fg) {
      const p = normalizeProfile(d.profile)!;
      expect(p.name).toMatch(/\(demo\)/);
      for (let step = 0; step < 6; step++) expect(validateStep(step, p), `${p.name} step ${step}`).toEqual({});
    }
  });
});
