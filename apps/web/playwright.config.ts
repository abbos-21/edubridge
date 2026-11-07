import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5173', trace: 'off' },
  webServer: [
    { command: 'npm run start -w @edubridge/api', cwd: '../..', url: 'http://localhost:8787/api/v1/ready', reuseExistingServer: true, timeout: 60_000, env: { RATE_LIMIT_PER_MIN: '100000', AUTH_RATE_LIMIT_PER_MIN: '100000', ALLOW_DEV_LOGIN: 'true', AI_MOCK: 'true', AI_DAILY_REQUESTS_PER_USER: '100000', AI_BURST_PER_MIN: '100000' } },
    { command: 'npm run dev -w @edubridge/web', cwd: '../..', url: 'http://localhost:5173', reuseExistingServer: true, timeout: 60_000 },
  ],
});
