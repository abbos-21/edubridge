// Extracts the Russian dictionary (English text -> Russian) from the old minified bundle.
// Some values are minified variable references (e.g. `Tuition:ak`); they are resolved
// by finding the variable's string definition elsewhere in the bundle.
import fs from 'fs';

const s = fs.readFileSync(new URL('./EduBridge.bundle.html', import.meta.url), 'utf8');
const BT = String.fromCharCode(96);
const BS = String.fromCharCode(92);
const start = s.indexOf('mj={"This page uses your student profile"') + 3;

const idStart = /[A-Za-z_$]/;
const idPart = /[A-Za-z0-9_$]/;

let d = 0, q = null, j = start;
let out = '';
const refs = new Map(); // placeholder -> identifier
let lastSig = '';
for (; j < s.length; j++) {
  const c = s[j];
  if (q) {
    out += c;
    if (c === BS) { out += s[++j]; continue; }
    if (c === q) q = null;
    continue;
  }
  if (c === '"' || c === "'" || c === BT) { q = c; out += c; lastSig = c; continue; }
  if (c === '{') d++;
  if (c === '}') { d--; if (d === 0) { out += c; break; } }
  // bare identifier used as a VALUE at depth 1
  if (d === 1 && lastSig === ':' && idStart.test(c)) {
    let k = j;
    while (idPart.test(s[k])) k++;
    const id = s.slice(j, k);
    const next = s[k];
    if (next === ',' || next === '}') {
      const ph = `"__REF_${refs.size}__"`;
      refs.set(`__REF_${refs.size}__`, id);
      out += ph;
      j = k - 1;
      lastSig = 'x';
      continue;
    }
  }
  out += c;
  if (!/\s/.test(c)) lastSig = c;
}

const dict = new Function('return ' + out)();

function resolve(id) {
  const re = new RegExp('[,;{(\\s]' + id.replace(/\$/g, '\\$') + '="((?:[^"\\\\]|\\\\.)*)"');
  const m = s.match(re);
  return m ? JSON.parse('"' + m[1] + '"') : null;
}

let resolved = 0, unresolved = [];
for (const [k, v] of Object.entries(dict)) {
  if (typeof v === 'string' && v.startsWith('__REF_')) {
    const r = resolve(refs.get(v));
    if (r != null) { dict[k] = r; resolved++; } else { delete dict[k]; unresolved.push(k); }
  }
}
fs.writeFileSync(new URL('./ru.dictionary.recovered.json', import.meta.url), JSON.stringify(dict));
console.log('entries', Object.keys(dict).length, 'resolved refs', resolved, 'unresolved', unresolved.length, unresolved.slice(0, 20));
