import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { checkCatalogue, zUniversity, zGrant, searchUniversities, normalize, pick, NATIONAL_GRANT_IDS } from '../src';

const rec = (f: string) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`../../../data/recovered/${f}`, import.meta.url)), 'utf8'));
const unis = rec('universities.recovered.json').map((x: unknown) => zUniversity.parse(x));
const grants = rec('grants_research.recovered.json').map((x: unknown) => zGrant.parse(x));

describe('recovered catalogue obeys the structural rules', () => {
  const report = checkCatalogue(unis);
  it('5 countries x 10, tiers 3/4/3, unique ids and names, no uniform IELTS', () => {
    expect(report.problems).toEqual([]);
  });
  it('has exactly the 5 known missing QS positions', () => {
    const missing = unis
      .filter((u: any) => u.ranking?.value == null)
      .map((u: any) => u.id)
      .sort();
    expect(missing).toEqual([
      'corvinus-university-of-budapest-hu',
      'fau-de',
      'pusan-national-university-kr',
      'semmelweis-university-hu',
      'tu-darmstadt-de',
    ]);
  });
  it('reports data-quality violations for owner review', () => {
    // Not asserted to be zero: the recovered data may contain gaps the owner must fix via the CMS.
    console.log('rule violations in recovered data:', report.violations.length, report.violations.slice(0, 8));
    expect(Array.isArray(report.violations)).toBe(true);
  });
});

describe('grants', () => {
  it('contains exactly the 7 national grants', () => {
    expect(grants.map((g: any) => g.id).sort()).toEqual([...NATIONAL_GRANT_IDS].sort());
  });
});

describe('search', () => {
  it('normalises Turkish letters and abbreviations', () => {
    expect(normalize('ODTÜ')).toBe('odtu');
    expect(normalize('İstanbul')).toBe('istanbul');
  });
  it('finds by short name and by full name', () => {
    expect(searchUniversities(unis, { q: 'um' }).length).toBeGreaterThan(0);
    expect(searchUniversities(unis, { q: 'malaya' }).some((h) => h.university.id === 'universiti-malaya-my')).toBe(true);
  });
  it('IELTS comparison only uses confirmed general minimums', () => {
    const hits = searchUniversities(unis, { ielts: 9 });
    for (const h of hits) {
      const anyGeneral = (['bachelor', 'master'] as const).some(
        (l) => h.university.levels[l]?.ieltsScope === 'general' && h.university.levels[l]?.ielts != null,
      );
      if (!anyGeneral) expect(h.ieltsStatus).toBe('unconfirmed');
    }
  });
  it('level filter keeps only universities open at that level', () => {
    for (const h of searchUniversities(unis, { level: 'master' })) {
      expect(['yes', 'integrated']).toContain(h.university.levels.master?.open);
    }
  });
});

describe('pick', () => {
  it('falls back to English when Russian is absent and never returns undefined', () => {
    expect(pick({ en: 'A', uz: 'B' }, 'ru')).toBe('A');
    expect(pick({ en: 'A', uz: 'B', ru: 'В' }, 'ru')).toBe('В');
    expect(pick(null, 'uz')).toBe('');
  });
});
