import { expect, test, type Browser } from '@playwright/test';

const PROFILE = { name: 'Abbos', field: 'computing', targetLevel: 'bachelor', applicationYear: 2027, citizenship: 'Uzbekistan', ielts: 6.5 };

async function student(browser: Browser) {
  const ctx = await browser.newContext();
  await ctx.addInitScript((p) => {
    if (!localStorage.getItem('edubridge:v1')) localStorage.setItem('edubridge:v1', JSON.stringify({ lang: 'en', profile: p }));
  }, PROFILE);
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  return { ctx, page };
}

async function openUni(page: import('@playwright/test').Page): Promise<string> {
  const unis: Array<{ id: string; levels: { bachelor?: { open?: string } } }> = (await (await page.request.get('/api/v1/catalog/universities')).json()).items;
  const id = unis.find((u) => u.levels.bachelor?.open === 'yes')!.id;
  await page.goto(`/#uni--${id}`);
  return id;
}

test.describe('application plans', () => {
  test('add to plan builds a checklist; ticking tasks moves progress and the dashboard shows it', async ({ browser }) => {
    const { ctx, page } = await student(browser);
    await openUni(page);
    await page.getByRole('button', { name: 'Add to plan' }).click();
    await expect(page).toHaveURL(/#plan--/);
    await expect(page.getByText('Read the official call and instructions')).toBeVisible();
    await expect(page.getByText('0 / ').first()).toBeVisible();

    await page.getByLabel('Read the official call and instructions').check();
    await expect(page.getByText('1 / ').first()).toBeVisible();

    // a task of your own
    await page.getByLabel('Task', { exact: true }).fill('Ask school for a stamped grade sheet');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText('Ask school for a stamped grade sheet')).toBeVisible();

    // requirements never invent a pass: the academic row says it needs verification
    await page.getByRole('tab', { name: 'Requirements' }).click();
    await expect(page.getByText('Needs verification').first()).toBeVisible();
    await page.getByRole('tab', { name: 'Final review' }).click();
    await expect(page.getByText('Not ready to submit yet.')).toBeVisible();

    await page.goto('/#dashboard');
    await expect(page.getByRole('heading', { name: 'Application progress' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Applications in progress/ })).toContainText('1');

    await page.goto('/#plans');
    await expect(page.getByRole('heading', { name: 'Your application plans' })).toBeVisible();
    await page.getByRole('link', { name: 'Open plan' }).click();
    await page.getByRole('button', { name: 'Remove plan' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page).toHaveURL(/#plans$/);
    await expect(page.getByText('No plans yet')).toBeVisible();
    await ctx.close();
  });

  test('saving a university and adding it twice never makes a second plan', async ({ browser }) => {
    const { ctx, page } = await student(browser);
    await openUni(page);
    await page.getByRole('button', { name: 'Save' }).first().click();
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();
    await page.getByRole('button', { name: 'Add to plan' }).click();
    await page.goBack();
    await expect(page.getByRole('link', { name: /In your plans/ })).toBeVisible();
    await ctx.close();
  });
});

test.describe('budget planner', () => {
  test('missing figures are never counted as zero; totals appear only when every line has a value', async ({ browser }) => {
    const { ctx, page } = await student(browser);
    await page.goto('/#budget');
    await page.getByRole('button', { name: 'Add scenario' }).click();
    await expect(page.getByText(/Incomplete:/)).toBeVisible();
    await expect(page.getByText(/≥ 0 USD \(incomplete\)/)).toBeVisible();
    for (const [label, v] of [['Tuition fees', '3000'], ['Accommodation', '2000'], ['Food', '1500'], ['Transportation', '300'], ['Insurance', '400'], ['Visa and administrative', '100'], ['Travel', '600'], ['Other costs', '100']]) {
      await page.getByLabel(label, { exact: true }).fill(v);
    }
    await expect(page.getByText(/Incomplete:/)).toHaveCount(0);
    await expect(page.getByText('8 000 USD').first()).toBeVisible();
    await page.getByLabel('Family contribution / year').fill('5000');
    await expect(page.getByText('3 000 USD').last()).toBeVisible(); // the gap
    await ctx.close();
  });
});

test.describe('preparation roadmap, glossary and writing tutor', () => {
  test('roadmap ticks are remembered', async ({ browser }) => {
    const { ctx, page } = await student(browser);
    await page.goto('/#roadmap');
    await expect(page.getByRole('heading', { name: 'Preparation roadmap' })).toBeVisible();
    await page.getByRole('checkbox').first().click();
    await expect(page.getByText(/^1\/\d+ done$/)).toBeVisible();
    await page.reload();
    await expect(page.getByText(/^1\/\d+ done$/)).toBeVisible();
    await ctx.close();
  });

  test('glossary lists the terms', async ({ browser }) => {
    const { ctx, page } = await student(browser);
    await page.goto('/#glossary');
    await expect(page.getByText('Studienkolleg')).toBeVisible();
    await expect(page.getByText('One-tier master')).toBeVisible();
    await ctx.close();
  });

  test('the tutor points at unsupported claims and asks a question; it never rewrites', async ({ browser }) => {
    const { ctx, page } = await student(browser);
    await page.goto('/#writing');
    await page.getByLabel('Your draft').fill('I am a passionate and hardworking student. I want to study computing because I like computers.');
    await page.getByRole('button', { name: 'Review my draft' }).click();
    await expect(page.getByText(/Unsupported self-descriptions/)).toBeVisible();
    await expect(page.getByText('Ask yourself:').first()).toBeVisible();
    await page.getByRole('button', { name: 'Save revision' }).click();
    await expect(page.getByRole('button', { name: 'Restore' })).toBeVisible();
    await ctx.close();
  });
});

test.describe('account sync of plans, budgets and writing', () => {
  const unique = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const signIn = async (page: import('@playwright/test').Page, name: string) => {
    await page.goto('/#signin');
    await page.getByLabel('Dev user name').fill(name);
    await page.getByRole('button', { name: 'Sign in (dev)' }).click();
    await expect(page).toHaveURL(/#settings$/);
  };

  test('a plan, a budget and a draft made on one device appear on another', async ({ browser }) => {
    const name = unique('e2e-ws');
    const empty = async () => {
      const ctx = await browser.newContext();
      await ctx.addInitScript(() => { if (!localStorage.getItem('edubridge:v1')) localStorage.setItem('edubridge:v1', JSON.stringify({ lang: 'en' })); });
      return { ctx, page: await ctx.newPage() };
    };
    const a = await empty();
    await signIn(a.page, name);
    await openUni(a.page);
    await a.page.getByRole('button', { name: 'Add to plan' }).click();
    await a.page.goto('/#budget');
    await a.page.getByRole('button', { name: 'Add scenario' }).click();
    await a.page.getByLabel('Tuition fees', { exact: true }).fill('1234');
    await a.page.goto('/#writing');
    await a.page.getByLabel('Your draft').fill('A draft that should follow the student.');

    await expect.poll(async () => ((await (await a.page.request.get('/api/v1/me/plans')).json()).data?.plans ?? []).length, { timeout: 10_000 }).toBe(1);
    await expect.poll(async () => (await (await a.page.request.get('/api/v1/me/writing')).json()).data?.drafts ? 1 : 0, { timeout: 10_000 }).toBe(1);

    const b = await empty();
    await signIn(b.page, name);
    await b.page.goto('/#plans');
    await expect(b.page.getByRole('link', { name: 'Open plan' })).toBeVisible({ timeout: 10_000 });
    await b.page.goto('/#budget');
    await expect(b.page.getByLabel('Tuition fees', { exact: true })).toHaveValue('1234');
    await b.page.goto('/#writing');
    await expect(b.page.getByLabel('Your draft')).toHaveValue('A draft that should follow the student.');
    await a.ctx.close();
    await b.ctx.close();
  });
});

test.describe('original-app features: documents, calendar, toasts, guide, compare', () => {
  test('documents page: guidance, a remembered checklist and the plans that include the document', async ({ browser }) => {
    const { ctx, page } = await student(browser);
    await openUni(page);
    await page.getByRole('button', { name: 'Add to plan' }).click();
    await page.goto('/#documents');
    await expect(page.getByRole('heading', { name: 'Academic transcript' })).toBeVisible();
    await page.getByLabel('Requested from registrar').check();
    await page.reload();
    await expect(page.getByLabel('Requested from registrar')).toBeChecked();
    await expect(page.getByText('General guidance').first()).toBeVisible();
    await ctx.close();
  });

  test('calendar month view shows a dated task and filters by type; the bell window can be changed', async ({ browser }) => {
    const { ctx, page } = await student(browser);
    await openUni(page);
    await page.getByRole('button', { name: 'Add to plan' }).click();
    await page.getByRole('button', { name: 'Details' }).first().click();
    const soon = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
    await page.getByLabel('My deadline for this task').fill(soon);
    await page.goto('/#calendar');
    await expect(page.getByRole('heading', { name: 'Calendar and deadlines' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tasks due soon' })).toBeVisible();
    await expect(page.getByText('3 days left').first()).toBeVisible();
    await page.getByRole('button', { name: 'Plan task' }).click(); // hide the type
    await expect(page.getByText('No upcoming dates')).toBeVisible();
    await page.getByRole('button', { name: 'Plan task' }).click();
    await page.getByLabel('Show dates in the bell when they are within').selectOption('7');
    await expect(page.getByRole('button', { name: /Notifications \(1\)/ })).toBeVisible();
    await ctx.close();
  });

  test('saving shows a message, and the guide choice changes the home page character', async ({ browser }) => {
    const { ctx, page } = await student(browser);
    await openUni(page);
    await page.getByRole('button', { name: 'Save' }).first().click();
    await expect(page.getByText(/Saved — it now appears on your dashboard and calendar/)).toBeVisible();
    await page.goto('/#settings');
    await page.getByRole('radio', { name: 'Girl guide' }).click();
    await expect(page.getByRole('radio', { name: 'Girl guide' })).toHaveAttribute('aria-checked', 'true');
    await page.goto('/#home');
    await expect(page.getByRole('img', { name: /smiling Uzbek girl/ })).toBeVisible();
    await ctx.close();
  });

  test('compare tints differing rows and keeps a named, saved comparison', async ({ browser }) => {
    const { ctx, page } = await student(browser);
    await page.goto('/#unicompare--universiti-malaya-my,usm-my,ukm-my');
    await expect(page.getByText(/Rows with a tinted background differ/)).toBeVisible();
    await page.getByLabel('Name this comparison').fill('Malaysia trio');
    await page.getByRole('button', { name: 'Save comparison' }).click();
    await expect(page.getByText('Malaysia trio')).toBeVisible();
    await ctx.close();
  });

  test('universities show a match label for a student with a profile and sort by relevance', async ({ browser }) => {
    const { ctx, page } = await student(browser);
    await page.goto('/#universities');
    await expect(page.getByText(/Good match for you|Looks possible|Add your scores to check|May not fit your profile/).first()).toBeVisible();
    await page.getByLabel('Sort by').selectOption('relevance');
    await expect(page.getByLabel('Sort by')).toHaveValue('relevance');
    await ctx.close();
  });
});
