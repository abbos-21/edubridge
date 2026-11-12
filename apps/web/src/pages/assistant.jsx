import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Download,
  FileSearch,
  FileText,
  FlaskConical,
  GitCompare,
  History,
  MessageSquareText,
  Mic,
  Play,
  Plus,
  RotateCcw,
  ScanText,
  Send,
  Share2,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Square,
  Trash2,
  TriangleAlert,
  Undo2,
  Upload,
  X,
  ZoomIn,
} from 'lucide-react';
import { $e, Ai, Bi, He, Ho, ci, la, me, useToday } from '../lib/core';
import { Ls, he, ii, we } from '../lib/catalog';
import { mo } from '../lib/eligibility';
import { taskTitle } from '../lib/plan-tasks';
import { deadlineStatus, useI18n } from '../lib/derived';
import {
  Al,
  Az,
  Bz,
  Cl,
  Cmp$d,
  CmpMi,
  Dz,
  Ez,
  Fi,
  Fz,
  Gt,
  Jz,
  Kz,
  Lz,
  Oe,
  Oh,
  Os,
  Oz,
  Pz,
  Qz,
  Rs,
  Rz,
  Se,
  Sz,
  Tt,
  Vz,
  Wo,
  Wz,
  Xz,
  Zz,
  eq,
  ft,
  fz,
  jz,
  kz,
  mn,
  nn,
  oy,
  qz,
  ry,
  vo,
  vz,
  xz,
  zz,
} from './adviser';
import { useStore } from '../store/store';
import {
  Badge,
  Button,
  Callout,
  Card,
  CmpHa,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Tabs,
  Textarea,
  classNames,
} from '../components/ui';
import { PS } from '../components/mascot';
import { Lh, Ta, Xd, hi } from '../lib/ai';

