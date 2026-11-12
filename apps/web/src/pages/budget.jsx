import React from 'react';
import { useSession } from '../sync/session';
import * as jsxRuntime from 'react/jsx-runtime';
import { Calculator, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { $e, Ie } from '../lib/core';
import { he, ii } from '../lib/catalog';
import { useStore } from '../store/store';
import { useI18n } from '../lib/derived';
import {
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  classNames,
} from '../components/ui';
import { Dq, Du, kr, pn } from './assistant';
import { Ll, Rq } from './compare';

export function BudgetPage() {
  var S, A;
  const { state: e, route: a, upsertBudget: t, removeBudget: n, notify: s } = useStore(),
    { tx: r, lang: o } = useI18n(),
    [u, l] = React.useState(((S = e.budgets[0]) == null ? void 0 : S.id) ?? null),
    [c, p] = React.useState(''),
    d = React.useRef(null),
    h = (q) => {
      var k;
      const w = q ? he(q) : void 0,
        U = w ? (w.kind === 'program' ? w.university : w.name) : r('Custom destination', 'Boshqa yo‘nalish'),
        j = Dq(w, e.displayCurrency === 'UZS' ? 'UZS' : 'USD', e.rates, U);
      (((k = e.profile) == null ? void 0 : k.totalBudget) !== void 0 &&
        e.profile.tuitionBudget !== void 0 &&
        (j.family = Math.round(kr(e.profile.totalBudget, e.profile.currency, j.currency, e.rates))),
        t(j),
        l(j.id),
        s(
          r(
            'Scenario created — estimates are marked, replace them with official figures where you can',
            'Ssenariy yaratildi — taxminlar belgilangan, imkon bo‘lsa rasmiy raqamlar bilan almashtiring',
          ),
        ));
    };
  React.useEffect(() => {
    const q = a.id;
    if (!q || d.current === q) return;
    d.current = q;
    const w = e.budgets.find((U) => U.oppId === q);
    w ? l(w.id) : he(q) && h(q);
  }, [a.id]);
  const m = e.budgets.find((q) => q.id === u) ?? e.budgets[0],
    y = m ? Du(m) : null,
    E = (q) =>
      m &&
      t({
        ...m,
        ...q,
      }),
    C = (q, w) =>
      m &&
      t({
        ...m,
        lines: {
          ...m.lines,
          [q]: {
            ...m.lines[q],
            ...w,
          },
        },
      }),
    v = (q, w) => (q === null ? '—' : `${Ie(q)} ${w}`),
    g = ii.filter((q) => q.kind === 'scholarship'),
    b = e.displayCurrency;
  return (
    <div>
      <PageHeader
        eyebrow={r('Budget planning', 'Byudjet rejalashtirish')}
        title={r('What will studying abroad really cost?', 'Xorijda o‘qish aslida qancha turadi?')}
        sub={r(
          'Compare the full cost, not just tuition. Missing figures are shown as missing and never counted as zero. Published fees are marked “official”; everything else is an estimate.',
          'Faqat o‘qish to‘lovini emas, to‘liq xarajatni solishtiring. Yetishmayotgan raqamlar nol deb hisoblanmaydi. E’lon qilingan to‘lovlar “rasmiy”, qolganlari taxmin deb belgilangan.',
        )}
      />
      <Card className="mb-5 flex flex-wrap items-end gap-3 p-4">
        <Field label={r('New scenario from', 'Yangi ssenariy manbasi')} htmlFor="b-new">
          <Select id="b-new" value={c} onChange={(q) => p(q.target.value)} className="w-[min(100%,420px)]">
            <option value="">{r('Blank scenario', 'Bo‘sh ssenariy')}</option>
            <optgroup label={r('Universities', 'Universitetlar')}>
              {ii
                .filter((q) => q.kind === 'program')
                .map((q) => (
                  <option value={q.id} key={q.id}>
                    {q.kind === 'program' ? `${q.university} — ${$e(q.program, o)}` : ''}
                  </option>
                ))}
            </optgroup>
            <optgroup label={r('Scholarships', 'Grantlar')}>
              {g.map((q) => (
                <option value={q.id} key={q.id}>
                  {q.kind === 'scholarship' ? q.name : ''}
                </option>
              ))}
            </optgroup>
          </Select>
        </Field>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            (h(c || void 0), p(''));
          }}
        >
          {r('Add scenario', 'Ssenariy qo‘shish')}
        </Button>
      </Card>
      {!m || !y ? (
        <EmptyState
          icon={<Calculator size={26} />}
          title={r('No scenarios yet', 'Hali ssenariylar yo‘q')}
          body={r(
            'Create one from a programme so tuition is filled in from its record.',
            'O‘qish to‘lovi avtomatik to‘ldirilishi uchun dasturdan ssenariy yarating.',
          )}
        />
      ) : (
        <>
          {e.budgets.length > 1 && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist">
              {e.budgets.map((q) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={q.id === m.id}
                  onClick={() => l(q.id)}
                  className={classNames(
                    'shrink-0 rounded-lg border px-3 py-1.5 text-[13.5px] font-semibold',
                    q.id === m.id
                      ? 'border-navy bg-navy text-navy-ink'
                      : 'border-line bg-surface text-muted hover:text-fg',
                  )}
                  key={q.id}
                >
                  {q.name}
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <Card className="p-4 md:p-5">
              <div className="grid gap-3 sm:grid-cols-[1fr_130px_110px]">
                <Field label={r('Scenario name', 'Ssenariy nomi')} htmlFor="b-name">
                  <Input
                    id="b-name"
                    value={m.name}
                    onChange={(q) =>
                      E({
                        name: q.target.value,
                      })
                    }
                  />
                </Field>
                <Field label={r('Currency', 'Valyuta')} htmlFor="b-cur">
                  <Select
                    id="b-cur"
                    value={m.currency}
                    onChange={(q) => {
                      const w = q.target.value,
                        U = (j) => (j === null ? null : Math.round(kr(j, m.currency, w, e.rates)));
                      t({
                        ...m,
                        currency: w,
                        family: U(m.family),
                        award: U(m.award),
                        lines: Object.fromEntries(
                          pn.map((j) => [
                            j,
                            {
                              ...m.lines[j],
                              value: U(m.lines[j].value),
                            },
                          ]),
                        ),
                      });
                    }}
                  >
                    {Rq.map((q) => (
                      <option key={q}>{q}</option>
                    ))}
                  </Select>
                </Field>
                <Field label={r('Years', 'Yillar')} htmlFor="b-years">
                  <Input
                    id="b-years"
                    inputMode="decimal"
                    value={m.years}
                    onChange={(q) =>
                      E({
                        years: Math.max(0.5, Number(q.target.value.replace(',', '.')) || 1),
                      })
                    }
                  />
                </Field>
              </div>
              <p className="eyebrow mb-2 mt-5">{r('Yearly costs', 'Yillik xarajatlar')}</p>
              <div className="flex flex-col gap-2">
                {pn.map((q) => (
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,140px)_auto] items-center gap-2" key={q}>
                    <label htmlFor={`bl-${q}`} className="text-[14px] font-semibold">
                      {r(...Ll[q])}
                    </label>
                    <Input
                      id={`bl-${q}`}
                      inputMode="numeric"
                      value={m.lines[q].value ?? ''}
                      placeholder={r('missing', 'yo‘q')}
                      className={classNames(
                        'h-9 text-right tabular',
                        m.lines[q].value === null && 'border-warn/50 bg-warn-soft/40',
                      )}
                      onChange={(w) =>
                        C(q, {
                          value: w.target.value.trim() === '' ? null : Number(w.target.value.replace(/[^\d.]/g, '')),
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        C(q, {
                          basis: m.lines[q].basis === 'official' ? 'estimate' : 'official',
                        })
                      }
                      className="w-[84px]"
                      aria-label={r('Toggle official or estimate', 'Rasmiy yoki taxmin')}
                    >
                      <Badge
                        tone={m.lines[q].basis === 'official' ? 'ok' : 'neutral'}
                        className="w-full justify-center"
                      >
                        {m.lines[q].basis === 'official' ? r('Official', 'Rasmiy') : r('Estimate', 'Taxmin')}
                      </Badge>
                    </button>
                  </div>
                ))}
              </div>
              <p className="eyebrow mb-2 mt-6">{r('Funding', 'Moliyalashtirish')}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={r('Family contribution / year', 'Oila hissasi / yil')} htmlFor="b-fam">
                  <Input
                    id="b-fam"
                    inputMode="numeric"
                    value={m.family ?? ''}
                    placeholder={r('missing', 'yo‘q')}
                    onChange={(q) =>
                      E({
                        family: q.target.value.trim() === '' ? null : Number(q.target.value.replace(/[^\d.]/g, '')),
                      })
                    }
                  />
                </Field>
                <Field label={r('Scholarship / year', 'Grant / yil')} htmlFor="b-aw">
                  <Input
                    id="b-aw"
                    inputMode="numeric"
                    value={m.award ?? ''}
                    onChange={(q) =>
                      E({
                        award: q.target.value.trim() === '' ? null : Number(q.target.value.replace(/[^\d.]/g, '')),
                      })
                    }
                  />
                </Field>
                <Field label={r('Scholarship covers', 'Grant qoplaydi')} htmlFor="b-cov">
                  <Select
                    id="b-cov"
                    value={m.awardCovers}
                    onChange={(q) =>
                      E({
                        awardCovers: q.target.value,
                      })
                    }
                  >
                    <option value="none">{r('No scholarship', 'Grant yo‘q')}</option>
                    <option value="tuition">{r('Tuition only', 'Faqat o‘qish to‘lovi')}</option>
                    <option value="all">{r('Tuition and living costs', 'O‘qish va yashash')}</option>
                  </Select>
                </Field>
              </div>
              {m.oppId && ((A = he(m.oppId)) == null ? void 0 : A.kind) === 'scholarship' && (
                <p className="mt-2 text-[12.5px] text-faint">
                  {r(
                    'Award values prefilled from scholarship records are rough estimates of published amounts. Check the official terms.',
                    'Grant yozuvidan olingan qiymatlar e’lon qilingan summalarning taxminiy bahosi. Rasmiy shartlarni tekshiring.',
                  )}
                </p>
              )}
              <Button
                className="mt-5"
                size="sm"
                variant="danger"
                icon={<Trash2 size={14} />}
                onClick={() => {
                  (n(m.id), l(null), s(r('Scenario deleted', 'Ssenariy o‘chirildi')));
                }}
              >
                {r('Delete scenario', 'Ssenariyni o‘chirish')}
              </Button>
            </Card>
            <div className="flex flex-col gap-4">
              <Card className="p-4 md:p-5">
                <p className="font-bold">{r('Result', 'Natija')}</p>
                {y.missing.length > 0 && (
                  <div className="mt-3">
                    <Callout tone="warn" icon={<TriangleAlert size={16} />}>
                      {r(
                        `Incomplete: ${y.missing.map((q) => Ll[q][0].toLowerCase()).join(', ')} missing. Totals are not calculated until every line has a value (enter 0 if it truly costs nothing).`,
                        `To‘liq emas: ${y.missing.map((q) => Ll[q][1].toLowerCase()).join(', ')} kiritilmagan. Barcha qatorlar to‘ldirilmaguncha jami hisoblanmaydi (haqiqatan bepul bo‘lsa 0 kiriting).`,
                      )}
                    </Callout>
                  </div>
                )}
                <dl className="mt-4 grid gap-3 text-[14px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">{r('Estimated annual cost', 'Taxminiy yillik xarajat')}</dt>
                    <dd className="tabular font-bold">
                      {y.annual === null ? (
                        <span className="text-warn">
                          {r(
                            `≥ ${Ie(y.annualKnown)} ${m.currency} (incomplete)`,
                            `≥ ${Ie(y.annualKnown)} ${m.currency} (to‘liq emas)`,
                          )}
                        </span>
                      ) : (
                        v(y.annual, m.currency)
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">{r(`Total for ${m.years} years`, `${m.years} yil uchun jami`)}</dt>
                    <dd className="tabular font-bold">{v(y.total, m.currency)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">{r('Family contribution / year', 'Oila hissasi / yil')}</dt>
                    <dd className="tabular">{v(y.family, m.currency)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">{r('Scholarship applied / year', 'Hisobga olingan grant / yil')}</dt>
                    <dd className="tabular">
                      {Ie(y.awardApplied)} {m.currency}
                    </dd>
                  </div>
                  <div
                    className={classNames(
                      'flex justify-between gap-3 rounded-lg p-3',
                      y.gap === null ? 'bg-sunken' : y.gap > 0 ? 'bg-bad-soft' : 'bg-ok-soft',
                    )}
                  >
                    <dt className="font-semibold">
                      {y.gap !== null && y.gap <= 0
                        ? r('Covered with surplus / year', 'Yiliga ortiqcha bilan qoplangan')
                        : r('Funding gap / year', 'Yillik kamomad')}
                    </dt>
                    <dd className="tabular font-extrabold">
                      {y.gap === null ? '—' : `${Ie(Math.abs(y.gap))} ${m.currency}`}
                    </dd>
                  </div>
                  {y.gapTotal !== null && y.gapTotal > 0 && (
                    <p className="text-[13px] text-bad">
                      {r(
                        `About ${Ie(y.gapTotal)} ${m.currency} short over the whole programme.`,
                        `Butun dastur davomida taxminan ${Ie(y.gapTotal)} ${m.currency} yetishmaydi.`,
                      )}
                    </p>
                  )}
                  {m.currency !== b && y.annual !== null && (
                    <p className="text-[12.5px] text-faint">
                      {'≈ '}
                      {Ie(kr(y.annual, m.currency, b, e.rates))} {b}
                      {' / '}
                      {r('year', 'yil')}
                      {' ('}
                      {r('illustrative rate', 'taxminiy kurs')})
                    </p>
                  )}
                </dl>
              </Card>
              <Card className="p-4 text-[13px]">
                <p className="mb-2 font-bold">{r('Formulas used', 'Qo‘llangan formulalar')}</p>
                <ul className="flex flex-col gap-1.5 font-mono text-[12.5px] text-muted">
                  <li>
                    {r('annual cost', 'yillik xarajat')}
                    {' = Σ '}
                    {r('all eight lines', 'sakkizta qator')}
                  </li>
                  <li>
                    {r('total cost', 'jami xarajat')}
                    {' = '}
                    {r('annual cost', 'yillik xarajat')}
                    {' × '}
                    {r('years', 'yillar')}
                  </li>
                  <li>
                    {r('scholarship applied', 'hisobga olingan grant')}
                    {' = '}
                    {m.awardCovers === 'tuition'
                      ? `min(${r('award', 'grant')}, ${r('tuition', 'o‘qish')})`
                      : m.awardCovers === 'all'
                        ? `min(${r('award', 'grant')}, ${r('annual cost', 'yillik xarajat')})`
                        : '0'}
                  </li>
                  <li>
                    {r('funding gap', 'kamomad')}
                    {' = '}
                    {r('annual cost', 'yillik xarajat')}
                    {' − '}
                    {r('family', 'oila')}
                    {' − '}
                    {r('scholarship applied', 'grant')}
                  </li>
                </ul>
              </Card>
            </div>
          </div>
          {e.budgets.length > 1 && (
            <section className="mt-8">
              <h2 className="mb-3 text-[17px] font-bold">
                {r('Compare destinations', 'Yo‘nalishlarni solishtirish')}{' '}
                <span className="text-[13px] font-normal text-muted">
                  ({r(`shown in ${b} at illustrative rates`, `${b} da, taxminiy kurs bo‘yicha`)})
                </span>
              </h2>
              <Card className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-[14px]">
                  <thead className="bg-sunken text-[12.5px] text-muted">
                    <tr>
                      <th className="px-4 py-2">{r('Scenario', 'Ssenariy')}</th>
                      <th className="px-4 py-2 text-right">{r('Annual cost', 'Yillik')}</th>
                      <th className="px-4 py-2 text-right">{r('Total', 'Jami')}</th>
                      <th className="px-4 py-2 text-right">{r('Gap / year', 'Kamomad / yil')}</th>
                      <th className="px-4 py-2">{r('Status', 'Holat')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {e.budgets.map((q) => {
                      const w = Du(q),
                        U = (j) => (j === null ? '—' : Ie(kr(j, q.currency, b, e.rates)));
                      return (
                        <tr className="border-t border-line" key={q.id}>
                          <td className="px-4 py-2.5">
                            <button type="button" className="font-semibold hover:underline" onClick={() => l(q.id)}>
                              {q.name}
                            </button>
                          </td>
                          <td className="tabular px-4 py-2.5 text-right">{U(w.annual)}</td>
                          <td className="tabular px-4 py-2.5 text-right">{U(w.total)}</td>
                          <td
                            className={classNames(
                              'tabular px-4 py-2.5 text-right font-semibold',
                              w.gap !== null && w.gap > 0 && 'text-bad',
                            )}
                          >
                            {w.gap === null ? '—' : w.gap > 0 ? U(w.gap) : r('covered', 'qoplangan')}
                          </td>
                          <td className="px-4 py-2.5">
                            {w.missing.length ? (
                              <Badge tone="warn">
                                {r(`${w.missing.length} missing`, `${w.missing.length} ta yo‘q`)}
                              </Badge>
                            ) : (
                              <Badge tone="ok">{r('Complete', 'To‘liq')}</Badge>
                            )}
                          </td>
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
    </div>
  );
}
/** The data-review tools are for staff: an editor or admin account. Everyone else is turned away. */
export function cy() {
  const session = useSession();
  if (session.status === 'loading') return 'checking';
  return session.me?.role === 'editor' || session.me?.role === 'admin' ? 'owner' : 'denied';
}
