import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Prisma, PrismaClient } from '@prisma/client';
import { LEVELS, NATIONAL_GRANT_IDS, checkCatalogue, zGrant, zUniversity, type University } from '@edubridge/shared';

const COUNTRY_ORDER = ['MY', 'HU', 'DE', 'TR', 'KR'] as const;
const COUNTRY_NAMES_RU: Record<string, string> = { MY: 'Малайзия', HU: 'Венгрия', DE: 'Германия', TR: 'Турция', KR: 'Южная Корея' };

/** Legacy records that are real but outside the 7 national grants: kept as secondary "other scholarships". */
const OTHER_IDS = ['chevening', 'mext-embassy', 'el-yurt-umidi', 'erasmus-mundus', 'tum-waiver', 'hwum-foundation-award'];

export type ImportReport = {
  universities: number;
  levels: number;
  nationalGrants: number;
  otherGrants: number;
  sources: number;
  version: number;
  droppedDemo: string[];
  ruleViolations: number;
};

const readJson = (dir: string, f: string) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as unknown[];

export type SourceRow = { url: string; kind: string; entityType: string; entityId: string; field: string; blocksAutomation: boolean };

export function collectUniversitySources(u: University): SourceRow[] {
  const rows: SourceRow[] = [];
  const add = (url: unknown, field: string, kind = 'official') => {
    if (typeof url !== 'string' || !/^https?:\/\//.test(url)) return;
    rows.push({
      url,
      kind,
      entityType: 'university',
      entityId: u.id,
      field,
      // QS blocks automated reading: record as link-only, never bypass (Part C18).
      blocksAutomation: /topuniversities\.com/.test(url),
    });
  };
  add(u.website, 'website');
  add(u.admissions, 'admissions');
  add(u.apply, 'apply');
  add(u.fee?.source, 'fee');
  add(u.ranking?.source?.url, 'ranking', 'ranking');
  add(u.ranking?.url, 'ranking.url', 'ranking');
  for (const lvl of LEVELS) {
    const l = u.levels[lvl];
    if (!l) continue;
    (l.sources ?? []).forEach((s, i) => add(s, `levels.${lvl}.sources.${i}`));
    add(l.tuition?.source, `levels.${lvl}.tuition`);
    add(l.deadline?.source, `levels.${lvl}.deadline`);
    add(l.apply, `levels.${lvl}.apply`);
    add(l.example?.url, `levels.${lvl}.example`);
  }
  return rows;
}

export function collectGrantSources(id: string, g: Record<string, any>): SourceRow[] {
  const urls = [g.url, g.applyUrl, g.infoUrl, g.source_url, ...(Array.isArray(g.sources) ? g.sources : [])];
  const rows: SourceRow[] = [];
  urls.forEach((url, i) => {
    if (typeof url === 'string' && /^https?:\/\//.test(url)) {
      rows.push({ url, kind: 'official', entityType: 'grant', entityId: id, field: `url.${i}`, blocksAutomation: false });
    }
  });
  return rows;
}

/** Idempotent: re-running updates existing rows and bumps the catalogue version once. */
export async function importCatalog(prisma: PrismaClient, dataDir: string): Promise<ImportReport> {
  const unis = readJson(dataDir, 'universities.recovered.json').map((x) => zUniversity.parse(x));
  const researchGrants = readJson(dataDir, 'grants_research.recovered.json').map((x) => zGrant.parse(x));
  const legacy = readJson(dataDir, 'grants.recovered.json') as Array<Record<string, any>>;
  const readObj = (f: string) => JSON.parse(readFileSync(join(dataDir, f), 'utf8')) as Record<string, any>;
  const countryMeta = readObj('countries.recovered.json');
  const guidance = readObj('country-guidance.recovered.json');
  const selection = readObj('selection.recovered.json');
  const guide = readObj('university-guidance.recovered.json');

  const check = checkCatalogue(unis);
  if (check.problems.length) throw new Error(`Refusing to import: ${check.problems.join('; ')}`);

  const droppedDemo = legacy.filter((g) => String(g.id).startsWith('demo-')).map((g) => String(g.id));
  const others = OTHER_IDS.map((id) => legacy.find((g) => g.id === id)).filter((g): g is Record<string, any> => !!g);
  const missingOther = OTHER_IDS.filter((id) => !others.some((g) => g.id === id));
  if (missingOther.length) throw new Error(`Expected legacy scholarships not found: ${missingOther.join(', ')}`);

  const sourceRows: SourceRow[] = [];
  let levelCount = 0;

  await prisma.$transaction(
    async (tx) => {
      for (const [i, code] of COUNTRY_ORDER.entries()) {
        const meta = (countryMeta[code] ?? {}) as Record<string, any>;
        const data = {
          name: { ...meta.name, ru: COUNTRY_NAMES_RU[code] },
          tagline: meta.tagline,
          selection: selection[code],
          guidance: guidance[code],
          documents: guide.documents?.[code],
          steps: guide.steps?.[code],
          guidanceSources: guidance[code]?.sources ?? [],
        };
        await tx.country.upsert({
          where: { code },
          create: { code, position: i + 1, data: data as Prisma.InputJsonValue },
          update: { position: i + 1, data: data as Prisma.InputJsonValue },
        });
      }

      for (const u of unis) {
        const { id, country, order, tier, name, short, city, type, website, lastChecked, levels, ...rest } = u;
        const row = {
          countryCode: country,
          position: order,
          tier,
          name,
          short: short ?? null,
          city: city ?? null,
          type: type ?? null,
          website: website ?? null,
          lastChecked: lastChecked ?? null,
          status: 'published' as const,
          data: rest as Prisma.InputJsonValue,
        };
        await tx.university.upsert({ where: { id }, create: { id, ...row }, update: row });
        for (const lvl of LEVELS) {
          const data = levels[lvl];
          if (!data) continue;
          await tx.universityLevel.upsert({
            where: { universityId_level: { universityId: id, level: lvl } },
            create: { universityId: id, level: lvl, data: data as Prisma.InputJsonValue },
            update: { data: data as Prisma.InputJsonValue },
          });
          levelCount++;
        }
        sourceRows.push(...collectUniversitySources(u));
      }

      let pos = 0;
      for (const id of NATIONAL_GRANT_IDS) {
        const g = researchGrants.find((x) => x.id === id);
        if (!g) throw new Error(`National grant missing: ${id}`);
        const { id: _i, name, country, checked, ...rest } = g;
        const row = { kind: 'national' as const, name, country, position: pos++, checked: checked ?? null, status: 'published' as const, data: rest as Prisma.InputJsonValue };
        await tx.grant.upsert({ where: { id }, create: { id, ...row }, update: row });
        sourceRows.push(...collectGrantSources(id, g));
      }
      pos = 0;
      for (const g of others) {
        const { id, name, country, ...rest } = g;
        const row = {
          kind: 'other' as const,
          name: String(name),
          country: String(country),
          position: pos++,
          checked: (g.last_verified_at as string | undefined) ?? null,
          status: 'published' as const,
          data: { ...rest, legacy: true } as Prisma.InputJsonValue,
        };
        await tx.grant.upsert({ where: { id: String(id) }, create: { id: String(id), ...row }, update: row });
        sourceRows.push(...collectGrantSources(String(id), g));
      }

      // Replace this importer's source rows idempotently.
      await tx.source.createMany({ data: dedupe(sourceRows), skipDuplicates: true });

      const meta = await tx.catalogueMeta.upsert({
        where: { id: 1 },
        create: { id: 1, version: 1 },
        update: { version: { increment: 1 } },
      });

      await tx.auditLog.create({
        data: { action: 'catalogue.import', entityType: 'catalogue', entityId: 'all', diff: { version: meta.version, universities: unis.length } },
      });
    },
    { timeout: 120_000, maxWait: 30_000 },
  );

  const version = (await prisma.catalogueMeta.findUniqueOrThrow({ where: { id: 1 } })).version;
  return {
    universities: unis.length,
    levels: levelCount,
    nationalGrants: NATIONAL_GRANT_IDS.length,
    otherGrants: others.length,
    sources: dedupe(sourceRows).length,
    version,
    droppedDemo,
    ruleViolations: check.violations.length,
  };
}

function dedupe(rows: SourceRow[]): SourceRow[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const k = `${r.entityType}|${r.entityId}|${r.field}|${r.url}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
