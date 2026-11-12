import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useStore } from '../store/AppStore';
import { useI18n } from '../i18n/I18nProvider';
import { taskTitle } from '../lib/plans';
import { useCatalogState } from '../data/CatalogProvider';
import { useCollection, type Versioned } from '../ai/useCollection';
import { confirmedDeadlines, daysBetween, todayISO } from '../lib/deadlines';
import { href } from '../lib/router';

/** One dated thing the student should watch: a confirmed deadline of a saved university, or a date they added. */
export type DateItem = { id: string; name: string; date: string; days: number; kind: 'university' | 'grant' | 'task' | 'mine'; level?: 'bachelor' | 'master'; link: string };
export type Level = 'urgent' | 'soon' | 'info';
export const levelOf = (days: number): Level => (days <= 3 ? 'urgent' : days <= 14 ? 'soon' : 'info');

/** The bell lists dates this close. (Telegram reminders are separate: 7 and 1 day before.) */
export const NOTICE_WINDOW_DAYS = 30;

export type EventRow = Versioned & { data: { title?: string; date?: string; oppId?: string } };
type Ctx = { upcoming: DateItem[]; notices: DateItem[]; unread: DateItem[]; markRead: (ids: string[]) => void; myDates: number; events: ReturnType<typeof useCollection<EventRow>> };
const NoticesCtx = createContext<Ctx | null>(null);

const READ_KEY = 'edubridge:notices-read';
const loadRead = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(READ_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

export function NoticesProvider({ children }: { children: ReactNode }) {
  const { saved, plans, workspace } = useStore();
  const { pick } = useI18n();
  const { state } = useCatalogState();
  const events = useCollection<EventRow>('events');
  const [read, setRead] = useState<string[]>(loadRead);

  const upcoming = useMemo<DateItem[]>(() => {
    const today = todayISO();
    const unis = state.status === 'ready' ? confirmedDeadlines(state.data.universities, saved, today) : [];
    const fromUnis: DateItem[] = unis.map((d) => ({ id: d.id, name: d.name, date: d.date, days: d.days, kind: 'university', level: d.level, link: href('uni', d.uniId) }));
    const mine: DateItem[] = events.items
      .filter((e) => e.data?.title && e.data?.date && /^\d{4}-\d{2}-\d{2}$/.test(e.data.date) && e.data.date >= today)
      .map((e) => ({ id: `mine:${e.id}`, name: e.data.title as string, date: e.data.date as string, days: daysBetween(today, e.data.date as string), kind: 'mine', link: href('calendar') }));
    const data = state.status === 'ready' ? state.data : null;
    const grants: DateItem[] = (data?.grants ?? [])
      .filter((g) => saved.includes(g.id))
      .flatMap((g) => {
        const d = (g.deadline as { date?: string } | null | undefined)?.date;
        const sourced = Array.isArray(g.sources) && g.sources.length > 0;
        return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= today && sourced ? [{ id: `grant:${g.id}:${d}`, name: g.name, date: d, days: daysBetween(today, d), kind: 'grant' as const, link: href('scholarship', g.id) }] : [];
      });
    const tasks: DateItem[] = plans.flatMap((p) => {
      const oppName = data?.universities.find((u) => u.id === p.oppId)?.name ?? data?.grants.find((g) => g.id === p.oppId)?.name ?? '';
      return p.tasks
        .filter((t) => !t.done && t.due && t.due >= today)
        .map((t) => ({ id: `task:${p.id}:${t.id}`, name: `${pick(taskTitle(t))}${oppName ? ` · ${oppName}` : ''}`, date: t.due as string, days: daysBetween(today, t.due as string), kind: 'task' as const, link: href('plan', p.id) }));
    });
    return [...fromUnis, ...grants, ...tasks, ...mine].sort((a, b) => a.date.localeCompare(b.date));
  }, [state, saved, plans, pick, events.items]);

  const notices = useMemo(() => upcoming.filter((d) => d.days <= workspace.reminderDays), [upcoming, workspace.reminderDays]);
  const unread = useMemo(() => notices.filter((n) => !read.includes(n.id)), [notices, read]);
  const markRead = useCallback((ids: string[]) => {
    setRead((cur) => {
      const next = [...new Set([...cur, ...ids])].slice(-300);
      try {
        localStorage.setItem(READ_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable: read marks last until the page is closed */
      }
      return next;
    });
  }, []);
  const myDates = events.items.filter((e) => e.data?.date).length;

  const value = useMemo<Ctx>(() => ({ upcoming, notices, unread, markRead, myDates, events }), [upcoming, notices, unread, markRead, myDates, events]);
  return <NoticesCtx.Provider value={value}>{children}</NoticesCtx.Provider>;
}

/** The small line under a date: what kind of date it is. */
export function useDateSub() {
  const { tx, t } = useI18n();
  return (d: DateItem) =>
    d.kind === 'mine' ? tx('A date you added', 'Siz qo‘shgan sana')
    : d.kind === 'task' ? tx('A task in your plan', 'Rejangizdagi vazifa')
    : d.kind === 'grant' ? `${tx('Scholarship', 'Grant')} · ${tx('confirmed deadline', 'tasdiqlangan muddat')}`
    : `${d.level === 'bachelor' ? t('lvl.bachelor') : t('lvl.master')} · ${tx('confirmed deadline', 'tasdiqlangan muddat')}`;
}

export function useNotices(): Ctx {
  const v = useContext(NoticesCtx);
  if (!v) throw new Error('NoticesProvider missing');
  return v;
}
