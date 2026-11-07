import { afterAll, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { createPrisma } from '../src/db';
import { importCatalog } from '../src/lib/importCatalog';

const prisma = createPrisma(process.env.DATABASE_URL_TEST!);
afterAll(async () => {
  await prisma.$disconnect();
});

describe('catalogue import', () => {
  it('is idempotent: re-running keeps row counts and only bumps the version', async () => {
    const dir = fileURLToPath(new URL('../../../data/recovered/', import.meta.url));
    const counts = async () => ({
      uni: await prisma.university.count(),
      lvl: await prisma.universityLevel.count(),
      grant: await prisma.grant.count(),
      src: await prisma.source.count(),
    });
    const before = await counts();
    const v1 = (await prisma.catalogueMeta.findUniqueOrThrow({ where: { id: 1 } })).version;
    await importCatalog(prisma, dir);
    const after = await counts();
    const v2 = (await prisma.catalogueMeta.findUniqueOrThrow({ where: { id: 1 } })).version;
    expect(after).toEqual(before);
    expect(v2).toBe(v1 + 1);
    expect(before).toMatchObject({ uni: 50, lvl: 100, grant: 13 });
  });
  it('marks QS pages as blocking automation (recorded as links only)', async () => {
    const qs = await prisma.source.findMany({ where: { url: { contains: 'topuniversities.com' } } });
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.every((s) => s.blocksAutomation)).toBe(true);
  });
  it('every grant source is an http(s) URL', async () => {
    const rows = await prisma.source.findMany({ where: { entityType: 'grant' } });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((s) => /^https?:\/\//.test(s.url))).toBe(true);
  });
});
