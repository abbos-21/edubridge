import React from 'react';
import { LogOut } from 'lucide-react';
import { Button, Callout, Card, Field, Input } from '../components/ui';
import { useI18n } from '../lib/derived';
import { useStore } from '../store/store';
import { api, apiUrl } from '../lib/api';
import { devLogin, logout, refreshSession, useSession } from './session';

/** Telegram's widget needs eval(), so it lives in its own tiny page (public/telegram-login.html) and posts the signed result back. */
function TelegramWidget({ bot, onAuth }) {
  const frame = React.useRef(null);
  React.useEffect(() => {
    const on = (e) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      if (e.data?.type === 'edubridge:telegram-auth' && e.data.user) onAuth(e.data.user);
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, [onAuth]);
  return <iframe ref={frame} title="Telegram" src={`/telegram-login.html?bot=${encodeURIComponent(bot)}`} className="h-[56px] w-full border-0" />;
}

/** The account part of the sign-in page: who is signed in, or the ways to sign in. Everything else stays as in the original. */
export function AccountSignIn() {
  const { tx } = useI18n();
  const { navigate } = useStore();
  const session = useSession();
  const [error, setError] = React.useState(null);
  const [name, setName] = React.useState('dev');
  const failed = () => setError(tx('Sign-in could not be completed. Try again.', 'Kirishni yakunlab bo‘lmadi. Qayta urinib ko‘ring.'));
  const done = async () => {
    await refreshSession();
    navigate('dashboard');
  };

  if (session.status === 'user') {
    return (
      <Card className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="font-bold">{tx('You are signed in', 'Siz tizimga kirgansiz')}</p>
          <p className="text-[13px] text-muted">{tx('Your profile, saved items and plans are kept in your account.', 'Profilingiz, saqlanganlar va rejalaringiz akkauntingizda saqlanadi.')}</p>
        </div>
        <Button onClick={() => logout()}>
          <LogOut size={16} />
          {tx('Sign out', 'Chiqish')}
        </Button>
      </Card>
    );
  }
  const p = session.providers;
  if (!p || (!p.telegram && !p.google && !p.dev)) {
    return session.status === 'offline' ? <Callout tone="warn">{tx('The server cannot be reached, so accounts are not available right now. You can keep using EduBridge in this browser.', 'Serverga ulanib bo‘lmadi, shuning uchun akkauntlar hozir mavjud emas. EduBridge’dan shu brauzerda foydalanishda davom etishingiz mumkin.')}</Callout> : null;
  }
  return (
    <Card className="flex flex-col gap-4 p-4">
      <div>
        <p className="font-bold">{tx('Sign in to keep your data in an account', 'Ma’lumotlarni akkauntda saqlash uchun kiring')}</p>
        <p className="text-[13px] text-muted">{tx('Your profile, plans and drafts follow you to every device. We store only the id your sign-in provider gives us.', 'Profil, reja va qoralamalaringiz barcha qurilmalarda siz bilan bo‘ladi. Biz faqat kirish provayderi bergan identifikatorni saqlaymiz.')}</p>
      </div>
      {error && <Callout tone="warn">{error}</Callout>}
      {p.telegram && <TelegramWidget bot={p.telegram.botUsername} onAuth={(u) => api('/auth/telegram', { method: 'POST', body: u }).then(done, failed)} />}
      {p.google && (
        <a href={apiUrl('/auth/google/start')} className="inline-flex h-10 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-fg no-underline hover:bg-sunken">
          {tx('Continue with Google', 'Google orqali davom etish')}
        </a>
      )}
      {p.dev && (
        <form
          className="flex flex-col gap-2 rounded-lg border border-dashed border-warn/60 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            devLogin(name).then(() => navigate('dashboard'), failed);
          }}
        >
          <p className="text-[13px] font-semibold text-warn">{tx('Development sign-in (never available in production)', 'Ishlab chiqish uchun kirish (productionda hech qachon mavjud emas)')}</p>
          <Field label={tx('Dev user name', 'Dev foydalanuvchi nomi')} htmlFor="dev-name">
            <Input id="dev-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
          </Field>
          <Button type="submit" variant="primary">
            {tx('Sign in (dev)', 'Kirish (dev)')}
          </Button>
        </form>
      )}
    </Card>
  );
}
