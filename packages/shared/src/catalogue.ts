import { z } from 'zod';

export const COUNTRY_CODES = ['MY', 'HU', 'DE', 'TR', 'KR'] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];
export const TIERS = ['selective', 'middle', 'accessible'] as const;
export type Tier = (typeof TIERS)[number];
export const LEVELS = ['bachelor', 'master'] as const;
export type Level = (typeof LEVELS)[number];
export const STATUSES = ['draft', 'in_review', 'published', 'hidden'] as const;
export type CatalogueStatus = (typeof STATUSES)[number];

export const zL = z.object({ en: z.string(), uz: z.string(), ru: z.string().optional() });

const zTuition = z
  .object({
    amount: z.number().nullable().optional(),
    amount_max: z.number().nullable().optional(),
    currency: z.string().nullable().optional(),
    per: z.string().nullable().optional(),
    year: z.string().nullable().optional(),
    note: zL.nullable().optional(),
    source: z.string().nullable().optional(),
  })
  .passthrough();

const zDeadline = z
  .object({
    date: z.string().nullable().optional(),
    intake: z.string().nullable().optional(),
    note: zL.nullable().optional(),
    source: z.string().nullable().optional(),
  })
  .passthrough();

export const zUniversityLevel = z
  .object({
    open: z.enum(['yes', 'no', 'integrated', 'unknown']),
    academic: zL.nullable().optional(),
    language: zL.nullable().optional(),
    exams: zL.nullable().optional(),
    intake: zL.nullable().optional(),
    note: zL.nullable().optional(),
    langKind: z.string().nullable().optional(),
    ielts: z.number().nullable().optional(),
    ieltsScope: z.enum(['general', 'programme']).nullable().optional(),
    tuition: zTuition.nullable().optional(),
    deadline: zDeadline.nullable().optional(),
    example: z.object({ name: z.string().nullable().optional(), req: zL.nullable().optional(), url: z.string().nullable().optional() }).passthrough().nullable().optional(),
    apply: z.string().nullable().optional(),
    sources: z.array(z.string()).optional(),
  })
  .passthrough();
export type UniversityLevel = z.infer<typeof zUniversityLevel>;

export const zRanking = z
  .object({
    org: z.string(),
    edition: z.number(),
    value: z.string().nullable(),
    source: z.object({ name: z.string(), url: z.string() }).nullable().optional(),
    url: z.string().nullable().optional(),
  })
  .passthrough();

export const zUniversity = z
  .object({
    id: z.string().min(1),
    country: z.enum(COUNTRY_CODES),
    order: z.number().int().min(1).max(10),
    tier: z.enum(TIERS),
    name: z.string().min(1),
    short: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    campus: zL.nullable().optional(),
    type: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    subjects: z.array(z.string()).default([]),
    languages: z.array(z.string()).default([]),
    admissions: z.string().nullable().optional(),
    apply: z.string().nullable().optional(),
    applyLinks: z.array(z.unknown()).default([]),
    scholarships: z.array(z.unknown()).default([]),
    uniNote: z.unknown().optional(),
    ranking: zRanking.nullable().optional(),
    fee: z.object({ amount: z.number().nullable().optional(), currency: z.string().nullable().optional(), note: zL.nullable().optional(), source: z.string().nullable().optional() }).passthrough().nullable().optional(),
    lastChecked: z.string().nullable().optional(),
    levels: z.object({ bachelor: zUniversityLevel.nullable().optional(), master: zUniversityLevel.nullable().optional() }),
  })
  .passthrough();
export type University = z.infer<typeof zUniversity>;

export const zGrant = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    country: z.string(),
    levels: z.array(z.string()).default([]),
    who: zL.nullable().optional(),
    criteria: zL.nullable().optional(),
    covers: z.record(z.string(), z.string()).optional(),
    notCovered: zL.nullable().optional(),
    deadline: z.unknown().optional(),
    universities: z.unknown().optional(),
    url: z.string().nullable().optional(),
    sources: z.array(z.string()).default([]),
    checked: z.string().nullable().optional(),
  })
  .passthrough();
export type Grant = z.infer<typeof zGrant>;

/** The 7 national grants of the first release. Anything else is a secondary "other scholarship". */
export const NATIONAL_GRANT_IDS = ['mtcp', 'mis', 'turkiye-burslari', 'stipendium-hungaricum', 'daad-epos', 'gks-u', 'gks-g'] as const;
