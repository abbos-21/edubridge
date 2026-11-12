import { Ko } from './core';

const iy = [
  'hardworking',
  'hard-working',
  'passionate',
  'good leader',
  'great leader',
  'natural leader',
  'team player',
  'highly motivated',
  'dedicated',
  'creative',
  'responsible',
  'ambitious',
  'excellent communication',
  'perfect fit',
];
const iz = [
  'since i was a child',
  'since childhood',
  'ever since i was young',
  'dictionary defines',
  'in today’s world',
  "in today's world",
  'from a young age',
  'i have always dreamed',
  'dream come true',
  'make the world a better place',
];
const tz = ['very', 'really', 'many things', 'a lot of', 'things', 'stuff', 'etc', 'some experience', 'various'];
const nz = (e) =>
  e
    .split(new RegExp('(?<=[.!?])\\s+'))
    .map((a) => a.trim())
    .filter(Boolean);
function Ur(e, a) {
  const t = e.toLowerCase();
  return a.filter((n) => new RegExp(`(^|[^a-z])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(t));
}
export function sz(e, a) {
  const t = Ko(e),
    n = nz(e),
    s = e.split(/\n\s*\n/).filter((g) => g.trim()).length,
    r = n.length ? t / n.length : 0,
    o = [],
    u = [],
    l = e.toLowerCase();
  if (t === 0)
    return {
      words: t,
      sentences: 0,
      paragraphs: 0,
      avgSentence: 0,
      issues: o,
      strengths: u,
    };
  a.wordLimit &&
    (t > a.wordLimit
      ? o.push({
          id: 'over-limit',
          severity: 'high',
          issue: {
            en: `Over the word limit (${t} / ${a.wordLimit}).`,
            uz: `So‘z chegarasidan oshgan (${t} / ${a.wordLimit}).`,
          },
          why: {
            en: 'Many portals cut or reject text beyond the limit, and reviewers read it as not following instructions.',
            uz: 'Ko‘p portallar chegaradan ortiq matnni kesadi yoki rad etadi, baholovchilar buni ko‘rsatmaga amal qilmaslik deb qabul qiladi.',
          },
          question: {
            en: 'Which paragraph adds the least new evidence about you?',
            uz: 'Qaysi xatboshi siz haqingizda eng kam yangi dalil beradi?',
          },
          strategy: {
            en: `Cut about ${t - a.wordLimit} words: remove repeated points first, then shorten long sentences.`,
            uz: `Taxminan ${t - a.wordLimit} so‘zni qisqartiring: avval takrorlarni olib tashlang, so‘ng uzun gaplarni qisqartiring.`,
          },
        })
      : t < a.wordLimit * 0.6
        ? o.push({
            id: 'under-limit',
            severity: 'medium',
            issue: {
              en: `Well under the limit (${t} / ${a.wordLimit}).`,
              uz: `Chegaradan ancha kam (${t} / ${a.wordLimit}).`,
            },
            why: {
              en: 'You may be missing space to show evidence of your skills and goals.',
              uz: 'Ko‘nikma va maqsadlaringizni dalillash uchun joy qolib ketayotgan bo‘lishi mumkin.',
            },
            question: {
              en: 'Which experience did you mention without explaining what you did and learned?',
              uz: 'Qaysi tajribani nima qilganingiz va nimani o‘rganganingizni tushuntirmasdan tilga oldingiz?',
            },
            strategy: {
              en: 'Expand one or two examples with what happened, your role and the result.',
              uz: 'Bir-ikki misolni nima bo‘lgani, sizning rolingiz va natija bilan kengaytiring.',
            },
          })
        : u.push({
            en: 'Length is within the word limit.',
            uz: 'Hajm so‘z chegarasi doirasida.',
          }));
  const c = Ur(e, iy);
  c.length &&
    o.push({
      id: 'claims',
      severity: 'high',
      evidence: c.join(', '),
      issue: {
        en: `Unsupported self-descriptions: “${c.join('”, “')}”.`,
        uz: `Dalilsiz o‘zini ta’riflash: “${c.join('”, “')}”.`,
      },
      why: {
        en: 'Reviewers cannot check adjectives. Concrete situations are more convincing than labels.',
        uz: 'Baholovchilar sifatlarni tekshira olmaydi. Aniq vaziyatlar yorliqlardan ko‘ra ishonarliroq.',
      },
      question: {
        en: `Can you describe one real situation that shows you are ${c[0]}? What did you do, and what changed?`,
        uz: `Sizning “${c[0]}” ekaningizni ko‘rsatadigan bitta haqiqiy vaziyatni tasvirlab bera olasizmi? Nima qildingiz va nima o‘zgardi?`,
      },
      strategy: {
        en: 'Replace each label with a short example: situation, your action, the result.',
        uz: 'Har bir yorliqni qisqa misol bilan almashtiring: vaziyat, sizning harakatingiz, natija.',
      },
      example: {
        en: 'Example of the pattern (not your text): “I organised weekly study sessions for six classmates before our exams.”',
        uz: 'Namuna (sizning matningiz emas): “Imtihonlardan oldin olti nafar sinfdoshim uchun haftalik o‘quv mashg‘ulotlarini tashkil qildim.”',
      },
    });
  const p = Ur(e, iz);
  p.length &&
    o.push({
      id: 'cliche',
      severity: 'medium',
      evidence: p.join(', '),
      issue: {
        en: `Common opening phrases: “${p.join('”, “')}”.`,
        uz: `Ko‘p ishlatiladigan iboralar: “${p.join('”, “')}”.`,
      },
      why: {
        en: 'Thousands of statements start this way, so they do not help yours stand out.',
        uz: 'Minglab xatlar shunday boshlanadi, shuning uchun ular sizni ajratib ko‘rsatmaydi.',
      },
      question: {
        en: 'What specific moment first made you take this subject seriously?',
        uz: 'Qaysi aniq lahza sizni bu fanga jiddiy qarashga undadi?',
      },
      strategy: {
        en: 'Open with that specific moment or question instead.',
        uz: 'Uning o‘rniga shu aniq lahza yoki savol bilan boshlang.',
      },
    });
  const d = Ur(e, tz);
  (d.length >= 3 &&
    o.push({
      id: 'vague',
      severity: 'low',
      evidence: d.join(', '),
      issue: {
        en: `Vague wording appears several times (${d.join(', ')}).`,
        uz: `Noaniq so‘zlar bir necha marta uchraydi (${d.join(', ')}).`,
      },
      why: {
        en: 'Vague words take space without adding information.',
        uz: 'Noaniq so‘zlar ma’lumot qo‘shmasdan joy egallaydi.',
      },
      question: {
        en: 'Can you replace “many things” or “a lot of” with the actual thing or number?',
        uz: '“Ko‘p narsa” kabi iboralarni aniq narsa yoki raqam bilan almashtira olasizmi?',
      },
      strategy: {
        en: 'Use names, numbers and outcomes where you can.',
        uz: 'Iloji bo‘lsa, nomlar, raqamlar va natijalardan foydalaning.',
      },
    }),
    /\d/.test(e) ||
    /\b(project|competition|olympiad|internship|research|club|volunteer|organi[sz]ed|led|built|founded)\b/i.test(e)
      ? u.push({
          en: 'Includes concrete examples or figures.',
          uz: 'Aniq misollar yoki raqamlar bor.',
        })
      : o.push({
          id: 'evidence',
          severity: 'high',
          issue: {
            en: 'Few concrete examples or results.',
            uz: 'Aniq misollar yoki natijalar kam.',
          },
          why: {
            en: 'Selection panels look for evidence of what you have actually done.',
            uz: 'Tanlov komissiyasi siz haqiqatda nima qilganingizga dalil izlaydi.',
          },
          question: {
            en: 'Which project, job, competition or activity best shows your interest in this field?',
            uz: 'Qaysi loyiha, ish, tanlov yoki faoliyat bu sohaga qiziqishingizni eng yaxshi ko‘rsatadi?',
          },
          strategy: {
            en: 'Add one real example with your role and a result you can describe honestly.',
            uz: 'Rolingiz va halol aytib bera oladigan natija bilan bitta haqiqiy misol qo‘shing.',
          },
        }),
    /\b(future|goal|plan|aim|career|after graduat|long-term|hope to|will)\b/i.test(e) ||
      o.push({
        id: 'future',
        severity: 'medium',
        issue: {
          en: 'Future goals are not clear.',
          uz: 'Kelajakdagi maqsadlar aniq emas.',
        },
        why: {
          en: 'Most prompts ask how the programme connects to what you will do next.',
          uz: 'Ko‘pchilik savollar dastur keyingi qadamlaringiz bilan qanday bog‘lanishini so‘raydi.',
        },
        question: {
          en: 'What do you want to be doing three to five years after this degree, and why?',
          uz: 'Bu ta’limdan 3–5 yil keyin nima bilan shug‘ullanmoqchisiz va nima uchun?',
        },
        strategy: {
          en: 'Add a short paragraph linking your past experience, this programme and your goal.',
          uz: 'O‘tmishdagi tajriba, ushbu dastur va maqsadingizni bog‘lovchi qisqa xatboshi qo‘shing.',
        },
      }),
    a.oppName &&
      (a.oppName
        .toLowerCase()
        .replace(/\(.*?\)/g, '')
        .split(/[\s—–-]+/)
        .filter((S) => S.length > 4)
        .some((S) => l.includes(S)) ||
        (a.country && l.includes(a.country.toLowerCase())) ||
        /\b(this programme|this program|this scholarship|this course|your university)\b/i.test(e) ||
        o.push({
          id: 'fit',
          severity: 'medium',
          issue: {
            en: 'The statement does not say why this programme or scholarship fits you.',
            uz: 'Xatda nima uchun aynan shu dastur yoki grant sizga mosligi aytilmagan.',
          },
          why: {
            en: 'A general statement could be sent anywhere. Reviewers want to see you chose them for a reason.',
            uz: 'Umumiy xatni istalgan joyga yuborish mumkin. Baholovchilar aynan ularni sabab bilan tanlaganingizni ko‘rmoqchi.',
          },
          question: {
            en: 'Which module, feature, or aim of this opportunity matters most to your plans?',
            uz: 'Bu imkoniyatning qaysi moduli, xususiyati yoki maqsadi rejalaringiz uchun eng muhim?',
          },
          strategy: {
            en: 'Read the official page and connect one or two real features to your goals.',
            uz: 'Rasmiy sahifani o‘qing va bir-ikki haqiqiy xususiyatni maqsadlaringiz bilan bog‘lang.',
          },
        })));
  const y = new Map();
  for (const g of l.match(/[a-z’']{5,}/g) ?? [])
    ['about', 'which', 'their', 'there', 'these', 'would', 'could', 'because', 'other', 'where', 'while'].includes(g) ||
      y.set(g, (y.get(g) ?? 0) + 1);
  const E = [...y.entries()]
    .filter(([, g]) => g >= Math.max(4, Math.round(t / 80)))
    .sort((g, b) => b[1] - g[1])
    .slice(0, 3);
  (E.length &&
    o.push({
      id: 'repetition',
      severity: 'low',
      evidence: E.map(([g, b]) => `${g} ×${b}`).join(', '),
      issue: {
        en: `Repeated words: ${E.map(([g, b]) => `“${g}” (${b}×)`).join(', ')}.`,
        uz: `Takrorlangan so‘zlar: ${E.map(([g, b]) => `“${g}” (${b}×)`).join(', ')}.`,
      },
      why: {
        en: 'Repetition can make the text feel longer than its content.',
        uz: 'Takrorlar matnni mazmunidan uzunroq ko‘rsatadi.',
      },
      question: {
        en: 'Are two of these sentences making the same point?',
        uz: 'Bu gaplardan ikkitasi bir xil fikrni aytmayaptimi?',
      },
      strategy: {
        en: 'Merge sentences that say the same thing; vary wording only where meaning stays exact.',
        uz: 'Bir xil fikrni aytayotgan gaplarni birlashtiring; ma’no aniq qolsa, so‘zlarni almashtiring.',
      },
    }),
    r > 28 &&
      o.push({
        id: 'long-sentences',
        severity: 'low',
        issue: {
          en: `Long sentences (average ${Math.round(r)} words).`,
          uz: `Uzun gaplar (o‘rtacha ${Math.round(r)} so‘z).`,
        },
        why: {
          en: 'Long sentences are harder to follow, especially for busy reviewers.',
          uz: 'Uzun gaplarni, ayniqsa band baholovchilar uchun, tushunish qiyinroq.',
        },
        question: {
          en: 'Where does a sentence contain two separate ideas?',
          uz: 'Qaysi gapda ikki alohida fikr bor?',
        },
        strategy: {
          en: 'Split those sentences into two.',
          uz: 'Bunday gaplarni ikkiga bo‘ling.',
        },
      }),
    s <= 1 && t > 180
      ? o.push({
          id: 'structure',
          severity: 'medium',
          issue: {
            en: 'The text is one block with no paragraphs.',
            uz: 'Matn xatboshilarsiz bitta blokdan iborat.',
          },
          why: {
            en: 'Paragraphs show your structure and make the text easier to read.',
            uz: 'Xatboshilar tuzilmani ko‘rsatadi va o‘qishni osonlashtiradi.',
          },
          question: {
            en: 'What are the three or four main points you want to make?',
            uz: 'Aytmoqchi bo‘lgan 3–4 asosiy fikringiz qaysilar?',
          },
          strategy: {
            en: 'Give each main point its own paragraph, following the order the prompt asks for.',
            uz: 'Har bir asosiy fikrga alohida xatboshi bering, savol tartibiga amal qiling.',
          },
        })
      : s > 1 &&
        u.push({
          en: 'Organised into paragraphs.',
          uz: 'Xatboshilarga ajratilgan.',
        }));
  const C = [];
  (/ {2,}/.test(e) &&
    C.push({
      en: 'double spaces',
      uz: 'qo‘sh probel',
    }),
    /(^|[.!?]\s+)[a-z]/.test(e) &&
      C.push({
        en: 'sentence starting with a lowercase letter',
        uz: 'kichik harf bilan boshlangan gap',
      }),
    /\bi\b/.test(e) &&
      C.push({
        en: 'lowercase “i”',
        uz: 'kichik “i” harfi',
      }),
    /\s[,.]/.test(e) &&
      C.push({
        en: 'space before punctuation',
        uz: 'tinish belgisidan oldin probel',
      }),
    C.length &&
      o.push({
        id: 'grammar',
        severity: 'low',
        evidence: C.map((g) => g.en).join(', '),
        issue: {
          en: `Small mechanical issues: ${C.map((g) => g.en).join(', ')}.`,
          uz: `Kichik texnik xatolar: ${C.map((g) => g.uz).join(', ')}.`,
        },
        why: {
          en: 'Small errors suggest the text was not proofread.',
          uz: 'Kichik xatolar matn tekshirilmaganini ko‘rsatadi.',
        },
        question: {
          en: 'Have you read the text aloud once, slowly?',
          uz: 'Matnni bir marta sekin, ovoz chiqarib o‘qidingizmi?',
        },
        strategy: {
          en: 'Proofread line by line. These checks are basic; a full grammar check needs a human reader or a grammar tool.',
          uz: 'Qatorma-qator tekshiring. Bu oddiy tekshiruv; to‘liq grammatik tekshiruv uchun inson yoki maxsus vosita kerak.',
        },
      }),
    a.hasPrompt ||
      o.push({
        id: 'prompt',
        severity: 'low',
        issue: {
          en: 'Relevance to the official prompt could not be checked.',
          uz: 'Rasmiy savolga mosligini tekshirib bo‘lmadi.',
        },
        why: {
          en: 'We do not have a verified prompt for this opportunity.',
          uz: 'Bu imkoniyat uchun tasdiqlangan savol bizda yo‘q.',
        },
        question: {
          en: 'Does every paragraph answer part of the official question?',
          uz: 'Har bir xatboshi rasmiy savolning bir qismiga javob beradimi?',
        },
        strategy: {
          en: 'Copy the official prompt into your notes and check each paragraph against it.',
          uz: 'Rasmiy savolni yozib oling va har bir xatboshini u bilan solishtiring.',
        },
      }));
  const v = {
    high: 0,
    medium: 1,
    low: 2,
  };
  return (
    o.sort((g, b) => v[g.severity] - v[b.severity]),
    {
      words: t,
      sentences: n.length,
      paragraphs: s,
      avgSentence: r,
      issues: o,
      strengths: u,
    }
  );
}
export function rz(e) {
  const a = e.trim();
  if (!a) return;
  const t = Ko(a),
    n = Ur(a, iy);
  if (n.length)
    return {
      en: `You wrote “${n[0]}”. Describe one real situation that shows this. What did you personally do?`,
      uz: `Siz “${n[0]}” deb yozdingiz. Buni ko‘rsatadigan bitta haqiqiy vaziyatni tasvirlang. Shaxsan siz nima qildingiz?`,
    };
  if (/\b(yaxshi yetakchi|mehnatkash|tirishqoq)\b/i.test(a))
    return {
      en: 'Describe one real situation that shows this quality.',
      uz: 'Bu fazilatni ko‘rsatadigan bitta haqiqiy vaziyatni tasvirlang.',
    };
  if (t < 12)
    return {
      en: 'Can you add a specific example: when it happened, what you did and what you learned?',
      uz: 'Aniq misol qo‘sha olasizmi: qachon bo‘lgan, nima qildingiz va nimani o‘rgandingiz?',
    };
  if (!/\d/.test(a) && t < 30)
    return {
      en: 'What was the result? A number, an outcome or a change you noticed helps.',
      uz: 'Natija qanday bo‘ldi? Raqam, natija yoki siz sezgan o‘zgarish foydali bo‘ladi.',
    };
}
const oz = [
  {
    re: /education|ta[’']?lim|образование/i,
    name: {
      en: 'Education',
      uz: 'Ta’lim',
    },
  },
  {
    re: /experience|employment|work|tajriba|ish/i,
    name: {
      en: 'Experience',
      uz: 'Tajriba',
    },
  },
  {
    re: /project|loyiha/i,
    name: {
      en: 'Projects',
      uz: 'Loyihalar',
    },
  },
  {
    re: /achievement|award|honou?r|yutuq|mukofot/i,
    name: {
      en: 'Achievements',
      uz: 'Yutuqlar',
    },
  },
  {
    re: /skill|ko[‘']?nikma/i,
    name: {
      en: 'Skills',
      uz: 'Ko‘nikmalar',
    },
  },
  {
    re: /language|til/i,
    name: {
      en: 'Languages',
      uz: 'Tillar',
    },
  },
  {
    re: /volunteer|ko[‘']?ngilli/i,
    name: {
      en: 'Volunteering',
      uz: 'Ko‘ngillilik',
    },
  },
];
export function lz(e) {
  const a = [],
    t = [];
  for (const r of oz) (r.re.test(e) ? a : t).push(r.name);
  const n = [];
  return (
    e.trim() &&
      !/(19|20)\d{2}/.test(e) &&
      n.push({
        en: 'Add dates (month and year) to each entry.',
        uz: 'Har bir bandga sana (oy va yil) qo‘shing.',
      }),
    /\b(responsible for|duties included)\b/i.test(e) &&
      n.push({
        en: 'Replace “responsible for” with what you actually did and the result.',
        uz: '“Mas’ul edim” o‘rniga nima qilganingiz va natijani yozing.',
      }),
    e
      .split(
        `
`,
      )
      .filter((r) => r.trim()).length > 80 &&
      n.push({
        en: 'Long CV. For most applications 1–2 pages is enough.',
        uz: 'CV uzun. Ko‘p arizalar uchun 1–2 sahifa yetarli.',
      }),
    /@/.test(e) === !1 &&
      e.trim() &&
      n.push({
        en: 'Include a contact email at the top.',
        uz: 'Yuqorida aloqa uchun email ko‘rsating.',
      }),
    n.push({
      en: 'Only include experiences you can prove. Never add qualifications you do not have.',
      uz: 'Faqat isbotlay oladigan tajribani kiriting. Yo‘q malakalarni hech qachon qo‘shmang.',
    }),
    {
      found: a,
      missing: t,
      notes: n,
    }
  );
}
