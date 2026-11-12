import { Cu, Eg, Zb, gj, qg } from '../i18n/ru-dictionary';
import { Wb, Yb } from '../data/raw';

function Ag(e, a) {
  const t = qg.get(e);
  if (t != null) return t;
  const n = Cu.get(e);
  if (n != null && n !== e) return n;
  if (a > 2) return null;
  for (const s of gj) {
    const r = s.re.exec(e);
    if (r) {
      const o = {};
      s.order.forEach((l, c) => {
        const p = r[c + 1];
        o[l] = p && /[A-Za-z]{3}/.test(p) ? (Ag(p, a + 1) ?? p) : p;
      });
      const u = s.ru.replace(/\{(\d+)\}/g, (l, c) => o[Number(c)] ?? '');
      return (Cu.set(e, u), u);
    }
  }
  return null;
}
export function Bi(e) {
  if (!e) return e ?? '';
  const a = Ag(e, 0);
  return a ?? (/[A-Za-z]{3}/.test(e) && Eg.add(e), Cu.set(e, e), e);
}
typeof window < 'u' && (window.__ruMissing = Eg);
export const Tg = ['selective', 'middle', 'accessible'];
export const jn = {
  selective: {
    name: {
      en: 'Highly selective',
      uz: 'Kuchli tanlov',
    },
    who: {
      en: 'For strong profiles: top grades and test scores, solid activities. Many strong applicants compete for few places.',
      uz: 'Kuchli profil uchun: yuqori baholar va test ballari, mazmunli faoliyat. Kam o‘ringa ko‘p kuchli abituriyent raqobat qiladi.',
    },
  },
  middle: {
    name: {
      en: 'Balanced',
      uz: 'O‘rta',
    },
    who: {
      en: 'Good, ranked universities with moderate published requirements — a realistic target for a solid profile.',
      uz: 'O‘rtacha talablarga ega yaxshi reytingli universitetlar — mustahkam profil uchun real maqsad.',
    },
  },
  accessible: {
    name: {
      en: 'More accessible',
      uz: 'Qulayroq',
    },
    who: {
      en: 'Lower published requirements and/or lower costs. Good for studying abroad on a budget — but meeting a minimum is still not a guarantee.',
      uz: 'E’lon qilingan talablar va/yoki narx pastroq. Kam budjet bilan chet elda o‘qish uchun yaxshi — lekin minimumga yetish baribir kafolat emas.',
    },
  },
};
const Oo = Zb;
export const fh = Oo.checked;
export const dt = Oo.universities;
export const ct = Oo.grants;
export const yj = Oo.selection;
export const Ro = ['MY', 'HU', 'DE', 'TR', 'KR'];
export const Mn = (e) => dt.find((a) => a.id === e);
export const Mu = (e) => dt.filter((a) => a.country === e).sort((a, t) => a.order - t.order);
const Ng = () => new Date().toISOString().slice(0, 10);
export const ta = {
  MY: {
    name: {
      en: 'Malaysia',
      uz: 'Malayziya',
    },
    tagline: {
      en: 'English-taught degrees, public and private universities',
      uz: 'Ingliz tilidagi dasturlar, davlat va xususiy universitetlar',
    },
  },
  HU: {
    name: {
      en: 'Hungary',
      uz: 'Vengriya',
    },
    tagline: {
      en: 'English-taught programmes and Stipendium Hungaricum',
      uz: 'Ingliz tilidagi dasturlar va Stipendium Hungaricum',
    },
  },
  DE: {
    name: {
      en: 'Germany',
      uz: 'Germaniya',
    },
    tagline: {
      en: 'Low or no tuition at many public universities — but not everywhere',
      uz: 'Ko‘p davlat universitetlarida kontrakt past yoki yo‘q — lekin hamma joyda emas',
    },
  },
  TR: {
    name: {
      en: 'Türkiye',
      uz: 'Turkiya',
    },
    tagline: {
      en: 'Türkiye Bursları and English- or Turkish-taught programmes',
      uz: 'Türkiye Bursları va ingliz yoki turk tilidagi dasturlar',
    },
  },
  KR: {
    name: {
      en: 'South Korea',
      uz: 'Janubiy Koreya',
    },
    tagline: {
      en: 'GKS scholarships, Korean- and English-taught tracks',
      uz: 'GKS grantlari, koreys va ingliz tilidagi yo‘llar',
    },
  },
};
export const Cg = {
  MY: {
    bachelor: {
      en: 'You need a recognised school-leaving certificate or an equivalent pre-university qualification, transcripts and subjects that fit the programme. Official general guidelines usually mention 12 years of schooling, so direct entry with Uzbekistan’s 11-year certificate is not automatic: equivalence, a foundation year or another extra step must be checked with the university. For English-taught programmes, preparing for around IELTS Academic 5.5–6.5 is a useful target, but medicine, law, languages and other programmes differ.',
      uz: 'Tan olinadigan maktab attestati yoki unga teng pre-university malaka, baholar ilovasi va yo‘nalishga mos fanlar kerak. Rasmiy umumiy yo‘riqnomalarda odatda 12 yillik ta’lim ko‘rsatiladi, shuning uchun O‘zbekistonning 11 yillik attestati bilan to‘g‘ridan-to‘g‘ri kirish avtomatik emas: ekvivalentlik, foundation yoki boshqa qo‘shimcha ta’lim yo‘li universitetda tekshirilishi kerak. Inglizcha dasturlar uchun IELTS Academic 5.5–6.5 atrofi foydali tayyorgarlik mo‘ljali, lekin tibbiyot, huquq, til va boshqa dasturlarda talab farq qiladi.',
    },
    master: {
      en: 'A recognised bachelor’s degree, transcripts and suitable academic background. GPA thresholds depend on the university and study mode; 2.75–3.00/4.00 and IELTS 6.0–6.5 are common, but some programmes admit lower GPAs with work experience or extra assessment. Coursework, mixed-mode and research master’s differ: research programmes check your research plan and fit with a supervisor.',
      uz: 'Tan olinadigan bakalavr diplomi, transkript va dasturga mos akademik tayyorgarlik. GPA chegarasi universitet va o‘qish turiga bog‘liq; 2.75–3.00/4.00 va IELTS 6.0–6.5 ko‘p uchraydi, lekin ayrim dasturlar pastroq GPA’ni ish tajribasi yoki qo‘shimcha baholash bilan qabul qiladi. Coursework, mixed mode va research magistraturasi farq qiladi: research dasturlarida tadqiqot rejasi va ilmiy rahbar bilan moslik tekshiriladi.',
    },
    notes: [
      {
        en: 'INTI International University (Nilai) is not the same as the other INTI colleges.',
        uz: 'INTI International University (Nilai) boshqa INTI kollejlari bilan bir xil emas.',
      },
    ],
    sources: [
      'https://educationmalaysia.gov.my/Get-In-Touch/FAQ',
      'https://sps.utm.my/general-entry-requirements/',
      'https://uitm.edu.my/en/others/faq',
    ],
  },
  HU: {
    bachelor: {
      en: 'A recognised secondary school diploma, transcript, English translations, passport and proof of the language of instruction. English-taught programmes usually expect B2; around IELTS 5.5–6.5 is a general target. Depending on the programme: motivation letter, online interview, or an entrance exam in maths or other subjects. Medicine may test biology, chemistry and English separately.',
      uz: 'Tan olinadigan o‘rta ta’lim diplomi, baholar ilovasi, inglizcha tarjimalar, pasport va ta’lim tilini bilish isboti. Inglizcha dasturlar odatda B2 kutadi; IELTS 5.5–6.5 atrofi umumiy mo‘ljal. Dasturga qarab: motivatsion xat, onlayn suhbat, matematika yoki boshqa fandan kirish imtihoni. Tibbiyotda biologiya, kimyo va ingliz tilidan alohida sinov bo‘lishi mumkin.',
    },
    master: {
      en: 'Bachelor’s diploma, transcript, and matching courses and credits matter. Some programmes ask graduates of other fields for extra credits. Prepare B2–C1 language, motivation, CV and interview; certificate and reference requirements depend on the programme. IELTS 6.0–6.5 is a useful planning target, but some programmes ask 7.0 or test language in the admission exam. There is no single national GPA minimum.',
      uz: 'Bakalavr diplomi, transkript, o‘tilgan fanlar va kreditlarning mosligi muhim. Ayrim dasturlar boshqa yo‘nalish bitiruvchilaridan qo‘shimcha kredit talab qiladi. B2–C1 til, motivatsiya, CV va suhbatga tayyorlaning; sertifikat va tavsiyanoma talabi dasturga bog‘liq. IELTS 6.0–6.5 rejalashtirish uchun foydali mo‘ljal, lekin ayrim dasturlar 7.0 so‘raydi yoki tilni qabul imtihonida baholaydi. Butun mamlakat uchun yagona GPA minimumi yo‘q.',
    },
    notes: [
      {
        en: 'Semmelweis General Medicine is a one-tier (integrated) programme straight after school — not a 3-year bachelor’s or a 2-year master’s.',
        uz: 'Semmelweis General Medicine — maktabdan keyingi uzluksiz (bir bosqichli) dastur; u oddiy 3 yillik bakalavr ham, 2 yillik magistratura ham emas.',
      },
      {
        en: 'Central European University (CEU) is not included only because of its historical link with Budapest: its degree programmes moved to Vienna, Austria (2019–2020). Check the current campus and country of any programme yourself.',
        uz: 'Central European University (CEU) faqat Budapest bilan tarixiy bog‘liqligi sabab ro‘yxatga qo‘shilmagan: uning daraja dasturlari Avstriyaning Vena shahriga ko‘chgan (2019–2020). Har qanday dasturning amaldagi kampusi va davlatini o‘zingiz tekshiring.',
      },
    ],
    sources: [
      'https://www.studyinhungary.hu/study-in-hungary/menu/studying-in-hungary/entry-and-admission-requirements.html',
      'https://semmelweis.hu/admission/process/entrance-exam-medicine-dentistry-and-pharmaceutical-sciences/',
    ],
  },
  DE: {
    bachelor: {
      en: 'The first question is whether your certificate gives a university entrance qualification (HZB). Depending on the certificate, years of schooling and earlier university study, you may enter directly or need the Studienkolleg and Feststellungsprüfung. Check your own case on uni-assist/anabin. Many bachelor’s programmes are taught in German (B2–C1, e.g. TestDaF TDN 4 or DSH-2 in some programmes — not the same everywhere). Some programmes have quotas, grade-based selection, portfolios or aptitude tests.',
      uz: 'Birinchi savol — attestatingiz universitetga kirish huquqini (HZB) beradimi. Attestat turi, o‘qish yillari va oldingi universitet ta’limiga qarab to‘g‘ridan-to‘g‘ri kirish yoki Studienkolleg va Feststellungsprüfung kerak bo‘lishi mumkin. O‘z holatingizni uni-assist/anabin orqali tekshiring. Ko‘p bakalavr dasturlari nemis tilida (B2–C1; ayrim dasturlarda TestDaF TDN 4 yoki DSH-2 — hamma joyda bir xil emas). Ayrim yo‘nalishlarda kvota, baholar bo‘yicha tanlov, portfolio yoki qobiliyat sinovi bor.',
    },
    master: {
      en: 'A related bachelor’s degree, transcript, course descriptions and matching credits are crucial — a high GPA alone may not be enough (e.g. set credits in economics, maths, statistics or programming). Many programmes check for a 180 or 210 ECTS degree. For English-taught master’s, around IELTS 6.5–7.0 is a preparation target. CV, motivation, references, GRE/GMAT or interview are required only where the programme says so.',
      uz: 'Tegishli bakalavr diplomi, transkript, fanlar tavsifi va kreditlar mosligi juda muhim — faqat yuqori GPA yetarli bo‘lmasligi mumkin (masalan, iqtisodiyot, matematika, statistika yoki dasturlashdan aniq kreditlar). Ko‘p dasturlar 180 yoki 210 ECTSga mos darajani tekshiradi. Inglizcha magistratura uchun IELTS 6.5–7.0 atrofi tayyorgarlik mo‘ljali. CV, motivatsiya, tavsiyanoma, GRE/GMAT yoki suhbat faqat dastur talab qilsa majburiy.',
    },
    notes: [
      {
        en: 'In German grading a smaller number can mean a better result — do not convert a foreign GPA with a simple percentage.',
        uz: 'Nemis baholash tizimida kichikroq son yaxshiroq natijani bildirishi mumkin — xorijiy GPA’ni oddiy foiz bilan almashtirmang.',
      },
      {
        en: 'uni-assist is not one portal for all universities: some use it for document checks or a VPD, and the application itself goes to the university portal.',
        uz: 'uni-assist barcha universitetlar uchun yagona portal emas: ayrimlari undan hujjat tekshiruvi yoki VPD uchun foydalanadi, ariza esa universitet portaliga topshiriladi.',
      },
      {
        en: 'Not every German university is free: TUM charges many non-EU/EEA students tuition, and Baden-Württemberg (Heidelberg, KIT, Tübingen, Freiburg) charges non-EU students.',
        uz: 'Germaniyadagi hamma universitet bepul emas: TUM ko‘plab non-EU/EEA talabalardan kontrakt oladi, Baden-Vyurtemberg (Heidelberg, KIT, Tübingen, Freiburg) ham non-EU talabalardan to‘lov oladi.',
      },
      {
        en: 'uni-assist: translations of Uzbek documents must be attested by an Uzbek notary (see the uni-assist country page).',
        uz: 'uni-assist: o‘zbekcha hujjatlar tarjimasi O‘zbekiston notariusi tomonidan tasdiqlanishi kerak (uni-assist davlat sahifasiga qarang).',
      },
    ],
    sources: [
      'https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/uz/',
      'https://www.daad.de/en/studying-in-germany/requirements/overview/',
      'https://www.tum.de/en/studies/fees/tuition',
    ],
  },
  TR: {
    bachelor: {
      en: 'School certificate, all school grades, passport and a diploma or exam result the university accepts. Which of TR-YÖS, SAT, A-Level, IB or a national diploma is accepted depends on the university — not every university asks for SAT, and TR-YÖS does not open every door. English-taught programmes use the university’s own proficiency exam or accepted international tests; Turkish-taught programmes need an accepted Turkish certificate. A preparatory year exists where needed. Check whether the equivalence (denklik) document is needed at application or at registration.',
      uz: 'Attestat, barcha maktab baholari, pasport va universitet qabul qiladigan diplom yoki imtihon natijasi kerak. TR-YÖS, SAT, A-Level, IB yoki milliy diplomdan qaysi biri qabul qilinishi universitetga bog‘liq — hamma universitet SAT so‘ramaydi, TR-YÖS bilan istalgan joyga kirib bo‘lmaydi. Inglizcha dasturlarda universitetning o‘z imtihoni yoki qabul qilinadigan xalqaro test; turkcha dasturlarda qabul qilinadigan turk tili sertifikati kerak. Kerak bo‘lsa tayyorlov yili bor. Denklik hujjati ariza paytida yoki ro‘yxatdan o‘tishda kerakligini tekshiring.',
    },
    master: {
      en: 'A recognised bachelor’s diploma, transcript, matching field, CV, motivation and references if the programme asks. Thesis and non-thesis master’s differ. ALES, GRE or GMAT, exemptions for international applicants and interviews are set per university/faculty. Check which TOEFL, PTE or university exam an English-taught programme accepts — do not assume IELTS is accepted. There is no single national GPA minimum; aiming for 3.0/4.0 or higher can strengthen an application but is not an official rule.',
      uz: 'Tan olinadigan bakalavr diplomi, transkript, mos mutaxassislik, CV, motivatsiya va dastur so‘rasa tavsiyanoma. Tezisli va tezissiz magistratura farq qiladi. ALES, GRE yoki GMAT talabi, xorijliklar uchun istisnolar va suhbat universitet/fakultet bo‘yicha belgilanadi. Inglizcha dastur qaysi TOEFL, PTE yoki universitet imtihonini qabul qilishini tekshiring — IELTS’ni avtomatik mos deb hisoblamang. Yagona milliy GPA minimumi yo‘q; 3.0/4.0 va undan yuqoriga intilish arizani kuchaytirishi mumkin, lekin rasmiy shart emas.',
    },
    notes: [
      {
        en: 'Istanbul University and Istanbul University-Cerrahpaşa are separate universities.',
        uz: 'Istanbul University va Istanbul University-Cerrahpaşa — alohida universitetlar.',
      },
      {
        en: 'METU and Sabancı (and METU master’s) do not accept IELTS for the purposes stated on their pages.',
        uz: 'METU va Sabancı (hamda METU magistraturasi) o‘z sahifalarida ko‘rsatilgan maqsadlar uchun IELTS’ni qabul qilmaydi.',
      },
    ],
    sources: [
      'https://iso.metu.edu.tr/en/5-step-application-undergraduate-programs-metu-international-student',
      'https://derece.ankara.edu.tr/en/quacquarelli-symonds-qs-rankings/',
    ],
  },
  KR: {
    bachelor: {
      en: 'Completed recognised schooling, certificate, transcript, proof of the language of instruction, and a personal statement or study plan. Many international tracks ask for documents on the citizenship of the applicant and parents and the family relationship; the exact rule depends on the track. Take apostille/consular rules from the guide. For Korean-taught programmes TOPIK 3–4 can be a starting point for some tracks, but it may be higher. For English-taught programmes, around IELTS 6.0–6.5 is a general target. A recommended score is not a minimum; SAT/AP/IB are not required everywhere.',
      uz: 'Tan olinadigan tugallangan maktab ta’limi, attestat, transkript, ta’lim tili bo‘yicha hujjat, shaxsiy bayonot yoki study plan kerak. Ko‘p xalqaro yo‘llarda abituriyent va ota-onasining fuqaroligi hamda qarindoshlikni tasdiqlovchi hujjatlar so‘raladi; aniq mezon yo‘lga bog‘liq. Apostil yoki konsullik tasdig‘i qoidasini qo‘llanmadan oling. Koreyscha dasturlarda TOPIK 3–4 ayrim yo‘llar uchun boshlang‘ich mezon bo‘lishi mumkin, lekin yuqoriroq ham bo‘lishi mumkin. Inglizcha dasturlar uchun IELTS 6.0–6.5 atrofi umumiy mo‘ljal. Tavsiya qilingan ball — minimal ball emas; SAT/AP/IB hamma joyda majburiy emas.',
    },
    master: {
      en: 'Bachelor’s diploma, transcript, CV, study plan or research proposal, references the programme requires, and language proof. In research-based STEM programmes fit with a lab and supervisor matters, but prior supervisor approval is not required everywhere. Language requirements differ for Korean- and English-taught programmes; IELTS 6.0–6.5 or higher is useful preparation, but take the exact condition from the source.',
      uz: 'Bakalavr diplomi, transkript, CV, study plan yoki research proposal, dastur talab qilgan tavsiyanomalar va til isboti. Tadqiqotga asoslangan STEM dasturlarida laboratoriya va ilmiy rahbar bilan moslik muhim, lekin oldindan rahbar roziligi hamma joyda majburiy emas. Til talabi koreyscha va inglizcha dasturga qarab farq qiladi; IELTS 6.0–6.5 yoki undan yuqori tayyorgarlik foydali, lekin aniq shartni manbadan oling.',
    },
    notes: [
      {
        en: 'Hanyang Seoul and Hanyang ERICA (Ansan) have separate admission routes.',
        uz: 'Hanyang Seoul va Hanyang ERICA (Ansan) qabul yo‘llari alohida.',
      },
      {
        en: 'The latest admission guide always takes priority over a FAQ page.',
        uz: 'Eng so‘nggi qabul qo‘llanmasi har doim FAQ sahifasidan ustun turadi.',
      },
    ],
    sources: [
      'https://studyinkorea.go.kr/en/plan/examAndKoreanStudy.do',
      'https://en.snu.ac.kr/admission/overview/faq/admission',
    ],
  },
};
export const fj = {
  required: {
    en: 'Required',
    uz: 'Majburiy',
  },
  depends: {
    en: 'Depends on programme',
    uz: 'Dasturga bog‘liq',
  },
  optional: {
    en: 'Optional',
    uz: 'Ixtiyoriy',
  },
};
const ye = (e, a, t) => [
  {
    en: e,
    uz: a,
  },
  t,
];
const vh = ye(
  'Passport (valid for the whole application period)',
  'Pasport (ariza davri davomida amal qiladigan)',
  'required',
);
const vj = ye('Passport-style photo', 'Pasport uchun rasm', 'depends');
export function bj(e, a) {
  if (a === 'bachelor') {
    const n = [
      vh,
      ye(
        'School-leaving certificate (attestat) and grade transcript',
        'Maktab attestati va baholar ilovasi (transkript)',
        'required',
      ),
      ye(
        'Certified translations of documents not in English/the local language',
        'Ingliz/mahalliy tilda bo‘lmagan hujjatlarning tasdiqlangan tarjimalari',
        'required',
      ),
      ye(
        'Language certificate (IELTS/TOEFL, German, Turkish or TOPIK)',
        'Til sertifikati (IELTS/TOEFL, nemis, turk yoki TOPIK)',
        'depends',
      ),
      ye('Motivation letter / personal statement', 'Motivatsion xat / shaxsiy bayonot', 'depends'),
      vj,
    ];
    return (
      e === 'DE' &&
        n.push(
          ye(
            'Proof of university entrance qualification (HZB) — via uni-assist/VPD where the university uses it',
            'Universitetga kirish huquqi (HZB) isboti — universitet foydalansa uni-assist/VPD orqali',
            'depends',
          ),
          ye(
            'Studienkolleg / Feststellungsprüfung result if direct entry is not possible',
            'To‘g‘ridan-to‘g‘ri kirish bo‘lmasa, Studienkolleg / Feststellungsprüfung natijasi',
            'depends',
          ),
        ),
      e === 'TR' &&
        n.push(
          ye(
            'Accepted exam or diploma result (TR-YÖS, SAT, A-Level, IB or the university’s own exam)',
            'Qabul qilinadigan imtihon yoki diplom natijasi (TR-YÖS, SAT, A-Level, IB yoki universitetning o‘z imtihoni)',
            'depends',
          ),
          ye('Equivalence certificate (denklik)', 'Ekvivalentlik guvohnomasi (denklik)', 'depends'),
        ),
      e === 'KR' &&
        n.push(
          ye(
            'Documents on the citizenship of you and your parents and the family relationship',
            'Siz va ota-onangiz fuqaroligi hamda qarindoshlikni tasdiqlovchi hujjatlar',
            'depends',
          ),
          ye(
            'Apostille or consular legalisation of school documents',
            'Maktab hujjatlariga apostil yoki konsullik tasdig‘i',
            'depends',
          ),
          ye('Proof of funds (bank statement)', 'Moliyaviy imkoniyat isboti (bank ko‘chirmasi)', 'depends'),
        ),
      e === 'MY' &&
        n.push(
          ye(
            'Proof of equivalence, foundation or pre-university study if 12 years of schooling are required',
            '12 yillik ta’lim talab qilinsa, ekvivalentlik, foundation yoki pre-university ta’lim isboti',
            'depends',
          ),
        ),
      e === 'HU' &&
        n.push(ye('Entrance exam or interview (online)', 'Kirish imtihoni yoki suhbat (onlayn)', 'depends')),
      n.push(
        ye('Recommendation letter', 'Tavsiyanoma', 'optional'),
        ye('Portfolio or certificates of achievements', 'Portfolio yoki yutuqlar sertifikatlari', 'optional'),
      ),
      n
    );
  }
  const t = [
    vh,
    ye(
      'Bachelor’s diploma (or expected-graduation letter) and transcript',
      'Bakalavr diplomi (yoki bitirish haqida ma’lumotnoma) va transkript',
      'required',
    ),
    ye(
      'Certified translations of documents not in English/the local language',
      'Ingliz/mahalliy tilda bo‘lmagan hujjatlarning tasdiqlangan tarjimalari',
      'required',
    ),
    ye('Language certificate', 'Til sertifikati', 'depends'),
    ye('CV', 'CV (rezyume)', 'depends'),
    ye('Statement of purpose / motivation letter', 'Maqsad bayoni (SOP) / motivatsion xat', 'depends'),
    ye('Recommendation letters', 'Tavsiyanomalar', 'depends'),
    ye('Research proposal (research-based programmes)', 'Tadqiqot rejasi (tadqiqotga asoslangan dasturlar)', 'depends'),
  ];
  return (
    e === 'DE' &&
      t.push(
        ye(
          'Course descriptions / module handbook to check credits (ECTS)',
          'Kreditlarni (ECTS) tekshirish uchun fanlar tavsifi / modul qo‘llanmasi',
          'depends',
        ),
        ye(
          'VPD from uni-assist (where the university asks for it)',
          'uni-assist’dan VPD (universitet so‘rasa)',
          'depends',
        ),
      ),
    e === 'TR' &&
      t.push(
        ye('ALES, GRE or GMAT score', 'ALES, GRE yoki GMAT natijasi', 'depends'),
        ye(
          'YÖK recognition / equivalence of a foreign degree',
          'Chet el diplomining YÖK tan olish / ekvivalentlik hujjati',
          'depends',
        ),
      ),
    e === 'KR' &&
      t.push(
        ye(
          'Apostille or consular legalisation of diploma and transcript',
          'Diplom va transkriptga apostil yoki konsullik tasdig‘i',
          'depends',
        ),
        ye(
          'Documents on the citizenship of you and your parents',
          'Siz va ota-onangiz fuqaroligi bo‘yicha hujjatlar',
          'depends',
        ),
      ),
    e === 'MY' &&
      t.push(
        ye(
          'Proof of work experience (when the GPA is below the standard minimum)',
          'Ish tajribasi isboti (GPA standart minimumdan past bo‘lsa)',
          'depends',
        ),
      ),
    e === 'HU' && t.push(ye('Entrance exam or interview (online)', 'Kirish imtihoni yoki suhbat (onlayn)', 'depends')),
    t.push(ye('Portfolio or writing sample', 'Portfolio yoki yozma ish namunasi', 'optional')),
    t
  );
}
export function Mg(e, a) {
  const t = a === 'bachelor',
    n = [
      {
        en: `Pick a specific ${t ? 'bachelor’s' : 'master’s'} programme on the official site and read its own entry page (requirements differ between faculties).`,
        uz: `Rasmiy saytda aniq ${t ? 'bakalavr' : 'magistratura'} dasturini tanlang va uning o‘z qabul sahifasini o‘qing (fakultetlar talabi farq qiladi).`,
      },
    ];
  return (
    e === 'DE'
      ? n.push(
          t
            ? {
                en: 'Check whether your certificate gives direct entry (uni-assist/anabin) or whether you need the Studienkolleg first.',
                uz: 'Attestatingiz to‘g‘ridan-to‘g‘ri kirish huquqini beradimi (uni-assist/anabin) yoki avval Studienkolleg kerakmi, tekshiring.',
              }
            : {
                en: 'Compare your bachelor’s credits (ECTS) and modules with the programme’s requirements; find out whether a VPD from uni-assist is needed.',
                uz: 'Bakalavr kreditlaringiz (ECTS) va fanlaringizni dastur talabi bilan solishtiring; uni-assist’dan VPD kerakmi, aniqlang.',
              },
        )
      : e === 'MY' && t
        ? n.push({
            en: 'Ask the university whether your 11-year certificate is accepted directly or whether you need a foundation/pre-university year.',
            uz: 'Universitetdan 11 yillik attestatingiz to‘g‘ridan-to‘g‘ri qabul qilinadimi yoki foundation/pre-university yili kerakmi, so‘rang.',
          })
        : e === 'TR' && t
          ? n.push({
              en: 'Find out which exam or diploma result the university accepts (TR-YÖS, SAT, own exam…) and register for it in time.',
              uz: 'Universitet qaysi imtihon yoki diplom natijasini qabul qilishini (TR-YÖS, SAT, o‘z imtihoni…) aniqlang va o‘z vaqtida ro‘yxatdan o‘ting.',
            })
          : e === 'KR'
            ? n.push({
                en: 'Download the latest admission guide for your track and check the citizenship rule, documents and apostille requirements.',
                uz: 'O‘z yo‘lingiz uchun eng so‘nggi qabul qo‘llanmasini yuklab oling va fuqarolik qoidasi, hujjatlar va apostil talabini tekshiring.',
              })
            : n.push({
                en: 'Check the academic and language requirements for applicants with documents from Uzbekistan.',
                uz: 'O‘zbekiston hujjatlari bilan topshiruvchilar uchun akademik va til talablarini tekshiring.',
              }),
    n.push(
      {
        en: 'Take the language test or exam the programme accepts (check which tests are accepted, not just the score).',
        uz: 'Dastur qabul qiladigan til testi yoki imtihonini topshiring (faqat ballni emas, qaysi test qabul qilinishini ham tekshiring).',
      },
      {
        en:
          'Prepare the documents and certified translations; write the motivation letter' +
          (t ? '.' : ', CV and (if needed) research proposal; ask referees early.'),
        uz:
          'Hujjatlar va tasdiqlangan tarjimalarni tayyorlang; motivatsion xat yozing' +
          (t ? '.' : ', CV va (kerak bo‘lsa) tadqiqot rejasini tayyorlang; tavsiya beruvchilardan oldindan so‘rang.'),
      },
      {
        en: 'Submit the application and pay the fee on the official portal before the deadline (note the time zone).',
        uz: 'Arizani rasmiy portalda muddatdan oldin topshiring va to‘lovni amalga oshiring (vaqt zonasiga e’tibor bering).',
      },
      {
        en: 'Apply for grants separately — they have their own deadlines and conditions.',
        uz: 'Grantlarga alohida topshiring — ularning o‘z muddati va shartlari bor.',
      },
      {
        en: 'After the result: read the offer conditions, then arrange funding, visa and housing through official sources.',
        uz: 'Natijadan keyin: taklif (offer) shartlarini o‘qing, so‘ng moliyalashtirish, viza va turar joyni rasmiy manbalar orqali hal qiling.',
      },
    ),
    n
  );
}
const kj = new Set([
  'universiti-malaya-my',
  'usm-my',
  'ukm-my',
  'upm-my',
  'utm-my',
  'uum-my',
  'uitm-my',
  'umpsa-my',
  'utp-my',
  'uniten-my',
]);
export function an(e, a) {
  return e.id === 'mis' ? (kj.has(a.id) ? 'confirmed' : 'not_listed') : 'check';
}
export const Us = (e, a) => ct.filter((t) => t.country === e && t.levels.includes(a));
export const Bs = (e) => e.open === 'yes' || e.open === 'integrated';
export function Go(e) {
  var t;
  const a = new Set(
    e.languages.filter((n) => ['English', 'German', 'Turkish', 'Korean', 'Hungarian', 'Malay'].includes(n)),
  );
  for (const n of Object.values(e.levels)) {
    const s = `${((t = n.language) == null ? void 0 : t.en) ?? ''}`;
    (/IELTS|TOEFL|English|PTE|MUET/i.test(s) && a.add('English'),
      /DSH|TestDaF|German|Goethe|telc/i.test(s) && a.add('German'),
      /TOPIK|Korean/i.test(s) && a.add('Korean'),
      /Turkish|TÖMER/i.test(s) && a.add('Turkish'));
  }
  return [...a];
}
export const Hd = (e) => (e.deadline && e.deadline.date >= Ng() ? e.deadline : null);
export const xj = (e) => (e.deadline && e.deadline.date < Ng() ? e.deadline : null);
export const wj = (e) => !!e.tuition;
export const Iu = (e, a) =>
  e.scholarships.some((t) => t.international_eligible !== !1 && (!t.levels.length || t.levels.includes(a)));
