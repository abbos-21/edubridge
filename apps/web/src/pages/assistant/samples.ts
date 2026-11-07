/**
 * Fictional sample documents so a student can try the analysis without pasting their own text.
 * Written for EduBridge v2 (not recovered from the old build). They are deliberately imperfect.
 */
export type Sample = { id: string; kind: string; title: { en: string; uz: string }; text: string };

export const DOC_KINDS = ['cv', 'motivation', 'personal_statement', 'study_plan', 'scholarship_essay', 'recommendation', 'other'] as const;
export type DocKind = (typeof DOC_KINDS)[number];

export const SAMPLES: Sample[] = [
  {
    id: 'sample-cv',
    kind: 'cv',
    title: { en: 'Sample CV (fictional)', uz: 'Namuna CV (to‘qima)' },
    text: `Dilnoza Rahimova
Tashkent, Uzbekistan

EDUCATION
BSc in Economics, National University of Uzbekistan, 2021-2025. GPA 4.6/5.
School No. 12, Tashkent, 2010-2021.

EXPERIENCE
Intern, a commercial bank, summer 2024. Worked with the credit team.
Member of the university debate club, 2022-2024.
Volunteer at a local charity.

SKILLS
Excel, English, teamwork, hardworking, good communication.

LANGUAGES
Uzbek (native), Russian (fluent), English (IELTS 6.5).`,
  },
  {
    id: 'sample-motivation',
    kind: 'motivation',
    title: { en: 'Sample motivation letter (fictional)', uz: 'Namuna motivatsion xat (to‘qima)' },
    text: `Dear Admissions Committee,

I have always been passionate about economics and I am very excited to apply for the Master in Development Economics. I believe this programme is a perfect fit for me and will help me to achieve my dreams.

During my bachelor studies I learned a lot about economics. I also did an internship at a bank where I gained valuable experience and developed my skills. I am a hardworking and ambitious person and I always try to do my best.

Your university is one of the best in the world and has an excellent reputation. I would be honoured to study there and learn from the best professors. After graduation I want to return to Uzbekistan and contribute to the development of my country.

Thank you for your time and consideration.

Sincerely,
Dilnoza Rahimova`,
  },
  {
    id: 'sample-essay',
    kind: 'scholarship_essay',
    title: { en: 'Sample scholarship essay (fictional)', uz: 'Namuna grant inshosi (to‘qima)' },
    text: `Why do you deserve this scholarship?

My family cannot pay for studying abroad, so a scholarship is the only way for me to continue my education. I study hard and I get good grades. In 2023, I started a small tutoring group for first-year students in my university who struggled with statistics; eleven students joined and nine of them passed the exam that term.

I want to study public policy because I saw how a small change in a local subsidy rule affected my neighbours' farm income. I do not yet know all the answers, but I know the questions I want to study.

If I receive this scholarship I will work very hard and make the world a better place.`,
  },
];
