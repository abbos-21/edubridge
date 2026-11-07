/**
 * Background worker: every minute it creates the reminders that are due soon and sends the ones that are due.
 *   npm run worker -w @edubridge/api
 * Without TELEGRAM_BOT_TOKEN it still plans reminders but sends nothing (they stay pending).
 * It also runs the monthly link recheck (and any run an admin queued).
 */
import { loadConfig } from '../src/config';
import { createPrisma } from '../src/db';
import { CatalogRepo } from '../src/lib/catalogRepo';
import { createTelegramApi } from '../src/bot/telegram';
import { runCycle } from '../src/reminders/engine';
import { PoliteFetcher } from '../src/recheck/fetcher';
import { processRecheckQueue } from '../src/recheck/engine';

const config = loadConfig();
const prisma = createPrisma(config.DATABASE_URL);
const repo = new CatalogRepo(prisma);
const telegram = createTelegramApi(config);
const fetcher = new PoliteFetcher({ userAgent: `EduBridgeBot/1.0 (+${config.APP_ORIGIN}/#info--about)`, hostDelayMs: config.RECHECK_HOST_DELAY_MS });
let stopping = false;
let rechecking = false; // the long link check runs beside the reminder loop, never inside it

for (const sig of ['SIGINT', 'SIGTERM'] as const) process.on(sig, () => { stopping = true; });

console.log(`worker started (telegram ${telegram.configured ? 'configured' : 'NOT configured: nothing will be sent'})`);
while (!stopping) {
  try {
    const r = await runCycle({ prisma, repo, telegram, config });
    if (r.created || r.sent || r.failed || r.retried || r.cancelled) console.log(new Date().toISOString(), JSON.stringify(r));
    if (!rechecking) {
      rechecking = true;
      void processRecheckQueue(prisma, fetcher, { intervalDays: config.RECHECK_INTERVAL_DAYS, scheduleEnabled: config.RECHECK_ENABLED })
        .then((rc) => { if (rc.ran) console.log(new Date().toISOString(), 'recheck finished', rc.ran); })
        .catch((err) => console.error('recheck failed', err instanceof Error ? err.message : err))
        .finally(() => { rechecking = false; });
    }
  } catch (err) {
    console.error('cycle failed', err instanceof Error ? err.message : err);
  }
  for (let i = 0; i < 60 && !stopping; i++) await new Promise((r) => setTimeout(r, 1000));
}
await prisma.$disconnect();