const jj = {
  'middle-east-technical-university-tr': 'metu odtu odtü',
  'iyte-tr': 'iztech izmir institute of technology',
  'istanbul-technical-university-tr': 'itu',
  'tum-de': 'tu munich',
  'lmu-munich-de': 'lmu munchen münchen ludwig maximilian',
  'fu-berlin-de': 'fu freie',
  'hu-berlin-de': 'hu humboldt',
  'kit-de': 'karlsruhe',
  'rwth-aachen-de': 'rwth',
  'fau-de': 'fau erlangen nurnberg nürnberg',
  'seoul-national-university-kr': 'snu',
  'kaist-kr': 'kaist',
  'postech-kr': 'postech',
  'skku-kr': 'skku sungkyunkwan',
  'ludovika-nke-hu': 'nke ludovika',
  'bme-hu': 'bme budapest technology',
  'mate-hu': 'mate',
  'universiti-malaya-my': 'um malaya',
  'umpsa-my': 'umpsa ump pahang',
};
const bh = (e) =>
  e
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[’'`.()/,-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
export function Sj(e, a) {
  const t = bh(a);
  if (!t) return !0;
  const n = bh(
    `${e.name} ${e.short} ${e.city} ${e.id} ${jj[e.id] ?? ''} ${ta[e.country].name.en} ${ta[e.country].name.uz}`,
  );
  return t.split(' ').every((s) => n.includes(s));
}
export const zj = {
  year: {
    en: 'per year',
    uz: 'yiliga',
  },
  semester: {
    en: 'per semester',
    uz: 'semestriga',
  },
  total: {
    en: 'whole programme',
    uz: 'butun dastur uchun',
  },
};
export const kh = (e) => e.toLocaleString('en-US').replace(/,/g, ' ');
export const qj = [
  {
    term: 'Foundation',
    def: {
      en: 'A one-year preparatory programme before a bachelor’s degree. It is often needed when your school certificate is not equivalent to the country’s entry level (e.g. 11 vs 12 years).',
      uz: 'Bakalavrdan oldingi bir yillik tayyorlov dasturi. Maktab attestatingiz davlatning kirish darajasiga teng bo‘lmasa (masalan, 11 va 12 yil) ko‘pincha kerak bo‘ladi.',
    },
  },
  {
    term: 'Studienkolleg',
    def: {
      en: 'A German preparatory college for international applicants whose certificate does not give direct entry. It ends with the Feststellungsprüfung (assessment exam).',
      uz: 'Attestati to‘g‘ridan-to‘g‘ri kirish huquqini bermaydigan xorijiy abituriyentlar uchun Germaniyadagi tayyorlov kolleji. U Feststellungsprüfung (baholash imtihoni) bilan tugaydi.',
    },
  },
  {
    term: 'GPA',
    def: {
      en: 'Grade point average — the average of your grades, often on a 4.0 scale. Scales differ by country, so a GPA is not simply converted into a percentage.',
      uz: 'Baholarning o‘rtacha ko‘rsatkichi, ko‘pincha 4.0 shkalada. Shkalalar davlatga qarab farq qiladi, shuning uchun GPA oddiy foizga almashtirilmaydi.',
    },
  },
  {
    term: 'ECTS',
    def: {
      en: 'The European credit system. One academic year is usually 60 ECTS; a bachelor’s is often 180 or 240 ECTS.',
      uz: 'Yevropa kredit tizimi. Bir o‘quv yili odatda 60 ECTS; bakalavr ko‘pincha 180 yoki 240 ECTS.',
    },
  },
  {
    term: 'SOP / motivation letter',
    def: {
      en: 'A letter explaining why you chose the programme, what prepared you for it and what you plan to do. Write it yourself, specifically for each programme.',
      uz: 'Nega shu dasturni tanlaganingiz, sizni unga nima tayyorlagani va nima qilmoqchi ekaningizni tushuntiruvchi xat. Uni o‘zingiz, har bir dastur uchun alohida yozing.',
    },
  },
  {
    term: 'Research proposal',
    def: {
      en: 'A short plan for research: the question, why it matters, the method and a timeline. Usually needed for research master’s and PhD programmes.',
      uz: 'Tadqiqotning qisqa rejasi: savol, ahamiyati, usul va vaqt jadvali. Odatda research magistratura va PhD dasturlari uchun kerak.',
    },
  },
  {
    term: 'Conditional offer',
    def: {
      en: 'An offer that becomes final only when you meet stated conditions — for example, sending a language certificate or your final diploma by a date.',
      uz: 'Ko‘rsatilgan shartlarni bajarganingizdagina yakuniy bo‘ladigan taklif — masalan, til sertifikati yoki yakuniy diplomni belgilangan sanagacha yuborish.',
    },
  },
  {
    term: 'Tuition waiver',
    def: {
      en: 'A full or partial reduction of tuition. It does not pay your living costs — rent, food and insurance still need funding.',
      uz: 'Kontrakt to‘lovining to‘liq yoki qisman kamaytirilishi. U yashash xarajatlarini to‘lamaydi — ijara, oziq-ovqat va sug‘urta uchun baribir mablag‘ kerak.',
    },
  },
  {
    term: 'One-tier master',
    def: {
      en: 'An integrated programme that runs straight from school to a master’s-level degree without a separate bachelor’s (e.g. General Medicine at Semmelweis).',
      uz: 'Maktabdan keyin alohida bakalavrsiz to‘g‘ridan-to‘g‘ri magistr darajasigacha davom etadigan uzluksiz dastur (masalan, Semmelweis’dagi General Medicine).',
    },
  },
];
export function Ej(e) {
  const a = e === 'bachelor',
    t = (n, s, r) => ({
      id: `${e}-${n}`,
      text: {
        en: s,
        uz: r,
      },
    });
  return [
    {
      id: '12',
      when: {
        en: '9–12 months before',
        uz: '9–12 oy oldin',
      },
      items: [
        t(
          'a',
          'Choose countries, subjects and the language of instruction',
          'Davlat, yo‘nalish va ta’lim tilini tanlang',
        ),
        t(
          'b',
          a
            ? 'Check whether your school certificate is accepted (equivalence, foundation, Studienkolleg)'
            : 'Check that your bachelor’s degree and credits match the programmes',
          a
            ? 'Attestatingiz qabul qilinishini tekshiring (ekvivalentlik, foundation, Studienkolleg)'
            : 'Bakalavr diplomingiz va kreditlaringiz dasturlarga mosligini tekshiring',
        ),
        t(
          'c',
          'Estimate a rough budget: tuition, living costs, insurance, travel',
          'Taxminiy budjetni hisoblang: kontrakt, yashash, sug‘urta, yo‘l',
        ),
      ],
    },
    {
      id: '9',
      when: {
        en: '6–9 months before',
        uz: '6–9 oy oldin',
      },
      items: [
        t(
          'd',
          'Prepare for the language test or academic exam the programmes accept',
          'Dasturlar qabul qiladigan til testi yoki akademik imtihonga tayyorlaning',
        ),
        t(
          'e',
          'Shortlist programmes and note each official deadline and time zone',
          'Dasturlarni saralang va har birining rasmiy muddati va vaqt zonasini yozib qo‘ying',
        ),
        t('f', 'Check grant calls and their own deadlines', 'Grant tanlovlari va ularning o‘z muddatlarini tekshiring'),
      ],
    },
    {
      id: '6',
      when: {
        en: '3–6 months before',
        uz: '3–6 oy oldin',
      },
      items: [
        t('g', 'Get transcripts and certified translations', 'Transkript va tasdiqlangan tarjimalarni oling'),
        t(
          'h',
          a ? 'Ask teachers for recommendation letters if needed' : 'Ask referees for recommendation letters',
          a ? 'Kerak bo‘lsa o‘qituvchilardan tavsiyanoma so‘rang' : 'Tavsiya beruvchilardan tavsiyanoma so‘rang',
        ),
        t(
          'i',
          a ? 'Draft your motivation letter' : 'Draft your motivation letter / SOP and research proposal',
          a ? 'Motivatsion xat qoralamasini yozing' : 'Motivatsion xat / SOP va tadqiqot rejasi qoralamasini yozing',
        ),
      ],
    },
    {
      id: '0',
      when: {
        en: 'Before the deadline',
        uz: 'Deadline’dan oldin',
      },
      items: [
        t(
          'j',
          'Check every form field, uploaded document and reference submission',
          'Har bir ariza maydoni, yuklangan hujjat va tavsiyanoma yuborilganini tekshiring',
        ),
        t('k', 'Pay the application fee and keep the receipt', 'Ariza to‘lovini to‘lang va kvitansiyani saqlang'),
        t(
          'l',
          'Submit university and grant applications on their own portals',
          'Universitet va grant arizalarini o‘z portallarida yuboring',
        ),
      ],
    },
    {
      id: 'after',
      when: {
        en: 'After the result',
        uz: 'Natijadan keyin',
      },
      items: [
        t(
          'm',
          'Read the offer conditions and deadlines for accepting it',
          'Taklif (offer) shartlari va uni qabul qilish muddatini o‘qing',
        ),
        t(
          'n',
          'Confirm funding and any documents the university still needs',
          'Moliyalashtirish va universitet hali so‘rayotgan hujjatlarni tasdiqlang',
        ),
        t(
          'o',
          'Arrange the visa and housing through official sources',
          'Viza va turar joyni rasmiy manbalar orqali hal qiling',
        ),
      ],
    },
  ];
}
const xh = {
  '5-step application guide': '5 bosqichli ariza qo‘llanmasi',
  'Application FAQs': 'Ariza bo‘yicha savollar (FAQ)',
  'Bachelor’s: international entrance qualification': 'Bakalavr: xorijiy kirish malakasi',
  'General Medicine admission': 'General Medicine qabuli',
  'Guide to applying for a master’s': 'Magistraturaga ariza qo‘llanmasi',
  'Information for international applicants': 'Xalqaro abituriyentlar uchun ma’lumot',
  'International graduate admissions': 'Xalqaro magistratura qabuli',
  'International undergraduate admissions': 'Xalqaro bakalavr qabuli',
  'Master’s application step by step': 'Magistraturaga ariza bosqichma-bosqich',
  'Master’s programmes with admission restrictions': 'Qabul cheklangan magistratura dasturlari',
  'Master’s: international applicants': 'Magistratura: xalqaro abituriyentlar',
  'Undergraduate admission': 'Bakalavr qabuli',
};
const Aj = [
  [/ and other campuses/g, ' va boshqa kampuslar'],
  [/ and /g, ' va '],
  [/Winter semester/g, 'qishki semestr'],
  [/Summer semester/g, 'yozgi semestr'],
  [/Fall/g, 'kuz'],
  [/Spring/g, 'bahor'],
  [/September/g, 'sentabr'],
  [/February/g, 'fevral'],
  [/March/g, 'mart'],
  [/October/g, 'oktabr'],
  [/Medicine/g, 'Tibbiyot'],
  [/\(Regular\)/g, '(asosiy)'],
  [/\(1st placement\)/g, '(1-joylashtirish)'],
  [/\(2nd intake\)/g, '(2-qabul)'],
];
const Tj = [
  [/ and other campuses/g, ' и другие кампусы'],
  [/ and /g, ' и '],
  [/Winter semester/g, 'зимний семестр'],
  [/Summer semester/g, 'летний семестр'],
  [/Fall/g, 'осень'],
  [/Spring/g, 'весна'],
  [/September/g, 'сентябрь'],
  [/February/g, 'февраль'],
  [/March/g, 'март'],
  [/October/g, 'октябрь'],
  [/Medicine/g, 'Медицина'],
  [/\(Regular\)/g, '(основной)'],
  [/\(1st placement\)/g, '(1-е распределение)'],
  [/\(2nd intake\)/g, '(2-й набор)'],
];
export function Li(e, a) {
  if (!e) return '';
  if (a === 'ru') {
    const n = Bi(e);
    if (n !== e) return n;
    const s = /^until (.+)$/.exec(e);
    return s ? `до ${s[1]}` : Tj.reduce((r, [o, u]) => r.replace(o, u), e);
  }
  if (a !== 'uz') return e;
  if (xh[e]) return xh[e];
  const t = /^until (.+)$/.exec(e);
  return t ? `${t[1]} gacha` : Aj.reduce((n, [s, r]) => n.replace(s, r), e);
}
export const $e = (e, a) => (e ? (a === 'ru' ? e.ru || Bi(e.en) : e[a] || e.en) : '');
export const Ig = (e) => (e === 'uz' ? 'Uzbek (Latin script)' : e === 'ru' ? 'Russian' : 'English');
export const la = (e, a, t) => (e === 'uz' ? t : e === 'ru' ? Bi(a) : a);
export function useToday(e = new Date()) {
  const a = e.getFullYear(),
    t = String(e.getMonth() + 1).padStart(2, '0'),
    n = String(e.getDate()).padStart(2, '0');
  return `${a}-${t}-${n}`;
}
const Uu = (e) => {
  const [a, t, n] = e.slice(0, 10).split('-').map(Number);
  return Date.UTC(a, t - 1, n);
};
export const ai = (e, a) => Math.round((Uu(a) - Uu(e)) / 864e5);
export function Nj(e, a) {
  return new Date(Uu(e) + a * 864e5).toISOString().slice(0, 10);
}
const Bu = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
];
const Cj = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];
const Mj = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];
const Ij = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function me(e, a) {
  if (!e) return '—';
  const [t, n, s] = e.slice(0, 10).split('-').map(Number);
  return a === 'ru' ? `${s} ${Cj[n - 1]} ${t} г.` : a === 'uz' ? `${s}-${Bu[n - 1]}, ${t}` : `${s} ${Ij[n - 1]} ${t}`;
}
export const Uj = (e, a) =>
  a === 'ru'
    ? Mj[e]
    : a === 'uz'
      ? Bu[e][0].toUpperCase() + Bu[e].slice(1)
      : [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ][e];
