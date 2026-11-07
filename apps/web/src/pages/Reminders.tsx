import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Copy, Download, Send, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { api, ApiError } from '../lib/api';
import { formatDate } from '../lib/format';
import { useCollection, type Versioned } from '../ai/useCollection';
import { Badge, Button, Card, Field, Input, Notice, Section } from '../components/ui';

type TgState = { botAvailable: boolean; botUsername: string | null; linked: boolean; optIn: boolean };
type CalState = { feed: { active: boolean; createdAt?: string }; upcoming: Array<{ date: string; kind: string; title: string }>; total: number };
type Rem = { id: string; dueAt: string; itemDate: string | null; title: string | null };
type EventRow = Versioned & { data: { title?: string; date?: string } };

/** Reminders, calendar and the student's own dates. Shown in Settings for signed-in students. */
export function RemindersSection() {
  return (
    <Section title={useI18n().tx('Reminders and calendar', 'Eslatmalar va kalendar')} id="reminders">
      <div className="space-y-3">
        <MyDates />
        <CalendarCard />
        <TelegramCard />
      </div>
    </Section>
  );
}

function TelegramCard() {
  const { tx } = useI18n();
  const [st, setSt] = useState<TgState | null>(null);
  const [code, setCode] = useState<{ code: string; deepLink: string; expiresAt: string } | null>(null);
  const [rem, setRem] = useState<Rem[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setSt(await api<TgState>('/me/telegram'));
      setRem((await api<{ items: Rem[] }>('/me/reminders')).items);
    } catch { /* offline: leave as is */ }
  }, []);
  useEffect(() => { void load(); }, [load]);
  // while a code is shown, notice when the bot linked the chat
  useEffect(() => {
    if (!code || st?.linked) return;
    const t = setInterval(() => void load(), 4000);
    return () => clearInterval(t);
  }, [code, st?.linked, load]);
  useEffect(() => { if (st?.linked) setCode(null); }, [st?.linked]);

  const run = async (fn: () => Promise<unknown>) => {
    setMsg(null);
    try { await fn(); await load(); } catch (e) { setMsg(e instanceof ApiError ? e.message : tx('Something went wrong.', 'Xatolik yuz berdi.')); }
  };

  if (!st) return null;
  return (
    <Card className="space-y-3">
      <h3 className="flex items-center gap-2 font-extrabold"><Send size={18} aria-hidden /> {tx('Telegram reminders', 'Telegram eslatmalari')}</h3>
      <p className="text-sm text-muted">{tx('The bot reminds you 7 days and 1 day before a confirmed deadline you saved, and before dates in your plan. No messages between 22:00 and 08:00 (Tashkent). The bot never asks for passwords, documents or payment details.', 'Bot saqlagan tasdiqlangan muddatingizdan va rejangizdagi sanalardan 7 kun va 1 kun oldin eslatadi. Soat 22:00 dan 08:00 gacha (Toshkent) xabar yubormaydi. Bot hech qachon parol, hujjat yoki to‘lov ma’lumotlarini so‘ramaydi.')}</p>
      {!st.botAvailable && <Notice tone="warn">{tx('Telegram reminders are not available yet.', 'Telegram eslatmalari hozircha mavjud emas.')}</Notice>}
      {st.botAvailable && !st.linked && (
        <div className="space-y-2">
          {!code ? (
            <Button variant="primary" onClick={() => void run(async () => setCode(await api('/me/telegram/link-code', { method: 'POST', body: {} })))}>{tx('Connect Telegram', 'Telegramni ulash')}</Button>
          ) : (
            <div className="space-y-2 rounded-xl border border-line p-3">
              <p className="text-sm">{tx('Open the bot and press Start. If it does not open, send this to the bot:', 'Botni oching va Start tugmasini bosing. Ochilmasa, botga shuni yuboring:')}</p>
              <p className="font-mono text-lg font-bold" aria-label={tx('Link code', 'Ulash kodi')}>/start {code.code}</p>
              <a href={code.deepLink} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center rounded-xl bg-brand px-4 font-semibold text-brand-fg no-underline">{tx('Open Telegram', 'Telegramni ochish')}</a>
              <p className="text-xs text-muted">{tx('The code works once and expires in 10 minutes.', 'Kod bir marta ishlaydi va 10 daqiqada tugaydi.')}</p>
            </div>
          )}
        </div>
      )}
      {st.linked && (
        <div className="space-y-2">
          <p className="flex items-center gap-2"><Badge tone={st.optIn ? 'ok' : 'warn'}>{st.optIn ? tx('on', 'yoqilgan') : tx('off', 'o‘chirilgan')}</Badge> {tx('Telegram is connected.', 'Telegram ulangan.')}</p>
          <label className="flex min-h-[44px] items-center gap-2">
            <input type="checkbox" className="h-5 w-5" checked={st.optIn} onChange={(e) => void run(() => api('/me/telegram', { method: 'PUT', body: { optIn: e.target.checked } }))} />
            <span>{tx('Send me reminders', 'Menga eslatmalar yuborilsin')}</span>
          </label>
          <Button onClick={() => void run(() => api('/me/telegram', { method: 'DELETE' }))}>{tx('Disconnect Telegram', 'Telegramni uzish')}</Button>
          <p className="text-xs text-muted">{tx('In Telegram you can also send /stop, /status and /language.', 'Telegramda /stop, /status va /language buyruqlarini ham yuborishingiz mumkin.')}</p>
        </div>
      )}
      {msg && <p role="alert" className="text-sm text-bad">{msg}</p>}
      {st.linked && st.optIn && (
        <div>
          <h4 className="text-sm font-bold">{tx('Scheduled reminders', 'Rejalashtirilgan eslatmalar')}</h4>
          {rem.length === 0 ? <p className="text-sm text-muted">{tx('Nothing is scheduled. Save a university with a confirmed deadline or add a date above.', 'Hech narsa rejalashtirilmagan. Tasdiqlangan muddatli universitetni saqlang yoki yuqoriga sana qo‘shing.')}</p> : (
            <ul className="text-sm">{rem.slice(0, 8).map((r) => <li key={r.id}>{formatDate(r.dueAt, 'en') ?? r.dueAt.slice(0, 10)} — {r.title}</li>)}</ul>
          )}
        </div>
      )}
    </Card>
  );
}

