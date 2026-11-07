import { useState, type ReactNode } from 'react';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { href, useRoute } from '../lib/router';
import { CompareTray, LangSwitch, ThemeToggle } from './common';
import { Button, cx } from './ui';

const NAV: Array<{ page: string; key: 'nav.countries' | 'nav.universities' | 'nav.scholarships' | 'nav.compare' | 'nav.assistant' | 'nav.adviser'; match: string[] }> = [
  { page: 'countries', key: 'nav.countries', match: ['countries', 'country'] },
  { page: 'universities', key: 'nav.universities', match: ['universities', 'uni'] },
  { page: 'scholarships', key: 'nav.scholarships', match: ['scholarships', 'scholarship'] },
  { page: 'unicompare', key: 'nav.compare', match: ['unicompare'] },
  { page: 'assistant', key: 'nav.assistant', match: ['assistant'] },
  { page: 'adviser', key: 'nav.adviser', match: ['adviser', 'onboarding', 'demo'] },
];

export function Layout({ children, banner }: { children: ReactNode; banner?: ReactNode }) {
  const { t, tx } = useI18n();
  const route = useRoute();
  const { me, offline } = useAuth();
  const accountLink = me
    ? { page: 'settings', label: tx('Settings', 'Sozlamalar') }
    : offline
      ? { page: 'settings', label: tx('Settings', 'Sozlamalar') }
      : { page: 'signin', label: t('nav.signin') };
  const staff = me?.role === 'editor' || me?.role === 'admin';
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        {t('nav.skip')}
      </a>
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
          <a href={href('home')} className="flex shrink-0 items-center gap-2 whitespace-nowrap text-base font-extrabold text-fg no-underline sm:text-lg">
            <GraduationCap size={24} className="hidden text-brand sm:block" aria-hidden />
            EduBridge
          </a>
          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <a key={n.page} href={href(n.page)} aria-current={n.match.includes(route.page) ? 'page' : undefined} className={cx('inline-flex min-h-[40px] items-center rounded-lg px-3 text-sm font-semibold no-underline', n.match.includes(route.page) ? 'bg-brand-soft text-brand' : 'text-fg hover:bg-sunken')}>
                {t(n.key)}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {staff && <a href={href('admin')} className="hidden min-h-[40px] items-center rounded-lg px-3 text-sm font-semibold text-fg no-underline hover:bg-sunken lg:inline-flex">Admin</a>}
            <a href={href(accountLink.page)} className="hidden min-h-[40px] items-center rounded-lg px-3 text-sm font-semibold text-fg no-underline hover:bg-sunken lg:inline-flex">{accountLink.label}</a>
            <LangSwitch />
            <ThemeToggle />
            <Button variant="ghost" size="sm" className="lg:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? t('nav.close') : t('nav.menu')} onClick={() => setOpen((o) => !o)}>
              {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
            </Button>
          </div>
        </div>
        {open && (
          <nav id="mobile-nav" aria-label="Main" className="border-t border-line px-4 py-2 lg:hidden">
            {NAV.map((n) => (
              <a key={n.page} href={href(n.page)} onClick={() => setOpen(false)} className="flex min-h-[44px] items-center text-base font-semibold text-fg no-underline">
                {t(n.key)}
              </a>
            ))}
            {staff && <a href={href('admin')} onClick={() => setOpen(false)} className="flex min-h-[44px] items-center text-base font-semibold text-fg no-underline">Admin</a>}
            <a href={href(accountLink.page)} onClick={() => setOpen(false)} className="flex min-h-[44px] items-center text-base font-semibold text-fg no-underline">{accountLink.label}</a>
          </nav>
        )}
      </header>
      {banner}

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 outline-none">
        {children}
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 text-sm text-muted">
          <p>{tx('A prototype guidance tool for students from Uzbekistan. Always confirm requirements on official websites.', 'O‘zbekistonlik talabalar uchun prototip yo‘riqnoma vositasi. Talablarni doim rasmiy saytlarda tasdiqlang.')}</p>
          <p className="flex flex-wrap gap-x-4">
            <a href={href('info', 'about')}>{tx('About', 'Loyiha haqida')}</a>
            <a href={href('info', 'sources')}>{tx('Sources', 'Manbalar')}</a>
            <a href={href('info', 'disclaimer')}>{tx('Disclaimer', 'Ogohlantirish')}</a>
            <a href={href('info', 'privacy')}>{tx('Privacy', 'Maxfiylik')}</a>
          </p>
        </div>
      </footer>
      <CompareTray />
    </div>
  );
}
