import type { Level, University } from './catalogue';
import { LEVELS } from './catalogue';

/** Lower-case, strip diacritics, normalise Turkish/Uzbek letters so "ODTU", "ODTÜ" and "odtü" match. */
export function normalize(s: string): string {
  return s
    .replace(/İ/g, 'i')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‘’ʻʼ`´']/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .trim();
}

export type UniFilter = {
  q?: string;
  country?: string;
  tier?: string;
  level?: Level;
  subject?: string;
  language?: string;
  funding?: boolean;
  confirmedDeadline?: boolean;
  confirmedFee?: boolean;
  /** Student's IELTS. Only annotates each result; unconfirmed minimums are never treated as met. */
  ielts?: number;
};

export type IeltsStatus = 'meets' | 'below' | 'unconfirmed';
export type SearchHit = { university: University; ieltsStatus?: IeltsStatus };

export function ieltsStatusFor(u: University, level: Level | undefined, student: number): IeltsStatus {
  const lvls = level ? [u.levels[level]] : LEVELS.map((l) => u.levels[l]);
  const general = lvls.filter((l) => l && l.ielts != null && l.ieltsScope === 'general').map((l) => l!.ielts as number);
  if (!general.length) return 'unconfirmed'; // programme-specific values are never generalised
  return general.some((m) => student >= m) ? 'meets' : 'below';
}

const openAt = (u: University, level: Level) => {
  const l = u.levels[level];
  return !!l && (l.open === 'yes' || l.open === 'integrated');
};

export function searchUniversities(
  all: University[],
  f: UniFilter,
  countriesWithGrant: ReadonlySet<string> = new Set(),
): SearchHit[] {
  const q = f.q ? normalize(f.q) : '';
  const hits: SearchHit[] = [];
  for (const u of all) {
    if (f.country && u.country !== f.country) continue;
    if (f.tier && u.tier !== f.tier) continue;
    if (f.level && !openAt(u, f.level)) continue;
    if (f.subject && !u.subjects.includes(f.subject)) continue;
    if (f.language && !u.languages.includes(f.language)) continue;
    if (f.funding && !(u.scholarships.length > 0 || countriesWithGrant.has(u.country))) continue;
    if (f.confirmedFee && u.fee?.amount == null) continue;
    if (f.confirmedDeadline) {
      const lv = f.level ? [f.level] : [...LEVELS];
      if (!lv.some((l) => !!u.levels[l]?.deadline?.date)) continue;
    }
    if (q) {
      const hay = [u.name, u.short ?? '', u.city ?? ''].map(normalize);
      if (!hay.some((h) => h.includes(q))) continue;
    }
    hits.push({ university: u, ieltsStatus: f.ielts != null ? ieltsStatusFor(u, f.level, f.ielts) : undefined });
  }
  return hits.sort(
    (a, b) => a.university.country.localeCompare(b.university.country) || a.university.order - b.university.order,
  );
}
