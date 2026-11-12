import { He, Ko, Nj, ai, useToday } from './core';
import { Fg, Kd, Ps, he } from './catalog';
import { mo } from './eligibility';

const TASK_TEMPLATES = {
  read_official: {
    title: {
      en: 'Read the official call and instructions',
      uz: 'Rasmiy e’lon va ko‘rsatmalarni o‘qing',
    },
    why: {
      en: 'Requirements change between years. The official text is the only authority.',
      uz: 'Talablar yildan-yilga o‘zgaradi. Faqat rasmiy matn asosiy manba hisoblanadi.',
    },
    how: {
      en: 'Open the official link, note every required document and any word limits, and compare with this checklist.',
      uz: 'Rasmiy havolani oching, barcha hujjatlar va so‘z cheklovlarini yozib oling, so‘ng bu ro‘yxat bilan solishtiring.',
    },
    lead: 75,
    category: 'research',
  },
  'doc.transcript': {
    title: {
      en: 'Request official transcript',
      uz: 'Rasmiy transkript so‘rang',
    },
    why: {
      en: 'Shows your grades. Some institutions need certified or sealed copies.',
      uz: 'Baholaringizni ko‘rsatadi. Ba’zi muassasalar tasdiqlangan nusxa talab qiladi.',
    },
    how: {
      en: 'Ask your school or university registrar. Allow 1–3 weeks.',
      uz: 'Maktab yoki universitet o‘quv bo‘limiga murojaat qiling. 1–3 hafta vaqt qoldiring.',
    },
    lead: 45,
    category: 'document',
  },
  'doc.diploma': {
    title: {
      en: 'Prepare diploma or certificate copy',
      uz: 'Diplom yoki attestat nusxasini tayyorlang',
    },
    why: {
      en: 'Proves you completed the qualification required for entry.',
      uz: 'Kirish uchun kerakli ma’lumotni tugatganingizni isbotlaydi.',
    },
    how: {
      en: 'If you have not graduated yet, check whether a letter of expected graduation is accepted.',
      uz: 'Hali bitirmagan bo‘lsangiz, kutilayotgan bitiruv haqidagi ma’lumotnoma qabul qilinishini tekshiring.',
    },
    lead: 40,
    category: 'document',
  },
  translation: {
    title: {
      en: 'Check translation and certification rules',
      uz: 'Tarjima va notarial tasdiqlash qoidalarini tekshiring',
    },
    why: {
      en: 'Documents in Uzbek or Russian may need certified translations.',
      uz: 'O‘zbek yoki rus tilidagi hujjatlar tasdiqlangan tarjimani talab qilishi mumkin.',
    },
    how: {
      en: 'Find the rule in the official instructions, then use a licensed translator if required.',
      uz: 'Rasmiy ko‘rsatmada qoidani toping, kerak bo‘lsa litsenziyali tarjimonga murojaat qiling.',
    },
    lead: 35,
    category: 'document',
  },
  'doc.language.book': {
    title: {
      en: 'Book a language test date',
      uz: 'Til imtihoniga sanani band qiling',
    },
    why: {
      en: 'Results take time to arrive, and test dates fill up.',
      uz: 'Natijalar kech keladi va imtihon sanalari tez band bo‘ladi.',
    },
    how: {
      en: 'Book with an official test centre at least 6–8 weeks before the deadline. Check which tests are accepted.',
      uz: 'Muddatdan kamida 6–8 hafta oldin rasmiy test markazida joy band qiling. Qaysi testlar qabul qilinishini tekshiring.',
    },
    lead: 70,
    category: 'exam',
  },
  'doc.language.have': {
    title: {
      en: 'Check your language score is valid and send it',
      uz: 'Til sertifikati amal qilish muddatini tekshiring va yuboring',
    },
    why: {
      en: 'Many institutions only accept recent scores and may need component minimums.',
      uz: 'Ko‘p muassasalar faqat yaqindagi natijalarni va bo‘limlar bo‘yicha minimumni talab qiladi.',
    },
    how: {
      en: 'Confirm the test date is within the accepted validity period and order official score reports if needed.',
      uz: 'Test sanasi amal qilish muddatida ekanini tekshiring, kerak bo‘lsa rasmiy natija hisobotini buyurtma qiling.',
    },
    lead: 30,
    category: 'exam',
  },
  'doc.passport': {
    title: {
      en: 'Check passport validity',
      uz: 'Pasport amal qilish muddatini tekshiring',
    },
    why: {
      en: 'Applications and visas need a valid passport, often for months beyond your arrival.',
      uz: 'Ariza va viza uchun amaldagi pasport kerak, ko‘pincha kelganingizdan keyin ham bir necha oy.',
    },
    how: {
      en: 'Renew early if it expires within the period your destination requires.',
      uz: 'Agar talab qilingan muddatda tugasa, oldindan yangilang.',
    },
    lead: 60,
    category: 'document',
  },
  'ref.request': {
    title: {
      en: 'Request recommendation letters',
      uz: 'Tavsiyanoma so‘rang',
    },
    why: {
      en: 'Referees need time to write a strong, specific letter.',
      uz: 'Tavsiya beruvchilarga kuchli va aniq xat yozish uchun vaqt kerak.',
    },
    how: {
      en: 'Ask at least 4–6 weeks ahead. Send your CV, the programme details and the submission method.',
      uz: 'Kamida 4–6 hafta oldin so‘rang. CV, dastur haqida ma’lumot va topshirish usulini yuboring.',
    },
    lead: 42,
    category: 'reference',
  },
  'ref.confirm': {
    title: {
      en: 'Confirm referees have submitted',
      uz: 'Tavsiyanomalar topshirilganini tasdiqlang',
    },
    why: {
      en: 'Missing letters can make an application incomplete.',
      uz: 'Yetishmayotgan tavsiyanoma arizani to‘liq bo‘lmagan holatga keltiradi.',
    },
    how: {
      en: 'Check the portal or politely remind your referee a week before the deadline.',
      uz: 'Portalni tekshiring yoki muddatdan bir hafta oldin xushmuomalalik bilan eslating.',
    },
    lead: 7,
    category: 'reference',
  },
  'essay.draft': {
    title: {
      en: 'Write a first draft of your statement',
      uz: 'Motivatsion xatning birinchi qoralamasini yozing',
    },
    why: {
      en: 'Good statements go through several revisions.',
      uz: 'Yaxshi motivatsion xat bir necha marta qayta ishlanadi.',
    },
    how: {
      en: 'Use the Writing tutor to plan with your own experiences, then write freely.',
      uz: 'O‘z tajribangiz asosida reja tuzish uchun Yozish yordamchisidan foydalaning, keyin erkin yozing.',
    },
    lead: 40,
    category: 'essay',
  },
  'essay.final': {
    title: {
      en: 'Revise and finalise your statement',
      uz: 'Motivatsion xatni qayta ishlab, yakunlang',
    },
    why: {
      en: 'Clarity, specific evidence and the word limit matter.',
      uz: 'Aniqlik, aniq dalillar va so‘z chegarasi muhim.',
    },
    how: {
      en: 'Run feedback, fix the main issues, and ask someone you trust to read it.',
      uz: 'Fikr-mulohaza oling, asosiy kamchiliklarni tuzating va ishonchli odamga o‘qitib ko‘ring.',
    },
    lead: 12,
    category: 'essay',
  },
  'doc.cv': {
    title: {
      en: 'Prepare an academic CV',
      uz: 'Akademik CV tayyorlang',
    },
    why: {
      en: 'Summarises your education, experience and achievements.',
      uz: 'Ta’lim, tajriba va yutuqlaringizni qisqacha ko‘rsatadi.',
    },
    how: {
      en: 'Use the CV review tool. Include only real, verifiable experiences.',
      uz: 'CV tekshiruv vositasidan foydalaning. Faqat haqiqiy, tasdiqlanadigan tajribani kiriting.',
    },
    lead: 30,
    category: 'document',
  },
  'doc.financial': {
    title: {
      en: 'Prepare financial documents',
      uz: 'Moliyaviy hujjatlarni tayyorlang',
    },
    why: {
      en: 'Some institutions, scholarships or visas ask for proof of funds.',
      uz: 'Ba’zi muassasalar, grantlar yoki vizalar mablag‘ mavjudligini isbotlashni so‘raydi.',
    },
    how: {
      en: 'Find the exact form and amount required. Bank statements may need to be recent.',
      uz: 'Talab qilingan aniq shakl va summani toping. Bank ko‘chirmasi yaqin sanali bo‘lishi kerak bo‘lishi mumkin.',
    },
    lead: 30,
    category: 'document',
  },
  'doc.nomination': {
    title: {
      en: 'Contact the nominating authority',
      uz: 'Tavsiya beruvchi organ bilan bog‘laning',
    },
    why: {
      en: 'Without nomination the application is not considered.',
      uz: 'Tavsiyasiz ariza ko‘rib chiqilmaydi.',
    },
    how: {
      en: 'Find the Uzbek authority’s procedure and internal deadline, which may be earlier.',
      uz: 'O‘zbekistondagi organ tartibi va ichki muddatini toping, u ertaroq bo‘lishi mumkin.',
    },
    lead: 60,
    category: 'document',
  },
  'doc.work_proof': {
    title: {
      en: 'Collect proof of work experience',
      uz: 'Ish tajribasini tasdiqlovchi hujjatlarni yig‘ing',
    },
    why: {
      en: 'Work-experience rules are often checked strictly.',
      uz: 'Ish tajribasi talablari odatda qat’iy tekshiriladi.',
    },
    how: {
      en: 'Ask employers for letters with dates and hours.',
      uz: 'Ish beruvchilardan sana va soatlar ko‘rsatilgan ma’lumotnoma so‘rang.',
    },
    lead: 35,
    category: 'document',
  },
  'doc.research_plan': {
    title: {
      en: 'Draft a research plan',
      uz: 'Tadqiqot rejasini tayyorlang',
    },
    why: {
      en: 'Research-based programmes judge your plan closely.',
      uz: 'Ilmiy dasturlar rejangizni sinchiklab baholaydi.',
    },
    how: {
      en: 'Discuss your idea with a teacher or potential supervisor. Follow the stated format.',
      uz: 'G‘oyangizni ustoz yoki ilmiy rahbar bilan muhokama qiling. Belgilangan formatga amal qiling.',
    },
    lead: 45,
    category: 'document',
  },
  'doc.medical': {
    title: {
      en: 'Get the required medical certificate',
      uz: 'Talab qilingan tibbiy ma’lumotnomani oling',
    },
    why: {
      en: 'Some programmes need a medical form in a set format.',
      uz: 'Ba’zi dasturlar belgilangan shakldagi tibbiy ma’lumotnomani talab qiladi.',
    },
    how: {
      en: 'Download the official form if one is provided.',
      uz: 'Rasmiy shakl berilgan bo‘lsa, uni yuklab oling.',
    },
    lead: 25,
    category: 'document',
  },
  'doc.photo': {
    title: {
      en: 'Prepare passport-style photos',
      uz: 'Pasport uslubidagi fotosurat tayyorlang',
    },
    why: {
      en: 'Portals often reject photos in the wrong size.',
      uz: 'Portallar noto‘g‘ri o‘lchamdagi fotosuratni rad etadi.',
    },
    how: {
      en: 'Check the required size and background colour.',
      uz: 'Talab qilingan o‘lcham va fon rangini tekshiring.',
    },
    lead: 20,
    category: 'document',
  },
  'fee.pay': {
    title: {
      en: 'Pay the application fee ({amount})',
      uz: 'Ariza to‘lovini to‘lang ({amount})',
    },
    why: {
      en: 'Unpaid applications are usually not processed.',
      uz: 'To‘lanmagan arizalar odatda ko‘rib chiqilmaydi.',
    },
    how: {
      en: 'Check accepted payment methods early; international cards can fail.',
      uz: 'To‘lov usullarini oldindan tekshiring; xalqaro kartalar ishlamay qolishi mumkin.',
    },
    lead: 5,
    category: 'fee',
  },
  'fee.check': {
    title: {
      en: 'Confirm whether there is an application fee',
      uz: 'Ariza to‘lovi bor-yo‘qligini aniqlang',
    },
    why: {
      en: 'Our data does not confirm the fee.',
      uz: 'Ma’lumotlarimiz to‘lovni tasdiqlamaydi.',
    },
    how: {
      en: 'Look for “application fee” in the official instructions.',
      uz: 'Rasmiy ko‘rsatmalarda “application fee” bandini qidiring.',
    },
    lead: 30,
    category: 'fee',
  },
  interview: {
    title: {
      en: 'Prepare for the interview',
      uz: 'Suhbatga tayyorlaning',
    },
    why: {
      en: 'This opportunity includes an interview stage.',
      uz: 'Bu imkoniyatda suhbat bosqichi bor.',
    },
    how: {
      en: 'Practise explaining your goals and examples from your experience out loud.',
      uz: 'Maqsadlaringiz va tajribangizdan misollarni ovoz chiqarib tushuntirishni mashq qiling.',
    },
    lead: -30,
    category: 'interview',
  },
  final_review: {
    title: {
      en: 'Final review of the whole application',
      uz: 'Butun arizani yakuniy tekshirish',
    },
    why: {
      en: 'Catch missing files, wrong names and formatting problems before submitting.',
      uz: 'Topshirishdan oldin yetishmayotgan fayllar, noto‘g‘ri ism va formatdagi xatolarni toping.',
    },
    how: {
      en: 'Compare each upload with the official list. Check names match your passport.',
      uz: 'Har bir yuklangan faylni rasmiy ro‘yxat bilan solishtiring. Ismlar pasport bilan mos ekanini tekshiring.',
    },
    lead: 4,
    category: 'review',
  },
  submit: {
    title: {
      en: 'Submit the application',
      uz: 'Arizani topshiring',
    },
    why: {
      en: 'Portals can be slow near the deadline.',
      uz: 'Muddat yaqinida portallar sekin ishlashi mumkin.',
    },
    how: {
      en: 'Submit at least a day early and save the confirmation.',
      uz: 'Kamida bir kun oldin topshiring va tasdiqni saqlab qo‘ying.',
    },
    lead: 2,
    category: 'review',
  },
};
export const jl = (e) => (e ? TASK_TEMPLATES[e] : void 0);
export function taskTitle(e) {
  if (e.title)
    return {
      en: e.title,
      uz: e.title,
    };
  const a = e.key ? TASK_TEMPLATES[e.key] : void 0;
  if (!a)
    return {
      en: e.key ?? 'Task',
      uz: e.key ?? 'Vazifa',
    };
  const t = (n) =>
    n.replace(/\{(\w+)\}/g, (s, r) => {
      var o;
      return String(((o = e.vars) == null ? void 0 : o[r]) ?? '');
    });
  return {
    en: t(a.title.en),
    uz: t(a.title.uz),
  };
}
const Qj = {
  transcript: ['doc.transcript'],
  diploma: ['doc.diploma'],
  passport: ['doc.passport'],
  recommendation: ['ref.request', 'ref.confirm'],
  statement: ['essay.draft', 'essay.final'],
  cv: ['doc.cv'],
  financial: ['doc.financial'],
  nomination: ['doc.nomination'],
  work_proof: ['doc.work_proof'],
  research_plan: ['doc.research_plan'],
  medical: ['doc.medical'],
  photo: ['doc.photo'],
};
function Xj(e, a, t) {
  const n = [
    {
      key: 'read_official',
      mandatory: !0,
    },
  ];
  for (const o of e.documents) {
    if (o === 'language') {
      n.push({
        key: (a != null && a.ielts) || (a != null && a.toefl) ? 'doc.language.have' : 'doc.language.book',
        doc: o,
        mandatory: !0,
      });
      continue;
    }
    for (const u of Qj[o] ?? [])
      n.push({
        key: u,
        doc: o,
        mandatory: !0,
      });
  }
  ((e.documents.includes('transcript') || e.documents.includes('diploma')) &&
    n.push({
      key: 'translation',
      mandatory: !0,
    }),
    e.appFee.status === 'amount'
      ? n.push({
          key: 'fee.pay',
          vars: {
            amount: e.appFee.amount ?? '',
          },
          mandatory: !0,
        })
      : e.appFee.status === 'unknown' &&
        n.push({
          key: 'fee.check',
          mandatory: !1,
        }),
    e.kind === 'scholarship' &&
      e.interview === 'yes' &&
      n.push({
        key: 'interview',
        mandatory: !1,
      }),
    e.kind === 'program' &&
      e.procedure.some((o) => /interview/i.test(o.en)) &&
      n.push({
        key: 'interview',
        mandatory: !1,
      }),
    n.push(
      {
        key: 'final_review',
        mandatory: !0,
      },
      {
        key: 'submit',
        mandatory: !0,
      },
    ));
  const s = e.deadline.date,
    r = !!s && ai(t, s) >= 0 && e.deadline.status === 'verified';
  return n.map(({ key: o, doc: u, vars: l, mandatory: c }) => {
    const p = TASK_TEMPLATES[o];
    let d;
    return (
      r && s && p.lead > 0 && ((d = Nj(s, -p.lead)), ai(t, d) < 0 && (d = t)),
      {
        id: He(),
        key: o,
        vars: l,
        doc: u,
        category: p.category,
        mandatory: c,
        done: !1,
        notes: '',
        due: d,
        dueSource: d ? 'suggested' : void 0,
      }
    );
  });
}
export function Hg(e, a, t) {
  return {
    id: He(),
    oppId: e.id,
    stage: 'interested',
    priority: 'medium',
    createdAt: t,
    tasks: Xj(e, a, t),
  };
}
const Sl = (e) =>
  e === 'met'
    ? 'satisfied'
    : e === 'not_met'
      ? 'not_satisfied'
      : e === 'na'
        ? 'na'
        : e === 'missing'
          ? 'not_satisfied'
          : 'verify';
