import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import {
  ArrowLeft,
  CalendarPlus,
  CircleAlert,
  CircleCheck,
  CircleX,
  Paperclip,
  PenLine,
  Plus,
  RotateCcw,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import { ai, me, useToday } from '../lib/core';
import { he } from '../lib/catalog';
import { Jj, _j, jl, taskTitle } from '../lib/plan-tasks';
import { useStore } from '../store/store';
import { deadlineStatus, planUrgency, useI18n } from '../lib/derived';
import {
  Badge,
  Button,
  Callout,
  Card,
  DeadlineBadge,
  EmptyState,
  Field,
  Input,
  PageHeader,
  ProgressBar,
  Select,
  StatusIcon,
  Tabs,
  Textarea,
  classNames,
} from '../components/ui';
import { Mascot, SpeechBubble, Xs } from '../components/mascot';
import { Cmp$g, Sn, _a, ey } from '../components/shared';

export function PlansPage() {
  const { state: e, navigate: a } = useStore(),
    { t, tx: n, p: s, lang: r } = useI18n(),
    o = useToday(),
    u = [...e.applications].sort((l, c) => planUrgency(l, he(l.oppId), o) - planUrgency(c, he(c.oppId), o));
  return (
    <div>
      <PageHeader
        eyebrow={t('nav.plans')}
        title={n('Your application plans', 'Ariza rejalaringiz')}
        sub={n(
          'Ordered by urgency: time remaining, whether the call is open, the priority you set and the work still outstanding.',
          'Shoshilinchlik bo‘yicha tartiblangan: qolgan vaqt, qabul ochiqligi, siz belgilagan muhimlik va qolgan ishlar.',
        )}
        actions={
          <Button onClick={() => a('scholarships')}>{n('Add from scholarships', 'Grantlardan qo‘shish')}</Button>
        }
      />
      {u.length === 0 ? (
        <EmptyState
          icon={
            <Mascot
              framing="head"
              action="explain"
              className={e.mascot ? 'h-24 w-24' : 'h-24 w-44'}
              label={n('EduBridge guide', 'EduBridge yo‘lboshchisi')}
            />
          }
          title={n('No plans yet', 'Hali rejalar yo‘q')}
          body={n(
            'Choose a university or scholarship and press “Add to plan”. EduBridge builds a checklist from its requirements.',
            'Universitet yoki grantni tanlab, “Rejaga qo‘shish”ni bosing. EduBridge uning talablaridan ro‘yxat tuzadi.',
          )}
          action={
            <Button variant="primary" onClick={() => a('universities')}>
              {t('nav.universities')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {u.map((l) => {
            const c = he(l.oppId),
              p = l.tasks.filter((m) => m.mandatory),
              d = p.filter((m) => m.done).length,
              h = l.tasks.find((m) => !m.done);
            return (
              <Card as="article" className="flex flex-col gap-3 p-5" key={l.id}>
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold text-muted">{Sn(c, r)}</p>
                    <h2 className="font-bold leading-snug">{_a(c, r)}</h2>
                  </div>
                  <Badge tone={l.priority === 'high' ? 'bad' : l.priority === 'low' ? 'neutral' : 'navy'}>
                    {l.priority === 'high'
                      ? n('High priority', 'Yuqori muhim')
                      : l.priority === 'low'
                        ? n('Low priority', 'Past muhim')
                        : n('Medium priority', 'O‘rta muhim')}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="teal">{t(`st.${l.stage}`)}</Badge>
                  <DeadlineBadge opp={c} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[12.5px] text-muted">
                    <span>{n('Required tasks', 'Majburiy vazifalar')}</span>
                    <span className="tabular">
                      {d}
                      {' / '}
                      {p.length}
                    </span>
                  </div>
                  <ProgressBar value={p.length ? (d / p.length) * 100 : 0} />
                </div>
                {h && (
                  <p className="text-[13.5px] text-muted">
                    {n('Next:', 'Keyingi:')} <span className="font-semibold text-fg">{s(taskTitle(h))}</span>
                  </p>
                )}
                <Button variant="primary" size="sm" className="mt-auto self-start" onClick={() => a('plan', l.id)}>
                  {t('a.openPlan')}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
function JS({ pct: e, stage: a, planId: t }) {
  const { tx: n } = useI18n(),
    s = Xs(),
    r = React.useRef(null),
    [o, u] = React.useState(null),
    [l, c] = React.useState(0);
  if (
    (React.useEffect(() => {
      const d = r.current;
      if (
        ((r.current = {
          pct: e,
          stage: a,
          planId: t,
        }),
        !d || d.planId !== t)
      )
        return;
      let h = null;
      (a === 'submitted' && d.stage !== 'submitted'
        ? (h = 'submitted')
        : e === 100 && d.pct < 100
          ? (h = 'all')
          : e >= 50 && d.pct < 50 && (h = 'half'),
        h && (u(h), c((m) => m + 1)));
    }, [e, a, t]),
    React.useEffect(() => {
      if (!o) return;
      const d = window.setTimeout(() => u(null), 7e3);
      return () => window.clearTimeout(d);
    }, [o, l]),
    !o)
  )
    return null;
  const p = {
    half: n(
      'Halfway there! Half of the required tasks are done. Keep going.',
      'Yarmiga yetdingiz! Majburiy vazifalarning yarmi bajarildi. Davom eting.',
    ),
    all: n(
      'Every required task is ticked off. Do the final review before you submit.',
      'Barcha majburiy vazifalar bajarildi. Topshirishdan oldin yakuniy tekshiruvni o‘tkazing.',
    ),
    submitted: n(
      'Application submitted. Well done! Save your confirmation and watch for a decision.',
      'Ariza topshirildi. Barakalla! Tasdiqni saqlang va qarorni kuting.',
    ),
  }[o];
  return (
    <div
      role="status"
      aria-live="polite"
      className="fade-in fixed bottom-[calc(max(16px,env(safe-area-inset-bottom,0px))+56px)] left-[max(16px,env(safe-area-inset-left,0px))] right-[max(16px,env(safe-area-inset-right,0px))] z-40 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 pr-10 shadow-xl sm:left-auto sm:w-[360px]"
    >
      <Mascot
        framing="head"
        action="celebrate"
        actionKey={l}
        className={s === 'duo' ? 'h-[76px] w-[136px] shrink-0' : 'h-[76px] w-[76px] shrink-0'}
        label={n('EduBridge mascot celebrating', 'EduBridge maskoti xursand')}
      />
      <p className="text-[14px] font-semibold leading-snug">{p}</p>
      <button
        type="button"
        onClick={() => u(null)}
        aria-label={n('Close', 'Yopish')}
        className="absolute right-2 top-2 rounded-md p-1 text-muted hover:bg-sunken"
      >
        <X size={16} />
      </button>
    </div>
  );
}
const ZS = {
  satisfied: ['Satisfied', 'Bajarilgan'],
  not_satisfied: ['Not satisfied', 'Bajarilmagan'],
  in_progress: ['In progress', 'Jarayonda'],
  verify: ['Needs verification', 'Tekshirish kerak'],
  na: ['Not applicable', 'Tegishli emas'],
};
export function PlanPage({ id: e }) {
  const {
      state: a,
      navigate: t,
      setStage: n,
      setPriority: s,
      updateTask: r,
      addTask: o,
      removeTask: u,
      removePlan: l,
      notify: c,
    } = useStore(),
    { t: p, tx: d, p: h, lang: m } = useI18n(),
    [y, E] = React.useState('check'),
    [C, v] = React.useState(''),
    [g, b] = React.useState(''),
    [S, A] = React.useState(''),
    [q, w] = React.useState(null),
    [U, j] = React.useState(!1),
    [k, K] = React.useState({}),
    x = a.applications.find((T) => T.id === e),
    F = useToday();
  if (!x)
    return (
      <EmptyState
        title={d('Plan not found', 'Reja topilmadi')}
        action={<Button onClick={() => t('plans')}>{p('nav.plans')}</Button>}
      />
    );
  const O = he(x.oppId),
    N = Jj(O, x, a.profile, a.rates),
    I = _j(x, N),
    f = deadlineStatus(O, F),
    M = _a(O, m),
    D = [...x.tasks].sort(
      (T, ae) => Number(T.done) - Number(ae.done) || (T.due ?? '9999').localeCompare(ae.due ?? '9999'),
    ),
    R = (T, ae) => {
      if (!ae) return;
      if (
        ![
          'application/pdf',
          'image/png',
          'image/jpeg',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ].includes(ae.type)
      ) {
        K({
          ...k,
          [T.id]: d('Use PDF, PNG, JPG or DOCX.', 'PDF, PNG, JPG yoki DOCX dan foydalaning.'),
        });
        return;
      }
      if (ae.size > 10 * 1024 * 1024) {
        K({
          ...k,
          [T.id]: d('File is larger than 10 MB.', 'Fayl 10 MB dan katta.'),
        });
        return;
      }
      (K({
        ...k,
        [T.id]: '',
      }),
        r(x.id, T.id, {
          attachment: {
            name: ae.name,
            size: ae.size,
          },
        }),
        c(
          d(
            `Attached “${ae.name}” (name only — the file stays on your device)`,
            `“${ae.name}” biriktirildi (faqat nomi — fayl qurilmangizda qoladi)`,
          ),
        ));
    },
    _ = () => {
      if (!C.trim()) {
        A(d('Give the task a name.', 'Vazifaga nom bering.'));
        return;
      }
      (o(x.id, C.trim(), g || void 0), v(''), b(''), A(''), c(d('Task added', 'Vazifa qo‘shildi')));
    },
    de =
      f.kind === 'closed' ? (
        <Callout tone="bad" icon={<CircleX size={16} />}>
          {d(
            'The deadline for this cycle has passed or the call is closed. You can keep preparing for the next round, but no submission date is assumed.',
            'Bu sikl muddati o‘tgan yoki qabul yopilgan. Keyingi qabulga tayyorlanishingiz mumkin, ammo topshirish sanasi taxmin qilinmaydi.',
          )}
        </Callout>
      ) : f.kind === 'not_announced' || f.kind === 'varies' || (f.kind === 'unverified' && !f.date) ? (
        <Callout tone="info">
          {d(
            'No confirmed deadline, so tasks have no suggested dates. Work through them in order, and set your own dates if you like.',
            'Tasdiqlangan muddat yo‘q, shuning uchun vazifalarga sana taklif qilinmagan. Ularni tartib bilan bajaring, xohlasangiz o‘z sanalaringizni belgilang.',
          )}
        </Callout>
      ) : f.kind === 'unverified' ? (
        <Callout tone="warn">
          {d(
            `The date ${me(f.date, m)} is not verified. Suggested dates are not set from an unverified deadline — confirm it on the official site first.`,
            `${me(f.date, m)} sanasi tasdiqlanmagan. Tasdiqlanmagan muddatdan sana taklif qilinmaydi — avval rasmiy saytda tekshiring.`,
          )}
        </Callout>
      ) : null;
  return (
    <div>
      <JS pct={I.pct} stage={x.stage} planId={x.id} />
      <button
        type="button"
        onClick={() => t('plans')}
        className="mb-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-fg"
      >
        <ArrowLeft size={16} />
        {p('nav.plans')}
      </button>
      <header className="mb-5 flex flex-col gap-4">
        <div>
          <p className="text-[13.5px] font-semibold text-muted">{Sn(O, m)}</p>
          <h1 className="text-[24px] font-extrabold leading-tight md:text-[28px]">{M}</h1>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label={d('Stage', 'Bosqich')} htmlFor="pd-stage">
            <Select
              id="pd-stage"
              value={x.stage}
              className="w-56"
              onChange={(T) => {
                (n(x.id, T.target.value), c(d('Stage updated', 'Bosqich yangilandi')));
              }}
            >
              {ey.map((T) => (
                <option value={T} key={T}>
                  {p(`st.${T}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={d('Importance to you', 'Siz uchun muhimligi')} htmlFor="pd-pri">
            <Select id="pd-pri" value={x.priority} className="w-40" onChange={(T) => s(x.id, T.target.value)}>
              <option value="high">{d('High', 'Yuqori')}</option>
              <option value="medium">{d('Medium', 'O‘rta')}</option>
              <option value="low">{d('Low', 'Past')}</option>
            </Select>
          </Field>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold">{p('dl.deadline')}</span>
            <DeadlineBadge opp={O} />
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => t(O.kind === 'program' ? 'university' : 'scholarship', O.id)}
            >
              {d('Opportunity details', 'Imkoniyat tafsilotlari')}
            </Button>
            {U ? (
              <span className="flex items-center gap-2 text-[13px]">
                {d('Remove this plan?', 'Rejani o‘chirasizmi?')}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    (l(x.id), c(d('Plan removed', 'Reja o‘chirildi')), t('plans'));
                  }}
                >
                  {p('a.delete')}
                </Button>
                <Button size="sm" onClick={() => j(!1)}>
                  {p('a.cancel')}
                </Button>
              </span>
            ) : (
              <Button size="sm" variant="ghost" icon={<Trash2 size={15} />} onClick={() => j(!0)}>
                {d('Remove plan', 'Rejani o‘chirish')}
              </Button>
            )}
          </div>
        </div>
        <div className="max-w-md">
          <div className="mb-1 flex justify-between text-[13px]">
            <span className="font-semibold">{d('Required tasks complete', 'Bajarilgan majburiy vazifalar')}</span>
            <span className="tabular">
              {I.doneTasks}
              {' / '}
              {I.totalTasks}
            </span>
          </div>
          <ProgressBar value={I.pct} tone="ok" />
        </div>
        {de}
      </header>
      <div className="mb-5">
        <Tabs
          value={y}
          onChange={E}
          items={[
            {
              id: 'check',
              label: d('5 · Checklist', '5 · Ro‘yxat'),
              count: x.tasks.filter((T) => !T.done).length,
            },
            {
              id: 'req',
              label: d('1–3 · Requirements & readiness', '1–3 · Talablar va tayyorlik'),
            },
            {
              id: 'timeline',
              label: d('4 · Timeline', '4 · Jadval'),
            },
            {
              id: 'final',
              label: d('6 · Final review', '6 · Yakuniy tekshiruv'),
            },
          ]}
        />
      </div>
      {y === 'req' && (
        <div className="flex flex-col gap-5">
          <div className="flex items-end gap-3">
            <Mascot
              framing="head"
              action="explain"
              actionKey={x.id}
              className={a.mascot ? 'h-[72px] w-[72px] shrink-0' : 'h-[72px] w-[128px] shrink-0'}
              label={d('EduBridge guide', 'EduBridge yo‘lboshchisi')}
            />
            <SpeechBubble className="max-w-2xl font-medium">
              {d(
                'Here is each requirement and where you stand. Green looks done, red is missing, blue needs checking on the official page.',
                'Har bir talab va sizning holatingiz shu yerda. Yashil — bajarilgan, qizil — yetishmaydi, ko‘k — rasmiy sahifada tekshirish kerak.',
              )}
            </SpeechBubble>
          </div>
          <Card className="overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <p className="font-bold">
                {d(
                  'Step 1 · Requirement analysis and Step 2 · Readiness',
                  '1-qadam · Talablar tahlili va 2-qadam · Tayyorlik',
                )}
              </p>
              <p className="text-[13px] text-muted">
                {d(
                  'Built from this opportunity’s own record. Mandatory and optional items are marked.',
                  'Ushbu imkoniyatning o‘z yozuvidan tuzilgan. Majburiy va ixtiyoriy bandlar belgilangan.',
                )}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-[14px]">
                <thead className="bg-sunken text-[12.5px] text-muted">
                  <tr>
                    <th className="px-4 py-2 font-semibold">{d('Requirement', 'Talab')}</th>
                    <th className="px-4 py-2 font-semibold">{d('Type', 'Turi')}</th>
                    <th className="px-4 py-2 font-semibold">{d('Your status', 'Holatingiz')}</th>
                  </tr>
                </thead>
                <tbody>
                  {N.map((T, ae) => (
                    <tr className="border-t border-line align-top" key={ae}>
                      <td className="px-4 py-2.5 font-semibold">
                        {h(T.label)}
                        <p className="mt-0.5 text-[12.5px] font-normal text-muted">{h(T.why)}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={T.mandatory ? 'navy' : 'neutral'}>
                          {T.mandatory ? p('m.required') : p('m.optional')}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 font-semibold">
                          <StatusIcon status={T.status === 'verify' ? 'verify' : T.status} />
                          {d(...ZS[T.status])}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card className="p-4">
            <p className="font-bold">
              {d('Step 3 · What is missing and how to resolve it', '3-qadam · Nima yetishmaydi va qanday hal qilish')}
            </p>
            <ul className="mt-3 flex flex-col gap-3">
              {N.filter((T) => T.status === 'not_satisfied' || T.status === 'verify' || T.status === 'in_progress').map(
                (T, ae) => (
                  <li className="rounded-lg border border-line p-3" key={ae}>
                    <p className="flex items-center gap-2 font-semibold">
                      <StatusIcon status={T.status === 'verify' ? 'verify' : T.status} />
                      {h(T.label)}
                    </p>
                    <p className="mt-1 text-[13.5px] text-muted">
                      <b className="text-fg">{d('Why it matters:', 'Nima uchun muhim:')}</b> {h(T.why)}
                    </p>
                    {h(T.how) && (
                      <p className="mt-1 text-[13.5px] text-muted">
                        <b className="text-fg">{d('How to resolve:', 'Qanday hal qilish:')}</b> {h(T.how)}
                      </p>
                    )}
                  </li>
                ),
              )}
              {N.every((T) => T.status === 'satisfied' || T.status === 'na') && (
                <li className="text-[14px] text-ok">
                  {d(
                    'Nothing missing according to the data we hold.',
                    'Bizdagi ma’lumotlarga ko‘ra hech narsa yetishmaydi.',
                  )}
                </li>
              )}
            </ul>
          </Card>
        </div>
      )}
      {y === 'timeline' && (
        <Card className="p-4 md:p-5">
          <p className="font-bold">{d('Step 4 · Timeline', '4-qadam · Ish jadvali')}</p>
          <p className="mb-4 text-[13px] text-muted">
            {f.kind === 'upcoming' || f.kind === 'demo'
              ? d(
                  `Counted back from ${me(O.deadline.date, m)}. Lead times allow for official documents, test results, referees, drafting, translation and a final review.`,
                  `${me(O.deadline.date, m)} sanasidan orqaga hisoblangan. Rasmiy hujjatlar, test natijalari, tavsiyalar, yozish, tarjima va yakuniy tekshiruv uchun vaqt qoldirilgan.`,
                )
              : d(
                  'No confirmed deadline: tasks are listed in a sensible order without invented dates.',
                  'Tasdiqlangan muddat yo‘q: vazifalar o‘ylab topilgan sanalarsiz mantiqiy tartibda berilgan.',
                )}
          </p>
          <ol className="relative flex flex-col gap-0 border-l-2 border-line pl-5">
            {[...x.tasks]
              .sort((T, ae) => {
                var B, Z;
                return (
                  (T.due ?? '').localeCompare(ae.due ?? '') ||
                  (((B = jl(ae.key)) == null ? void 0 : B.lead) ?? 0) -
                    (((Z = jl(T.key)) == null ? void 0 : Z.lead) ?? 0)
                );
              })
              .map((T) => {
                const ae = T.due && !T.done && ai(F, T.due) < 0,
                  B = T.due === F && !T.done;
                return (
                  <li className="relative pb-4" key={T.id}>
                    <span
                      className={classNames(
                        'absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-surface',
                        T.done ? 'bg-ok' : ae || B ? 'bg-bad' : 'bg-navy',
                      )}
                      aria-hidden={!0}
                    />
                    <p className={classNames('font-semibold', T.done && 'text-muted line-through')}>
                      {h(taskTitle(T))}
                    </p>
                    <p className="tabular text-[12.5px] text-muted">
                      {T.due
                        ? `${me(T.due, m)} · ${T.dueSource === 'student' ? d('your date', 'sizning sanangiz') : d('suggested', 'tavsiya etilgan')}`
                        : d('No date', 'Sanasiz')}
                      {B && (
                        <span className="ml-2 font-semibold text-bad">
                          {d('Already tight — start now', 'Vaqt ziq — hoziroq boshlang')}
                        </span>
                      )}
                    </p>
                  </li>
                );
              })}
          </ol>
          {O.deadline.date && (f.kind === 'upcoming' || f.kind === 'demo') && (
            <div className="mt-2 rounded-lg bg-navy-soft px-3 py-2 text-[13.5px] font-semibold text-navy">
              {d('Submission deadline', 'Topshirish muddati')}
              {': '}
              {me(O.deadline.date, m)}
              {O.deadline.time ? ` ${O.deadline.time} ${O.deadline.tz ?? ''}` : ''}
            </div>
          )}
        </Card>
      )}
      {y === 'check' && (
        <div className="flex flex-col gap-4">
          <Card className="overflow-hidden">
            <ul>
              {D.map((T) => {
                const ae = jl(T.key),
                  B = T.due && !T.done && ai(F, T.due) < 0;
                return (
                  <li className="border-b border-line px-4 py-3 last:border-0" key={T.id}>
                    <div className="flex items-start gap-3">
                      <input
                        id={`t-${T.id}`}
                        type="checkbox"
                        checked={T.done}
                        onChange={() => {
                          (r(x.id, T.id, {
                            done: !T.done,
                          }),
                            c(
                              T.done
                                ? d('Task reopened', 'Vazifa qayta ochildi')
                                : d(
                                    'Task completed — dashboard progress updated',
                                    'Vazifa bajarildi — panel yangilandi',
                                  ),
                            ));
                        }}
                        className="mt-1 h-[18px] w-[18px] shrink-0 accent-[rgb(var(--teal))]"
                      />
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor={`t-${T.id}`}
                          className={classNames('cursor-pointer font-semibold', T.done && 'text-muted line-through')}
                        >
                          {h(taskTitle(T))}
                        </label>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px]">
                          <Badge tone={T.mandatory ? 'navy' : 'neutral'}>
                            {T.mandatory ? p('m.required') : p('m.optional')}
                          </Badge>
                          {T.due && (
                            <span className={classNames('tabular', B ? 'font-semibold text-bad' : 'text-muted')}>
                              {d('Due', 'Muddat')} {me(T.due, m)}
                              {T.dueSource === 'suggested' ? ` (${d('suggested', 'tavsiya')})` : ''}
                            </span>
                          )}
                          {T.attachment && (
                            <span className="inline-flex items-center gap-1 text-muted">
                              <Paperclip size={12} />
                              {T.attachment.name}
                            </span>
                          )}
                          {T.notes && (
                            <span className="inline-flex items-center gap-1 text-muted">
                              <StickyNote size={12} />
                              {d('Has notes', 'Izoh bor')}
                            </span>
                          )}
                        </div>
                        {ae && !T.done && <p className="mt-1 text-[13px] text-muted">{h(ae.how)}</p>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {T.done && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<RotateCcw size={14} />}
                            onClick={() =>
                              r(x.id, T.id, {
                                done: !1,
                              })
                            }
                            aria-label={d('Reopen', 'Qayta ochish')}
                          />
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => w(q === T.id ? null : T.id)}
                          aria-expanded={q === T.id}
                        >
                          {d('Details', 'Batafsil')}
                        </Button>
                      </div>
                    </div>
                    {q === T.id && (
                      <div className="mt-3 grid gap-3 rounded-lg bg-sunken p-3 sm:grid-cols-2">
                        <Field label={d('Notes', 'Izohlar')} htmlFor={`n-${T.id}`}>
                          <Textarea
                            id={`n-${T.id}`}
                            className="min-h-[70px]"
                            value={T.notes}
                            onChange={(Z) =>
                              r(x.id, T.id, {
                                notes: Z.target.value,
                              })
                            }
                          />
                        </Field>
                        <div className="flex flex-col gap-3">
                          <Field
                            label={d('My deadline for this task', 'Bu vazifa uchun mening muddatim')}
                            htmlFor={`d-${T.id}`}
                          >
                            <Input
                              id={`d-${T.id}`}
                              type="date"
                              value={T.due ?? ''}
                              onChange={(Z) =>
                                r(x.id, T.id, {
                                  due: Z.target.value || void 0,
                                  dueSource: Z.target.value ? 'student' : void 0,
                                })
                              }
                            />
                          </Field>
                          <div>
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold hover:bg-sunken">
                              <Paperclip size={14} />
                              {T.attachment
                                ? d('Replace file', 'Faylni almashtirish')
                                : d('Attach file', 'Fayl biriktirish')}
                              <input
                                type="file"
                                className="sr-only"
                                accept=".pdf,.png,.jpg,.jpeg,.docx"
                                onChange={(Z) => {
                                  var oe;
                                  return R(T, (oe = Z.target.files) == null ? void 0 : oe[0]);
                                }}
                              />
                            </label>
                            {T.attachment && (
                              <button
                                type="button"
                                className="ml-2 text-[12.5px] text-bad hover:underline"
                                onClick={() =>
                                  r(x.id, T.id, {
                                    attachment: void 0,
                                  })
                                }
                              >
                                {d('Remove file', 'Faylni olib tashlash')}
                              </button>
                            )}
                            {k[T.id] && (
                              <p className="mt-1 text-[12.5px] font-semibold text-bad" role="alert">
                                {k[T.id]}
                              </p>
                            )}
                            <p className="mt-1 text-[11.5px] text-faint">
                              {d(
                                'Only the file name is recorded. Nothing is uploaded.',
                                'Faqat fayl nomi yoziladi. Hech narsa yuklanmaydi.',
                              )}
                            </p>
                          </div>
                          {T.category === 'custom' && (
                            <Button
                              size="sm"
                              variant="danger"
                              icon={<Trash2 size={14} />}
                              onClick={() => u(x.id, T.id)}
                            >
                              {d('Delete task', 'Vazifani o‘chirish')}
                            </Button>
                          )}
                          {T.category === 'essay' && (
                            <Button size="sm" icon={<PenLine size={14} />} onClick={() => t('writing', O.id)}>
                              {d('Open writing tutor', 'Yozish yordamchisi')}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card className="p-4">
            <p className="mb-3 font-bold">{d('Add your own task', 'O‘z vazifangizni qo‘shing')}</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
              <Field label={d('Task', 'Vazifa')} htmlFor="nt-title" error={S}>
                <Input
                  id="nt-title"
                  value={C}
                  onChange={(T) => v(T.target.value)}
                  onKeyDown={(T) => T.key === 'Enter' && _()}
                  placeholder={d(
                    'e.g. Ask school for a stamped grade sheet',
                    'masalan, maktabdan muhrlangan baholar varaqasini so‘rash',
                  )}
                />
              </Field>
              <Field label={d('Due date', 'Muddat')} htmlFor="nt-due" optional={!0}>
                <Input id="nt-due" type="date" value={g} onChange={(T) => b(T.target.value)} />
              </Field>
              <Button variant="primary" icon={<Plus size={16} />} onClick={_}>
                {p('a.add')}
              </Button>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-faint">
              <CalendarPlus size={13} />
              {d(
                'Tasks with dates appear in your calendar and reminders.',
                'Sanali vazifalar taqvim va eslatmalarda ko‘rinadi.',
              )}
            </p>
          </Card>
        </div>
      )}
      {y === 'final' && (
        <Card className="p-5">
          <p className="font-bold">{d('Step 6 · Final review', '6-qadam · Yakuniy tekshiruv')}</p>
          <div
            className={classNames(
              'mt-3 flex gap-3 rounded-lg border p-4',
              I.ready ? 'border-ok/30 bg-ok-soft' : 'border-warn/30 bg-warn-soft',
            )}
          >
            {I.ready ? <CircleCheck className="text-ok" /> : <CircleAlert className="text-warn" />}
            <div>
              <p className="font-bold">
                {I.ready
                  ? d(
                      'Every listed requirement is marked complete.',
                      'Barcha ko‘rsatilgan talablar bajarilgan deb belgilangan.',
                    )
                  : d('Not ready to submit yet.', 'Hali topshirishga tayyor emas.')}
              </p>
              <ul className="mt-1 list-disc pl-5 text-[14px]">
                {I.totalTasks - I.doneTasks > 0 && (
                  <li>
                    {d(
                      `${I.totalTasks - I.doneTasks} required task(s) still open`,
                      `${I.totalTasks - I.doneTasks} ta majburiy vazifa bajarilmagan`,
                    )}
                  </li>
                )}
                {I.blocking > 0 && (
                  <li>{d(`${I.blocking} requirement(s) not satisfied`, `${I.blocking} ta talab bajarilmagan`)}</li>
                )}
                {I.toVerify > 0 && (
                  <li>
                    {d(
                      `${I.toVerify} requirement(s) need checking against the official call`,
                      `${I.toVerify} ta talabni rasmiy e’lon bilan tekshirish kerak`,
                    )}
                  </li>
                )}
                {I.ready && (
                  <li>
                    {d(
                      'Still compare every upload with the official instructions before you submit. You are responsible for your final submission.',
                      'Topshirishdan oldin har bir faylni rasmiy ko‘rsatmalar bilan solishtiring. Yakuniy ariza uchun o‘zingiz javobgarsiz.',
                    )}
                  </li>
                )}
              </ul>
            </div>
          </div>
          <ul className="mt-4 flex flex-col gap-2 text-[14px]">
            {[
              d(
                'Names match your passport exactly on every document',
                'Barcha hujjatlarda ismlar pasport bilan bir xil',
              ),
              d(
                'Every file opens and is in the requested format and size',
                'Har bir fayl ochiladi va talab qilingan format va hajmda',
              ),
              d('Translations are certified where required', 'Kerak bo‘lsa, tarjimalar tasdiqlangan'),
              d(
                'Statement is within the word limit and answers the official prompt',
                'Motivatsion xat so‘z chegarasida va rasmiy savolga javob beradi',
              ),
              d('Referees have confirmed submission', 'Tavsiya beruvchilar topshirganini tasdiqlagan'),
              d(
                'You saved the confirmation page or email after submitting',
                'Topshirgandan keyin tasdiq sahifasi yoki xatini saqladingiz',
              ),
            ].map((T) => (
              <li className="flex gap-2" key={T}>
                <StatusIcon status="verify" />
                {T}
              </li>
            ))}
          </ul>
          <Cmp$g o={O} className="mt-4" />
          {I.ready && x.stage !== 'submitted' && (
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => {
                (n(x.id, 'submitted'), c(d('Marked as submitted', 'Topshirilgan deb belgilandi')));
              }}
            >
              {d('I have submitted — update stage', 'Topshirdim — bosqichni yangilash')}
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
export const Wi = {
  scholarship: {
    dot: 'bg-teal',
    label: ['Scholarship deadline', 'Grant muddati'],
  },
  university: {
    dot: 'bg-navy',
    label: ['University deadline', 'Universitet muddati'],
  },
  exam: {
    dot: 'bg-info',
    label: ['Exam date', 'Imtihon sanasi'],
  },
  document: {
    dot: 'bg-warn',
    label: ['Document task', 'Hujjat vazifasi'],
  },
  reference: {
    dot: 'bg-[rgb(168_85_247)]',
    label: ['Recommendation request', 'Tavsiyanoma so‘rovi'],
  },
  milestone: {
    dot: 'bg-ok',
    label: ['Personal milestone', 'Shaxsiy bosqich'],
  },
};
