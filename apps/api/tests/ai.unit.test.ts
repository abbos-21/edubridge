import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { zUniversity } from '@edubridge/shared';
import * as P from '../src/ai/prompts';
import * as V from '../src/ai/validators';
import { checkLinks, norm, parseJsonObject, quoteIn, SchemaError, numberLines, numberParagraphs } from '../src/ai/text';
import { ground, minimalProfile, targetBlock, MAX_RECORDS } from '../src/ai/context';
import { estimateCostUsd, parsePrices } from '../src/ai/pricing';
import { dayStart } from '../src/ai/guard';
import { mockReply } from '../src/ai/mock';
import { loadConfig } from '../src/config';
import type { CatalogueSnapshot } from '../src/lib/catalogRepo';

const rec = (f: string) => JSON.parse(readFileSync(fileURLToPath(new URL(`../../../data/recovered/${f}`, import.meta.url)), 'utf8'));
const countries = (['MY', 'HU', 'DE', 'TR', 'KR'] as const).map((code, i) => ({ code, position: i + 1, name: { en: { MY: 'Malaysia', HU: 'Hungary', DE: 'Germany', TR: 'Türkiye', KR: 'South Korea' }[code], uz: code } }));
const national = (rec('grants_research.recovered.json') as any[]).map((g) => ({ ...g, kind: 'national' }));
const snap: CatalogueSnapshot = {
  version: 1,
  universities: (rec('universities.recovered.json') as unknown[]).map((u) => zUniversity.parse(u)),
  grants: national,
  countries,
} as never;

