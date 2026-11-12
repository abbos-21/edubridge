import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Check,
  CircleHelp,
  ExternalLink,
  FileCheck2,
  FlaskConical,
  Info,
  KeyRound,
  Lightbulb,
  ListChecks,
  Lock,
  MapPin,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
  X,
} from 'lucide-react';
import { useI18n } from '../lib/derived';
import {
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  Input,
  Pa,
  PageHeader,
  Select,
  Tabs,
  classNames,
} from '../components/ui';
import { useStore } from '../store/store';
import {
  $e,
  Bi,
  Bs,
  Cg,
  Ej,
  Go,
  Hd,
  Iu,
  Li,
  Mg,
  Mn,
  Mu,
  Ro,
  Sj,
  Tg,
  Us,
  an,
  bj,
  dt,
  fh,
  fj,
  jn,
  kh,
  la,
  me,
  qj,
  ta,
  wj,
  xj,
  yj,
  zj,
} from '../lib/core';
import { xe } from '../lib/catalog';
import { cy } from './budget';

const ze = {
  bachelor: {
    en: 'Bachelor’s',
    uz: 'Bakalavr',
  },
  master: {
    en: 'Master’s',
    uz: 'Magistratura',
  },
};
const hy = 'edubridge:unicompare';
const iE = () => {
  try {
    const e = JSON.parse(localStorage.getItem(hy) ?? '[]');
    return Array.isArray(e) ? e.slice(0, 3) : [];
  } catch {
    return [];
  }
};
let my = iE();
const Ru = new Set();
const Kh = (e) => {
  my = e;
  try {
    localStorage.setItem(hy, JSON.stringify(e));
  } catch {}
  Ru.forEach((a) => a(e));
};
function ec() {
  const [e, a] = React.useState(my);
  return (
    React.useEffect(
      () => (
        Ru.add(a),
        () => {
          Ru.delete(a);
        }
      ),
      [],
    ),
    {
      list: e,
      has: (t) => e.includes(t),
      toggle: (t) => Kh(e.includes(t) ? e.filter((n) => n !== t) : e.length >= 3 ? e : [...e, t]),
      clear: () => Kh([]),
      full: e.length >= 3,
    }
  );
}
function CmpPy({ id: e, compact: a }) {
  const { tx: t } = useI18n(),
    n = ec(),
    s = n.has(e);
  return (
    <button
      type="button"
      aria-pressed={s}
      disabled={!s && n.full}
      onClick={(r) => {
        (r.stopPropagation(), n.toggle(e));
      }}
      title={!s && n.full ? t('You can compare up to 3', 'Ko‘pi bilan 3 tasini solishtirish mumkin') : void 0}
      className={classNames(
        'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12.5px] font-bold disabled:opacity-40',
        s ? 'border-teal bg-teal-soft text-teal-ink' : 'border-line bg-surface text-muted hover:text-fg',
      )}
    >
      {s ? <Minus size={13} /> : <Plus size={13} />}
      {a ? null : s ? t('Comparing', 'Solishtirilmoqda') : t('Compare', 'Solishtirish')}
    </button>
  );
}
function CmpAc() {
  const { tx: e } = useI18n(),
    { navigate: a } = useStore(),
    t = ec();
  return t.list.length ? (
    <div className="sticky bottom-[max(12px,env(safe-area-inset-bottom,0px))] z-30 mt-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal/40 bg-surface px-4 py-3 shadow-xl">
      <p className="text-[14px] font-semibold">
        {e(`${t.list.length} of 3 selected to compare`, `Solishtirish uchun ${t.list.length}/3 tanlandi`)}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={t.clear}
          className="rounded-md px-3 py-1.5 text-[13px] font-semibold text-muted hover:bg-sunken"
        >
          {e('Clear', 'Tozalash')}
        </button>
        <button
          type="button"
          disabled={t.list.length < 2}
          onClick={() => a('unicompare', t.list.join(','))}
          className="rounded-md bg-navy px-3 py-1.5 text-[13px] font-bold text-navy-ink disabled:opacity-40"
        >
          {t.list.length < 2 ? e('Pick at least 2', 'Kamida 2 ta tanlang') : e('Compare now', 'Solishtirish')}
        </button>
      </div>
    </div>
  ) : null;
}
function CmpXo({ lv: e, level: a }) {
  const { tx: t } = useI18n(),
    n = t(ze[a].en, ze[a].uz);
  return e.open === 'yes' ? (
    <Badge tone="ok" icon={<Check size={12} />}>
      {n}
    </Badge>
  ) : e.open === 'integrated' ? (
    <Badge tone="info">{t('One-tier programme', 'Uzluksiz dastur')}</Badge>
  ) : e.open === 'no' ? (
    <Badge tone="bad" icon={<X size={12} />}>
      {t(`${n}: no full-degree route found`, `${n}: to‘liq daraja yo‘li topilmadi`)}
    </Badge>
  ) : (
    <Badge tone="neutral" icon={<CircleHelp size={12} />}>
      {t(`${n}: not checked`, `${n}: tekshirilmagan`)}
    </Badge>
  );
}
function CmpGy({ lv: e }) {
  const { tx: a, p: t } = useI18n(),
    n = e.tuition;
  if (!n)
    return (
      <span className="text-muted">{a('Not confirmed on an official page', 'Rasmiy sahifada tasdiqlanmagan')}</span>
    );
  const s =
    n.amount === 0 && !n.amount_max
      ? a('No tuition fee', 'Kontrakt to‘lovi yo‘q')
      : `${kh(n.amount)}${n.amount_max ? ` – ${kh(n.amount_max)}` : ''} ${n.currency} ${t(zj[n.per])}`;
  return (
    <span>
      <span className="font-bold">{s}</span>
      <span className="text-muted">
        {' · '}
        {n.year ? a(`year ${n.year}`, `${Li(n.year, 'uz')} o‘quv yili`) : a('year not stated', 'yili ko‘rsatilmagan')}
      </span>
      {n.note && <span className="mt-0.5 block text-[13px] text-muted">{t(n.note)}</span>}
    </span>
  );
}
function CmpYy({ lv: e }) {
  const { tx: a, p: t, lang: n } = useI18n(),
    s = Hd(e),
    r = xj(e);
  return s ? (
    <span>
      <span className="font-bold">{me(s.date, n)}</span>
      {s.intake && (
        <span className="text-muted">
          {' · '}
          {Li(s.intake, n)}
        </span>
      )}
      {s.note && <span className="mt-0.5 block text-[13px] text-muted">{t(s.note)}</span>}
    </span>
  ) : r ? (
    <span>
      <Badge tone="warn">{a('Closed', 'Yopilgan')}</Badge>{' '}
      <span className="text-muted">
        {a(`Last published: ${me(r.date, n)}`, `Oxirgi e’lon qilingan: ${me(r.date, n)}`)}
        {r.intake ? ` (${Li(r.intake, n)})` : ''}
        {'. '}
        {a('Next date not confirmed.', 'Keyingi sana tasdiqlanmagan.')}
      </span>
      {r.note && <span className="mt-0.5 block text-[13px] text-muted">{t(r.note)}</span>}
    </span>
  ) : e.intake ? (
    <span className="text-muted">{t(e.intake)}</span>
  ) : (
    <span className="text-muted">{a('No dated deadline confirmed', 'Sanali muddat tasdiqlanmagan')}</span>
  );
}
function CmpFy({ tier: e }) {
  const { p: a } = useI18n();
  return <Badge tone={e === 'selective' ? 'navy' : e === 'middle' ? 'teal' : 'ok'}>{a(jn[e].name)}</Badge>;
}
function CmpTE({ u: e }) {
  const { tx: a } = useI18n(),
    t = e.ranking;
  return (
    <div className="rounded-lg border border-line bg-sunken/50 px-3 py-2.5 text-[13.5px]">
      <p className="flex flex-wrap items-center gap-1.5 font-bold">
        <Award size={15} aria-hidden={!0} />
        {t.org}
        {t.edition ? ` ${t.edition}` : ''}
        {': '}
        <span className="text-[15px] font-extrabold">
          {t.value ?? a('position not confirmed', 'o‘rni tasdiqlanmagan')}
        </span>
      </p>
      <p className="mt-0.5 text-muted">
        {t.value && t.source ? (
          <>
            {a('As published by ', 'Manba: ')}
            <a
              href={t.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-teal-ink underline decoration-teal/40 underline-offset-2 dark:text-teal"
            >
              {t.source.name}
            </a>
            {a(' (the QS site could not be read automatically). ', ' (QS saytini avtomatik o‘qib bo‘lmadi). ')}
          </>
        ) : (
          a(
            'Not found in the QS 2027 lists EduBridge could check — open the ranking page. ',
            'EduBridge tekshira olgan QS 2027 ro‘yxatlarida topilmadi — reyting sahifasini oching. ',
          )
        )}
        {a(
          'A general ranking does not mean the same position in a specific subject.',
          'Umumiy reyting muayyan yo‘nalishda ham xuddi shu o‘rinni bildirmaydi.',
        )}
      </p>
      {t.url && (
        <a
          href={t.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 font-semibold text-teal-ink underline decoration-teal/40 underline-offset-2 dark:text-teal"
        >
          {a('QS page', 'QS sahifasi')}
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}
function CmpVy({ u: e }) {
  const { tx: a, p: t, lang: n } = useI18n(),
    { navigate: s } = useStore();
  return (
    <Card as="article" className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => s('uni', e.id)} className="min-w-0 text-left">
          <p className="text-[12px] font-bold uppercase tracking-wide text-faint">
            {e.order}
            {'. '}
            {t(ta[e.country].name)}
            {' · '}
            {e.short}
          </p>
          <h3 className="mt-0.5 text-[16.5px] font-extrabold leading-snug hover:text-teal-ink">{e.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-[13px] text-muted">
            <MapPin size={13} aria-hidden={!0} />
            {Li(e.city, n)}
            {e.type ? ` · ${e.type === 'public' ? a('public', 'davlat') : a('private', 'xususiy')}` : ''}
          </p>
        </button>
        <CmpPy id={e.id} compact={!0} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <CmpFy tier={e.tier} />
        <Badge tone="neutral" icon={<Award size={11} />}>
          {'QS '}
          {e.ranking.value ?? '—'}
        </Badge>
        <CmpXo lv={e.levels.bachelor} level="bachelor" />
        <CmpXo lv={e.levels.master} level="master" />
      </div>
      <p className="line-clamp-2 text-[13px] text-muted">
        {e.subjects
          .slice(0, 5)
          .map((r) => t(xe[r]))
          .join(' · ')}
      </p>
      <button
        type="button"
        onClick={() => s('uni', e.id)}
        className="mt-auto self-start text-[13.5px] font-bold text-teal-ink hover:underline dark:text-teal"
      >
        {a('Bachelor’s and master’s details →', 'Bakalavr va magistratura tafsilotlari →')}
      </button>
    </Card>
  );
}
const nE = {
  yes: ['Covered', 'Qoplanadi', 'ok'],
  partial: ['Partly', 'Qisman', 'warn'],
  no: ['Not covered', 'Qoplanmaydi', 'bad'],
  check: ['Check official terms', 'Rasmiy shartlarni tekshiring', 'neutral'],
};
const sE = [
  ['tuition', 'Tuition', 'Kontrakt'],
  ['stipend', 'Monthly stipend', 'Oylik stipendiya'],
  ['accommodation', 'Accommodation', 'Turar joy'],
  ['insurance', 'Insurance', 'Sug‘urta'],
  ['travel', 'Travel', 'Yo‘l xarajati'],
];
function CmpBy({ g: e, uni: a }) {
  const { tx: t, p: n, lang: s } = useI18n(),
    r = a ? an(e, a) : null,
    o = (u, l) => (
      <div className="grid gap-0.5 border-t border-line py-2 sm:grid-cols-[150px_1fr] sm:gap-3">
        <dt className="text-[12.5px] font-bold text-muted">{u}</dt>
        <dd className="text-[13.5px]">{l}</dd>
      </div>
    );
  return (
    <Card as="article" className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-[15.5px] font-extrabold">{e.name}</h4>
        <div className="flex flex-wrap gap-1">
          {e.levels
            .filter((u) => u !== 'phd')
            .map((u) => (
              <Badge tone="navy" key={u}>
                {t(ze[u].en, ze[u].uz)}
              </Badge>
            ))}
        </div>
      </div>
      {r === 'confirmed' && (
        <p className="mt-2 text-[13px] font-semibold text-ok">
          {t(
            'This university is on the official participating list.',
            'Bu universitet rasmiy ishtirokchilar ro‘yxatida bor.',
          )}
        </p>
      )}
      {r === 'not_listed' && (
        <p className="mt-2 text-[13px] font-semibold text-bad">
          {t(
            'This university is not on the official participating list we read.',
            'Bu universitet biz o‘qigan rasmiy ishtirokchilar ro‘yxatida yo‘q.',
          )}
        </p>
      )}
      {r === 'check' && (
        <p className="mt-2 text-[13px] text-muted">
          {t(
            'Whether this university and programme take part is not confirmed — check the official list.',
            'Bu universitet va dastur ishtirok etishi tasdiqlanmagan — rasmiy ro‘yxatni tekshiring.',
          )}
        </p>
      )}
      <dl className="mt-2">
        {e.who && o(t('Who can apply', 'Kim topshira oladi'), n(e.who))}
        {e.criteria &&
          o(
            t('Grant criteria', 'Grant talabi'),
            <>
              {n(e.criteria)}
              <span className="mt-0.5 block text-[12px] text-faint">
                {t(
                  'These are grant conditions, separate from university entry requirements.',
                  'Bu grant shartlari — universitetga kirish talabidan alohida.',
                )}
              </span>
            </>,
          )}
        {e.universities && o(t('Universities', 'Universitetlar'), n(e.universities))}
        {o(
          t('What it covers', 'Nimani qoplaydi'),
          <ul className="flex flex-wrap gap-1.5">
            {sE.map(([u, l, c]) => {
              const [p, d, h] = nE[e.covers[u]];
              return (
                <li key={u}>
                  <Badge tone={h}>
                    {t(l, c)}
                    {': '}
                    {t(p, d)}
                  </Badge>
                </li>
              );
            })}
          </ul>,
        )}
        {e.stipendText && o(t('Confirmed amounts', 'Tasdiqlangan summalar'), n(e.stipendText))}
        {e.extras && o(t('Also', 'Qo‘shimcha'), n(e.extras))}
        {e.notCovered && o(t('Not covered', 'Qoplanmaydi'), n(e.notCovered))}
        {e.tracks && o(t('Tracks', 'Yo‘llar'), n(e.tracks))}
        {e.deadline && o(t('Deadline', 'Muddat'), n(e.deadline))}
        {o(
          t('Official portal', 'Rasmiy portal'),
          <a
            href={e.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 break-all font-semibold text-teal-ink underline decoration-teal/40 underline-offset-2 dark:text-teal"
          >
            {e.url.replace(/^https?:\/\//, '').slice(0, 60)}
            <ExternalLink size={12} />
          </a>,
        )}
        {o(
          t('Duration', 'Muddat (davomiyligi)'),
          t(
            'Normally the standard length of the programme (plus any language year the grant includes). Confirm in the official call.',
            'Odatda dasturning standart muddati (grant til yilini ham o‘z ichiga olsa, u ham). Rasmiy e’londan tasdiqlang.',
          ),
        )}
        {o(
          t('Keeping the grant', 'Grantni saqlab qolish'),
          t(
            'Usually depends on passing your courses each year — read the retention rules in the official call.',
            'Odatda har yili fanlardan o‘tishga bog‘liq — saqlab qolish qoidalarini rasmiy e’londan o‘qing.',
          ),
        )}
        {o(t('Checked', 'Tekshirilgan'), me(e.checked, s))}
      </dl>
    </Card>
  );
}
const rE = ['English', 'German', 'Turkish', 'Korean', 'Hungarian', 'Malay'];
const oE = {
  English: 'Ingliz',
  German: 'Nemis',
  Turkish: 'Turk',
  Korean: 'Koreys',
  Hungarian: 'Venger',
  Malay: 'Malay',
};
export function UniversitiesPage() {
  const { navigate: e } = useStore(),
    { tx: a, p: t } = useI18n(),
    [n, s] = React.useState(''),
    [r, o] = React.useState([]),
    [u, l] = React.useState([]),
    [c, p] = React.useState('any'),
    [d, h] = React.useState('any'),
    [m, y] = React.useState('any'),
    [E, C] = React.useState('any'),
    [v, g] = React.useState(!1),
    [b, S] = React.useState(!1),
    [A, q] = React.useState(''),
    [w, U] = React.useState(!1),
    j = (f) => (f === 'any' ? ['bachelor', 'master'] : [f]),
    k = React.useMemo(
      () =>
        dt.filter((f) => {
          if (
            !Sj(f, n) ||
            (r.length && !r.includes(f.country)) ||
            (u.length && !u.includes(f.tier)) ||
            (d !== 'any' && !f.subjects.includes(d)) ||
            (m !== 'any' && !Go(f).includes(m))
          )
            return !1;
          const M = j(c).filter((D) => Bs(f.levels[D]));
          return !(
            !M.length ||
            (v && !M.some((D) => Hd(f.levels[D]))) ||
            (b && !M.some((D) => wj(f.levels[D]))) ||
            (E === 'uni' && !M.some((D) => Iu(f, D))) ||
            (E === 'gov_any' && !M.some((D) => Us(f.country, D).length)) ||
            (E === 'gov_confirmed' && !M.some((D) => Us(f.country, D).some((R) => an(R, f) === 'confirmed')))
          );
        }),
      [n, r, u, c, d, m, E, v, b],
    ),
    K = Object.keys(xe).filter((f) => dt.some((M) => M.subjects.includes(f))),
    x =
      r.length +
      u.length +
      (c !== 'any' ? 1 : 0) +
      (d !== 'any' ? 1 : 0) +
      (m !== 'any' ? 1 : 0) +
      (E !== 'any' ? 1 : 0) +
      (v ? 1 : 0) +
      (b ? 1 : 0),
    F = () => {
      (o([]), l([]), p('any'), h('any'), y('any'), C('any'), g(!1), S(!1));
    },
    O = Number(A.replace(',', '.')),
    N = A.trim() !== '' && O >= 0 && O <= 9,
    I = (f) => {
      if (!N) return null;
      const M = j(c)
        .map((D) => {
          const R = f.levels[D],
            _ = D === 'bachelor' ? a('Bachelor’s', 'Bakalavr') : a('Master’s', 'Magistratura');
          return Bs(R)
            ? R.ielts == null || R.ieltsScope !== 'general'
              ? `${_}: ${a('no single confirmed IELTS minimum', 'yagona tasdiqlangan IELTS minimumi yo‘q')}`
              : `${_}: ${a('confirmed minimum', 'tasdiqlangan minimum')} ${R.ielts} — ${O >= R.ielts ? a('your score meets it', 'ballingiz yetadi') : a(`${(R.ielts - O).toFixed(1)} below`, `${(R.ielts - O).toFixed(1)} past`)}`
            : null;
        })
        .filter(Boolean);
      return M.length ? (
        <p className="-mt-1 rounded-b-xl border border-t-0 border-line bg-sunken/60 px-4 py-2 text-[12.5px] text-muted">
          {M.join(' · ')}
        </p>
      ) : null;
    };
  return (
    <div>
      <PageHeader
        eyebrow={a('Catalogue · 50 universities', 'Katalog · 50 universitet')}
        title={a('Universities', 'Universitetlar')}
        sub={a(
          'Search by full name or abbreviation (e.g. METU, KAIST, TUM), filter by group (selective, balanced, accessible), and compare up to three.',
          'To‘liq nom yoki qisqartma bo‘yicha qidiring (masalan, METU, KAIST, TUM), guruh bo‘yicha filtrlang (kuchli tanlov, o‘rta, qulayroq) va uchtagacha solishtiring.',
        )}
        actions={
          <>
            <Button onClick={() => e('countries')}>{a('Browse by country', 'Davlatlar bo‘yicha')}</Button>
            <Button variant="ghost" onClick={() => e('universities', 'finder')}>
              {a('Guided finder', 'Bosqichma-bosqich izlash')}
            </Button>
          </>
        }
      />
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">{a('Search universities', 'Universitet qidirish')}</span>
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            aria-hidden={!0}
          />
          <Input
            value={n}
            onChange={(f) => s(f.target.value)}
            placeholder={a('Name or abbreviation…', 'Nomi yoki qisqartmasi…')}
            className="h-11 pl-10"
          />
        </label>
        <Button icon={<SlidersHorizontal size={16} />} onClick={() => U(!w)} aria-expanded={w} className="h-11">
          {a('Filters', 'Filtrlar')}
          {x ? ` (${x})` : ''}
        </Button>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {Ro.map((f) => (
          <Pa active={r.includes(f)} onClick={() => o(r.includes(f) ? r.filter((M) => M !== f) : [...r, f])} key={f}>
            {t(ta[f].name)}
          </Pa>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[12.5px] font-bold text-muted">{a('Group:', 'Guruh:')}</span>
        {Tg.map((f) => (
          <Pa active={u.includes(f)} onClick={() => l(u.includes(f) ? u.filter((M) => M !== f) : [...u, f])} key={f}>
            {t(jn[f].name)}
          </Pa>
        ))}
      </div>
      {w && (
        <div className="mb-4 grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-[13px] font-semibold">
            {a('Level', 'Daraja')}
            <Select value={c} onChange={(f) => p(f.target.value)} className="mt-1">
              <option value="any">{a('Bachelor’s or master’s', 'Bakalavr yoki magistratura')}</option>
              <option value="bachelor">{a('Bachelor’s', 'Bakalavr')}</option>
              <option value="master">{a('Master’s', 'Magistratura')}</option>
            </Select>
          </label>
          <label className="text-[13px] font-semibold">
            {a('Subject area', 'Yo‘nalish')}
            <Select value={d} onChange={(f) => h(f.target.value)} className="mt-1">
              <option value="any">{a('Any', 'Istalgan')}</option>
              {K.map((f) => (
                <option value={f} key={f}>
                  {t(xe[f])}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-[13px] font-semibold">
            {a('Language', 'Ta’lim tili')}
            <Select value={m} onChange={(f) => y(f.target.value)} className="mt-1">
              <option value="any">{a('Any', 'Istalgan')}</option>
              {rE.map((f) => (
                <option value={f} key={f}>
                  {a(f, oE[f])}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-[13px] font-semibold">
            {a('Funding', 'Moliyalashtirish')}
            <Select value={E} onChange={(f) => C(f.target.value)} className="mt-1">
              <option value="any">{a('Any', 'Istalgan')}</option>
              <option value="uni">
                {a('University scholarship recorded', 'Universitet stipendiyasi qayd etilgan')}
              </option>
              <option value="gov_any">
                {a('National grant exists for the level', 'Daraja uchun milliy grant bor')}
              </option>
              <option value="gov_confirmed">
                {a('On a national grant’s official list', 'Milliy grant rasmiy ro‘yxatida')}
              </option>
            </Select>
          </label>
          <label className="flex items-center gap-2 text-[13.5px] font-semibold">
            <input
              type="checkbox"
              checked={v}
              onChange={(f) => g(f.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--teal))]"
            />
            {a('Upcoming deadline confirmed', 'Kelgusi muddat tasdiqlangan')}
          </label>
          <label className="flex items-center gap-2 text-[13.5px] font-semibold">
            <input
              type="checkbox"
              checked={b}
              onChange={(f) => S(f.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--teal))]"
            />
            {a('Tuition confirmed', 'Kontrakt tasdiqlangan')}
          </label>
          <label className="text-[13px] font-semibold sm:col-span-2 lg:col-span-1">
            {a('My IELTS score (optional)', 'Mening IELTS ballim (ixtiyoriy)')}
            <Input
              inputMode="decimal"
              value={A}
              onChange={(f) => q(f.target.value)}
              placeholder="6.0"
              className="mt-1"
            />
          </label>
          <p className="text-[12.5px] text-muted sm:col-span-2">
            {a(
              'Your score is compared only with minimums confirmed on official pages. EduBridge does not estimate chances of admission.',
              'Ballingiz faqat rasmiy sahifalarda tasdiqlangan minimumlar bilan solishtiriladi. EduBridge qabul ehtimolini hisoblamaydi.',
            )}
          </p>
          {x > 0 && (
            <button
              type="button"
              onClick={F}
              className="inline-flex items-center gap-1 self-end justify-self-start text-[13px] font-semibold text-muted hover:text-fg"
            >
              <X size={14} />
              {a('Reset filters', 'Filtrlarni tozalash')}
            </button>
          )}
        </div>
      )}
      <p className="mb-3 text-[13.5px] text-muted" aria-live="polite">
        {a(`${k.length} universities`, `${k.length} ta universitet`)}
      </p>
      {k.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {k.map((f) => (
            <li key={f.id}>
              <CmpVy u={f} />
              {I(f)}
            </li>
          ))}
        </ul>
      ) : (
        <Callout tone="neutral">
          {a(
            'No university matches these filters. Try removing one.',
            'Bu filtrlarga mos universitet yo‘q. Bittasini olib tashlab ko‘ring.',
          )}
        </Callout>
      )}
      <CmpAc />
    </div>
  );
}
export function CountriesPage() {
  const { navigate: e } = useStore(),
    { tx: a, p: t } = useI18n();
  return (
    <div>
      <PageHeader
        eyebrow={a('5 countries · 50 universities', '5 davlat · 50 universitet')}
        title={a('Choose a country', 'Davlatni tanlang')}
        sub={a(
          'Each country has 10 universities in three groups — highly selective, balanced and more accessible — with separate bachelor’s and master’s information, QS 2027 positions and the main grants.',
          'Har bir davlatda uch guruhda 10 ta universitet — kuchli tanlov, o‘rta va qulayroq — alohida bakalavr va magistratura ma’lumotlari, QS 2027 o‘rinlari va asosiy grantlar bilan.',
        )}
        actions={
          <>
            <Button icon={<BookOpen size={16} />} onClick={() => e('glossary')}>
              {a('Glossary', 'Lug‘at')}
            </Button>
            <Button icon={<ListChecks size={16} />} onClick={() => e('roadmap')}>
              {a('Preparation plan', 'Tayyorgarlik rejasi')}
            </Button>
          </>
        }
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Ro.map((n) => (
          <li key={n}>
            <button
              type="button"
              onClick={() => e('country', n)}
              className="flex h-full w-full flex-col gap-1 rounded-xl border border-line bg-surface p-5 text-left shadow-card transition-colors hover:border-teal/50"
            >
              <span className="text-[12px] font-bold uppercase tracking-wide text-faint">
                {'10 '}
                {a('universities', 'universitet')}
                {' · 3 '}
                {a('groups', 'guruh')}
              </span>
              <span className="text-[20px] font-extrabold">{t(ta[n].name)}</span>
              <span className="text-[13.5px] text-muted">{t(ta[n].tagline)}</span>
              <span className="mt-2 text-[13px] font-bold text-teal-ink dark:text-teal">
                {a('Open country page →', 'Davlat sahifasini ochish →')}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-[13px] text-muted">
        {a(
          `Information checked on official pages on ${me(fh, 'en')}. Admission rules change every year — always confirm on the university’s page.`,
          `Ma’lumotlar rasmiy sahifalarda ${me(fh, 'uz')} da tekshirilgan. Qabul qoidalari har yili o‘zgaradi — har doim universitet sahifasida tasdiqlang.`,
        )}
      </p>
    </div>
  );
}
export function CountryPage({ code: e }) {
  const { navigate: a } = useStore(),
    { tx: t, p: n } = useI18n(),
    s = Ro.includes(e) ? e : null,
    [r, o] = React.useState('bachelor');
  if (!s) return <Callout tone="warn">{t('Country not found.', 'Davlat topilmadi.')}</Callout>;
  const u = Cg[s],
    l = Mu(s),
    c = Us(s, r);
  return (
    <div>
      <button
        type="button"
        onClick={() => a('countries')}
        className="mb-3 inline-flex items-center gap-1 text-[13.5px] font-semibold text-muted hover:text-fg"
      >
        <ArrowLeft size={15} />
        {t('All countries', 'Barcha davlatlar')}
      </button>
      <PageHeader
        eyebrow={t('Country guide', 'Davlat bo‘yicha qo‘llanma')}
        title={n(ta[s].name)}
        sub={n(ta[s].tagline)}
      />
      <Card className="mb-5 p-4">
        <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
          <Info size={16} aria-hidden={!0} />
          {t('How these 10 were chosen', 'Bu 10 ta qanday tanlangan')}
        </h2>
        <p className="mt-1.5 text-[14px]">{n(yj[s])}</p>
        <p className="mt-1.5 text-[13px] text-muted">
          {t(
            'Positions shown are the QS World University Rankings 2027 only, each with the page it was taken from. QS, THE, subject rankings and QS Stars are different measures and are not mixed here.',
            'Ko‘rsatilgan o‘rinlar faqat QS World University Rankings 2027 bo‘yicha, har biri olingan sahifa bilan. QS, THE, fan reytinglari va QS Stars — har xil ko‘rsatkichlar, bu yerda aralashtirilmagan.',
          )}
        </p>
      </Card>
      <div className="mb-4">
        <Tabs
          value={r}
          onChange={o}
          items={[
            {
              id: 'bachelor',
              label: t(ze.bachelor.en, ze.bachelor.uz),
            },
            {
              id: 'master',
              label: t(ze.master.en, ze.master.uz),
            },
          ]}
        />
      </div>
      <Card className="mb-5 border-warn/30 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
            <Lightbulb size={16} aria-hidden={!0} />
            {t('General preparation guidance', 'Umumiy tayyorgarlik yo‘riqnomasi')}
          </h2>
          <Badge tone="warn">
            {t(
              'Preparation advice — not an official minimum',
              'Tayyorgarlik uchun tavsiya — rasmiy minimal talab emas',
            )}
          </Badge>
        </div>
        <p className="mt-2 text-[14px] leading-relaxed">{n(u[r])}</p>
        <p className="mt-2 text-[12.5px] text-muted">
          {t(
            'Score ranges here are general targets, not averages and not entry rules. Each university page shows the requirement confirmed on that university’s own page, which always takes priority.',
            'Bu yerdagi ball oraliqlari umumiy mo‘ljal; ular o‘rtacha statistika ham, kirish qoidasi ham emas. Har bir universitet sahifasida o‘sha universitetning o‘z sahifasida tasdiqlangan talab ko‘rsatiladi va u har doim ustun turadi.',
          )}
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
          {u.sources.map((p) => (
            <li key={p}>
              <a
                href={p}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-teal-ink underline decoration-teal/40 underline-offset-2 dark:text-teal"
              >
                {p.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                <ExternalLink size={11} />
              </a>
            </li>
          ))}
        </ul>
      </Card>
      {u.notes.length > 0 && (
        <div className="mb-5 flex flex-col gap-2">
          {u.notes.map((p, d) => (
            <Callout tone="info" key={d}>
              {n(p)}
            </Callout>
          ))}
        </div>
      )}
      <section className="mb-8">
        <h2 className="mb-3 text-[19px] font-extrabold">
          {t(`Grants for ${ze[r].en.toLowerCase()} study`, `${ze[r].uz} uchun grantlar`)}
        </h2>
        {c.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {c.map((p) => (
              <CmpBy g={p} key={p.id} />
            ))}
          </div>
        ) : (
          <Callout tone="neutral">
            {t(
              'No national grant for this level was confirmed. University scholarships, where recorded, are shown on each university page.',
              'Bu daraja uchun milliy grant tasdiqlanmadi. Qayd etilgan universitet stipendiyalari har bir universitet sahifasida ko‘rsatilgan.',
            )}
          </Callout>
        )}
        {s === 'MY' && r === 'bachelor' && (
          <p className="mt-2 text-[13px] text-muted">
            {t(
              'MTCP and MIS are for postgraduate study. For a bachelor’s, look for each university’s own merit scholarships and tuition waivers (shown on the university pages where recorded).',
              'MTCP va MIS magistratura uchun. Bakalavr uchun har bir universitetning o‘z merit stipendiyalari va kontrakt chegirmalarini qidiring (qayd etilgan bo‘lsa universitet sahifasida ko‘rsatilgan).',
            )}
          </p>
        )}
        {s === 'DE' && (
          <p className="mt-2 text-[13px] text-muted">
            {t(
              'DAAD is not one grant for every university and level — it runs many separate programmes. A tuition-free place does not mean your living costs are paid.',
              'DAAD barcha universitet va darajaga bir xil grant emas — u ko‘plab alohida dasturlarga ega. Kontraktsiz o‘qish yashash xarajatlaringiz to‘lanadi degani emas.',
            )}
          </p>
        )}
        <p className="mt-2 text-[13px] text-muted">
          {t(
            'Being admitted to a university and winning a grant are two separate results.',
            'Universitetga qabul qilinish va grant yutish — ikki xil natija.',
          )}
        </p>
      </section>
      {Tg.map((p) => (
        <section className="mb-8" key={p}>
          <div className="mb-3">
            <h2 className="flex flex-wrap items-center gap-2 text-[19px] font-extrabold">{n(jn[p].name)}</h2>
            <p className="mt-0.5 max-w-3xl text-[13.5px] text-muted">{n(jn[p].who)}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {l
              .filter((d) => d.tier === p)
              .map((d) => (
                <li key={d.id}>
                  <CmpVy u={d} />
                </li>
              ))}
          </ul>
        </section>
      ))}
      <p className="mb-4 text-[12.5px] text-muted">
        {t(
          'Groups are EduBridge guidance based on QS 2027 position, published requirements and cost — not an official classification. A “more accessible” university still has its own selection.',
          'Guruhlar QS 2027 o‘rni, e’lon qilingan talablar va narx asosidagi EduBridge tavsiyasi — rasmiy tasnif emas. “Qulayroq” universitetning ham o‘z tanlovi bor.',
        )}
      </p>
      <CmpAc />
    </div>
  );
}
const cE = {
  English: 'ingliz',
  German: 'nemis',
  Turkish: 'turk',
  Korean: 'koreys',
  Hungarian: 'venger',
  Malay: 'malay',
};
function Sa({ n: e, title: a, kind: t, children: n }) {
  const { tx: s } = useI18n();
  return (
    <section className="border-t border-line py-4 first:border-t-0">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy-soft text-[12px] font-extrabold text-navy">
          {e}
        </span>
        <h3 className="text-[15.5px] font-extrabold">{a}</h3>
        {t === 'official' && (
          <Badge tone="ok" icon={<ShieldCheck size={12} />}>
            {s('Official minimum (from the university)', 'Rasmiy minimal talab (universitetdan)')}
          </Badge>
        )}
        {t === 'missing' && <Badge tone="neutral">{s('Not confirmed', 'Tasdiqlanmagan')}</Badge>}
      </div>
      <div className="pl-8 text-[14px] leading-relaxed">{n}</div>
    </section>
  );
}
const Jn = ({ children: e }) => <p className="text-muted">{e}</p>;
function hE(e, a) {
  const t = a === 'uz',
    n = $e(ta[e.country].name, a),
    s = e.type === 'public' ? la(a, 'public', 'davlat') : e.type === 'private' ? la(a, 'private', 'xususiy') : '',
    r = t
      ? `${e.name} — ${n}dagi ${s ? `${s} ` : ''}universitet. Joylashuvi: ${Li(e.city, 'uz')}.`
      : a === 'ru'
        ? `${e.name} — ${s ? `${s} ` : ''}университет, ${n}. Расположение: ${Li(e.city, 'ru')}.`
        : `${e.name} is a ${s ? `${s} ` : ''}university in ${n}. Location: ${e.city}.`,
    o = e.subjects
      .slice(0, 4)
      .map((c) => {
        const p = $e(xe[c], a);
        return p.charAt(0).toLowerCase() + p.slice(1);
      })
      .join(', '),
    u = o
      ? t
        ? `Uning dasturlari orasida ${o} yo‘nalishlari bor.`
        : a === 'ru'
          ? `Среди направлений: ${o}.`
          : `Its programmes include ${o}.`
      : '',
    l = e.campus ? $e(e.campus, a) : '';
  return [r, u, l].filter(Boolean).join(' ');
}
function CmpME({ u: e, level: a }) {
  var b, S;
  const { tx: t, p: n, lang: s } = useI18n(),
    { navigate: r } = useStore(),
    o = e.levels[a],
    u = Bs(o),
    l = t(ze[a].en, ze[a].uz),
    c = bj(e.country, a),
    p = Mg(e.country, a),
    d = Us(e.country, a),
    h = e.scholarships.filter((A) => A.international_eligible !== !1 && (!A.levels.length || A.levels.includes(a))),
    m = Go(e),
    y = o.apply ?? e.apply ?? e.admissions,
    E = e.applyLinks.filter((A) => A.level === a || A.level === 'general'),
    C = [
      {
        label: t('Official website', 'Rasmiy sayt'),
        url: e.website,
      },
      ...(e.admissions
        ? [
            {
              label: t('International admissions', 'Xalqaro qabul'),
              url: e.admissions,
            },
          ]
        : []),
      ...(y && y !== e.admissions
        ? [
            {
              label: t('Application page', 'Ariza sahifasi'),
              url: y,
            },
          ]
        : []),
      ...E.map((A) => ({
        label: Li(A.label, s),
        url: A.url,
      })),
      ...(o.example
        ? [
            {
              label: `${t('Programme page', 'Dastur sahifasi')}: ${o.example.name}`,
              url: o.example.url,
            },
          ]
        : []),
      ...o.sources.map((A) => ({
        label: t('Source', 'Manba'),
        url: A,
      })),
      ...((b = e.fee) != null && b.source
        ? [
            {
              label: t('Application fee source', 'Ariza to‘lovi manbasi'),
              url: e.fee.source,
            },
          ]
        : []),
      ...((S = o.tuition) != null && S.source
        ? [
            {
              label: t('Tuition source', 'Kontrakt manbasi'),
              url: o.tuition.source,
            },
          ]
        : []),
    ],
    v = new Set(),
    g = C.filter((A) => (v.has(A.url) ? !1 : (v.add(A.url), !0)));
  return (
    <div>
      {o.note && (
        <div className="mb-3">
          <Callout tone={o.open === 'no' ? 'bad' : 'info'}>{n(o.note)}</Callout>
        </div>
      )}
      {o.open === 'integrated' && (
        <div className="mb-3">
          <Callout tone="info">
            {t(
              'General Medicine here is a one-tier (integrated) programme straight after school — it is not a 3-year bachelor’s and not a 2-year master’s. Other degree programmes may be listed separately on the university site.',
              'Bu yerda General Medicine — maktabdan keyingi uzluksiz (bir bosqichli) dastur; u 3 yillik bakalavr ham, 2 yillik magistratura ham emas. Boshqa daraja dasturlari universitet saytida alohida ko‘rsatilgan bo‘lishi mumkin.',
            )}
          </Callout>
        </div>
      )}
      <Sa n={1} title={t('About the university', 'Universitet haqida')}>
        <p>{hE(e, s)}</p>
        {e.uniNote && <p className="mt-1 font-semibold">{n(e.uniNote)}</p>}
      </Sa>
      <Sa n={2} title={t('Main subject areas', 'Asosiy yo‘nalishlar')}>
        <div className="flex flex-wrap gap-1.5">
          {e.subjects.map((A) => (
            <Badge key={A}>{n(xe[A])}</Badge>
          ))}
        </div>
        <p className="mt-1.5 text-[12.5px] text-muted">
          {t(
            'Broad areas offered — not a claim of being the best in any subject.',
            'Taklif qilinadigan keng yo‘nalishlar — biror sohada “eng zo‘r” degan da’vo emas.',
          )}
        </p>
      </Sa>
      <Sa
        n={3}
        title={t(
          `Is the ${l.toLowerCase()} level open to international students?`,
          `${l} xalqaro talabalar uchun ochiqmi?`,
        )}
      >
        <CmpXo lv={o} level={a} />
        <p className="mt-1.5 text-muted">
          {o.open === 'yes'
            ? t(
                'Yes — the university publishes international admission for this level. Each programme can still have its own rules.',
                'Ha — universitet bu daraja uchun xalqaro qabulni e’lon qiladi. Har bir dasturning o‘z qoidalari bo‘lishi mumkin.',
              )
            : o.open === 'no'
              ? t(
                  'No full-degree route for international applicants was found on official pages.',
                  'Rasmiy sahifalarda xalqaro abituriyent uchun to‘liq daraja yo‘li topilmadi.',
                )
              : o.open === 'integrated'
                ? t(
                    'Entry is to a one-tier programme (see note above).',
                    'Qabul uzluksiz dasturga (yuqoridagi izohga qarang).',
                  )
                : t(
                    'Not checked yet — open the official admissions page.',
                    'Hali tekshirilmagan — rasmiy qabul sahifasini oching.',
                  )}
        </p>
      </Sa>
      {u && (
        <>
          <Sa n={4} title={t('Language of instruction', 'Ta’lim tili')}>
            {m.length ? (
              <p>{m.map((A) => (s === 'uz' ? `${cE[A] ?? A} tili` : s === 'ru' ? Bi(A) : A)).join(', ')}</p>
            ) : (
              <Jn>{t('Not confirmed.', 'Tasdiqlanmagan.')}</Jn>
            )}
            <p className="mt-1 text-[12.5px] text-muted">
              {t(
                'Based on the official pages and the tests they ask for. Some courses in English do not make a whole degree English-taught — check the programme page.',
                'Rasmiy sahifalar va ular so‘ragan testlar asosida. Ayrim fanlarning inglizcha bo‘lishi butun daraja inglizcha degani emas — dastur sahifasini tekshiring.',
              )}
            </p>
          </Sa>
          <Sa n={5} title={t('Academic requirement', 'Akademik talab')} kind={o.academic ? 'official' : 'missing'}>
            {o.academic ? (
              <p>{n(o.academic)}</p>
            ) : (
              <Jn>
                {t(
                  'No academic minimum was confirmed on an official page. That does not mean there is none — check the programme page.',
                  'Rasmiy sahifada akademik minimum tasdiqlanmadi. Bu talab yo‘q degani emas — dastur sahifasini tekshiring.',
                )}
              </Jn>
            )}
          </Sa>
          <Sa n={6} title={t('Language requirement', 'Til talabi')} kind={o.language ? 'official' : 'missing'}>
            {o.language ? (
              <p>{n(o.language)}</p>
            ) : (
              <Jn>
                {t(
                  'Not confirmed — this does not mean no test is needed.',
                  'Tasdiqlanmagan — bu test kerak emas degani emas.',
                )}
              </Jn>
            )}
            {o.ieltsScope === 'programme' && (
              <p className="mt-1 text-[12.5px] font-semibold text-warn">
                {t(
                  'Scores differ by programme — there is no single IELTS for the whole university.',
                  'Ballar dasturga qarab farq qiladi — butun universitet uchun yagona IELTS yo‘q.',
                )}
              </p>
            )}
          </Sa>
          <Sa n={7} title={t('Exams and assessment', 'Imtihon va baholash')} kind={o.exams ? 'official' : void 0}>
            {o.exams ? (
              <p>{n(o.exams)}</p>
            ) : (
              <Jn>
                {t(
                  'No entrance exam or interview stated on the pages read. Programmes may still add one.',
                  'O‘qilgan sahifalarda kirish imtihoni yoki suhbat ko‘rsatilmagan. Dasturlar baribir qo‘shishi mumkin.',
                )}
              </Jn>
            )}
          </Sa>
          <Sa n={8} title={t('Document checklist', 'Hujjatlar ro‘yxati')}>
            <p className="mb-2 text-[12.5px] text-muted">
              {t(
                'Typical list for this country and level. The exact list is in the programme’s official guide.',
                'Bu davlat va daraja uchun odatiy ro‘yxat. Aniq ro‘yxat dasturning rasmiy qo‘llanmasida.',
              )}
            </p>
            <ul className="flex flex-col gap-1.5">
              {c.map(([A, q], w) => (
                <li
                  className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-line px-3 py-2"
                  key={w}
                >
                  <span className="flex min-w-0 items-start gap-2">
                    <FileCheck2 size={15} className="mt-0.5 shrink-0 text-faint" aria-hidden={!0} />
                    {n(A)}
                  </span>
                  <Badge tone={q === 'required' ? 'navy' : q === 'depends' ? 'warn' : 'neutral'}>{n(fj[q])}</Badge>
                </li>
              ))}
            </ul>
          </Sa>
          <Sa n={9} title={t('What to do to apply', 'Kirish uchun nima qilish kerak?')}>
            <ol className="flex list-decimal flex-col gap-1 pl-5">
              {p.map((A, q) => (
                <li key={q}>{n(A)}</li>
              ))}
            </ol>
            {y && (
              <a
                href={y}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-2 text-[13.5px] font-bold text-navy-ink"
              >
                {t('Open the official application page', 'Rasmiy ariza sahifasini ochish')}
                <ExternalLink size={14} />
              </a>
            )}
            <p className="mt-2 flex items-start gap-1.5 text-[12.5px] text-muted">
              <KeyRound size={13} className="mt-0.5 shrink-0" aria-hidden={!0} />
              {t(
                'You apply directly with the university. EduBridge never asks for your application account password.',
                'Siz to‘g‘ridan-to‘g‘ri universitetga topshirasiz. EduBridge ariza akkauntingiz parolini hech qachon so‘ramaydi.',
              )}
            </p>
          </Sa>
          <Sa
            n={10}
            title={t('Intake and deadline', 'Qabul davri va muddat')}
            kind={o.deadline ? 'official' : 'missing'}
          >
            <CmpYy lv={o} />
            <p className="mt-1.5 text-[12.5px] text-muted">
              {t(
                'This is the university deadline. Grant deadlines are separate (see item 12). Dates are in the university’s local time unless stated.',
                'Bu universitet muddati. Grant muddatlari alohida (12-bandga qarang). Boshqacha ko‘rsatilmagan bo‘lsa, vaqt universitetning mahalliy vaqti bo‘yicha.',
              )}
            </p>
          </Sa>
          <Sa
            n={11}
            title={t('Tuition and application fee', 'Kontrakt va ariza to‘lovi')}
            kind={o.tuition || e.fee ? 'official' : 'missing'}
          >
            <p>
              <span className="text-muted">
                {t('Tuition', 'Kontrakt')}
                {': '}
              </span>
              <CmpGy lv={o} />
            </p>
            <p className="mt-1.5">
              <span className="text-muted">
                {t('Application fee', 'Ariza to‘lovi')}
                {': '}
              </span>
              {e.fee ? (
                <>
                  <span className="font-bold">
                    {e.fee.amount === 0
                      ? t('free', 'bepul')
                      : `${e.fee.amount.toLocaleString('en-US').replace(/,/g, ' ')} ${e.fee.currency}`}
                  </span>
                  {e.fee.note && (
                    <span className="text-muted">
                      {' · '}
                      {n(e.fee.note)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted">{t('Not confirmed', 'Tasdiqlanmagan')}</span>
              )}
            </p>
            <p className="mt-1 text-[12.5px] text-muted">
              {t(
                'Missing amounts are left blank — never read a blank as “free”.',
                'Yo‘q summalar bo‘sh qoldirilgan — bo‘sh joyni “bepul” deb tushunmang.',
              )}
            </p>
          </Sa>
          <Sa n={12} title={t('Grants and scholarships', 'Grantlar va stipendiyalar')}>
            {h.length > 0 && (
              <div className="mb-3">
                <p className="mb-1.5 font-bold">
                  {t('University scholarships recorded', 'Qayd etilgan universitet stipendiyalari')}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {h.map((A, q) => (
                    <li className="rounded-lg border border-line px-3 py-2" key={q}>
                      <a
                        href={A.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-teal-ink underline decoration-teal/40 underline-offset-2 dark:text-teal"
                      >
                        {A.name}
                      </a>
                      {A.coverage && <span className="block text-[13px] text-muted">{A.coverage}</span>}
                      {A.deadline && (
                        <span className="block text-[12.5px] text-muted">
                          {t('Deadline', 'Muddat')}
                          {': '}
                          {me(A.deadline, s)}
                          {A.deadline < new Date().toISOString().slice(0, 10) ? ` (${t('passed', 'o‘tgan')})` : ''}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {d.length ? (
              <div className="flex flex-col gap-3">
                {d.map((A) => (
                  <CmpBy g={A} uni={e} key={A.id} />
                ))}
              </div>
            ) : (
              <Jn>
                {t('No national grant for this level was confirmed.', 'Bu daraja uchun milliy grant tasdiqlanmadi.')}
              </Jn>
            )}
          </Sa>
        </>
      )}
      <Sa n={u ? 13 : 4} title={t('Official links and last check', 'Rasmiy havolalar va oxirgi tekshiruv')}>
        <ul className="flex flex-col gap-1">
          {g.map((A) => (
            <li key={A.url}>
              <a
                href={A.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start gap-1 break-all text-teal-ink underline decoration-teal/40 underline-offset-2 dark:text-teal"
              >
                <span className="font-semibold">{A.label}</span>
                <span className="text-muted">
                  {'· '}
                  {A.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 55)}
                </span>
                <ExternalLink size={12} className="mt-1 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[12.5px] text-muted">
          {t(`Last checked: ${me(e.lastChecked, 'en')}`, `Oxirgi tekshiruv: ${me(e.lastChecked, 'uz')}`)}
        </p>
      </Sa>
      {o.example && (
        <Card className="mt-2 border-teal/30 p-4">
          <p className="eyebrow mb-1">{t('Example programme', 'Misol dastur')}</p>
          <a
            href={o.example.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[15.5px] font-extrabold text-teal-ink hover:underline dark:text-teal"
          >
            {o.example.name}
          </a>
          <p className="mt-1 text-[14px]">{n(o.example.req)}</p>
          <p className="mt-1 text-[12.5px] text-muted">
            {t(
              'These values apply to this programme only — do not apply them to the whole university.',
              'Bu qiymatlar faqat shu dasturga tegishli — butun universitetga umumlashtirmang.',
            )}
          </p>
        </Card>
      )}
      <Card className="mt-4 border-warn/30 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="flex items-center gap-1.5 font-extrabold">
            <Lightbulb size={15} aria-hidden={!0} />
            {t('Preparation advice for this country', 'Bu davlat uchun tayyorgarlik tavsiyasi')}
          </p>
          <Badge tone="warn">{t('Not an official minimum', 'Rasmiy minimal talab emas')}</Badge>
        </div>
        <p className="mt-1.5 text-[13.5px] text-muted">{n(Cg[e.country][a])}</p>
        <button
          type="button"
          onClick={() => r('roadmap')}
          className="mt-2 text-[13px] font-bold text-teal-ink hover:underline dark:text-teal"
        >
          {t('Open the preparation checklist →', 'Tayyorgarlik checklistini ochish →')}
        </button>
      </Card>
    </div>
  );
}
export function UniversityPage({ id: e }) {
  const { navigate: a } = useStore(),
    { tx: t, p: n, lang: s } = useI18n(),
    [r, o] = e.split('@'),
    u = Mn(r),
    [l, c] = React.useState(o === 'master' ? 'master' : 'bachelor');
  return (
    React.useEffect(() => {
      var p;
      (p = window.scrollTo) == null || p.call(window, 0, 0);
    }, [r]),
    u ? (
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => a('country', u.country)}
          className="mb-3 inline-flex items-center gap-1 text-[13.5px] font-semibold text-muted hover:text-fg"
        >
          <ArrowLeft size={15} />
          {n(ta[u.country].name)}
        </button>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">
              {u.order}
              {'. '}
              {n(ta[u.country].name)}
              {' · '}
              {u.short}
            </p>
            <h1 className="mt-0.5 text-[25px] font-extrabold leading-tight md:text-[29px]">{u.name}</h1>
            <p className="mt-1 text-[14px] text-muted">
              {Li(u.city, s)}
              {u.type ? ` · ${u.type === 'public' ? t('Public', 'Davlat') : t('Private', 'Xususiy')}` : ''}
            </p>
          </div>
          <CmpPy id={u.id} />
        </div>
        <div className="mb-4">
          <CmpTE u={u} />
        </div>
        <div className="sticky top-16 z-20 -mx-1 mb-2 bg-bg/95 px-1 py-2 backdrop-blur">
          <Tabs
            value={l}
            onChange={c}
            items={[
              {
                id: 'bachelor',
                label: t(ze.bachelor.en, ze.bachelor.uz),
              },
              {
                id: 'master',
                label: t(ze.master.en, ze.master.uz),
              },
            ]}
          />
        </div>
        <Card className={classNames('p-4 md:p-5')}>
          <CmpME u={u} level={l} key={l} />
        </Card>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => a('universities')}>{t('Back to the catalogue', 'Katalogga qaytish')}</Button>
          <Button onClick={() => a('glossary')}>{t('Glossary', 'Lug‘at')}</Button>
        </div>
        <CmpAc />
      </div>
    ) : (
      <Callout tone="warn">{t('University not found.', 'Universitet topilmadi.')}</Callout>
    )
  );
}
const gE = {
  English: 'ingliz',
  German: 'nemis',
  Turkish: 'turk',
  Korean: 'koreys',
  Hungarian: 'venger',
  Malay: 'malay',
};
export function UniversityComparePage({ ids: e }) {
  const { navigate: a } = useStore(),
    { tx: t, p: n, lang: s } = useI18n(),
    r = ec(),
    u = (e ? e.split(',') : r.list).map(Mn).filter(Boolean).slice(0, 3),
    [l, c] = React.useState('bachelor');
  if (u.length < 2)
    return (
      <EmptyState
        title={t('Pick 2 or 3 universities to compare', 'Solishtirish uchun 2 yoki 3 ta universitet tanlang')}
        body={t(
          'Use the “+” button on any university card.',
          'Istalgan universitet kartasidagi “+” tugmasidan foydalaning.',
        )}
        action={
          <Button variant="primary" onClick={() => a('universities')}>
            {t('Open the catalogue', 'Katalogni ochish')}
          </Button>
        }
      />
    );
  const p = <span className="text-muted">{t('Not confirmed', 'Tasdiqlanmagan')}</span>,
    d = [
      [t('Country · city', 'Davlat · shahar'), (h) => `${n(ta[h.country].name)} · ${Li(h.city, s)}`],
      [t('Group', 'Guruh'), (h) => <CmpFy tier={h.tier} />],
      ['QS 2027', (h) => h.ranking.value ?? <span className="text-muted">{t('Not confirmed', 'Tasdiqlanmagan')}</span>],
      [t('Level open', 'Daraja ochiqmi'), (h) => <CmpXo lv={h.levels[l]} level={l} />],
      [
        t('Language of instruction', 'Ta’lim tili'),
        (h) =>
          Go(h)
            .map((m) => t(m, gE[m] ?? m))
            .join(', ') || p,
      ],
      [
        t('Academic requirement', 'Diplom / akademik talab'),
        (h) => (h.levels[l].academic ? n(h.levels[l].academic) : p),
      ],
      [t('Language requirement', 'Til talabi'), (h) => (h.levels[l].language ? n(h.levels[l].language) : p)],
      [
        t('Exams', 'Imtihon'),
        (h) =>
          h.levels[l].exams ? (
            n(h.levels[l].exams)
          ) : (
            <span className="text-muted">{t('None stated', 'Ko‘rsatilmagan')}</span>
          ),
      ],
      [t('Deadline', 'Muddat'), (h) => <CmpYy lv={h.levels[l]} />],
      [t('Tuition', 'Kontrakt'), (h) => <CmpGy lv={h.levels[l]} />],
      [
        t('Grants', 'Grantlar'),
        (h) => {
          const m = Us(h.country, l);
          return (
            <ul className="flex flex-col gap-1">
              {m.map((y) => (
                <li key={y.id}>
                  {y.name}{' '}
                  <Badge tone={an(y, h) === 'confirmed' ? 'ok' : an(y, h) === 'not_listed' ? 'bad' : 'neutral'}>
                    {an(y, h) === 'confirmed'
                      ? t('on official list', 'rasmiy ro‘yxatda')
                      : an(y, h) === 'not_listed'
                        ? t('not on list', 'ro‘yxatda yo‘q')
                        : t('check', 'tekshiring')}
                  </Badge>
                </li>
              ))}
              {Iu(h, l) && <li>{t('University scholarship recorded', 'Universitet stipendiyasi qayd etilgan')}</li>}
              {!m.length && !Iu(h, l) && <li className="text-muted">{t('None confirmed', 'Tasdiqlanmagan')}</li>}
            </ul>
          );
        },
      ],
      [
        t('Source', 'Manba'),
        (h) => {
          const m = h.levels[l].sources[0] ?? h.admissions ?? h.website;
          return (
            <a
              href={m}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 break-all text-teal-ink underline decoration-teal/40 underline-offset-2 dark:text-teal"
            >
              {m.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}
              <ExternalLink size={12} />
            </a>
          );
        },
      ],
    ];
  return (
    <div>
      <PageHeader
        title={t('Compare universities', 'Universitetlarni solishtirish')}
        sub={t(
          'Only confirmed information is shown. A blank never means zero or free.',
          'Faqat tasdiqlangan ma’lumot ko‘rsatiladi. Bo‘sh joy hech qachon nol yoki bepul degani emas.',
        )}
      />
      <div className="mb-4">
        <Tabs
          value={l}
          onChange={c}
          items={[
            {
              id: 'bachelor',
              label: t(ze.bachelor.en, ze.bachelor.uz),
            },
            {
              id: 'master',
              label: t(ze.master.en, ze.master.uz),
            },
          ]}
        />
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {u.map((h) => (
          <div className="rounded-xl border border-line bg-surface p-4" key={h.id}>
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => a('uni', `${h.id}@${l}`)}
                className="text-left text-[16px] font-extrabold hover:text-teal-ink"
              >
                {h.name}
              </button>
              <button
                type="button"
                aria-label={t('Remove', 'Olib tashlash')}
                onClick={() => {
                  (r.toggle(h.id),
                    a(
                      'unicompare',
                      u
                        .filter((m) => m.id !== h.id)
                        .map((m) => m.id)
                        .join(','),
                    ));
                }}
                className="rounded p-1 text-muted hover:bg-sunken"
              >
                <X size={16} />
              </button>
            </div>
            <dl className="mt-2">
              {d.map(([m, y]) => (
                <div className="border-t border-line py-2" key={m}>
                  <dt className="text-[12px] font-bold text-muted">{m}</dt>
                  <dd className="text-[13.5px]">{y(h)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface md:block">
        <table className="w-full table-fixed text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-line">
              <th className="w-44 p-3 text-[12px] font-bold uppercase text-faint">
                {t('Level', 'Daraja')}
                {': '}
                {t(ze[l].en, ze[l].uz)}
              </th>
              {u.map((h) => (
                <th className="p-3 align-top" key={h.id}>
                  <button
                    type="button"
                    onClick={() => a('uni', `${h.id}@${l}`)}
                    className="text-left text-[15px] font-extrabold hover:text-teal-ink"
                  >
                    {h.name}
                  </button>
                  {!Bs(h.levels[l]) && (
                    <span className="mt-1 block text-[12px] font-semibold text-bad">
                      {t('Level not open / not checked', 'Daraja ochiq emas / tekshirilmagan')}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.map(([h, m]) => (
              <tr className="border-t border-line align-top" key={h}>
                <th className="p-3 text-[12.5px] font-bold text-muted">{h}</th>
                {u.map((y) => (
                  <td className="p-3" key={y.id}>
                    {m(y)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export function GlossaryPage() {
  const { tx: e, p: a } = useI18n();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={e('Glossary', 'Lug‘at')}
        title={e('Words you will meet when applying', 'Ariza jarayonida uchraydigan so‘zlar')}
      />
      <dl className="grid gap-3">
        {qj.map((t) => (
          <Card className="p-4" key={t.term}>
            <dt className="text-[16px] font-extrabold">{t.term}</dt>
            <dd className="mt-1 text-[14px] text-muted">{a(t.def)}</dd>
          </Card>
        ))}
      </dl>
    </div>
  );
}
const ky = 'edubridge:roadmap';
const vE = () => {
  try {
    return JSON.parse(localStorage.getItem(ky) ?? '{}') ?? {};
  } catch {
    return {};
  }
};
export function RoadmapPage() {
  const { tx: e, p: a } = useI18n(),
    [t, n] = React.useState('bachelor'),
    [s, r] = React.useState(vE),
    o = (p) =>
      r((d) => {
        const h = {
          ...d,
          [p]: !d[p],
        };
        try {
          localStorage.setItem(ky, JSON.stringify(h));
        } catch {}
        return h;
      }),
    u = Ej(t),
    l = u.reduce((p, d) => p + d.items.length, 0),
    c = u.reduce((p, d) => p + d.items.filter((h) => s[h.id]).length, 0);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={e('Approximate preparation plan', 'Taxminiy tayyorgarlik rejasi')}
        title={e('Preparation roadmap', 'Qabulga tayyorlanish yo‘l xaritasi')}
        sub={e(
          'A suggested timeline counted back from your deadline. It is not an official admission calendar.',
          'Deadline’dan orqaga hisoblangan tavsiya etilgan vaqt rejasi. Bu rasmiy qabul kalendari emas.',
        )}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={t}
          onChange={n}
          items={[
            {
              id: 'bachelor',
              label: e(ze.bachelor.en, ze.bachelor.uz),
            },
            {
              id: 'master',
              label: e(ze.master.en, ze.master.uz),
            },
          ]}
        />
        <p className="tabular text-[13.5px] font-semibold text-muted">
          {c}/{l} {e('done', 'bajarildi')}
        </p>
      </div>
      <ol className="flex flex-col gap-3">
        {u.map((p) => (
          <li key={p.id}>
            <Card className="p-4">
              <h2 className="text-[15.5px] font-extrabold">{a(p.when)}</h2>
              <ul className="mt-2 flex flex-col gap-1.5">
                {p.items.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={!!s[d.id]}
                      onClick={() => o(d.id)}
                      className="flex w-full items-start gap-2.5 rounded-lg px-1 py-1 text-left hover:bg-sunken"
                    >
                      <span
                        className={classNames(
                          'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border-2',
                          s[d.id] ? 'border-teal bg-teal text-white' : 'border-line',
                        )}
                      >
                        {s[d.id] && <Check size={13} strokeWidth={3} />}
                      </span>
                      <span className={classNames('text-[14px]', s[d.id] && 'text-muted line-through')}>
                        {a(d.text)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ))}
      </ol>
      <div className="mt-4">
        <Callout tone="warn">
          {e(
            'No promises here: a good IELTS alone is not enough, a grant is never certain, and meeting a minimum does not guarantee admission. A high language score does not replace missing subjects or credits.',
            'Bu yerda va’da yo‘q: faqat yaxshi IELTS yetarli emas, grant hech qachon aniq emas, minimal ballga yetish qabulni kafolatlamaydi. Yuqori til bali yetishmayotgan fan yoki kreditlarni avtomatik qoplamaydi.',
          )}
        </Callout>
      </div>
    </div>
  );
}
export function CmpKE({ children: e }) {
  const { tx: a } = useI18n(),
    t = cy();
  return t === 'checking' ? (
    <p className="text-muted">{a('Checking access…', 'Ruxsat tekshirilmoqda…')}</p>
  ) : t === 'denied' ? (
    <EmptyState
      icon={<Lock size={24} />}
      title={a('Staff only', 'Faqat xodimlar uchun')}
      body={a(
        'The data review tools are available only to the owner of this EduBridge page.',
        'Ma’lumotlarni ko‘rib chiqish vositalari faqat ushbu EduBridge sahifasi egasi uchun.',
      )}
    />
  ) : (
    <>{e}</>
  );
}
export const xE = new Set(['dashboard', 'plans', 'plan', 'calendar', 'writing', 'adviser', 'budget', 'settings']);
export function CmpWE() {
  const { navigate: e } = useStore(),
    { tx: a } = useI18n();
  return (
    <div className="mx-auto max-w-xl py-10">
      <EmptyState
        icon={<UserPlus size={28} />}
        title={a('This page uses your student profile', 'Bu sahifa talaba profilingizdan foydalanadi')}
        body={a(
          'Create a profile (about 5 minutes) or try a fictional demo student.',
          'Profil yarating (taxminan 5 daqiqa) yoki xayoliy namoyish talabasini sinab ko‘ring.',
        )}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="primary" onClick={() => e('onboarding')}>
              {a('Build my profile', 'Profilimni yaratish')}
            </Button>
            <Button icon={<FlaskConical size={16} />} onClick={() => e('demo')}>
              {a('Try demo', 'Namoyishni sinash')}
            </Button>
          </div>
        }
      />
    </div>
  );
}
