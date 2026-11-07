// Runs the old bundle's pure document-checklist (bj) and application-steps (Mg) functions
// for every country and level, and saves the results as static JSON.
import fs from 'fs';

const s = fs.readFileSync(new URL('./EduBridge.bundle.html', import.meta.url), 'utf8');
const BT = String.fromCharCode(96);
const BS = String.fromCharCode(92);

function endOfFunction(from) {
  let d = 0, q = null, j = s.indexOf('{', from);
  for (; j < s.length; j++) {
    const c = s[j];
    if (q) {
      if (c === BS) { j++; continue; }
      if (c === q && q !== BT) q = null;
      else if (c === BT && q === BT) q = null;
      continue;
    }
    if (c === '"' || c === "'" || c === BT) { q = c; continue; }
    if (c === '{') d++;
    else if (c === '}') { d--; if (d === 0) return j + 1; }
  }
  throw new Error('unterminated function');
}

const a = s.indexOf('fj={required:');
const mgStart = s.indexOf('function Mg(e,a)');
const code = s.slice(a, endOfFunction(mgStart));
const lib = new Function(`const ${code.replace(/^fj=/, 'fj=')}; return { fj, bj, Mg };`.replace('const fj=', 'const fj='))();

const out = { kinds: lib.fj, documents: {}, steps: {} };
for (const c of ['MY', 'HU', 'DE', 'TR', 'KR']) {
  out.documents[c] = {};
  out.steps[c] = {};
  for (const l of ['bachelor', 'master']) {
    out.documents[c][l] = lib.bj(c, l).map(([label, kind]) => ({ label, kind }));
    out.steps[c][l] = lib.Mg(c, l);
  }
}
fs.writeFileSync(new URL('./university-guidance.recovered.json', import.meta.url), JSON.stringify(out, null, 1));
console.log('docs per MY bachelor', out.documents.MY.bachelor.length, 'steps', out.steps.MY.bachelor.length, 'DE master steps', out.steps.DE.master.length);
