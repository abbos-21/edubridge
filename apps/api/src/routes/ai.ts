import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ApiError } from '../errors';
import { requireAuth } from '../auth/session';
import type { AiGuard } from '../ai/guard';
import { mapProviderError, type LlmMessage } from '../ai/llm';

/**
 * The AI proxy. The web app sends the conversation it built (the same prompts the original app used with Claude's
 * artifact feature); the server adds a short safety system prompt, enforces the limits (kill switch, monthly budget,
 * daily quota, burst, one request at a time per task) and calls the model. The API key never reaches the browser,
 * and prompts, documents and answers are never stored: only sizes and cost.
 */
const SYSTEM = [
  'You are the assistant inside EduBridge, a guidance website for students from Uzbekistan who plan to study abroad.',
  'Be honest and specific. Never invent deadlines, fees, scholarships or admission chances; say when something must be checked on the official website.',
  'Never ask for passwords or payment details. Help students write in their own words; do not ghost-write whole application essays.',
].join(' ');

const MAX_IMAGES = 4;
const body = z
  .object({
    messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(120_000) })).min(1).max(40),
    images: z.array(z.object({ mediaType: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/gif']), data: z.string().max(9_000_000) })).max(MAX_IMAGES).optional(),
    tier: z.enum(['quick', 'default', 'complex']).default('default'),
    task: z.string().max(40).regex(/^[a-z0-9_.-]+$/i).default('chat'),
    stream: z.boolean().default(false),
    maxTokens: z.number().int().min(64).max(4000).default(2000),
  })
  .strict()
  .refine((b) => b.messages.reduce((n, m) => n + m.content.length, 0) <= 200_000, 'conversation too long');

export function registerAiRoutes(app: FastifyInstance, d: { guard: AiGuard; timeoutMs: number }) {
  const { guard } = d;

  app.get('/ai/status', async (req) => ({ ...(await guard.status(req.auth?.user ?? null)), limits: { images: MAX_IMAGES } }));

  app.post('/ai/text', { bodyLimit: 40_000_000 }, async (req, reply) => {
    const { user } = requireAuth(req);
    const b = body.parse(req.body);
    const messages: LlmMessage[] = b.messages.map((m) => ({ role: m.role, content: m.content }));
    if (b.images?.length) {
      const i = messages.map((m) => m.role).lastIndexOf('user');
      messages[i] = { role: 'user', content: [...b.images.map((im) => ({ type: 'image' as const, mediaType: im.mediaType, data: im.data })), { type: 'text' as const, text: messages[i]!.content as string }] };
    }
    const handle = await guard.begin(user, b.task, b.tier);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), d.timeoutMs);
    reply.raw.on('close', () => { if (!reply.raw.writableEnded) ctrl.abort(); });
    const request = { system: SYSTEM, messages, tier: b.tier, maxTokens: b.maxTokens, signal: ctrl.signal };

    if (!b.stream) {
      try {
        const r = await guard.llm.complete(request);
        await handle.finish(r.refused ? 'refused' : 'ok', r.usage);
        return { text: r.text, refused: r.refused, truncated: r.truncated };
      } catch (e) {
        await handle.finish(ctrl.signal.aborted ? 'aborted' : 'error');
        throw mapProviderError(e);
      } finally {
        clearTimeout(timer);
      }
    }

    // server-sent events: {"t": "text so far"} ... then {"done": true}
    reply.hijack();
    reply.raw.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no', 'access-control-allow-origin': req.headers.origin ?? '', 'access-control-allow-credentials': 'true' });
    const send = (o: unknown) => reply.raw.writable && reply.raw.write(`data: ${JSON.stringify(o)}\n\n`);
    try {
      const r = await guard.llm.stream(request, (t) => send({ t }));
      await handle.finish(r.refused ? 'refused' : 'ok', r.usage);
      send({ done: true, refused: r.refused, truncated: r.truncated });
    } catch (e) {
      await handle.finish(ctrl.signal.aborted ? 'aborted' : 'error');
      const err = mapProviderError(e);
      send({ error: { code: err.code, message: err.message } });
    } finally {
      clearTimeout(timer);
      reply.raw.end();
    }
  });
}

export const _unused = ApiError;
