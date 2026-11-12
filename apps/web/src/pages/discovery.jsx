import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  MapPin,
  RotateCcw,
  SearchX,
  SlidersHorizontal,
  UserCog,
  X,
} from 'lucide-react';
import { $e, Ai, Ie, ci } from '../lib/core';
import { Pu, Yo, ms, we, xe } from '../lib/catalog';
import { useStore } from '../store/store';
import { deadlineStatus, useDerivedData, useI18n } from '../lib/derived';
import {
  Button,
  Callout,
  Card,
  CmpHa,
  EmptyState,
  Field,
  Input,
  Pa,
  PageHeader,
  Select,
  Wd,
  classNames,
} from '../components/ui';
import { RS } from '../components/shared';

export function DiscoveryPage({ kind: e }) {
  const { state: a, updateProfile: t, navigate: n, notify: s } = useStore(),
    { matches: r, today: o } = useDerivedData(),
    { t: u, tx: l, p: c, lang: p } = useI18n(),
    d = a.profile,
    [h, m] = React.useState(''),
    [y, E] = React.useState(''),
    [C, v] = React.useState((d == null ? void 0 : d.targetLevel) ?? ''),
    [g, b] = React.useState(''),
    [S, A] = React.useState(''),
    [q, w] = React.useState(!1),
    [U, j] = React.useState(''),
    [k, K] = React.useState(!1),
    [x, F] = React.useState(''),
    [O, N] = React.useState(''),
    [I, f] = React.useState(''),
    [M, D] = React.useState(!1),
    [R, _] = React.useState(!1),
    [de, T] = React.useState(!1),
    [ae, B] = React.useState(''),
    [Z, oe] = React.useState(''),
    [ve, vt] = React.useState(!1),
    [bt, Bn] = React.useState(!1),
    [Ft, Ri] = React.useState(!1),
    [ki, Zs] = React.useState('relevance'),
    [Ln, Xo] = React.useState(!1),
    [Pn, P] = React.useState(!1),
    ie = e === 'program',
    Pe = React.useMemo(() => {
      const V = h.trim().toLowerCase(),
        ic = (ie ? Yo : Pu)
          .filter((re) => {
            var Me, wa;
            return (
              !((Me = a.dataOverrides[(re.kind === 'program', re.universityId ?? re.id)]) != null && Me.inactive) &&
              !((wa = a.dataOverrides[re.id]) != null && wa.inactive)
            );
          })
          .filter((re) => {
            var Fn, Dn, xi;
            const Me = r.get(re.id);
            if (
              (V &&
                ![
                  re.kind === 'program'
                    ? `${re.university} ${re.program.en} ${re.program.uz} ${re.city}`
                    : `${re.name} ${re.provider.en} ${re.summary.en} ${re.summary.uz}`,
                  we[re.country].en,
                  we[re.country].uz,
                ]
                  .join(' ')
                  .toLowerCase()
                  .includes(V)) ||
              (y && re.country !== y) ||
              (M && re.source.verification_status === 'demo') ||
              (R && (Me == null ? void 0 : Me.overall) === 'not_eligible')
            )
              return !1;
            const wa = deadlineStatus(re, o);
            if (
              (x === 'open' && wa.kind === 'closed') ||
              (x === 'within90' && !(wa.date && wa.days !== void 0 && wa.days >= 0 && wa.days <= 90)) ||
              (x === 'known' && !(wa.kind === 'upcoming' || wa.kind === 'demo'))
            )
              return !1;
            if (re.kind === 'program') {
              if (
                (C && re.level !== C) ||
                (g && !(re.subjects ? re.subjects.includes(g) : re.subject === g)) ||
                (S && (!re.tuition || Ai(re.tuition, re.durationYears, a.rates) > Number(S))) ||
                (q && !re.fundingIds.length) ||
                (U && re.instruction !== U) ||
                (k &&
                  Me &&
                  ((Fn = Me.checks.find((Ma) => Ma.dim === 'academic')) == null ? void 0 : Fn.status) !== 'met') ||
                (O && re.durationYears > Number(O)) ||
                (I && re.sector !== I)
              )
                return !1;
            } else if (
              (C && !re.levels.includes(C)) ||
              (g && re.subjects !== 'all' && !re.subjects.includes(g)) ||
              (de && re.citizenship.uzbekistan !== 'yes') ||
              (ae && re.type !== ae) ||
              (Z && (re.fundingType ?? 'unknown') !== Z) ||
              (ve && re.type !== 'need') ||
              (bt && re.appFee.status !== 'none') ||
              (Ft &&
                Me &&
                ((Dn = Me.checks.find((Ma) => Ma.dim === 'language')) == null ? void 0 : Dn.status) === 'not_met') ||
              (k &&
                Me &&
                ((xi = Me.checks.find((Ma) => Ma.dim === 'academic')) == null ? void 0 : xi.status) === 'not_met')
            )
              return !1;
            return !0;
          }),
        tc = (re) => {
          const Me = deadlineStatus(re, o);
          return Me.kind === 'closed' ? 'z' + (Me.date ?? '') : (Me.date ?? 'y');
        };
      return (
        ic.sort((re, Me) => {
          var Fn, Dn;
          if (ki === 'relevance')
            return (
              (((Fn = r.get(Me.id)) == null ? void 0 : Fn.score) ?? 0) -
                (((Dn = r.get(re.id)) == null ? void 0 : Dn.score) ?? 0) ||
              (re.source.verification_status === 'demo' ? 1 : 0) - (Me.source.verification_status === 'demo' ? 1 : 0)
            );
          if (ki === 'tuition') {
            const xi = (Ma) =>
              Ma.kind === 'program' && Ma.tuition ? Ai(Ma.tuition, Ma.durationYears, a.rates) : 1 / 0;
            return xi(re) - xi(Me);
          }
          if (ki === 'deadline') return tc(re).localeCompare(tc(Me));
          if (ki === 'country') return $e(we[re.country], p).localeCompare($e(we[Me.country], p));
          const wa = (xi) => (xi.kind === 'program' ? xi.university : xi.name);
          return wa(re).localeCompare(wa(Me));
        }),
        ic
      );
    }, [h, y, C, g, S, q, U, k, x, O, I, M, R, de, ae, Z, ve, bt, Ft, ki, r, o, a.rates, p, ie]),
    Ne = () => {
      (m(''),
        E(''),
        v(''),
        b(''),
        A(''),
        w(!1),
        j(''),
        K(!1),
        F(''),
        N(''),
        f(''),
        D(!1),
        _(!1),
        T(!1),
        B(''),
        oe(''),
        vt(!1),
        Bn(!1),
        Ri(!1));
    },
    Dt =
      (d == null ? void 0 : d.tuitionBudget) !== void 0
        ? d.currency === 'UZS'
          ? d.tuitionBudget * a.rates.UZS
          : d.tuitionBudget
        : void 0,
    Gi = (
      <Card className="flex flex-col gap-4 p-4">
        <Field label={u('a.search')} htmlFor="f-q">
          <Input
            id="f-q"
            type="search"
            value={h}
            placeholder={
              ie
                ? l('University, programme, city', 'Universitet, dastur, shahar')
                : l('Scholarship or provider', 'Grant yoki tashkilot')
            }
            onChange={(V) => m(V.target.value)}
          />
        </Field>
        <Field label={l('Country', 'Davlat')} htmlFor="f-c">
          <Select id="f-c" value={y} onChange={(V) => E(V.target.value)}>
            <option value="">{u('m.all')}</option>
            {[...ms, ...(ie ? [] : [...new Set(Pu.map((V) => V.country))].filter((V) => !ms.includes(V)))].map((V) => (
              <option value={V} key={V}>
                {c(we[V])}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={l('Degree level', 'Daraja')} htmlFor="f-l">
          <Select id="f-l" value={C} onChange={(V) => v(V.target.value)}>
            <option value="">{u('m.all')}</option>
            {['bachelor', 'master', 'phd'].map((V) => (
              <option value={V} key={V}>
                {u(`lvl.${V}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={l('Subject', 'Yo‘nalish')} htmlFor="f-s">
          <Select id="f-s" value={g} onChange={(V) => b(V.target.value)}>
            <option value="">{u('m.all')}</option>
            {Object.keys(xe).map((V) => (
              <option value={V} key={V}>
                {c(xe[V])}
              </option>
            ))}
          </Select>
        </Field>
        {ie ? (
          <>
            <Field
              label={l('Max tuition per year (USD)', 'Yillik maksimal to‘lov (USD)')}
              htmlFor="f-t"
              hint={l(
                'Programmes without a verified fee are hidden when this is set.',
                'Bu belgilansa, to‘lovi tekshirilmagan dasturlar yashiriladi.',
              )}
            >
              <Input id="f-t" inputMode="numeric" value={S} onChange={(V) => A(V.target.value.replace(/[^\d]/g, ''))} />
            </Field>
            <Field label={l('Language of instruction', 'O‘qitish tili')} htmlFor="f-lang">
              <Select id="f-lang" value={U} onChange={(V) => j(V.target.value)}>
                <option value="">{u('m.all')}</option>
                {['English', 'German', 'Korean', 'Turkish', 'Hungarian', 'Mixed', 'Unknown'].map((V) => (
                  <option key={V}>{V}</option>
                ))}
              </Select>
            </Field>
            <Field label={l('Max programme length (years)', 'Maksimal davomiylik (yil)')} htmlFor="f-y">
              <Select id="f-y" value={O} onChange={(V) => N(V.target.value)}>
                <option value="">{u('m.any')}</option>
                {['1', '2', '3', '4'].map((V) => (
                  <option key={V}>{V}</option>
                ))}
              </Select>
            </Field>
            <Field label={l('Institution type', 'Muassasa turi')} htmlFor="f-sec">
              <Select id="f-sec" value={I} onChange={(V) => f(V.target.value)}>
                <option value="">{u('m.all')}</option>
                <option value="public">{l('Public', 'Davlat')}</option>
                <option value="private">{l('Private', 'Xususiy')}</option>
              </Select>
            </Field>
            <CmpHa checked={q} onChange={w} label={l('Has linked funding', 'Grant bog‘langan')} />
          </>
        ) : (
          <>
            <Field label={l('Scholarship type', 'Grant turi')} htmlFor="f-ty">
              <Select id="f-ty" value={ae} onChange={(V) => B(V.target.value)}>
                <option value="">{u('m.all')}</option>
                {['government', 'merit', 'need', 'waiver', 'research', 'exchange', 'foundation'].map((V) => (
                  <option value={V} key={V}>
                    {u(`ty.${V}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={l('Funding', 'Moliyalashtirish')} htmlFor="f-fu">
              <Select id="f-fu" value={Z} onChange={(V) => oe(V.target.value)}>
                <option value="">{u('m.all')}</option>
                {[
                  'full',
                  'full_tuition',
                  'partial_tuition',
                  'stipend',
                  'need_based',
                  'assistantship',
                  'fee_waiver',
                  'loan',
                ].map((V) => (
                  <option value={V} key={V}>
                    {u(`ft.${V}`)}
                  </option>
                ))}
                <option value="unknown">{u('fund.unknown')}</option>
              </Select>
            </Field>
            <CmpHa
              checked={de}
              onChange={T}
              label={l('Confirmed open to Uzbek citizens', 'O‘zbekiston fuqarolari uchun tasdiqlangan')}
            />
            <CmpHa checked={ve} onChange={vt} label={l('Need-based only', 'Faqat ehtiyojga asoslangan')} />
            <CmpHa
              checked={bt}
              onChange={Bn}
              label={l('No application fee (verified)', 'Ariza to‘lovi yo‘q (tekshirilgan)')}
            />
            {d && (
              <CmpHa
                checked={Ft}
                onChange={Ri}
                label={l(
                  'Hide where my language score is below the minimum',
                  'Til balim minimumdan past bo‘lganlarini yashirish',
                )}
              />
            )}
          </>
        )}
        <Field label={u('dl.deadline')} htmlFor="f-d">
          <Select id="f-d" value={x} onChange={(V) => F(V.target.value)}>
            <option value="">{u('m.all')}</option>
            <option value="open">{l('Hide closed', 'Yopilganlarni yashirish')}</option>
            <option value="within90">{l('Due within 90 days', '90 kun ichida')}</option>
            <option value="known">{l('Confirmed date only', 'Faqat tasdiqlangan sana')}</option>
          </Select>
        </Field>
        {d && (
          <CmpHa
            checked={k}
            onChange={K}
            label={
              ie
                ? l('I appear to meet the published academic minimum', 'E’lon qilingan akademik minimumga mos kelaman')
                : l(
                    'Hide where my academic score is below the minimum',
                    'Akademik bahom minimumdan past bo‘lganlarini yashirish',
                  )
            }
          />
        )}
        {d && <CmpHa checked={R} onChange={_} label={l('Hide “not eligible”', '“Mos emas”larni yashirish')} />}
        <CmpHa checked={M} onChange={D} label={l('Hide demo records', 'Namoyish yozuvlarini yashirish')} />
        <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={Ne}>
          {l('Reset filters', 'Filtrlarni tozalash')}
        </Button>
      </Card>
    );
  return (
    <div>
      {ie && (
        <button
          type="button"
          onClick={() => n('universities')}
          className="mb-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-fg"
        >
          {'← '}
          {l('Back to simple search', 'Oddiy qidiruvga qaytish')}
        </button>
      )}
      <PageHeader
        eyebrow={ie ? l('University discovery', 'Universitet izlash') : l('Scholarship directory', 'Grantlar katalogi')}
        title={
          ie
            ? l('Universities and programmes', 'Universitetlar va dasturlar')
            : l('Scholarships and funding', 'Grantlar va moliyalashtirish')
        }
        sub={
          ie
            ? l(
                'Each match shows which published requirements appear satisfied, which are not, and which need checking. Meeting a minimum does not guarantee admission.',
                'Har bir moslik qaysi talablar bajarilgan, qaysilari yo‘q va qaysilarini tekshirish kerakligini ko‘rsatadi. Minimumga mos kelish qabulni kafolatlamaydi.',
              )
            : l(
                'Real scholarships checked against official sources, plus a few clearly labelled demo records. Coverage is described exactly as the source states.',
                'Rasmiy manbalar bilan tekshirilgan haqiqiy grantlar va aniq belgilangan bir nechta namoyish yozuvlari. Qamrov manbada qanday bo‘lsa, shunday ko‘rsatilgan.',
              )
        }
        actions={
          d ? (
            <Button icon={<UserCog size={16} />} onClick={() => P(!Pn)} aria-expanded={Pn}>
              {l('Adjust my preferences', 'Afzalliklarimni o‘zgartirish')}
            </Button>
          ) : (
            <Button variant="primary" onClick={() => n('onboarding')}>
              {l('Create profile to see matches', 'Moslikni ko‘rish uchun profil yarating')}
            </Button>
          )
        }
      />
      {d && Pn && (
        <Card className="mb-5 flex flex-col gap-4 p-4">
          <p className="text-[13.5px] text-muted">
            {l(
              'Changes save to your profile and recommendations update immediately.',
              'O‘zgarishlar profilingizga saqlanadi va tavsiyalar darhol yangilanadi.',
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {ms.map((V) => (
              <Pa
                active={d.preferredCountries.includes(V)}
                onClick={() => {
                  t({
                    preferredCountries: d.preferredCountries.includes(V)
                      ? d.preferredCountries.filter((Hi) => Hi !== V)
                      : [...d.preferredCountries, V],
                    avoidCountries: d.avoidCountries.filter((Hi) => Hi !== V),
                  });
                }}
                key={V}
              >
                {c(we[V])}
              </Pa>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={l('Field of study', 'Yo‘nalish')} htmlFor="pf-f">
              <Select
                id="pf-f"
                value={d.field}
                onChange={(V) => {
                  (t({
                    field: V.target.value,
                  }),
                    s(l('Field updated', 'Yo‘nalish yangilandi')));
                }}
              >
                {Object.keys(xe).map((V) => (
                  <option value={V} key={V}>
                    {c(xe[V])}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label={l(`Tuition budget / year (${d.currency})`, `O‘qish byudjeti / yil (${d.currency})`)}
              htmlFor="pf-t"
            >
              <Input
                id="pf-t"
                inputMode="numeric"
                value={d.tuitionBudget ?? ''}
                onChange={(V) =>
                  t({
                    tuitionBudget: V.target.value ? Number(V.target.value.replace(/[^\d]/g, '')) : void 0,
                  })
                }
              />
            </Field>
            <Field
              label={l(`Total budget / year (${d.currency})`, `Umumiy byudjet / yil (${d.currency})`)}
              htmlFor="pf-tt"
            >
              <Input
                id="pf-tt"
                inputMode="numeric"
                value={d.totalBudget ?? ''}
                onChange={(V) =>
                  t({
                    totalBudget: V.target.value ? Number(V.target.value.replace(/[^\d]/g, '')) : void 0,
                  })
                }
              />
            </Field>
          </div>
          {Dt !== void 0 && d.currency === 'UZS' && (
            <p className="text-[12.5px] text-faint">
              ≈ ${Ie(Dt)}
              {' USD '}
              {u('m.approx')}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <CmpHa
              checked={d.needsFullFunding}
              onChange={(V) =>
                t({
                  needsFullFunding: V,
                })
              }
              label={l('I need full funding', 'To‘liq moliyalashtirish kerak')}
            />
          </div>
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label={l('Filters', 'Filtrlar')}>
          {Gi}
        </aside>
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px] text-muted" aria-live="polite">
              {u('m.results', {
                n: Pe.length,
              })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="lg:hidden"
                icon={<SlidersHorizontal size={15} />}
                aria-expanded={Ln}
                onClick={() => Xo(!Ln)}
              >
                {l('Filters', 'Filtrlar')}
              </Button>
              <label htmlFor="sort" className="text-[13px] text-muted">
                {l('Sort', 'Saralash')}
              </label>
              <Select id="sort" value={ki} onChange={(V) => Zs(V.target.value)} className="h-9 w-auto text-[13px]">
                <option value="relevance">{l('Relevance to my profile', 'Profilimga mosligi')}</option>
                {ie && <option value="tuition">{l('Tuition (low to high)', 'To‘lov (arzonidan)')}</option>}
                <option value="deadline">{l('Deadline (soonest)', 'Muddat (yaqinidan)')}</option>
                <option value="country">{l('Country', 'Davlat')}</option>
                <option value="name">{l('Name', 'Nomi')}</option>
              </Select>
            </div>
          </div>
          {Ln && <div className="mb-4 lg:hidden">{Gi}</div>}
          {!d && (
            <div className="mb-4">
              <Callout>
                {l(
                  'You are browsing without a profile. Create one to see which requirements you appear to meet.',
                  'Siz profilsiz ko‘ryapsiz. Qaysi talablarga mos kelishingizni ko‘rish uchun profil yarating.',
                )}
              </Callout>
            </div>
          )}
          {Pe.length === 0 ? (
            <EmptyState
              icon={<SearchX size={26} />}
              title={l('No matches for these filters', 'Bu filtrlar bo‘yicha natija yo‘q')}
              body={l(
                'Try removing a filter. EduBridge keeps a small, carefully checked dataset rather than a large unreliable one.',
                'Biror filtrni olib tashlang. EduBridge katta, ishonchsiz bazaning o‘rniga kichik, puxta tekshirilgan ma’lumotlarni saqlaydi.',
              )}
              action={<Button onClick={Ne}>{l('Reset filters', 'Filtrlarni tozalash')}</Button>}
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {Pe.map((V) => (
                <RS o={V} match={r.get(V.id)} key={V.id} />
              ))}
            </div>
          )}
          {ie && (
            <p className="mt-4 text-[12.5px] text-faint">
              {l(
                'Tuition converted at illustrative rates; edit them in Settings. ',
                'To‘lovlar taxminiy kurslar bo‘yicha aylantirilgan; ularni Sozlamalarda o‘zgartiring. ',
              )}
              {a.displayCurrency === 'UZS' ? `1 USD ≈ ${Ie(ci(1, 'UZS', a.rates))} UZS` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
const Xn = {
  low: 3e3,
  mid: 8e3,
  high: 15e3,
  any: 1 / 0,
};
const Uh = (e, a) => (e.subjects ? e.subjects.includes(a) : e.subject === a);
function Yi({ active: e, onClick: a, children: t, sub: n }) {
  return (
    <button
      type="button"
      aria-pressed={e}
      onClick={a}
      className={classNames(
        'flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors',
        e ? 'border-teal bg-teal-soft/60' : 'border-line bg-surface hover:border-teal/40',
      )}
    >
      <span className="min-w-0">
        <span className="block text-[15.5px] font-bold">{t}</span>
        {n && <span className="mt-0.5 block text-[13px] text-muted">{n}</span>}
      </span>
      <span
        className={classNames(
          'grid h-6 w-6 shrink-0 place-items-center rounded-full border-2',
          e ? 'border-teal bg-teal text-white' : 'border-line',
        )}
      >
        {e && <Check size={14} strokeWidth={3} />}
      </span>
    </button>
  );
}
export function FinderPage() {
  const { state: e, setFinder: a, navigate: t } = useStore(),
    { matches: n } = useDerivedData(),
    { t: s, tx: r, p: o } = useI18n(),
    u = e.profile,
    [l, c] = React.useState(
      () =>
        e.finder ?? {
          level: (u == null ? void 0 : u.targetLevel) ?? 'bachelor',
          subject: (u == null ? void 0 : u.field) ?? 'any',
          countries: (u == null ? void 0 : u.preferredCountries) ?? [],
          budget: 'any',
          english: !0,
          done: !1,
        },
    ),
    [p, d] = React.useState(0),
    h = (w) =>
      c((U) => ({
        ...U,
        ...w,
      })),
    m = React.useMemo(
      () =>
        Yo.filter((w) => {
          var U;
          return !((U = e.dataOverrides[w.universityId ?? w.id]) != null && U.inactive);
        }),
      [e.dataOverrides],
    ),
    y = React.useMemo(
      () => [...new Set(m.map((w) => w.country))].sort((w, U) => we[w].en.localeCompare(we[U].en)),
      [m],
    ),
    E = React.useMemo(() => Object.keys(xe).filter((w) => m.some((U) => Uh(U, w))), [m]),
    C = (w, U) =>
      !(
        w.level !== U.level ||
        (U.subject !== 'any' && !Uh(w, U.subject)) ||
        (U.countries.length && !U.countries.includes(w.country)) ||
        (U.english && w.instruction !== 'English') ||
        (U.budget !== 'any' && (!w.tuition || Ai(w.tuition, w.durationYears, e.rates) > Xn[U.budget]))
      ),
    v = React.useMemo(() => m.filter((w) => C(w, l)).length, [l, e.rates]),
    g = (w) => (e.displayCurrency === 'UZS' ? `${Ie(Math.round(ci(w, 'UZS', e.rates) / 1e6))} mln so‘m` : `$${Ie(w)}`),
    b = e.finder;
  if (b != null && b.done) {
    const w = {
        eligible: 0,
        verify: 1,
        missing: 2,
        not_eligible: 3,
      },
      U = (N, I) => {
        const f = n.get(N.id),
          M = n.get(I.id);
        return (
          (f ? w[f.overall] : 1) - (M ? w[M.overall] : 1) ||
          ((M == null ? void 0 : M.score) ?? 0) - ((f == null ? void 0 : f.score) ?? 0)
        );
      },
      j = m.filter((N) => C(N, b)).sort(U),
      k = m.filter((N) => !C(N, b) && N.level === b.level).sort(U),
      K = (N) => {
        const I = n.get(N.id);
        return I
          ? {
              eligible: {
                dot: 'bg-ok',
                text: r('Good match for you', 'Sizga mos'),
              },
              verify: {
                dot: 'bg-info',
                text: r('Looks possible — check the requirements', 'Mumkin — talablarni tekshiring'),
              },
              missing: {
                dot: 'bg-warn',
                text: r('Add your scores to check', 'Tekshirish uchun natijalaringizni kiriting'),
              },
              not_eligible: {
                dot: 'bg-bad',
                text: r('May not fit your profile', 'Profilingizga mos kelmasligi mumkin'),
              },
            }[I.overall]
          : {
              dot: 'bg-faint',
              text: r('Create a profile to check if you qualify', 'Mosligingizni bilish uchun profil yarating'),
            };
      },
      x = (N) =>
        N.tuition
          ? r(
              `about ${g(Ai(N.tuition, N.durationYears, e.rates))} a year`,
              `yiliga taxminan ${g(Ai(N.tuition, N.durationYears, e.rates))}`,
            )
          : r('Tuition not confirmed', 'To‘lov aniqlanmagan'),
      F = ({ o: N }) => {
        const I = K(N);
        return (
          <li>
            <button
              type="button"
              onClick={() => t('university', N.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-4 text-left shadow-card transition-colors hover:border-teal/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-bold leading-snug">{N.university}</p>
                <p className="mt-0.5 text-[14px] text-muted">{o(N.program)}</p>
                {N.source.verification_status !== 'demo' && (
                  <p className="mt-0.5 text-[12px] font-semibold text-ok">
                    {N.applyUrl
                      ? r('Official application link inside', 'Ichida rasmiy ariza havolasi bor')
                      : r('Official admissions page linked', 'Rasmiy qabul sahifasi bog‘langan')}
                  </p>
                )}
                <div className="mt-1">
                  <Wd opp={N} />
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px]">
                  <span className="inline-flex items-center gap-1 text-muted">
                    <MapPin size={14} aria-hidden={!0} />
                    {o(we[N.country])}
                  </span>
                  <span className="tabular font-semibold">{x(N)}</span>
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-[13.5px] font-semibold">
                  <span className={classNames('h-2.5 w-2.5 rounded-full', I.dot)} aria-hidden={!0} />
                  {I.text}
                </p>
              </div>
              <ChevronRight size={20} className="shrink-0 text-faint" aria-hidden={!0} />
            </button>
          </li>
        );
      },
      O = [
        s(`lvl.${b.level}`),
        b.subject === 'any' ? r('Any subject', 'Har qanday yo‘nalish') : o(xe[b.subject]),
        b.countries.length ? b.countries.map((N) => o(we[N])).join(', ') : r('Any country', 'Har qanday davlat'),
        b.budget === 'any'
          ? r('Any budget', 'Har qanday byudjet')
          : r(`Up to ${g(Xn[b.budget])}/yr`, `Yiliga ${g(Xn[b.budget])} gacha`),
        b.english ? r('Taught in English', 'Ingliz tilida') : r('Any language', 'Har qanday til'),
      ];
    return (
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">{r('Step 2 of 3 · Your options', '2/3-qadam · Variantlaringiz')}</p>
        <h1 className="mt-1 text-[26px] font-extrabold md:text-[30px]">
          {j.length
            ? r(
                `${j.length} ${j.length === 1 ? 'university fits' : 'universities fit'} your answers`,
                `Javoblaringizga ${j.length} ta universitet mos`,
              )
            : r('No exact matches yet', 'Hozircha aniq mos variant yo‘q')}
        </h1>
        <p className="mt-1.5 text-[15px] text-muted">
          {r(
            'Tap a university to see costs, requirements and how to apply.',
            'Xarajatlar, talablar va ariza tartibini ko‘rish uchun universitetni bosing.',
          )}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {O.map((N) => (
            <span className="rounded-full bg-sunken px-3 py-1 text-[13px] font-semibold text-muted" key={N}>
              {N}
            </span>
          ))}
          <Button
            size="sm"
            variant="ghost"
            icon={<RotateCcw size={14} />}
            onClick={() => {
              (c(b),
                d(0),
                a({
                  ...b,
                  done: !1,
                }));
            }}
          >
            {r('Change answers', 'Javoblarni o‘zgartirish')}
          </Button>
        </div>
        {j.length > 0 ? (
          <ul className="mt-5 flex flex-col gap-3">
            {j.map((N) => (
              <F o={N} key={N.id} />
            ))}
          </ul>
        ) : (
          <Card className="mt-5 p-5 text-[15px]">
            {r(
              'Try choosing more countries or a higher budget. Below are other options at your degree level.',
              'Ko‘proq davlat yoki kattaroq byudjet tanlab ko‘ring. Quyida sizning darajangizdagi boshqa variantlar.',
            )}
          </Card>
        )}
        {k.length > 0 && (
          <details className="group mt-6" open={j.length === 0}>
            <summary className="cursor-pointer list-none rounded-lg py-2 text-[15px] font-bold text-muted hover:text-fg">
              <span className="inline-flex items-center gap-1.5">
                <ChevronRight size={18} className="transition-transform group-open:rotate-90" aria-hidden={!0} />
                {r(
                  `${k.length} more that don’t match every answer`,
                  `Barcha javoblarga mos kelmaydigan yana ${k.length} ta`,
                )}
              </span>
            </summary>
            <ul className="mt-2 flex flex-col gap-3">
              {k.map((N) => (
                <F o={N} key={N.id} />
              ))}
            </ul>
          </details>
        )}
        <p className="mt-6 text-[13px] text-faint">
          {r(
            'Records marked “(sample)” are demo data. “Good match” means the published minimums we hold appear to be met — it does not guarantee admission.',
            '“(sample)” deb belgilanganlar namoyish ma’lumotlari. “Sizga mos” — bizdagi e’lon qilingan minimumlar bajarilgan ko‘rinadi degani, qabulni kafolatlamaydi.',
          )}
        </p>
        <Button
          className="mt-4"
          variant="ghost"
          icon={<SlidersHorizontal size={15} />}
          onClick={() => t('universities', 'advanced')}
        >
          {r('Advanced search with all filters', 'Barcha filtrlar bilan kengaytirilgan qidiruv')}
        </Button>
      </div>
    );
  }
  const S = [
      {
        title: r('What do you want to study?', 'Qaysi darajada o‘qimoqchisiz?'),
        hint: r('Choose the degree you are applying for.', 'Ariza beradigan darajangizni tanlang.'),
        body: ['bachelor', 'master', 'phd'].map((w) => (
          <Yi
            active={l.level === w}
            onClick={() =>
              h({
                level: w,
              })
            }
            sub={
              {
                bachelor: r('After school or lyceum', 'Maktab yoki litseydan keyin'),
                master: r('After a bachelor’s degree', 'Bakalavrdan keyin'),
                phd: r('After a master’s degree', 'Magistraturadan keyin'),
              }[w]
            }
            key={w}
          >
            {s(`lvl.${w}`)}
          </Yi>
        )),
      },
      {
        title: r('Which subject?', 'Qaysi yo‘nalish?'),
        hint: r('Pick one, or “Not sure yet”.', 'Bittasini tanlang yoki “Hali bilmayman”.'),
        body: [
          <Yi
            active={l.subject === 'any'}
            onClick={() =>
              h({
                subject: 'any',
              })
            }
            key={'any'}
          >
            {r('Not sure yet', 'Hali bilmayman')}
          </Yi>,
          ...E.map((w) => (
            <Yi
              active={l.subject === w}
              onClick={() =>
                h({
                  subject: w,
                })
              }
              key={w}
            >
              {o(xe[w])}
            </Yi>
          )),
        ],
      },
      {
        title: r('Where would you like to study?', 'Qayerda o‘qishni xohlaysiz?'),
        hint: r('Choose as many as you like.', 'Xohlagancha tanlang.'),
        body: [
          <Yi
            active={l.countries.length === 0}
            onClick={() =>
              h({
                countries: [],
              })
            }
            key={'any'}
          >
            {r('Anywhere', 'Farqi yo‘q')}
          </Yi>,
          ...y.map((w) => (
            <Yi
              active={l.countries.includes(w)}
              onClick={() =>
                h({
                  countries: l.countries.includes(w) ? l.countries.filter((U) => U !== w) : [...l.countries, w],
                })
              }
              key={w}
            >
              {o(we[w])}
            </Yi>
          )),
        ],
      },
      {
        title: r('How much can you pay for tuition each year?', 'Yiliga o‘qish uchun qancha to‘lay olasiz?'),
        hint: r(
          'Tuition only. Living costs come on top — you can plan them later.',
          'Faqat o‘qish to‘lovi. Yashash xarajatlari alohida — ularni keyin rejalashtirasiz.',
        ),
        body: ['low', 'mid', 'high', 'any'].map((w) => (
          <Yi
            active={l.budget === w}
            onClick={() =>
              h({
                budget: w,
              })
            }
            sub={
              w === 'low'
                ? r('Often needs a scholarship', 'Ko‘pincha grant kerak bo‘ladi')
                : w === 'any'
                  ? r('Show everything', 'Hammasini ko‘rsatish')
                  : void 0
            }
            key={w}
          >
            {w === 'any'
              ? r('I’m not sure / any amount', 'Bilmayman / farqi yo‘q')
              : r(`Up to ${g(Xn[w])}`, `${g(Xn[w])} gacha`)}
          </Yi>
        )),
      },
      {
        title: r('Which teaching language?', 'Qaysi tilda o‘qiysiz?'),
        hint: r('Most international students choose English.', 'Ko‘pchilik xalqaro talabalar ingliz tilini tanlaydi.'),
        body: [
          <Yi
            active={l.english}
            onClick={() =>
              h({
                english: !0,
              })
            }
            key={'en'}
          >
            {r('English only', 'Faqat ingliz tili')}
          </Yi>,
          <Yi
            active={!l.english}
            onClick={() =>
              h({
                english: !1,
              })
            }
            sub={r('Includes Korean, German and others', 'Koreys, nemis va boshqa tillar ham')}
            key={'any'}
          >
            {r('Any language', 'Har qanday til')}
          </Yi>,
        ],
      },
    ],
    A = p === S.length - 1,
    q = S[p];
  return (
    <div className="mx-auto max-w-xl">
      <p className="eyebrow">
        {r(`Step 1 of 3 · Question ${p + 1} of ${S.length}`, `1/3-qadam · ${S.length} ta savoldan ${p + 1}-savol`)}
      </p>
      <div className="mt-2 flex gap-1.5" aria-hidden={!0}>
        {S.map((w, U) => (
          <span className={classNames('h-1.5 flex-1 rounded-full', U <= p ? 'bg-teal' : 'bg-line')} key={U} />
        ))}
      </div>
      <h1 className="mt-5 text-[26px] font-extrabold leading-tight md:text-[30px]">{q.title}</h1>
      <p className="mt-1.5 text-[15px] text-muted">{q.hint}</p>
      <div className="mt-5 flex flex-col gap-2.5" role="group" aria-label={q.title}>
        {q.body}
      </div>
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button icon={<ArrowLeft size={16} />} disabled={p === 0} onClick={() => d(p - 1)}>
          {s('a.back')}
        </Button>
        <Button
          variant="primary"
          className="h-11 px-5"
          onClick={() => {
            A
              ? (a({
                  ...l,
                  done: !0,
                }),
                window.scrollTo({
                  top: 0,
                }))
              : d(p + 1);
          }}
        >
          {A
            ? r(`Show ${v} ${v === 1 ? 'university' : 'universities'}`, `${v} ta universitetni ko‘rsatish`)
            : s('a.next')}{' '}
          <ArrowRight size={16} />
        </Button>
      </div>
      <p className="mt-3 text-right text-[13px] text-muted" aria-live="polite">
        {r(`${v} match so far`, `Hozircha ${v} ta mos`)}
      </p>
      <button
        type="button"
        className="mt-8 text-[13.5px] font-semibold text-muted underline-offset-2 hover:text-fg hover:underline"
        onClick={() => t('universities', 'advanced')}
      >
        {r('Skip questions — use advanced search', 'Savollarni o‘tkazish — kengaytirilgan qidiruv')}
      </button>
    </div>
  );
}
export function Je({ title: e, children: a, id: t }) {
  return (
    <section id={t} className="border-b border-line py-5 last:border-0">
      <h2 className="mb-2.5 text-[16px] font-bold">{e}</h2>
      <div className="text-[14.5px] text-fg/90">{a}</div>
    </section>
  );
}
export const VS = {
  yes: 'ok',
  partial: 'info',
  no: 'bad',
  unknown: 'neutral',
};
