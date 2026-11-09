import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const ROUTES = [
  'home', 'countries', 'country--MY', 'country--TR', 'universities', 'universities--advanced',
  'uni--universiti-malaya-my', 'uni--tu-darmstadt-de', 'unicompare--universiti-malaya-my,usm-my,ukm-my',
  'scholarships', 'scholarship--mtcp', 'scholarship--gks-u', 'scholarship--chevening', 'info--sources', 'info--privacy', 'summary', 'signin', 'settings', 'onboarding', 'demo', 'adviser', 'assistant', 'assistant--docs', 'assistant--interview', 'assistant--report', 'does-not-exist',
];
const VIEWPORTS = [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1280, height: 900 }];

async function open(page: Page, route: string, lang = 'uz') {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript((l) => localStorage.setItem('edubridge:v1', JSON.stringify({ lang: l })), lang);
  await page.goto(`/#${route}`);
  await expect(page.locator('main')).not.toContainText('Yuklanmoqda', { timeout: 15_000 });
  await page.waitForTimeout(200);
  return errors;
}

for (const vp of VIEWPORTS) {
  test.describe(vp.name, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });
    for (const route of ROUTES) {
      test(`${route} has no horizontal scroll or console errors`, async ({ page }) => {
        const errors = await open(page, route);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(1);
        expect(errors).toEqual([]);
        // lazy pages (adviser, assistant) load their code on demand: wait for the content instead of sampling once
        await expect.poll(async () => (await page.locator('main').innerText()).length).toBeGreaterThan(20);
        mkdirSync('e2e/shots', { recursive: true });
        await page.screenshot({ path: `e2e/shots/${vp.name}-${route.replace(/[^a-z0-9]+/gi, '_')}.png`, fullPage: true });
      });
    }
  });
}

test('tap targets in the header are at least 40px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 'home');
  for (const b of await page.locator('header button').all()) {
    const box = await b.boundingBox();
    if (!box) continue; // desktop-only buttons are hidden on a phone
    expect(box.height).toBeGreaterThanOrEqual(40);
    expect(box.width).toBeGreaterThanOrEqual(40);
  }
});
