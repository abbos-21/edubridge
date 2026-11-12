import { useState } from 'react';
import { ArrowLeft, CalendarDays, Check, CheckCircle2, CircleHelp, Paperclip, Plus, RotateCcw, StickyNote, Trash2, TriangleAlert, XCircle } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useStore } from '../store/AppStore';
import { useCatalog } from '../data/CatalogProvider';
import { daysBetween, todayISO } from '../lib/deadlines';
import { formatDate } from '../lib/format';
import { href, navigate } from '../lib/router';
import { PROGRESS_STAGES, STAGES, STAGE_LABEL, TASKS, grantOpp, newId, newPlan, progress, readiness, requirementRows, taskTitle, uniOpp, urgency, type Opp, type Plan, type ReqStatus, type Task } from '../lib/plans';
import { useToast, milestone } from '../components/Toasts';
import { Badge, Button, Card, Field, Input, Notice, PageHeader, Progress, Select, Tabs, Textarea, buttonClass, cx } from '../components/ui';

/** The thing a plan is for, read from the catalogue. Undefined when the record no longer exists. */
export function useOpp(plan: Pick<Plan, 'kind' | 'oppId' | 'level'>): Opp | undefined {
  const cat = useCatalog();
  if (plan.kind === 'grant') {
    const g = cat.grants.find((x) => x.id === plan.oppId);
    return g ? grantOpp(g) : undefined;
  }
  const u = cat.universities.find((x) => x.id === plan.oppId);
  return u ? uniOpp(u, plan.level ?? 'bachelor') : undefined;
}

function useCountryName() {
  const cat = useCatalog();
  const { pick } = useI18n();
  return (code: string) => pick(cat.countries.find((c) => c.code === code)?.name) || code;
}

/** Days-left badge for an opportunity: only a confirmed date is shown as a date. */
export function DeadlineBadge({ opp }: { opp: Opp }) {
  const { tx, lang } = useI18n();
  if (opp.deadline) {
    const d = daysBetween(todayISO(), opp.deadline.date);
    if (d < 0) return <Badge tone="bad">{tx('Closed', 'Yopilgan')} · {formatDate(opp.deadline.date, lang)}</Badge>;
    return <Badge tone={d <= 3 ? 'bad' : d <= 14 ? 'warn' : 'ok'}>{d === 0 ? tx('Today', 'Bugun') : tx('{0} days left', '{0} kun qoldi', d)} · {formatDate(opp.deadline.date, lang)}</Badge>;
  }
  if (opp.unverifiedDate) return <Badge tone="warn">{tx('Not verified', 'Tasdiqlanmagan')} · {formatDate(opp.unverifiedDate, lang)}</Badge>;
  return <Badge>{tx('Deadline not confirmed', 'Muddat tasdiqlanmagan')}</Badge>;
}

const STAGE = (tx: (a: string, b: string) => string, s: (typeof STAGES)[number]) => tx(STAGE_LABEL[s][0], STAGE_LABEL[s][1]);

