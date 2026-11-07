import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../auth/session';
import { COLLECTIONS, MAX_SAVED } from './userdata';

type Row = Record<string, any>;

/** Browser state key -> server collection (see the frontend's `edubridge:v1`). */
const LOCAL_COLLECTIONS: Array<{ local: string; path: string; map: (item: Row) => Row | null }> = [
  { local: 'applications', path: 'application', map: (i) => (typeof i.opportunityId === 'string' || typeof i.opportunityRef === 'string' ? { opportunityRef: String(i.opportunityRef ?? i.opportunityId), data: i } : { opportunityRef: 'local', data: i }) },
  { local: 'customEvents', path: 'customEvent', map: (i) => ({ data: i }) },
  { local: 'budgets', path: 'budget', map: (i) => ({ data: i }) },
  { local: 'chatThreads', path: 'chatThread', map: (i) => ({ title: String(i.title ?? 'Chat').slice(0, 200), data: i }) },
  { local: 'interviews', path: 'interview', map: (i) => ({ data: i }) },
  {
    local: 'advisorDocs',
    path: 'advisorDoc',
    map: (i) => {
      const original = typeof i.originalText === 'string' ? i.originalText : typeof i.text === 'string' ? i.text : null;
      if (original === null || original.length > 2_000_000) return null;
      const working = typeof i.workingText === 'string' ? i.workingText : original;
      if (working.length > 2_000_000) return null;
      return { kind: String(i.kind ?? 'document').slice(0, 40), title: String(i.title ?? 'Document').slice(0, 200), originalText: original, workingText: working, analysis: i.analysis ?? undefined, history: i.history ?? undefined };
    },
  },
];

const CAPS = Object.fromEntries(COLLECTIONS.map((c) => [c.model, c.cap]));

const isObj = (x: unknown): x is Row => !!x && typeof x === 'object' && !Array.isArray(x);
const small = (x: unknown) => JSON.stringify(x).length <= 500_000;

export function registerTransferRoutes(app: FastifyInstance, d: { prisma: PrismaClient }) {
  const prisma = d.prisma as unknown as Record<string, any>;

  /** Everything the student has stored, as one JSON file (data portability). */
  app.get('/me/export', async (req, reply) => {
    const { user } = requireAuth(req);
    const where = { userId: user.id };
    const [profile, growth, settings, applications, events, budgets, chats, interviews, documents, saved, reminders] = await Promise.all([
      prisma.profile.findUnique({ where }),
      prisma.growthPlan.findUnique({ where }),
      prisma.userSettings.findUnique({ where }),
      prisma.application.findMany({ where }),
      prisma.customEvent.findMany({ where }),
      prisma.budget.findMany({ where }),
      prisma.chatThread.findMany({ where }),
      prisma.interview.findMany({ where }),
      prisma.advisorDoc.findMany({ where }),
      prisma.savedItem.findMany({ where, select: { kind: true, ref: true } }),
      prisma.reminder.findMany({ where }),
    ]);
    const strip = (r: Row | null) => (r ? Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'userId')) : null);
    reply.header('content-disposition', 'attachment; filename="edubridge-export.json"').header('cache-control', 'no-store');
    return {
      exportedAt: new Date().toISOString(),
      user: { id: user.id, lang: user.lang, createdAt: user.createdAt },
      profile: strip(profile),
      growth: strip(growth),
      settings: strip(settings),
      applications: applications.map(strip),
      events: events.map(strip),
      budgets: budgets.map(strip),
      chats: chats.map(strip),
      interviews: interviews.map(strip),
      documents: documents.map(strip),
      saved,
      reminders: reminders.map(strip),
    };
  });

  /**
   * First sign-in: copy the guest's browser data (edubridge:v1) to the account.
   * Never overwrites data the account already has; items already imported (same localId) are skipped.
   */
  app.post('/me/import-local', { bodyLimit: 12_000_000 }, async (req) => {
    const { user } = requireAuth(req);
    const { state } = z.object({ state: z.record(z.string(), z.unknown()) }).strict().parse(req.body);
    const where = { userId: user.id };
    const imported: Record<string, number | boolean> = {};
    const skipped: Record<string, number> = {};
    const bump = (o: Record<string, number>, k: string, n = 1) => (o[k] = (o[k] ?? 0) + n);

    // singletons: only when the account has none yet
    for (const [local, model, label] of [['profile', 'profile', 'profile'], ['growth', 'growthPlan', 'growth']] as const) {
      const v = state[local];
      if (!isObj(v) || !small(v)) continue;
      if (await prisma[model].findUnique({ where })) {
        imported[label] = false;
        bump(skipped, label);
      } else {
        await prisma[model].create({ data: { userId: user.id, data: v } });
        imported[label] = true;
      }
    }
    const prefs: Row = {};
    for (const k of ['lang', 'theme', 'displayCurrency', 'compare', 'finder'] as const) if (state[k] !== undefined) prefs[k] = state[k];
    if (Object.keys(prefs).length && small(prefs)) {
      if (await prisma.userSettings.findUnique({ where })) {
        imported.settings = false;
        bump(skipped, 'settings');
      } else {
        await prisma.userSettings.create({ data: { userId: user.id, data: prefs } });
        imported.settings = true;
      }
    }

    // saved
    if (Array.isArray(state.saved)) {
      const items = state.saved.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 200).map((ref) => ({ userId: user.id, kind: 'any', ref }));
      const have = new Set((await d.prisma.savedItem.findMany({ where, select: { ref: true } })).map((s) => s.ref));
      const fresh = items.filter((i) => !have.has(i.ref)).slice(0, Math.max(0, MAX_SAVED - have.size));
      if (fresh.length) await d.prisma.savedItem.createMany({ data: fresh, skipDuplicates: true });
      imported.saved = fresh.length;
      bump(skipped, 'saved', items.length - fresh.length);
    }

    // collections
    for (const lc of LOCAL_COLLECTIONS) {
      const list = state[lc.local];
      if (!Array.isArray(list)) continue;
      const existing: Row[] = await prisma[lc.path].findMany({ where });
      const seen = new Set<string>();
      for (const e of existing) if (typeof e.localId === 'string') seen.add(e.localId);
      let room = (CAPS[lc.path] ?? 50) - existing.length;
      let done = 0;
      for (const item of list) {
        if (!isObj(item) || !small(item)) { bump(skipped, lc.local); continue; }
        const localId = typeof item.id === 'string' ? item.id : undefined;
        if (localId && seen.has(localId)) { bump(skipped, lc.local); continue; }
        if (room <= 0) { bump(skipped, lc.local); continue; }
        const mapped = lc.map(item);
        if (!mapped) { bump(skipped, lc.local); continue; }
        await prisma[lc.path].create({ data: { userId: user.id, localId: localId ?? null, ...mapped } });
        if (localId) seen.add(localId);
        room--;
        done++;
      }
      imported[lc.local] = done;
    }
    return { imported, skipped };
  });
}
