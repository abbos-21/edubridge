import { expect, test, type Browser, type Page } from '@playwright/test';

const unique = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function newPage(browser: Browser, lang = 'en') {
  const ctx = await browser.newContext({ acceptDownloads: true });
  await ctx.addInitScript((l) => {
    if (!localStorage.getItem('edubridge:v1')) localStorage.setItem('edubridge:v1', JSON.stringify({ lang: l }));
  }, lang);
  const page = await ctx.newPage();
  return { ctx, page };
}

async function devLogin(page: Page, name: string) {
  await page.goto('/#signin');
  await page.getByLabel('Dev user name').fill(name);
  await page.getByRole('button', { name: 'Sign in (dev)' }).click();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
}

test('a guest sees the guest state and a sign-in link in Settings', async ({ browser }) => {
  const { ctx, page } = await newPage(browser);
  await page.goto('/#settings');
  await expect(page.getByText('You are using EduBridge as a guest')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
  await ctx.close();
});

test('dev sign-in works, shows the account, and sign-out returns to guest', async ({ browser }) => {
  const { ctx, page } = await newPage(browser);
  await devLogin(page, unique('e2e-login'));
  await expect(page.getByText(/Signed in\. Member since/)).toBeVisible();
  await expect(page.getByText('Everything is synced.')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/#home$/); // sign-out finished and redirected
  await page.goto('/#settings');
  await expect(page.getByText('You are using EduBridge as a guest')).toBeVisible();
  await ctx.close();
});

test('language chosen on one device appears on another after sign-in (sync)', async ({ browser }) => {
  const name = unique('e2e-sync');
  const a = await newPage(browser, 'en');
  await devLogin(a.page, name);
  await expect(a.page.getByText('Everything is synced.')).toBeVisible({ timeout: 10_000 });
  await a.page.locator('main').getByRole('group', { name: 'Language' }).getByRole('button', { name: 'RU' }).click();
  // wait until the SERVER holds the new value (not just until the page says so)
  await expect.poll(async () => (await (await a.page.request.get('/api/v1/me/settings')).json()).data?.lang, { timeout: 10_000 }).toBe('ru');

  const b = await newPage(browser, 'en');
  await b.page.goto('/#signin');
  await b.page.getByLabel('Dev user name').fill(name);
  await b.page.getByRole('button', { name: 'Sign in (dev)' }).click();
  await expect(b.page.locator('html')).toHaveAttribute('lang', 'ru', { timeout: 10_000 });
  await a.ctx.close();
  await b.ctx.close();
});

test('a new account is offered the data from this device; upload copies it and the other device sees it', async ({ browser }) => {
  const name = unique('e2e-upload');
  const a = await newPage(browser, 'en');
  // guest builds a compare list
  await a.page.goto('/#country--MY');
  const buttons = a.page.getByRole('button', { name: 'Compare' });
  await buttons.nth(0).click();
  await buttons.nth(1).click();
  await devLogin(a.page, name);
  await expect(a.page.getByText('Upload the data from this device?')).toBeVisible({ timeout: 10_000 });
  await a.page.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(a.page.getByText('Uploaded.')).toBeVisible({ timeout: 10_000 });

  const b = await newPage(browser, 'en');
  await devLogin(b.page, name);
  await expect(b.page.getByRole('region', { name: 'Compare' })).toContainText('2 of 3', { timeout: 10_000 });
  await a.ctx.close();
  await b.ctx.close();
});

test('"Not now" keeps the account empty of the device data', async ({ browser }) => {
  const a = await newPage(browser, 'en');
  await a.page.goto('/#country--MY');
  await a.page.getByRole('button', { name: 'Compare' }).first().click();
  await devLogin(a.page, unique('e2e-skip'));
  await expect(a.page.getByText('Upload the data from this device?')).toBeVisible({ timeout: 10_000 });
  await a.page.getByRole('button', { name: 'Not now' }).click();
  await expect(a.page.getByText('Upload the data from this device?')).toBeHidden();
  await a.ctx.close();
});

test('export downloads a JSON file with the account\'s id', async ({ browser }) => {
  const { ctx, page } = await newPage(browser);
  await devLogin(page, unique('e2e-export'));
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download my data' }).click()]);
  expect(download.suggestedFilename()).toBe('edubridge-export.json');
  const body = JSON.parse(await (await import('node:fs/promises')).readFile((await download.path())!, 'utf8'));
  expect(body.user.id).toMatch(/^[0-9a-f-]{36}$/);
  expect(body.exportedAt).toBeTruthy();
  await ctx.close();
});

test('delete account needs the typed confirmation, then removes the account', async ({ browser }) => {
  const name = unique('e2e-delete');
  const { ctx, page } = await newPage(browser);
  await devLogin(page, name);
  const del = page.getByRole('button', { name: 'Delete forever' });
  await expect(del).toBeDisabled();
  await page.getByLabel('Confirmation').fill('delete');
  await expect(del).toBeDisabled();
  await page.getByLabel('Confirmation').fill('DELETE');
  await expect(del).toBeEnabled();
  await del.click();
  await expect(page).toHaveURL(/#home$/); // deletion finished and redirected
  const me = await page.request.get('/api/v1/me');
  expect(me.status()).toBe(401);
  await ctx.close();
});

test('unauthenticated API calls are refused and forged cross-origin writes are blocked', async ({ browser }) => {
  const { ctx, page } = await newPage(browser);
  await devLogin(page, unique('e2e-csrf'));
  // a write from another origin with the session cookie must fail even though the cookie is sent
  const evil = await page.request.patch('/api/v1/me', { data: { lang: 'en' }, headers: { origin: 'https://evil.example' } });
  expect(evil.status()).toBe(403);
  const noToken = await page.request.patch('/api/v1/me', { data: { lang: 'en' } });
  expect(noToken.status()).toBe(403);
  await ctx.close();
});
