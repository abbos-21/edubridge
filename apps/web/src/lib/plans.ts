import type { L, University } from '@edubridge/shared';
import type { StudentProfile } from './profile';
import type { CountryRecord, GrantRecord } from './types';
import { daysBetween, todayISO } from './deadlines';

/**
 * Application plans: a checklist per university or grant. The checklist is general guidance built from what the
 * catalogue knows (deadline, fee) plus the usual documents. It never claims a document is required unless the
 * catalogue says so, and a task gets a suggested date only from a confirmed, sourced, still-open deadline.
 */
export const STAGES = ['interested', 'researching', 'preparing', 'ready', 'started', 'submitted', 'awaiting', 'accepted', 'rejected', 'withdrawn'] as const;
export type Stage = (typeof STAGES)[number];
/** The bar on cards shows the stages up to "accepted". */
export const PROGRESS_STAGES: Stage[] = ['interested', 'researching', 'preparing', 'ready', 'started', 'submitted', 'awaiting', 'accepted'];
export const isFinished = (s: Stage) => s === 'accepted' || s === 'rejected' || s === 'withdrawn';
export const STAGE_LABEL: Record<Stage, [string, string]> = {
  interested: ['Interested', 'Qiziqaman'],
  researching: ['Researching', 'O‘rganyapman'],
  preparing: ['Preparing documents', 'Hujjat tayyorlayapman'],
  ready: ['Ready to apply', 'Topshirishga tayyor'],
  started: ['Application started', 'Ariza boshlandi'],
  submitted: ['Submitted', 'Topshirildi'],
  awaiting: ['Awaiting decision', 'Qaror kutilmoqda'],
  accepted: ['Accepted', 'Qabul qilindi'],
  rejected: ['Not successful', 'Muvaffaqiyatsiz'],
  withdrawn: ['Withdrawn', 'Qaytarib olindi'],
};

export type Priority = 'high' | 'medium' | 'low';
export type Task = {
  id: string;
  key?: string;
  title?: string;
  vars?: Record<string, string>;
  category: string;
  mandatory: boolean;
  done: boolean;
  notes: string;
  due?: string;
  dueSource?: 'suggested' | 'student';
  /** Only the file name is kept. Nothing is uploaded. */
  attachment?: { name: string; size: number };
};
export type Plan = { id: string; oppId: string; kind: 'university' | 'grant'; level?: 'bachelor' | 'master'; stage: Stage; priority: Priority; createdAt: string; tasks: Task[] };

type Tpl = { title: L; why: L; how: L; lead: number; category: string };
const l = (en: string, uz: string, ru?: string): L => (ru ? { en, uz, ru } : { en, uz });

