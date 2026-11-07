import { useEffect, useState, type ReactNode } from 'react';
import { ExternalLink, GitCompareArrows, Moon, Sun, SunMoon, X } from 'lucide-react';
import { LANGS, TIER_INFO, type Lang, type Tier, type University } from '@edubridge/shared';
import { useI18n } from '../i18n/I18nProvider';
import { useStore } from '../store/AppStore';
import { useCatalogState } from '../data/CatalogProvider';
import { formatDate, hostOf, isHttp } from '../lib/format';
import { href } from '../lib/router';
import { Badge, Button, Card, Notice, cx } from './ui';

/** "Not confirmed on an official page": a missing value is never shown as zero, free or empty. */
export function NotConfirmed() {
  const { tx } = useI18n();
  return <span className="text-muted italic">{tx('Not confirmed on an official page', 'Rasmiy sahifada tasdiqlanmagan')}</span>;
}

export function ExternalLinkText({ url, label }: { url: string; label?: string }) {
  if (!isHttp(url)) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all">
      {label ?? hostOf(url)}
      <ExternalLink size={14} aria-hidden />
    </a>
  );
}

/** Every official fact shows where it came from and when it was checked. */
export function SourceNote({ urls, checked }: { urls: Array<string | null | undefined>; checked?: string | null }) {
  const { tx, lang } = useI18n();
  const list = [...new Set(urls.filter(isHttp))];
  if (!list.length && !checked) return null;
  return (
    <p className="mt-1 text-xs text-muted">
      {list.length > 0 && (
        <>
          {tx('Source', 'Manba')}:{' '}
          {list.map((u, i) => (
            <span key={u}>
              {i > 0 && ', '}
              <ExternalLinkText url={u} />
            </span>
          ))}
        </>
      )}
      {checked && (
        <>
          {list.length > 0 && ' · '}
          {tx('Last checked: {0}', 'Oxirgi tekshiruv: {0}', formatDate(checked, lang) ?? checked)}
        </>
      )}
    </p>
  );
}

const TIER_TONE: Record<Tier, 'info' | 'brand' | 'ok'> = { selective: 'info', middle: 'brand', accessible: 'ok' };

export function TierBadge({ tier }: { tier: Tier }) {
  const { pick } = useI18n();
  return <Badge tone={TIER_TONE[tier]}>{pick(TIER_INFO[tier].name)}</Badge>;
}

export function QsLine({ u }: { u: University }) {
  const { tx } = useI18n();
  const v = u.ranking?.value;
  if (v == null) return <span className="text-muted">{tx('position not confirmed', 'o‘rni tasdiqlanmagan')}</span>;
  return <span>QS 2027 {v}</span>;
}

export function CompareButton({ id, compact }: { id: string; compact?: boolean }) {
  const { tx } = useI18n();
  const { compare, toggleCompare } = useStore();
  const [full, setFull] = useState(false);
  const inList = compare.includes(id);
  useEffect(() => {
    if (!full) return;
    const t = setTimeout(() => setFull(false), 2500);
    return () => clearTimeout(t);
  }, [full]);
  return (
    <span className="inline-flex flex-col">
      <Button
        size="sm"
        variant={inList ? 'primary' : 'secondary'}
        aria-pressed={inList}
        onClick={() => {
          if (toggleCompare(id) === 'full') setFull(true);
        }}
      >
        <GitCompareArrows size={16} aria-hidden />
        {compact ? null : inList ? tx('In comparison', 'Taqqoslashda') : tx('Compare', 'Taqqoslash')}
      </Button>
      {full && (
        <span role="status" className="mt-1 text-xs text-warn">
          {tx('You can compare up to 3', 'Ko‘pi bilan 3 tasini taqqoslash mumkin')}
        </span>
      )}
    </span>
  );
}