function CalendarCard() {
  const { tx, lang } = useI18n();
  const [cal, setCal] = useState<CalState | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const load = useCallback(async () => { try { setCal(await api<CalState>('/me/calendar')); } catch { /* ignore */ } }, []);
  useEffect(() => { void load(); }, [load]);
  if (!cal) return null;
  return (
    <Card className="space-y-3">
      <h3 className="flex items-center gap-2 font-extrabold"><CalendarDays size={18} aria-hidden /> {tx('Calendar', 'Kalendar')}</h3>
      <p className="text-sm text-muted">{tx('Confirmed, still-open deadlines of the universities you saved, plus your own dates. Closed deadlines and dates without a source are left out. They appear as all-day events.', 'Saqlagan universitetlaringizning tasdiqlangan, hali ochiq muddatlari va o‘zingizning sanalaringiz. Yopilgan va manbasiz muddatlar kiritilmaydi. Ular kun bo‘yi davom etadigan tadbir sifatida chiqadi.')}</p>
      {cal.upcoming.length === 0 ? <p className="text-sm text-muted">{tx('No dates yet.', 'Hozircha sanalar yo‘q.')}</p> : <ul className="text-sm">{cal.upcoming.slice(0, 6).map((u, i) => <li key={i}>{formatDate(u.date, lang)} — {u.title}</li>)}</ul>}
      <div className="flex flex-wrap gap-2">
        <a href="/api/v1/me/calendar.ics" download className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-line px-4 font-semibold text-fg no-underline hover:bg-sunken"><Download size={16} aria-hidden /> {tx('Download .ics file', '.ics faylini yuklab olish')}</a>
        <Button onClick={async () => { const r = await api<{ url: string }>('/me/calendar/token', { method: 'POST', body: {} }); setUrl(r.url); setCopied(false); void load(); }}>{cal.feed.active ? tx('Replace private link', 'Shaxsiy havolani almashtirish') : tx('Create private link', 'Shaxsiy havola yaratish')}</Button>
        {cal.feed.active && <Button onClick={async () => { await api('/me/calendar/token', { method: 'DELETE' }); setUrl(null); void load(); }}>{tx('Turn the link off', 'Havolani o‘chirish')}</Button>}
      </div>
      {url && (
        <div className="space-y-1 rounded-xl border border-line p-3">
          <p className="text-sm font-semibold">{tx('Your private calendar link (shown once):', 'Shaxsiy kalendar havolangiz (bir marta ko‘rsatiladi):')}</p>
          <p className="break-all font-mono text-xs">{url}</p>
          <Button size="sm" onClick={() => { void navigator.clipboard?.writeText(url).then(() => setCopied(true)); }}><Copy size={14} aria-hidden /> {copied ? tx('Copied', 'Nusxalandi') : tx('Copy', 'Nusxalash')}</Button>
          <p className="text-xs text-muted">{tx('Add it in Google Calendar (Other calendars → From URL) or iPhone (Settings → Calendar → Accounts → Add subscribed calendar). Anyone with the link can see your dates, so do not share it. Turn it off if it leaks.', 'Uni Google Calendar (Boshqa kalendarlar → URL orqali) yoki iPhone (Sozlamalar → Kalendar → Hisoblar → Obuna kalendar qo‘shish) ga qo‘shing. Havolasi borlar sanalaringizni ko‘ra oladi, shuning uchun uni ulashmang. Oshkor bo‘lsa, o‘chirib qo‘ying.')}</p>
        </div>
      )}
      {cal.feed.active && !url && <p className="text-xs text-muted">{tx('A private link is active. For safety it cannot be shown again; replace it to get a new one.', 'Shaxsiy havola faol. Xavfsizlik uchun uni qayta ko‘rsatib bo‘lmaydi; yangisini olish uchun almashtiring.')}</p>}
    </Card>
  );
}

