import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import {
  Check,
  ChevronDown,
  Compass,
  ListChecks,
  LoaderCircle,
  Plus,
  Sparkles,
  Square,
  Target,
  Trash2,
  TriangleAlert,
  WandSparkles,
} from 'lucide-react';
import { Br, ce, hz, jt, mz, pz } from '../data/growth-ideas';
import { $e, He, Ig, Mn, Mu, Ro, ct, dt, jn, la, ta } from '../lib/core';
import { he, ii, we, xe } from '../lib/catalog';
import { taskTitle } from '../lib/plan-tasks';
import { useStore } from '../store/store';
import { Ta, Un, hi } from '../lib/ai';
import { useI18n } from '../lib/derived';
import {
  Badge,
  Button,
  Callout,
  Card,
  Field,
  Input,
  Pa,
  PageHeader,
  Select,
  Tabs,
  Textarea,
  classNames,
} from '../components/ui';

function gz(e, a, t) {
  const n = [],
    s = e.experiences ?? {},
    r = (m) => !!(s[m] && String(s[m]).trim()),
    o = mz[a][t],
    u = e.ieltsParts ? Object.values(e.ieltsParts).filter((m) => typeof m == 'number') : [],
    l = u.length ? Math.min(...u) : void 0;
  n.push({
    id: 'english',
    title: ce('English', 'Ingliz tili'),
    signals: ['communication'],
    status:
      e.ielts == null
        ? e.toefl != null
          ? 'unknown'
          : 'gap'
        : e.ielts >= o + 0.5 && (l ?? 9) >= o - 0.5
          ? 'strong'
          : e.ielts >= o
            ? 'ok'
            : 'gap',
    now:
      e.ielts != null
        ? ce(
            `IELTS ${e.ielts}${l != null ? ` (lowest part ${l})` : ''}`,
            `IELTS ${e.ielts}${l != null ? ` (eng past bo‘lim ${l})` : ''}`,
          )
        : e.toefl != null
          ? ce(`TOEFL ${e.toefl}`, `TOEFL ${e.toefl}`)
          : ce('No score yet', 'Hali ball yo‘q'),
    target: ce(`IELTS ${o}+ with no weak part`, `IELTS ${o}+, zaif bo‘limsiz`),
    why: ce(
      'Below the target, English can stop an application before anything else is read. Some programmes ask more — check each page.',
      'Maqsaddan past bo‘lsa, ingliz tili boshqa narsa o‘qilmasdan arizani to‘xtatishi mumkin. Ayrim dasturlar ko‘proq so‘raydi — har bir sahifani tekshiring.',
    ),
  });
  const c = pz[a];
  let p = 'unknown';
  (e.score != null &&
    e.scale === 'percent' &&
    (p = e.score >= c.percent + 5 ? 'strong' : e.score >= c.percent ? 'ok' : 'gap'),
    e.score != null &&
      e.scale === 'gpa4' &&
      (p = e.score >= c.gpa4 + 0.3 ? 'strong' : e.score >= c.gpa4 ? 'ok' : 'gap'),
    n.push({
      id: 'grades',
      title: ce('Grades', 'Baholar'),
      signals: ['depth'],
      status: p,
      now:
        e.score != null ? ce(`${e.score} (${e.scale})`, `${e.score} (${e.scale})`) : ce('Not entered', 'Kiritilmagan'),
      target: ce(`About ${c.percent}% / GPA ${c.gpa4} or higher`, `Taxminan ${c.percent}% / GPA ${c.gpa4} yoki yuqori`),
      why:
        p === 'unknown'
          ? ce(
              'Your scale cannot be compared fairly here — each university converts grades its own way.',
              'Shkalangizni bu yerda adolatli solishtirib bo‘lmaydi — har bir universitet baholarni o‘zicha aylantiradi.',
            )
          : ce(
              'Readers look most at subjects close to your degree. Grades cannot change fast, so stronger evidence elsewhere matters more when they are below target.',
              'O‘quvchilar ko‘proq darajangizga yaqin fanlarga qaraydi. Baholar tez o‘zgarmaydi, shuning uchun maqsaddan past bo‘lsa, boshqa joydagi kuchli dalillar muhimroq.',
            ),
    }));
  const d = ['projects', 'competitions', 'academic', 'research'].filter((m) => r(m)).length;
  n.push({
    id: 'subject',
    title: ce('Evidence of interest in your subject', 'Sohangizga qiziqish dalili'),
    signals: ['depth', 'research', 'initiative'],
    status: d >= 2 ? 'strong' : d === 1 ? (a === 'selective' ? 'gap' : 'ok') : 'gap',
    now: ce(
      `${d} type(s) recorded (projects, competitions, academic, research)`,
      `${d} tur qayd etilgan (loyiha, tanlov, akademik, tadqiqot)`,
    ),
    target:
      a === 'selective'
        ? ce('Two or more, with at least one real output', 'Ikki yoki undan ko‘p, kamida bittasi haqiqiy natija bilan')
        : ce('At least one concrete project or result', 'Kamida bitta aniq loyiha yoki natija'),
    why: ce(
      'This is what turns “I am passionate about X” into something a reader believes.',
      'Aynan shu “X ga qiziqaman” degan gapni o‘quvchi ishonadigan narsaga aylantiradi.',
    ),
  });
  const h = ['leadership', 'volunteering', 'community', 'teamwork'].filter((m) => r(m)).length;
  if (
    (n.push({
      id: 'impact',
      title: ce('Leadership and contribution', 'Yetakchilik va hissa'),
      signals: ['leadership', 'impact'],
      status: h >= 2 ? 'strong' : h === 1 ? 'ok' : 'gap',
      now: ce(
        `${h} type(s) recorded (leadership, volunteering, community, teamwork)`,
        `${h} tur qayd etilgan (yetakchilik, ko‘ngillilik, jamiyat, jamoa)`,
      ),
      target: ce('One sustained role with a measurable result', 'O‘lchanadigan natijali bitta barqaror rol'),
      why: ce(
        'Many scholarships (e.g. government programmes) state leadership or contribution as a criterion; one deep role beats many short ones.',
        'Ko‘p grantlar (masalan, davlat dasturlari) yetakchilik yoki hissani mezon sifatida ko‘rsatadi; bitta chuqur rol ko‘p qisqalaridan kuchli.',
      ),
    }),
    t === 'master')
  ) {
    n.push({
      id: 'research',
      title: ce('Research experience', 'Tadqiqot tajribasi'),
      signals: ['research'],
      status: r('research') ? 'strong' : a === 'selective' ? 'gap' : 'ok',
      now: r('research') ? ce('Recorded', 'Qayd etilgan') : ce('None recorded', 'Qayd etilmagan'),
      target:
        a === 'selective'
          ? ce(
              'A thesis or project you can discuss in depth, ideally written up',
              'Chuqur muhokama qila oladigan, yaxshisi yozilgan bitiruv ishi yoki loyiha',
            )
          : ce(
              'Helpful, especially for research-based programmes',
              'Foydali, ayniqsa tadqiqotga asoslangan dasturlar uchun',
            ),
      why: ce(
        'Research-based master’s and strong scholarships look for evidence you can ask and answer a question independently.',
        'Tadqiqotga asoslangan magistratura va kuchli grantlar mustaqil savol berib, javob topa olishingiz dalilini izlaydi.',
      ),
    });
    const m = e.workYears ?? 0;
    n.push({
      id: 'work',
      title: ce('Relevant work experience', 'Tegishli ish tajribasi'),
      signals: ['professional'],
      status: m >= 2 ? 'strong' : m >= 1 || r('internships') || r('employment') ? 'ok' : 'gap',
      now: ce(
        `${m} year(s) of work${r('internships') ? ', internship recorded' : ''}`,
        `${m} yil ish${r('internships') ? ', amaliyot qayd etilgan' : ''}`,
      ),
      target: ce(
        'Any relevant experience; about two years for professional scholarships such as DAAD EPOS',
        'Har qanday tegishli tajriba; DAAD EPOS kabi mutaxassislar grantlari uchun taxminan ikki yil',
      ),
      why: ce(
        'Work shows why you need the degree; some scholarships require it outright.',
        'Ish nega aynan shu daraja kerakligini ko‘rsatadi; ayrim grantlar uni to‘g‘ridan-to‘g‘ri talab qiladi.',
      ),
    });
  } else
    n.push({
      id: 'work',
      title: ce('Practical experience', 'Amaliy tajriba'),
      signals: ['professional', 'initiative'],
      status: r('internships') || r('employment') || r('projects') ? 'ok' : 'unknown',
      now: r('internships') || r('employment') ? ce('Recorded', 'Qayd etilgan') : ce('None recorded', 'Qayd etilmagan'),
      target: ce(
        'Optional for bachelor’s; one real project or job helps',
        'Bakalavr uchun ixtiyoriy; bitta haqiqiy loyiha yoki ish yordam beradi',
      ),
      why: ce(
        'Not required for most bachelor’s programmes, but it gives your letter concrete material.',
        'Ko‘pchilik bakalavr dasturlari uchun shart emas, lekin xatingizga aniq material beradi.',
      ),
    });
  return n;
}
function yz(e, a) {
  const t = {
      free: 0,
      low: 1,
      some: 2,
    },
    n = new Set(e.filter((o) => o.status === 'gap').flatMap((o) => o.signals)),
    s = new Set(e.filter((o) => o.status === 'ok' || o.status === 'unknown').flatMap((o) => o.signals)),
    r = new Set(e.filter((o) => o.status === 'gap').map((o) => o.id));
  return jt
    .filter((o) => o.levels.includes(a.level))
    .map((o) => {
      const u = [];
      let l = 0;
      const c = o.fields === 'all' || o.fields.includes(a.field);
      (o.fields !== 'all' &&
        o.fields.includes(a.field) &&
        ((l += 3), u.push(ce('Specific to your subject', 'Aynan sohangiz uchun'))),
        c || (l -= 6));
      const p = o.signals.filter((h) => n.has(h));
      (p.length &&
        ((l += 4 + 2 * (p.length - 1)),
        u.push(ce('Fills a gap in your profile', 'Profilingizdagi bo‘shliqni to‘ldiradi'))),
        o.signals.some((h) => s.has(h)) && (l += 1),
        o.id === 'english-plan' &&
          r.has('english') &&
          ((l += 10),
          u.push(
            ce('English is below your target — fix this first', 'Ingliz tili maqsaddan past — avval shuni tuzating'),
          )),
        o.id === 'grades-rescue' && r.has('grades') && (l += 4),
        o.groups.includes(a.group) &&
          ((l += 2),
          a.group === 'selective' &&
            o.effort === 3 &&
            u.push(
              ce(
                'The kind of depth selective universities notice',
                'Kuchli tanlovli universitetlar e’tibor beradigan chuqurlik',
              ),
            )));
      const d = o.months <= a.months && o.hours <= a.hours + 2 && t[o.cost] <= t[a.cost];
      return (
        d || (l -= 5),
        a.months < 6 && o.effort === 3 && (l -= 2),
        {
          idea: o,
          score: l,
          reasons: u,
          fits: d && c,
        }
      );
    })
    .sort((o, u) => u.score - o.score);
}
const vi = (e) =>
  e === 'uz'
    ? 'Uzbek (Latin script, natural and fluent — not a word-for-word translation)'
    : e === 'ru'
      ? 'Russian (natural and fluent — not a word-for-word translation)'
      : 'English';
