import { expect, test, type Browser, type Page } from '@playwright/test';

const unique = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function newPage(browser: Browser, lang = 'en') {
  const ctx = await browser.newContext();
  await ctx.addInitScript((l) => {
    if (!localStorage.getItem('edubridge:v1')) localStorage.setItem('edubridge:v1', JSON.stringify({ lang: l }));
  }, lang);
  return { ctx, page: await ctx.newPage() };
}

async function signedIn(browser: Browser, lang = 'en') {
  const { ctx, page } = await newPage(browser, lang);
  await page.goto('/#signin');
  await page.getByLabel(/Dev user name|Dev foydalanuvchi nomi|Имя пользователя/).fill(unique('e2e-ai'));
  await page.getByRole('button', { name: /Sign in \(dev\)|Kirish \(dev\)|Войти \(dev\)/ }).click();
  await expect(page).toHaveURL(/#settings$/); // sign-in finished and redirected
  return { ctx, page };
}

/** Creates a document from one of the built-in samples. */
async function addSample(page: Page, sampleName: RegExp) {
  await page.goto('/#assistant--docs');
  await page.getByRole('button', { name: 'New document' }).click();
  await page.getByLabel('Try a sample').selectOption({ label: await page.locator('select[aria-label="Try a sample"] option', { hasText: sampleName }).first().innerText() });
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByLabel('Working copy')).toBeVisible();
}

test.describe('guests', () => {
  test('see a sign-in prompt, plus a clearly labelled rule-based lookup that only repeats catalogue facts', async ({ browser }) => {
    const { ctx, page } = await newPage(browser);
    await page.goto('/#assistant');
    await expect(page.getByRole('heading', { name: 'Sign in to use the AI advisor' })).toBeVisible();
    await expect(page.getByText('Quick facts (rule-based, not AI)')).toBeVisible();
    await page.getByLabel('University').fill('KAIST');
    await page.getByRole('button', { name: 'Look up' }).click();
    await expect(page.getByText(/Korea Advanced Institute/)).toBeVisible();
    await expect(page.getByText(/not confirmed|Tuition/).first()).toBeVisible();
    await page.getByLabel('University').fill('zzzzqq');
    await page.getByRole('button', { name: 'Look up' }).click();
    await expect(page.getByText('EduBridge has no record that matches.')).toBeVisible();
    await ctx.close();
  });
  test('the other tabs also ask guests to sign in', async ({ browser }) => {
    const { ctx, page } = await newPage(browser);
    for (const t of ['docs', 'interview', 'report']) {
      await page.goto(`/#assistant--${t}`);
      await expect(page.getByRole('heading', { name: 'Sign in to use the AI advisor' })).toBeVisible();
    }
    await ctx.close();
  });
});

