import { useCallback, useState } from 'react';
import { SaveAsDemo } from '../../admin/SaveDemo';
import { Trash2 } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { aiJson } from '../../lib/ai';
import { formatDate } from '../../lib/format';
import { Badge, Button, Card, Field, Select } from '../../components/ui';
import { AiError, AiGate, Thinking } from '../../ai/AiGate';
import { ScoreGrid } from '../../ai/AnalysisView';
import { NO_TARGET, TargetPicker, toApiTarget, type Target } from '../../ai/TargetPicker';
import { useAiAction } from '../../ai/useAi';
import { useStore } from '../../store/AppStore';
import { useCollection, type Versioned } from '../../ai/useCollection';
import type { Doc } from './DocsTab';

type Feedback = { effective: string[]; weak: string[]; missing: string[]; improve: string[]; stronger: string; strongerNote: string; scores: Array<{ key: string; score: number | null; reason: string }>; followUp: string | null };
type Q = { q: string; why: string; answer: string; feedback: Feedback | null };
type InterviewData = { kind: 'scholarship' | 'university'; target: Target; questions: Q[]; idx: number; createdAt: string };
type Interview = Versioned & { data: InterviewData };

const average = (qs: Q[], key: string) => {
  const v = qs.map((q) => q.feedback?.scores.find((s) => s.key === key)?.score).filter((x): x is number => typeof x === 'number');
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
};

