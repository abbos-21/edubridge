import { useEffect, useState } from 'react';
import { snapshots } from '../admin/adminApi';
import { AnalysisView } from '../ai/AnalysisView';
import { Badge, Card, Notice } from '../components/ui';
import { useI18n } from '../i18n/I18nProvider';
import { formatDate } from '../lib/format';
import { href } from '../lib/router';
import { useStore } from '../store/AppStore';

type Item = Awaited<ReturnType<typeof snapshots.list>>['items'][number];

/** Readable view of any saved JSON result (used for kinds that have no dedicated screen). */
function Tree({ v, depth = 0 }: { v: unknown; depth?: number }) {
  if (v == null || v === '') return null;
  if (typeof v !== 'object') return <span>{String(v)}</span>;
  if (Array.isArray(v)) return <ul className="list-disc space-y-1 pl-5">{v.map((x, i) => <li key={i}><Tree v={x} depth={depth + 1} /></li>)}</ul>;
  return (
    <dl className="space-y-1">
      {Object.entries(v as Record<string, unknown>).map(([k, x]) => (x == null || x === '' ? null : (
        <div key={k}><dt className="text-xs font-bold uppercase tracking-wide text-muted">{k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</dt><dd className="text-sm"><Tree v={x} depth={depth + 1} /></dd></div>
      )))}
    </dl>
  );
}

const KIND = {
  document_analysis: ['Document analysis', 'Hujjat tahlili'],
  interview_feedback: ['Interview feedback', 'Intervyu bo‘yicha fikr-mulohaza'],
  coach_plan: ['Profile coach plan', 'Profil murabbiyi rejasi'],
} as const;

/** The list of saved examples on the demo page (hidden while there are none or the API is unreachable). */
export function SavedExamplesList() {
  const { tx } = useI18n();
  const { lang } = useStore();
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => { snapshots.list().then((r) => setItems(r.items), () => setItems([])); }, []);
  if (!items?.length) return null;
  return (
    <section aria-labelledby="saved-h" className="space-y-2">
      <h2 id="saved-h" className="text-xl font-extrabold">{tx('Saved examples of AI results', 'SI natijalarining saqlangan namunalari')}</h2>
      <p className="text-sm text-muted">{tx('These are real results saved on the date shown. They are not produced live.', 'Bu ko‘rsatilgan sanada saqlangan natijalar. Ular hozir yaratilmagan.')}</p>
      <ul className="grid gap-2 md:grid-cols-2">
        {items.map((s) => (
          <li key={s.id}>
            <Card className="space-y-1">
              <Badge>{tx(KIND[s.kind as keyof typeof KIND]?.[0] ?? 'Example', KIND[s.kind as keyof typeof KIND]?.[1] ?? 'Namuna')}</Badge>
              <p className="font-bold"><a href={href('demo', `saved-${s.id}`)}>{s.title}</a></p>
              <p className="text-xs text-muted">{tx('saved on {0}', 'saqlangan sana: {0}', formatDate(s.savedAt, lang) ?? '')}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** One saved example, always labelled as saved (never as live). */
export function SavedExample({ id }: { id: string }) {
  const { tx } = useI18n();
  const { lang } = useStore();
  const [s, setS] = useState<Awaited<ReturnType<typeof snapshots.get>> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { snapshots.get(id).then(setS, () => setFailed(true)); }, [id]);
  if (failed) return <Notice tone="warn">{tx('This example could not be found.', 'Bu namuna topilmadi.')} <a href={href('demo')}>{tx('Back', 'Orqaga')}</a></Notice>;
  if (!s) return <p role="status" className="text-muted">…</p>;
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <a href={href('demo')} className="text-sm">← {tx('Demo', 'Namoyish')}</a>
      <h1 className="text-2xl font-extrabold">{s.title}</h1>
      <Notice tone="warn">
        {s.mock
          ? tx('Sample result: written by the built-in test generator, not by the AI. Saved on {0}.', 'Namuna natija: SI emas, o‘rnatilgan test generatori yozgan. Saqlangan sana: {0}.', formatDate(s.savedAt, lang) ?? '')
          : tx('Saved result: this is not a live answer. Saved on {0}.', 'Saqlangan natija: bu jonli javob emas. Saqlangan sana: {0}.', formatDate(s.savedAt, lang) ?? '')}
      </Notice>
      {s.kind === 'document_analysis' ? <AnalysisView result={s.payload} /> : <Card><Tree v={s.payload} /></Card>}
    </div>
  );
}
