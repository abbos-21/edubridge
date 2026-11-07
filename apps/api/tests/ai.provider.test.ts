import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createAnthropicLlm } from '../src/ai/llm';
import { loadConfig } from '../src/config';
import { ApiError } from '../src/errors';

/**
 * The real Anthropic client, tested against a local fake that speaks the Messages streaming protocol.
 * This proves the request we send (model, limits, effort, no sampling parameters, key header) and how
 * replies, refusals and provider errors are handled — without a real key or network.
 */

type Seen = { headers: IncomingMessage['headers']; body: any };
let server: Server;
let base = '';
let seen: Seen[] = [];
let mode: 'ok' | 'refusal' | 'max_tokens' | '429' | '401' | '500' | 'hang' = 'ok';

const sse = (res: ServerResponse, events: Array<[string, unknown]>) => {
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  for (const [e, d] of events) res.write(`event: ${e}\ndata: ${JSON.stringify(d)}\n\n`);
  res.end();
};

beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      seen.push({ headers: req.headers, body: raw ? JSON.parse(raw) : null });
      if (mode === '429') return res.writeHead(429, { 'content-type': 'application/json', 'retry-after': '1' }).end(JSON.stringify({ type: 'error', error: { type: 'rate_limit_error', message: 'slow down' } }));
      if (mode === '401') return res.writeHead(401, { 'content-type': 'application/json' }).end(JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key sk-ant-SECRET' } }));
      if (mode === '500') return res.writeHead(500, { 'content-type': 'application/json' }).end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: 'internal details' } }));
      if (mode === 'hang') return; // never answers
      const stop = mode === 'refusal' ? 'refusal' : mode === 'max_tokens' ? 'max_tokens' : 'end_turn';
      sse(res, [
        ['message_start', { type: 'message_start', message: { id: 'msg_1', type: 'message', role: 'assistant', model: raw ? JSON.parse(raw).model : 'm', content: [], stop_reason: null, usage: { input_tokens: 123, output_tokens: 1 } } }],
        ['content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }],
        ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hello ' } }],
        ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'world' } }],
        ['content_block_stop', { type: 'content_block_stop', index: 0 }],
        ['message_delta', { type: 'message_delta', delta: { stop_reason: stop, stop_sequence: null }, usage: { output_tokens: 45 } }],
        ['message_stop', { type: 'message_stop' }],
      ]);
    });
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

const config = (over: Record<string, string> = {}) =>
  loadConfig({ NODE_ENV: 'test', DATABASE_URL: 'x', ANTHROPIC_API_KEY: 'sk-ant-test-key', ...over });

// The SDK reads ANTHROPIC_BASE_URL from the environment.
const withBase = async <T>(f: () => Promise<T>) => {
  const old = process.env.ANTHROPIC_BASE_URL;
  process.env.ANTHROPIC_BASE_URL = base;
  try {
    return await f();
  } finally {
    if (old === undefined) delete process.env.ANTHROPIC_BASE_URL;
    else process.env.ANTHROPIC_BASE_URL = old;
  }
};
const reset = (m: typeof mode = 'ok') => {
  seen = [];
  mode = m;
};

