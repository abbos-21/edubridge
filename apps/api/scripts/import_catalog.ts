/**
 * Loads the catalogue (data/catalog.json, taken from the original app) into the database.
 * It refuses to run on a database that already has a catalogue: editors' changes are never overwritten by accident.
 *   npm run db:import            first import
 *   npm run db:import -- --force replace everything (asks for nothing; use with care)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/config';
import { createPrisma } from '../src/db';
import { DATASETS } from '../src/lib/catalogStore';

const config = loadConfig();
const prisma = createPrisma(config.DATABASE_URL);
const force = process.argv.includes('--force');
const file = fileURLToPath(new URL('../data/catalog.json', import.meta.url));
const catalog: Record<string, unknown> = { overrides: {}, ...(JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>) };

const existing = await prisma.catalogMeta.findUnique({ where: { id: 1 } });
if (existing && !force) {
  console.error(`The catalogue is already imported (version ${existing.version}). Use --force to replace it.`);
  await prisma.$disconnect();
  process.exit(1);
}
for (const name of DATASETS) {
  if (!(name in catalog)) throw new Error(`data/catalog.json has no "${name}"`);
  await prisma.catalogDataset.upsert({ where: { name }, create: { name, data: catalog[name] as never }, update: { data: catalog[name] as never } });
}
const meta = await prisma.catalogMeta.upsert({ where: { id: 1 }, create: { id: 1, version: 1 }, update: { version: { increment: 1 } } });
await prisma.auditLog.create({ data: { action: 'catalog.import', entityType: 'catalog', entityId: String(meta.version) } });
console.log(`Imported ${DATASETS.length} datasets, catalogue version ${meta.version}.`);
await prisma.$disconnect();
