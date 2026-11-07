import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { LANGS } from '@edubridge/shared';
import type { CatalogRepo } from '../lib/catalogRepo';
import { ApiError } from '../errors';
import { requireAuth } from '../auth/session';
import type { AiGuard } from '../ai/guard';
import { ground, minimalProfile, type Target } from '../ai/context';
import { chatInstructions, ocrPrompt } from '../ai/prompts';
import { JSON_TASKS, prepare } from '../ai/tasks';
import { SchemaError, checkLinks, parseJsonObject } from '../ai/text';
import { validateOcr } from '../ai/validators';
import type { LlmResult } from '../ai/llm';

/**
 * /ai/*: authenticated, rate-limited, budget-capped. The browser never sees the API key; prompts are built here,
 * the profile is reduced to a minimal form here, replies are validated here. Prompts and documents are never logged.
 */

const level = z.enum(['bachelor', 'master']);
const target = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({ kind: z.literal('uni'), id: z.string().max(100), level }),
  z.object({ kind: z.literal('grant'), id: z.string().max(100) }),
  z.object({ kind: z.literal('custom'), name: z.string().max(200) }),
]);

const chatBody = z
  .object({
    lang: z.enum(LANGS),
    messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(8000) })).min(1).max(30),
    depth: z.enum(['normal', 'deep']).default('normal'),
    profile: z.record(z.string(), z.unknown()).optional(),
    plans: z.array(z.record(z.string(), z.unknown())).max(20).default([]),
    saved: z.array(z.string().max(200)).max(100).default([]),
    target: target.optional(),
    /** Documents are sent to the model only when the student switches sharing on. */
    shareDocs: z.boolean().default(false),
    docs: z.array(z.object({ type: z.string().max(40), title: z.string().max(200), text: z.string().max(60_000) })).max(3).default([]),
  })
  .strict();

