/// <reference types="vitest" />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  // The single-file build (claude.ai) has no accounts or AI, so the heavy file readers are replaced by a stub.
  resolve: mode === 'single' ? { alias: { 'pdfjs-dist/build/pdf.worker.min.mjs?url': fileURLToPath(new URL('./src/ai/readers.stub.ts', import.meta.url)), 'pdfjs-dist': fileURLToPath(new URL('./src/ai/readers.stub.ts', import.meta.url)), 'mammoth/mammoth.browser': fileURLToPath(new URL('./src/ai/readers.stub.ts', import.meta.url)) } } : {},
  server: { port: 5173, proxy: { '/api': 'http://localhost:8787' } },
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist', target: 'es2022' },
  test: { environment: 'jsdom', globals: false, css: false, include: ['tests/**/*.test.ts?(x)'] },
}));
