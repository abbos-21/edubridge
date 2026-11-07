import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

const unique = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const today = new Date().toISOString().slice(0, 10);

/** A browser signed in with a given role (the dev sign-in accepts a role; it does not exist in production). */
async function as(browser: Browser, role: 'student' | 'editor' | 'admin' | null, lang = 'en') {
  const ctx = await browser.newContext();
  await ctx.addInitScript((l) => {
    if (!localStorage.getItem('edubridge:v1')) localStorage.setItem('edubridge:v1', JSON.stringify({ lang: l }));
  }, lang);
  if (role) {
    const r = await ctx.request.post('/api/v1/auth/dev-login', { data: { name: unique(`e2e-${role}`), role } });
    expect(r.ok()).toBeTruthy();
  }
  return { ctx, page: await ctx.newPage() };
}

/** Calls the admin API as this browser (cookie + CSRF header), for set-up and clean-up. */
async function adminApi(ctx: BrowserContext, method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, data?: unknown) {
  const csrf = (await ctx.cookies()).find((c) => c.name === 'eb_csrf')?.value ?? '';
  const r = await ctx.request.fetch(`/api/v1${path}`, { method, data, headers: { 'x-csrf-token': csrf } });
  return r;
}

async function firstUniversity(page: Page) {
  const r = await page.request.get('/api/v1/catalog/universities');
  return (await r.json()).items.find((u: any) => u.levels.bachelor) as { id: string; name: string };
}

test('guests and students cannot use the admin area; editors and admins see the right tabs', async ({ browser }) => {
  const guest = await as(browser, null);
  await guest.page.goto('/#admin');
  await expect(guest.page.getByText('Sign in required')).toBeVisible();
  await expect(guest.page.getByRole('link', { name: 'Admin', exact: true })).toHaveCount(0);
  await guest.ctx.close();

  const student = await as(browser, 'student');
  await student.page.goto('/#admin');
  await expect(student.page.getByText('No access')).toBeVisible();
  await expect(student.page.getByRole('link', { name: 'Admin', exact: true })).toHaveCount(0);
  await student.ctx.close();

  const editor = await as(browser, 'editor');
  await editor.page.goto('/#admin');
  await expect(editor.page.getByRole('heading', { name: 'Admin', level: 1 })).toBeVisible();
  await expect(editor.page.getByRole('tab', { name: 'Review queue' })).toBeVisible();
  await expect(editor.page.getByRole('tab', { name: 'Users' })).toHaveCount(0);
  await editor.ctx.close();

  const admin = await as(browser, 'admin');
  await admin.page.goto('/#admin');
  await expect(admin.page.getByRole('tab', { name: 'Users' })).toBeVisible();
  await expect(admin.page.getByRole('tab', { name: 'AI cost' })).toBeVisible();
  await admin.ctx.close();
});

test('an editor drafts a change, the rules refuse it without a source, an admin approves it, and it goes live', async ({ browser }) => {
  const editor = await as(browser, 'editor');
  const admin = await as(browser, 'admin');
  const uni = await firstUniversity(editor.page);
  const before = await (await editor.page.request.get(`/api/v1/admin/entities/university/${uni.id}`)).json();
  const originalRecord = before.record;

  try {
    const e = editor.page;
    await e.goto('/#admin');
    await e.getByLabel('Search records').fill(uni.name.slice(0, 12));
    await e.getByRole('button', { name: `Open ${uni.name}` }).click();
    await e.getByRole('button', { name: 'Start a draft' }).click();

    // a tuition amount with no source anywhere is refused by the server rules
    await e.getByLabel('bachelor: source links (one per line)').fill('');
    await e.getByLabel('bachelor: tuition amount').fill('4321');
    await e.getByRole('button', { name: 'Save draft' }).click();
    await expect(e.getByRole('alert').first()).toContainText('tuition amount without any source');

    // add the source, the check date and a fully translated note
    await e.getByLabel('bachelor: source links (one per line)').fill('https://example.org/official-tuition');
    await e.getByLabel('Check date').fill(today);
    await e.getByLabel('bachelor note (EN)').fill('E2E note');
    await e.getByLabel('bachelor note (UZ)').fill('E2E eslatma');
    await e.getByLabel('bachelor note (RU)').fill('E2E заметка');
    await e.getByRole('button', { name: 'Save draft' }).click();
    await expect(e.getByText('Draft saved.')).toBeVisible();
    await expect(e.getByRole('table', { name: 'Changes against the published record' })).toContainText('levels.bachelor.note.en');

    await e.getByRole('button', { name: 'Send for review' }).click();
    await expect(e.getByText('Sent for review.')).toBeVisible();
    await expect(e.getByText('Waiting for an admin to review.')).toBeVisible();
    // nothing is public yet
    const pub = await (await e.request.get(`/api/v1/catalog/universities/${uni.id}`)).json();
    expect(pub.university.levels.bachelor.note?.en).not.toBe('E2E note');

    const a = admin.page;
    await a.goto('/#admin--review');
    await a.getByRole('button', { name: `Open ${uni.id}` }).click();
    await a.getByRole('button', { name: 'Approve and publish' }).click();
    await expect(a.getByRole('button', { name: 'Start a draft' })).toBeVisible(); // the draft is closed once published
    const live = await (await a.request.get(`/api/v1/catalog/universities/${uni.id}`)).json();
    expect(live.university.levels.bachelor.note.en).toBe('E2E note');

    await a.goto('/#admin--audit');
    await a.getByLabel('Record id').fill(uni.id);
    await expect(a.getByRole('table', { name: 'Audit log' })).toContainText('revision.publish');
  } finally {
    // put the catalogue back as it was (through the same approved workflow)
    const draft = await (await adminApi(admin.ctx, 'POST', '/admin/revisions', { entityType: 'university', entityId: uni.id })).json();
    if (draft.id) {
      await adminApi(admin.ctx, 'PUT', `/admin/revisions/${draft.id}`, { data: originalRecord });
      await adminApi(admin.ctx, 'POST', `/admin/revisions/${draft.id}/submit`, {});
      await adminApi(admin.ctx, 'POST', `/admin/revisions/${draft.id}/approve`, {});
    }
    await editor.ctx.close();
    await admin.ctx.close();
  }
});

