import { SchemaError, arr, isObj, num, optQuote, quoteIn, score, str, strList, type Quote } from './text';

/**
 * Every structured AI reply is validated before it is shown. A malformed reply throws SchemaError and is
 * reported as an error — it is never turned into a fake analysis. Quotes are checked against the student's text.
 * Ported from the previous build's validators (same fields, limits and rules).
 */

export const READINESS = ['not_ready', 'substantial_revision', 'moderate_improvement', 'nearly_ready', 'final_proofreading'] as const;
export type Readiness = (typeof READINESS)[number];
const readiness = (x: unknown): Readiness => ((READINESS as readonly string[]).includes(x as string) ? (x as Readiness) : 'substantial_revision');

export const CV_SCORES = ['structure', 'academic', 'experience', 'impact', 'skills', 'language', 'relevance'] as const;
export const LETTER_SCORES = ['authenticity', 'academic', 'fit', 'evidence', 'career', 'structure', 'writing', 'compliance'] as const;
export const INTERVIEW_SCORES = ['clarity', 'authenticity', 'relevance', 'evidence', 'communication', 'alignment'] as const;

export type Score = { key: string; score: number | null; reason: string };

/** Always returns every expected key, in order; a missing one is "not assessed" (null), never invented. */
function scores(x: unknown, keys: readonly string[]): Score[] {
  const given = arr(x).filter(isObj).map((s) => ({ key: str(s.key, 40), score: score(s.score), reason: str(s.reason, 800) }));
  return keys.map((k) => given.find((g) => g.key === k) ?? { key: k, score: null, reason: '' });
}

const severity = (x: unknown) => (x === 'high' || x === 'low' ? x : 'medium');
const SEV = ['high', 'medium', 'low'];

/** Fields shared by the CV and letter analyses. `doc` is the student's raw text, for quote verification. */
function common(e: Record<string, any>, doc: string) {
  return {
    firstImpression: str(e.first_impression, 1500),
    claims: arr(e.claims)
      .filter(isObj)
      .map((c) => ({ claim: str(c.claim, 400), evidence: optQuote(doc, c.evidence), verdict: c.verdict === 'supported' || c.verdict === 'weak' ? c.verdict : 'unsupported' }))
      .filter((c) => c.claim)
      .slice(0, 15),
    redFlags: arr(e.red_flags)
      .filter(isObj)
      .map((f) => ({ flag: str(f.flag, 600), quote: optQuote(doc, f.quote), severity: severity(f.severity) }))
      .filter((f) => f.flag)
      .sort((a, b) => SEV.indexOf(a.severity) - SEV.indexOf(b.severity))
      .slice(0, 12),
    audit: strList(e.audit_notes, 15),
    reviewed: Array.isArray(e.audit_notes),
  };
}

const improvements = (x: unknown) =>
  arr(x)
    .filter(isObj)
    .map((s, i) => ({ priority: num(s.priority) ?? i + 1, change: str(s.change), why: str(s.why) }))
    .filter((s) => s.change)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 12);

export function validateCv(e: unknown, doc: string) {
  if (!isObj(e)) throw new SchemaError('not an object');
  const overall = str(e.overall);
  const r = {
    ...common(e, doc),
    kind: 'cv' as const,
    overall,
    readiness: readiness(e.readiness),
    scores: scores(e.scores, CV_SCORES),
    strengths: arr(e.strengths).filter(isObj).map((s) => ({ point: str(s.point), evidence: optQuote(doc, s.evidence), why: str(s.why) })).filter((s) => s.point).slice(0, 10),
    weaknesses: arr(e.weaknesses).filter(isObj).map((s) => ({ point: str(s.point), evidence: optQuote(doc, s.evidence), consequence: str(s.consequence) })).filter((s) => s.point).slice(0, 12),
    sections: arr(e.sections).filter(isObj).map((s) => ({ section: str(s.section, 120), assessment: str(s.assessment), issues: strList(s.issues, 8) })).filter((s) => s.section).slice(0, 15),
    improvements: improvements(e.improvements),
    rewrites: arr(e.rewrites)
      .filter(isObj)
      .map((s) => ({ original: quoteIn(doc, str(s.original, 1500)), improved: str(s.improved, 1500), why: str(s.why), missingInfo: str(s.missing_info) || null }))
      .filter((s) => s.original.quote && s.improved)
      .slice(0, 8),
    questions: strList(e.questions, 10),
    actionPlan: strList(e.action_plan, 5),
    limits: strList(e.limits, 8),
  };
  if (!overall || r.strengths.length + r.weaknesses.length === 0) throw new SchemaError('missing core fields');
  return r;
}

