import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../config';
import { safeEqual } from '../auth/crypto';

/** Request counters and latency, in Prometheus text format. Only labels with bounded values (method, route, status). */
export class Metrics {
  private counts = new Map<string, number>();
  private sums = new Map<string, number>();
  observe(method: string, route: string, status: number, seconds: number) {
    const k = `${method}|${route}|${status}`;
    this.counts.set(k, (this.counts.get(k) ?? 0) + 1);
    this.sums.set(k, (this.sums.get(k) ?? 0) + seconds);
  }
  render(extra: Record<string, number>): string {
    const lines = ['# TYPE edubridge_http_requests_total counter'];
    for (const [k, n] of this.counts) {
      const [m, r, s] = k.split('|');
      lines.push(`edubridge_http_requests_total{method="${m}",route="${r}",status="${s}"} ${n}`);
    }
    lines.push('# TYPE edubridge_http_request_seconds_sum counter');
    for (const [k, v] of this.sums) {
      const [m, r, s] = k.split('|');
      lines.push(`edubridge_http_request_seconds_sum{method="${m}",route="${r}",status="${s}"} ${v.toFixed(4)}`);
    }
    for (const [name, v] of Object.entries(extra)) lines.push(`# TYPE ${name} gauge`, `${name} ${v}`);
    return lines.join('\n') + '\n';
  }
}

export function registerMetricsRoute(app: FastifyInstance, d: { config: Config; prisma: PrismaClient; metrics: Metrics }) {
  if (!d.config.METRICS_TOKEN) return; // no token: the endpoint does not exist
  app.get('/metrics', async (req, reply) => {
    const presented = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    if (!safeEqual(presented, d.config.METRICS_TOKEN)) return reply.status(404).send();
    const [users, pending, sinceMonth] = await Promise.all([
      d.prisma.user.count(),
      d.prisma.reminder.count({ where: { status: 'pending' } }),
      d.prisma.aiUsage.aggregate({ _sum: { costUsdEst: true }, where: { createdAt: { gte: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)) } } }),
    ]);
    reply.header('content-type', 'text/plain; version=0.0.4');
    return d.metrics.render({ edubridge_users_total: users, edubridge_reminders_pending: pending, edubridge_ai_cost_usd_month: Number(sinceMonth._sum.costUsdEst ?? 0) });
  });
}
