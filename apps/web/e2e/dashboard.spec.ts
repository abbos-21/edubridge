import { expect, test, type Browser } from '@playwright/test';

const unique = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function english(browser: Browser, state: Record<string, unknown> = {}) {
  const ctx = await browser.newContext();
  await ctx.addInitScript((s) => {
    if (!localStorage.getItem('edubridge:v1')) localStorage.setItem('edubridge:v1', JSON.stringify({ lang: 'en', ...s }));
  }, state);
  return ctx;
}

const PROFILE = { name: 'Abbos', field: 'computing', targetLevel: 'bachelor', applicationYear: 2027, citizenship: 'Uzbekistan', preferredCountries: [] };

test.describe('signed-in layout and dashboard', () => {
  test('without a profile the dashboard asks for one and keeps the public header', async ({ browser }) => {
    const ctx = await english(browser);
    const page = await ctx.newPage();
    await page.goto('/#dashboard');
    await expect(page.getByRole('heading', { name: 'Your dashboard starts with a profile' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'App' })).toHaveCount(0);
    await ctx.close();
  });

  test('a student with a profile gets the sidebar, the bell and the dashboard', async ({ browser }) => {
    const ctx = await english(browser, { profile: PROFILE });
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/#dashboard');
    await expect(page.getByRole('heading', { name: /Abbos/ })).toBeVisible();
    await expect(page.getByText('Local profile — saved only in this browser.')).toBeVisible();

    const nav = page.getByRole('navigation', { name: 'App' });
    for (const group of ['PLAN', 'DISCOVER', 'PREPARE']) await expect(nav.getByText(group, { exact: true })).toBeVisible();
    for (const link of ['Dashboard', 'Calendar', 'Countries', 'Universities', 'Scholarships', 'Compare', 'Profile builder', 'AI advisor']) {
      await expect(nav.getByRole('link', { name: link, exact: true })).toBeVisible();
    }
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');

    // the counts come from the catalogue, never from a made-up number
    const tile = page.getByRole('link', { name: /Recommended universities/ });
    await expect(tile).toBeVisible();
    expect(Number((await tile.innerText()).match(/\d+/)?.[0])).toBeGreaterThan(0);
    await expect(page.getByText('This is not an admission prediction.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Quick actions' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nothing tracked yet' }).or(page.getByText('Nothing tracked yet'))).toBeVisible();

    // sidebar links go to real pages and keep the sidebar
    await nav.getByRole('link', { name: 'Universities', exact: true }).click();
    await expect(page).toHaveURL(/#universities$/);
    await expect(page.getByRole('navigation', { name: 'App' })).toBeVisible();
    await ctx.close();
  });

  test('the account menu has profile, settings and a way to clear local data', async ({ browser }) => {
    const ctx = await english(browser, { profile: PROFILE });
    const page = await ctx.newPage();
    await page.goto('/#dashboard');
    await page.getByRole('button', { name: 'Account menu' }).click();
    await expect(page.getByRole('menuitem', { name: 'My profile' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Settings & data' })).toBeVisible();
    page.once('dialog', (d) => void d.accept());
    await page.getByRole('menuitem', { name: 'Clear data on this device' }).click();
    await expect(page).toHaveURL(/#home$/);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('edubridge:v1') ?? '{}').profile ?? null)).toBeNull();
    await ctx.close();
  });

  test('a date the student adds shows in the dashboard list, the bell and the calendar', async ({ browser }) => {
    const ctx = await english(browser, { profile: PROFILE });
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/#signin');
    await page.getByLabel('Dev user name').fill(unique('e2e-dash'));
    await page.getByRole('button', { name: 'Sign in (dev)' }).click();
    await expect(page).toHaveURL(/#settings$/);

    const soon = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);
    await page.goto('/#calendar');
    await page.getByLabel('What').fill('Visa interview');
    await page.getByLabel('Date', { exact: true }).fill(soon);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByRole('list').filter({ hasText: 'Visa interview' }).first()).toBeVisible();

    await page.goto('/#dashboard');
    await expect(page.getByText('Visa interview').first()).toBeVisible();
    await expect(page.getByText(/[45] days left/).first()).toBeVisible();
    await page.getByRole('button', { name: /Notifications \(1\)/ }).click();
    await expect(page.getByText(/days left: Visa interview/)).toBeVisible();
    await ctx.close();
  });

  test('on a phone the sidebar opens from the menu button', async ({ browser }) => {
    const ctx = await english(browser, { profile: PROFILE });
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/#dashboard');
    await expect(page.getByRole('navigation', { name: 'App' })).toBeHidden();
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('navigation', { name: 'App' }).getByRole('link', { name: 'Calendar' }).click();
    await expect(page).toHaveURL(/#calendar$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await ctx.close();
  });
});
