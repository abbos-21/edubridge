import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const STATE = JSON.parse(readFileSync(new URL('../e2e-state.json', import.meta.url), 'utf8'));
const unique = (p) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function newDevice(browser, seed) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  if (seed) await ctx.addInitScript((s) => { if (!localStorage.getItem('edubridge:v1')) localStorage.setItem('edubridge:v1', JSON.stringify(s)); }, seed);
  return { ctx, page: await ctx.newPage() };
}
async function signIn(page, name) {
  await page.goto('/#signin');
  await page.getByLabel('Dev user name').fill(name);
  await page.getByRole('button', { name: 'Sign in (dev)' }).click();
  await expect(page).toHaveURL(/#dashboard$/);
}

test('the catalogue is loaded from the API', async ({ browser }) => {
  const { ctx, page } = await newDevice(browser, { version: 1, lang: 'en' });
  await page.goto('/#universities');
  await expect.poll(() => page.evaluate(() => window.__catalogSource)).toBe('api');
  await expect(page.getByRole('heading').first()).toBeVisible();
  await ctx.close();
});

test('a student signs in, the profile is saved to the account, and a second device sees it', async ({ browser }) => {
  const name = unique('e2e-sync');
  const a = await newDevice(browser, STATE);
  await signIn(a.page, name);
  // the app uploads the profile document; poll the server through the page (same cookies)
  await expect
    .poll(async () => a.page.evaluate(async () => (await (await fetch('/api/v1/me/state', { credentials: 'include' })).json()).docs.profile?.data?.profile?.name), { timeout: 15_000 })
    .toBe('Integration Student');

  const b = await newDevice(browser, { version: 1, lang: 'en' }); // a fresh device: no local data
  await signIn(b.page, name);
  await b.page.goto('/#dashboard');
  await expect(b.page.getByText(/Integration Student/).first()).toBeVisible({ timeout: 15_000 });
  await a.ctx.close();
  await b.ctx.close();
});

test('signing out clears the local copy but the account keeps the data', async ({ browser }) => {
  const name = unique('e2e-out');
  const a = await newDevice(browser, STATE);
  await signIn(a.page, name);
  await expect.poll(async () => a.page.evaluate(async () => (await (await fetch('/api/v1/me/state', { credentials: 'include' })).json()).docs.profile ? 1 : 0), { timeout: 15_000 }).toBe(1);
  await a.page.getByRole('button', { name: /^A?[A-Z]?$/ }).first().click().catch(() => {});
  await a.page.evaluate(async () => { await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include', headers: { 'x-csrf-token': decodeURIComponent((document.cookie.match(/eb_csrf=([^;]+)/) || [])[1] || '') } }); });
  const b = await newDevice(browser, { version: 1, lang: 'en' });
  await signIn(b.page, name);
  await expect.poll(async () => b.page.evaluate(async () => (await (await fetch('/api/v1/me/state', { credentials: 'include' })).json()).docs.profile?.data?.profile?.name), { timeout: 15_000 }).toBe('Integration Student');
  await a.ctx.close();
  await b.ctx.close();
});

test('staff only: the data-review page is closed to students and open to editors', async ({ browser }) => {
  const student = await newDevice(browser, { version: 1, lang: 'en' });
  await signIn(student.page, unique('e2e-stu'));
  await student.page.goto('/#data');
  await expect(student.page.getByText('Staff only')).toBeVisible();
  const editor = await newDevice(browser, { version: 1, lang: 'en' });
  await editor.page.goto('/#signin');
  await editor.page.evaluate(async (n) => {
    await fetch('/api/v1/auth/dev-login', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: n, role: 'editor' }) });
  }, unique('e2e-ed'));
  await editor.page.goto('/#data');
  await editor.page.reload();
  await expect(editor.page.getByText('Staff only')).toHaveCount(0);
  await student.ctx.close();
  await editor.ctx.close();
});

test('settings has an account panel: data export and deleting the account', async ({ browser }) => {
  const { ctx, page } = await newDevice(browser, STATE);
  await signIn(page, unique('e2e-del'));
  await page.goto('/#settings');
  await expect(page.getByText('Telegram reminders').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download my data' })).toBeVisible();
  const del = page.getByRole('button', { name: 'Delete my account and data' });
  await expect(del).toBeDisabled();
  await page.getByLabel('Type DELETE to confirm').fill('DELETE');
  await del.click();
  await expect(page).toHaveURL(/#home$/);
  expect(await page.evaluate(async () => (await fetch('/api/v1/me', { credentials: 'include' })).status)).toBe(401);
  await ctx.close();
});
