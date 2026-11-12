/**
 * Background worker (a separate process): sends due Telegram reminders every minute and runs the link recheck.
 * Several copies are safe: a reminder is leased before it is sent.
 */
import { loadConfig } from '../src/config';
import { createPrisma } from '../src/db';
import { createTelegramApi } from '../src/bot/telegram';
import { CatalogStore } from '../src/lib/catalogStore';
import { runDueReminders } from '../src/reminders/engine';
import { recheckTick } from '../src/recheck/engine';

const config = loadConfig();
const prisma = createPrisma(config.DATABASE_URL);
const telegram = createTelegramApi(config);
const store = new CatalogStore(prisma);
const log = (msg: string, extra: object = {}) => console.log(JSON.stringify({ time: new Date().toISOString(), msg, ...extra }));

let stopping = false;
let busy = false;
const tick = async () => {
  if (busy || stopping) return;
  busy = true;
  try {
    const r = await runDueReminders(prisma, config, telegram);
    if (r.sent || r.failed || r.cancelled) log('reminders', r);
    const rc = await recheckTick(prisma, config, store);
    if (rc) log('recheck finished', rc);
  } catch (e) {
    log('worker error', { error: String((e as Error).message).slice(0, 200) });
  } finally {
    busy = false;
  }
};
const timer = setInterval(() => void tick(), 60_000);
void tick();
log('worker started');
const stop = async () => {
  stopping = true;
  clearInterval(timer);
  while (busy) await new Promise((r) => setTimeout(r, 200));
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', () => void stop());
process.on('SIGTERM', () => void stop());
