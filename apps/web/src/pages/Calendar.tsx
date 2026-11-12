import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { useStore } from '../store/AppStore';
import { useCatalog } from '../data/CatalogProvider';
import { formatDate } from '../lib/format';
import { href } from '../lib/router';
import { progress, taskTitle } from '../lib/plans';
import { todayISO } from '../lib/deadlines';
import { Badge, Card, Chip, Field, Notice, PageHeader, Select, cx } from '../components/ui';
import { levelOf, useDateSub, useNotices, type DateItem } from '../components/Notices';
import { RemindersSection } from './Reminders';

const KINDS: Array<{ id: DateItem['kind']; dot: string; label: [string, string] }> = [
  { id: 'university', dot: 'bg-navy', label: ['University deadline', 'Universitet muddati'] },
  { id: 'grant', dot: 'bg-teal', label: ['Scholarship deadline', 'Grant muddati'] },
  { id: 'task', dot: 'bg-warn', label: ['Plan task', 'Reja vazifasi'] },
  { id: 'mine', dot: 'bg-ok', label: ['My date', 'Mening sanam'] },
];
const dotOf = (k: DateItem['kind']) => KINDS.find((x) => x.id === k)!.dot;
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function Row({ d }: { d: DateItem }) {
  const { tx, lang } = useI18n();
  const sub = useDateSub();
  const lv = levelOf(d.days);
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 last:border-0">
      <span className={cx('h-2.5 w-2.5 shrink-0 rounded-full', dotOf(d.kind))} aria-hidden />
      <div className="min-w-0 flex-1 basis-56">
        <a href={d.link} className="font-semibold text-fg no-underline hover:underline">{d.name}</a>
        <p className="text-[12.5px] text-muted">{sub(d)} · {formatDate(d.date, lang)}</p>
      </div>
      <Badge tone={lv === 'urgent' ? 'bad' : lv === 'soon' ? 'warn' : 'ok'}>{d.days === 0 ? tx('Today', 'Bugun') : tx('{0} days left', '{0} kun qoldi', d.days)}</Badge>
    </li>
  );
}

