import { useEffect, useRef, useState } from 'react';
import { RemindersSection } from './Reminders';
import { Download, LogOut, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { useCloud } from '../sync/CloudSync';
import { useStore } from '../store/AppStore';
import { API_BASE, api, ApiError } from '../lib/api';
import { formatDate } from '../lib/format';
import { href, navigate } from '../lib/router';
import { LangSwitch, ThemeToggle } from '../components/common';
import { Badge, Button, Card, Field, Input, Notice, Section } from '../components/ui';
import { GUIDE_IMAGE } from '../lib/guide';
import { GUIDES, type Guide } from '../lib/workspace';

/**
 * Telegram's login button. Its script needs eval(), which the site's security policy forbids, so it runs in a tiny
 * separate page (public/telegram-login.html) and hands the signed result back with postMessage. The server verifies it.
 */
function TelegramWidget({ bot, onAuth }: { bot: string; onAuth: (u: Record<string, unknown>) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const { tx } = useI18n();
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const d = e.data as { type?: string; user?: Record<string, unknown> } | null;
      if (d?.type === 'edubridge:telegram-auth' && d.user && typeof d.user === 'object') onAuth(d.user);
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, [onAuth]);
  return <iframe ref={frame} title={tx('Sign in with Telegram', 'Telegram orqali kirish')} src={`/telegram-login.html?bot=${encodeURIComponent(bot)}`} className="h-[56px] w-full border-0" />;
}

export function SignIn() {
  const { tx, t } = useI18n();
  const { me, providers, offline, refresh } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('dev');

  useEffect(() => {
    if (me) navigate('settings');
  }, [me]);

  const done = async () => {
    await refresh();
    navigate('settings');
  };
  const failed = (e: unknown) => {
    setError(e instanceof ApiError && e.status === 401 ? tx('Sign-in could not be verified. Try again.', 'Kirishni tasdiqlab bo‘lmadi. Qayta urinib ko‘ring.') : tx('Sign-in is not available right now.', 'Hozir kirish mumkin emas.'));
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-extrabold">{t('nav.signin')}</h1>
      <p className="text-muted">
        {tx('Sign in to keep your saved universities and settings on every device. You can use EduBridge without an account.', 'Saqlangan universitetlar va sozlamalaringizni barcha qurilmalarda saqlash uchun kiring. EduBridge’dan akkauntsiz ham foydalanish mumkin.')}
      </p>
      {offline && <Notice tone="warn">{tx('Accounts are not available in this version or the server cannot be reached.', 'Bu versiyada akkauntlar mavjud emas yoki serverga ulanib bo‘lmadi.')}</Notice>}
      {error && <div role="alert"><Notice tone="warn">{error}</Notice></div>}

      <Card className="space-y-4">
        {providers?.telegram && (
          <div>
            <p className="mb-2 font-semibold">Telegram</p>
            <TelegramWidget
              bot={providers.telegram.botUsername}
              onAuth={(u) => {
                api('/auth/telegram', { method: 'POST', body: u }).then(done, failed);
              }}
            />
          </div>
        )}
        {providers?.google && (
          <a href={`${API_BASE}/api/v1/auth/google/start`} className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-line bg-surface px-4 font-semibold text-fg no-underline hover:bg-sunken">
            {tx('Continue with Google', 'Google orqali davom etish')}
          </a>
        )}
        {providers?.dev && (
          <form
            className="space-y-2 rounded-xl border border-dashed border-warn/60 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              api('/auth/dev-login', { method: 'POST', body: { name } }).then(done, failed);
            }}
          >
            <p className="text-sm font-semibold text-warn">{tx('Development sign-in (never available in production)', 'Ishlab chiqish uchun kirish (productionda hech qachon mavjud emas)')}</p>
            <Field label={tx('Dev user name', 'Dev foydalanuvchi nomi')}>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
            </Field>
            <Button type="submit" variant="primary">{tx('Sign in (dev)', 'Kirish (dev)')}</Button>
          </form>
        )}
        {providers && !providers.telegram && !providers.google && !providers.dev && (
          <p className="text-sm text-muted">{tx('No sign-in method is configured on this server yet.', 'Bu serverda hali birorta kirish usuli sozlanmagan.')}</p>
        )}
      </Card>

      <p className="text-sm text-muted">
        {tx('We store only the id your sign-in provider gives us — no name, email or phone number. EduBridge never asks for your university application passwords.', 'Biz faqat kirish provayderi bergan identifikatorni saqlaymiz — ism, email yoki telefon raqamini emas. EduBridge universitet ariza parollaringizni hech qachon so‘ramaydi.')}
      </p>
      <p><a href={href('home')}>{tx('Continue as a guest', 'Mehmon sifatida davom etish')}</a></p>
    </div>
  );
}

type SessionRow = { id: string; userAgent: string | null; createdAt: string; current: boolean };

