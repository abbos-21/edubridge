import type { PrismaClient } from '@prisma/client';
import { LEVELS, type University } from '@edubridge/shared';
import type { CatalogRepo } from '../lib/catalogRepo';

const TASHKENT_MS = 5 * 3_600_000; // UTC+5, no daylight saving
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date in Uzbekistan, YYYY-MM-DD. */
export const tashkentDate = (now = new Date()) => new Date(now.getTime() + TASHKENT_MS).toISOString().slice(0, 10);

export const validDate = (s: unknown): s is string => typeof s === 'string' && ISO.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;

export type CalItem = {
  /** stable id: the same item keeps the same UID, so calendars update instead of duplicating */
  uid: string;
  kind: 'deadline' | 'task' | 'event';
  /** all-day date, YYYY-MM-DD */
  date: string;
  /** deadline: official university name (as published) and level; task/event: the student's own title */
  name: string;
  level?: 'bachelor' | 'master';
  intake?: string | null;
  sourceUrl?: string | null;
};

const httpOnly = (u: unknown): string | null => (typeof u === 'string' && /^https?:\/\//.test(u) ? u : null);

/** Confirmed, still-open deadlines of one university: a real date, a source, not in the past, level not closed. */
function deadlinesOf(u: University, today: string): CalItem[] {
  const out: CalItem[] = [];
  for (const lvl of LEVELS) {
    const l = u.levels[lvl];
    const date = l?.deadline?.date;
    if (!l || l.open === 'no' || !validDate(date) || date < today) continue;
    const source = httpOnly(l.deadline?.source) ?? httpOnly(l.sources?.[0]);
    if (!source) continue; // not confirmed: never put an unsourced date in someone's calendar
    out.push({ uid: `deadline-${u.id}-${lvl}-${date}`, kind: 'deadline', date, name: u.name, level: lvl, intake: l.deadline?.intake ?? null, sourceUrl: source });
  }
  return out;
}

const str = (x: unknown, max = 200) => (typeof x === 'string' && x.trim() ? x.trim().slice(0, max) : null);

/**
 * Everything dated that belongs in a student's calendar and reminders:
 *  - confirmed, open deadlines of the universities they saved,
 *  - plan tasks (application.data.tasks[] = {id?, title, due: YYYY-MM-DD, done?}), not done, not past,
 *  - their own dates (customEvent.data = {title, date: YYYY-MM-DD}).
 * Closed or past deadlines and anything without a valid date are left out.
 */
export async function collectCalendarItems(prisma: PrismaClient, repo: CatalogRepo, userId: string, now = new Date()): Promise<CalItem[]> {
  const today = tashkentDate(now);
  const [saved, apps, events, snap] = await Promise.all([
    prisma.savedItem.findMany({ where: { userId }, select: { ref: true } }),
    prisma.application.findMany({ where: { userId }, select: { id: true, opportunityRef: true, data: true } }),
    prisma.customEvent.findMany({ where: { userId }, select: { id: true, data: true } }),
    repo.snapshot(),
  ]);
  const items: CalItem[] = [];
  const refs = new Set([...saved.map((s) => s.ref), ...apps.map((a) => a.opportunityRef)]);
  for (const u of snap.universities) if (refs.has(u.id)) items.push(...deadlinesOf(u, today));

  for (const a of apps) {
    const tasks = (a.data as { tasks?: unknown })?.tasks;
    if (!Array.isArray(tasks)) continue;
    tasks.slice(0, 200).forEach((t: any, i) => {
      const title = str(t?.title);
      if (!title || t?.done === true || !validDate(t?.due) || t.due < today) return;
      items.push({ uid: `task-${a.id}-${str(t.id, 60) ?? i}-${t.due}`, kind: 'task', date: t.due, name: title });
    });
  }
  for (const e of events) {
    const d = e.data as { title?: unknown; date?: unknown };
    const title = str(d?.title);
    if (!title || !validDate(d?.date) || d.date < today) continue;
    items.push({ uid: `event-${e.id}-${d.date}`, kind: 'event', date: d.date, name: title });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date) || a.uid.localeCompare(b.uid));
}
