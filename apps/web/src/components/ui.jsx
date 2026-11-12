import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import {
  BadgeCheck,
  CircleCheck,
  CircleDashed,
  CircleHelp,
  CircleMinus,
  CircleX,
  Clock3,
  FlaskConical,
  History,
  Info,
  TriangleAlert,
  X,
} from 'lucide-react';
import { ai, me, useToday } from '../lib/core';
import { Vg, deadlineStatus, useI18n } from '../lib/derived';

function uS(e) {
  const [a, t] = e.split('-').map(Number);
  return t >= 6 ? a + 1 : a;
}
export function Qg(e, a) {
  var u, l;
  const t = [],
    n = ai(e.source.last_verified_at, a),
    s = e.source.verification_status === 'outdated' || n > Vg;
  s &&
    t.push({
      en: `Last checked ${n} days ago — needs rechecking.`,
      uz: `Oxirgi marta ${n} kun oldin tekshirilgan — qayta tekshirish kerak.`,
    });
  let r = !1;
  if (e.kind === 'program' && e.tuition) {
    const c =
        ((u = e.tuition.note) == null ? void 0 : u.en.match(/(20\d{2})\s*\/\s*(\d{2,4})/)) ??
        ((l = e.source.applicable_academic_year) == null ? void 0 : l.match(/(20\d{2})/)),
      p = c ? Number(c[1]) : null;
    p !== null &&
      p < uS(a) - 1 &&
      ((r = !0),
      t.push({
        en: `Fees shown are for ${p}/${String(p + 1).slice(2)} and may have changed.`,
        uz: `Ko‘rsatilgan to‘lov ${p}/${String(p + 1).slice(2)} uchun, o‘zgargan bo‘lishi mumkin.`,
      }));
  }
  const o =
    e.deadline.status === 'closed' ||
    (!!e.deadline.date && e.deadline.date < a && e.deadline.status !== 'not_announced');
  return (
    o &&
      t.push({
        en: 'The published deadline has passed for this cycle.',
        uz: 'Bu sikl uchun e’lon qilingan muddat o‘tgan.',
      }),
    {
      stale: s,
      oldFees: r,
      expired: o,
      reasons: t,
    }
  );
}
export const classNames = (...e) => e.filter(Boolean).join(' ');
export function Button({
  variant: e = 'secondary',
  size: a = 'md',
  icon: t,
  className: n,
  children: s,
  type: r = 'button',
  ...o
}) {
  return (
    <button
      type={r}
      className={classNames(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
        a === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm',
        e === 'primary' && 'bg-navy text-navy-ink hover:bg-navy/90',
        e === 'teal' && 'bg-teal text-white hover:bg-teal/90 dark:text-navy-ink',
        e === 'secondary' && 'bg-surface text-fg border border-line hover:bg-sunken',
        e === 'ghost' && 'text-muted hover:bg-sunken hover:text-fg',
        e === 'danger' && 'bg-surface text-bad border border-bad/30 hover:bg-bad-soft',
        n,
      )}
      {...o}
    >
      {t}
      {s}
    </button>
  );
}
export function Card({ className: e, children: a, as: CmpT = 'div', ...n }) {
  return (
    <CmpT className={classNames('min-w-0 rounded-xl border border-line bg-surface shadow-card', e)} {...n}>
      {a}
    </CmpT>
  );
}
const Xg = {
  neutral: 'bg-sunken text-muted border-line',
  navy: 'bg-navy-soft text-navy border-navy/15',
  teal: 'bg-teal-soft text-teal-ink border-teal/20',
  ok: 'bg-ok-soft text-ok border-ok/20',
  warn: 'bg-warn-soft text-warn border-warn/25',
  bad: 'bg-bad-soft text-bad border-bad/20',
  info: 'bg-info-soft text-info border-info/20',
};
export function Badge({ tone: e = 'neutral', children: a, icon: t, className: n, title: s }) {
  return (
    <span
      title={s}
      className={classNames(
        'inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] font-semibold leading-5',
        Xg[e],
        n,
      )}
    >
      {t}
      {a}
    </span>
  );
}
export function CmpPo({ status: e, date: a }) {
  const { t, lang: n } = useI18n(),
    r = {
      verified: {
        tone: 'ok',
        icon: <BadgeCheck size={13} aria-hidden={!0} />,
        key: 'v.verified',
      },
      partial: {
        tone: 'info',
        icon: <CircleDashed size={13} aria-hidden={!0} />,
        key: 'v.partial',
      },
      demo: {
        tone: 'warn',
        icon: <FlaskConical size={13} aria-hidden={!0} />,
        key: 'v.demo',
      },
      outdated: {
        tone: 'bad',
        icon: <History size={13} aria-hidden={!0} />,
        key: 'v.outdated',
      },
    }[e];
  return (
    <Badge
      tone={r.tone}
      icon={r.icon}
      title={
        a && e !== 'demo'
          ? t('v.checked', {
              date: me(a, n),
            })
          : void 0
      }
    >
      {t(r.key)}
    </Badge>
  );
}
export function DeadlineBadge({ opp: e, compact: a }) {
  const { t, lang: n } = useI18n(),
    s = deadlineStatus(e, useToday()),
    r = s.date ? me(s.date, n) : '';
  return s.kind === 'upcoming' ? (
    <Badge tone={s.days <= 14 ? 'bad' : s.days <= 45 ? 'warn' : 'ok'} icon={<Clock3 size={13} aria-hidden={!0} />}>
      {a ? '' : `${r} · `}
      {s.days === 0
        ? t('dl.today')
        : t('dl.upcoming', {
            days: s.days,
          })}
    </Badge>
  ) : s.kind === 'demo' ? (
    <Badge tone="warn" icon={<FlaskConical size={13} aria-hidden={!0} />}>
      {a ? '' : `${r} · `}
      {t('dl.demo')}
      {s.days !== void 0 && s.days >= 0
        ? ` · ${t('dl.upcoming', {
            days: s.days,
          })}`
        : ''}
    </Badge>
  ) : s.kind === 'unverified' ? (
    <Badge tone="info" icon={<CircleHelp size={13} aria-hidden={!0} />}>
      {r ? `${r} · ` : ''}
      {t('dl.unverified')}
    </Badge>
  ) : s.kind === 'closed' ? (
    <Badge tone="neutral" icon={<CircleX size={13} aria-hidden={!0} />}>
      {t('dl.closed')}
      {r && !a ? ` · ${r}` : ''}
    </Badge>
  ) : s.kind === 'varies' ? (
    <Badge tone="neutral" icon={<CircleDashed size={13} aria-hidden={!0} />}>
      {t('dl.varies')}
    </Badge>
  ) : (
    <Badge tone="neutral" icon={<CircleDashed size={13} aria-hidden={!0} />}>
      {t('dl.notAnnounced')}
    </Badge>
  );
}
export function CmpHn({ overall: e }) {
  const { t: a } = useI18n();
  if (!e) return <Badge tone="neutral">{a('el.noProfile')}</Badge>;
  const t = {
    eligible: ['ok', <CircleCheck size={13} aria-hidden={!0} key={'i'} />],
    verify: ['info', <CircleHelp size={13} aria-hidden={!0} key={'i'} />],
    missing: ['warn', <TriangleAlert size={13} aria-hidden={!0} key={'i'} />],
    not_eligible: ['bad', <CircleX size={13} aria-hidden={!0} key={'i'} />],
  };
  return (
    <Badge tone={t[e][0]} icon={t[e][1]}>
      {a(`el.${e}`)}
    </Badge>
  );
}
export function StatusIcon({ status: e }) {
  const a = e;
  return a === 'met' || a === 'satisfied' ? (
    <CircleCheck size={18} className="shrink-0 text-ok" aria-hidden={!0} />
  ) : a === 'not_met' || a === 'not_satisfied' ? (
    <CircleX size={18} className="shrink-0 text-bad" aria-hidden={!0} />
  ) : a === 'missing' ? (
    <TriangleAlert size={18} className="shrink-0 text-warn" aria-hidden={!0} />
  ) : a === 'na' ? (
    <CircleMinus size={18} className="shrink-0 text-faint" aria-hidden={!0} />
  ) : a === 'in_progress' ? (
    <CircleDashed size={18} className="shrink-0 text-info" aria-hidden={!0} />
  ) : (
    <CircleHelp size={18} className="shrink-0 text-info" aria-hidden={!0} />
  );
}
export function Field({ label: e, hint: a, error: t, children: n, htmlFor: s, optional: r }) {
  const { t: o } = useI18n();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={s} className="text-[13px] font-semibold text-fg">
        {e}{' '}
        {r && (
          <span className="font-normal text-faint">
            {'· '}
            {o('m.optional')}
          </span>
        )}
      </label>
      {n}
      {a && !t && <p className="text-[12.5px] text-muted">{a}</p>}
      {t && (
        <p className="text-[12.5px] font-semibold text-bad" role="alert">
          {t}
        </p>
      )}
    </div>
  );
}
const Yd =
  'rounded-lg border border-line bg-surface px-3 py-2 text-[14px] text-fg placeholder:text-faint focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25';
