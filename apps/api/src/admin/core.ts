import type { FastifyRequest } from 'fastify';
import type { Prisma, PrismaClient, Role } from '@prisma/client';
import { diffRecords, validateGrantDraft, validateUniversityDraft, type CmsIssue, type FieldChange } from '@edubridge/shared';
import type { Config } from '../config';
import { ApiError } from '../errors';
import { hashIp, requireAuth, type AuthContext } from '../auth/session';
import { collectGrantSources, collectUniversitySources } from '../lib/importCatalog';
import { toUniversityRecord } from '../lib/catalogRepo';

export type EntityType = 'university' | 'grant';
export const ENTITY_TYPES = ['university', 'grant'] as const;
type Db = PrismaClient | Prisma.TransactionClient;

// ------------------------------------------------------------------ authorisation

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Deny by default. The role is read from the database on every request (never from the browser).
 * Changes additionally need a sign-in that is recent (ToR H12).
 */
export function authorise(req: FastifyRequest, config: Config, roles: readonly Role[]): AuthContext {
  const a = requireAuth(req);
  if (!roles.includes(a.user.role)) throw new ApiError(403, 'forbidden', 'You do not have access to this');
  if (UNSAFE.has(req.method) && Date.now() - a.signedInAt.getTime() > config.ADMIN_REAUTH_MINUTES * 60_000) {
    throw new ApiError(403, 'reauth_required', 'Sign in again to make changes in the admin area');
  }
  return a;
}

// ------------------------------------------------------------------ audit

const clip = (v: unknown): unknown => (typeof v === 'string' && v.length > 500 ? `${v.slice(0, 500)}…` : v);

/** Writes an audit entry. Pass the transaction client so the entry commits (or rolls back) with the change. */
export async function audit(db: Db, req: FastifyRequest, secret: string, action: string, entityType: string, entityId: string, diff?: unknown) {
  let d: unknown = diff;
  if (Array.isArray(diff)) d = (diff as FieldChange[]).slice(0, 200).map((c) => ({ path: c.path, before: clip(c.before), after: clip(c.after) }));
  await db.auditLog.create({
    data: { actorId: req.auth?.user.id ?? null, action, entityType, entityId, diff: (d ?? undefined) as Prisma.InputJsonValue | undefined, ipHash: hashIp(req.ip, secret) },
  });
}

// ------------------------------------------------------------------ records

/** The admin view of a catalogue record: the public shape plus the status, version and check date. */
export type Loaded = { record: Record<string, any>; status: string; version: number };

export async function loadEntity(db: Db, type: EntityType, id: string): Promise<Loaded | null> {
  if (type === 'university') {
    const u = await db.university.findUnique({ where: { id }, include: { levels: true } });
    return u ? { record: toUniversityRecord(u), status: u.status, version: u.version } : null;
  }
  const g = await db.grant.findUnique({ where: { id } });
  if (!g) return null;
  return { record: { ...(g.data as object), id: g.id, kind: g.kind, name: g.name, country: g.country, checked: g.checked }, status: g.status, version: g.version };
}

/** Validates a draft against the rules. `published` is what students see now (language rule only judges changes). */
export function validateDraft(type: EntityType, data: unknown, published: unknown): { issues: CmsIssue[]; record?: Record<string, any> } {
  if (type === 'university') {
    const r = validateUniversityDraft(data, { published });
    return { issues: r.issues, record: r.ok || r.record ? (r.record as Record<string, any>) : undefined };
  }
  const r = validateGrantDraft(data, { published });
  return { issues: r.issues, record: r.ok ? (data as Record<string, any>) : undefined };
}

export function changesOf(before: unknown, after: unknown): FieldChange[] {
  return diffRecords(before, after);
}

/** Writes an approved record into the published tables, inside the caller's transaction. */
export async function applyRecord(tx: Prisma.TransactionClient, type: EntityType, record: Record<string, any>): Promise<void> {
  if (type === 'university') {
    const { id, country, order, tier, name, short, city, type: kind, website, lastChecked, levels, ...rest } = record;
    await tx.university.update({
      where: { id },
      data: { name, short: short ?? null, city: city ?? null, type: kind ?? null, website: website ?? null, lastChecked: lastChecked ?? null, data: rest as Prisma.InputJsonValue, version: { increment: 1 } },
    });
    for (const lvl of ['bachelor', 'master'] as const) {
      const d = levels?.[lvl];
      if (d) {
        await tx.universityLevel.upsert({
          where: { universityId_level: { universityId: id, level: lvl } },
          create: { universityId: id, level: lvl, data: d as Prisma.InputJsonValue },
          update: { data: d as Prisma.InputJsonValue },
        });
      } else {
        await tx.universityLevel.deleteMany({ where: { universityId: id, level: lvl } });
      }
    }
    await syncSources(tx, 'university', id, collectUniversitySources(record as never));
    return;
  }
  const { id, kind: _k, name, country, checked, ...rest } = record;
  await tx.grant.update({ where: { id }, data: { name, country, checked: checked ?? null, data: rest as Prisma.InputJsonValue, version: { increment: 1 } } });
  await syncSources(tx, 'grant', id, collectGrantSources(id, record));
}

/** Keeps the `sources` table in step with the record, preserving recheck history of links that stay. */
async function syncSources(tx: Prisma.TransactionClient, entityType: string, entityId: string, rows: ReturnType<typeof collectUniversitySources>) {
  const key = (r: { field: string; url: string }) => `${r.field}|${r.url}`;
  const wanted = new Set(rows.map(key));
  const existing = await tx.source.findMany({ where: { entityType, entityId } });
  const stale = existing.filter((e) => !wanted.has(key(e))).map((e) => e.id);
  if (stale.length) await tx.source.deleteMany({ where: { id: { in: stale } } });
  await tx.source.createMany({ data: rows, skipDuplicates: true });
}

export async function bumpCatalogueVersion(tx: Prisma.TransactionClient): Promise<number> {
  const m = await tx.catalogueMeta.upsert({ where: { id: 1 }, create: { id: 1, version: 1 }, update: { version: { increment: 1 } } });
  return m.version;
}

export const OPEN_STATUSES = ['draft', 'in_review', 'rejected'] as const;