describe('prompts carry the honesty rules (ToR C9–C14)', () => {
  it('the advisor identity forbids probabilities, invented facts and unverified claims', () => {
    expect(P.IDENTITY).toMatch(/Never give admission or scholarship probabilities or percentages/);
    expect(P.IDENTITY).toMatch(/Never invent URLs/);
    expect(P.IDENTITY).toMatch(/Use ONLY the official records supplied/);
    expect(P.IDENTITY).toMatch(/You cannot browse the web/);
    expect(P.IDENTITY).toMatch(/Never confuse eligibility/);
    expect(P.IDENTITY).toMatch(/Never invent the student's experiences/);
    expect(P.IDENTITY).toMatch(/Honest, constructive criticism comes before/);
  });
  it('every task prompt starts from the same identity', () => {
    const t = 'Target: none given.';
    const prompts = [
      P.cvPrompt({ lang: 'en', target: t, profile: null, cv: '[L1] x' }),
      P.letterPrompt({ lang: 'en', type: 'motivation', words: 5, target: t, profile: null, text: '[P1] x' }),
      P.auditPrompt({ lang: 'en', kind: 'cv', target: t, doc: 'x', draft: {} }),
      P.improvePrompt({ lang: 'en', docType: 'motivation', action: 'improve', target: t, fullText: 'x', passage: 'y' }),
      P.interviewQuestionsPrompt({ lang: 'en', kind: 'scholarship', count: 5, target: t, background: '' }),
      P.interviewFeedbackPrompt({ lang: 'en', target: t, background: '', earlier: [], question: 'q', answer: 'a' }),
      P.consistencyPrompt({ lang: 'en', letterType: 'motivation', target: t, cv: 'x', letter: 'y' }),
      P.growthIdeasPrompt({ lang: 'en', months: 6, hours: 4, budget: 'low', level: 'master', field: 'cs', group: 'middle', profile: null, interests: '', career: '', gaps: [], existing: '' }),
      P.activityReviewPrompt({ lang: 'en', level: 'master', field: 'cs', group: 'middle', profile: null, activity: 'did a thing' }),
    ];
    for (const p of prompts) expect(p.startsWith(P.IDENTITY)).toBe(true);
  });
  it('analyses carry the score anchors and the critical-reading method; quotes must be exact', () => {
    const cv = P.cvPrompt({ lang: 'en', target: 'T', profile: null, cv: '[L1] x' });
    expect(cv).toContain('SCORE ANCHORS');
    expect(cv).toContain('CRITICAL READING METHOD');
    expect(cv).toMatch(/Do not give 8 or more unless you can quote the evidence/);
    expect(cv).toMatch(/copy text character-for-character/);
    expect(cv).toMatch(/Never invent numbers, employers, results or titles/);
    const letter = P.letterPrompt({ lang: 'en', type: 'motivation', words: 5, target: 'T', profile: null, text: '[P1] x' });
    expect(letter).toMatch(/NEVER invent modules, professors, labs, partnerships or benefits/);
    expect(letter).toMatch(/Never say the document will or is likely to win an offer or award/);
  });
  it('rewrites must use [placeholders] and keep the student\'s facts', () => {
    const p = P.improvePrompt({ lang: 'en', docType: 'motivation', action: 'specific', target: 'T', fullText: 'x', passage: 'y' });
    expect(p).toMatch(/\[placeholder in square brackets\]/);
    expect(p).toMatch(/Preserve the student's real experiences/);
  });
  it('the chat prompt grounds answers in the supplied records, today\'s date, and asks for follow-ups', () => {
    const p = P.chatInstructions({ lang: 'en', depth: 'normal', today: '2026-11-07', profile: null, plans: [], saved: [], sharedDocs: [], records: [{ id: 'x', name: 'Rec' }] });
    expect(p).toContain('TODAY: 2026-11-07');
    expect(p).toContain('"name":"Rec"');
    expect(p).toMatch(/FOLLOWUPS:/);
    expect(p).toMatch(/Use ONLY URLs from the records below/);
    expect(p).toMatch(/Dates in the records may be from a past cycle/);
    expect(p).toContain('DOCUMENTS: none shared.');
  });
  it('the language instruction is honoured: Uzbek Latin, Russian, English; Russian gets Russian section headings', () => {
    expect(P.langName('uz')).toMatch(/Uzbek \(Latin script/);
    expect(P.langName('ru')).toMatch(/^Russian/);
    expect(P.langName('en')).toBe('English');
    const ru = P.chatInstructions({ lang: 'ru', depth: 'normal', today: 'x', profile: null, plans: [], saved: [], sharedDocs: [], records: [] });
    expect(ru).toContain('Коротко');
    expect(ru).toContain('Reply in Russian');
  });
  it('deep mode asks for a more thorough answer', () => {
    const p = P.chatInstructions({ lang: 'en', depth: 'deep', today: 'x', profile: null, plans: [], saved: [], sharedDocs: [], records: [] });
    expect(p).toMatch(/DEEPER explanation/);
  });
  it('documents are only included when the caller passes them', () => {
    const none = P.chatInstructions({ lang: 'en', depth: 'normal', today: 'x', profile: null, plans: [], saved: [], sharedDocs: [], records: [] });
    expect(none).not.toContain('DOCUMENTS THE STUDENT CHOSE TO SHARE');
    const some = P.chatInstructions({ lang: 'en', depth: 'normal', today: 'x', profile: null, plans: [], saved: [], sharedDocs: [{ type: 'cv', title: 'My CV', text: 'SECRET-CV-TEXT' }], records: [] });
    expect(some).toContain('SECRET-CV-TEXT');
  });
});

describe('text helpers', () => {
  const doc = 'I led the school’s robotics club — we built 3 robots.\n\nIn 2024 I interned at a bank.';
  it('quoteIn tolerates quotes, dashes, case, whitespace and numbering markers', () => {
    expect(quoteIn(doc, "I led the school's robotics club - we built 3 robots.").found).toBe(true);
    expect(quoteIn(numberParagraphs(doc), 'In 2024 I interned at a bank.').found).toBe(true);
    expect(quoteIn(doc, '“in 2024 i interned at a bank.”').found).toBe(true);
  });
  it('quoteIn handles ellipses and rejects invented text', () => {
    expect(quoteIn(doc, 'I led the school’s … we built 3 robots').found).toBe(true);
    expect(quoteIn(doc, 'I won the national robotics championship').found).toBe(false);
    expect(quoteIn(doc, '').found).toBe(false);
  });
  it('norm strips [L1]/[P1] markers', () => {
    expect(norm(numberLines('a\nb'))).toBe('a b');
  });
  it('checkLinks flags every URL that is not in the supplied records', () => {
    const allowed = new Set(['https://study.um.edu.my/how-to-apply', 'https://www.daad.de/en/']);
    const flags = checkLinks('See https://study.um.edu.my/how-to-apply. Also (https://daad.de/en), and https://evil.example/x!', allowed);
    expect(flags).toEqual([
      { url: 'https://study.um.edu.my/how-to-apply', verified: true },
      { url: 'https://daad.de/en', verified: true },
      { url: 'https://evil.example/x', verified: false },
    ]);
    expect(checkLinks('no links here', allowed)).toEqual([]);
  });
  it('parseJsonObject finds JSON in fences or prose and ignores braces inside strings', () => {
    expect(parseJsonObject('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseJsonObject('Here you go: {"a":"x}y","b":{"c":2}} thanks')).toEqual({ a: 'x}y', b: { c: 2 } });
    expect(() => parseJsonObject('no json')).toThrow(SchemaError);
    expect(() => parseJsonObject('{"a": ')).toThrow(SchemaError);
  });
});

describe('validators reject malformed replies (never a fake analysis)', () => {
  const cvDoc = 'Education: BSc Computer Science.\nExperience: intern at a bank for three months.';
  const okCv = JSON.parse(mockReply({ messages: [{ role: 'user', content: `evaluation of the student's academic CV\nTHE CV\n"""\n${numberLines(cvDoc)}\n"""` }], tier: 'complex', maxTokens: 1 }));

  it('accepts a good CV analysis and returns every score key in order', () => {
    const r = V.validateCv(okCv, cvDoc);
    expect(r.scores.map((s) => s.key)).toEqual([...V.CV_SCORES]);
    expect(r.readiness).toBe('moderate_improvement');
    expect(r.strengths[0]!.evidence?.found).toBe(true);
  });
  it('rejects: not an object, missing core fields, empty verdict', () => {
    expect(() => V.validateCv('text', cvDoc)).toThrow(SchemaError);
    expect(() => V.validateCv({}, cvDoc)).toThrow(SchemaError);
    expect(() => V.validateCv({ overall: 'x' }, cvDoc)).toThrow(SchemaError);
    expect(() => V.validateLetter({ verdict: 'x' }, 'doc')).toThrow(SchemaError);
    expect(() => V.validateImprovement({ revised: '' })).toThrow(SchemaError);
    expect(() => V.validateQuestions({ questions: ['a', 'b'] })).toThrow(SchemaError);
    expect(() => V.validateFeedback({ effective: [], weak: [], improve: [] })).toThrow(SchemaError);
    expect(() => V.validateOcr({ pages: [] })).toThrow(SchemaError);
    expect(() => V.validateGrowth({ diagnosis: 'x', ideas: [] })).toThrow(SchemaError);
    expect(() => V.validateReview({})).toThrow(SchemaError);
    expect(() => V.validateConsistency({}, 'a', 'b')).toThrow(SchemaError);
  });
  it('clamps scores to 1–10, nulls non-numbers, and defaults unknown readiness', () => {
    const r = V.validateCv({ ...okCv, readiness: 'amazing', scores: [{ key: 'structure', score: 99, reason: 'x' }, { key: 'impact', score: 'abc' }, { key: 'skills', score: 0 }] }, cvDoc);
    expect(r.readiness).toBe('substantial_revision');
    expect(r.scores.find((s) => s.key === 'structure')!.score).toBe(10);
    expect(r.scores.find((s) => s.key === 'impact')!.score).toBeNull();
    expect(r.scores.find((s) => s.key === 'skills')!.score).toBe(1);
    expect(r.scores.find((s) => s.key === 'relevance')!.score).toBeNull(); // missing => not assessed, never invented
  });
  it('flags quotes that do not appear in the student\'s document', () => {
    const r = V.validateCv({ ...okCv, weaknesses: [{ point: 'p', evidence: 'I won an Olympiad medal', consequence: 'c' }] }, cvDoc);
    expect(r.weaknesses[0]!.evidence).toMatchObject({ found: false });
    expect(r.strengths[0]!.evidence).toMatchObject({ found: true });
  });
  it('drops rewrites whose "original" is empty and flags the ones not found', () => {
    const r = V.validateCv({ ...okCv, rewrites: [{ original: '', improved: 'x' }, { original: 'made up sentence', improved: 'y', why: 'w' }] }, cvDoc);
    expect(r.rewrites).toHaveLength(1);
    expect(r.rewrites[0]!.original.found).toBe(false);
  });
  it('sorts red flags by severity and caps list sizes', () => {
    const r = V.validateCv({ ...okCv, red_flags: [{ flag: 'a', severity: 'low' }, { flag: 'b', severity: 'high' }, { flag: 'c' }] }, cvDoc);
    expect(r.redFlags.map((f) => f.severity)).toEqual(['high', 'medium', 'low']);
    expect(V.validateCv({ ...okCv, questions: Array.from({ length: 50 }, (_, i) => `q${i}`) }, cvDoc).questions).toHaveLength(10);
  });
  it('letter analysis: compliance defaults to cannot_confirm; paragraph numbers default', () => {
    const doc = 'I want to study data science because I built a model for my school.';
    const ok = JSON.parse(mockReply({ messages: [{ role: 'user', content: `evaluation of the student's document\nTHE DOCUMENT\n"""\n${doc}\n"""` }], tier: 'complex', maxTokens: 1 }));
    const r = V.validateLetter({ ...ok, compliance: { status: 'bogus' } }, doc);
    expect(r.compliance.status).toBe('cannot_confirm');
    expect(r.scores.find((s) => s.key === 'fit')!.score).toBeNull();
  });
  it('interview questions accept strings or objects; at least 3 needed', () => {
    expect(V.validateQuestions(['a?', 'b?', 'c?'])).toHaveLength(3);
    expect(V.validateQuestions({ questions: [{ q: 'a?', why: 'w' }, { q: 'b?' }, { q: 'c?' }] })[0]!.why).toBe('w');
  });
  it('consistency check verifies both quotes against their own document', () => {
    const r = V.validateConsistency({ summary: 's', inconsistencies: [{ issue: 'i', cv_quote: 'cv text', letter_quote: 'not in letter', verify: 'v' }] }, 'this is cv text here', 'the letter says something');
    expect(r.inconsistencies[0]!.cvQuote?.found).toBe(true);
    expect(r.inconsistencies[0]!.letterQuote?.found).toBe(false);
  });
});

describe('what the AI may know', () => {
  it('minimalProfile never includes the name, birth year or institution', () => {
    const p = minimalProfile({ name: 'Aziz Karimov', birthYear: 2003, school: 'School #5', institution: 'TUIT', email: 'a@b.c', phone: '+998', currentEducation: 'bachelor', field: 'cs', score: 4.5, scale: 'gpa5', ielts: 6.5, currency: 'USD', totalBudget: 9000 });
    const text = JSON.stringify(p);
    for (const secret of ['Aziz', 'Karimov', '2003', 'School #5', 'TUIT', 'a@b.c', '+998']) expect(text).not.toContain(secret);
    expect(p).toMatchObject({ field: 'cs', ielts: 6.5, grade: '4.5 (gpa5)' });
    expect((p as any).approxAge).toBe(new Date().getFullYear() - 2003);
    expect(minimalProfile(null)).toBeNull();
  });
  it('ground() returns at most 20 records, all from the catalogue, and the URLs come only from them', () => {
    const g = ground('Compare Malaysia, Hungary, Germany and Korea on budget, and tell me about UM and KAIST and TUM', {}, snap);
    expect(g.records.length).toBeLessThanOrEqual(MAX_RECORDS);
    expect(g.records.length).toBeGreaterThan(0);
    const ids = new Set([...snap.universities.map((u) => u.id), ...snap.grants.map((x) => x.id)]);
    for (const r of g.records) expect(ids.has(r.id)).toBe(true);
    for (const u of g.urls) expect(JSON.stringify(g.records)).toContain(u);
  });
  it('a named target is always included first; unknown ids add nothing', () => {
    const g = ground('hello', { target: { kind: 'uni', id: 'universiti-malaya-my', level: 'master' } }, snap);
    expect(g.records[0]).toMatchObject({ id: 'universiti-malaya-my', type: 'university' });
    expect(g.records[0]!.levels).toHaveLength(1);
    expect(ground('hello', { saved: ['does-not-exist'] }, snap).records).toEqual([]);
  });
  it('university records carry IELTS together with its scope, so a programme value is never read as general', () => {
    const rec = ground('x', { target: { kind: 'uni', id: 'universiti-malaya-my', level: 'bachelor' } }, snap).records[0]!;
    expect(rec.levels[0]).toMatchObject({ ielts: 5, ieltsScope: 'general' });
  });
  it('a custom target is marked as unverified: no requirement may be stated as fact', () => {
    expect(targetBlock({ kind: 'custom', name: 'Some Uni' }, undefined, snap)).toMatch(/holds no verified record of it/);
    expect(targetBlock({ kind: 'none' }, undefined, snap)).toMatch(/Target: none given/);
    expect(targetBlock({ kind: 'uni', id: 'tu-darmstadt-de', level: 'master' }, { wordLimit: 500 }, snap)).toMatch(/Word limit the student says applies: 500/);
  });
  it('the target text separates the group guidance and never mentions a probability', () => {
    const t = targetBlock({ kind: 'uni', id: 'universiti-malaya-my', level: 'bachelor' }, undefined, snap);
    expect(t).toMatch(/HIGHLY SELECTIVE/);
    expect(t).not.toMatch(/probabilit|chance of/i);
  });
});

describe('cost control helpers', () => {
  it('estimates cost from tokens and model, and prices unknown models high', () => {
    expect(estimateCostUsd('claude-sonnet-5-5', 1_000_000, 1_000_000)).toBe(12);
    expect(estimateCostUsd('claude-haiku-5-5', 1_000_000, 0)).toBeCloseTo(0.1);
    expect(estimateCostUsd('some-new-model', 1_000_000, 0)).toBeGreaterThan(estimateCostUsd('claude-opus-5-5', 1_000_000, 0));
    expect(estimateCostUsd('claude-sonnet-5-5', 100, 100, parsePrices('{"claude-sonnet-5-5":[100,100]}'))).toBeCloseTo(0.02);
    expect(parsePrices('not json')).toEqual({});
  });
  it('the daily quota resets at midnight in Uzbekistan (UTC+5)', () => {
    expect(dayStart(new Date('2026-11-07T10:00:00Z')).toISOString()).toBe('2026-11-06T19:00:00.000Z');
    expect(dayStart(new Date('2026-11-07T20:00:00Z')).toISOString()).toBe('2026-11-07T19:00:00.000Z');
  });
  it('production refuses the mock model', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', DATABASE_URL: 'x', SESSION_SECRET: 'y'.repeat(40), AI_MOCK: 'true' })).toThrow(/AI_MOCK/);
  });
});