function MyDates() {
  const { tx, lang } = useI18n();
  const events = useCollection<EventRow>('events');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const items = [...events.items].filter((e) => e.data?.date).sort((a, b) => a.data.date!.localeCompare(b.data.date!));
  return (
    <Card className="space-y-3">
      <h3 className="font-extrabold">{tx('My dates', 'Mening sanalarim')}</h3>
      <p className="text-sm text-muted">{tx('Add your own dates (a test, a visa appointment, a document deadline). They go into your calendar and reminders.', 'O‘zingizning sanalaringizni qo‘shing (imtihon, viza uchrashuvi, hujjat muddati). Ular kalendar va eslatmalaringizga tushadi.')}</p>
      <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end" onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        try { await events.create({ data: { title: title.trim(), date } }); setTitle(''); setDate(''); } catch { setErr(tx('Could not save the date.', 'Sanani saqlab bo‘lmadi.')); }
      }}>
        <Field label={tx('What', 'Nima')}><Input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label={tx('Date', 'Sana')}><Input required type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Button type="submit" variant="primary" disabled={!title.trim() || !date}>{tx('Add', 'Qo‘shish')}</Button>
      </form>
      {err && <p role="alert" className="text-sm text-bad">{err}</p>}
      {items.length > 0 && (
        <ul className="divide-y divide-line text-sm">
          {items.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 py-1">
              <span>{formatDate(e.data.date, lang)} — {e.data.title}</span>
              <Button size="sm" variant="ghost" aria-label={tx('Delete {0}', '{0} ni o‘chirish', e.data.title ?? '')} onClick={() => void events.remove(e.id)}><Trash2 size={14} aria-hidden /></Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
