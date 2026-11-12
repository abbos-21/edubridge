import { LEVELS, type University } from '@edubridge/shared';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export const todayISO = () => new Date().toISOString().slice(0, 10);

/** Whole days from one ISO date to another (negative when `to` is earlier). */
export const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

export type Deadline = { id: string; uniId: string; name: string; level: 'bachelor' | 'master'; date: string; days: number };

/**
 * Open, confirmed deadlines of the given universities, soonest first. A date counts only when it has a source
 * (its own or the level's): the same rule as the one-page summary. A missing date is never turned into a guess.
 */
export function confirmedDeadlines(unis: University[], ids: string[], today = todayISO()): Deadline[] {
  const wanted = new Set(ids);
  return unis
    .filter((u) => wanted.has(u.id))
    .flatMap((u) => LEVELS.map((level) => ({ u, level, lv: u.levels[level] })))
    .filter(({ lv }) => lv && lv.open !== 'no' && lv.deadline?.date && ISO.test(lv.deadline.date) && lv.deadline.date >= today && (lv.deadline.source || lv.sources?.length))
    .map(({ u, level, lv }) => {
      const date = lv!.deadline!.date as string;
      return { id: `${u.id}:${level}:${date}`, uniId: u.id, name: u.name, level, date, days: daysBetween(today, date) };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
