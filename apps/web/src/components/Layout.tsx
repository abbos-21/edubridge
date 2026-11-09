import { useState, type ReactNode } from 'react';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { href, useRoute } from '../lib/router';
import { CompareTray, LangSwitch, ThemeToggle } from './common';
import { buttonClass, cx } from './ui';

type NavKey = 'nav.countries' | 'nav.universities' | 'nav.scholarships' | 'nav.compare' | 'nav.assistant' | 'nav.adviser';
const NAV: Array<{ page: string; key: NavKey; match: string[]; mobileOnly?: boolean }> = [
  { page: 'countries', key: 'nav.countries', match: ['countries', 'country'] },
  { page: 'universities', key: 'nav.universities', match: ['universities', 'uni'] },
  { page: 'scholarships', key: 'nav.scholarships', match: ['scholarships', 'scholarship'] },
  { page: 'adviser', key: 'nav.adviser', match: ['adviser', 'onboarding', 'demo'] },
  { page: 'assistant', key: 'nav.assistant', match: ['assistant'] },
  { page: 'unicompare', key: 'nav.compare', match: ['unicompare'], mobileOnly: true },
];

/** The original EduBridge logo: a graduation cap and the name. */
function BrandLink() {
  return (
    <a href={href('home')} aria-label="EduBridge" className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md text-fg no-underline">
      <GraduationCap size={24} className="hidden text-teal-ink dark:text-teal sm:block" aria-hidden />
      <span className="text-base font-extrabold tracking-tight text-fg sm:text-lg">EduBridge</span>
    </a>
  );
}

export function Layout({ children, banner }: { children: ReactNode; banner?: ReactNode }) {
  const { t, tx } = useI18n();
  const route = useRoute();
  const { me, offline } = useAuth();
  const staff = me?.role === 'editor' || me?.role === 'admin';
  const guest = !me && !offline;
  const [open, setOpen] = useState(false);
  const home = route.page === 'home';
  const accountLabel = me || offline ? tx('Settings', 'Sozlamalar') : t('nav.signin');
  const accountPage = me || offline ? 'settings' : 'signin';

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        {t('nav.skip')}
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="gutter mx-auto flex h-16 max-w-6xl items-center justify-between gap-4">
          <BrandLink />
          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {NAV.filter((n) => !n.mobileOnly).map((n) => {
              const active = n.match.includes(route.page);
              return (
                <a key={n.page} href={href(n.page)} aria-current={active ? 'page' : undefined} className={cx('rounded-md px-3 py-2 text-[14px] font-semibold no-underline', active ? 'text-fg' : 'text-muted hover:text-fg')}>
                  {t(n.key)}
                </a>
              );
            })}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <LangSwitch />
            <ThemeToggle />
            {staff && <a href={href('admin')} className={buttonClass('ghost')}>Admin</a>}
            <a href={href(accountPage)} className={buttonClass('ghost')}>{accountLabel}</a>
            {guest && <a href={href('onboarding')} className={cx(buttonClass('primary'), '!text-navy-ink')}>{tx('Get Started', 'Boshlash')}</a>}
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <LangSwitch />
            <button type="button" className="grid h-10 w-10 place-items-center rounded-md text-fg hover:bg-sunken" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? t('nav.close') : t('nav.menu')} onClick={() => setOpen((o) => !o)}>
              {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
            </button>
          </div>
        </div>
        {open && (
          <nav id="mobile-nav" aria-label="Main" className="gutter border-t border-line py-2 lg:hidden">
            {NAV.map((n) => (
              <a key={n.page} href={href(n.page)} onClick={() => setOpen(false)} className="flex min-h-[44px] items-center text-base font-semibold text-fg no-underline">
                {t(n.key)}
              </a>
            ))}
            {staff && <a href={href('admin')} onClick={() => setOpen(false)} className="flex min-h-[44px] items-center text-base font-semibold text-fg no-underline">Admin</a>}
            <a href={href(accountPage)} onClick={() => setOpen(false)} className="flex min-h-[44px] items-center text-base font-semibold text-fg no-underline">{accountLabel}</a>
            {guest && <a href={href('onboarding')} onClick={() => setOpen(false)} className="flex min-h-[44px] items-center text-base font-semibold text-fg no-underline">{tx('Get Started', 'Boshlash')}</a>}
            <div className="flex items-center gap-2 border-t border-line py-2"><ThemeToggle /></div>
          </nav>
        )}
      </header>
      {banner}

      {home ? (
        <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
      ) : (
        <main id="main" tabIndex={-1} className="gutter mx-auto w-full max-w-6xl flex-1 py-8 pb-24 outline-none">{children}</main>
      )}

      <footer className="border-t border-line bg-surface">
        <div className="gutter mx-auto flex max-w-6xl flex-col gap-6 py-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <BrandLink />
            <p className="mt-2 text-[13.5px] text-muted">{tx('A prototype guidance tool for students from Uzbekistan. Always confirm requirements on official websites.', 'O‘zbekistonlik talabalar uchun prototip yo‘riqnoma vositasi. Talablarni doim rasmiy saytlarda tasdiqlang.')}</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-2 text-[14px] sm:grid-cols-2">
            <a href={href('info', 'about')} className="text-muted no-underline hover:text-fg">{tx('About', 'Loyiha haqida')}</a>
            <a href={href('info', 'sources')} className="text-muted no-underline hover:text-fg">{tx('Sources', 'Manbalar')}</a>
            <a href={href('info', 'disclaimer')} className="text-muted no-underline hover:text-fg">{tx('Disclaimer', 'Ogohlantirish')}</a>
            <a href={href('info', 'privacy')} className="text-muted no-underline hover:text-fg">{tx('Privacy', 'Maxfiylik')}</a>
          </nav>
        </div>
      </footer>
      <CompareTray />
    </div>
  );
}