export const TASKS: Record<string, Tpl> = {
  read_official: { title: l('Read the official call and instructions', 'Rasmiy e’lon va ko‘rsatmalarni o‘qing'), why: l('Requirements change between years. The official text is the only authority.', 'Talablar yildan-yilga o‘zgaradi. Faqat rasmiy matn asosiy manba hisoblanadi.'), how: l('Open the official link, note every required document and any word limits, and compare with this checklist.', 'Rasmiy havolani oching, barcha hujjatlar va so‘z cheklovlarini yozib oling, so‘ng bu ro‘yxat bilan solishtiring.'), lead: 75, category: 'research' },
  'doc.transcript': { title: l('Request official transcript', 'Rasmiy transkript so‘rang'), why: l('Shows your grades. Some institutions need certified or sealed copies.', 'Baholaringizni ko‘rsatadi. Ba’zi muassasalar tasdiqlangan nusxa talab qiladi.'), how: l('Ask your school or university registrar. Allow 1–3 weeks.', 'Maktab yoki universitet o‘quv bo‘limiga murojaat qiling. 1–3 hafta vaqt qoldiring.'), lead: 45, category: 'document' },
  'doc.diploma': { title: l('Prepare diploma or certificate copy', 'Diplom yoki attestat nusxasini tayyorlang'), why: l('Proves you completed the qualification required for entry.', 'Kirish uchun kerakli ma’lumotni tugatganingizni isbotlaydi.'), how: l('If you have not graduated yet, check whether a letter of expected graduation is accepted.', 'Hali bitirmagan bo‘lsangiz, kutilayotgan bitiruv haqidagi ma’lumotnoma qabul qilinishini tekshiring.'), lead: 40, category: 'document' },
  translation: { title: l('Check translation and certification rules', 'Tarjima va notarial tasdiqlash qoidalarini tekshiring'), why: l('Documents in Uzbek or Russian may need certified translations.', 'O‘zbek yoki rus tilidagi hujjatlar tasdiqlangan tarjimani talab qilishi mumkin.'), how: l('Find the rule in the official instructions, then use a licensed translator if required.', 'Rasmiy ko‘rsatmada qoidani toping, kerak bo‘lsa litsenziyali tarjimonga murojaat qiling.'), lead: 35, category: 'document' },
  'doc.language.book': { title: l('Book a language test date', 'Til imtihoniga sanani band qiling'), why: l('Results take time to arrive, and test dates fill up.', 'Natijalar kech keladi va imtihon sanalari tez band bo‘ladi.'), how: l('Book with an official test centre at least 6–8 weeks before the deadline. Check which tests are accepted.', 'Muddatdan kamida 6–8 hafta oldin rasmiy test markazida joy band qiling. Qaysi testlar qabul qilinishini tekshiring.'), lead: 70, category: 'exam' },
  'doc.language.have': { title: l('Check your language score is valid and send it', 'Til sertifikati amal qilish muddatini tekshiring va yuboring'), why: l('Many institutions only accept recent scores and may need component minimums.', 'Ko‘p muassasalar faqat yaqindagi natijalarni va bo‘limlar bo‘yicha minimumni talab qiladi.'), how: l('Confirm the test date is within the accepted validity period and order official score reports if needed.', 'Test sanasi amal qilish muddatida ekanini tekshiring, kerak bo‘lsa rasmiy natija hisobotini buyurtma qiling.'), lead: 30, category: 'exam' },
  'doc.passport': { title: l('Check passport validity', 'Pasport amal qilish muddatini tekshiring'), why: l('Applications and visas need a valid passport, often for months beyond your arrival.', 'Ariza va viza uchun amaldagi pasport kerak, ko‘pincha kelganingizdan keyin ham bir necha oy.'), how: l('Renew early if it expires within the period your destination requires.', 'Agar talab qilingan muddatda tugasa, oldindan yangilang.'), lead: 60, category: 'document' },
  'ref.request': { title: l('Request recommendation letters', 'Tavsiyanoma so‘rang'), why: l('Referees need time to write a strong, specific letter.', 'Tavsiya beruvchilarga kuchli va aniq xat yozish uchun vaqt kerak.'), how: l('Ask at least 4–6 weeks ahead. Send your CV, the programme details and the submission method.', 'Kamida 4–6 hafta oldin so‘rang. CV, dastur haqida ma’lumot va topshirish usulini yuboring.'), lead: 42, category: 'reference' },
  'ref.confirm': { title: l('Confirm referees have submitted', 'Tavsiyanomalar topshirilganini tasdiqlang'), why: l('Missing letters can make an application incomplete.', 'Yetishmayotgan tavsiyanoma arizani to‘liq bo‘lmagan holatga keltiradi.'), how: l('Check the portal or politely remind your referee a week before the deadline.', 'Portalni tekshiring yoki muddatdan bir hafta oldin xushmuomalalik bilan eslating.'), lead: 7, category: 'reference' },
  'essay.draft': { title: l('Write a first draft of your statement', 'Motivatsion xatning birinchi qoralamasini yozing'), why: l('Good statements go through several revisions.', 'Yaxshi motivatsion xat bir necha marta qayta ishlanadi.'), how: l('Use the Writing tutor to plan with your own experiences, then write freely.', 'O‘z tajribangiz asosida reja tuzish uchun Yozish yordamchisidan foydalaning, keyin erkin yozing.'), lead: 40, category: 'essay' },
  'essay.final': { title: l('Revise and finalise your statement', 'Motivatsion xatni qayta ishlab, yakunlang'), why: l('Clarity, specific evidence and the word limit matter.', 'Aniqlik, aniq dalillar va so‘z chegarasi muhim.'), how: l('Run feedback, fix the main issues, and ask someone you trust to read it.', 'Fikr-mulohaza oling, asosiy kamchiliklarni tuzating va ishonchli odamga o‘qitib ko‘ring.'), lead: 12, category: 'essay' },
  'doc.cv': { title: l('Prepare an academic CV', 'Akademik CV tayyorlang'), why: l('Summarises your education, experience and achievements.', 'Ta’lim, tajriba va yutuqlaringizni qisqacha ko‘rsatadi.'), how: l('Include only real, verifiable experiences.', 'Faqat haqiqiy, tasdiqlanadigan tajribani kiriting.'), lead: 30, category: 'document' },
  'doc.financial': { title: l('Prepare financial documents', 'Moliyaviy hujjatlarni tayyorlang'), why: l('Some institutions, scholarships or visas ask for proof of funds.', 'Ba’zi muassasalar, grantlar yoki vizalar mablag‘ mavjudligini isbotlashni so‘raydi.'), how: l('Find the exact form and amount required. Bank statements may need to be recent.', 'Talab qilingan aniq shakl va summani toping. Bank ko‘chirmasi yaqin sanali bo‘lishi kerak bo‘lishi mumkin.'), lead: 30, category: 'document' },
  'fee.pay': { title: l('Pay the application fee ({amount})', 'Ariza to‘lovini to‘lang ({amount})'), why: l('Unpaid applications are usually not processed.', 'To‘lanmagan arizalar odatda ko‘rib chiqilmaydi.'), how: l('Check accepted payment methods early; international cards can fail.', 'To‘lov usullarini oldindan tekshiring; xalqaro kartalar ishlamay qolishi mumkin.'), lead: 5, category: 'fee' },
  'fee.check': { title: l('Confirm whether there is an application fee', 'Ariza to‘lovi bor-yo‘qligini aniqlang'), why: l('Our data does not confirm the fee.', 'Ma’lumotlarimiz to‘lovni tasdiqlamaydi.'), how: l('Look for “application fee” in the official instructions.', 'Rasmiy ko‘rsatmalarda “application fee” bandini qidiring.'), lead: 30, category: 'fee' },
  final_review: { title: l('Final review of the whole application', 'Butun arizani yakuniy tekshirish'), why: l('Catch missing files, wrong names and formatting problems before submitting.', 'Topshirishdan oldin yetishmayotgan fayllar, noto‘g‘ri ism va formatdagi xatolarni toping.'), how: l('Compare each upload with the official list. Check names match your passport.', 'Har bir yuklangan faylni rasmiy ro‘yxat bilan solishtiring. Ismlar pasport bilan mos ekanini tekshiring.'), lead: 4, category: 'review' },
  submit: { title: l('Submit the application', 'Arizani topshiring'), why: l('Portals can be slow near the deadline.', 'Muddat yaqinida portallar sekin ishlashi mumkin.'), how: l('Submit at least a day early and save the confirmation.', 'Kamida bir kun oldin topshiring va tasdiqni saqlab qo‘ying.'), lead: 2, category: 'review' },
};

