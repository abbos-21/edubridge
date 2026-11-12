import { useState } from 'react';
import { FileText } from 'lucide-react';
import type { L } from '@edubridge/shared';
import { useI18n } from '../i18n/I18nProvider';
import { useStore } from '../store/AppStore';
import { useCatalog } from '../data/CatalogProvider';
import { DOCS } from '../lib/documents-data';
import { href } from '../lib/router';
import { Badge, Card, Notice, PageHeader, buttonClass, cx } from '../components/ui';

const l = (en: string, uz: string): L => ({ en, uz });
const NAMES: Record<string, L> = {
  transcript: l('Academic transcript', 'Transkript (baholar varaqasi)'),
  diploma: l('Diploma or certificate', 'Diplom yoki attestat'),
  language: l('Language certificate', 'Til sertifikati'),
  passport: l('Passport', 'Pasport'),
  recommendation: l('Recommendation letters', 'Tavsiyanomalar'),
  cv: l('Academic CV', 'Akademik CV (rezyume)'),
  statement: l('Personal statement / essay', 'Motivatsion xat / insho'),
  financial: l('Financial documents', 'Moliyaviy hujjatlar'),
};
/** Which plan tasks belong to which document. */
const TASK_KEYS: Record<string, string[]> = {
  transcript: ['doc.transcript'],
  diploma: ['doc.diploma'],
  language: ['doc.language.have', 'doc.language.book'],
  passport: ['doc.passport'],
  recommendation: ['ref.request', 'ref.confirm'],
  cv: ['doc.cv'],
  statement: ['essay.draft', 'essay.final'],
  financial: ['doc.financial'],
};

/** #documents: what each document is, why it is asked for, how to prepare it, and your own checklist. */
export function Documents() {
  const { tx, pick } = useI18n();
  const { plans, workspace, patchWorkspace } = useStore();
  const cat = useCatalog();
  const [key, setKey] = useState('transcript');
  const doc = DOCS.find((d) => d.key === key) ?? DOCS[0]!;
  const checks = workspace.docChecks;
  const nameOf = (id: string) => cat.universities.find((u) => u.id === id)?.name ?? cat.grants.find((g) => g.id === id)?.name ?? id;
  const plansFor = (k: string) => plans.filter((p) => p.tasks.some((t) => t.key && TASK_KEYS[k]?.includes(t.key)));
  const mine = plansFor(key);

  return (
    <div>
      <PageHeader eyebrow={tx('Document preparation centre', 'Hujjat tayyorlash markazi')} title={tx('Prepare your documents', 'Hujjatlaringizni tayyorlang')}>
        {tx('What each document is, why it is asked for and how to prepare it. This is general guidance — always check the specific requirements of each application.', 'Har bir hujjat nima, nega so‘raladi va qanday tayyorlanadi. Bu umumiy yo‘riqnoma — har bir arizaning aniq talablarini doim tekshiring.')}
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label={tx('Documents', 'Hujjatlar')} className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {DOCS.map((d) => {
            const n = plansFor(d.key).length;
            return (
              <button key={d.key} type="button" onClick={() => setKey(d.key)} aria-current={key === d.key ? 'true' : undefined} className={cx('flex shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[14px] font-semibold', key === d.key ? 'bg-navy text-navy-ink' : 'bg-surface text-fg hover:bg-sunken lg:bg-transparent')}>
                <span className="flex items-center gap-2"><FileText size={16} aria-hidden />{pick(NAMES[d.key])}</span>
                {n > 0 && <span className="tabular rounded-full bg-teal-soft px-1.5 text-[11.5px] text-teal-ink">{n}</span>}
              </button>
            );
          })}
        </nav>
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <h2 className="text-[20px] font-extrabold">{pick(NAMES[doc.key])}</h2>
            <p className="mt-2 text-[15px]"><b>{tx('Purpose.', 'Maqsadi.')}</b> {pick(doc.purpose)}</p>
            <p className="mt-2 text-[15px]"><b>{tx('When it is required.', 'Qachon talab qilinadi.')}</b> {pick(doc.when)}</p>
            <h3 className="mb-2 mt-5 font-bold">{tx('How to prepare it', 'Qanday tayyorlash')}</h3>
            <ol className="flex flex-col gap-2">
              {doc.steps.map((s, i) => <li key={i} className="flex gap-2.5 text-[14.5px]"><span className="tabular grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sunken text-[12px] font-bold">{i + 1}</span>{pick(s)}</li>)}
            </ol>
            <h3 className="mb-2 mt-5 font-bold">{tx('Common mistakes', 'Ko‘p uchraydigan xatolar')}</h3>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-[14.5px]">{doc.mistakes.map((m, i) => <li key={i}>{pick(m)}</li>)}</ul>
            <div className="mt-5"><Notice>{pick(doc.official)}</Notice></div>
            {doc.key === 'statement' && <a href={href('writing')} className={cx(buttonClass('primary'), 'mt-4')}>{tx('Open the writing tutor', 'Yozish yordamchisini ochish')}</a>}
            {doc.key === 'cv' && <a href={href('writing', 'cv')} className={cx(buttonClass('secondary'), 'mt-4')}>{tx('Open CV review', 'CV tekshiruvini ochish')}</a>}
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="!p-4">
              <p className="mb-2 font-bold">{tx('My checklist', 'Mening ro‘yxatim')}</p>
              <ul className="flex flex-col gap-2">
                {doc.checklist.map((c, i) => {
                  const k = `${doc.key}:${i}`;
                  return (
                    <li key={k}>
                      <label className="flex cursor-pointer items-start gap-2.5 text-[14px]">
                        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[rgb(var(--teal))]" checked={!!checks[k]} onChange={() => patchWorkspace({ docChecks: { ...checks, [k]: !checks[k] } })} />
                        <span className={cx(checks[k] && 'text-muted line-through')}>{pick(c)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </Card>
            <Card className="!p-4">
              <p className="mb-2 font-bold">{tx('Your plans that include it', 'Buni o‘z ichiga olgan rejalaringiz')}</p>
              {mine.length === 0 ? <p className="text-[14px] text-muted">{tx('None of your application plans has a task for this document yet.', 'Ariza rejalaringizdan birortasida bu hujjat uchun vazifa yo‘q.')}</p> : (
                <ul className="flex flex-col gap-2">
                  {mine.map((p) => {
                    const ts = p.tasks.filter((t) => t.key && TASK_KEYS[doc.key]?.includes(t.key));
                    return (
                      <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-[14px]">
                        <a href={href('plan', p.id)} className="font-semibold text-fg hover:underline">{nameOf(p.oppId)}</a>
                        <Badge tone={ts.every((t) => t.done) ? 'ok' : 'neutral'}>{ts.filter((t) => t.done).length}/{ts.length} · {tx('General guidance', 'Umumiy yo‘riqnoma')}</Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