const go = (e, a) => !!e && a.test(e);
export const Input = (e) => (
  <input {...e} className={classNames(Yd, 'w-full', !go(e.className, /(^|\s)h-/) && 'h-10', e.className)} />
);
export const Select = (e) => (
  <select
    {...e}
    className={classNames(
      Yd,
      'pr-8',
      !go(e.className, /(^|\s)h-/) && 'h-10',
      !go(e.className, /(^|\s)w-/) && 'w-full',
      e.className,
    )}
  />
);
export const Textarea = (e) => (
  <textarea
    {...e}
    className={classNames(Yd, 'w-full leading-relaxed', !go(e.className, /min-h-/) && 'min-h-[96px]', e.className)}
  />
);
export function CmpHa({ checked: e, onChange: a, label: t, id: n }) {
  const s = React.useId(),
    r = n ?? s;
  return (
    <label htmlFor={r} className="inline-flex cursor-pointer items-center gap-2.5 text-[14px]">
      <input id={r} type="checkbox" className="peer sr-only" checked={e} onChange={(o) => a(o.target.checked)} />
      <span className="relative h-5 w-9 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-teal peer-focus-visible:ring-2 peer-focus-visible:ring-teal after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
      <span>{t}</span>
    </label>
  );
}
export function Pa({ active: e, onClick: a, children: t }) {
  return (
    <button
      type="button"
      aria-pressed={e}
      onClick={a}
      className={classNames(
        'rounded-full border px-3 py-1 text-[13px] font-semibold transition-colors',
        e ? 'border-navy bg-navy text-navy-ink' : 'border-line bg-surface text-muted hover:text-fg',
      )}
    >
      {t}
    </button>
  );
}
export function ProgressBar({ value: e, tone: a = 'teal', label: t }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-sunken"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(e)}
      aria-label={t}
    >
      <div
        className={classNames(
          'h-full rounded-full transition-[width]',
          a === 'teal' ? 'bg-teal' : a === 'ok' ? 'bg-ok' : 'bg-navy',
        )}
        style={{
          width: `${Math.max(0, Math.min(100, e))}%`,
        }}
      />
    </div>
  );
}
export function EmptyState({ icon: e, title: a, body: t, action: n }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line bg-surface/60 px-6 py-10 text-center">
      {e && <div className="text-faint">{e}</div>}
      <p className="font-semibold">{a}</p>
      {t && <p className="max-w-md text-[14px] text-muted">{t}</p>}
      {n && <div className="mt-2">{n}</div>}
    </div>
  );
}
export function PageHeader({ title: e, sub: a, actions: t, eyebrow: n }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {n && <p className="eyebrow mb-1">{n}</p>}
        <h1 className="text-[26px] font-extrabold leading-tight md:text-[30px]">{e}</h1>
        {a && <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{a}</p>}
      </div>
      {t && <div className="flex flex-wrap gap-2">{t}</div>}
    </div>
  );
}
export function Callout({ tone: e = 'info', children: a, icon: t }) {
  return (
    <div className={classNames('flex gap-2.5 rounded-lg border px-3.5 py-2.5 text-[13.5px]', Xg[e])}>
      <span className="mt-0.5">{t ?? <Info size={16} aria-hidden={!0} />}</span>
      <div className="min-w-0 text-fg/90">{a}</div>
    </div>
  );
}
export function CmpDS({ open: e, onClose: a, title: t, children: n, wide: s }) {
  const { t: r } = useI18n(),
    o = React.useRef(null);
  return (
    React.useEffect(() => {
      var c, p;
      if (!e) return;
      const u = document.activeElement;
      (p = (c = o.current) == null ? void 0 : c.querySelector('input,select,textarea,button')) == null || p.focus();
      const l = (d) => {
        d.key === 'Escape' && a();
      };
      return (
        window.addEventListener('keydown', l),
        () => {
          var d;
          (window.removeEventListener('keydown', l), (d = u == null ? void 0 : u.focus) == null || d.call(u));
        }
      );
    }, [e, a]),
    e ? (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-fg/40 p-0 sm:items-center sm:p-4"
        onMouseDown={(u) => {
          u.target === u.currentTarget && a();
        }}
      >
        <div
          ref={o}
          role="dialog"
          aria-modal="true"
          aria-label={t}
          className={classNames(
            'fade-in max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 shadow-xl sm:rounded-2xl',
            s ? 'sm:max-w-2xl' : 'sm:max-w-md',
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold">{t}</h2>
            <button
              type="button"
              onClick={a}
              className="rounded-md p-1 text-muted hover:bg-sunken"
              aria-label={r('nav.close')}
            >
              <X size={18} />
            </button>
          </div>
          {n}
        </div>
      </div>
    ) : null
  );
}
export function Tabs({ value: e, onChange: a, items: t }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto rounded-lg border border-line bg-sunken p-1">
      {t.map((n) => (
        <button
          role="tab"
          type="button"
          aria-selected={e === n.id}
          onClick={() => a(n.id)}
          className={classNames(
            'whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-semibold',
            e === n.id ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg',
          )}
          key={n.id}
        >
          {n.label}
          {n.count !== void 0 && <span className="ml-1.5 tabular text-faint">{n.count}</span>}
        </button>
      ))}
    </div>
  );
}
export function CmpOi({ label: e, value: a, sub: t, icon: n, onClick: s }) {
  const r = (
    <>
      <div className="flex items-center justify-between gap-2 text-muted">
        <span className="text-[12.5px] font-semibold">{e}</span>
        {n}
      </div>
      <div className="tabular mt-1.5 text-[26px] font-extrabold leading-none text-fg">{a}</div>
      {t && <div className="mt-1.5 text-[12px] text-faint">{t}</div>}
    </>
  );
  return s ? (
    <button
      type="button"
      onClick={s}
      className="rounded-xl border border-line bg-surface p-4 text-left shadow-card transition-colors hover:border-teal/50"
    >
      {r}
    </button>
  ) : (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-card">{r}</div>
  );
}
export function CmpTn({ href: e, children: a }) {
  return (
    <a
      href={e}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-teal-ink underline decoration-teal/40 underline-offset-2 hover:decoration-teal break-words dark:text-teal"
    >
      {a}
    </a>
  );
}
export function Wd({ opp: e }) {
  const { tx: a } = useI18n(),
    t = Qg(e, useToday());
  return !t.stale && !t.oldFees ? null : (
    <span className="inline-flex flex-wrap gap-1.5">
      {t.stale && (
        <Badge tone="bad" icon={<History size={13} aria-hidden={!0} />}>
          {a('Needs rechecking', 'Qayta tekshirish kerak')}
        </Badge>
      )}
      {t.oldFees && (
        <Badge tone="warn" icon={<TriangleAlert size={13} aria-hidden={!0} />}>
          {a('Older fee year', 'Eski yil to‘lovi')}
        </Badge>
      )}
    </span>
  );
}
