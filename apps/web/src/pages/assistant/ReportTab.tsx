import { useCallback, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { aiJson } from '../../lib/ai';
import { formatDate } from '../../lib/format';
import { Badge, Button, Card, Field, Notice, Select } from '../../components/ui';
import { AiError, AiGate, Thinking } from '../../ai/AiGate';
import { QuoteText, READINESS_TONE, useReadinessLabel } from '../../ai/AnalysisView';
import { useAiAction } from '../../ai/useAi';
import { useCollection } from '../../ai/useCollection';
import { useDocKindLabel, type Doc } from './DocsTab';
import { href } from '../../lib/router';

const ORDER = ['not_ready', 'substantial_revision', 'moderate_improvement', 'nearly_ready', 'final_proofreading'] as const;
const avg = (scores: Array<{ score: number | null }>) => {
  const v = scores.map((s) => s.score).filter((x): x is number => typeof x === 'number');
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
};

export function ReportTab() {
  const { tx, lang } = useI18n();
  const docs = useCollection<Doc>('documents');
  const readiness = useReadinessLabel();
  const kindLabel = useDocKindLabel();
  const [cvId, setCvId] = useState('');
  const [letterId, setLetterId] = useState('');
  const [check, setCheck] = useState<any | null>(null);

  const analysed = docs.items.filter((d) => d.analysis);
  const cvs = docs.items.filter((d) => d.kind === 'cv');
  const letters = docs.items.filter((d) => d.kind !== 'cv');
  const weakest = analysed.length ? analysed.reduce((a, b) => (ORDER.indexOf(a.analysis!.result.readiness) <= ORDER.indexOf(b.analysis!.result.readiness) ? a : b)) : null;
  const topFixes = analysed
    .map((d) => ({ doc: d, fix: (d.analysis!.result.improvements as Array<{ change: string }> | undefined)?.[0]?.change }))
    .filter((x) => x.fix);

  const consistency = useAiAction(
    useCallback(
      async (signal: AbortSignal) => {
        const cv = cvs.find((d) => d.id === cvId);
        const letter = letters.find((d) => d.id === letterId);
        if (!cv || !letter) return;
        const r = await aiJson<any>({ task: 'consistency', lang, letterType: letter.kind, cv: cv.workingText, letter: letter.workingText }, signal);
        setCheck({ cv: cv.title, letter: letter.title, result: r.result });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [lang, cvId, letterId, docs.items],
    ),
  );

  return (
    <AiGate>
      <div className="space-y-4">
        <Card className="space-y-3">
          <h2 className="font-extrabold">{tx('Readiness across your documents', 'Hujjatlaringiz bo‘yicha tayyorlik')}</h2>
          {analysed.length === 0 ? (
            <p className="text-sm text-muted">{tx('No analysed documents yet.', 'Hozircha tahlil qilingan hujjat yo‘q.')} <a href={href('assistant', 'docs')}>{tx('Analyse a document', 'Hujjatni tahlil qilish')} →</a></p>
          ) : (
            <>
              {weakest && (
                <p className="text-sm">
                  {tx('Your weakest document right now', 'Hozir eng zaif hujjatingiz')}: <span className="font-semibold">{weakest.title}</span> — <Badge tone={READINESS_TONE[weakest.analysis!.result.readiness as keyof typeof READINESS_TONE]}>{readiness(weakest.analysis!.result.readiness)}</Badge>
                </p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse text-sm">
                  <thead><tr className="text-left text-muted"><th className="p-2">{tx('Document', 'Hujjat')}</th><th className="p-2">{tx('Type', 'Turi')}</th><th className="p-2">{tx('Readiness', 'Tayyorlik')}</th><th className="p-2">{tx('Average score', 'O‘rtacha ball')}</th><th className="p-2">{tx('Analysed', 'Tahlil sanasi')}</th></tr></thead>
                  <tbody>
                    {analysed.map((d) => (
                      <tr key={d.id} className="border-t border-line">
                        <td className="p-2 font-semibold">{d.title}</td>
                        <td className="p-2">{kindLabel(d.kind)}</td>
                        <td className="p-2"><Badge tone={READINESS_TONE[d.analysis!.result.readiness as keyof typeof READINESS_TONE]}>{readiness(d.analysis!.result.readiness)}</Badge></td>
                        <td className="p-2">{avg(d.analysis!.result.scores) ?? '—'}</td>
                        <td className="p-2">{formatDate(d.analysis!.at, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {topFixes.length > 0 && (
                <div>
                  <h3 className="font-bold">{tx('The first thing to fix in each document', 'Har bir hujjatda birinchi tuzatish')}</h3>
                  <ul className="list-disc pl-5 text-sm">{topFixes.map((x) => <li key={x.doc.id}><span className="font-semibold">{x.doc.title}</span>: {x.fix}</li>)}</ul>
                </div>
              )}
              <p className="text-xs text-muted">{tx('Readiness is an advisory reading of the text, not an official rating and not a prediction of admission.', 'Tayyorlik — matnning maslahat xarakteridagi bahosi, rasmiy reyting yoki qabul prognozi emas.')}</p>
            </>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="font-extrabold">{tx('Do your CV and letter tell one story?', 'CV va xatingiz bitta hikoyani aytyaptimi?')}</h2>
          {cvs.length === 0 || letters.length === 0 ? (
            <p className="text-sm text-muted">{tx('Add a CV and a letter (motivation letter, statement or essay) to check them against each other.', 'Ularni bir-biriga solishtirish uchun CV va xat (motivatsion xat, bayonot yoki insho) qo‘shing.')}</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="CV"><Select value={cvId} onChange={(e) => setCvId(e.target.value)}><option value="">—</option>{cvs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</Select></Field>
                <Field label={tx('Letter', 'Xat')}><Select value={letterId} onChange={(e) => setLetterId(e.target.value)}><option value="">—</option>{letters.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</Select></Field>
              </div>
              <Button variant="primary" disabled={!cvId || !letterId || consistency.busy} onClick={() => void consistency.run()}>{tx('Check consistency', 'Mosligini tekshirish')}</Button>
              {consistency.busy && <Thinking onStop={consistency.stop} />}
              <AiError error={consistency.error} />
            </>
          )}
          {check && (
            <div className="space-y-3 border-t border-line pt-3 text-sm">
              <p className="font-semibold">{check.result.summary}</p>
              {check.result.consistent.length > 0 && <div><h3 className="font-bold">{tx('Where they agree', 'Qayerda mos keladi')}</h3><ul className="list-disc pl-5">{check.result.consistent.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></div>}
              {check.result.inconsistencies.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-1 font-bold"><AlertTriangle size={14} aria-hidden /> {tx('Possible inconsistencies — please verify', 'Mumkin bo‘lgan nomuvofiqliklar — tekshirib ko‘ring')}</h3>
                  <ul className="space-y-3">
                    {check.result.inconsistencies.map((x: any, i: number) => (
                      <li key={i} className="rounded-lg border border-line p-3">
                        <p className="font-semibold">{x.issue}</p>
                        {x.cvQuote && <p><span className="text-muted">CV: </span><QuoteText q={x.cvQuote} /></p>}
                        {x.letterQuote && <p><span className="text-muted">{tx('Letter', 'Xat')}: </span><QuoteText q={x.letterQuote} /></p>}
                        {x.verify && <p className="text-muted">{tx('Check', 'Tekshiring')}: {x.verify}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {check.result.ignoredCvItems.length > 0 && <div><h3 className="font-bold">{tx('CV items the letter does not use', 'Xat ishlatmagan CV elementlari')}</h3><ul className="list-disc pl-5">{check.result.ignoredCvItems.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></div>}
              {check.result.interests && <p><span className="font-bold">{tx('Academic interests', 'Akademik qiziqishlar')}: </span>{check.result.interests}</p>}
              {check.result.goals && <p><span className="font-bold">{tx('Career goals', 'Karyera maqsadlari')}: </span>{check.result.goals}</p>}
              <Notice>{tx('The reviewer does not know which document is right. Verify each point yourself.', 'Tekshiruvchi qaysi hujjat to‘g‘ri ekanini bilmaydi. Har bir nuqtani o‘zingiz tekshiring.')}</Notice>
            </div>
          )}
        </Card>
      </div>
    </AiGate>
  );
}