test.describe('Ask', () => {
  test('streams a structured answer, flags links outside the official records, and offers follow-ups', async ({ browser }) => {
    const { ctx, page } = await signedIn(browser);
    await page.goto('/#assistant');
    await expect(page.getByText(/Development mode: replies come from a built-in test model/)).toBeVisible();
    await page.getByLabel('Your question').fill('What are the application steps for Universiti Malaya?');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByRole('heading', { name: 'Short answer' })).toBeVisible({ timeout: 15_000 });
    // the link that is in the records is not flagged; the invented one is
    const verified = page.getByRole('link', { name: 'https://study.um.edu.my/how-to-apply' }).first();
    await expect(verified).toBeVisible();
    await expect(verified.locator('xpath=..').getByText('unverified link')).toHaveCount(0);
    const invented = page.getByRole('link', { name: 'https://not-in-records.example/page' });
    await expect(invented.locator('xpath=..').getByText('unverified link')).toBeVisible();
    await expect(page.getByText('Some links are not in EduBridge’s verified records')).toBeVisible();
    await expect(page.getByText(/Based on EduBridge records: .*Universiti Malaya/)).toBeVisible();
    // follow-up chips continue the conversation
    await page.getByRole('button', { name: 'What is the deadline?' }).click();
    await expect(page.getByRole('heading', { name: 'Short answer' })).toHaveCount(2, { timeout: 15_000 });
    await ctx.close();
  });

  test('saves the chat to the account, lists it, and reopens it after a reload', async ({ browser }) => {
    const { ctx, page } = await signedIn(browser);
    await page.goto('/#assistant');
    await page.getByLabel('Your question').fill('Tell me about KAIST');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByRole('heading', { name: 'Short answer' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Tell me about KAIST' })).toBeVisible({ timeout: 10_000 });
    await page.reload();
    await page.getByRole('button', { name: 'Tell me about KAIST' }).click();
    await expect(page.getByRole('heading', { name: 'Short answer' })).toBeVisible();
    // delete it
    await page.getByRole('button', { name: 'Delete chat' }).click();
    await expect(page.getByRole('button', { name: 'Tell me about KAIST' })).toHaveCount(0);
    await ctx.close();
  });

  test('"Explain in more depth" re-asks the same question in deep mode', async ({ browser }) => {
    const { ctx, page } = await signedIn(browser);
    await page.goto('/#assistant');
    const reqs: any[] = [];
    page.on('request', (r) => { if (r.url().endsWith('/ai/chat')) reqs.push(r.postDataJSON()); });
    await page.getByLabel('Your question').fill('How much does Germany cost?');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByRole('button', { name: 'Explain in more depth' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Explain in more depth' }).click();
    await expect.poll(() => reqs.length).toBe(2);
    expect(reqs[0].depth).toBe('normal');
    expect(reqs[1].depth).toBe('deep');
    expect(reqs[1].messages).toHaveLength(1); // the first answer is replaced, not duplicated
    await ctx.close();
  });

  test('documents are not shared with the advisor unless the student turns sharing on', async ({ browser }) => {
    const { ctx, page } = await signedIn(browser);
    await addSample(page, /Sample CV/);
    await page.goto('/#assistant');
    const bodies: any[] = [];
    page.on('request', (r) => { if (r.url().endsWith('/ai/chat')) bodies.push(r.postDataJSON()); });
    await page.getByText('Context for the advisor (optional)').click();
    await page.getByLabel('Your question').fill('Review my plan');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect.poll(() => bodies.length).toBe(1);
    expect(bodies[0].shareDocs).toBe(false);
    expect(bodies[0].docs).toEqual([]);
    await page.getByLabel('Share the documents I tick below (off by default)').check();
    await page.getByLabel('Sample CV (fictional)').check();
    await page.getByLabel('Your question').fill('Review again');
    await expect(page.getByRole('button', { name: 'Send' })).toBeEnabled({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Send' }).click();
    await expect.poll(() => bodies.length).toBe(2);
    expect(bodies[1].shareDocs).toBe(true);
    expect(bodies[1].docs[0].text).toContain('Dilnoza Rahimova');
    await ctx.close();
  });

  test('a quota error is shown in plain words and nothing half-written is kept', async ({ browser }) => {
    const { ctx, page } = await signedIn(browser);
    await page.route('**/api/v1/ai/chat', (r) => r.fulfill({ status: 429, contentType: 'application/json', headers: { 'retry-after': '3600' }, body: JSON.stringify({ error: { code: 'quota_exceeded', message: 'x' } }) }));
    await page.goto('/#assistant');
    await page.getByLabel('Your question').fill('Hello?');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('You have used all your AI requests for today. They reset at midnight (Tashkent time).')).toBeVisible();
    await expect(page.getByText('…')).toHaveCount(0);
    await ctx.close();
  });
});

test.describe('Documents: critical review', () => {
  test('analyses a sample CV, shows scores and verified quotes, and notices when the text changes', async ({ browser }) => {
    const { ctx, page } = await signedIn(browser);
    await addSample(page, /Sample CV/);
    await page.getByRole('button', { name: 'Analyse', exact: true }).click();
    await expect(page.getByText(/Mock: the CV lists items but shows little impact/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Scores are advisory, not an official rating.')).toBeVisible();
    await expect(page.getByText('Structure and readability')).toBeVisible();
    // quotes come from the student's own text and were verified: no warning shown
    await expect(page.getByText('This exact wording was not found in your document')).toHaveCount(0);
    await expect(page.getByText('Needs moderate improvement').first()).toBeVisible();
    // edit the text: the saved analysis is marked as out of date
    const ta = page.getByLabel('Working copy');
    await ta.fill((await ta.inputValue()) + '\nAdditional line about a new project.');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Your text changed after this analysis.')).toBeVisible();
    await ctx.close();
  });

  test('analyses a letter against a target university and offers the second reader', async ({ browser }) => {
    const { ctx, page } = await signedIn(browser);
    await addSample(page, /Sample motivation letter/);
    await page.getByLabel('Target university or scholarship').selectOption('uni');
    await page.getByRole('button', { name: 'Analyse', exact: true }).click();
    await expect(page.getByText(/Mock: the letter is understandable but generic/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Sentences anyone could write')).toBeVisible();
    await expect(page.getByText('The four questions every reader asks')).toBeVisible();
    await page.getByRole('button', { name: 'Second reader' }).click();
    await expect(page.getByText('Checked by a second reader')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('What the second reader changed')).toBeVisible();
    // the analysis is kept after a reload
    await page.reload();
    await page.getByRole('button', { name: /Sample motivation letter/ }).click();
    await expect(page.getByText(/Mock: the letter is understandable but generic/)).toBeVisible();
    await ctx.close();
  });

  test('a failed analysis shows an error and keeps no fake result', async ({ browser }) => {
    const { ctx, page } = await signedIn(browser);
    await addSample(page, /Sample CV/);
    await page.route('**/api/v1/ai/json', (r) => r.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: { code: 'ai_bad_reply', message: 'x' } }) }));
    await page.getByRole('button', { name: 'Analyse', exact: true }).click();
    await expect(page.getByText('The AI returned an answer we could not use. Please try again.')).toBeVisible();
    await expect(page.getByText('Scores are advisory')).toHaveCount(0);
    await ctx.close();
  });

  test('delete removes the document', async ({ browser }) => {
    const { ctx, page } = await signedIn(browser);
    await addSample(page, /Sample CV/);
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText('No documents yet.')).toBeVisible();
    await ctx.close();
  });
});

test.describe('Documents: improve a passage', () => {
  async function select(page: Page, text: string) {
    await page.getByLabel('Working copy').evaluate((el, needle) => {
      const ta = el as HTMLTextAreaElement;
      const i = ta.value.indexOf(needle);
      ta.focus();
      ta.setSelectionRange(i, i + needle.length);
      // React's onSelect reacts to keyboard/mouse events, like a real selection would produce
      ta.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      ta.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    }, text);
  }

  test('suggests a revision with a word diff; accept replaces the passage, undo restores it, the original is untouched', async ({ browser }) => {
    const { ctx, page } = await signedIn(browser);
    await addSample(page, /Sample motivation letter/);
    const passage = 'I have always been passionate about economics and I am very excited to apply for the Master in Development Economics.';
    await expect(page.getByRole('button', { name: 'Suggest a revision' })).toBeDisabled();
    await select(page, passage);
    await page.getByRole('button', { name: 'Suggest a revision' }).click();
    await expect(page.getByText('Suggestion', { exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('diff').locator('ins')).not.toHaveCount(0);
    await expect(page.getByText('Please add the missing facts (shown as [placeholders]):')).toBeVisible();

    // reject leaves everything alone
    await page.getByRole('button', { name: 'Reject' }).click();
    await expect(page.getByLabel('Working copy')).toHaveValue(new RegExp(passage.slice(0, 30)));

    // accept
    await select(page, passage);
    await page.getByRole('button', { name: 'Suggest a revision' }).click();
    await page.getByRole('button', { name: 'Accept' }).click({ timeout: 20_000 });
    await expect(page.getByLabel('Working copy')).toHaveValue(/\[add a specific detail\]/);
    // undo
    await page.getByRole('button', { name: 'Undo last change' }).click();
    await expect(page.getByLabel('Working copy')).toHaveValue(new RegExp(passage.slice(0, 40)));
    await expect(page.getByLabel('Working copy')).not.toHaveValue(/\[add a specific detail\]/);
    // the original was never overwritten
    await page.getByRole('button', { name: 'Show original' }).click();
    await expect(page.getByText('Original (never overwritten)')).toBeVisible();
    await expect(page.locator('pre')).not.toContainText('[add a specific detail]');
    await ctx.close();
  });

  test('a download of the working copy is a text file', async ({ browser }) => {
    const { ctx, page } = await signedIn(browser);
    await ctx.grantPermissions([]);
    await addSample(page, /Sample CV/);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download working copy' }).click()]);
    expect(dl.suggestedFilename()).toMatch(/\.txt$/);
    await ctx.close();
  });
});

test.describe('Interview and Report', () => {
  test('a practice interview runs question by question and ends with a summary; it is saved', async ({ browser }) => {
    const { ctx, page } = await signedIn(browser);
    await page.goto('/#assistant--interview');
    await page.getByLabel('Number of questions').selectOption('3');
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByText('Question 1 of 3')).toBeVisible({ timeout: 20_000 });
    for (let i = 1; i <= 3; i++) {
      await page.getByLabel('Your answer').fill(`My honest answer number ${i}, with some detail about my project.`);
      await page.getByRole('button', { name: 'Get feedback' }).click();
      await expect(page.getByText('A stronger answer (example)')).toBeVisible({ timeout: 20_000 });
      await page.getByRole('button', { name: i === 3 ? 'See summary' : 'Next question' }).click();
    }
    await expect(page.getByRole('heading', { name: 'Interview summary' })).toBeVisible();
    await expect(page.getByText('Scores are advisory and based on the written text only.')).toBeVisible();
    // saved in the list
    await page.reload();
    await expect(page.getByRole('list', { name: 'Your practice interviews' }).getByRole('button').first()).toBeVisible();
    await ctx.close();
  });

  test('the report lists analysed documents and checks a CV against a letter', async ({ browser }) => {
    const { ctx, page } = await signedIn(browser);
    await addSample(page, /Sample CV/);
    await page.getByRole('button', { name: 'Analyse', exact: true }).click();
    await expect(page.getByText(/Mock: the CV lists items/)).toBeVisible({ timeout: 20_000 });
    await addSample(page, /Sample motivation letter/);
    await page.goto('/#assistant--report');
    await expect(page.getByText('Readiness across your documents')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Sample CV (fictional)' })).toBeVisible();
    await expect(page.getByText('Your weakest document right now')).toBeVisible();
    await page.locator('main label', { hasText: /^CV/ }).locator('select').selectOption({ index: 1 });
    await page.locator('main label', { hasText: /^Letter/ }).locator('select').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Check consistency' }).click();
    await expect(page.getByText('Mock: mostly consistent.')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Possible inconsistencies — please verify')).toBeVisible();
    await expect(page.getByText('The reviewer does not know which document is right.')).toBeVisible();
    await ctx.close();
  });
});

test('Russian: the advisor pages and AI errors are translated', async ({ browser }) => {
  const { ctx, page } = await signedIn(browser, 'ru');
  await page.route('**/api/v1/ai/chat', (r) => r.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'ai_disabled', message: 'x' } }) }));
  await page.goto('/#assistant');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ИИ-советник');
  await page.getByLabel('Ваш вопрос').fill('Привет');
  await page.getByRole('button', { name: 'Отправить' }).click();
  await expect(page.getByText('ИИ-консультант сейчас отключён.')).toBeVisible();
  await ctx.close();
});
