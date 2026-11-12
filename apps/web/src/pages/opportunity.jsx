import * as jsxRuntime from 'react/jsx-runtime';
import {
  ArrowLeft,
  Calculator,
  ExternalLink,
  FileText,
  Link2,
  PenLine,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { Gj, Ie, ci, me, useToday } from '../lib/core';
import { Ls, Ps, he, we, xe } from '../lib/catalog';
import { useStore } from '../store/store';
import { useDerivedData, useI18n } from '../lib/derived';
import {
  Badge,
  Button,
  Callout,
  Card,
  CmpHn,
  CmpPo,
  CmpTn,
  DeadlineBadge,
  EmptyState,
  Qg,
  StatusIcon,
  Wd,
  classNames,
} from '../components/ui';
import { Cmp$g, CmpFo, GS, Qd, Sn, _a } from '../components/shared';
import { Je, VS } from './discovery';

export function OpportunityPage({ id: e }) {
  const { state: a, navigate: t } = useStore(),
    { matches: n } = useDerivedData(),
    { t: s, tx: r, p: o, lang: u } = useI18n(),
    l = he(e);
  if (!l)
    return (
      <EmptyState
        title={r('Opportunity not found', 'Imkoniyat topilmadi')}
        action={<Button onClick={() => t('scholarships')}>{s('a.back')}</Button>}
      />
    );
  const c = n.get(l.id),
    p = l.kind === 'program',
    d = (g) => s(g === 'yes' ? 'm.yes' : g === 'no' ? 'm.no' : g === 'partial' ? 'm.partial' : 'm.notVerified'),
    h = [
      {
        s: 'met',
        label: r('Appear satisfied', 'Bajarilgan ko‘rinadi'),
      },
      {
        s: 'not_met',
        label: r('Not satisfied', 'Bajarilmagan'),
      },
      {
        s: 'verify',
        label: r('Need manual verification', 'Qo‘lda tekshirish kerak'),
      },
      {
        s: 'missing',
        label: r('Missing information', 'Ma’lumot yetishmaydi'),
      },
    ],
    m = [
      {
        dims: ['level', 'academic', 'language', 'citizenship', 'work', 'age', 'nomination'],
        label: r('Eligibility — can you apply?', 'Muvofiqlik — ariza bera olasizmi?'),
      },
      {
        dims: ['tuition', 'living', 'funding', 'fit'],
        label: r('Affordability — can you pay for it?', 'Moliyaviy imkoniyat — to‘lay olasizmi?'),
      },
      {
        dims: ['relevance', 'destination'],
        label: r('Interest fit', 'Qiziqishlarga mosligi'),
      },
    ],
    y = Qg(l, useToday()),
    E = p && l.universityId ? Gj(l.universityId) : [],
    C = p ? l.fundingIds.map(he).filter(Boolean) : [],
    v = p
      ? (l.livingUSDPerYear ??
        (Ls[l.country]
          ? {
              amount: Ls[l.country],
            }
          : void 0))
      : void 0;
  return (
    <div>
      <button
        type="button"
        onClick={() => t(p ? 'universities' : 'scholarships')}
        className="mb-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-fg"
      >
        <ArrowLeft size={16} />
        {p ? r('Back to your options', 'Variantlaringizga qaytish') : s('nav.scholarships')}
      </button>
      {l.source.verification_status === 'demo' && (
        <div className="mb-4">
          <Callout tone="warn">
            <b>{r('Demonstration record.', 'Namoyish yozuvi.')}</b>{' '}
            {r(
              'This opportunity is fictional. It exists to show how EduBridge works and must not be treated as a real offer.',
              'Bu imkoniyat xayoliy. U EduBridge qanday ishlashini ko‘rsatish uchun mavjud, uni haqiqiy taklif deb hisoblamang.',
            )}
          </Callout>
        </div>
      )}
      {y.reasons.length > 0 && (
        <div className="mb-4">
          <Callout tone="warn">
            <b>{r('Check before relying on this.', 'Bunga tayanishdan oldin tekshiring.')}</b>{' '}
            {y.reasons.map((g) => o(g)).join(' ')}
          </Callout>
        </div>
      )}
      <header className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <CmpPo status={l.source.verification_status} date={l.source.last_verified_at} />
          <Wd opp={l} />
          {p ? (
            <Badge tone="navy">{s(`lvl.${l.level}`)}</Badge>
          ) : (
            l.levels.map((g) => (
              <Badge tone="navy" key={g}>
                {s(`lvl.${g}`)}
              </Badge>
            ))
          )}
          {!p && <GS label={l.fundingLabel} />}
          {!p && l.fundingType && (
            <Badge tone={l.fundingType === 'full' ? 'ok' : 'neutral'}>{s(`ft.${l.fundingType}`)}</Badge>
          )}
          {!p && <Badge>{s(`ty.${l.type}`)}</Badge>}
        </div>
        <div>
          <p className="text-[14px] font-semibold text-muted">
            {Sn(l, u)}
            {' · '}
            {o(we[l.country])}
            {p ? ` · ${l.city}` : ''}
          </p>
          <h1 className="mt-1 text-[26px] font-extrabold leading-tight md:text-[32px]">{_a(l, u)}</h1>
          <p className="mt-2 max-w-3xl text-[15.5px] text-muted">{o(p ? l.overview : l.summary)}</p>
        </div>
        <Qd o={l} />
      </header>
      {p && (
        <section aria-label={r('At a glance', 'Qisqacha')} className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-[13px] font-semibold text-muted">{r('Tuition', 'O‘qish to‘lovi')}</p>
            <div className="mt-1 text-[15px]">
              {l.tuition ? (
                <CmpFo m={l.tuition} />
              ) : (
                <span className="font-semibold text-warn">{s('m.notVerified')}</span>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-[13px] font-semibold text-muted">{r('Language', 'Til')}</p>
            <p className="mt-1 text-[15px] font-bold">{l.instruction}</p>
            <p className="text-[12.5px] text-muted">
              {l.reqs.minIELTS ? `IELTS ${l.reqs.minIELTS}+` : r('Score not confirmed', 'Ball aniqlanmagan')}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-[13px] font-semibold text-muted">{s('dl.deadline')}</p>
            <div className="mt-1.5">
              <DeadlineBadge opp={l} />
            </div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-[13px] font-semibold text-muted">{r('For you', 'Siz uchun')}</p>
            <div className="mt-1.5">
              <CmpHn overall={(c == null ? void 0 : c.overall) ?? null} />
            </div>
            {c && (
              <a
                href="#eligibility"
                onClick={(g) => {
                  var b;
                  (g.preventDefault(),
                    (b = document.getElementById('eligibility')) == null ||
                      b.scrollIntoView({
                        behavior: 'smooth',
                      }));
                }}
                className="mt-1 block text-[12.5px] font-semibold text-teal-ink underline dark:text-teal"
              >
                {r('See why', 'Sababini ko‘rish')}
              </a>
            )}
          </div>
        </section>
      )}
      <Cmp$g o={l} className="mb-6" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="px-5">
          {p ? (
            <>
              <Je title={r('Institution overview', 'Muassasa haqida')}>
                <dl className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <dt className="text-[12.5px] text-faint">{r('Type', 'Turi')}</dt>
                    <dd className="font-semibold">
                      {l.sector === 'public' ? r('Public', 'Davlat') : r('Private', 'Xususiy')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[12.5px] text-faint">{r('Duration', 'Davomiyligi')}</dt>
                    <dd className="font-semibold">
                      {s(l.durationYears === 1 ? 'm.year' : 'm.years', {
                        n: l.durationYears,
                      })}
                      {l.durationVerified === !1 && (
                        <span className="block text-[12px] font-normal text-muted">
                          {r('typical length, not confirmed', 'odatiy muddat, tasdiqlanmagan')}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[12.5px] text-faint">{r('Focus', 'Yo‘nalganlik')}</dt>
                    <dd className="font-semibold">
                      {l.orientation === 'research'
                        ? r('Research', 'Ilmiy')
                        : l.orientation === 'employment'
                          ? r('Employment', 'Kasbiy')
                          : r('Mixed', 'Aralash')}
                    </dd>
                  </div>
                </dl>
              </Je>
              <Je title={r('Available programme', 'Mavjud dastur')}>
                <p>
                  {o(l.program)}
                  {' · '}
                  {o(xe[l.subject])}
                  {' · '}
                  {l.instruction}
                </p>
              </Je>
              <Je title={r('Academic entry requirements', 'Akademik kirish talablari')}>
                <p>{o(l.reqs.academic)}</p>
              </Je>
              <Je title={r('Language requirements', 'Til talablari')}>
                <p>
                  {l.reqs.minIELTS ? `IELTS ${l.reqs.minIELTS}` : s('m.notVerified')}
                  {!l.reqs.ieltsVerified &&
                    ` — ${r('check the official page for accepted tests and component minimums.', 'qabul qilinadigan testlar va bo‘lim minimumlarini rasmiy sahifadan tekshiring.')}`}
                </p>
                {l.reqs.other && <p className="mt-1 text-muted">{o(l.reqs.other)}</p>}
              </Je>
              <Je title={r('Tuition fees', 'O‘qish to‘lovi')}>
                {l.tuition ? (
                  <>
                    <CmpFo m={l.tuition} />
                    <p className="mt-1 text-[13px] text-muted">
                      {l.tuition.verified ? s('m.official') : s('m.estimate')}
                      {l.tuition.note ? ` · ${o(l.tuition.note)}` : ''}
                    </p>
                  </>
                ) : (
                  <p className="text-muted">{s('m.unknown')}</p>
                )}
              </Je>
              <Je title={r('Estimated living expenses', 'Taxminiy yashash xarajatlari')}>
                {v ? (
                  <p>
                    <span className="tabular font-bold">≈ ${Ie(v.amount)}</span> {s('m.perYear')}
                    {a.displayCurrency === 'UZS' && (
                      <span className="text-muted">
                        {' (≈ '}
                        {Ie(ci(v.amount, 'UZS', a.rates))}
                        {' UZS)'}
                      </span>
                    )}
                    {' · '}
                    <span className="text-muted">{r('rough estimate, not verified', 'taxminiy, tekshirilmagan')}</span>
                  </p>
                ) : (
                  <p className="text-muted">{s('m.unknown')}</p>
                )}
              </Je>
              <Je title={r('Scholarships and funding', 'Grantlar va moliyalashtirish')}>
                <p className="mb-2 text-muted">{o(l.fundingNote)}</p>
                {C.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {C.map((g) => {
                      var b;
                      return (
                        <li
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2"
                          key={g.id}
                        >
                          <button
                            type="button"
                            className="text-left font-semibold hover:underline"
                            onClick={() => t('scholarship', g.id)}
                          >
                            {_a(g, u)}
                          </button>
                          <span className="flex gap-2">
                            <CmpHn overall={((b = n.get(g.id)) == null ? void 0 : b.overall) ?? null} />
                            <DeadlineBadge opp={g} compact={!0} />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Je>
            </>
          ) : (
            <>
              <Je title={r('Who can apply', 'Kim ariza bera oladi')}>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-[12.5px] text-faint">
                      {r('Citizens of Uzbekistan', 'O‘zbekiston fuqarolari')}
                    </dt>
                    <dd className="font-semibold">
                      {l.citizenship.uzbekistan === 'yes'
                        ? r('Eligible (per source)', 'Mumkin (manbaga ko‘ra)')
                        : l.citizenship.uzbekistan === 'no'
                          ? r('Not eligible', 'Mumkin emas')
                          : r('Check the official list', 'Rasmiy ro‘yxatni tekshiring')}
                    </dd>
                    <dd className="text-[13px] text-muted">{o(l.citizenship.note)}</dd>
                  </div>
                  <div>
                    <dt className="text-[12.5px] text-faint">{r('Subjects', 'Yo‘nalishlar')}</dt>
                    <dd className="font-semibold">
                      {l.subjects === 'all'
                        ? r('All subjects', 'Barcha yo‘nalishlar')
                        : l.subjects.map((g) => o(xe[g])).join(', ')}
                    </dd>
                  </div>
                </dl>
              </Je>
              <Je title={r('Academic criteria', 'Akademik mezonlar')}>
                <p>{o(l.academic)}</p>
                {l.criteria.workNote && <p className="mt-1.5 text-muted">{o(l.criteria.workNote)}</p>}
              </Je>
              <Je title={r('Language criteria', 'Til mezonlari')}>
                <p>{o(l.languageReq)}</p>
              </Je>
              <Je title={r('What is covered', 'Nimalar qoplanadi')}>
                <div className="mb-3 flex flex-wrap gap-2">
                  {['tuition', 'living', 'accommodation', 'travel', 'insurance'].map((g) => (
                    <Badge tone={VS[l.coverage[g]]} key={g}>
                      {
                        {
                          tuition: r('Tuition', 'O‘qish'),
                          living: r('Living allowance', 'Yashash nafaqasi'),
                          accommodation: r('Accommodation', 'Turar joy'),
                          travel: r('Travel', 'Yo‘l'),
                          insurance: r('Insurance', 'Sug‘urta'),
                        }[g]
                      }
                      {': '}
                      {d(l.coverage[g])}
                    </Badge>
                  ))}
                </div>
                <p>{o(l.coverageDetail)}</p>
                <div className="mt-3 rounded-lg bg-sunken p-3">
                  <p className="text-[12.5px] font-bold uppercase tracking-wide text-faint">
                    {r('May remain your responsibility', 'Sizning zimmangizda qolishi mumkin')}
                  </p>
                  <p className="mt-1">{o(l.notCovered)}</p>
                </div>
                {l.fundingLabel === 'full' && (
                  <p className="mt-2 text-[12.5px] text-faint">
                    {r(
                      '“Fully funded” is shown only because the cited source describes it that way.',
                      '“To‘liq moliyalashtirilgan” faqat keltirilgan manba shunday ta’riflagani uchun ko‘rsatilgan.',
                    )}
                  </p>
                )}
              </Je>
              <Je title={r('Dates', 'Sanalar')}>
                <dl className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <dt className="text-[12.5px] text-faint">{r('Opens', 'Ochiladi')}</dt>
                    <dd className="font-semibold">{l.opening ? o(l.opening) : s('m.notVerified')}</dd>
                  </div>
                  <div>
                    <dt className="text-[12.5px] text-faint">{r('Closes', 'Yopiladi')}</dt>
                    <dd>
                      <DeadlineBadge opp={l} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[12.5px] text-faint">{r('Intake / year', 'Qabul / yil')}</dt>
                    <dd className="font-semibold">{l.deadline.intake ?? s('m.notVerified')}</dd>
                  </div>
                </dl>
                {l.deadline.note && <p className="mt-2 text-muted">{o(l.deadline.note)}</p>}
                {l.deadline.time && (
                  <p className="mt-1 text-[13px] text-muted">
                    {r('Time', 'Vaqt')}
                    {': '}
                    {l.deadline.time} {l.deadline.tz}
                  </p>
                )}
              </Je>
              <Je title={r('Application fee and interview', 'Ariza to‘lovi va suhbat')}>
                <p>
                  {r('Fee', 'To‘lov')}
                  {': '}
                  <b>
                    {l.appFee.status === 'none'
                      ? r('None (per source)', 'Yo‘q (manbaga ko‘ra)')
                      : l.appFee.status === 'amount'
                        ? l.appFee.amount
                        : s('m.notVerified')}
                  </b>
                  {' · '}
                  {r('Interview', 'Suhbat')}
                  {': '}
                  <b>{l.interview === 'yes' ? s('m.yes') : l.interview === 'no' ? s('m.no') : s('m.notVerified')}</b>
                </p>
              </Je>
            </>
          )}
          <Je title={r('Required documents', 'Talab qilinadigan hujjatlar')}>
            {!l.documentsVerified && (
              <p className="mb-2 text-[13px] text-warn">
                {r(
                  'General guidance — this list has not been confirmed against the official call.',
                  'Umumiy yo‘riqnoma — bu ro‘yxat rasmiy e’lon bilan tasdiqlanmagan.',
                )}
              </p>
            )}
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {l.documents.map((g) => (
                <li className="flex items-center gap-2" key={g}>
                  <FileText size={15} className="text-faint" aria-hidden={!0} />
                  {o(Ps[g])}
                </li>
              ))}
            </ul>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => t('documents')}>
              {r('How to prepare each document', 'Har bir hujjatni qanday tayyorlash')}
              {' →'}
            </Button>
          </Je>
          {p && (
            <Je title={r('Application deadlines and procedure', 'Muddatlar va ariza tartibi')}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <DeadlineBadge opp={l} />
                {l.deadline.intake && <Badge>{l.deadline.intake}</Badge>}
              </div>
              {l.deadline.note && <p className="mb-3 text-muted">{o(l.deadline.note)}</p>}
              <ol className="flex flex-col gap-2">
                {l.procedure.map((g, b) => (
                  <li className="flex gap-2.5" key={b}>
                    <span className="tabular grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sunken text-[12px] font-bold">
                      {b + 1}
                    </span>
                    {o(g)}
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-[13px] text-muted">
                {r('Application fee', 'Ariza to‘lovi')}
                {': '}
                {l.appFee.status === 'none'
                  ? s('m.none')
                  : l.appFee.status === 'amount'
                    ? l.appFee.amount
                    : s('m.notVerified')}
              </p>
            </Je>
          )}
          <Je title={r('Personal statement', 'Motivatsion xat')}>
            {l.essay.promptKnown && l.essay.prompt ? (
              <>
                <p className="italic">“{o(l.essay.prompt)}”</p>
                {l.essay.wordLimit && (
                  <p className="mt-1 text-[13px] text-muted">
                    {r('Word limit', 'So‘z chegarasi')}
                    {': '}
                    {l.essay.wordLimit}
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted">
                {r(
                  'Essay prompt not stored. Check the official instructions.',
                  'Insho savoli saqlanmagan. Rasmiy ko‘rsatmalarni tekshiring.',
                )}
              </p>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="mt-2"
              icon={<PenLine size={14} />}
              onClick={() => t('writing', l.id)}
            >
              {r('Open the writing tutor', 'Yozish yordamchisini ochish')}
            </Button>
          </Je>
          <Je title={r('Outstanding uncertainties', 'Aniqlanmagan jihatlar')}>
            <ul className="flex flex-col gap-1.5">
              {l.uncertainties.map((g, b) => (
                <li className="flex gap-2" key={b}>
                  <TriangleAlert size={16} className="mt-0.5 shrink-0 text-warn" aria-hidden={!0} />
                  {o(g)}
                </li>
              ))}
            </ul>
          </Je>
        </Card>
        <aside className="flex flex-col gap-4">
          <Card className="scroll-mt-24 p-4" id="eligibility">
            <p className="mb-2 font-bold">{r('Your eligibility', 'Sizning mosligingiz')}</p>
            {c ? (
              <>
                <CmpHn overall={c.overall} />
                <div className="mt-3 flex flex-col gap-4">
                  {m.map((g) => {
                    const b = c.checks.filter((S) => g.dims.includes(S.dim));
                    return b.length ? (
                      <div key={g.label}>
                        <p className="mb-1.5 text-[13.5px] font-bold">{g.label}</p>
                        <ul className="flex flex-col gap-2">
                          {h
                            .flatMap((S) => b.filter((A) => A.status === S.s))
                            .map((S, A) => (
                              <li className="flex gap-2 text-[13.5px]" key={A}>
                                <StatusIcon status={S.status} />
                                <span>
                                  {o(S.msg)}
                                  <span className="ml-1 text-[11.5px] text-faint">
                                    {'· '}
                                    {h.find((q) => q.s === S.status).label}
                                  </span>
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ) : null;
                  })}
                  <div>
                    <p className="mb-1 text-[13.5px] font-bold">{r('Competitiveness', 'Raqobatbardoshlik')}</p>
                    <p className="text-[13px] text-muted">
                      {r(
                        'Not estimated. EduBridge has no reliable data on other applicants or admission rates, so it does not guess your chances.',
                        'Baholanmaydi. EduBridge’da boshqa abituriyentlar yoki qabul ko‘rsatkichlari bo‘yicha ishonchli ma’lumot yo‘q, shuning uchun imkoniyatingizni taxmin qilmaydi.',
                      )}
                    </p>
                  </div>
                </div>
                <p className="mt-3 border-t border-line pt-3 text-[12px] text-faint">
                  {r(
                    'Based only on published minimums we hold. It is not an admission prediction.',
                    'Faqat bizdagi e’lon qilingan minimumlarga asoslangan. Bu qabul bashorati emas.',
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="text-[13.5px] text-muted">{s('el.noProfile')}</p>
                <Button size="sm" variant="primary" className="mt-3" onClick={() => t('onboarding')}>
                  {r('Build profile', 'Profil yaratish')}
                </Button>
              </>
            )}
          </Card>
          <Card className="p-4">
            <p className="mb-2 flex items-center gap-2 font-bold">
              <ShieldCheck size={17} className="text-teal" aria-hidden={!0} />
              {r('Source and verification', 'Manba va tekshiruv')}
            </p>
            <dl className="flex flex-col gap-2 text-[13.5px]">
              <div>
                <dt className="text-faint">{r('Source', 'Manba')}</dt>
                <dd className="font-semibold">{l.source.source_name}</dd>
              </div>
              <div>
                <dt className="text-faint">{r('Source type', 'Manba turi')}</dt>
                <dd>
                  {l.source.source_type === 'official'
                    ? r('Official', 'Rasmiy')
                    : l.source.source_type === 'demo'
                      ? r('Demonstration', 'Namoyish')
                      : r('Secondary', 'Ikkilamchi')}
                </dd>
              </div>
              <div>
                <dt className="text-faint">{r('Status', 'Holati')}</dt>
                <dd className="mt-0.5">
                  <CmpPo status={l.source.verification_status} />
                </dd>
              </div>
              <div>
                <dt className="text-faint">{r('Last checked', 'Oxirgi tekshiruv')}</dt>
                <dd className="tabular">{me(l.source.last_verified_at, u)}</dd>
              </div>
              {l.source.applicable_academic_year && (
                <div>
                  <dt className="text-faint">{r('Applies to', 'Tegishli davr')}</dt>
                  <dd>{l.source.applicable_academic_year}</dd>
                </div>
              )}
              {l.source.relevant_notes && (
                <div>
                  <dt className="text-faint">{r('Notes', 'Izoh')}</dt>
                  <dd>{o(l.source.relevant_notes)}</dd>
                </div>
              )}
            </dl>
            {l.source.source_type !== 'demo' && (
              <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3 text-[13.5px]">
                <span className="inline-flex items-center gap-1.5">
                  <Link2 size={14} aria-hidden={!0} />
                  <CmpTn href={p ? l.websiteUrl : l.infoUrl}>{s('a.official')}</CmpTn>
                </span>
                {l.applyUrl && (
                  <span className="inline-flex items-center gap-1.5">
                    <ExternalLink size={14} aria-hidden={!0} />
                    <CmpTn href={l.applyUrl}>{s('a.apply')}</CmpTn>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <FileText size={14} aria-hidden={!0} />
                  <CmpTn href={l.source.source_url}>{r('Source document', 'Manba hujjati')}</CmpTn>
                </span>
                {E.length > 1 && (
                  <details className="mt-1">
                    <summary className="cursor-pointer font-semibold text-muted">
                      {r(`All official sources (${E.length})`, `Barcha rasmiy manbalar (${E.length})`)}
                    </summary>
                    <ul className="mt-1.5 flex flex-col gap-1">
                      {E.map((g, b) => (
                        <li className="break-words" key={b}>
                          <CmpTn href={g.url}>{o(g.label)}</CmpTn>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </Card>
          <Card className={classNames('p-4')}>
            <p className="font-bold">{r('Plan the cost', 'Xarajatni rejalashtirish')}</p>
            <p className="mt-1 text-[13px] text-muted">
              {r(
                'Compare the full yearly cost with your budget before applying.',
                'Ariza berishdan oldin to‘liq yillik xarajatni byudjetingiz bilan solishtiring.',
              )}
            </p>
            <Button size="sm" className="mt-3" icon={<Calculator size={15} />} onClick={() => t('budget', l.id)}>
              {r('Open in budget planner', 'Byudjet rejasida ochish')}
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
