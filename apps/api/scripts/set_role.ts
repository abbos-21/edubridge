/**
 * Gives a person a role. This is the only way to create the first admin (there is no sign-up for it).
 *
 *   npm run role -w @edubridge/api -- telegram:123456789 admin
 *   npm run role -w @edubridge/api -- google:<sub> editor
 *   npm run role -w @edubridge/api -- user:<uuid> student
 *
 * The person must have signed in once so that they exist. The change is written to the audit log.
 */
import { createPrisma } from '../src/db';

const [who, role] = process.argv.slice(2);
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
if (!who || !role || !['student', 'editor', 'admin'].includes(role)) {
  console.error('Usage: set_role <telegram:ID | google:SUB | user:UUID> <student|editor|admin>');
  process.exit(2);
}

const prisma = createPrisma(url);
try {
  const [kind, value] = [who.slice(0, who.indexOf(':')), who.slice(who.indexOf(':') + 1)];
  let userId: string | undefined;
  if (kind === 'user') userId = value;
  else if (kind === 'telegram' || kind === 'google') {
    userId = (await prisma.authIdentity.findUnique({ where: { provider_providerUserId: { provider: kind, providerUserId: value } } }))?.userId;
  }
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  if (!user) {
    console.error('No such user. They need to sign in once first.');
    process.exit(1);
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role: role as 'student' | 'editor' | 'admin' } }),
    prisma.auditLog.create({ data: { action: 'user.role', entityType: 'user', entityId: user.id, diff: { from: user.role, to: role, via: 'cli' } } }),
  ]);
  console.log(`${user.id}: ${user.role} -> ${role}`);
} finally {
  await prisma.$disconnect();
}
