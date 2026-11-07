import { API_BASE, ApiError, api } from './api';

/** Plain, translated messages for AI errors. Keys are the codes the API sends. */
export type AiErrorCode =
  | 'unauthenticated' | 'ai_disabled' | 'ai_not_configured' | 'ai_suspended' | 'quota_exceeded' | 'rate_limited'
  | 'ai_busy' | 'ai_bad_reply' | 'ai_refused' | 'ai_timeout' | 'ai_unavailable' | 'ai_error' | 'network' | 'bad_request' | 'validation_error';

export type AiHealth = {
  enabled: boolean;
  configured: boolean;
  mock: boolean;
  suspended?: boolean;
  quota?: { dailyLimit: number; usedToday: number; remainingToday: number; resetsAt: string };
};

export const aiHealth = () => api<AiHealth>('/ai/health');

export type Usage = { model: string; inputTokens: number; outputTokens: number };

/** One structured AI call (analysis, rewrite, interview …). Throws ApiError with the API's code. */
export async function aiJson<T = any>(body: Record<string, unknown>, signal?: AbortSignal): Promise<{ result: T; usage: Usage }> {
  return api<{ result: T; usage: Usage }>('/ai/json', { method: 'POST', body, signal, timeoutMs: 120_000 });
}

export type LinkFlag = { url: string; verified: boolean };
export type ChatDone = { text: string; followups: string[]; linkFlags: LinkFlag[]; records: Array<{ type: string; id: string; name: string }>; usage: Usage };

/** Streams a chat answer (server-sent events). Resolves with the final message; calls onText with each piece. */
export async function aiChat(body: Record<string, unknown>, onText: (t: string) => void, signal?: AbortSignal): Promise<ChatDone> {
  const csrf = document.cookie.split('; ').find((c) => c.startsWith('eb_csrf='))?.slice(8) ?? '';
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1/ai/chat`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json', accept: 'text/event-stream', 'x-csrf-token': decodeURIComponent(csrf) },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') throw new ApiError(0, 'aborted', 'Stopped');
    throw new ApiError(0, 'network', 'Network error');
  }
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } };
    throw new ApiError(res.status, j.error?.code ?? 'ai_error', j.error?.message ?? `HTTP ${res.status}`);
  }
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let done: ChatDone | null = null;
  try {
    for (;;) {
      const { value, done: end } = await reader.read();
      if (end) break;
      buf += dec.decode(value, { stream: true });
      let i: number;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const block = buf.slice(0, i);
        buf = buf.slice(i + 2);
        const ev = /^event: (.+)$/m.exec(block)?.[1];
        const raw = /^data: (.+)$/m.exec(block)?.[1];
        if (!ev || !raw) continue;
        const data = JSON.parse(raw);
        if (ev === 'delta') onText(data.t as string);
        else if (ev === 'done') done = data as ChatDone;
        else if (ev === 'error') throw new ApiError(500, data.code ?? 'ai_error', data.message ?? 'AI error');
      }
    }
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') throw new ApiError(0, 'aborted', 'Stopped');
    throw e;
  }
  if (!done) throw new ApiError(502, 'ai_error', 'The answer ended unexpectedly');
  return done;
}

/** Splits an answer into sections by "### Heading" lines (for the structured answer layout). */
export const isAiAbort = (e: unknown) => e instanceof ApiError && e.code === 'aborted';

export type OcrPage = { n: number; text: string; legible: 'yes' | 'partial' | 'no' };

/** Reads scanned pages / photos with the AI. The images are not stored; only the text the student confirms is. */
export async function aiOcr(images: Array<{ mediaType: string; data: string }>, signal?: AbortSignal): Promise<{ pages: OcrPage[]; usage: Usage }> {
  const r = await api<{ result: { pages: OcrPage[] }; usage: Usage }>('/ai/ocr', { method: 'POST', body: { images }, signal, timeoutMs: 150_000 });
  return { pages: r.result.pages, usage: r.usage };
}
