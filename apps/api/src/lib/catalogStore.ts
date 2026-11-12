import type { Prisma, PrismaClient } from '@prisma/client';

/**
 * The catalogue as the web app consumes it. Each dataset is one JSON document. Arrays hold records (universities,
 * scholarships, programmes); the other datasets are single values (the "checked on" date, the country texts).
 */
export const DATASETS = ['scholarships', 'programs', 'legacyUniversities', 'legacyScholarships', 'checked', 'selection', 'universities', 'grants', 'overrides'] as const;
export type DatasetName = (typeof DATASETS)[number];
export const isDataset = (n: string): n is DatasetName => (DATASETS as readonly string[]).includes(n);

type Rec = Record<string, unknown>;
const isObj = (x: unknown): x is Rec => !!x && typeof x === 'object' && !Array.isArray(x);

/** How a record is addressed in the admin API: its id, else its name, else its position. */
export const keyOf = (r: unknown, i: number): string => (isObj(r) && typeof r.id === 'string' ? r.id : isObj(r) && typeof r.name === 'string' ? r.name : String(i));

export class CatalogStore {
  constructor(private prisma: PrismaClient) {}

  async version(): Promise<number> {
    return (await this.prisma.catalogMeta.findUnique({ where: { id: 1 } }))?.version ?? 0;
  }

  async raw(): Promise<Record<string, unknown>> {
    const rows = await this.prisma.catalogDataset.findMany();
    return Object.fromEntries(rows.map((r) => [r.name, r.data]));
  }

  /** What students get: records an editor hid are left out. */
  async publicCatalog() {
    const raw = await this.raw();
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) out[k] = Array.isArray(v) ? v.filter((r) => !(isObj(r) && r.hidden === true)) : v;
    return { version: await this.version(), ...out };
  }

  async dataset(name: DatasetName): Promise<unknown> {
    return (await this.prisma.catalogDataset.findUnique({ where: { name } }))?.data ?? null;
  }

  /** Writes a dataset, bumps the catalogue version and records the change, in one transaction. */
  async write(name: DatasetName, data: unknown, audit: { actorId: string | null; action: string; entityId: string; diff?: unknown; ipHash?: string | null }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.catalogDataset.upsert({ where: { name }, create: { name, data: data as Prisma.InputJsonValue }, update: { data: data as Prisma.InputJsonValue } });
      const meta = await tx.catalogMeta.upsert({ where: { id: 1 }, create: { id: 1, version: 1 }, update: { version: { increment: 1 } } });
      await tx.auditLog.create({ data: { actorId: audit.actorId, action: audit.action, entityType: `catalog:${name}`, entityId: audit.entityId, diff: (audit.diff ?? undefined) as Prisma.InputJsonValue | undefined, ipHash: audit.ipHash ?? null } });
      return meta.version;
    });
  }
}

/** Every http(s) link in a record with the field it sits under: the sources the recheck worker watches. */
export function collectSources(rec: unknown, path = ''): Array<{ field: string; url: string }> {
  const out: Array<{ field: string; url: string }> = [];
  const walk = (v: unknown, p: string) => {
    if (typeof v === 'string') {
      if (/^https?:\/\/[^\s]+$/i.test(v) && /(url|website|link|source|apply|admissions|page)/i.test(p) && !/example\.org/.test(v)) out.push({ field: p, url: v });
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${p}[${i}]`));
    else if (isObj(v)) for (const [k, x] of Object.entries(v)) walk(x, p ? `${p}.${k}` : k);
  };
  walk(rec, path);
  return out;
}
