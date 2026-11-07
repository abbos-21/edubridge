import type { Prisma, PrismaClient, FindingKind } from '@prisma/client';
import type { PoliteFetcher } from './fetcher';

const TEXT_CAP = 30_000;
const STALE_RUN_MS = 2 * 3_600_000;

/** Same page, ignoring http/https, "www.", a trailing slash and the #fragment. */
export function normaliseUrl(u: string): string {
  try {
    const x = new URL(u);
    return `${x.hostname.replace(/^www\./, '').toLowerCase()}${x.pathname.replace(/\/+$/, '')}${x.search}`;
  } catch {
    return u;
  }
}

/** A few changed lines, so a reviewer sees what moved without opening both versions. */
export function diffSnippet(oldText: string | null, newText: string): string {
  if (!oldText) return '';
  const a = new Set(oldText.split('\n').map((l) => l.trim()).filter(Boolean));
  const b = new Set(newText.split('\n').map((l) => l.trim()).filter(Boolean));
  const cut = (s: string) => (s.length > 200 ? s.slice(0, 200) + '…' : s);
  const removed = [...a].filter((l) => !b.has(l)).slice(0, 6).map((l) => `- ${cut(l)}`);
  const added = [...b].filter((l) => !a.has(l)).slice(0, 6).map((l) => `+ ${cut(l)}`);
  return [...removed, ...added].join('\n');
}

export type RecheckSummary = {
  urls: number;
  unchanged: number;
  newBaseline: number;
  changed: number;
  broken: number;
  blocked: number;
  moved: number;
  skippedManual: number;
  manual: Array<{ url: string; reason: string }>;
  durationMs: number;
};

/**
 * One pass over the `sources` table. It records what it finds as review items and nothing else: it never edits
 * the catalogue. Pages that refuse robots or automation are listed for a manual check and never bypassed.
 * `urlPrefix` limits the pass (used by tests so they never touch the real internet).
 */
