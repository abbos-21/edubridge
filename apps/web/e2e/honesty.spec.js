import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const STATE = JSON.parse(readFileSync(new URL('../e2e-state.json', import.meta.url), 'utf8'));
const EN = { version: 1, lang: 'en' };

async function open(browser, seed) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((s) => { if (!localStorage.getItem('edubridge:v1')) localStorage.setItem('edubridge:v1', JSON.stringify(s)); }, seed);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, errors };
}

test('a real student never sees fictional demonstration records', async ({ browser }) => {
  // a real student: a profile, but none of the demo student's saved items or plans
  const { ctx, page, errors } = await open(browser, { ...STATE, saved: [], applications: [], customEvents: [], reminders: STATE.reminders });
  for (const route of ['scholarships', 'universities--advanced', 'dashboard']) {
    await page.goto(`/#${route}`);
    await page.waitForTimeout(600);
    const text = await page.locator('body').innerText();
    expect(text, route).not.toMatch(/\(demo\)|Demonstration record|Sample Merit Award/i);
  }
  expect(errors).toEqual([]);
  await ctx.close();
});

test('the demo students still work: dashboard, plans, a plan and the calendar load without errors', async ({ browser }) => {
  const { ctx, page, errors } = await open(browser, EN);
  await page.goto('/#demo');
  await page.getByRole('button', { name: 'Use this student' }).first().click();
  await expect(page).toHaveURL(/#dashboard$/);
  for (const route of ['dashboard', 'plans', 'calendar', 'documents', 'budget']) {
    await page.goto(`/#${route}`);
    await page.waitForTimeout(500);
    await expect(page.locator('main')).toBeVisible();
  }
  await page.goto('/#plans');
  const first = page.getByRole('button', { name: /Open plan|Open the plan/i }).first();
  if (await first.count()) {
    await first.click();
    await expect(page).toHaveURL(/#plan--/);
  }
  expect(errors).toEqual([]);
  await ctx.close();
});

test('the profile wizard offers no transcript upload that invents values', async ({ browser }) => {
  const { ctx, page } = await open(browser, EN);
  await page.goto('/#onboarding');
  await page.getByLabel('Name or preferred display name').fill('Honest Student');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText(/transcript/i)).toHaveCount(0);
  await expect(page.getByText(/demo extraction|demonstration values/i)).toHaveCount(0);
  await ctx.close();
});

test('texts about data and AI are accurate for a product with accounts', async ({ browser }) => {
  const { ctx, page } = await open(browser, EN);
  await page.goto('/#info--privacy');
  const text = await page.locator('main').innerText();
  expect(text).toMatch(/sign in/i);
  expect(text).not.toMatch(/does not run accounts|prototype/i);
  await page.goto('/#settings');
  const settings = await page.locator('main').innerText();
  expect(settings).not.toMatch(/Nothing is sent to an EduBridge server|opened inside Claude|prototype/i);
  await ctx.close();
});
