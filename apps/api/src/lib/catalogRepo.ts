import type { PrismaClient } from '@prisma/client';
import { LEVELS, zUniversity, type University } from '@edubridge/shared';

export type PublicGrant = Record<string, unknown> & { id: string; kind: 'national' | 'other'; name: string; country: string };
export type PublicCountry = { code: string; position: number } & Record<string, unknown>;

export type CatalogueSnapshot = {
  version: number;
  universities: University[];
  grants: PublicGrant[];
  countries: PublicCountry[];
};

type UniRow = { id: string; countryCode: string; position: number; tier: string; name: string; short: string | null; city: string | null; type: string | null; website: string | null; lastChecked: string | null; data: unknown; levels: Array<{ level: string; data: unknown }> };

/** Rebuilds the record shape the frontend uses from a university row and its levels. */
export function toUniversityRecord(u: UniRow): University {
  const levels: Record<string, unknown> = {};
  for (const l of u.levels) if ((LEVELS as readonly string[]).includes(l.level)) levels[l.level] = l.data;
  return zUniversity.parse({
    ...(u.data as object),
    id: u.id,
    country: u.countryCode,
    order: u.position,
    tier: u.tier,
    name: u.name,
    short: u.short,
    city: u.city,
    type: u.type,
    website: u.website,
    lastChecked: u.lastChecked,
    levels,
  });
}

/**
 * Reads the PUBLISHED catalogue and rebuilds the record shape the frontend uses
 * (levels as {bachelor, master}). Cached in memory per catalogue version.
 */
export class CatalogRepo {
  private cache: CatalogueSnapshot | null = null;

  private versionAt = 0;
  private versionValue = 0;

  /**
   * `versionTtlMs`: how long the version number may be remembered. Every catalogue read asks for it, so asking the
   * database each time made it the bottleneck under load. Changes made through this server call invalidate() and are
   * seen at once; a change made by another process (such as the import script) shows up within the TTL.
   */
  constructor(private prisma: PrismaClient, private versionTtlMs = process.env.NODE_ENV === 'test' ? 0 : 3000) {}

  async version(): Promise<number> {
    const now = Date.now();
    if (this.versionTtlMs > 0 && now - this.versionAt < this.versionTtlMs) return this.versionValue;
    const m = await this.prisma.catalogueMeta.findUnique({ where: { id: 1 } });
    this.versionValue = m?.version ?? 0;
    this.versionAt = now;
    return this.versionValue;
  }

  invalidate() {
    this.cache = null;
    this.versionAt = 0;
  }

  async snapshot(): Promise<CatalogueSnapshot> {
    const v = await this.version();
    if (this.cache && this.cache.version === v) return this.cache;

    const [unis, grants, countries] = await Promise.all([
      this.prisma.university.findMany({
        where: { status: 'published' },
        include: { levels: true },
        orderBy: [{ countryCode: 'asc' }, { position: 'asc' }],
      }),
      this.prisma.grant.findMany({ where: { status: 'published' }, orderBy: [{ kind: 'asc' }, { position: 'asc' }] }),
      this.prisma.country.findMany({ orderBy: { position: 'asc' } }),
    ]);

    const universities = unis.map(toUniversityRecord);

    this.cache = {
      version: v,
      universities,
      grants: grants.map((g) => ({ ...(g.data as object), id: g.id, kind: g.kind, name: g.name, country: g.country }) as PublicGrant),
      countries: countries.map((c) => ({ ...(c.data as object), code: c.code, position: c.position })),
    };
    return this.cache;
  }
}
