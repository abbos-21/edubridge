import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, TriangleAlert, Wallet } from 'lucide-react';
import type { University } from '@edubridge/shared';
import { useI18n } from '../i18n/I18nProvider';
import { useStore } from '../store/AppStore';
import { useCatalog } from '../data/CatalogProvider';
import { newId } from '../lib/plans';
import { LINE_KEYS, type Line, type LineKey, type Scenario } from '../lib/workspace';
import { Badge, Button, Card, Field, Input, Notice, PageHeader, Select, cx } from '../components/ui';

/**
 * Budget planner: the full yearly cost, not only tuition. A missing figure is "missing", never zero, and totals are
 * not calculated until every line has a value. No exchange rates are used or invented: each scenario is in one
 * currency, and amounts are never converted.
 */
const LINES = LINE_KEYS;
const LABEL: Record<LineKey, [string, string]> = {
  tuition: ['Tuition fees', 'O‘qish to‘lovi'],
  accommodation: ['Accommodation', 'Turar joy'],
  food: ['Food', 'Ovqat'],
  transport: ['Transportation', 'Transport'],
  insurance: ['Insurance', 'Sug‘urta'],
  visa: ['Visa and administrative', 'Viza va ma’muriy'],
  travel: ['Travel', 'Yo‘l (aviachipta)'],
  other: ['Other costs', 'Boshqa xarajatlar'],
};
const CURRENCIES = ['USD', 'UZS', 'EUR', 'GBP', 'MYR', 'TRY', 'HUF', 'KRW', 'JPY'];

const blankLines = (): Record<LineKey, Line> => Object.fromEntries(LINES.map((k) => [k, { value: null, basis: 'estimate' }])) as Record<LineKey, Line>;

