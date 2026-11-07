import { ArrowRight, BadgeCheck, GraduationCap, Landmark, Scale } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useCatalog } from '../data/CatalogProvider';
import { href } from '../lib/router';
import { formatDate } from '../lib/format';
import { Card, Notice } from '../components/ui';
import { useStore } from '../store/AppStore';

/** Counters are computed from the catalogue data — never hard-coded. */
export function catalogueCounters(data: { universities: Array<{ lastChecked?: string | null }>; grants: Array<{ kind: string }>; countries: unknown[] }) {
  const dates = data.universities.map((u) => u.lastChecked).filter((d): d is string => !!d).sort();
  return {
    universities: data.universities.length,
    countries: data.countries.length,
    grants: data.grants.filter((g) => g.kind === 'national').length,
    lastChecked: dates[dates.length - 1] ?? null,
  };
}

export function Home() {
  const { tx, lang, pick } = useI18n();
  const data = useCatalog();
  const c = catalogueCounters(data);
  const { profile } = useStore();

  const stats = [
    { n: c.countries, label: tx('Countries', 'Davlatlar') },
    { n: c.universities, label: tx('Universities', 'Universitetlar') },
    { n: c.grants, label: tx('National grants', 'Milliy grantlar') },
  ];

  return (
    <div className="space-y-10">
      <section className="rounded-card border border-line bg-brand-soft p-6 sm:p-10">
        <p className="eyebrow">{tx('Study abroad navigator', 'Chet elda o‘qish navigatori')}</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
          {tx('Choose universities and grants with facts you can check.', 'Tekshirib ko‘rish mumkin bo‘lgan faktlar asosida universitet va grant tanlang.')}
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          {tx(
            'Five countries, ten universities each, with bachelor’s and master’s details, QS 2027 positions and the main grants for students from Uzbekistan.',
            'Beshta davlat, har birida o‘nta universitet: bakalavr va magistratura ma’lumotlari, QS 2027 o‘rinlari va O‘zbekiston talabalari uchun asosiy grantlar.',
          )}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={href('countries')} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-brand-fg no-underline">
            {tx('Explore countries', 'Davlatlarni ko‘rish')} <ArrowRight size={18} aria-hidden />
          </a>
          <a href={href('universities')} className="inline-flex min-h-[44px] items-center rounded-xl border border-line bg-surface px-5 font-semibold text-fg no-underline">
            {tx('Search universities', 'Universitet qidirish')}
          </a>
          <a href={profile ? href('adviser') : href('onboarding')} className="inline-flex min-h-[44px] items-center rounded-xl border border-line bg-surface px-5 font-semibold text-fg no-underline">
            {profile ? tx('Profile builder', 'Profil quruvchisi') : tx('Build my profile', 'Profilimni yaratish')}
          </a>
        </div>
      </section>

      <section aria-label={tx('In numbers', 'Raqamlarda')} className="grid gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="text-center">
            <p className="text-3xl font-extrabold text-brand">{s.n}</p>
            <p className="text-sm text-muted">{s.label}</p>
          </Card>
        ))}
        <Card className="text-center">
          <BadgeCheck className="mx-auto text-brand" aria-hidden />
          <p className="mt-1 text-sm font-semibold">{tx('Every fact sourced and dated', 'Har bir fakt manbali va sanali')}</p>
          {c.lastChecked && <p className="text-xs text-muted">{tx('Last checked: {0}', 'Oxirgi tekshiruv: {0}', formatDate(c.lastChecked, lang) ?? c.lastChecked)}</p>}
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-extrabold">{tx('Countries', 'Davlatlar')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {data.countries.map((co) => (
            <a key={co.code} href={href('country', co.code)} className="rounded-card border border-line bg-surface p-4 text-fg no-underline hover:border-brand">
              <p className="text-lg font-extrabold">{pick(co.name)}</p>
              <p className="mt-1 text-sm text-muted">{pick(co.tagline)}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { icon: Landmark, t: tx('Official sources only', 'Faqat rasmiy manbalar'), d: tx('Facts come from official university, government or programme pages. Anything not found stays empty and is marked “not confirmed”.', 'Faktlar rasmiy universitet, hukumat yoki dastur sahifalaridan olinadi. Topilmagan narsa bo‘sh qoladi va “tasdiqlanmagan” deb belgilanadi.') },
          { icon: Scale, t: tx('No admission odds', 'Qabul ehtimoli yo‘q'), d: tx('EduBridge never shows an admission or scholarship probability. Meeting a minimum is not a guarantee.', 'EduBridge qabul yoki grant ehtimolini hech qachon ko‘rsatmaydi. Minimumga yetish kafolat emas.') },
          { icon: GraduationCap, t: tx('Groups, not rankings', 'Guruhlar, reyting emas'), d: tx('Universities are placed in three guidance groups. They are EduBridge advice, not an official classification.', 'Universitetlar uchta yo‘riqnoma guruhiga ajratilgan. Bu EduBridge maslahati, rasmiy tasnif emas.') },
        ].map((x) => (
          <Card key={x.t}>
            <x.icon className="text-brand" aria-hidden />
            <h3 className="mt-2 font-extrabold">{x.t}</h3>
            <p className="mt-1 text-sm text-muted">{x.d}</p>
          </Card>
        ))}
      </section>

      <Notice>
        {tx('You apply directly with the university. EduBridge never asks for your application account password — don’t share it with anyone.', 'Siz to‘g‘ridan-to‘g‘ri universitetga ariza topshirasiz. EduBridge ariza akkauntingiz parolini hech qachon so‘ramaydi — uni hech kimga bermang.')}
      </Notice>
    </div>
  );
}
