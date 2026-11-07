import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['./tests/globalSetup.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    // all test files share one database: run files sequentially
    fileParallelism: false,
  },
});