const ocrBody = z
  .object({
    images: z
      .array(z.object({ mediaType: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/gif']), data: z.string().min(100).max(7_000_000).regex(/^[A-Za-z0-9+/=]+$/, 'base64 expected') }).strict())
      .min(1)
      .max(6),
  })
  .strict();

/** An abort signal that fires when the client goes away or the time limit passes. */
function requestSignal(reply: FastifyReply, ms: number) {
  const ctrl = new AbortController();
  // The RESPONSE's close fires when the connection drops (the request's own 'close' also fires after the body is read).
  const onClose = () => { if (!reply.raw.writableFinished) ctrl.abort(); };
  reply.raw.on('close', onClose);
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => { clearTimeout(timer); reply.raw.off('close', onClose); } };
}

export function registerAiRoutes(app: FastifyInstance, d: { prisma: unknown; repo: CatalogRepo; guard: AiGuard; timeoutMs: number }) {
  const { repo, guard } = d;

  app.get('/ai/health', async (req, reply) => {
    reply.header('cache-control', 'no-store');
    return guard.status(req.auth?.user ?? null);
  });

  // --------------------------------------------------------------- structured tasks
  app.post('/ai/json', async (req, reply) => {
    const { user } = requireAuth(req);
    const input = JSON_TASKS.parse(req.body);
    const snap = await repo.snapshot();
    const prep = prepare(input, snap);
    const run = await guard.begin(user, input.task, prep.tier);
    const sig = requestSignal(reply, d.timeoutMs);
    let res: LlmResult | null = null;
    try {
      res = await guard.llm.complete({ messages: [{ role: 'user', content: prep.prompt }], tier: prep.tier, effort: prep.effort, maxTokens: prep.maxTokens, signal: sig.signal });
      if (res.refused) {
        await run.finish('refused', res.usage);
        throw new ApiError(422, 'ai_refused', 'The AI could not help with this text. Try rewording it.');
      }
      let result: unknown;
      let raw: unknown;
      try {
        raw = parseJsonObject(res.text);
        result = prep.validate(raw);
      } catch (e) {
        if (e instanceof SchemaError) {
          await run.finish('bad_reply', res.usage);
          // A malformed reply is an error, never a fake analysis.
          throw new ApiError(502, 'ai_bad_reply', 'The AI returned an answer we could not use. Please try again.');
        }
        throw e;
      }
      await run.finish('ok', res.usage);
      // The raw (unvalidated) object is returned for analyses only: the second-reader audit needs the first reviewer's
      // own JSON as its draft. The UI never displays it; everything shown comes from the validated `result`.
      const withRaw = input.task === 'cv' || input.task === 'letter';
      return { task: input.task, result, ...(withRaw ? { raw } : {}), usage: res.usage };
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'ai_refused' || e.code === 'ai_bad_reply')) throw e;
      await run.finish(sig.signal.aborted ? 'aborted' : 'error', res?.usage);
      throw e;
    } finally {
      sig.done();
    }
  });

  // ------------------------------------------------------------------- scanned pages
  app.post('/ai/ocr', { bodyLimit: 30_000_000 }, async (req, reply) => {
    const { user } = requireAuth(req);
    const body = ocrBody.parse(req.body);
    const run = await guard.begin(user, 'ocr', 'default');
    const sig = requestSignal(reply, d.timeoutMs);
    let res: LlmResult | null = null;
    try {
      res = await guard.llm.complete({
        messages: [{ role: 'user', content: [...body.images.map((i) => ({ type: 'image' as const, mediaType: i.mediaType, data: i.data })), { type: 'text' as const, text: ocrPrompt(body.images.length) }] }],
        tier: 'default', effort: 'low', maxTokens: 8000, signal: sig.signal,
      });
      let result;
      try {
        result = validateOcr(parseJsonObject(res.text));
      } catch (e) {
        if (e instanceof SchemaError) {
          await run.finish('bad_reply', res.usage);
          throw new ApiError(502, 'ai_bad_reply', 'The AI returned an answer we could not use. Please try again.');
        }
        throw e;
      }
      await run.finish('ok', res.usage);
      return { task: 'ocr', result, usage: res.usage };
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ai_bad_reply') throw e;
      await run.finish(sig.signal.aborted ? 'aborted' : 'error', res?.usage);
      throw e;
    } finally {
      sig.done();
    }
  });

  // --------------------------------------------------------------------- chat (SSE)
  app.post('/ai/chat', async (req, reply) => {
    const { user } = requireAuth(req);
    const b = chatBody.parse(req.body);
    const last = b.messages[b.messages.length - 1]!;
    if (last.role !== 'user') throw new ApiError(400, 'bad_request', 'The last message must be from the student');

    const snap = await repo.snapshot();
    const grounded = ground(last.content, { target: b.target as Target | undefined, saved: b.saved, planIds: b.plans.map((p) => String(p.opportunityRef ?? p.id ?? '')).filter(Boolean) }, snap);
    const system = chatInstructions({
      lang: b.lang,
      depth: b.depth,
      today: new Date().toISOString().slice(0, 10),
      profile: minimalProfile(b.profile),
      plans: b.plans.slice(0, 20),
      saved: b.saved,
      sharedDocs: b.shareDocs ? b.docs : [],
      records: grounded.records,
    });
    const run = await guard.begin(user, 'chat', b.depth === 'deep' ? 'complex' : 'default');
    const tier = b.depth === 'deep' ? 'complex' : 'default';

    // From here on the response is a stream; errors are sent as an event.
    reply.hijack();
    reply.raw.writeHead(200, {
      ...reply.getHeaders(),
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
      'x-request-id': req.id,
    } as Record<string, string>);
    const send = (event: string, data: unknown) => {
      if (!reply.raw.writableEnded) reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const sig = requestSignal(reply, d.timeoutMs);
    let res: LlmResult | null = null;
    try {
      res = await guard.llm.stream(
        { system, messages: b.messages, tier, effort: b.depth === 'deep' ? 'high' : 'medium', maxTokens: b.depth === 'deep' ? 6000 : 3000, signal: sig.signal },
        (t) => send('delta', { t }),
      );
      if (res.refused) {
        await run.finish('refused', res.usage);
        send('error', { code: 'ai_refused', message: 'The AI could not help with this question. Try rewording it.' });
      } else {
        await run.finish('ok', res.usage);
        const m = /(?:^|\n)\s*FOLLOWUPS:\s*(.+)\s*$/i.exec(res.text);
        const followups = m ? m[1]!.split('|').map((x) => x.trim()).filter(Boolean).slice(0, 3) : [];
        const text = (m ? res.text.slice(0, m.index) : res.text).trim();
        send('done', { text, followups, linkFlags: checkLinks(text, grounded.urls), records: grounded.records.map((r) => ({ type: r.type, id: r.id, name: r.name })), usage: res.usage });
      }
    } catch (e) {
      await run.finish(sig.signal.aborted ? 'aborted' : 'error', res?.usage);
      const err = e instanceof ApiError ? e : new ApiError(502, 'ai_error', 'The AI service returned an error.');
      if (!(err.code === 'ai_aborted')) send('error', { code: err.code, message: err.message });
    } finally {
      sig.done();
      if (!reply.raw.writableEnded) reply.raw.end();
    }
  });
}