describe('Anthropic client (against a local fake)', () => {
  it('sends the model for the tier, limits, effort, system prompt and the key — and no sampling parameters', async () => {
    reset();
    const r = await withBase(() => createAnthropicLlm(config()).complete({ system: 'SYS', messages: [{ role: 'user', content: 'Hi' }], tier: 'complex', maxTokens: 777, effort: 'high' }));
    expect(r).toMatchObject({ text: 'Hello world', refused: false, truncated: false, usage: { model: 'claude-sonnet-5-5', inputTokens: 123, outputTokens: 45 } });
    const { body, headers } = seen[0]!;
    // The SDK sends the key as a Bearer token (older versions used x-api-key); either way it goes in a header, never the body.
    expect(headers.authorization === 'Bearer sk-ant-test-key' || headers['x-api-key'] === 'sk-ant-test-key').toBe(true);
    expect(JSON.stringify(body)).not.toContain('sk-ant-test-key');
    expect(body).toMatchObject({ model: 'claude-sonnet-5-5', max_tokens: 777, system: 'SYS', output_config: { effort: 'high' }, messages: [{ role: 'user', content: 'Hi' }], stream: true });
    for (const banned of ['temperature', 'top_p', 'top_k', 'thinking']) expect(body[banned]).toBeUndefined();
  });
  it('picks models per tier from configuration', async () => {
    reset();
    const llm = createAnthropicLlm(config({ ANTHROPIC_MODEL: 'm-default', ANTHROPIC_MODEL_QUICK: 'm-quick', ANTHROPIC_MODEL_COMPLEX: 'm-complex' }));
    expect([llm.modelFor('quick'), llm.modelFor('default'), llm.modelFor('complex')]).toEqual(['m-quick', 'm-default', 'm-complex']);
    expect(createAnthropicLlm(config()).modelFor('complex')).toBe('claude-sonnet-5-5'); // falls back to the default model
    expect(createAnthropicLlm(config()).modelFor('quick')).toBe('claude-haiku-5-5');
  });
  it('sends images as base64 content blocks', async () => {
    reset();
    await withBase(() => createAnthropicLlm(config()).complete({ messages: [{ role: 'user', content: [{ type: 'image', mediaType: 'image/png', data: 'AAAA' }, { type: 'text', text: 'read' }] }], tier: 'default', maxTokens: 10 }));
    expect(seen[0]!.body.messages[0].content).toEqual([{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAA' } }, { type: 'text', text: 'read' }]);
  });
  it('streams text as it arrives and resolves with the whole reply', async () => {
    reset();
    const parts: string[] = [];
    const r = await withBase(() => createAnthropicLlm(config()).stream({ messages: [{ role: 'user', content: 'Hi' }], tier: 'default', maxTokens: 100 }, (t) => parts.push(t)));
    expect(parts).toEqual(['Hello ', 'world']);
    expect(r.text).toBe('Hello world');
  });
  it('reports a refusal and a truncated reply instead of hiding them', async () => {
    reset('refusal');
    expect((await withBase(() => createAnthropicLlm(config()).complete({ messages: [{ role: 'user', content: 'x' }], tier: 'default', maxTokens: 10 }))).refused).toBe(true);
    reset('max_tokens');
    expect((await withBase(() => createAnthropicLlm(config()).complete({ messages: [{ role: 'user', content: 'x' }], tier: 'default', maxTokens: 10 }))).truncated).toBe(true);
  });
  it('maps provider errors to plain API errors without leaking keys or provider details', async () => {
    const run = (m: typeof mode) => {
      reset(m);
      return withBase(() => createAnthropicLlm(config({ AI_TIMEOUT_MS: '3000' })).complete({ messages: [{ role: 'user', content: 'x' }], tier: 'default', maxTokens: 10 }).then(() => null as never)).catch((e) => e as ApiError);
    };
    const limited = await run('429');
    expect(limited).toBeInstanceOf(ApiError);
    expect(limited).toMatchObject({ statusCode: 429, code: 'rate_limited' });
    const auth = await run('401');
    expect(auth).toMatchObject({ statusCode: 503, code: 'ai_not_configured' });
    expect(JSON.stringify({ m: auth.message })).not.toMatch(/sk-ant|SECRET|x-api-key/);
    const boom = await run('500');
    expect(boom).toMatchObject({ statusCode: 502, code: 'ai_error' });
    expect(boom.message).not.toMatch(/internal details/);
  }, 30_000);
  it('a cancelled request stops waiting for the provider', async () => {
    reset('hang');
    const ctrl = new AbortController();
    const p = withBase(() => createAnthropicLlm(config()).complete({ messages: [{ role: 'user', content: 'x' }], tier: 'default', maxTokens: 10, signal: ctrl.signal }).then(() => null as never)).catch((e) => e as ApiError);
    setTimeout(() => ctrl.abort(), 200);
    const err = await p;
    expect(err).toMatchObject({ code: 'ai_aborted' });
  });
  it('without a key the client reports it is disabled and refuses to call out', async () => {
    const llm = createAnthropicLlm(config({ ANTHROPIC_API_KEY: '' }));
    expect(llm.enabled).toBe(false);
    await expect(llm.complete({ messages: [{ role: 'user', content: 'x' }], tier: 'default', maxTokens: 10 })).rejects.toMatchObject({ code: 'ai_not_configured' });
  });
});
