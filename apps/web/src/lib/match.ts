import type { University } from '@edubridge/shared';
import type { StudentProfile } from './profile';
import type { GrantRecord } from './types';
import { isPast } from './format';

/**
 * Which universities and grants fit a profile. It only compares the student's own numbers with numbers the
 * catalogue publishes. It never converts grading systems, never treats a missing value as a pass or a fail, and
 * never produces a probability of admission. The score is only an ordering.
 */
export type UniMatch = { uni: University; score: number };

const levelOf = (p: StudentProfile): 'bachelor' | 'master' | null => (p.targetLevel === 'bachelor' || p.targetLevel === 'master' ? p.targetLevel : null);

export function recommendUniversities(p: StudentProfile, unis: University[]): UniMatch[] {
  const level = levelOf(p);
  if (!level) return [];
  const out: UniMatch[] = [];
  for (const uni of unis) {
    const lv = uni.levels[level];
    if (!lv || (lv.open !== 'yes' && lv.open !== 'integrated')) continue; // not offered at the student's level
    let score = 0;
    // subject: a different list of subjects removes it; an unrecorded list is "check", not "no"
    if (uni.subjects.length > 0) {
      if (!uni.subjects.includes(p.field)) continue;
      score += 2;
    } else score += 1;
    // destination
    if (p.avoidCountries.includes(uni.country)) score -= 2;
    else if (p.preferredCountries.length === 0 || p.preferredCountries.includes(uni.country)) score += 2;
    else score += 1;
    // English: compared only when both numbers exist
    if (lv.ielts != null && p.ielts != null) score += p.ielts >= lv.ielts ? 2 : -2;
    out.push({ uni, score });
  }
  return out.sort((a, b) => b.score - a.score || a.uni.order - b.uni.order);
}

/** Grants offered at the student's level whose published date (if there is one) has not passed. */
export function matchingGrants(p: StudentProfile, grants: GrantRecord[]): GrantRecord[] {
  const level = levelOf(p);
  if (!level) return [];
  return grants.filter((g) => {
    const levels = g.levels as string[] | undefined;
    if (levels && levels.length > 0 && !levels.includes(level)) return false;
    const date = (g.deadline as { date?: string } | null | undefined)?.date;
    if (typeof date === 'string' && date && isPast(date)) return false;
    return true;
  });
}

export type MatchStatus = 'good' | 'check' | 'add_scores' | 'unlikely';

/**
 * A short label for one university against the profile. Never a probability: "good" only means the published level,
 * subject and IELTS minimum all fit; "add_scores" means a number needed for the comparison is missing.
 */
export function matchStatus(p: StudentProfile, u: University): MatchStatus {
  const level = levelOf(p);
  if (!level) return 'check';
  const hit = recommendUniversities(p, [u])[0];
  if (!hit) return 'unlikely';
  const min = u.levels[level]?.ielts ?? null;
  if (min != null && p.ielts != null) return p.ielts >= min ? 'good' : 'unlikely';
  if (min != null && p.ielts == null && p.toefl == null && !p.planningExam) return 'add_scores';
  return 'check';
}