const vr = (e, a, t, n) => (e === 'uz' ? t : e === 'ru' ? n : a);
const bi = `You are the EduBridge admissions advisor: an experienced international admissions and scholarship advisor who has read thousands of applications from students in Uzbekistan and Central Asia applying to universities and scholarships abroad (EduBridge focuses on Malaysia, Hungary, Germany, Türkiye and South Korea).

You know: international bachelor's and master's admissions, scholarship selection (government, university and foundation awards), academic CVs, motivation letters, personal statements, study plans, research proposals, recommendation letters, interviews, language tests, credential recognition (e.g. 11 vs 12 years of schooling, Studienkolleg, ECTS), and budgeting for study abroad.

HOW YOU BEHAVE
- Honest, constructive criticism comes before making the student feel good. If something is weak, say so plainly, explain why, and show how to fix it. Do not soften a weakness into a strength. Do not pad with praise.
- Be respectful and specific. Every criticism points to evidence (the student's own words or facts) and comes with a practical fix.
- Challenge assumptions when they are wrong or risky (e.g. "only top-ranked universities", "IELTS alone is enough", "a fee waiver covers living costs"). Explain the trade-off.
- Never confuse eligibility (meeting stated minimums) with the chance of being selected. Never give admission or scholarship probabilities or percentages. Never promise an offer or award.
- Distinguish clearly: OFFICIAL INFORMATION (published by the university/provider — only from the records given to you, with their URL), AI INTERPRETATION (what it means), and PERSONAL RECOMMENDATION (advice for this student).

HARD RULES ON FACTS
- Use ONLY the official records supplied in this message for requirements, deadlines, fees, funding amounts, eligibility rules and links. You cannot browse the web and you have not checked anything live — never imply that you did.
- Never invent URLs, requirements, deadlines, tuition, stipend amounts, programme modules, professors, labs, partnerships or statistics. If something is not in the records, say "EduBridge has no verified record of this" and tell the student exactly where to check (the official site of that institution).
- Dates in the records may be from a past cycle; if a date is before today, say it has passed and the next one is not confirmed.
- If records conflict, say so and direct the student to the issuing authority.
- Never invent the student's experiences, achievements, numbers, grades or personal circumstances. When a number or detail would help, ASK for it.

WRITING STYLE
- Plain, clear language a 17–25-year-old non-native speaker understands. No hype, no clichés, no emojis.
- When suggesting wording, keep the student's own voice and facts. Do not make every applicant sound the same; do not replace a generic sentence with another generic sentence.`;
export function fz(e) {
  const a =
    e.lang === 'uz'
      ? [
          'Qisqa javob',
          'Batafsil tushuntirish',
          'Sizning holatingizda',
          'Keyingi qadamlar',
          'Manbalar va tekshiruv',
          'Muhim cheklovlar',
        ]
      : e.lang === 'ru'
        ? [
            'Коротко',
            'Подробное объяснение',
            'В вашей ситуации',
            'Следующие шаги',
            'Источники и проверка',
            'Важные ограничения',
          ]
        : [
            'Short answer',
            'Detailed explanation',
            'Based on your situation',
            'Recommended next steps',
            'Sources and verification',
            'Important limitations',
          ];
  return `${bi}

TASK: answer the student's questions in an ongoing conversation. Use earlier turns for follow-ups — do not make the student repeat themselves.

Reply in ${vi(e.lang)}.

FORMAT (Markdown):
- Use these section headings, as "### Heading", in this order, and skip any section that adds nothing: ${a.map((t) => `"${t}"`).join(', ')}.
- For a simple or factual question: only "${a[0]}" (1–3 sentences) plus, if useful, "${a[3]}" and "${a[4]}". Keep it short.
- ${e.depth === 'deep' ? 'The student asked for a DEEPER explanation this time: be thorough in the detailed section, with examples.' : 'Default length: under about 250 words unless the question genuinely needs more.'}
- In "${a[2]}", use the profile only where it changes the advice; do not recite the profile back.
- In "${a[4]}", list each official link you used and what it supports, e.g. "- Tuition (2026/27): https://…". Use ONLY URLs from the records below. If no record covers the question, write that EduBridge has no verified record and name the official place to check, without a made-up link.
- Label claims: mark official facts with "(${vr(e.lang, 'official', 'rasmiy', 'официально')})", your reading with "(${vr(e.lang, 'AI interpretation', 'SI izohi', 'толкование ИИ')})" and advice with "(${vr(e.lang, 'recommendation', 'tavsiya', 'рекомендация')})" where it is not obvious.
- When information needed to answer is missing (e.g. "Am I eligible?" without grades, age, level, nationality or the specific scholarship), do NOT guess: say what you can say, then ask for the specific missing details as a short list.
- For competitiveness questions, separate four things: meets minimum requirements / potentially competitive profile / strong application strategy / cannot be estimated reliably — and say which applies and why.
- Last line, on its own: FOLLOWUPS: <question 1> | <question 2> | <question 3>  (three short follow-up questions the student might ask next, in ${vr(e.lang, 'English', 'Uzbek', 'Russian')}).

TODAY: ${e.today}

STUDENT PROFILE (only what the student entered; may be missing): ${JSON.stringify(e.profile ?? 'not created — answer generally and ask for details when they matter')}
STUDENT PLANS: ${JSON.stringify(e.plans ?? [])}
SAVED ITEMS: ${JSON.stringify(e.saved ?? [])}
${
  e.sharedDocs.length
    ? `DOCUMENTS THE STUDENT CHOSE TO SHARE (their own text, for context only):
${e.sharedDocs.map(
  (t) => `--- ${t.type}: ${t.title} ---
${t.text.slice(0, 6e3)}`,
).join(`
`)}`
    : 'DOCUMENTS: none shared.'
}

OFFICIAL RECORDS FROM EDUBRIDGE'S DATABASE (verified on official pages on the "checked" date; the only facts you may state as official): ${JSON.stringify(e.records)}`;
}
const Jd = `SCORE ANCHORS (use them strictly):
- 9–10: would stand out among strong applicants to a highly selective programme; every claim is specific and evidenced.
- 7–8: competitive; only minor fixes needed.
- 5–6: typical first draft — understandable but generic or under-evidenced in places.
- 3–4: clear weaknesses that would hurt the application.
- 1–2: missing, harmful or unusable for this purpose.
Most first drafts land at 4–6. Do not give 8 or more unless you can quote the evidence that earns it. Judge against the level of the target: for a highly selective target, compare with strong competing applicants; for a more accessible target, say what is enough and what is still a risk.`;
const Zd = `CRITICAL READING METHOD — apply all of these before writing your answer:
1. First impression: what does a busy reader understand in the first 10–15 seconds? What do they remember, and what do they miss?
2. "So what?" test: for every claim, ask what it proves about the applicant. A duty or a trait without a result or example proves little.
3. "Anyone could write this" test: could thousands of other applicants submit this sentence unchanged? If yes, it is generic.
4. Claim–evidence audit: list the applicant's claims (skills, traits, achievements, motivations) and whether the document itself supports each one.
5. Red flags a reader would notice: unexplained gaps or overlapping dates, inconsistent dates/grades/titles, inflated titles, the wrong university or programme name, word-limit breaches, very informal contact details, unnecessary personal data (age, marital status, photo, religion), text that reads as machine-generated or copied, claims that contradict each other.
6. Missing pieces the target clearly expects (from the records or the prompt only — never invent requirements).
7. Be specific and blunt about the biggest problem; do not bury it among small points. Praise only what is genuinely effective, with the quote.`;
const ty =
  '"readiness" is exactly one of: "not_ready", "substantial_revision", "moderate_improvement", "nearly_ready", "final_proofreading".';
