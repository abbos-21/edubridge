import { describe, expect, it } from 'vitest';
import type { L } from '@edubridge/shared';
import { installRu, ruLookup } from '../src/i18n/ru';
import recovered from '../src/i18n/ru.recovered.json';
import extra from '../src/i18n/ru.extra.json';
import { TASKS, requirementRows, newPlan, uniOpp, grantOpp } from '../src/lib/plans';
import { QUESTIONS, answerHint, reviewCv, reviewDraft } from '../src/lib/writing';
import { TERMS, steps } from '../src/pages/Prepare';
import { DOCS } from '../src/lib/documents-data';
import snapshot from '../src/data/snapshot.json';
import { DEFAULT_PROFILE } from '../src/lib/profile';

installRu(recovered as Record<string, string>, extra as Record<string, string>);
const hasRu = (l: L) => !!(l.ru || ruLookup(l.en));
const missing = (list: L[]) => [...new Set(list.filter((l) => !hasRu(l)).map((l) => l.en))];

describe('Russian for the long texts', () => {
  it('task checklist, glossary, roadmap and writing questions', () => {
    const list: L[] = [
      ...Object.values(TASKS).flatMap((t) => [t.title, t.why, t.how]),
      ...QUESTIONS.flatMap((q) => [q.q, q.area]),
      ...TERMS.map((t) => t.def),
      ...DOCS.flatMap((d) => [d.purpose, d.when, d.official, ...d.steps, ...d.mistakes, ...d.checklist]),
      ...(['bachelor', 'master'] as const).flatMap((lv) => steps(lv).flatMap((g) => [g.when, ...g.items.map((i) => i.text)])),
    ];
    expect(missing(list)).toEqual([]);
  });

  it('every tutor finding, CV note and requirement row', () => {
    const bad = 'i am passionate and hardworking.  since i was a child i like many things, stuff, really very etc. '.repeat(40);
    const issues = reviewDraft(bad, { wordLimit: 50, oppName: 'Some University', country: 'Malaysia', hasPrompt: false });
    const short = reviewDraft('I like it.', { wordLimit: 500, oppName: 'Some University', hasPrompt: false });
    const long = reviewDraft('word '.repeat(400), { wordLimit: 100, hasPrompt: true });
    const list: L[] = [...[issues, short, long].flatMap((r) => [...r.strengths, ...r.issues.flatMap((i) => [i.issue, i.why, i.question, i.strategy, ...(i.example ? [i.example] : [])])])];
    const cv = reviewCv('hello');
    list.push(...cv.found, ...cv.missing, ...cv.notes, ...cv.notes);
    const hint = answerHint('I am passionate'); if (hint) list.push(hint);
    const hint2 = answerHint('short'); if (hint2) list.push(hint2);
    const u = (snapshot as unknown as { universities: Parameters<typeof uniOpp>[0][] }).universities[0]!;
    const opp = uniOpp(u, 'bachelor');
    const plan = newPlan(opp, { ...DEFAULT_PROFILE(), ielts: 5 });
    for (const prof of [null, { ...DEFAULT_PROFILE(), ielts: 5 }, { ...DEFAULT_PROFILE(), ielts: 9 }]) {
      list.push(...requirementRows({ ...opp, ielts: 6.5 }, plan, prof).flatMap((r) => [r.label, r.why, r.how]));
      list.push(...requirementRows({ ...opp, ielts: null }, plan, prof).flatMap((r) => [r.label, r.why, r.how]));
    }
    list.push(...requirementRows(grantOpp({ id: 'g', name: 'G', country: 'MY', kind: 'national', sources: [] } as never), plan, null).flatMap((r) => [r.label, r.why, r.how]));
    const fee = requirementRows({ ...opp, fee: { amount: 50, currency: 'USD' } }, plan, null);
    list.push(...fee.flatMap((r) => [r.label, r.why, r.how]));
    expect(missing(list.filter((l) => l.en.trim()))).toEqual([]);
  });
});
