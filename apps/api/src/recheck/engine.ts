import type { PrismaClient } from '@prisma/client';
import type { Config } from '../config';
import { CatalogStore, collectSources, keyOf } from '../lib/catalogStore';
import { PoliteFetcher } from './fetcher';

/**
 * Link recheck. Once a month (or when an admin asks) every source link in the catalogue is fetched politely. The
 * page text is hashed and compared with the last good hash: a change, a broken link, a redirect or a block becomes a
 * finding for a person to read. The recheck NEVER edits the catalogue.
 */
const MANUAL_HOSTS = /(^|\.)topuniversities\.com$|(^|\.)linkedin\.com$/i; // sites that refuse automated reading: checked by hand

/** Makes the Source table match the links currently in the catalogue datasets. */
export async function syncSources(prisma: PrismaClient, store: CatalogStore) {
  const raw = await store.raw();
  const wanted = new Map<string, { dataset: string; recordId: string; field: string; url: string }>();
  for (const [dataset, data] of Object.entries(raw)) {
    if (!Array.isArray(data)) continue;
    data.forEach((rec, i) => {
      for (const s of collectSources(rec)) wanted.set(`${dataset}|${keyOf(rec, i)}|${s.field}|${s.url}`, { dataset, recordId: keyOf(rec, i), field: s.field, url: s.url });
    });
  }
  const have = await prisma.source.findMany({ select: { id: true, dataset: true, recordId: true, field: true, url: true } });
  const haveKeys = new Set(have.map((s) => `${s.dataset}|${s.recordId}|${s.field}|${s.url}`));
  const fresh = [...wanted.entries()].filter(([k]) => !haveKeys.has(k)).map(([, v]) => ({ ...v, blocksAutomation: MANUAL_HOSTS.test(new URL(v.url).hostname) }));
  if (fresh.length) await prisma.source.createMany({ data: fresh, skipDuplicates: true });
  const stale = have.filter((s) => !wanted.has(`${s.dataset}|${s.recordId}|${s.field}|${s.url}`));
  if (stale.length) await prisma.source.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
  return { added: fresh.length, removed: stale.length, total: wanted.size };
}

const snippet = (before: string | null, after: string): string => {
  const a = new Set((before ?? '').split(/\n+/).map((l) => l.trim()).filter(Boolean));
  const b = after.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const added = b.filter((l) => !a.has(l)).slice(0, 4).map((l) => `+ ${l.slice(0, 160)}`);
  const bset = new Set(b);
  const removed = [...a].filter((l) => !bset.has(l)).slice(0, 4).map((l) => `- ${l.slice(0, 160)}`);
  return [...removed, ...added].join('\n');
};

export async function runRecheck(prisma: PrismaClient, config: Config, runId: string, fetcher = new PoliteFetcher({ userAgent: `EduBridgeBot/1.0 (+${config.APP_ORIGIN}/#info--about)`, hostDelayMs: config.RECHECK_HOST_DELAY_MS })) {
  await prisma.recheckRun.update({ where: { id: runId }, data: { status: 'running', startedAt: new Date() } });
  const sources = await prisma.source.findMany({ where: { blocksAutomation: false }, orderBy: { url: 'asc' } });
  const urls = new Map<string, typeof sources>(); // one fetch per distinct URL
  for (const s of sources) urls.set(s.url, [...(urls.get(s.url) ?? []), s]);
  const summary = { checked: 0, changed: 0, broken: 0, blocked: 0, moved: 0, baseline: 0 };
  try {
    for (const [url, group] of urls) {
      const out = await fetcher.fetchPage(url);
      summary.checked++;
      const first = group[0]!;
      const finding = async (kind: 'changed' | 'broken' | 'blocked' | 'moved', extra: Record<string, unknown> = {}) => {
        await prisma.recheckFinding.create({ data: { runId, sourceId: first.id, kind, prevCheckedAt: first.lastCheckedAt, ...extra } as never });
        summary[kind]++;
      };
      const mark = (data: Record<string, unknown>) => prisma.source.updateMany({ where: { id: { in: group.map((g) => g.id) } }, data: { lastCheckedAt: new Date(), ...data } });
      if (out.kind === 'ok') {
        if (first.lastHash && first.lastHash !== out.hash) await finding('changed', { oldHash: first.lastHash, newHash: out.hash, diffSnippet: snippet(first.lastText, out.text), httpStatus: out.status, finalUrl: out.finalUrl });
        else if (out.finalUrl !== url && first.finalUrl !== out.finalUrl && first.lastHash) await finding('moved', { httpStatus: out.status, finalUrl: out.finalUrl });
        else if (!first.lastHash) summary.baseline++;
        await mark({ lastStatus: 'ok', lastHash: out.hash, httpStatus: out.status, finalUrl: out.finalUrl, lastText: out.text.slice(0, 20_000) });
      } else if (out.kind === 'blocked') {
        await finding('blocked', { httpStatus: out.status ?? null, finalUrl: out.finalUrl, note: out.reason });
        await mark({ lastStatus: `blocked:${out.reason}`, httpStatus: out.status ?? null });
      } else {
        await finding('broken', { httpStatus: out.status, finalUrl: out.finalUrl, note: out.reason });
        await mark({ lastStatus: 'broken', httpStatus: out.status });
      }
    }
    await prisma.recheckRun.update({ where: { id: runId }, data: { status: 'done', finishedAt: new Date(), summary } });
  } catch (e) {
    await prisma.recheckRun.update({ where: { id: runId }, data: { status: 'failed', finishedAt: new Date(), summary: { ...summary, error: String((e as Error).message).slice(0, 200) } } });
  } finally {
    await fetcher.close();
  }
  return summary;
}

/** Called by the worker every few minutes: starts a queued run, or queues the monthly one. */
export async function recheckTick(prisma: PrismaClient, config: Config, store: CatalogStore, now = new Date()) {
  if ((await store.version()) < 1) return null; // nothing to check before the catalogue is imported
  const running = await prisma.recheckRun.findFirst({ where: { status: 'running' } });
  if (running) return null;
  let run = await prisma.recheckRun.findFirst({ where: { status: 'queued' }, orderBy: { createdAt: 'asc' } });
  if (!run) {
    if (!config.RECHECK_ENABLED) return null;
    const last = await prisma.recheckRun.findFirst({ where: { status: { in: ['done', 'failed'] } }, orderBy: { createdAt: 'desc' } });
    if (last && now.getTime() - last.createdAt.getTime() <= config.RECHECK_INTERVAL_DAYS * 86_400_000) return null;
  }
  const synced = await syncSources(prisma, store);
  if (synced.total === 0) return null; // no links yet: do not record an empty run
  run ??= await prisma.recheckRun.create({ data: { trigger: 'schedule' } });
  return runRecheck(prisma, config, run.id);
}
