import { expect, test, type Page } from '@playwright/test';

const seed = (page: Page, state: Record<string, unknown>) =>
  // Only seed when nothing is stored yet, so a reload keeps what the app saved.
  page.addInitScript((s) => { if (!localStorage.getItem('edubridge:v1')) localStorage.setItem('edubridge:v1', JSON.stringify(s)); }, state);

test('search finds a university by abbreviation and the count updates', async ({ page }) => {
  await seed(page, { lang: 'en' });
  await page.goto('/#universities');
  await expect(page.getByRole('status')).toContainText('50 universities');
  await page.getByRole('searchbox').fill('KAIST');
  await expect(page.getByRole('status')).toContainText('1 universities');
  await page.getByRole('searchbox').fill('odtu');
  await expect(page.getByRole('link', { name: /Middle East Technical/i }).first()).toBeVisible();
});

test('filters: country + group + level narrow the list; reset restores it', async ({ page }) => {
  await seed(page, { lang: 'en' });
  await page.goto('/#universities');
  await page.getByLabel('Country').selectOption('DE');
  await expect(page.getByRole('status')).toContainText('10 universities');
  await page.getByLabel('Group').selectOption('selective');
  await expect(page.getByRole('status')).toContainText('3 universities');
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page.getByRole('status')).toContainText('50 universities');
});

test('IELTS filter annotates but never hides universities with unconfirmed minimums', async ({ page }) => {
  await seed(page, { lang: 'en' });
  await page.goto('/#universities--advanced');
  await page.getByLabel('My IELTS score (optional)').fill('9');
  await expect(page.getByRole('status')).toContainText('50 universities');
  await expect(page.getByText('No confirmed general IELTS minimum.').first()).toBeVisible();
});

test('compare flow: add two universities, tray appears, compare page shows both', async ({ page }) => {
  await seed(page, { lang: 'en' });
  await page.goto('/#country--MY');
  const buttons = page.getByRole('button', { name: 'Compare' });
  await buttons.nth(0).click();
  await buttons.nth(1).click();
  await expect(page.getByRole('region', { name: 'Compare' })).toContainText('2 of 3');
  await page.getByRole('link', { name: 'Compare now' }).click();
  await expect(page.getByRole('heading', { name: 'Compare', level: 1 })).toBeVisible();
  await expect(page.locator('table thead th a')).toHaveCount(2);
  // persisted
  await page.reload();
  await expect(page.getByRole('region', { name: 'Compare' })).toContainText('2 of 3');
});

test('the fourth university cannot be added (limit 3)', async ({ page }) => {
  await seed(page, { lang: 'en' });
  await page.goto('/#country--MY');
  const buttons = page.getByRole('button', { name: /^Compare$|^In comparison$/ });
  for (let i = 0; i < 4; i++) await buttons.nth(i).click();
  await expect(page.getByText('You can compare up to 3')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Compare' })).toContainText('3 of 3');
});

test('university page: bachelor/master tabs switch, 13 numbered items exist', async ({ page }) => {
  await seed(page, { lang: 'en' });
  await page.goto('/#uni--universiti-malaya-my');
  const bachelor = page.getByRole('tab', { name: /Bachelor/ });
  await expect(bachelor).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: /Master/ }).click();
  await expect(page.getByRole('tab', { name: /Master/ })).toHaveAttribute('aria-selected', 'true');
  for (const n of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']) {
    await expect(page.locator('h3 span[aria-hidden="true"]', { hasText: new RegExp(`^${n}$`) })).toHaveCount(1);
  }
});

test('language switch to Russian translates the page and persists', async ({ page }) => {
  await seed(page, { lang: 'en' });
  await page.goto('/#home');
  await page.getByRole('button', { name: 'RU' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Выбирайте университеты');
  await page.goto('/#country--TR');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Турция');
  await expect(page.getByText('Как были выбраны эти 10')).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
});

test('Uzbek is the default language', async ({ page }) => {
  await page.goto('/#home');
  await expect(page.locator('html')).toHaveAttribute('lang', 'uz');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tekshirib');
});

test('when the API is unreachable the saved snapshot is used and labelled', async ({ page }) => {
  await seed(page, { lang: 'en' });
  await page.route('**/api/v1/**', (r) => r.abort());
  await page.goto('/#countries');
  await expect(page.getByText(/Showing a saved copy of the catalogue/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Malaysia' })).toBeVisible();
});

test('theme toggle sets the document theme', async ({ page }) => {
  await seed(page, { lang: 'en', theme: 'light' });
  await page.goto('/#home');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: /Theme/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('keyboard: skip link moves focus to main content', async ({ page }) => {
  await seed(page, { lang: 'en' });
  await page.goto('/#home');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('grant page: criteria are labelled as separate from university entry requirements', async ({ page }) => {
  await seed(page, { lang: 'en' });
  await page.goto('/#scholarship--stipendium-hungaricum');
  await expect(page.getByText('These are grant conditions, separate from university entry requirements.').first()).toBeVisible();
});
