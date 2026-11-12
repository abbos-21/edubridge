#!/usr/bin/env node
/**
 * Pixel comparison of the original HTML artifact and the rebuilt web app (apps/web/dist).
 *   node compare.mjs [route ...]        e.g.  node compare.mjs home countries
 * Both are loaded in the same browser with the same viewport and no animations. Screenshots of every route are
 * compared pixel by pixel; the result and the diff images go to ./out.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const here = path.dirname(fileURLToPath(import.meta.url));
const ORIGINAL = path.resolve(here, '../decompile/source/EduBridge.original.html');
const DIST = path.resolve(here, '../../apps/web/dist');
const OUT = path.join(here, 'out');
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let file = path.join(DIST, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!file.startsWith(DIST) || !fs.existsSync(file)) file = path.join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4173, r));

const PUBLIC = ['home', 'countries', 'country--MY', 'universities', 'universities--advanced', 'universities--finder', 'uni--universiti-malaya-my', 'scholarships', 'glossary', 'roadmap', 'info--about', 'signin', 'demo', 'onboarding'];
// pages that need a student: the demo student captured from the original (see capture-state.mjs)
const STATE_FILE = path.join(here, 'demo-state.json');
const demo = fs.existsSync(STATE_FILE) ? JSON.parse(JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))['edubridge:v1']) : null;
if (demo) demo.lang = 'en';
const APP = demo ? ['dashboard', 'plans', `plan--${demo.applications[0]?.id}`, 'calendar', 'documents', 'writing', 'writing--cv', 'adviser', 'assistant', 'compare', 'budget', 'settings', 'data', 'universities', 'scholarships', 'glossary'] : [];
const wanted = process.argv.slice(2);
const all = [...PUBLIC.map((r) => ({ route: r, state: false })), ...APP.map((r) => ({ route: r, state: true }))];
const routes = (wanted.length ? all.filter((x) => wanted.includes(x.route) || wanted.includes('app:' + x.route)) : all);
const viewports = [{ name: 'desktop', width: 1280, height: 900 }, { name: 'phone', width: 390, height: 800 }];
const NO_MOTION = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';

const browser = await chromium.launch();
const results = [];
for (const vp of viewports) {
  for (const { route, state } of routes) {
    const shots = [];
    for (const [label, url] of [['orig', `file:///${ORIGINAL.replace(/\\/g, '/')}#${route}`], ['new', `http://localhost:4173/#${route}`]]) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, locale: 'en-GB', reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await page.addInitScript((st) => { try { localStorage.setItem('edubridge:v1', JSON.stringify(st)); } catch {} }, state && demo ? demo : { lang: 'en' });
      await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {});
      await page.addStyleTag({ content: NO_MOTION });
      await page.waitForTimeout(600);
      shots.push(await page.screenshot({ fullPage: true }));
      await ctx.close();
    }
    const [a, b] = shots.map((s) => PNG.sync.read(s));
    const w = Math.max(a.width, b.width), h = Math.max(a.height, b.height);
    const pad = (img) => { const o = new PNG({ width: w, height: h, fill: true }); o.data.fill(255); PNG.bitblt(img, o, 0, 0, img.width, img.height, 0, 0); return o; };
    const A = pad(a), B = pad(b), diff = new PNG({ width: w, height: h });
    const bad = pixelmatch(A.data, B.data, diff.data, w, h, { threshold: 0.1 });
    const pct = (bad / (w * h)) * 100;
    const sizeNote = a.width === b.width && a.height === b.height ? '' : ` size ${a.width}x${a.height} vs ${b.width}x${b.height}`;
    results.push({ vp: vp.name, route, pct, sizeNote, state });
    const tag = `${vp.name}-${route.replace(/[^a-z0-9]+/gi, '_')}`;
    if (bad > 0) { fs.writeFileSync(path.join(OUT, `${tag}.diff.png`), PNG.sync.write(diff)); fs.writeFileSync(path.join(OUT, `${tag}.new.png`), PNG.sync.write(B)); fs.writeFileSync(path.join(OUT, `${tag}.orig.png`), PNG.sync.write(A)); }
    console.log(`${pct === 0 ? 'OK  ' : 'DIFF'} ${vp.name.padEnd(7)} ${route.padEnd(28)} ${pct.toFixed(3)}%${sizeNote}`);
  }
}
await browser.close();
server.close();
const worst = results.filter((r) => r.pct > 0);
console.log(`\n${results.length - worst.length}/${results.length} identical`);
process.exit(worst.length ? 1 : 0);