test('an admin sees users, AI cost and data gaps', async ({ browser }) => {
  const { ctx, page } = await as(browser, 'admin');
  await page.goto('/#admin--users');
  await expect(page.getByRole('table', { name: 'Users' })).toBeVisible();
  await page.goto('/#admin--ai');
  await expect(page.getByRole('heading', { name: 'This month' })).toBeVisible();
  await expect(page.getByText(/estimates/)).toBeVisible();
  await page.goto('/#admin--recheck');
  await expect(page.getByRole('heading', { name: 'Link recheck' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run the recheck now' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Needs a manual check/ })).toBeVisible();
  await page.goto('/#admin--gaps');
  await expect(page.getByRole('heading', { name: /Missing QS positions \(5\)/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Levels with links only/ })).toBeVisible();
  await expect(page.getByText(/All 50 universities pass/)).toBeVisible();
  await ctx.close();
});

test('an admin saves an AI result as a demo analysis; a guest opens it, labelled as saved', async ({ browser }) => {
  const admin = await as(browser, 'admin');
  const a = admin.page;
  await a.goto('/#assistant--docs');
  await a.getByRole('button', { name: 'New document' }).click();
  const opt = await a.locator('select[aria-label="Try a sample"] option', { hasText: /CV|Resume/i }).first().innerText();
  await a.getByLabel('Try a sample').selectOption({ label: opt });
  await a.getByRole('button', { name: 'Save', exact: true }).click();
  await a.getByRole('button', { name: 'Analyse', exact: true }).click();
  const title = unique('E2E demo');
  await a.getByLabel('Demo snapshot title').fill(title);
  await a.getByRole('button', { name: 'Save as demo analysis' }).click();
  await expect(a.getByTestId('save-demo').getByRole('status')).toContainText('Saved');

  const guest = await as(browser, null);
  const t0 = Date.now();
  await guest.page.goto('/#demo');
  await guest.page.getByRole('link', { name: title }).click();
  await expect(guest.page.getByText(/not a live answer|Sample result/)).toBeVisible();
  expect(Date.now() - t0).toBeLessThan(5000);
  await guest.ctx.close();

  const list = await (await a.request.get('/api/v1/demo-snapshots')).json();
  for (const s of list.items.filter((x: any) => x.title === title)) await adminApi(admin.ctx, 'DELETE', `/admin/demo-snapshots/${s.id}`);
  await admin.ctx.close();
});

test('a student never sees the "save as demo" control', async ({ browser }) => {
  const { ctx, page } = await as(browser, 'student');
  await page.goto('/#assistant--docs');
  await page.getByRole('button', { name: 'New document' }).click();
  const opt = await page.locator('select[aria-label="Try a sample"] option', { hasText: /CV|Resume/i }).first().innerText();
  await page.getByLabel('Try a sample').selectOption({ label: opt });
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: 'Analyse', exact: true }).click();
  await expect(page.getByText(/Analysis from/)).toBeVisible();
  await expect(page.getByTestId('save-demo')).toHaveCount(0);
  await ctx.close();
});
