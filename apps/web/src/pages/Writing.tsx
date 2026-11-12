import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleHelp, History, Lightbulb, ListTree, RotateCcw, Save, SearchCheck } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useStore } from '../store/AppStore';
import { useCatalog } from '../data/CatalogProvider';
import { href } from '../lib/router';
import type { Draft } from '../lib/workspace';
import { QUESTIONS, answerHint, reviewCv, reviewDraft, wordCount, type Review } from '../lib/writing';
import { Badge, Button, Card, Field, Input, Notice, PageHeader, Select, Tabs, Textarea, buttonClass, cx } from '../components/ui';

/**
 * Writing tutor: guided questions, a rule-based draft review, revision history, a CV check and a final checklist.
 * It asks questions and points at issues. It never writes or rewrites the student's text and never invents
 * experiences. Drafts stay in this browser.
 */
const empty = (): Draft => ({ text: '', answers: {}, revisions: [] });

type Tab = 'statement' | 'cv' | 'final';
type Opt = { id: string; name: string; country: string; group: 'uni' | 'grant' };

export function Writing({ param }: { param?: string | null }) {
  const { tx, pick, lang } = useI18n();
  const { plans, saved, workspace, patchWorkspace } = useStore();
  const cat = useCatalog();
  const [tab, setTab] = useState<Tab>(param === 'cv' ? 'cv' : 'statement');
  const options = useMemo<Opt[]>(() => {
    const u: Opt[] = cat.universities.map((x) => ({ id: x.id, name: x.name, country: x.country, group: 'uni' }));
    const g: Opt[] = cat.grants.map((x) => ({ id: x.id, name: x.name, country: x.country, group: 'grant' }));
    const mine = new Set([...plans.map((p) => p.oppId), ...saved]);
    return [...[...u, ...g].filter((o) => mine.has(o.id)), ...u.filter((o) => !mine.has(o.id)), ...g.filter((o) => !mine.has(o.id))];
  }, [cat, plans, saved]);
  const first = param && param !== 'cv' && options.some((o) => o.id === param) ? param : options[0]?.id ?? '';
  const [oppId, setOppId] = useState(first);
  const all = workspace.drafts;
  const [review, setReview] = useState<Review | null>(null);
  const [outline, setOutline] = useState<string[] | null>(null);
  const [note, setNote] = useState('');
  const cv = workspace.cv;
  const opp = options.find((o) => o.id === oppId);
  const draft = all[oppId] ?? empty();
  useEffect(() => { setReview(null); setOutline(null); setNote(''); }, [oppId]);

  const setDraft = (d: Draft) => patchWorkspace({ drafts: { ...all, [oppId]: d } });
  const countryName = (code: string) => pick(cat.countries.find((c) => c.code === code)?.name) || code;
  const words = wordCount(draft.text);
  const limit = draft.wordLimit;
  const cvr = reviewCv(cv);

  const runReview = () => {
    if (!draft.text.trim()) return setNote(tx('Write or paste a draft first', 'Avval qoralama yozing yoki joylashtiring'));
    setNote('');
    setReview(reviewDraft(draft.text, { wordLimit: limit, oppName: opp?.name, country: opp ? cat.countries.find((c) => c.code === opp.country)?.name.en : undefined, hasPrompt: false }));
  };
  const saveRevision = () => {
    if (!draft.text.trim()) return;
    setDraft({ ...draft, revisions: [{ at: new Date().toISOString(), words, text: draft.text }, ...draft.revisions].slice(0, 15) });
    setNote(tx('Revision saved', 'Tahrir saqlandi'));
  };
  const buildOutline = () => {
    const a = draft.answers;
    const q = (k: string) => (a[k]?.trim() ? `“${a[k]!.trim().slice(0, 110)}${a[k]!.trim().length > 110 ? '…' : ''}”` : tx('(not answered yet)', '(hali javob berilmagan)'));
    setOutline([
      `1. ${tx('Opening — motivation', 'Kirish — qiziqish')}: ${q('why')} ${tx('+ the moment', '+ lahza')}: ${q('moment')}`,
      `2. ${tx('What you have done', 'Nima qilgansiz')}: ${q('explore')}`,
      `3. ${tx('Evidence', 'Dalil')}: ${q('project')}`,
      `4. ${tx('Growth', 'O‘sish')}: ${q('challenge')}`,
      `5. ${tx('Why this programme', 'Nega bu dastur')}: ${q('fit')}`,
      `6. ${tx('Goals', 'Maqsadlar')}: ${q('connect')} / ${q('future')}`,
    ]);
  };

  return (
    <div>
      <PageHeader eyebrow={tx('Application writing tutor', 'Ariza yozish yordamchisi')} title={tx('Write your own strong statement', 'O‘zingizning kuchli motivatsion xatingizni yozing')}>
        {tx('The tutor asks questions and points out issues. It does not write your statement for you, and it never invents experiences. You are responsible for your final submission.', 'Yordamchi savollar beradi va kamchiliklarni ko‘rsatadi. U xatni siz uchun yozmaydi va tajriba o‘ylab topmaydi. Yakuniy ariza uchun o‘zingiz javobgarsiz.')}
      </PageHeader>
      <div className="mb-5">
        <Tabs<Tab> label={tx('Writing tutor sections', 'Yozish yordamchisi bo‘limlari')} value={tab} onChange={setTab} tabs={[{ id: 'statement', label: tx('Personal statement', 'Motivatsion xat') }, { id: 'cv', label: tx('CV review', 'CV tekshiruvi') }, { id: 'final', label: tx('Final checklist', 'Yakuniy ro‘yxat') }]} />
      </div>

      {tab === 'statement' && (
        <div className="flex flex-col gap-5">
          <Card className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="flex flex-col gap-3">
              <Field label={tx('University or scholarship', 'Universitet yoki grant')}>
                <Select value={oppId} onChange={(e) => setOppId(e.target.value)}>
                  {options.map((o) => <option key={o.id} value={o.id}>{o.name} — {countryName(o.country)}</option>)}
                </Select>
              </Field>
              <Field label={tx('Word limit', 'So‘z chegarasi')}>
                <Input inputMode="numeric" value={limit ?? ''} onChange={(e) => setDraft({ ...draft, wordLimit: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : undefined })} />
              </Field>
              <p className="-mt-2 text-[12px] text-faint">{tx('Not stored — enter the official limit if you know it.', 'Saqlanmagan — rasmiy chegarani bilsangiz kiriting.')}</p>
            </div>
            <div className="flex flex-col gap-2 text-[14px]">
              <p className="eyebrow">{tx('Official prompt', 'Rasmiy savol')}</p>
              <p className="text-muted">{tx('No verified prompt is stored for this opportunity. Copy it from the official instructions; the structure of your essay should follow that prompt.', 'Bu imkoniyat uchun tasdiqlangan savol saqlanmagan. Uni rasmiy ko‘rsatmalardan oling; insho tuzilishi shu savolga mos bo‘lishi kerak.')}</p>
              <Notice>{tx('AI-use policy not verified. Check the official instructions before using any AI help.', 'SI dan foydalanish qoidasi tekshirilmagan. Har qanday SI yordamidan oldin rasmiy ko‘rsatmalarni tekshiring.')}</Notice>
            </div>
          </Card>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Card>
              <p className="flex items-center gap-2 font-bold"><Lightbulb size={17} aria-hidden />{tx('Plan with guided questions', 'Yo‘naltiruvchi savollar bilan rejalashtiring')}</p>
              <p className="mt-1 text-[13px] text-muted">{tx('Answer with real examples. Skip any question that does not fit the official prompt — not every essay follows the same structure.', 'Haqiqiy misollar bilan javob bering. Rasmiy savolga mos kelmaydiganini o‘tkazib yuboring — hamma insho bir xil tuzilmada bo‘lmaydi.')}</p>
              <div className="mt-4 flex flex-col gap-4">
                {QUESTIONS.map((q) => {
                  const a = draft.answers[q.id] ?? '';
                  const hint = answerHint(a);
                  return (
                    <div key={q.id}>
                      <Field label={pick(q.q)}>
                        <Textarea className="min-h-[64px]" value={a} onChange={(e) => setDraft({ ...draft, answers: { ...draft.answers, [q.id]: e.target.value } })} />
                      </Field>
                      <p className="mt-0.5 text-[12px] text-faint">{pick(q.area)}</p>
                      {hint && <p className="mt-1.5 flex gap-1.5 rounded-md bg-info-soft px-2.5 py-1.5 text-[13px] text-info"><Lightbulb size={15} className="mt-0.5 shrink-0" aria-hidden />{pick(hint)}</p>}
                    </div>
                  );
                })}
              </div>
              <Button className="mt-4" onClick={buildOutline}><ListTree size={16} aria-hidden />{tx('Build an outline from my answers', 'Javoblarimdan reja tuzish')}</Button>
              {outline && (
                <div className="mt-3 rounded-lg bg-sunken p-3 text-[13.5px]">
                  <p className="mb-1.5 font-semibold">{tx('Suggested outline (your own words, reordered)', 'Taklif etilgan reja (o‘z so‘zlaringiz, qayta tartiblangan)')}</p>
                  <ul className="flex flex-col gap-1.5">{outline.map((o) => <li key={o}>{o}</li>)}</ul>
                  <p className="mt-2 text-[12px] text-faint">{tx('Adapt the order to the official prompt.', 'Tartibni rasmiy savolga moslang.')}</p>
                </div>
              )}
            </Card>

            <div className="flex min-w-0 flex-col gap-4">
              <Card>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="w-text" className="font-bold">{tx('Your draft', 'Qoralamangiz')}</label>
                  <span className={cx('tabular text-[13px] font-semibold', limit && words > limit ? 'text-bad' : 'text-muted')}>{words}{limit ? ` / ${limit}` : ''} {tx('words', 'so‘z')}</span>
                </div>
                <Textarea id="w-text" className="min-h-[320px]" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} placeholder={tx('Write in the language the application requires. Feedback checks are tuned for English drafts.', 'Ariza talab qilgan tilda yozing. Tahlil ingliz tilidagi qoralamalarga moslangan.')} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="primary" onClick={runReview}><SearchCheck size={16} aria-hidden />{tx('Review my draft', 'Qoralamani tekshirish')}</Button>
                  <Button onClick={saveRevision} disabled={!draft.text.trim()}><Save size={16} aria-hidden />{tx('Save revision', 'Tahrirni saqlash')}</Button>
                  <a href={href('assistant', 'docs')} className={buttonClass('secondary')}>{tx('Full analysis in the AI advisor', 'SI maslahatchida to‘liq tahlil')}</a>
                </div>
                <p className="mt-2 text-[12.5px] text-faint">{tx('Built-in feedback is rule-based and works offline. Your draft stays in this browser.', 'Ichki tahlil qoidalarga asoslangan va oflayn ishlaydi. Qoralama shu brauzerda qoladi.')}</p>
                {note && <p role="status" className="mt-2 text-[13px] font-semibold">{note}</p>}
              </Card>

              {review && (
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">{tx('Feedback', 'Tahlil')}</p>
                    <p className="tabular text-[12.5px] text-muted">{review.words} {tx('words', 'so‘z')} · {review.sentences} {tx('sentences', 'gap')} · {review.paragraphs} {tx('paragraphs', 'xatboshi')}</p>
                  </div>
                  {review.strengths.length > 0 && <ul className="mt-2 flex flex-col gap-1">{review.strengths.map((s, i) => <li key={i} className="flex gap-2 text-[13.5px]"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden />{pick(s)}</li>)}</ul>}
                  <ol className="mt-3 flex flex-col gap-3">
                    {review.issues.map((s) => (
                      <li key={s.id} className="rounded-lg border border-line p-3">
                        <div className="flex items-start gap-2">
                          <Badge tone={s.severity === 'high' ? 'bad' : s.severity === 'medium' ? 'warn' : 'neutral'}>{s.severity === 'high' ? tx('High', 'Muhim') : s.severity === 'medium' ? tx('Medium', 'O‘rta') : tx('Low', 'Kichik')}</Badge>
                          <p className="font-semibold">{pick(s.issue)}</p>
                        </div>
                        <dl className="mt-2 grid gap-1.5 text-[13.5px]">
                          <div><dt className="inline font-semibold">{tx('Why it matters: ', 'Nima uchun muhim: ')}</dt><dd className="inline text-muted">{pick(s.why)}</dd></div>
                          <div><dt className="inline font-semibold">{tx('Ask yourself: ', 'O‘zingizdan so‘rang: ')}</dt><dd className="inline text-muted">{pick(s.question)}</dd></div>
                          <div><dt className="inline font-semibold">{tx('Strategy: ', 'Strategiya: ')}</dt><dd className="inline text-muted">{pick(s.strategy)}</dd></div>
                          {s.example && <div className="rounded-md bg-sunken px-2.5 py-1.5 text-[13px]">{pick(s.example)}</div>}
                        </dl>
                      </li>
                    ))}
                  </ol>
                  {review.issues.length === 0 && <p className="mt-2 text-[14px] text-ok">{tx('No issues found by the automatic checks. Ask a teacher to read it too.', 'Avtomatik tekshiruv kamchilik topmadi. Ustozingizga ham o‘qitib ko‘ring.')}</p>}
                </Card>
              )}

              <Card>
                <p className="flex items-center gap-2 font-bold"><History size={16} aria-hidden />{tx('Revision history', 'Tahrirlar tarixi')}</p>
                {draft.revisions.length === 0 ? <p className="mt-1 text-[13.5px] text-muted">{tx('Save a revision to keep a copy you can return to.', 'Qaytish mumkin bo‘lgan nusxa uchun tahrirni saqlang.')}</p> : (
                  <ul className="mt-2 flex flex-col">
                    {draft.revisions.map((r) => (
                      <li key={r.at} className="flex items-center justify-between gap-2 border-b border-line py-2 text-[13.5px] last:border-0">
                        <span className="tabular">{new Date(r.at).toLocaleString(lang === 'uz' ? 'uz-UZ' : lang === 'ru' ? 'ru-RU' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })} · {r.words} {tx('words', 'so‘z')}</span>
                        <Button size="sm" variant="ghost" onClick={() => { setDraft({ ...draft, text: r.text }); setNote(tx('Revision restored into the editor', 'Tahrir muharrirga tiklandi')); }}><RotateCcw size={14} aria-hidden />{tx('Restore', 'Tiklash')}</Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {tab === 'cv' && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Card>
            <Field label={tx('Paste your CV text', 'CV matnini joylashtiring')}>
              <Textarea className="min-h-[360px] font-mono text-[13px]" value={cv} onChange={(e) => patchWorkspace({ cv: e.target.value })} />
            </Field>
            <p className="mt-1 text-[12px] text-faint">{tx('Saved in this browser, and in your account when you are signed in.', 'Shu brauzerda saqlanadi, kirgan bo‘lsangiz akkauntingizda ham.')}</p>
          </Card>
          <Card>
            <p className="font-bold">{tx('CV review', 'CV tahlili')}</p>
            {cv.trim() ? (
              <>
                <p className="eyebrow mb-1.5 mt-3">{tx('Sections found', 'Topilgan bo‘limlar')}</p>
                <div className="flex flex-wrap gap-1.5">{cvr.found.map((s) => <Badge key={s.en} tone="ok">{pick(s)}</Badge>)}</div>
                <p className="eyebrow mb-1.5 mt-3">{tx('Consider adding (only if you have real content)', 'Qo‘shishni o‘ylang (faqat haqiqiy mazmun bo‘lsa)')}</p>
                <div className="flex flex-wrap gap-1.5">{cvr.missing.map((s) => <Badge key={s.en}>{pick(s)}</Badge>)}</div>
                <ul className="mt-3 flex flex-col gap-2 text-[14px]">{cvr.notes.map((n, i) => <li key={i} className="flex gap-2"><CircleHelp size={16} className="mt-0.5 shrink-0 text-info" aria-hidden />{pick(n)}</li>)}</ul>
              </>
            ) : <p className="mt-2 text-[14px] text-muted">{tx('Paste your CV to see which sections are present and what to improve.', 'Qaysi bo‘limlar borligini va nimani yaxshilash kerakligini ko‘rish uchun CV ni joylashtiring.')}</p>}
          </Card>
        </div>
      )}

      {tab === 'final' && (
        <Card>
          <p className="font-bold">{tx('Before you submit your statement', 'Motivatsion xatni topshirishdan oldin')}</p>
          <ul className="mt-3 flex flex-col gap-2.5 text-[14.5px]">
            {[tx('It answers the official prompt, in the order it asks.', 'U rasmiy savolga, so‘ralgan tartibda javob beradi.'), tx('Every claim about you is supported by a real example.', 'Siz haqingizdagi har bir da’vo haqiqiy misol bilan tasdiqlangan.'), tx('Every experience described really happened, in the way you describe it.', 'Tasvirlangan har bir tajriba haqiqatda siz aytgandek bo‘lgan.'), tx('It explains why this specific programme or scholarship fits your goals.', 'Nega aynan shu dastur yoki grant maqsadlaringizga mosligini tushuntiradi.'), tx('It is within the word or character limit.', 'So‘z yoki belgi chegarasi doirasida.'), tx('You followed the institution’s rules on AI use.', 'Muassasaning SI dan foydalanish qoidalariga amal qildingiz.'), tx('Someone you trust has read it.', 'Ishonchli odam uni o‘qib chiqdi.'), tx('You proofread it slowly, out loud.', 'Uni sekin, ovoz chiqarib tekshirdingiz.')].map((x) => (
              <li key={x} className="flex gap-2"><CircleHelp size={16} className="mt-0.5 shrink-0 text-info" aria-hidden />{x}</li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] text-muted">{tx('Authenticity: reviewers read thousands of statements. Your own voice and specific details matter more than impressive vocabulary.', 'Haqqoniylik: baholovchilar minglab xat o‘qiydi. Murakkab so‘zlardan ko‘ra o‘z ovozingiz va aniq tafsilotlar muhimroq.')}</p>
        </Card>
      )}
    </div>
  );
}
