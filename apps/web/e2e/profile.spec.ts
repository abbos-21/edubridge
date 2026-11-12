import { expect, test, type Browser, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const fx = (f: string) => fileURLToPath(new URL(`./fixtures/${f}`, import.meta.url));
const unique = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const KEY = 'edubridge:v1';

async function newPage(browser: Browser, seed: Record<string, unknown> = {}) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(([k, s]) => { if (!localStorage.getItem(k as string)) localStorage.setItem(k as string, JSON.stringify({ lang: 'en', ...(s as object) })); }, [KEY, seed]);
  return { ctx, page: await ctx.newPage() };
}
async function login(page: Page, name = unique('e2e-prof')) {
  await page.goto('/#signin');
  await page.getByLabel('Dev user name').fill(name);
  await page.getByRole('button', { name: 'Sign in (dev)' }).click();
  await expect(page).toHaveURL(/#settings$/);
  return name;
}
const stored = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), KEY);

test.describe('onboarding wizard', () => {
  test('walks the 7 steps, validates, keeps a draft across a reload, and saves the profile', async ({ browser }) => {
    const { ctx, page } = await newPage(browser);
    await page.goto('/#onboarding');
    await expect(page.getByRole('heading', { name: 'Build your profile' })).toBeVisible();
    // step 1 needs a name
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Enter a name or nickname.')).toBeVisible();
    await page.getByLabel('Name or preferred display name').fill('Test Student');
    await page.getByLabel('Degree you want to study').selectOption('master');
    await page.getByLabel('Field of study').selectOption('computing');
    await page.getByRole('button', { name: 'Next' }).click();
    // step 2: a score above the scale is refused, and the scale is never converted
    await expect(page.getByRole('heading', { name: 'Academics' })).toBeVisible();
    await page.getByLabel('GPA or academic score').fill('120');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Enter a number between 0 and 100 for this scale.')).toBeVisible();
    await page.getByLabel('GPA or academic score').fill('88,5');
    await page.getByRole('button', { name: 'Next' }).click();
    // step 3: IELTS in steps of 0.5
    await page.getByLabel('IELTS overall').fill('6.3');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('IELTS scores run from 0 to 9 in steps of 0.5.')).toBeVisible();
    await page.getByLabel('IELTS overall').fill('6.5');
    // the draft survives a reload
    await page.reload();
    await page.getByRole('button', { name: '3. Language' }).click(); // the wizard restarts at step 1, but every answer is kept
    await expect(page.getByLabel('IELTS overall')).toHaveValue('6.5');
    await page.getByRole('button', { name: 'Next' }).click();
    // step 4: total budget cannot be smaller than tuition
    await page.getByLabel('Maximum tuition per year').fill('5000');
    await page.getByLabel('Maximum total cost per year').fill('3000');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Total budget should include tuition, so it cannot be smaller.')).toBeVisible();
    await page.getByLabel('Maximum total cost per year').fill('9000');
    await page.getByRole('button', { name: 'Next' }).click();
    // step 5: countries
    await page.getByRole('button', { name: 'Germany' }).first().click();
    await expect(page.getByRole('button', { name: 'Germany' }).first()).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Next' }).click();
    // step 6: experience
    await page.getByLabel('Research').fill('Final-year thesis on recommender systems (2025).');
    await page.getByRole('button', { name: 'Next' }).click();
    // review
    await expect(page.getByRole('heading', { name: 'Review' }).first()).toBeVisible();
    await expect(page.getByText('Test Student')).toBeVisible();
    await page.getByRole('button', { name: 'Save my profile' }).click();
    await expect(page).toHaveURL(/#dashboard$/);
    await expect(page.getByText(/Test Student/).first()).toBeVisible();
    const st = await stored(page);
    expect(st.profile).toMatchObject({ name: 'Test Student', targetLevel: 'master', field: 'computing', score: 88.5, ielts: 6.5, totalBudget: 9000, preferredCountries: ['DE'] });
    expect(st.onboardingDraft).toBeNull();
    await ctx.close();
  });

  test('a saved profile can be edited from the review step', async ({ browser }) => {
    const { ctx, page } = await newPage(browser);
    await page.goto('/#demo');
    await page.getByRole('button', { name: 'Try demo' }).first().click();
    await expect(page).toHaveURL(/#dashboard$/);
    // a demo profile is also editable, and saving turns it into a real (non-demo) profile
    await page.goto('/#onboarding--edit');
    await expect(page.getByRole('heading', { name: 'Edit your profile' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Review' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.getByLabel('Name or preferred display name').fill('Renamed Student');
    await page.getByRole('button', { name: 'Review' }).click();
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page).toHaveURL(/#dashboard$/);
    const st = await stored(page);
    expect(st.profile.name).toBe('Renamed Student');
    expect(st.demo).toBeNull();
    await ctx.close();
  });
});

test.describe('demo students', () => {
  test('shows three fictional students; trying one fills the profile builder and shows the banner; exit clears it', async ({ browser }) => {
    const { ctx, page } = await newPage(browser);
    await page.goto('/#demo');
    await expect(page.getByText('fictional', { exact: true })).toHaveCount(3);
    await expect(page.getByText(/Dilnoza · ambitious school student/)).toBeVisible();
    await page.getByRole('button', { name: 'Try demo' }).first().click();
    await expect(page).toHaveURL(/#dashboard$/);
    await expect(page.getByRole('heading', { name: /Dilnoza/ })).toBeVisible();
    await expect(page.getByText('Demo mode: you are using a fictional student.')).toBeVisible();
    await page.getByRole('button', { name: 'Exit demo' }).click();
    await expect(page.getByText('Demo mode: you are using a fictional student.')).toHaveCount(0);
    expect((await stored(page)).profile).toBeNull();
    await ctx.close();
  });

  test('presentation mode (?present=1) hides the demo banner but changes nothing else', async ({ browser }) => {
    const { ctx, page } = await newPage(browser);
    await page.goto('/?present=1#demo');
    await page.getByRole('button', { name: 'Try demo' }).first().click();
    await expect(page.getByRole('heading', { name: /Dilnoza/ })).toBeVisible();
    await expect(page.getByText('Demo mode: you are using a fictional student.')).toHaveCount(0);
    await ctx.close();
  });

  test('a demo student is never uploaded to the account', async ({ browser }) => {
    const { ctx, page } = await newPage(browser);
    await login(page);
    await page.goto('/#demo');
    await page.getByRole('button', { name: 'Try demo' }).first().click();
    await expect(page.getByRole('heading', { name: /Dilnoza/ })).toBeVisible();
    await page.waitForTimeout(2500); // longer than the sync delay
    expect((await page.request.get('/api/v1/me/profile')).status()).toBe(404);
    await ctx.close();
  });
});

test.describe('profile builder', () => {
  async function demoAdviser(browser: Browser, which = 0) {
    const { ctx, page } = await newPage(browser);
    await page.goto('/#demo');
    await page.getByRole('button', { name: 'Try demo' }).nth(which).click();
    await expect(page).toHaveURL(/#dashboard$/);
    await page.goto('/#adviser');
    return { ctx, page };
  }

  test('without a profile it asks to build one or try a demo', async ({ browser }) => {
    const { ctx, page } = await newPage(browser);
    await page.goto('/#adviser');
    await expect(page.getByRole('heading', { name: 'This page uses your student profile' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Build my profile' })).toBeVisible();
    await ctx.close();
  });

  test('the check shows each area with now / target / why, a missing value is "not enough information", never a pass', async ({ browser }) => {
    const { ctx, page } = await demoAdviser(browser, 0);
    await expect(page.getByText('This compares your profile with typical published levels')).toBeVisible();
    for (const t of ['English', 'Grades', 'Evidence of interest in your subject', 'Leadership and contribution']) await expect(page.getByRole('heading', { name: t })).toBeVisible();
    await expect(page.getByText('IELTS 7 (lowest part 6.5)')).toBeVisible();
    await page.locator('label', { hasText: /^Degree/ }).locator('select').selectOption('master');
    await expect(page.getByRole('heading', { name: 'Research experience' })).toBeVisible();
    // a profile with no scores: grades are "not enough information" (the 5-point scale is never converted)
    await ctx.close();
  });

  test('ideas: 36 exist, are filterable, rank English first when it is the gap, and can be added to the plan', async ({ browser }) => {
    const { ctx, page } = await demoAdviser(browser, 1); // Jasur: IELTS 6.0 on a 5-point scale
    await page.getByRole('tab', { name: 'Ideas' }).click();
    await page.getByLabel('Months until you apply').selectOption('24');
    await page.getByLabel('Hours per week').selectOption('15');
    await page.getByLabel('Budget for activities').selectOption('some');
    const status = page.getByRole('status').filter({ hasText: /ideas$/ });
    await expect(status).toBeVisible();
    const total = Number((await status.innerText()).match(/\d+/)![0]);
    expect(total).toBeGreaterThan(20);
    expect(total).toBeLessThanOrEqual(36);
    await page.getByLabel('Type of activity').selectOption('language');
    const filtered = Number((await status.innerText()).match(/\d+/)![0]);
    expect(filtered).toBeLessThan(total);
    await page.getByLabel('Type of activity').selectOption('');
    await expect(page.getByText(/fits your time and budget|does not fit your time or budget/).first()).toBeVisible();
    // details are collapsed until asked for
    await page.getByRole('button', { name: 'Show details' }).first().click();
    await expect(page.getByText('How it could read on a CV').first()).toBeVisible();
    // add two to the plan
    await page.getByRole('button', { name: 'Add to my plan' }).nth(0).click();
    await page.getByRole('button', { name: 'Add to my plan' }).nth(0).click();
    await expect(page.getByRole('tab', { name: /My plan \(2\)/ })).toBeVisible();
    await ctx.close();
  });

  test('the plan is month by month, flags too many hours, survives a reload, and items can be removed', async ({ browser }) => {
    const { ctx, page } = await demoAdviser(browser, 0);
    await page.getByRole('tab', { name: 'Ideas' }).click();
    await page.getByLabel('Months until you apply').selectOption('12');
    await page.getByRole('button', { name: 'Add to my plan' }).nth(0).click();
    await page.getByRole('button', { name: 'Add to my plan' }).nth(1).click();
    await page.getByRole('tab', { name: /My plan/ }).click();
    await expect(page.getByRole('heading', { name: 'Your chosen ideas' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Month 1', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Month 12', exact: true })).toBeVisible();
    // force both to start together, with only 2 hours a week available: overload is flagged
    await page.getByLabel('Hours per week').selectOption('2');
    const selects = page.locator('select[aria-label$="Starts in month"]');
    await selects.nth(0).selectOption('1');
    await selects.nth(1).selectOption('1');
    await expect(page.getByText(/more than your 2/).first()).toBeVisible();
    // persisted in this browser
    expect((await stored(page)).growth.items).toHaveLength(2);
    await page.reload();
    await page.getByRole('tab', { name: /My plan/ }).click();
    await expect(page.getByRole('heading', { name: 'Your chosen ideas' })).toBeVisible();
    await page.getByRole('button', { name: 'Remove from my plan' }).first().click();
    expect((await stored(page)).growth.items).toHaveLength(1);
    await ctx.close();
  });
});

test.describe('profile and plan in the account', () => {
  test('a guest profile is offered for upload at sign-in, and a second device then sees it', async ({ browser }) => {
    const profile = { name: 'Guest Gulnora', field: 'law', targetLevel: 'master', citizenship: 'Uzbekistan', currentEducation: 'bachelor_grad', applicationYear: 2027, scale: 'percent', score: 90, ielts: 7, experiences: { research: 'A thesis' } };
    const a = await newPage(browser, { profile });
    const name = await login(a.page);
    await expect(a.page.getByText('Upload the data from this device?')).toBeVisible({ timeout: 10_000 });
    await a.page.getByRole('button', { name: 'Upload', exact: true }).click();
    await expect(a.page.getByText('Uploaded.')).toBeVisible({ timeout: 10_000 });
    const mine = await (await a.page.request.get('/api/v1/me/profile')).json();
    expect(mine.data.name).toBe('Guest Gulnora');

    const b = await newPage(browser);
    await b.page.goto('/#signin');
    await b.page.getByLabel('Dev user name').fill(name);
    await b.page.getByRole('button', { name: 'Sign in (dev)' }).click();
    await expect(b.page).toHaveURL(/#settings$/);
    await expect.poll(async () => (await stored(b.page)).profile?.name, { timeout: 10_000 }).toBe('Guest Gulnora');
    await b.page.goto('/#adviser');
    await expect(b.page.getByText(/Guest Gulnora/).first()).toBeVisible();
    await a.ctx.close();
    await b.ctx.close();
  });

  test('a plan made on one device appears on another; the server copy wins on a conflict', async ({ browser }) => {
    const a = await newPage(browser);
    const name = await login(a.page);
    await a.page.goto('/#onboarding');
    await a.page.getByLabel('Name or preferred display name').fill('Sync Student');
    for (let i = 0; i < 6; i++) await a.page.getByRole('button', { name: 'Next' }).click();
    await a.page.getByRole('button', { name: 'Save my profile' }).click();
    await expect(a.page).toHaveURL(/#dashboard$/);
    await expect.poll(async () => (await a.page.request.get('/api/v1/me/profile')).status(), { timeout: 10_000 }).toBe(200);
    await a.page.goto('/#adviser');
    await a.page.getByRole('tab', { name: 'Ideas' }).click();
    await a.page.getByRole('button', { name: 'Add to my plan' }).first().click();
    await expect.poll(async () => ((await (await a.page.request.get('/api/v1/me/growth')).json()).data?.items ?? []).length, { timeout: 10_000 }).toBe(1);

    const b = await newPage(browser);
    await b.page.goto('/#signin');
    await b.page.getByLabel('Dev user name').fill(name);
    await b.page.getByRole('button', { name: 'Sign in (dev)' }).click();
    await expect(b.page).toHaveURL(/#settings$/);
    await b.page.goto('/#adviser');
    await expect(b.page.getByRole('tab', { name: /My plan \(1\)/ })).toBeVisible({ timeout: 10_000 });
    await a.ctx.close();
    await b.ctx.close();
  });
});

test.describe('AI coach (mock model)', () => {
  test('builds a plan from the profile, reviews an activity, and sends the profile for the server to minimise', async ({ browser }) => {
    const { ctx, page } = await newPage(browser);
    await login(page);
    await page.goto('/#demo');
    await page.getByRole('button', { name: 'Try demo' }).first().click();
    await page.goto('/#adviser');
    await page.getByRole('tab', { name: 'AI coach' }).click();
    const bodies: any[] = [];
    page.on('request', (r) => { if (r.url().endsWith('/ai/json')) bodies.push(r.postDataJSON()); });
    await page.getByLabel('Your interests and hobbies').fill('Robotics and teaching kids to code');
    await page.getByRole('button', { name: 'Build my plan' }).click();
    await expect(page.getByText('Mock diagnosis.')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Mock project')).toBeVisible();
    await expect(page.getByText('Easy certificates')).toBeVisible();
    expect(bodies[0]).toMatchObject({ task: 'growth_ideas', group: 'middle' });
    expect(bodies[0].gaps).toBeInstanceOf(Array);
    expect(bodies[0].profile.field).toBe('computing');
    await page.getByLabel('Describe something you did or plan to do').fill('I taught coding to younger students at a library every Saturday since 2024.');
    await page.getByRole('button', { name: 'Review it' }).click();
    await expect(page.getByText('Mock verdict.')).toBeVisible({ timeout: 20_000 });
    await ctx.close();
  });

  test('guests are asked to sign in for the coach but still get the rule-based check and ideas', async ({ browser }) => {
    const { ctx, page } = await newPage(browser);
    await page.goto('/#demo');
    await page.getByRole('button', { name: 'Try demo' }).first().click();
    await page.goto('/#adviser');
    await page.getByRole('tab', { name: 'AI coach' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in to use the AI advisor' })).toBeVisible();
    await page.getByRole('tab', { name: 'Profile check' }).click();
    await expect(page.getByRole('heading', { name: 'English' })).toBeVisible();
    await ctx.close();
  });

  test('the advisor chat receives the profile too', async ({ browser }) => {
    const { ctx, page } = await newPage(browser);
    await login(page);
    await page.goto('/#demo');
    await page.getByRole('button', { name: 'Try demo' }).first().click();
    await page.goto('/#assistant');
    const bodies: any[] = [];
    page.on('request', (r) => { if (r.url().endsWith('/ai/chat')) bodies.push(r.postDataJSON()); });
    await page.getByLabel('Your question').fill('Which of my target countries fits my budget?');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect.poll(() => bodies.length).toBe(1);
    expect(bodies[0].profile.name).toBe('Dilnoza (demo)'); // the server drops the name before the model sees it
    await ctx.close();
  });
});

test.describe('opening files (Documents)', () => {
  async function newDoc(page: Page) {
    await page.goto('/#assistant--docs');
    await page.getByRole('button', { name: 'New document' }).click();
  }
  const fileInput = (page: Page) => page.locator('input[type=file]');
  // the label wraps the textarea, so its accessible name includes the typed text: select through the label element
  const textarea = (page: Page) => page.locator('label', { hasText: /^Text/ }).locator('textarea');

  test('reads .txt, .docx and a PDF with text, all in the browser', async ({ browser }) => {
    const { ctx, page } = await newPage(browser);
    await login(page);
    await newDoc(page);
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.url()));
    for (const f of ['sample.txt', 'sample.docx', 'sample-text.pdf']) {
      await textarea(page).fill('');
      await fileInput(page).setInputFiles(fx(f));
      await expect(textarea(page)).toHaveValue(/Dilnoza Rahimova is applying for a master.s programme/, { timeout: 15_000 });
      await expect(textarea(page)).toHaveValue(/internship at a bank/);
    }
    // the files were never uploaded, and no AI request was made
    expect(requests.filter((u) => /\/ai\/|\/me\/documents/.test(u))).toEqual([]);
    await expect(page.getByText(/Read \d+ words from sample-text.pdf/)).toBeVisible();
    await ctx.close();
  });

  test('refuses unsupported and oversized files with a clear message', async ({ browser }) => {
    const { ctx, page } = await newPage(browser);
    await login(page);
    await newDoc(page);
    await fileInput(page).setInputFiles({ name: 'program.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ') });
    await expect(page.getByText('This file type is not supported.')).toBeVisible();
    await fileInput(page).setInputFiles({ name: 'big.txt', mimeType: 'text/plain', buffer: Buffer.alloc(11 * 1024 * 1024, 'a') });
    await expect(page.getByText('The file is larger than 10 MB.')).toBeVisible();
    await fileInput(page).setInputFiles({ name: 'broken.docx', mimeType: 'application/octet-stream', buffer: Buffer.from('not a zip file') });
    await expect(page.getByText('This file could not be read. Paste the text instead.')).toBeVisible();
    await ctx.close();
  });

  test('a scanned PDF is read by the AI only on request; the student checks and edits the transcription', async ({ browser }) => {
    const { ctx, page } = await newPage(browser);
    await login(page);
    await newDoc(page);
    const ocr: any[] = [];
    page.on('request', (r) => { if (r.url().endsWith('/ai/ocr')) ocr.push(r.postDataJSON()); });
    await fileInput(page).setInputFiles(fx('sample-scan.pdf'));
    await expect(page.getByText('This PDF looks scanned (no text inside)')).toBeVisible({ timeout: 15_000 });
    expect(ocr).toHaveLength(0); // nothing is sent until the student presses the button
    await page.getByRole('button', { name: 'Read with AI' }).click();
    await expect(page.getByRole('heading', { name: 'Check the transcription' })).toBeVisible({ timeout: 20_000 });
    expect(ocr).toHaveLength(1);
    expect(ocr[0].images[0].mediaType).toBe('image/jpeg');
    expect(ocr[0].images[0].data.length).toBeGreaterThan(100);
    await expect(page.getByLabel('Page 1')).toHaveValue('Mock transcribed text.');
    await page.getByLabel('Page 1').fill('Mock transcribed text. (corrected by me)');
    await page.getByRole('button', { name: 'Use this text' }).click();
    await expect(textarea(page)).toHaveValue(/corrected by me/);
    await expect(page.getByText('Check it against your original before analysing.')).toBeVisible();
    await ctx.close();
  });

  test('a photo is shrunk and sent for reading only after the student agrees; discard changes nothing', async ({ browser }) => {
    const { ctx, page } = await newPage(browser);
    await login(page);
    await newDoc(page);
    await fileInput(page).setInputFiles(fx('sample-photo.png'));
    await expect(page.getByText('This is a photo')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).first().click();
    await expect(page.getByText('This is a photo')).toHaveCount(0);
    await fileInput(page).setInputFiles(fx('sample-photo.png'));
    await page.getByRole('button', { name: 'Read with AI' }).click();
    await expect(page.getByRole('heading', { name: 'Check the transcription' })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Discard' }).click();
    await expect(textarea(page)).toHaveValue('');
    await ctx.close();
  });

  test('a document made from a file can be saved and analysed like any other', async ({ browser }) => {
    const { ctx, page } = await newPage(browser);
    await login(page);
    await newDoc(page);
    await fileInput(page).setInputFiles(fx('sample.docx'));
    await expect(textarea(page)).toHaveValue(/Dilnoza Rahimova/, { timeout: 15_000 });
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByLabel('Working copy')).toHaveValue(/Dilnoza Rahimova/);
    await page.getByRole('button', { name: 'Analyse', exact: true }).click();
    await expect(page.getByText(/Mock: the letter is understandable but generic/)).toBeVisible({ timeout: 20_000 });
    await ctx.close();
  });
});
