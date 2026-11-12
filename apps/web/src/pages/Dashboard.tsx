import { useMemo, type ReactNode } from 'react';
import { Award, Bell, CalendarDays, CheckCheck, ClipboardList, Clock, FileText, ListChecks, Landmark, MessageSquare, PenLine, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useStore } from '../store/AppStore';
import { useCatalog } from '../data/CatalogProvider';
import { completeness } from '../lib/profile';
import { formatDate } from '../lib/format';
import { recommendUniversities, matchingGrants } from '../lib/match';
import { href } from '../lib/router';
import { Badge, Card, Progress, buttonClass, cx } from '../components/ui';
import { UniCard } from '../components/common';
import { levelOf, useDateSub, useNotices } from '../components/Notices';
import { PROGRESS_STAGES, STAGE_LABEL, isFinished, progress, type Plan } from '../lib/plans';
import { useOpp } from './Plans';

function PlanProgress({ plan }: { plan: Plan }) {
  const { tx } = useI18n();
  const opp = useOpp(plan);
  if (!opp) return null;
  const pr = progress(plan);
  const at = PROGRESS_STAGES.indexOf(plan.stage);
  return (
    <Card>
      <a href={href('plan', plan.id)} className="font-bold text-fg no-underline hover:underline">{opp.name}</a>
      <ol className="mt-3 flex gap-1" aria-label={tx('Stage', 'Bosqich')}>
        {PROGRESS_STAGES.map((s, i) => <li key={s} title={tx(STAGE_LABEL[s][0], STAGE_LABEL[s][1])} className={cx('h-1.5 flex-1 rounded-full', i <= at ? (plan.stage === 'accepted' ? 'bg-ok' : 'bg-navy') : 'bg-line')} />)}
      </ol>
      <p className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
        <span>{tx(STAGE_LABEL[plan.stage][0], STAGE_LABEL[plan.stage][1])}</span>
        <span className="tabular">{tx('{0}% of required tasks', 'Majburiy vazifalarning {0}%', pr.pct)}</span>
      </p>
    </Card>
  );
}

function Tile({ label, value, sub, icon, to }: { label: string; value: number; sub?: string; icon: ReactNode; to: string }) {
  return (
    <a href={to} className="flex min-h-[112px] flex-col justify-between rounded-xl border border-line bg-surface p-4 text-left no-underline shadow-card hover:border-teal/50">
      <span className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-medium leading-snug text-muted">{label}</span>
        <span className="mt-0.5 shrink-0 text-muted" aria-hidden>{icon}</span>
      </span>
      <span>
        <span className="tabular block text-[28px] font-extrabold leading-none text-fg">{value}</span>
        {sub && <span className="mt-1 block text-[12px] text-muted">{sub}</span>}
      </span>
    </a>
  );
}

