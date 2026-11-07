import { useCallback, useMemo, useState } from 'react';
import { SaveAsDemo } from '../admin/SaveDemo';
import { Plus, Trash2 } from 'lucide-react';
import type { L } from '@edubridge/shared';
import { TIER_INFO } from '@edubridge/shared';
import { useI18n } from '../i18n/I18nProvider';
import { useStore } from '../store/AppStore';
import { aiJson } from '../lib/ai';
import { href } from '../lib/router';
import { checkProfile, type Status } from '../lib/growth/check';
import { CATEGORIES, IDEAS, type Cost, type Group, type Idea } from '../lib/growth/ideas';
import { buildMonthlyPlan, suggestStart } from '../lib/growth/plan';
import { rankIdeas } from '../lib/growth/rank';
import { completeness } from '../lib/profile';
import fields from '../data/fields.json';
import { Badge, Button, Card, Field, Notice, Select, Tabs } from '../components/ui';
import { AiError, AiGate, Thinking } from '../ai/AiGate';
import { useAiAction } from '../ai/useAi';

const FIELD_LABELS = fields as unknown as Record<string, L>;
type Tab = 'check' | 'ideas' | 'plan' | 'coach';

export function useStatusLabel() {
  const { tx } = useI18n();
  const label = (s: Status) => ({ strong: tx('Strong', 'Kuchli'), ok: tx('OK', 'Yaxshi'), gap: tx('Gap', 'Bo‘shliq'), unknown: tx('Not enough information', 'Ma’lumot yetarli emas') })[s];
  const tone = (s: Status) => ({ strong: 'ok', ok: 'info', gap: 'bad', unknown: 'neutral' } as const)[s];
  return { label, tone };
}