const fill = (s: string, vars?: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_m, k) => vars?.[k] ?? '');
/** The shown title of a task: the student's own title, or the template's. */
export function taskTitle(t: Task): L {
  if (t.title) return { en: t.title, uz: t.title };
  const tpl = t.key ? TASKS[t.key] : undefined;
  if (!tpl) return { en: t.key ?? 'Task', uz: t.key ?? 'Vazifa' };
  return { en: fill(tpl.title.en, t.vars), uz: fill(tpl.title.uz, t.vars) };
}

export const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`);

const addDays = (iso: string, d: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + d * 86_400_000).toISOString().slice(0, 10);

/** What a plan needs to know about the thing it is for. */
export type Opp = {
  kind: 'university' | 'grant';
  id: string;
  name: string;
  /** country name key (code) */
  country: string;
  level?: 'bachelor' | 'master';
  url: string | null;
  /** A confirmed (sourced) deadline, or null. Unconfirmed dates are never used for task dates. */
  deadline: { date: string; confirmed: true } | null;
  /** A date that exists but has no source, shown as "not verified". */
  unverifiedDate: string | null;
  fee: { amount: number; currency: string | null } | null;
  ielts: number | null;
  academic: L | null;
  language: L | null;
  link: string;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function uniOpp(u: University, level: 'bachelor' | 'master'): Opp {
  const lv = u.levels[level];
  const date = lv?.deadline?.date && ISO.test(lv.deadline.date) ? lv.deadline.date : null;
  const sourced = !!(lv?.deadline?.source || lv?.sources?.length);
  return {
    kind: 'university',
    id: u.id,
    name: u.name,
    country: u.country,
    level,
    url: u.apply ?? u.admissions ?? u.website ?? null,
    deadline: date && sourced ? { date, confirmed: true } : null,
    unverifiedDate: date && !sourced ? date : null,
    fee: u.fee?.amount != null && u.fee.source ? { amount: u.fee.amount, currency: u.fee.currency ?? null } : null,
    ielts: lv?.ielts ?? null,
    academic: lv?.academic ?? null,
    language: lv?.language ?? null,
    link: `#uni--${u.id}`,
  };
}

