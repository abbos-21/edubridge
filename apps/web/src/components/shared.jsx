import * as jsxRuntime from 'react/jsx-runtime';
import {
  Bookmark,
  BookmarkCheck,
  ClipboardCheck,
  Columns3,
  ExternalLink,
  GraduationCap,
  KeyRound,
  Landmark,
  MapPin,
  Plus,
} from 'lucide-react';
import { $e, Ho, Ie, Lj, ci } from '../lib/core';
import { useStore } from '../store/store';
import { useI18n } from '../lib/derived';
import { Badge, Button, Card, CmpHn, CmpPo, DeadlineBadge, StatusIcon, Wd, classNames } from './ui';
import { we, xe } from '../lib/catalog';

export function CmpFo({ m: e, className: a }) {
  const { state: t } = useStore(),
    { t: n } = useI18n(),
    s = e.per === 'year' ? n('m.perYear') : e.per === 'semester' ? n('m.perSemester') : n('m.total'),
    r = Ho(e.amount, e.currency, t.rates),
    o = t.displayCurrency,
    u = e.currency === o ? '' : o === 'UZS' ? `≈ ${Ie(ci(r, 'UZS', t.rates))} UZS` : `≈ $${Ie(r)}`;
  return (
    <span className={classNames('tabular', a)}>
      <span className="font-bold">{Lj(e.amount, e.currency, e.amount < 100 ? 2 : 0)}</span>{' '}
      <span className="text-muted">{s}</span>
      {u && (
        <span className="block text-[12px] text-faint">
          {u}
          {' ('}
          {n('m.approx')})
        </span>
      )}
    </span>
  );
}
export const _a = (e, a) => (e.kind === 'program' ? $e(e.program, a) : e.name);
export const Sn = (e, a) => (e.kind === 'program' ? e.university : $e(e.provider, a));
export function Qd({ o: e, compact: a }) {
  const { state: t, toggleSave: n, toggleCompare: s, addToPlan: r, navigate: o, notify: u } = useStore(),
    { t: l, tx: c } = useI18n(),
    p = t.saved.includes(e.id),
    d = t.compare.includes(e.id),
    h = t.applications.find((m) => m.oppId === e.id);
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant={p ? 'secondary' : 'ghost'}
        icon={p ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
        aria-pressed={p}
        onClick={() => {
          (n(e.id),
            u(
              p
                ? c('Removed from saved', 'Saqlanganlardan olib tashlandi')
                : c(
                    'Saved — it now appears on your dashboard and calendar',
                    'Saqlandi — endi boshqaruv paneli va taqvimda ko‘rinadi',
                  ),
            ));
        }}
      >
        {l(p ? 'a.saved' : 'a.save')}
      </Button>
      <Button
        size="sm"
        variant={d ? 'secondary' : 'ghost'}
        icon={<Columns3 size={15} />}
        aria-pressed={d}
        onClick={() => {
          (s(e.id),
            u(
              d
                ? c('Removed from comparison', 'Solishtirishdan olib tashlandi')
                : c(
                    `Added to comparison (${Math.min(4, t.compare.length + 1)} of 4)`,
                    `Solishtirishga qo‘shildi (${Math.min(4, t.compare.length + 1)} / 4)`,
                  ),
            ));
        }}
      >
        {l(d ? 'a.inCompare' : 'a.compare')}
      </Button>
      {h ? (
        <Button size="sm" variant="secondary" icon={<ClipboardCheck size={15} />} onClick={() => o('plan', h.id)}>
          {l('a.openPlan')}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="primary"
          icon={<Plus size={15} />}
          onClick={() => {
            if (!t.profile) {
              (u(
                c(
                  'Create a profile first so the plan can be personalised',
                  'Rejani shaxsiylashtirish uchun avval profil yarating',
                ),
              ),
                o('onboarding'));
              return;
            }
            const m = r(e.id);
            (u(
              c(
                'Plan created with a checklist from this opportunity’s requirements',
                'Ushbu imkoniyat talablari asosida ro‘yxatli reja yaratildi',
              ),
            ),
              a || o('plan', m));
          }}
        >
          {l('a.addPlan')}
        </Button>
      )}
    </div>
  );
}
export function RS({ o: e, match: a }) {
  const { navigate: t } = useStore(),
    { t: n, p: s, lang: r, tx: o } = useI18n(),
    u = e.kind === 'program',
    l = a ? a.checks.filter((c) => c.status !== 'na').slice(0, 3) : [];
  return (
    <Card as="article" className="flex flex-col gap-3 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted">
            {u ? <Landmark size={14} aria-hidden={!0} /> : <GraduationCap size={14} aria-hidden={!0} />}
            <span className="truncate">{Sn(e, r)}</span>
          </p>
          <h3 className="mt-0.5 text-[16.5px] font-bold leading-snug">
            <button
              type="button"
              className="text-left hover:underline"
              onClick={() => t(u ? 'university' : 'scholarship', e.id)}
            >
              {_a(e, r)}
            </button>
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} aria-hidden={!0} />
              {s(we[e.country])}
            </span>
            <span>{u ? n(`lvl.${e.level}`) : e.levels.map((c) => n(`lvl.${c}`)).join(' · ')}</span>
            <span>
              {u
                ? s(xe[e.subject])
                : e.subjects === 'all'
                  ? o('All subjects', 'Barcha yo‘nalishlar')
                  : e.subjects
                      .map((c) => s(xe[c]))
                      .slice(0, 2)
                      .join(', ') + (e.subjects.length > 2 ? '…' : '')}
            </span>
          </p>
        </div>
        <CmpPo status={e.source.verification_status} date={e.source.last_verified_at} />
        <Wd opp={e} />
      </div>
      <div className="grid gap-3 rounded-lg bg-sunken/70 p-3 text-[13.5px] sm:grid-cols-3">
        <div className="min-w-0">
          <p className="eyebrow mb-0.5">{u ? o('Tuition', 'O‘qish to‘lovi') : o('Funding', 'Moliyalashtirish')}</p>
          {u ? (
            e.tuition ? (
              <CmpFo m={e.tuition} />
            ) : (
              <span className="text-muted">{n('m.notVerified')}</span>
            )
          ) : (
            <span className="font-semibold">{n(`fund.${e.fundingLabel}`)}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="eyebrow mb-0.5">{u ? o('Language', 'Til') : o('Type', 'Turi')}</p>
          {u ? (
            <span>
              {e.instruction}
              {e.reqs.minIELTS ? ` · IELTS ${e.reqs.minIELTS}` : ''}
              {!e.reqs.minIELTS && (
                <span className="block text-[12px] text-faint">
                  {o('Requirement not verified', 'Talab tekshirilmagan')}
                </span>
              )}
            </span>
          ) : (
            <span>{n(`ty.${e.type}`)}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="eyebrow mb-1">{n('dl.deadline')}</p>
          <DeadlineBadge opp={e} />
        </div>
      </div>
      {a ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CmpHn overall={a.overall} />
            <span className="text-[12.5px] text-faint">
              {o(
                `${a.met} of ${a.total} checks appear satisfied`,
                `${a.total} ta tekshiruvdan ${a.met} tasi bajarilgan`,
              )}
            </span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {l.map((c, p) => (
              <li className="flex gap-2 text-[13px] text-muted" key={p}>
                <StatusIcon status={c.status} />
                <span>{s(c.msg)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <CmpHn overall={null} />
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <Button size="sm" variant="ghost" onClick={() => t(u ? 'university' : 'scholarship', e.id)}>
          {n('a.view')}
          {' →'}
        </Button>
        <Qd o={e} compact={!0} />
      </div>
    </Card>
  );
}
export function GS({ label: e }) {
  const { t: a } = useI18n();
  return <Badge tone={e === 'full' ? 'teal' : e === 'partial' ? 'navy' : 'neutral'}>{a(`fund.${e}`)}</Badge>;
}
function HS(e) {
  return e.source.verification_status === 'demo'
    ? null
    : e.applyUrl
      ? {
          url: e.applyUrl,
          direct: !0,
        }
      : e.kind === 'program'
        ? {
            url: e.admissionsUrl ?? e.websiteUrl,
            direct: !1,
          }
        : {
            url: e.infoUrl,
            direct: !1,
          };
}
export function Cmp$g({ o: e, className: a }) {
  const { tx: t, p: n } = useI18n(),
    s = HS(e),
    r = (u) => {
      try {
        return new URL(u).hostname.replace(/^www\./, '');
      } catch {
        return u;
      }
    };
  if (!s)
    return (
      <div
        className={classNames('rounded-xl border border-dashed border-line bg-surface p-4 text-[14px] text-muted', a)}
      >
        {t(
          'This is a demonstration record, so there is no real place to apply.',
          'Bu namoyish yozuvi, shuning uchun haqiqiy ariza joyi yo‘q.',
        )}
      </div>
    );
  const o = e.kind === 'program' ? (e.applyLinks ?? []).filter((u) => u.url !== s.url) : [];
  return (
    <section
      aria-label={t('How to apply', 'Qanday ariza topshiriladi')}
      className={classNames('rounded-xl border border-teal/30 bg-teal-soft/25 p-4', a)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-bold">
            {s.direct
              ? t('Apply on the official website', 'Rasmiy saytda ariza topshiring')
              : t('How to apply', 'Qanday ariza topshiriladi')}
          </p>
          <p className="text-[13px] text-muted">
            {s.direct
              ? t(
                  `The application is made on ${r(s.url)}, the institution’s own site.`,
                  `Ariza muassasaning o‘z sayti — ${r(s.url)} da topshiriladi.`,
                )
              : t(
                  `No direct application portal is recorded yet. The official admissions page (${r(s.url)}) explains how to apply.`,
                  `To‘g‘ridan-to‘g‘ri ariza portali hali qayd etilmagan. Rasmiy qabul sahifasi (${r(s.url)}) qanday topshirishni tushuntiradi.`,
                )}
          </p>
        </div>
        <a
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-teal px-4 py-2.5 text-[14px] font-bold text-white hover:bg-teal/90"
        >
          {s.direct ? t('Go to application', 'Arizaga o‘tish') : t('Open admissions page', 'Qabul sahifasini ochish')}
          <ExternalLink size={15} aria-hidden={!0} />
        </a>
      </div>
      {o.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1 border-t border-teal/20 pt-3 text-[13.5px]">
          {o.map((u) => (
            <li key={u.url}>
              <a
                href={u.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-teal-ink underline decoration-teal/40 underline-offset-2 dark:text-teal"
              >
                {n(u.label)}
                <ExternalLink size={13} aria-hidden={!0} />
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 flex items-start gap-1.5 text-[12px] text-muted">
        <KeyRound size={13} className="mt-0.5 shrink-0" aria-hidden={!0} />
        {t(
          'You apply directly with the university. EduBridge never asks for your application account password — don’t share it with anyone.',
          'Ariza to‘g‘ridan-to‘g‘ri universitetga topshiriladi. EduBridge hech qachon ariza akkauntingiz parolini so‘ramaydi — uni hech kimga bermang.',
        )}
      </p>
    </section>
  );
}
export const ey = [
  'interested',
  'researching',
  'preparing',
  'ready',
  'started',
  'submitted',
  'awaiting',
  'accepted',
  'rejected',
  'withdrawn',
];
export const Mh = ['interested', 'researching', 'preparing', 'ready', 'started', 'submitted', 'awaiting', 'accepted'];
export const KS = (e) => e === 'accepted' || e === 'rejected' || e === 'withdrawn';
