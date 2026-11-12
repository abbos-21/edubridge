import { readFileSync } from 'node:fs';
import { expect, test, type Browser } from '@playwright/test';

const unique = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const ideas: Array<{ id: string }> = JSON.parse(readFileSync(new URL('../src/data/growth.json', import.meta.url), 'utf8')).ideas;

async function english(browser: Browser) {
  const ctx = await browser.newContext({ acceptDownloads: true });
  await ctx.addInitScript(() => {
    if (!localStorage.getItem('edubridge:v1')) localStorage.setItem('edubridge:v1', JSON.stringify({ lang: 'en' }));
  });
  return ctx;
}

async function signedIn(browser: Browser, lang = 'en') {
  const ctx = await browser.newContext({ acceptDownloads: true });
  await ctx.addInitScript((l) => {
    if (!localStorage.getItem('edubridge:v1')) localStorage.setItem('edubridge:v1', JSON.stringify({ lang: l }));
  }, lang);
  const page = await ctx.newPage();
  await page.goto('/#signin');
  await page.getByLabel('Dev user name').fill(unique('e2e-rem'));
  await page.getByRole('button', { name: 'Sign in (dev)' }).click();
  await expect(page).toHaveURL(/#settings$/);
  return { ctx, page };
}

test.describe('reminders and calendar in Settings', () => {
  test('a student adds a date, downloads the calendar file, and makes (then turns off) a private feed link', async ({ browser }) => {
    const { ctx, page } = await signedIn(browser);
    await expect(page.getByRole('heading', { name: 'Reminders and calendar' })).toBeVisible();
    // the bot is not configured in the test environment: the page says so instead of offering a broken button
    await expect(page.getByText('Telegram reminders are not available yet.')).toBeVisible();

    const future = new Date(Date.now() + 40 * 86_400_000).toISOString().slice(0, 10);
    await page.getByLabel('What').fill('IELTS exam');
    await page.getByLabel('Date', { exact: true }).fill(future);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByRole('list').filter({ hasText: 'IELTS exam' }).first()).toBeVisible();

    const dl = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Download .ics file' }).click();
    const file = await dl;
    expect(file.suggestedFilename()).toBe('edubridge.ics');
    const text = readFileSync((await file.path())!, 'utf8');
    expect(text).toContain('BEGIN:VCALENDAR');
    expect(text).toContain('SUMMARY:IELTS exam');
    expect(text).toContain(`DTSTART;VALUE=DATE:${future.replace(/-/g, '')}`);

    await page.getByRole('button', { name: 'Create private link' }).click();
    const urlText = await page.locator('p.font-mono').innerText();
    expect(urlText).toMatch(/\/api\/v1\/calendar\/[A-Za-z0-9_-]{20,}\.ics$/);
    const feedPath = new URL(urlText).pathname;
    // a calendar app has no session: the secret link alone works
    const anon = await browser.newContext();
    const feed = await anon.request.get(feedPath);
    expect(feed.status()).toBe(200);
    expect(await feed.text()).toContain('SUMMARY:IELTS exam');

    await page.getByRole('button', { name: 'Turn the link off' }).click();
    await expect(page.getByText(/private link is active/)).toHaveCount(0);
    // the link is revoked on the server a moment after the click
    await expect.poll(async () => (await anon.request.get(feedPath)).status(), { timeout: 5000 }).toBe(404);
    await anon.close();
    await ctx.close();
  });

  test('a guest does not see reminders or calendar controls', async ({ browser }) => {
    const ctx = await english(browser);
    const page = await ctx.newPage();
    await page.goto('/#settings');
    await expect(page.getByRole('heading', { name: 'Reminders and calendar' })).toHaveCount(0);
    await ctx.close();
  });
});

test.describe('one-page summary', () => {
  /** A fully loaded student: a demo profile, 15 saved universities, 12 planned activities. */
  async function loaded(browser: Browser) {
    const ctx = await english(browser);
    const page = await ctx.newPage();
    const unis: Array<{ id: string }> = (await (await page.request.get('/api/v1/catalog/universities')).json()).items;
    await page.goto('/#demo');
    await page.getByRole('button', { name: 'Try demo' }).first().click();
    await expect(page).toHaveURL(/#dashboard$/);
    await page.evaluate(([saved, planned]) => {
      const s = JSON.parse(localStorage.getItem('edubridge:v1') ?? '{}');
      s.saved = saved;
      s.growth = { items: (planned as string[]).map((ideaId, i) => ({ ideaId, start: (i % 6) + 1 })) };
      localStorage.setItem('edubridge:v1', JSON.stringify(s));
    }, [unis.slice(0, 15).map((u) => u.id), ideas.slice(0, 12).map((i) => i.id)] as const);
    await page.goto('/#summary');
    await page.reload();
    return { ctx, page };
  }

  test('fits one A4 page even when full, in all three languages, and exports a PDF and a PNG', async ({ browser }) => {
    const { ctx, page } = await loaded(browser);
    const sheet = page.getByTestId('summary-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText('My saved universities');

    for (const lang of ['RU', 'UZ', 'EN']) {
      await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: lang, exact: true }).click();
      // nothing is cut off: the content never needs more room than the sheet has
      const fits = await sheet.evaluate((el) => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1);
      expect(fits, lang).toBe(true);
    }

    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page\b(?!s)/g) ?? []).length;
    expect(pages).toBe(1);
    await page.emulateMedia({ media: 'screen' });

    const dl = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download image (PNG)' }).click();
    const file = await dl;
    expect(file.suggestedFilename()).toBe('edubridge-summary.png');
    const png = readFileSync((await file.path())!);
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.length).toBeGreaterThan(5000);
    await ctx.close();
  });

  test('the student chooses what goes on it; the name is off by default and nothing is sent to the server', async ({ browser }) => {
    const { ctx, page } = await loaded(browser);
    const sheet = page.getByTestId('summary-sheet');
    const requests: string[] = [];
    page.on('request', (r) => { if (r.method() !== 'GET') requests.push(r.url()); });
    const name = await page.evaluate(() => JSON.parse(localStorage.getItem('edubridge:v1') ?? '{}').profile?.name as string);
    expect(name).toBeTruthy();
    await expect(sheet).not.toContainText(name);
    await page.getByLabel('My name').check();
    await expect(sheet).toContainText(name);
    await page.getByLabel('Plan steps').uncheck();
    await expect(sheet).not.toContainText('Month 1');
    await page.getByLabel('Profile gaps').uncheck();
    await expect(sheet).not.toContainText('Profile gaps to work on');
    expect(requests).toEqual([]);
    await ctx.close();
  });

  test('works for a guest with nothing saved and says so', async ({ browser }) => {
    const ctx = await english(browser);
    const page = await ctx.newPage();
    await page.goto('/#summary');
    await expect(page.getByText('Without a profile the summary shows only your saved universities and dates.')).toBeVisible();
    await expect(page.getByTestId('summary-sheet')).toContainText('No universities saved yet.');
    await ctx.close();
  });
});