export function grantOpp(g: GrantRecord): Opp {
  const d = g.deadline as { date?: string } | string | null | undefined;
  const date = d && typeof d === 'object' && typeof d.date === 'string' && ISO.test(d.date) ? d.date : null;
  const sourced = Array.isArray(g.sources) && g.sources.length > 0;
  return {
    kind: 'grant',
    id: g.id,
    name: g.name,
    country: g.country,
    url: typeof g.url === 'string' ? g.url : null,
    deadline: date && sourced ? { date, confirmed: true } : null,
    unverifiedDate: date && !sourced ? date : null,
    fee: null,
    ielts: null,
    academic: null,
    language: null,
    link: `#scholarship--${g.id}`,
  };
}

/** The checklist for an opportunity. Mandatory = needed for almost every application; the rest are "check if required". */
export function buildTasks(opp: Opp, profile: StudentProfile | null, today = todayISO()): Task[] {
  const keys: Array<{ key: string; mandatory: boolean; vars?: Record<string, string> }> = [{ key: 'read_official', mandatory: true }];
  keys.push({ key: 'doc.transcript', mandatory: true }, { key: 'doc.diploma', mandatory: true }, { key: 'doc.passport', mandatory: true });
  keys.push({ key: profile?.ielts != null || profile?.toefl != null ? 'doc.language.have' : 'doc.language.book', mandatory: true });
  keys.push({ key: 'translation', mandatory: true });
  keys.push({ key: 'ref.request', mandatory: false }, { key: 'ref.confirm', mandatory: false });
  keys.push({ key: 'essay.draft', mandatory: false }, { key: 'essay.final', mandatory: false });
  if (opp.level === 'master' || opp.kind === 'grant') keys.push({ key: 'doc.cv', mandatory: false });
  if (opp.kind === 'grant') keys.push({ key: 'doc.financial', mandatory: false });
  if (opp.fee) keys.push({ key: 'fee.pay', mandatory: true, vars: { amount: `${opp.fee.amount}${opp.fee.currency ? ` ${opp.fee.currency}` : ''}` } });
  else keys.push({ key: 'fee.check', mandatory: false });
  keys.push({ key: 'final_review', mandatory: true }, { key: 'submit', mandatory: true });

  const dl = opp.deadline?.date;
  const open = !!dl && daysBetween(today, dl) >= 0;
  return keys.map(({ key, mandatory, vars }) => {
    const tpl = TASKS[key]!;
    let due: string | undefined;
    if (open && dl && tpl.lead > 0) {
      due = addDays(dl, -tpl.lead);
      if (due < today) due = today;
    }
    return { id: newId(), key, vars, category: tpl.category, mandatory, done: false, notes: '', due, dueSource: due ? ('suggested' as const) : undefined };
  });
}

