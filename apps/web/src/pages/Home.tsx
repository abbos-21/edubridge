import { ArrowRight, BadgeCheck, CalendarClock, CircleCheck, CircleHelp, CircleX, ClipboardList, Clock3, FileStack, FlaskConical, GraduationCap, Layers, PenLine, Scale, Search, SearchX, Wallet, type LucideIcon } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useCatalog } from '../data/CatalogProvider';
import { href } from '../lib/router';
import { formatDate } from '../lib/format';
import { Badge, buttonClass, cx } from '../components/ui';
import { useStore } from '../store/AppStore';
import copy from './home-copy.json';
import mascot from '../assets/mascot.webp';

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

/** The three-language texts of the landing page, written for the first EduBridge app (by index). */
const COPY = copy as unknown as Array<{ en: string; uz: string; ru: string }>;

const Icon = ({ i: I, size = 16 }: { i: LucideIcon; size?: number }) => <I size={size} aria-hidden />;

export function Home() {
  const { tx, lang, pick } = useI18n();
  const data = useCatalog();
  const c = catalogueCounters(data);
  const { profile } = useStore();
  const k = (i: number) => COPY[i]![lang];
  const startHref = profile ? href('adviser') : href('onboarding');

  const problems: Array<[LucideIcon, number]> = [[Layers, 32], [CalendarClock, 34], [SearchX, 36], [Wallet, 38], [FileStack, 40]];
  const features: Array<{ icon: LucideIcon; title: string; text: string }> = [
    { icon: Search, title: tx('Search and compare universities', 'Universitetlarni qidirish va taqqoslash'), text: tx('Filter the universities by group, subject and level, and compare up to three side by side.', 'Universitetlarni guruh, yo‘nalish va daraja bo‘yicha saralang va uchtasigacha yonma-yon taqqoslang.') },
    { icon: GraduationCap, title: k(46), text: k(47) },
    { icon: CalendarClock, title: k(48), text: k(49) },
    { icon: ClipboardList, title: tx('Profile check and activity plan', 'Profil tekshiruvi va faoliyat rejasi'), text: tx('See where your profile is below typical levels for each group, and plan activities month by month.', 'Profilingiz har bir guruh uchun odatiy darajadan qayerda past ekanini ko‘ring va faoliyatni oyma-oy rejalashtiring.') },
    { icon: PenLine, title: k(52), text: k(53) },
    { icon: Scale, title: tx('Reminders and calendar', 'Eslatmalar va kalendar'), text: tx('Telegram reminders and a calendar file for confirmed deadlines and your own dates.', 'Tasdiqlangan muddatlar va o‘zingizning sanalaringiz uchun Telegram eslatmalari va kalendar fayli.') },
  ];
  const steps: Array<[number, number]> = [[59, 60], [62, 63], [65, 66], [68, 69]];

  return (
    <div>
      {/* hero */}
      <section className="border-b border-line bg-surface">
        <div className="gutter mx-auto grid max-w-6xl items-center gap-10 py-12 md:py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal-soft px-3 py-1 text-[12.5px] font-bold text-teal-ink">
              <Icon i={BadgeCheck} />
              {k(0)}
            </p>
            <h1 className="text-[34px] font-extrabold leading-[1.08] md:text-[48px]">{k(1)}</h1>
            <p className="mt-4 max-w-xl text-[17px] text-muted">{k(2)}</p>
            <a href={href('countries')} className="mt-3 block text-left text-[14px] font-semibold text-teal-ink no-underline hover:underline dark:text-teal">
              {tx('{0} countries · {1} universities: {2} →', '{0} davlat · {1} universitet: {2} →', c.countries, c.universities, data.countries.map((co) => pick(co.name)).join(' · '))}
            </a>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={startHref} className={cx(buttonClass('primary', 'lg'), '!text-navy-ink')}>
                {profile ? tx('Profile builder', 'Profil quruvchisi') : k(4)} <Icon i={ArrowRight} />
              </a>
              <a href={href('countries')} className={buttonClass('secondary', 'lg')}>{k(5)}</a>
            </div>
            <a href={href('demo')} className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted no-underline hover:text-fg">
              <Icon i={FlaskConical} />
              {k(6)}
            </a>
          </div>

          <div className="relative mx-auto flex w-full max-w-[480px] flex-col items-center">
            <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[56%] h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--teal-soft))_0%,rgb(var(--teal-soft)/0.55)_42%,transparent_70%)] sm:h-[380px] sm:w-[380px]" />
            <div className="relative z-10 max-w-[260px] self-start rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] font-semibold leading-snug text-fg shadow-card sm:ml-4">
              {k(7)}
              <span aria-hidden="true" className="absolute -bottom-[7px] left-8 h-3 w-3 rotate-45 border-b border-r border-line bg-surface" />
            </div>
            <div role="img" aria-label={tx('EduBridge guides: an Uzbek boy in a doppi and an Uzbek girl in a hijab and doppi', 'EduBridge yo‘lboshchilari: do‘ppi kiygan o‘zbek bola va hijob va do‘ppi kiygan o‘zbek qiz')} className="relative -mt-1 h-[260px] w-full max-w-[360px] select-none sm:h-[380px] sm:max-w-[460px] lg:h-[420px] lg:max-w-[480px]">
              <img src={mascot} alt="" draggable={false} width={480} height={420} className="guide-float h-full w-full object-contain object-bottom drop-shadow-[0_18px_22px_rgba(12,24,52,0.18)]" />
            </div>
          </div>
        </div>
      </section>

      {/* example card (clearly marked as an example) */}
      <section className="gutter mx-auto grid max-w-6xl items-center gap-8 pt-14 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="eyebrow mb-2">{tx('Your profile and dates', 'Profilingiz va sanalaringiz')}</p>
          <h2 className="max-w-md text-[26px] font-extrabold md:text-[32px]">{tx('Built from your own profile, not generic tips', 'Umumiy maslahatlardan emas, o‘z profilingizdan tuzilgan')}</h2>
          <p className="mt-3 max-w-md text-muted">{tx('Deadlines and reminders come from the universities you save and the dates you add. The profile check compares what you entered with published levels. Unverified dates are always marked.', 'Muddatlar va eslatmalar siz saqlagan universitetlar va qo‘shgan sanalaringizdan olinadi. Profil tekshiruvi kiritganlaringizni e’lon qilingan darajalar bilan solishtiradi. Tasdiqlanmagan sanalar doim belgilanadi.')}</p>
        </div>
        <div className="relative rounded-2xl border border-line bg-surface p-4 shadow-xl md:p-5" aria-label={tx('Example with demo data', 'Namoyish ma’lumoti bilan namuna')}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-faint">{k(11)}</p>
              <p className="text-[15px] font-bold">{k(12)}</p>
            </div>
            <Badge tone="warn"><Icon i={FlaskConical} size={12} />{k(13)}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[[tx('Saved', 'Saqlangan'), '6'], [tx('Plan activities', 'Reja faoliyatlari'), '8'], [tx('Reminders', 'Eslatmalar'), '3']].map(([label, n]) => (
              <div key={label} className="rounded-lg border border-line bg-sunken/60 p-2.5">
                <p className="text-[11px] font-semibold text-muted">{label}</p>
                <p className="tabular text-[20px] font-extrabold">{n}</p>
              </div>
            ))}
          </div>
          <p className="eyebrow mb-2 mt-4">{k(20)}</p>
          <ul className="flex flex-col gap-2">
            {[[k(21), k(22), CircleHelp, 'neutral'], [k(23), k(24), Clock3, 'warn'], [k(25), k(26), CircleX, 'neutral']].map(([name, status, I, tone]) => (
              <li key={name as string} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-[13px]">
                <span className="truncate font-semibold">{name as string}</span>
                <Badge tone={tone as 'neutral' | 'warn'}><Icon i={I as LucideIcon} size={12} />{status as string}</Badge>
              </li>
            ))}
          </ul>
          <p className="eyebrow mb-2 mt-4">{k(27)}</p>
          <ul className="flex flex-col gap-1.5 text-[12.5px] text-muted">
            <li className="flex gap-2"><span className="mt-0.5 text-ok"><Icon i={CircleCheck} size={14} /></span>{k(28)}</li>
            <li className="flex gap-2"><span className="mt-0.5 text-info"><Icon i={CircleHelp} size={14} /></span>{k(29)}</li>
          </ul>
        </div>
      </section>

      {/* the problem */}
      <section className="gutter mx-auto max-w-6xl py-14">
        <p className="eyebrow mb-2">{k(30)}</p>
        <h2 className="max-w-2xl text-[26px] font-extrabold md:text-[32px]">{k(31)}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {problems.map(([I, i]) => (
            <div key={i} className="rounded-xl border border-line bg-surface p-4">
              <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-bad-soft text-bad"><Icon i={I} size={18} /></div>
              <p className="font-bold">{k(i)}</p>
              <p className="mt-1 text-[13.5px] text-muted">{k(i + 1)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* what it does */}
      <section className="border-y border-line bg-surface">
        <div className="gutter mx-auto max-w-6xl py-14">
          <p className="eyebrow mb-2">{k(42)}</p>
          <h2 className="max-w-2xl text-[26px] font-extrabold md:text-[32px]">{k(43)}</h2>
          <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="flex gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-soft text-teal-ink"><Icon i={f.icon} size={18} /></div>
                <div>
                  <p className="font-bold">{f.title}</p>
                  <p className="mt-1 text-[14px] text-muted">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="gutter mx-auto max-w-6xl scroll-mt-20 py-14">
        <p className="eyebrow mb-2">{k(56)}</p>
        <h2 className="text-[26px] font-extrabold md:text-[32px]">{k(57)}</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {steps.map(([a, b], n) => (
            <li key={a} className="relative rounded-xl border border-line bg-surface p-5">
              <span className="tabular mb-3 grid h-8 w-8 place-items-center rounded-full bg-navy text-[14px] font-bold text-navy-ink">{n + 1}</span>
              <p className="font-bold">{k(a)}</p>
              <p className="mt-1 text-[14px] text-muted">{k(b)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* information policy */}
      <section className="bg-navy text-navy-ink">
        <div className="gutter mx-auto grid max-w-6xl gap-8 py-14 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.08em] opacity-70">{k(70)}</p>
            <h2 className="text-[26px] font-extrabold md:text-[32px]">{k(71)}</h2>
            <p className="mt-3 max-w-xl text-[15.5px] opacity-85">{k(72)}</p>
            {c.lastChecked && <p className="mt-3 text-[13.5px] opacity-70">{tx('Last checked: {0}', 'Oxirgi tekshiruv: {0}', formatDate(c.lastChecked, lang) ?? c.lastChecked)}</p>}
          </div>
          <ul className="flex flex-col gap-3 text-[14.5px]">
            {[k(73), k(74), k(75), tx('Your data stays in your browser unless you sign in', 'Ma’lumotlaringiz kirmaguningizcha brauzeringizda qoladi')].map((line) => (
              <li key={line} className="flex gap-2.5"><span className="mt-0.5 shrink-0"><Icon i={BadgeCheck} size={18} /></span>{line}</li>
            ))}
            <li className="mt-2">
              <a href={href('info', 'sources')} className={cx(buttonClass('secondary'), '!text-fg border-transparent')}>{k(77)}</a>
            </li>
          </ul>
        </div>
      </section>

      {/* closing call to action */}
      <section className="gutter mx-auto max-w-6xl py-14 text-center">
        <h2 className="text-[24px] font-extrabold md:text-[28px]">{k(78)}</h2>
        <p className="mx-auto mt-2 max-w-lg text-muted">{k(79)}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={startHref} className={cx(buttonClass('primary'), '!text-navy-ink')}>{profile ? tx('Profile builder', 'Profil quruvchisi') : k(80)}</a>
          <a href={href('demo')} className={buttonClass('secondary')}><Icon i={FlaskConical} />{k(81)}</a>
        </div>
      </section>
    </div>
  );
}
