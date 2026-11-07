import type { L } from '@edubridge/shared';
import type { StudentProfile } from '../profile';
import { MIN_GRADES, MIN_IELTS, type Group } from './ideas';

/**
 * The rule-based profile check: for a target group and level, what the profile says today versus what is typical.
 * Ported from the previous build (same thresholds and wording). It never converts grading systems and
 * never produces a probability: a missing value is "unknown", not "gap".
 */
export type Status = 'strong' | 'ok' | 'gap' | 'unknown';
export type CheckItem = { id: string; title: L; signals: string[]; status: Status; now: L; target: L; why: L };

const ce = (en: string, uz: string): L => ({ en, uz });

export function checkProfile(p: StudentProfile, group: Group, level: 'bachelor' | 'master'): CheckItem[] {
  const out: CheckItem[] = [];
  const x = p.experiences ?? {};
  const has = (k: string) => !!(x[k] && String(x[k]).trim());
  const minIelts = MIN_IELTS[group][level];
  const parts = p.ieltsParts ? Object.values(p.ieltsParts).filter((v): v is number => typeof v === 'number') : [];
  const lowest = parts.length ? Math.min(...parts) : undefined;

  // ---- English
  out.push({
    id: 'english',
    title: ce('English', 'Ingliz tili'),
    signals: ['communication'],
    status: p.ielts == null ? (p.toefl != null ? 'unknown' : 'gap') : p.ielts >= minIelts + 0.5 && (lowest ?? 9) >= minIelts - 0.5 ? 'strong' : p.ielts >= minIelts ? 'ok' : 'gap',
    now: p.ielts != null ? ce(`IELTS ${p.ielts}${lowest != null ? ` (lowest part ${lowest})` : ''}`, `IELTS ${p.ielts}${lowest != null ? ` (eng past bo‘lim ${lowest})` : ''}`) : p.toefl != null ? ce(`TOEFL ${p.toefl}`, `TOEFL ${p.toefl}`) : ce('No score yet', 'Hali ball yo‘q'),
    target: ce(`IELTS ${minIelts}+ with no weak part`, `IELTS ${minIelts}+, zaif bo‘limsiz`),
    why: ce('Below the target, English can stop an application before anything else is read. Some programmes ask more — check each page.', 'Maqsaddan past bo‘lsa, ingliz tili boshqa narsa o‘qilmasdan arizani to‘xtatishi mumkin. Ayrim dasturlar ko‘proq so‘raydi — har bir sahifani tekshiring.'),
  });

  // ---- Grades (only compared on the two scales that have a published reference)
  const g = MIN_GRADES[group];
  let gradeStatus: Status = 'unknown';
  if (p.score != null && p.scale === 'percent') gradeStatus = p.score >= g.percent + 5 ? 'strong' : p.score >= g.percent ? 'ok' : 'gap';
  if (p.score != null && p.scale === 'gpa4') gradeStatus = p.score >= g.gpa4 + 0.3 ? 'strong' : p.score >= g.gpa4 ? 'ok' : 'gap';
  out.push({
    id: 'grades',
    title: ce('Grades', 'Baholar'),
    signals: ['depth'],
    status: gradeStatus,
    now: p.score != null ? ce(`${p.score} (${p.scale})`, `${p.score} (${p.scale})`) : ce('Not entered', 'Kiritilmagan'),
    target: ce(`About ${g.percent}% / GPA ${g.gpa4} or higher`, `Taxminan ${g.percent}% / GPA ${g.gpa4} yoki yuqori`),
    why:
      gradeStatus === 'unknown'
        ? ce('Your scale cannot be compared fairly here — each university converts grades its own way.', 'Shkalangizni bu yerda adolatli solishtirib bo‘lmaydi — har bir universitet baholarni o‘zicha aylantiradi.')
        : ce('Readers look most at subjects close to your degree. Grades cannot change fast, so stronger evidence elsewhere matters more when they are below target.', 'O‘quvchilar ko‘proq darajangizga yaqin fanlarga qaraydi. Baholar tez o‘zgarmaydi, shuning uchun maqsaddan past bo‘lsa, boshqa joydagi kuchli dalillar muhimroq.'),
  });

  // ---- Interest in the subject
  const subject = ['projects', 'competitions', 'academic', 'research'].filter(has).length;
  out.push({
    id: 'subject',
    title: ce('Evidence of interest in your subject', 'Sohangizga qiziqish dalili'),
    signals: ['depth', 'research', 'initiative'],
    status: subject >= 2 ? 'strong' : subject === 1 ? (group === 'selective' ? 'gap' : 'ok') : 'gap',
    now: ce(`${subject} type(s) recorded (projects, competitions, academic, research)`, `${subject} tur qayd etilgan (loyiha, tanlov, akademik, tadqiqot)`),
    target: group === 'selective' ? ce('Two or more, with at least one real output', 'Ikki yoki undan ko‘p, kamida bittasi haqiqiy natija bilan') : ce('At least one concrete project or result', 'Kamida bitta aniq loyiha yoki natija'),
    why: ce('This is what turns “I am passionate about X” into something a reader believes.', 'Aynan shu “X ga qiziqaman” degan gapni o‘quvchi ishonadigan narsaga aylantiradi.'),
  });

  // ---- Leadership and contribution
  const lead = ['leadership', 'volunteering', 'community', 'teamwork'].filter(has).length;
  out.push({
    id: 'impact',
    title: ce('Leadership and contribution', 'Yetakchilik va hissa'),
    signals: ['leadership', 'impact'],
    status: lead >= 2 ? 'strong' : lead === 1 ? 'ok' : 'gap',
    now: ce(`${lead} type(s) recorded (leadership, volunteering, community, teamwork)`, `${lead} tur qayd etilgan (yetakchilik, ko‘ngillilik, jamiyat, jamoa)`),
    target: ce('One sustained role with a measurable result', 'O‘lchanadigan natijali bitta barqaror rol'),
    why: ce('Many scholarships (e.g. government programmes) state leadership or contribution as a criterion; one deep role beats many short ones.', 'Ko‘p grantlar (masalan, davlat dasturlari) yetakchilik yoki hissani mezon sifatida ko‘rsatadi; bitta chuqur rol ko‘p qisqalaridan kuchli.'),
  });

  if (level === 'master') {
    out.push({
      id: 'research',
      title: ce('Research experience', 'Tadqiqot tajribasi'),
      signals: ['research'],
      status: has('research') ? 'strong' : group === 'selective' ? 'gap' : 'ok',
      now: has('research') ? ce('Recorded', 'Qayd etilgan') : ce('None recorded', 'Qayd etilmagan'),
      target: group === 'selective' ? ce('A thesis or project you can discuss in depth, ideally written up', 'Chuqur muhokama qila oladigan, yaxshisi yozilgan bitiruv ishi yoki loyiha') : ce('Helpful, especially for research-based programmes', 'Foydali, ayniqsa tadqiqotga asoslangan dasturlar uchun'),
      why: ce('Research-based master’s and strong scholarships look for evidence you can ask and answer a question independently.', 'Tadqiqotga asoslangan magistratura va kuchli grantlar mustaqil savol berib, javob topa olishingiz dalilini izlaydi.'),
    });
    const years = p.workYears ?? 0;
    out.push({
      id: 'work',
      title: ce('Relevant work experience', 'Tegishli ish tajribasi'),
      signals: ['professional'],
      status: years >= 2 ? 'strong' : years >= 1 || has('internships') || has('employment') ? 'ok' : 'gap',
      now: ce(`${years} year(s) of work${has('internships') ? ', internship recorded' : ''}`, `${years} yil ish${has('internships') ? ', amaliyot qayd etilgan' : ''}`),
      target: ce('Any relevant experience; about two years for professional scholarships such as DAAD EPOS', 'Har qanday tegishli tajriba; DAAD EPOS kabi mutaxassislar grantlari uchun taxminan ikki yil'),
      why: ce('Work shows why you need the degree; some scholarships require it outright.', 'Ish nega aynan shu daraja kerakligini ko‘rsatadi; ayrim grantlar uni to‘g‘ridan-to‘g‘ri talab qiladi.'),
    });
  } else {
    out.push({
      id: 'work',
      title: ce('Practical experience', 'Amaliy tajriba'),
      signals: ['professional', 'initiative'],
      status: has('internships') || has('employment') || has('projects') ? 'ok' : 'unknown',
      now: has('internships') || has('employment') ? ce('Recorded', 'Qayd etilgan') : ce('None recorded', 'Qayd etilmagan'),
      target: ce('Optional for bachelor’s; one real project or job helps', 'Bakalavr uchun ixtiyoriy; bitta haqiqiy loyiha yoki ish yordam beradi'),
      why: ce('Not required for most bachelor’s programmes, but it gives your letter concrete material.', 'Ko‘pchilik bakalavr dasturlari uchun shart emas, lekin xatingizga aniq material beradi.'),
    });
  }
  return out;
}
