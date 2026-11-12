import React from 'react';
import { AccountSignIn } from '../sync/AccountSignIn';
import * as jsxRuntime from 'react/jsx-runtime';
import {
  ArrowRight,
  CircleCheck,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileUp,
  FlaskConical,
  KeyRound,
  ShieldAlert,
  UserPlus,
} from 'lucide-react';
import { Wa, ai, ho, me, useToday } from '../lib/core';
import { Fg, ii, we } from '../lib/catalog';
import { useStore } from '../store/store';
import { Vg, useI18n } from '../lib/derived';
import {
  Badge,
  Button,
  Callout,
  Card,
  CmpOi,
  CmpTn,
  Field,
  Input,
  Pa,
  PageHeader,
  Tabs,
  Textarea,
  classNames,
} from '../components/ui';
import { Gh, Hh, Jq, Ou, Yq, ko } from './settings';

export function DataReviewPage() {
  const { state: e, setOverride: setLocalOverride, publishOverrides: publish, notify: t } = useStore(),
    { tx: n, p: s, lang: r } = useI18n(),
    a = (id, patch) => {
      setLocalOverride(id, patch);
      const next = { ...e.dataOverrides };
      if (patch === null) delete next[id];
      else next[id] = { ...next[id], ...patch };
      publish(next).then((ok) => ok || t(n('Saved on this browser only: sign in as staff to publish.', 'Faqat shu brauzerda saqlandi: e’lon qilish uchun xodim sifatida kiring.')));
    },
    o = useToday(),
    [u, l] = React.useState('records'),
    [c, p] = React.useState('all'),
    [d, h] = React.useState('all'),
    [m, y] = React.useState(''),
    [E, C] = React.useState(''),
    [v, g] = React.useState(null),
    b = (N) => !N.lastChecked || ai(N.lastChecked, o) > Vg,
    S = e.dataOverrides,
    A = React.useMemo(
      () =>
        Gh.filter((N) => {
          var I, f;
          if ((d !== 'all' && N.kind !== d) || (m && !ko(`${N.name} ${N.id} ${N.country}`).includes(ko(m)))) return !1;
          switch (c) {
            case 'partial':
              return N.verification !== 'verified';
            case 'stale':
              return b(N);
            case 'missing':
              return N.missing.length > 0;
            case 'inactive':
              return !!((I = S[N.id]) != null && I.inactive);
            case 'reviewed':
              return !!((f = S[N.id]) != null && f.reviewedAt);
            default:
              return !0;
          }
        }),
      [d, m, c, S],
    ),
    w = Yq.filter((N) => N.kind !== 'university' || Wa.some((I) => I.id === N.id)),
    U = Jq,
    j = new Set(Wa.map((N) => N.country)).size,
    k = Wa.reduce((N, I) => N + I.scholarships.length, 0),
    K = React.useMemo(
      () =>
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            note: 'Local review overrides are stored only in this browser. Records are copied from the EduBridge research database.',
            overrides: S,
            universities: Wa.filter((N) => A.some((I) => I.id === N.id)),
            scholarships: ho.filter((N) => A.some((I) => I.id === N.id)),
          },
          null,
          1,
        ),
      [A, S],
    ),
    x = async () => {
      try {
        (await navigator.clipboard.writeText(K), t(n('Copied to clipboard', 'Nusxa olindi')));
      } catch {
        t(
          n(
            'Copy blocked here — select the text and copy it manually',
            'Nusxa olish bloklandi — matnni belgilab, qo‘lda nusxa oling',
          ),
        );
      }
    },
    F = async () => {
      var N;
      try {
        const I = (N = window.claude) != null && N.use ? await window.claude.use('downloads') : null;
        if (I) {
          await I.save({
            filename: `edubridge-data-${o}.json`,
            data: K,
          });
          return;
        }
      } catch {
        t(n('Download was not completed — use Copy instead', 'Yuklab olish bajarilmadi — nusxa olishdan foydalaning'));
        return;
      }
      try {
        const I = document.createElement('a');
        ((I.href = URL.createObjectURL(
          new Blob([K], {
            type: 'application/json',
          }),
        )),
          (I.download = `edubridge-data-${o}.json`),
          I.click(),
          setTimeout(() => URL.revokeObjectURL(I.href), 2e3));
      } catch {
        t(n('Download blocked here — use Copy instead', 'Yuklab olish bloklandi — nusxa olishdan foydalaning'));
      }
    },
    O = [
      {
        id: 'all',
        label: n('All', 'Hammasi'),
      },
      {
        id: 'partial',
        label: n('Partly verified', 'Qisman tekshirilgan'),
      },
      {
        id: 'stale',
        label: n('Needs rechecking', 'Qayta tekshirish kerak'),
      },
      {
        id: 'missing',
        label: n('Missing fields', 'Maydonlar yetishmaydi'),
      },
      {
        id: 'reviewed',
        label: n('Reviewed', 'Ko‘rib chiqilgan'),
      },
      {
        id: 'inactive',
        label: n('Hidden', 'Yashirilgan'),
      },
    ];
  return (
    <div>
      <PageHeader
        eyebrow={n('Data review', 'Ma’lumotlarni ko‘rib chiqish')}
        title={n('Database and source review', 'Ma’lumotlar bazasi va manbalar')}
        sub={n(
          'Every university and scholarship record, where it came from, and what is still missing.',
          'Har bir universitet va grant yozuvi, uning manbasi va hali nima yetishmayotgani.',
        )}
      />
      <div className="mb-5">
        <Callout tone="warn" icon={<ShieldAlert size={16} aria-hidden={!0} />}>
          <b>{n('Staff tools.', 'Xodimlar uchun vositalar.')}</b>{' '}
          {n(
            'Hiding a record or marking it reviewed is saved on the server and changes what every student sees. Every change is logged.',
            'Yozuvni yashirish yoki ko‘rib chiqilgan deb belgilash serverda saqlanadi va barcha talabalar ko‘radigan narsani o‘zgartiradi. Har bir o‘zgarish qayd etiladi.',
          )}
        </Callout>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <CmpOi
          label={n('Universities', 'Universitetlar')}
          value={Wa.length}
          sub={n(`${j} countries`, `${j} ta davlat`)}
        />
        <CmpOi
          label={n('Fully verified', 'To‘liq tekshirilgan')}
          value={Wa.filter((N) => N.verification === 'verified').length}
          sub={n('rest are partly verified', 'qolganlari qisman')}
        />
        <CmpOi
          label={n('Scholarship programmes', 'Grant dasturlari')}
          value={ho.length}
          sub={n(`+ ${k} university awards`, `+ ${k} ta universitet granti`)}
        />
        <CmpOi
          label={n('Review queue', 'Ko‘rib chiqish navbati')}
          value={w.length}
          sub={n(`last import ${me(U.ranAt.slice(0, 10), r)}`, `oxirgi import ${me(U.ranAt.slice(0, 10), r)}`)}
        />
      </div>
      <div className="mb-4">
        <Tabs
          value={u}
          onChange={l}
          items={[
            {
              id: 'records',
              label: n('Records', 'Yozuvlar'),
              count: Gh.length,
            },
            {
              id: 'queue',
              label: n('Review queue', 'Navbat'),
              count: w.length,
            },
            {
              id: 'import',
              label: n('Check a batch', 'To‘plamni tekshirish'),
            },
            {
              id: 'export',
              label: n('Export', 'Eksport'),
            },
          ]}
        />
      </div>
      {u === 'records' && (
        <Card className="p-4">
          <div className="mb-3 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Input
                className="h-9 sm:max-w-xs"
                placeholder={n('Search name, id or country', 'Nom, id yoki davlat bo‘yicha qidirish')}
                value={m}
                onChange={(N) => y(N.target.value)}
                aria-label={n('Search', 'Qidirish')}
              />
              <Pa active={d === 'all'} onClick={() => h('all')}>
                {n('Both', 'Ikkalasi')}
              </Pa>
              <Pa active={d === 'university'} onClick={() => h('university')}>
                {n('Universities', 'Universitetlar')}
              </Pa>
              <Pa active={d === 'scholarship'} onClick={() => h('scholarship')}>
                {n('Scholarships', 'Grantlar')}
              </Pa>
            </div>
            <div className="flex flex-wrap gap-2">
              {O.map((N) => (
                <Pa active={c === N.id} onClick={() => p(N.id)} key={N.id}>
                  {N.label}
                </Pa>
              ))}
            </div>
            <p className="text-[12.5px] text-muted">{n(`${A.length} shown`, `${A.length} ta ko‘rsatilmoqda`)}</p>
          </div>
          <ul className="flex flex-col divide-y divide-line">
            {A.map((N) => {
              const I = S[N.id];
              return (
                <li
                  className={classNames(
                    'flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between',
                    (I == null ? void 0 : I.inactive) && 'opacity-60',
                  )}
                  key={N.id}
                >
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug">{N.name}</p>
                    <p className="break-all text-[12px] text-faint">
                      {N.id}
                      {' · '}
                      {we[N.country] ? s(we[N.country]) : N.country}
                      {' · '}
                      {N.kind === 'university' ? n('university', 'universitet') : n('scholarship', 'grant')}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge tone={N.verification === 'verified' ? 'ok' : 'warn'}>
                        {N.verification === 'verified'
                          ? n('Verified', 'Tekshirilgan')
                          : n('Partly verified', 'Qisman tekshirilgan')}
                      </Badge>
                      {b(N) && <Badge tone="bad">{n('Needs rechecking', 'Qayta tekshirish kerak')}</Badge>}
                      {N.missing.map((f) => (
                        <Badge key={f}>{n(`no ${f}`, `${f} yo‘q`)}</Badge>
                      ))}
                      {(I == null ? void 0 : I.inactive) && (
                        <Badge tone="bad">{n('Hidden from students', 'Talabalardan yashirilgan')}</Badge>
                      )}
                      {(I == null ? void 0 : I.reviewedAt) && (
                        <Badge tone="info">
                          {n(`Reviewed ${me(I.reviewedAt, r)}`, `${me(I.reviewedAt, r)} da ko‘rilgan`)}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-[12px] text-muted">
                      {n('Last checked', 'Oxirgi tekshiruv')}
                      {': '}
                      {N.lastChecked ? me(N.lastChecked, r) : n('unknown', 'noma’lum')}
                      {' · '}
                      <a className="underline" href={N.url} target="_blank" rel="noopener noreferrer">
                        {Ou(N.url)}
                      </a>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      size="sm"
                      icon={<CircleCheck size={14} />}
                      onClick={() =>
                        a(N.id, {
                          ...I,
                          reviewedAt: o,
                        })
                      }
                    >
                      {n('Mark reviewed', 'Ko‘rildi deb belgilash')}
                    </Button>
                    <Button
                      size="sm"
                      variant={I != null && I.inactive ? 'secondary' : 'ghost'}
                      icon={I != null && I.inactive ? <Eye size={14} /> : <EyeOff size={14} />}
                      onClick={() =>
                        a(N.id, {
                          ...I,
                          inactive: !(I != null && I.inactive),
                        })
                      }
                    >
                      {I != null && I.inactive ? n('Show again', 'Qayta ko‘rsatish') : n('Hide', 'Yashirish')}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      {u === 'queue' && (
        <Card className="p-4">
          <p className="mb-3 text-[14px] text-muted">
            {n(
              'Items the import script would not decide on its own: conflicting values from two official pages, or facts dropped because they had no source. A person must check the official page and fix the batch.',
              'Import skripti o‘zi hal qilmagan holatlar: ikki rasmiy sahifadagi bir-biriga zid qiymatlar yoki manbasiz bo‘lgani uchun olib tashlangan ma’lumotlar. Inson rasmiy sahifani tekshirib, to‘plamni tuzatishi kerak.',
            )}
          </p>
          {w.length ? (
            <ul className="flex flex-col gap-3">
              {w.map((N, I) => {
                var f;
                return (
                  <li className="rounded-lg border border-line p-3 text-[13.5px]" key={I}>
                    <p className="font-semibold">
                      {((f = Wa.find((M) => M.id === N.id)) == null ? void 0 : f.name) ?? N.id}
                    </p>
                    <p className="text-muted">
                      {N.type === 'conflict'
                        ? n(`Conflicting ${N.field} values`, `${N.field} qiymatlari bir-biriga zid`)
                        : (N.reason ?? N.type)}
                    </p>
                    {N.values && (
                      <pre className="mt-2 max-h-48 overflow-auto rounded bg-sunken p-2 text-[11.5px]">
                        {JSON.stringify(N.values, null, 1)}
                      </pre>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[14px]">{n('The queue is empty.', 'Navbat bo‘sh.')}</p>
          )}
          <p className="mt-4 border-t border-line pt-3 text-[12.5px] text-faint">
            {n(
              `Last import: ${U.files.length} batch files, ${U.conflicts} conflicts, ${U.droppedFacts} unsourced facts dropped.`,
              `Oxirgi import: ${U.files.length} ta fayl, ${U.conflicts} ta ziddiyat, manbasiz ${U.droppedFacts} ta ma’lumot olib tashlangan.`,
            )}
          </p>
        </Card>
      )}
      {u === 'import' && (
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-[14px] text-muted">
            {n(
              'Paste or open a JSON batch of university records (see data-batches/UNIVERSITY_SCHEMA.md). EduBridge checks it here — required fields, official-only sources, a source URL for every fact, and duplicates — without changing anything.',
              'Universitet yozuvlaridan iborat JSON to‘plamni joylang yoki oching (data-batches/UNIVERSITY_SCHEMA.md). EduBridge uni shu yerda tekshiradi — majburiy maydonlar, faqat rasmiy manbalar, har bir ma’lumot uchun manba havolasi va takrorlar — hech narsani o‘zgartirmasdan.',
            )}
          </p>
          <Field label={n('Batch JSON', 'To‘plam JSON')} htmlFor="batch">
            <Textarea
              id="batch"
              className="min-h-[160px] font-mono text-[12px]"
              value={E}
              onChange={(N) => C(N.target.value)}
              placeholder={'[{"id": "...", "name": "...", "country": "MY", "website": "https://..."}]'}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={() => g(Hh(E))} disabled={!E.trim()}>
              {n('Check batch', 'Tekshirish')}
            </Button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[14px] font-semibold hover:bg-sunken">
              <FileUp size={15} aria-hidden={!0} />
              {n('Open file', 'Fayl ochish')}
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(N) => {
                  var f;
                  const I = (f = N.target.files) == null ? void 0 : f[0];
                  I &&
                    I.text().then((M) => {
                      (C(M), g(Hh(M)));
                    });
                }}
              />
            </label>
          </div>
          {(v == null ? void 0 : v.error) && <Callout tone="bad">{v.error}</Callout>}
          {v && !v.error && (
            <div>
              <p className="mb-2 text-[13.5px] font-semibold">
                {n(
                  `${v.items.filter((N) => N.status === 'new').length} new · ${v.items.filter((N) => N.status === 'duplicate').length} duplicates · ${v.items.filter((N) => N.status === 'invalid').length} rejected`,
                  `${v.items.filter((N) => N.status === 'new').length} yangi · ${v.items.filter((N) => N.status === 'duplicate').length} takror · ${v.items.filter((N) => N.status === 'invalid').length} rad etilgan`,
                )}
              </p>
              <ul className="flex flex-col gap-1.5 text-[13px]">
                {v.items.map((N, I) => (
                  <li className="flex flex-wrap items-baseline gap-2" key={I}>
                    <Badge tone={N.status === 'new' ? 'ok' : N.status === 'duplicate' ? 'info' : 'bad'}>
                      {N.status === 'new'
                        ? n('New', 'Yangi')
                        : N.status === 'duplicate'
                          ? n('Duplicate', 'Takror')
                          : n('Rejected', 'Rad etildi')}
                    </Badge>
                    <span className="font-semibold">{N.name}</span>
                    {N.reasons.length > 0 && (
                      <span className="text-muted">
                        {'— '}
                        {N.reasons.join('; ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12.5px] text-muted">
                {n(
                  'To publish a checked batch, save it in data-batches/ and run "node scripts/ingest.mjs data-batches/<folder>". The script merges, writes the database and fills the review queue.',
                  'Tekshirilgan to‘plamni chop etish uchun uni data-batches/ ga saqlang va "node scripts/ingest.mjs data-batches/<papka>" ni ishga tushiring. Skript birlashtiradi, bazani yozadi va navbatni to‘ldiradi.',
                )}
              </p>
            </div>
          )}
        </Card>
      )}
      {u === 'export' && (
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-[14px] text-muted">
            {n(
              `Exports the ${A.length} records matching your Records filters, plus your local review marks.`,
              `Yozuvlar filtringizga mos ${A.length} ta yozuv va mahalliy belgilaringiz eksport qilinadi.`,
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" icon={<Copy size={15} />} onClick={x}>
              {n('Copy JSON', 'JSON nusxasini olish')}
            </Button>
            <Button icon={<Download size={15} />} onClick={F}>
              {n('Download', 'Yuklab olish')}
            </Button>
          </div>
          <Textarea
            readOnly={!0}
            className="min-h-[240px] font-mono text-[11.5px]"
            value={K}
            aria-label={n('Exported JSON', 'Eksport qilingan JSON')}
            onFocus={(N) => N.currentTarget.select()}
          />
        </Card>
      )}
    </div>
  );
}
export function Cmp$q({ id: e }) {
  const { navigate: a } = useStore(),
    { tx: t, lang: n } = useI18n(),
    s = {
      about: {
        title: t('About EduBridge', 'EduBridge haqida'),
        body: [
          t(
            'EduBridge helps students from Uzbekistan plan applications to universities and scholarships abroad.',
            'EduBridge — O‘zbekistonlik talabalarga xorijiy universitet va grantlarga ariza topshirishni rejalashtirishda yordam beradi.',
          ),
          t(
            'It teaches students how to navigate the process — finding options, checking published requirements, preparing documents and tracking deadlines — rather than doing the work for them.',
            'U talabalarga jarayonni o‘zlari boshqarishni o‘rgatadi — imkoniyat topish, e’lon qilingan talablarni tekshirish, hujjat tayyorlash va muddatlarni kuzatish — ular o‘rniga ishlamaydi.',
          ),
          t(
            'It is not affiliated with any university, government or scholarship provider.',
            'U hech qanday universitet, hukumat yoki grant tashkiloti bilan bog‘liq emas.',
          ),
        ],
      },
      contact: {
        title: t('Contact', 'Aloqa'),
        body: [
          t(
            'Contact details for the project team have not been published yet.',
            'Loyiha jamoasining aloqa ma’lumotlari hali e’lon qilinmagan.',
          ),
          t(
            'For questions about a specific scholarship or university, contact that institution directly through its official website.',
            'Muayyan grant yoki universitet bo‘yicha savollar uchun shu muassasaning rasmiy sayti orqali bevosita murojaat qiling.',
          ),
        ],
      },
      privacy: {
        title: t('Privacy', 'Maxfiylik'),
        body: [
          t(
            'Without an account, everything you enter stays in your browser. If you sign in, your profile, plans, drafts and settings are also saved on the EduBridge server, linked only to the id your sign-in provider gives us. You can download or delete them in Settings.',
            'Akkauntsiz kiritgan hamma narsangiz brauzeringizda qoladi. Kirsangiz, profil, reja, qoralama va sozlamalaringiz EduBridge serverida ham saqlanadi va faqat kirish provayderi bergan identifikatorga bog‘lanadi. Ularni Sozlamalarda yuklab olish yoki o‘chirish mumkin.',
          ),
          t(
            'Files you choose are checked for type and size and are not stored or uploaded. Only file names are recorded for checklist items.',
            'Tanlagan fayllaringiz turi va hajmi tekshiriladi, saqlanmaydi va yuklanmaydi. Ro‘yxat bandlari uchun faqat fayl nomi yoziladi.',
          ),
          t(
            'If you turn on live AI, your question and relevant profile details are sent to the AI provider to generate a reply.',
            'Jonli SI ni yoqsangiz, javob tayyorlash uchun savolingiz va tegishli profil ma’lumotlari SI provayderiga yuboriladi.',
          ),
          t(
            'You can delete all stored data at any time in Settings. Do not enter passport numbers or other sensitive identifiers.',
            'Saqlangan barcha ma’lumotlarni istalgan vaqtda Sozlamalarda o‘chirishingiz mumkin. Pasport raqami kabi maxfiy ma’lumotlarni kiritmang.',
          ),
        ],
      },
      terms: {
        title: t('Terms of use', 'Foydalanish shartlari'),
        body: [
          t(
            'EduBridge provides general guidance only. It is not legal, immigration or admissions advice.',
            'EduBridge faqat umumiy yo‘l-yo‘riq beradi. Bu huquqiy, migratsiya yoki qabul bo‘yicha maslahat emas.',
          ),
          t(
            'You remain responsible for your decisions, the accuracy of your statements and the content of every application you submit.',
            'Qarorlaringiz, bayonotlaringiz to‘g‘riligi va topshirgan har bir arizangiz mazmuni uchun o‘zingiz javobgarsiz.',
          ),
          t(
            'Do not use EduBridge to produce application content that an institution’s rules prohibit.',
            'EduBridge’dan muassasa qoidalari taqiqlagan ariza mazmunini tayyorlash uchun foydalanmang.',
          ),
        ],
      },
      disclaimer: {
        title: t('Disclaimer', 'Ogohlantirish'),
        body: [
          t(
            'Requirements, fees and deadlines change. Information here may be out of date even when marked verified — the verification date shows when it was last checked.',
            'Talablar, to‘lovlar va muddatlar o‘zgaradi. Bu yerdagi ma’lumot “tekshirilgan” deb belgilangan bo‘lsa ham eskirgan bo‘lishi mumkin — tekshiruv sanasi oxirgi marta qachon ko‘rilganini ko‘rsatadi.',
          ),
          t(
            'Eligibility checks compare your profile with published minimums. Meeting a minimum does not guarantee admission or funding, and EduBridge does not estimate admission chances.',
            'Moslik tekshiruvi profilingizni e’lon qilingan minimumlar bilan solishtiradi. Minimumga mos kelish qabul yoki grantni kafolatlamaydi va EduBridge qabul ehtimolini baholamaydi.',
          ),
          t(
            'Records marked “Demo data” are fictional and exist only to demonstrate the product.',
            '“Namoyish ma’lumoti” deb belgilangan yozuvlar xayoliy va faqat mahsulotni ko‘rsatish uchun mavjud.',
          ),
          t(
            'Exchange rates and living-cost figures are illustrative estimates.',
            'Valyuta kurslari va yashash xarajatlari taxminiy.',
          ),
        ],
      },
      sources: {
        title: t('Official information policy', 'Rasmiy ma’lumotlar siyosati'),
        body: [
          t(
            'Facts about eligibility, coverage and deadlines are taken from official university, government and scholarship-provider sources wherever possible. Secondary sources are named when used.',
            'Talablar, qamrov va muddatlar haqidagi ma’lumotlar iloji boricha rasmiy universitet, hukumat va grant tashkilotlari manbalaridan olinadi. Ikkilamchi manba ishlatilsa, u ko‘rsatiladi.',
          ),
          t(
            'Every record shows its source, a verification status and the date it was last checked. Status values: Verified from official source · Partially verified · Demo data · Outdated, recheck.',
            'Har bir yozuv manbasi, tekshiruv holati va oxirgi tekshiruv sanasini ko‘rsatadi. Holatlar: Rasmiy manbadan tekshirilgan · Qisman tekshirilgan · Namoyish ma’lumoti · Eskirgan, qayta tekshiring.',
          ),
          t(
            'If a deadline is unknown it is shown as “Not announced” or “Not verified” — never as a confirmed date. Unverified dates are never used to schedule tasks.',
            'Muddat noma’lum bo‘lsa, u “E’lon qilinmagan” yoki “Tasdiqlanmagan” deb ko‘rsatiladi — hech qachon tasdiqlangan sana sifatida emas. Tasdiqlanmagan sanalar vazifalarni rejalashtirishda ishlatilmaydi.',
          ),
          t(
            '“Fully funded” appears only when the cited source supports that description, and the exact list of covered and uncovered costs is shown.',
            '“To‘liq moliyalashtirilgan” faqat keltirilgan manba shunday ta’riflaganda ko‘rsatiladi va qoplanadigan hamda qoplanmaydigan xarajatlar aniq ro‘yxatda beriladi.',
          ),
          t(
            'EduBridge does not scrape websites against their terms. Data is curated by hand and can be updated without changing the interface.',
            'EduBridge saytlarni ularning shartlariga zid ravishda yig‘maydi. Ma’lumotlar qo‘lda tanlanadi va interfeysni o‘zgartirmasdan yangilanadi.',
          ),
        ],
      },
    },
    r = s[e] ?? s.about,
    o = ii.filter((u) => u.source.source_type !== 'demo');
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[28px] font-extrabold">{r.title}</h1>
      <div className="mt-4 flex flex-col gap-3 text-[15.5px] leading-relaxed text-fg/90">
        {r.body.map((u) => (
          <p key={u}>{u}</p>
        ))}
      </div>
      {e === 'sources' && (
        <Card className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13.5px]">
            <thead className="bg-sunken text-[12px] text-muted">
              <tr>
                <th className="px-3 py-2">{t('Record', 'Yozuv')}</th>
                <th className="px-3 py-2">{t('Source', 'Manba')}</th>
                <th className="px-3 py-2">{t('Checked', 'Tekshirilgan')}</th>
              </tr>
            </thead>
            <tbody>
              {o.map((u) => (
                <tr className="border-t border-line align-top" key={u.id}>
                  <td className="px-3 py-2 font-semibold">{u.kind === 'program' ? u.university : u.name}</td>
                  <td className="px-3 py-2">
                    <CmpTn href={u.source.source_url}>{u.source.source_name}</CmpTn>
                  </td>
                  <td className="tabular px-3 py-2">{me(u.source.last_verified_at, n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Button className="mt-8" onClick={() => a('home')}>
        {t('Back to home', 'Bosh sahifaga qaytish')}
      </Button>
    </div>
  );
}
export function CmpEE() {
  const { navigate: e, state: a } = useStore(),
    { tx: t } = useI18n();
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-[28px] font-extrabold">{t('Sign in', 'Kirish')}</h1>
      <p className="mt-2 text-muted">
        {t(
          'Sign in to keep your data in your account on every device, or continue without an account: your profile is then kept only in this browser.',
          'Ma’lumotlaringizni barcha qurilmalarda akkauntda saqlash uchun kiring yoki akkauntsiz davom eting: u holda profilingiz faqat shu brauzerda saqlanadi.',
        )}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <AccountSignIn />
        {a.profile && (
          <Card className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-bold">
                {t('Continue as', 'Davom etish:')} {a.profile.name}
              </p>
              <p className="text-[13px] text-muted">
                {t('Profile found in this browser', 'Bu brauzerda profil topildi')}
              </p>
            </div>
            <Button variant="primary" onClick={() => e('dashboard')}>
              <KeyRound size={16} />
              {t('Continue', 'Davom etish')}
            </Button>
          </Card>
        )}
        <Card className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="font-bold">{t('Create a local profile', 'Mahalliy profil yaratish')}</p>
            <p className="text-[13px] text-muted">
              {t(
                'About 5 minutes. You can skip optional fields.',
                'Taxminan 5 daqiqa. Ixtiyoriy maydonlarni o‘tkazib yuborish mumkin.',
              )}
            </p>
          </div>
          <Button onClick={() => e('onboarding')}>
            <UserPlus size={16} />
            {t('Start', 'Boshlash')}
          </Button>
        </Card>
        <Card className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="font-bold">{t('Try a demo student', 'Namoyish talabasini sinash')}</p>
            <p className="text-[13px] text-muted">
              {t('Fictional data, ready in one click.', 'Xayoliy ma’lumotlar, bir bosishda tayyor.')}
            </p>
          </div>
          <Button onClick={() => e('demo')}>
            <FlaskConical size={16} />
            {t('Try demo', 'Sinash')}
          </Button>
        </Card>
        <Callout tone="warn" icon={<ShieldAlert size={16} />}>
          {t(
            'A local profile is not a secure account. Anyone using this browser can see it. Do not enter passport numbers or other sensitive identifiers.',
            'Mahalliy profil himoyalangan akkaunt emas. Shu brauzerdan foydalanuvchi har kim uni ko‘ra oladi. Pasport raqami kabi maxfiy ma’lumotlarni kiritmang.',
          )}
        </Callout>
      </div>
    </div>
  );
}
export function CmpAE() {
  const { startDemo: e, navigate: a, notify: t, state: n } = useStore(),
    { tx: s, p: r } = useI18n();
  return (
    <div className="mx-auto max-w-4xl">
      <Badge tone="warn" icon={<FlaskConical size={13} />}>
        {s('Hackathon demo mode', 'Xakaton namoyish rejimi')}
      </Badge>
      <h1 className="mt-3 text-[28px] font-extrabold md:text-[32px]">
        {s('Choose a fictional student', 'Xayoliy talabani tanlang')}
      </h1>
      <p className="mt-2 max-w-2xl text-muted">
        {s(
          'Each demo student has a different situation. Their dashboard, plans, calendar and draft statement are filled with sample data so you can walk through the whole journey.',
          'Har bir namoyish talabasining vaziyati turlicha. Ularning boshqaruv paneli, rejalari, taqvimi va motivatsion xat qoralamasi namunaviy ma’lumotlar bilan to‘ldirilgan — butun jarayonni ko‘rib chiqishingiz mumkin.',
        )}
      </p>
      {n.profile && !n.demo && (
        <div className="mt-4">
          <Callout tone="warn">
            {s(
              'Starting a demo replaces the profile and plans saved in this browser.',
              'Namoyishni boshlash shu brauzerdagi profil va rejalaringiz o‘rnini egallaydi.',
            )}
          </Callout>
        </div>
      )}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {Fg.map((o) => (
          <Card className="flex flex-col gap-3 p-5" key={o.key}>
            <div className="grid h-11 w-11 place-items-center rounded-full bg-navy text-[17px] font-extrabold text-navy-ink">
              {o.profile.name[0]}
            </div>
            <p className="font-bold leading-snug">{r(o.label)}</p>
            <p className="text-[14px] text-muted">{r(o.blurb)}</p>
            <Button
              variant="primary"
              className="mt-auto"
              onClick={() => {
                (e(o.key),
                  t(s(`Demo loaded: ${o.profile.name}`, `Namoyish yuklandi: ${o.profile.name}`)),
                  a('dashboard'));
              }}
            >
              {s('Use this student', 'Shu talabani tanlash')} <ArrowRight size={16} />
            </Button>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-[13px] text-faint">
        {s(
          'Tip for presenters: Malika shows the writing tutor and a near deadline; Dilnoza shows full-funding needs and nomination rules; Jasur shows grading-scale checks and budget gaps.',
          'Taqdimotchilar uchun maslahat: Malika — yozish yordamchisi va yaqin muddat; Dilnoza — to‘liq moliyalashtirish va nomzodlik qoidalari; Jasur — baho tizimi tekshiruvi va byudjet kamomadi.',
        )}
      </p>
    </div>
  );
}
