import React from 'react';
import { CalendarDays, Copy, Download, Send, Trash2 } from 'lucide-react';
import { Badge, Button, Callout, Card } from '../components/ui';
import { useI18n } from '../lib/derived';
import { useStore } from '../store/store';
import { api, apiUrl } from '../lib/api';
import { logout, useSession } from './session';

/** Settings > Account: reminders on Telegram, the calendar file and feed, a copy of the data, deleting the account. */
export function AccountPanel() {
  const { tx } = useI18n();
  const { navigate, resetAll, notify } = useStore();
  const session = useSession();
  const [tg, setTg] = React.useState(null);
  const [code, setCode] = React.useState(null);
  const [feed, setFeed] = React.useState(null);
  const [feedUrl, setFeedUrl] = React.useState(null);
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState(null);
  const signedIn = session.status === 'user';

  const load = React.useCallback(async () => {
    try {
      setTg(await api('/me/telegram'));
      setFeed((await api('/me/calendar')).feed);
    } catch {
      /* offline */
    }
  }, []);
  React.useEffect(() => {
    if (signedIn) void load();
  }, [signedIn, load]);
  // while a code is shown, notice when the bot has linked the chat
  React.useEffect(() => {
    if (!code || tg?.linked) return undefined;
    const t = setInterval(() => void load(), 4000);
    return () => clearInterval(t);
  }, [code, tg?.linked, load]);

  const run = async (fn) => {
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message || tx('Something went wrong.', 'Xatolik yuz berdi.'));
    }
  };

  if (!signedIn) {
    return (
      <Card className="flex flex-col gap-2 p-5">
        <p className="flex items-center gap-2 font-bold">{tx('Account', 'Akkaunt')}</p>
        <p className="text-[14px] text-muted">{tx('Sign in to keep your data on every device, get Telegram reminders and use live AI.', 'Ma’lumotlarni barcha qurilmalarda saqlash, Telegram eslatmalari va jonli SI uchun kiring.')}</p>
        <Button variant="primary" className="self-start" onClick={() => navigate('signin')}>
          {tx('Sign in', 'Kirish')}
        </Button>
      </Card>
    );
  }
  return (
    <Card className="flex flex-col gap-4 p-5">
      <p className="flex items-center gap-2 font-bold">{tx('Account', 'Akkaunt')}</p>
      {error && <Callout tone="warn">{error}</Callout>}

      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-[14px] font-semibold">
          <Send size={16} />
          {tx('Telegram reminders', 'Telegram eslatmalari')}
          {tg?.linked && <Badge tone={tg.optIn ? 'ok' : 'warn'}>{tg.optIn ? tx('on', 'yoqilgan') : tx('off', 'o‘chirilgan')}</Badge>}
        </p>
        <p className="text-[13px] text-muted">{tx('The bot reminds you before confirmed deadlines and your plan dates, at the days you chose in the calendar. No messages between 22:00 and 08:00 (Tashkent). It never asks for passwords or documents.', 'Bot tasdiqlangan muddatlar va reja sanalaridan oldin, taqvimda tanlagan kunlaringizda eslatadi. 22:00 dan 08:00 gacha (Toshkent) xabar yubormaydi. U hech qachon parol yoki hujjat so‘ramaydi.')}</p>
        {tg && !tg.botAvailable && <Callout>{tx('Telegram reminders are not available yet.', 'Telegram eslatmalari hozircha mavjud emas.')}</Callout>}
        {tg?.botAvailable && !tg.linked && !code && (
          <Button className="self-start" onClick={() => run(async () => setCode(await api('/me/telegram/link-code', { method: 'POST', body: {} })))}>
            {tx('Connect Telegram', 'Telegramni ulash')}
          </Button>
        )}
        {tg?.botAvailable && !tg.linked && code && (
          <div className="rounded-lg border border-line p-3 text-[13.5px]">
            <p>{tx('Open the bot and press Start. If it does not open, send this to the bot:', 'Botni oching va Start tugmasini bosing. Ochilmasa, botga shuni yuboring:')}</p>
            <p className="my-1 font-mono text-[16px] font-bold">/start {code.code}</p>
            <a href={code.deepLink} target="_blank" rel="noreferrer" className="font-semibold underline">
              {tx('Open Telegram', 'Telegramni ochish')}
            </a>
            <p className="mt-1 text-[12px] text-faint">{tx('The code works once and expires in 10 minutes.', 'Kod bir marta ishlaydi va 10 daqiqada tugaydi.')}</p>
          </div>
        )}
        {tg?.linked && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => run(() => api('/me/telegram', { method: 'PUT', body: { optIn: !tg.optIn } }))}>{tg.optIn ? tx('Pause reminders', 'Eslatmalarni to‘xtatish') : tx('Resume reminders', 'Eslatmalarni davom ettirish')}</Button>
            <Button variant="ghost" onClick={() => run(async () => { await api('/me/telegram', { method: 'DELETE' }); setCode(null); })}>{tx('Disconnect', 'Uzish')}</Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-line pt-4">
        <p className="flex items-center gap-2 text-[14px] font-semibold">
          <CalendarDays size={16} />
          {tx('Calendar file', 'Kalendar fayli')}
        </p>
        <p className="text-[13px] text-muted">{tx('Confirmed, still-open dates and your own dates as all-day events. Unverified dates are left out.', 'Tasdiqlangan, hali ochiq sanalar va o‘z sanalaringiz kun bo‘yi davom etadigan tadbir sifatida. Tasdiqlanmagan sanalar kiritilmaydi.')}</p>
        <div className="flex flex-wrap gap-2">
          <a href={apiUrl('/me/calendar.ics')} download className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-fg no-underline hover:bg-sunken">
            <Download size={16} />
            {tx('Download .ics', '.ics yuklab olish')}
          </a>
          <Button onClick={() => run(async () => setFeedUrl((await api('/me/calendar/token', { method: 'POST', body: {} })).url))}>
            {feed?.active ? tx('Replace private link', 'Shaxsiy havolani almashtirish') : tx('Create private link', 'Shaxsiy havola yaratish')}
          </Button>
          {feed?.active && <Button variant="ghost" onClick={() => run(async () => { await api('/me/calendar/token', { method: 'DELETE' }); setFeedUrl(null); })}>{tx('Turn the link off', 'Havolani o‘chirish')}</Button>}
        </div>
        {feedUrl && (
          <div className="rounded-lg border border-line p-3 text-[13px]">
            <p className="font-semibold">{tx('Your private calendar link (shown once):', 'Shaxsiy kalendar havolangiz (bir marta ko‘rsatiladi):')}</p>
            <p className="my-1 break-all font-mono text-[12px]">{feedUrl}</p>
            <Button size="sm" onClick={() => { navigator.clipboard?.writeText(feedUrl); notify(tx('Copied', 'Nusxalandi')); }}>
              <Copy size={14} />
              {tx('Copy', 'Nusxalash')}
            </Button>
            <p className="mt-1 text-[12px] text-faint">{tx('Anyone with the link can see your dates. Turn it off if it leaks.', 'Havolasi borlar sanalaringizni ko‘ra oladi. Oshkor bo‘lsa, o‘chirib qo‘ying.')}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-line pt-4">
        <p className="text-[14px] font-semibold">{tx('Your data', 'Ma’lumotlaringiz')}</p>
        <div className="flex flex-wrap items-end gap-2">
          <a href={apiUrl('/me/export')} download className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-fg no-underline hover:bg-sunken">
            <Download size={16} />
            {tx('Download my data', 'Ma’lumotlarimni yuklab olish')}
          </a>
          <Button variant="ghost" onClick={() => logout().then(() => navigate('home'))}>{tx('Sign out', 'Chiqish')}</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input aria-label={tx('Type DELETE to confirm', 'Tasdiqlash uchun DELETE deb yozing')} placeholder="DELETE" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-10 w-32 rounded-lg border border-line bg-surface px-3 text-sm" />
          <Button
            variant="ghost"
            disabled={confirm !== 'DELETE'}
            onClick={() => run(async () => { await api('/me', { method: 'DELETE', body: { confirm: 'DELETE' } }); resetAll(); await logout(); navigate('home'); })}
          >
            <Trash2 size={16} />
            {tx('Delete my account and data', 'Akkauntim va ma’lumotlarimni o‘chirish')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
