import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { installRu, ruLookup } from '../src/i18n/ru';
import recovered from '../src/i18n/ru.recovered.json';
import extra from '../src/i18n/ru.extra.json';
import ui from '../src/i18n/ui.json';
import snapshot from '../src/data/snapshot.json';

installRu(recovered as Record<string, string>, extra as Record<string, string>);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(p) ? [p] : [];
  });
}

// tx('English', 'Uzbek', ...): single-quoted literals, with escaped quotes allowed.
const TX = /\btx\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'/g;
const unescape = (s: string) => s.replace(/\\'/g, "'");

function sourcePairs(): Array<{ file: string; en: string; uz: string }> {
  const out: Array<{ file: string; en: string; uz: string }> = [];
  for (const f of walk(join(__dirname, '../src'))) {
    for (const m of readFileSync(f, 'utf8').matchAll(TX)) out.push({ file: f, en: unescape(m[1]!), uz: unescape(m[2]!) });
  }
  return out;
}

describe('Russian coverage', () => {
  it('finds the tx() calls it is meant to check', () => {
    expect(sourcePairs().length).toBeGreaterThan(100);
  });
  it('every tx() string in the source has a Russian translation', () => {
    const missing = [...new Set(sourcePairs().map((p) => p.en))].filter((en) => ruLookup(en, ['x', 'y']) === null);
    expect(missing).toEqual([]);
  });
  it('every shared UI label (ui.json) has Russian', () => {
    const missing = Object.values(ui as Record<string, { en: string }>)
      .map((v) => v.en)
      .filter((en) => ruLookup(en) === null);
    expect(missing).toEqual([]);
  });
  it('every localised text in the catalogue data has Russian (own ru or dictionary)', () => {
    const missing = new Set<string>();
    (function walkData(o: unknown) {
      if (Array.isArray(o)) o.forEach(walkData);
      else if (o && typeof o === 'object') {
        const r = o as { en?: unknown; uz?: unknown; ru?: unknown };
        if (typeof r.en === 'string' && typeof r.uz === 'string') {
          if (!r.ru && ruLookup(r.en) === null) missing.add(r.en);
        } else Object.values(o).forEach(walkData);
      }
    })(snapshot);
    expect([...missing].slice(0, 20)).toEqual([]);
  });
  it('fills {0} templates', () => {
    expect(ruLookup('Last checked: 3 November')).toContain('3 November');
  });
});

describe('Uzbek strings', () => {
  it('no tx() call has an empty Uzbek text', () => {
    for (const p of sourcePairs()) expect(p.uz.trim(), `${p.file}: ${p.en}`).not.toBe('');
  });
  it('template placeholders match between English and Uzbek', () => {
    const ph = (s: string) => (s.match(/\{\d+\}/g) ?? []).sort().join(',');
    for (const p of sourcePairs()) expect(ph(p.uz), `${p.en}`).toBe(ph(p.en));
  });
});
