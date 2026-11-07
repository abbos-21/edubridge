import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { ApiError } from '../lib/api';
import { aiHealth, type AiHealth } from '../lib/ai';

/** The AI is usable only when signed in and the server has it switched on. */
export function useAiStatus() {
  const { me, offline } = useAuth();
  const [health, setHealth] = useState<AiHealth | null>(null);
  const refresh = useCallback(async () => {
    try {
      setHealth(await aiHealth());
    } catch {
      setHealth(null);
    }
  }, []);
  useEffect(() => {
    if (!offline) void refresh();
  }, [me?.id, offline, refresh]);
  return { me, offline, health, refresh, ready: !!me && !!health?.enabled && !health.suspended };
}

/** Plain-language message for an AI failure, in the interface language. */
export function useAiErrorText() {
  const { tx } = useI18n();
  return (e: unknown): string => {
    const code = e instanceof ApiError ? e.code : 'network';
    switch (code) {
      case 'unauthenticated': return tx('Sign in to use the AI advisor.', 'SI maslahatchisidan foydalanish uchun kiring.');
      case 'ai_disabled': return tx('The AI advisor is switched off right now.', 'SI maslahatchi hozir o‘chirilgan.');
      case 'ai_not_configured': return tx('The AI advisor is not connected.', 'SI maslahatchi ulanmagan.');
      case 'ai_suspended': return tx('AI access is switched off for your account.', 'Akkauntingiz uchun SI o‘chirilgan.');
      case 'quota_exceeded': return tx('You have used all your AI requests for today. They reset at midnight (Tashkent time).', 'Bugungi SI so‘rovlaringiz tugadi. Ular yarim tunda (Toshkent vaqti) tiklanadi.');
      case 'rate_limited': return tx('Too many requests. Wait a moment and try again.', 'So‘rovlar juda ko‘p. Biroz kutib, qayta urinib ko‘ring.');
      case 'ai_busy': return tx('This request is already running. Wait for it to finish.', 'Bu so‘rov allaqachon bajarilmoqda. Tugashini kuting.');
      case 'ai_bad_reply': return tx('The AI returned an answer we could not use. Please try again.', 'SI ishlatib bo‘lmaydigan javob qaytardi. Qayta urinib ko‘ring.');
      case 'ai_refused': return tx('The AI could not help with this text. Try rewording it.', 'SI bu matn bilan yordam bera olmadi. Boshqacha yozib ko‘ring.');
      case 'ai_timeout': return tx('The AI took too long. Try again.', 'SI juda uzoq javob berdi. Qayta urinib ko‘ring.');
      case 'ai_unavailable': return tx('The AI service could not be reached.', 'SI xizmatiga ulanib bo‘lmadi.');
      case 'validation_error':
      case 'bad_request': return tx('Check the text you entered and try again.', 'Kiritilgan matnni tekshirib, qayta urinib ko‘ring.');
      case 'network': return tx('No connection to the server.', 'Serverga ulanish yo‘q.');
      default: return tx('Something went wrong with the AI. Please try again.', 'SI bilan muammo yuz berdi. Qayta urinib ko‘ring.');
    }
  };
}

/** Runs an AI action once at a time, with progress and a Stop button. Never keeps a result from a failed call. */
export function useAiAction<A extends unknown[], R>(fn: (signal: AbortSignal, ...args: A) => Promise<R>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const ctrl = useRef<AbortController | null>(null);
  const run = useCallback(
    async (...args: A): Promise<R | null> => {
      if (ctrl.current) return null; // one request at a time per action
      const c = new AbortController();
      ctrl.current = c;
      setBusy(true);
      setError(null);
      try {
        return await fn(c.signal, ...args);
      } catch (e) {
        if (!(e instanceof ApiError && e.code === 'aborted') && (e as { name?: string }).name !== 'AbortError') setError(e);
        return null;
      } finally {
        ctrl.current = null;
        setBusy(false);
      }
    },
    [fn],
  );
  const stop = useCallback(() => ctrl.current?.abort(), []);
  return { run, stop, busy, error, clearError: () => setError(null) };
}
