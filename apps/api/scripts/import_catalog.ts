import { fileURLToPath } from 'node:url';
import { createPrisma } from '../src/db';
import { importCatalog } from '../src/lib/importCatalog';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const dir = fileURLToPath(new URL('../../../data/recovered/', import.meta.url));
const prisma = createPrisma(url);
try {
  // Importing REPLACES the published catalogue with the recovered files, wiping edits made in the admin area.
  const existing = await prisma.university.count();
  if (existing > 0 && !process.argv.includes('--force')) {
    console.error(`Refusing to import: the database already holds ${existing} universities and an import would overwrite admin edits. Use --force only if you mean it.`);
    process.exit(1);
  }
  const report = await importCatalog(prisma, dir);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await prisma.$disconnect();
}
