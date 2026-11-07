import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createPrisma } from '../src/db';
import { importCatalog } from '../src/lib/importCatalog';

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
  execSync('npx prisma migrate deploy', {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });
  const prisma = createPrisma(url);
  try {
    await importCatalog(prisma, fileURLToPath(new URL('../../../data/recovered/', import.meta.url)));
  } finally {
    await prisma.$disconnect();
  }
}