/** #adviser: the profile builder. Rule-based check and ideas work for everyone; the AI coach needs an account. */
export function Adviser() {
  const { tx, pick, t } = useI18n();
  const store = useStore();
  const p = store.profile;
  const [tab, setTab] = useState<Tab>('check');
  const [level, setLevel] = useState<'bachelor' | 'master'>(p?.targetLevel === 'bachelor' ? 'bachelor' : 'master');
  const [group, setGroup] = useState<Group>('middle');
  const [months, setMonths] = useState(6);
  const [hours, setHours] = useState(4);
  const [cost, setCost] = useState<Cost>('free');

  const check = useMemo(() => (p ? checkProfile(p, group, level) : []), [p, group, level]);
  const ranked = useMemo(() => (p ? rankIdeas(check, { level, field: p.field, group, months, hours, cost }) : []), [p, check, level, group, months, hours, cost]);

  if (!p) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-2xl font-extrabold">{tx('Profile builder', 'Profil quruvchisi')}</h1>
        <Card className="space-y-2">
          <h2 className="font-extrabold">{tx('This page uses your student profile', 'Bu sahifa sizning talaba profilingizdan foydalanadi')}</h2>
          <p className="text-sm text-muted">{tx('Create a profile (about 5 minutes) or try a fictional demo student.', 'Profil yarating (taxminan 5 daqiqa) yoki to‘qima namoyish talabasini sinab ko‘ring.')}</p>
          <div className="flex flex-wrap gap-2">
            <a href={href('onboarding')} className="inline-flex min-h-[44px] items-center rounded-xl bg-brand px-4 font-semibold text-brand-fg no-underline">{tx('Build my profile', 'Profilimni yaratish')}</a>
            <a href={href('demo')} className="inline-flex min-h-[44px] items-center rounded-xl border border-line px-4 font-semibold text-fg no-underline">{tx('Try demo', 'Namoyishni sinash')}</a>
          </div>
        </Card>
      </div>
    );
  }

  const planned = new Set(store.growth.items.map((i) => i.ideaId));
  const addIdea = (idea: Idea) => {
    if (planned.has(idea.id)) return;
    const start = suggestStart(store.growth.items, idea, months, hours);
    store.setGrowth({ ...store.growth, items: [...store.growth.items, { ideaId: idea.id, start }] });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold">{tx('Profile builder', 'Profil quruvchisi')}</h1>
          <p className="text-sm text-muted">{p.name} · {pick(FIELD_LABELS[p.field])} · {tx('Profile {0}% complete', 'Profil {0}% to‘ldirilgan', completeness(p))}</p>
        </div>
        <a href={href('onboarding', 'edit')}>{tx('Edit your profile', 'Profilingizni tahrirlash')}</a>
      </div>

      <Card className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label={tx('Degree', 'Daraja')}><Select value={level} onChange={(e) => setLevel(e.target.value as 'bachelor' | 'master')}><option value="bachelor">{t('lvl.bachelor')}</option><option value="master">{t('lvl.master')}</option></Select></Field>
        <Field label={tx('Target group', 'Maqsad guruhi')}><Select value={group} onChange={(e) => setGroup(e.target.value as Group)}>{(['selective', 'middle', 'accessible'] as const).map((g) => <option key={g} value={g}>{pick(TIER_INFO[g].name)}</option>)}</Select></Field>
        <Field label={tx('Months until you apply', 'Ariza topshirishgacha oylar')}><Select value={months} onChange={(e) => setMonths(Number(e.target.value))}>{[2, 3, 4, 6, 9, 12, 18, 24].map((m) => <option key={m} value={m}>{m}</option>)}</Select></Field>
        <Field label={tx('Hours per week', 'Haftasiga soat')}><Select value={hours} onChange={(e) => setHours(Number(e.target.value))}>{[2, 3, 4, 6, 8, 10, 15].map((m) => <option key={m} value={m}>{m}</option>)}</Select></Field>
        <Field label={tx('Budget for activities', 'Faoliyatlar byudjeti')}><Select value={cost} onChange={(e) => setCost(e.target.value as Cost)}><option value="free">{tx('Free only', 'Faqat bepul')}</option><option value="low">{tx('A little', 'Ozgina')}</option><option value="some">{tx('Some', 'Ma’lum miqdor')}</option></Select></Field>
      </Card>

      <Tabs label={tx('Profile builder', 'Profil quruvchisi')} value={tab} onChange={setTab} tabs={[{ id: 'check', label: tx('Profile check', 'Profil tekshiruvi') }, { id: 'ideas', label: tx('Ideas', 'G‘oyalar') }, { id: 'plan', label: tx('My plan', 'Mening rejam') + (planned.size ? ` (${planned.size})` : '') }, { id: 'coach', label: tx('AI coach', 'SI murabbiy') }]} />
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'check' && <CheckView items={check} />}
        {tab === 'ideas' && <IdeasView ranked={ranked} planned={planned} onAdd={addIdea} onRemove={(id) => store.setGrowth({ ...store.growth, items: store.growth.items.filter((i) => i.ideaId !== id) })} />}
        {tab === 'plan' && <PlanView months={months} hours={hours} onIdeas={() => setTab('ideas')} />}
        {tab === 'coach' && <CoachView level={level} group={group} months={months} hours={hours} cost={cost} check={check} />}
      </div>
    </div>
  );
}