/** #calendar: a month view of every date the student should watch, plus tasks due soon and own dates. */
export function Calendar() {
  const { tx, lang } = useI18n();
  const { me } = useAuth();
  const { plans, workspace, patchWorkspace } = useStore();
  const cat = useCatalog();
  const { upcoming } = useNotices();
  const today = todayISO();
  const [month, setMonth] = useState(() => new Date(`${today}T00:00:00Z`));
  const [shown, setShown] = useState<Set<DateItem['kind']>>(new Set(KINDS.map((k) => k.id)));
  const [day, setDay] = useState<string | null>(null);

  const items = useMemo(() => upcoming.filter((d) => shown.has(d.kind)), [upcoming, shown]);
  const byDay = useMemo(() => {
    const m = new Map<string, DateItem[]>();
    for (const d of items) m.set(d.date, [...(m.get(d.date) ?? []), d]);
    return m;
  }, [items]);

  const y = month.getUTCFullYear();
  const mo = month.getUTCMonth();
  const first = new Date(Date.UTC(y, mo, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const days = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
  const cells = [...Array.from({ length: lead }, () => null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const monthName = new Intl.DateTimeFormat(lang === 'uz' ? 'uz-UZ' : lang === 'ru' ? 'ru-RU' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(first);
  const weekdays = lang === 'ru' ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : lang === 'uz' ? ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const shift = (n: number) => setMonth(new Date(Date.UTC(y, mo + n, 1)));
  const toggle = (k: DateItem['kind']) => setShown((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  const dueSoon = upcoming.filter((d) => d.kind === 'task' && d.days <= 21);
  const nameOf = (id: string) => cat.universities.find((u) => u.id === id)?.name ?? cat.grants.find((g) => g.id === id)?.name ?? id;
  const dayItems = day ? byDay.get(day) ?? [] : [];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={tx('Deadline overview', 'Muddatlar sharhi')} title={tx('Calendar and deadlines', 'Taqvim va muddatlar')}>
        {tx('Confirmed deadlines of what you saved, your plan tasks and your own dates in one place. Dates without a source are never shown.', 'Saqlaganlaringizning tasdiqlangan muddatlari, reja vazifalari va o‘z sanalaringiz bir joyda. Manbasiz sanalar ko‘rsatilmaydi.')}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={tx('Show event types', 'Tadbir turlarini ko‘rsatish')}>
        {KINDS.map((k) => (
          <Chip key={k.id} active={shown.has(k.id)} onClick={() => toggle(k.id)}><span className={cx('mr-1.5 inline-block h-2 w-2 rounded-full align-middle', k.dot)} aria-hidden />{tx(k.label[0], k.label[1])}</Chip>
        ))}
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => shift(-1)} aria-label={tx('Previous month', 'Oldingi oy')} className="grid h-10 w-10 place-items-center rounded-md hover:bg-sunken"><ChevronLeft size={18} aria-hidden /></button>
          <p className="font-bold capitalize" aria-live="polite">{monthName}</p>
          <button type="button" onClick={() => shift(1)} aria-label={tx('Next month', 'Keyingi oy')} className="grid h-10 w-10 place-items-center rounded-md hover:bg-sunken"><ChevronRight size={18} aria-hidden /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[12px] font-semibold text-muted">{weekdays.map((w) => <div key={w}>{w}</div>)}</div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={`b${i}`} />;
            const key = iso(y, mo, d);
            const list = byDay.get(key) ?? [];
            const isToday = key === today;
            return (
              <button key={key} type="button" onClick={() => setDay(key === day ? null : key)} aria-pressed={key === day} aria-label={`${formatDate(key, lang)}${list.length ? ` — ${list.length}` : ''}`} className={cx('flex min-h-[52px] flex-col items-center gap-1 rounded-lg border p-1 text-[13px] sm:min-h-[64px]', key === day ? 'border-navy bg-navy-soft' : 'border-line hover:bg-sunken', isToday && 'font-extrabold ring-1 ring-teal')}>
                <span className="tabular">{d}</span>
                <span className="flex flex-wrap justify-center gap-0.5">{list.slice(0, 4).map((x) => <span key={x.id} className={cx('h-1.5 w-1.5 rounded-full', dotOf(x.kind))} />)}</span>
              </button>
            );
          })}
        </div>
        {day && (
          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-1 font-bold">{formatDate(day, lang)}</p>
            {dayItems.length === 0 ? <p className="text-[14px] text-muted">{tx('Nothing on this day.', 'Bu kunda hech narsa yo‘q.')}</p> : <ul className="-mx-4 mt-1">{dayItems.map((d) => <Row key={d.id} d={d} />)}</ul>}
          </div>
        )}
      </Card>

      <section>
        <h2 className="mb-3 text-[18px] font-bold">{tx('Upcoming dates', 'Yaqin sanalar')}</h2>
        {items.length === 0 ? (
          <Card>
            <p className="font-bold">{tx('No upcoming dates', 'Yaqin sanalar yo‘q')}</p>
            <p className="mt-1 text-[14px] text-muted">{tx('Save a university or add a plan to see its dates here. A deadline that is not announced or not verified is never shown as a date.', 'Sanalarni shu yerda ko‘rish uchun universitetni saqlang yoki reja qo‘shing. E’lon qilinmagan yoki tasdiqlanmagan muddat sana sifatida ko‘rsatilmaydi.')} <a href={href('universities')}>{tx('Universities', 'Universitetlar')} →</a></p>
          </Card>
        ) : <Card className="overflow-hidden !p-0 sm:!p-0"><ul>{items.map((d) => <Row key={d.id} d={d} />)}</ul></Card>}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-[18px] font-bold">{tx('Tasks due soon', 'Yaqin vazifalar')}</h2>
          {dueSoon.length === 0 ? <Card><p className="text-[14px] text-muted">{tx('No tasks due in the next three weeks', 'Keyingi uch haftada muddatli vazifa yo‘q')}</p></Card> : <Card className="overflow-hidden !p-0 sm:!p-0"><ul>{dueSoon.map((d) => <Row key={d.id} d={d} />)}</ul></Card>}
        </section>
        <section>
          <h2 className="mb-3 text-[18px] font-bold">{tx('By application', 'Ariza bo‘yicha')}</h2>
          {plans.length === 0 ? <Card><p className="text-[14px] text-muted">{tx('Add a plan to see its tasks by application.', 'Arizalar bo‘yicha vazifalarni ko‘rish uchun reja qo‘shing.')}</p></Card> : (
            <Card className="!p-0 sm:!p-0">
              <ul>
                {plans.map((p) => {
                  const next = p.tasks.filter((t) => !t.done && t.due).sort((a, b) => (a.due as string).localeCompare(b.due as string))[0];
                  const pr = progress(p);
                  return (
                    <li key={p.id} className="border-b border-line px-4 py-3 last:border-0">
                      <a href={href('plan', p.id)} className="font-semibold text-fg no-underline hover:underline">{nameOf(p.oppId)}</a>
                      <p className="text-[12.5px] text-muted">{pr.done}/{pr.total} {tx('required tasks', 'majburiy vazifa')}{next ? ` · ${tx('next date', 'keyingi sana')}: ${formatDate(next.due, lang)} (${tx('task', 'vazifa')})` : ''}</p>
                      {next && <p className="text-[12.5px]"><TaskName t={next} /></p>}
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </section>
      </div>

      <Card>
        <Field label={tx('Show dates in the bell when they are within', 'Qo‘ng‘iroqchada sanalar shu muddat ichida ko‘rsatilsin')}>
          <Select className="max-w-xs" value={workspace.reminderDays} onChange={(e) => patchWorkspace({ reminderDays: Number(e.target.value) })}>
            {[7, 14, 30, 60].map((n) => <option key={n} value={n}>{tx('{0} days', '{0} kun', n)}</option>)}
          </Select>
        </Field>
        <p className="mt-2 text-[12.5px] text-muted">{tx('In-app list only. Telegram reminders (7 and 1 days before) are set below for signed-in students. No emails or SMS are sent.', 'Faqat ilova ichidagi ro‘yxat. Telegram eslatmalari (7 va 1 kun oldin) quyida, kirgan talabalar uchun sozlanadi. Email yoki SMS yuborilmaydi.')}</p>
        <p className="mt-1 text-[12.5px] text-muted">{tx('Dates you add are your own. They never change official deadlines.', 'Siz qo‘shgan sanalar sizniki. Ular rasmiy muddatlarni o‘zgartirmaydi.')}</p>
      </Card>

      {me ? (
        <RemindersSection />
      ) : (
        <Notice>
          {tx('Sign in to add your own dates, download a calendar file and get Telegram reminders.', 'O‘z sanalaringizni qo‘shish, kalendar faylini yuklab olish va Telegram eslatmalarini olish uchun kiring.')} <a href={href('signin')}>{tx('Sign in', 'Kirish')} →</a>
        </Notice>
      )}
    </div>
  );
}

function TaskName({ t }: { t: Parameters<typeof taskTitle>[0] }) {
  const { pick } = useI18n();
  return <span className="text-muted">{pick(taskTitle(t))}</span>;
}
