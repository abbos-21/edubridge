import type { Level, University } from '@edubridge/shared';
import type { CatalogueSnapshot } from '../lib/catalogRepo';

/**
 * What the AI is allowed to know. Official facts come ONLY from catalogue records chosen here (at most 20 per
 * request), and the student's profile is reduced to a minimal form (no name, birth year or institution).
 * Ported from the previous build's context module, re-targeted at the database catalogue.
 */

export const MAX_RECORDS = 20;

type Rec = Record<string, any>;

/** The only profile data that reaches the AI. Never the name, birth year or school. */
export function minimalProfile(p: Rec | null | undefined): Rec | null {
  if (!p || typeof p !== 'object') return null;
  const year = new Date().getFullYear();
  const drop = (o: Rec) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '' && v !== null));
  return drop({
    currentEducation: p.currentEducation,
    targetLevel: p.targetLevel,
    field: p.field,
    major: p.major || undefined,
    applicationYear: p.applicationYear,
    intake: p.intake || undefined,
    approxAge: typeof p.birthYear === 'number' ? year - p.birthYear : undefined,
    qualification: p.qualification || undefined,
    grade: p.score != null ? `${p.score} (${p.scale}${p.scaleOther ? `: ${p.scaleOther}` : ''})` : undefined,
    graduationYear: p.graduationYear,
    achievements: p.achievements || undefined,
    ielts: p.ielts,
    ieltsParts: p.ieltsParts,
    toefl: p.toefl,
    sat: p.sat,
    otherLanguage: p.otherLanguage || undefined,
    planningExam: p.planningExam,
    budget: drop({ currency: p.currency, tuitionPerYear: p.tuitionBudget, totalPerYear: p.totalBudget, needsFullFunding: p.needsFullFunding, partialOk: p.partialOk, canShowFunds: p.canShowFunds }),
    preferredCountries: p.preferredCountries,
    avoidCountries: p.avoidCountries,
    instructionPref: p.instructionPref,
    workYears: p.workYears,
    experiences: p.experiences && Object.keys(p.experiences).length ? p.experiences : undefined,
  });
}

const en = (l: any): string | undefined => (l && typeof l === 'object' ? l.en : undefined);

export function uniRecord(snap: CatalogueSnapshot, id: string, level?: Level): Rec | null {
  const u = snap.universities.find((x) => x.id === id);
  if (!u) return null;
  const country = snap.countries.find((c) => c.code === u.country);
  const one = (lv: Level) => {
    const r = u.levels[lv];
    if (!r) return { level: lv, open: 'unknown' };
    return {
      level: lv,
      open: r.open,
      academic: en(r.academic),
      language: en(r.language),
      exams: en(r.exams),
      note: en(r.note),
      ielts: r.ielts ?? undefined,
      ieltsScope: r.ielts != null ? r.ieltsScope : undefined,
      deadline: r.deadline ? { date: r.deadline.date, intake: r.deadline.intake, note: en(r.deadline.note) } : null,
      intakeText: en(r.intake),
      tuition: r.tuition ? { amount: r.tuition.amount, max: r.tuition.amount_max, currency: r.tuition.currency, per: r.tuition.per, year: r.tuition.year, note: en(r.tuition.note) } : null,
      exampleProgramme: r.example ? { name: r.example.name, requirement: en(r.example.req), url: r.example.url } : null,
      sources: r.sources,
    };
  };
  return {
    type: 'university',
    id: u.id,
    name: u.name,
    country: en((country as Rec | undefined)?.name),
    city: u.city,
    sector: u.type,
    website: u.website,
    admissions: u.admissions,
    apply: u.apply,
    checked: u.lastChecked,
    levels: level ? [one(level)] : [one('bachelor'), one('master')],
  };
}

export function grantRecord(snap: CatalogueSnapshot, id: string): Rec | null {
  const g = snap.grants.find((x) => x.id === id);
  if (!g) return null;
  const country = snap.countries.find((c) => c.code === g.country);
  if (g.kind === 'national') {
    return {
      type: 'grant', id: g.id, name: g.name, country: en((country as Rec | undefined)?.name), levels: g.levels,
      who: en(g.who), criteria: en(g.criteria), covers: g.covers, amounts: en(g.stipendText), extras: en(g.extras),
      notCovered: en(g.notCovered), deadline: en(g.deadline), universities: en(g.universities), tracks: en(g.tracks),
      url: g.url, sources: g.sources, checked: g.checked,
    };
  }
  // "other" scholarships (older import): a smaller, differently shaped record
  return {
    type: 'scholarship', id: g.id, name: g.name, country: g.country, levels: g.levels, coverage: en(g.coverageDetail),
    academic: en(g.academic), language: en(g.languageReq), url: g.infoUrl ?? g.url, checked: g.last_verified_at ?? g.checked,
  };
}

export type Target = { kind: 'none' } | { kind: 'uni'; id: string; level: Level } | { kind: 'grant'; id: string } | { kind: 'custom'; name: string };

const GRANT_WORDS: Array<[RegExp, string]> = [
  [/mtcp/, 'mtcp'], [/\bmis\b|malaysia international/, 'mis'], [/t[üu]rkiye|burs/, 'turkiye-burslari'],
  [/stipendium|hungaric/, 'stipendium-hungaricum'], [/daad|epos/, 'daad-epos'], [/gks|global korea|kgsp/, 'gks-u'], [/gks|global korea|kgsp/, 'gks-g'],
];