export async function runRecheck(prisma: PrismaClient, fetcher: PoliteFetcher, runId: string, opts: { urlPrefix?: string } = {}): Promise<RecheckSummary> {
  const started = Date.now();
  await prisma.recheckRun.update({ where: { id: runId }, data: { status: 'running', startedAt: new Date() } });
  const sum: RecheckSummary = { urls: 0, unchanged: 0, newBaseline: 0, changed: 0, broken: 0, blocked: 0, moved: 0, skippedManual: 0, manual: [], durationMs: 0 };
  try {
    const rows = await prisma.source.findMany({ where: opts.urlPrefix ? { url: { startsWith: opts.urlPrefix } } : {}, orderBy: { url: 'asc' } });
    const byUrl = new Map<string, typeof rows>();
    for (const r of rows) byUrl.set(r.url, [...(byUrl.get(r.url) ?? []), r]);
    sum.urls = byUrl.size;

    for (const [url, group] of byUrl) {
      const first = group[0]!;
      const prev = group.find((g) => g.lastHash) ?? first;
      const now = new Date();
      const openOfKind = async (kind: FindingKind) => prisma.recheckFinding.findFirst({ where: { sourceId: { in: group.map((g) => g.id) }, kind, status: 'open' }, select: { id: true } });
      const record = async (kind: FindingKind, data: { oldHash?: string | null; newHash?: string | null; snippet?: string; httpStatus?: number | null; finalUrl?: string | null; note?: string }) => {
        if (await openOfKind(kind)) return; // already waiting for a reviewer
        await prisma.recheckFinding.create({
          data: { runId, sourceId: first.id, kind, oldHash: data.oldHash ?? null, newHash: data.newHash ?? null, diffSnippet: data.snippet || null, prevCheckedAt: prev.lastCheckedAt, httpStatus: data.httpStatus ?? null, finalUrl: data.finalUrl ?? null, note: data.note ?? null },
        });
      };
      const update = (data: Prisma.SourceUpdateManyMutationInput) => prisma.source.updateMany({ where: { url }, data: { lastCheckedAt: now, ...data } });

      // known to block automation (for example QS): never fetched, listed for a person to open
      if (group.some((g) => g.blocksAutomation)) {
        sum.skippedManual++;
        sum.manual.push({ url, reason: 'blocks_automation' });
        await update({ lastStatus: 'blocked' });
        await record('blocked', { note: 'blocks_automation' });
        sum.blocked++;
        continue;
      }

      const out = await fetcher.fetchPage(url);
      if (out.kind === 'blocked') {
        sum.blocked++;
        sum.manual.push({ url, reason: out.reason });
        // refusals by robots/forbidden/captcha are remembered so the next run does not knock again; a rate limit is temporary
        await update({ lastStatus: 'blocked', httpStatus: out.status ?? null, finalUrl: out.finalUrl, ...(out.reason === 'rate_limited' ? {} : { blocksAutomation: true }) });
        await record('blocked', { httpStatus: out.status, finalUrl: out.finalUrl, note: out.reason });
      } else if (out.kind === 'broken') {
        sum.broken++;
        await update({ lastStatus: 'broken', httpStatus: out.status, finalUrl: out.finalUrl });
        await record('broken', { httpStatus: out.status, finalUrl: out.finalUrl, note: out.reason });
      } else {
        const moved = normaliseUrl(out.finalUrl) !== normaliseUrl(url);
        const changed = !!prev.lastHash && prev.lastHash !== out.hash;
        const snippet = changed ? diffSnippet(prev.lastText, out.text) : '';
        await update({ lastStatus: moved ? 'moved' : changed ? 'changed' : 'ok', lastHash: out.hash, httpStatus: out.status, finalUrl: out.finalUrl, lastText: out.text.slice(0, TEXT_CAP) });
        if (moved) { sum.moved++; await record('moved', { oldHash: prev.lastHash, newHash: out.hash, httpStatus: out.status, finalUrl: out.finalUrl, note: out.finalUrl }); }
        else if (changed) { sum.changed++; await record('changed', { oldHash: prev.lastHash, newHash: out.hash, snippet, httpStatus: out.status, finalUrl: out.finalUrl }); }
        else if (!prev.lastHash) sum.newBaseline++;
        else sum.unchanged++;
      }
    }
    sum.durationMs = Date.now() - started;
    await prisma.recheckRun.update({ where: { id: runId }, data: { status: 'done', finishedAt: new Date(), summary: sum as unknown as Prisma.InputJsonValue } });
    return sum;
  } catch (err) {
    await prisma.recheckRun.update({ where: { id: runId }, data: { status: 'failed', finishedAt: new Date(), summary: { error: (err as Error).message } } });
    throw err;
  }
}

/** Worker step: fail stuck runs, queue the monthly run when it is due, and run the oldest queued one. */
export async function processRecheckQueue(prisma: PrismaClient, fetcher: PoliteFetcher, o: { intervalDays: number; scheduleEnabled: boolean }, now = new Date()): Promise<{ ran: string | null; queued: boolean }> {
  await prisma.recheckRun.updateMany({ where: { status: 'running', startedAt: { lt: new Date(now.getTime() - STALE_RUN_MS) } }, data: { status: 'failed', finishedAt: now, summary: { error: 'stuck: no result after 2 hours' } } });
  let queued = false;
  if (o.scheduleEnabled) {
    const last = await prisma.recheckRun.findFirst({ where: { status: { in: ['queued', 'running', 'done'] } }, orderBy: { createdAt: 'desc' } });
    if (!last || now.getTime() - last.createdAt.getTime() >= o.intervalDays * 86_400_000) {
      await prisma.recheckRun.create({ data: { trigger: 'schedule', status: 'queued' } });
      queued = true;
    }
  }
  const next = await prisma.recheckRun.findFirst({ where: { status: 'queued' }, orderBy: { createdAt: 'asc' } });
  if (!next) return { ran: null, queued };
  const claimed = await prisma.recheckRun.updateMany({ where: { id: next.id, status: 'queued' }, data: { status: 'running', startedAt: now } });
  if (!claimed.count) return { ran: null, queued };
  try {
    await runRecheck(prisma, fetcher, next.id);
  } catch {
    /* recorded on the run */
  }
  return { ran: next.id, queued };
}