export const newPlan = (opp: Opp, profile: StudentProfile | null, today = todayISO()): Plan => ({
  id: newId(),
  oppId: opp.id,
  kind: opp.kind,
  level: opp.level,
  stage: 'interested',
  priority: 'medium',
  createdAt: today,
  tasks: buildTasks(opp, profile, today),
});

export const required = (p: Plan) => p.tasks.filter((t) => t.mandatory);
export function progress(p: Plan) {
  const req = required(p);
  const done = req.filter((t) => t.done).length;
  return { done, total: req.length, pct: req.length ? Math.round((done / req.length) * 100) : 0 };
}

/** How urgent a plan is: lower sorts first. Time left, importance and outstanding required work. */
export function urgency(p: Plan, opp: Opp | undefined, today = todayISO()): number {
  if (isFinished(p.stage)) return 10_000;
  const days = opp?.deadline ? daysBetween(today, opp.deadline.date) : null;
  const time = days == null ? 200 : days < 0 ? 400 : days;
  const pri = p.priority === 'high' ? -30 : p.priority === 'low' ? 30 : 0;
  const open = required(p).filter((t) => !t.done).length;
  return time + pri - open * 2;
}

export type ReqStatus = 'satisfied' | 'not_satisfied' | 'in_progress' | 'verify' | 'na';
export type ReqRow = { label: L; mandatory: boolean; status: ReqStatus; why: L; how: L };

/** Requirements and where the student stands. Only comparisons the catalogue allows; the rest say "verify". */
export function requirementRows(opp: Opp, plan: Plan, profile: StudentProfile | null): ReqRow[] {
  const rows: ReqRow[] = [];
  if (opp.kind === 'university') {
    let status: ReqStatus = 'verify';
    let why = l('The programme’s minimum IELTS is not recorded. Check the official page.', 'Dasturning minimal IELTS balli qayd etilmagan. Rasmiy sahifani tekshiring.');
    if (opp.ielts != null) {
      if (profile?.ielts != null) {
        status = profile.ielts >= opp.ielts ? 'satisfied' : 'not_satisfied';
        why = status === 'satisfied' ? l(`Your IELTS ${profile.ielts} meets the published ${opp.ielts}.`, `IELTS ${profile.ielts} e’lon qilingan ${opp.ielts} ga mos.`, `Ваш IELTS ${profile.ielts} соответствует опубликованному минимуму ${opp.ielts}.`) : l(`Your IELTS ${profile.ielts} is below the published ${opp.ielts}.`, `IELTS ${profile.ielts} e’lon qilingan ${opp.ielts} dan past.`, `Ваш IELTS ${profile.ielts} ниже опубликованного минимума ${opp.ielts}.`);
      } else why = l(`The published minimum is IELTS ${opp.ielts}. Add your score to your profile to compare.`, `E’lon qilingan minimum IELTS ${opp.ielts}. Solishtirish uchun balingizni profilga qo‘shing.`, `Опубликованный минимум — IELTS ${opp.ielts}. Добавьте свой балл в профиль, чтобы сравнить.`);
    }
    rows.push({ label: l('Language requirement', 'Til talabi'), mandatory: true, status, why, how: opp.language ?? l('Check accepted tests and component minimums.', 'Qabul qilinadigan testlar va bo‘limlar minimumini tekshiring.') });
    rows.push({ label: l('Academic requirement', 'Akademik talab'), mandatory: true, status: 'verify', why: opp.academic ?? l('Not recorded. Check the official page.', 'Qayd etilmagan. Rasmiy sahifani tekshiring.'), how: l('Grades are not converted between systems: the university decides.', 'Baholar tizimlar o‘rtasida aylantirilmaydi: universitet o‘zi hal qiladi.') });
  } else {
    rows.push({ label: l('Eligibility criteria', 'Mos kelish mezonlari'), mandatory: true, status: 'verify', why: l('Read the criteria on the scholarship page. EduBridge does not decide eligibility for you.', 'Mezonlarni grant sahifasida o‘qing. EduBridge mos kelishingizni o‘zi hal qilmaydi.'), how: l('Check level, nationality, age and any nomination rule in the official call.', 'Daraja, fuqarolik, yosh va tavsiya qoidasini rasmiy e’londa tekshiring.') });
  }
  const groups: Array<[string, L, string[]]> = [
    ['document', l('Documents', 'Hujjatlar'), ['doc.transcript', 'doc.diploma', 'doc.passport', 'translation', 'doc.cv', 'doc.financial']],
    ['reference', l('Recommendation letters', 'Tavsiyanomalar'), ['ref.request', 'ref.confirm']],
    ['essay', l('Personal statement', 'Motivatsion xat'), ['essay.draft', 'essay.final']],
    ['exam', l('Language test', 'Til testi'), ['doc.language.have', 'doc.language.book']],
  ];
  for (const [, label, keys] of groups) {
    const ts = plan.tasks.filter((t) => t.key && keys.includes(t.key));
    if (!ts.length) continue;
    const all = ts.every((t) => t.done);
    const some = ts.some((t) => t.done || t.notes.trim() || t.attachment);
    rows.push({
      label,
      mandatory: ts.some((t) => t.mandatory),
      status: all ? 'verify' : some ? 'in_progress' : 'not_satisfied',
      why: TASKS[ts[0]!.key!]?.why ?? l('Usually part of an application.', 'Odatda arizaning bir qismi.'),
      how: l('This list is general guidance. Confirm it in the official call.', 'Bu ro‘yxat umumiy yo‘riqnoma. Rasmiy e’londa tasdiqlang.'),
    });
  }
  const fee = plan.tasks.find((t) => t.category === 'fee');
  rows.push(
    opp.fee
      ? { label: l('Application fee', 'Ariza to‘lovi'), mandatory: true, status: fee?.done ? 'satisfied' : 'not_satisfied', why: l(`${opp.fee.amount}${opp.fee.currency ? ` ${opp.fee.currency}` : ''} (sourced).`, `${opp.fee.amount}${opp.fee.currency ? ` ${opp.fee.currency}` : ''} (manbali).`, `${opp.fee.amount}${opp.fee.currency ? ` ${opp.fee.currency}` : ''} (указан источник).`), how: TASKS['fee.pay']!.how }
      : { label: l('Application fee', 'Ariza to‘lovi'), mandatory: false, status: 'verify', why: l('Fee not confirmed in our data.', 'To‘lov ma’lumotlarimizda tasdiqlanmagan.'), how: TASKS['fee.check']!.how },
  );
  return rows;
}

