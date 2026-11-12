import { Ba, Kj, Ls, he, we, xe, zh } from './catalog';
import { Ai, Ho, Ie, ci } from './core';

function Dg(e, a, t) {
  if (a === void 0)
    return {
      dim: 'academic',
      status: 'verify',
      hard: !0,
      msg: t
        ? {
            en: 'The academic requirement is described in text only. Compare it with your results on the official page.',
            uz: 'Akademik talab faqat matn ko‘rinishida berilgan. Natijangizni rasmiy sahifadagi talab bilan solishtiring.',
          }
        : {
            en: 'No published academic minimum is stored for this opportunity. Check the official requirements.',
            uz: 'Bu imkoniyat uchun e’lon qilingan akademik minimum saqlanmagan. Rasmiy talablarni tekshiring.',
          },
    };
  if (e.score === void 0 || e.score === null || Number.isNaN(e.score))
    return {
      dim: 'academic',
      status: 'missing',
      hard: !0,
      msg: {
        en: `Add your academic score. The published minimum is ${a}%.`,
        uz: `Akademik natijangizni kiriting. E’lon qilingan minimum — ${a}%.`,
      },
    };
  if (e.scale !== 'percent') {
    const n = Kj[e.scale];
    return {
      dim: 'academic',
      status: 'verify',
      hard: !0,
      msg: {
        en: `The minimum is stated as ${a}%. Your score uses ${n.en}, and EduBridge does not convert between grading systems. The institution decides equivalence.`,
        uz: `Minimum ${a}% deb ko‘rsatilgan. Sizning natijangiz ${n.uz}da, EduBridge baho tizimlarini bir-biriga aylantirmaydi. Tenglikni muassasa belgilaydi.`,
      },
    };
  }
  return e.score >= a
    ? {
        dim: 'academic',
        status: 'met',
        hard: !0,
        msg: {
          en: `Your ${e.score}% appears to meet the published ${a}% minimum. Meeting a minimum does not guarantee admission.`,
          uz: `Sizning ${e.score}% natijangiz e’lon qilingan ${a}% minimumga mos ko‘rinadi. Minimumga mos kelish qabulni kafolatlamaydi.`,
        },
      }
    : {
        dim: 'academic',
        status: 'not_met',
        hard: !0,
        msg: {
          en: `Your ${e.score}% is below the published ${a}% minimum.`,
          uz: `Sizning ${e.score}% natijangiz e’lon qilingan ${a}% minimumdan past.`,
        },
      };
}
function Og(e, a, t) {
  return t === 'Unknown'
    ? {
        dim: 'language',
        status: 'verify',
        hard: !0,
        msg: {
          en: 'The language of instruction and English requirement were not confirmed. Check the programme page.',
          uz: 'O‘qitish tili va ingliz tili talabi tasdiqlanmagan. Dastur sahifasini tekshiring.',
        },
      }
    : t && t !== 'English' && t !== 'Mixed'
      ? {
          dim: 'language',
          status: 'verify',
          hard: !0,
          msg: {
            en: `Taught in ${t}. Check which language certificate is required.`,
            uz: `${t} tilida o‘qitiladi. Qaysi til sertifikati talab qilinishini tekshiring.`,
          },
        }
      : a === void 0
        ? {
            dim: 'language',
            status: 'verify',
            hard: !0,
            msg: {
              en: 'No published language minimum is stored. Check the official requirement and accepted tests.',
              uz: 'E’lon qilingan til minimumi saqlanmagan. Rasmiy talab va qabul qilinadigan testlarni tekshiring.',
            },
          }
        : e.ielts !== void 0 && e.ielts !== null && !Number.isNaN(e.ielts)
          ? e.ielts >= a
            ? {
                dim: 'language',
                status: 'met',
                hard: !0,
                msg: {
                  en: `Your IELTS ${e.ielts} appears to meet the published minimum of ${a}. Component minimums may also apply.`,
                  uz: `IELTS ${e.ielts} natijangiz e’lon qilingan ${a} minimumga mos ko‘rinadi. Bo‘limlar bo‘yicha minimum ham bo‘lishi mumkin.`,
                },
              }
            : {
                dim: 'language',
                status: 'not_met',
                hard: !0,
                msg: {
                  en: `Your IELTS ${e.ielts} is below the published minimum of ${a}.`,
                  uz: `IELTS ${e.ielts} natijangiz e’lon qilingan ${a} minimumdan past.`,
                },
              }
          : e.toefl
            ? {
                dim: 'language',
                status: 'verify',
                hard: !0,
                msg: {
                  en: `The minimum is stated as IELTS ${a}. Check whether TOEFL is accepted and what score is required.`,
                  uz: `Minimum IELTS ${a} deb ko‘rsatilgan. TOEFL qabul qilinishi va kerakli ballni tekshiring.`,
                },
              }
            : {
                dim: 'language',
                status: 'missing',
                hard: !0,
                msg: e.planningExam
                  ? {
                      en: `You plan to take a test. The published minimum is IELTS ${a}.`,
                      uz: `Siz test topshirishni rejalashtirgansiz. E’lon qilingan minimum — IELTS ${a}.`,
                    }
                  : {
                      en: `No language certificate on your profile. The published minimum is IELTS ${a}.`,
                      uz: `Profilingizda til sertifikati yo‘q. E’lon qilingan minimum — IELTS ${a}.`,
                    },
              };
}
const qh = (e, a, t) => (e == null || Number.isNaN(e) ? void 0 : Ho(e, a.currency, t));
const oa = (e, a, t) => (a.currency === 'UZS' ? `${Ie(ci(e, 'UZS', t))} UZS` : `$${Ie(e)}`);
function Yj(e, a, t) {
  var c;
  const n = [];
  (n.push(
    a.level === e.targetLevel
      ? {
          dim: 'level',
          status: 'met',
          hard: !0,
          msg: {
            en: `This is a ${Ba[a.level].en} programme, matching your goal.`,
            uz: `Bu ${Ba[a.level].uz} dasturi, maqsadingizga mos.`,
          },
        }
      : {
          dim: 'level',
          status: 'not_met',
          hard: !0,
          msg: {
            en: `This is a ${Ba[a.level].en} programme; you are looking for ${Ba[e.targetLevel].en}.`,
            uz: `Bu ${Ba[a.level].uz} dasturi; siz ${Ba[e.targetLevel].uz} izlayapsiz.`,
          },
        },
  ),
    n.push(Dg(e, a.reqs.minPercent, !1)),
    n.push(Og(e, a.reqs.minIELTS, a.instruction)));
  const s = qh(e.tuitionBudget, e, t);
  if (!a.tuition)
    n.push({
      dim: 'tuition',
      status: 'verify',
      hard: !1,
      msg: {
        en: 'Tuition has not been verified for this programme.',
        uz: 'Bu dastur uchun o‘qish to‘lovi tekshirilmagan.',
      },
    });
  else {
    const p = Ai(a.tuition, a.durationYears, t),
      d = a.fundingIds.length > 0;
    s === void 0
      ? n.push({
          dim: 'tuition',
          status: 'missing',
          hard: !1,
          msg: {
            en: `Tuition is about ${oa(p, e, t)} a year. Add your tuition budget to compare.`,
            uz: `O‘qish to‘lovi yiliga taxminan ${oa(p, e, t)}. Solishtirish uchun byudjetingizni kiriting.`,
          },
        })
      : p <= s
        ? n.push({
            dim: 'tuition',
            status: 'met',
            hard: !1,
            msg: {
              en: `Estimated tuition (about ${oa(p, e, t)} a year) is within your tuition budget.`,
              uz: `Taxminiy o‘qish to‘lovi (yiliga ~${oa(p, e, t)}) byudjetingiz doirasida.`,
            },
          })
        : n.push({
            dim: 'tuition',
            status: d ? 'verify' : 'not_met',
            hard: !1,
            msg: d
              ? {
                  en: `Tuition (about ${oa(p, e, t)} a year) is above your budget unless you win linked funding.`,
                  uz: `O‘qish to‘lovi (yiliga ~${oa(p, e, t)}) byudjetingizdan yuqori, agar bog‘langan grantni yutmasangiz.`,
                }
              : {
                  en: `Tuition (about ${oa(p, e, t)} a year) is above your stated budget.`,
                  uz: `O‘qish to‘lovi (yiliga ~${oa(p, e, t)}) belgilagan byudjetingizdan yuqori.`,
                },
          });
  }
  const r = ((c = a.livingUSDPerYear) == null ? void 0 : c.amount) ?? Ls[a.country],
    o = qh(e.totalBudget, e, t);
  if (r === void 0)
    n.push({
      dim: 'living',
      status: 'verify',
      hard: !1,
      msg: {
        en: 'Living costs are not available.',
        uz: 'Yashash xarajatlari ma’lum emas.',
      },
    });
  else if (o === void 0)
    n.push({
      dim: 'living',
      status: 'missing',
      hard: !1,
      msg: {
        en: `Living costs are estimated at about ${oa(r, e, t)} a year (unverified). Add your total yearly budget.`,
        uz: `Yashash xarajatlari yiliga ~${oa(r, e, t)} deb taxmin qilinadi (tekshirilmagan). Umumiy yillik byudjetingizni kiriting.`,
      },
    });
  else {
    const d = (a.tuition ? Ai(a.tuition, a.durationYears, t) : 0) + r;
    n.push(
      d <= o
        ? {
            dim: 'living',
            status: 'verify',
            hard: !1,
            msg: {
              en: `Tuition plus estimated living costs (about ${oa(d, e, t)}) fit your total budget, but living costs are an unverified estimate.`,
              uz: `O‘qish to‘lovi va taxminiy yashash xarajatlari (~${oa(d, e, t)}) umumiy byudjetingizga sig‘adi, lekin yashash xarajati tekshirilmagan taxmin.`,
            },
          }
        : {
            dim: 'living',
            status: 'not_met',
            hard: !1,
            msg: {
              en: `Tuition plus estimated living costs (about ${oa(d, e, t)} a year) exceed your total budget of ${oa(o, e, t)}.`,
              uz: `O‘qish to‘lovi va taxminiy yashash xarajatlari (yiliga ~${oa(d, e, t)}) umumiy byudjetingiz ${oa(o, e, t)} dan oshadi.`,
            },
          },
    );
  }
  const u = a.subjects ? a.subjects.includes(e.field) : a.subject === e.field;
  (n.push(
    u
      ? {
          dim: 'relevance',
          status: 'met',
          hard: !1,
          msg: a.subjects
            ? {
                en: `Offers programmes in your field (${xe[e.field].en}). Check that your exact programme is available.`,
                uz: `Sohangizda dasturlar bor (${xe[e.field].uz}). Aynan kerakli dastur borligini tekshiring.`,
              }
            : {
                en: `Matches your field: ${xe[e.field].en}.`,
                uz: `Sohangizga mos: ${xe[e.field].uz}.`,
              },
        }
      : a.subjects && !a.subjects.length
        ? {
            dim: 'relevance',
            status: 'verify',
            hard: !1,
            msg: {
              en: 'Subjects offered were not recorded. Check the programme catalogue.',
              uz: 'Yo‘nalishlar qayd etilmagan. Dasturlar katalogini tekshiring.',
            },
          }
        : {
            dim: 'relevance',
            status: 'not_met',
            hard: !1,
            msg: {
              en: `Your field (${xe[e.field].en}) was not found among this university’s listed areas.`,
              uz: `Sohangiz (${xe[e.field].uz}) bu universitet yo‘nalishlari orasida topilmadi.`,
            },
          },
  ),
    n.push(Wj(e, a.country)));
  const l = a.fundingIds.map((p) => he(p)).filter(Boolean);
  if (!l.length)
    n.push({
      dim: 'funding',
      status: e.needsFullFunding ? 'not_met' : 'na',
      hard: !1,
      msg: e.needsFullFunding
        ? {
            en: 'No funding is linked to this programme, and you said you need full funding.',
            uz: 'Bu dasturga grant bog‘lanmagan, siz esa to‘liq moliyalashtirish kerakligini aytgansiz.',
          }
        : {
            en: 'No scholarship is linked to this programme in our data.',
            uz: 'Ma’lumotlarimizda bu dasturga grant bog‘lanmagan.',
          },
    });
  else {
    const p = l.filter((h) => Rg(e, h).overall !== 'not_eligible'),
      d = l.map((h) => h.name).join(', ');
    n.push(
      p.length
        ? {
            dim: 'funding',
            status: 'verify',
            hard: !1,
            msg: {
              en: `Linked funding you may be eligible for: ${p.map((h) => h.name).join(', ')}. Awards are competitive.`,
              uz: `Siz mos kelishingiz mumkin bo‘lgan grantlar: ${p.map((h) => h.name).join(', ')}. Grantlar tanlov asosida.`,
            },
          }
        : {
            dim: 'funding',
            status: 'not_met',
            hard: !1,
            msg: {
              en: `Linked funding (${d}) does not appear to match your profile.`,
              uz: `Bog‘langan grantlar (${d}) profilingizga mos ko‘rinmaydi.`,
            },
          },
    );
  }
  return Gg(n);
}
function Wj(e, a) {
  const t = we[a];
  return e.avoidCountries.includes(a)
    ? {
        dim: 'destination',
        status: 'not_met',
        hard: !1,
        msg: {
          en: `${t.en} is on your list of countries to avoid.`,
          uz: `${t.uz} siz istamagan davlatlar ro‘yxatida.`,
        },
      }
    : !e.preferredCountries.length || e.preferredCountries.includes(a)
      ? {
          dim: 'destination',
          status: 'met',
          hard: !1,
          msg: {
            en: `${t.en} fits your destination preferences.`,
            uz: `${t.uz} tanlagan davlatlaringizga mos.`,
          },
        }
      : {
          dim: 'destination',
          status: 'verify',
          hard: !1,
          msg: {
            en: `${t.en} is not on your preferred list.`,
            uz: `${t.uz} afzal ko‘rgan ro‘yxatingizda yo‘q.`,
          },
        };
}
function Vj(e, a = new Date().getFullYear()) {
  return e.birthYear ? a - e.birthYear : void 0;
}
function Rg(e, a, t) {
  var u;
  const n = [],
    s = e.targetLevel;
  if (
    (n.push(
      a.levels.includes(s)
        ? {
            dim: 'level',
            status: 'met',
            hard: !0,
            msg: {
              en: `Open to ${Ba[s].en} applicants.`,
              uz: `${zh(Ba[s].uz)} nomzodlari uchun ochiq.`,
            },
          }
        : {
            dim: 'level',
            status: 'not_met',
            hard: !0,
            msg: {
              en: `Not offered for ${Ba[s].en} study (offered for: ${a.levels.map((l) => Ba[l].en).join(', ')}).`,
              uz: `${zh(Ba[s].uz)} uchun berilmaydi (beriladi: ${a.levels.map((l) => Ba[l].uz).join(', ')}).`,
            },
          },
    ),
    /^(uzbekistan|o‘zbekiston|o'zbekiston|ozbekiston)$/i.test(e.citizenship.trim())
      ? n.push({
          dim: 'citizenship',
          hard: !0,
          status: a.citizenship.uzbekistan === 'yes' ? 'met' : a.citizenship.uzbekistan === 'no' ? 'not_met' : 'verify',
          msg: a.citizenship.note,
        })
      : n.push({
          dim: 'citizenship',
          status: 'verify',
          hard: !0,
          msg: {
            en: `Check whether citizens of ${e.citizenship} are eligible.`,
            uz: `${e.citizenship} fuqarolari mos kelishini tekshiring.`,
          },
        }),
    n.push(
      a.subjects === 'all' || a.subjects.includes(e.field)
        ? {
            dim: 'relevance',
            status: 'met',
            hard: !0,
            msg: {
              en: 'Your field is covered.',
              uz: 'Sohangiz qamrab olingan.',
            },
          }
        : {
            dim: 'relevance',
            status: 'not_met',
            hard: !0,
            msg: {
              en: `Your field (${xe[e.field].en}) is not among the listed subjects.`,
              uz: `Sohangiz (${xe[e.field].uz}) ro‘yxatdagi yo‘nalishlarda yo‘q.`,
            },
          },
    ),
    n.push(Dg(e, a.criteria.minPercent, !0)),
    n.push(Og(e, a.criteria.minIELTS)),
    a.criteria.minWorkYears && s !== 'bachelor')
  ) {
    const l = e.workYears;
    l == null || Number.isNaN(l)
      ? n.push({
          dim: 'work',
          status: 'missing',
          hard: !0,
          msg: {
            en: `Requires about ${a.criteria.minWorkYears} years of work experience. Add yours to your profile.`,
            uz: `Taxminan ${a.criteria.minWorkYears} yillik ish tajribasi talab qilinadi. Profilingizga qo‘shing.`,
          },
        })
      : l >= a.criteria.minWorkYears
        ? n.push({
            dim: 'work',
            status: 'met',
            hard: !0,
            msg: a.criteria.workNote ?? {
              en: 'Work experience appears sufficient.',
              uz: 'Ish tajribasi yetarli ko‘rinadi.',
            },
          })
        : n.push({
            dim: 'work',
            status: a.criteria.workFlexible ? 'verify' : 'not_met',
            hard: !0,
            msg: {
              en: `You have ${l} year(s); about ${a.criteria.minWorkYears} are required.${a.criteria.workFlexible ? ' Exceptions exist — check the official rules.' : ''}`,
              uz: `Sizda ${l} yil bor; taxminan ${a.criteria.minWorkYears} yil talab qilinadi.${a.criteria.workFlexible ? ' Istisnolar bor — rasmiy qoidalarni tekshiring.' : ''}`,
            },
          });
  }
  const o = (u = a.criteria.ageByLevel) == null ? void 0 : u[s];
  if (o) {
    const l = Vj(e);
    l === void 0
      ? n.push({
          dim: 'age',
          status: 'missing',
          hard: !0,
          msg: {
            en: `Age limit applies (${o[0]}–${o[1]}). Add your birth year.`,
            uz: `Yosh chegarasi bor (${o[0]}–${o[1]}). Tug‘ilgan yilingizni kiriting.`,
          },
        })
      : l < o[0] - 1 || l > o[1] + 1
        ? n.push({
            dim: 'age',
            status: 'not_met',
            hard: !0,
            msg: {
              en: `Age limit is ${o[0]}–${o[1]}; you are about ${l}.`,
              uz: `Yosh chegarasi ${o[0]}–${o[1]}; siz taxminan ${l} yoshdasiz.`,
            },
          })
        : l < o[0] || l > o[1] || l === o[0] || l === o[1]
          ? n.push({
              dim: 'age',
              status: 'verify',
              hard: !0,
              msg: {
                en: `You are close to the ${o[0]}–${o[1]} age limit. Check the exact cut-off date.`,
                uz: `Siz ${o[0]}–${o[1]} yosh chegarasiga yaqinsiz. Aniq sanani tekshiring.`,
              },
            })
          : n.push({
              dim: 'age',
              status: 'met',
              hard: !0,
              msg: {
                en: `Within the ${o[0]}–${o[1]} age range.`,
                uz: `${o[0]}–${o[1]} yosh oralig‘ida.`,
              },
            });
  }
  return (
    a.criteria.requiresNomination &&
      n.push({
        dim: 'nomination',
        status: 'verify',
        hard: !0,
        msg: {
          en: 'You must be nominated by the sending authority in your country. Find out its process early.',
          uz: 'O‘z davlatingizdagi yuboruvchi organ tomonidan tavsiya etilishingiz kerak. Uning tartibini oldindan bilib oling.',
        },
      }),
    e.needsFullFunding &&
      a.fundingLabel !== 'full' &&
      n.push({
        dim: 'fit',
        status: 'verify',
        hard: !1,
        msg:
          a.fundingLabel === 'partial'
            ? {
                en: 'This is partial funding, and you said you need full funding. Check the budget planner before applying.',
                uz: 'Bu qisman moliyalashtirish, siz esa to‘liq kerakligini aytgansiz. Ariza berishdan oldin byudjetni rejalashtiring.',
              }
            : {
                en: 'Coverage has not been verified, and you need full funding.',
                uz: 'Qamrov tekshirilmagan, sizga esa to‘liq moliyalashtirish kerak.',
              },
      }),
    Gg(n)
  );
}
function Gg(e) {
  const a = e.filter((o) => o.hard);
  let t = 'eligible';
  a.some((o) => o.status === 'not_met')
    ? (t = 'not_eligible')
    : a.some((o) => o.status === 'missing')
      ? (t = 'missing')
      : e.some((o) => o.status === 'verify') && (t = 'verify');
  const n = e.filter((o) => o.status !== 'na'),
    s = n.filter((o) => o.status === 'met').length,
    r = e.reduce(
      (o, u) =>
        o +
        (u.status === 'met'
          ? 2
          : u.status === 'verify'
            ? 1
            : u.status === 'missing'
              ? 0
              : u.status === 'not_met'
                ? u.hard
                  ? -4
                  : -2
                : 0),
      0,
    );
  return {
    checks: e,
    overall: t,
    score: r,
    met: s,
    total: n.length,
  };
}
export function mo(e, a, t) {
  return a.kind === 'program' ? Yj(e, a, t) : Rg(e, a);
}