export function Settings() {
  const { tx, lang } = useI18n();
  const { me, providers, offline, refresh, logout } = useAuth();
  const cloud = useCloud();
  const store = useStore();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [confirm, setConfirm] = useState('');
  const [uploadResult, setUploadResult] = useState<string | null>(null);

  const loadSessions = () => api<{ items: SessionRow[] }>('/me/sessions').then((r) => setSessions(r.items), () => {});
  useEffect(() => {
    if (me) void loadSessions();
  }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportData = async () => {
    try {
      const data = await api('/me/export');
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edubridge-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage(tx('Could not export your data.', 'Ma’lumotlarni eksport qilib bo‘lmadi.'));
    }
  };

  const deleteAccount = async () => {
    try {
      await api('/me', { method: 'DELETE', body: { confirm: 'DELETE' } });
      store.resetAll();
      await refresh();
      navigate('home');
    } catch {
      setMessage(tx('Could not delete the account.', 'Akkauntni o‘chirib bo‘lmadi.'));
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold">{tx('Settings', 'Sozlamalar')}</h1>

      <Card className="flex flex-wrap items-center gap-4">
        <div>
          <p className="font-semibold">{tx('Language', 'Til')}</p>
          <LangSwitch />
        </div>
        <div>
          <p className="font-semibold">{tx('Theme', 'Mavzu')}</p>
          <ThemeToggle />
        </div>
      </Card>

      <Section title={tx('Account', 'Akkaunt')} id="account">
        {!me ? (
          <Card className="space-y-2">
            <p>{offline ? tx('Accounts are not available in this version or the server cannot be reached.', 'Bu versiyada akkauntlar mavjud emas yoki serverga ulanib bo‘lmadi.') : tx('You are using EduBridge as a guest. Your data stays in this browser.', 'Siz EduBridge’dan mehmon sifatida foydalanmoqdasiz. Ma’lumotlaringiz shu brauzerda qoladi.')}</p>
            {!offline && <a href={href('signin')} className="inline-flex min-h-[44px] items-center rounded-xl bg-brand px-4 font-semibold text-brand-fg no-underline">{tx('Sign in', 'Kirish')}</a>}
          </Card>
        ) : (
          <div className="space-y-3">
            {cloud.needsUpload && (
              <Notice title={tx('Upload the data from this device?', 'Shu qurilmadagi ma’lumotlarni yuklaymizmi?')}>
                <p>{tx('Your account is new. You can copy what you saved on this device to it. Nothing already in your account is overwritten.', 'Akkauntingiz yangi. Shu qurilmada saqlaganlaringizni unga ko‘chirishingiz mumkin. Akkauntdagi mavjud ma’lumotlar ustidan yozilmaydi.')}</p>
                <span className="mt-2 flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => void cloud.upload().then((r) => setUploadResult(r ? tx('Uploaded.', 'Yuklandi.') : tx('Upload failed.', 'Yuklash amalga oshmadi.')))}>{tx('Upload', 'Yuklash')}</Button>
                  <Button size="sm" onClick={cloud.dismissUpload}>{tx('Not now', 'Hozir emas')}</Button>
                </span>
              </Notice>
            )}
            {uploadResult && <p role="status" className="text-sm">{uploadResult}</p>}
            <Card className="space-y-2">
              <p className="text-sm text-muted">{tx('Signed in. Member since {0}.', 'Kirdingiz. A’zolik sanasi: {0}.', formatDate(me.createdAt, lang) ?? '')}</p>
              <p className="flex flex-wrap items-center gap-2 text-sm">
                {tx('Sign-in methods', 'Kirish usullari')}: {me.identities.map((i) => <Badge key={i.provider} tone="brand">{i.provider === 'telegram' ? 'Telegram' : 'Google'}</Badge>)}
              </p>
              {providers?.google && !me.identities.some((i) => i.provider === 'google') && (
                <a href={`${API_BASE}/api/v1/auth/google/start?link=1`}>{tx('Link a Google account', 'Google akkauntini ulash')}</a>
              )}
              <p className="text-xs text-muted" role="status" aria-live="polite">
                {cloud.status === 'syncing' ? tx('Syncing…', 'Sinxronlanmoqda…') : cloud.status === 'error' ? tx('Sync problem. Changes stay on this device and will retry.', 'Sinxronlashda muammo. O‘zgarishlar shu qurilmada qoladi va qayta uriniladi.') : tx('Everything is synced.', 'Hammasi sinxronlangan.')}
              </p>
              <Button onClick={() => void logout().then(() => navigate('home'))}><LogOut size={16} aria-hidden /> {tx('Sign out', 'Chiqish')}</Button>
            </Card>

            <Card className="space-y-2">
              <h3 className="font-extrabold">{tx('Devices', 'Qurilmalar')}</h3>
              <ul className="divide-y divide-line text-sm">
                {sessions.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span>
                      {(s.userAgent ?? '').slice(0, 60) || tx('Unknown device', 'Noma’lum qurilma')} · {formatDate(s.createdAt, lang)}
                      {s.current && <Badge tone="ok" className="ml-2">{tx('This device', 'Shu qurilma')}</Badge>}
                    </span>
                    {!s.current && <Button size="sm" onClick={() => void api(`/me/sessions/${s.id}`, { method: 'DELETE' }).then(loadSessions)}>{tx('Sign out this device', 'Bu qurilmadan chiqarish')}</Button>}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="space-y-2">
              <h3 className="font-extrabold">{tx('Your data', 'Sizning ma’lumotlaringiz')}</h3>
              <p className="text-sm text-muted">{tx('Download everything stored in your account, or delete it permanently.', 'Akkauntingizda saqlangan hamma narsani yuklab oling yoki butunlay o‘chiring.')}</p>
              <Button onClick={() => void exportData()}><Download size={16} aria-hidden /> {tx('Download my data', 'Ma’lumotlarimni yuklab olish')}</Button>
              <div className="rounded-xl border border-bad/40 p-3">
                <p className="text-sm font-semibold text-bad">{tx('Delete account', 'Akkauntni o‘chirish')}</p>
                <p className="text-sm">{tx('This permanently deletes your account and all data in it. Type DELETE to confirm.', 'Bu akkauntingizni va undagi barcha ma’lumotlarni butunlay o‘chiradi. Tasdiqlash uchun DELETE deb yozing.')}</p>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <Field label={tx('Confirmation', 'Tasdiqlash')}>
                    <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
                  </Field>
                  <Button disabled={confirm !== 'DELETE'} onClick={() => void deleteAccount()} className="bg-bad text-white hover:opacity-90"><Trash2 size={16} aria-hidden /> {tx('Delete forever', 'Butunlay o‘chirish')}</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
        {message && <p role="alert" className="mt-2 text-sm text-bad">{message}</p>}
      </Section>

      {me && <RemindersSection />}

      <Section title={tx('Your EduBridge guide', 'Sizning EduBridge yo‘lboshchingiz')} id="guide">
        <Card className="space-y-3">
          <p className="text-sm text-muted">{tx('Pick the character who appears on the home page and in messages. Both give exactly the same help.', 'Bosh sahifa va xabarlarda ko‘rinadigan qahramonni tanlang. Ikkalasi ham aynan bir xil yordam beradi.')}</p>
          <div role="radiogroup" aria-label={tx('Your EduBridge guide', 'Sizning EduBridge yo‘lboshchingiz')} className="flex flex-wrap gap-3">
            {GUIDES.map((g: Guide) => (
              <button key={g} type="button" role="radio" aria-checked={store.workspace.guide === g} onClick={() => store.patchWorkspace({ guide: g })} className={'flex w-36 flex-col items-center gap-2 rounded-xl border p-3 text-[13.5px] font-semibold ' + (store.workspace.guide === g ? 'border-navy bg-navy-soft' : 'border-line hover:bg-sunken')}>
                <img src={GUIDE_IMAGE[g]} alt="" className="h-24 w-24 object-contain" />
                {g === 'male' ? tx('Boy guide', 'Yigit yo‘lboshchi') : g === 'female' ? tx('Girl guide', 'Qiz yo‘lboshchi') : tx('No preference', 'Farqi yo‘q')}
              </button>
            ))}
          </div>
        </Card>
      </Section>
      <Section title={tx('One-page summary', 'Bir sahifalik xulosa')} id="summary">
        <Card className="space-y-2">
          <p className="text-sm text-muted">{tx('Make an A4 summary of your targets, gaps, plan and deadlines to print, save as PDF or share as an image. It is made on this device.', 'Maqsadlar, bo‘shliqlar, reja va muddatlaringiz bo‘yicha A4 xulosa tuzing: chop eting, PDF qiling yoki rasm sifatida ulashing. U shu qurilmada yaratiladi.')}</p>
          <a href={href('summary')} className="inline-flex min-h-[44px] items-center rounded-xl border border-line px-4 font-semibold text-fg no-underline hover:bg-sunken">{tx('Open the summary', 'Xulosani ochish')}</a>
        </Card>
      </Section>

      <Section title={tx('Data on this device', 'Shu qurilmadagi ma’lumotlar')} id="local">
        <Card className="space-y-2">
          <p className="text-sm text-muted">{tx('Guests keep everything in this browser only. Nothing is sent to a server unless you sign in.', 'Mehmonlar hamma narsani faqat shu brauzerda saqlaydi. Kirmasangiz, serverga hech narsa yuborilmaydi.')}</p>
          <Button onClick={() => { store.resetAll(); setMessage(tx('Local data deleted.', 'Mahalliy ma’lumotlar o‘chirildi.')); }}>{tx('Delete data on this device', 'Shu qurilmadagi ma’lumotlarni o‘chirish')}</Button>
        </Card>
      </Section>
    </div>
  );
}