export function Ie(e, a = 0) {
  return e
    .toLocaleString('en-US', {
      maximumFractionDigits: a,
      minimumFractionDigits: 0,
    })
    .replace(/,/g, ' ');
}
const Bj = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};
export function Lj(e, a, t = 0) {
  const n = Bj[a],
    s = Ie(e, t);
  return a === 'MYR' ? `RM ${s}` : n ? `${n}${s}` : `${s} ${a}`;
}
export const Ho = (e, a, t) => e * (t[a] ?? 1);
export const ci = (e, a, t) => e / (t[a] ?? 1);
export function Ai(e, a, t) {
  const n = Ho(e.amount, e.currency, t);
  return e.per === 'semester' ? n * 2 : e.per === 'total' ? n / Math.max(1, a) : n;
}
export const He = () => Math.random().toString(36).slice(2, 10);
export function Ko(e) {
  const a = e.trim().match(/[\p{L}\p{N}’'‘-]+/gu);
  return a ? a.length : 0;
}
export const Ug = ['MY', 'TR', 'DE', 'HU', 'KR'];
const Bg = (e) => Ug.includes(e);
export const Wa = Yb.filter((e) => Bg(e.country));
export const ho = Wb.filter((e) => Bg(e.country_of_study));
const Pj = [
  'USD',
  'UZS',
  'EUR',
  'MYR',
  'TRY',
  'HUF',
  'KRW',
  'JPY',
  'GBP',
  'SGD',
  'BND',
  'IDR',
  'THB',
  'CNY',
  'HKD',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'CZK',
  'CHF',
  'CAD',
  'AUD',
  'NZD',
  'AED',
  'QAR',
  'SAR',
];
const Fj = [
  'MY',
  'DE',
  'HU',
  'TR',
  'KR',
  'JP',
  'GB',
  'SG',
  'BN',
  'ID',
  'TH',
  'CN',
  'HK',
  'NL',
  'FI',
  'SE',
  'NO',
  'DK',
  'PL',
  'CZ',
  'AT',
  'CH',
  'FR',
  'IT',
  'ES',
  'PT',
  'US',
  'CA',
  'AU',
  'NZ',
  'AE',
  'QA',
  'SA',
];
const Lu = (e) => (Fj.includes(e) ? e : 'INT');
const Ze = (e) => ({
  en: e,
  uz: e,
});
const wh = () => new Date().toISOString().slice(0, 10);
const yr = {
  bachelor: {
    en: 'Undergraduate (bachelor’s) programmes',
    uz: 'Bakalavriat dasturlari',
  },
  master: {
    en: 'Postgraduate (master’s) programmes',
    uz: 'Magistratura dasturlari',
  },
  phd: {
    en: 'Doctoral (PhD) programmes',
    uz: 'Doktorantura (PhD) dasturlari',
  },
};
const Dj = {
  bachelor: 4,
  master: 2,
  phd: 4,
};
const jh = (e) => (e === 'full' ? 'full' : e ? 'partial' : 'unknown');
const Sh = (e, a) =>
  a === 'foundation'
    ? 'foundation'
    : a === 'government' || a === 'intergovernmental'
      ? 'government'
      : e === 'need_based'
        ? 'need'
        : e === 'fee_waiver'
          ? 'waiver'
          : e === 'assistantship'
            ? 'research'
            : 'merit';
export function Oj(e) {
  var n, s, r;
  const a = new Set(e.filter((o) => o.universityId).map((o) => `${o.universityId}|${o.level}`)),
    t = [];
  for (const o of dt)
    for (const u of ['bachelor', 'master']) {
      const l = o.levels[u];
      if (!Bs(l) || a.has(`${o.id}|${u}`)) continue;
      const c = l.tuition && Pj.includes(l.tuition.currency) ? l.tuition : null,
        p = Go(o),
        d = p.length === 1 ? p[0] : p.includes('English') ? 'English' : (p[0] ?? 'Unknown'),
        h = l.ieltsScope === 'general' && l.ielts != null ? l.ielts : void 0,
        m = Hd(l),
        y = [];
      (c ||
        y.push({
          en: 'Tuition for international students was not confirmed on an official page',
          uz: 'Xalqaro talabalar uchun o‘qish to‘lovi rasmiy sahifada tasdiqlanmadi',
        }),
        l.language ||
          y.push({
            en: 'Language requirement not confirmed — this does not mean no test is needed',
            uz: 'Til talabi tasdiqlanmagan — bu test kerak emas degani emas',
          }),
        l.ieltsScope === 'programme' &&
          y.push({
            en: 'English scores differ by programme',
            uz: 'Ingliz tili ballari dasturga qarab farq qiladi',
          }),
        m ||
          y.push({
            en: 'Next application deadline not confirmed',
            uz: 'Keyingi ariza muddati tasdiqlanmagan',
          }),
        y.push({
          en: 'Programme length and subject-specific entry rules vary — check each programme page',
          uz: 'Dastur davomiyligi va yo‘nalishga oid talablar farq qiladi — har bir dastur sahifasini tekshiring',
        }),
        l.note && y.push(l.note));
      const E = o.scholarships
          .map((v, g) => ({
            s: v,
            i: g,
          }))
          .filter(({ s: v }) => v.international_eligible !== !1 && (!v.levels.length || v.levels.includes(u)))
          .map(({ i: v }) => `${o.id}--sch-${v}`),
        C = l.deadline && !m ? l.deadline : null;
      t.push({
        id: `${o.id}--${u}`,
        kind: 'program',
        imported: !0,
        universityId: o.id,
        university: o.name,
        program: yr[u],
        country: Lu(o.country),
        city: o.city,
        level: u,
        subject: o.subjects[0] ?? 'business',
        subjects: o.subjects,
        sector: o.type ?? 'public',
        instruction: ['English', 'German', 'Turkish', 'Korean', 'Japanese', 'Hungarian'].includes(d)
          ? d
          : d === 'Unknown'
            ? 'Unknown'
            : 'Mixed',
        durationYears: Dj[u],
        durationVerified: !1,
        orientation: 'mixed',
        overview: {
          en: `${o.type === 'private' ? 'Private' : o.type === 'public' ? 'Public' : ''} university in ${o.city}. Information below covers ${yr[u].en.toLowerCase()} for international students in general; requirements differ by programme.`.trim(),
          uz: `${o.type === 'private' ? 'Xususiy' : o.type === 'public' ? 'Davlat' : ''} universiteti (${o.city}). Quyidagi ma’lumot xalqaro talabalar uchun umumiy ${yr[u].uz.toLowerCase()} haqida; talablar dasturga qarab farq qiladi.`.trim(),
          ru: `${o.type === 'private' ? 'Частный университет' : o.type === 'public' ? 'Государственный университет' : 'Университет'}, ${Bi(o.city)}. Ниже — общая информация для иностранных студентов (${$e(yr[u], 'ru').toLowerCase()}); требования зависят от программы.`,
        },
        tuition: c
          ? {
              amount: c.amount,
              currency: c.currency,
              per: c.per,
              verified: !0,
              note: {
                en: `${c.amount_max ? `From ${c.amount.toLocaleString('en-US')} to ${c.amount_max.toLocaleString('en-US')} ${c.currency}. ` : ''}${c.year ? `Academic year ${c.year}. ` : 'Academic year not stated. '}${((n = c.note) == null ? void 0 : n.en) ?? ''}`.trim(),
                uz: `${c.amount_max ? `${c.amount.toLocaleString('en-US')} dan ${c.amount_max.toLocaleString('en-US')} ${c.currency} gacha. ` : ''}${c.year ? `${c.year} o‘quv yili. ` : 'O‘quv yili ko‘rsatilmagan. '}${((s = c.note) == null ? void 0 : s.uz) ?? ''}`.trim(),
                ru: `${c.amount_max ? `От ${c.amount.toLocaleString('en-US')} до ${c.amount_max.toLocaleString('en-US')} ${c.currency}. ` : ''}${c.year ? `Учебный год ${String(c.year).replace(/^until /, 'до ')}. ` : 'Учебный год не указан. '}${Bi(((r = c.note) == null ? void 0 : r.en) ?? '')}`.trim(),
              },
            }
          : null,
        reqs: {
          minIELTS: h,
          ieltsVerified: h !== void 0,
          academic: l.academic ?? {
            en: 'Academic entry requirements vary by programme. Check the official admissions page for qualifications from Uzbekistan.',
            uz: 'Akademik talablar dasturga qarab farq qiladi. O‘zbekiston hujjatlari bo‘yicha rasmiy qabul sahifasini tekshiring.',
          },
          other: l.language,
        },
        fundingIds: E,
        fundingNote: E.length
          ? {
              en: `${E.length} university scholarship(s) recorded for international students.`,
              uz: `Xalqaro talabalar uchun ${E.length} ta universitet granti qayd etilgan.`,
            }
          : {
              en: 'No university scholarship for international students was recorded.',
              uz: 'Xalqaro talabalar uchun universitet granti qayd etilmagan.',
            },
        documents:
          u === 'master'
            ? ['passport', 'transcript', 'diploma', 'language', 'statement', 'cv']
            : ['passport', 'transcript', 'diploma', 'language', 'statement'],
        documentsVerified: !1,
        deadline: m
          ? {
              status: 'verified',
              date: m.date,
              intake: m.intake ?? void 0,
              note: m.note ?? void 0,
            }
          : {
              status: 'not_announced',
              note: C
                ? {
                    en: `Latest published deadline was ${C.date}${C.intake ? ` (${C.intake})` : ''}. The next one has not been confirmed.`,
                    uz: `Oxirgi e’lon qilingan muddat ${C.date}${C.intake ? ` (${C.intake})` : ''} edi. Keyingisi tasdiqlanmagan.`,
                  }
                : (l.intake ?? {
                    en: 'No dated deadline was found on the official pages.',
                    uz: 'Rasmiy sahifalarda sanali muddat topilmadi.',
                  }),
            },
        appFee: o.fee
          ? {
              status: 'amount',
              amount: `${o.fee.amount.toLocaleString('en-US')} ${o.fee.currency}`,
            }
          : {
              status: 'unknown',
            },
        procedure: Mg(o.country, u),
        websiteUrl: o.admissions ?? o.website,
        applyUrl: l.apply ?? o.apply ?? void 0,
        admissionsUrl: o.admissions ?? void 0,
        applyLinks: o.applyLinks
          .filter((v) => v.level === u || v.level === 'general')
          .map((v) => ({
            label: Ze(v.label),
            url: v.url,
          })),
        source: {
          source_url: l.sources[0] ?? o.admissions ?? o.website,
          source_name: `${o.name} — official website`,
          source_type: 'official',
          last_verified_at: o.lastChecked,
          verification_status: l.academic && l.language ? 'verified' : 'partial',
          applicable_academic_year: (c == null ? void 0 : c.year) ?? void 0,
          relevant_notes: {
            en: 'Each fact links to the official page it came from (see “Sources”).',
            uz: 'Har bir ma’lumot olingan rasmiy sahifaga bog‘langan (“Manbalar”ga qarang).',
          },
        },
        uncertainties: y,
        essay: {
          promptKnown: !1,
          aiPolicy: 'unknown',
        },
      });
    }
  return t;
}
const Qn = {
  yes: 'yes',
  partial: 'partial',
  no: 'no',
};
export function Rj() {
  const e = [];
  for (const a of dt)
    a.scholarships.forEach((t, n) => {
      if (t.international_eligible === !1) return;
      const s = t.type,
        r =
          s === 'full' || s === 'full_tuition'
            ? 'yes'
            : s === 'partial_tuition' || s === 'fee_waiver' || s === 'need_based'
              ? 'partial'
              : 'unknown';
      e.push({
        id: `${a.id}--sch-${n}`,
        kind: 'scholarship',
        imported: !0,
        universityId: a.id,
        name: t.name,
        provider: Ze(a.name),
        country: Lu(a.country),
        type: Sh(s),
        fundingType: s,
        levels: t.levels.length ? t.levels : ['bachelor', 'master'],
        subjects: 'all',
        citizenship: {
          uzbekistan: 'check',
          note: t.international_eligible
            ? {
                en: 'Open to international students per the university. Check nationality and programme rules.',
                uz: 'Universitetga ko‘ra xalqaro talabalar uchun ochiq. Fuqarolik va dastur qoidalarini tekshiring.',
              }
            : {
                en: 'Eligibility of international students is not stated. Check the official page.',
                uz: 'Xalqaro talabalar mos kelishi ko‘rsatilmagan. Rasmiy sahifani tekshiring.',
              },
        },
        summary: Ze(t.coverage ?? t.name),
        academic: {
          en: 'See the official scholarship page.',
          uz: 'Rasmiy grant sahifasiga qarang.',
        },
        languageReq: {
          en: 'As required by the programme.',
          uz: 'Dastur talabiga ko‘ra.',
        },
        criteria: {},
        fundingLabel: jh(s),
        coverage: {
          tuition: r,
          living: s === 'full' || s === 'stipend' ? 'yes' : 'unknown',
          accommodation: 'unknown',
          travel: 'unknown',
          insurance: 'unknown',
        },
        coverageDetail: Ze(t.coverage ?? 'Coverage not stated.'),
        notCovered: {
          en:
            s === 'full'
              ? 'Check the official terms for any costs not included.'
              : 'Anything not listed above may remain your responsibility.',
          uz:
            s === 'full'
              ? 'Kiritilmagan xarajatlar uchun rasmiy shartlarni tekshiring.'
              : 'Yuqorida ko‘rsatilmagan xarajatlar sizning zimmangizda qolishi mumkin.',
        },
        documents: ['transcript', 'language', 'statement'],
        documentsVerified: !1,
        deadline: t.deadline
          ? t.deadline >= wh()
            ? {
                status: 'verified',
                date: t.deadline,
              }
            : {
                status: 'closed',
                date: t.deadline,
                note: {
                  en: 'This date has passed. The next round is not confirmed.',
                  uz: 'Bu sana o‘tgan. Keyingi bosqich tasdiqlanmagan.',
                },
              }
          : {
              status: 'not_announced',
            },
        appFee: {
          status: 'unknown',
        },
        infoUrl: t.url,
        essay: {
          promptKnown: !1,
          aiPolicy: 'unknown',
        },
        interview: 'unknown',
        source: {
          source_url: t.url,
          source_name: `${a.name} — scholarships`,
          source_type: 'official',
          last_verified_at: a.lastChecked,
          verification_status: 'partial',
        },
        uncertainties: [
          {
            en: 'Eligibility for citizens of Uzbekistan must be confirmed on the official page',
            uz: 'O‘zbekiston fuqarolari mosligini rasmiy sahifada tasdiqlash kerak',
          },
        ],
      });
    });
  for (const a of ho) {
    const t = a.coverage,
      n = a.levels.filter((s) => s === 'bachelor' || s === 'master' || s === 'phd');
    e.push({
      id: a.id,
      kind: 'scholarship',
      imported: !0,
      name: a.name,
      provider: Ze(a.provider ?? a.name),
      country: Lu(a.country_of_study),
      type: Sh(a.funding_type, a.provider_type),
      fundingType: a.funding_type ?? void 0,
      levels: n.length ? n : ['master'],
      subjects: a.subjects,
      citizenship: {
        uzbekistan: a.uzbekistan_eligible === !0 ? 'yes' : a.uzbekistan_eligible === !1 ? 'no' : 'check',
        note: Ze(
          a.nationality_rule ??
            (a.uzbekistan_eligible === null ? 'Not confirmed whether citizens of Uzbekistan can apply.' : ''),
        ),
      },
      summary: Ze(a.coverage_text ?? a.name),
      academic: Ze(a.academic_rule ?? 'See the official call.'),
      languageReq: Ze(a.language_rule ?? 'See the official call.'),
      criteria:
        a.work_experience_rule && /\d/.test(a.work_experience_rule)
          ? {
              minWorkYears: Number((a.work_experience_rule.match(/(\d+)\s*(year|yr)/i) ?? [])[1]) || void 0,
              workFlexible: !0,
              workNote: Ze(a.work_experience_rule),
            }
          : {},
      fundingLabel: jh(a.funding_type),
      coverage: {
        tuition: Qn[t.tuition ?? ''] ?? 'unknown',
        living: Qn[t.stipend ?? ''] ?? 'unknown',
        accommodation: Qn[t.accommodation ?? ''] ?? 'unknown',
        travel: Qn[t.travel ?? ''] ?? 'unknown',
        insurance: Qn[t.insurance ?? ''] ?? 'unknown',
      },
      coverageDetail: Ze(a.coverage_text ?? 'Coverage not confirmed.'),
      notCovered: {
        en: 'Anything not listed above may remain your responsibility. Check the official terms.',
        uz: 'Yuqorida ko‘rsatilmagan xarajatlar sizning zimmangizda qolishi mumkin. Rasmiy shartlarni tekshiring.',
      },
      documents: ['passport', 'transcript', 'diploma', 'language', 'statement', 'recommendation'],
      documentsVerified: !1,
      opening: a.opening_date ? Ze(a.opening_date) : void 0,
      deadline: {
        status:
          a.deadline.status === 'open' && a.deadline.date
            ? a.deadline.date >= wh()
              ? 'verified'
              : 'closed'
            : a.deadline.status === 'open'
              ? 'unverified'
              : a.deadline.status,
        date: a.deadline.date ?? void 0,
        intake: a.deadline.cycle ?? void 0,
        note: a.deadline.note ? Ze(a.deadline.note) : void 0,
      },
      appFee: {
        status: 'unknown',
      },
      infoUrl: a.url,
      applyUrl: a.apply_url ?? void 0,
      essay: {
        promptKnown: !1,
        aiPolicy: 'unknown',
      },
      interview: 'unknown',
      source: {
        source_url: a.source_url,
        source_name: `${a.provider ?? a.name} — official page`,
        source_type: 'official',
        last_verified_at: a.last_checked ?? '2026-10-29',
        verification_status: a.verification === 'verified' ? 'verified' : 'partial',
        applicable_academic_year: a.deadline.cycle ?? void 0,
      },
      uncertainties: [
        ...(a.uzbekistan_eligible === null
          ? [
              {
                en: 'Eligibility of citizens of Uzbekistan not confirmed',
                uz: 'O‘zbekiston fuqarolari mosligi tasdiqlanmagan',
              },
            ]
          : []),
        ...(a.age_rule ? [Ze(`Age rule: ${a.age_rule}`)] : []),
        ...(a.renewal ? [Ze(`Renewal: ${a.renewal}`)] : []),
      ],
    });
  }
  return e;
}
export function Gj(e) {
  var s, r;
  const a = dt.find((o) => o.id === e);
  if (!a) return [];
  const t = [
    {
      label: {
        en: 'Official website',
        uz: 'Rasmiy sayt',
      },
      url: a.website,
    },
  ];
  (a.admissions &&
    t.push({
      label: {
        en: 'Admissions',
        uz: 'Qabul',
      },
      url: a.admissions,
    }),
    a.apply &&
      t.push({
        label: {
          en: 'Application portal',
          uz: 'Ariza portali',
        },
        url: a.apply,
      }));
  for (const o of ['bachelor', 'master']) {
    const u = a.levels[o],
      l =
        o === 'bachelor'
          ? {
              en: 'Bachelor’s',
              uz: 'Bakalavr',
            }
          : {
              en: 'Master’s',
              uz: 'Magistratura',
            };
    for (const c of u.sources)
      t.push({
        label: {
          en: `${l.en} — source`,
          uz: `${l.uz} — manba`,
        },
        url: c,
      });
    ((s = u.tuition) != null &&
      s.source &&
      t.push({
        label: {
          en: `${l.en} — tuition`,
          uz: `${l.uz} — kontrakt`,
        },
        url: u.tuition.source,
      }),
      u.example &&
        t.push({
          label: Ze(u.example.name),
          url: u.example.url,
        }));
  }
  (r = a.fee) != null &&
    r.source &&
    t.push({
      label: {
        en: 'Application fee',
        uz: 'Ariza to‘lovi',
      },
      url: a.fee.source,
    });
  for (const o of a.scholarships)
    t.push({
      label: Ze(o.name),
      url: o.url,
    });
  const n = new Set();
  return t.filter((o) => (n.has(o.url) ? !1 : (n.add(o.url), !0)));
}