/** A button that opens the plan for this opportunity, creating it first if there is none. */
export function AddToPlan({ opp }: { opp: Opp }) {
  const { tx } = useI18n();
  const { plans, addPlan, profile } = useStore();
  const notify = useToast();
  const existing = plans.find((p) => p.oppId === opp.id && p.level === opp.level);
  if (existing) return <a href={href('plan', existing.id)} className={buttonClass('secondary')}><Check size={16} aria-hidden />{tx('In your plans — open', 'Rejalaringizda — ochish')}</a>;
  return (
    <Button variant="primary" onClick={() => { const p = newPlan(opp, profile); addPlan(p); notify(tx('Plan created with a checklist. Confirm every requirement in the official call.', 'Reja ro‘yxat bilan yaratildi. Har bir talabni rasmiy e’londa tasdiqlang.')); navigate('plan', p.id); }}>
      <Plus size={16} aria-hidden />{tx('Add to plan', 'Rejaga qo‘shish')}
    </Button>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const { tx, pick } = useI18n();
  const opp = useOpp(plan);
  const country = useCountryName();
  if (!opp) return null;
  const pr = progress(plan);
  const next = plan.tasks.find((t) => !t.done);
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-semibold text-muted">{country(opp.country)}{opp.level ? ` · ${opp.level === 'bachelor' ? tx('Bachelor', 'Bakalavr') : tx('Master', 'Magistr')}` : ''}</p>
          <h2 className="font-bold leading-snug">{opp.name}</h2>
        </div>
        <Badge tone={plan.priority === 'high' ? 'bad' : plan.priority === 'low' ? 'neutral' : 'brand'}>{plan.priority === 'high' ? tx('High priority', 'Yuqori muhim') : plan.priority === 'low' ? tx('Low priority', 'Past muhim') : tx('Medium priority', 'O‘rta muhim')}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2"><Badge tone="teal">{STAGE(tx, plan.stage)}</Badge><DeadlineBadge opp={opp} /></div>
      <div>
        <div className="mb-1 flex justify-between text-[12.5px] text-muted"><span>{tx('Required tasks', 'Majburiy vazifalar')}</span><span className="tabular">{pr.done} / {pr.total}</span></div>
        <Progress value={pr.pct} label={tx('Required tasks', 'Majburiy vazifalar')} />
      </div>
      {next && <p className="text-[13.5px] text-muted">{tx('Next:', 'Keyingi:')} <span className="font-semibold text-fg">{pick(taskTitle(next))}</span></p>}
      <a href={href('plan', plan.id)} className={cx(buttonClass('primary', 'sm'), 'mt-auto self-start')}>{tx('Open plan', 'Rejani ochish')}</a>
    </Card>
  );
}

export function PlansPage() {
  const { tx } = useI18n();
  const { plans } = useStore();
  const cat = useCatalog();
  const today = todayISO();
  const opps = new Map<string, Opp | undefined>();
  for (const p of plans) opps.set(p.id, p.kind === 'grant' ? (cat.grants.find((g) => g.id === p.oppId) ? grantOpp(cat.grants.find((g) => g.id === p.oppId)!) : undefined) : (() => { const u = cat.universities.find((x) => x.id === p.oppId); return u ? uniOpp(u, p.level ?? 'bachelor') : undefined; })());
  const sorted = [...plans].sort((a, b) => urgency(a, opps.get(a.id), today) - urgency(b, opps.get(b.id), today));
  return (
    <div>
      <PageHeader eyebrow={tx('Application plans', 'Ariza rejalari')} title={tx('Your application plans', 'Ariza rejalaringiz')} actions={<a href={href('scholarships')} className={buttonClass('secondary')}>{tx('Add from scholarships', 'Grantlardan qo‘shish')}</a>}>
        {tx('Ordered by urgency: time remaining, the priority you set and the work still outstanding.', 'Shoshilinchlik bo‘yicha tartiblangan: qolgan vaqt, siz belgilagan muhimlik va qolgan ishlar.')}
      </PageHeader>
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-10 text-center">
          <p className="font-bold">{tx('No plans yet', 'Hali rejalar yo‘q')}</p>
          <p className="mx-auto mt-1 max-w-md text-[14px] text-muted">{tx('Choose a university or scholarship and press “Add to plan”. EduBridge builds a checklist for it.', 'Universitet yoki grantni tanlab, “Rejaga qo‘shish”ni bosing. EduBridge uning uchun ro‘yxat tuzadi.')}</p>
          <a href={href('universities')} className={cx(buttonClass('primary'), 'mt-4')}>{tx('Universities', 'Universitetlar')}</a>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">{sorted.map((p) => <PlanCard key={p.id} plan={p} />)}</div>
      )}
    </div>
  );
}

