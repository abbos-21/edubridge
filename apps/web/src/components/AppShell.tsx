import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BookOpen, Bell, PenLine, CalendarDays, ClipboardList, Route as RouteIcon, Wallet, ChevronDown, Columns3, FileText, Globe, GraduationCap, Landmark, LayoutDashboard, ListChecks, LogOut, Menu, MessageSquare, Settings, Sparkles, UserRound, X, Award, FolderOpen, ShieldCheck, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { useStore } from '../store/AppStore';
import { completeness } from '../lib/profile';
import { formatDate } from '../lib/format';
import { href, navigate, useRoute, type Route } from '../lib/router';
import { CompareTray, LangSwitch, ThemeToggle } from './common';
import { DemoBanner } from '../pages/Demo';
import { levelOf, useNotices } from './Notices';
import { cx } from './ui';

type Item = { key: string; page: string; param?: string; icon: ReactNode; label: [string, string]; active: (r: Route) => boolean };
type Group = { title: [string, string]; items: Item[] };

const ICON = 18;
const on = (...pages: string[]) => (r: Route) => pages.includes(r.page);
const onAssistant = (tab: string | null) => (r: Route) => r.page === 'assistant' && (r.param ?? null) === tab;

/** The signed-in layout of the original EduBridge: a sidebar in three groups. */
const GROUPS: Group[] = [
  {
    title: ['PLAN', 'REJALASHTIRISH'],
    items: [
      { key: 'dashboard', page: 'dashboard', icon: <LayoutDashboard size={ICON} />, label: ['Dashboard', 'Boshqaruv paneli'], active: on('dashboard') },
      { key: 'plans', page: 'plans', icon: <ClipboardList size={ICON} />, label: ['Application plans', 'Ariza rejalari'], active: on('plans', 'plan') },
      { key: 'calendar', page: 'calendar', icon: <CalendarDays size={ICON} />, label: ['Calendar', 'Taqvim'], active: on('calendar') },
    ],
  },
  {
    title: ['DISCOVER', 'IZLASH'],
    items: [
      { key: 'countries', page: 'countries', icon: <Globe size={ICON} />, label: ['Countries', 'Davlatlar'], active: on('countries', 'country') },
      { key: 'universities', page: 'universities', icon: <Landmark size={ICON} />, label: ['Universities', 'Universitetlar'], active: on('universities', 'uni') },
      { key: 'scholarships', page: 'scholarships', icon: <Award size={ICON} />, label: ['Scholarships', 'Grantlar'], active: on('scholarships', 'scholarship') },
      { key: 'compare', page: 'unicompare', icon: <Columns3 size={ICON} />, label: ['Compare', 'Solishtirish'], active: on('unicompare') },
      { key: 'budget', page: 'budget', icon: <Wallet size={ICON} />, label: ['Budget planner', 'Byudjet rejasi'], active: on('budget') },
    ],
  },
  {
    title: ['PREPARE', 'TAYYORLANISH'],
    items: [
      { key: 'roadmap', page: 'roadmap', icon: <RouteIcon size={ICON} />, label: ['Preparation plan', 'Tayyorgarlik rejasi'], active: on('roadmap') },
      { key: 'glossary', page: 'glossary', icon: <BookOpen size={ICON} />, label: ['Glossary', 'Lug‘at'], active: on('glossary') },
      { key: 'adviser', page: 'adviser', icon: <ListChecks size={ICON} />, label: ['Profile builder', 'Profilni kuchaytirish'], active: on('adviser') },
      { key: 'summary', page: 'summary', icon: <FileText size={ICON} />, label: ['One-page summary', 'Bir sahifalik xulosa'], active: on('summary') },
      { key: 'writing', page: 'writing', icon: <PenLine size={ICON} />, label: ['Writing tutor', 'Yozish yordamchisi'], active: on('writing') },
      { key: 'documents', page: 'documents', icon: <FolderOpen size={ICON} />, label: ['Documents', 'Hujjatlar'], active: on('documents') },
      { key: 'interview', page: 'assistant', param: 'interview', icon: <MessageSquare size={ICON} />, label: ['Interview practice', 'Suhbatga tayyorgarlik'], active: onAssistant('interview') },
      { key: 'assistant', page: 'assistant', icon: <Sparkles size={ICON} />, label: ['AI advisor', 'SI maslahatchi'], active: (r) => r.page === 'assistant' && (r.param === null || r.param === 'ask' || r.param === 'report') },
    ],
  },
];

