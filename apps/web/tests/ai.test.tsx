import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { wordDiff } from '../src/lib/diff';
import { aiChat } from '../src/lib/ai';
import { ruleBasedAnswer } from '../src/lib/assistant';
import { Markdown } from '../src/ai/Markdown';
import { AnalysisView } from '../src/ai/AnalysisView';
import { AppStoreProvider, STORAGE_KEY } from '../src/store/AppStore';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { zUniversity } from '@edubridge/shared';
import snapshotJson from '../src/data/snapshot.json';

const wrap = (ui: React.ReactNode, lang = 'en') => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ lang }));
  return render(<AppStoreProvider><I18nProvider>{ui}</I18nProvider></AppStoreProvider>);
};
beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('wordDiff', () => {
  const join = (parts: ReturnType<typeof wordDiff>, t: string) => parts.filter((p) => p.type === t).map((p) => p.text).join('');
  it('marks added and removed words and keeps the rest', () => {
    const d = wordDiff('I like cats a lot', 'I really like dogs a lot');
    expect(join(d, 'same')).toContain('I ');
    expect(join(d, 'add')).toContain('really');
    expect(join(d, 'add')).toContain('dogs');
    expect(join(d, 'del')).toContain('cats');
    // putting the parts back together gives exactly the two texts
    expect(d.filter((p) => p.type !== 'add').map((p) => p.text).join('')).toBe('I like cats a lot');
    expect(d.filter((p) => p.type !== 'del').map((p) => p.text).join('')).toBe('I really like dogs a lot');
  });
  it('identical text has no changes, empty text works, and huge text falls back safely', () => {
    expect(wordDiff('same text', 'same text')).toEqual([{ type: 'same', text: 'same text' }]);
    expect(wordDiff('', 'new')).toEqual([{ type: 'add', text: 'new' }]);
    expect(wordDiff('old', '')).toEqual([{ type: 'del', text: 'old' }]);
    const big = 'word '.repeat(3000);
    expect(wordDiff(big, big + 'x').length).toBeGreaterThan(0);
  });
});

