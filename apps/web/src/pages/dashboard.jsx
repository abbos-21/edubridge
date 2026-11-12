import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import {
  ArrowRight,
  BellRing,
  Calendar,
  CheckCheck,
  ClipboardList,
  Clock3,
  GraduationCap,
  Landmark,
  ListTodo,
  MessageSquareText,
  PenLine,
  Search,
  Siren,
} from 'lucide-react';
import { he, ii, we } from '../lib/catalog';
import { taskTitle } from '../lib/plan-tasks';
import { useStore } from '../store/store';
import { deadlineStatus, profileCompletion, useDerivedData, useI18n } from '../lib/derived';
import {
  Button,
  Card,
  CmpHn,
  CmpOi,
  DeadlineBadge,
  EmptyState,
  ProgressBar,
  Select,
  StatusIcon,
  classNames,
} from '../components/ui';
import { KS, Mh, Sn, _a, ey } from '../components/shared';

export function DashboardPage() {
  const { state: e, navigate: a, setStage: t, notify: n } = useStore(),
    { matches: s, today: r, notices: o, events: u } = useDerivedData(),
    { t: l, tx: c, p, lang: d } = useI18n(),
    h = e.profile,
    m = profileCompletion(h),
    y = new Date().getHours(),
    E =
      y < 12
        ? c('Good morning', 'Xayrli tong')
        : y < 18
          ? c('Good afternoon', 'Xayrli kun')
          : c('Good evening', 'Xayrli kech'),
    C = React.useMemo(() => {
      const k = ii
          .map((x) => ({
            o: x,
            m: s.get(x.id),
          }))
          .filter((x) => x.m && x.m.overall !== 'not_eligible'),
        K = (x) => deadlineStatus(x, r).kind !== 'closed';
      return {
        programs: k
          .filter((x) => {
            var F;
            return (
              x.o.kind === 'program' &&
              ((F = x.m.checks.find((O) => O.dim === 'relevance')) == null ? void 0 : F.status) !== 'not_met'
            );
          })
          .sort((x, F) => F.m.score - x.m.score),
        scholarships: k.filter((x) => x.o.kind === 'scholarship' && K(x.o)).sort((x, F) => F.m.score - x.m.score),
      };
    }, [s, r]),
    v = e.applications.flatMap((k) => k.tasks),
    g = v.filter((k) => k.done).length,
    b = u.filter((k) => k.id.startsWith('dl-') && k.date >= r),
    S = e.applications.filter((k) => !KS(k.stage)).length,
    A = [...new Set([...e.applications.map((k) => k.oppId), ...e.saved])].map((k) => he(k)).filter(Boolean),
    q = {
      upcoming: 0,
      demo: 0,
      unverified: 1,
      varies: 2,
      not_announced: 3,
      closed: 4,
    },
    w = A.map((k) => {
      const K = deadlineStatus(k, r),
        x = e.applications.find((I) => I.oppId === k.id),
        F = x == null ? void 0 : x.tasks.find((I) => !I.done),
        O = (x == null ? void 0 : x.tasks.filter((I) => I.mandatory)) ?? [],
        N = O.length ? Math.round((O.filter((I) => I.done).length / O.length) * 100) : null;
      return {
        o: k,
        v: K,
        app: x,
        next: F,
        prep: N,
      };
    }).sort((k, K) => q[k.v.kind] - q[K.v.kind] || (k.v.date ?? '9999').localeCompare(K.v.date ?? '9999')),
    U = o.filter((k) => k.id.startsWith('intel-')).slice(0, 2),
    j = [
      {
        icon: <GraduationCap size={18} />,
        l: c('Find scholarships', 'Grant topish'),
        go: () => a('scholarships'),
      },
      {
        icon: <Landmark size={18} />,
        l: c('Explore universities', 'Universitetlarni ko‘rish'),
        go: () => a('universities'),
      },
      {
        icon: <PenLine size={18} />,
        l: c('Improve my personal statement', 'Motivatsion xatni yaxshilash'),
        go: () => a('writing'),
      },
      {
        icon: <ClipboardList size={18} />,
        l: c('Build an application checklist', 'Ariza ro‘yxatini tuzish'),
        go: () => (e.applications[0] ? a('plan', e.applications[0].id) : a('scholarships')),
      },
      {
        icon: <Calendar size={18} />,
        l: c('View my calendar', 'Taqvimni ko‘rish'),
        go: () => a('calendar'),
      },
      {
        icon: <MessageSquareText size={18} />,
        l: c('Ask the AI assistant', 'SI yordamchidan so‘rash'),
        go: () => a('assistant'),
      },
    ];
  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold md:text-[30px]">
            {E}
            {', '}
            {h.name.replace(/\s*\(demo\)/i, '')}
          </h1>
          <p className="mt-1 text-muted">
            {c(
              `${l(`lvl.${h.targetLevel}`)} · applying ${h.applicationYear}`,
              `${l(`lvl.${h.targetLevel}`)} · ${h.applicationYear}-yil arizasi`,
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => a('onboarding', 'edit')}
          className="w-full max-w-xs rounded-xl border border-line bg-surface p-3 text-left shadow-card hover:border-teal/50"
        >
          <div className="mb-1.5 flex justify-between text-[13px]">
            <span className="font-semibold">{c('Profile completion', 'Profil to‘ldirilganligi')}</span>
            <span className="tabular font-bold">{m}%</span>
          </div>
          <ProgressBar value={m} label={c('Profile completion', 'Profil to‘ldirilganligi')} />
          {m < 100 && (
            <p className="mt-1.5 text-[12px] text-faint">
              {c(
                'Add details to improve eligibility checks →',
                'Tekshiruvlarni aniqlashtirish uchun ma’lumot qo‘shing →',
              )}
            </p>
          )}
        </button>
      </section>
      <section
        aria-label={c('Overview', 'Umumiy ko‘rinish')}
        className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
      >
        <CmpOi
          label={c('Recommended universities', 'Tavsiya etilgan universitetlar')}
          value={C.programs.filter((k) => k.m.score > 0).length}
          icon={<Landmark size={16} />}
          onClick={() => a('universities')}
        />
        <CmpOi
          label={c('Scholarship matches', 'Mos grantlar')}
          value={C.scholarships.length}
          sub={c('open or upcoming', 'ochiq yoki kutilayotgan')}
          icon={<GraduationCap size={16} />}
          onClick={() => a('scholarships')}
        />
        <CmpOi
          label={c('Upcoming deadlines', 'Yaqin muddatlar')}
          value={b.length}
          icon={<Clock3 size={16} />}
          onClick={() => a('calendar')}
        />
        <CmpOi
          label={c('Applications in progress', 'Jarayondagi arizalar')}
          value={S}
          icon={<ClipboardList size={16} />}
          onClick={() => a('plans')}
        />
        <CmpOi
          label={c('Outstanding tasks', 'Bajarilmagan vazifalar')}
          value={v.length - g}
          icon={<ListTodo size={16} />}
          onClick={() => a('plans')}
        />
        <CmpOi
          label={c('Completed tasks', 'Bajarilgan vazifalar')}
          value={g}
          icon={<CheckCheck size={16} />}
          onClick={() => a('plans')}
        />
      </section>
      {U.length > 0 && (
        <section className="flex flex-col gap-3" aria-label={c('Deadline alerts', 'Muddat ogohlantirishlari')}>
          {U.map((k) => (
            <div
              className={classNames(
                'flex flex-wrap items-start gap-3 rounded-xl border p-4',
                k.level === 'urgent' ? 'border-bad/30 bg-bad-soft' : 'border-warn/30 bg-warn-soft',
              )}
              key={k.id}
            >
              <Siren size={20} className={k.level === 'urgent' ? 'text-bad' : 'text-warn'} aria-hidden={!0} />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{p(k.title)}</p>
                <p className="mt-0.5 text-[14px] text-fg/85">{p(k.body)}</p>
              </div>
              {k.appId && (
                <Button size="sm" onClick={() => a('plan', k.appId)}>
                  {l('a.openPlan')}
                </Button>
              )}
            </div>
          ))}
        </section>
      )}
      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-bold">{c('Upcoming deadlines', 'Yaqinlashayotgan muddatlar')}</h2>
            <Button size="sm" variant="ghost" onClick={() => a('calendar')}>
              {l('nav.calendar')}
              {' →'}
            </Button>
          </div>
          {w.length === 0 ? (
            <EmptyState
              icon={<Clock3 size={24} />}
              title={c('Nothing tracked yet', 'Hali hech narsa kuzatilmayapti')}
              body={c(
                'Save a university or scholarship to track its deadline.',
                'Muddatini kuzatish uchun universitet yoki grantni saqlang.',
              )}
              action={<Button onClick={() => a('scholarships')}>{l('nav.scholarships')}</Button>}
            />
          ) : (
            <Card className="overflow-hidden">
              <ul>
                {w.map(({ o: k, v: K, app: x, next: F, prep: O }) => (
                  <li
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 last:border-0"
                    key={k.id}
                  >
                    <div className="min-w-0 flex-1 basis-56">
                      <button
                        type="button"
                        className="text-left font-semibold hover:underline"
                        onClick={() =>
                          x ? a('plan', x.id) : a(k.kind === 'program' ? 'university' : 'scholarship', k.id)
                        }
                      >
                        {k.kind === 'program' ? k.university : k.name}
                      </button>
                      <p className="text-[12.5px] text-muted">
                        {K.kind === 'closed' ? (
                          c(
                            'Closed for this cycle — watch for the next call',
                            'Bu siklda yopilgan — keyingi e’lonni kuting',
                          )
                        ) : F ? (
                          <>
                            {c('Next:', 'Keyingi:')} {p(taskTitle(F))}
                          </>
                        ) : x ? (
                          c('All tasks complete', 'Barcha vazifalar bajarilgan')
                        ) : (
                          c('Saved — add to plan for a checklist', 'Saqlangan — ro‘yxat uchun rejaga qo‘shing')
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {O !== null && (
                        <div className="w-20">
                          <p className="tabular mb-1 text-right text-[11.5px] text-faint">{O}%</p>
                          <ProgressBar value={O} />
                        </div>
                      )}
                      <DeadlineBadge opp={k} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
        <section>
          <h2 className="mb-3 text-[18px] font-bold">{c('Quick actions', 'Tezkor amallar')}</h2>
          <div className="grid grid-cols-2 gap-2">
            {j.map((k) => (
              <button
                type="button"
                onClick={k.go}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-3 text-left text-[13.5px] font-semibold shadow-card hover:border-teal/50"
                key={k.l}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-soft text-teal-ink">
                  {k.icon}
                </span>
                {k.l}
              </button>
            ))}
          </div>
          <Card className="mt-4 p-4">
            <div className="flex items-center gap-2">
              <BellRing size={16} className="text-muted" />
              <p className="font-bold">{c('Reminders', 'Eslatmalar')}</p>
            </div>
            <p className="mt-1 text-[13px] text-muted">
              {c(
                `In-app reminders at ${e.reminders.join(', ')} days before each date.`,
                `Har bir sanadan ${e.reminders.join(', ')} kun oldin ilova ichida eslatma.`,
              )}
            </p>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => a('calendar')}>
              {c('Change reminder settings', 'Eslatma sozlamalarini o‘zgartirish')}
              {' →'}
            </Button>
          </Card>
        </section>
      </div>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-bold">{c('Application progress', 'Arizalar jarayoni')}</h2>
          <Button size="sm" variant="ghost" onClick={() => a('plans')}>
            {l('nav.plans')}
            {' →'}
          </Button>
        </div>
        {e.applications.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={24} />}
            title={c('No application plans yet', 'Hali ariza rejasi yo‘q')}
            body={c(
              'Open any university or scholarship and press “Add to plan”.',
              'Istalgan universitet yoki grantni ochib, “Rejaga qo‘shish” tugmasini bosing.',
            )}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {e.applications.map((k) => {
              const K = he(k.oppId),
                x = k.tasks.filter((N) => N.mandatory),
                F = x.length ? (x.filter((N) => N.done).length / x.length) * 100 : 0,
                O = Mh.indexOf(k.stage);
              return (
                <Card className="p-4" key={k.id}>
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-semibold text-muted">{Sn(K, d)}</p>
                      <button
                        type="button"
                        className="text-left font-bold hover:underline"
                        onClick={() => a('plan', k.id)}
                      >
                        {_a(K, d)}
                      </button>
                    </div>
                    <DeadlineBadge opp={K} compact={!0} />
                  </div>
                  <ol className="mt-3 flex gap-1" aria-label={c('Stage', 'Bosqich')}>
                    {Mh.map((N, I) => (
                      <li
                        title={l(`st.${N}`)}
                        className={classNames(
                          'h-1.5 flex-1 rounded-full',
                          I <= O ? (k.stage === 'accepted' ? 'bg-ok' : 'bg-navy') : 'bg-line',
                        )}
                        key={N}
                      />
                    ))}
                  </ol>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <label className="sr-only" htmlFor={`stage-${k.id}`}>
                      {c('Stage', 'Bosqich')}
                    </label>
                    <Select
                      id={`stage-${k.id}`}
                      value={k.stage}
                      className="h-9 max-w-[230px] text-[13px]"
                      onChange={(N) => {
                        (t(k.id, N.target.value),
                          n(
                            c(
                              `Stage updated: ${l(`st.${N.target.value}`)}`,
                              `Bosqich yangilandi: ${l(`st.${N.target.value}`)}`,
                            ),
                          ));
                      }}
                    >
                      {ey.map((N) => (
                        <option value={N} key={N}>
                          {l(`st.${N}`)}
                        </option>
                      ))}
                    </Select>
                    <span className="tabular text-[13px] text-muted">
                      {c(`${Math.round(F)}% of required tasks`, `Majburiy vazifalarning ${Math.round(F)}%`)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[18px] font-bold">{c('Recommended for you', 'Siz uchun tavsiyalar')}</h2>
            <p className="text-[13px] text-muted">
              {c(
                'Ranked by how many published requirements appear satisfied. This is not an admission prediction.',
                'E’lon qilingan talablardan nechtasi bajarilgani bo‘yicha saralangan. Bu qabul bashorati emas.',
              )}
            </p>
          </div>
          <Button size="sm" variant="ghost" icon={<Search size={15} />} onClick={() => a('universities')}>
            {c('See all', 'Hammasi')}
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[...C.programs.slice(0, 3), ...C.scholarships.slice(0, 3)].map(({ o: k, m: K }) => {
            const x =
                K.checks.find((O) => O.status === 'met' && O.dim !== 'level' && O.dim !== 'citizenship') ??
                K.checks.find((O) => O.status !== 'met' && O.status !== 'na') ??
                K.checks[0],
              F =
                k.kind === 'program'
                  ? k.tuition
                    ? `${k.tuition.amount.toLocaleString('en-US')} ${k.tuition.currency}`
                    : l('m.notVerified')
                  : l(`fund.${k.fundingLabel}`);
            return (
              <Card as="article" className="flex flex-col gap-2 p-4" key={k.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold uppercase tracking-wide text-faint">
                    {k.kind === 'program' ? c('University', 'Universitet') : c('Scholarship', 'Grant')}
                  </span>
                  <CmpHn overall={K.overall} />
                </div>
                <p className="font-bold leading-snug">{_a(k, d)}</p>
                <p className="text-[12.5px] text-muted">
                  {Sn(k, d)}
                  {' · '}
                  {p(we[k.country])}
                  {' · '}
                  {k.kind === 'program' ? l(`lvl.${k.level}`) : k.levels.map((O) => l(`lvl.${O}`)).join('/')}
                </p>
                <dl className="grid grid-cols-2 gap-2 text-[12.5px]">
                  <div>
                    <dt className="text-faint">
                      {k.kind === 'program' ? c('Tuition', 'O‘qish to‘lovi') : c('Funding', 'Moliyalashtirish')}
                    </dt>
                    <dd className="tabular font-semibold">
                      {F}
                      {k.kind === 'program' && k.tuition
                        ? ` ${k.tuition.per === 'year' ? l('m.perYear') : k.tuition.per === 'semester' ? l('m.perSemester') : l('m.total')}`
                        : ''}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-faint">{l('dl.deadline')}</dt>
                    <dd>
                      <DeadlineBadge opp={k} compact={!0} />
                    </dd>
                  </div>
                </dl>
                {x && (
                  <p className="flex gap-2 text-[12.5px] text-muted">
                    <StatusIcon status={x.status} />
                    {p(x.msg)}
                  </p>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-auto self-start"
                  onClick={() => a(k.kind === 'program' ? 'university' : 'scholarship', k.id)}
                >
                  {l('a.view')} <ArrowRight size={14} />
                </Button>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