function useOutside(ref: React.RefObject<HTMLElement | null>, close: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [ref, close, active]);
}

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <a href={href('dashboard')} onClick={onClick} aria-label="EduBridge" className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md text-fg no-underline">
      <GraduationCap size={24} className="hidden text-teal-ink dark:text-teal sm:block" aria-hidden />
      <span className="text-base font-extrabold tracking-tight text-fg sm:text-lg">EduBridge</span>
    </a>
  );
}

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { tx } = useI18n();
  const route = useRoute();
  const { me } = useAuth();
  return (
    <nav aria-label="App" className="flex flex-col gap-5">
      {GROUPS.map((g) => (
        <div key={g.title[0]}>
          <p className="eyebrow mb-1.5 px-3">{tx(g.title[0], g.title[1])}</p>
          <ul className="flex flex-col gap-0.5">
            {g.items.map((it) => {
              const active = it.active(route);
              return (
                <li key={it.key}>
                  <a
                    href={href(it.page, it.param)}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cx('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-semibold no-underline', active ? 'bg-navy-soft text-navy' : 'text-muted hover:bg-sunken hover:text-fg')}
                  >
                    {it.icon}
                    {tx(it.label[0], it.label[1])}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {!me && (
        <p className="px-3 text-[12.5px] text-muted">
          {tx('Sign in to keep your profile in your account and use reminders.', 'Profilingizni akkauntda saqlash va eslatmalardan foydalanish uchun kiring.')}{' '}
          <a href={href('signin')} onClick={onNavigate} className="font-semibold">{tx('Sign in', 'Kirish')}</a>
        </p>
      )}
    </nav>
  );
}

function Bell_() {
  const { tx, lang } = useI18n();
  const { notices, unread, markRead } = useNotices();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);
  useOutside(ref, close, open);
  const label = tx('Notifications', 'Bildirishnomalar');
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`${label} (${unread.length})`} className="relative rounded-lg p-2 text-muted hover:bg-sunken hover:text-fg">
        <Bell size={20} aria-hidden />
        {unread.length > 0 && <span className="tabular absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-bad px-1 text-[10px] font-bold text-white">{unread.length}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,380px)] rounded-xl border border-line bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-bold">{label}</p>
            {unread.length > 0 && (
              <button type="button" className="text-[13px] font-semibold text-teal-ink dark:text-teal" onClick={() => markRead(notices.map((n) => n.id))}>
                {tx('Mark all as read', 'Hammasini o‘qilgan deb belgilash')}
              </button>
            )}
          </div>
          <ul className="max-h-[60vh] overflow-y-auto">
            {notices.length === 0 && <li className="px-4 py-6 text-center text-[14px] text-muted">{tx('No reminders right now. Dates within 30 days appear here.', 'Hozircha eslatma yo‘q. 30 kun ichidagi sanalar shu yerda chiqadi.')}</li>}
            {notices.map((n) => {
              const unreadNow = unread.some((u) => u.id === n.id);
              const lv = levelOf(n.days);
              return (
                <li key={n.id} className="border-b border-line last:border-0">
                  <a href={n.link} onClick={() => { markRead([n.id]); close(); }} className="flex gap-3 px-4 py-3 text-left no-underline hover:bg-sunken">
                    <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', lv === 'urgent' ? 'bg-bad' : lv === 'soon' ? 'bg-warn' : 'bg-info', !unreadNow && 'opacity-30')} aria-hidden />
                    <span className="min-w-0">
                      <span className={cx('block text-[13.5px] text-fg', unreadNow ? 'font-bold' : 'font-semibold text-muted')}>
                        {n.days === 0 ? tx('Due today: {0}', 'Bugun: {0}', n.name) : tx('{0} days left: {1}', '{0} kun qoldi: {1}', n.days, n.name)}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] text-muted">{n.kind === 'mine' ? tx('A date you added.', 'Siz qo‘shgan sana.') : n.kind === 'task' ? tx('A task in one of your plans.', 'Rejangizdagi vazifa.') : tx('Confirmed deadline of something you saved.', 'Siz saqlagan narsaning tasdiqlangan muddati.')}</span>
                      <span className="mt-0.5 block text-[11.5px] text-faint">{formatDate(n.date, lang)}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-line px-4 py-2.5 text-[12px] text-faint">{tx('In-app list. Telegram reminders are set in Calendar.', 'Ilova ichidagi ro‘yxat. Telegram eslatmalari Taqvimda sozlanadi.')}</p>
        </div>
      )}
    </div>
  );
}

function AccountMenu() {
  const { tx } = useI18n();
  const { me, logout } = useAuth();
  const store = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);
  useOutside(ref, close, open);
  const name = store.profile?.name?.trim() ?? '';
  const initial = (name || '?').slice(0, 1).toUpperCase();
  const staff = me?.role === 'editor' || me?.role === 'admin';
  const go = (page: string, param?: string) => () => { close(); navigate(page, param); };
  const item = 'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[14px] text-fg hover:bg-sunken';
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" aria-label={tx('Account menu', 'Akkaunt menyusi')} className="flex items-center gap-2 rounded-lg p-1 hover:bg-sunken sm:pr-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-navy text-[13px] font-bold text-navy-ink">{initial}</span>
        <ChevronDown size={16} className="hidden text-muted sm:block" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-line bg-surface p-2 shadow-xl">
          <div className="px-2 py-2">
            <p className="font-bold">{name || tx('Student', 'Talaba')}</p>
            <p className="text-[12.5px] text-muted">{store.profile ? tx('Profile {0}% complete', 'Profil {0}% to‘ldirilgan', completeness(store.profile)) : ''}</p>
          </div>
          <button role="menuitem" type="button" className={item} onClick={go('onboarding', 'edit')}><UserRound size={16} aria-hidden />{tx('My profile', 'Mening profilim')}</button>
          <button role="menuitem" type="button" className={item} onClick={go('settings')}><Settings size={16} aria-hidden />{tx('Settings & data', 'Sozlamalar va ma’lumotlar')}</button>
          {staff && <button role="menuitem" type="button" className={item} onClick={go('admin')}><ShieldCheck size={16} aria-hidden />Admin</button>}
          {store.demo && <button role="menuitem" type="button" className={item} onClick={go('demo')}><Sparkles size={16} aria-hidden />{tx('Switch demo student', 'Boshqa namoyish talabasi')}</button>}
          {store.demo ? (
            <button role="menuitem" type="button" className={cx(item, '!text-bad hover:!bg-bad-soft')} onClick={() => { close(); store.exitDemo(); navigate('home'); }}><LogOut size={16} aria-hidden />{tx('Exit demo', 'Namoyishdan chiqish')}</button>
          ) : me ? (
            <button role="menuitem" type="button" className={cx(item, '!text-bad hover:!bg-bad-soft')} onClick={() => { close(); void logout().then(() => navigate('home')); }}><LogOut size={16} aria-hidden />{tx('Sign out', 'Chiqish')}</button>
          ) : (
            <button
              role="menuitem"
              type="button"
              className={cx(item, '!text-bad hover:!bg-bad-soft')}
              onClick={() => {
                close();
                if (window.confirm(tx('Delete your profile and saved items from this browser?', 'Profilingiz va saqlanganlar shu brauzerdan o‘chirilsinmi?'))) {
                  store.resetAll();
                  navigate('home');
                }
              }}
            >
              <Trash2 size={16} aria-hidden />
              {tx('Clear data on this device', 'Shu qurilmadagi ma’lumotlarni o‘chirish')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Shown to a student who has not signed in: the profile lives only in this browser. */
function LocalBanner() {
  const { tx } = useI18n();
  const { me, offline } = useAuth();
  const { demo } = useStore();
  if (me || demo || offline) return null;
  return (
    <div role="status" className="gutter flex items-center justify-center gap-2 bg-navy-soft py-1.5 text-center text-[12.5px] font-semibold text-navy">
      <Sparkles size={14} aria-hidden />
      <span>{tx('Local profile — saved only in this browser. This is not a protected account.', 'Mahalliy profil — faqat shu brauzerda saqlanadi. Bu himoyalangan akkaunt emas.')}</span>
      <a href={href('signin')} className="shrink-0 whitespace-nowrap underline">{tx('Sign in', 'Kirish')}</a>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t, tx } = useI18n();
  const [menu, setMenu] = useState(false);
  return (
    <>
      <div className="flex min-h-screen flex-col">
        <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
          {t('nav.skip')}
        </a>
        <LocalBanner />
        <DemoBanner />
        <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
          <div className="gutter flex h-14 items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button type="button" className="grid h-10 w-10 place-items-center rounded-md hover:bg-sunken lg:hidden" aria-label={t('nav.menu')} aria-expanded={menu} aria-controls="app-drawer" onClick={() => setMenu(true)}>
                <Menu size={20} aria-hidden />
              </button>
              <Brand />
            </div>
            <div className="flex items-center gap-1.5">
              <LangSwitch />
              <span className="hidden sm:block"><ThemeToggle /></span>
              <Bell_ />
              <AccountMenu />
            </div>
          </div>
        </header>
        <div className="flex flex-1">
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-line bg-surface px-3 py-5 lg:block">
            <SideNav />
          </aside>
          {menu && (
            <div className="fixed inset-0 z-50 bg-fg/40 lg:hidden" onMouseDown={(e) => e.target === e.currentTarget && setMenu(false)}>
              <div id="app-drawer" className="h-full w-72 max-w-[85vw] overflow-y-auto bg-surface px-3 pb-6 pt-4">
                <div className="mb-4 flex items-center justify-between px-2">
                  <Brand onClick={() => setMenu(false)} />
                  <button type="button" className="grid h-10 w-10 place-items-center rounded-md hover:bg-sunken" aria-label={t('nav.close')} onClick={() => setMenu(false)}>
                    <X size={20} aria-hidden />
                  </button>
                </div>
                <SideNav onNavigate={() => setMenu(false)} />
                <div className="mt-4 border-t border-line px-3 pt-3"><ThemeToggle /></div>
                <p className="mt-4 px-3 text-[12.5px] text-muted"><a href={href('info', 'about')}>{tx('About', 'Loyiha haqida')}</a> · <a href={href('info', 'privacy')}>{tx('Privacy', 'Maxfiylik')}</a></p>
              </div>
            </div>
          )}
          <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none">
            <div className="gutter mx-auto max-w-6xl py-6 pb-24 md:py-8 md:pb-24">{children}</div>
          </main>
        </div>
        <CompareTray />
      </div>
    </>
  );
}