export function vz(e) {
  return `${bi}

TASK: a detailed, critical evaluation of the student's academic CV / resume.

Method — examine:
1. Structure and organisation: logical order, most important information easy to find, headings, length, consistent formatting, unnecessary sections, missing sections.
2. Academic background: education history, grades, relevant coursework, academic projects, research, awards, progression — presented effectively for the intended degree?
3. Experience and activities: internships, jobs, volunteering, leadership, organisations, competitions, research. Does the student explain contributions and results, or only list titles and duties? (Weak: "Worked as a finance intern." Better: "Supported the credit portfolio team by reviewing and organising more than 100 borrower records in Excel" — but ONLY with facts the student actually has.)
4. Skills: relevant, clearly described, credible, supported by evidence; flag vague or exaggerated claims.
5. Language: grammar, spelling, vocabulary, clarity, repetition, inconsistent tense, tone, awkward phrasing.
6. Relevance to the target: which items support this application most, which could be shortened or cut. If there is no target, give "relevance" a null score.
Distinguish strong CONTENT from weak PRESENTATION — a CV can have good experiences badly presented, or a clean layout with little substance; say which.

Rules for this task:
- Quote the CV exactly (copy text character-for-character) in every "evidence"/"original" field. Do not paraphrase inside quotes.
- Rewrites must keep the facts. If a rewrite would need a number or detail the CV does not give, write the improved version with a placeholder in square brackets like [number of records] and explain in "missing_info" what to ask/find. Never invent numbers, employers, results or titles.
- Scores are your advisory assessment (1 = very weak, 10 = excellent), not an official admissions rating. Explain each.
- If text looks garbled or incomplete (bad extraction), say so in "limits" and do not judge formatting you cannot see.

${Zd}

${Jd}

${e.target}

STUDENT PROFILE (context only; never copy facts from it into the CV): ${JSON.stringify(e.profile ?? 'not provided')}

THE CV (lines numbered [L1], [L2]… for reference; the numbers are not part of the document):
"""
${e.cv}
"""

Reply with ONLY one JSON object, no other text:
{
 "overall": "3–5 honest sentences on the current quality, naming the single biggest problem first",
 "first_impression": "what a reader takes away in the first 10–15 seconds, and what they miss",
 "claims": [{"claim":"a claim the CV makes (skill, trait, achievement)","evidence":"exact quote that supports it, or empty","verdict":"supported" | "weak" | "unsupported"}],
 "red_flags": [{"flag":"...","quote":"exact quote or empty","severity":"high" | "medium" | "low"}],
 "readiness": "...",
 "scores": [{"key":"structure","score":1-10,"reason":"..."},{"key":"academic",...},{"key":"experience",...},{"key":"impact",...},{"key":"skills",...},{"key":"language",...},{"key":"relevance","score":null or 1-10,"reason":"..."}],
 "strengths": [{"point":"...","evidence":"exact quote","why":"why it works"}],
 "weaknesses": [{"point":"...","evidence":"exact quote or empty if it is an absence","consequence":"what this costs the application"}],
 "sections": [{"section":"name as in the CV","assessment":"...","issues":["..."]}],
 "improvements": [{"priority":1,"change":"...","why":"..."}],
 "rewrites": [{"original":"exact quote","improved":"...","why":"...","missing_info":"what the student must supply, or null"}],
 "questions": ["specific questions to the student whose answers would strengthen the CV"],
 "action_plan": ["the 3–5 most important changes, in order"],
 "limits": ["what you could not assess and why"]
}
${ty}
All prose fields in ${vi(e.lang)}; quotes and rewrites in the CV's language.`;
}
const bz = {
  motivation:
    'This is a MOTIVATION LETTER: the core questions are why this subject, why this programme/university (or scholarship), why now, and how it leads to concrete goals.',
  personal_statement:
    'This is a PERSONAL STATEMENT: judge the personal and academic journey, authenticity and evidence; institution fit matters less unless a target is given.',
  study_plan:
    'This is a STUDY PLAN: judge the concreteness of the academic plan (courses/areas of study, timeline, language preparation if relevant), the link to past study and to goals after graduation, and realism.',
  scholarship_essay:
    'This is a SCHOLARSHIP ESSAY: judge how directly it answers the essay prompt, how it shows the qualities the scholarship looks for (only those stated in the records or the prompt), and why the funding matters for this student.',
  recommendation: `This is a RECOMMENDATION LETTER DRAFT: judge whether a real referee could sign it — specific observed examples, the referee's relationship and basis for judgement, comparison with peers only if credible, no exaggeration. Flag anything that reads as written by the student about themselves. "authenticity" here means credibility of the referee's voice.`,
  other: 'This is another application document: judge clarity, purpose, evidence, structure and fit to the target.',
};
export function kz(e) {
  return `${bi}

TASK: a detailed, critical evaluation of the student's document. ${bz[e.type]}

Many letters sound impressive but are generic, repetitive, badly structured, or disconnected from the student's real background. Your job is to find these problems precisely.

Evaluate:
1. Motivation and authenticity — specific reasons, a convincing personal/academic journey, or generic lines like "I have always been passionate about…" with no evidence?
2. Academic and professional direction — why this degree, clear interests, logical link from previous study, realistic goals, how the degree serves them.
3. University / scholarship fit (only if a target is known) — why this university, this programme, which features, why this scholarship. Flag passages that could be pasted into ten different applications. NEVER invent modules, professors, labs, partnerships or benefits; if research is needed, tell the student exactly what to look up on the official site. If no target is given, give "fit" a null score and explain.
4. Evidence — claims supported by real experiences vs. self-description ("hardworking, ambitious, excellent leader"). Explain why evidence persuades.
5. Structure and storytelling — opening, background, experiences, motivation for the programme, goals, conclusion; logical progression, repetition, weak transitions, missing links, unnecessary storytelling.
6. Writing quality — grammar, clarity, formality, sentence structure, vocabulary, repetition, over-complicated or artificial language. It must sound like a real applicant, not a generic AI essay; point out sentences that sound machine-written or template-like.
7. Compliance — check against the prompt, word limit and instructions ONLY if supplied below. The document has ${e.words} words. If nothing is supplied, compliance status is "cannot_confirm" and the "compliance" score is null.

Rules for this task:
- Quote the document EXACTLY (character-for-character) in every "quote" field; quotes must be sentences or phrases that really appear.
- In "generic", for each generic passage say why it is generic and ASK the specific question that would make it personal (e.g. "Which particular course, research area or learning opportunity at this university relates to your goals?"). Do not supply invented specifics.
- Paragraph analysis uses the [P#] numbers below; give every paragraph a "role" (opening, background, experience, motivation, fit, goals, conclusion, other).
- Never say the document will or is likely to win an offer or award.
- Answer the four questions every reader asks — why this subject, why this programme/university (or scholarship), why now, why you — and say which ones the document fails to answer.
- Check "show versus tell": how much of the letter is self-description versus concrete episodes with the student's own role and result.

${Zd}

${Jd}
${
  e.cvForContext
    ? `
THE STUDENT'S CV (context only — to spot experiences the letter ignores or contradicts; never treat it as part of the letter):
"""
${e.cvForContext.slice(0, 8e3)}
"""
`
    : ''
}
${e.target}

STUDENT PROFILE (context only): ${JSON.stringify(e.profile ?? 'not provided')}

THE DOCUMENT (paragraphs numbered [P1], [P2]…; numbers are not part of the text):
"""
${e.text}
"""

Reply with ONLY one JSON object, no other text:
{
 "verdict": "3–5 honest sentences: how convincing it is now, naming the single biggest problem first",
 "first_impression": "what a reader remembers after reading the opening and the last paragraph",
 "four_questions": [{"question":"why this subject" | "why this programme" | "why now" | "why you","answered":"yes" | "partly" | "no","comment":"..."}],
 "claims": [{"claim":"a claim the letter makes","evidence":"exact quote of the supporting example, or empty","verdict":"supported" | "weak" | "unsupported"}],
 "red_flags": [{"flag":"...","quote":"exact quote or empty","severity":"high" | "medium" | "low"}],
 "readiness": "...",
 "scores": [{"key":"authenticity","score":1-10,"reason":"..."},{"key":"academic",...},{"key":"fit","score":null or 1-10,...},{"key":"evidence",...},{"key":"career",...},{"key":"structure",...},{"key":"writing",...},{"key":"compliance","score":null or 1-10,...}],
 "works": [{"quote":"exact quote","why":"why it is effective"}],
 "weakens": [{"quote":"exact quote","why":"why it is ineffective","fix":"how to fix, without inventing facts"}],
 "generic": [{"quote":"exact quote","why":"why it could be in anyone's letter","ask":"the question the student should answer to make it specific"}],
 "missing": ["important things the student should consider adding"],
 "paragraphs": [{"n":1,"role":"opening","assessment":"...","issues":["..."]}],
 "improvements": [{"priority":1,"change":"...","why":"..."}],
 "compliance": {"status":"met" | "issues" | "cannot_confirm","notes":["..."]},
 "questions": ["specific questions for the student"],
 "limits": ["what you could not assess and why"]
}
${ty}
All prose fields in ${vi(e.lang)}; quotes in the document's language.`;
}
export const xz = ['improve', 'professional', 'repetition', 'specific', 'connect', 'goals', 'grammar', 'voice'];
const wz = {
  improve: 'Improve this passage overall (clarity, structure, evidence) while keeping its content.',
  professional: 'Make the wording more professional and concise, without becoming stiff or using inflated vocabulary.',
  repetition: 'Remove unnecessary repetition and filler. Keep every distinct fact.',
  specific:
    'Make the explanation more specific. Use only details already present in the passage or the context; where a specific detail is needed but missing, insert a [placeholder in square brackets] and ask for it.',
  connect:
    'Strengthen the connection between the experience described and the chosen degree, using only facts present; ask for the missing link if the facts do not support one.',
  goals:
    'Make the career objectives clearer and more concrete, without inventing a job, employer or plan the student did not state; ask for what is missing.',
  grammar: 'Correct grammar, spelling and punctuation only. Change nothing else.',
  voice:
    "Rewrite for flow and clarity while preserving the student's personal voice, sentence rhythm and word choices where they work.",
};
export function jz(e) {
  return `${bi}

TASK: help the student improve one passage of their ${e.docType.replace('_', ' ')}. The student stays in control: you propose, they accept or reject.
Action requested: ${wz[e.action]}${
    e.instruction
      ? `
The student adds: "${e.instruction.slice(0, 500)}"`
      : ''
  }

Rules:
- Preserve the student's real experiences and every factual claim. Do not add achievements, numbers, names, dates, feelings or circumstances that are not in the passage or the full document.
- Where a fact would make it stronger but is missing, use a [placeholder in square brackets] and add a question to "questions".
- Keep the document's language and an appropriate formality. Avoid clichés ("since childhood", "passionate", "prestigious") and inflated words. It must still sound like this student.
- Return only the revised PASSAGE, not the whole document.
- In "changes", explain each significant change and why. In "warnings", note anything you could not do without inventing facts.

${e.target}

FULL DOCUMENT (context only):
"""
${e.fullText.slice(0, 12e3)}
"""

PASSAGE TO REVISE:
"""
${e.passage}
"""

Reply with ONLY one JSON object: {"revised":"...","changes":[{"what":"...","why":"..."}],"questions":["..."],"warnings":["..."]}
"changes", "questions" and "warnings" in ${vi(e.lang)}; "revised" in the passage's language.`;
}
export function Sz(e) {
  return `${bi}

TASK: prepare a realistic ${e.kind} interview. Write ${e.count} questions an interview panel would plausibly ask THIS applicant, mixing: motivation and choice of programme/country, academic background, specific experiences from their background, goals and return/impact plans, fit with the stated purpose of the scholarship (only purposes given in the records), and one or two challenging questions that probe a weakness or gap you can see in their background. Do not ask about facts you would have to invent. Questions in ${e.lang === 'uz' ? 'English (interviews are usually conducted in English), with nothing else' : 'English'}; "why" (what the panel is testing) in ${vi(e.lang)}.

${e.target}

APPLICANT BACKGROUND (their profile and any documents they shared):
${e.background || 'Not provided — keep questions general and include one asking them to introduce themselves.'}

Reply with ONLY one JSON object: {"questions":[{"q":"...","why":"..."}]}`;
}
export function zz(e) {
  return `${bi}

TASK: you are a strict but fair scholarship interview evaluator. Evaluate the applicant's WRITTEN answer to one interview question.

Judge: clarity, authenticity, relevance to the question and the scholarship, supporting evidence, communication confidence AS IT COMES ACROSS IN WRITING ONLY (you cannot judge voice, pace or body language — never pretend to), and alignment with the applicant's stated goals and background. Point out vague or unsupported statements precisely. If the answer is very short, off-topic or empty, say so directly.

The "stronger" example answer must be built ONLY from facts in the applicant's answer and background below; where a needed fact is missing, use a [placeholder] and say in "stronger_note" what the applicant should fill in. Do not invent experiences, numbers or achievements. Keep it to what a person could say in about 1–2 minutes, in English.

${e.target}

APPLICANT BACKGROUND:
${e.background || 'Not provided.'}
${
  e.earlier.length
    ? `
EARLIER IN THIS INTERVIEW:
${e.earlier
  .map(
    (a, t) => `Q${t + 1}: ${a.q}
A${t + 1}: ${a.a}`,
  )
  .join(
    `
`,
  )
  .slice(0, 6e3)}
`
    : ''
}
QUESTION: ${e.question}
ANSWER: """${e.answer.slice(0, 6e3)}"""

Reply with ONLY one JSON object:
{"effective":["what worked"],"weak":["what was weak, quoting the answer"],"missing":["what was missing"],"improve":["how to improve"],"stronger":"example of a stronger answer","stronger_note":"what the applicant must fill in or verify","scores":[{"key":"clarity","score":1-10,"reason":"..."},{"key":"authenticity",...},{"key":"relevance",...},{"key":"evidence",...},{"key":"communication","score":1-10,"reason":"based on the written text only"},{"key":"alignment",...}],"follow_up":"a natural follow-up question the panel might ask, or null"}
Lists, notes and reasons in ${vi(e.lang)}; "stronger" and "follow_up" in English.`;
}
export function qz(e) {
  return `${bi}

TASK: check whether the student's CV and ${e.letterType.replace('_', ' ')} tell one coherent, consistent story for the same application.

Check: experiences mentioned in the letter that do (or do not) appear in the CV; academic interests; career objectives; dates, durations, grades, qualifications, job titles and achievements that differ between the two; important CV experiences the letter ignores. Flag possible inconsistencies for the student to VERIFY — do not assume which document is wrong. Quote both documents exactly.

${e.target}

CV:
"""
${e.cv.slice(0, 12e3)}
"""

${e.letterType.toUpperCase()}:
"""
${e.letter.slice(0, 12e3)}
"""

Reply with ONLY one JSON object:
{"summary":"2–4 sentences: do they tell one story?","consistent":["points where they support each other"],"inconsistencies":[{"issue":"...","cv_quote":"exact quote or empty","letter_quote":"exact quote or empty","verify":"what the student should check"}],"ignored_cv_items":["important CV items the letter could use"],"interests":"are academic interests consistent?","goals":"do career objectives align?"}
Prose in ${vi(e.lang)}; quotes in the documents' language.`;
}
export function Ez(e) {
  return `These ${e} image(s) are consecutive pages of a student's application document (scanned or photographed). Transcribe the text exactly as written, page by page, keeping line breaks and headings. Do not correct, summarise, translate or add anything. If part of a page is unreadable, write [unreadable] there. If a page has no readable text, return an empty string for it and "legible":"no".
Reply with ONLY one JSON object: {"pages":[{"n":1,"text":"...","legible":"yes" | "partial" | "no"}]}`;
}
export function Az(e) {
  return `${bi}

TASK: you are a SECOND, more senior admissions reader. A first reviewer has analysed the student's ${e.kind === 'cv' ? 'CV' : 'document'} below. Audit that analysis before the student sees it.

Look for, and fix:
- Leniency: scores higher than the anchors allow, praise for things that are generic, weaknesses softened or missing. Lower scores that cannot be justified with a quote.
- Missed problems: apply the critical reading method yourself and add what the first reviewer missed (especially red flags, unsupported claims, generic sentences, contradictions).
- Wrong or invented quotes: every quote must appear exactly in the document; remove or correct any that do not.
- Advice that invents facts: rewrites or suggestions that add numbers, names, achievements or circumstances not in the document must use [placeholders] and a question instead.
- Vague advice: replace "improve clarity"-type advice with a concrete instruction tied to a quote.
- Priorities: the most damaging problem must come first in improvements and the action plan.
Keep everything that was correct. Do not become harsh for its own sake — every criticism still needs evidence and a fix.

${Zd}

${Jd}

${e.target}

THE DOCUMENT:
"""
${e.doc}
"""

FIRST ANALYSIS (JSON):
${JSON.stringify(e.draft).slice(0, 24e3)}

Reply with ONLY the corrected analysis as one JSON object in exactly the same format and field names as the first analysis, plus one extra field:
 "audit_notes": ["each significant change you made and why (e.g. 'Lowered impact from 6 to 3: no result is quoted anywhere')"]
All prose in ${vi(e.lang)}; quotes in the document's language.`;
}
function Tz(e) {
  return `${bi}

TASK: be a demanding profile-building coach. The student has ${e.months} months before applying, about ${e.hours} hours a week and a ${e.budget} budget. They are aiming at ${e.level} programmes in ${e.field}, in the "${e.group}" group of universities (selective = strong competition; middle = solid profile expected; accessible = lower requirements, often cheaper).

First, tell them honestly what their profile currently says to an admissions reader and what is missing for their target group. Then design activities that are SPECIFIC TO THIS STUDENT: built from their own interests, subject and situation in Uzbekistan — not generic "volunteer / join a club" advice. Prefer one or two deep, connected activities over many shallow ones, and suggest a "theme" that could tie their application together.

Rules:
- Do not name specific competitions, organisations, programmes, prizes or deadlines (you cannot verify them). You may mention widely known open platforms (GitHub, Kaggle, Wikipedia, OpenStreetMap, Coursera, edX, data.gov.uz) as places to do work.
- Never promise admission or scholarships, and never say an activity "guarantees" anything.
- Every idea must produce a concrete, checkable output (a report, a tool, a dataset, a measured result) that fits the time and hours.
- Be critical: list things this student should STOP or avoid (e.g. collecting easy certificates, unrelated activities) and why.
- Use only facts the student gave; where you need something they did not say, ask in "questions".

STUDENT PROFILE (minimal): ${JSON.stringify(e.profile ?? 'not provided')}
INTERESTS AND HOBBIES (their words): """${e.interests.slice(0, 1500) || 'not given'}"""
CAREER INTERESTS (their words): """${e.career.slice(0, 1500) || 'not given'}"""
GAPS FOUND BY EDUBRIDGE'S RULE-BASED CHECK: ${JSON.stringify(e.gaps)}
ACTIVITIES ALREADY IN THEIR PLAN: ${e.existing || 'none'}

Reply with ONLY one JSON object:
{
 "diagnosis": "3–5 honest sentences: what a reader would conclude about this student today, and the biggest gap for the target group",
 "themes": [{"theme":"a short phrase that could connect their application","why":"how their interests and subject support it"}],
 "ideas": [{"title":"...","why_for_you":"why this fits THIS student specifically","steps":["4–6 concrete steps with rough weeks"],"output":"the checkable result","cv_line":"how it could read on a CV, with [placeholders] for numbers they do not have yet","essay_angle":"how it could appear in a letter","risk":"what could make it weak","months":number,"hours_per_week":number}],
 "avoid": [{"what":"...","why":"..."}],
 "questions": ["questions whose answers would make the plan more specific"]
}
Give 2–3 themes, 4–6 ideas and 2–4 things to avoid. All prose in ${vi(e.lang)}.`;
}
function Nz(e) {
  return `${bi}

TASK: the student describes an activity they have done or plan to do. Judge it critically, as an admissions reader for a ${e.level} application in ${e.field} at a "${e.group}" university would. Say plainly if it is weak, generic or unlikely to matter, and show exactly how to make it stronger without inventing anything.

Consider: what it actually proves (depth, impact, leadership, initiative, research, professional skill), how many other applicants have the same thing, whether there is a measurable output, how it connects to the intended subject, and what a sceptical reader would doubt.

STUDENT PROFILE (minimal): ${JSON.stringify(e.profile ?? 'not provided')}
THE ACTIVITY (their words): """${e.activity.slice(0, 3e3)}"""

Reply with ONLY one JSON object:
{
 "verdict": "2–4 honest sentences",
 "strength": "weak" | "moderate" | "strong",
 "shows": ["what it genuinely demonstrates"],
 "doubts": ["what a sceptical reader would question"],
 "stronger": ["specific changes that would raise its value, in order of impact"],
 "ladder": ["what a basic version looks like","a strong version","an outstanding version"],
 "cv_line": "a CV line using only their facts, with [placeholders] for missing numbers",
 "questions": ["what you need to know to judge it fully"]
}
All prose in ${vi(e.lang)}.`;
}
const Cz = ['not_ready', 'substantial_revision', 'moderate_improvement', 'nearly_ready', 'final_proofreading'];
export class Oe extends Error {}
const ke = (e) => !!e && typeof e == 'object' && !Array.isArray(e);
const te = (e, a = 4e3) => (typeof e == 'string' ? e.trim().slice(0, a) : typeof e == 'number' ? String(e) : '');
const De = (e) => (Array.isArray(e) ? e : []);
const Ae = (e, a = 20) =>
  De(e)
    .map((t) => te(t, 1200))
    .filter(Boolean)
    .slice(0, a);
