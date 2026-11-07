import Anthropic from '@anthropic-ai/sdk';
import type { Config } from '../config';
import { ApiError } from '../errors';

export type Tier = 'quick' | 'default' | 'complex';
export type Effort = 'low' | 'medium' | 'high';

export type ImageBlock = { type: 'image'; mediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'; data: string };
export type TextBlock = { type: 'text'; text: string };
export type LlmMessage = { role: 'user' | 'assistant'; content: string | Array<ImageBlock | TextBlock> };

export type LlmRequest = {
  system?: string;
  messages: LlmMessage[];
  tier: Tier;
  maxTokens: number;
  effort?: Effort;
  signal?: AbortSignal;
};
export type LlmUsage = { model: string; inputTokens: number; outputTokens: number };
export type LlmResult = { text: string; usage: LlmUsage; refused: boolean; truncated: boolean };

/** The seam between EduBridge and the model provider. Tests and local development use MockLlm. */
export interface Llm {
  /** An API key (or the mock) is available. */
  enabled: boolean;
  mock: boolean;
  modelFor(tier: Tier): string;
  complete(req: LlmRequest): Promise<LlmResult>;
  /** Streams text as it is generated; resolves with the full result. */
  stream(req: LlmRequest, onText: (t: string) => void): Promise<LlmResult>;
}

export function modelFor(config: Pick<Config, 'ANTHROPIC_MODEL' | 'ANTHROPIC_MODEL_QUICK' | 'ANTHROPIC_MODEL_COMPLEX'>, tier: Tier): string {
  if (tier === 'quick') return config.ANTHROPIC_MODEL_QUICK;
  if (tier === 'complex') return config.ANTHROPIC_MODEL_COMPLEX || config.ANTHROPIC_MODEL;
  return config.ANTHROPIC_MODEL;
}

/** Provider errors become plain API errors; the message never contains keys or provider internals. */
export function mapProviderError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  if (e instanceof Anthropic.APIUserAbortError) return new ApiError(499, 'ai_aborted', 'The request was cancelled');
  if (e instanceof Anthropic.RateLimitError) return new ApiError(429, 'rate_limited', 'The AI service is busy. Try again in a minute.', undefined, { 'retry-after': '60' });
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) return new ApiError(503, 'ai_not_configured', 'The AI service is not available right now.');
  if (e instanceof Anthropic.APIConnectionTimeoutError) return new ApiError(504, 'ai_timeout', 'The AI service took too long. Try again.');
  if (e instanceof Anthropic.APIConnectionError) return new ApiError(502, 'ai_unavailable', 'The AI service could not be reached.');
  if (e instanceof Anthropic.APIError) return new ApiError(502, 'ai_error', 'The AI service returned an error.');
  if ((e as { name?: string })?.name === 'AbortError') return new ApiError(499, 'ai_aborted', 'The request was cancelled');
  return new ApiError(502, 'ai_error', 'The AI service returned an error.');
}

export function createAnthropicLlm(config: Config): Llm {
  const client = config.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: config.ANTHROPIC_API_KEY, timeout: config.AI_TIMEOUT_MS, maxRetries: 1 }) : null;

  const toParams = (req: LlmRequest) => {
    const model = modelFor(config, req.tier);
    return {
      model,
      max_tokens: req.maxTokens,
      ...(req.system ? { system: req.system } : {}),
      // No temperature/top_p/top_k: current models reject non-default sampling values. Effort tunes depth and cost.
      output_config: { effort: req.effort ?? 'medium' },
      messages: req.messages.map((m) => ({
        role: m.role,
        content:
          typeof m.content === 'string'
            ? m.content
            : m.content.map((b) => (b.type === 'image' ? { type: 'image' as const, source: { type: 'base64' as const, media_type: b.mediaType, data: b.data } } : { type: 'text' as const, text: b.text })),
      })),
    };
  };

  const finish = (message: Anthropic.Message, model: string): LlmResult => ({
    text: message.content.map((b) => (b.type === 'text' ? b.text : '')).join(''),
    usage: { model, inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens },
    refused: message.stop_reason === 'refusal',
    truncated: message.stop_reason === 'max_tokens',
  });

  return {
    enabled: !!client,
    mock: false,
    modelFor: (t) => modelFor(config, t),
    async complete(req) {
      if (!client) throw new ApiError(503, 'ai_not_configured', 'The AI service is not available right now.');
      const p = toParams(req);
      try {
        // Streaming + finalMessage avoids HTTP timeouts on long analyses.
        const stream = client.messages.stream(p as never, { signal: req.signal });
        return finish(await stream.finalMessage(), p.model);
      } catch (e) {
        throw mapProviderError(e);
      }
    },
    async stream(req, onText) {
      if (!client) throw new ApiError(503, 'ai_not_configured', 'The AI service is not available right now.');
      const p = toParams(req);
      try {
        const stream = client.messages.stream(p as never, { signal: req.signal });
        stream.on('text', (t) => onText(t));
        return finish(await stream.finalMessage(), p.model);
      } catch (e) {
        throw mapProviderError(e);
      }
    },
  };
}