export function collectUrls(v: unknown, into = new Set<string>()): Set<string> {
  if (typeof v === 'string') {
    if (/^https?:\/\//.test(v)) into.add(v);
  } else if (Array.isArray(v)) v.forEach((x) => collectUrls(x, into));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => collectUrls(x, into));
  return into;
}

/** Chooses the official records (at most 20) the model may use, from the question, the target and what the student saved. */
export function ground(question: string, ctx: { target?: Target; saved?: string[]; planIds?: string[] }, snap: CatalogueSnapshot) {
  const records: Rec[] = [];
  const seen = new Set<string>();
  const add = (key: string, rec: Rec | null) => {
    if (rec && !seen.has(key) && records.length < MAX_RECORDS) {
      seen.add(key);
      records.push(rec);
    }
  };
  const t = ctx.target;
  if (t?.kind === 'uni') add(`u:${t.id}`, uniRecord(snap, t.id, t.level));
  if (t?.kind === 'grant') add(`g:${t.id}`, grantRecord(snap, t.id));

  const q = question.toLowerCase();
  const words = q.split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2);
  for (const u of snap.universities) {
    const short = (u.short ?? '').toLowerCase();
    const hay = `${u.name} ${u.short ?? ''}`.toLowerCase();
    if ((short.length > 2 && q.includes(short)) || words.some((w) => w.length > 4 && hay.includes(w))) add(`u:${u.id}`, uniRecord(snap, u.id));
  }
  const national = snap.grants.filter((g) => g.kind === 'national');
  for (const [re, id] of GRANT_WORDS) if (re.test(q)) add(`g:${id}`, grantRecord(snap, id));
  for (const g of national) {
    const c = snap.countries.find((x) => x.code === g.country) as Rec | undefined;
    if (c && (q.includes(String(en(c.name)).toLowerCase()) || q.includes(String(c.name?.uz ?? '').toLowerCase().slice(0, 6)))) add(`g:${g.id}`, grantRecord(snap, g.id));
  }
  for (const id of [...(ctx.planIds ?? []), ...(ctx.saved ?? [])]) {
    if (snap.universities.some((u) => u.id === id)) add(`u:${id}`, uniRecord(snap, id));
    else if (snap.grants.some((g) => g.id === id)) add(`g:${id}`, grantRecord(snap, id));
  }
  if (/countr|davlat|budget|byudjet|afford|cheap|arzon|cost|narx|where|qayer|стран|бюджет|дешев|стоим/.test(q)) for (const g of national) add(`g:${g.id}`, grantRecord(snap, g.id));
  for (const g of snap.grants.filter((x) => x.kind === 'other')) {
    if (words.some((w) => w.length > 4 && g.name.toLowerCase().includes(w))) add(`g:${g.id}`, grantRecord(snap, g.id));
  }
  return { records, urls: collectUrls(records) };
}

export type TargetExtras = { prompt?: string; wordLimit?: number; notes?: string };

/** The "Target: …" paragraph of document prompts. Official facts about the target are included from the catalogue only. */
export function targetBlock(target: Target | undefined, extras: TargetExtras | undefined, snap: CatalogueSnapshot): string {
  const parts: string[] = [];
  if (!target || target.kind === 'none') {
    parts.push('Target: none given. Evaluate the document on its own; give the relevance/fit score as null and say a target is needed to judge fit.');
  } else if (target.kind === 'uni') {
    const rec = uniRecord(snap, target.id, target.level);
    const tier = snap.universities.find((u) => u.id === target.id)?.tier;
    const group =
      tier === 'selective' ? 'HIGHLY SELECTIVE — judge against strong competing applicants'
      : tier === 'middle' ? 'balanced — a solid, well-evidenced profile is expected'
      : tier === 'accessible' ? 'more accessible — lower published requirements, but a clear and credible application still matters'
      : 'unknown';
    parts.push(
      `Target: ${rec?.name ?? target.id}, ${target.level === 'bachelor' ? "bachelor's" : "master's"} level. EduBridge group: ${group}.`,
      `Official facts held by EduBridge (verified on the university's pages; may be general rather than programme-specific): ${JSON.stringify(rec)}`,
    );
  } else if (target.kind === 'grant') {
    parts.push('Scholarship selection is competitive: judge against strong competing applicants.');
    parts.push(`Target: ${snap.grants.find((g) => g.id === target.id)?.name ?? target.id}.`, `Official facts held by EduBridge: ${JSON.stringify(grantRecord(snap, target.id))}`);
  } else {
    parts.push(`Target named by the student (EduBridge holds no verified record of it): ${target.name}. Do not state any requirement of it as fact.`);
  }
  if (extras?.prompt?.trim()) parts.push(`Essay prompt / questions the student says the application asks (treat as the student's copy of the official text): """${extras.prompt.trim().slice(0, 3000)}"""`);
  if (extras?.wordLimit) parts.push(`Word limit the student says applies: ${extras.wordLimit} words.`);
  if (extras?.notes?.trim()) parts.push(`Other instructions the student says apply: """${extras.notes.trim().slice(0, 1500)}"""`);
  return parts.join('\n');
}

export type { University };
