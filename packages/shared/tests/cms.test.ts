import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { diffRecords, validateGrantDraft, validateUniversityDraft, zUniversity } from '../src';

const rec = (f: string) => JSON.parse(readFileSync(fileURLToPath(new URL(`../../../data/recovered/${f}`, import.meta.url)), 'utf8'));
const unis = rec('universities.recovered.json').map((x: unknown) => zUniversity.parse(x));
const grants = rec('grants_research.recovered.json');
const TODAY = '2026-11-07';
const u0 = unis.find((u: any) => u.levels.bachelor) as any;
const rules = (r: { issues: Array<{ rule: string }> }) => r.issues.map((i) => i.rule);

describe('university draft rules (ToR F8: no unsourced official fact, no untranslated change)', () => {
  it('every recovered record is acceptable as it stands, so editors are never blocked by old data', () => {
    for (const u of unis) {
      const r = validateUniversityDraft(u, { today: TODAY, published: u });
      expect(r.issues, u.id).toEqual([]);
    }
  });

  it('refuses tuition without a source, a missing or future check date, a bad link', () => {
    const d = structuredClone(u0);
    d.levels.bachelor.sources = [];
    d.levels.bachelor.tuition = { amount: 1, currency: 'USD' };
    expect(rules(validateUniversityDraft(d, { today: TODAY, published: u0 }))).toContain('C1-tuition-source');
    const e = structuredClone(u0);
    e.lastChecked = null;
    expect(rules(validateUniversityDraft(e, { today: TODAY, published: u0 }))).toContain('C1-checked');
    e.lastChecked = '2027-01-01';
    expect(validateUniversityDraft(e, { today: TODAY, published: u0 }).issues[0]!.message).toContain('future');
    const f = structuredClone(u0);
    f.website = 'ftp://example.org';
    expect(rules(validateUniversityDraft(f, { today: TODAY, published: u0 }))).toContain('C-url');
  });

  it('an IELTS number needs its scope; zero tuition needs a note', () => {
    const d = structuredClone(u0);
    d.levels.bachelor.ielts = 6.5;
    d.levels.bachelor.ieltsScope = null;
    expect(rules(validateUniversityDraft(d, { today: TODAY, published: u0 }))).toContain('C3-ielts-scope');
  });

  it('new or changed texts need en + uz + ru; unchanged legacy texts without ru are left alone', () => {
    const d = structuredClone(u0);
    d.levels.bachelor.note = { en: 'a', uz: 'b' };
    expect(rules(validateUniversityDraft(d, { today: TODAY, published: u0 }))).toContain('J-language');
    d.levels.bachelor.note = { en: 'a', uz: 'b', ru: 'в' };
    expect(rules(validateUniversityDraft(d, { today: TODAY, published: u0 }))).not.toContain('J-language');
  });

  it('id, country, order and tier are fixed', () => {
    for (const [k, v] of [['id', 'other'], ['country', 'DE'], ['order', 9], ['tier', u0.tier === 'middle' ? 'selective' : 'middle']] as const) {
      const d = structuredClone(u0);
      d[k] = v;
      expect(rules(validateUniversityDraft(d, { today: TODAY, published: u0 })), k).toContain('structure');
    }
  });
});

describe('grant draft rules', () => {
  const g = grants[0];
  it('every recovered national grant passes as it stands', () => {
    for (const x of grants) expect(validateGrantDraft(x, { today: TODAY, published: x }).issues, x.id).toEqual([]);
  });
  it('needs an official link and a check date', () => {
    const d = { ...g, sources: [], url: null, checked: null };
    const r = validateGrantDraft(d, { today: TODAY, published: g });
    expect(rules(r)).toEqual(expect.arrayContaining(['C1-grant-source', 'C1-checked']));
  });
});

describe('diffRecords', () => {
  it('lists changed leaves, added objects leaf by leaf, and nothing when equal', () => {
    expect(diffRecords({ a: 1 }, { a: 1 })).toEqual([]);
    expect(diffRecords({ a: { b: 1, c: 2 } }, { a: { b: 1, c: 3 } })).toEqual([{ path: 'a.c', before: 2, after: 3 }]);
    expect(diffRecords({ n: null }, { n: { en: 'x', uz: 'y' } }).map((c) => c.path)).toEqual(['n.en', 'n.uz']);
    expect(diffRecords({ s: ['a'] }, { s: ['a', 'b'] })).toEqual([{ path: 's', before: ['a'], after: ['a', 'b'] }]);
  });
});
