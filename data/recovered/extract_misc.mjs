// Extracts further data objects from the old minified bundle: UI dictionary (en/uz),
// country names + taglines, tier descriptions, per-country admission guidance, "how chosen" text.
import fs from 'fs';

const s = fs.readFileSync(new URL('./EduBridge.bundle.html', import.meta.url), 'utf8');
const BT = String.fromCharCode(96);
const BS = String.fromCharCode(92);
const idStart = /[A-Za-z_$]/;
const idPart = /[A-Za-z0-9_$]/;

/** Reads the {...} or [...] literal that starts at `open`; bare identifiers used as values become null. */
function grab(open) {
  const openCh = s[open];
  const closeCh = openCh === '{' ? '}' : ']';
  let d = 0, q = null, out = '', lastSig = '';
  const nulled = new Set();
  for (let j = open; j < s.length; j++) {
    const c = s[j];
    if (q) {
      out += c;
      if (c === BS) { out += s[++j]; continue; }
      if (c === q) q = null;
      continue;
    }
    if (c === '"' || c === "'" || c === BT) { q = c; out += c; lastSig = c; continue; }
    if (c === '{' || c === '[') d++;
    if (c === '}' || c === ']') { d--; if (d === 0) { out += c; break; } }
    if ((lastSig === ':' || lastSig === '[' || lastSig === ',') && idStart.test(c) && lastSig !== ',' ) {
      let k = j;
      while (idPart.test(s[k])) k++;
      const id = s.slice(j, k);
      const nx = s[k];
      if ((nx === ',' || nx === '}' || nx === ']') && !['true', 'false', 'null', 'void'].includes(id) && id.length <= 3) {
        nulled.add(id);
        out += 'null';
        j = k - 1;
        lastSig = 'x';
        continue;
      }
    }
    out += c;
    if (!/\s/.test(c)) lastSig = c;
  }
  return { value: new Function('return ' + out)(), nulled: [...nulled] };
}

function at(marker, offsetToOpen) {
  const i = s.indexOf(marker);
  if (i < 0) throw new Error('marker not found: ' + marker);
  return grab(i + offsetToOpen);
}

const outDir = new URL('./', import.meta.url);
const save = (name, v) => fs.writeFileSync(new URL(name, outDir), JSON.stringify(v, null, 1));

const dict = at('nS=tS({"nav.home"', 'nS=tS('.length);
save('ui.dictionary.recovered.json', dict.value);
console.log('ui dictionary keys', Object.keys(dict.value).length, 'nulled', dict.nulled);

const countries = at(',ta={MY:{name:', ',ta='.length);
save('countries.recovered.json', countries.value);
const tiers = at('jn={selective:{name:', 'jn='.length);
save('tiers.recovered.json', tiers.value);
const guidance = at('Cg={MY:{bachelor:', 'Cg='.length);
save('country-guidance.recovered.json', guidance.value);
console.log('countries', Object.keys(countries.value), 'tiers', Object.keys(tiers.value), 'guidance', Object.keys(guidance.value));

// how the 10 were chosen (Qb) and the check date (Vb)
const qb = s.match(/[,;\s]Qb=/);
const qi = s.indexOf(qb[0]) + qb[0].length;
const selection = grab(qi);
save('selection.recovered.json', selection.value);
console.log('selection', JSON.stringify(selection.value).slice(0, 300));
const vb = s.match(/[,;\s]Vb="([^"]+)"/);
console.log('checked', vb && vb[1]);