const STATUS: Record<ReqStatus, [string, string]> = { satisfied: ['Satisfied', 'Bajarilgan'], not_satisfied: ['Not satisfied', 'Bajarilmagan'], in_progress: ['In progress', 'Jarayonda'], verify: ['Needs verification', 'Tekshirish kerak'], na: ['Not applicable', 'Tegishli emas'] };
function StatusIcon({ s }: { s: ReqStatus }) {
  const c = s === 'satisfied' ? 'text-ok' : s === 'not_satisfied' ? 'text-bad' : s === 'verify' ? 'text-info' : 'text-muted';
  const I = s === 'satisfied' ? CheckCircle2 : s === 'not_satisfied' ? XCircle : s === 'verify' ? CircleHelp : CircleHelp;
  return <I size={16} className={c} aria-hidden />;
}

type Tab = 'check' | 'req' | 'timeline' | 'final';

export function PlanDetail({ id }: { id: string }) {
  const { tx, pick, lang } = useI18n();
  const store = useStore();
  const notify = useToast();
  const plan = store.plans.find((p) => p.id === id);
  const opp = useOpp(plan ?? { kind: 'university', oppId: '', level: undefined });
  const [tab, setTab] = useState<Tab>('check');
  const [open, setOpen] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [err, setErr] = useState('');
  const [fileErr, setFileErr] = useState<Record<string, string>>({});
  const [confirmDel, setConfirmDel] = useState(false);
  const country = useCountryName();
  const profile = store.profile;
  const today = todayISO();

  if (!plan || !opp) {
    return (
      <div className="py-10 text-center">
        <h1 className="text-xl font-extrabold">{tx('Plan not found', 'Reja topilmadi')}</h1>
        <a href={href('plans')} className={cx(buttonClass('secondary'), 'mt-4')}>{tx('Application plans', 'Ariza rejalari')}</a>
      </div>
    );
  }
  const rows = requirementRows(opp, plan, profile);
  const rd = readiness(plan, rows);
  const tasks = [...plan.tasks].sort((a, b) => Number(a.done) - Number(b.done) || (a.due ?? '9999').localeCompare(b.due ?? '9999'));
  const dl = opp.deadline ? daysBetween(today, opp.deadline.date) : null;

  const toggleDone = (t: Task) => {
    const after = progress({ ...plan, tasks: plan.tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)) });
    store.updateTask(plan.id, t.id, { done: !t.done });
    const m = t.done ? null : milestone({ pct: rd.pct, stage: plan.stage }, { pct: after.pct, stage: plan.stage }, tx);
    notify(m ?? (t.done ? tx('Task reopened', 'Vazifa qayta ochildi') : tx('Task completed — dashboard progress updated', 'Vazifa bajarildi — panel yangilandi')), { celebrate: !!m });
  };
  const attach = (t: Task, f?: File) => {
    if (!f) return;
    if (!['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(f.type)) return setFileErr({ ...fileErr, [t.id]: tx('Use PDF, PNG, JPG or DOCX.', 'PDF, PNG, JPG yoki DOCX dan foydalaning.') });
    if (f.size > 10 * 1024 * 1024) return setFileErr({ ...fileErr, [t.id]: tx('File is larger than 10 MB.', 'Fayl 10 MB dan katta.') });
    setFileErr({ ...fileErr, [t.id]: '' });
    store.updateTask(plan.id, t.id, { attachment: { name: f.name, size: f.size } });
  };
  const addTask = () => {
    if (!title.trim()) return setErr(tx('Give the task a name.', 'Vazifaga nom bering.'));
    notify(tx('Task added', 'Vazifa qo‘shildi'));
    store.addTask(plan.id, { id: newId(), title: title.trim(), category: 'custom', mandatory: false, done: false, notes: '', due: due || undefined, dueSource: due ? 'student' : undefined });
    setTitle(''); setDue(''); setErr('');
  };

  const banner =
    opp.deadline && dl != null && dl < 0 ? <Notice tone="warn">{tx('The deadline for this cycle has passed. You can keep preparing for the next round, but no submission date is assumed.', 'Bu sikl muddati o‘tgan. Keyingi qabulga tayyorlanishingiz mumkin, ammo topshirish sanasi taxmin qilinmaydi.')}</Notice>
    : opp.unverifiedDate ? <Notice tone="warn">{tx('The date {0} is not verified, so tasks have no suggested dates. Confirm it on the official site first.', '{0} sanasi tasdiqlanmagan, shuning uchun vazifalarga sana taklif qilinmagan. Avval rasmiy saytda tekshiring.', formatDate(opp.unverifiedDate, lang) ?? '')}</Notice>
    : !opp.deadline ? <Notice>{tx('No confirmed deadline, so tasks have no suggested dates. Work through them in order, and set your own dates if you like.', 'Tasdiqlangan muddat yo‘q, shuning uchun vazifalarga sana taklif qilinmagan. Ularni tartib bilan bajaring, xohlasangiz o‘z sanalaringizni belgilang.')}</Notice>
    : null;

  return (
    <div>
      <a href={href('plans')} className="mb-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted no-underline hover:text-fg"><ArrowLeft size={16} aria-hidden />{tx('Application plans', 'Ariza rejalari')}</a>
      <header className="mb-5 flex flex-col gap-4">
        <div>
          <p className="text-[13.5px] font-semibold text-muted">{country(opp.country)}{opp.level ? ` · ${opp.level === 'bachelor' ? tx('Bachelor', 'Bakalavr') : tx('Master', 'Magistr')}` : ''}</p>
          <h1 className="text-[24px] font-extrabold leading-tight md:text-[28px]">{opp.name}</h1>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label={tx('Stage', 'Bosqich')}>
            <Select value={plan.stage} className="w-56" onChange={(e) => { const stage = e.target.value as Plan['stage']; store.setStage(plan.id, stage); notify(milestone({ pct: rd.pct, stage: plan.stage }, { pct: rd.pct, stage }, tx) ?? tx('Stage updated', 'Bosqich yangilandi'), { celebrate: stage === 'submitted' }); }}>
              {STAGES.map((s) => <option key={s} value={s}>{STAGE(tx, s)}</option>)}
            </Select>
          </Field>
          <Field label={tx('Importance to you', 'Siz uchun muhimligi')}>
            <Select value={plan.priority} className="w-40" onChange={(e) => store.setPriority(plan.id, e.target.value as Plan['priority'])}>
              <option value="high">{tx('High', 'Yuqori')}</option><option value="medium">{tx('Medium', 'O‘rta')}</option><option value="low">{tx('Low', 'Past')}</option>
            </Select>
          </Field>
          <div className="flex flex-col gap-1.5"><span className="text-[13px] font-semibold">{tx('Deadline', 'Muddat')}</span><DeadlineBadge opp={opp} /></div>
          <div className="ml-auto flex flex-wrap gap-2">
            <a href={opp.link} className={buttonClass('ghost', 'sm')}>{tx('Details', 'Tafsilotlar')}</a>
            {confirmDel ? (
              <span className="flex items-center gap-2 text-[13px]">{tx('Remove this plan?', 'Rejani o‘chirasizmi?')}
                <Button size="sm" onClick={() => { store.removePlan(plan.id); notify(tx('Plan removed', 'Reja o‘chirildi')); navigate('plans'); }} className="!text-bad">{tx('Delete', 'O‘chirish')}</Button>
                <Button size="sm" onClick={() => setConfirmDel(false)}>{tx('Cancel', 'Bekor qilish')}</Button>
              </span>
            ) : <Button size="sm" variant="ghost" onClick={() => setConfirmDel(true)}><Trash2 size={15} aria-hidden />{tx('Remove plan', 'Rejani o‘chirish')}</Button>}
          </div>
        </div>
        <div className="max-w-md">
          <div className="mb-1 flex justify-between text-[13px]"><span className="font-semibold">{tx('Required tasks complete', 'Bajarilgan majburiy vazifalar')}</span><span className="tabular">{rd.done} / {rd.total}</span></div>
          <Progress value={rd.pct} tone="ok" label={tx('Required tasks complete', 'Bajarilgan majburiy vazifalar')} />
        </div>
        {banner}
      </header>

      <div className="mb-5">
        <Tabs<Tab> label={tx('Plan sections', 'Reja bo‘limlari')} value={tab} onChange={setTab} tabs={[
          { id: 'check', label: `${tx('Checklist', 'Ro‘yxat')} (${plan.tasks.filter((t) => !t.done).length})` },
          { id: 'req', label: tx('Requirements', 'Talablar') },
          { id: 'timeline', label: tx('Timeline', 'Jadval') },
          { id: 'final', label: tx('Final review', 'Yakuniy tekshiruv') },
        ]} />
      </div>

      {tab === 'req' && (
        <div className="flex flex-col gap-5">
          <Card className="overflow-hidden !p-0 sm:!p-0">
            <div className="border-b border-line px-4 py-3">
              <p className="font-bold">{tx('Requirements and where you stand', 'Talablar va sizning holatingiz')}</p>
              <p className="text-[13px] text-muted">{tx('Built from this record and your profile. Where the data cannot decide, it says “needs verification”.', 'Ushbu yozuv va profilingizdan tuzilgan. Ma’lumot hal qila olmasa, “tekshirish kerak” deyiladi.')}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-[14px]">
                <thead className="bg-sunken text-[12.5px] text-muted"><tr><th className="px-4 py-2 font-semibold">{tx('Requirement', 'Talab')}</th><th className="px-4 py-2 font-semibold">{tx('Type', 'Turi')}</th><th className="px-4 py-2 font-semibold">{tx('Your status', 'Holatingiz')}</th></tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-line align-top">
                      <td className="px-4 py-2.5 font-semibold">{pick(r.label)}<p className="mt-0.5 text-[12.5px] font-normal text-muted">{pick(r.why)}</p></td>
                      <td className="px-4 py-2.5"><Badge tone={r.mandatory ? 'brand' : 'neutral'}>{r.mandatory ? tx('Required', 'Majburiy') : tx('Check if required', 'Talab qilinsa')}</Badge></td>
                      <td className="px-4 py-2.5"><span className="inline-flex items-center gap-1.5 font-semibold"><StatusIcon s={r.status} />{tx(STATUS[r.status][0], STATUS[r.status][1])}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <p className="font-bold">{tx('What is missing and how to resolve it', 'Nima yetishmaydi va qanday hal qilish')}</p>
            <ul className="mt-3 flex flex-col gap-3">
              {rows.filter((r) => r.status === 'not_satisfied' || r.status === 'verify' || r.status === 'in_progress').map((r, i) => (
                <li key={i} className="rounded-lg border border-line p-3">
                  <p className="flex items-center gap-2 font-semibold"><StatusIcon s={r.status} />{pick(r.label)}</p>
                  <p className="mt-1 text-[13.5px] text-muted"><b className="text-fg">{tx('Why it matters:', 'Nima uchun muhim:')}</b> {pick(r.why)}</p>
                  {pick(r.how) && <p className="mt-1 text-[13.5px] text-muted"><b className="text-fg">{tx('How to resolve:', 'Qanday hal qilish:')}</b> {pick(r.how)}</p>}
                </li>
              ))}
              {rows.every((r) => r.status === 'satisfied' || r.status === 'na') && <li className="text-[14px] text-ok">{tx('Nothing missing according to the data we hold.', 'Bizdagi ma’lumotlarga ko‘ra hech narsa yetishmaydi.')}</li>}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'timeline' && (
        <Card>
          <p className="font-bold">{tx('Timeline', 'Ish jadvali')}</p>
          <p className="mb-4 text-[13px] text-muted">{opp.deadline && dl != null && dl >= 0 ? tx('Counted back from {0}. Lead times allow for documents, test results, referees, drafting, translation and a final review.', '{0} sanasidan orqaga hisoblangan. Hujjatlar, test natijalari, tavsiyalar, yozish, tarjima va yakuniy tekshiruv uchun vaqt qoldirilgan.', formatDate(opp.deadline.date, lang) ?? '') : tx('No confirmed deadline: tasks are listed in a sensible order without invented dates.', 'Tasdiqlangan muddat yo‘q: vazifalar o‘ylab topilgan sanalarsiz mantiqiy tartibda berilgan.')}</p>
          <ol className="relative flex flex-col border-l-2 border-line pl-5">
            {[...plan.tasks].sort((a, b) => (a.due ?? '').localeCompare(b.due ?? '') || (TASKS[b.key ?? '']?.lead ?? 0) - (TASKS[a.key ?? '']?.lead ?? 0)).map((t) => {
              const late = !!t.due && !t.done && t.due < today;
              const tight = t.due === today && !t.done;
              return (
                <li key={t.id} className="relative pb-4">
                  <span className={cx('absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-surface', t.done ? 'bg-ok' : late || tight ? 'bg-bad' : 'bg-navy')} aria-hidden />
                  <p className={cx('font-semibold', t.done && 'text-muted line-through')}>{pick(taskTitle(t))}</p>
                  <p className="tabular text-[12.5px] text-muted">{t.due ? `${formatDate(t.due, lang)} · ${t.dueSource === 'student' ? tx('your date', 'sizning sanangiz') : tx('suggested', 'tavsiya etilgan')}` : tx('No date', 'Sanasiz')}{(tight || late) && <span className="ml-2 font-semibold text-bad">{tx('Already tight — start now', 'Vaqt ziq — hoziroq boshlang')}</span>}</p>
                </li>
              );
            })}
          </ol>
          {opp.deadline && dl != null && dl >= 0 && <div className="mt-2 rounded-lg bg-navy-soft px-3 py-2 text-[13.5px] font-semibold text-navy">{tx('Submission deadline', 'Topshirish muddati')}: {formatDate(opp.deadline.date, lang)}</div>}
        </Card>
      )}

      {tab === 'check' && (
        <div className="flex flex-col gap-4">
          <Card className="overflow-hidden !p-0 sm:!p-0">
            <ul>
              {tasks.map((t) => {
                const tpl = t.key ? TASKS[t.key] : undefined;
                const late = !!t.due && !t.done && t.due < today;
                return (
                  <li key={t.id} className="border-b border-line px-4 py-3 last:border-0">
                    <div className="flex items-start gap-3">
                      <input id={`t-${t.id}`} type="checkbox" checked={t.done} onChange={() => toggleDone(t)} className="mt-1 h-[18px] w-[18px] shrink-0 accent-[rgb(var(--teal))]" />
                      <div className="min-w-0 flex-1">
                        <label htmlFor={`t-${t.id}`} className={cx('cursor-pointer font-semibold', t.done && 'text-muted line-through')}>{pick(taskTitle(t))}</label>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px]">
                          <Badge tone={t.mandatory ? 'brand' : 'neutral'}>{t.mandatory ? tx('Required', 'Majburiy') : tx('Check if required', 'Talab qilinsa')}</Badge>
                          {t.due && <span className={cx('tabular', late ? 'font-semibold text-bad' : 'text-muted')}>{tx('Due', 'Muddat')} {formatDate(t.due, lang)}{t.dueSource === 'suggested' ? ` (${tx('suggested', 'tavsiya')})` : ''}</span>}
                          {t.attachment && <span className="inline-flex items-center gap-1 text-muted"><Paperclip size={12} aria-hidden />{t.attachment.name}</span>}
                          {t.notes && <span className="inline-flex items-center gap-1 text-muted"><StickyNote size={12} aria-hidden />{tx('Has notes', 'Izoh bor')}</span>}
                        </div>
                        {tpl && !t.done && <p className="mt-1 text-[13px] text-muted">{pick(tpl.how)}</p>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {t.done && <Button size="sm" variant="ghost" aria-label={tx('Reopen', 'Qayta ochish')} onClick={() => store.updateTask(plan.id, t.id, { done: false })}><RotateCcw size={14} aria-hidden /></Button>}
                        <Button size="sm" variant="ghost" aria-expanded={open === t.id} onClick={() => setOpen(open === t.id ? null : t.id)}>{tx('Details', 'Batafsil')}</Button>
                      </div>
                    </div>
                    {open === t.id && (
                      <div className="mt-3 grid gap-3 rounded-lg bg-sunken p-3 sm:grid-cols-2">
                        <Field label={tx('Notes', 'Izohlar')}><Textarea value={t.notes} onChange={(e) => store.updateTask(plan.id, t.id, { notes: e.target.value })} /></Field>
                        <div className="flex flex-col gap-3">
                          <Field label={tx('My deadline for this task', 'Bu vazifa uchun mening muddatim')}><Input type="date" value={t.due ?? ''} onChange={(e) => store.updateTask(plan.id, t.id, { due: e.target.value || undefined, dueSource: e.target.value ? 'student' : undefined })} /></Field>
                          <div>
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold hover:bg-sunken">
                              <Paperclip size={14} aria-hidden />{t.attachment ? tx('Replace file', 'Faylni almashtirish') : tx('Attach file', 'Fayl biriktirish')}
                              <input type="file" className="sr-only" accept=".pdf,.png,.jpg,.jpeg,.docx" onChange={(e) => attach(t, e.target.files?.[0])} />
                            </label>
                            {t.attachment && <button type="button" className="ml-2 text-[12.5px] text-bad hover:underline" onClick={() => store.updateTask(plan.id, t.id, { attachment: undefined })}>{tx('Remove file', 'Faylni olib tashlash')}</button>}
                            {fileErr[t.id] && <p role="alert" className="mt-1 text-[12.5px] font-semibold text-bad">{fileErr[t.id]}</p>}
                            <p className="mt-1 text-[11.5px] text-faint">{tx('Only the file name is recorded. Nothing is uploaded.', 'Faqat fayl nomi yoziladi. Hech narsa yuklanmaydi.')}</p>
                          </div>
                          {t.category === 'custom' && <Button size="sm" onClick={() => store.removeTask(plan.id, t.id)} className="self-start !text-bad"><Trash2 size={14} aria-hidden />{tx('Delete task', 'Vazifani o‘chirish')}</Button>}
                          {t.category === 'essay' && <a href={href('writing', opp.id)} className={cx(buttonClass('secondary', 'sm'), 'self-start')}>{tx('Open writing tutor', 'Yozish yordamchisi')}</a>}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card>
            <p className="mb-3 font-bold">{tx('Add your own task', 'O‘z vazifangizni qo‘shing')}</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
              <Field label={tx('Task', 'Vazifa')}><Input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} placeholder={tx('e.g. Ask school for a stamped grade sheet', 'masalan, maktabdan muhrlangan baholar varaqasini so‘rash')} /></Field>
              <Field label={tx('Due date', 'Muddat')}><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
              <Button variant="primary" onClick={addTask}><Plus size={16} aria-hidden />{tx('Add', 'Qo‘shish')}</Button>
            </div>
            {err && <p role="alert" className="mt-1 text-[13px] font-semibold text-bad">{err}</p>}
            <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-faint"><CalendarDays size={13} aria-hidden />{tx('Tasks with dates appear in your calendar and in the bell.', 'Sanali vazifalar taqvim va qo‘ng‘iroqchada ko‘rinadi.')}</p>
          </Card>
        </div>
      )}

      {tab === 'final' && (
        <Card>
          <p className="font-bold">{tx('Final review', 'Yakuniy tekshiruv')}</p>
          <div className={cx('mt-3 flex gap-3 rounded-lg border p-4', rd.ready ? 'border-ok/30 bg-ok-soft' : 'border-warn/30 bg-warn-soft')}>
            {rd.ready ? <CheckCircle2 className="text-ok" aria-hidden /> : <TriangleAlert className="text-warn" aria-hidden />}
            <div>
              <p className="font-bold">{rd.ready ? tx('Every required task is marked complete.', 'Barcha majburiy vazifalar bajarilgan deb belgilangan.') : tx('Not ready to submit yet.', 'Hali topshirishga tayyor emas.')}</p>
              <ul className="mt-1 list-disc pl-5 text-[14px]">
                {rd.total - rd.done > 0 && <li>{tx('{0} required task(s) still open', '{0} ta majburiy vazifa bajarilmagan', rd.total - rd.done)}</li>}
                {rd.blocking > 0 && <li>{tx('{0} requirement(s) not satisfied', '{0} ta talab bajarilmagan', rd.blocking)}</li>}
                {rd.toVerify > 0 && <li>{tx('{0} item(s) need checking against the official call', '{0} ta bandni rasmiy e’lon bilan tekshirish kerak', rd.toVerify)}</li>}
                {rd.ready && <li>{tx('Still compare every upload with the official instructions before you submit. You are responsible for your final submission.', 'Topshirishdan oldin har bir faylni rasmiy ko‘rsatmalar bilan solishtiring. Yakuniy ariza uchun o‘zingiz javobgarsiz.')}</li>}
              </ul>
            </div>
          </div>
          <ul className="mt-4 flex flex-col gap-2 text-[14px]">
            {[tx('Names match your passport exactly on every document', 'Barcha hujjatlarda ismlar pasport bilan bir xil'), tx('Every file opens and is in the requested format and size', 'Har bir fayl ochiladi va talab qilingan format va hajmda'), tx('Translations are certified where required', 'Kerak bo‘lsa, tarjimalar tasdiqlangan'), tx('Statement is within the word limit and answers the official prompt', 'Motivatsion xat so‘z chegarasida va rasmiy savolga javob beradi'), tx('Referees have confirmed submission', 'Tavsiya beruvchilar topshirganini tasdiqlagan'), tx('You saved the confirmation page or email after submitting', 'Topshirgandan keyin tasdiq sahifasi yoki xatini saqladingiz')].map((x) => (
              <li key={x} className="flex gap-2"><CircleHelp size={16} className="mt-0.5 shrink-0 text-info" aria-hidden />{x}</li>
            ))}
          </ul>
          <Card className="mt-4 !border-teal/30 !bg-teal-soft/25">
            <p className="font-bold">{tx('You apply directly with the university or the scholarship body.', 'Ariza to‘g‘ridan-to‘g‘ri universitet yoki grant tashkilotiga topshiriladi.')}</p>
            {opp.url && <a href={opp.url} target="_blank" rel="noopener noreferrer" className={cx(buttonClass('primary'), 'mt-2')}>{tx('Open the official page', 'Rasmiy sahifani ochish')}</a>}
            <p className="mt-2 text-[12.5px] text-muted">{tx('EduBridge never asks for your application account password. Do not share it with anyone.', 'EduBridge hech qachon ariza akkauntingiz parolini so‘ramaydi. Uni hech kimga bermang.')}</p>
          </Card>
          {rd.ready && plan.stage !== 'submitted' && <Button variant="primary" className="mt-4" onClick={() => { store.setStage(plan.id, 'submitted'); notify(milestone({ pct: rd.pct, stage: plan.stage }, { pct: rd.pct, stage: 'submitted' }, tx) ?? '', { celebrate: true }); }}>{tx('I have submitted — update stage', 'Topshirdim — bosqichni yangilash')}</Button>}
        </Card>
      )}
      <p className="mt-6 text-[12.5px] text-faint">{tx('Plans are kept in this browser. The checklist is general guidance: the official call is the only authority.', 'Rejalar shu brauzerda saqlanadi. Ro‘yxat umumiy yo‘riqnoma: yagona asosiy manba — rasmiy e’lon.')}</p>
    </div>
  );
}

export { PROGRESS_STAGES };
