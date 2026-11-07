import { TIERS, TIER_INFO, type Tier } from '@edubridge/shared';
import { useI18n } from '../i18n/I18nProvider';
import { useCatalog } from '../data/CatalogProvider';
import { href } from '../lib/router';
import { formatDate } from '../lib/format';
import { Card, Notice, Section } from '../components/ui';
import { ExternalLinkText, NotConfirmed, TierBadge, UniCard } from '../components/common';
import { GrantCard } from './Scholarships';

export function Countries() {
  const { tx, pick } = useI18n();
  const { countries, universities } = useCatalog();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{tx('Countries', 'Davlatlar')}</h1>
      <p className="text-muted">
        {tx('Explore countries', 'Davlatlarni ko‘rish')} — {tx('10 universities in three groups per country.', 'har bir davlatda uchta guruhdagi 10 ta universitet.')}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {countries.map((c) => {
          const unis = universities.filter((u) => u.country === c.code);
          return (
            <Card key={c.code} className="flex flex-col gap-2">
              <h2 className="text-xl font-extrabold">{pick(c.name)}</h2>
              <p className="text-sm text-muted">{pick(c.tagline)}</p>
              <p className="text-sm">
                {tx('{0} universities', '{0} ta universitet', unis.length)} ·{' '}
                {TIERS.map((t) => unis.filter((u) => u.tier === t).length).join(' / ')}
              </p>
              <a href={href('country', c.code)} className="mt-auto inline-flex min-h-[40px] items-center font-semibold">
                {tx('Open country page →', 'Davlat sahifasini ochish →')}
              </a>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function CountryPage({ code }: { code: string | null }) {
  const { tx, pick, lang, t } = useI18n();
  const { countries, universities, grants } = useCatalog();
  const country = countries.find((c) => c.code === (code ?? '').toUpperCase());
  if (!country) {
    return (
      <div className="space-y-3">
        <p>{tx('Country not found.', 'Davlat topilmadi.')}</p>
        <a href={href('countries')}>{tx('All countries', 'Barcha davlatlar')}</a>
      </div>
    );
  }
  const unis = universities.filter((u) => u.country === country.code).sort((a, b) => a.order - b.order);
  const countryGrants = grants.filter((g) => g.kind === 'national' && g.country === country.code);
  const dates = unis.map((u) => u.lastChecked).filter((d): d is string => !!d).sort();
  const checked = dates[dates.length - 1];
  const g = country.guidance;

  return (
    <div className="space-y-6">
      <div>
        <a href={href('countries')} className="text-sm">← {tx('All countries', 'Barcha davlatlar')}</a>
        <p className="eyebrow mt-3">{tx('Country guide', 'Davlat yo‘riqnomasi')}</p>
        <h1 className="text-3xl font-extrabold">{pick(country.name)}</h1>
        <p className="mt-1 text-muted">{pick(country.tagline)}</p>
      </div>

      {country.selection && (
        <Card>
          <h2 className="font-extrabold">{tx('How these 10 were chosen', 'Bu 10 tasi qanday tanlangan')}</h2>
          <p className="mt-1 text-sm">{pick(country.selection)}</p>
          <p className="mt-2 text-xs text-muted">
            {tx('Positions shown are the QS World University Rankings 2027 only, each with the page it was taken from. QS, THE, subject rankings and QS Stars are different measures and are not mixed here.', 'Faqat QS World University Rankings 2027 o‘rinlari ko‘rsatilgan, har biri olingan sahifasi bilan. QS, THE, fan reytinglari va QS Stars turli ko‘rsatkichlar bo‘lib, bu yerda aralashtirilmaydi.')}
          </p>
        </Card>
      )}

      {TIERS.map((tier: Tier) => {
        const list = unis.filter((u) => u.tier === tier);
        return (
          <Section key={tier} title={pick(TIER_INFO[tier].name)} id={`tier-${tier}`}>
            <p className="mb-3 text-sm text-muted">{pick(TIER_INFO[tier].who)}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((u) => <UniCard key={u.id} u={u} />)}
            </div>
          </Section>
        );
      })}
      <p className="text-xs text-muted">
        <TierBadge tier="middle" />{' '}
        {tx('Groups are EduBridge guidance, not an official classification. Meeting a minimum is not a guarantee.', 'Guruhlar EduBridge maslahati, rasmiy tasnif emas. Minimumga yetish kafolat emas.')}
      </p>

      {g && (
        <Section title={tx('Preparation advice for this country', 'Ushbu davlat uchun tayyorgarlik maslahati')} id="advice">
          <Notice>{tx('Preparation advice — not an official minimum', 'Tayyorgarlik maslahati — rasmiy minimum emas')}</Notice>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {g.bachelor && <Card><h3 className="font-extrabold">{t('lvl.bachelor')}</h3><p className="mt-1 text-sm">{pick(g.bachelor)}</p></Card>}
            {g.master && <Card><h3 className="font-extrabold">{t('lvl.master')}</h3><p className="mt-1 text-sm">{pick(g.master)}</p></Card>}
          </div>
          {g.notes && g.notes.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {g.notes.map((n, i) => <li key={i}>{pick(n)}</li>)}
            </ul>
          )}
          {g.sources && g.sources.length > 0 && (
            <p className="mt-2 text-xs text-muted">
              {tx('Source', 'Manba')}: {g.sources.map((s, i) => <span key={s}>{i > 0 && ', '}<ExternalLinkText url={s} /></span>)}
            </p>
          )}
        </Section>
      )}

      <Section title={tx('Grants for {0} study', '{0}da o‘qish uchun grantlar', pick(country.name))} id="grants">
        {countryGrants.length ? (
          <div className="grid gap-3 md:grid-cols-2">{countryGrants.map((gr) => <GrantCard key={gr.id} g={gr} />)}</div>
        ) : (
          <p className="text-sm"><NotConfirmed /></p>
        )}
      </Section>

      {checked && (
        <p className="text-xs text-muted">
          {tx('Information checked on official pages on {0}. Admission rules change every year — always confirm on the university’s page.', 'Ma’lumot rasmiy sahifalarda {0} da tekshirilgan. Qabul qoidalari har yili o‘zgaradi — doim universitet sahifasida tasdiqlang.', formatDate(checked, lang) ?? checked)}
        </p>
      )}
    </div>
  );
}
