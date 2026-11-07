import fs from 'fs';
const s = fs.readFileSync('./EduBridge.bundle.html', 'utf8');
const BT = String.fromCharCode(96);
function grab(startMarker) {
  const i = s.indexOf(startMarker);
  if (i < 0) throw new Error('nf ' + startMarker);
  const a = i + startMarker.indexOf('[');
  let d = 0, q = null, j = a;
  for (; j < s.length; j++) {
    const c = s[j];
    if (q) {
      if (c === '\\') { j++; continue; }
      if (c === q) q = null;
      continue;
    }
    if (c === '"' || c === "'" || c === BT) { q = c; continue; }
    if (c === '[' || c === '{' || c === '(') d++;
    else if (c === ']' || c === '}' || c === ')') { d--; if (d === 0) break; }
  }
  return s.slice(a, j + 1);
}
for (const [name, mk] of [['unis', 'Xb=[{id:"universiti-malaya-my"'], ['grants', 'Kb=[{id:"turkiye-burslari"'], ['scholarships_imported', 'Wb=[{id:"chinese-government-scholarship-bilateral"'], ['grants_research', 'Jb=[{name:"Malaysian Technical Cooperation Programme (MTCP) Scholarship"']]) {
  const src = grab(mk);
  
  console.log(name, src.length);
  try {
    const v = new Function('const ja=e=>({...e,last_verified_at:"2026-10-27"});return ' + src)();
    console.log(' ok', v.length, Object.keys(v[0]).slice(0, 30).join(','));
    fs.writeFileSync(name + '.recovered.json', JSON.stringify(v, null, 1));
  } catch (e) { console.log(' eval fail', e.message); }
}
