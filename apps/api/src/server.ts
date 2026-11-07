import { buildApp } from './app';
import { loadConfig } from './config';
import { createPrisma } from './db';

const config = loadConfig();
const prisma = createPrisma(config.DATABASE_URL);
const app = await buildApp({ config, prisma });

const stop = async (signal: string) => {
  app.log.info({ signal }, 'shutting down');
  await app.close();
  process.exit(0);
};
process.on('SIGINT', () => void stop('SIGINT'));
process.on('SIGTERM', () => void stop('SIGTERM'));

await app.listen({ port: config.PORT, host: config.HOST });
