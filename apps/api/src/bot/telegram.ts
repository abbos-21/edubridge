import type { Config } from '../config';

export type SendResult = { ok: true } | { ok: false; blocked: boolean; error: string };

/** The only thing EduBridge does with Telegram: send a text message to a chat. */
export interface TelegramApi {
  readonly configured: boolean;
  send(chatId: string, text: string): Promise<SendResult>;
}

export function createTelegramApi(config: Config, fetchImpl: typeof fetch = fetch): TelegramApi {
  const token = config.TELEGRAM_BOT_TOKEN;
  return {
    configured: !!token,
    async send(chatId, text) {
      if (!token) return { ok: false, blocked: false, error: 'not_configured' };
      try {
        const res = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
          signal: AbortSignal.timeout(10_000),
        });
        if (res.ok) return { ok: true };
        // 403 = the student blocked the bot or deleted the chat: stop messaging them.
        return { ok: false, blocked: res.status === 403, error: `telegram_${res.status}` };
      } catch {
        return { ok: false, blocked: false, error: 'network' };
      }
    },
  };
}

/** Records messages instead of sending them (tests). */
export function createMockTelegram(): TelegramApi & { sent: Array<{ chatId: string; text: string }>; failNext: (r: { blocked: boolean; error: string }, times?: number) => void } {
  const sent: Array<{ chatId: string; text: string }> = [];
  let fails: Array<{ blocked: boolean; error: string }> = [];
  return {
    configured: true,
    sent,
    failNext: (r, times = 1) => { fails = Array.from({ length: times }, () => r); },
    async send(chatId, text) {
      const f = fails.shift();
      if (f) return { ok: false, ...f };
      sent.push({ chatId, text });
      return { ok: true };
    },
  };
}
