import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { Badge, Card, Notice, cx } from '../components/ui';

export type Quote = { quote: string; found: boolean };
type Score = { key: string; score: number | null; reason: string };

export const READINESS_TONE = { not_ready: 'bad', substantial_revision: 'bad', moderate_improvement: 'warn', nearly_ready: 'info', final_proofreading: 'ok' } as const;

export function useReadinessLabel() {
  const { tx } = useI18n();
  return (r: string) =>
    ({
      not_ready: tx('Not ready', 'Tayyor emas'),
      substantial_revision: tx('Needs substantial revision', 'Jiddiy qayta ishlash kerak'),
      moderate_improvement: tx('Needs moderate improvement', 'O‘rtacha yaxshilash kerak'),
      nearly_ready: tx('Nearly ready', 'Deyarli tayyor'),
      final_proofreading: tx('Ready for final proofreading', 'Yakuniy tekshiruvga tayyor'),
    })[r] ?? r;
}

export function QuoteText({ q }: { q: Quote | null | undefined }) {
  const { tx } = useI18n();
  if (!q || !q.quote) return null;
  return (
    <span className="block">
      <span className="block border-l-2 border-line pl-2.5 italic">“{q.quote}”</span>
      {!q.found && (
        <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-warn">
          <AlertTriangle size={12} aria-hidden />
          {tx('This exact wording was not found in your document — check it yourself.', 'Bu aniq jumla hujjatingizda topilmadi — o‘zingiz tekshiring.')}
        </span>
      )}
    </span>
  );
}

function ScoreGrid({ scores }: { scores: Score[] }) {
  const { tx } = useI18n();
  const names: Record<string, string> = {
    structure: tx('Structure and readability', 'Tuzilma va o‘qilishi'),
    academic: tx('Academic presentation / relevance', 'Akademik taqdimot / bog‘liqlik'),
    experience: tx('Relevant experience', 'Tegishli tajriba'),
    impact: tx('Achievements and impact', 'Yutuqlar va natija'),
    skills: tx('Skills and qualifications', 'Ko‘nikma va malakalar'),
    language: tx('Language and professionalism', 'Til va professionallik'),
    relevance: tx('Relevance to the target', 'Maqsadga moslik'),
    authenticity: tx('Authenticity and motivation', 'Samimiylik va motivatsiya'),
    fit: tx('Programme / university fit', 'Dastur va universitetga moslik'),
    evidence: tx('Evidence and examples', 'Dalil va misollar'),
    career: tx('Career objectives', 'Karyera maqsadlari'),
    writing: tx('Writing quality', 'Yozuv sifati'),
    compliance: tx('Compliance with requirements', 'Talablarga muvofiqlik'),
    clarity: tx('Clarity', 'Aniqlik'),
    communication: tx('Communication (written only)', 'Muloqot (faqat yozma matn bo‘yicha)'),
    alignment: tx('Alignment with goals', 'Maqsadlarga moslik'),
  };
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {scores.map((s) => (
        <li key={s.key} className="rounded-lg border border-line p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-bold">{names[s.key] ?? s.key}</span>
            <span className={cx('text-[15px] font-extrabold', s.score == null ? 'text-muted' : s.score >= 8 ? 'text-ok' : s.score >= 5 ? 'text-warn' : 'text-bad')}>{s.score == null ? '—' : `${s.score}/10`}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken" aria-hidden>
            <div className={cx('h-full rounded-full', s.score == null ? '' : s.score >= 8 ? 'bg-ok' : s.score >= 5 ? 'bg-warn' : 'bg-bad')} style={{ width: `${(s.score ?? 0) * 10}%` }} />
          </div>
          {s.reason ? <p className="mt-1.5 text-[12.5px] text-muted">{s.reason}</p> : s.score == null && <p className="mt-1.5 text-[12.5px] text-muted">{tx('Not assessed', 'Baholanmadi')}</p>}
        </li>
      ))}
    </ul>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-4">
      <h3 className="mb-2 text-[15px] font-extrabold">{title}</h3>
      <div className="text-sm leading-relaxed">{children}</div>
    </section>
  );
}

const List = ({ items }: { items: string[] }) => (items.length ? <ul className="list-disc space-y-1 pl-5">{items.map((x, i) => <li key={i}>{x}</li>)}</ul> : null);

