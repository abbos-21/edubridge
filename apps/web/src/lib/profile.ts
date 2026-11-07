/**
 * The student's profile. It lives in the browser (guests) or in the account (signed in). Nothing here is
 * ever converted between grading systems and nothing here produces a probability.
 */
export type Scale = 'percent' | 'five_point_uz' | 'gpa4' | 'gpa5' | 'other';
export type Currency = 'USD' | 'UZS';

export type StudentProfile = {
  name: string;
  citizenship: string;
  residence: string;
  currentEducation: 'school' | 'lyceum_college' | 'bachelor_student' | 'bachelor_grad' | 'master_grad' | 'working';
  targetLevel: 'bachelor' | 'master' | 'phd';
  field: string;
  applicationYear: number;
  intake: string;
  birthYear?: number;
  qualification: string;
  institution: string;
  scale: Scale;
  scaleOther?: string;
  score?: number;
  graduationYear?: number;
  major: string;
  achievements: string;
  ielts?: number;
  ieltsParts?: { l?: number; r?: number; w?: number; s?: number };
  toefl?: number;
  sat?: number;
  otherLanguage: string;
  planningExam: boolean;
  currency: Currency;
  tuitionBudget?: number;
  totalBudget?: number;
  needsFullFunding: boolean;
  partialOk: boolean;
  feesAffordable: 'yes' | 'some' | 'no';
  canShowFunds: 'yes' | 'partly' | 'no' | 'unsure';
  preferredCountries: string[];
  avoidCountries: string[];
  instructionPref: 'English' | 'any';
  sectorPref: 'any' | 'public' | 'private';
  durationPref: 'any' | 'short' | 'standard';
  orientationPref: 'any' | 'research' | 'employment';
  characteristics: string;
  workYears?: number;
  experiences: Record<string, string>;
  completedAt?: string;
};

export const DEFAULT_PROFILE = (): StudentProfile => ({
  name: '',
  citizenship: 'Uzbekistan',
  residence: 'Uzbekistan',
  currentEducation: 'school',
  targetLevel: 'bachelor',
  field: 'business',
  applicationYear: new Date().getFullYear() + 1,
  intake: '',
  qualification: '',
  institution: '',
  scale: 'percent',
  achievements: '',
  major: '',
  otherLanguage: '',
  planningExam: false,
  currency: 'USD',
  needsFullFunding: false,
  partialOk: true,
  feesAffordable: 'some',
  canShowFunds: 'unsure',
  preferredCountries: [],
  avoidCountries: [],
  instructionPref: 'English',
  sectorPref: 'any',
  durationPref: 'any',
  orientationPref: 'any',
  characteristics: '',
  experiences: {},
});

/** The highest value each grading scale allows (the "other" scale has no known limit). */
export const SCALE_MAX: Record<Scale, number> = { percent: 100, gpa4: 4, gpa5: 5, five_point_uz: 5, other: 1e9 };

export const EXPERIENCE_KEYS = ['leadership', 'teamwork', 'volunteering', 'competitions', 'internships', 'employment', 'projects', 'research', 'academic', 'community'] as const;

/** Parses a number typed by the student ("6,5" or "6.5"); blank means "not given". */
export const num = (s: string): number | undefined => {
  const t = s.trim();
  return t === '' ? undefined : Number(t.replace(',', '.'));
};

export type FieldErrors = Partial<Record<string, string>>;

export const STEPS = ['basics', 'academics', 'language', 'finances', 'destinations', 'experience', 'review'] as const;
export type StepName = (typeof STEPS)[number];

/** Validation per wizard step. Messages are keys; the page translates them. */
export type ErrorKey = 'name' | 'citizenship' | 'year' | 'score' | 'ielts' | 'toefl' | 'sat' | 'money' | 'total' | 'work';

export function validateStep(step: number, d: StudentProfile): Partial<Record<string, ErrorKey>> {
  const e: Partial<Record<string, ErrorKey>> = {};
  const thisYear = new Date().getFullYear();
  if (step === 0) {
    if (!d.name.trim()) e.name = 'name';
    if (!d.citizenship.trim()) e.citizenship = 'citizenship';
    if (d.birthYear !== undefined && (Number.isNaN(d.birthYear) || d.birthYear < 1950 || d.birthYear > thisYear - 10)) e.birthYear = 'year';
  }
  if (step === 1 && d.score !== undefined && (Number.isNaN(d.score) || d.score < 0 || d.score > SCALE_MAX[d.scale])) e.score = 'score';
  if (step === 2) {
    if (d.ielts !== undefined && (Number.isNaN(d.ielts) || d.ielts < 0 || d.ielts > 9 || (d.ielts * 2) % 1 !== 0)) e.ielts = 'ielts';
    if (d.toefl !== undefined && (Number.isNaN(d.toefl) || d.toefl < 0 || d.toefl > 120)) e.toefl = 'toefl';
    if (d.sat !== undefined && (Number.isNaN(d.sat) || d.sat < 400 || d.sat > 1600)) e.sat = 'sat';
  }
  if (step === 3) {
    for (const k of ['tuitionBudget', 'totalBudget'] as const) if (d[k] !== undefined && (Number.isNaN(d[k]) || (d[k] as number) < 0)) e[k] = 'money';
    if (d.tuitionBudget !== undefined && d.totalBudget !== undefined && d.totalBudget < d.tuitionBudget) e.totalBudget = 'total';
  }
  if (step === 5 && d.workYears !== undefined && (Number.isNaN(d.workYears) || d.workYears < 0 || d.workYears > 50)) e.workYears = 'work';
  return e;
}

/** How much of the profile is filled in (0–100), shown as a progress hint. Counts what matters for matching. */
export function completeness(p: StudentProfile): number {
  const checks = [p.name.trim(), p.field, p.targetLevel, p.qualification.trim(), p.score != null, p.ielts != null || p.toefl != null || p.planningExam, p.totalBudget != null || p.needsFullFunding, p.preferredCountries.length > 0, Object.values(p.experiences).some((v) => v.trim())];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/** Merges stored data over defaults so a field added in a later version never breaks an old profile. */
export function normalizeProfile(raw: unknown): StudentProfile | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const base = DEFAULT_PROFILE();
  const r = raw as Partial<StudentProfile>;
  return {
    ...base,
    ...r,
    preferredCountries: Array.isArray(r.preferredCountries) ? r.preferredCountries.filter((x): x is string => typeof x === 'string') : [],
    avoidCountries: Array.isArray(r.avoidCountries) ? r.avoidCountries.filter((x): x is string => typeof x === 'string') : [],
    experiences: r.experiences && typeof r.experiences === 'object' ? (r.experiences as Record<string, string>) : {},
  };
}
