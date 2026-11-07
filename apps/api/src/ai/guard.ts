import type { PrismaClient, User } from '@prisma/client';
import type { Config } from '../config';
import { ApiError } from '../errors';
import type { Llm } from './llm';
import { estimateCostUsd, parsePrices } from './pricing';

const TASHKENT_OFFSET_MS = 5 * 3_600_000; // UTC+5, no daylight saving

/** Start of the current day in Uzbekistan (when the daily quota resets), as a UTC instant. */
export function dayStart(now = new Date()): Date {
  const local = new Date(now.getTime() + TASHKENT_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - TASHKENT_OFFSET_MS);
}
export const monthStart = (now = new Date()) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

export type UsageStatus = 'pending' | 'ok' | 'bad_reply' | 'refused' | 'error' | 'aborted';

/**
 * Everything that protects the AI budget: kill switch, suspended users, a global monthly USD cap,
 * a daily request quota per user, a per-minute burst limit, and one in-flight request per user per action.
 */
export class AiGuard {
  private burst = new Map<string, number[]>();
  private inflight = new Set<string>();
  private prices: Record<string, [number, number]>;

  constructor(private config: Config, private prisma: PrismaClient, public llm: Llm) {
    this.prices = parsePrices(config.AI_PRICES_JSON);
  }

  async usedToday(userId: string, now = new Date()): Promise<number> {
    return this.prisma.aiUsage.count({ where: { userId, createdAt: { gte: dayStart(now) } } });
  }

  async spentThisMonth(now = new Date()): Promise<number> {
    const r = await this.prisma.aiUsage.aggregate({ _sum: { costUsdEst: true }, where: { createdAt: { gte: monthStart(now) } } });
    return Number(r._sum.costUsdEst ?? 0);
  }

  async status(user: User | null, now = new Date()) {
    const base = { enabled: this.config.AI_ENABLED && this.llm.enabled, configured: this.llm.enabled, mock: this.llm.mock };
    if (!user) return base;
    const used = await this.usedToday(user.id, now);
    return {
      ...base,
      suspended: user.suspendedAi,
      quota: { dailyLimit: this.config.AI_DAILY_REQUESTS_PER_USER, usedToday: used, remainingToday: Math.max(0, this.config.AI_DAILY_REQUESTS_PER_USER - used), resetsAt: new Date(dayStart(now).getTime() + 86_400_000).toISOString() },
    };
  }

  /**
   * Checks every limit and reserves a usage row (so concurrent calls count). Returns a handle: call
   * finish() exactly once with the outcome. Throws an ApiError with a plain message and the right status.
   */
  async begin(user: User, task: string, tier: string, now = new Date()) {
    if (!this.config.AI_ENABLED) throw new ApiError(503, 'ai_disabled', 'The AI advisor is switched off right now.');
    if (!this.llm.enabled) throw new ApiError(503, 'ai_not_configured', 'The AI advisor is not available right now.');
    if (user.suspendedAi) throw new ApiError(403, 'ai_suspended', 'AI access is switched off for your account.');

    const key = `${user.id}|${task}`;
    if (this.inflight.has(key)) throw new ApiError(409, 'ai_busy', 'This request is already running. Wait for it to finish.');

    const t = now.getTime();
    const recent = (this.burst.get(user.id) ?? []).filter((x) => t - x < 60_000);
    if (recent.length >= this.config.AI_BURST_PER_MIN) {
      const wait = Math.max(1, Math.ceil((60_000 - (t - recent[0]!)) / 1000));
      throw new ApiError(429, 'rate_limited', 'You are sending requests too fast. Wait a moment.', { retryAfterSeconds: wait }, { 'retry-after': String(wait) });
    }

    if ((await this.spentThisMonth(now)) >= this.config.AI_MONTHLY_BUDGET_USD) {
      throw new ApiError(503, 'ai_disabled', 'The AI advisor has reached its monthly limit and is paused until next month.');
    }
    const used = await this.usedToday(user.id, now);
    if (used >= this.config.AI_DAILY_REQUESTS_PER_USER) {
      const wait = Math.max(1, Math.ceil((dayStart(now).getTime() + 86_400_000 - t) / 1000));
      throw new ApiError(429, 'quota_exceeded', 'You have used all your AI requests for today. They reset at midnight (Tashkent time).', { retryAfterSeconds: wait, dailyLimit: this.config.AI_DAILY_REQUESTS_PER_USER }, { 'retry-after': String(wait) });
    }

    this.inflight.add(key);
    recent.push(t);
    this.burst.set(user.id, recent);
    const row = await this.prisma.aiUsage.create({ data: { userId: user.id, task, tier, model: this.llm.modelFor(tier as never), status: 'pending' } });
    let done = false;
    return {
      finish: async (status: UsageStatus, usage?: { model: string; inputTokens: number; outputTokens: number }) => {
        if (done) return;
        done = true;
        this.inflight.delete(key);
        // Only sizes and cost are stored — never prompts, documents or answers.
        await this.prisma.aiUsage
          .update({
            where: { id: row.id },
            data: {
              status,
              ...(usage ? { model: usage.model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, costUsdEst: estimateCostUsd(usage.model, usage.inputTokens, usage.outputTokens, this.prices) } : {}),
            },
          })
          .catch(() => undefined);
      },
    };
  }
}