export function readiness(plan: Plan, rows: ReqRow[]) {
  const p = progress(plan);
  const blocking = rows.filter((r) => r.mandatory && r.status === 'not_satisfied').length;
  return { ...p, blocking, toVerify: rows.filter((r) => r.status === 'verify').length, ready: p.total > 0 && p.done === p.total };
}

/** Plans stored by an older build are repaired on load; anything unusable is dropped. */
export function normalizePlans(raw: unknown): Plan[] {
  if (!Array.isArray(raw)) return [];
  const out: Plan[] = [];
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue;
    const p = x as Partial<Plan>;
    if (typeof p.id !== 'string' || typeof p.oppId !== 'string' || !Array.isArray(p.tasks)) continue;
    out.push({
      id: p.id,
      oppId: p.oppId,
      kind: p.kind === 'grant' ? 'grant' : 'university',
      level: p.level === 'master' ? 'master' : p.level === 'bachelor' ? 'bachelor' : undefined,
      stage: (STAGES as readonly string[]).includes(p.stage as string) ? (p.stage as Stage) : 'interested',
      priority: p.priority === 'high' || p.priority === 'low' ? p.priority : 'medium',
      createdAt: typeof p.createdAt === 'string' ? p.createdAt : todayISO(),
      tasks: p.tasks
        .filter((t): t is Task => !!t && typeof (t as Task).id === 'string')
        .map((t) => ({ ...t, notes: typeof t.notes === 'string' ? t.notes : '', mandatory: !!t.mandatory, done: !!t.done, category: t.category ?? 'custom' })),
    });
  }
  return out;
}

export type CountryDocs = CountryRecord['documents'];
