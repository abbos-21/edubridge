import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createPrisma } from '../src/db';
import { DATASETS } from '../src/lib/catalogStore';

const DEFAULT_TEST_URL = 'postgresql://edubridge:edubridge@localhost:5433/edubridge_test?schema=public';

function testUrl(): string {
  if (process.env.DATABASE_URL_TEST) return process.env.DATABASE_URL_TEST;
  const envFile = fileURLToPath(new URL('../../../.env', import.meta.url));
  if (existsSync(envFile)) {
    const m = readFileSync(envFile, 'utf8').match(/^DATABASE_URL_TEST=(.+)$/m);
    if (m?.[1]) return m[1].trim();
  }
  return DEFAULT_TEST_URL;
}

export default async function setup() {
  const url = testUrl();
  process.env.DATABASE_URL_TEST = url;
  // Safety: never run destructive test setup against a non-test database.
  if (!/_test(\?|$)/.test(url)) throw new Error('DATABASE_URL_TEST must point to a database whose name ends with _test');
  execSync('npx prisma migrate deploy', { cwd: fileURLToPath(new URL('..', import.meta.url)), env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' });
  const prisma = createPrisma(url);
  try {
    const catalog: Record<string, unknown> = { overrides: {}, ...(JSON.parse(readFileSync(fileURLToPath(new URL('../data/catalog.json', import.meta.url)), 'utf8')) as Record<string, unknown>) };
    for (const name of DATASETS) await prisma.catalogDataset.upsert({ where: { name }, create: { name, data: catalog[name] as never }, update: { data: catalog[name] as never } });
    await prisma.catalogMeta.upsert({ where: { id: 1 }, create: { id: 1, version: 1 }, update: { version: 1 } });
  } finally {
    await prisma.$disconnect();
  }
}
