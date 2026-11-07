import { z } from 'zod';
import { LANGS } from '@edubridge/shared';
import type { CatalogueSnapshot } from '../lib/catalogRepo';
import { minimalProfile, targetBlock, type Target } from './context';
import * as P from './prompts';
import { numberLines, numberParagraphs, wordCount } from './text';
import * as V from './validators';
import type { Effort, Tier } from './llm';

/**
 * The structured AI tasks. Each one: validates its input, builds the prompt (honesty rules included),
 * names the model tier and effort, and validates the reply. Quotes are checked against the student's own text.
 */

const lang = z.enum(LANGS);
const level = z.enum(['bachelor', 'master']);
const target = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({ kind: z.literal('uni'), id: z.string().min(1).max(100), level }),
  z.object({ kind: z.literal('grant'), id: z.string().min(1).max(100) }),
  z.object({ kind: z.literal('custom'), name: z.string().min(1).max(200) }),
]);
const extras = z.object({ prompt: z.string().max(3000).optional(), wordLimit: z.number().int().min(1).max(20000).optional(), notes: z.string().max(1500).optional() }).strict();
const profile = z.record(z.string(), z.unknown()).refine((o) => JSON.stringify(o).length <= 20_000, 'profile too large');

const common = { lang, target: target.optional(), extras: extras.optional(), profile: profile.optional() };
const doc = z.string().min(20, 'Write or paste more text first').max(60_000);
export const LETTER_TYPES = ['motivation', 'personal_statement', 'study_plan', 'scholarship_essay', 'recommendation', 'other'] as const;
const letterType = z.enum(LETTER_TYPES);
const level2 = z.enum(['bachelor', 'master']);
const group = z.enum(['selective', 'middle', 'accessible']);

export const JSON_TASKS = z.discriminatedUnion('task', [
  z.object({ task: z.literal('cv'), ...common, cv: doc }).strict(),
  z.object({ task: z.literal('letter'), ...common, type: letterType, text: doc, cvForContext: z.string().max(60_000).optional() }).strict(),
  z.object({ task: z.literal('audit'), ...common, kind: z.enum(['cv', 'letter']), type: letterType.optional(), doc, draft: z.record(z.string(), z.unknown()) }).strict(),
  z.object({ task: z.literal('improve'), ...common, docType: z.string().min(1).max(40), action: z.enum(P.IMPROVE_ACTIONS as [string, ...string[]]), instruction: z.string().max(500).optional(), fullText: z.string().max(60_000), passage: z.string().min(5).max(8000) }).strict(),
  z.object({ task: z.literal('interview_questions'), ...common, kind: z.enum(['scholarship', 'university']), count: z.number().int().min(3).max(10).default(6), background: z.string().max(8000).optional() }).strict(),
  z.object({ task: z.literal('interview_feedback'), ...common, question: z.string().min(3).max(600), answer: z.string().min(1).max(6000), background: z.string().max(8000).optional(), earlier: z.array(z.object({ q: z.string().max(600), a: z.string().max(6000) })).max(12).default([]) }).strict(),
  z.object({ task: z.literal('consistency'), ...common, letterType, cv: doc, letter: doc }).strict(),
  z.object({ task: z.literal('growth_ideas'), ...common, level: level2, field: z.string().min(1).max(100), group, months: z.number().int().min(1).max(48), hours: z.number().min(1).max(60), budget: z.enum(['free', 'low', 'some']), interests: z.string().max(1500).default(''), career: z.string().max(1500).default(''), gaps: z.array(z.string().max(300)).max(20).default([]), existing: z.string().max(1500).default('') }).strict(),
  z.object({ task: z.literal('activity_review'), ...common, level: level2, field: z.string().min(1).max(100), group, activity: z.string().min(10).max(3000) }).strict(),
]);
export type JsonTaskInput = z.infer<typeof JSON_TASKS>;

export type Prepared = {
  tier: Tier;
  effort: Effort;
  maxTokens: number;
  prompt: string;
  /** turns the parsed JSON into the validated result (throws SchemaError) */
  validate: (raw: unknown) => unknown;
};

/** Heavy analyses use the complex tier; short tasks the default tier (ToR section 6). */
export function prepare(input: JsonTaskInput, snap: CatalogueSnapshot): Prepared {
  const tgt = targetBlock(input.target as Target | undefined, input.extras, snap);
  const prof = minimalProfile(input.profile);
  const base = { lang: input.lang, target: tgt, profile: prof };

  switch (input.task) {
    case 'cv':
      return {
        tier: 'complex', effort: 'high', maxTokens: 9000,
        prompt: P.cvPrompt({ ...base, cv: numberLines(input.cv) }),
        validate: (raw) => V.validateCv(raw, input.cv),
      };
    case 'letter':
      return {
        tier: 'complex', effort: 'high', maxTokens: 10000,
        prompt: P.letterPrompt({ ...base, type: input.type, words: wordCount(input.text), cvForContext: input.cvForContext, text: numberParagraphs(input.text) }),
        validate: (raw) => V.validateLetter(raw, input.text),
      };
    case 'audit':
      return {
        tier: 'complex', effort: 'high', maxTokens: 10000,
        prompt: P.auditPrompt({ ...base, kind: input.kind, doc: input.kind === 'cv' ? numberLines(input.doc) : numberParagraphs(input.doc), draft: input.draft }),
        validate: (raw) => (input.kind === 'cv' ? V.validateCv(raw, input.doc) : V.validateLetter(raw, input.doc)),
      };
    case 'improve':
      return {
        tier: 'default', effort: 'medium', maxTokens: 4000,
        prompt: P.improvePrompt({ ...base, docType: input.docType, action: input.action, instruction: input.instruction, fullText: input.fullText, passage: input.passage }),
        validate: (raw) => V.validateImprovement(raw),
      };
    case 'interview_questions':
      return {
        tier: 'default', effort: 'medium', maxTokens: 3000,
        prompt: P.interviewQuestionsPrompt({ ...base, kind: input.kind, count: input.count, background: input.background ?? (prof ? JSON.stringify(prof) : '') }),
        validate: (raw) => ({ questions: V.validateQuestions(raw).slice(0, input.count) }),
      };
    case 'interview_feedback':
      return {
        tier: 'default', effort: 'medium', maxTokens: 4000,
        prompt: P.interviewFeedbackPrompt({ ...base, question: input.question, answer: input.answer, background: input.background ?? (prof ? JSON.stringify(prof) : ''), earlier: input.earlier }),
        validate: (raw) => V.validateFeedback(raw),
      };
    case 'consistency':
      return {
        tier: 'complex', effort: 'high', maxTokens: 5000,
        prompt: P.consistencyPrompt({ ...base, letterType: input.letterType, cv: input.cv, letter: input.letter }),
        validate: (raw) => V.validateConsistency(raw, input.cv, input.letter),
      };
    case 'growth_ideas':
      return {
        tier: 'complex', effort: 'high', maxTokens: 8000,
        prompt: P.growthIdeasPrompt({ ...base, level: input.level, field: input.field, group: input.group, months: input.months, hours: input.hours, budget: input.budget, interests: input.interests, career: input.career, gaps: input.gaps, existing: input.existing }),
        validate: (raw) => V.validateGrowth(raw),
      };
    case 'activity_review':
      return {
        tier: 'default', effort: 'medium', maxTokens: 4000,
        prompt: P.activityReviewPrompt({ ...base, level: input.level, field: input.field, group: input.group, activity: input.activity }),
        validate: (raw) => V.validateReview(raw),
      };
  }
}
