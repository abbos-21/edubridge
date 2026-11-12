import type { Llm, LlmRequest, LlmResult } from './llm';

/** Development and test model: canned, harmless replies. Refused in production by the config. */
export function createMockLlm(): Llm {
  const reply = (req: LlmRequest): LlmResult => {
    const last = [...req.messages].reverse().find((m) => m.role === 'user');
    const text = typeof last?.content === 'string' ? last.content : (last?.content.find((b) => b.type === 'text') as { text: string } | undefined)?.text ?? '';
    const wantsJson = /\bJSON\b/i.test(text);
    const out = wantsJson ? '{"mock":true}' : `[mock reply] ${text.slice(0, 80).replace(/\s+/g, ' ')}`;
    return { text: out, usage: { model: 'mock', inputTokens: Math.ceil(text.length / 4), outputTokens: Math.ceil(out.length / 4) }, refused: false, truncated: false };
  };
  return {
    enabled: true,
    mock: true,
    modelFor: () => 'mock',
    complete: async (req) => reply(req),
    stream: async (req, onText) => {
      const r = reply(req);
      for (const w of r.text.split(/(?<= )/)) onText(w);
      return r;
    },
  };
}
