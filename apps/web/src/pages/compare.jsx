import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { Columns3, FolderOpen, Save, Trash2, X } from 'lucide-react';
import { $e, Ai, Ie, ci, me } from '../lib/core';
import { Ls, Ps, he, ii, we } from '../lib/catalog';
import { useStore } from '../store/store';
import { useI18n } from '../lib/derived';
import {
  Badge,
  Button,
  Card,
  CmpPo,
  CmpTn,
  DeadlineBadge,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  classNames,
} from '../components/ui';
import { CmpFo, Qd, _a } from '../components/shared';
import { Du } from './assistant';

export function ComparePage() {
  const {
      state: e,
      toggleCompare: a,
      clearCompare: t,
      saveComparison: n,
      removeComparison: s,
      loadComparison: r,
      navigate: o,
      notify: u,
    } = useStore(),
    { t: l, tx: c, p, lang: d } = useI18n(),
    [h, m] = React.useState(''),
    [y, E] = React.useState(''),
    C = e.compare.map(he).filter(Boolean),
    v = (j) => (j.kind === 'program' && j.tuition ? Ai(j.tuition, j.durationYears, e.rates) : void 0),
    g = (j) => {
      var k;
      return j.kind === 'program' ? (((k = j.livingUSDPerYear) == null ? void 0 : k.amount) ?? Ls[j.country]) : void 0;
    },
    b = C.map(v).filter((j) => j !== void 0),
    S = b.length > 1 ? Math.min(...b) : void 0,
    A = (j) => (e.displayCurrency === 'UZS' ? `${Ie(ci(j, 'UZS', e.rates))} UZS` : `$${Ie(j)}`),
    q = <span className="text-[13px] text-warn">{l('m.notVerified')}</span>,
    w = [
      {
        label: c('Country', 'Davlat'),
        cell: (j) => p(we[j.country]),
        sig: (j) => j.country,
      },
      {
        label: c('Degree level', 'Daraja'),
        cell: (j) => (j.kind === 'program' ? l(`lvl.${j.level}`) : j.levels.map((k) => l(`lvl.${k}`)).join(', ')),
        sig: (j) => (j.kind === 'program' ? j.level : j.levels.join()),
      },
      {
        label: c('Programme', 'Dastur'),
        cell: (j) =>
          j.kind === 'program' ? p(j.program) : c('Funding — pair with a programme', 'Grant — dastur bilan birga'),
      },
      {
        label: c('Tuition fees', 'O‘qish to‘lovi'),
        cell: (j) =>
          j.kind === 'program' ? (
            j.tuition ? (
              <div>
                <CmpFo m={j.tuition} />
                {S !== void 0 && v(j) === S && (
                  <Badge tone="info" className="mt-1">
                    {c('Lowest listed here', 'Bu yerda eng pasti')}
                  </Badge>
                )}
              </div>
            ) : (
              q
            )
          ) : (
            '—'
          ),
        sig: (j) => String(v(j) ?? 'x'),
      },
      {
        label: c('Estimated living costs / year', 'Taxminiy yashash xarajati / yil'),
        cell: (j) => {
          const k = g(j);
          return k ? (
            <span className="tabular">
              {'≈ '}
              {A(k)} <span className="block text-[12px] text-faint">{l('m.estimate')}</span>
            </span>
          ) : (
            '—'
          );
        },
      },
      {
        label: c('Estimated yearly total', 'Taxminiy yillik jami'),
        cell: (j) => {
          const k = e.budgets.find((F) => F.oppId === j.id);
          if (k) {
            const F = Du(k);
            return F.annual !== null ? (
              <span className="tabular font-semibold">
                {Ie(F.annual)} {k.currency}
                <span className="block text-[12px] font-normal text-faint">
                  {c('from your budget plan', 'byudjet rejangizdan')}
                </span>
              </span>
            ) : (
              <span className="text-[13px] text-warn">
                {c(
                  `Budget plan incomplete (${F.missing.length} missing)`,
                  `Byudjet rejasi to‘liq emas (${F.missing.length} ta yo‘q)`,
                )}
              </span>
            );
          }
          const K = v(j),
            x = g(j);
          return K !== void 0 && x !== void 0 ? (
            <span className="tabular">
              {'≈ '}
              {A(K + x)}
            </span>
          ) : (
            '—'
          );
        },
      },
      {
        label: c('Funding coverage', 'Grant qamrovi'),
        cell: (j) =>
          j.kind === 'scholarship' ? (
            <div>
              <p className="font-semibold">{l(`fund.${j.fundingLabel}`)}</p>
              <p className="mt-1 text-[12.5px] text-muted">{p(j.coverageDetail)}</p>
            </div>
          ) : j.fundingIds.length ? (
            j.fundingIds
              .map((k) => {
                var K;
                return ((K = he(k)) == null ? void 0 : K.kind) === 'scholarship' ? he(k).name : '';
              })
              .join(', ')
          ) : (
            c('None linked', 'Bog‘lanmagan')
          ),
      },
      {
        label: c('Academic requirements', 'Akademik talablar'),
        cell: (j) => <span className="text-[13px]">{j.kind === 'program' ? p(j.reqs.academic) : p(j.academic)}</span>,
      },
      {
        label: c('Language requirements', 'Til talablari'),
        cell: (j) => (
          <span className="text-[13px]">
            {j.kind === 'program' ? (j.reqs.minIELTS ? `IELTS ${j.reqs.minIELTS}` : q) : p(j.languageReq)}
          </span>
        ),
      },
      {
        label: l('dl.deadline'),
        cell: (j) => <DeadlineBadge opp={j} />,
        sig: (j) => `${j.deadline.status}${j.deadline.date ?? ''}`,
      },
      {
        label: c('Required documents', 'Hujjatlar'),
        cell: (j) => (
          <span className="text-[13px]">
            {j.documents.map((k) => p(Ps[k])).join(', ')}
            {!j.documentsVerified && (
              <span className="block text-faint">{c('(general guidance)', '(umumiy yo‘riqnoma)')}</span>
            )}
          </span>
        ),
      },
      {
        label: c('Application fee', 'Ariza to‘lovi'),
        cell: (j) => (j.appFee.status === 'none' ? l('m.none') : j.appFee.status === 'amount' ? j.appFee.amount : q),
        sig: (j) => `${j.appFee.status}${j.appFee.amount ?? ''}`,
      },
      {
        label: c('Official links', 'Rasmiy havolalar'),
        cell: (j) =>
          j.source.source_type === 'demo' ? (
            <span className="text-[13px] text-faint">{c('Demo record', 'Namoyish yozuvi')}</span>
          ) : (
            <CmpTn href={j.kind === 'program' ? j.websiteUrl : j.infoUrl}>{l('a.official')}</CmpTn>
          ),
      },
      {
        label: c('Data verification', 'Ma’lumot tekshiruvi'),
        cell: (j) => (
          <div className="flex flex-col items-start gap-1">
            <CmpPo status={j.source.verification_status} />
            <span className="text-[12px] text-faint">{me(j.source.last_verified_at, d)}</span>
          </div>
        ),
        sig: (j) => j.source.verification_status,
      },
    ],
    U = () => {
      if (!h.trim()) {
        E(c('Name this comparison.', 'Solishtirishga nom bering.'));
        return;
      }
      (n(h.trim(), e.compare), m(''), E(''), u(c('Comparison saved', 'Solishtirish saqlandi')));
    };
  return (
    <div>
      <PageHeader
        eyebrow={l('nav.compare')}
        title={c('Compare opportunities', 'Imkoniyatlarni solishtirish')}
        sub={c(
          'Up to four side by side. Differences are highlighted, but EduBridge does not pick a “best” option — that depends on your priorities.',
          'Yonma-yon to‘rttagacha. Farqlar ajratib ko‘rsatiladi, lekin EduBridge “eng yaxshi”sini tanlamaydi — bu sizning ustuvorliklaringizga bog‘liq.',
        )}
        actions={
          C.length > 0 && (
            <Button variant="ghost" icon={<X size={15} />} onClick={t}>
              {l('a.clear')}
            </Button>
          )
        }
      />
      <Card className="mb-5 flex flex-wrap items-end gap-3 p-4">
        <Field label={c('Add to comparison', 'Solishtirishga qo‘shish')} htmlFor="cmp-add">
          <Select
            id="cmp-add"
            value=""
            className="w-[min(100%,420px)]"
            onChange={(j) => {
              j.target.value && a(j.target.value);
            }}
            disabled={e.compare.length >= 4}
          >
            <option value="">
              {e.compare.length >= 4
                ? c('Maximum of 4 reached', 'Maksimal 4 taga yetildi')
                : c('Choose a university or scholarship…', 'Universitet yoki grantni tanlang…')}
            </option>
            {ii
              .filter((j) => !e.compare.includes(j.id))
              .map((j) => (
                <option value={j.id} key={j.id}>
                  {j.kind === 'program' ? `${j.university} — ${$e(j.program, d)}` : j.name}
                </option>
              ))}
          </Select>
        </Field>
        {C.length > 1 && (
          <div className="flex flex-wrap items-end gap-2">
            <Field label={c('Save as', 'Saqlash nomi')} htmlFor="cmp-name" error={y}>
              <Input
                id="cmp-name"
                value={h}
                onChange={(j) => m(j.target.value)}
                placeholder={c('e.g. Funded bachelor’s options', 'masalan, Grantli bakalavr variantlari')}
              />
            </Field>
            <Button icon={<Save size={15} />} onClick={U}>
              {l('a.save')}
            </Button>
          </div>
        )}
      </Card>
      {C.length === 0 ? (
        <EmptyState
          icon={<Columns3 size={26} />}
          title={c('Nothing to compare yet', 'Hali solishtirish uchun hech narsa yo‘q')}
          body={c(
            'Use the “Compare” button on any university or scholarship, or add one above.',
            'Istalgan universitet yoki grantdagi “Solishtirish” tugmasidan foydalaning yoki yuqoridan qo‘shing.',
          )}
          action={<Button onClick={() => o('universities')}>{l('nav.universities')}</Button>}
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed text-left text-[14px]">
            <colgroup>
              <col className="w-44" />
              {C.map((j) => (
                <col key={j.id} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-line align-top">
                <th className="p-3" />
                {C.map((j) => (
                  <th className="p-3 font-normal" key={j.id}>
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        className="text-left font-bold leading-snug hover:underline"
                        onClick={() => o(j.kind === 'program' ? 'university' : 'scholarship', j.id)}
                      >
                        {j.kind === 'program' ? j.university : _a(j, d)}
                      </button>
                      <button
                        type="button"
                        aria-label={c('Remove', 'Olib tashlash')}
                        className="rounded p-1 text-muted hover:bg-sunken"
                        onClick={() => a(j.id)}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {w.map((j) => {
                const k = !!j.sig && C.length > 1 && new Set(C.map((K) => j.sig(K))).size > 1;
                return (
                  <tr
                    className={classNames('border-b border-line align-top last:border-0', k && 'bg-teal-soft/25')}
                    key={j.label}
                  >
                    <th scope="row" className="p-3 text-[12.5px] font-semibold text-muted">
                      {j.label}
                    </th>
                    {C.map((K) => (
                      <td className="min-w-0 break-words p-3" key={K.id}>
                        {j.cell(K)}
                      </td>
                    ))}
                  </tr>
                );
              })}
              <tr className="align-top">
                <th scope="row" className="p-3 text-[12.5px] font-semibold text-muted">
                  {c('Actions', 'Amallar')}
                </th>
                {C.map((j) => (
                  <td className="p-3" key={j.id}>
                    <Qd o={j} compact={!0} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </Card>
      )}
      {C.length > 1 && (
        <p className="mt-2 text-[12.5px] text-faint">
          {c(
            'Rows with a tinted background differ between the options.',
            'Rangli fondagi qatorlar variantlar o‘rtasida farq qiladi.',
          )}
        </p>
      )}
      {e.comparisons.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[17px] font-bold">{c('Saved comparisons', 'Saqlangan solishtirishlar')}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {e.comparisons.map((j) => (
              <Card className="flex flex-wrap items-center justify-between gap-2 p-4" key={j.id}>
                <div className="min-w-0">
                  <p className="font-semibold">{j.name}</p>
                  <p className="truncate text-[12.5px] text-muted">
                    {j.ids
                      .map((k) => {
                        const K = he(k);
                        return K ? (K.kind === 'program' ? K.university : K.name) : '';
                      })
                      .join(' · ')}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    icon={<FolderOpen size={14} />}
                    onClick={() => {
                      (r(j.ids), u(c('Comparison loaded', 'Solishtirish yuklandi')));
                    }}
                  >
                    {c('Open', 'Ochish')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={l('a.delete')}
                    icon={<Trash2 size={14} />}
                    onClick={() => s(j.id)}
                  />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
export const Ll = {
  tuition: ['Tuition fees', 'O‘qish to‘lovi'],
  accommodation: ['Accommodation', 'Turar joy'],
  food: ['Food', 'Ovqat'],
  transport: ['Transportation', 'Transport'],
  insurance: ['Insurance', 'Sug‘urta'],
  visa: ['Visa and administrative', 'Viza va ma’muriy'],
  travel: ['Travel', 'Yo‘l (aviachipta)'],
  other: ['Other costs', 'Boshqa xarajatlar'],
};
export const Rq = ['USD', 'UZS', 'EUR', 'GBP', 'MYR', 'TRY', 'HUF', 'KRW', 'JPY'];