export function InterviewTab() {
  const { tx, lang } = useI18n();
  const profile = useStore().profile ?? undefined;
  const list = useCollection<Interview>('interviews');
  const docs = useCollection<Doc>('documents');
  const [kind, setKind] = useState<'scholarship' | 'university'>('scholarship');
  const [target, setTarget] = useState<Target>(NO_TARGET);
  const [count, setCount] = useState(5);
  const [bgDoc, setBgDoc] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');

  const open = list.items.find((i) => i.id === openId) ?? null;
  const background = () => (bgDoc ? docs.items.find((d) => d.id === bgDoc)?.workingText.slice(0, 8000) : undefined);

  const start = useAiAction(
    useCallback(
      async (signal: AbortSignal) => {
        const r = await aiJson<{ questions: Array<{ q: string; why: string }> }>({ task: 'interview_questions', lang, profile, kind, target: toApiTarget(target), count, background: background() }, signal);
        const row = await list.create({ data: { kind, target: toApiTarget(target), questions: r.result.questions.map((q) => ({ ...q, answer: '', feedback: null })), idx: 0, createdAt: new Date().toISOString() } });
        setOpenId(row.id);
        setAnswer('');
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [lang, kind, target, count, bgDoc, docs.items, list],
    ),
  );

  const judge = useAiAction(
    useCallback(
      async (signal: AbortSignal) => {
        if (!open) return;
        const d = open.data;
        const q = d.questions[d.idx]!;
        const earlier = d.questions.slice(0, d.idx).filter((x) => x.answer).map((x) => ({ q: x.q, a: x.answer }));
        const r = await aiJson<Feedback>({ task: 'interview_feedback', lang, profile, target: d.target, question: q.q, answer, background: background(), earlier }, signal);
        const questions = d.questions.map((x, i) => (i === d.idx ? { ...x, answer, feedback: r.result } : x));
        await list.update(open.id, open.version, { data: { ...d, questions } });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [lang, open, answer, bgDoc, docs.items, list],
    ),
  );

  const next = async () => {
    if (!open) return;
    await list.update(open.id, open.version, { data: { ...open.data, idx: open.data.idx + 1 } });
    setAnswer('');
  };

  return (
    <AiGate>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-2">
          <Button className="w-full" variant="primary" onClick={() => setOpenId(null)}>{tx('New interview', 'Yangi suhbat')}</Button>
          <ul className="space-y-1" aria-label={tx('Your practice interviews', 'Mashq suhbatlaringiz')}>
            {list.items.map((i) => (
              <li key={i.id} className="flex items-center gap-1">
                <button type="button" className={`min-h-[44px] flex-1 truncate rounded-lg px-2 text-left text-sm hover:bg-sunken ${openId === i.id ? 'bg-brand-soft' : ''}`} onClick={() => { setOpenId(i.id); setAnswer(i.data.questions[i.data.idx]?.answer ?? ''); }}>
                  {i.data.kind === 'scholarship' ? tx('Scholarship interview', 'Grant suhbati') : tx('University interview', 'Universitet suhbati')} · {formatDate(i.data.createdAt, lang)}
                </button>
                <button type="button" aria-label={tx('Delete', 'O‘chirish')} className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-sunken" onClick={() => { void list.remove(i.id); if (openId === i.id) setOpenId(null); }}><Trash2 size={15} aria-hidden /></button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="space-y-4">
          {!open && (
            <Card className="space-y-3">
              <h2 className="font-extrabold">{tx('Practise an interview', 'Suhbatga tayyorlaning')}</h2>
              <p className="text-sm text-muted">{tx('You get realistic questions one at a time and honest feedback on each written answer. The feedback judges the written text only — it cannot judge your voice or body language.', 'Siz real savollarni birma-bir olasiz va har bir yozma javobga halol fikr-mulohaza. Baho faqat yozma matnga beriladi — ovoz yoki tana tilini baholay olmaydi.')}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={tx('Type', 'Turi')}><Select value={kind} onChange={(e) => setKind(e.target.value as 'scholarship' | 'university')}><option value="scholarship">{tx('Scholarship interview', 'Grant suhbati')}</option><option value="university">{tx('University interview', 'Universitet suhbati')}</option></Select></Field>
                <Field label={tx('Number of questions', 'Savollar soni')}><Select value={count} onChange={(e) => setCount(Number(e.target.value))}>{[3, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}</Select></Field>
                {docs.items.length > 0 && <Field label={tx('Use a document as background (optional)', 'Fon uchun hujjat (ixtiyoriy)')}><Select value={bgDoc} onChange={(e) => setBgDoc(e.target.value)}><option value="">{tx('No', 'Yo‘q')}</option>{docs.items.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</Select></Field>}
              </div>
              <TargetPicker value={target} onChange={setTarget} />
              <Button variant="primary" disabled={start.busy} onClick={() => void start.run()}>{tx('Start', 'Boshlash')}</Button>
              {start.busy && <Thinking onStop={start.stop} />}
              <AiError error={start.error} />
              <p className="text-xs text-muted">{tx('Interview questions are in English.', 'Suhbat savollari ingliz tilida.')}</p>
            </Card>
          )}

          {open && open.data.idx < open.data.questions.length && (
            <Card className="space-y-3">
              {(() => {
                const d = open.data;
                const q = d.questions[d.idx]!;
                return (
                  <>
                    <p className="text-xs font-semibold text-muted">{tx('Question {0} of {1}', '{0}-savol / {1}', d.idx + 1, d.questions.length)}</p>
                    <h2 className="text-lg font-extrabold">{q.q}</h2>
                    {q.why && <p className="text-sm text-muted">{tx('What the panel is testing', 'Hay’at nimani tekshiradi')}: {q.why}</p>}
                    <Field label={tx('Your answer', 'Javobingiz')}>
                      <textarea className="min-h-[140px] w-full rounded-xl border border-line bg-surface p-3 text-sm" maxLength={6000} value={answer} disabled={!!q.feedback} onChange={(e) => setAnswer(e.target.value)} />
                    </Field>
                    {!q.feedback ? (
                      <Button variant="primary" disabled={judge.busy || !answer.trim()} onClick={() => void judge.run()}>{tx('Get feedback', 'Fikr-mulohaza olish')}</Button>
                    ) : (
                      <>
                      <FeedbackView fb={q.feedback} onNext={() => void next()} last={d.idx === d.questions.length - 1} />
                      <SaveAsDemo kind="interview_feedback" payload={{ question: q.q, why: q.why, feedback: q.feedback }} suggestedTitle={`Interview feedback: ${q.q.slice(0, 60)}`} />
                      </>
                    )}
                    {judge.busy && <Thinking onStop={judge.stop} />}
                    <AiError error={judge.error} />
                  </>
                );
              })()}
            </Card>
          )}

          {open && open.data.idx >= open.data.questions.length && <Summary data={open.data} />}
        </div>
      </div>
    </AiGate>
  );
}

function FeedbackView({ fb, onNext, last }: { fb: Feedback; onNext: () => void; last: boolean }) {
  const { tx } = useI18n();
  const L = ({ title, items }: { title: string; items: string[] }) => (items.length ? <div><h3 className="font-bold">{title}</h3><ul className="list-disc pl-5 text-sm">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null);
  return (
    <div className="space-y-3 border-t border-line pt-3">
      <ScoreGrid scores={fb.scores} />
      <L title={tx('What worked', 'Nima yaxshi ishladi')} items={fb.effective} />
      <L title={tx('What was weak', 'Nima zaif edi')} items={fb.weak} />
      <L title={tx('What was missing', 'Nima yetishmadi')} items={fb.missing} />
      <L title={tx('How to improve', 'Qanday yaxshilash mumkin')} items={fb.improve} />
      {fb.stronger && (
        <div className="rounded-xl bg-sunken p-3 text-sm">
          <h3 className="font-bold">{tx('A stronger answer (example)', 'Kuchliroq javob (namuna)')}</h3>
          <p className="mt-1 whitespace-pre-wrap">{fb.stronger}</p>
          {fb.strongerNote && <p className="mt-1 text-muted">{fb.strongerNote}</p>}
        </div>
      )}
      {fb.followUp && <p className="text-sm"><span className="font-bold">{tx('The panel might ask next', 'Hay’at keyin so‘rashi mumkin')}: </span>{fb.followUp}</p>}
      <Button variant="primary" onClick={onNext}>{last ? tx('See summary', 'Xulosani ko‘rish') : tx('Next question', 'Keyingi savol')}</Button>
    </div>
  );
}

function Summary({ data }: { data: InterviewData }) {
  const { tx } = useI18n();
  const keys = ['clarity', 'authenticity', 'relevance', 'evidence', 'communication', 'alignment'];
  return (
    <Card className="space-y-3">
      <h2 className="font-extrabold">{tx('Interview summary', 'Suhbat xulosasi')}</h2>
      <ScoreGrid scores={keys.map((k) => ({ key: k, score: average(data.questions, k), reason: '' }))} />
      <ul className="space-y-2 text-sm">
        {data.questions.map((q, i) => <li key={i}><Badge>{i + 1}</Badge> <span className="font-semibold">{q.q}</span>{q.feedback?.improve[0] && <span className="block text-muted">{q.feedback.improve[0]}</span>}</li>)}
      </ul>
      <p className="text-xs text-muted">{tx('Scores are advisory and based on the written text only.', 'Ballar maslahat xarakterida va faqat yozma matnga asoslangan.')}</p>
    </Card>
  );
}