export function Jj(e, a, t, n) {
  var o;
  const s = [];
  if (t) {
    const u = mo(t, e, n),
      l = (d) => u.checks.find((h) => h.dim === d),
      c = l('academic');
    c &&
      s.push({
        label: {
          en: 'Academic requirement',
          uz: 'Akademik talab',
        },
        mandatory: !0,
        status: Sl(c.status),
        why: c.msg,
        how: e.kind === 'program' ? e.reqs.academic : e.academic,
      });
    const p = l('language');
    p &&
      s.push({
        label: {
          en: 'Language requirement',
          uz: 'Til talabi',
        },
        mandatory: !0,
        status: Sl(p.status),
        why: p.msg,
        how:
          e.kind === 'program'
            ? {
                en: 'Check accepted tests and component minimums.',
                uz: 'Qabul qilinadigan testlar va bo‘limlar minimumini tekshiring.',
              }
            : e.languageReq,
      });
    for (const d of ['work', 'age', 'nomination', 'citizenship']) {
      const h = l(d);
      h &&
        s.push({
          label: Zj[d],
          mandatory: !0,
          status: Sl(h.status),
          why: h.msg,
          how: {
            en: 'Check the exact rule in the official call.',
            uz: 'Aniq qoidani rasmiy e’londa tekshiring.',
          },
        });
    }
  }
  const r = new Map();
  for (const u of a.tasks) u.doc && r.set(u.doc, [...(r.get(u.doc) ?? []), u]);
  for (const u of e.documents) {
    const l = r.get(u) ?? [],
      c = l.length > 0 && l.every((h) => h.done),
      p = l.some((h) => h.done || h.notes.trim() || h.attachment),
      d = (o = l[0]) != null && o.key ? TASK_TEMPLATES[l[0].key] : void 0;
    s.push({
      label: Ps[u],
      mandatory: !0,
      status: c ? (e.documentsVerified ? 'satisfied' : 'verify') : p ? 'in_progress' : 'not_satisfied',
      why: (d == null ? void 0 : d.why) ?? {
        en: 'Listed for this opportunity.',
        uz: 'Bu imkoniyat uchun ko‘rsatilgan.',
      },
      how: e.documentsVerified
        ? ((d == null ? void 0 : d.how) ?? {
            en: '',
            uz: '',
          })
        : {
            en: `${(d == null ? void 0 : d.how.en) ?? ''} This document list is general guidance — confirm it in the official call.`.trim(),
            uz: `${(d == null ? void 0 : d.how.uz) ?? ''} Bu hujjatlar ro‘yxati umumiy yo‘riqnoma — rasmiy e’londa tasdiqlang.`.trim(),
          },
    });
  }
  if (e.appFee.status !== 'none') {
    const u = a.tasks.find((l) => l.category === 'fee');
    s.push({
      label: {
        en: 'Application fee',
        uz: 'Ariza to‘lovi',
      },
      mandatory: e.appFee.status === 'amount',
      status: u != null && u.done ? 'satisfied' : e.appFee.status === 'unknown' ? 'verify' : 'not_satisfied',
      why: {
        en: e.appFee.amount ?? 'Fee not verified.',
        uz: e.appFee.amount ?? 'To‘lov tekshirilmagan.',
      },
      how: TASK_TEMPLATES['fee.check'].how,
    });
  } else
    s.push({
      label: {
        en: 'Application fee',
        uz: 'Ariza to‘lovi',
      },
      mandatory: !1,
      status: 'na',
      why: {
        en: 'No application fee according to the source.',
        uz: 'Manbaga ko‘ra ariza to‘lovi yo‘q.',
      },
      how: {
        en: '',
        uz: '',
      },
    });
  if (e.kind === 'scholarship' && e.interview !== 'no') {
    const u = a.tasks.find((l) => l.key === 'interview');
    s.push({
      label: {
        en: 'Interview',
        uz: 'Suhbat',
      },
      mandatory: !1,
      status: e.interview === 'unknown' ? 'verify' : u != null && u.done ? 'satisfied' : 'in_progress',
      why: {
        en: e.interview === 'yes' ? 'Interview stage listed.' : 'Not confirmed whether an interview is held.',
        uz: e.interview === 'yes' ? 'Suhbat bosqichi ko‘rsatilgan.' : 'Suhbat bo‘lishi tasdiqlanmagan.',
      },
      how: TASK_TEMPLATES.interview.how,
    });
  }
  return s;
}
const Zj = {
  work: {
    en: 'Work experience',
    uz: 'Ish tajribasi',
  },
  age: {
    en: 'Age limit',
    uz: 'Yosh chegarasi',
  },
  nomination: {
    en: 'Nomination',
    uz: 'Tavsiya (nomzodlik)',
  },
  citizenship: {
    en: 'Citizenship',
    uz: 'Fuqarolik',
  },
};
export function _j(e, a) {
  const t = e.tasks.filter((u) => u.mandatory),
    n = t.filter((u) => u.done).length,
    s = a.filter((u) => u.mandatory && u.status === 'not_satisfied').length,
    r = a.filter((u) => u.mandatory && u.status === 'verify').length,
    o = t.length ? Math.round((n / t.length) * 100) : 0;
  return {
    pct: o,
    doneTasks: n,
    totalTasks: t.length,
    blocking: s,
    toVerify: r,
    ready: o === 100 && s === 0 && r === 0,
  };
}
export const Kg = 'edubridge:v1';
export const as = () => ({
  version: 1,
  lang: 'uz',
  profile: null,
  onboardingDraft: null,
  demo: null,
  saved: [],
  compare: [],
  applications: [],
  customEvents: [],
  drafts: [],
  budgets: [],
  comparisons: [],
  reminders: [30, 14, 7, 3, 1],
  readNotices: [],
  rates: {
    ...Kd,
  },
  chat: [],
  liveAI: !1,
  aiOff: !1,
  chatThreads: [],
  advisorDocs: [],
  interviews: [],
  consistency: {},
  growth: [],
  displayCurrency: 'USD',
  cvText: '',
  finder: null,
  mascot: null,
  dataOverrides: {},
});
export function $j() {
  try {
    const e = localStorage.getItem(Kg);
    if (!e) return as();
    const a = JSON.parse(e);
    if (a.version !== 1) return as();
    const t = {
        research: 'researching',
        eligibility: 'researching',
        documents: 'preparing',
        in_progress: 'started',
        decision: 'awaiting',
      },
      n = (a.applications ?? []).map((s) =>
        t[s.stage]
          ? {
              ...s,
              stage: t[s.stage],
            }
          : s,
      );
    return {
      ...as(),
      ...a,
      applications: n,
      rates: {
        ...Kd,
        ...a.rates,
      },
    };
  } catch {
    return as();
  }
}
export const Eh = () => {
  try {
    const e = window.location.hash.replace(/^#/, '');
    if (!e)
      return {
        page: 'home',
      };
    const a = e.indexOf('--'),
      t = a < 0 ? e : e.slice(0, a),
      n = a < 0 ? '' : decodeURIComponent(e.slice(a + 2));
    return {
      page: t,
      id: n || void 0,
    };
  } catch {
    return {
      page: 'home',
    };
  }
};
export function eS(e, a) {
  const t = Fg.find((u) => u.key === e),
    n = useToday(),
    s = t.plans.map((u) => {
      const l = he(u.oppId),
        c = Hg(l, t.profile, n);
      return (
        (c.stage = u.stage),
        (c.priority = u.priority),
        (c.tasks = c.tasks.map((p) =>
          p.key && u.doneKeys.includes(p.key)
            ? {
                ...p,
                done: !0,
              }
            : p,
        )),
        c
      );
    }),
    r =
      t.draft && t.draftFor
        ? [
            {
              id: He(),
              oppId: t.draftFor,
              text: t.draft,
              answers: {},
              revisions: [
                {
                  at: new Date(Date.now() - 3 * 864e5).toISOString(),
                  words: Ko(t.draft),
                  text: t.draft,
                },
              ],
            },
          ]
        : [],
    o =
      e === 'A'
        ? [
            {
              id: He(),
              title: 'Mock interview with English teacher',
              date: zl(n, 9),
              kind: 'milestone',
              note: '',
            },
          ]
        : e === 'B'
          ? [
              {
                id: He(),
                title: 'IELTS retake (planned)',
                date: zl(n, 40),
                kind: 'exam',
                note: 'Target 6.5',
              },
            ]
          : [
              {
                id: He(),
                title: 'Call referee: Dr. Sample (demo)',
                date: zl(n, 4),
                kind: 'reference',
                note: '',
              },
            ];
  return {
    ...a,
    profile: t.profile,
    onboardingDraft: null,
    demo: e,
    saved: t.saved,
    compare: [],
    applications: s,
    drafts: r,
    customEvents: o,
    budgets: [],
    comparisons: [],
    chat: [],
    readNotices: [],
  };
}
function zl(e, a) {
  const t = new Date(e + 'T00:00:00');
  return (t.setDate(t.getDate() + a), useToday(t));
}
