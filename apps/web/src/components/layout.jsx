import React from 'react';
import { logout, useSession } from '../sync/session';
import * as jsxRuntime from 'react/jsx-runtime';
import {
  Bell,
  BookOpen,
  BookOpenCheck,
  Calculator,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Columns3,
  Earth,
  FileText,
  FlaskConical,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquareText,
  PenLine,
  Settings,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { useStore } from '../store/store';
import { profileCompletion, useDerivedData, useI18n } from '../lib/derived';
import { Button, classNames } from './ui';
import { me } from '../lib/core';
import { AS, CS, ES, NS, Nh, SS, TS, bS, jS, kS, qS, wS, xS, zS } from '../assets/index';

export function Logo({ onClick: e }) {
  return (
    <button type="button" onClick={e} className="flex items-center gap-2 rounded-md" aria-label="EduBridge">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden={!0}>
        <rect width="32" height="32" rx="8" fill="rgb(var(--navy))" />
        <path
          d="M6 21c3.2-6.4 6.6-9.6 10-9.6S22.8 14.6 26 21"
          fill="none"
          stroke="rgb(var(--teal))"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M9.5 21v-3.2M16 21v-6.4M22.5 21v-3.2"
          stroke="rgb(var(--navy-ink))"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M5 22.5h22" stroke="rgb(var(--navy-ink))" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="text-[17px] font-extrabold tracking-tight text-fg">EduBridge</span>
    </button>
  );
}
export function LangSwitch() {
  const { state: e, setLang: a } = useStore(),
    { t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t('nav.language')}
      className="flex rounded-lg border border-line bg-surface p-0.5 text-[12.5px] font-bold"
    >
      {['uz', 'ru', 'en'].map((n) => (
        <button
          type="button"
          lang={n}
          aria-pressed={e.lang === n}
          onClick={() => a(n)}
          aria-label={
            {
              uz: 'O‘zbekcha',
              ru: 'Русский',
              en: 'English',
            }[n]
          }
          className={classNames(
            'rounded-md px-2 py-1',
            e.lang === n ? 'bg-navy text-navy-ink' : 'text-muted hover:text-fg',
          )}
          key={n}
        >
          {
            {
              uz: 'UZ',
              ru: 'RU',
              en: 'EN',
            }[n]
          }
        </button>
      ))}
    </div>
  );
}
export function CmpCS() {
  const { toast: e } = useStore();
  return e ? (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fade-in fixed bottom-[max(16px,env(safe-area-inset-bottom,0px))] left-1/2 z-50 -translate-x-1/2 rounded-lg bg-navy px-4 py-2.5 text-[14px] font-semibold text-navy-ink shadow-xl"
      key={e.id}
    >
      {e.text}
    </div>
  ) : null;
}
function CmpHS() {
  const { navigate: e } = useStore(),
    { tx: a } = useI18n(),
    t = [
      ['about', 'About', 'Loyiha haqida'],
      ['contact', 'Contact', 'Aloqa'],
      ['privacy', 'Privacy', 'Maxfiylik'],
      ['terms', 'Terms', 'Foydalanish shartlari'],
      ['disclaimer', 'Disclaimer', 'Ogohlantirish'],
      ['sources', 'Official information policy', 'Rasmiy ma’lumotlar siyosati'],
    ];
  return (
    <footer className="border-t border-line bg-surface">
      <div className="gutter mx-auto flex max-w-6xl flex-col gap-6 py-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo onClick={() => e('home')} />
          <p className="mt-2 text-[13.5px] text-muted">
            {a(
              'A prototype guidance tool for students from Uzbekistan. Always confirm requirements on official websites.',
              'O‘zbekistonlik talabalar uchun yo‘l-yo‘riq vositasining prototipi. Talablarni doim rasmiy saytlarda tasdiqlang.',
            )}
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-2 text-[14px] sm:grid-cols-3">
          {t.map(([n, s, r]) => (
            <button type="button" onClick={() => e('info', n)} className="text-left text-muted hover:text-fg" key={n}>
              {a(s, r)}
            </button>
          ))}
        </nav>
      </div>
    </footer>
  );
}
export function PublicLayout({ children: e }) {
  const { navigate: a, state: t, route: n } = useStore(),
    { t: s } = useI18n(),
    [r, o] = React.useState(!1),
    u = (p, d) => {
      (o(!1), a(p, d));
    },
    c = [
      ['home', 'nav.home', () => u('home')],
      ['countries', 'nav.countries', () => u('countries')],
      ['universities', 'nav.universities', () => u('universities')],
      ['scholarships', 'nav.scholarships', () => u('scholarships')],
      [
        'how',
        'nav.how',
        () => {
          (o(!1),
            n.page !== 'home' && a('home'),
            window.setTimeout(() => {
              var p;
              return (p = document.getElementById('how')) == null
                ? void 0
                : p.scrollIntoView({
                    behavior: 'smooth',
                  });
            }, 60));
        },
      ],
    ];
  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        {s('nav.skip')}
      </a>
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="gutter mx-auto flex h-16 max-w-6xl items-center justify-between gap-4">
          <Logo onClick={() => u('home')} />
          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {c.map(([p, d, h]) => (
              <button
                type="button"
                onClick={h}
                className={classNames(
                  'rounded-md px-3 py-2 text-[14px] font-semibold',
                  n.page === p ? 'text-fg' : 'text-muted hover:text-fg',
                )}
                key={p}
              >
                {s(d)}
              </button>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <LangSwitch />
            {t.profile ? (
              <Button variant="primary" onClick={() => u('dashboard')}>
                {s('nav.dashboard')}
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => u('signin')}>
                  {s('nav.signin')}
                </Button>
                <Button variant="primary" onClick={() => u('onboarding')}>
                  {s('nav.getStarted')}
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <LangSwitch />
            <button
              type="button"
              className="rounded-md p-2 text-fg hover:bg-sunken"
              aria-expanded={r}
              aria-label={s(r ? 'nav.close' : 'nav.menu')}
              onClick={() => o(!r)}
            >
              {r ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {r && (
          <nav aria-label="Mobile" className="gutter border-t border-line bg-surface pb-4 lg:hidden">
            <div className="mx-auto flex max-w-6xl flex-col py-2">
              {c.map(([p, d, h]) => (
                <button
                  type="button"
                  onClick={h}
                  className="rounded-md px-2 py-2.5 text-left text-[15px] font-semibold text-fg hover:bg-sunken"
                  key={p}
                >
                  {s(d)}
                </button>
              ))}
              <div className="mt-2 flex gap-2">
                {t.profile ? (
                  <Button variant="primary" className="flex-1" onClick={() => u('dashboard')}>
                    {s('nav.dashboard')}
                  </Button>
                ) : (
                  <>
                    <Button className="flex-1" onClick={() => u('signin')}>
                      {s('nav.signin')}
                    </Button>
                    <Button variant="primary" className="flex-1" onClick={() => u('onboarding')}>
                      {s('nav.getStarted')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </header>
      <main id="main" className="flex-1">
        {e}
      </main>
      <CmpHS />
    </div>
  );
}
const pS = [
  {
    key: 'nav.plan',
    items: [
      {
        page: 'dashboard',
        key: 'nav.dashboard',
        icon: <LayoutDashboard size={18} />,
      },
      {
        page: 'plans',
        key: 'nav.plans',
        icon: <ClipboardList size={18} />,
      },
      {
        page: 'calendar',
        key: 'nav.calendar',
        icon: <CalendarDays size={18} />,
      },
    ],
  },
  {
    key: 'nav.discover',
    items: [
      {
        page: 'countries',
        key: 'nav.countries',
        icon: <Earth size={18} />,
      },
      {
        page: 'universities',
        key: 'nav.universities',
        icon: <Landmark size={18} />,
      },
      {
        page: 'scholarships',
        key: 'nav.scholarships',
        icon: <GraduationCap size={18} />,
      },
      {
        page: 'compare',
        key: 'nav.compare',
        icon: <Columns3 size={18} />,
      },
      {
        page: 'budget',
        key: 'nav.budget',
        icon: <Calculator size={18} />,
      },
    ],
  },
  {
    key: 'nav.prepare',
    items: [
      {
        page: 'roadmap',
        key: 'nav.roadmap',
        icon: <ListChecks size={18} />,
      },
      {
        page: 'glossary',
        key: 'nav.glossary',
        icon: <BookOpen size={18} />,
      },
      {
        page: 'documents',
        key: 'nav.documents',
        icon: <FileText size={18} />,
      },
      {
        page: 'writing',
        key: 'nav.writing',
        icon: <PenLine size={18} />,
      },
      {
        page: 'adviser',
        key: 'nav.adviser',
        icon: <BookOpenCheck size={18} />,
      },
      {
        page: 'assistant',
        key: 'nav.assistant',
        icon: <MessageSquareText size={18} />,
      },
    ],
  },
];
const gS = {
  uni: 'universities',
  unicompare: 'universities',
  country: 'countries',
  university: 'universities',
  scholarship: 'scholarships',
  plan: 'plans',
};
function SideNav({ onNavigate: e }) {
  const { route: a, navigate: t } = useStore(),
    { t: n } = useI18n(),
    s = gS[a.page] ?? a.page;
  return (
    <nav aria-label="App" className="flex flex-col gap-5">
      {pS.map((r) => (
        <div key={r.key}>
          <p className="eyebrow mb-1.5 px-3">{n(r.key)}</p>
          <ul className="flex flex-col gap-0.5">
            {r.items.map((o) => (
              <li key={o.page}>
                <button
                  type="button"
                  onClick={() => {
                    (t(o.page), e == null || e());
                  }}
                  aria-current={s === o.page ? 'page' : void 0}
                  className={classNames(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] font-semibold',
                    s === o.page ? 'bg-navy-soft text-navy' : 'text-muted hover:bg-sunken hover:text-fg',
                  )}
                >
                  {o.icon}
                  {n(o.key)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
function Jg(e, a, t) {
  React.useEffect(() => {
    if (!t) return;
    const n = (r) => {
        e.current && !e.current.contains(r.target) && a();
      },
      s = (r) => {
        r.key === 'Escape' && a();
      };
    return (
      document.addEventListener('mousedown', n),
      document.addEventListener('keydown', s),
      () => {
        (document.removeEventListener('mousedown', n), document.removeEventListener('keydown', s));
      }
    );
  }, [e, a, t]);
}
function NotificationBell() {
  const { state: e, markRead: a, navigate: t } = useStore(),
    { notices: n, unread: s } = useDerivedData(),
    { t: r, p: o, tx: u, lang: l } = useI18n(),
    [c, p] = React.useState(!1),
    d = React.useRef(null);
  return (
    Jg(d, () => p(!1), c),
    (
      <div className="relative" ref={d}>
        <button
          type="button"
          onClick={() => p(!c)}
          aria-expanded={c}
          aria-label={`${r('nav.notifications')} (${s.length})`}
          className="relative rounded-lg p-2 text-muted hover:bg-sunken hover:text-fg"
        >
          <Bell size={20} />
          {s.length > 0 && (
            <span className="tabular absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-bad px-1 text-[10px] font-bold text-white">
              {s.length}
            </span>
          )}
        </button>
        {c && (
          <div className="fade-in absolute right-0 z-50 mt-2 w-[min(92vw,380px)] rounded-xl border border-line bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-bold">{r('nav.notifications')}</p>
              {s.length > 0 && (
                <button
                  type="button"
                  className="text-[13px] font-semibold text-teal-ink dark:text-teal"
                  onClick={() => a(n.map((h) => h.id))}
                >
                  {r('a.markRead')}
                </button>
              )}
            </div>
            <ul className="max-h-[60vh] overflow-y-auto">
              {n.length === 0 && (
                <li className="px-4 py-6 text-center text-[14px] text-muted">
                  {u(
                    'No reminders right now. Reminders appear here as deadlines approach.',
                    'Hozircha eslatma yo‘q. Muddatlar yaqinlashganda eslatmalar shu yerda chiqadi.',
                  )}
                </li>
              )}
              {n.map((h) => {
                const m = !e.readNotices.includes(h.id);
                return (
                  <li className="border-b border-line last:border-0" key={h.id}>
                    <button
                      type="button"
                      className="flex w-full gap-3 px-4 py-3 text-left hover:bg-sunken"
                      onClick={() => {
                        (a([h.id]), p(!1), h.appId ? t('plan', h.appId) : t('calendar'));
                      }}
                    >
                      <span
                        className={classNames(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          h.level === 'urgent' ? 'bg-bad' : h.level === 'soon' ? 'bg-warn' : 'bg-info',
                          !m && 'opacity-30',
                        )}
                        aria-hidden={!0}
                      />
                      <span className="min-w-0">
                        <span
                          className={classNames('block text-[13.5px]', m ? 'font-bold' : 'font-semibold text-muted')}
                        >
                          {o(h.title)}
                        </span>
                        <span className="mt-0.5 block text-[12.5px] text-muted">{o(h.body)}</span>
                        {h.date && <span className="mt-0.5 block text-[11.5px] text-faint">{me(h.date, l)}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-line px-4 py-2.5 text-[12px] text-faint">
              {u(
                'In-app reminders only. No emails, SMS or push notifications are sent.',
                'Faqat ilova ichidagi eslatmalar. Email, SMS yoki push-xabar yuborilmaydi.',
              )}
            </p>
          </div>
        )}
      </div>
    )
  );
}
function AccountMenu() {
  var d, h;
  const { state: e, navigate: a, resetAll: t, notify: n } = useStore(),
    session = useSession(),
    { t: s, tx: r } = useI18n(),
    [o, u] = React.useState(!1),
    l = React.useRef(null);
  Jg(l, () => u(!1), o);
  const c = profileCompletion(e.profile),
    p = (((d = e.profile) == null ? void 0 : d.name) ?? '?').trim().slice(0, 1).toUpperCase();
  return (
    <div className="relative" ref={l}>
      <button
        type="button"
        onClick={() => u(!o)}
        aria-expanded={o}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-sunken"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-navy text-[13px] font-bold text-navy-ink">
          {p}
        </span>
        <ChevronDown size={16} className="text-muted" aria-hidden={!0} />
      </button>
      {o && (
        <div
          role="menu"
          className="fade-in absolute right-0 z-50 mt-2 w-64 rounded-xl border border-line bg-surface p-2 shadow-xl"
        >
          <div className="px-2 py-2">
            <p className="font-bold">{(h = e.profile) == null ? void 0 : h.name}</p>
            <p className="text-[12.5px] text-muted">{r(`Profile ${c}% complete`, `Profil ${c}% to‘ldirilgan`)}</p>
          </div>
          <button
            role="menuitem"
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[14px] hover:bg-sunken"
            onClick={() => {
              (u(!1), a('onboarding', 'edit'));
            }}
          >
            <UserRound size={16} />
            {s('nav.profile')}
          </button>
          <button
            role="menuitem"
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[14px] hover:bg-sunken"
            onClick={() => {
              (u(!1), a('settings'));
            }}
          >
            <Settings size={16} />
            {s('nav.settings')}
          </button>
          {e.demo && (
            <button
              role="menuitem"
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[14px] hover:bg-sunken"
              onClick={() => {
                (u(!1), a('demo'));
              }}
            >
              <FlaskConical size={16} />
              {r('Switch demo student', 'Boshqa namoyish talabasi')}
            </button>
          )}
          <button
            role="menuitem"
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[14px] text-bad hover:bg-bad-soft"
            onClick={() => {
              u(!1);
              // end the session FIRST: clearing the local copy while still signed in would look like a change to sync
              (session.status === 'user' && !e.demo ? logout() : Promise.resolve()).finally(() => {
                t();
                n(r('Signed out. Local data cleared.', 'Chiqildi. Mahalliy ma’lumotlar o‘chirildi.'));
                a('home');
              });
            }}
          >
            <LogOut size={16} />
            {e.demo ? s('nav.exitDemo') : r('Sign out and clear data', 'Chiqish va ma’lumotlarni o‘chirish')}
          </button>
        </div>
      )}
    </div>
  );
}
export function AppLayout({ children: e }) {
  const { state: a, navigate: t } = useStore(),
    { t: n } = useI18n(),
    [s, r] = React.useState(!1);
  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        {n('nav.skip')}
      </a>
      <div
        className={classNames(
          'gutter flex items-center justify-center gap-2 py-1.5 text-center text-[12.5px] font-semibold',
          a.demo ? 'bg-warn-soft text-warn' : 'bg-navy-soft text-navy',
        )}
      >
        {a.demo ? <FlaskConical size={14} aria-hidden={!0} /> : <Sparkles size={14} aria-hidden={!0} />}
        <span>{a.demo ? n('m.demoBanner') : n('m.localBanner')}</span>
      </div>
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="gutter flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md p-2 hover:bg-sunken lg:hidden"
              aria-label={n('nav.menu')}
              aria-expanded={s}
              onClick={() => r(!0)}
            >
              <Menu size={20} />
            </button>
            <Logo onClick={() => t('dashboard')} />
          </div>
          <div className="flex items-center gap-1.5">
            <LangSwitch />
            <NotificationBell />
            <AccountMenu />
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-line bg-surface px-3 py-5 lg:block">
          <SideNav />
        </aside>
        {s && (
          <div
            className="fixed inset-0 z-50 bg-fg/40 lg:hidden"
            onMouseDown={(o) => {
              o.target === o.currentTarget && r(!1);
            }}
          >
            <div className="fade-in h-full w-72 max-w-[85vw] overflow-y-auto bg-surface px-3 pb-6 pt-[max(16px,env(safe-area-inset-top,0px))]">
              <div className="mb-4 flex items-center justify-between px-2">
                <Logo
                  onClick={() => {
                    (r(!1), t('dashboard'));
                  }}
                />
                <button
                  type="button"
                  className="rounded-md p-2 hover:bg-sunken"
                  aria-label={n('nav.close')}
                  onClick={() => r(!1)}
                >
                  <X size={20} />
                </button>
              </div>
              <SideNav onNavigate={() => r(!1)} />
            </div>
          </div>
        )}
        <main id="main" className="min-w-0 flex-1">
          <div className="gutter mx-auto max-w-6xl py-6 md:py-8">{e}</div>
        </main>
      </div>
    </div>
  );
}
export const MS = {
  male: {
    happy: SS,
    explain: zS,
    think: qS,
    excited: ES,
    laptop: AS,
  },
  female: {
    happy: TS,
    explain: Nh,
    think: NS,
    excited: CS,
    laptop: Nh,
  },
};
export const IS = {
  male: bS,
  female: kS,
  duo: xS,
};
export const Zg = {
  male: wS,
  female: jS,
};
export const US = {
  wave: 'excited',
  nod: 'happy',
  celebrate: 'excited',
  explain: 'explain',
  think: 'think',
  laptop: 'laptop',
};
export const BS = {
  wave: 'guide-wave',
  nod: 'guide-nod',
  celebrate: 'guide-hop',
  explain: 'guide-nod',
  think: 'guide-nod',
  laptop: 'guide-nod',
};
