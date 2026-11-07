// Ports the AI prompts from the old minified bundle into a readable TypeScript module.
// The prompt TEXT is copied verbatim; only the minified identifiers are renamed.
// Usage: node extract_prompts.mjs --check   (list every occurrence of each minified name)
//        node extract_prompts.mjs            (write ../../apps/api/src/ai/prompts.ts)
import fs from 'fs';

const s = fs.readFileSync(new URL('./EduBridge.bundle.html', import.meta.url), 'utf8');
const start = s.indexOf('const vi=e=>e==="uz"?"Uzbek (Latin script');
const end = s.indexOf('const Cz=["not_ready"');
if (start < 0 || end < 0 || end < start) throw new Error('prompt region not found');
let src = s.slice(start, end);

const RENAME = {
  vi: 'langName', vr: 'byLang', bi: 'IDENTITY', fz: 'chatInstructions', Jd: 'SCORE_ANCHORS', Zd: 'CRITICAL_METHOD',
  ty: 'READINESS_NOTE', vz: 'cvPrompt', bz: 'LETTER_TYPE_NOTES', kz: 'letterPrompt', xz: 'IMPROVE_ACTIONS',
  wz: 'IMPROVE_ACTION_TEXT', jz: 'improvePrompt', Sz: 'interviewQuestionsPrompt', zz: 'interviewFeedbackPrompt',
  qz: 'consistencyPrompt', Ez: 'ocrPrompt', Az: 'auditPrompt', Tz: 'growthIdeasPrompt', Nz: 'activityReviewPrompt',
};

if (process.argv.includes('--check')) {
  for (const k of Object.keys(RENAME)) {
    const re = new RegExp('(?<![A-Za-z0-9_$])' + k.replace('$', '\\$') + '(?![A-Za-z0-9_$])', 'g');
    const hits = [...src.matchAll(re)].map((m) => src.slice(Math.max(0, m.index - 12), m.index + k.length + 12).replace(/\n/g, ' '));
    console.log(k, '->', RENAME[k], hits.length, JSON.stringify(hits.slice(0, 4)));
  }
  console.log('segment bytes', src.length);
  process.exit(0);
}

for (const [k, v] of Object.entries(RENAME)) {
  const re = new RegExp('(?<![A-Za-z0-9_$.])' + k.replace('$', '\\$') + '(?![A-Za-z0-9_$:])', 'g');
  src = src.replace(re, v);
}
// top-level functions are exported; the const chain is exported by an explicit list at the end
src = src.replace(/(^|[;}])function (\w+)\(/g, '$1export function $2(');
const header = `// @ts-nocheck
/**
 * AI PROMPTS — ported from the previous EduBridge build (apps/web bundle), see data/recovered/extract_prompts.mjs.
 * The prompt text is verbatim; only the minified identifiers were renamed. Do not weaken the honesty rules in
 * IDENTITY (no probabilities, no invented facts, official facts only from the supplied records).
 * Each prompt function takes a plain options object and returns the full prompt string.
 */
`;
const footer = `
export { langName, byLang, IDENTITY, SCORE_ANCHORS, CRITICAL_METHOD, READINESS_NOTE, LETTER_TYPE_NOTES, IMPROVE_ACTIONS, IMPROVE_ACTION_TEXT };
`;
const out = new URL('../../apps/api/src/ai/prompts.ts', import.meta.url);
fs.mkdirSync(new URL('./', out), { recursive: true });
fs.writeFileSync(out, header + src + footer);
console.log('written', src.length, 'bytes');