export function UniCard({ u }: { u: University }) {
  const { tx, t } = useI18n();
  const levels = (['bachelor', 'master'] as const).filter((l) => u.levels[l] && (u.levels[l]!.open === 'yes' || u.levels[l]!.open === 'integrated'));
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <TierBadge tier={u.tier} />
        <Badge>{u.type === 'private' ? tx('private', 'xususiy') : tx('public', 'davlat')}</Badge>
      </div>
      <div>
        <h3 className="text-base font-extrabold leading-snug">
          <a href={href('uni', u.id)} className="no-underline hover:underline text-fg">{u.name}</a>
        </h3>
        <p className="text-sm text-muted">{u.city}</p>
      </div>
      <p className="text-sm"><QsLine u={u} /></p>
      <p className="text-sm text-muted">
        {levels.length ? levels.map((l) => t(l === 'bachelor' ? 'lvl.bachelor' : 'lvl.master')).join(' · ') : <NotConfirmed />}
      </p>
      <div className="mt-auto flex flex-wrap gap-2">
        <a href={href('uni', u.id)} className="inline-flex min-h-[40px] items-center rounded-xl bg-brand px-3 text-sm font-semibold text-brand-fg no-underline">
          {tx('View details', 'Batafsil')}
        </a>
        <CompareButton id={u.id} />
      </div>
    </Card>
  );
}

export function CompareTray() {
  const { tx } = useI18n();
  const { compare, clearCompare, toggleCompare } = useStore();
  const { state } = useCatalogState();
  if (!compare.length || state.status !== 'ready') return null;
  const names = compare.map((id) => ({ id, name: state.data.universities.find((u) => u.id === id)?.short ?? id }));
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 p-3 backdrop-blur" role="region" aria-label={tx('Compare', 'Taqqoslash')}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">{tx('{0} of 3 selected to compare', '3 tadan {0} tasi tanlandi', compare.length)}</span>
        {names.map((n) => (
          <button key={n.id} type="button" onClick={() => toggleCompare(n.id)} className="inline-flex min-h-[40px] items-center gap-1 rounded-full bg-sunken px-3 text-sm" aria-label={`${tx('Remove', 'Olib tashlash')} ${n.name}`}>
            {n.name}
            <X size={14} aria-hidden />
          </button>
        ))}
        <span className="ml-auto flex gap-2">
          <Button size="sm" onClick={clearCompare}>{tx('Clear', 'Tozalash')}</Button>
          <a
            href={compare.length >= 2 ? href('unicompare', compare.join(',')) : undefined}
            aria-disabled={compare.length < 2}
            className={cx('inline-flex min-h-[40px] items-center rounded-xl bg-brand px-3 text-sm font-semibold text-brand-fg no-underline', compare.length < 2 && 'pointer-events-none opacity-50')}
          >
            {compare.length < 2 ? tx('Pick at least 2', 'Kamida 2 tasini tanlang') : tx('Compare now', 'Hozir taqqoslash')}
          </a>
        </span>
      </div>
    </div>
  );
}

export const LANG_LABEL: Record<Lang, string> = { uz: 'UZ', ru: 'RU', en: 'EN' };

export function LangSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <div role="group" aria-label="Language" className="inline-flex rounded-xl border border-line bg-sunken p-0.5">
      {LANGS.map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={cx('min-h-[40px] min-w-[40px] rounded-lg px-2 text-sm font-bold', lang === l ? 'bg-surface text-fg shadow-sm' : 'text-muted')}>
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useStore();
  const { tx } = useI18n();
  const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : SunMoon;
  return (
    <Button variant="ghost" size="sm" aria-label={tx('Theme', 'Mavzu') + `: ${theme}`} onClick={() => setTheme(next)}>
      <Icon size={18} aria-hidden />
    </Button>
  );
}

/** Shows loading / error, and a clear banner when the saved snapshot is used instead of live data. */
export function CatalogGate({ children }: { children: ReactNode }) {
  const { state, reload } = useCatalogState();
  const { tx, lang } = useI18n();
  if (state.status === 'loading') {
    return <p role="status" className="py-10 text-center text-muted">{tx('Loading…', 'Yuklanmoqda…')}</p>;
  }
  if (state.status === 'error') {
    return (
      <div className="py-10">
        <Notice tone="warn" title={tx('The catalogue could not be loaded', 'Katalogni yuklab bo‘lmadi')}>
          <Button className="mt-2" onClick={reload}>{tx('Try again', 'Qayta urinish')}</Button>
        </Notice>
      </div>
    );
  }
  return (
    <>
      {state.source === 'snapshot' && (
        <div className="mb-4">
          <Notice tone="warn">
            {tx(
              'Showing a saved copy of the catalogue from {0}. Live data could not be loaded.',
              'Katalogning {0} dagi saqlangan nusxasi ko‘rsatilmoqda. Jonli ma’lumotni yuklab bo‘lmadi.',
              formatDate(state.snapshotDate, lang) ?? state.snapshotDate ?? '',
            )}
          </Notice>
        </div>
      )}
      {children}
    </>
  );
}
