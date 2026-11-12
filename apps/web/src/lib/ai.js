import { la } from './core';
import { api, apiUrl } from './api';
import { getSession } from '../sync/session';

/**
 * Live AI goes through the EduBridge server (POST /api/v1/ai/text): the Anthropic key stays on the server, and the
 * server enforces the budget and the per-student limits. The pages keep calling the same functions as before:
 *   Un()  is live AI available for this student ('server' or null)
 *   Lh()  how many page images may be sent
 *   Xd()  stream a text answer      hi()  get a JSON answer      Ta()  a plain message for an error code
 * Live AI needs an account (it is rate-limited per student).
 */
export async function Un() {
  if (getSession().status !== 'user') return null;
  try {
    const s = await api('/ai/status');
    return s.enabled ? 'server' : null;
  } catch {
    return null;
  }
}
export async function Lh() {
  if ((await Un()) !== 'server') return 0;
  try {
    return (await api('/ai/status')).limits?.images ?? 0;
  } catch {
    return 0;
  }
}
export class ri extends Error {
  constructor(a, t, n) {
    super(t);
    this.code = a;
    this.partial = n;
  }
}
export function Ta(e, a) {
  switch (e) {
    case 'not_configured':
      return la(
        a,
        'AI is not available right now. No analysis was done.',
        'SI hozir mavjud emas. Hech qanday tahlil bajarilmadi.',
      );
    case 'rate_limited':
      return la(
        a,
        'Usage limit reached. Please try again a little later.',
        'So‘rovlar chegarasiga yetildi. Birozdan keyin qayta urinib ko‘ring.',
      );
    case 'prompt_too_large':
      return la(a, 'The document is too long. Send a shorter part.', 'Hujjat juda uzun. Qisqaroq qismni yuboring.');
    case 'invalid_json':
      return la(
        a,
        'The AI reply came back incomplete, so it was not shown. Please try again.',
        'SI javobi to‘liq tuzilmagan holda keldi, shuning uchun ko‘rsatilmadi. Qayta urinib ko‘ring.',
      );
    case 'refused':
      return la(
        a,
        'The AI declined this request. Try changing the text.',
        'SI bu so‘rovni bajarmadi. Matnni o‘zgartirib ko‘ring.',
      );
    case 'session_expired':
      return la(a, 'Please sign in again.', 'Qayta tizimga kiring.');
    case 'image_rejected':
    case 'images_unavailable':
      return la(a, 'The images could not be sent.', 'Rasmlarni yuborib bo‘lmadi.');
    default:
      return la(
        a,
        'The AI service did not respond. Please try again.',
        'SI xizmati hozir javob bermadi. Qayta urinib ko‘ring.',
      );
  }
}

/** Server error codes -> the codes the pages know. */
const CODE = {
  quota_exceeded: 'rate_limited',
  rate_limited: 'rate_limited',
  ai_busy: 'rate_limited',
  ai_disabled: 'not_configured',
  ai_not_configured: 'not_configured',
  ai_suspended: 'not_configured',
  ai_aborted: 'cancelled',
  unauthenticated: 'session_expired',
  too_large: 'prompt_too_large',
};
const toError = (status, code, message, partial) => new ri(CODE[code] ?? (status === 401 ? 'session_expired' : status === 413 ? 'prompt_too_large' : 'upstream_error'), message ?? 'AI request failed', partial);

const normaliseImage = (im) => ({ mediaType: im.mediaType ?? im.media_type ?? 'image/jpeg', data: im.data ?? im.source?.data ?? '' });

export async function Xd(messages, opts = {}) {
  if ((await Un()) !== 'server') throw new ri('not_configured', 'No live AI provider is configured.');
  const body = {
    messages: messages.map((m) => ({ role: m.role, content: typeof m.content === 'string' ? m.content : String(m.content ?? '') })),
    tier: opts.tier ?? 'default',
    stream: !!opts.onText,
    ...(opts.images?.length ? { images: opts.images.map(normaliseImage) } : {}),
  };
  const headers = { 'content-type': 'application/json', accept: opts.onText ? 'text/event-stream' : 'application/json' };
  const csrf = document.cookie.match(/(?:^|; )eb_csrf=([^;]+)/)?.[1];
  if (csrf) headers['x-csrf-token'] = decodeURIComponent(csrf);
  let res;
  try {
    res = await fetch(apiUrl('/ai/text'), { method: 'POST', headers, credentials: 'include', body: JSON.stringify(body), signal: opts.signal });
  } catch (e) {
    throw new ri(e?.name === 'AbortError' ? 'cancelled' : 'upstream_error', 'Network error');
  }
  if (!res.ok) {
    let j = null;
    try {
      j = await res.json();
    } catch {
      /* no body */
    }
    throw toError(res.status, j?.error?.code, j?.error?.message);
  }
  if (!opts.onText) {
    const j = await res.json();
    if (j.refused) throw new ri('refused', 'The AI declined this request');
    if (!j.text) throw new ri('empty_completion', 'Empty response');
    return j.text;
  }
  // server-sent events: {"t": "piece"} ... {"done": true}
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let i;
      while ((i = buffer.indexOf('\n\n')) >= 0) {
        const line = buffer.slice(0, i).replace(/^data: /, '');
        buffer = buffer.slice(i + 2);
        if (!line) continue;
        const ev = JSON.parse(line);
        if (ev.t) {
          text += ev.t;
          opts.onText(text);
        } else if (ev.error) throw toError(0, ev.error.code, ev.error.message, text);
        else if (ev.refused) throw new ri('refused', 'The AI declined this request', text);
      }
    }
  } catch (e) {
    if (e instanceof ri) throw e;
    throw new ri(e?.name === 'AbortError' ? 'cancelled' : 'upstream_error', 'Connection lost', text);
  }
  if (!text) throw new ri('empty_completion', 'Empty response');
  return text;
}

function uz(e) {
  const a = (o) => {
      try {
        return JSON.parse(o);
      } catch {
        return;
      }
    },
    t = a(e.trim());
  if (t !== void 0) return t;
  const n = /```(?:json)?\s*([\s\S]*?)```/i.exec(e);
  if (n) {
    const o = a(n[1].trim());
    if (o !== void 0) return o;
  }
  const s = e.search(/[{[]/),
    r = Math.max(e.lastIndexOf('}'), e.lastIndexOf(']'));
  if (s >= 0 && r > s) {
    const o = a(e.slice(s, r + 1));
    if (o !== void 0) return o;
  }
}
export async function hi(e, a = {}) {
  const n = typeof e == 'string' ? [{ role: 'user', content: e }] : e;
  const s = await Xd(n, { ...a, onText: void 0 });
  const r = uz(s);
  if (r === void 0) throw new ri('invalid_json', 'Reply was not JSON', s);
  return r;
}
