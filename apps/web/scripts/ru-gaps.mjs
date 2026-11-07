// Lists every tx('English', ...) string in src/ that has no Russian yet (dictionary lookup by English text).
// Usage: node scripts/ru-gaps.mjs            -> prints the gaps
//        node scripts/ru-gaps.mjs --json     -> prints them as a JSON object to paste into src/i18n/ru.extra.json
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(root, 'src/i18n', f), 'utf8'));
const dict = { ...load('ru.recovered.json'), ...load('ru.extra.json') };
const exact = new Set(Object.keys(dict).filter((k) => !/\{\d+\}/.test(k)));
const BS = String.fromCharCode(92);
const patterns = Object.keys(dict)
  .filter((k) => /\{\d+\}/.test(k))
  .map((k) => new RegExp('^' + k.replace(/[.*+?^$()|[\]\\]/g, BS + '$&').replace(/\{\d+\}/g, '(.+?)') + '$'));

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(p) ? [p] : []; });
const re = new RegExp("\\btx\\(\\s*'((?:[^'\\\\]|\\\\.)*)'\\s*,", 'g');
const missing = new Set();
for (const f of walk(join(root, 'src'))) {
  for (const m of readFileSync(f, 'utf8').matchAll(re)) {
    const en = m[1].split(BS + "'").join("'");
    if (!exact.has(en) && !patterns.some((p) => p.test(en))) missing.add(en);
  }
}
if (process.argv.includes('--json')) console.log(JSON.stringify(Object.fromEntries([...missing].map((k) => [k, ''])), null, 1));
else console.log([...missing].join('\n'), '\n--', missing.size, 'missing');