const Bt = (e) => {
  const a = typeof e == 'number' ? e : typeof e == 'string' ? Number(e) : NaN;
  return Number.isFinite(a) ? a : null;
};
const Mz = (e) => {
  const a = Bt(e);
  return a === null ? null : Math.max(1, Math.min(10, Math.round(a)));
};
const ny = (e) => (Cz.includes(e) ? e : 'substantial_revision');
const Fh = (e) =>
  e
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/[•●▪◦·]/g, ' ')
    .replace(/\[(?:p|l)\d+\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
function ps(e, a) {
  const t = Fh(a)
      .replace(/^["']|["']$/g, '')
      .replace(/\.\.\.|…/g, ' … '),
    n = Fh(e);
  if (!t)
    return {
      quote: a,
      found: !1,
    };
  if (t.split(' … ').every((s) => !s.trim() || n.includes(s.trim())))
    return {
      quote: a,
      found: !0,
    };
  if (t.length > 60) {
    const s = t.slice(0, 30),
      r = t.slice(-30);
    if (n.includes(s) && n.includes(r))
      return {
        quote: a,
        found: !0,
      };
  }
  return {
    quote: a,
    found: !1,
  };
}
const zn = (e, a) => {
  const t = te(a, 1500);
  return t ? ps(e, t) : null;
};
function _d(e, a) {
  const t = De(e)
    .filter(ke)
    .map((n) => ({
      key: te(n.key, 40),
      score: Mz(n.score),
      reason: te(n.reason, 800),
    }));
  return a.map(
    (n) =>
      t.find((s) => s.key === n) ?? {
        key: n,
        score: null,
        reason: '',
      },
  );
}
function sy(e, a) {
  return {
    firstImpression: te(e.first_impression, 1500),
    claims: De(e.claims)
      .filter(ke)
      .map((t) => ({
        claim: te(t.claim, 400),
        evidence: zn(a, t.evidence),
        verdict: t.verdict === 'supported' || t.verdict === 'weak' ? t.verdict : 'unsupported',
      }))
      .filter((t) => t.claim)
      .slice(0, 15),
    redFlags: De(e.red_flags)
      .filter(ke)
      .map((t) => ({
        flag: te(t.flag, 600),
        quote: zn(a, t.quote),
        severity: t.severity === 'high' || t.severity === 'low' ? t.severity : 'medium',
      }))
      .filter((t) => t.flag)
      .sort((t, n) => ['high', 'medium', 'low'].indexOf(t.severity) - ['high', 'medium', 'low'].indexOf(n.severity))
      .slice(0, 12),
    audit: Ae(e.audit_notes, 15),
    reviewed: Array.isArray(e.audit_notes),
  };
}
const Iz = ['structure', 'academic', 'experience', 'impact', 'skills', 'language', 'relevance'];
const Uz = ['authenticity', 'academic', 'fit', 'evidence', 'career', 'structure', 'writing', 'compliance'];
export const ry = ['clarity', 'authenticity', 'relevance', 'evidence', 'communication', 'alignment'];
export function Bz(e, a) {
  if (!ke(e)) throw new Oe('not an object');
  const t = te(e.overall),
    n = {
      ...sy(e, a),
      kind: 'cv',
      overall: t,
      readiness: ny(e.readiness),
      scores: _d(e.scores, Iz),
      strengths: De(e.strengths)
        .filter(ke)
        .map((s) => ({
          point: te(s.point),
          evidence: zn(a, s.evidence),
          why: te(s.why),
        }))
        .filter((s) => s.point)
        .slice(0, 10),
      weaknesses: De(e.weaknesses)
        .filter(ke)
        .map((s) => ({
          point: te(s.point),
          evidence: zn(a, s.evidence),
          consequence: te(s.consequence),
        }))
        .filter((s) => s.point)
        .slice(0, 12),
      sections: De(e.sections)
        .filter(ke)
        .map((s) => ({
          section: te(s.section, 120),
          assessment: te(s.assessment),
          issues: Ae(s.issues, 8),
        }))
        .filter((s) => s.section)
        .slice(0, 15),
      improvements: De(e.improvements)
        .filter(ke)
        .map((s, r) => ({
          priority: Bt(s.priority) ?? r + 1,
          change: te(s.change),
          why: te(s.why),
        }))
        .filter((s) => s.change)
        .sort((s, r) => s.priority - r.priority)
        .slice(0, 12),
      rewrites: De(e.rewrites)
        .filter(ke)
        .map((s) => ({
          original: ps(a, te(s.original, 1500)),
          improved: te(s.improved, 1500),
          why: te(s.why),
          missingInfo: te(s.missing_info) || null,
        }))
        .filter((s) => s.original.quote && s.improved)
        .slice(0, 8),
      questions: Ae(e.questions, 10),
      actionPlan: Ae(e.action_plan, 5),
      limits: Ae(e.limits, 8),
    };
  if (!t || n.strengths.length + n.weaknesses.length === 0) throw new Oe('missing core fields');
  return n;
}
export function Lz(e, a) {
  if (!ke(e)) throw new Oe('not an object');
  const t = te(e.verdict),
    n = ke(e.compliance) ? e.compliance : {},
    s = n.status === 'met' || n.status === 'issues' ? n.status : 'cannot_confirm',
    r = {
      ...sy(e, a),
      fourQuestions: De(e.four_questions)
        .filter(ke)
        .map((o) => ({
          question: te(o.question, 60),
          answered: o.answered === 'yes' || o.answered === 'partly' ? o.answered : 'no',
          comment: te(o.comment, 600),
        }))
        .filter((o) => o.question)
        .slice(0, 4),
      kind: 'letter',
      verdict: t,
      readiness: ny(e.readiness),
      scores: _d(e.scores, Uz),
      works: De(e.works)
        .filter(ke)
        .map((o) => ({
          quote: ps(a, te(o.quote, 1500)),
          why: te(o.why),
        }))
        .filter((o) => o.quote.quote)
        .slice(0, 8),
      weakens: De(e.weakens)
        .filter(ke)
        .map((o) => ({
          quote: ps(a, te(o.quote, 1500)),
          why: te(o.why),
          fix: te(o.fix),
        }))
        .filter((o) => o.quote.quote)
        .slice(0, 12),
      generic: De(e.generic)
        .filter(ke)
        .map((o) => ({
          quote: ps(a, te(o.quote, 1500)),
          why: te(o.why),
          ask: te(o.ask),
        }))
        .filter((o) => o.quote.quote)
        .slice(0, 12),
      missing: Ae(e.missing, 10),
      paragraphs: De(e.paragraphs)
        .filter(ke)
        .map((o, u) => ({
          n: Bt(o.n) ?? u + 1,
          role: te(o.role, 120),
          assessment: te(o.assessment),
          issues: Ae(o.issues, 8),
        }))
        .filter((o) => o.assessment)
        .slice(0, 30),
      improvements: De(e.improvements)
        .filter(ke)
        .map((o, u) => ({
          priority: Bt(o.priority) ?? u + 1,
          change: te(o.change),
          why: te(o.why),
        }))
        .filter((o) => o.change)
        .sort((o, u) => o.priority - u.priority)
        .slice(0, 12),
      compliance: {
        status: s,
        notes: Ae(n.notes, 8),
      },
      questions: Ae(e.questions, 10),
      limits: Ae(e.limits, 8),
    };
  if (!t || r.works.length + r.weakens.length + r.generic.length + r.paragraphs.length === 0)
    throw new Oe('missing core fields');
  return r;
}
export function Pz(e) {
  if (!ke(e)) throw new Oe('not an object');
  const a = te(e.revised, 8e3);
  if (!a) throw new Oe('no revised text');
  return {
    revised: a,
    changes: De(e.changes)
      .filter(ke)
      .map((t) => ({
        what: te(t.what),
        why: te(t.why),
      }))
      .filter((t) => t.what)
      .slice(0, 12),
    questions: Ae(e.questions, 8),
    warnings: Ae(e.warnings, 8),
  };
}
export function Fz(e) {
  const a = De(ke(e) ? e.questions : e)
    .map((t) =>
      ke(t)
        ? {
            q: te(t.q, 600),
            why: te(t.why, 600),
          }
        : {
            q: te(t, 600),
            why: '',
          },
    )
    .filter((t) => t.q)
    .slice(0, 12);
  if (a.length < 3) throw new Oe('too few questions');
  return a;
}
export function Dz(e) {
  if (!ke(e)) throw new Oe('not an object');
  const a = {
    effective: Ae(e.effective, 8),
    weak: Ae(e.weak, 8),
    missing: Ae(e.missing, 8),
    improve: Ae(e.improve, 8),
    stronger: te(e.stronger, 3e3),
    strongerNote: te(e.stronger_note, 600),
    scores: _d(e.scores, ry),
    followUp: te(e.follow_up, 600) || null,
  };
  if (!a.weak.length && !a.effective.length && !a.improve.length) throw new Oe('empty feedback');
  return a;
}
export function Oz(e, a, t) {
  if (!ke(e)) throw new Oe('not an object');
  const n = {
    summary: te(e.summary),
    consistent: Ae(e.consistent, 10),
    inconsistencies: De(e.inconsistencies)
      .filter(ke)
      .map((s) => ({
        issue: te(s.issue),
        cvQuote: zn(a, s.cv_quote),
        letterQuote: zn(t, s.letter_quote),
        verify: te(s.verify),
      }))
      .filter((s) => s.issue)
      .slice(0, 12),
    ignoredCvItems: Ae(e.ignored_cv_items, 10),
    interests: te(e.interests),
    goals: te(e.goals),
  };
  if (!n.summary) throw new Oe('no summary');
  return n;
}
export function Rz(e) {
  const a = De(ke(e) ? e.pages : e)
    .filter(ke)
    .map((t, n) => ({
      n: Bt(t.n) ?? n + 1,
      text: te(t.text, 2e4),
      legible: t.legible === 'yes' || t.legible === 'partial' ? t.legible : 'no',
    }));
  if (!a.length) throw new Oe('no pages');
  return {
    pages: a,
  };
}
function Gz(e) {
  if (!ke(e)) throw new Oe('not an object');
  const a = {
    diagnosis: te(e.diagnosis),
    themes: De(e.themes)
      .filter(ke)
      .map((t) => ({
        theme: te(t.theme, 200),
        why: te(t.why, 800),
      }))
      .filter((t) => t.theme)
      .slice(0, 4),
    ideas: De(e.ideas)
      .filter(ke)
      .map((t) => ({
        title: te(t.title, 200),
        why: te(t.why_for_you, 1e3),
        steps: Ae(t.steps, 8),
        output: te(t.output, 600),
        cvLine: te(t.cv_line, 500),
        angle: te(t.essay_angle, 800),
        risk: te(t.risk, 600),
        months: Bt(t.months),
        hours: Bt(t.hours_per_week),
      }))
      .filter((t) => t.title && t.steps.length)
      .slice(0, 8),
    avoid: De(e.avoid)
      .filter(ke)
      .map((t) => ({
        what: te(t.what, 300),
        why: te(t.why, 600),
      }))
      .filter((t) => t.what)
      .slice(0, 6),
    questions: Ae(e.questions, 8),
  };
  if (!a.diagnosis || !a.ideas.length) throw new Oe('missing core fields');
  return a;
}
function Hz(e) {
  if (!ke(e)) throw new Oe('not an object');
  const a = {
    verdict: te(e.verdict),
    strength: e.strength === 'strong' || e.strength === 'moderate' ? e.strength : 'weak',
    shows: Ae(e.shows, 8),
    doubts: Ae(e.doubts, 8),
    stronger: Ae(e.stronger, 8),
    ladder: Ae(e.ladder, 3),
    cvLine: te(e.cv_line, 500),
    questions: Ae(e.questions, 8),
  };
  if (!a.verdict) throw new Oe('no verdict');
  return a;
}
export const Kz = [
  'cv',
  'motivation',
  'personal_statement',
  'study_plan',
  'scholarship_essay',
  'recommendation',
  'other',
];
const Yz = (e) => (e ? new Date().getFullYear() - e : void 0);
export function Os(e) {
  return e
    ? {
        currentEducation: e.currentEducation,
        targetLevel: e.targetLevel,
        field: e.field,
        major: e.major || void 0,
        applicationYear: e.applicationYear,
        intake: e.intake || void 0,
        approxAge: Yz(e.birthYear),
        qualification: e.qualification || void 0,
        grade: e.score != null ? `${e.score} (${e.scale}${e.scaleOther ? `: ${e.scaleOther}` : ''})` : void 0,
        graduationYear: e.graduationYear,
        achievements: e.achievements || void 0,
        ielts: e.ielts,
        ieltsParts: e.ieltsParts,
        toefl: e.toefl,
        sat: e.sat,
        otherLanguage: e.otherLanguage || void 0,
        planningExam: e.planningExam,
        budget: {
          currency: e.currency,
          tuitionPerYear: e.tuitionBudget,
          totalPerYear: e.totalBudget,
          needsFullFunding: e.needsFullFunding,
          partialOk: e.partialOk,
          canShowFunds: e.canShowFunds,
        },
        preferredCountries: e.preferredCountries,
        avoidCountries: e.avoidCountries,
        instructionPref: e.instructionPref,
        workYears: e.workYears,
        experiences: Object.keys(e.experiences ?? {}).length ? e.experiences : void 0,
      }
    : null;
}
function Lr(e, a) {
  const t = Mn(e);
  if (!t) return null;
  const n = (s) => {
    var o, u, l, c, p, d, h;
    const r = t.levels[s];
    return {
      level: s,
      open: r.open,
      academic: (o = r.academic) == null ? void 0 : o.en,
      language: (u = r.language) == null ? void 0 : u.en,
      exams: (l = r.exams) == null ? void 0 : l.en,
      note: (c = r.note) == null ? void 0 : c.en,
      deadline: r.deadline
        ? {
            date: r.deadline.date,
            intake: r.deadline.intake,
            note: (p = r.deadline.note) == null ? void 0 : p.en,
          }
        : null,
      intakeText: (d = r.intake) == null ? void 0 : d.en,
      tuition: r.tuition
        ? {
            amount: r.tuition.amount,
            max: r.tuition.amount_max,
            currency: r.tuition.currency,
            per: r.tuition.per,
            year: r.tuition.year,
            note: (h = r.tuition.note) == null ? void 0 : h.en,
          }
        : null,
      exampleProgramme: r.example
        ? {
            name: r.example.name,
            requirement: r.example.req.en,
            url: r.example.url,
          }
        : null,
      sources: r.sources,
    };
  };
  return {
    type: 'university',
    id: t.id,
    name: t.name,
    country: ta[t.country].name.en,
    city: t.city,
    sector: t.type,
    website: t.website,
    admissions: t.admissions,
    apply: t.apply,
    checked: t.lastChecked,
    levels: a ? [n(a)] : [n('bachelor'), n('master')],
  };
}
function is(e) {
  var t, n, s, r, o, u, l, c;
  const a = ct.find((p) => p.id === e);
  return a
    ? {
        type: 'grant',
        id: a.id,
        name: a.name,
        country: ta[a.country].name.en,
        levels: a.levels,
        who: (t = a.who) == null ? void 0 : t.en,
        criteria: (n = a.criteria) == null ? void 0 : n.en,
        covers: a.covers,
        amounts: (s = a.stipendText) == null ? void 0 : s.en,
        extras: (r = a.extras) == null ? void 0 : r.en,
        notCovered: (o = a.notCovered) == null ? void 0 : o.en,
        deadline: (u = a.deadline) == null ? void 0 : u.en,
        universities: (l = a.universities) == null ? void 0 : l.en,
        tracks: (c = a.tracks) == null ? void 0 : c.en,
        url: a.url,
        sources: a.sources,
        checked: a.checked,
      }
    : null;
}
export function Wz(e, a) {
  const t = [],
    n = new Set(),
    s = (d, h) => {
      h && !n.has(d) && t.length < 20 && (n.add(d), t.push(h));
    },
    r = a.target;
  ((r == null ? void 0 : r.kind) === 'uni' && s(`u:${r.id}`, Lr(r.id, r.level)),
    (r == null ? void 0 : r.kind) === 'grant' && s(`g:${r.id}`, is(r.id)));
  const o = e.toLowerCase(),
    u = o.split(/[^\p{L}\p{N}]+/u).filter((d) => d.length > 2);
  for (const d of dt) {
    const h = `${d.name} ${d.short}`.toLowerCase();
    ((o.includes(d.short.toLowerCase()) && d.short.length > 2) || u.some((m) => m.length > 4 && h.includes(m))) &&
      s(`u:${d.id}`, Lr(d.id));
  }
  const l = [
    [/mtcp/, 'mtcp'],
    [/\bmis\b|malaysia international/, 'mis'],
    [/t[üu]rkiye|burs/, 'turkiye-burslari'],
    [/stipendium|hungaric/, 'stipendium-hungaricum'],
    [/daad|epos/, 'daad-epos'],
    [/gks|global korea|kgsp/, 'gks-u'],
    [/gks|global korea|kgsp/, 'gks-g'],
  ];
  for (const [d, h] of l) d.test(o) && s(`g:${h}`, is(h));
  for (const d of ct)
    (o.includes(ta[d.country].name.en.toLowerCase()) || o.includes(ta[d.country].name.uz.toLowerCase().slice(0, 6))) &&
      s(`g:${d.id}`, is(d.id));
  for (const d of [...a.apps.map((h) => h.oppId), ...a.saved]) {
    const h = he(d);
    h &&
      (h.kind === 'program' && h.universityId && Mn(h.universityId)
        ? s(`u:${h.universityId}`, Lr(h.universityId, h.level))
        : s(`o:${h.id}`, {
            type: h.kind,
            id: h.id,
            name: h.kind === 'program' ? `${h.university} — ${h.program.en}` : h.name,
            country: we[h.country].en,
            verification: h.source.verification_status,
            deadline: {
              status: h.deadline.status,
              date: h.deadline.date ?? null,
            },
            ...(h.kind === 'scholarship'
              ? {
                  levels: h.levels,
                  coverage: h.coverageDetail.en,
                  academic: h.academic.en,
                  language: h.languageReq.en,
                }
              : {}),
            url: h.source.source_url,
            checked: h.source.last_verified_at,
          }));
  }
  if (/countr|davlat|budget|byudjet|afford|cheap|arzon|cost|narx|where|qayer/.test(o))
    for (const d of ct) s(`g:${d.id}`, is(d.id));
  for (const d of ii)
    d.kind === 'scholarship' &&
      u.some((h) => h.length > 4 && d.name.toLowerCase().includes(h)) &&
      s(`o:${d.id}`, {
        type: 'scholarship',
        id: d.id,
        name: d.name,
        country: we[d.country].en,
        levels: d.levels,
        coverage: d.coverageDetail.en,
        academic: d.academic.en,
        url: d.source.source_url,
        verification: d.source.verification_status,
      });
  const c = new Set(),
    p = (d) => {
      typeof d == 'string' && /^https?:\/\//.test(d)
        ? c.add(d)
        : Array.isArray(d)
          ? d.forEach(p)
          : d && typeof d == 'object' && Object.values(d).forEach(p);
    };
  return (
    t.forEach(p),
    {
      records: t,
      urls: c,
    }
  );
}
export function Vz(e) {
  return e
    .map((a) => {
      const t = he(a.oppId);
      return t
        ? {
            opportunity: t.kind === 'program' ? `${t.university} — ${t.program.en}` : t.name,
            stage: a.stage,
            deadline: {
              status: t.deadline.status,
              date: t.deadline.date ?? null,
            },
            openTasks: a.tasks
              .filter((n) => !n.done)
              .map((n) => taskTitle(n).en + (n.due ? ` (suggested by ${n.due})` : ''))
              .slice(0, 8),
          }
        : null;
    })
    .filter(Boolean);
}
export function Rs(e, a, t) {
  var s, r, o, u;
  const n = [];
  if (!e || e.kind === 'none')
    n.push(
      'Target: none given. Evaluate the document on its own; give the relevance/fit score as null and say a target is needed to judge fit.',
    );
  else if (e.kind === 'uni') {
    const l = Lr(e.id, e.level),
      c = (s = Mn(e.id)) == null ? void 0 : s.tier;
    n.push(
      `Target: ${(l == null ? void 0 : l.name) ?? e.id}, ${e.level === 'bachelor' ? "bachelor's" : "master's"} level. EduBridge group: ${c === 'selective' ? 'HIGHLY SELECTIVE — judge against strong competing applicants' : c === 'middle' ? 'balanced — a solid, well-evidenced profile is expected' : c === 'accessible' ? 'more accessible — lower published requirements, but a clear and credible application still matters' : 'unknown'}.`,
      `Official facts held by EduBridge (verified on the university's pages; may be general rather than programme-specific): ${JSON.stringify(l)}`,
    );
  } else
    e.kind === 'grant'
      ? (n.push('Scholarship selection is competitive: judge against strong competing applicants.'),
        n.push(
          `Target: ${((r = ct.find((l) => l.id === e.id)) == null ? void 0 : r.name) ?? e.id}.`,
          `Official facts held by EduBridge: ${JSON.stringify(is(e.id))}`,
        ))
      : n.push(
          `Target named by the student (EduBridge holds no verified record of it): ${e.name}. Do not state any requirement of it as fact.`,
        );
  return (
    (o = a == null ? void 0 : a.prompt) != null &&
      o.trim() &&
      n.push(
        `Essay prompt / questions the student says the application asks (treat as the student's copy of the official text): """${a.prompt.trim().slice(0, 3e3)}"""`,
      ),
    a != null && a.wordLimit && n.push(`Word limit the student says applies: ${a.wordLimit} words.`),
    (u = a == null ? void 0 : a.notes) != null &&
      u.trim() &&
      n.push(`Other instructions the student says apply: """${a.notes.trim().slice(0, 1500)}"""`),
    !(a != null && a.prompt) &&
      !(a != null && a.wordLimit) &&
      !(a != null && a.notes) &&
      n.push(
        'No essay prompt, word limit or format instructions were provided: compliance cannot be confirmed — say so.',
      ),
    n.push(
      `Write all explanations in ${Ig(t)}; keep every quotation and every rewritten sentence in the document's own language.`,
    ),
    n.join(`
`)
  );
}
export function Al(e, a) {
  return a === 'lines'
    ? e
        .split(
          `
`,
        )
        .map((t, n) => (t.trim() ? `[L${n + 1}] ${t}` : ''))
        .filter(Boolean).join(`
`)
    : oy(e).map((t, n) => `[P${n + 1}] ${t}`).join(`

`);
}
export const oy = (e) => {
  const a = e.replace(/\r/g, ''),
    t = a
      .split(/\n\s*\n/)
      .map((n) => n.trim())
      .filter(Boolean);
  return t.length > 1
    ? t
    : a
        .split(
          `
`,
        )
        .map((n) => n.trim())
        .filter(Boolean);
};
export function Qz(e, a) {
  const t = e.match(/https?:\/\/[^\s)\]>"']+/g) ?? [],
    n = (o) => o.replace(/[.,;:]+$/, '').replace(/\/$/, ''),
    s = new Set([...a].map(n)),
    r = [
      'https://www.uni-assist.de',
      'https://www.daad.de',
      'https://www.studyinkorea.go.kr',
      'https://turkiyeburslari.gov.tr',
      'https://www.turkiyeburslari.gov.tr',
      'https://stipendiumhungaricum.hu',
      'https://mtcp.kln.gov.my',
      'https://biasiswa.mohe.gov.my',
      'https://educationmalaysia.gov.my',
    ];
  return {
    unverified: [...new Set(t.map(n))].filter((o) => !s.has(o) && !r.includes(o)),
  };
}
export function ft() {
  const { state: e } = useStore(),
    [a, t] = React.useState('checking');
  React.useEffect(() => {
    let s = !0;
    return (
      Un().then((r) => {
        s && t(r);
      }),
      () => {
        s = !1;
      }
    );
  }, []);
  const n = a !== 'checking' && !!a && !e.aiOff;
  return {
    provider: a,
    live: n,
    off: e.aiOff,
    checking: a === 'checking',
  };
}
export const Tt = {
  cv: {
    en: 'Academic CV / resume',
    uz: 'Akademik CV / rezyume',
  },
  motivation: {
    en: 'Motivation letter',
    uz: 'Motivatsion xat',
  },
  personal_statement: {
    en: 'Personal statement',
    uz: 'Shaxsiy bayonot (personal statement)',
  },
  study_plan: {
    en: 'Study plan',
    uz: 'O‘qish rejasi (study plan)',
  },
  scholarship_essay: {
    en: 'Scholarship essay',
    uz: 'Grant inshosi',
  },
  recommendation: {
    en: 'Recommendation letter draft',
    uz: 'Tavsiyanoma qoralamasi',
  },
  other: {
    en: 'Other application document',
    uz: 'Boshqa ariza hujjati',
  },
};
export const Xz = {
  not_ready: ['Not ready', 'Tayyor emas', 'bad'],
  substantial_revision: ['Needs substantial revision', 'Jiddiy qayta ishlash kerak', 'bad'],
  moderate_improvement: ['Needs moderate improvement', 'O‘rtacha yaxshilash kerak', 'warn'],
  nearly_ready: ['Nearly ready', 'Deyarli tayyor', 'info'],
  final_proofreading: ['Ready for final proofreading', 'Yakuniy tekshiruvga tayyor', 'ok'],
};
export const vo = {
  structure: ['Structure and readability', 'Tuzilma va o‘qilishi'],
  academic: ['Academic presentation / relevance', 'Akademik taqdimot / bog‘liqlik'],
  experience: ['Relevant experience', 'Tegishli tajriba'],
  impact: ['Achievements and impact', 'Yutuqlar va natija'],
  skills: ['Skills and qualifications', 'Ko‘nikma va malakalar'],
  language: ['Language and professionalism', 'Til va professionallik'],
  relevance: ['Relevance to the target', 'Maqsadga moslik'],
  authenticity: ['Authenticity and motivation', 'Samimiylik va motivatsiya'],
  fit: ['Programme / university fit', 'Dastur va universitetga moslik'],
  evidence: ['Evidence and examples', 'Dalil va misollar'],
  career: ['Career objectives', 'Karyera maqsadlari'],
  writing: ['Writing quality', 'Yozuv sifati'],
  compliance: ['Compliance with requirements', 'Talablarga muvofiqlik'],
  clarity: ['Clarity', 'Aniqlik'],
  relevanceQ: ['Relevance', 'Mos kelishi'],
  communication: ['Communication (written only)', 'Muloqot (faqat yozma matn bo‘yicha)'],
  alignment: ['Alignment with goals', 'Maqsadlarga moslik'],
};
export function Wo({ scores: e }) {
  const { tx: a } = useI18n();
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {e.map((t) => {
        const [n, s] = vo[t.key] ?? [t.key, t.key];
        return (
          <li className="rounded-lg border border-line p-3" key={t.key}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-bold">{a(n, s)}</span>
              <span
                className={classNames(
                  'tabular text-[15px] font-extrabold',
                  t.score == null ? 'text-faint' : t.score >= 8 ? 'text-ok' : t.score >= 5 ? 'text-warn' : 'text-bad',
                )}
              >
                {t.score == null ? '—' : `${t.score}/10`}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken">
              <div
                className={classNames(
                  'h-full rounded-full',
                  t.score == null ? '' : t.score >= 8 ? 'bg-ok' : t.score >= 5 ? 'bg-warn' : 'bg-bad',
                )}
                style={{
                  width: `${(t.score ?? 0) * 10}%`,
                }}
              />
            </div>
            {t.reason && <p className="mt-1.5 text-[12.5px] text-muted">{t.reason}</p>}
            {t.score == null && !t.reason && (
              <p className="mt-1.5 text-[12.5px] text-muted">{a('Not assessed', 'Baholanmadi')}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
export function CmpMi({ q: e }) {
  const { tx: a } = useI18n();
  return (
    <span className="block">
      <span className="block border-l-2 border-line pl-2.5 italic text-fg/85">“{e.quote}”</span>
      {!e.found && (
        <span className="mt-0.5 flex items-center gap-1 text-[12px] font-semibold text-warn">
          <TriangleAlert size={12} />
          {a(
            'This exact wording was not found in your document — check it yourself.',
            'Bu aniq jumla hujjatingizda topilmadi — o‘zingiz tekshiring.',
          )}
        </span>
      )}
    </span>
  );
}
export function Fi({ label: e }) {
  const { tx: a } = useI18n();
  return (
    <p className="flex items-center gap-2 text-[14px] text-muted" role="status">
      <LoaderCircle size={16} className="animate-spin" />
      {e ?? a('Thinking…', 'O‘ylamoqda…')}
    </p>
  );
}
export function Se({ title: e, children: a, tone: t }) {
  return (
    <section className="border-t border-line pt-4">
      <h3
        className={classNames(
          'mb-2 text-[15.5px] font-extrabold',
          t === 'ok' && 'text-ok',
          t === 'bad' && 'text-bad',
          t === 'warn' && 'text-warn',
        )}
      >
        {e}
      </h3>
      <div className="text-[14px] leading-relaxed">{a}</div>
    </section>
  );
}
function Tl(e, a) {
  const t = [],
    n = /(\*\*[^*]+\*\*|https?:\/\/[^\s)\]>]+)/g;
  let s = 0,
    r,
    o = 0;
  for (; (r = n.exec(e));) {
    r.index > s && t.push(e.slice(s, r.index));
    const u = r[0];
    if (u.startsWith('**')) t.push(<strong key={`${a}-${o++}`}>{u.slice(2, -2)}</strong>);
    else {
      const l = u.replace(/[.,;:]+$/, '');
      (t.push(
        <a
          href={l}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-semibold text-teal-ink underline dark:text-teal"
          key={`${a}-${o++}`}
        >
          {l}
        </a>,
      ),
        l.length < u.length && t.push(u.slice(l.length)));
    }
    s = r.index + u.length;
  }
  return (s < e.length && t.push(e.slice(s)), t);
}
export function Jz({ text: e }) {
  const a = e.replace(/\r/g, '').split(`
`),
    t = [];
  let n = null;
  const s = () => {
    if (!n) return;
    const r = t.length;
    (t.push(
      n.ordered ? (
        <ol className="my-1.5 list-decimal space-y-1 pl-5" key={r}>
          {n.items.map((o, u) => (
            <li key={u}>{Tl(o, `${r}-${u}`)}</li>
          ))}
        </ol>
      ) : (
        <ul className="my-1.5 list-disc space-y-1 pl-5" key={r}>
          {n.items.map((o, u) => (
            <li key={u}>{Tl(o, `${r}-${u}`)}</li>
          ))}
        </ul>
      ),
    ),
      (n = null));
  };
  for (const r of a) {
    const o = r.trimEnd(),
      u = /^#{1,4}\s+(.*)$/.exec(o),
      l = /^\s*[-*•]\s+(.*)$/.exec(o),
      c = /^\s*\d+[.)]\s+(.*)$/.exec(o);
    if (u) {
      (s(),
        t.push(
          <h4 className="mb-1 mt-3 text-[14.5px] font-extrabold first:mt-0" key={t.length}>
            {u[1].replace(/\*\*/g, '')}
          </h4>,
        ));
      continue;
    }
    if (l || c) {
      const p = !!c && !l;
      ((!n || n.ordered !== p) &&
        (s(),
        (n = {
          ordered: p,
          items: [],
        })),
        n.items.push((l ?? c)[1]));
      continue;
    }
    (s(),
      o.trim() &&
        t.push(
          <p className="my-1" key={t.length}>
            {Tl(o, String(t.length))}
          </p>,
        ));
  }
  return (s(), (<div className="break-words">{t}</div>));
}
export function mn(e, a) {
  var t;
  if (e.kind === 'uni') {
    const n = Mn(e.id);
    return n
      ? `${n.name} · ${e.level === 'bachelor' ? la(a, 'Bachelor’s', 'Bakalavr') : la(a, 'Master’s', 'Magistratura')}`
      : e.id;
  }
  return e.kind === 'grant'
    ? (((t = ct.find((n) => n.id === e.id)) == null ? void 0 : t.name) ?? e.id)
    : e.kind === 'custom'
      ? e.name
      : la(a, 'No target chosen', 'Maqsad tanlanmagan');
}
export const nn = (e) =>
  e.kind === 'uni'
    ? `uni:${e.id}:${e.level}`
    : e.kind === 'grant'
      ? `grant:${e.id}`
      : e.kind === 'custom'
        ? `custom:${e.name.trim().toLowerCase()}`
        : 'none';
export function Cmp$d({ value: e, onChange: a, req: t, onReq: n, showReq: s = !0 }) {
  const { tx: r, p: o } = useI18n(),
    u = e.kind;
  return (
    <div className="grid gap-3">
      <Field
        label={r('Target university or scholarship', 'Maqsad: universitet yoki grant')}
        htmlFor="tgt-kind"
        hint={r(
          'Optional, but fit can only be judged against a target.',
          'Ixtiyoriy, lekin moslikni faqat maqsadga nisbatan baholash mumkin.',
        )}
      >
        <Select
          id="tgt-kind"
          value={u}
          onChange={(l) => {
            const c = l.target.value;
            a(
              c === 'uni'
                ? {
                    kind: 'uni',
                    id: Mu('MY')[0].id,
                    level: 'master',
                  }
                : c === 'grant'
                  ? {
                      kind: 'grant',
                      id: ct[0].id,
                    }
                  : c === 'custom'
                    ? {
                        kind: 'custom',
                        name: '',
                      }
                    : {
                        kind: 'none',
                      },
            );
          }}
        >
          <option value="none">{r('No specific target', 'Aniq maqsad yo‘q')}</option>
          <option value="uni">{r('A university in EduBridge (50)', 'EduBridge’dagi universitet (50)')}</option>
          <option value="grant">{r('A scholarship in EduBridge', 'EduBridge’dagi grant')}</option>
          <option value="custom">{r('Another university or scholarship', 'Boshqa universitet yoki grant')}</option>
        </Select>
      </Field>
      {e.kind === 'uni' && (
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <Field label={r('University', 'Universitet')} htmlFor="tgt-uni">
            <Select
              id="tgt-uni"
              value={e.id}
              onChange={(l) =>
                a({
                  ...e,
                  id: l.target.value,
                })
              }
            >
              {Ro.map((l) => (
                <optgroup label={o(ta[l].name)} key={l}>
                  {Mu(l).map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
          <Field label={r('Level', 'Daraja')} htmlFor="tgt-lvl">
            <Select
              id="tgt-lvl"
              value={e.level}
              onChange={(l) =>
                a({
                  ...e,
                  level: l.target.value,
                })
              }
            >
              <option value="bachelor">{r('Bachelor’s', 'Bakalavr')}</option>
              <option value="master">{r('Master’s', 'Magistratura')}</option>
            </Select>
          </Field>
        </div>
      )}
      {e.kind === 'grant' && (
        <Field label={r('Scholarship', 'Grant')} htmlFor="tgt-grant">
          <Select
            id="tgt-grant"
            value={e.id}
            onChange={(l) =>
              a({
                kind: 'grant',
                id: l.target.value,
              })
            }
          >
            {ct.map((l) => (
              <option value={l.id} key={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {e.kind === 'custom' && (
        <Field
          label={r('Name of the university, programme or scholarship', 'Universitet, dastur yoki grant nomi')}
          htmlFor="tgt-name"
          hint={r(
            'EduBridge has no verified record of it, so its requirements will not be stated as fact.',
            'EduBridge’da u haqida tasdiqlangan yozuv yo‘q, shuning uchun talablari fakt sifatida aytilmaydi.',
          )}
        >
          <Input
            id="tgt-name"
            value={e.name}
            onChange={(l) =>
              a({
                kind: 'custom',
                name: l.target.value,
              })
            }
          />
        </Field>
      )}
      {s && n && e.kind !== 'none' && (
        <details className="rounded-lg border border-line px-3 py-2">
          <summary className="cursor-pointer text-[13.5px] font-bold">
            {r(
              'Essay prompt, word limit, instructions (copy from the official page)',
              'Insho savoli, so‘z chegarasi, ko‘rsatmalar (rasmiy sahifadan ko‘chiring)',
            )}
          </summary>
          <div className="mt-2 grid gap-3">
            <Field label={r('Essay prompt / questions', 'Insho savoli / savollar')} htmlFor="req-prompt" optional={!0}>
              <Textarea
                id="req-prompt"
                className="min-h-[70px]"
                value={(t == null ? void 0 : t.prompt) ?? ''}
                onChange={(l) =>
                  n({
                    ...t,
                    prompt: l.target.value,
                  })
                }
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
              <Field label={r('Word limit', 'So‘z chegarasi')} htmlFor="req-limit" optional={!0}>
                <Input
                  id="req-limit"
                  inputMode="numeric"
                  value={(t == null ? void 0 : t.wordLimit) ?? ''}
                  onChange={(l) =>
                    n({
                      ...t,
                      wordLimit: Number(l.target.value.replace(/\D/g, '')) || void 0,
                    })
                  }
                />
              </Field>
              <Field label={r('Other instructions', 'Boshqa ko‘rsatmalar')} htmlFor="req-notes" optional={!0}>
                <Input
                  id="req-notes"
                  value={(t == null ? void 0 : t.notes) ?? ''}
                  onChange={(l) =>
                    n({
                      ...t,
                      notes: l.target.value,
                    })
                  }
                />
              </Field>
            </div>
            <p className="text-[12.5px] text-muted">
              {r(
                'Without these, compliance with the application’s rules cannot be confirmed.',
                'Bularsiz arizaning qoidalariga muvofiqlikni tasdiqlab bo‘lmaydi.',
              )}
            </p>
          </div>
        </details>
      )}
    </div>
  );
}
export function Zz() {
  const { tx: e } = useI18n(),
    a = ft();
  return a.checking ? (
    <Badge tone="neutral">{e('Checking AI…', 'SI tekshirilmoqda…')}</Badge>
  ) : a.live ? (
    <Badge tone="teal">{e('AI connected', 'SI ulangan')}</Badge>
  ) : a.off ? (
    <Badge tone="warn">{e('AI switched off in Settings', 'SI Sozlamalarda o‘chirilgan')}</Badge>
  ) : (
    <Badge tone="warn">{e('AI not connected in this view', 'Bu ko‘rinishda SI ulanmagan')}</Badge>
  );
}
const Nl = {
  strong: ['Strong', 'Kuchli', 'ok'],
  ok: ['On track', 'Yetarli', 'info'],
  gap: ['Gap', 'Bo‘shliq', 'bad'],
  unknown: ['Not enough information', 'Ma’lumot yetarli emas', 'neutral'],
};
const Dh = (e = new Date()) => `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, '0')}`;
function Cmp_z({ idea: e, reasons: a, onAdd: t, added: n }) {
  const { tx: s, p: r } = useI18n(),
    [o, u] = React.useState(!1);
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="teal">{r(Br[e.cat])}</Badge>
        <Badge>{s(`~${e.hours} h/week`, `~${e.hours} soat/hafta`)}</Badge>
        <Badge>{s(`${e.months}+ months`, `${e.months}+ oy`)}</Badge>
        <Badge tone={e.cost === 'free' ? 'ok' : 'warn'}>
          {e.cost === 'free'
            ? s('Free', 'Bepul')
            : e.cost === 'low'
              ? s('Low cost', 'Arzon')
              : s('Some cost', 'Biroz xarajat')}
        </Badge>
        <Badge tone="neutral">
          {s('Effort', 'Kuch')}
          {': '}
          {'●'.repeat(e.effort)}
          {'○'.repeat(3 - e.effort)}
        </Badge>
      </div>
      <p className="mt-2 text-[16px] font-extrabold">{r(e.title)}</p>
      <p className="mt-1 text-[14px] text-muted">{r(e.what)}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {e.signals.map((l) => (
          <span className="rounded-full bg-sunken px-2 py-0.5 text-[12px] font-semibold text-muted" key={l}>
            {s('Shows', 'Ko‘rsatadi')}
            {': '}
            {r(hz[l])}
          </span>
        ))}
      </div>
      {a && a.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {a.map((l, c) => (
            <li key={c}>
              <Badge tone="info">{r(l)}</Badge>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => u(!o)}
        aria-expanded={o}
        className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-bold text-teal-ink dark:text-teal"
      >
        {o
          ? s('Hide details', 'Tafsilotlarni yashirish')
          : s('Steps, CV line, pitfalls', 'Qadamlar, CV qatori, xatolar')}
        <ChevronDown size={15} className={classNames('transition-transform', o && 'rotate-180')} />
      </button>
      {o && (
        <div className="mt-3 grid gap-3 text-[14px]">
          <div>
            <p className="font-bold">{s('How to do it', 'Qanday bajarish')}</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5">
              {e.steps.map((l, c) => (
                <li key={c}>{r(l)}</li>
              ))}
            </ol>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {e.ladder.map((l, c) => (
              <div
                className={classNames(
                  'rounded-lg border p-2.5',
                  c === 2 ? 'border-ok/40 bg-ok-soft/40' : 'border-line',
                )}
                key={c}
              >
                <p className="text-[11.5px] font-bold uppercase text-faint">
                  {[s('Basic', 'Oddiy'), s('Strong', 'Kuchli'), s('Outstanding', 'Ajoyib')][c]}
                </p>
                <p className="mt-0.5 text-[13px]">{r(l)}</p>
              </div>
            ))}
          </div>
          {r(e.cv) !== '—' && (
            <div>
              <p className="font-bold">{s('How it can read on your CV', 'CV’da qanday ko‘rinishi mumkin')}</p>
              <p className="mt-1 rounded-md bg-sunken px-3 py-2 font-mono text-[13px]">{r(e.cv)}</p>
              <p className="mt-1 text-[12px] text-muted">
                {s(
                  'Fill [brackets] only with your real facts.',
                  '[Qavslar]ni faqat haqiqiy faktlaringiz bilan to‘ldiring.',
                )}
              </p>
            </div>
          )}
          {r(e.angle) !== '—' && (
            <div>
              <p className="font-bold">{s('In your letter', 'Xatingizda')}</p>
              <p className="mt-1 text-muted">{r(e.angle)}</p>
            </div>
          )}
          <div>
            <p className="font-bold">{s('Evidence to keep', 'Saqlanadigan dalillar')}</p>
            <p className="mt-1 text-muted">{r(e.evidence)}</p>
          </div>
          <p className="flex gap-1.5 rounded-md bg-warn-soft/60 px-3 py-2 text-[13.5px]">
            <TriangleAlert size={15} className="mt-0.5 shrink-0 text-warn" />
            <span>
              <b>{s('Common mistake: ', 'Ko‘p uchraydigan xato: ')}</b>
              {r(e.pitfall)}
            </span>
          </p>
        </div>
      )}
      <div className="mt-3">
        <Button
          size="sm"
          variant={n ? 'ghost' : 'primary'}
          icon={n ? <Check size={14} /> : <Plus size={14} />}
          disabled={n}
          onClick={t}
        >
          {n ? s('In my plan', 'Rejamda') : s('Add to my plan', 'Rejamga qo‘shish')}
        </Button>
      </div>
    </Card>
  );
}
export function AdviserPage() {
  const { state: e, upsertGrowth: a, removeGrowth: t, notify: n } = useStore(),
    { tx: s, p: r, lang: o } = useI18n(),
    u = ft(),
    l = e.profile,
    c = e.growth ?? [],
    [p, d] = React.useState('check'),
    [h, m] = React.useState(l.field),
    [y, E] = React.useState(l.targetLevel === 'master' ? 'master' : 'bachelor'),
    [C, v] = React.useState('middle'),
    [g, b] = React.useState(12),
    [S, A] = React.useState(5),
    [q, w] = React.useState('free'),
    [U, j] = React.useState([]),
    [k, K] = React.useState(!1),
    x = React.useMemo(() => gz(l, C, y), [l, C, y]),
    O = React.useMemo(
      () =>
        yz(x, {
          months: g,
          hours: S,
          cost: q,
          field: h,
          level: y,
          group: C,
        }),
      [x, g, S, q, h, y, C],
    ).filter((P) => (k || P.fits) && (!U.length || U.includes(P.idea.cat))),
    N = (P) => c.some((ie) => ie.ideaId === P),
    I = (P) => {
      (a({
        id: He(),
        ideaId: P.id,
        title: P.title.en,
        steps: P.steps.map((ie) => ie.en),
        startMonth: Dh(),
        months: Math.min(P.months, g),
        done: P.steps.map(() => !1),
        source: 'library',
      }),
        n(s('Added to your plan', 'Rejangizga qo‘shildi')));
    },
    [f, M] = React.useState(''),
    [D, R] = React.useState(''),
    [_, de] = React.useState(null),
    [T, ae] = React.useState(''),
    [B, Z] = React.useState(null),
    [oe, ve] = React.useState(''),
    [vt, bt] = React.useState(''),
    [Bn, Ft] = React.useState('coach'),
    Ri = React.useRef(null);
  React.useEffect(
    () => () => {
      var P;
      return (P = Ri.current) == null ? void 0 : P.abort();
    },
    [],
  );
  const ki = (P) => {
      const ie = P;
      ie.code !== 'cancelled' && bt(ie instanceof Oe ? Ta('invalid_json', o) : Ta(ie.code, o));
    },
    Zs = (P) => (P === 'selective' ? 'highly selective' : P === 'middle' ? 'balanced (middle)' : 'more accessible'),
    Ln = async () => {
      if (oe) return;
      (bt(''), Ft('coach'), ve('coach'), de(null));
      const P = new AbortController();
      Ri.current = P;
      try {
        const ie = x
            .filter((Ne) => Ne.status === 'gap')
            .map((Ne) => `${Ne.title.en}: now ${Ne.now.en}; target ${Ne.target.en}`),
          Pe = c.map((Ne) => Ne.title).join('; ');
        de(
          Gz(
            await hi(
              Tz({
                lang: o,
                profile: Os(l),
                interests: f,
                career: D,
                field: xe[h].en,
                level: y,
                group: Zs(C),
                months: g,
                hours: S,
                budget: q,
                gaps: ie,
                existing: Pe,
              }),
              {
                tier: 'complex',
                signal: P.signal,
              },
            ),
          ),
        );
      } catch (ie) {
        ki(ie);
      } finally {
        ve('');
      }
    },
    Xo = async () => {
      if (oe || !T.trim()) return;
      (bt(''), Ft('review'), ve('review'), Z(null));
      const P = new AbortController();
      Ri.current = P;
      try {
        Z(
          Hz(
            await hi(
              Nz({
                lang: o,
                activity: T,
                field: xe[h].en,
                level: y,
                group: Zs(C),
                profile: Os(l),
              }),
              {
                tier: 'default',
                signal: P.signal,
              },
            ),
          ),
        );
      } catch (ie) {
        ki(ie);
      } finally {
        ve('');
      }
    },
    Pn = (
      <Card className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={s('Intended subject', 'Rejalashtirilgan yo‘nalish')} htmlFor="ad-f">
          <Select id="ad-f" value={h} onChange={(P) => m(P.target.value)}>
            {Object.keys(xe).map((P) => (
              <option value={P} key={P}>
                {r(xe[P])}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={s('Applying for', 'Daraja')} htmlFor="ad-l">
          <Select id="ad-l" value={y} onChange={(P) => E(P.target.value)}>
            <option value="bachelor">{s('Bachelor’s', 'Bakalavr')}</option>
            <option value="master">{s('Master’s', 'Magistratura')}</option>
          </Select>
        </Field>
        <Field label={s('Target group of universities', 'Maqsad guruhi')} htmlFor="ad-g" hint={r(jn[C].who)}>
          <Select id="ad-g" value={C} onChange={(P) => v(P.target.value)}>
            {['selective', 'middle', 'accessible'].map((P) => (
              <option value={P} key={P}>
                {r(jn[P].name)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={s(`Time before applying: ${g} months`, `Arizagacha vaqt: ${g} oy`)} htmlFor="ad-m">
          <input
            id="ad-m"
            type="range"
            min={1}
            max={24}
            value={g}
            onChange={(P) => b(Number(P.target.value))}
            className="w-full accent-[rgb(var(--teal))]"
          />
        </Field>
        <Field label={s(`Hours per week: ${S}`, `Haftasiga: ${S} soat`)} htmlFor="ad-h">
          <input
            id="ad-h"
            type="range"
            min={1}
            max={40}
            value={S}
            onChange={(P) => A(Number(P.target.value))}
            className="w-full accent-[rgb(var(--teal))]"
          />
        </Field>
        <Field label={s('Budget for activities', 'Faoliyat uchun byudjet')} htmlFor="ad-b">
          <Select id="ad-b" value={q} onChange={(P) => w(P.target.value)}>
            <option value="free">{s('Free only', 'Faqat bepul')}</option>
            <option value="low">{s('A small budget', 'Kichik byudjet')}</option>
            <option value="some">{s('Some budget', 'Biroz byudjet')}</option>
          </Select>
        </Field>
      </Card>
    );
  return (
    <div>
      <PageHeader
        eyebrow={s('Profile builder', 'Profilni kuchaytirish')}
        title={s('Build a stronger profile', 'Kuchliroq profil yarating')}
        sub={s(
          'See where your profile is weak for the universities you want, pick activities that fix it, and plan them month by month. Nothing here guarantees admission or a scholarship.',
          'Profilingiz xohlagan universitetlaringiz uchun qayerda zaif ekanini ko‘ring, uni tuzatadigan faoliyatlarni tanlang va oyma-oy rejalang. Bu yerdagi hech narsa qabul yoki grantni kafolatlamaydi.',
        )}
      />
      {Pn}
      <div className="my-4">
        <Tabs
          value={p}
          onChange={d}
          items={[
            {
              id: 'check',
              label: s('Profile check', 'Profil tekshiruvi'),
            },
            {
              id: 'ideas',
              label: s(`Ideas (${jt.length})`, `G‘oyalar (${jt.length})`),
            },
            {
              id: 'plan',
              label: s(`My plan (${c.length})`, `Rejam (${c.length})`),
            },
            {
              id: 'coach',
              label: s('AI coach', 'SI murabbiy'),
            },
          ]}
        />
      </div>
      {p === 'check' && (
        <div className="grid gap-3">
          <Callout tone="info">
            {s(
              'Targets are EduBridge planning targets for this group, based on the general guidance — not official admission rules. Each university page shows its own confirmed requirements.',
              'Maqsadlar bu guruh uchun umumiy yo‘riqnomaga asoslangan EduBridge rejalashtirish mo‘ljallari — rasmiy qabul qoidalari emas. Har bir universitet sahifasida o‘zining tasdiqlangan talablari ko‘rsatilgan.',
            )}
          </Callout>
          <ul className="grid gap-3 md:grid-cols-2">
            {x.map((P) => (
              <li key={P.id}>
                <Card className="h-full p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[15.5px] font-extrabold">{r(P.title)}</p>
                    <Badge tone={Nl[P.status][2]}>{s(Nl[P.status][0], Nl[P.status][1])}</Badge>
                  </div>
                  <dl className="mt-2 grid gap-1 text-[13.5px]">
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 font-semibold text-muted">{s('Now', 'Hozir')}</dt>
                      <dd>{r(P.now)}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 font-semibold text-muted">{s('Target', 'Mo‘ljal')}</dt>
                      <dd>{r(P.target)}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-[13px] text-muted">{r(P.why)}</p>
                </Card>
              </li>
            ))}
          </ul>
          <p className="text-[12.5px] text-muted">
            {s(
              'Experiences come from your profile — update them there if something is missing.',
              'Tajribalar profilingizdan olinadi — biror narsa yetishmasa, uni profilda yangilang.',
            )}
          </p>
          <div>
            <Button variant="primary" icon={<Target size={16} />} onClick={() => d('ideas')}>
              {s('See the activities that fix these gaps', 'Bu bo‘shliqlarni tuzatadigan faoliyatlarni ko‘rish')}
            </Button>
          </div>
        </div>
      )}
      {p === 'ideas' && (
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(Br).map((P) => (
              <Pa
                active={U.includes(P)}
                onClick={() => j(U.includes(P) ? U.filter((ie) => ie !== P) : [...U, P])}
                key={P}
              >
                {r(Br[P])}
              </Pa>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[13.5px] font-semibold">
            <input
              type="checkbox"
              checked={k}
              onChange={(P) => K(P.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--teal))]"
            />
            {s(
              'Also show ideas that do not fit my time, hours, budget or subject',
              'Vaqt, soat, byudjet yoki sohamga mos kelmaydigan g‘oyalarni ham ko‘rsatish',
            )}
          </label>
          <p className="text-[13px] text-muted">
            {s(
              `${O.length} ideas, best fit first — ranked by your gaps, target group, subject and time.`,
              `${O.length} ta g‘oya, eng mosi birinchi — bo‘shliqlar, maqsad guruhi, soha va vaqtga qarab tartiblangan.`,
            )}
          </p>
          {O.length === 0 ? (
            <Callout tone="warn">
              {s(
                'Nothing fits these limits. Allow more time or hours, or tick the box above.',
                'Bu cheklovlarga mos narsa yo‘q. Ko‘proq vaqt yoki soat belgilang yoki yuqoridagi belgini qo‘ying.',
              )}
            </Callout>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {O.map((P) => (
                <li key={P.idea.id}>
                  <Cmp_z
                    idea={P.idea}
                    reasons={
                      P.fits
                        ? P.reasons
                        : [
                            {
                              en: 'Does not fit your current limits',
                              uz: 'Hozirgi cheklovlaringizga mos emas',
                            },
                          ]
                    }
                    onAdd={() => I(P.idea)}
                    added={N(P.idea.id)}
                  />
                </li>
              ))}
            </ul>
          )}
          <p className="text-[12.5px] text-faint">
            {s(
              'These are activity types, not specific programmes. EduBridge does not invent named competitions or organisations; it names only well-known open platforms.',
              'Bular aniq dasturlar emas, faoliyat turlari. EduBridge nomli tanlov yoki tashkilotlarni o‘ylab topmaydi; faqat taniqli ochiq platformalarni tilga oladi.',
            )}
          </p>
        </div>
      )}
      {p === 'plan' && (
        <div className="grid gap-3">
          {c.length === 0 ? (
            <Callout icon={<ListChecks size={16} />}>
              {s(
                'Your plan is empty. Add activities from “Ideas” or the AI coach.',
                'Rejangiz bo‘sh. “G‘oyalar” yoki SI murabbiydan faoliyat qo‘shing.',
              )}
            </Callout>
          ) : (
            <>
              <Callout
                tone={
                  c.reduce((P, ie) => {
                    var Pe;
                    return P + (((Pe = jt.find((Ne) => Ne.id === ie.ideaId)) == null ? void 0 : Pe.hours) ?? 4);
                  }, 0) > S
                    ? 'warn'
                    : 'info'
                }
              >
                {s(
                  `Total planned: about ${c.reduce((P, ie) => {
                    var Pe;
                    return P + (((Pe = jt.find((Ne) => Ne.id === ie.ideaId)) == null ? void 0 : Pe.hours) ?? 4);
                  }, 0)} hours a week (you said ${S}). Two activities done deeply beat five done halfway.`,
                  `Jami reja: haftasiga taxminan ${c.reduce((P, ie) => {
                    var Pe;
                    return P + (((Pe = jt.find((Ne) => Ne.id === ie.ideaId)) == null ? void 0 : Pe.hours) ?? 4);
                  }, 0)} soat (siz ${S} dedingiz). Chuqur bajarilgan ikki faoliyat yarim bajarilgan beshtadan kuchli.`,
                )}
              </Callout>
              <ul className="grid gap-3">
                {c.map((P) => {
                  const ie = jt.find((Gi) => Gi.id === P.ideaId),
                    Pe = ie ? r(ie.title) : P.title,
                    Ne = ie ? ie.steps.map((Gi) => r(Gi)) : P.steps,
                    Dt = P.done.filter(Boolean).length;
                  return (
                    <li key={P.id}>
                      <Card className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[15.5px] font-extrabold">{Pe}</p>
                            <p className="text-[12.5px] text-muted">
                              {P.source === 'ai' ? s('From the AI coach', 'SI murabbiydan') : ie ? r(Br[ie.cat]) : ''}
                              {' · '}
                              {s(
                                `from ${P.startMonth}, about ${P.months} months`,
                                `${P.startMonth} dan, taxminan ${P.months} oy`,
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge tone={Dt === Ne.length ? 'ok' : 'neutral'}>
                              {Dt}/{Ne.length}
                            </Badge>
                            <button
                              type="button"
                              aria-label={s('Remove', 'Olib tashlash')}
                              onClick={() => t(P.id)}
                              className="rounded p-1 text-faint hover:text-bad"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken">
                          <div
                            className="h-full rounded-full bg-teal"
                            style={{
                              width: `${(Dt / Math.max(1, Ne.length)) * 100}%`,
                            }}
                          />
                        </div>
                        <ul className="mt-3 grid gap-1">
                          {Ne.map((Gi, V) => (
                            <li key={V}>
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={!!P.done[V]}
                                onClick={() => {
                                  const Hi = [...P.done];
                                  ((Hi[V] = !Hi[V]),
                                    a({
                                      ...P,
                                      done: Hi,
                                    }));
                                }}
                                className="flex w-full items-start gap-2.5 rounded-lg px-1 py-1 text-left hover:bg-sunken"
                              >
                                <span
                                  className={classNames(
                                    'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border-2',
                                    P.done[V] ? 'border-teal bg-teal text-white' : 'border-line',
                                  )}
                                >
                                  {P.done[V] && <Check size={13} strokeWidth={3} />}
                                </span>
                                <span className={classNames('text-[14px]', P.done[V] && 'text-muted line-through')}>
                                  <span className="mr-1 text-[12px] font-bold text-faint">
                                    {s('Month', 'Oy')}{' '}
                                    {Math.min(P.months, 1 + Math.floor((V * P.months) / Math.max(1, Ne.length)))}
                                  </span>
                                  {Gi}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                        {ie && r(ie.cv) !== '—' && (
                          <p className="mt-2 rounded-md bg-sunken px-3 py-2 font-mono text-[12.5px]">{r(ie.cv)}</p>
                        )}
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
      {p === 'coach' && (
        <div className="grid gap-4">
          {!u.live && !u.checking && (
            <Callout tone="warn">
              {s(
                'The AI coach needs live AI, which is not connected in this view. The profile check, ideas and plan still work.',
                'SI murabbiy uchun jonli SI kerak, u bu ko‘rinishda ulanmagan. Profil tekshiruvi, g‘oyalar va reja ishlayveradi.',
              )}
            </Callout>
          )}
          <Card className="grid gap-3 p-4">
            <p className="flex items-center gap-2 text-[16px] font-extrabold">
              <Sparkles size={17} />
              {s('A plan built from your own interests', 'O‘z qiziqishlaringizdan tuzilgan reja')}
            </p>
            <p className="text-[13.5px] text-muted">
              {s(
                'The more specific you are, the less generic the ideas. Write what you actually do, read, watch or care about.',
                'Qanchalik aniq yozsangiz, g‘oyalar shunchalik kam umumiy bo‘ladi. Aslida nima qilishingiz, o‘qishingiz, ko‘rishingiz yoki nimaga qiziqishingizni yozing.',
              )}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label={s('Interests and hobbies', 'Qiziqish va mashg‘ulotlar')} htmlFor="co-i">
                <Textarea
                  id="co-i"
                  className="min-h-[80px]"
                  value={f}
                  onChange={(P) => M(P.target.value)}
                  placeholder={s(
                    'e.g. I follow the stock market, play chess, run a Telegram channel about…',
                    'masalan, birjani kuzataman, shaxmat o‘ynayman, … haqida Telegram kanal yuritaman',
                  )}
                />
              </Field>
              <Field label={s('Career interests', 'Kasbiy qiziqishlar')} htmlFor="co-c">
                <Textarea
                  id="co-c"
                  className="min-h-[80px]"
                  value={D}
                  onChange={(P) => R(P.target.value)}
                  placeholder={s(
                    'e.g. risk management in a bank in Uzbekistan',
                    'masalan, O‘zbekistondagi bankda risk-menejment',
                  )}
                />
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {oe === 'coach' ? (
                <>
                  <Fi label={s('Designing your plan…', 'Rejangiz tuzilmoqda…')} />
                  <Button
                    size="sm"
                    icon={<Square size={13} />}
                    onClick={() => {
                      var P;
                      return (P = Ri.current) == null ? void 0 : P.abort();
                    }}
                  >
                    {s('Stop', 'To‘xtatish')}
                  </Button>
                </>
              ) : (
                <Button variant="primary" icon={<WandSparkles size={16} />} disabled={!u.live} onClick={Ln}>
                  {s('Get my personal plan', 'Shaxsiy rejamni olish')}
                </Button>
              )}
            </div>
            {vt && Bn === 'coach' && oe === '' && (
              <p className="text-[13px] font-semibold text-bad" role="alert">
                {vt}
              </p>
            )}
          </Card>
          {_ && (
            <Card className="grid gap-4 p-4">
              <div>
                <p className="text-[12px] font-bold uppercase text-faint">
                  {s('What your profile says today', 'Profilingiz bugun nima deydi')}
                </p>
                <p className="mt-1 text-[14.5px]">{_.diagnosis}</p>
              </div>
              {_.themes.length > 0 && (
                <div>
                  <p className="font-extrabold">
                    {s(
                      'Possible themes to tie your application together',
                      'Arizangizni bog‘lashi mumkin bo‘lgan mavzular',
                    )}
                  </p>
                  <ul className="mt-2 grid gap-2 md:grid-cols-3">
                    {_.themes.map((P, ie) => (
                      <li className="rounded-lg border border-line p-3" key={ie}>
                        <p className="font-bold">{P.theme}</p>
                        <p className="mt-1 text-[13px] text-muted">{P.why}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid gap-3">
                {_.ideas.map((P, ie) => (
                  <div className="rounded-xl border border-line p-4" key={ie}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {P.months != null && <Badge>{s(`~${P.months} months`, `~${P.months} oy`)}</Badge>}
                      {P.hours != null && <Badge>{s(`~${P.hours} h/week`, `~${P.hours} soat/hafta`)}</Badge>}
                    </div>
                    <p className="mt-1.5 text-[16px] font-extrabold">{P.title}</p>
                    <p className="mt-1 text-[14px]">{P.why}</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-[14px]">
                      {P.steps.map((Pe, Ne) => (
                        <li key={Ne}>{Pe}</li>
                      ))}
                    </ol>
                    <dl className="mt-2 grid gap-2 text-[13.5px] md:grid-cols-2">
                      {P.output && (
                        <div>
                          <dt className="font-bold">{s('Output', 'Natija')}</dt>
                          <dd className="text-muted">{P.output}</dd>
                        </div>
                      )}
                      {P.angle && (
                        <div>
                          <dt className="font-bold">{s('In your letter', 'Xatingizda')}</dt>
                          <dd className="text-muted">{P.angle}</dd>
                        </div>
                      )}
                      {P.cvLine && (
                        <div className="md:col-span-2">
                          <dt className="font-bold">{s('CV line', 'CV qatori')}</dt>
                          <dd className="mt-0.5 rounded-md bg-sunken px-3 py-1.5 font-mono text-[12.5px]">
                            {P.cvLine}
                          </dd>
                        </div>
                      )}
                      {P.risk && (
                        <div className="md:col-span-2">
                          <dt className="font-bold text-warn">
                            {s('What could make it weak', 'Uni nima zaiflashtirishi mumkin')}
                          </dt>
                          <dd className="text-muted">{P.risk}</dd>
                        </div>
                      )}
                    </dl>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        icon={<Plus size={14} />}
                        disabled={c.some((Pe) => Pe.title === P.title)}
                        onClick={() => {
                          (a({
                            id: He(),
                            title: P.title,
                            steps: P.steps,
                            startMonth: Dh(),
                            months: Math.max(1, Math.min(g, P.months ?? 3)),
                            done: P.steps.map(() => !1),
                            source: 'ai',
                          }),
                            n(s('Added to your plan', 'Rejangizga qo‘shildi')));
                        }}
                      >
                        {c.some((Pe) => Pe.title === P.title)
                          ? s('In my plan', 'Rejamda')
                          : s('Add to my plan', 'Rejamga qo‘shish')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {_.avoid.length > 0 && (
                <div className="rounded-lg bg-bad-soft/50 p-3">
                  <p className="font-extrabold text-bad">{s('Stop or avoid', 'To‘xtating yoki qochib turing')}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-[14px]">
                    {_.avoid.map((P, ie) => (
                      <li key={ie}>
                        <b>{P.what}</b>
                        {' — '}
                        {P.why}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {_.questions.length > 0 && (
                <div>
                  <p className="font-bold">
                    {s('Answer these to sharpen the plan', 'Rejani aniqlashtirish uchun shularga javob bering')}
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-[14px]">
                    {_.questions.map((P, ie) => (
                      <li key={ie}>{P}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-[12px] text-faint">
                {s(
                  'AI suggestions: check any organisation or programme yourself before relying on it. No activity guarantees admission.',
                  'SI takliflari: har qanday tashkilot yoki dasturga tayanishdan oldin uni o‘zingiz tekshiring. Hech bir faoliyat qabulni kafolatlamaydi.',
                )}
              </p>
            </Card>
          )}
          <Card className="grid gap-3 p-4">
            <p className="flex items-center gap-2 text-[16px] font-extrabold">
              <Compass size={17} />
              {s('Is my activity worth it? — honest review', 'Faoliyatim arziydimi? — halol baho')}
            </p>
            <Field
              label={s(
                'Describe one activity you have done or plan to do (what, how long, your role, any result)',
                'Qilgan yoki rejalashtirgan bitta faoliyatingizni tasvirlang (nima, qancha vaqt, rolingiz, natija)',
              )}
              htmlFor="co-a"
            >
              <Textarea id="co-a" className="min-h-[90px]" value={T} onChange={(P) => ae(P.target.value)} />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              {oe === 'review' ? (
                <>
                  <Fi label={s('Reviewing…', 'Baholanmoqda…')} />
                  <Button
                    size="sm"
                    icon={<Square size={13} />}
                    onClick={() => {
                      var P;
                      return (P = Ri.current) == null ? void 0 : P.abort();
                    }}
                  >
                    {s('Stop', 'To‘xtatish')}
                  </Button>
                </>
              ) : (
                <Button icon={<Sparkles size={16} />} disabled={!u.live || !T.trim()} onClick={Xo}>
                  {s('Review it', 'Baholash')}
                </Button>
              )}
            </div>
            {vt && Bn === 'review' && oe === '' && (
              <p className="text-[13px] font-semibold text-bad" role="alert">
                {vt}
              </p>
            )}
            {B && (
              <div className="grid gap-3 text-[14px]">
                <p className="flex flex-wrap items-center gap-2">
                  <Badge tone={B.strength === 'strong' ? 'ok' : B.strength === 'moderate' ? 'warn' : 'bad'}>
                    {B.strength === 'strong'
                      ? s('Strong signal', 'Kuchli belgi')
                      : B.strength === 'moderate'
                        ? s('Moderate signal', 'O‘rtacha belgi')
                        : s('Weak signal', 'Zaif belgi')}
                  </Badge>
                  {B.verdict}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {B.shows.length > 0 && (
                    <div>
                      <p className="font-bold text-ok">{s('What it shows', 'Nimani ko‘rsatadi')}</p>
                      <ul className="mt-1 list-disc pl-5">
                        {B.shows.map((P, ie) => (
                          <li key={ie}>{P}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {B.doubts.length > 0 && (
                    <div>
                      <p className="font-bold text-bad">{s('What a reader doubts', 'O‘quvchi nimaga shubha qiladi')}</p>
                      <ul className="mt-1 list-disc pl-5">
                        {B.doubts.map((P, ie) => (
                          <li key={ie}>{P}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {B.stronger.length > 0 && (
                  <div>
                    <p className="font-bold">{s('Make it stronger', 'Uni kuchaytiring')}</p>
                    <ol className="mt-1 list-decimal pl-5">
                      {B.stronger.map((P, ie) => (
                        <li key={ie}>{P}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {B.ladder.length === 3 && (
                  <div className="grid gap-2 md:grid-cols-3">
                    {B.ladder.map((P, ie) => (
                      <div
                        className={classNames(
                          'rounded-lg border p-2.5',
                          ie === 2 ? 'border-ok/40 bg-ok-soft/40' : 'border-line',
                        )}
                        key={ie}
                      >
                        <p className="text-[11.5px] font-bold uppercase text-faint">
                          {[s('Basic', 'Oddiy'), s('Strong', 'Kuchli'), s('Outstanding', 'Ajoyib')][ie]}
                        </p>
                        <p className="mt-0.5 text-[13px]">{P}</p>
                      </div>
                    ))}
                  </div>
                )}
                {B.cvLine && <p className="rounded-md bg-sunken px-3 py-2 font-mono text-[12.5px]">{B.cvLine}</p>}
                {B.questions.length > 0 && (
                  <div>
                    <p className="font-bold">{s('To judge it fully', 'To‘liq baholash uchun')}</p>
                    <ul className="mt-1 list-disc pl-5">
                      {B.questions.map((P, ie) => (
                        <li key={ie}>{P}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
export const eq = (e, a) => $e(e, a);
export const Gt = (e) => (e.kind === 'program' ? `${e.university} — ${e.program.en}` : e.name);
export const Cl = {
  eligible: {
    en: 'appears to match the published criteria we hold',
    uz: 'bizdagi e’lon qilingan mezonlarga mos ko‘rinadi',
  },
  verify: {
    en: 'may match, but some requirements need checking',
    uz: 'mos bo‘lishi mumkin, lekin ayrim talablarni tekshirish kerak',
  },
  missing: {
    en: 'cannot be assessed until you add missing profile details',
    uz: 'profilingizdagi yetishmayotgan ma’lumotlar kiritilmaguncha baholab bo‘lmaydi',
  },
  not_eligible: {
    en: 'does not appear to match at least one published requirement',
    uz: 'kamida bitta e’lon qilingan talabga mos kelmaydi',
  },
};
export function Oh(e) {
  const a = e.toLowerCase(),
    t = [
      [/hungar|vengr|stipendium/, 'stipendium-hungaricum'],
      [/t[üu]rk|burs/, 'turkiye-burslari'],
      [/korea|koreya|gks/, 'gks-undergraduate'],
      [/el-?yurt|umidi|eyuf/, 'el-yurt-umidi'],
      [/daad|epos/, 'daad-epos'],
      [/erasmus/, 'erasmus-mundus'],
      [/\btum\b|munich|myunxen/, 'tum-masters'],
      [/\bapu\b|asia pacific/, 'apu-my--bachelor'],
      [/malaysia international|\bmis\b/, 'malaysia-mis'],
    ];
  for (const [n, s] of t) if (n.test(a)) return he(s);
  return ii.find((n) => a.includes((n.kind === 'program' ? n.university : n.name).toLowerCase().split(' ')[0]));
}