/** The result of a CV or letter analysis (validated on the server; quotes are checked against the student's text). */
export function AnalysisView({ result }: { result: any }) {
  const { tx } = useI18n();
  const label = useReadinessLabel();
  const isCv = result.kind === 'cv';
  const summary: string = isCv ? result.overall : result.verdict;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={READINESS_TONE[result.readiness as keyof typeof READINESS_TONE] ?? 'warn'}>{label(result.readiness)}</Badge>
        {result.reviewed && <Badge tone="brand">{tx('Checked by a second reader', 'Ikkinchi o‘quvchi tekshirgan')}</Badge>}
      </div>
      <p className="text-[15px] font-semibold leading-relaxed">{summary}</p>
      {result.firstImpression && <p className="text-sm text-muted"><span className="font-semibold text-fg">{tx('First impression', 'Birinchi taassurot')}: </span>{result.firstImpression}</p>}
      <Notice>{tx('Scores are advisory, not an official rating. EduBridge never estimates your chance of admission or of a scholarship.', 'Ballar maslahat xarakterida, rasmiy baho emas. EduBridge qabul yoki grant olish ehtimolini hech qachon baholamaydi.')}</Notice>

      <ScoreGrid scores={result.scores} />

      {result.reviewed && result.audit?.length > 0 && (
        <Block title={tx('What the second reader changed', 'Ikkinchi o‘quvchi nimani o‘zgartirdi')}><List items={result.audit} /></Block>
      )}

      {!isCv && result.fourQuestions?.length > 0 && (
        <Block title={tx('The four questions every reader asks', 'Har bir o‘quvchi beradigan to‘rt savol')}>
          <ul className="space-y-1.5">
            {result.fourQuestions.map((q: any, i: number) => (
              <li key={i}>
                <Badge tone={q.answered === 'yes' ? 'ok' : q.answered === 'partly' ? 'warn' : 'bad'}>{q.answered === 'yes' ? tx('answered', 'javob berilgan') : q.answered === 'partly' ? tx('partly', 'qisman') : tx('not answered', 'javob yo‘q')}</Badge>{' '}
                <span className="font-semibold">{q.question}</span>
                {q.comment && <span className="block text-muted">{q.comment}</span>}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {result.redFlags?.length > 0 && (
        <Block title={tx('Red flags', 'Xavfli belgilar')}>
          <ul className="space-y-2">
            {result.redFlags.map((f: any, i: number) => (
              <li key={i}>
                <Badge tone={f.severity === 'high' ? 'bad' : f.severity === 'medium' ? 'warn' : 'neutral'}>{f.severity}</Badge> <span className="font-semibold">{f.flag}</span>
                <QuoteText q={f.quote} />
              </li>
            ))}
          </ul>
        </Block>
      )}

      {result.claims?.length > 0 && (
        <Block title={tx('Claims and their evidence', 'Da’volar va ularning dalili')}>
          <ul className="space-y-2">
            {result.claims.map((c: any, i: number) => (
              <li key={i}>
                <Badge tone={c.verdict === 'supported' ? 'ok' : c.verdict === 'weak' ? 'warn' : 'bad'}>{c.verdict === 'supported' ? tx('supported', 'tasdiqlangan') : c.verdict === 'weak' ? tx('weak', 'zaif') : tx('unsupported', 'dalilsiz')}</Badge> {c.claim}
                <QuoteText q={c.evidence} />
              </li>
            ))}
          </ul>
        </Block>
      )}

      {isCv && result.strengths?.length > 0 && (
        <Block title={tx('Strengths', 'Kuchli tomonlar')}>
          <ul className="space-y-2">{result.strengths.map((s: any, i: number) => <li key={i}><span className="font-semibold">{s.point}</span>{s.why && <span className="text-muted"> — {s.why}</span>}<QuoteText q={s.evidence} /></li>)}</ul>
        </Block>
      )}
      {isCv && result.weaknesses?.length > 0 && (
        <Block title={tx('Weaknesses', 'Zaif tomonlar')}>
          <ul className="space-y-2">{result.weaknesses.map((s: any, i: number) => <li key={i}><span className="font-semibold">{s.point}</span>{s.consequence && <span className="text-muted"> — {s.consequence}</span>}<QuoteText q={s.evidence} /></li>)}</ul>
        </Block>
      )}
      {isCv && result.sections?.length > 0 && (
        <Block title={tx('Section by section', 'Bo‘limma-bo‘lim')}>
          <ul className="space-y-2">{result.sections.map((s: any, i: number) => <li key={i}><span className="font-semibold">{s.section}</span>: {s.assessment}<List items={s.issues} /></li>)}</ul>
        </Block>
      )}

      {!isCv && result.works?.length > 0 && <Block title={tx('What works', 'Nima yaxshi ishlaydi')}><ul className="space-y-2">{result.works.map((w: any, i: number) => <li key={i}><QuoteText q={w.quote} /><span className="text-muted">{w.why}</span></li>)}</ul></Block>}
      {!isCv && result.weakens?.length > 0 && <Block title={tx('What weakens it', 'Nima zaiflashtiradi')}><ul className="space-y-2">{result.weakens.map((w: any, i: number) => <li key={i}><QuoteText q={w.quote} /><span>{w.why}</span>{w.fix && <span className="block text-muted">{tx('Fix', 'Tuzatish')}: {w.fix}</span>}</li>)}</ul></Block>}
      {!isCv && result.generic?.length > 0 && <Block title={tx('Sentences anyone could write', 'Istalgan odam yoza oladigan jumlalar')}><ul className="space-y-2">{result.generic.map((w: any, i: number) => <li key={i}><QuoteText q={w.quote} /><span>{w.why}</span>{w.ask && <span className="block font-semibold">{w.ask}</span>}</li>)}</ul></Block>}
      {!isCv && result.paragraphs?.length > 0 && <Block title={tx('Paragraph by paragraph', 'Abzatsma-abzats')}><ul className="space-y-2">{result.paragraphs.map((p: any, i: number) => <li key={i}><span className="font-semibold">[{p.n}] {p.role}</span>: {p.assessment}<List items={p.issues} /></li>)}</ul></Block>}
      {!isCv && result.compliance && (
        <Block title={tx('Compliance with the prompt and instructions', 'Savol va ko‘rsatmalarga muvofiqlik')}>
          <Badge tone={result.compliance.status === 'met' ? 'ok' : result.compliance.status === 'issues' ? 'bad' : 'neutral'}>{result.compliance.status === 'met' ? tx('met', 'bajarilgan') : result.compliance.status === 'issues' ? tx('issues', 'muammolar bor') : tx('cannot confirm', 'tasdiqlab bo‘lmaydi')}</Badge>
          <List items={result.compliance.notes} />
        </Block>
      )}
      {!isCv && result.missing?.length > 0 && <Block title={tx('Consider adding', 'Qo‘shishni o‘ylab ko‘ring')}><List items={result.missing} /></Block>}

      {result.improvements?.length > 0 && (
        <Block title={tx('What to change first', 'Avval nimani o‘zgartirish kerak')}>
          <ol className="list-decimal space-y-1.5 pl-5">{result.improvements.map((x: any, i: number) => <li key={i}><span className="font-semibold">{x.change}</span>{x.why && <span className="text-muted"> — {x.why}</span>}</li>)}</ol>
        </Block>
      )}

      {isCv && result.rewrites?.length > 0 && (
        <Block title={tx('Suggested rewrites (keep your own facts)', 'Tavsiya etilgan qayta yozishlar (o‘z faktlaringizni saqlang)')}>
          <ul className="space-y-3">
            {result.rewrites.map((r: any, i: number) => (
              <li key={i} className="rounded-lg border border-line p-3">
                <QuoteText q={r.original} />
                <p className="mt-1 font-semibold">→ {r.improved}</p>
                {r.why && <p className="text-muted">{r.why}</p>}
                {r.missingInfo && <p className="text-warn">{tx('You need to fill in', 'To‘ldirishingiz kerak')}: {r.missingInfo}</p>}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {isCv && result.actionPlan?.length > 0 && <Block title={tx('Action plan', 'Harakat rejasi')}><ol className="list-decimal space-y-1 pl-5">{result.actionPlan.map((x: string, i: number) => <li key={i}>{x}</li>)}</ol></Block>}
      {result.questions?.length > 0 && <Block title={tx('Questions for you', 'Sizga savollar')}><List items={result.questions} /></Block>}
      {result.limits?.length > 0 && <Block title={tx('What could not be assessed', 'Nimani baholab bo‘lmadi')}><List items={result.limits} /></Block>}
    </Card>
  );
}

export { ScoreGrid };