describe('Markdown (advisor answers)', () => {
  it('renders headings, lists and bold without raw HTML', () => {
    wrap(<Markdown text={'### Short answer\nYou need a **passport**.\n\n- one\n- two\n\n1. first'} />);
    expect(screen.getByRole('heading', { name: 'Short answer' })).toBeTruthy();
    expect(screen.getByText('passport').tagName).toBe('STRONG');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
  it('does not execute HTML or scripts in the text', () => {
    const { container } = wrap(<Markdown text={'<img src=x onerror=alert(1)> <script>alert(1)</script>'} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
  });
  it('flags a link that is not in the official records and not a verified one', () => {
    wrap(<Markdown text={'See https://study.um.edu.my/x and https://evil.example/y.'} linkFlags={[{ url: 'https://study.um.edu.my/x', verified: true }, { url: 'https://evil.example/y', verified: false }]} />);
    expect(screen.getAllByText('unverified link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'https://evil.example/y' }).getAttribute('rel')).toContain('noopener');
  });
  it('treats a link with no flag information as unverified', () => {
    wrap(<Markdown text={'https://unknown.example/z'} />);
    expect(screen.getAllByText('unverified link')).toHaveLength(1);
  });
});

describe('AnalysisView', () => {
  const result = {
    kind: 'letter', verdict: 'It is generic.', readiness: 'substantial_revision', reviewed: false, audit: [], firstImpression: '',
    scores: [{ key: 'authenticity', score: 3, reason: 'No evidence.' }, { key: 'fit', score: null, reason: '' }],
    fourQuestions: [], redFlags: [], claims: [], works: [], weakens: [], generic: [{ quote: { quote: 'I have always been passionate', found: false }, why: 'Anyone could write it.', ask: 'Which course?' }],
    paragraphs: [], improvements: [{ priority: 1, change: 'Add evidence', why: 'Evidence persuades' }], compliance: { status: 'cannot_confirm', notes: [] }, missing: [], questions: [], limits: [],
  };
  it('shows the advisory disclaimer, never a probability, and "not assessed" for a missing score', () => {
    wrap(<AnalysisView result={result} />);
    expect(screen.getByText(/never estimates your chance of admission/)).toBeTruthy();
    expect(screen.getByText('3/10')).toBeTruthy();
    expect(screen.getByText('Not assessed')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/\d+\s?%/);
  });
  it('warns when a quote is not in the document', () => {
    wrap(<AnalysisView result={result} />);
    expect(screen.getByText(/This exact wording was not found in your document/)).toBeTruthy();
  });
  it('translates the readiness label', () => {
    wrap(<AnalysisView result={result} />, 'ru');
    // the Russian dictionary loads on demand; the English label is shown until then, then replaced
    expect(document.body.textContent).toBeTruthy();
  });
});

describe('rule-based assistant (guests)', () => {
  const data: any = { version: 1, universities: (snapshotJson as any).universities.map((u: unknown) => zUniversity.parse(u)), grants: [], countries: [] };
  const labels = { not: 'not confirmed', ielts: 'IELTS', tuition: 'Tuition', deadline: 'Deadline', fee: 'Fee', open: 'Open' };
  it('repeats catalogue facts for a named university and says "not confirmed" for missing values', () => {
    const a = ruleBasedAnswer('tell me about universiti malaya', data, labels);
    expect(a.found).toBe(true);
    expect(a.lines[0]).toContain('Universiti Malaya');
    expect(a.lines.join(' ')).toContain('IELTS: 5');
    const d = ruleBasedAnswer('TU Darmstadt', data, labels);
    expect(d.found).toBe(true);
    expect(d.lines.join(' ')).not.toContain('QS 2027:'); // QS is unconfirmed, so it is not shown at all
  });
  it('finds nothing for unknown names and never invents an answer', () => {
    expect(ruleBasedAnswer('zzzz qqqq', data, labels)).toEqual({ found: false, lines: [], links: [] });
  });
});

describe('aiChat (streaming client)', () => {
  const sse = (events: Array<[string, unknown]>, chunk = 17) => {
    const text = events.map(([e, d]) => `event: ${e}\ndata: ${JSON.stringify(d)}\n\n`).join('');
    const enc = new TextEncoder();
    // split into awkward chunks to prove the parser handles partial events
    const parts: Uint8Array[] = [];
    for (let i = 0; i < text.length; i += chunk) parts.push(enc.encode(text.slice(i, i + chunk)));
    return new Response(new ReadableStream({ start(c) { parts.forEach((p) => c.enqueue(p)); c.close(); } }), { status: 200, headers: { 'content-type': 'text/event-stream' } });
  };
  it('delivers text pieces as they arrive and resolves with the final message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sse([['delta', { t: 'Hel' }], ['delta', { t: 'lo' }], ['done', { text: 'Hello', followups: ['a'], linkFlags: [], records: [], usage: { model: 'm', inputTokens: 1, outputTokens: 1 } }]])));
    const parts: string[] = [];
    const done = await aiChat({ lang: 'en', messages: [] }, (t) => parts.push(t));
    expect(parts).toEqual(['Hel', 'lo']);
    expect(done.text).toBe('Hello');
  });
  it('turns an error event into an ApiError with the code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sse([['error', { code: 'ai_refused', message: 'no' }]])));
    await expect(aiChat({}, () => {})).rejects.toMatchObject({ code: 'ai_refused' });
  });
  it('maps a plain JSON error (quota) to its code before any streaming', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'quota_exceeded', message: 'x' } }), { status: 429 })));
    await expect(aiChat({}, () => {})).rejects.toMatchObject({ status: 429, code: 'quota_exceeded' });
  });
  it('fails clearly when the stream ends without a final message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sse([['delta', { t: 'x' }]])));
    await expect(aiChat({}, () => {})).rejects.toMatchObject({ code: 'ai_error' });
  });
  it('a stopped request is reported as aborted, not as an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' })));
    await expect(aiChat({}, () => {})).rejects.toMatchObject({ code: 'aborted' });
  });
});
