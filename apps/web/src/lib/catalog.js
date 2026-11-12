import { Oj, Rj, Ug } from './core';
import { Kb, yh } from '../data/raw';

const Lg = new Set([...Ug, 'EU', 'UZ', 'INT']);
const Pg = new Set(['hwum-accounting-finance', 'hwum-msc-ibm', 'hwum-foundation-award']);
export const Yo = [...yh.filter((e) => Lg.has(e.country) && !Pg.has(e.id)), ...Oj(yh)];
export const Pu = [...Kb.filter((e) => Lg.has(e.country) && !Pg.has(e.id)), ...Rj()];
export const ii = [...Yo, ...Pu];
const Hj = new Map(ii.map((e) => [e.id, e]));
export const he = (e) => Hj.get(e);
export const we = {
  MY: {
    en: 'Malaysia',
    uz: 'Malayziya',
  },
  DE: {
    en: 'Germany',
    uz: 'Germaniya',
  },
  HU: {
    en: 'Hungary',
    uz: 'Vengriya',
  },
  TR: {
    en: 'Türkiye',
    uz: 'Turkiya',
  },
  KR: {
    en: 'South Korea',
    uz: 'Janubiy Koreya',
  },
  JP: {
    en: 'Japan',
    uz: 'Yaponiya',
  },
  GB: {
    en: 'United Kingdom',
    uz: 'Buyuk Britaniya',
  },
  EU: {
    en: 'Several EU countries',
    uz: 'Bir nechta YI davlatlari',
  },
  UZ: {
    en: 'Uzbekistan (study abroad)',
    uz: 'O‘zbekiston (xorijda o‘qish)',
  },
  SG: {
    en: 'Singapore',
    uz: 'Singapur',
  },
  BN: {
    en: 'Brunei',
    uz: 'Bruney',
  },
  ID: {
    en: 'Indonesia',
    uz: 'Indoneziya',
  },
  TH: {
    en: 'Thailand',
    uz: 'Tailand',
  },
  CN: {
    en: 'China',
    uz: 'Xitoy',
  },
  HK: {
    en: 'Hong Kong',
    uz: 'Gonkong',
  },
  NL: {
    en: 'Netherlands',
    uz: 'Niderlandiya',
  },
  FI: {
    en: 'Finland',
    uz: 'Finlyandiya',
  },
  SE: {
    en: 'Sweden',
    uz: 'Shvetsiya',
  },
  NO: {
    en: 'Norway',
    uz: 'Norvegiya',
  },
  DK: {
    en: 'Denmark',
    uz: 'Daniya',
  },
  PL: {
    en: 'Poland',
    uz: 'Polsha',
  },
  CZ: {
    en: 'Czechia',
    uz: 'Chexiya',
  },
  AT: {
    en: 'Austria',
    uz: 'Avstriya',
  },
  CH: {
    en: 'Switzerland',
    uz: 'Shveytsariya',
  },
  FR: {
    en: 'France',
    uz: 'Fransiya',
  },
  IT: {
    en: 'Italy',
    uz: 'Italiya',
  },
  ES: {
    en: 'Spain',
    uz: 'Ispaniya',
  },
  PT: {
    en: 'Portugal',
    uz: 'Portugaliya',
  },
  US: {
    en: 'United States',
    uz: 'AQSh',
  },
  CA: {
    en: 'Canada',
    uz: 'Kanada',
  },
  AU: {
    en: 'Australia',
    uz: 'Avstraliya',
  },
  NZ: {
    en: 'New Zealand',
    uz: 'Yangi Zelandiya',
  },
  AE: {
    en: 'United Arab Emirates',
    uz: 'BAA',
  },
  QA: {
    en: 'Qatar',
    uz: 'Qatar',
  },
  SA: {
    en: 'Saudi Arabia',
    uz: 'Saudiya Arabistoni',
  },
  INT: {
    en: 'Several countries',
    uz: 'Bir nechta davlat',
  },
};
export const ms = [...new Set(Yo.map((e) => e.country))].sort((e, a) => we[e].en.localeCompare(we[a].en));
export const xe = {
  business: {
    en: 'Business & Finance',
    uz: 'Biznes va moliya',
  },
  computing: {
    en: 'Computing & IT',
    uz: 'Informatika va IT',
  },
  engineering: {
    en: 'Engineering',
    uz: 'Muhandislik',
  },
  economics: {
    en: 'Economics',
    uz: 'Iqtisodiyot',
  },
  medicine: {
    en: 'Medicine & Health',
    uz: 'Tibbiyot va sog‘liq',
  },
  natural: {
    en: 'Natural Sciences',
    uz: 'Tabiiy fanlar',
  },
  social: {
    en: 'Social Sciences',
    uz: 'Ijtimoiy fanlar',
  },
  humanities: {
    en: 'Humanities & Languages',
    uz: 'Gumanitar fanlar va tillar',
  },
  education: {
    en: 'Education',
    uz: 'Pedagogika',
  },
  arts: {
    en: 'Arts & Design',
    uz: 'San’at va dizayn',
  },
  law: {
    en: 'Law',
    uz: 'Huquq',
  },
  agriculture: {
    en: 'Agriculture',
    uz: 'Qishloq xo‘jaligi',
  },
};
export const Kd = {
  USD: 1,
  UZS: 1 / 12700,
  EUR: 1.1,
  MYR: 0.23,
  TRY: 0.024,
  HUF: 0.0028,
  KRW: 73e-5,
  JPY: 0.0067,
  GBP: 1.3,
  SGD: 0.75,
  BND: 0.75,
  IDR: 62e-6,
  THB: 0.029,
  CNY: 0.14,
  HKD: 0.128,
  SEK: 0.095,
  NOK: 0.093,
  DKK: 0.147,
  PLN: 0.26,
  CZK: 0.044,
  CHF: 1.15,
  CAD: 0.73,
  AUD: 0.66,
  NZD: 0.6,
  AED: 0.272,
  QAR: 0.275,
  SAR: 0.267,
};
export const Ls = {
  MY: 7e3,
  DE: 11500,
  HU: 7500,
  TR: 6e3,
  KR: 9500,
  JP: 11e3,
  GB: 16e3,
};
export const Ps = {
  transcript: {
    en: 'Academic transcript',
    uz: 'Transkript (baholar varaqasi)',
  },
  diploma: {
    en: 'Diploma or certificate',
    uz: 'Diplom yoki attestat',
  },
  language: {
    en: 'Language certificate',
    uz: 'Til sertifikati',
  },
  passport: {
    en: 'Passport',
    uz: 'Pasport',
  },
  recommendation: {
    en: 'Recommendation letters',
    uz: 'Tavsiyanomalar',
  },
  cv: {
    en: 'Academic CV',
    uz: 'Akademik CV (rezyume)',
  },
  statement: {
    en: 'Personal statement / essay',
    uz: 'Motivatsion xat / insho',
  },
  financial: {
    en: 'Financial documents',
    uz: 'Moliyaviy hujjatlar',
  },
  nomination: {
    en: 'Nomination by sending authority',
    uz: 'Yuboruvchi organ tavsiyanomasi',
  },
  work_proof: {
    en: 'Proof of work experience',
    uz: 'Ish tajribasini tasdiqlovchi hujjat',
  },
  research_plan: {
    en: 'Research plan',
    uz: 'Tadqiqot rejasi',
  },
  medical: {
    en: 'Medical certificate',
    uz: 'Tibbiy ma’lumotnoma',
  },
  photo: {
    en: 'Passport photo',
    uz: 'Pasport fotosurati',
  },
};
const wl = {
  citizenship: 'Uzbekistan',
  residence: 'Uzbekistan',
  currentEducation: 'school',
  targetLevel: 'bachelor',
  field: 'business',
  applicationYear: 2027,
  intake: 'September 2027',
  qualification: '',
  institution: '',
  scale: 'percent',
  achievements: '',
  major: '',
  otherLanguage: '',
  planningExam: !1,
  currency: 'USD',
  needsFullFunding: !1,
  partialOk: !0,
  feesAffordable: 'some',
  canShowFunds: 'unsure',
  preferredCountries: [],
  avoidCountries: [],
  instructionPref: 'English',
  sectorPref: 'any',
  durationPref: 'any',
  orientationPref: 'any',
  characteristics: '',
  experiences: {},
};
export const Fg = [
  {
    key: 'A',
    label: {
      en: 'Dilnoza · ambitious school student',
      uz: 'Dilnoza · intiluvchan maktab o‘quvchisi',
    },
    blurb: {
      en: 'Lyceum student, 92% average, IELTS 7.0. Wants a bachelor’s in computing and needs full funding.',
      uz: 'Litsey o‘quvchisi, o‘rtacha 92%, IELTS 7.0. Informatika bakalavriatini xohlaydi, to‘liq moliyalashtirish kerak.',
    },
    profile: {
      ...wl,
      name: 'Dilnoza (demo)',
      currentEducation: 'lyceum_college',
      field: 'computing',
      birthYear: 2009,
      qualification: 'Academic lyceum certificate (expected 2027)',
      institution: 'Sample Academic Lyceum, Tashkent',
      score: 92,
      scale: 'percent',
      graduationYear: 2027,
      achievements: 'Regional informatics olympiad, 2nd place (2025)',
      major: 'Computer Science',
      ielts: 7,
      ieltsParts: {
        l: 7.5,
        r: 7,
        w: 6.5,
        s: 6.5,
      },
      sat: void 0,
      tuitionBudget: 1e3,
      totalBudget: 2500,
      needsFullFunding: !0,
      partialOk: !1,
      feesAffordable: 'some',
      canShowFunds: 'no',
      preferredCountries: ['HU', 'TR', 'KR', 'MY'],
      avoidCountries: [],
      orientationPref: 'any',
      experiences: {
        leadership: 'Lead the lyceum robotics club (12 members). Organised two mini-hackathons in 2025.',
        volunteering: 'Teach basic coding to younger students on Saturdays at a local library (since 2024).',
        competitions: 'Regional informatics olympiad, 2nd place (2025).',
      },
      completedAt: '2026-10-20',
    },
    plans: [
      {
        oppId: 'stipendium-hungaricum',
        stage: 'preparing',
        priority: 'high',
        doneKeys: ['read_official', 'doc.passport', 'doc.language.have'],
      },
      {
        oppId: 'demo-danube-cs',
        stage: 'researching',
        priority: 'medium',
        doneKeys: ['read_official'],
      },
    ],
    saved: ['turkiye-burslari', 'gks-undergraduate', 'demo-need-grant', 'demo-hanriver-mech'],
  },
  {
    key: 'B',
    label: {
      en: 'Jasur · budget-conscious applicant',
      uz: 'Jasur · byudjetini hisoblaydigan nomzod',
    },
    blurb: {
      en: 'School graduate, 4.1 on the 5-point scale, IELTS 6.0. Exploring affordable business degrees.',
      uz: 'Maktab bitiruvchisi, 5 ballik tizimda 4.1, IELTS 6.0. Arzonroq biznes yo‘nalishlarini qidiryapti.',
    },
    profile: {
      ...wl,
      name: 'Jasur (demo)',
      currentEducation: 'school',
      field: 'business',
      birthYear: 2008,
      qualification: 'School leaving certificate (2026)',
      institution: 'Sample School No. 12, Samarkand',
      score: 4.1,
      scale: 'five_point_uz',
      graduationYear: 2026,
      major: 'Business and Finance',
      ielts: 6,
      ieltsParts: {
        l: 6.5,
        r: 6,
        w: 5.5,
        s: 6,
      },
      tuitionBudget: 4e3,
      totalBudget: 9e3,
      needsFullFunding: !1,
      partialOk: !0,
      feesAffordable: 'some',
      canShowFunds: 'partly',
      preferredCountries: ['MY', 'TR', 'HU'],
      avoidCountries: ['GB'],
      orientationPref: 'employment',
      experiences: {
        employment: 'Part-time sales assistant at a family electronics shop (2025–2026).',
        teamwork: 'School debate team member.',
      },
      completedAt: '2026-10-18',
    },
    plans: [
      {
        oppId: 'demo-anatolia-econ',
        stage: 'researching',
        priority: 'high',
        doneKeys: ['read_official'],
      },
      {
        oppId: 'apu-my--bachelor',
        stage: 'interested',
        priority: 'medium',
        doneKeys: [],
      },
    ],
    saved: ['demo-need-grant', 'turkiye-burslari', 'demo-lakeside-cs'],
  },
  {
    key: 'C',
    label: {
      en: 'Malika · competitive master’s applicant',
      uz: 'Malika · kuchli magistratura nomzodi',
    },
    blurb: {
      en: 'Economics graduate (GPA 3.7/4), IELTS 7.5, three years’ work. Targeting merit scholarships for a master’s.',
      uz: 'Iqtisodiyot bitiruvchisi (GPA 3.7/4), IELTS 7.5, uch yillik ish tajribasi. Magistratura uchun merit grantlarini nishonga olgan.',
    },
    profile: {
      ...wl,
      name: 'Malika (demo)',
      currentEducation: 'bachelor_grad',
      targetLevel: 'master',
      field: 'business',
      birthYear: 2001,
      qualification: 'BSc Economics (2023)',
      institution: 'Sample University of Economics, Tashkent',
      score: 3.7,
      scale: 'gpa4',
      graduationYear: 2023,
      major: 'Finance',
      achievements: 'Graduated with honours',
      ielts: 7.5,
      ieltsParts: {
        l: 8,
        r: 7.5,
        w: 7,
        s: 7,
      },
      tuitionBudget: 8e3,
      totalBudget: 18e3,
      needsFullFunding: !1,
      partialOk: !0,
      feesAffordable: 'yes',
      canShowFunds: 'partly',
      preferredCountries: ['GB', 'DE', 'JP'],
      orientationPref: 'employment',
      workYears: 3,
      experiences: {
        employment:
          'Credit analyst at a commercial bank since 2023. Built a monthly SME loan-risk report used by the branch.',
        projects: 'Independent research on microfinance access for women entrepreneurs in the Fergana Valley.',
        volunteering: 'Financial literacy workshops for students (2022–2024).',
      },
      completedAt: '2026-10-10',
    },
    plans: [
      {
        oppId: 'demo-merit-award',
        stage: 'started',
        priority: 'high',
        doneKeys: [
          'read_official',
          'doc.transcript',
          'doc.diploma',
          'doc.language.have',
          'doc.passport',
          'essay.draft',
          'translation',
        ],
      },
      {
        oppId: 'demo-northbridge-finance',
        stage: 'preparing',
        priority: 'medium',
        doneKeys: ['read_official', 'doc.transcript'],
      },
      {
        oppId: 'daad-epos',
        stage: 'interested',
        priority: 'low',
        doneKeys: [],
      },
    ],
    saved: ['gks-graduate', 'erasmus-mundus', 'tum-masters'],
    draftFor: 'demo-merit-award',
    draft: `Since I was a child I have been passionate about finance. I am a hardworking and dedicated person and a good leader.

After graduating in economics I joined a commercial bank as a credit analyst. I built a monthly report on small business loan risk that our branch now uses in credit committee meetings. This work showed me that many small firms are rejected because lenders have very little reliable data about them, and I want to understand how better data could change this.

I also did research on microfinance access for women entrepreneurs in the Fergana Valley. I interviewed 14 business owners and learned that the main barrier was not interest rates but the documents that banks ask for.

I believe this scholarship is a perfect fit for me and I will work very hard to make the world a better place.`,
  },
];
export const Ba = {
  bachelor: {
    en: 'bachelor’s',
    uz: 'bakalavriat',
  },
  master: {
    en: 'master’s',
    uz: 'magistratura',
  },
  phd: {
    en: 'PhD',
    uz: 'PhD',
  },
};
export const zh = (e) => e.charAt(0).toUpperCase() + e.slice(1);
export const Kj = {
  percent: {
    en: 'percentage',
    uz: 'foiz',
  },
  gpa4: {
    en: 'GPA out of 4',
    uz: '4 ballik GPA',
  },
  gpa5: {
    en: 'GPA out of 5',
    uz: '5 ballik GPA',
  },
  five_point_uz: {
    en: 'Uzbek 5-point scale',
    uz: 'O‘zbekiston 5 ballik tizimi',
  },
  other: {
    en: 'another scale',
    uz: 'boshqa tizim',
  },
};