function aq(e, a) {
  const { profile: t, apps: n, lang: s, today: r, rates: o } = a,
    u = e.toLowerCase(),
    l = (p, d) => la(s, p, d);
  if (/next|what should i do|keyingi|nima qilay|nima qilishim|qaysi qadam|start|boshla/.test(u)) {
    const p = n
      .flatMap((h) =>
        h.tasks
          .filter((m) => !m.done)
          .map((m) => ({
            a: h,
            x: m,
            o: he(h.oppId),
          })),
      )
      .filter((h) => h.o);
    if ((p.sort((h, m) => (h.x.due ?? '9999').localeCompare(m.x.due ?? '9999')), !n.length))
      return {
        direct: l(
          'You have no application plans yet. Start by choosing one or two opportunities.',
          'Hali ariza rejalaringiz yo‘q. Bir-ikkita imkoniyatni tanlashdan boshlang.',
        ),
        steps: [
          l(
            'Open Scholarships and filter by your degree level.',
            'Grantlar bo‘limini oching va daraja bo‘yicha saralang.',
          ),
          l('Read the eligibility checks on each card.', 'Har bir kartadagi muvofiqlik tekshiruvlarini o‘qing.'),
          l(
            'Press “Add to plan” on the best fit to create a checklist.',
            'Eng mosiga “Rejaga qo‘shish” tugmasini bosing — ro‘yxat yaratiladi.',
          ),
        ],
        sources: [],
        uncertain: [],
      };
    const d = p.slice(0, 4);
    return {
      direct: l(
        `You have ${p.length} open tasks across ${n.length} plan(s). Start with the earliest:`,
        `${n.length} ta rejangizda ${p.length} ta ochiq vazifa bor. Eng yaqinidan boshlang:`,
      ),
      steps: d.map(
        (h) =>
          `${eq(taskTitle(h.x), s)} — ${h.o.kind === 'program' ? h.o.university : h.o.name}${h.x.due ? ` (${l('suggested by', 'tavsiya etilgan sana')} ${me(h.x.due, s)})` : ''}`,
      ),
      explanation: l(
        'Suggested dates are counted back from each verified deadline. Where a deadline is unknown, no date is suggested.',
        'Tavsiya etilgan sanalar har bir tasdiqlangan muddatdan orqaga hisoblanadi. Muddat noma’lum bo‘lsa, sana taklif qilinmaydi.',
      ),
      sources: [...new Set(d.map((h) => h.o.id))].map((h) => {
        const m = he(h);
        return {
          name: Gt(m),
          url: m.source.source_url,
        };
      }),
      uncertain: d
        .filter((h) => h.o.deadline.status !== 'verified')
        .map((h) =>
          l(
            `${h.o.kind === 'program' ? h.o.university : h.o.name}: deadline not confirmed.`,
            `${h.o.kind === 'program' ? h.o.university : h.o.name}: muddat tasdiqlanmagan.`,
          ),
        ),
    };
  }
  if (/deadline|muddat|when|qachon|due/.test(u) && !Oh(u)) {
    const d = [...new Set([...n.map((m) => m.oppId), ...a.saved])]
      .map((m) => he(m))
      .filter(Boolean)
      .map((m) => ({
        o: m,
        v: deadlineStatus(m, r),
      }));
    if (!d.length)
      return {
        direct: l(
          'You have not saved any opportunities yet, so there are no deadlines to show.',
          'Hali birorta imkoniyat saqlamagansiz, shuning uchun muddatlar yo‘q.',
        ),
        steps: [
          l(
            'Save opportunities from the Universities or Scholarships pages.',
            'Universitetlar yoki Grantlar sahifasidan imkoniyatlarni saqlang.',
          ),
        ],
        sources: [],
        uncertain: [],
      };
    const h = (m, y) => {
      const E = m.kind === 'program' ? m.university : m.name;
      return y.kind === 'upcoming'
        ? l(`${E}: ${me(y.date, s)} (${y.days} days)`, `${E}: ${me(y.date, s)} (${y.days} kun)`)
        : y.kind === 'demo'
          ? l(`${E}: ${me(y.date, s)} (demo date)`, `${E}: ${me(y.date, s)} (namoyish sanasi)`)
          : y.kind === 'unverified'
            ? l(
                `${E}: ${y.date ? me(y.date, s) + ' — ' : ''}not verified`,
                `${E}: ${y.date ? me(y.date, s) + ' — ' : ''}tasdiqlanmagan`,
              )
            : y.kind === 'closed'
              ? l(`${E}: closed for this cycle`, `${E}: bu siklda yopilgan`)
              : y.kind === 'varies'
                ? l(`${E}: varies by programme`, `${E}: dasturga qarab farq qiladi`)
                : l(`${E}: not announced yet`, `${E}: hali e’lon qilinmagan`);
    };
    return {
      direct: l('Here is what we know about your deadlines:', 'Muddatlaringiz haqida bilganlarimiz:'),
      steps: d.sort((m, y) => (m.v.date ?? '9999').localeCompare(y.v.date ?? '9999')).map((m) => h(m.o, m.v)),
      sources: d.map((m) => ({
        name: Gt(m.o),
        url: m.o.source.source_url,
      })),
      uncertain: [
        l(
          'Always confirm dates on the official website before relying on them.',
          'Sanalarga tayanishdan oldin ularni doim rasmiy saytda tasdiqlang.',
        ),
      ],
    };
  }
  const c = Oh(u);
  if (c) {
    if (!t)
      return {
        direct: l(
          'Create your profile first so I can compare it with the published criteria.',
          'Avval profilingizni yarating, shunda uni e’lon qilingan mezonlar bilan solishtira olaman.',
        ),
        steps: [],
        sources: [
          {
            name: Gt(c),
            url: c.source.source_url,
          },
        ],
        uncertain: [],
      };
    const p = mo(t, c, o),
      d = deadlineStatus(c, r);
    return {
      direct: l(`${Gt(c)} ${Cl[p.overall].en}.`, `${Gt(c)} ${Cl[p.overall].uz}.`),
      explanation: p.checks.map((h) => `• ${$e(h.msg, s)}`).join(`
`),
      steps: [
        d.kind === 'closed'
          ? l(
              'This cycle is closed. Watch the official page for the next round.',
              'Bu sikl yopilgan. Keyingi qabul uchun rasmiy sahifani kuzatib boring.',
            )
          : l(
              'Open the details page and add it to your plan to get a checklist.',
              'Batafsil sahifani oching va ro‘yxat olish uchun rejaga qo‘shing.',
            ),
        l('Read the official call in full before applying.', 'Ariza berishdan oldin rasmiy e’lonni to‘liq o‘qing.'),
      ],
      sources: [
        {
          name: c.source.source_name,
          url: c.source.source_url,
        },
      ],
      uncertain: c.uncertainties.map((h) => $e(h, s)),
    };
  }
  if (/cost|budget|afford|money|narx|xarajat|byudjet|pul|kontrakt|to‘lov|to'lov/.test(u))
    return {
      direct: l(
        'Use the Budget planner to compare the full yearly cost, not only tuition.',
        'Faqat o‘qish to‘lovini emas, to‘liq yillik xarajatni solishtirish uchun Byudjet rejalashtiruvchisidan foydalaning.',
      ),
      explanation: l(
        'Annual cost = tuition + accommodation + food + transport + insurance + visa + travel + other. Funding gap = annual cost − family contribution − scholarship used. Missing figures are shown as missing, never as zero.',
        'Yillik xarajat = o‘qish + turar joy + ovqat + transport + sug‘urta + viza + yo‘l + boshqa. Kamomad = yillik xarajat − oila hissasi − grant. Yetishmayotgan raqamlar nol deb hisoblanmaydi.',
      ),
      steps: [
        l(
          'Create a scenario from a saved programme so tuition is prefilled.',
          'Saqlangan dasturdan ssenariy yarating — o‘qish to‘lovi avtomatik to‘ldiriladi.',
        ),
        l(
          'Replace living-cost estimates with figures from the university’s official page when available.',
          'Yashash xarajatlari taxminini universitetning rasmiy ma’lumotlari bilan almashtiring.',
        ),
        l(
          'Check whether a scholarship covers tuition only or living costs too.',
          'Grant faqat o‘qishni yoki yashash xarajatlarini ham qoplashini tekshiring.',
        ),
      ],
      sources: [],
      uncertain: [
        l(
          'Exchange rates in this app are illustrative; set your own in Settings.',
          'Ilovadagi valyuta kurslari taxminiy; Sozlamalarda o‘zingiz belgilang.',
        ),
      ],
    };
  if (/statement|essay|motivation|insho|motivatsion|xat/.test(u))
    return {
      direct: l(
        'Start from the official prompt and your own experiences, then draft freely and revise.',
        'Rasmiy savol va o‘z tajribangizdan boshlang, keyin erkin yozing va qayta ishlang.',
      ),
      steps: [
        l('Open the Writing tutor and choose the opportunity.', 'Yozish yordamchisini oching va imkoniyatni tanlang.'),
        l('Answer the planning questions with real examples.', 'Reja savollariga haqiqiy misollar bilan javob bering.'),
        l(
          'Write your draft, then run feedback and fix the high-priority issues first.',
          'Qoralama yozing, so‘ng fikr-mulohaza oling va avval muhim kamchiliklarni tuzating.',
        ),
      ],
      sources: [],
      uncertain: [
        l(
          'Check whether the institution restricts AI use in application writing.',
          'Muassasa ariza yozishda SI dan foydalanishni cheklashini tekshiring.',
        ),
      ],
    };
  if (/recommendation|reference letter|referee|tavsiyanoma|tavsiya xat/.test(u))
    return {
      direct: l(
        'Ask referees who know your work well, at least 4–6 weeks before the deadline.',
        'Ishingizni yaxshi biladigan odamlardan muddatdan kamida 4–6 hafta oldin so‘rang.',
      ),
      steps: [
        l(
          'Choose a teacher, supervisor or employer who can give specific examples.',
          'Aniq misollar keltira oladigan ustoz, rahbar yoki ish beruvchini tanlang.',
        ),
        l(
          'Send your CV, the programme name, the deadline and how the letter is submitted.',
          'CV, dastur nomi, muddat va xat qanday topshirilishini yuboring.',
        ),
        l(
          'Check whether the referee must upload the letter directly.',
          'Tavsiyanomani tavsiya beruvchining o‘zi yuklashi kerakmi, tekshiring.',
        ),
      ],
      sources: [],
      uncertain: [
        l(
          'The number of letters and format differ by institution.',
          'Xatlar soni va formati muassasaga qarab farq qiladi.',
        ),
      ],
    };
  if (/ielts|toefl|english|ingliz|til/.test(u))
    return {
      direct:
        t != null && t.ielts
          ? l(
              `Your profile shows IELTS ${t.ielts}. Compare it with each opportunity’s published minimum on its card.`,
              `Profilingizda IELTS ${t.ielts}. Uni har bir imkoniyat kartasidagi e’lon qilingan minimum bilan solishtiring.`,
            )
          : l('Your profile has no IELTS score yet.', 'Profilingizda hali IELTS natijasi yo‘q.'),
      steps: [
        l(
          'Check accepted tests and component minimums for each target.',
          'Har bir maqsad uchun qabul qilinadigan testlar va bo‘lim minimumlarini tekshiring.',
        ),
        l(
          'Book the test early: results and dates take time.',
          'Imtihonga oldindan yoziling: natija va sanalar vaqt oladi.',
        ),
        l(
          'Check how long scores stay valid for each institution.',
          'Natija har bir muassasa uchun qancha muddat amal qilishini tekshiring.',
        ),
      ],
      sources: [],
      uncertain: [
        l('Not every institution accepts the same tests.', 'Hamma muassasa bir xil testlarni qabul qilmaydi.'),
      ],
    };
  if (t && /recommend|suggest|which|best|qaysi|tavsiya|mos/.test(u)) {
    const p = ii
      .map((d) => ({
        o: d,
        m: mo(t, d, o),
      }))
      .filter((d) => d.m.overall !== 'not_eligible')
      .sort((d, h) => h.m.score - d.m.score)
      .slice(0, 4);
    return {
      direct: l(
        'These opportunities fit your profile best on the checks we can run:',
        'Biz o‘tkaza oladigan tekshiruvlar bo‘yicha profilingizga eng mos imkoniyatlar:',
      ),
      steps: p.map((d) => `${Gt(d.o)} (${$e(we[d.o.country], s)}) — ${$e(Cl[d.m.overall], s)}`),
      sources: p.map((d) => ({
        name: d.o.source.source_name,
        url: d.o.source.source_url,
      })),
      uncertain: [
        l(
          'Matching uses published minimums only. It does not predict admission.',
          'Moslik faqat e’lon qilingan minimumlarga asoslanadi. U qabulni bashorat qilmaydi.',
        ),
      ],
    };
  }
  return {
    direct: l(
      'I can help with your next steps, deadlines, eligibility for a named scholarship, budgeting, statements, CVs and recommendation letters.',
      'Men keyingi qadamlar, muddatlar, aniq grantga mosligingiz, byudjet, motivatsion xat, CV va tavsiyanomalar bo‘yicha yordam bera olaman.',
    ),
    steps: [
      l('Try: “What should I do next?”', 'Masalan: “Keyingi qadamim nima?”'),
      l('Or: “Am I eligible for Stipendium Hungaricum?”', 'Yoki: “Stipendium Hungaricum’ga mos kelamanmi?”'),
    ],
    sources: [],
    uncertain: [
      l(
        'Demo mode gives rule-based answers. Turn on live AI in Settings when it is available.',
        'Namoyish rejimi qoidalarga asoslangan javob beradi. Mavjud bo‘lsa, Sozlamalarda jonli SI ni yoqing.',
      ),
    ],
  };
}
function br(e) {
  const a = /\n?\s*FOLLOWUPS?:\s*(.+)\s*$/i.exec(e);
  return a
    ? {
        body: e.slice(0, a.index).trim(),
        followUps: a[1]
          .split('|')
          .map((t) => t.trim().replace(/^["“]|["”]$/g, ''))
          .filter(Boolean)
          .slice(0, 3),
      }
    : {
        body: e.trim(),
        followUps: [],
      };
}
function iq(e, a) {
  const t = [`### ${a('Short answer', 'Qisqa javob')}`, e.direct];
  return (
    e.explanation && t.push(`### ${a('From EduBridge records', 'EduBridge yozuvlaridan')}`, e.explanation),
    e.steps.length &&
      t.push(`### ${a('Recommended next steps', 'Keyingi qadamlar')}`, ...e.steps.map((n, s) => `${s + 1}. ${n}`)),
    e.sources.length &&
      t.push(
        `### ${a('Sources and verification', 'Manbalar va tekshiruv')}`,
        ...e.sources.map((n) => `- ${n.name}: ${n.url}`),
      ),
    e.uncertain.length &&
      t.push(`### ${a('Important limitations', 'Muhim cheklovlar')}`, ...e.uncertain.map((n) => `- ${n}`)),
    t.join(`
`)
  );
}
function CmpTq({ goTab: e }) {
  const a = useStore(),
    { state: t, pushChat: n, replaceLastChat: s, newChat: r, openThread: o, deleteThread: u } = a,
    { tx: l, lang: c } = useI18n(),
    p = ft(),
    [d, h] = React.useState(''),
    [m, y] = React.useState(!1),
    [E, C] = React.useState(!1),
    v = React.useRef(null),
    g = React.useRef(null);
  (React.useEffect(() => {
    var k;
    (k = g.current) == null ||
      k.scrollIntoView({
        block: 'end',
      });
  }, [t.chat.length, m]),
    React.useEffect(
      () => () => {
        var k;
        return (k = v.current) == null ? void 0 : k.abort();
      },
      [],
    ));
  const b = () => new Date().toISOString(),
    S = async (k, K = 'normal') => {
      const x = k.trim();
      if (!x || m) return;
      h('');
      const F = t.chat.filter((R) => R.mode !== 'error' && R.text.trim());
      if (
        (n({
          role: 'user',
          text: x,
          at: b(),
        }),
        !p.live)
      ) {
        const R = {
          profile: t.profile,
          apps: t.applications,
          saved: t.saved,
          rates: t.rates,
          today: useToday(),
          lang: c,
        };
        n({
          role: 'assistant',
          text: iq(aq(x, R), l),
          mode: 'demo',
          at: b(),
        });
        return;
      }
      y(!0);
      const O = new AbortController();
      ((v.current = O),
        n({
          role: 'assistant',
          text: '',
          mode: 'live',
          at: b(),
        }));
      const N = F.filter((R) => R.role === 'user')
          .slice(-2)
          .map((R) => R.text)
          .join(' '),
        I = Wz(`${N} ${x}`, {
          profile: t.profile,
          apps: t.applications,
          saved: t.saved,
        }),
        f = t.advisorDocs
          .filter((R) => R.shared)
          .map((R) => ({
            type: R.type,
            title: R.title,
            text: R.working,
          })),
        D = [
          {
            role: 'user',
            content: fz({
              lang: c,
              today: useToday(),
              profile: Os(t.profile),
              plans: Vz(t.applications),
              saved: t.saved.map((R) => {
                const _ = he(R);
                return _ ? (_.kind === 'program' ? `${_.university} — ${_.program.en}` : _.name) : R;
              }),
              records: I.records,
              sharedDocs: f,
              depth: K,
            }),
          },
          ...F.slice(-12).map((R) => ({
            role: R.role,
            content: R.text,
          })),
          {
            role: 'user',
            content:
              K === 'deep'
                ? `${x}

(${la(c, 'Please explain this in more depth, with examples.', 'Iltimos, chuqurroq va misollar bilan tushuntiring.')})`
                : x,
          },
        ];
      try {
        const R = await Xd(D, {
            signal: O.signal,
            tier: K === 'deep' ? 'complex' : 'default',
            onText: (T) =>
              s({
                role: 'assistant',
                text: br(T).body,
                mode: 'live',
                at: b(),
              }),
          }),
          { body: _, followUps: de } = br(R);
        s({
          role: 'assistant',
          text: _,
          mode: 'live',
          at: b(),
          followUps: de,
          unverified: Qz(_, I.urls).unverified,
        });
      } catch (R) {
        const _ = R;
        _.code === 'cancelled'
          ? s({
              role: 'assistant',
              text: _.partial
                ? `${br(_.partial).body}

_(${l('stopped', 'to‘xtatildi')})_`
                : l('(stopped)', '(to‘xtatildi)'),
              mode: 'live',
              at: b(),
            })
          : s({
              role: 'assistant',
              text: `${
                _.partial
                  ? `${br(_.partial).body}

`
                  : ''
              }${Ta(_.code, c)}`,
              mode: 'error',
              at: b(),
            });
      } finally {
        y(!1);
      }
    },
    A = () => {
      const k = [...t.chat].reverse().find((K) => K.role === 'user');
      k && S(k.text);
    },
    q = t.profile,
    w = t.saved.map(he).find((k) => (k == null ? void 0 : k.kind) === 'scholarship'),
    U = [
      {
        text: q
          ? l('Help me find scholarships that match my profile.', 'Profilimga mos grantlarni topishga yordam bering.')
          : l(
              'Which scholarships can students from Uzbekistan apply for?',
              'O‘zbekistonlik talabalar qaysi grantlarga topshira oladi?',
            ),
      },
      {
        text: l('Evaluate my CV for a master’s application.', 'Magistraturaga ariza uchun CV’imni baholang.'),
        action: () => e('docs'),
      },
      {
        text: l('What makes a strong motivation letter?', 'Kuchli motivatsion xat qanday bo‘ladi?'),
      },
      {
        text: l('Help me prepare for a scholarship interview.', 'Grant suhbatiga tayyorlanishga yordam bering.'),
        action: () => e('interview'),
      },
      {
        text: w
          ? l(
              `Explain the requirements of ${w.kind === 'scholarship' ? w.name : ''}.`,
              `${w.kind === 'scholarship' ? w.name : ''} talablarini tushuntiring.`,
            )
          : l('Explain the requirements of Stipendium Hungaricum.', 'Stipendium Hungaricum talablarini tushuntiring.'),
      },
      {
        text: q
          ? l(
              'Create an application plan for me — I have three months left.',
              'Menga ariza rejasini tuzing — uch oyim qoldi.',
            )
          : l(
              'Which countries offer affordable master’s degrees in finance?',
              'Qaysi davlatlarda moliya bo‘yicha arzon magistratura bor?',
            ),
      },
    ],
    j = t.chat[t.chat.length - 1];
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
      <Card className="flex min-h-[460px] min-w-0 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <p className="text-[13px] text-muted">
            {q
              ? l(
                  'Answers use your profile, plans and saved items where they matter.',
                  'Javoblar kerak joyda profil, rejalar va saqlanganlaringizdan foydalanadi.',
                )
              : l(
                  'No profile yet — general answers; I will ask for details when they matter.',
                  'Profil yo‘q — umumiy javoblar; kerak bo‘lsa ma’lumot so‘rayman.',
                )}
          </p>
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" icon={<History size={14} />} className="lg:hidden" onClick={() => C(!E)}>
              {l('Chats', 'Suhbatlar')}
            </Button>
            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => {
                var k;
                ((k = v.current) == null || k.abort(), r());
              }}
              disabled={!t.chat.length || m}
            >
              {l('New chat', 'Yangi suhbat')}
            </Button>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
          {t.chat.length === 0 && (
            <div className="py-4">
              <p className="mb-3 text-[14px] text-muted">
                {l(
                  'Ask about universities, scholarships, eligibility, documents, interviews or planning. Try:',
                  'Universitetlar, grantlar, mos kelish, hujjatlar, suhbat yoki reja haqida so‘rang. Masalan:',
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {U.map((k) => (
                  <button
                    type="button"
                    onClick={() => (k.action ? k.action() : S(k.text))}
                    className="rounded-full border border-line bg-surface px-3 py-1.5 text-left text-[13px] font-semibold text-muted hover:border-teal/50 hover:text-fg"
                    key={k.text}
                  >
                    {k.text}
                  </button>
                ))}
              </div>
            </div>
          )}
          {t.chat.map((k, K) => (
            <div
              className={classNames('flex items-start gap-2', k.role === 'user' ? 'justify-end' : 'justify-start')}
              key={K}
            >
              {k.role === 'assistant' && <PS size={30} className="mt-0.5" />}
              <div
                className={classNames(
                  'min-w-0 max-w-[92%] rounded-2xl px-4 py-2.5 text-[14.5px]',
                  k.role === 'user'
                    ? 'whitespace-pre-wrap bg-navy text-navy-ink'
                    : k.mode === 'error'
                      ? 'border border-warn/40 bg-warn-soft/40'
                      : 'border border-line bg-surface',
                )}
              >
                {k.role === 'assistant' && (
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-faint">
                    {k.mode === 'live'
                      ? l('EduBridge AI advisor', 'EduBridge SI maslahatchisi')
                      : k.mode === 'error'
                        ? l('Not answered', 'Javob berilmadi')
                        : l('Rule-based answer — AI not connected', 'Qoidaga asoslangan javob — SI ulanmagan')}
                  </p>
                )}
                {k.role === 'user' ? (
                  k.text
                ) : k.text ? (
                  <Jz text={k.text} />
                ) : (
                  <span className="text-muted">
                    {l('Thinking… (this can take up to a minute)', 'O‘ylamoqda… (bir daqiqagacha cho‘zilishi mumkin)')}
                  </span>
                )}
                {k.unverified && k.unverified.length > 0 && (
                  <p className="mt-2 flex gap-1.5 rounded-md bg-warn-soft px-2.5 py-1.5 text-[12.5px] text-fg">
                    <TriangleAlert size={14} className="mt-0.5 shrink-0 text-warn" />
                    {l(
                      'These links are not from EduBridge’s verified records — check them carefully before relying on them:',
                      'Bu havolalar EduBridge’ning tasdiqlangan yozuvlaridan emas — ishonishdan oldin yaxshilab tekshiring:',
                    )}{' '}
                    {k.unverified.join(', ')}
                  </p>
                )}
                {k.role === 'assistant' && K === t.chat.length - 1 && !m && k.mode === 'live' && k.text && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-2.5">
                    {(k.followUps ?? []).map((x) => (
                      <button
                        type="button"
                        onClick={() => S(x)}
                        className="rounded-full border border-line px-2.5 py-1 text-left text-[12.5px] font-semibold text-muted hover:border-teal/50 hover:text-fg"
                        key={x}
                      >
                        {x}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const x = [...t.chat].reverse().find((F) => F.role === 'user');
                        x && S(x.text, 'deep');
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-teal/40 px-2.5 py-1 text-[12.5px] font-bold text-teal-ink dark:text-teal"
                    >
                      <ZoomIn size={13} />
                      {l('Explain in more depth', 'Chuqurroq tushuntiring')}
                    </button>
                  </div>
                )}
                {k.mode === 'error' && K === t.chat.length - 1 && !m && (
                  <button
                    type="button"
                    onClick={A}
                    className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-teal-ink dark:text-teal"
                  >
                    <RotateCcw size={13} />
                    {l('Try again', 'Qayta urinish')}
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={g} />
        </div>
        {!p.live && !p.checking && (
          <div className="px-4 pb-2">
            <Callout tone="warn">
              {p.off
                ? l(
                    'Live AI is switched off in Settings, so answers are rule-based.',
                    'Jonli SI Sozlamalarda o‘chirilgan, shuning uchun javoblar qoidaga asoslangan.',
                  )
                : l(
                    'Live AI needs an account: sign in to use it. Answers below are rule-based and limited.',
                    'Jonli SI uchun akkaunt kerak: foydalanish uchun kiring. Quyidagi javoblar qoidaga asoslangan va cheklangan.',
                  )}
            </Callout>
          </div>
        )}
        <form
          className="flex items-end gap-2 border-t border-line p-3"
          onSubmit={(k) => {
            (k.preventDefault(), S(d));
          }}
        >
          <label htmlFor="chat-in" className="sr-only">
            {l('Your question', 'Savolingiz')}
          </label>
          <Textarea
            id="chat-in"
            className="min-h-[44px] flex-1"
            rows={1}
            value={d}
            placeholder={l('Ask a question…', 'Savol bering…')}
            onChange={(k) => h(k.target.value)}
            onKeyDown={(k) => {
              k.key === 'Enter' && !k.shiftKey && (k.preventDefault(), S(d));
            }}
          />
          {m ? (
            <Button
              icon={<Square size={14} />}
              onClick={() => {
                var k;
                return (k = v.current) == null ? void 0 : k.abort();
              }}
            >
              {l('Stop', 'To‘xtatish')}
            </Button>
          ) : (
            <Button type="submit" variant="primary" icon={<Send size={16} />} disabled={!d.trim()}>
              {l('Send', 'Yuborish')}
            </Button>
          )}
        </form>
        {(j == null ? void 0 : j.mode) === 'live' && (
          <p className="px-4 pb-3 text-[11.5px] text-faint">
            {l(
              'AI can make mistakes. Official facts come only from EduBridge’s verified records; confirm them on the linked official pages.',
              'SI xato qilishi mumkin. Rasmiy faktlar faqat EduBridge’ning tasdiqlangan yozuvlaridan olinadi; ularni havoladagi rasmiy sahifalarda tasdiqlang.',
            )}
          </p>
        )}
      </Card>
      <aside className={classNames('min-w-0', E ? 'block' : 'hidden lg:block')}>
        <Card className="p-3">
          <p className="mb-2 text-[13px] font-extrabold">{l('Previous conversations', 'Oldingi suhbatlar')}</p>
          {t.chatThreads.length === 0 ? (
            <p className="text-[12.5px] text-muted">
              {l(
                'Start a new chat and earlier ones are kept here (in this browser only).',
                'Yangi suhbat boshlasangiz, oldingilari shu yerda saqlanadi (faqat shu brauzerda).',
              )}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {t.chatThreads.map((k) => (
                <li className="flex items-center gap-1" key={k.id}>
                  <button
                    type="button"
                    disabled={m}
                    onClick={() => {
                      (o(k.id), C(!1));
                    }}
                    className="min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-sunken"
                  >
                    {k.title || l('Conversation', 'Suhbat')}
                  </button>
                  <button
                    type="button"
                    aria-label={l('Delete conversation', 'Suhbatni o‘chirish')}
                    onClick={() => u(k.id)}
                    className="rounded p-1 text-faint hover:text-bad"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </aside>
    </div>
  );
}
const nq = 10 * 1024 * 1024;
const sq = '.pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.webp';
function Fu(e) {
  return e ? (e.match(/[\p{L}\p{N}\s.,;:!?'"’“”()\-–—/%&@+•]/gu) ?? []).length / e.length : 0;
}
const bo = (e) =>
  e
    .replace(/\r/g, '')
    .replace(
      /[ \t]+\n/g,
      `
`,
    )
    .replace(
      /\n{3,}/g,
      `

`,
    )
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
const rq = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs';
const oq = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
const lq = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';
let Ml = null;
function uq() {
  return (
    Ml ??
      (Ml = (async () => (await import(oq), await import(rq)))().catch((e) => {
        throw (
          (Ml = null),
          Object.assign(new Error('reader_unavailable'), {
            cause: e,
          })
        );
      })),
    Ml
  );
}
let Il = null;
function dq() {
  return (
    Il ??
      (Il = new Promise((e, a) => {
        const t = window;
        if (t.mammoth) return e(t.mammoth);
        const n = document.createElement('script');
        ((n.src = lq),
          (n.async = !0),
          (n.crossOrigin = 'anonymous'),
          (n.onload = () => (t.mammoth ? e(t.mammoth) : a(new Error('reader_unavailable')))),
          (n.onerror = () => a(new Error('reader_unavailable'))),
          document.head.appendChild(n));
      }).catch((e) => {
        throw ((Il = null), e);
      })),
    Il
  );
}
async function cq(e, a) {
  const n = await (
      await uq()
    ).getDocument({
      data: new Uint8Array(e),
      isEvalSupported: !1,
      useSystemFonts: !0,
    }).promise,
    s = [],
    r = [];
  for (let p = 1; p <= n.numPages; p++) {
    const h = await (await n.getPage(p)).getTextContent();
    let m = '';
    for (const y of h.items)
      ((m += y.str ?? ''),
        y.hasEOL &&
          (m += `
`));
    ((m = bo(m)), m.replace(/\s/g, '').length < 40 && r.push(p), s.push(m));
  }
  const o = [];
  for (const p of r.slice(0, a)) {
    const d = await n.getPage(p),
      h = d.getViewport({
        scale: 1.7,
      }),
      m = document.createElement('canvas');
    ((m.width = Math.ceil(h.width)), (m.height = Math.ceil(h.height)));
    const y = m.getContext('2d');
    if (!y) continue;
    await d.render({
      canvasContext: y,
      viewport: h,
    }).promise;
    const E = await new Promise((C) => m.toBlob(C, 'image/jpeg', 0.85));
    E && o.push(E);
  }
  const u = bo(
      s.join(`

`),
    ),
    l = Fu(u),
    c = [];
  return (
    r.length && c.push(`scanned:${r.length}/${n.numPages}`),
    u && l < 0.85 && c.push('garbled'),
    {
      text: u,
      pages: n.numPages,
      method: 'pdf',
      scanned: o,
      scannedCount: r.length,
      quality: !u || l < 0.6 ? 'unreadable' : r.length || l < 0.85 ? 'partial' : 'good',
      warnings: c,
    }
  );
}
async function hq(e, a = 0) {
  if (e.size > nq) throw new Error('too_large');
  const t = e.name.toLowerCase();
  if (/\.(txt|md)$/.test(t) || e.type.startsWith('text/')) {
    const n = bo(await e.text()),
      s = Fu(n);
    return {
      text: n,
      method: 'text',
      scanned: [],
      scannedCount: 0,
      quality: s < 0.6 ? 'unreadable' : s < 0.85 ? 'partial' : 'good',
      warnings: s < 0.85 ? ['garbled'] : [],
    };
  }
  if (t.endsWith('.docx')) {
    const s = await (
        await dq()
      ).extractRawText({
        arrayBuffer: await e.arrayBuffer(),
      }),
      r = bo(s.value),
      o = Fu(r);
    return {
      text: r,
      method: 'docx',
      scanned: [],
      scannedCount: 0,
      quality: r ? (o < 0.85 ? 'partial' : 'good') : 'unreadable',
      warnings: r ? [] : ['empty'],
    };
  }
  if (t.endsWith('.doc')) throw new Error('old_doc');
  if (t.endsWith('.pdf') || e.type === 'application/pdf') return cq(await e.arrayBuffer(), a);
  if (/\.(jpe?g|png|webp)$/.test(t) || e.type.startsWith('image/'))
    return {
      text: '',
      method: 'image',
      scanned: [e],
      scannedCount: 1,
      quality: 'unreadable',
      warnings: ['image'],
    };
  throw new Error('unsupported');
}
const Vo = (e) => (e.trim() ? e.trim().split(/\s+/).length : 0);
function mq(e, a) {
  const t = e.split(/(\s+)/).filter((d) => d !== ''),
    n = a.split(/(\s+)/).filter((d) => d !== '');
  if (t.length * n.length > 4e6)
    return [
      {
        t: 'del',
        s: e,
      },
      {
        t: 'add',
        s: a,
      },
    ];
  const s = t.length,
    r = n.length,
    o = Array.from(
      {
        length: s + 1,
      },
      () => new Uint32Array(r + 1),
    );
  for (let d = s - 1; d >= 0; d--)
    for (let h = r - 1; h >= 0; h--) o[d][h] = t[d] === n[h] ? o[d + 1][h + 1] + 1 : Math.max(o[d + 1][h], o[d][h + 1]);
  const u = [],
    l = (d, h) => {
      const m = u[u.length - 1];
      m && m.t === d
        ? (m.s += h)
        : u.push({
            t: d,
            s: h,
          });
    };
  let c = 0,
    p = 0;
  for (; c < s && p < r;)
    t[c] === n[p]
      ? (l('same', t[c]), c++, p++)
      : o[c + 1][p] >= o[c][p + 1]
        ? (l('del', t[c]), c++)
        : (l('add', n[p]), p++);
  for (; c < s;) l('del', t[c++]);
  for (; p < r;) l('add', n[p++]);
  return u;
}
const pq = `Bekzod Rakhimov
Tashkent, Uzbekistan | bekzod.sample@example.com

EDUCATION
Tashkent State University of Economics — Bachelor of Finance (2021–2025)
GPA: 3.2/4.0

EXPERIENCE
Intern, Finance Department — a commercial bank in Tashkent (June 2024 – August 2024)
- Worked as a finance intern.
- Was responsible for various tasks in the department.
- Helped the team with reports.

Volunteer — Youth Club (2022)
- Did volunteering activities.

SKILLS
MS Office, Excel, teamwork, leadership, hardworking, communication, fast learner

LANGUAGES
Uzbek (native), Russian (fluent), English (IELTS 6.0)

HOBBIES
Football, reading, travelling`;
const gq = `Dear Admissions Committee,

I have always been passionate about finance since I was a child. Money and economics have always fascinated me and I dreamed of becoming a successful financial specialist.

I want to study at your university because it is prestigious and internationally recognized. It is one of the best universities in Asia and studying there will help me achieve my dreams.

I am a hardworking and ambitious student with excellent leadership and communication skills. I always try my best and I never give up. I believe I am a perfect fit for this programme.

During my bachelor studies I learned many subjects related to finance and economics. I also did an internship at a bank where I gained a lot of experience.

In the future I want to become a successful person and contribute to the development of my country. I am sure that your programme will give me all the knowledge I need.

Thank you for considering my application.`;
const yq = `Malika Tursunova    malika.sample@example.com
Skills: Python, Stata, R, SQL, Excel (advanced)
Research assistant — Center for Economic Research and Reforms (CERR), Tashkent, 2023–2025: built a panel dataset of 1,200 small and medium enterprises from tax and registry data; co-authored a policy brief on SME lending
EDUCATION
National University of Uzbekistan, BSc Economics, 2019-2023, GPA 3.7/4.0
work experience
Credit Risk Analyst, a commercial bank, Sep 2023 - present
* prepared 36 monthly credit-risk reports for the management board
* automated data cleaning in Python, cutting report preparation from 3 days to 1
Awards — 2nd place, Republican Economics Olympiad (2018)
Languages: Uzbek, Russian, English (IELTS 7.0), Korean (TOPIK 2)
Interests: chess`;
const fq = `Dear Selection Committee,

After graduating from the National University of Uzbekistan in 2022 with a GPA of 3.9, I joined a commercial bank as a senior analyst, where I have now worked for four years.

At CERR, I built a dataset of 5,000 firms. Working with this data showed me how hard it is for small businesses in Uzbekistan to borrow, and I became interested in how credit scoring could include firms without long credit histories.

I want to study Financial Engineering in Korea because Korean banks have used data to expand SME lending. I would like to learn quantitative risk models and apply them when I return to the banking sector in Uzbekistan.

The Global Korea Scholarship would allow me to study full time without leaving my family in debt.`;
const vq = [
  {
    id: 'weak-cv',
    label: {
      en: 'A weak CV',
      uz: 'Zaif CV',
    },
    what: {
      en: 'Vague bullets, no results, unsupported soft skills — see how each line is critiqued.',
      uz: 'Noaniq bandlar, natija yo‘q, asossiz “soft skill”lar — har bir qator qanday tanqid qilinishini ko‘ring.',
    },
    docs: [
      {
        key: 'cv',
        type: 'cv',
        title: {
          en: 'Sample: weak CV (Bekzod)',
          uz: 'Namuna: zaif CV (Bekzod)',
        },
        target: {
          kind: 'uni',
          id: 'universiti-malaya-my',
          level: 'master',
        },
        req: {},
        text: pq,
      },
    ],
  },
  {
    id: 'generic-letter',
    label: {
      en: 'A generic motivation letter',
      uz: 'Shablon motivatsion xat',
    },
    what: {
      en: 'Passion, prestige and “hardworking” clichés — see which sentences are flagged and what you are asked.',
      uz: '“Ishtiyoq”, “nufuzli” va “mehnatkash” kabi shablonlar — qaysi gaplar belgilanishi va sizdan nima so‘ralishini ko‘ring.',
    },
    docs: [
      {
        key: 'letter',
        type: 'motivation',
        title: {
          en: 'Sample: generic letter (Bekzod)',
          uz: 'Namuna: shablon xat (Bekzod)',
        },
        target: {
          kind: 'uni',
          id: 'universiti-malaya-my',
          level: 'master',
        },
        req: {
          wordLimit: 500,
        },
        text: gq,
      },
    ],
  },
  {
    id: 'conflict',
    label: {
      en: 'A CV and letter that contradict',
      uz: 'Bir-biriga zid CV va xat',
    },
    what: {
      en: 'A strong but messy CV, plus a letter with different dates and numbers — try the analysis and the consistency check.',
      uz: 'Kuchli, lekin tartibsiz CV va sanalari, raqamlari boshqacha xat — tahlil va muvofiqlik tekshiruvini sinab ko‘ring.',
    },
    docs: [
      {
        key: 'cv',
        type: 'cv',
        title: {
          en: 'Sample: strong but messy CV (Malika)',
          uz: 'Namuna: kuchli, lekin tartibsiz CV (Malika)',
        },
        target: {
          kind: 'grant',
          id: 'gks-g',
        },
        req: {},
        text: yq,
      },
      {
        key: 'letter',
        type: 'motivation',
        title: {
          en: 'Sample: letter with conflicts (Malika)',
          uz: 'Namuna: ziddiyatli xat (Malika)',
        },
        target: {
          kind: 'grant',
          id: 'gks-g',
        },
        req: {},
        text: fq,
      },
    ],
  },
];
const bq = {
  opening: 'kirish',
  background: 'tarix / asos',
  experience: 'tajriba',
  motivation: 'motivatsiya',
  fit: 'moslik',
  goals: 'maqsadlar',
  conclusion: 'xulosa',
  other: 'boshqa',
};
function Qo({ r: e }) {
  const { tx: a } = useI18n(),
    [t, n, s] = Xz[e];
  return <Badge tone={s}>{a(t, n)}</Badge>;
}
function Si({ items: e }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {e.map((a, t) => (
        <li key={t}>{a}</li>
      ))}
    </ul>
  );
}
const Ul = {
  high: ['Serious', 'Jiddiy', 'bad'],
  medium: ['Noticeable', 'Sezilarli', 'warn'],
  low: ['Minor', 'Kichik', 'neutral'],
};
const Bl = {
  supported: ['Supported', 'Isbotlangan', 'ok'],
  weak: ['Weakly supported', 'Zaif isbot', 'warn'],
  unsupported: ['Not supported', 'Isbotsiz', 'bad'],
};
function CmpLy({ a: e }) {
  const { tx: a } = useI18n();
  return (
    <>
      {e.reviewed && (
        <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ok">
          <ShieldCheck size={14} />
          {a('Checked by a second, stricter reader', 'Ikkinchi, qattiqroq o‘quvchi tomonidan tekshirilgan')}
        </p>
      )}
      {e.firstImpression && (
        <div className="rounded-lg bg-sunken p-3 text-[14px]">
          <p className="text-[12px] font-bold uppercase text-faint">
            {a('First impression (10–15 seconds)', 'Birinchi taassurot (10–15 soniya)')}
          </p>
          <p className="mt-1">{e.firstImpression}</p>
        </div>
      )}
      {e.redFlags.length > 0 && (
        <Se title={a('Red flags a reader would notice', 'O‘quvchi sezadigan xavfli belgilar')} tone="bad">
          <ul className="flex flex-col gap-2.5">
            {e.redFlags.map((t, n) => (
              <li className="flex gap-2" key={n}>
                <TriangleAlert size={15} className="mt-0.5 shrink-0 text-bad" />
                <div className="min-w-0">
                  <p>
                    <Badge tone={Ul[t.severity][2]}>{a(Ul[t.severity][0], Ul[t.severity][1])}</Badge>{' '}
                    <span className="font-semibold">{t.flag}</span>
                  </p>
                  {t.quote && t.quote.quote && (
                    <div className="mt-1">
                      <CmpMi q={t.quote} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Se>
      )}
      {e.claims.length > 0 && (
        <Se title={a('Claims vs evidence', 'Da’vo va dalil')}>
          <p className="mb-2 text-[12.5px] text-muted">
            {a(
              'Every claim a reader sees, and whether the document itself proves it.',
              'O‘quvchi ko‘radigan har bir da’vo va hujjatning o‘zi uni isbotlaydimi.',
            )}
          </p>
          <ul className="grid gap-2">
            {e.claims.map((t, n) => (
              <li className="rounded-lg border border-line p-2.5" key={n}>
                <p className="flex flex-wrap items-center gap-2">
                  <Badge tone={Bl[t.verdict][2]}>{a(Bl[t.verdict][0], Bl[t.verdict][1])}</Badge>
                  <span className="font-semibold">{t.claim}</span>
                </p>
                {t.evidence && t.evidence.quote && (
                  <div className="mt-1">
                    <CmpMi q={t.evidence} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Se>
      )}
    </>
  );
}
function CmpUy({ a: e }) {
  const { tx: a } = useI18n();
  return e.audit.length ? (
    <Callout tone={e.reviewed ? 'info' : 'warn'}>
      <p className="font-bold">
        {e.reviewed
          ? a('What the second reader changed', 'Ikkinchi o‘quvchi nimani o‘zgartirdi')
          : a('Second review', 'Ikkinchi tekshiruv')}
      </p>
      <Si items={e.audit} />
    </Callout>
  ) : null;
}
function CmpKq({ a: e }) {
  const { tx: a } = useI18n();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="text-[16px] font-extrabold">{a('1. Overall assessment', '1. Umumiy baho')}</h3>
          <Qo r={e.readiness} />
        </div>
        <p className="text-[14.5px] leading-relaxed">{e.overall}</p>
      </div>
      <CmpLy a={e} />
      <Se title={a('2. Scorecard', '2. Baholar jadvali')}>
        <p className="mb-2 text-[12.5px] text-muted">
          {a(
            'Advisory scores from 1 (very weak) to 10 (excellent). They are not an official admissions rating and do not predict an outcome.',
            'Maslahat baholari: 1 (juda zaif) dan 10 (a’lo) gacha. Bu rasmiy qabul bahosi emas va natijani bashorat qilmaydi.',
          )}
        </p>
        <Wo scores={e.scores} />
      </Se>
      {e.strengths.length > 0 && (
        <Se title={a('3. Strongest aspects', '3. Eng kuchli tomonlar')} tone="ok">
          <ul className="flex flex-col gap-3">
            {e.strengths.map((t, n) => (
              <li key={n}>
                <p className="font-bold">{t.point}</p>
                {t.evidence && <CmpMi q={t.evidence} />}
                {t.why && <p className="mt-1 text-muted">{t.why}</p>}
              </li>
            ))}
          </ul>
        </Se>
      )}
      {e.weaknesses.length > 0 && (
        <Se title={a('4. Weakest aspects', '4. Eng zaif tomonlar')} tone="bad">
          <ul className="flex flex-col gap-3">
            {e.weaknesses.map((t, n) => (
              <li key={n}>
                <p className="font-bold">{t.point}</p>
                {t.evidence && t.evidence.quote && <CmpMi q={t.evidence} />}
                {t.consequence && (
                  <p className="mt-1 text-muted">
                    {a('Consequence: ', 'Oqibati: ')}
                    {t.consequence}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Se>
      )}
      {e.sections.length > 0 && (
        <Se title={a('5. Section by section', '5. Bo‘limma-bo‘lim tahlil')}>
          <ul className="flex flex-col gap-3">
            {e.sections.map((t, n) => (
              <li className="rounded-lg border border-line p-3" key={n}>
                <p className="font-bold">{t.section}</p>
                <p className="mt-1">{t.assessment}</p>
                {t.issues.length > 0 && (
                  <div className="mt-1 text-muted">
                    <Si items={t.issues} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Se>
      )}
      {e.improvements.length > 0 && (
        <Se
          title={a(
            '6. Recommended improvements (most important first)',
            '6. Tavsiya etilgan o‘zgarishlar (eng muhimi birinchi)',
          )}
        >
          <ol className="list-decimal space-y-2 pl-5">
            {e.improvements.map((t, n) => (
              <li key={n}>
                <span className="font-semibold">{t.change}</span>
                {t.why && (
                  <span className="text-muted">
                    {' — '}
                    {t.why}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </Se>
      )}
      {e.rewrites.length > 0 && (
        <Se title={a('7. Before and after', '7. Oldin va keyin')}>
          <p className="mb-2 text-[12.5px] text-muted">
            {a(
              'Facts are kept. Anything in [square brackets] is information only you can supply — the AI must not invent it.',
              'Faktlar saqlangan. [Kvadrat qavs] ichidagilarni faqat siz to‘ldira olasiz — SI uni o‘ylab topmasligi kerak.',
            )}
          </p>
          <ul className="flex flex-col gap-3">
            {e.rewrites.map((t, n) => (
              <li className="grid gap-2 rounded-lg border border-line p-3 md:grid-cols-2" key={n}>
                <div>
                  <p className="mb-1 text-[12px] font-bold uppercase text-faint">{a('Original', 'Asl')}</p>
                  <CmpMi q={t.original} />
                </div>
                <div>
                  <p className="mb-1 text-[12px] font-bold uppercase text-ok">{a('Improved', 'Yaxshilangan')}</p>
                  <p className="rounded-md bg-ok-soft/60 px-2.5 py-1.5">{t.improved}</p>
                </div>
                {(t.why || t.missingInfo) && (
                  <div className="md:col-span-2 text-[13px] text-muted">
                    {t.why}
                    {t.missingInfo && (
                      <p className="mt-1 font-semibold text-warn">
                        {a('You need to supply: ', 'Siz to‘ldirishingiz kerak: ')}
                        {t.missingInfo}
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Se>
      )}
      {e.actionPlan.length > 0 && (
        <Se title={a('8. Final action plan — do these first', '8. Yakuniy reja — avval shularni qiling')}>
          <ol className="list-decimal space-y-1.5 pl-5 font-semibold">
            {e.actionPlan.map((t, n) => (
              <li key={n}>{t}</li>
            ))}
          </ol>
        </Se>
      )}
      {e.questions.length > 0 && (
        <Se title={a('Questions for you', 'Sizga savollar')}>
          <Si items={e.questions} />
        </Se>
      )}
      {e.limits.length > 0 && (
        <Callout tone="neutral">
          <p className="font-bold">{a('What could not be assessed', 'Baholab bo‘lmagan narsalar')}</p>
          <Si items={e.limits} />
        </Callout>
      )}
      <CmpUy a={e} />
    </div>
  );
}
function CmpXq({ a: e }) {
  const { tx: a, lang: t } = useI18n(),
    n = e.compliance;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="text-[16px] font-extrabold">{a('1. Overall verdict', '1. Umumiy xulosa')}</h3>
          <Qo r={e.readiness} />
        </div>
        <p className="text-[14.5px] leading-relaxed">{e.verdict}</p>
        <p className="mt-1.5 text-[12.5px] text-muted">
          {a(
            'No document can guarantee an offer or a scholarship.',
            'Hech bir hujjat taklif yoki grantni kafolatlay olmaydi.',
          )}
        </p>
      </div>
      {e.fourQuestions.length > 0 && (
        <Se title={a('The four questions every reader asks', 'Har bir o‘quvchi beradigan to‘rt savol')}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {e.fourQuestions.map((s, r) => (
              <li className="rounded-lg border border-line p-2.5" key={r}>
                <p className="flex items-center gap-2">
                  <Badge tone={s.answered === 'yes' ? 'ok' : s.answered === 'partly' ? 'warn' : 'bad'}>
                    {s.answered === 'yes'
                      ? a('Answered', 'Javob bor')
                      : s.answered === 'partly'
                        ? a('Partly', 'Qisman')
                        : a('Not answered', 'Javob yo‘q')}
                  </Badge>
                  <span className="font-bold">
                    {{
                      'why this subject': a('Why this subject?', 'Nega bu soha?'),
                      'why this programme': a('Why this programme?', 'Nega bu dastur?'),
                      'why now': a('Why now?', 'Nega hozir?'),
                      'why you': a('Why you?', 'Nega aynan siz?'),
                    }[s.question] ?? s.question}
                  </span>
                </p>
                {s.comment && <p className="mt-1 text-[13px] text-muted">{s.comment}</p>}
              </li>
            ))}
          </ul>
        </Se>
      )}
      <CmpLy a={e} />
      <Se title={a('2. Scorecard', '2. Baholar jadvali')}>
        <p className="mb-2 text-[12.5px] text-muted">
          {a(
            'Advisory scores from 1 to 10 — not an official rating. “—” means it could not be judged (for example, no target or no stated requirements).',
            'Maslahat baholari 1 dan 10 gacha — rasmiy baho emas. “—” baholab bo‘lmaganini bildiradi (masalan, maqsad yoki talablar ko‘rsatilmagan).',
          )}
        </p>
        <Wo scores={e.scores} />
      </Se>
      {e.works.length > 0 && (
        <Se title={a('3. What works well', '3. Nima yaxshi ishlaydi')} tone="ok">
          <ul className="flex flex-col gap-3">
            {e.works.map((s, r) => (
              <li key={r}>
                <CmpMi q={s.quote} />
                <p className="mt-1 text-muted">{s.why}</p>
              </li>
            ))}
          </ul>
        </Se>
      )}
      {e.weakens.length > 0 && (
        <Se title={a('4. What weakens the letter', '4. Xatni nima zaiflashtiradi')} tone="bad">
          <ul className="flex flex-col gap-3">
            {e.weakens.map((s, r) => (
              <li key={r}>
                <CmpMi q={s.quote} />
                <p className="mt-1">{s.why}</p>
                {s.fix && (
                  <p className="mt-1 text-muted">
                    <span className="font-semibold">{a('Fix: ', 'Tuzatish: ')}</span>
                    {s.fix}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Se>
      )}
      <Se title={a('5. Generic content', '5. Umumiy (shablon) gaplar')} tone="warn">
        {e.generic.length ? (
          <ul className="flex flex-col gap-3">
            {e.generic.map((s, r) => (
              <li key={r}>
                <CmpMi q={s.quote} />
                <p className="mt-1">{s.why}</p>
                {s.ask && (
                  <p className="mt-1 rounded-md bg-info-soft px-2.5 py-1.5 text-[13.5px]">
                    <span className="font-semibold">
                      {a('Answer this to make it yours: ', 'Uni o‘zingizniki qilish uchun shunga javob bering: ')}
                    </span>
                    {s.ask}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">
            {a('No clearly generic passages were flagged.', 'Aniq shablon gaplar topilmadi.')}
          </p>
        )}
      </Se>
      {e.missing.length > 0 && (
        <Se title={a('6. Missing elements', '6. Yetishmayotgan qismlar')}>
          <Si items={e.missing} />
        </Se>
      )}
      {e.paragraphs.length > 0 && (
        <Se title={a('7. Paragraph by paragraph', '7. Xatboshma-xatboshi tahlil')}>
          <ul className="flex flex-col gap-2">
            {e.paragraphs.map((s) => (
              <li className="rounded-lg border border-line p-3" key={s.n}>
                <p className="text-[12.5px] font-bold uppercase text-faint">
                  {a('Paragraph', 'Xatboshi')} {s.n}
                  {s.role ? ` · ${t === 'uz' ? (bq[s.role] ?? s.role) : t === 'ru' ? Bi(s.role) : s.role}` : ''}
                </p>
                <p className="mt-1">{s.assessment}</p>
                {s.issues.length > 0 && (
                  <div className="mt-1 text-muted">
                    <Si items={s.issues} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Se>
      )}
      {e.improvements.length > 0 && (
        <Se
          title={a(
            '8. Recommended improvements (most important first)',
            '8. Tavsiya etilgan o‘zgarishlar (eng muhimi birinchi)',
          )}
        >
          <ol className="list-decimal space-y-2 pl-5">
            {e.improvements.map((s, r) => (
              <li key={r}>
                <span className="font-semibold">{s.change}</span>
                {s.why && (
                  <span className="text-muted">
                    {' — '}
                    {s.why}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </Se>
      )}
      <Se title={a('Compliance with the application’s rules', 'Ariza qoidalariga muvofiqlik')}>
        <Badge tone={n.status === 'met' ? 'ok' : n.status === 'issues' ? 'bad' : 'neutral'}>
          {n.status === 'met'
            ? a('Meets the stated requirements', 'Ko‘rsatilgan talablarga mos')
            : n.status === 'issues'
              ? a('Problems found', 'Muammolar bor')
              : a('Cannot be confirmed — requirements not provided', 'Tasdiqlab bo‘lmaydi — talablar berilmagan')}
        </Badge>
        {n.notes.length > 0 && (
          <div className="mt-2">
            <Si items={n.notes} />
          </div>
        )}
      </Se>
      {e.questions.length > 0 && (
        <Se title={a('Questions for you', 'Sizga savollar')}>
          <Si items={e.questions} />
        </Se>
      )}
      {e.limits.length > 0 && (
        <Callout tone="neutral">
          <p className="font-bold">{a('What could not be assessed', 'Baholab bo‘lmagan narsalar')}</p>
          <Si items={e.limits} />
        </Callout>
      )}
      <CmpUy a={e} />
    </div>
  );
}
const wq = 25;
const jq = {
  cv: 60,
  motivation: 150,
  personal_statement: 150,
  study_plan: 120,
  scholarship_essay: 100,
  recommendation: 120,
  other: 60,
};
function Sq({ onDone: e }) {
  const { upsertAdvisorDoc: a } = useStore(),
    { tx: t, p: n, lang: s } = useI18n(),
    r = ft(),
    [o, u] = React.useState('cv'),
    [l, c] = React.useState(''),
    [p, d] = React.useState({
      kind: 'none',
    }),
    [h, m] = React.useState({}),
    [y, E] = React.useState(''),
    [C, v] = React.useState(),
    [g, b] = React.useState(null),
    [S, A] = React.useState('idle'),
    [q, w] = React.useState(''),
    U = React.useRef(null);
  React.useEffect(
    () => () => {
      var F;
      return (F = U.current) == null ? void 0 : F.abort();
    },
    [],
  );
  const j = async (F) => {
      if (F) {
        (w(''), A('reading'), b(null));
        try {
          const O = await Lh(),
            N = await hq(F, Math.max(O, 0) || 3);
          (b(N), v(F.name), E(N.text), l || c(F.name.replace(/\.[a-z0-9]+$/i, '')));
        } catch (O) {
          const N = O.message;
          w(
            N === 'too_large'
              ? t('The file is larger than 10 MB.', 'Fayl 10 MB dan katta.')
              : N === 'old_doc'
                ? t(
                    'Old .doc files cannot be read. Save it as .docx or PDF, or paste the text.',
                    'Eski .doc fayllarni o‘qib bo‘lmaydi. Uni .docx yoki PDF qilib saqlang yoki matnni joylashtiring.',
                  )
                : N === 'reader_unavailable'
                  ? t(
                      'The file reader could not be loaded (no internet connection?). Please paste the text instead.',
                      'Fayl o‘quvchisini yuklab bo‘lmadi (internet yo‘qmi?). Iltimos, matnni joylashtiring.',
                    )
                  : N === 'unsupported'
                    ? t(
                        'This file type is not supported. Use PDF, DOCX, TXT or a photo of the page.',
                        'Bu fayl turi qo‘llab-quvvatlanmaydi. PDF, DOCX, TXT yoki sahifa rasmidan foydalaning.',
                      )
                    : t(
                        'The file could not be read. Try another format or paste the text.',
                        'Faylni o‘qib bo‘lmadi. Boshqa formatni sinang yoki matnni joylashtiring.',
                      ),
          );
        } finally {
          A('idle');
        }
      }
    },
    k = async () => {
      if (!(g != null && g.scanned.length)) return;
      (w(''), A('ocr'));
      const F = new AbortController();
      U.current = F;
      try {
        const O = await Lh(),
          N = g.scanned.slice(0, O || 1),
          I = Rz(
            await hi(Ez(N.length), {
              images: N,
              tier: 'default',
              signal: F.signal,
            }),
          ),
          f = I.pages.map((D) => D.text).filter(Boolean).join(`

`),
          M = I.pages.filter((D) => D.legible === 'no').length;
        (f.trim()
          ? (E((D) =>
              [D, f].filter((R) => R.trim()).join(`

`),
            ),
            b({
              ...g,
              scanned: [],
              quality: M ? 'partial' : 'good',
              warnings: [...g.warnings, M ? 'ocr_partial' : 'ocr'],
            }))
          : w(
              t(
                'The AI could not read text on these pages. Please paste the text instead.',
                'SI bu sahifalardagi matnni o‘qiy olmadi. Iltimos, matnni joylashtiring.',
              ),
            ),
          g.scannedCount > N.length &&
            w(
              t(
                `Only the first ${N.length} scanned page(s) could be read. Paste the rest manually.`,
                `Faqat birinchi ${N.length} ta skanerlangan sahifa o‘qildi. Qolganini qo‘lda joylashtiring.`,
              ),
            ));
      } catch (O) {
        const N = O;
        N.code !== 'cancelled' && w(N instanceof Oe ? Ta('invalid_json', s) : Ta(N.code, s));
      } finally {
        A('idle');
      }
    },
    K = Vo(y),
    x = () => {
      const F = {
        id: He(),
        type: o,
        title: l.trim() || n(Tt[o]),
        fileName: C,
        addedAt: new Date().toISOString(),
        original: y.trim(),
        working: y.trim(),
        target: p,
        req: h,
        shared: !1,
        history: [],
      };
      (a(F), e(F.id));
    };
  return (
    <Card className="p-4 md:p-5">
      <button
        type="button"
        onClick={() => e(null)}
        className="mb-3 inline-flex items-center gap-1 text-[13.5px] font-semibold text-muted hover:text-fg"
      >
        <ArrowLeft size={15} />
        {t('Back to my documents', 'Hujjatlarimga qaytish')}
      </button>
      <h2 className="mb-3 text-[18px] font-extrabold">{t('Add a document', 'Hujjat qo‘shish')}</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid content-start gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('Document type', 'Hujjat turi')} htmlFor="d-type">
              <Select id="d-type" value={o} onChange={(F) => u(F.target.value)}>
                {Kz.map((F) => (
                  <option value={F} key={F}>
                    {n(Tt[F])}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('Name for it', 'Nomi')} htmlFor="d-title" optional={!0}>
              <Input id="d-title" value={l} onChange={(F) => c(F.target.value)} placeholder={n(Tt[o])} />
            </Field>
          </div>
          <Cmp$d value={p} onChange={d} req={h} onReq={m} showReq={o !== 'cv'} />
        </div>
        <div className="grid content-start gap-3">
          <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-line bg-sunken/50 px-4 py-5 text-center hover:border-teal/50">
            <Upload size={22} className="text-faint" />
            <span className="text-[14px] font-bold">{t('Upload PDF, DOCX or TXT', 'PDF, DOCX yoki TXT yuklang')}</span>
            <span className="text-[12.5px] text-muted">
              {t(
                'or a photo/scan of the page (JPG, PNG). Up to 10 MB.',
                'yoki sahifa rasmi/skaneri (JPG, PNG). 10 MB gacha.',
              )}
            </span>
            <input
              type="file"
              accept={sq}
              className="sr-only"
              onChange={(F) => {
                var O;
                (j((O = F.target.files) == null ? void 0 : O[0]), (F.target.value = ''));
              }}
            />
          </label>
          {S === 'reading' && <Fi label={t('Reading the file…', 'Fayl o‘qilmoqda…')} />}
          {g && g.scannedCount > 0 && g.scanned.length > 0 && (
            <Callout tone="warn">
              <p>
                {g.method === 'image'
                  ? t(
                      'This is an image, so its text must be read first.',
                      'Bu rasm, shuning uchun avval matni o‘qilishi kerak.',
                    )
                  : t(
                      `${g.scannedCount} page(s) look scanned (no text layer).`,
                      `${g.scannedCount} ta sahifa skanerlangan ko‘rinadi (matn qatlami yo‘q).`,
                    )}
              </p>
              {r.live ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {S === 'ocr' ? (
                    <>
                      <Fi label={t('AI is reading the pages…', 'SI sahifalarni o‘qimoqda…')} />
                      <Button
                        size="sm"
                        icon={<Square size={13} />}
                        onClick={() => {
                          var F;
                          return (F = U.current) == null ? void 0 : F.abort();
                        }}
                      >
                        {t('Stop', 'To‘xtatish')}
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" icon={<ScanText size={15} />} onClick={k}>
                      {t('Read the pages with AI', 'Sahifalarni SI bilan o‘qish')}
                    </Button>
                  )}
                  <span className="text-[12px] text-muted">
                    {t(
                      'Page images are sent to the AI. Check the result below before saving.',
                      'Sahifa rasmlari SI ga yuboriladi. Saqlashdan oldin natijani tekshiring.',
                    )}
                  </span>
                </div>
              ) : (
                <p className="mt-1">
                  {t(
                    'AI reading is not available here. Please paste the text below.',
                    'Bu yerda SI orqali o‘qish mavjud emas. Iltimos, matnni quyiga joylashtiring.',
                  )}
                </p>
              )}
            </Callout>
          )}
          {g && g.warnings.includes('garbled') && (
            <Callout tone="warn">
              {t(
                'Some text came out garbled (unusual fonts or layout). Check and correct it below before analysis.',
                'Matnning bir qismi buzilib chiqdi (g‘ayrioddiy shrift yoki tuzilma). Tahlildan oldin quyida tekshirib tuzating.',
              )}
            </Callout>
          )}
          <Field
            label={t(
              'Document text (check it — this is exactly what will be analysed)',
              'Hujjat matni (tekshiring — aynan shu tahlil qilinadi)',
            )}
            htmlFor="d-text"
            hint={`${K} ${t('words', 'so‘z')}`}
          >
            <Textarea
              id="d-text"
              className="min-h-[260px] text-[13.5px]"
              value={y}
              onChange={(F) => E(F.target.value)}
              placeholder={t('…or paste the text here', '…yoki matnni shu yerga joylashtiring')}
            />
          </Field>
          {q && (
            <p className="text-[13px] font-semibold text-bad" role="alert">
              {q}
            </p>
          )}
          <p className="text-[12.5px] text-muted">
            {t(
              'Saved only in this browser — not on a server. The text is sent to the AI only when you press Analyse or Improve. You can delete it at any time.',
              'Faqat shu brauzerda saqlanadi — serverda emas. Matn faqat “Tahlil” yoki “Yaxshilash”ni bosganingizda SI ga yuboriladi. Istalgan vaqtda o‘chirishingiz mumkin.',
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              icon={<Check size={16} />}
              disabled={K < 10 || S !== 'idle' || (p.kind === 'custom' && !p.name.trim())}
              onClick={x}
            >
              {t('Save document', 'Hujjatni saqlash')}
            </Button>
            <Button variant="ghost" onClick={() => e(null)}>
              {t('Cancel', 'Bekor qilish')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
const zq = {
  improve: ['Improve this paragraph', 'Shu xatboshini yaxshilash'],
  professional: ['Make it more professional', 'Professionalroq qilish'],
  repetition: ['Remove repetition', 'Takrorlarni olib tashlash'],
  specific: ['Make it more specific', 'Aniqroq qilish'],
  connect: ['Link my experience to the degree', 'Tajribamni darajaga bog‘lash'],
  goals: ['Strengthen career objectives', 'Karyera maqsadini kuchaytirish'],
  grammar: ['Check grammar only', 'Faqat grammatikani tekshirish'],
  voice: ['Rewrite, keep my voice', 'Ovozimni saqlab qayta yozish'],
};
function CmpDy({ a: e, b: a }) {
  const t = mq(e, a);
  return (
    <p className="whitespace-pre-wrap text-[14px] leading-relaxed">
      {t.map((n, s) =>
        n.t === 'same' ? (
          <span key={s}>{n.s}</span>
        ) : n.t === 'add' ? (
          <ins className="rounded bg-ok-soft px-0.5 text-ok no-underline" key={s}>
            {n.s}
          </ins>
        ) : (
          <del className="rounded bg-bad-soft px-0.5 text-bad" key={s}>
            {n.s}
          </del>
        ),
      )}
    </p>
  );
}
function CmpQq({ d: e }) {
  const { upsertAdvisorDoc: a } = useStore(),
    { tx: t, lang: n } = useI18n(),
    s = ft(),
    r = oy(e.working),
    [o, u] = React.useState(0),
    [l, c] = React.useState('improve'),
    [p, d] = React.useState(''),
    [h, m] = React.useState(null),
    [y, E] = React.useState(!1),
    [C, v] = React.useState(''),
    g = React.useRef(null);
  React.useEffect(
    () => () => {
      var w;
      return (w = g.current) == null ? void 0 : w.abort();
    },
    [],
  );
  const b = r[Math.min(o, r.length - 1)] ?? '',
    S = async () => {
      if (y || !b) return;
      (v(''), m(null), E(!0));
      const w = new AbortController();
      g.current = w;
      try {
        const U = await hi(
          jz({
            lang: n,
            docType: e.type,
            passage: b,
            action: l,
            instruction: p,
            fullText: e.working,
            target: Rs(e.target, e.req, n),
          }),
          {
            tier: 'default',
            signal: w.signal,
          },
        );
        m(Pz(U));
      } catch (U) {
        const j = U;
        j.code !== 'cancelled' && v(j instanceof Oe ? Ta('invalid_json', n) : Ta(j.code, n));
      } finally {
        E(!1);
      }
    },
    A = () => {
      if (!h) return;
      const w = e.working.replace(b, () => h.revised);
      (a({
        ...e,
        working: w,
        history: [
          ...e.history,
          {
            at: new Date().toISOString(),
            action: l,
            before: b,
            after: h.revised,
          },
        ].slice(-30),
      }),
        m(null));
    },
    q = () => {
      const w = e.history[e.history.length - 1];
      w &&
        a({
          ...e,
          working: e.working.replace(w.after, () => w.before),
          history: e.history.slice(0, -1),
        });
    };
  return s.live ? (
    <div className="grid gap-4">
      <Callout tone="info">
        {t(
          'You stay in control: suggestions never change your document until you press Accept, and your original upload is never overwritten. The AI must keep your facts — anything in [brackets] is for you to fill in.',
          'Nazorat sizda: “Qabul qilish”ni bosmaguningizcha takliflar hujjatni o‘zgartirmaydi, asl yuklangan matn hech qachon ustidan yozilmaydi. SI faktlaringizni saqlashi shart — [qavs] ichidagilarni o‘zingiz to‘ldirasiz.',
        )}
      </Callout>
      <Field label={t('Paragraph to work on', 'Ishlanadigan xatboshi')} htmlFor="imp-p">
        <Select
          id="imp-p"
          value={o}
          onChange={(w) => {
            (u(Number(w.target.value)), m(null));
          }}
        >
          {r.map((w, U) => (
            <option value={U} key={U}>
              {U + 1}
              {'. '}
              {w.slice(0, 80)}
              {w.length > 80 ? '…' : ''}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex flex-wrap gap-1.5">
        {xz.map((w) => (
          <button
            type="button"
            aria-pressed={l === w}
            onClick={() => c(w)}
            className={classNames(
              'rounded-full border px-3 py-1.5 text-[13px] font-semibold',
              l === w ? 'border-teal bg-teal-soft text-teal-ink' : 'border-line text-muted hover:text-fg',
            )}
            key={w}
          >
            {t(...zq[w])}
          </button>
        ))}
      </div>
      <Field label={t('Anything specific? (optional)', 'Aniq istak bormi? (ixtiyoriy)')} htmlFor="imp-i">
        <Input
          id="imp-i"
          value={p}
          onChange={(w) => d(w.target.value)}
          placeholder={t('e.g. keep it under 80 words', 'masalan, 80 so‘zdan oshmasin')}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        {y ? (
          <>
            <Fi />
            <Button
              size="sm"
              icon={<Square size={13} />}
              onClick={() => {
                var w;
                return (w = g.current) == null ? void 0 : w.abort();
              }}
            >
              {t('Stop', 'To‘xtatish')}
            </Button>
          </>
        ) : (
          <Button variant="primary" icon={<Sparkles size={16} />} onClick={S} disabled={!b}>
            {t('Suggest a revision', 'Tahrir taklif qilish')}
          </Button>
        )}
        {e.history.length > 0 && !y && (
          <Button icon={<Undo2 size={15} />} onClick={q}>
            {t('Undo last accepted change', 'Oxirgi qabul qilingan o‘zgarishni bekor qilish')}
          </Button>
        )}
      </div>
      {C && (
        <p className="text-[13px] font-semibold text-bad" role="alert">
          {C}
        </p>
      )}
      {h && (
        <Card className="border-teal/40 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-[12px] font-bold uppercase text-faint">{t('Your text', 'Sizning matningiz')}</p>
              <p className="whitespace-pre-wrap rounded-lg bg-sunken p-3 text-[14px]">{b}</p>
            </div>
            <div>
              <p className="mb-1 text-[12px] font-bold uppercase text-ok">{t('Suggested', 'Taklif')}</p>
              <p className="whitespace-pre-wrap rounded-lg bg-ok-soft/50 p-3 text-[14px]">{h.revised}</p>
            </div>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-[13px] font-bold">
              {t('Show word-by-word changes', 'So‘zma-so‘z o‘zgarishlarni ko‘rsatish')}
            </summary>
            <div className="mt-2 rounded-lg border border-line p-3">
              <CmpDy a={b} b={h.revised} />
            </div>
          </details>
          {h.changes.length > 0 && (
            <div className="mt-3">
              <p className="font-bold">{t('What changed and why', 'Nima o‘zgardi va nega')}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-[13.5px]">
                {h.changes.map((w, U) => (
                  <li key={U}>
                    <span className="font-semibold">{w.what}</span>
                    {w.why && (
                      <span className="text-muted">
                        {' — '}
                        {w.why}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {h.questions.length > 0 && (
            <div className="mt-3 rounded-lg bg-info-soft p-3 text-[13.5px]">
              <p className="font-bold">{t('Information only you can add', 'Faqat siz qo‘sha oladigan ma’lumot')}</p>
              <ul className="mt-1 list-disc pl-5">
                {h.questions.map((w, U) => (
                  <li key={U}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {h.warnings.length > 0 && (
            <div className="mt-3">
              <Callout tone="warn">
                <ul className="list-disc pl-4">
                  {h.warnings.map((w, U) => (
                    <li key={U}>{w}</li>
                  ))}
                </ul>
              </Callout>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" icon={<Check size={16} />} onClick={A}>
              {t('Accept into my working copy', 'Ishchi nusxaga qabul qilish')}
            </Button>
            <Button icon={<X size={16} />} onClick={() => m(null)}>
              {t('Reject', 'Rad etish')}
            </Button>
            <Button variant="ghost" icon={<RotateCcw size={15} />} onClick={S}>
              {t('Try another version', 'Boshqa variant')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  ) : (
    <Callout tone="warn">
      {t(
        'Improvement suggestions need live AI, which is not connected in this view. Nothing was generated.',
        'Yaxshilash takliflari uchun jonli SI kerak, u bu ko‘rinishda ulanmagan. Hech narsa yaratilmadi.',
      )}
    </Callout>
  );
}
async function Eq(e, a) {
  var t;
  try {
    const n = (t = window.claude) != null && t.use ? await window.claude.use('downloads') : null;
    if (n)
      return (
        await n.save({
          filename: e,
          data: a,
        }),
        !0
      );
  } catch {}
  try {
    const n = document.createElement('a');
    return (
      (n.href = URL.createObjectURL(
        new Blob([a], {
          type: 'text/plain;charset=utf-8',
        }),
      )),
      (n.download = e),
      n.click(),
      setTimeout(() => URL.revokeObjectURL(n.href), 2e3),
      !0
    );
  } catch {
    return !1;
  }
}
function Aq({ d: e, onBack: a }) {
  const { state: t, upsertAdvisorDoc: n, removeAdvisorDoc: s, notify: r } = useStore(),
    { tx: o, p: u, lang: l } = useI18n(),
    c = ft(),
    [p, d] = React.useState('analysis'),
    [h, m] = React.useState(!1),
    [y, E] = React.useState(''),
    [C, v] = React.useState(!1),
    [g, b] = React.useState(0),
    [S, A] = React.useState(!0),
    q = React.useRef(null);
  React.useEffect(
    () => () => {
      var x;
      return (x = q.current) == null ? void 0 : x.abort();
    },
    [],
  );
  const w = Vo(e.working),
    U = w < wq,
    j = !U && w < jq[e.type],
    k =
      e.analysis &&
      e.analysis.textAt === 'working' &&
      e.history.length > 0 &&
      e.analysis.at < e.history[e.history.length - 1].at,
    K = async () => {
      if (h) return;
      (E(''), m(!0), b(1));
      const x = new AbortController();
      q.current = x;
      try {
        const F = Rs(e.target, e.req, l),
          O = Os(t.profile),
          N = e.type === 'cv',
          I = (D) => (N ? Bz(D, e.working) : Lz(D, e.working));
        let f;
        if (N)
          f = await hi(
            vz({
              lang: l,
              cv: Al(e.working, 'lines'),
              target: F,
              profile: O,
            }),
            {
              tier: 'complex',
              signal: x.signal,
            },
          );
        else {
          const D =
            t.advisorDocs.find((R) => R.type === 'cv' && R.id !== e.id && nn(R.target) === nn(e.target)) ??
            t.advisorDocs.find((R) => R.type === 'cv');
          f = await hi(
            kz({
              lang: l,
              type: e.type,
              text: Al(e.working, 'paragraphs'),
              words: w,
              target: F,
              profile: O,
              cvForContext: D == null ? void 0 : D.working,
            }),
            {
              tier: 'complex',
              signal: x.signal,
            },
          );
        }
        let M = I(f);
        if (S) {
          b(2);
          try {
            M = {
              ...I(
                await hi(
                  Az({
                    lang: l,
                    kind: N ? 'cv' : 'letter',
                    doc: Al(e.working, N ? 'lines' : 'paragraphs'),
                    draft: f,
                    target: F,
                  }),
                  {
                    tier: 'complex',
                    signal: x.signal,
                  },
                ),
              ),
              reviewed: !0,
            };
          } catch (D) {
            if (D.code === 'cancelled') throw D;
            M = {
              ...M,
              reviewed: !1,
              audit: [
                o(
                  'The second-reader review could not be completed, so this is the first reviewer’s analysis only.',
                  'Ikkinchi o‘quvchi tekshiruvi yakunlanmadi, shuning uchun bu faqat birinchi tahlil.',
                ),
              ],
            };
          }
        }
        n({
          ...e,
          analysis: {
            at: new Date().toISOString(),
            textAt: 'working',
            result: M,
            tier: S ? 'complex+audit' : 'complex',
          },
        });
      } catch (F) {
        const O = F;
        O.code !== 'cancelled' && E(O instanceof Oe ? Ta('invalid_json', l) : Ta(O.code, l));
      } finally {
        (m(!1), b(0));
      }
    };
  return (
    <div className="grid gap-4">
      <button
        type="button"
        onClick={a}
        className="inline-flex items-center gap-1 self-start text-[13.5px] font-semibold text-muted hover:text-fg"
      >
        <ArrowLeft size={15} />
        {o('My documents', 'Hujjatlarim')}
      </button>
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">{u(Tt[e.type])}</p>
            <h2 className="text-[19px] font-extrabold">{e.title}</h2>
            <p className="mt-0.5 text-[13px] text-muted">
              {mn(e.target, l)}
              {' · '}
              {w} {o('words', 'so‘z')}
              {e.req.wordLimit ? ` / ${e.req.wordLimit}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CmpHa
              id={`share-${e.id}`}
              checked={e.shared}
              onChange={(x) =>
                n({
                  ...e,
                  shared: x,
                })
              }
              label={o('Use in “Ask the AI”', '“SI dan so‘rash”da ishlatish')}
            />
            <Button size="sm" variant="ghost" onClick={() => v(!C)}>
              {o('Change target', 'Maqsadni o‘zgartirish')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 size={14} />}
              onClick={() => {
                (s(e.id), a());
              }}
            >
              {o('Delete', 'O‘chirish')}
            </Button>
          </div>
        </div>
        {C && (
          <div className="mt-3 border-t border-line pt-3">
            <Cmp$d
              value={e.target}
              onChange={(x) =>
                n({
                  ...e,
                  target: x,
                })
              }
              req={e.req}
              onReq={(x) =>
                n({
                  ...e,
                  req: x,
                })
              }
              showReq={e.type !== 'cv'}
            />
          </div>
        )}
      </Card>
      <Tabs
        value={p}
        onChange={d}
        items={[
          {
            id: 'analysis',
            label: o('Analysis', 'Tahlil'),
          },
          {
            id: 'improve',
            label: o('Improve', 'Yaxshilash'),
          },
          {
            id: 'text',
            label: o('Text and versions', 'Matn va versiyalar'),
          },
        ]}
      />
      <Card className="p-4 md:p-5">
        {p === 'analysis' && (
          <div className="grid gap-4">
            {!c.live && (
              <Callout tone="warn">
                {o(
                  'Live AI needs an account, so no AI analysis can be run. Sign in to use it. The rule-based Writing tutor still works for essays.',
                  'Jonli SI uchun akkaunt kerak, shuning uchun SI tahlili bajarilmaydi. Foydalanish uchun kiring. Insholar uchun qoidaga asoslangan Yozish yordamchisi ishlayveradi.',
                )}
              </Callout>
            )}
            {j && (
              <Callout tone="info">
                {o(
                  `This is short for this kind of document (${w} words). If the file was only partly read, paste the full text first; otherwise the analysis will treat the length as part of the review.`,
                  `Bu turdagi hujjat uchun qisqa (${w} so‘z). Fayl qisman o‘qilgan bo‘lsa, avval to‘liq matnni joylashtiring; aks holda tahlil uzunlikni ham baholaydi.`,
                )}
              </Callout>
            )}
            {U && (
              <Callout tone="warn">
                {o(
                  `The text is too short to analyse reliably (${w} words). Check that the whole document was read.`,
                  `Matn ishonchli tahlil uchun juda qisqa (${w} so‘z). Butun hujjat o‘qilganini tekshiring.`,
                )}
              </Callout>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {h ? (
                <>
                  <Fi
                    label={
                      g === 2
                        ? o(
                            'Step 2 of 2: a second, stricter reader is checking the analysis…',
                            '2/2-qadam: ikkinchi, qattiqroq o‘quvchi tahlilni tekshirmoqda…',
                          )
                        : o(
                            S
                              ? 'Step 1 of 2: analysing — usually 30–90 seconds…'
                              : 'Analysing — usually 30–90 seconds…',
                            S
                              ? '1/2-qadam: tahlil qilinmoqda — odatda 30–90 soniya…'
                              : 'Tahlil qilinmoqda — odatda 30–90 soniya…',
                          )
                    }
                  />
                  <Button
                    size="sm"
                    icon={<Square size={13} />}
                    onClick={() => {
                      var x;
                      return (x = q.current) == null ? void 0 : x.abort();
                    }}
                  >
                    {o('Stop', 'To‘xtatish')}
                  </Button>
                </>
              ) : (
                <Button variant="primary" icon={<Sparkles size={16} />} disabled={!c.live || U} onClick={K}>
                  {e.analysis
                    ? o('Analyse again', 'Qayta tahlil qilish')
                    : o('Analyse this document', 'Hujjatni tahlil qilish')}
                </Button>
              )}
              {!h && (
                <CmpHa
                  id={`sr-${e.id}`}
                  checked={S}
                  onChange={A}
                  label={o(
                    'Second-reader check (stricter, takes about twice as long)',
                    'Ikkinchi o‘quvchi tekshiruvi (qattiqroq, taxminan ikki baravar uzoq)',
                  )}
                />
              )}
              {e.analysis && !h && (
                <span className="text-[12.5px] text-muted">
                  {o('Last analysed', 'Oxirgi tahlil')}
                  {': '}
                  {new Date(e.analysis.at).toLocaleString()}
                </span>
              )}
            </div>
            {y && (
              <p className="text-[13px] font-semibold text-bad" role="alert">
                {y}
              </p>
            )}
            {k && (
              <Callout tone="info">
                {o(
                  'You have accepted changes since this analysis. Analyse again to review the current version.',
                  'Bu tahlildan keyin o‘zgarishlar qabul qildingiz. Joriy versiyani ko‘rish uchun qayta tahlil qiling.',
                )}
              </Callout>
            )}
            {e.analysis &&
              (e.analysis.result.kind === 'cv' ? <CmpKq a={e.analysis.result} /> : <CmpXq a={e.analysis.result} />)}
          </div>
        )}
        {p === 'improve' && <CmpQq d={e} />}
        {p === 'text' && (
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                icon={<Download size={14} />}
                onClick={async () => {
                  (await Eq(
                    `${e.title.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'document'} (working copy).txt`,
                    e.working,
                  )) ||
                    r(
                      o(
                        'Download was not possible here — copy the text instead.',
                        'Bu yerda yuklab bo‘lmadi — matnni nusxalang.',
                      ),
                    );
                }}
              >
                {o('Download working copy (.txt)', 'Ishchi nusxani yuklab olish (.txt)')}
              </Button>
              {e.working !== e.original && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<RotateCcw size={14} />}
                  onClick={() =>
                    n({
                      ...e,
                      working: e.original,
                      history: [],
                    })
                  }
                >
                  {o('Restore the original', 'Asl nusxani tiklash')}
                </Button>
              )}
            </div>
            {e.working === e.original ? (
              <p className="text-[13px] text-muted">
                {o(
                  'No accepted changes yet — the working copy equals your original.',
                  'Hali qabul qilingan o‘zgarish yo‘q — ishchi nusxa aslidek.',
                )}
              </p>
            ) : (
              <div>
                <p className="mb-1 text-[13px] font-bold">
                  {o(
                    'Original → working copy (green added, red removed)',
                    'Asl → ishchi nusxa (yashil — qo‘shilgan, qizil — olib tashlangan)',
                  )}
                </p>
                <div className="rounded-lg border border-line p-3">
                  <CmpDy a={e.original} b={e.working} />
                </div>
              </div>
            )}
            <Field
              label={o(
                'Working copy (you can edit it directly)',
                'Ishchi nusxa (to‘g‘ridan-to‘g‘ri tahrirlash mumkin)',
              )}
              htmlFor={`w-${e.id}`}
            >
              <Textarea
                id={`w-${e.id}`}
                className="min-h-[280px] text-[13.5px]"
                value={e.working}
                onChange={(x) =>
                  n({
                    ...e,
                    working: x.target.value,
                  })
                }
              />
            </Field>
          </div>
        )}
      </Card>
    </div>
  );
}
function Tq({ onOpen: e }) {
  const { state: a, upsertAdvisorDoc: t } = useStore(),
    { tx: n, p: s } = useI18n(),
    r = (o) => {
      let u = '';
      for (const l of [...o.docs].reverse()) {
        const c = s(l.title),
          p = a.advisorDocs.find((h) => h.title === c && h.original === l.text),
          d = (p == null ? void 0 : p.id) ?? He();
        (p ||
          t({
            id: d,
            type: l.type,
            title: c,
            addedAt: new Date().toISOString(),
            original: l.text,
            working: l.text,
            target: l.target,
            req: l.req,
            shared: !1,
            history: [],
          }),
          (u = d));
      }
      e(u);
    };
  return (
    <Card className="p-4">
      <p className="flex items-center gap-2 text-[14.5px] font-extrabold">
        <FlaskConical size={16} />
        {n('Try it with a sample', 'Namuna bilan sinab ko‘ring')}
      </p>
      <p className="mt-0.5 text-[13px] text-muted">
        {n(
          'Fictional documents with typical problems, so you can see a full review before uploading your own.',
          'O‘z hujjatingizni yuklashdan oldin to‘liq tahlilni ko‘rishingiz uchun odatiy xatolari bor to‘qima hujjatlar.',
        )}
      </p>
      <ul className="mt-3 grid gap-2 md:grid-cols-3">
        {vq.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => r(o)}
              className="h-full w-full rounded-lg border border-line p-3 text-left hover:border-teal/50 hover:bg-sunken/50"
            >
              <span className="block text-[14px] font-bold">{s(o.label)}</span>
              <span className="mt-0.5 block text-[12.5px] text-muted">{s(o.what)}</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
function Nq() {
  const { state: e } = useStore(),
    { tx: a, p: t, lang: n } = useI18n(),
    [s, r] = React.useState(null),
    o = s && s !== 'add' ? e.advisorDocs.find((u) => u.id === s) : null;
  return s === 'add' ? (
    <Sq onDone={(u) => r(u)} />
  ) : o ? (
    <Aq d={o} onBack={() => r(null)} />
  ) : (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-2xl text-[14px] text-muted">
          {a(
            'Upload your CV, motivation letter, personal statement, study plan, scholarship essay or a recommendation draft. You get an honest, evidence-based review — strengths, weaknesses with quotes, and what to fix first.',
            'CV, motivatsion xat, shaxsiy bayonot, o‘qish rejasi, grant inshosi yoki tavsiyanoma qoralamasini yuklang. Halol, dalilga asoslangan tahlil olasiz — kuchli tomonlar, iqtiboslar bilan zaif tomonlar va avval nimani tuzatish kerakligi.',
          )}
        </p>
        <Button variant="primary" icon={<Upload size={16} />} onClick={() => r('add')}>
          {a('Add a document', 'Hujjat qo‘shish')}
        </Button>
      </div>
      <Tq onOpen={(u) => r(u)} />
      {e.advisorDocs.length === 0 ? (
        <EmptyState
          icon={<FileText size={26} />}
          title={a('No documents yet', 'Hali hujjat yo‘q')}
          body={a(
            'Documents are saved in this browser, and in your account if you are signed in. Nothing is sent to the AI until you ask for an analysis.',
            'Hujjatlar shu brauzerda, kirgan bo‘lsangiz akkauntingizda ham saqlanadi. Tahlil so‘ramaguningizcha SI ga hech narsa yuborilmaydi.',
          )}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {e.advisorDocs.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => r(u.id)}
                className="flex h-full w-full flex-col gap-1.5 rounded-xl border border-line bg-surface p-4 text-left shadow-card hover:border-teal/50"
              >
                <span className="text-[12px] font-bold uppercase text-faint">{t(Tt[u.type])}</span>
                <span className="text-[16px] font-extrabold">{u.title}</span>
                <span className="text-[13px] text-muted">
                  {mn(u.target, n)}
                  {' · '}
                  {Vo(u.working)} {a('words', 'so‘z')}
                </span>
                <span className="mt-1 flex flex-wrap gap-1.5">
                  {u.analysis ? (
                    <Qo r={u.analysis.result.readiness} />
                  ) : (
                    <Badge tone="neutral">{a('Not analysed yet', 'Hali tahlil qilinmagan')}</Badge>
                  )}
                  {u.shared && (
                    <Badge tone="teal" icon={<Share2 size={11} />}>
                      {a('Shared with chat', 'Suhbatga ulashilgan')}
                    </Badge>
                  )}
                  {u.working !== u.original && <Badge tone="info">{a('Edited copy', 'Tahrirlangan nusxa')}</Badge>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
function Cq({ f: e }) {
  const { tx: a } = useI18n(),
    t = (n, s, r) =>
      s.length > 0 && (
        <div>
          <p className={`font-bold ${r}`}>{n}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {s.map((o, u) => (
              <li key={u}>{o}</li>
            ))}
          </ul>
        </div>
      );
  return (
    <div className="grid gap-3 text-[14px]">
      {t(a('1. What was effective', '1. Nima samarali bo‘ldi'), e.effective, 'text-ok')}
      {t(a('2. What was weak', '2. Nima zaif bo‘ldi'), e.weak, 'text-bad')}
      {t(a('3. What was missing', '3. Nima yetishmadi'), e.missing, 'text-warn')}
      {t(a('4. How to improve it', '4. Qanday yaxshilash mumkin'), e.improve, '')}
      {e.stronger && (
        <div className="rounded-lg bg-ok-soft/50 p-3">
          <p className="font-bold">
            {a(
              '5. A stronger answer — built only from your own background',
              '5. Kuchliroq javob — faqat o‘z ma’lumotlaringizdan',
            )}
          </p>
          <p className="mt-1 whitespace-pre-wrap">{e.stronger}</p>
          {e.strongerNote && <p className="mt-1.5 text-[13px] font-semibold text-warn">{e.strongerNote}</p>}
        </div>
      )}
      <Wo scores={e.scores} />
      <p className="text-[12px] text-muted">
        {a(
          'Judged from your written answer only — speaking confidence, pace and body language cannot be measured from text.',
          'Faqat yozma javobingiz bo‘yicha baholandi — gapirishdagi ishonch, sur’at va tana tilini matndan o‘lchab bo‘lmaydi.',
        )}
      </p>
    </div>
  );
}
function Mq(e) {
  const a = [],
    t = Os(e.profile);
  t && a.push(`Profile: ${JSON.stringify(t)}`);
  for (const n of e.advisorDocs.filter((s) => s.type === 'cv' || s.shared).slice(0, 3))
    a.push(`${n.type.toUpperCase()} (${n.title}):
${n.working.slice(0, 3500)}`);
  return a.join(`

`);
}
function Iq() {
  const { state: e, upsertInterview: a, removeInterview: t } = useStore(),
    { tx: n, lang: s } = useI18n(),
    r = ft(),
    [o, u] = React.useState({
      kind: 'grant',
      id: 'gks-g',
    }),
    [l, c] = React.useState('scholarship'),
    [p, d] = React.useState(6),
    [h, m] = React.useState(''),
    [y, E] = React.useState(null),
    [C, v] = React.useState(''),
    [g, b] = React.useState(''),
    [S, A] = React.useState(''),
    [q, w] = React.useState(0),
    U = React.useRef(null);
  React.useEffect(
    () => () => {
      var I;
      return (I = U.current) == null ? void 0 : I.abort();
    },
    [],
  );
  const j = y ? (e.interviews.find((I) => I.id === y) ?? null) : null,
    k = (I) => {
      const f = I;
      f.code !== 'cancelled' && A(f instanceof Oe ? Ta('invalid_json', s) : Ta(f.code, s));
    },
    K = async () => {
      if (g) return;
      (A(''), b('questions'));
      const I = new AbortController();
      U.current = I;
      const f = [Mq(e), h.trim() && `Applicant adds: ${h.trim()}`].filter(Boolean).join(`

`);
      try {
        const M = Fz(
            await hi(
              Sz({
                lang: s,
                target: Rs(o, void 0, s),
                background: f,
                count: p,
                kind: l,
              }),
              {
                tier: 'default',
                signal: I.signal,
              },
            ),
          ),
          D = {
            id: He(),
            at: new Date().toISOString(),
            targetLabel: mn(o, s),
            target: o,
            background: f,
            questions: M,
            answers: [],
          };
        (a(D), E(D.id), w(0), v(''));
      } catch (M) {
        k(M);
      } finally {
        b('');
      }
    },
    x = async () => {
      if (!j || g || !C.trim()) return;
      (A(''), b('feedback'));
      const I = new AbortController();
      U.current = I;
      try {
        const f = Dz(
          await hi(
            zz({
              lang: s,
              target: Rs(j.target, void 0, s),
              background: j.background,
              question: j.questions[q].q,
              answer: C,
              earlier: j.answers.map((M) => ({
                q: j.questions[M.i].q,
                a: M.answer,
              })),
            }),
            {
              tier: 'default',
              signal: I.signal,
            },
          ),
        );
        a({
          ...j,
          answers: [
            ...j.answers.filter((M) => M.i !== q),
            {
              i: q,
              answer: C,
              feedback: f,
            },
          ],
        });
      } catch (f) {
        k(f);
      } finally {
        b('');
      }
    };
  if (!r.live && !r.checking)
    return (
      <Callout tone="warn">
        {n(
          'The interview simulator needs live AI, which needs an account. Sign in to use it. Nothing was simulated.',
          'Suhbat simulyatori uchun jonli SI kerak, u uchun akkaunt kerak. Foydalanish uchun kiring. Hech narsa simulyatsiya qilinmadi.',
        )}
      </Callout>
    );
  if (!j)
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="grid gap-3 p-4 md:p-5">
          <h2 className="flex items-center gap-2 text-[18px] font-extrabold">
            <Mic size={18} />
            {n('Practise an interview', 'Suhbatni mashq qilish')}
          </h2>
          <p className="text-[14px] text-muted">
            {n(
              'The AI acts as a strict but fair panel: one question at a time, written answers, critical feedback after each.',
              'SI qat’iy, lekin adolatli komissiya vazifasini bajaradi: bir vaqtda bitta savol, yozma javob, har biridan keyin tanqidiy fikr.',
            )}
          </p>
          <Cmp$d value={o} onChange={u} showReq={!1} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={n('Interview type', 'Suhbat turi')} htmlFor="iv-kind">
              <Select id="iv-kind" value={l} onChange={(I) => c(I.target.value)}>
                <option value="scholarship">{n('Scholarship interview', 'Grant suhbati')}</option>
                <option value="admission">{n('Admission interview', 'Qabul suhbati')}</option>
              </Select>
            </Field>
            <Field label={n('Number of questions', 'Savollar soni')} htmlFor="iv-n">
              <Select id="iv-n" value={p} onChange={(I) => d(Number(I.target.value))}>
                {[4, 6, 8, 10].map((I) => (
                  <option value={I} key={I}>
                    {I}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field
            label={n(
              'Anything the panel should know about you (optional)',
              'Komissiya siz haqingizda nimani bilishi kerak (ixtiyoriy)',
            )}
            htmlFor="iv-extra"
            hint={n(
              'Your profile, your CV and documents you shared are used. Only real facts — the AI will not invent any.',
              'Profilingiz, CV va ulashgan hujjatlaringiz ishlatiladi. Faqat haqiqiy faktlar — SI hech narsa o‘ylab topmaydi.',
            )}
          >
            <Textarea id="iv-extra" className="min-h-[80px]" value={h} onChange={(I) => m(I.target.value)} />
          </Field>
          {S && (
            <p className="text-[13px] font-semibold text-bad" role="alert">
              {S}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {g === 'questions' ? (
              <>
                <Fi label={n('Preparing questions…', 'Savollar tayyorlanmoqda…')} />
                <Button
                  size="sm"
                  icon={<Square size={13} />}
                  onClick={() => {
                    var I;
                    return (I = U.current) == null ? void 0 : I.abort();
                  }}
                >
                  {n('Stop', 'To‘xtatish')}
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                icon={<Play size={16} />}
                disabled={o.kind === 'custom' && !o.name.trim()}
                onClick={K}
              >
                {n('Start the interview', 'Suhbatni boshlash')}
              </Button>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[13px] font-extrabold">{n('Earlier practice', 'Oldingi mashqlar')}</p>
          {e.interviews.length === 0 ? (
            <p className="text-[12.5px] text-muted">{n('None yet.', 'Hali yo‘q.')}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {e.interviews.map((I) => (
                <li className="flex items-center gap-1" key={I.id}>
                  <button
                    type="button"
                    onClick={() => {
                      (E(I.id), w(Math.min(I.answers.length, I.questions.length - 1)));
                    }}
                    className="min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-sunken"
                  >
                    {I.targetLabel}
                    {' · '}
                    {I.answers.length}/{I.questions.length}
                  </button>
                  <button
                    type="button"
                    aria-label={n('Delete', 'O‘chirish')}
                    onClick={() => t(I.id)}
                    className="rounded p-1 text-faint hover:text-bad"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    );
  const F = q >= j.questions.length,
    O = j.answers.find((I) => I.i === q);
  if (F) {
    const I = ry.map((M) => {
        const D = j.answers
          .map((R) => {
            var _;
            return (_ = R.feedback.scores.find((de) => de.key === M)) == null ? void 0 : _.score;
          })
          .filter((R) => R != null);
        return {
          key: M,
          score: D.length ? Math.round(D.reduce((R, _) => R + _, 0) / D.length) : null,
          reason: D.length ? n(`average of ${D.length} answer(s)`, `${D.length} ta javob o‘rtachasi`) : '',
        };
      }),
      f = I.filter((M) => M.score != null)
        .sort((M, D) => M.score - D.score)
        .slice(0, 2);
    return (
      <Card className="grid gap-4 p-4 md:p-5">
        <h2 className="text-[18px] font-extrabold">
          {n('Interview summary', 'Suhbat xulosasi')}
          {' · '}
          {j.targetLabel}
        </h2>
        <p className="text-[14px]">
          {n(
            `You answered ${j.answers.length} of ${j.questions.length} questions.`,
            `${j.questions.length} ta savoldan ${j.answers.length} tasiga javob berdingiz.`,
          )}
          {f.length > 0 &&
            ` ${n('Work on these first:', 'Avval shularni ustida ishlang:')} ${f.map((M) => n(vo[M.key][0], vo[M.key][1])).join(', ')}.`}
        </p>
        <Wo scores={I} />
        <ul className="grid gap-2">
          {[...j.answers]
            .sort((M, D) => M.i - D.i)
            .map((M) => (
              <li className="rounded-lg border border-line p-3 text-[13.5px]" key={M.i}>
                <p className="font-bold">
                  {M.i + 1}
                  {'. '}
                  {j.questions[M.i].q}
                </p>
                {M.feedback.weak[0] && (
                  <p className="mt-1 text-muted">
                    {n('Main weakness: ', 'Asosiy kamchilik: ')}
                    {M.feedback.weak[0]}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    (w(M.i), v(M.answer));
                  }}
                  className="mt-1 text-[12.5px] font-bold text-teal-ink dark:text-teal"
                >
                  {n('Review / answer again', 'Ko‘rib chiqish / qayta javob')}
                </button>
              </li>
            ))}
        </ul>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              (E(null), A(''));
            }}
          >
            {n('New interview', 'Yangi suhbat')}
          </Button>
        </div>
      </Card>
    );
  }
  const N = j.questions[q];
  return (
    <Card className="grid gap-4 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-bold text-muted">
          {j.targetLabel}
          {' · '}
          {n('Question', 'Savol')} {q + 1}/{j.questions.length}
        </p>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            (E(null), A(''));
          }}
        >
          {n('Leave', 'Chiqish')}
        </Button>
      </div>
      <div className="rounded-xl bg-navy-soft p-4">
        <p className="text-[17px] font-extrabold text-navy">{N.q}</p>
        {N.why && (
          <p className="mt-1 text-[12.5px] text-muted">
            {n('What the panel is testing: ', 'Komissiya nimani tekshiradi: ')}
            {N.why}
          </p>
        )}
      </div>
      {O ? (
        <>
          <div className="rounded-lg border border-line p-3 text-[14px]">
            <p className="mb-1 text-[12px] font-bold uppercase text-faint">{n('Your answer', 'Javobingiz')}</p>
            <p className="whitespace-pre-wrap">{O.answer}</p>
          </div>
          <Cq f={O.feedback} />
          {O.feedback.followUp && (
            <p className="rounded-lg bg-info-soft p-3 text-[13.5px]">
              <span className="font-bold">
                {n('A panel might follow up with: ', 'Komissiya shunday davom ettirishi mumkin: ')}
              </span>
              {O.feedback.followUp}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              icon={<ArrowRight size={16} />}
              onClick={() => {
                (w(q + 1), v(''));
              }}
            >
              {q + 1 < j.questions.length ? n('Next question', 'Keyingi savol') : n('See summary', 'Xulosani ko‘rish')}
            </Button>
            <Button
              onClick={() => {
                (a({
                  ...j,
                  answers: j.answers.filter((I) => I.i !== q),
                }),
                  v(O.answer));
              }}
            >
              {n('Answer again', 'Qayta javob berish')}
            </Button>
          </div>
        </>
      ) : (
        <>
          <Field
            label={n('Your answer (write it as you would say it)', 'Javobingiz (qanday aytsangiz shunday yozing)')}
            htmlFor="iv-a"
            hint={`${Vo(C)} ${n('words · about 120–250 words is a 1–2 minute answer', 'so‘z · 120–250 so‘z taxminan 1–2 daqiqalik javob')}`}
          >
            <Textarea id="iv-a" className="min-h-[160px]" value={C} onChange={(I) => v(I.target.value)} />
          </Field>
          {S && (
            <p className="text-[13px] font-semibold text-bad" role="alert">
              {S}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {g === 'feedback' ? (
              <>
                <Fi label={n('The panel is evaluating your answer…', 'Komissiya javobingizni baholamoqda…')} />
                <Button
                  size="sm"
                  icon={<Square size={13} />}
                  onClick={() => {
                    var I;
                    return (I = U.current) == null ? void 0 : I.abort();
                  }}
                >
                  {n('Stop', 'To‘xtatish')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="primary" disabled={!C.trim()} onClick={x}>
                  {n('Submit answer', 'Javobni yuborish')}
                </Button>
                <Button
                  variant="ghost"
                  icon={<SkipForward size={15} />}
                  onClick={() => {
                    (w(q + 1), v(''));
                  }}
                >
                  {n('Skip', 'O‘tkazib yuborish')}
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
function Uq({ c: e }) {
  const { tx: a } = useI18n();
  return (
    <div className="grid gap-3 text-[14px]">
      <p>{e.summary}</p>
      {e.inconsistencies.length > 0 && (
        <div>
          <p className="font-bold text-bad">
            {a('Possible inconsistencies — please verify', 'Ehtimoliy nomuvofiqliklar — tekshiring')}
          </p>
          <ul className="mt-1 grid gap-2">
            {e.inconsistencies.map((t, n) => (
              <li className="rounded-lg border border-line p-3" key={n}>
                <p className="font-semibold">{t.issue}</p>
                <div className="mt-1.5 grid gap-2 md:grid-cols-2">
                  {t.cvQuote && t.cvQuote.quote && (
                    <div>
                      <p className="text-[12px] font-bold uppercase text-faint">CV</p>
                      <CmpMi q={t.cvQuote} />
                    </div>
                  )}
                  {t.letterQuote && t.letterQuote.quote && (
                    <div>
                      <p className="text-[12px] font-bold uppercase text-faint">{a('Letter', 'Xat')}</p>
                      <CmpMi q={t.letterQuote} />
                    </div>
                  )}
                </div>
                {t.verify && (
                  <p className="mt-1.5 text-muted">
                    {a('Check: ', 'Tekshiring: ')}
                    {t.verify}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[12.5px] text-muted">
            {a(
              'These are flags to check, not conclusions — either document could be the one to correct.',
              'Bular tekshirish uchun belgilar, xulosa emas — tuzatilishi kerak bo‘lgani ikkalasidan biri bo‘lishi mumkin.',
            )}
          </p>
        </div>
      )}
      {e.consistent.length > 0 && (
        <div>
          <p className="font-bold text-ok">
            {a('Where they support each other', 'Bir-birini qo‘llab-quvvatlaydigan joylar')}
          </p>
          <ul className="mt-1 list-disc pl-5">
            {e.consistent.map((t, n) => (
              <li key={n}>{t}</li>
            ))}
          </ul>
        </div>
      )}
      {e.ignoredCvItems.length > 0 && (
        <div>
          <p className="font-bold">
            {a('Strong CV items the letter does not use', 'Xatda ishlatilmagan kuchli CV bandlari')}
          </p>
          <ul className="mt-1 list-disc pl-5">
            {e.ignoredCvItems.map((t, n) => (
              <li key={n}>{t}</li>
            ))}
          </ul>
        </div>
      )}
      {e.interests && (
        <p>
          <span className="font-bold">{a('Academic interests: ', 'Akademik qiziqishlar: ')}</span>
          {e.interests}
        </p>
      )}
      {e.goals && (
        <p>
          <span className="font-bold">{a('Career objectives: ', 'Karyera maqsadlari: ')}</span>
          {e.goals}
        </p>
      )}
    </div>
  );
}
function Bq() {
  const { state: e, setConsistency: a } = useStore(),
    { tx: t, p: n, lang: s } = useI18n(),
    r = ft(),
    o = e.advisorDocs.filter((x) => x.analysis),
    u = e.advisorDocs.filter((x) => x.type === 'cv'),
    l = e.advisorDocs.filter((x) => x.type !== 'cv'),
    c = (() => {
      var x, F;
      for (const O of l) {
        const N = u.find((I) => nn(I.target) === nn(O.target));
        if (N) return [N.id, O.id];
      }
      return [((x = u[0]) == null ? void 0 : x.id) ?? '', ((F = l[0]) == null ? void 0 : F.id) ?? ''];
    })(),
    [p, d] = React.useState(c[0]),
    [h, m] = React.useState(c[1]),
    [y, E] = React.useState(!1),
    [C, v] = React.useState(''),
    g = React.useRef(null);
  React.useEffect(
    () => () => {
      var x;
      return (x = g.current) == null ? void 0 : x.abort();
    },
    [],
  );
  const b = u.find((x) => x.id === p),
    S = l.find((x) => x.id === h),
    A = b && S ? `${b.id}|${S.id}` : '',
    q = A ? e.consistency[A] : void 0,
    w = async () => {
      if (!b || !S || y) return;
      (v(''), E(!0));
      const x = new AbortController();
      g.current = x;
      try {
        const F = Oz(
          await hi(
            qz({
              lang: s,
              cv: b.working,
              letter: S.working,
              letterType: S.type,
              target: Rs(S.target, S.req, s),
            }),
            {
              tier: 'complex',
              signal: x.signal,
            },
          ),
          b.working,
          S.working,
        );
        a(A, F);
      } catch (F) {
        const O = F;
        O.code !== 'cancelled' && v(O instanceof Oe ? Ta('invalid_json', s) : Ta(O.code, s));
      } finally {
        E(!1);
      }
    };
  if (!e.advisorDocs.length)
    return (
      <EmptyState
        title={t('No documents yet', 'Hali hujjat yo‘q')}
        body={t(
          'Add and analyse your CV and letters in “Analyse my documents” — the readiness report collects the results here.',
          '“Hujjatlarimni tahlil qilish” bo‘limida CV va xatlaringizni qo‘shing va tahlil qiling — tayyorlik hisoboti natijalarni shu yerda jamlaydi.',
        )}
      />
    );
  const U = o.flatMap((x) =>
      x.analysis.result.scores
        .filter((F) => F.score != null)
        .map((F) => ({
          ...F,
          doc: x,
        })),
    ),
    j = [...U].sort((x, F) => F.score - x.score).slice(0, 4),
    k = [...U].sort((x, F) => x.score - F.score).slice(0, 4),
    K = (x) => t(...(vo[x] ?? [x, x]));
  return (
    <div className="grid gap-4">
      <Card className="p-4 md:p-5">
        <h2 className="text-[18px] font-extrabold">{t('Readiness report', 'Tayyorlik hisoboti')}</h2>
        <p className="mt-1 text-[13px] text-muted">
          {t(
            'Built from the AI analyses you ran. It reflects the latest analysis of each document, not an official assessment.',
            'Siz o‘tkazgan SI tahlillaridan tuzilgan. Har bir hujjatning oxirgi tahlilini aks ettiradi, rasmiy baho emas.',
          )}
        </p>
        <div className="mt-4 grid gap-4">
          <Se title={t('Documents', 'Hujjatlar')}>
            <ul className="grid gap-2">
              {e.advisorDocs.map((x) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2"
                  key={x.id}
                >
                  <span>
                    <span className="font-bold">{x.title}</span>{' '}
                    <span className="text-muted">
                      {'· '}
                      {n(Tt[x.type])}
                      {' · '}
                      {mn(x.target, s)}
                    </span>
                  </span>
                  {x.analysis ? (
                    <Qo r={x.analysis.result.readiness} />
                  ) : (
                    <Badge tone="neutral">{t('Not analysed', 'Tahlil qilinmagan')}</Badge>
                  )}
                </li>
              ))}
            </ul>
          </Se>
          {o.length > 0 && (
            <>
              <Se title={t('Strongest areas', 'Eng kuchli jihatlar')} tone="ok">
                <ul className="list-disc pl-5">
                  {j.map((x, F) => (
                    <li key={F}>
                      {K(x.key)}
                      {' — '}
                      {x.score}
                      {'/10 '}
                      <span className="text-muted">({x.doc.title})</span>
                    </li>
                  ))}
                </ul>
              </Se>
              <Se title={t('Weakest areas', 'Eng zaif jihatlar')} tone="bad">
                <ul className="list-disc pl-5">
                  {k.map((x, F) => (
                    <li key={F}>
                      {K(x.key)}
                      {' — '}
                      {x.score}
                      {'/10 '}
                      <span className="text-muted">
                        ({x.doc.title}){x.reason ? `: ${x.reason}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </Se>
              <Se title={t('Outstanding improvements', 'Bajarilishi kerak bo‘lgan o‘zgarishlar')}>
                {o.map((x) => {
                  const F = x.analysis.result,
                    O =
                      F.kind === 'cv'
                        ? F.actionPlan.length
                          ? F.actionPlan
                          : F.improvements.map((N) => N.change)
                        : F.improvements.map((N) => N.change);
                  return (
                    O.length > 0 && (
                      <div className="mb-2" key={x.id}>
                        <p className="font-bold">{x.title}</p>
                        <ol className="list-decimal pl-5">
                          {O.slice(0, 5).map((N, I) => (
                            <li key={I}>{N}</li>
                          ))}
                        </ol>
                      </div>
                    )
                  );
                })}
              </Se>
              <Se
                title={t(
                  'Missing information — questions only you can answer',
                  'Yetishmayotgan ma’lumot — faqat siz javob bera oladigan savollar',
                )}
              >
                <ul className="list-disc pl-5">
                  {o.flatMap((x) =>
                    [
                      ...x.analysis.result.questions,
                      ...(x.analysis.result.kind === 'letter' ? x.analysis.result.missing : []),
                    ]
                      .slice(0, 4)
                      .map((F, O) => (
                        <li key={`${x.id}-${O}`}>
                          {F} <span className="text-muted">({x.title})</span>
                        </li>
                      )),
                  )}
                </ul>
              </Se>
            </>
          )}
          <Se
            title={t(
              'Application-specific requirements still to check',
              'Hali tekshirilishi kerak bo‘lgan ariza talablari',
            )}
          >
            <ul className="list-disc pl-5">
              {e.advisorDocs
                .filter((x) => x.type !== 'cv' && !x.req.prompt && !x.req.wordLimit)
                .map((x) => (
                  <li key={x.id}>
                    {t(
                      `${x.title}: the essay prompt / word limit was not given, so compliance is unconfirmed.`,
                      `${x.title}: insho savoli / so‘z chegarasi berilmagan, muvofiqlik tasdiqlanmagan.`,
                    )}
                  </li>
                ))}
              {e.advisorDocs
                .filter((x) => x.target.kind === 'none')
                .map((x) => (
                  <li key={`n-${x.id}`}>
                    {t(
                      `${x.title}: no target chosen — fit to a programme was not judged.`,
                      `${x.title}: maqsad tanlanmagan — dasturga moslik baholanmadi.`,
                    )}
                  </li>
                ))}
              {e.advisorDocs
                .filter((x) => x.target.kind === 'custom')
                .map((x) => (
                  <li key={`c-${x.id}`}>
                    {t(
                      `${x.title}: EduBridge has no verified record of “${mn(x.target, s)}” — confirm its requirements on the official site.`,
                      `${x.title}: EduBridge’da “${mn(x.target, s)}” haqida tasdiqlangan yozuv yo‘q — talablarini rasmiy saytda tasdiqlang.`,
                    )}
                  </li>
                ))}
              {o
                .filter((x) => x.analysis.result.kind === 'letter' && x.analysis.result.compliance.status === 'issues')
                .map((x) => (
                  <li className="text-bad" key={`i-${x.id}`}>
                    {t(
                      `${x.title}: compliance problems found — see its analysis.`,
                      `${x.title}: muvofiqlik muammolari topildi — tahliliga qarang.`,
                    )}
                  </li>
                ))}
              <li>
                {t(
                  'Always confirm the current document list, format and deadline on the official page of each application.',
                  'Har bir arizaning joriy hujjatlar ro‘yxati, formati va muddatini doim rasmiy sahifada tasdiqlang.',
                )}
              </li>
            </ul>
          </Se>
          {o.length > 0 && (
            <Se title={t('Recommended next actions', 'Tavsiya etilgan keyingi qadamlar')}>
              <ol className="list-decimal pl-5">
                {o
                  .filter((x) => ['not_ready', 'substantial_revision'].includes(x.analysis.result.readiness))
                  .map((x) => (
                    <li key={x.id}>
                      {t(
                        `Revise “${x.title}” first — it needs substantial work.`,
                        `Avval “${x.title}”ni qayta ishlang — u jiddiy ishlashni talab qiladi.`,
                      )}
                    </li>
                  ))}
                {o.some((x) => x.history.length && x.analysis.at < x.history[x.history.length - 1].at) && (
                  <li>
                    {t(
                      'Re-analyse documents you have changed since their last analysis.',
                      'Oxirgi tahlildan keyin o‘zgartirgan hujjatlaringizni qayta tahlil qiling.',
                    )}
                  </li>
                )}
                {u.length > 0 && l.length > 0 && !Object.keys(e.consistency).length && (
                  <li>
                    {t(
                      'Check that your CV and letter tell the same story (below).',
                      'CV va xatingiz bir xil hikoya aytishini tekshiring (quyida).',
                    )}
                  </li>
                )}
                <li>
                  {t('Practise the interview for your main target.', 'Asosiy maqsadingiz uchun suhbatni mashq qiling.')}
                </li>
              </ol>
            </Se>
          )}
        </div>
      </Card>
      <Card className="p-4 md:p-5">
        <h2 className="flex items-center gap-2 text-[17px] font-extrabold">
          <GitCompare size={18} />
          {t('Do your CV and letter tell one story?', 'CV va xatingiz bitta hikoyani aytadimi?')}
        </h2>
        {!u.length || !l.length ? (
          <p className="mt-2 text-[14px] text-muted">
            {t(
              'Add both a CV and a letter (ideally for the same target) to run this check.',
              'Bu tekshiruv uchun CV va xatni (yaxshisi bir xil maqsad uchun) qo‘shing.',
            )}
          </p>
        ) : (
          <div className="mt-3 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="CV" htmlFor="cs-cv">
                <Select id="cs-cv" value={p} onChange={(x) => d(x.target.value)}>
                  {u.map((x) => (
                    <option value={x.id} key={x.id}>
                      {x.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('Letter / essay', 'Xat / insho')} htmlFor="cs-l">
                <Select id="cs-l" value={h} onChange={(x) => m(x.target.value)}>
                  {l.map((x) => (
                    <option value={x.id} key={x.id}>
                      {x.title}
                      {' ('}
                      {n(Tt[x.type])})
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {b && S && nn(b.target) !== nn(S.target) && b.target.kind !== 'none' && (
              <Callout tone="info">
                {t(
                  'These two documents have different targets — differences may be intentional.',
                  'Bu ikki hujjatning maqsadi har xil — farqlar ataylab bo‘lishi mumkin.',
                )}
              </Callout>
            )}
            {r.live ? (
              <div className="flex flex-wrap items-center gap-2">
                {y ? (
                  <>
                    <Fi label={t('Comparing the two documents…', 'Ikki hujjat solishtirilmoqda…')} />
                    <Button
                      size="sm"
                      icon={<Square size={13} />}
                      onClick={() => {
                        var x;
                        return (x = g.current) == null ? void 0 : x.abort();
                      }}
                    >
                      {t('Stop', 'To‘xtatish')}
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" onClick={w}>
                    {q ? t('Check again', 'Qayta tekshirish') : t('Check consistency', 'Muvofiqlikni tekshirish')}
                  </Button>
                )}
              </div>
            ) : (
              <Callout tone="warn">
                {t(
                  'This check needs live AI, which is not connected here.',
                  'Bu tekshiruv uchun jonli SI kerak, u bu yerda ulanmagan.',
                )}
              </Callout>
            )}
            {C && (
              <p className="text-[13px] font-semibold text-bad" role="alert">
                {C}
              </p>
            )}
            {q && <Uq c={q.result} />}
          </div>
        )}
      </Card>
    </div>
  );
}
const Lq = ['ask', 'docs', 'interview', 'report'];
export function AssistantPage() {
  const { route: e, navigate: a } = useStore(),
    { tx: t } = useI18n(),
    n = Lq.includes(e.id ?? '') ? e.id : 'ask',
    [s, r] = React.useState(n);
  React.useEffect(() => {
    r(n);
  }, [n]);
  const o = (l) => {
      (r(l), a('assistant', l === 'ask' ? void 0 : l));
    },
    u = [
      {
        id: 'ask',
        icon: <MessageSquareText size={18} />,
        label: t('Ask the AI', 'SI dan so‘rash'),
        sub: t('Universities, scholarships, eligibility, planning', 'Universitetlar, grantlar, moslik, reja'),
      },
      {
        id: 'docs',
        icon: <FileSearch size={18} />,
        label: t('Analyse my documents', 'Hujjatlarimni tahlil qilish'),
        sub: t('CV, motivation letter, statements, essays', 'CV, motivatsion xat, bayonot, insholar'),
      },
      {
        id: 'interview',
        icon: <Mic size={18} />,
        label: t('Prepare for interviews', 'Suhbatga tayyorlanish'),
        sub: t('Simulated panel, feedback on each answer', 'Simulyatsiya, har bir javobga fikr'),
      },
      {
        id: 'report',
        icon: <ClipboardCheck size={18} />,
        label: t('Readiness report', 'Tayyorlik hisoboti'),
        sub: t('All analyses, CV ↔ letter check', 'Barcha tahlillar, CV ↔ xat tekshiruvi'),
      },
    ];
  return (
    <div>
      <PageHeader
        eyebrow={t('AI admissions advisor', 'SI qabul maslahatchisi')}
        title={t('Your admissions advisor', 'Qabul bo‘yicha maslahatchingiz')}
        sub={t(
          'Honest, evidence-based guidance. Official facts come only from EduBridge’s verified records; advice is labelled as advice. No admission chances are ever estimated.',
          'Halol, dalilga asoslangan maslahat. Rasmiy faktlar faqat EduBridge’ning tasdiqlangan yozuvlaridan olinadi; maslahat maslahat deb belgilanadi. Qabul ehtimoli hech qachon hisoblanmaydi.',
        )}
        actions={<Zz />}
      />
      <div role="tablist" className="mb-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {u.map((l) => (
          <button
            role="tab"
            type="button"
            aria-selected={s === l.id}
            onClick={() => o(l.id)}
            className={classNames(
              'flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors',
              s === l.id ? 'border-teal bg-teal-soft/60' : 'border-line bg-surface hover:border-teal/40',
            )}
            key={l.id}
          >
            <span className={classNames('mt-0.5', s === l.id ? 'text-teal-ink dark:text-teal' : 'text-faint')}>
              {l.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-extrabold leading-tight">{l.label}</span>
              <span className="mt-0.5 hidden text-[12px] text-muted sm:block">{l.sub}</span>
            </span>
          </button>
        ))}
      </div>
      {s === 'ask' && <CmpTq goTab={o} />}
      {s === 'docs' && <Nq />}
      {s === 'interview' && <Iq />}
      {s === 'report' && <Bq />}
    </div>
  );
}
export const pn = ['tuition', 'accommodation', 'food', 'transport', 'insurance', 'visa', 'travel', 'other'];
export function Du(e) {
  const a = pn.filter((c) => e.lines[c].value === null || Number.isNaN(e.lines[c].value)),
    t = pn.filter((c) => e.lines[c].value !== null && e.lines[c].basis === 'estimate'),
    n = pn.reduce((c, p) => c + (e.lines[p].value ?? 0), 0),
    s = a.length ? null : n,
    r = e.lines.tuition.value ?? 0,
    o = e.award ?? 0,
    u = e.awardCovers === 'none' ? 0 : e.awardCovers === 'tuition' ? Math.min(o, r) : Math.min(o, s ?? n),
    l = s === null || e.family === null ? null : s - e.family - u;
  return {
    annual: s,
    annualKnown: n,
    total: s === null ? null : s * e.years,
    missing: a,
    awardApplied: u,
    family: e.family,
    gap: l,
    gapTotal: l === null ? null : l * e.years,
    estimates: t,
  };
}
const Fq = () =>
  Object.fromEntries(
    pn.map((e) => [
      e,
      {
        value: null,
        basis: 'estimate',
      },
    ]),
  );
export function Dq(e, a, t, n) {
  var r;
  const s = {
    id: He(),
    name: n,
    oppId: e == null ? void 0 : e.id,
    currency: a,
    years: 1,
    lines: Fq(),
    family: null,
    award: null,
    awardCovers: 'none',
  };
  if (!e) return s;
  if (e.kind === 'program') {
    ((s.years = e.durationYears),
      e.tuition &&
        (s.lines.tuition = {
          value: Math.round(ci(Ai(e.tuition, e.durationYears, t), a, t)),
          basis: e.tuition.verified ? 'official' : 'estimate',
        }));
    const o = ((r = e.livingUSDPerYear) == null ? void 0 : r.amount) ?? Ls[e.country];
    if (o) {
      const u = (l) => ({
        value: Math.round(ci(o * l, a, t)),
        basis: 'estimate',
      });
      ((s.lines.accommodation = u(0.45)),
        (s.lines.food = u(0.3)),
        (s.lines.transport = u(0.1)),
        (s.lines.other = u(0.15)));
    }
  } else
    e.estAnnualAwardUSD &&
      ((s.award = Math.round(ci(e.estAnnualAwardUSD, a, t))),
      (s.awardCovers = e.coverage.living === 'yes' || e.coverage.living === 'partial' ? 'all' : 'tuition'));
  return s;
}
export const kr = (e, a, t, n) => ci(Ho(e, a, n), t, n);
