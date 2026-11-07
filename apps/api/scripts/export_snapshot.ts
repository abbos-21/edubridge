import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPrisma } from '../src/db';
import { CatalogRepo } from '../src/lib/catalogRepo';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const out = fileURLToPath(new URL('../../web/src/data/snapshot.json', import.meta.url));
const prisma = createPrisma(url);
try {
  const snap = await new CatalogRepo(prisma).snapshot();
  const payload = { ...snap, builtAt: new Date().toISOString().slice(0, 10) };
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(payload));
  console.log(`snapshot v${snap.version}: ${snap.universities.length} universities, ${snap.grants.length} grants -> ${out}`);
} finally {
  await prisma.$disconnect();
}