export function calc(s: Scenario) {
  const missing = LINES.filter((k) => s.lines[k].value === null || Number.isNaN(s.lines[k].value));
  const known = LINES.reduce((sum, k) => sum + (s.lines[k].value ?? 0), 0);
  const annual = missing.length ? null : known;
  const tuition = s.lines.tuition.value ?? 0;
  const award = s.award ?? 0;
  const applied = s.awardCovers === 'none' ? 0 : s.awardCovers === 'tuition' ? Math.min(award, tuition) : Math.min(award, annual ?? known);
  const gap = annual === null || s.family === null ? null : annual - s.family - applied;
  return { annual, known, total: annual === null ? null : annual * s.years, missing, applied, gap, gapTotal: gap === null ? null : gap * s.years };
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-US').replace(/,/g, ' ');
const parseNum = (s: string) => (s.trim() === '' ? null : Number(s.replace(/[^\d.]/g, '')));

/** A scenario from a university record: only a sourced, per-year or per-semester tuition is prefilled. */
function fromUniversity(u: University, level: 'bachelor' | 'master'): Scenario {
  const t = u.levels[level]?.tuition;
  const s: Scenario = { id: newId(), name: u.name, oppId: u.id, currency: 'USD', years: 1, lines: blankLines(), family: null, award: null, awardCovers: 'none' };
  if (t?.amount != null && t.currency && (t.per === 'year' || t.per === 'semester')) {
    s.currency = t.currency;
    s.lines.tuition = { value: Math.round(t.per === 'semester' ? t.amount * 2 : t.amount), basis: t.source || u.levels[level]?.sources?.length ? 'official' : 'estimate' };
  }
  return s;
}

export function Budget({ param }: { param?: string | null }) {
  const { tx, lang } = useI18n();
  const { profile, workspace, patchWorkspace } = useStore();
  const { universities } = useCatalog();
  const list = workspace.budgets;
  const [sel, setSel] = useState<string | null>(list[0]?.id ?? null);
  const [from, setFrom] = useState('');
  const [msg, setMsg] = useState('');
  const handled = useRef<string | null>(null);
  const level: 'bachelor' | 'master' = profile?.targetLevel === 'master' ? 'master' : 'bachelor';

  const save = (next: Scenario[]) => patchWorkspace({ budgets: next });
  const create = (uniId?: string) => {
    const u = uniId ? universities.find((x) => x.id === uniId) : undefined;
    const s = u ? fromUniversity(u, level) : { id: newId(), name: tx('Custom destination', 'Boshqa yo‘nalish'), currency: profile?.currency ?? 'USD', years: 1, lines: blankLines(), family: null, award: null, awardCovers: 'none' as const };
    save([...list, s]);
    setSel(s.id);
    setMsg(tx('Scenario created. Fill every line from official figures where you can.', 'Ssenariy yaratildi. Imkon bo‘lsa, har bir qatorni rasmiy raqamlar bilan to‘ldiring.'));
  };
  useEffect(() => {
    if (!param || handled.current === param) return;
    handled.current = param;
    const have = list.find((s) => s.oppId === param);
    if (have) setSel(have.id);
    else if (universities.some((u) => u.id === param)) create(param);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [param]);

  const m = list.find((s) => s.id === sel) ?? list[0];
  const r = m ? calc(m) : null;
  const upd = (patch: Partial<Scenario>) => m && save(list.map((s) => (s.id === m.id ? { ...s, ...patch } : s)));
  const line = (k: LineKey, patch: Partial<Line>) => m && upd({ lines: { ...m.lines, [k]: { ...m.lines[k], ...patch } } });
  const money = (n: number | null, cur: string) => (n === null ? '—' : `${fmt(n)} ${cur}`);
  void lang;

  return (
    <div>
      <PageHeader eyebrow={tx('Budget planning', 'Byudjet rejalashtirish')} title={tx('What will studying abroad really cost?', 'Xorijda o‘qish aslida qancha turadi?')}>
        {tx('Compare the full cost, not just tuition. Missing figures are shown as missing and never counted as zero. “Official” means a published figure; everything else is your own estimate.', 'Faqat o‘qish to‘lovini emas, to‘liq xarajatni solishtiring. Yetishmayotgan raqamlar nol deb hisoblanmaydi. “Rasmiy” — e’lon qilingan raqam; qolganlari o‘zingizning taxminingiz.')}
      </PageHeader>
      <Card className="mb-5 flex flex-wrap items-end gap-3">
        <Field label={tx('New scenario from', 'Yangi ssenariy manbasi')}>
          <Select value={from} onChange={(e) => setFrom(e.target.value)} className="w-[min(100%,420px)]">
            <option value="">{tx('Blank scenario', 'Bo‘sh ssenariy')}</option>
            {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </Field>
        <Button variant="primary" onClick={() => { create(from || undefined); setFrom(''); }}><Plus size={16} aria-hidden />{tx('Add scenario', 'Ssenariy qo‘shish')}</Button>
      </Card>
      {msg && <p role="status" className="mb-4 text-[13.5px] text-muted">{msg}</p>}

      {!m || !r ? (
        <div className="rounded-xl border border-dashed border-line p-10 text-center">
          <Wallet size={26} className="mx-auto text-muted" aria-hidden />
          <p className="mt-3 font-bold">{tx('No scenarios yet', 'Hali ssenariylar yo‘q')}</p>
          <p className="mx-auto mt-1 max-w-md text-[14px] text-muted">{tx('Create one from a university so its published tuition is filled in. Living costs are never guessed: you enter them.', 'O‘qish to‘lovi avtomatik to‘ldirilishi uchun universitetdan ssenariy yarating. Yashash xarajatlari taxmin qilinmaydi: ularni o‘zingiz kiritasiz.')}</p>
        </div>
      ) : (
        <>
          {list.length > 1 && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={tx('Scenarios', 'Ssenariylar')}>
              {list.map((s) => <button key={s.id} type="button" role="tab" aria-selected={s.id === m.id} onClick={() => setSel(s.id)} className={cx('shrink-0 rounded-lg border px-3 py-1.5 text-[13.5px] font-semibold', s.id === m.id ? 'border-navy bg-navy text-navy-ink' : 'border-line bg-surface text-muted hover:text-fg')}>{s.name}</button>)}
            </div>
          )}
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <Card>
              <div className="grid gap-3 sm:grid-cols-[1fr_130px_110px]">
                <Field label={tx('Scenario name', 'Ssenariy nomi')}><Input value={m.name} onChange={(e) => upd({ name: e.target.value })} /></Field>
                <Field label={tx('Currency', 'Valyuta')}>
                  <Select value={m.currency} onChange={(e) => upd({ currency: e.target.value })}>
                    {[...new Set([m.currency, ...CURRENCIES])].map((c) => <option key={c}>{c}</option>)}
                  </Select>
                </Field>
                <Field label={tx('Years', 'Yillar')}><Input inputMode="decimal" value={m.years} onChange={(e) => upd({ years: Math.max(0.5, Number(e.target.value.replace(',', '.')) || 1) })} /></Field>
              </div>
              <p className="mt-1 text-[12px] text-faint">{tx('Changing the currency does not convert the amounts. Enter every figure in the chosen currency.', 'Valyutani o‘zgartirish summalarni aylantirmaydi. Har bir raqamni tanlangan valyutada kiriting.')}</p>
              <p className="eyebrow mb-2 mt-5">{tx('Yearly costs', 'Yillik xarajatlar')}</p>
              <div className="flex flex-col gap-2">
                {LINES.map((k) => (
                  <div key={k} className="grid grid-cols-[minmax(0,1fr)_minmax(0,140px)_auto] items-center gap-2">
                    <label htmlFor={`bl-${k}`} className="text-[14px] font-semibold">{tx(LABEL[k][0], LABEL[k][1])}</label>
                    <Input id={`bl-${k}`} inputMode="numeric" value={m.lines[k].value ?? ''} placeholder={tx('missing', 'yo‘q')} className={cx('!min-h-[36px] text-right tabular', m.lines[k].value === null && 'border-warn/50 bg-warn-soft/40')} onChange={(e) => line(k, { value: parseNum(e.target.value) })} />
                    <button type="button" className="w-[84px]" aria-label={tx('Toggle official or estimate', 'Rasmiy yoki taxmin')} onClick={() => line(k, { basis: m.lines[k].basis === 'official' ? 'estimate' : 'official' })}>
                      <Badge tone={m.lines[k].basis === 'official' ? 'ok' : 'neutral'} className="w-full justify-center">{m.lines[k].basis === 'official' ? tx('Official', 'Rasmiy') : tx('Estimate', 'Taxmin')}</Badge>
                    </button>
                  </div>
                ))}
              </div>
              <p className="eyebrow mb-2 mt-6">{tx('Funding', 'Moliyalashtirish')}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={tx('Family contribution / year', 'Oila hissasi / yil')}><Input inputMode="numeric" value={m.family ?? ''} placeholder={tx('missing', 'yo‘q')} onChange={(e) => upd({ family: parseNum(e.target.value) })} /></Field>
                <Field label={tx('Scholarship / year', 'Grant / yil')}><Input inputMode="numeric" value={m.award ?? ''} onChange={(e) => upd({ award: parseNum(e.target.value) })} /></Field>
                <Field label={tx('Scholarship covers', 'Grant qoplaydi')}>
                  <Select value={m.awardCovers} onChange={(e) => upd({ awardCovers: e.target.value as Scenario['awardCovers'] })}>
                    <option value="none">{tx('No scholarship', 'Grant yo‘q')}</option>
                    <option value="tuition">{tx('Tuition only', 'Faqat o‘qish to‘lovi')}</option>
                    <option value="all">{tx('Tuition and living costs', 'O‘qish va yashash')}</option>
                  </Select>
                </Field>
              </div>
              <Button size="sm" className="mt-5 !text-bad" onClick={() => { const rest = list.filter((s) => s.id !== m.id); save(rest); setSel(rest[0]?.id ?? null); }}><Trash2 size={14} aria-hidden />{tx('Delete scenario', 'Ssenariyni o‘chirish')}</Button>
            </Card>

            <div className="flex flex-col gap-4">
              <Card>
                <p className="font-bold">{tx('Result', 'Natija')}</p>
                {r.missing.length > 0 && (
                  <div className="mt-3"><Notice tone="warn"><span className="inline-flex items-start gap-2"><TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />{tx('Incomplete: {0} missing. Totals are not calculated until every line has a value (enter 0 if it truly costs nothing).', 'To‘liq emas: {0} kiritilmagan. Barcha qatorlar to‘ldirilmaguncha jami hisoblanmaydi (haqiqatan bepul bo‘lsa 0 kiriting).', r.missing.map((k) => tx(LABEL[k][0], LABEL[k][1]).toLowerCase()).join(', '))}</span></Notice></div>
                )}
                <dl className="mt-4 grid gap-3 text-[14px]">
                  <div className="flex justify-between gap-3"><dt className="text-muted">{tx('Estimated annual cost', 'Taxminiy yillik xarajat')}</dt><dd className="tabular font-bold">{r.annual === null ? <span className="text-warn">{tx('≥ {0} {1} (incomplete)', '≥ {0} {1} (to‘liq emas)', fmt(r.known), m.currency)}</span> : money(r.annual, m.currency)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-muted">{tx('Total for {0} years', '{0} yil uchun jami', m.years)}</dt><dd className="tabular font-bold">{money(r.total, m.currency)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-muted">{tx('Family contribution / year', 'Oila hissasi / yil')}</dt><dd className="tabular">{money(m.family, m.currency)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-muted">{tx('Scholarship applied / year', 'Hisobga olingan grant / yil')}</dt><dd className="tabular">{fmt(r.applied)} {m.currency}</dd></div>
                  <div className={cx('flex justify-between gap-3 rounded-lg p-3', r.gap === null ? 'bg-sunken' : r.gap > 0 ? 'bg-bad-soft' : 'bg-ok-soft')}>
                    <dt className="font-semibold">{r.gap !== null && r.gap <= 0 ? tx('Covered with surplus / year', 'Yiliga ortiqcha bilan qoplangan') : tx('Funding gap / year', 'Yillik kamomad')}</dt>
                    <dd className="tabular font-extrabold">{r.gap === null ? '—' : `${fmt(Math.abs(r.gap))} ${m.currency}`}</dd>
                  </div>
                  {r.gapTotal !== null && r.gapTotal > 0 && <p className="text-[13px] text-bad">{tx('About {0} {1} short over the whole programme.', 'Butun dastur davomida taxminan {0} {1} yetishmaydi.', fmt(r.gapTotal), m.currency)}</p>}
                </dl>
              </Card>
              <Card className="!p-4 text-[13px]">
                <p className="mb-2 font-bold">{tx('Formulas used', 'Qo‘llangan formulalar')}</p>
                <ul className="flex flex-col gap-1.5 font-mono text-[12.5px] text-muted">
                  <li>{tx('annual cost', 'yillik xarajat')} = Σ {tx('all eight lines', 'sakkizta qator')}</li>
                  <li>{tx('total cost', 'jami xarajat')} = {tx('annual cost', 'yillik xarajat')} × {tx('years', 'yillar')}</li>
                  <li>{tx('scholarship applied', 'hisobga olingan grant')} = {m.awardCovers === 'tuition' ? `min(${tx('award', 'grant')}, ${tx('tuition', 'o‘qish')})` : m.awardCovers === 'all' ? `min(${tx('award', 'grant')}, ${tx('annual cost', 'yillik xarajat')})` : '0'}</li>
                  <li>{tx('funding gap', 'kamomad')} = {tx('annual cost', 'yillik xarajat')} − {tx('family', 'oila')} − {tx('scholarship applied', 'grant')}</li>
                </ul>
              </Card>
            </div>
          </div>

          {list.length > 1 && (
            <section className="mt-8">
              <h2 className="mb-3 text-[17px] font-bold">{tx('Compare destinations', 'Yo‘nalishlarni solishtirish')} <span className="text-[13px] font-normal text-muted">({tx('each in its own currency', 'har biri o‘z valyutasida')})</span></h2>
              <Card className="overflow-x-auto !p-0 sm:!p-0">
                <table className="w-full min-w-[560px] text-left text-[14px]">
                  <thead className="bg-sunken text-[12.5px] text-muted"><tr><th className="px-4 py-2">{tx('Scenario', 'Ssenariy')}</th><th className="px-4 py-2 text-right">{tx('Annual cost', 'Yillik')}</th><th className="px-4 py-2 text-right">{tx('Total', 'Jami')}</th><th className="px-4 py-2 text-right">{tx('Gap / year', 'Kamomad / yil')}</th><th className="px-4 py-2">{tx('Status', 'Holat')}</th></tr></thead>
                  <tbody>
                    {list.map((s) => {
                      const c = calc(s);
                      return (
                        <tr key={s.id} className="border-t border-line">
                          <td className="px-4 py-2.5"><button type="button" className="font-semibold hover:underline" onClick={() => setSel(s.id)}>{s.name}</button></td>
                          <td className="tabular px-4 py-2.5 text-right">{money(c.annual, s.currency)}</td>
                          <td className="tabular px-4 py-2.5 text-right">{money(c.total, s.currency)}</td>
                          <td className={cx('tabular px-4 py-2.5 text-right font-semibold', c.gap !== null && c.gap > 0 && 'text-bad')}>{c.gap === null ? '—' : c.gap > 0 ? money(c.gap, s.currency) : tx('covered', 'qoplangan')}</td>
                          <td className="px-4 py-2.5">{c.missing.length ? <Badge tone="warn">{tx('{0} missing', '{0} ta yo‘q', c.missing.length)}</Badge> : <Badge tone="ok">{tx('Complete', 'To‘liq')}</Badge>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </section>
          )}
        </>
      )}
      <p className="mt-6 text-[12.5px] text-faint">{tx('Scenarios are saved with your profile: in this browser, and in your account when you are signed in.', 'Ssenariylar profilingiz bilan saqlanadi: shu brauzerda, kirgan bo‘lsangiz akkauntingizda ham.')}</p>
    </div>
  );
}