function CheckView({ items }: { items: ReturnType<typeof checkProfile> }) {
  const { tx, pick } = useI18n();
  const { label, tone } = useStatusLabel();
  const gaps = items.filter((i) => i.status === 'gap').length;
  return (
    <div className="space-y-3">
      <Notice>{tx('This compares your profile with typical published levels for the group you chose. They are guidance, not requirements, and not a prediction of admission.', 'Bu profilingizni tanlagan guruh uchun odatiy e’lon qilingan darajalar bilan solishtiradi. Ular yo‘riqnoma, talab emas va qabul prognozi ham emas.')}</Notice>
      <p className="text-sm font-semibold">{gaps === 0 ? tx('No clear gaps found with the information you entered.', 'Kiritilgan ma’lumotlar bo‘yicha aniq bo‘shliq topilmadi.') : tx('{0} area(s) to work on first', 'Avval ishlash kerak bo‘lgan {0} ta soha', gaps)}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((c) => (
          <Card key={c.id} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2"><h3 className="font-extrabold">{pick(c.title)}</h3><Badge tone={tone(c.status)}>{label(c.status)}</Badge></div>
            <p className="text-sm"><span className="font-semibold">{tx('Now', 'Hozir')}: </span>{pick(c.now)}</p>
            <p className="text-sm"><span className="font-semibold">{tx('Typical target', 'Odatiy maqsad')}: </span>{pick(c.target)}</p>
            <p className="text-sm text-muted">{pick(c.why)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function IdeasView({ ranked, planned, onAdd, onRemove }: { ranked: ReturnType<typeof rankIdeas>; planned: Set<string>; onAdd: (i: Idea) => void; onRemove: (id: string) => void }) {
  const { tx, pick } = useI18n();
  const [cat, setCat] = useState('');
  const [onlyFits, setOnlyFits] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const list = ranked.filter((r) => (!cat || r.idea.cat === cat) && (!onlyFits || r.fits));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label={tx('Type of activity', 'Faoliyat turi')}>
          <Select value={cat} onChange={(e) => setCat(e.target.value)}><option value="">{tx('All', 'Barchasi')}</option>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{pick(v)}</option>)}</Select>
        </Field>
        <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={onlyFits} onChange={(e) => setOnlyFits(e.target.checked)} /> {tx('Only ideas that fit my time and budget', 'Faqat vaqtim va byudjetimga mos g‘oyalar')}</label>
        <p role="status" className="text-sm text-muted">{tx('{0} ideas', '{0} ta g‘oya', list.length)}</p>
      </div>
      <p className="text-xs text-muted">{tx('Ideas are ordered by how well they fill the gaps in your profile. The order is advice, never a chance of admission.', 'G‘oyalar profilingizdagi bo‘shliqlarni qanchalik to‘ldirishiga qarab tartiblangan. Tartib — maslahat, qabul ehtimoli emas.')}</p>
      <ul className="space-y-3">
        {list.map(({ idea, reasons, fits }) => {
          const isOpen = open === idea.id;
          return (
            <li key={idea.id}>
              <Card className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{pick(CATEGORIES[idea.cat])}</Badge>
                  <Badge>{tx('{0} months', '{0} oy', idea.months)}</Badge>
                  <Badge>{tx('{0} h/week', 'haftasiga {0} soat', idea.hours)}</Badge>
                  <Badge>{idea.cost === 'free' ? tx('free', 'bepul') : idea.cost === 'low' ? tx('low cost', 'arzon') : tx('some cost', 'ma’lum xarajat')}</Badge>
                  {fits ? <Badge tone="ok">{tx('fits your time and budget', 'vaqt va byudjetingizga mos')}</Badge> : <Badge tone="warn">{tx('does not fit your time or budget', 'vaqt yoki byudjetingizga mos emas')}</Badge>}
                </div>
                <h3 className="text-base font-extrabold">{pick(idea.title)}</h3>
                <p className="text-sm text-muted">{pick(idea.what)}</p>
                {reasons.length > 0 && <ul className="flex flex-wrap gap-1.5">{reasons.map((r, i) => <li key={i}><Badge tone="info">{pick(r)}</Badge></li>)}</ul>}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setOpen(isOpen ? null : idea.id)} aria-expanded={isOpen}>{isOpen ? tx('Hide details', 'Tafsilotlarni yashirish') : tx('Show details', 'Tafsilotlarni ko‘rsatish')}</Button>
                  {planned.has(idea.id) ? <Button size="sm" onClick={() => onRemove(idea.id)}><Trash2 size={14} aria-hidden /> {tx('Remove from my plan', 'Rejamdan olib tashlash')}</Button> : <Button size="sm" variant="primary" onClick={() => onAdd(idea)}><Plus size={14} aria-hidden /> {tx('Add to my plan', 'Rejamga qo‘shish')}</Button>}
                </div>
                {isOpen && (
                  <div className="space-y-3 border-t border-line pt-3 text-sm">
                    <div><h4 className="font-bold">{tx('Steps', 'Bosqichlar')}</h4><ol className="list-decimal pl-5">{idea.steps.map((s, i) => <li key={i}>{pick(s)}</li>)}</ol></div>
                    <p><span className="font-bold">{tx('How it could read on a CV', 'CV’da qanday ko‘rinishi mumkin')}: </span>{pick(idea.cv)}</p>
                    <p><span className="font-bold">{tx('Angle for a letter', 'Xat uchun yo‘nalish')}: </span>{pick(idea.angle)}</p>
                    <p><span className="font-bold">{tx('Pitfall', 'Xavf')}: </span>{pick(idea.pitfall)}</p>
                    <p><span className="font-bold">{tx('Evidence to keep', 'Saqlash kerak bo‘lgan dalil')}: </span>{pick(idea.evidence)}</p>
                    <div><h4 className="font-bold">{tx('From basic to outstanding', 'Oddiydan a’logacha')}</h4><ol className="list-decimal pl-5">{idea.ladder.map((s, i) => <li key={i}>{pick(s)}</li>)}</ol></div>
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PlanView({ months, hours, onIdeas }: { months: number; hours: number; onIdeas: () => void }) {
  const { tx, pick } = useI18n();
  const store = useStore();
  const items = store.growth.items;
  const { rows, overflow } = useMemo(() => buildMonthlyPlan(items, months), [items, months]);
  if (items.length === 0) {
    return (
      <Card className="space-y-2">
        <p className="text-sm">{tx('Your plan is empty. Choose a few ideas — one or two deep ones beat many shallow ones.', 'Rejangiz bo‘sh. Bir nechta g‘oya tanlang — bitta-ikkita chuqur g‘oya ko‘p yuzakilaridan yaxshi.')}</p>
        <Button variant="primary" onClick={onIdeas}>{tx('Browse ideas', 'G‘oyalarni ko‘rish')}</Button>
      </Card>
    );
  }
  const setStart = (ideaId: string, start: number) => store.setGrowth({ ...store.growth, items: items.map((i) => (i.ideaId === ideaId ? { ...i, start } : i)) });
  return (
    <div className="space-y-4">
      {overflow.length > 0 && <Notice tone="warn">{tx('Some chosen ideas do not fit in the {0} months you have. Move their start earlier or choose shorter ideas.', 'Tanlangan ba’zi g‘oyalar sizda bor {0} oyga sig‘maydi. Boshlanishini erta qiling yoki qisqaroq g‘oyalarni tanlang.', months)}</Notice>}
      <Card className="space-y-2">
        <h2 className="font-extrabold">{tx('Your chosen ideas', 'Tanlangan g‘oyalaringiz')}</h2>
        <ul className="divide-y divide-line">
          {items.map((it) => {
            const idea = IDEAS.find((i) => i.id === it.ideaId);
            if (!idea) return null;
            return (
              <li key={it.ideaId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="font-semibold">{pick(idea.title)} <span className="font-normal text-muted">· {tx('{0} months', '{0} oy', idea.months)}</span></span>
                <span className="flex items-center gap-2">
                  <label className="flex items-center gap-1">{tx('Starts in month', 'Boshlanish oyi')}
                    <select aria-label={`${pick(idea.title)}: ${tx('Starts in month', 'Boshlanish oyi')}`} className="min-h-[40px] rounded-lg border border-line bg-surface px-2" value={it.start} onChange={(e) => setStart(it.ideaId, Number(e.target.value))}>
                      {Array.from({ length: months }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                    </select>
                  </label>
                  <Button size="sm" aria-label={tx('Remove from my plan', 'Rejamdan olib tashlash')} onClick={() => store.setGrowth({ ...store.growth, items: items.filter((x) => x.ideaId !== it.ideaId) })}><Trash2 size={14} aria-hidden /></Button>
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
      <div className="space-y-2">
        <h2 className="font-extrabold">{tx('Month by month', 'Oyma-oy')}</h2>
        {rows.map((r) => (
          <Card key={r.month} className="space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold">{tx('Month {0}', '{0}-oy', r.month)}</h3>
              {r.hoursPerWeek > 0 && <Badge tone={r.hoursPerWeek > hours ? 'warn' : 'neutral'}>{tx('{0} h/week', 'haftasiga {0} soat', r.hoursPerWeek)}{r.hoursPerWeek > hours ? ` · ${tx('more than your {0}', 'siz aytgan {0} dan ko‘p', hours)}` : ''}</Badge>}
            </div>
            {r.tasks.length === 0 ? <p className="text-sm text-muted">{tx('Nothing planned this month.', 'Bu oy uchun reja yo‘q.')}</p> : (
              <ul className="list-disc pl-5 text-sm">{r.tasks.map((tk, i) => <li key={i}><span className="font-semibold">{pick(IDEAS.find((x) => x.id === tk.ideaId)!.title)}</span> — {pick(tk.step)}</li>)}</ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function CoachView({ level, group, months, hours, cost, check }: { level: 'bachelor' | 'master'; group: Group; months: number; hours: number; cost: Cost; check: ReturnType<typeof checkProfile> }) {
  const { tx, lang } = useI18n();
  const store = useStore();
  const p = store.profile!;
  const [interests, setInterests] = useState('');
  const [career, setCareer] = useState('');
  const [activity, setActivity] = useState('');
  const [plan, setPlan] = useState<any | null>(null);
  const [review, setReview] = useState<any | null>(null);
  const existing = store.growth.items.map((i) => IDEAS.find((x) => x.id === i.ideaId)?.title.en).filter(Boolean).join('; ');
  const gaps = check.filter((c) => c.status === 'gap').map((c) => `${c.title.en}: ${c.now.en}`);

  const generate = useAiAction(
    useCallback(
      async (signal: AbortSignal) => {
        const r = await aiJson<any>({ task: 'growth_ideas', lang, profile: p, level, field: p.field, group, months, hours, budget: cost, interests, career, gaps, existing }, signal);
        setPlan(r.result);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [lang, p, level, group, months, hours, cost, interests, career, gaps.join('|'), existing],
    ),
  );
  const judge = useAiAction(
    useCallback(
      async (signal: AbortSignal) => {
        const r = await aiJson<any>({ task: 'activity_review', lang, profile: p, level, field: p.field, group, activity }, signal);
        setReview(r.result);
      },
      [lang, p, level, group, activity],
    ),
  );

  return (
    <AiGate>
      <div className="space-y-4">
        <Card className="space-y-3">
          <h2 className="font-extrabold">{tx('A plan built around you', 'Siz uchun tuzilgan reja')}</h2>
          <p className="text-sm text-muted">{tx('The coach tells you honestly what your profile says today, then designs activities from your own interests. It cannot name real competitions or deadlines, and it never promises an outcome.', 'Murabbiy profilingiz bugun nima deyishini halol aytadi, so‘ng sizning qiziqishlaringizdan faoliyatlar tuzadi. U haqiqiy tanlov yoki muddatlarni ayta olmaydi va natijani hech qachon va’da qilmaydi.')}</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm"><span className="font-semibold">{tx('Your interests and hobbies', 'Qiziqish va sevimli mashg‘ulotlaringiz')}</span><textarea className="min-h-[90px] rounded-xl border border-line bg-surface p-3" maxLength={1500} value={interests} onChange={(e) => setInterests(e.target.value)} /></label>
            <label className="flex flex-col gap-1 text-sm"><span className="font-semibold">{tx('Career interests', 'Kasbiy qiziqishlar')}</span><textarea className="min-h-[90px] rounded-xl border border-line bg-surface p-3" maxLength={1500} value={career} onChange={(e) => setCareer(e.target.value)} /></label>
          </div>
          <Button variant="primary" disabled={generate.busy} onClick={() => void generate.run()}>{plan ? tx('Generate again', 'Qayta yaratish') : tx('Build my plan', 'Rejamni tuzish')}</Button>
          {generate.busy && <Thinking onStop={generate.stop} />}
          <AiError error={generate.error} />
        </Card>
        {plan && <CoachPlan plan={plan} />}
        {plan && <SaveAsDemo kind="coach_plan" payload={plan} suggestedTitle="Profile coach plan" />}

        <Card className="space-y-3">
          <h2 className="font-extrabold">{tx('Review an activity', 'Faoliyatni baholash')}</h2>
          <label className="flex flex-col gap-1 text-sm"><span className="font-semibold">{tx('Describe something you did or plan to do', 'Qilgan yoki qilmoqchi bo‘lgan ishingizni tasvirlang')}</span><textarea className="min-h-[100px] rounded-xl border border-line bg-surface p-3" maxLength={3000} value={activity} onChange={(e) => setActivity(e.target.value)} /></label>
          <Button disabled={judge.busy || activity.trim().length < 10} onClick={() => void judge.run()}>{tx('Review it', 'Baholash')}</Button>
          {judge.busy && <Thinking onStop={judge.stop} />}
          <AiError error={judge.error} />
          {review && <ReviewView r={review} />}
        </Card>
      </div>
    </AiGate>
  );
}

function CoachPlan({ plan }: { plan: any }) {
  const { tx } = useI18n();
  return (
    <Card className="space-y-4 text-sm">
      <p className="text-[15px] font-semibold">{plan.diagnosis}</p>
      {plan.themes.length > 0 && <div><h3 className="font-bold">{tx('Possible themes for your application', 'Arizangiz uchun mumkin bo‘lgan mavzular')}</h3><ul className="list-disc pl-5">{plan.themes.map((t: any, i: number) => <li key={i}><span className="font-semibold">{t.theme}</span> — {t.why}</li>)}</ul></div>}
      <div className="space-y-3">
        <h3 className="font-bold">{tx('Ideas made for you', 'Siz uchun maxsus g‘oyalar')}</h3>
        {plan.ideas.map((i: any, k: number) => (
          <div key={k} className="rounded-xl border border-line p-3">
            <h4 className="font-extrabold">{i.title}</h4>
            <p>{i.why}</p>
            <ol className="mt-1 list-decimal pl-5">{i.steps.map((s: string, n: number) => <li key={n}>{s}</li>)}</ol>
            {i.output && <p><span className="font-bold">{tx('Checkable result', 'Tekshiriladigan natija')}: </span>{i.output}</p>}
            {i.cvLine && <p><span className="font-bold">CV: </span>{i.cvLine}</p>}
            {i.angle && <p><span className="font-bold">{tx('Angle for a letter', 'Xat uchun yo‘nalish')}: </span>{i.angle}</p>}
            {i.risk && <p className="text-warn"><span className="font-bold">{tx('Risk', 'Xavf')}: </span>{i.risk}</p>}
          </div>
        ))}
      </div>
      {plan.avoid.length > 0 && <div><h3 className="font-bold">{tx('What to avoid', 'Nimadan qochish kerak')}</h3><ul className="list-disc pl-5">{plan.avoid.map((a: any, i: number) => <li key={i}><span className="font-semibold">{a.what}</span> — {a.why}</li>)}</ul></div>}
      {plan.questions.length > 0 && <div><h3 className="font-bold">{tx('Questions to make the plan more specific', 'Rejani aniqroq qilish uchun savollar')}</h3><ul className="list-disc pl-5">{plan.questions.map((q: string, i: number) => <li key={i}>{q}</li>)}</ul></div>}
    </Card>
  );
}

function ReviewView({ r }: { r: any }) {
  const { tx } = useI18n();
  const L2 = ({ title, items }: { title: string; items: string[] }) => (items.length ? <div><h3 className="font-bold">{title}</h3><ul className="list-disc pl-5">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null);
  return (
    <div className="space-y-3 border-t border-line pt-3 text-sm">
      <p><Badge tone={r.strength === 'strong' ? 'ok' : r.strength === 'moderate' ? 'warn' : 'bad'}>{r.strength === 'strong' ? tx('strong', 'kuchli') : r.strength === 'moderate' ? tx('moderate', 'o‘rtacha') : tx('weak', 'zaif')}</Badge> <span className="font-semibold">{r.verdict}</span></p>
      <L2 title={tx('What it shows', 'Nimani ko‘rsatadi')} items={r.shows} />
      <L2 title={tx('What a sceptical reader would doubt', 'Shubhalanuvchi o‘quvchi nimaga shubha qiladi')} items={r.doubts} />
      <L2 title={tx('How to make it stronger', 'Qanday kuchaytirish mumkin')} items={r.stronger} />
      <L2 title={tx('From basic to outstanding', 'Oddiydan a’logacha')} items={r.ladder} />
      {r.cvLine && <p><span className="font-bold">CV: </span>{r.cvLine}</p>}
      <L2 title={tx('Questions for you', 'Sizga savollar')} items={r.questions} />
    </div>
  );
}
