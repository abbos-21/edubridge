import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { CircleCheck, CircleHelp, CircleX, Clock3, FlaskConical } from 'lucide-react';
import { useStore } from '../store/store';
import { Badge, classNames } from './ui';
import { BS, IS, MS, US, Zg } from './layout';
import { useI18n } from '../lib/derived';

export function Xs() {
  const { state: e } = useStore();
  return e.mascot ?? 'duo';
}
const LS = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return !1;
  }
};
export function Mascot({
  framing: e = 'full',
  cast: a,
  action: t,
  actionKey: n,
  interactive: s,
  followPointer: r,
  label: o,
  className: u,
}) {
  const l = Xs(),
    c = a ?? l,
    p = React.useRef(null),
    [d, h] = React.useState(t),
    [m, y] = React.useState(0),
    [E, C] = React.useState({
      x: 0,
      y: 0,
    }),
    v = React.useRef(LS()),
    g = React.useRef(0);
  (React.useEffect(() => {
    (h(t), y((j) => j + 1));
  }, [n, t]),
    React.useEffect(() => {
      if (!d || d === 'explain' || d === 'think' || d === 'laptop') return;
      const j = window.setTimeout(() => h(void 0), 2400);
      return () => window.clearTimeout(j);
    }, [m, d]),
    React.useEffect(() => {
      if (!r || v.current) return;
      let j = !1;
      try {
        j = window.matchMedia('(pointer: fine)').matches;
      } catch {}
      if (!j) return;
      let k = 0;
      const K = (x) => {
        k ||
          (k = requestAnimationFrame(() => {
            var I;
            k = 0;
            const F = (I = p.current) == null ? void 0 : I.getBoundingClientRect();
            if (!F) return;
            const O = Math.max(-1, Math.min(1, (x.clientX - (F.left + F.width / 2)) / (window.innerWidth / 2))),
              N = Math.max(-1, Math.min(1, (x.clientY - (F.top + F.height * 0.3)) / (window.innerHeight / 2)));
            C({
              x: O,
              y: N,
            });
          }));
      };
      return (
        window.addEventListener('pointermove', K, {
          passive: !0,
        }),
        () => {
          (window.removeEventListener('pointermove', K), k && cancelAnimationFrame(k));
        }
      );
    }, [r]));
  const b = () => {
      if (!s) return;
      const j = Date.now();
      j - g.current < 2600 || ((g.current = j), h('wave'), y((k) => k + 1));
    },
    S = !v.current && d ? BS[d] : '',
    A = v.current ? '' : 'guide-float',
    q =
      r && !v.current
        ? {
            transform: `perspective(900px) rotateY(${E.x * 5}deg) rotateX(${-E.y * 2}deg)`,
          }
        : void 0;
  if (e === 'full')
    return (
      <div
        ref={p}
        role="img"
        aria-label={o}
        className={classNames('relative select-none', u)}
        onPointerEnter={b}
        onClick={b}
      >
        <div className="h-full w-full transition-transform duration-300 ease-out" style={q}>
          <img
            src={IS[c]}
            alt=""
            draggable={!1}
            className={classNames(
              'h-full w-full object-contain object-bottom drop-shadow-[0_18px_22px_rgba(12,24,52,0.18)]',
              A,
              S,
            )}
            key={m}
          />
        </div>
      </div>
    );
  const w = d ? US[d] : 'happy',
    U = c === 'duo' ? ['male', 'female'] : [c];
  return (
    <div
      ref={p}
      role="img"
      aria-label={o}
      className={classNames('relative flex select-none items-end justify-center', u)}
      onPointerEnter={b}
      onClick={b}
    >
      {U.map((j, k) => (
        <img
          src={MS[j][w]}
          alt=""
          draggable={!1}
          className={classNames('h-full min-w-0 object-contain object-bottom', U.length > 1 ? 'w-1/2' : 'w-full', A, S)}
          style={{
            animationDelay: k ? '0.18s' : void 0,
          }}
          key={`${j}-${w}-${m}`}
        />
      ))}
    </div>
  );
}
export function PS({ size: e = 32, className: a }) {
  const t = Xs();
  return (
    <span
      aria-hidden={!0}
      className={classNames(
        'inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-teal-soft ring-1 ring-line',
        a,
      )}
      style={{
        width: e,
        height: e,
      }}
    >
      {t === 'duo' ? (
        <svg viewBox="0 0 32 32" width={e * 0.7} height={e * 0.7}>
          <path
            d="M6 21c3.2-6.4 6.6-9.6 10-9.6S22.8 14.6 26 21"
            fill="none"
            stroke="rgb(var(--teal))"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M9.5 21v-3.2M16 21v-6.4M22.5 21v-3.2M5 22.5h22"
            stroke="rgb(var(--navy))"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <img src={Zg[t]} alt="" width={e} height={e} className="h-full w-full object-cover" />
      )}
    </span>
  );
}
export function SpeechBubble({ children: e, className: a, tail: t = 'left' }) {
  return (
    <div
      className={classNames(
        'relative rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] font-semibold leading-snug text-fg shadow-card',
        a,
      )}
    >
      {e}
      <span
        aria-hidden={!0}
        className={classNames(
          'absolute h-3 w-3 rotate-45 border-line bg-surface',
          t === 'left' ? '-left-[7px] top-4 border-b border-l' : '-bottom-[7px] left-8 border-b border-r',
        )}
      />
    </div>
  );
}
export function FS() {
  const { tx: e } = useI18n(),
    a = [
      {
        name: 'Stipendium Hungaricum',
        status: e('Not announced', 'E’lon qilinmagan'),
        tone: 'neutral',
        icon: <CircleHelp size={13} />,
      },
      {
        name: e('Sample Merit Award (demo)', 'Namunaviy merit granti (namoyish)'),
        status: e('35 days left', '35 kun qoldi'),
        tone: 'warn',
        icon: <Clock3 size={13} />,
      },
      {
        name: 'Türkiye Burslari',
        status: e('Date not confirmed', 'Sana tasdiqlanmagan'),
        tone: 'neutral',
        icon: <CircleX size={13} />,
      },
    ];
  return (
    <div
      className="relative rounded-2xl border border-line bg-surface p-4 shadow-xl md:p-5"
      aria-label={e('Example dashboard with demo data', 'Namoyish ma’lumotlari bilan boshqaruv paneli namunasi')}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold text-faint">
            {e('Example view · demo data', 'Namuna ko‘rinish · namoyish ma’lumoti')}
          </p>
          <p className="text-[15px] font-bold">{e('Good morning, Malika', 'Xayrli tong, Malika')}</p>
        </div>
        <Badge tone="warn" icon={<FlaskConical size={12} />}>
          Demo
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          [e('Plans', 'Rejalar'), '3'],
          [e('Open tasks', 'Ochiq vazifalar'), '24'],
          [e('Saved', 'Saqlangan'), '6'],
        ].map(([t, n]) => (
          <div className="rounded-lg border border-line bg-sunken/60 p-2.5" key={t}>
            <p className="text-[11px] font-semibold text-muted">{t}</p>
            <p className="tabular text-[20px] font-extrabold">{n}</p>
          </div>
        ))}
      </div>
      <p className="eyebrow mb-2 mt-4">{e('Deadlines', 'Muddatlar')}</p>
      <ul className="flex flex-col gap-2">
        {a.map((t) => (
          <li
            className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-[13px]"
            key={t.name}
          >
            <span className="truncate font-semibold">{t.name}</span>
            <Badge tone={t.tone} icon={t.icon}>
              {t.status}
            </Badge>
          </li>
        ))}
      </ul>
      <p className="eyebrow mb-2 mt-4">{e('Why it was recommended', 'Nima uchun tavsiya etildi')}</p>
      <ul className="flex flex-col gap-1.5 text-[12.5px] text-muted">
        <li className="flex gap-2">
          <CircleCheck size={15} className="mt-0.5 shrink-0 text-ok" />
          {e(
            'IELTS 7.5 appears to meet the published 7.0 minimum.',
            'IELTS 7.5 e’lon qilingan 7.0 minimumga mos ko‘rinadi.',
          )}
        </li>
        <li className="flex gap-2">
          <CircleHelp size={15} className="mt-0.5 shrink-0 text-info" />
          {e('GPA 3.7/4 must be assessed by the institution.', 'GPA 3.7/4 ni muassasa baholashi kerak.')}
        </li>
      </ul>
    </div>
  );
}
