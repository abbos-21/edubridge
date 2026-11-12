import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { ArrowLeft, ArrowRight, Check, FileUp, FlaskConical, Pencil, X } from 'lucide-react';
import { useStore } from '../store/store';
import { useI18n } from '../lib/derived';
import { Button, Callout, Card, CmpHa, Field, Input, Pa, Select, Textarea, classNames } from '../components/ui';
import { LangSwitch, Logo, Zg } from '../components/layout';
import { ms, we, xe } from '../lib/catalog';
import { Mascot, SpeechBubble, Xs } from '../components/mascot';

export function Cmp_g({ compact: e }) {
  const { state: a, setMascot: t, notify: n } = useStore(),
    { tx: s } = useI18n(),
    r = [
      {
        v: 'male',
        label: s('Boy guide', 'O‘g‘il yo‘lboshchi'),
        cast: 'male',
      },
      {
        v: 'female',
        label: s('Girl guide', 'Qiz yo‘lboshchi'),
        cast: 'female',
      },
      {
        v: null,
        label: s('No preference', 'Farqi yo‘q'),
        cast: 'duo',
      },
    ];
  return (
    <fieldset>
      <legend className="text-[13px] font-semibold">
        {s('Your EduBridge guide', 'EduBridge yo‘lboshchingiz')}{' '}
        <span className="font-normal text-faint">
          {'· '}
          {s('optional', 'ixtiyoriy')}
        </span>
      </legend>
      {!e && (
        <p className="mt-0.5 text-[12.5px] text-muted">
          {s(
            'Pick the character who appears beside your tips. Both give exactly the same help. You can change this in Settings.',
            'Maslahatlar yonida chiqadigan qahramonni tanlang. Ikkalasi ham bir xil yordam beradi. Buni Sozlamalarda o‘zgartirishingiz mumkin.',
          )}
        </p>
      )}
      <div className="mt-2 grid grid-cols-3 gap-2">
        {r.map((o) => {
          const u = a.mascot === o.v;
          return (
            <button
              type="button"
              aria-pressed={u}
              onClick={() => {
                (t(o.v), n(s('Guide updated', 'Yo‘lboshchi yangilandi')));
              }}
              className={classNames(
                'relative flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-[13px] font-semibold',
                u ? 'border-teal bg-teal-soft/60' : 'border-line bg-surface hover:border-teal/40',
              )}
              key={o.label}
            >
              <span className="flex gap-1">
                {(o.cast === 'duo' ? ['male', 'female'] : [o.cast]).map((l) => (
                  <img src={Zg[l]} alt="" className="h-12 w-12 rounded-full object-cover ring-1 ring-line" key={l} />
                ))}
              </span>
              {o.label}
              {u && (
                <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-teal text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
const DS = {
  name: '',
  citizenship: 'Uzbekistan',
  residence: 'Uzbekistan',
  currentEducation: 'school',
  targetLevel: 'bachelor',
  field: 'business',
  applicationYear: new Date().getFullYear() + 1,
  intake: '',
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
const ni = (e) => (e.trim() === '' ? void 0 : Number(e.replace(',', '.')));
const ql = {
  percent: 100,
  gpa4: 4,
  gpa5: 5,
  five_point_uz: 5,
  other: 1e9,
};
export function OnboardingPage() {
  const e = useStore(),
    { state: a, route: t, navigate: n, setProfile: s, saveOnboardingDraft: r, notify: o } = e,
    { tx: u, p: l, t: c } = useI18n(),
    p = t.id === 'edit' && !!a.profile,
    [d, h] = React.useState(() => ({
      ...DS,
      ...(p ? a.profile : (a.onboardingDraft ?? {})),
    })),
    [m, y] = React.useState(p ? 6 : 0),
    [E, C] = React.useState({}),
    [v, g] = React.useState(null),
    [b, S] = React.useState(''),
    A = (f) => {
      const M = {
        ...d,
        ...f,
      };
      (h(M), p || r(M));
    },
    q = [
      u('Basics', 'Asosiy'),
      u('Academics', 'O‘qish'),
      u('Language', 'Til'),
      u('Finances', 'Moliya'),
      u('Destinations', 'Davlatlar'),
      u('Experience', 'Tajriba'),
      u('Review', 'Ko‘rib chiqish'),
    ],
    w = (f) => {
      const M = {};
      if (
        (f === 0 &&
          (d.name.trim() || (M.name = u('Enter a name or nickname.', 'Ism yoki taxallus kiriting.')),
          d.citizenship.trim() || (M.citizenship = u('Enter your citizenship.', 'Fuqaroligingizni kiriting.')),
          d.birthYear !== void 0 &&
            (d.birthYear < 1950 || d.birthYear > new Date().getFullYear() - 10) &&
            (M.birthYear = u('Check the year.', 'Yilni tekshiring.'))),
        f === 1 &&
          d.score !== void 0 &&
          (Number.isNaN(d.score) || d.score < 0 || d.score > ql[d.scale]) &&
          (M.score = u(
            `Enter a number between 0 and ${ql[d.scale]} for this scale.`,
            `Bu tizim uchun 0 va ${ql[d.scale]} oralig‘idagi son kiriting.`,
          )),
        f === 2 &&
          (d.ielts !== void 0 &&
            (Number.isNaN(d.ielts) || d.ielts < 0 || d.ielts > 9 || (d.ielts * 2) % 1 !== 0) &&
            (M.ielts = u(
              'IELTS scores run from 0 to 9 in steps of 0.5.',
              'IELTS ballari 0 dan 9 gacha, 0.5 qadam bilan.',
            )),
          d.toefl !== void 0 &&
            (Number.isNaN(d.toefl) || d.toefl < 0 || d.toefl > 120) &&
            (M.toefl = u('TOEFL iBT runs from 0 to 120.', 'TOEFL iBT 0 dan 120 gacha.')),
          d.sat !== void 0 &&
            (Number.isNaN(d.sat) || d.sat < 400 || d.sat > 1600) &&
            (M.sat = u('SAT runs from 400 to 1600.', 'SAT 400 dan 1600 gacha.'))),
        f === 3)
      ) {
        for (const D of ['tuitionBudget', 'totalBudget'])
          d[D] !== void 0 &&
            (Number.isNaN(d[D]) || d[D] < 0) &&
            (M[D] = u('Enter a positive number or leave blank.', 'Musbat son kiriting yoki bo‘sh qoldiring.'));
        d.tuitionBudget !== void 0 &&
          d.totalBudget !== void 0 &&
          d.totalBudget < d.tuitionBudget &&
          (M.totalBudget = u(
            'Total budget should include tuition, so it cannot be smaller.',
            'Umumiy byudjet o‘qish to‘lovini ham o‘z ichiga oladi, shuning uchun kichik bo‘lmaydi.',
          ));
      }
      return (
        f === 5 &&
          d.workYears !== void 0 &&
          (Number.isNaN(d.workYears) || d.workYears < 0 || d.workYears > 50) &&
          (M.workYears = u('Enter years of work between 0 and 50.', '0 dan 50 gacha bo‘lgan ish yillarini kiriting.')),
        M
      );
    },
    U = (f) => {
      if (f > m) {
        const M = w(m);
        if ((C(M), Object.keys(M).length)) {
          o(u('Please fix the highlighted fields', 'Belgilangan maydonlarni tuzating'));
          return;
        }
      } else C({});
      (y(f),
        window.scrollTo({
          top: 0,
        }));
    },
    j = () => {
      for (let f = 0; f < 6; f++) {
        const M = w(f);
        if (Object.keys(M).length) {
          (C(M), y(f), o(u('Some answers need fixing', 'Ayrim javoblarni tuzatish kerak')));
          return;
        }
      }
      (s(d),
        o(
          p
            ? u('Profile updated — recommendations refreshed', 'Profil yangilandi — tavsiyalar qayta hisoblandi')
            : u('Profile saved in this browser', 'Profil shu brauzerda saqlandi'),
        ),
        n('dashboard'));
    },
    k = (f) => {
      if ((S(''), g(null), !f)) return;
      if (!['application/pdf', 'image/png', 'image/jpeg'].includes(f.type)) {
        S(u('Use a PDF, PNG or JPG file.', 'PDF, PNG yoki JPG fayldan foydalaning.'));
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        S(u('The file is larger than 5 MB.', 'Fayl 5 MB dan katta.'));
        return;
      }
      g({
        name: f.name,
        size: f.size,
      });
    },
    K = React.useMemo(
      () => [
        {
          k: 'leadership',
          l: u('Leadership', 'Yetakchilik'),
        },
        {
          k: 'teamwork',
          l: u('Teamwork', 'Jamoada ishlash'),
        },
        {
          k: 'volunteering',
          l: u('Volunteering', 'Ko‘ngillilik'),
        },
        {
          k: 'competitions',
          l: u('Competitions & olympiads', 'Tanlov va olimpiadalar'),
        },
        {
          k: 'internships',
          l: u('Internships', 'Amaliyot'),
        },
        {
          k: 'employment',
          l: u('Employment', 'Ish'),
        },
        {
          k: 'projects',
          l: u('Independent projects', 'Mustaqil loyihalar'),
        },
        {
          k: 'research',
          l: u('Research', 'Tadqiqot'),
        },
        {
          k: 'academic',
          l: u('Academic achievements', 'Akademik yutuqlar'),
        },
        {
          k: 'community',
          l: u('Community involvement', 'Jamoat faoliyati'),
        },
      ],
      [u],
    ),
    x = Xs(),
    F = [
      u(
        'Salom! Let’s start with the basics. A nickname is fine — this stays in your browser.',
        'Salom! Asosiy ma’lumotlardan boshlaymiz. Taxallus ham bo‘laveradi — bu faqat brauzeringizda qoladi.',
      ),
      u(
        'Enter your grades exactly as they appear on your documents. We never convert between grading systems.',
        'Baholaringizni hujjatdagidek kiriting. Biz baholash tizimlarini bir-biriga aylantirmaymiz.',
      ),
      u(
        'No certificate yet? That’s okay. We’ll mark it as missing information, not as a “no”.',
        'Hali sertifikat yo‘qmi? Hechqisi yo‘q. Biz uni “mos emas” emas, “ma’lumot yetishmaydi” deb belgilaymiz.',
      ),
      u(
        'Tuition is only part of the cost. Rent, food, insurance and travel count too.',
        'O‘qish to‘lovi xarajatning faqat bir qismi. Ijara, ovqat, sug‘urta va yo‘l ham hisobga kiradi.',
      ),
      u(
        'Pick a few countries you’re curious about. You can change them any time.',
        'Qiziqqan bir nechta davlatni tanlang. Ularni istalgan vaqtda o‘zgartirishingiz mumkin.',
      ),
      u(
        'Real experiences beat impressive words. Leave blank anything that doesn’t apply.',
        'Chiroyli so‘zlardan ko‘ra haqiqiy tajriba muhimroq. Tegishli bo‘lmaganini bo‘sh qoldiring.',
      ),
      u(
        'Check everything once. You can edit any section before saving.',
        'Hammasini bir marta tekshiring. Saqlashdan oldin istalgan bo‘limni tahrirlashingiz mumkin.',
      ),
    ],
    O = ['bachelor', 'master', 'phd'].map((f) => (
      <option value={f} key={f}>
        {c(`lvl.${f}`)}
      </option>
    )),
    N = (f, M) => {
      const D = f === 'preferredCountries' ? 'avoidCountries' : 'preferredCountries',
        R = d[f].includes(M) ? d[f].filter((_) => _ !== M) : [...d[f], M];
      A({
        [f]: R,
        [D]: d[D].filter((_) => _ !== M),
      });
    };
  let I = null;
  if (
    (m === 0 &&
      (I = (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={u('Name or preferred display name', 'Ism yoki ko‘rsatiladigan ism')}
            htmlFor="ob-name"
            error={E.name}
          >
            <Input
              id="ob-name"
              value={d.name}
              onChange={(f) =>
                A({
                  name: f.target.value,
                })
              }
              autoComplete="given-name"
            />
          </Field>
          <Field
            label={u('Citizenship', 'Fuqarolik')}
            htmlFor="ob-cit"
            error={E.citizenship}
            hint={u('Used for scholarship eligibility.', 'Grant talablarini tekshirish uchun.')}
          >
            <Input
              id="ob-cit"
              value={d.citizenship}
              onChange={(f) =>
                A({
                  citizenship: f.target.value,
                })
              }
              list="ob-cit-list"
            />
            <datalist id="ob-cit-list">
              <option value="Uzbekistan" />
              <option value="Kazakhstan" />
              <option value="Tajikistan" />
              <option value="Kyrgyzstan" />
              <option value="Turkmenistan" />
            </datalist>
          </Field>
          <Field label={u('Country of residence', 'Yashash davlati')} htmlFor="ob-res">
            <Input
              id="ob-res"
              value={d.residence}
              onChange={(f) =>
                A({
                  residence: f.target.value,
                })
              }
            />
          </Field>
          <Field label={u('Current education level', 'Hozirgi ta’lim darajasi')} htmlFor="ob-cur">
            <Select
              id="ob-cur"
              value={d.currentEducation}
              onChange={(f) =>
                A({
                  currentEducation: f.target.value,
                })
              }
            >
              <option value="school">{u('School student / graduate', 'Maktab o‘quvchisi / bitiruvchisi')}</option>
              <option value="lyceum_college">{u('Academic lyceum or college', 'Akademik litsey yoki kollej')}</option>
              <option value="bachelor_student">{u('Bachelor’s student', 'Bakalavr talabasi')}</option>
              <option value="bachelor_grad">{u('Bachelor’s graduate', 'Bakalavr bitiruvchisi')}</option>
              <option value="master_grad">{u('Master’s graduate', 'Magistr bitiruvchisi')}</option>
              <option value="working">{u('Working professional', 'Ishlayotgan mutaxassis')}</option>
            </Select>
          </Field>
          <Field label={u('Degree you want to study', 'O‘qimoqchi bo‘lgan daraja')} htmlFor="ob-lvl">
            <Select
              id="ob-lvl"
              value={d.targetLevel}
              onChange={(f) =>
                A({
                  targetLevel: f.target.value,
                })
              }
            >
              {O}
            </Select>
          </Field>
          <Field label={u('Field of study', 'Ta’lim yo‘nalishi')} htmlFor="ob-field">
            <Select
              id="ob-field"
              value={d.field}
              onChange={(f) =>
                A({
                  field: f.target.value,
                })
              }
            >
              {Object.keys(xe).map((f) => (
                <option value={f} key={f}>
                  {l(xe[f])}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={u('Expected application year', 'Taxminiy ariza yili')} htmlFor="ob-year">
            <Select
              id="ob-year"
              value={d.applicationYear}
              onChange={(f) =>
                A({
                  applicationYear: Number(f.target.value),
                })
              }
            >
              {[0, 1, 2, 3].map((f) => {
                const M = new Date().getFullYear() + f;
                return (
                  <option value={M} key={M}>
                    {M}
                  </option>
                );
              })}
            </Select>
          </Field>
          <Field label={u('Preferred intake', 'Afzal qabul davri')} htmlFor="ob-intake" optional={!0}>
            <Input
              id="ob-intake"
              value={d.intake}
              placeholder={u('e.g. September 2027', 'masalan, 2027-yil sentabr')}
              onChange={(f) =>
                A({
                  intake: f.target.value,
                })
              }
            />
          </Field>
          <Field
            label={u('Year of birth', 'Tug‘ilgan yil')}
            htmlFor="ob-birth"
            optional={!0}
            error={E.birthYear}
            hint={u(
              'Only used to check age limits some scholarships publish.',
              'Faqat ayrim grantlardagi yosh chegarasini tekshirish uchun.',
            )}
          >
            <Input
              id="ob-birth"
              inputMode="numeric"
              value={d.birthYear ?? ''}
              onChange={(f) =>
                A({
                  birthYear: ni(f.target.value),
                })
              }
            />
          </Field>
          <div className="sm:col-span-2">
            <Cmp_g />
          </div>
        </div>
      )),
    m === 1 &&
      (I = (
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={u('Current or highest qualification', 'Hozirgi yoki eng yuqori ma’lumot')} htmlFor="ob-q">
              <Input
                id="ob-q"
                value={d.qualification}
                placeholder={u('e.g. School leaving certificate', 'masalan, Umumiy o‘rta ta’lim attestati')}
                onChange={(f) =>
                  A({
                    qualification: f.target.value,
                  })
                }
              />
            </Field>
            <Field label={u('School, college or university', 'Maktab, kollej yoki universitet')} htmlFor="ob-inst">
              <Input
                id="ob-inst"
                value={d.institution}
                onChange={(f) =>
                  A({
                    institution: f.target.value,
                  })
                }
              />
            </Field>
            <Field
              label={u('Grading scale', 'Baholash tizimi')}
              htmlFor="ob-scale"
              hint={u(
                'We never convert between systems — institutions decide equivalence.',
                'Biz tizimlarni bir-biriga aylantirmaymiz — tenglikni muassasalar belgilaydi.',
              )}
            >
              <Select
                id="ob-scale"
                value={d.scale}
                onChange={(f) =>
                  A({
                    scale: f.target.value,
                  })
                }
              >
                <option value="percent">{u('Percentage (0–100)', 'Foiz (0–100)')}</option>
                <option value="five_point_uz">{u('Uzbek 5-point scale', 'O‘zbekiston 5 ballik tizimi')}</option>
                <option value="gpa4">{u('GPA out of 4', '4 ballik GPA')}</option>
                <option value="gpa5">{u('GPA out of 5', '5 ballik GPA')}</option>
                <option value="other">{u('Other (describe)', 'Boshqa (tavsiflang)')}</option>
              </Select>
            </Field>
            <Field
              label={u('GPA or academic score', 'GPA yoki o‘rtacha baho')}
              htmlFor="ob-score"
              error={E.score}
              optional={!0}
            >
              <Input
                id="ob-score"
                inputMode="decimal"
                value={d.score ?? ''}
                onChange={(f) =>
                  A({
                    score: ni(f.target.value),
                  })
                }
              />
            </Field>
            {d.scale === 'other' && (
              <Field label={u('Describe your grading system', 'Baholash tizimingizni tavsiflang')} htmlFor="ob-so">
                <Input
                  id="ob-so"
                  value={d.scaleOther ?? ''}
                  onChange={(f) =>
                    A({
                      scaleOther: f.target.value,
                    })
                  }
                />
              </Field>
            )}
            <Field label={u('Graduation year', 'Bitirish yili')} htmlFor="ob-grad" optional={!0}>
              <Input
                id="ob-grad"
                inputMode="numeric"
                value={d.graduationYear ?? ''}
                onChange={(f) =>
                  A({
                    graduationYear: ni(f.target.value),
                  })
                }
              />
            </Field>
            <Field label={u('Intended major', 'Rejalashtirilgan mutaxassislik')} htmlFor="ob-major" optional={!0}>
              <Input
                id="ob-major"
                value={d.major}
                onChange={(f) =>
                  A({
                    major: f.target.value,
                  })
                }
              />
            </Field>
          </div>
          <Field
            label={u('Relevant academic achievements', 'Tegishli akademik yutuqlar')}
            htmlFor="ob-ach"
            optional={!0}
          >
            <Textarea
              id="ob-ach"
              value={d.achievements}
              onChange={(f) =>
                A({
                  achievements: f.target.value,
                })
              }
            />
          </Field>
        </div>
      )),
    m === 2 &&
      (I = (
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={u('IELTS overall', 'IELTS umumiy')} htmlFor="ob-ielts" optional={!0} error={E.ielts}>
              <Input
                id="ob-ielts"
                inputMode="decimal"
                value={d.ielts ?? ''}
                onChange={(f) =>
                  A({
                    ielts: ni(f.target.value),
                  })
                }
              />
            </Field>
            <Field label="TOEFL iBT" htmlFor="ob-toefl" optional={!0} error={E.toefl}>
              <Input
                id="ob-toefl"
                inputMode="numeric"
                value={d.toefl ?? ''}
                onChange={(f) =>
                  A({
                    toefl: ni(f.target.value),
                  })
                }
              />
            </Field>
            <Field label="SAT" htmlFor="ob-sat" optional={!0} error={E.sat}>
              <Input
                id="ob-sat"
                inputMode="numeric"
                value={d.sat ?? ''}
                onChange={(f) =>
                  A({
                    sat: ni(f.target.value),
                  })
                }
              />
            </Field>
          </div>
          {d.ielts !== void 0 && (
            <fieldset>
              <legend className="mb-2 text-[13px] font-semibold">
                {u('IELTS components (if available)', 'IELTS bo‘limlari (bo‘lsa)')}
              </legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {['l', 'r', 'w', 's'].map((f) => {
                  var M;
                  return (
                    <Field
                      htmlFor={`ob-ip-${f}`}
                      label={
                        {
                          l: u('Listening', 'Tinglash'),
                          r: u('Reading', 'O‘qish'),
                          w: u('Writing', 'Yozish'),
                          s: u('Speaking', 'Gapirish'),
                        }[f]
                      }
                      key={f}
                    >
                      <Input
                        id={`ob-ip-${f}`}
                        inputMode="decimal"
                        value={((M = d.ieltsParts) == null ? void 0 : M[f]) ?? ''}
                        onChange={(D) =>
                          A({
                            ieltsParts: {
                              ...d.ieltsParts,
                              [f]: ni(D.target.value),
                            },
                          })
                        }
                      />
                    </Field>
                  );
                })}
              </div>
            </fieldset>
          )}
          <Field
            label={u('Other language qualifications', 'Boshqa til sertifikatlari')}
            htmlFor="ob-ol"
            optional={!0}
            hint={u(
              'e.g. TOPIK 3, JLPT N3, Goethe B1, Duolingo English Test',
              'masalan, TOPIK 3, JLPT N3, Goethe B1, Duolingo English Test',
            )}
          >
            <Input
              id="ob-ol"
              value={d.otherLanguage}
              onChange={(f) =>
                A({
                  otherLanguage: f.target.value,
                })
              }
            />
          </Field>
          <CmpHa
            checked={d.planningExam}
            onChange={(f) =>
              A({
                planningExam: f,
              })
            }
            label={u('I plan to take a language test', 'Til imtihonini topshirishni rejalashtiryapman')}
          />
          <Callout>
            {u(
              'No certificate yet? That is fine. Many students apply after taking a test. EduBridge will mark language checks as “missing information” rather than “not eligible”.',
              'Hali sertifikat yo‘qmi? Hechqisi yo‘q. Ko‘p talabalar imtihondan keyin ariza beradi. EduBridge til tekshiruvini “mos emas” emas, “ma’lumot yetishmaydi” deb belgilaydi.',
            )}
          </Callout>
        </div>
      )),
    m === 3 &&
      (I = (
        <div className="flex flex-col gap-5">
          <Field label={u('Currency for your budget', 'Byudjet valyutasi')} htmlFor="ob-cur2">
            <Select
              id="ob-cur2"
              value={d.currency}
              onChange={(f) =>
                A({
                  currency: f.target.value,
                })
              }
              className="max-w-xs"
            >
              <option value="USD">USD ($)</option>
              <option value="UZS">UZS (so‘m)</option>
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={u('Maximum tuition per year', 'Yiliga maksimal o‘qish to‘lovi')}
              htmlFor="ob-tb"
              optional={!0}
              error={E.tuitionBudget}
              hint={u(
                'Tuition only — fees paid to the university.',
                'Faqat o‘qish to‘lovi — universitetga to‘lanadigan summa.',
              )}
            >
              <Input
                id="ob-tb"
                inputMode="numeric"
                value={d.tuitionBudget ?? ''}
                onChange={(f) =>
                  A({
                    tuitionBudget: ni(f.target.value),
                  })
                }
              />
            </Field>
            <Field
              label={u('Maximum total cost per year', 'Yiliga maksimal umumiy xarajat')}
              htmlFor="ob-tot"
              optional={!0}
              error={E.totalBudget}
              hint={u(
                'Tuition plus rent, food, transport, insurance and travel.',
                'O‘qish, ijara, ovqat, transport, sug‘urta va yo‘l xarajatlari birga.',
              )}
            >
              <Input
                id="ob-tot"
                inputMode="numeric"
                value={d.totalBudget ?? ''}
                onChange={(f) =>
                  A({
                    totalBudget: ni(f.target.value),
                  })
                }
              />
            </Field>
          </div>
          <div className="flex flex-col gap-3">
            <CmpHa
              checked={d.needsFullFunding}
              onChange={(f) =>
                A({
                  needsFullFunding: f,
                })
              }
              label={u('I need full funding to study abroad', 'Xorijda o‘qish uchun to‘liq moliyalashtirish kerak')}
            />
            <CmpHa
              checked={d.partialOk}
              onChange={(f) =>
                A({
                  partialOk: f,
                })
              }
              label={u('Partial scholarships are acceptable', 'Qisman grantlar ham ma’qul')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={u('Can you afford application fees?', 'Ariza to‘lovlarini to‘lay olasizmi?')}
              htmlFor="ob-fee"
            >
              <Select
                id="ob-fee"
                value={d.feesAffordable}
                onChange={(f) =>
                  A({
                    feesAffordable: f.target.value,
                  })
                }
              >
                <option value="yes">{c('m.yes')}</option>
                <option value="some">{u('A few', 'Bir nechtasini')}</option>
                <option value="no">{c('m.no')}</option>
              </Select>
            </Field>
            <Field
              label={u(
                'Can you show proof of funds if required?',
                'Kerak bo‘lsa, mablag‘ borligini isbotlay olasizmi?',
              )}
              htmlFor="ob-funds"
            >
              <Select
                id="ob-funds"
                value={d.canShowFunds}
                onChange={(f) =>
                  A({
                    canShowFunds: f.target.value,
                  })
                }
              >
                <option value="yes">{c('m.yes')}</option>
                <option value="partly">{c('m.partial')}</option>
                <option value="no">{c('m.no')}</option>
                <option value="unsure">{u('Not sure', 'Bilmayman')}</option>
              </Select>
            </Field>
          </div>
        </div>
      )),
    m === 4 &&
      (I = (
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-[13px] font-semibold">
              {u('Countries you are interested in', 'Qiziqqan davlatlaringiz')}
            </p>
            <div className="flex flex-wrap gap-2">
              {ms.map((f) => (
                <Pa active={d.preferredCountries.includes(f)} onClick={() => N('preferredCountries', f)} key={f}>
                  {l(we[f])}
                </Pa>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[13px] font-semibold">
              {u('Countries you want to avoid', 'Istamagan davlatlaringiz')}{' '}
              <span className="font-normal text-faint">
                {'· '}
                {c('m.optional')}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {ms.map((f) => (
                <Pa active={d.avoidCountries.includes(f)} onClick={() => N('avoidCountries', f)} key={f}>
                  {l(we[f])}
                </Pa>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={u('Language of instruction', 'O‘qitish tili')} htmlFor="ob-ins">
              <Select
                id="ob-ins"
                value={d.instructionPref}
                onChange={(f) =>
                  A({
                    instructionPref: f.target.value,
                  })
                }
              >
                <option value="English">{u('English only', 'Faqat ingliz tili')}</option>
                <option value="any">{u('Open to other languages', 'Boshqa tillar ham mumkin')}</option>
              </Select>
            </Field>
            <Field label={u('Public or private', 'Davlat yoki xususiy')} htmlFor="ob-sec">
              <Select
                id="ob-sec"
                value={d.sectorPref}
                onChange={(f) =>
                  A({
                    sectorPref: f.target.value,
                  })
                }
              >
                <option value="any">{c('m.any')}</option>
                <option value="public">{u('Public', 'Davlat')}</option>
                <option value="private">{u('Private', 'Xususiy')}</option>
              </Select>
            </Field>
            <Field label={u('Programme length', 'Dastur davomiyligi')} htmlFor="ob-dur">
              <Select
                id="ob-dur"
                value={d.durationPref}
                onChange={(f) =>
                  A({
                    durationPref: f.target.value,
                  })
                }
              >
                <option value="any">{c('m.any')}</option>
                <option value="short">{u('As short as possible', 'Imkon qadar qisqa')}</option>
                <option value="standard">{u('Standard length', 'Standart')}</option>
              </Select>
            </Field>
            <Field label={u('Programme focus', 'Dastur yo‘nalganligi')} htmlFor="ob-ori">
              <Select
                id="ob-ori"
                value={d.orientationPref}
                onChange={(f) =>
                  A({
                    orientationPref: f.target.value,
                  })
                }
              >
                <option value="any">{c('m.any')}</option>
                <option value="research">{u('Research-oriented', 'Ilmiy yo‘nalishda')}</option>
                <option value="employment">{u('Employment-oriented', 'Ishga yo‘naltirilgan')}</option>
              </Select>
            </Field>
          </div>
          <Field
            label={u('Anything else that matters to you', 'Siz uchun muhim boshqa jihatlar')}
            htmlFor="ob-char"
            optional={!0}
            hint={u(
              'e.g. small classes, Muslim-friendly campus, internships, city size. Rankings are not used as a measure of quality.',
              'masalan, kichik guruhlar, amaliyot imkoniyati, shahar kattaligi. Reytinglar sifat o‘lchovi sifatida ishlatilmaydi.',
            )}
          >
            <Textarea
              id="ob-char"
              value={d.characteristics}
              onChange={(f) =>
                A({
                  characteristics: f.target.value,
                })
              }
            />
          </Field>
        </div>
      )),
    m === 5 &&
      (I = (
        <div className="flex flex-col gap-4">
          <Callout>
            {u(
              'Describe real experiences in your own words. Leave anything blank that does not apply — not every university asks for extracurricular activities.',
              'Haqiqiy tajribangizni o‘z so‘zlaringiz bilan yozing. Tegishli bo‘lmaganini bo‘sh qoldiring — har bir universitet darsdan tashqari faoliyatni so‘ramaydi.',
            )}
          </Callout>
          <Field
            label={u('Years of work experience', 'Ish tajribasi (yil)')}
            htmlFor="ob-work"
            optional={!0}
            error={E.workYears}
            hint={u(
              'Some master’s scholarships require work experience.',
              'Ayrim magistratura grantlari ish tajribasini talab qiladi.',
            )}
          >
            <Input
              id="ob-work"
              inputMode="decimal"
              className="max-w-[160px]"
              value={d.workYears ?? ''}
              onChange={(f) =>
                A({
                  workYears: ni(f.target.value),
                })
              }
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            {K.map(({ k: f, l: M }) => (
              <Field label={M} htmlFor={`ob-x-${f}`} optional={!0} key={f}>
                <Textarea
                  id={`ob-x-${f}`}
                  className="min-h-[76px]"
                  value={d.experiences[f] ?? ''}
                  placeholder={u(
                    'What did you do, when, and what happened?',
                    'Nima qildingiz, qachon va natija qanday bo‘ldi?',
                  )}
                  onChange={(D) =>
                    A({
                      experiences: {
                        ...d.experiences,
                        [f]: D.target.value,
                      },
                    })
                  }
                />
              </Field>
            ))}
          </div>
        </div>
      )),
    m === 6)
  ) {
    const f = (R, _) => (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-3 border-b border-line py-2 text-[14px] last:border-0">
          <dt className="text-muted">{R}</dt>
          <dd className="min-w-0 break-words font-semibold">
            {_ || <span className="font-normal text-faint">—</span>}
          </dd>
        </div>
      ),
      M = (R, _, de) => (
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-bold">{R}</p>
            <Button size="sm" variant="ghost" icon={<Pencil size={14} />} onClick={() => U(_)}>
              {c('a.edit')}
            </Button>
          </div>
          <dl>{de}</dl>
        </Card>
      ),
      D = {
        percent: '%',
        gpa4: '/ 4',
        gpa5: '/ 5',
        five_point_uz: u('/ 5 (Uzbek scale)', '/ 5 (O‘zb. tizimi)'),
        other: d.scaleOther ?? '',
      };
    I = (
      <div className="grid gap-4 md:grid-cols-2">
        {M(
          q[0],
          0,
          <>
            {f(u('Name', 'Ism'), d.name)}
            {f(u('Citizenship', 'Fuqarolik'), d.citizenship)}
            {f(u('Degree', 'Daraja'), c(`lvl.${d.targetLevel}`))}
            {f(u('Field', 'Yo‘nalish'), l(xe[d.field]))}
            {f(u('Application year', 'Ariza yili'), `${d.applicationYear}${d.intake ? ` · ${d.intake}` : ''}`)}
            {f(u('Birth year', 'Tug‘ilgan yil'), d.birthYear)}
          </>,
        )}
        {M(
          q[1],
          1,
          <>
            {f(u('Qualification', 'Ma’lumot'), d.qualification)}
            {f(u('Institution', 'Muassasa'), d.institution)}
            {f(u('Score', 'Baho'), d.score !== void 0 ? `${d.score} ${D[d.scale]}` : '')}
            {f(u('Graduation', 'Bitirish'), d.graduationYear)}
          </>,
        )}
        {M(
          q[2],
          2,
          <>
            {f('IELTS', d.ielts)}
            {f('TOEFL', d.toefl)}
            {f('SAT', d.sat)}
            {f(u('Other', 'Boshqa'), d.otherLanguage)}
            {f(u('Planning a test', 'Imtihon rejasi'), d.planningExam ? c('m.yes') : c('m.no'))}
          </>,
        )}
        {M(
          q[3],
          3,
          <>
            {f(
              u('Tuition budget / year', 'O‘qish byudjeti / yil'),
              d.tuitionBudget !== void 0 ? `${d.tuitionBudget.toLocaleString()} ${d.currency}` : '',
            )}
            {f(
              u('Total budget / year', 'Umumiy byudjet / yil'),
              d.totalBudget !== void 0 ? `${d.totalBudget.toLocaleString()} ${d.currency}` : '',
            )}
            {f(u('Needs full funding', 'To‘liq moliyalashtirish'), d.needsFullFunding ? c('m.yes') : c('m.no'))}
            {f(u('Partial OK', 'Qisman ma’qul'), d.partialOk ? c('m.yes') : c('m.no'))}
          </>,
        )}
        {M(
          q[4],
          4,
          <>
            {f(u('Preferred', 'Afzal'), d.preferredCountries.map((R) => l(we[R])).join(', '))}
            {f(u('Avoid', 'Istalmagan'), d.avoidCountries.map((R) => l(we[R])).join(', '))}
            {f(u('Instruction', 'O‘qitish tili'), d.instructionPref === 'English' ? 'English' : c('m.any'))}
          </>,
        )}
        {M(
          q[5],
          5,
          <>
            {f(u('Work experience', 'Ish tajribasi'), d.workYears !== void 0 ? `${d.workYears}` : '')}
            {f(
              u('Experiences described', 'Tavsiflangan tajribalar'),
              String(Object.values(d.experiences).filter((R) => R && R.trim()).length),
            )}
          </>,
        )}
      </div>
    );
  }
  return (
    <div className="min-h-full">
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="gutter mx-auto flex h-16 max-w-4xl items-center justify-between gap-3">
          <Logo onClick={() => n(a.profile ? 'dashboard' : 'home')} />
          <div className="flex items-center gap-2">
            <LangSwitch />
            <Button size="sm" variant="ghost" onClick={() => n(a.profile ? 'dashboard' : 'home')}>
              {u('Save & exit', 'Saqlash va chiqish')}
            </Button>
          </div>
        </div>
      </header>
      <main id="main" className="gutter mx-auto max-w-4xl py-8">
        <div className="flex items-end gap-3 sm:gap-4">
          <Mascot
            framing="head"
            action="nod"
            actionKey={m}
            className={
              x === 'duo'
                ? 'h-[84px] w-[150px] shrink-0 sm:h-[104px] sm:w-[186px]'
                : 'h-[84px] w-[84px] shrink-0 sm:h-[104px] sm:w-[104px]'
            }
            label={u('EduBridge mascot', 'EduBridge maskoti')}
          />
          <div className="min-w-0 pb-1">
            <p className="eyebrow">
              {p
                ? u('Edit profile', 'Profilni tahrirlash')
                : u('Build your student profile', 'Talaba profilingizni yarating')}
            </p>
            <h1 className="mt-0.5 text-[24px] font-extrabold sm:text-[26px]">{q[m]}</h1>
            <SpeechBubble className="mt-2 hidden max-w-xl font-medium sm:block">{F[m]}</SpeechBubble>
          </div>
        </div>
        <p className="mt-3 rounded-xl bg-teal-soft/60 px-3 py-2 text-[13.5px] text-fg/90 sm:hidden">{F[m]}</p>
        <ol className="mt-4 flex gap-1.5" aria-label={u('Progress', 'Jarayon')}>
          {q.map((f, M) => (
            <li className="flex-1" key={f}>
              <button
                type="button"
                onClick={() => (M < m || p ? U(M) : void 0)}
                aria-current={M === m ? 'step' : void 0}
                aria-label={`${M + 1}. ${f}`}
                className={classNames(
                  'h-1.5 w-full rounded-full',
                  M <= m ? 'bg-teal' : 'bg-line',
                  (M < m || p) && 'cursor-pointer',
                )}
              />
              <span
                className={classNames(
                  'mt-1.5 hidden text-[11.5px] font-semibold sm:block',
                  M === m ? 'text-fg' : 'text-faint',
                )}
              >
                {f}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[12.5px] text-faint sm:hidden">
          {u(`Step ${m + 1} of ${q.length}`, `${q.length} qadamdan ${m + 1}-qadam`)}
        </p>
        <div className="mt-6">{I}</div>
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
          <Button icon={<ArrowLeft size={16} />} disabled={m === 0} onClick={() => U(m - 1)}>
            {c('a.back')}
          </Button>
          {m < q.length - 1 ? (
            <Button variant="primary" onClick={() => U(m + 1)}>
              {c('a.next')} <ArrowRight size={16} />
            </Button>
          ) : (
            <Button variant="primary" icon={<Check size={16} />} onClick={j}>
              {p
                ? u('Save changes', 'O‘zgarishlarni saqlash')
                : u('Save profile & see my dashboard', 'Profilni saqlash va panelni ko‘rish')}
            </Button>
          )}
        </div>
        {!p && (
          <p className="mt-3 text-[12.5px] text-faint">
            {u(
              'Your answers are saved in this browser as you go, so you can leave and come back.',
              'Javoblaringiz shu brauzerda avtomatik saqlanadi — chiqib, keyin qaytishingiz mumkin.',
            )}
          </p>
        )}
      </main>
    </div>
  );
}
