import React from 'react';
import { useSession } from '../sync/session';
import { AccountPanel } from '../sync/AccountPanel';
import * as jsxRuntime from 'react/jsx-runtime';
import { Database, Languages, RefreshCcw, ShieldCheck, Sparkles, Trash2, UserRound } from 'lucide-react';
import { useStore } from '../store/store';
import { useI18n } from '../lib/derived';
import { Badge, Button, Callout, Card, CmpHa, Field, Input, PageHeader, Select } from '../components/ui';
import { LangSwitch } from '../components/layout';
import { Cmp_g } from './onboarding';
import { Un } from '../lib/ai';
import { cy } from './budget';
import { Wa, ho } from '../lib/core';
import { we } from '../lib/catalog';

export function SettingsPage() {
  const {
      state: e,
      setLiveAI: a,
      setDisplayCurrency: t,
      setRate: n,
      resetRates: s,
      resetAll: r,
      navigate: o,
      notify: u,
    } = useStore(),
    { tx: l } = useI18n(),
    [c, p] = React.useState('checking'),
    d = cy(),
    [h, m] = React.useState(!1);
  const session = useSession();
  React.useEffect(() => {
    p('checking');
    Un().then(p);
  }, [session.status]);
  const y = ['UZS', 'EUR', 'GBP', 'MYR', 'TRY', 'HUF', 'KRW', 'JPY'];
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow={l('Settings', 'Sozlamalar')}
        title={l('Settings and your data', 'Sozlamalar va ma’lumotlaringiz')}
      />
      <AccountPanel />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="flex flex-col gap-4 p-5">
          <p className="flex items-center gap-2 font-bold">
            <Languages size={17} />
            {l('Language and currency', 'Til va valyuta')}
          </p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[14px]">{l('Interface language', 'Interfeys tili')}</span>
            <LangSwitch />
          </div>
          <Cmp_g />
          <Field label={l('Show converted amounts in', 'Aylantirilgan summalarni ko‘rsatish')} htmlFor="s-disp">
            <Select id="s-disp" value={e.displayCurrency} onChange={(E) => t(E.target.value)}>
              <option value="USD">USD</option>
              <option value="UZS">UZS</option>
            </Select>
          </Field>
          <div>
            <p className="mb-2 text-[13px] font-semibold">
              {l('Exchange rates (value of 1 unit in USD)', 'Valyuta kurslari (1 birlikning USD dagi qiymati)')}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {y.map((E) => (
                <Field label={E} htmlFor={`r-${E}`} key={E}>
                  <Input
                    id={`r-${E}`}
                    inputMode="decimal"
                    className="h-9 text-[13px]"
                    value={E === 'UZS' ? Math.round(1 / e.rates.UZS) : e.rates[E]}
                    onChange={(C) => {
                      const v = Number(C.target.value.replace(',', '.'));
                      !v || v <= 0 || n(E, E === 'UZS' ? 1 / v : v);
                    }}
                  />
                </Field>
              ))}
            </div>
            <p className="mt-1.5 text-[12.5px] text-muted">
              {l(
                'UZS is entered as so‘m per 1 USD. Defaults are illustrative, not live market rates. Update them before relying on any converted figure.',
                'UZS 1 USD uchun so‘mda kiritiladi. Standart qiymatlar taxminiy, real bozor kursi emas. Aylantirilgan raqamlarga tayanishdan oldin yangilang.',
              )}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-1"
              icon={<RefreshCcw size={14} />}
              onClick={() => {
                (s(), u(l('Rates reset to defaults', 'Kurslar standart holatga qaytarildi')));
              }}
            >
              {l('Reset rates', 'Kurslarni tiklash')}
            </Button>
          </div>
        </Card>
        <Card className="flex flex-col gap-4 p-5">
          <p className="flex items-center gap-2 font-bold">
            <Sparkles size={17} />
            {l('AI assistance', 'SI yordami')}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[14px]">
            <span>{l('Live AI:', 'Jonli SI:')}</span>
            {c === 'checking' ? (
              <Badge>{l('Checking…', 'Tekshirilmoqda…')}</Badge>
            ) : c === 'server' ? (
              <Badge tone="ok">{l('Available', 'Mavjud')}</Badge>
            ) : session.status !== 'user' ? (
              <Badge tone="warn">{l('Sign in to use live AI', 'Jonli SI uchun kiring')}</Badge>
            ) : (
              <Badge tone="warn">{l('Not available right now', 'Hozir mavjud emas')}</Badge>
            )}
          </div>
          <CmpHa
            checked={!e.aiOff}
            onChange={(E) => {
              (a(E),
                u(
                  E
                    ? l(
                        'Live AI on for the assistant and writing feedback',
                        'Yordamchi va matn tahlili uchun jonli SI yoqildi',
                      )
                    : l(
                        'Live AI off — only rule-based checks',
                        'Jonli SI o‘chirildi — faqat qoidaga asoslangan tekshiruvlar',
                      ),
                ));
            }}
            label={l('Use live AI when available', 'Mavjud bo‘lsa jonli SI dan foydalanish')}
          />
          <Callout>
            {l(
              'Without live AI, the assistant and writing feedback use deterministic, rule-based answers built from your saved data, clearly labelled as rule-based. Matching, eligibility, deadlines and budgets never depend on AI.',
              'Jonli SI bo‘lmasa, yordamchi va matn tahlili saqlangan ma’lumotlaringiz asosidagi qoidaga asoslangan javoblardan foydalanadi va “qoidaga asoslangan” deb belgilanadi. Moslik, talablar, muddatlar va byudjet hech qachon SI ga bog‘liq emas.',
            )}
          </Callout>
        </Card>
        <Card className="flex flex-col gap-3 p-5">
          <p className="flex items-center gap-2 font-bold">
            <ShieldCheck size={17} />
            {l('Where the data comes from', 'Ma’lumotlar qayerdan olinadi')}
          </p>
          <p className="text-[14px] text-fg/90">
            {l(
              'University and scholarship records come only from official university, government and programme websites. You can see every record, its sources, what is missing and what needs rechecking.',
              'Universitet va grant yozuvlari faqat rasmiy universitet, davlat va dastur saytlaridan olinadi. Har bir yozuv, uning manbalari, nima yetishmayotgani va nimani qayta tekshirish kerakligini ko‘rishingiz mumkin.',
            )}
          </p>
          {d !== 'denied' && d !== 'checking' && (
            <Button className="self-start" onClick={() => o('data')}>
              {l('Open data review', 'Ma’lumotlarni ko‘rib chiqish')}
            </Button>
          )}
        </Card>
        <Card className="flex flex-col gap-3 p-5">
          <p className="flex items-center gap-2 font-bold">
            <Database size={17} />
            {l('What EduBridge stores', 'EduBridge nimalarni saqlaydi')}
          </p>
          <ul className="list-disc pl-5 text-[14px] text-fg/90">
            <li>
              {l(
                'Your profile answers, saved opportunities, plans, tasks, calendar dates, drafts, budget scenarios and settings.',
                'Profil javoblaringiz, saqlangan imkoniyatlar, rejalar, vazifalar, taqvim sanalari, qoralamalar, byudjet ssenariylari va sozlamalar.',
              )}
            </li>
            <li>
              {l(
                'Without an account everything stays in this browser. When you sign in, your data is also saved on the EduBridge server; you can download or delete it in the Account card above.',
                'Akkauntsiz hamma narsa shu brauzerda qoladi. Kirsangiz, ma’lumotlaringiz EduBridge serverida ham saqlanadi; ularni yuqoridagi Akkaunt kartasida yuklab olish yoki o‘chirish mumkin.',
              )}
            </li>
            <li>
              {l(
                'Uploaded files are never stored: transcripts are checked and discarded; checklist attachments record only the file name.',
                'Yuklangan fayllar saqlanmaydi: transkript tekshirilib, o‘chiriladi; ro‘yxatdagi biriktirmalar faqat fayl nomini yozadi.',
              )}
            </li>
            <li>
              {l(
                'If you use live AI, your question and relevant profile details are sent to the AI provider to generate the answer.',
                'Jonli SI dan foydalansangiz, javob tayyorlash uchun savolingiz va tegishli profil ma’lumotlari SI provayderiga yuboriladi.',
              )}
            </li>
          </ul>
          <p className="text-[12.5px] text-muted">
            {l(
              'Accounts store only your sign-in id. EduBridge makes no claim of legal compliance.',
              'Akkauntlar faqat kirish identifikatoringizni saqlaydi. EduBridge qonunchilikka muvofiqlikni da’vo qilmaydi.',
            )}
          </p>
        </Card>
        <Card className="flex flex-col gap-3 p-5">
          <p className="flex items-center gap-2 font-bold">
            <UserRound size={17} />
            {l('Profile and data', 'Profil va ma’lumotlar')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => o('onboarding', 'edit')}>{l('Edit my profile', 'Profilimni tahrirlash')}</Button>
            <Button onClick={() => o('demo')}>{l('Switch to a demo student', 'Namoyish talabasiga o‘tish')}</Button>
          </div>
          {h ? (
            <div className="rounded-lg border border-bad/30 bg-bad-soft p-3 text-[14px]">
              <p className="font-semibold">
                {l(
                  'Delete everything stored in this browser? This cannot be undone.',
                  'Shu brauzerdagi barcha ma’lumotlar o‘chirilsinmi? Buni qaytarib bo‘lmaydi.',
                )}
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="danger"
                  icon={<Trash2 size={15} />}
                  onClick={() => {
                    r();
                    try {
                      localStorage.removeItem('edubridge:doc-checks');
                    } catch {}
                    (u(l('All local data deleted', 'Barcha mahalliy ma’lumotlar o‘chirildi')), o('home'));
                  }}
                >
                  {l('Delete all data', 'Hammasini o‘chirish')}
                </Button>
                <Button onClick={() => m(!1)}>{l('Cancel', 'Bekor qilish')}</Button>
              </div>
            </div>
          ) : (
            <Button variant="danger" className="self-start" icon={<Trash2 size={15} />} onClick={() => m(!0)}>
              {l('Delete all my data', 'Barcha ma’lumotlarimni o‘chirish')}
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
export const Yq = [
  {
    type: 'conflict',
    kind: 'university',
    id: 'jeonju-university-kr',
    field: 'tuition',
    values: [
      {
        level: 'bachelor',
        amount_min: 3665e3,
        amount_max: 4788e3,
        currency: 'KRW',
        per: 'semester',
        academic_year: null,
        note: 'Korean Track by college',
        source_url: 'https://global.jj.ac.kr/global/academics/track01.do',
      },
      {
        level: 'bachelor',
        amount_min: 3915e3,
        amount_max: null,
        currency: 'KRW',
        per: 'semester',
        academic_year: null,
        note: 'English Track (International Studies: Business Admin, Intl Hospitality & Tourism); excl. insurance',
        source_url: 'https://global.jj.ac.kr/global/academics/track02.do',
      },
    ],
    reason: 'two sources give different fees for the same level and year; newer kept',
    at: '2026-10-28',
    resolved: !1,
  },
  {
    type: 'conflict',
    kind: 'university',
    id: 'jeonju-university-kr',
    field: 'tuition',
    values: [
      {
        level: 'bachelor',
        amount_min: 3915e3,
        amount_max: null,
        currency: 'KRW',
        per: 'semester',
        academic_year: null,
        note: 'English Track (International Studies: Business Admin, Intl Hospitality & Tourism); excl. insurance',
        source_url: 'https://global.jj.ac.kr/global/academics/track02.do',
      },
      {
        level: 'bachelor',
        amount_min: 3665e3,
        amount_max: 4788e3,
        currency: 'KRW',
        per: 'semester',
        academic_year: null,
        note: 'Korean Track by college',
        source_url: 'https://global.jj.ac.kr/global/academics/track01.do',
      },
    ],
    reason: 'two sources give different fees for the same level and year; newer kept',
    at: '2026-10-28',
    resolved: !1,
  },
  {
    type: 'conflict',
    kind: 'university',
    id: 'nus-sg',
    field: 'tuition',
    values: [
      {
        level: 'bachelor',
        amount_min: 33400,
        amount_max: 190150,
        currency: 'SGD',
        per: 'year',
        academic_year: '2026/27',
        note: 'Without Tuition Grant (non-subsidised); Dentistry/Medicine highest',
        source_url:
          'https://nus.edu.sg/registrar/docs/default-source/administrative-policies-procedures/ugtuitioncurrent.pdf',
      },
      {
        level: 'bachelor',
        amount_min: 21400,
        amount_max: 87800,
        currency: 'SGD',
        per: 'year',
        academic_year: '2026/27',
        note: 'Non-ASEAN international students WITH MOE Tuition Grant (service bond); Medicine highest',
        source_url:
          'https://nus.edu.sg/registrar/docs/default-source/administrative-policies-procedures/ugtuitioncurrent.pdf',
      },
    ],
    reason: 'two sources give different fees for the same level and year; newer kept',
    at: '2026-10-28',
    resolved: !1,
  },
  {
    type: 'conflict',
    kind: 'university',
    id: 'nus-sg',
    field: 'tuition',
    values: [
      {
        level: 'bachelor',
        amount_min: 21400,
        amount_max: 87800,
        currency: 'SGD',
        per: 'year',
        academic_year: '2026/27',
        note: 'Non-ASEAN international students WITH MOE Tuition Grant (service bond); Medicine highest',
        source_url:
          'https://nus.edu.sg/registrar/docs/default-source/administrative-policies-procedures/ugtuitioncurrent.pdf',
      },
      {
        level: 'bachelor',
        amount_min: 33400,
        amount_max: 190150,
        currency: 'SGD',
        per: 'year',
        academic_year: '2026/27',
        note: 'Without Tuition Grant (non-subsidised); Dentistry/Medicine highest',
        source_url:
          'https://nus.edu.sg/registrar/docs/default-source/administrative-policies-procedures/ugtuitioncurrent.pdf',
      },
    ],
    reason: 'two sources give different fees for the same level and year; newer kept',
    at: '2026-10-28',
    resolved: !1,
  },
];
const Wq = '2026-10-28T18:55:26.788Z';
const Vq = [
  {
    file: 'apply_links.patch.json',
    records: 28,
    kind: 'patch',
  },
];
const Qq = 0;
const Xq = 0;
export const Jq = {
  ranAt: Wq,
  files: Vq,
  droppedFacts: Qq,
  conflicts: Xq,
};
const Zq =
  /(topuniversities|timeshighereducation|studyportals|mastersportal|bachelorsportal|idp\.com|leverageedu|shiksha|collegedunia|scholars4dev|opportunitiesforyouth|wikipedia|facebook|instagram|youtube|medium\.com|blogspot|quora|reddit)/i;
export const Ou = (e) => {
  try {
    return new URL(e).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};
export const ko = (e) =>
  e
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
export const Gh = [
  ...Wa.map((e) => ({
    id: e.id,
    kind: 'university',
    name: e.name,
    country: e.country,
    verification: e.verification,
    lastChecked: e.last_checked,
    url: e.website,
    missing: [
      !e.tuition.length && 'tuition',
      !e.english_requirement && 'english',
      !e.deadlines.length && 'deadline',
      !e.city && 'city',
      !e.apply_url && 'apply link',
    ].filter(Boolean),
  })),
  ...ho.map((e) => ({
    id: e.id,
    kind: 'scholarship',
    name: e.name,
    country: e.country_of_study,
    verification: e.verification,
    lastChecked: e.last_checked,
    url: e.url,
    missing: [
      !e.deadline.date && 'deadline',
      !e.funding_type && 'funding type',
      e.uzbekistan_eligible === null && 'Uzbek eligibility',
      !e.language_rule && 'language rule',
    ].filter(Boolean),
  })),
];
export function Hh(e) {
  let a;
  try {
    a = JSON.parse(e);
  } catch {
    return {
      items: [],
      error: 'Not valid JSON.',
    };
  }
  const t = Array.isArray(a) ? a : a == null ? void 0 : a.universities;
  if (!Array.isArray(t))
    return {
      items: [],
      error: 'Expected an array of university records, or an object with a "universities" array.',
    };
  const n = new Map(Wa.map((o) => [`${ko(o.name)}|${o.country}`, o])),
    s = new Map(Wa.map((o) => [Ou(o.website), o])),
    r = new Map(Wa.map((o) => [o.id, o]));
  return {
    items: t.map((o, u) => {
      var h;
      const l = o,
        c = [];
      if (
        (l.id || c.push('missing id'),
        l.name || c.push('missing name'),
        (!l.country || !(l.country in we)) && c.push('missing or unknown country code'),
        (!l.website || !/^https:\/\//.test(l.website)) && c.push('website must be an https URL'),
        [
          l.website,
          l.admissions_url,
          (h = l.english_requirement) == null ? void 0 : h.source_url,
          ...(l.tuition ?? []).map((m) => m.source_url),
          ...(l.deadlines ?? []).map((m) => m.source_url),
        ]
          .filter(Boolean)
          .some((m) => Zq.test(m)) && c.push('uses a non-official source (ranking site, portal, blog or social media)'),
        (l.tuition ?? []).some((m) => !m.source_url) && c.push('a tuition figure has no source URL'),
        (l.deadlines ?? []).some((m) => !m.source_url) && c.push('a deadline has no source URL'),
        l.english_requirement &&
          !l.english_requirement.source_url &&
          c.push('the English requirement has no source URL'),
        c.length)
      )
        return {
          id: l.id ?? `#${u + 1}`,
          name: l.name ?? '—',
          status: 'invalid',
          reasons: c,
        };
      const d = r.get(l.id) ?? n.get(`${ko(l.name)}|${l.country}`) ?? s.get(Ou(l.website));
      return d
        ? {
            id: l.id,
            name: l.name,
            status: 'duplicate',
            reasons: [
              `matches existing record “${d.name}” — would be merged; conflicting values go to the review queue`,
            ],
          }
        : {
            id: l.id,
            name: l.name,
            status: 'new',
            reasons: [],
          };
    }),
  };
}
