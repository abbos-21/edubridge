import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../config';
import { safeEqual } from '../auth/crypto';
import { monthStart } from '../ai/guard';
import { notFound } from '../errors';

const BUCKETS = [0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

/** In-memory request counters and latency histogram, labelled by route pattern (never by raw URL, so no user data). */
export class Metrics {
  private counts = new Map<string, number>();
  private hist = new Map<string, { buckets: number[]; sum: number; count: number }>();
  readonly startedAt = Date.now();

  observe(method: string, route: string, status: number, seconds: number) {
    const k = `${method}|${route}|${status}`;
    this.counts.set(k, (this.counts.get(k) ?? 0) + 1);
    const hk = `${method}|${route}`;
    const h = this.hist.get(hk) ?? { buckets: BUCKETS.map(() => 0), sum: 0, count: 0 };
    BUCKETS.forEach((b, i) => { if (seconds <= b) h.buckets[i]!++; });
    h.sum += seconds;
    h.count++;
    this.hist.set(hk, h);
  }

  render(): string {
    const out: string[] = ['# TYPE edubridge_http_requests_total counter'];
    for (const [k, v] of this.counts) {
      const [m, r, s] = k.split('|');
      out.push(`edubridge_http_requests_total{method="${m}",route="${r}",status="${s}"} ${v}`);
    }
    out.push('# TYPE edubridge_http_request_duration_seconds histogram');
    for (const [k, h] of this.hist) {
      const [m, r] = k.split('|');
      BUCKETS.forEach((b, i) => out.push(`edubridge_http_request_duration_seconds_bucket{method="${m}",route="${r}",le="${b}"} ${h.buckets[i]}`));
      out.push(`edubridge_http_request_duration_seconds_bucket{method="${m}",route="${r}",le="+Inf"} ${h.count}`);
      out.push(`edubridge_http_request_duration_seconds_sum{method="${m}",route="${r}"} ${h.sum.toFixed(6)}`);
      out.push(`edubridge_http_request_duration_seconds_count{method="${m}",route="${r}"} ${h.count}`);
    }
    out.push('# TYPE edubridge_uptime_seconds gauge', `edubridge_uptime_seconds ${Math.round((Date.now() - this.startedAt) / 1000)}`);
    return out.join('\n') + '\n';
  }
}

/** Prometheus text at /api/v1/metrics. Switched off (404) unless METRICS_TOKEN is set; the proxy also never exposes it publicly. */
export function registerMetricsRoute(app: FastifyInstance, d: { config: Config; prisma: PrismaClient; metrics: Metrics }) {
  const { config, prisma, metrics } = d;
  const allowed = (req: FastifyRequest) => {
    const t = config.METRICS_TOKEN;
    const given = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    return !!t && !!given && safeEqual(given, t);
  };
  app.get('/metrics', async (req, reply) => {
    if (!config.METRICS_TOKEN || !allowed(req)) throw notFound('Route');
    const [aiMonth, remPending, remFailed, users, openFindings, lastRun, version] = await Promise.all([
      prisma.aiUsage.aggregate({ where: { createdAt: { gte: monthStart() } }, _sum: { costUsdEst: true, inputTokens: true, outputTokens: true }, _count: { _all: true } }),
      prisma.reminder.count({ where: { status: 'pending' } }),
      prisma.reminder.count({ where: { status: 'failed' } }),
      prisma.user.count(),
      prisma.recheckFinding.count({ where: { status: 'open' } }),
      prisma.recheckRun.findFirst({ where: { status: 'done' }, orderBy: { finishedAt: 'desc' }, select: { finishedAt: true } }),
      prisma.catalogueMeta.findUnique({ where: { id: 1 } }),
    ]);
    const g = (name: string, v: number) => `# TYPE edubridge_${name} gauge\nedubridge_${name} ${v}\n`;
    const body =
      metrics.render() +
      g('ai_requests_month', aiMonth._count._all) +
      g('ai_cost_usd_month_estimate', Number(aiMonth._sum.costUsdEst ?? 0)) +
      g('ai_input_tokens_month', aiMonth._sum.inputTokens ?? 0) +
      g('ai_output_tokens_month', aiMonth._sum.outputTokens ?? 0) +
      g('ai_budget_usd', config.AI_MONTHLY_BUDGET_USD) +
      g('reminders_pending', remPending) +
      g('reminders_failed', remFailed) +
      g('users', users) +
      g('recheck_open_findings', openFindings) +
      g('recheck_last_success_timestamp', lastRun?.finishedAt ? Math.round(lastRun.finishedAt.getTime() / 1000) : 0) +
      g('catalogue_version', version?.version ?? 0);
    return reply.type('text/plain; version=0.0.4').header('cache-control', 'no-store').send(body);
  });
}
