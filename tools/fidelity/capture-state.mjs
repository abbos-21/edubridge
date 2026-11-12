// Starts the first demo student in the ORIGINAL artifact and prints the browser state it creates.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const ORIGINAL = path.resolve(here, '../decompile/source/EduBridge.original.html').replace(/\\/g, '/');
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: 'en-GB' });
const p = await ctx.newPage();
await p.goto(`file:///${ORIGINAL}#demo`, { waitUntil: 'networkidle' });
const buttons = await p.$$eval('button', (els) => els.map((e) => e.textContent?.trim()).filter(Boolean));
console.log('buttons:', buttons.slice(0, 20));
await p.locator('button', { hasText: /Shu talabani tanlash|Select this student/ }).first().click();
await p.waitForTimeout(800);
console.log('url:', p.url().split('#')[1]);
const state = await p.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
fs.writeFileSync(path.join(here, 'demo-state.json'), JSON.stringify(state, null, 1));
console.log('keys:', Object.keys(state), 'size', JSON.stringify(state).length);
await b.close();