export function Dashboard() {
  const { tx, t, lang } = useI18n();
  const { profile } = useStore();
  const cat = useCatalog();
  const { upcoming, notices } = useNotices();
  const sub = useDateSub();

  const recs = useMemo(() => (profile ? recommendUniversities(profile, cat.universities) : []), [profile, cat.universities]);
  const grants = useMemo(() => (profile ? matchingGrants(profile, cat.grants) : []), [profile, cat.grants]);
  const { plans } = useStore();

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <h1 className="text-2xl font-extrabold">{tx('Your dashboard starts with a profile', 'Boshqaruv paneli profildan boshlanadi')}</h1>
        <p className="mt-2 text-muted">{tx('Create a profile (about 5 minutes) or try a fictional demo student.', 'Profil yarating (taxminan 5 daqiqa) yoki to‘qima namoyish talabasini sinab ko‘ring.')}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <a href={href('onboarding')} className={buttonClass('primary')}>{tx('Build my profile', 'Profilimni yaratish')}</a>
          <a href={href('demo')} className={buttonClass('secondary')}><Sparkles size={16} aria-hidden />{tx('Try demo', 'Namoyishni sinash')}</a>
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? tx('Good morning', 'Xayrli tong') : hour < 18 ? tx('Good afternoon', 'Xayrli kun') : tx('Good evening', 'Xayrli kech');
  const name = profile.name.replace(/\s*\(demo\)/i, '').trim();
  const pct = completeness(profile);
  const levelLabel = profile.targetLevel === 'bachelor' ? t('lvl.bachelor') : profile.targetLevel === 'master' ? t('lvl.master') : 'PhD';
  const urgent = notices.filter((n) => levelOf(n.days) === 'urgent').slice(0, 2);
  const dueSoon = upcoming.filter((d) => d.days <= 30).length;
  const allTasks = plans.flatMap((p) => p.tasks);
  const doneTasks = allTasks.filter((t) => t.done).length;
  const inProgress = plans.filter((p) => !isFinished(p.stage)).length;

  const actions: Array<{ icon: ReactNode; label: string; to: string }> = [
    { icon: <Award size={18} />, label: tx('Find scholarships', 'Grant topish'), to: href('scholarships') },
    { icon: <Landmark size={18} />, label: tx('Explore universities', 'Universitetlarni ko‘rish'), to: href('universities') },
    { icon: <PenLine size={18} />, label: tx('Improve my personal statement', 'Motivatsion xatni yaxshilash'), to: href('writing') },
    { icon: <FileText size={18} />, label: tx('Build an application checklist', 'Ariza ro‘yxatini tuzish'), to: plans[0] ? href('plan', plans[0].id) : href('universities') },
    { icon: <CalendarDays size={18} />, label: tx('View my calendar', 'Taqvimni ko‘rish'), to: href('calendar') },
    { icon: <MessageSquare size={18} />, label: tx('Ask the AI assistant', 'SI yordamchidan so‘rash'), to: href('assistant') },
  ];

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold md:text-[30px]">{name ? `${greeting}, ${name}` : greeting}</h1>
          <p className="mt-1 text-muted">{tx('{0} · applying {1}', '{0} · {1}-yil arizasi', levelLabel, profile.applicationYear)}</p>
        </div>
        <a href={href('onboarding', 'edit')} className="block w-full max-w-xs rounded-xl border border-line bg-surface p-3 text-left no-underline shadow-card hover:border-teal/50">
          <span className="mb-1.5 flex justify-between text-[13px] text-fg">
            <span className="font-semibold">{tx('Profile completion', 'Profil to‘ldirilganligi')}</span>
            <span className="tabular font-bold">{pct}%</span>
          </span>
          <Progress value={pct} label={tx('Profile completion', 'Profil to‘ldirilganligi')} />
          {pct < 100 && <span className="mt-1.5 block text-[12px] text-faint">{tx('Add details to improve eligibility checks →', 'Tekshiruvlarni aniqlashtirish uchun ma’lumot qo‘shing →')}</span>}
        </a>
      </section>

      <section aria-label={tx('Overview', 'Umumiy ko‘rinish')} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Tile label={tx('Recommended universities', 'Tavsiya etilgan universitetlar')} value={recs.length} icon={<Landmark size={16} />} to={href('universities')} />
        <Tile label={tx('Scholarship matches', 'Mos grantlar')} value={grants.length} sub={tx('open or not yet dated', 'ochiq yoki sanasi yo‘q')} icon={<Award size={16} />} to={href('scholarships')} />
        <Tile label={tx('Upcoming deadlines', 'Yaqin muddatlar')} value={dueSoon} sub={tx('within 30 days', '30 kun ichida')} icon={<Clock size={16} />} to={href('calendar')} />
        <Tile label={tx('Applications in progress', 'Jarayondagi arizalar')} value={inProgress} icon={<ClipboardList size={16} />} to={href('plans')} />
        <Tile label={tx('Outstanding tasks', 'Bajarilmagan vazifalar')} value={allTasks.length - doneTasks} icon={<ListChecks size={16} />} to={href('plans')} />
        <Tile label={tx('Completed tasks', 'Bajarilgan vazifalar')} value={doneTasks} icon={<CheckCheck size={16} />} to={href('plans')} />
      </section>

      {urgent.length > 0 && (
        <section className="flex flex-col gap-3" aria-label={tx('Deadline alerts', 'Muddat ogohlantirishlari')}>
          {urgent.map((n) => (
            <div key={n.id} className="flex flex-wrap items-start gap-3 rounded-xl border border-bad/30 bg-bad-soft p-4">
              <Bell size={20} className="text-bad" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{n.days === 0 ? tx('Due today: {0}', 'Bugun: {0}', n.name) : tx('{0} days left: {1}', '{0} kun qoldi: {1}', n.days, n.name)}</p>
                <p className="mt-0.5 text-[14px] text-fg/85">{n.kind === 'mine' ? tx('A date you added.', 'Siz qo‘shgan sana.') : n.kind === 'task' ? tx('A task in one of your plans.', 'Rejangizdagi vazifa.') : tx('Confirm the details on the official website.', 'Tafsilotlarni rasmiy saytda tekshiring.')}</p>
              </div>
              <a href={n.link} className={buttonClass('secondary', 'sm')}>{tx('Open', 'Ochish')}</a>
            </div>
          ))}
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-bold">{tx('Upcoming deadlines', 'Yaqinlashayotgan muddatlar')}</h2>
            <a href={href('calendar')} className={buttonClass('ghost', 'sm')}>{tx('Calendar', 'Taqvim')} →</a>
          </div>
          {upcoming.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-8 text-center">
              <Clock size={24} className="mx-auto text-muted" aria-hidden />
              <p className="mt-3 font-bold">{tx('Nothing tracked yet', 'Hali hech narsa kuzatilmayapti')}</p>
              <p className="mx-auto mt-1 max-w-sm text-[14px] text-muted">{tx('Save a university to track its confirmed deadline.', 'Tasdiqlangan muddatini kuzatish uchun universitetni saqlang.')}</p>
              <a href={href('universities')} className={cx(buttonClass('secondary'), 'mt-4')}>{tx('Universities', 'Universitetlar')}</a>
            </div>
          ) : (
            <Card className="overflow-hidden !p-0 sm:!p-0">
              <ul>
                {upcoming.slice(0, 8).map((d) => {
                  const lv = levelOf(d.days);
                  return (
                    <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 last:border-0">
                      <div className="min-w-0 flex-1 basis-56">
                        <a href={d.link} className="font-semibold text-fg no-underline hover:underline">{d.name}</a>
                        <p className="text-[12.5px] text-muted">
                          {sub(d)} · {formatDate(d.date, lang)}
                        </p>
                      </div>
                      <Badge tone={lv === 'urgent' ? 'bad' : lv === 'soon' ? 'warn' : 'ok'}>{d.days === 0 ? tx('Today', 'Bugun') : tx('{0} days left', '{0} kun qoldi', d.days)}</Badge>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-bold">{tx('Quick actions', 'Tezkor amallar')}</h2>
          <div className="grid grid-cols-2 gap-2">
            {actions.map((a) => (
              <a key={a.label} href={a.to} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-3 text-left text-[13.5px] font-semibold text-fg no-underline shadow-card hover:border-teal/50">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-soft text-teal-ink">{a.icon}</span>
                {a.label}
              </a>
            ))}
          </div>
          <Card className="mt-4">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-muted" aria-hidden />
              <p className="font-bold">{tx('Reminders', 'Eslatmalar')}</p>
            </div>
            <p className="mt-1 text-[13px] text-muted">{tx('The bell shows saved deadlines due within 30 days. Telegram reminders come 7 and 1 days before a confirmed date.', 'Qo‘ng‘iroqcha 30 kun ichidagi saqlangan muddatlarni ko‘rsatadi. Telegram eslatmalari tasdiqlangan sanadan 7 va 1 kun oldin keladi.')}</p>
            <a href={href('calendar')} className={cx(buttonClass('ghost', 'sm'), 'mt-2')}>{tx('Change reminder settings', 'Eslatma sozlamalarini o‘zgartirish')} →</a>
          </Card>
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-bold">{tx('Application progress', 'Arizalar jarayoni')}</h2>
          <a href={href('plans')} className={buttonClass('ghost', 'sm')}>{tx('Application plans', 'Ariza rejalari')} →</a>
        </div>
        {plans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-8 text-center">
            <ClipboardList size={24} className="mx-auto text-muted" aria-hidden />
            <p className="mt-3 font-bold">{tx('No application plans yet', 'Hali ariza rejasi yo‘q')}</p>
            <p className="mx-auto mt-1 max-w-sm text-[14px] text-muted">{tx('Open any university or scholarship and press “Add to plan”.', 'Istalgan universitet yoki grantni ochib, “Rejaga qo‘shish” tugmasini bosing.')}</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">{plans.map((p) => <PlanProgress key={p.id} plan={p} />)}</div>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[18px] font-bold">{tx('Recommended for you', 'Siz uchun tavsiyalar')}</h2>
            <p className="text-[13px] text-muted">{tx('Ordered by how many published facts fit your profile. This is not an admission prediction.', 'E’lon qilingan ma’lumotlarning profilingizga qanchalik mosligi bo‘yicha tartiblangan. Bu qabul bashorati emas.')}</p>
          </div>
          <a href={href('universities')} className={buttonClass('ghost', 'sm')}>{tx('All universities', 'Barcha universitetlar')} →</a>
        </div>
        {recs.length === 0 ? (
          <Card><p className="text-[14px] text-muted">{tx('No university in the catalogue matches your level and field yet. Change them in your profile.', 'Katalogda darajangiz va sohangizga mos universitet topilmadi. Profilingizda ularni o‘zgartiring.')}</p></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recs.slice(0, 6).map((m) => <UniCard key={m.uni.id} u={m.uni} />)}
          </div>
        )}
      </section>
    </div>
  );
}