export function validateLetter(e: unknown, doc: string) {
  if (!isObj(e)) throw new SchemaError('not an object');
  const verdict = str(e.verdict);
  const comp = isObj(e.compliance) ? e.compliance : {};
  const status = comp.status === 'met' || comp.status === 'issues' ? comp.status : 'cannot_confirm';
  const r = {
    ...common(e, doc),
    kind: 'letter' as const,
    fourQuestions: arr(e.four_questions)
      .filter(isObj)
      .map((o) => ({ question: str(o.question, 60), answered: o.answered === 'yes' || o.answered === 'partly' ? o.answered : 'no', comment: str(o.comment, 600) }))
      .filter((o) => o.question)
      .slice(0, 4),
    verdict,
    readiness: readiness(e.readiness),
    scores: scores(e.scores, LETTER_SCORES),
    works: arr(e.works).filter(isObj).map((o) => ({ quote: quoteIn(doc, str(o.quote, 1500)), why: str(o.why) })).filter((o) => o.quote.quote).slice(0, 8),
    weakens: arr(e.weakens).filter(isObj).map((o) => ({ quote: quoteIn(doc, str(o.quote, 1500)), why: str(o.why), fix: str(o.fix) })).filter((o) => o.quote.quote).slice(0, 12),
    generic: arr(e.generic).filter(isObj).map((o) => ({ quote: quoteIn(doc, str(o.quote, 1500)), why: str(o.why), ask: str(o.ask) })).filter((o) => o.quote.quote).slice(0, 12),
    missing: strList(e.missing, 10),
    paragraphs: arr(e.paragraphs).filter(isObj).map((o, i) => ({ n: num(o.n) ?? i + 1, role: str(o.role, 120), assessment: str(o.assessment), issues: strList(o.issues, 8) })).filter((o) => o.assessment).slice(0, 30),
    improvements: improvements(e.improvements),
    compliance: { status: status as 'met' | 'issues' | 'cannot_confirm', notes: strList(comp.notes, 8) },
    questions: strList(e.questions, 10),
    limits: strList(e.limits, 8),
  };
  if (!verdict || r.works.length + r.weakens.length + r.generic.length + r.paragraphs.length === 0) throw new SchemaError('missing core fields');
  return r;
}

export function validateImprovement(e: unknown) {
  if (!isObj(e)) throw new SchemaError('not an object');
  const revised = str(e.revised, 8000);
  if (!revised) throw new SchemaError('no revised text');
  return {
    revised,
    changes: arr(e.changes).filter(isObj).map((c) => ({ what: str(c.what), why: str(c.why) })).filter((c) => c.what).slice(0, 12),
    questions: strList(e.questions, 8),
    warnings: strList(e.warnings, 8),
  };
}

export function validateQuestions(e: unknown) {
  const q = arr(isObj(e) ? e.questions : e)
    .map((t) => (isObj(t) ? { q: str(t.q, 600), why: str(t.why, 600) } : { q: str(t, 600), why: '' }))
    .filter((t) => t.q)
    .slice(0, 12);
  if (q.length < 3) throw new SchemaError('too few questions');
  return q;
}

export function validateFeedback(e: unknown) {
  if (!isObj(e)) throw new SchemaError('not an object');
  const r = {
    effective: strList(e.effective, 8),
    weak: strList(e.weak, 8),
    missing: strList(e.missing, 8),
    improve: strList(e.improve, 8),
    stronger: str(e.stronger, 3000),
    strongerNote: str(e.stronger_note, 600),
    scores: scores(e.scores, INTERVIEW_SCORES),
    followUp: str(e.follow_up, 600) || null,
  };
  if (!r.weak.length && !r.effective.length && !r.improve.length) throw new SchemaError('empty feedback');
  return r;
}

export function validateConsistency(e: unknown, cv: string, letter: string) {
  if (!isObj(e)) throw new SchemaError('not an object');
  const r = {
    summary: str(e.summary),
    consistent: strList(e.consistent, 10),
    inconsistencies: arr(e.inconsistencies)
      .filter(isObj)
      .map((s) => ({ issue: str(s.issue), cvQuote: optQuote(cv, s.cv_quote), letterQuote: optQuote(letter, s.letter_quote), verify: str(s.verify) }))
      .filter((s) => s.issue)
      .slice(0, 12),
    ignoredCvItems: strList(e.ignored_cv_items, 10),
    interests: str(e.interests),
    goals: str(e.goals),
  };
  if (!r.summary) throw new SchemaError('no summary');
  return r;
}

export type OcrPage = { n: number; text: string; legible: 'yes' | 'partial' | 'no' };
export function validateOcr(e: unknown): { pages: OcrPage[] } {
  const pages = arr(isObj(e) ? e.pages : e)
    .filter(isObj)
    .map((t, i) => ({ n: num(t.n) ?? i + 1, text: str(t.text, 20000), legible: (t.legible === 'yes' || t.legible === 'partial' ? t.legible : 'no') as OcrPage['legible'] }));
  if (!pages.length) throw new SchemaError('no pages');
  return { pages };
}

export function validateGrowth(e: unknown) {
  if (!isObj(e)) throw new SchemaError('not an object');
  const r = {
    diagnosis: str(e.diagnosis),
    themes: arr(e.themes).filter(isObj).map((t) => ({ theme: str(t.theme, 200), why: str(t.why, 800) })).filter((t) => t.theme).slice(0, 4),
    ideas: arr(e.ideas)
      .filter(isObj)
      .map((t) => ({ title: str(t.title, 200), why: str(t.why_for_you, 1000), steps: strList(t.steps, 8), output: str(t.output, 600), cvLine: str(t.cv_line, 500), angle: str(t.essay_angle, 800), risk: str(t.risk, 600), months: num(t.months), hours: num(t.hours_per_week) }))
      .filter((t) => t.title && t.steps.length)
      .slice(0, 8),
    avoid: arr(e.avoid).filter(isObj).map((t) => ({ what: str(t.what, 300), why: str(t.why, 600) })).filter((t) => t.what).slice(0, 6),
    questions: strList(e.questions, 8),
  };
  if (!r.diagnosis || !r.ideas.length) throw new SchemaError('missing core fields');
  return r;
}

export function validateReview(e: unknown) {
  if (!isObj(e)) throw new SchemaError('not an object');
  const r = {
    verdict: str(e.verdict),
    strength: e.strength === 'strong' || e.strength === 'moderate' ? e.strength : ('weak' as const),
    shows: strList(e.shows, 8),
    doubts: strList(e.doubts, 8),
    stronger: strList(e.stronger, 8),
    ladder: strList(e.ladder, 3),
    cvLine: str(e.cv_line, 500),
    questions: strList(e.questions, 8),
  };
  if (!r.verdict) throw new SchemaError('no verdict');
  return r;
}

export type { Quote };
