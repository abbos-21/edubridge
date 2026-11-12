// Measures the rendering noise floor: the original artifact compared with a second load of itself.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const here = path.dirname(fileURLToPath(import.meta.url));
const ORIGINAL = path.resolve(here, '../decompile/source/EduBridge.original.html').replace(/\\/g, '/');
const route = process.argv[2] ?? 'onboarding';
const b = await chromium.launch();
const shot = async () => {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: 'en-GB', reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.addInitScript(() => localStorage.setItem('edubridge:v1', JSON.stringify({ lang: 'en' })));
  await p.goto(`file:///${ORIGINAL}#${route}`, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
  await p.waitForTimeout(600);
  const s = PNG.sync.read(await p.screenshot({ fullPage: true }));
  await ctx.close();
  return s;
};
const [x, y] = [await shot(), await shot()];
const d = new PNG({ width: x.width, height: x.height });
console.log(`original vs original (${route}):`, pixelmatch(x.data, y.data, d.data, x.width, x.height, { threshold: 0.1 }), 'px of', x.width * x.height);
await b.close();
