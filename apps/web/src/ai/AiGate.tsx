import type { ReactNode } from 'react';
import { Loader2, Square } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { formatDate } from '../lib/format';
import { href } from '../lib/router';
import { Button, Card, Notice } from '../components/ui';
import { useAiErrorText, useAiStatus } from './useAi';

/** Shows what the student needs to do before an AI feature can run (sign in, AI on), then the feature itself. */
export function AiGate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { tx, lang } = useI18n();
  const s = useAiStatus();

  if (s.offline) {
    return (
      <div className="space-y-4">
        <Notice tone="warn">{tx('The AI advisor needs an account and a connection to the EduBridge server. It is not available in this version.', 'SI maslahatchi akkaunt va EduBridge serveriga ulanishni talab qiladi. Bu versiyada mavjud emas.')}</Notice>
        {fallback}
      </div>
    );
  }
  if (!s.me) {
    return (
      <div className="space-y-4">
        <Card className="space-y-2">
          <h2 className="font-extrabold">{tx('Sign in to use the AI advisor', 'SI maslahatchidan foydalanish uchun kiring')}</h2>
          <p className="text-sm text-muted">{tx('The advisor reads your documents and keeps your chats, so it needs an account. Everything else in EduBridge works without one.', 'Maslahatchi hujjatlaringizni o‘qiydi va suhbatlaringizni saqlaydi, shuning uchun akkaunt kerak. EduBridge’ning qolgan qismi akkauntsiz ishlaydi.')}</p>
          <a href={href('signin')} className="inline-flex min-h-[44px] items-center rounded-xl bg-brand px-4 font-semibold text-brand-fg no-underline">{tx('Sign in', 'Kirish')}</a>
        </Card>
        {fallback}
      </div>
    );
  }
  if (!s.health) return <p role="status" className="py-6 text-center text-muted">{tx('Loading…', 'Yuklanmoqda…')}</p>;
  if (s.health.suspended) return <Notice tone="warn">{tx('AI access is switched off for your account.', 'Akkauntingiz uchun SI o‘chirilgan.')}</Notice>;
  if (!s.health.enabled) {
    return (
      <div className="space-y-4">
        <Notice tone="warn">{tx('The AI advisor is not connected.', 'SI maslahatchi ulanmagan.')}</Notice>
        {fallback}
      </div>
    );
  }
  const q = s.health.quota;
  return (
    <div className="space-y-4">
      {s.health.mock && <Notice tone="warn">{tx('Development mode: replies come from a built-in test model, not a real AI.', 'Ishlab chiqish rejimi: javoblar haqiqiy SI emas, ichki sinov modelidan keladi.')}</Notice>}
      {children}
      {q && (
        <p className="text-xs text-muted" role="status">
          {tx('AI requests left today: {0} of {1}. They reset at {2}.', 'Bugun qolgan SI so‘rovlari: {0} / {1}. {2} da tiklanadi.', q.remainingToday, q.dailyLimit, formatDate(q.resetsAt, lang) ?? '')}
        </p>
      )}
    </div>
  );
}

/** Progress with a Stop button while an AI request runs. */
export function Thinking({ onStop, label }: { onStop: () => void; label?: string }) {
  const { tx } = useI18n();
  return (
    <p className="flex flex-wrap items-center gap-3 text-sm text-muted" role="status">
      <Loader2 size={16} className="animate-spin" aria-hidden />
      {label ?? tx('Thinking…', 'O‘ylamoqda…')}
      <Button size="sm" onClick={onStop}><Square size={14} aria-hidden /> {tx('Stop', 'To‘xtatish')}</Button>
    </p>
  );
}

export function AiError({ error }: { error: unknown }) {
  const text = useAiErrorText();
  if (!error) return null;
  return <div role="alert"><Notice tone="warn">{text(error)}</Notice></div>;
}
