import type { L } from '@edubridge/shared';

/**
 * The writing tutor's rule-based checks, ported from the original app (same rules and wording). They run in the
 * browser, work offline and never rewrite the student's text: they only point at issues and ask questions.
 */
const l = (en: string, uz: string, ru?: string): L => (ru ? { en, uz, ru } : { en, uz });

export const wordCount = (text: string): number => text.trim().match(/[\p{L}\p{N}’'‘-]+/gu)?.length ?? 0;
const sentences = (e: string) => e.split(new RegExp('(?<=[.!?])\\s+')).map((a) => a.trim()).filter(Boolean);
const found = (e: string, list: string[]) => {
  const t = e.toLowerCase();
  return list.filter((n) => new RegExp(`(^|[^a-z])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(t));
};

const CLAIMS = ['hardworking', 'hard-working', 'passionate', 'good leader', 'great leader', 'natural leader', 'team player', 'highly motivated', 'dedicated', 'creative', 'responsible', 'ambitious', 'excellent communication', 'perfect fit'];
const CLICHES = ['since i was a child', 'since childhood', 'ever since i was young', 'dictionary defines', 'in today’s world', "in today's world", 'from a young age', 'i have always dreamed', 'dream come true', 'make the world a better place'];
const VAGUE = ['very', 'really', 'many things', 'a lot of', 'things', 'stuff', 'etc', 'some experience', 'various'];

export type Issue = { id: string; severity: 'high' | 'medium' | 'low'; issue: L; why: L; question: L; strategy: L; example?: L; evidence?: string };
export type Review = { words: number; sentences: number; paragraphs: number; avgSentence: number; issues: Issue[]; strengths: L[] };

export function reviewDraft(text: string, opt: { wordLimit?: number; oppName?: string; country?: string; hasPrompt?: boolean }): Review {
  const words = wordCount(text);
  const sents = sentences(text);
  const paragraphs = text.split(/\n\s*\n/).filter((g) => g.trim()).length;
  const avg = sents.length ? words / sents.length : 0;
  const issues: Issue[] = [];
  const strengths: L[] = [];
  const low = text.toLowerCase();
  if (words === 0) return { words, sentences: 0, paragraphs: 0, avgSentence: 0, issues, strengths };

  if (opt.wordLimit) {
    if (words > opt.wordLimit) {
      issues.push({ id: 'over-limit', severity: 'high', issue: l(`Over the word limit (${words} / ${opt.wordLimit}).`, `So‘z chegarasidan oshgan (${words} / ${opt.wordLimit}).`, `Превышен лимит слов (${words} / ${opt.wordLimit}).`), why: l('Many portals cut or reject text beyond the limit, and reviewers read it as not following instructions.', 'Ko‘p portallar chegaradan ortiq matnni kesadi yoki rad etadi, baholovchilar buni ko‘rsatmaga amal qilmaslik deb qabul qiladi.'), question: l('Which paragraph adds the least new evidence about you?', 'Qaysi xatboshi siz haqingizda eng kam yangi dalil beradi?'), strategy: l(`Cut about ${words - opt.wordLimit} words: remove repeated points first, then shorten long sentences.`, `Taxminan ${words - opt.wordLimit} so‘zni qisqartiring: avval takrorlarni olib tashlang, so‘ng uzun gaplarni qisqartiring.`, `Сократите примерно ${words - opt.wordLimit} слов: сначала уберите повторы, затем сократите длинные предложения.`) });
    } else if (words < opt.wordLimit * 0.6) {
      issues.push({ id: 'under-limit', severity: 'medium', issue: l(`Well under the limit (${words} / ${opt.wordLimit}).`, `Chegaradan ancha kam (${words} / ${opt.wordLimit}).`, `Заметно меньше лимита (${words} / ${opt.wordLimit}).`), why: l('You may be missing space to show evidence of your skills and goals.', 'Ko‘nikma va maqsadlaringizni dalillash uchun joy qolib ketayotgan bo‘lishi mumkin.'), question: l('Which experience did you mention without explaining what you did and learned?', 'Qaysi tajribani nima qilganingiz va nimani o‘rganganingizni tushuntirmasdan tilga oldingiz?'), strategy: l('Expand one or two examples with what happened, your role and the result.', 'Bir-ikki misolni nima bo‘lgani, sizning rolingiz va natija bilan kengaytiring.') });
    } else strengths.push(l('Length is within the word limit.', 'Hajm so‘z chegarasi doirasida.'));
  }

  const claims = found(text, CLAIMS);
  if (claims.length) issues.push({ id: 'claims', severity: 'high', evidence: claims.join(', '), issue: l(`Unsupported self-descriptions: “${claims.join('”, “')}”.`, `Dalilsiz o‘zini ta’riflash: “${claims.join('”, “')}”.`, `Самооценки без подтверждения: «${claims.join('», «')}».`), why: l('Reviewers cannot check adjectives. Concrete situations are more convincing than labels.', 'Baholovchilar sifatlarni tekshira olmaydi. Aniq vaziyatlar yorliqlardan ko‘ra ishonarliroq.'), question: l(`Can you describe one real situation that shows you are ${claims[0]}? What did you do, and what changed?`, `Sizning “${claims[0]}” ekaningizni ko‘rsatadigan bitta haqiqiy vaziyatni tasvirlab bera olasizmi? Nima qildingiz va nima o‘zgardi?`, `Можете описать одну реальную ситуацию, которая показывает, что вы «${claims[0]}»? Что вы сделали и что изменилось?`), strategy: l('Replace each label with a short example: situation, your action, the result.', 'Har bir yorliqni qisqa misol bilan almashtiring: vaziyat, sizning harakatingiz, natija.'), example: l('Example of the pattern (not your text): “I organised weekly study sessions for six classmates before our exams.”', 'Namuna (sizning matningiz emas): “Imtihonlardan oldin olti nafar sinfdoshim uchun haftalik o‘quv mashg‘ulotlarini tashkil qildim.”') });

  const cliches = found(text, CLICHES);
  if (cliches.length) issues.push({ id: 'cliche', severity: 'medium', evidence: cliches.join(', '), issue: l(`Common opening phrases: “${cliches.join('”, “')}”.`, `Ko‘p ishlatiladigan iboralar: “${cliches.join('”, “')}”.`, `Распространённые вступительные фразы: «${cliches.join('», «')}».`), why: l('Thousands of statements start this way, so they do not help yours stand out.', 'Minglab xatlar shunday boshlanadi, shuning uchun ular sizni ajratib ko‘rsatmaydi.'), question: l('What specific moment first made you take this subject seriously?', 'Qaysi aniq lahza sizni bu fanga jiddiy qarashga undadi?'), strategy: l('Open with that specific moment or question instead.', 'Uning o‘rniga shu aniq lahza yoki savol bilan boshlang.') });

  const vague = found(text, VAGUE);
  if (vague.length >= 3) issues.push({ id: 'vague', severity: 'low', evidence: vague.join(', '), issue: l(`Vague wording appears several times (${vague.join(', ')}).`, `Noaniq so‘zlar bir necha marta uchraydi (${vague.join(', ')}).`, `Расплывчатые слова встречаются несколько раз (${vague.join(', ')}).`), why: l('Vague words take space without adding information.', 'Noaniq so‘zlar ma’lumot qo‘shmasdan joy egallaydi.'), question: l('Can you replace “many things” or “a lot of” with the actual thing or number?', '“Ko‘p narsa” kabi iboralarni aniq narsa yoki raqam bilan almashtira olasizmi?'), strategy: l('Use names, numbers and outcomes where you can.', 'Iloji bo‘lsa, nomlar, raqamlar va natijalardan foydalaning.') });

  if (/\d/.test(text) || /\b(project|competition|olympiad|internship|research|club|volunteer|organi[sz]ed|led|built|founded)\b/i.test(text)) strengths.push(l('Includes concrete examples or figures.', 'Aniq misollar yoki raqamlar bor.'));
  else issues.push({ id: 'evidence', severity: 'high', issue: l('Few concrete examples or results.', 'Aniq misollar yoki natijalar kam.'), why: l('Selection panels look for evidence of what you have actually done.', 'Tanlov komissiyasi siz haqiqatda nima qilganingizga dalil izlaydi.'), question: l('Which project, job, competition or activity best shows your interest in this field?', 'Qaysi loyiha, ish, tanlov yoki faoliyat bu sohaga qiziqishingizni eng yaxshi ko‘rsatadi?'), strategy: l('Add one real example with your role and a result you can describe honestly.', 'Rolingiz va halol aytib bera oladigan natija bilan bitta haqiqiy misol qo‘shing.') });

  if (!/\b(future|goal|plan|aim|career|after graduat|long-term|hope to|will)\b/i.test(text)) issues.push({ id: 'future', severity: 'medium', issue: l('Future goals are not clear.', 'Kelajakdagi maqsadlar aniq emas.'), why: l('Most prompts ask how the programme connects to what you will do next.', 'Ko‘pchilik savollar dastur keyingi qadamlaringiz bilan qanday bog‘lanishini so‘raydi.'), question: l('What do you want to be doing three to five years after this degree, and why?', 'Bu ta’limdan 3–5 yil keyin nima bilan shug‘ullanmoqchisiz va nima uchun?'), strategy: l('Add a short paragraph linking your past experience, this programme and your goal.', 'O‘tmishdagi tajriba, ushbu dastur va maqsadingizni bog‘lovchi qisqa xatboshi qo‘shing.') });

  if (opt.oppName) {
    const mentions = opt.oppName.toLowerCase().replace(/\(.*?\)/g, '').split(/[\s—–-]+/).filter((s) => s.length > 4).some((s) => low.includes(s));
    if (!(mentions || (opt.country && low.includes(opt.country.toLowerCase())) || /\b(this programme|this program|this scholarship|this course|your university)\b/i.test(text))) issues.push({ id: 'fit', severity: 'medium', issue: l('The statement does not say why this programme or scholarship fits you.', 'Xatda nima uchun aynan shu dastur yoki grant sizga mosligi aytilmagan.'), why: l('A general statement could be sent anywhere. Reviewers want to see you chose them for a reason.', 'Umumiy xatni istalgan joyga yuborish mumkin. Baholovchilar aynan ularni sabab bilan tanlaganingizni ko‘rmoqchi.'), question: l('Which module, feature, or aim of this opportunity matters most to your plans?', 'Bu imkoniyatning qaysi moduli, xususiyati yoki maqsadi rejalaringiz uchun eng muhim?'), strategy: l('Read the official page and connect one or two real features to your goals.', 'Rasmiy sahifani o‘qing va bir-ikki haqiqiy xususiyatni maqsadlaringiz bilan bog‘lang.') });
  }

  const freq = new Map<string, number>();
  for (const g of low.match(/[a-z’']{5,}/g) ?? []) if (!['about', 'which', 'their', 'there', 'these', 'would', 'could', 'because', 'other', 'where', 'while'].includes(g)) freq.set(g, (freq.get(g) ?? 0) + 1);
  const rep = [...freq.entries()].filter(([, n]) => n >= Math.max(4, Math.round(words / 80))).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (rep.length) issues.push({ id: 'repetition', severity: 'low', evidence: rep.map(([g, n]) => `${g} ×${n}`).join(', '), issue: l(`Repeated words: ${rep.map(([g, n]) => `“${g}” (${n}×)`).join(', ')}.`, `Takrorlangan so‘zlar: ${rep.map(([g, n]) => `“${g}” (${n}×)`).join(', ')}.`), why: l('Repetition can make the text feel longer than its content.', 'Takrorlar matnni mazmunidan uzunroq ko‘rsatadi.'), question: l('Are two of these sentences making the same point?', 'Bu gaplardan ikkitasi bir xil fikrni aytmayaptimi?'), strategy: l('Merge sentences that say the same thing; vary wording only where meaning stays exact.', 'Bir xil fikrni aytayotgan gaplarni birlashtiring; ma’no aniq qolsa, so‘zlarni almashtiring.') });

  if (avg > 28) issues.push({ id: 'long-sentences', severity: 'low', issue: l(`Long sentences (average ${Math.round(avg)} words).`, `Uzun gaplar (o‘rtacha ${Math.round(avg)} so‘z).`, `Длинные предложения (в среднем ${Math.round(avg)} слов).`), why: l('Long sentences are harder to follow, especially for busy reviewers.', 'Uzun gaplarni, ayniqsa band baholovchilar uchun, tushunish qiyinroq.'), question: l('Where does a sentence contain two separate ideas?', 'Qaysi gapda ikki alohida fikr bor?'), strategy: l('Split those sentences into two.', 'Bunday gaplarni ikkiga bo‘ling.') });

  if (paragraphs <= 1 && words > 180) issues.push({ id: 'structure', severity: 'medium', issue: l('The text is one block with no paragraphs.', 'Matn xatboshilarsiz bitta blokdan iborat.'), why: l('Paragraphs show your structure and make the text easier to read.', 'Xatboshilar tuzilmani ko‘rsatadi va o‘qishni osonlashtiradi.'), question: l('What are the three or four main points you want to make?', 'Aytmoqchi bo‘lgan 3–4 asosiy fikringiz qaysilar?'), strategy: l('Give each main point its own paragraph, following the order the prompt asks for.', 'Har bir asosiy fikrga alohida xatboshi bering, savol tartibiga amal qiling.') });
  else if (paragraphs > 1) strengths.push(l('Organised into paragraphs.', 'Xatboshilarga ajratilgan.'));

  const mech: L[] = [];
  if (/ {2,}/.test(text)) mech.push(l('double spaces', 'qo‘sh probel', 'двойные пробелы'));
  if (/(^|[.!?]\s+)[a-z]/.test(text)) mech.push(l('sentence starting with a lowercase letter', 'kichik harf bilan boshlangan gap', 'предложение со строчной буквы'));
  if (/\bi\b/.test(text)) mech.push(l('lowercase “i”', 'kichik “i” harfi', 'строчная «i»'));
  if (/\s[,.]/.test(text)) mech.push(l('space before punctuation', 'tinish belgisidan oldin probel', 'пробел перед знаком препинания'));
  if (mech.length) issues.push({ id: 'grammar', severity: 'low', evidence: mech.map((g) => g.en).join(', '), issue: l(`Small mechanical issues: ${mech.map((g) => g.en).join(', ')}.`, `Kichik texnik xatolar: ${mech.map((g) => g.uz).join(', ')}.`, `Мелкие технические ошибки: ${mech.map((g) => g.ru ?? g.en).join(', ')}.`), why: l('Small errors suggest the text was not proofread.', 'Kichik xatolar matn tekshirilmaganini ko‘rsatadi.'), question: l('Have you read the text aloud once, slowly?', 'Matnni bir marta sekin, ovoz chiqarib o‘qidingizmi?'), strategy: l('Proofread line by line. These checks are basic; a full grammar check needs a human reader or a grammar tool.', 'Qatorma-qator tekshiring. Bu oddiy tekshiruv; to‘liq grammatik tekshiruv uchun inson yoki maxsus vosita kerak.') });

  if (!opt.hasPrompt) issues.push({ id: 'prompt', severity: 'low', issue: l('Relevance to the official prompt could not be checked.', 'Rasmiy savolga mosligini tekshirib bo‘lmadi.'), why: l('We do not have a verified prompt for this opportunity.', 'Bu imkoniyat uchun tasdiqlangan savol bizda yo‘q.'), question: l('Does every paragraph answer part of the official question?', 'Har bir xatboshi rasmiy savolning bir qismiga javob beradimi?'), strategy: l('Copy the official prompt into your notes and check each paragraph against it.', 'Rasmiy savolni yozib oling va har bir xatboshini u bilan solishtiring.') });

  const rank = { high: 0, medium: 1, low: 2 } as const;
  issues.sort((a, b) => rank[a.severity] - rank[b.severity]);
  return { words, sentences: sents.length, paragraphs, avgSentence: avg, issues, strengths };
}

/** A hint under a guided-question answer: ask for a real example, never supply one. */
export function answerHint(text: string): L | undefined {
  const a = text.trim();
  if (!a) return undefined;
  const n = wordCount(a);
  const claims = found(a, CLAIMS);
  if (claims.length) return l(`You wrote “${claims[0]}”. Describe one real situation that shows this. What did you personally do?`, `Siz “${claims[0]}” deb yozdingiz. Buni ko‘rsatadigan bitta haqiqiy vaziyatni tasvirlang. Shaxsan siz nima qildingiz?`, `Вы написали «${claims[0]}». Опишите одну реальную ситуацию, которая это показывает. Что лично сделали вы?`);
  if (/\b(yaxshi yetakchi|mehnatkash|tirishqoq)\b/i.test(a)) return l('Describe one real situation that shows this quality.', 'Bu fazilatni ko‘rsatadigan bitta haqiqiy vaziyatni tasvirlang.');
  if (n < 12) return l('Can you add a specific example: when it happened, what you did and what you learned?', 'Aniq misol qo‘sha olasizmi: qachon bo‘lgan, nima qildingiz va nimani o‘rgandingiz?');
  if (!/\d/.test(a) && n < 30) return l('What was the result? A number, an outcome or a change you noticed helps.', 'Natija qanday bo‘ldi? Raqam, natija yoki siz sezgan o‘zgarish foydali bo‘ladi.');
  return undefined;
}

export const QUESTIONS: Array<{ id: string; area: L; q: L }> = [
  { id: 'why', area: l('Academic motivation', 'Akademik qiziqish'), q: l('Why are you interested in this subject?', 'Nega bu fanga qiziqasiz?') },
  { id: 'moment', area: l('Relevant experiences', 'Tegishli tajriba'), q: l('What experience influenced your decision?', 'Qaysi tajriba qaroringizga ta’sir qilgan?') },
  { id: 'explore', area: l('Subject knowledge', 'Fan bilimi'), q: l('What have you done to explore this field?', 'Bu sohani o‘rganish uchun nima qilgansiz?') },
  { id: 'project', area: l('Evidence of skills', 'Ko‘nikma dalillari'), q: l('What did you learn from a relevant project? What did you personally contribute?', 'Tegishli loyihadan nimani o‘rgandingiz? Shaxsan qanday hissa qo‘shdingiz?') },
  { id: 'challenge', area: l('Personal development', 'Shaxsiy rivojlanish'), q: l('What challenge did you face, and what did you do about it?', 'Qanday qiyinchilikka duch keldingiz va nima qildingiz?') },
  { id: 'connect', area: l('Past and future', 'O‘tmish va kelajak'), q: l('How do your past experiences connect to your future goals?', 'O‘tmishdagi tajribangiz kelajakdagi maqsadlaringiz bilan qanday bog‘lanadi?') },
  { id: 'fit', area: l('Programme fit', 'Dasturga mosligi'), q: l('Why does this university or programme suit your goals?', 'Nega aynan shu universitet yoki dastur maqsadlaringizga mos?') },
  { id: 'future', area: l('Future ambitions', 'Kelajak rejalari'), q: l('What do you hope to achieve in the future?', 'Kelajakda nimaga erishmoqchisiz?') },
];

const CV_SECTIONS: Array<{ re: RegExp; name: L }> = [
  { re: /education|ta[’']?lim|образование/i, name: l('Education', 'Ta’lim') },
  { re: /experience|employment|work|tajriba|ish/i, name: l('Experience', 'Tajriba') },
  { re: /project|loyiha/i, name: l('Projects', 'Loyihalar') },
  { re: /achievement|award|honou?r|yutuq|mukofot/i, name: l('Achievements', 'Yutuqlar') },
  { re: /skill|ko[‘']?nikma/i, name: l('Skills', 'Ko‘nikmalar') },
  { re: /language|til/i, name: l('Languages', 'Tillar') },
  { re: /volunteer|ko[‘']?ngilli/i, name: l('Volunteering', 'Ko‘ngillilik') },
];

export function reviewCv(text: string): { found: L[]; missing: L[]; notes: L[] } {
  const have: L[] = [];
  const missing: L[] = [];
  for (const s of CV_SECTIONS) (s.re.test(text) ? have : missing).push(s.name);
  const notes: L[] = [];
  const filled = text.trim();
  if (filled && !/(19|20)\d{2}/.test(text)) notes.push(l('Add dates (month and year) to each entry.', 'Har bir bandga sana (oy va yil) qo‘shing.'));
  if (/\b(responsible for|duties included)\b/i.test(text)) notes.push(l('Replace “responsible for” with what you actually did and the result.', '“Mas’ul edim” o‘rniga nima qilganingiz va natijani yozing.'));
  if (text.split('\n').filter((r) => r.trim()).length > 80) notes.push(l('Long CV. For most applications 1–2 pages is enough.', 'CV uzun. Ko‘p arizalar uchun 1–2 sahifa yetarli.'));
  if (filled && !/@/.test(text)) notes.push(l('Include a contact email at the top.', 'Yuqorida aloqa uchun email ko‘rsating.'));
  notes.push(l('Only include experiences you can prove. Never add qualifications you do not have.', 'Faqat isbotlay oladigan tajribani kiriting. Yo‘q malakalarni hech qachon qo‘shmang.'));
  return { found: have, missing, notes };
}
