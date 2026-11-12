import { useState, type ReactNode } from 'react';
import type { L, Level, University, UniversityLevel } from '@edubridge/shared';
import { useI18n } from '../i18n/I18nProvider';
import { useCatalog } from '../data/CatalogProvider';
import { href } from '../lib/router';
import { formatDate, formatMoney, isHttp, isPast } from '../lib/format';
import { Badge, Card, Notice, Tabs } from '../components/ui';
import { AddToPlan } from './Plans';
import { uniOpp } from '../lib/plans';
import { CompareButton, SaveButton, ExternalLinkText, NotConfirmed, QsLine, SourceNote, TierBadge, useSubjectLabel } from '../components/common';

const isL = (x: unknown): x is L => !!x && typeof x === 'object' && typeof (x as L).en === 'string' && (x as L).en.length > 0;

export function useUniText() {
  const { tx, t, lang, pick } = useI18n();
  const openLabel = (o: string | undefined) =>
    o === 'yes' ? tx('Open to international applicants', 'Xalqaro abituriyentlar uchun ochiq')
    : o === 'integrated' ? tx('One-tier programme', 'Bir bosqichli dastur')
    : o === 'no' ? tx('{0}: no full-degree route found', '{0}: to‘liq darajaga yo‘l topilmadi', '')
    : tx('Not confirmed on an official page', 'Rasmiy sahifada tasdiqlanmagan');

  const tuition = (lv: UniversityLevel | null | undefined): ReactNode => {
    const tu = lv?.tuition;
    if (!tu || tu.amount == null) return <NotConfirmed />;
    // A confirmed 0 must come with a note; it is never inferred from a missing value.
    const amount = tu.amount_max != null && tu.amount_max !== tu.amount ? `${formatMoney(tu.amount, tu.currency, lang)} – ${formatMoney(tu.amount_max, tu.currency, lang)}` : formatMoney(tu.amount, tu.currency, lang);
    const per = tu.per === 'year' ? t('m.perYear') : tu.per === 'semester' ? t('m.perSemester') : tu.per === 'total' ? t('m.total') : '';
    return (
      <>
        <span className="font-semibold">{amount}</span> {per}
        {tu.year ? <span className="text-muted"> · {tx('year {0}', '{0} yil', tu.year)}</span> : <span className="text-muted"> · {tx('year not stated', 'yil ko‘rsatilmagan')}</span>}
        {isL(tu.note) && <span className="block text-sm text-muted">{pick(tu.note)}</span>}
      </>
    );
  };

  const deadline = (lv: UniversityLevel | null | undefined): ReactNode => {
    const d = lv?.deadline;
    if (!d || !d.date) {
      return (
        <>
          {tx('No dated deadline confirmed', 'Sanali muddat tasdiqlanmagan')}
          {isL(d?.note) && <span className="block text-sm text-muted">{pick(d!.note)}</span>}
        </>
      );
    }
    const past = isPast(d.date);
    return (
      <>
        {past ? <Badge tone="bad">{tx('Closed', 'Yopilgan')} · {d.date.slice(0, 4)}</Badge> : <Badge tone="ok">{tx('Upcoming', 'Kutilmoqda')}</Badge>}{' '}
        <span className="font-semibold">{formatDate(d.date, lang)}</span>
        {d.intake && <span className="text-muted"> · {d.intake}</span>}
        {past && <span className="block text-sm text-muted">{tx('Next date not confirmed.', 'Keyingi sana tasdiqlanmagan.')}</span>}
        {isL(d.note) && <span className="block text-sm text-muted">{pick(d.note)}</span>}
      </>
    );
  };

  return { openLabel, tuition, deadline };
}

function Row({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <Card>
      <h3 className="flex items-center gap-2 text-sm font-extrabold">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-soft text-xs text-brand" aria-hidden>{n}</span>
        {title}
      </h3>
      <div className="mt-2 text-sm">{children}</div>
    </Card>
  );
}

function LevelPanel({ u, level }: { u: University; level: Level }) {
  const { tx, pick, t } = useI18n();
  const { countries, grants } = useCatalog();
  const { openLabel, tuition, deadline } = useUniText();
  const lv = u.levels[level];
  const country = countries.find((c) => c.code === u.country);
  const docs = country?.documents?.[level] ?? [];
  const steps = country?.steps?.[level] ?? [];
  const kindLabel = { required: tx('Required', 'Majburiy'), depends: tx('Depends on programme', 'Dasturga bog‘liq'), optional: tx('Optional', 'Ixtiyoriy') } as const;
  const kindTone = { required: 'bad', depends: 'warn', optional: 'neutral' } as const;
  const levelName = level === 'bachelor' ? t('lvl.bachelor') : t('lvl.master');
  const natGrants = grants.filter((g) => g.kind === 'national' && g.country === u.country && (g.levels as string[]).includes(level));
  const uniGrants = (u.scholarships as Array<Record<string, any>>).filter((s) => !s.levels || (s.levels as string[]).includes(level));
  const exampleOk = lv?.example && (lv.example.name || isL(lv.example.req));

  if (!lv) return <p><NotConfirmed /></p>;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Row n={3} title={tx('Open to international students?', 'Xalqaro talabalar uchun ochiqmi?')}>
        <p>{openLabel(lv.open)}</p>
        {lv.open === 'no' && isL(lv.note) && <p className="mt-1 text-muted">{pick(lv.note)}</p>}
      </Row>
      <Row n={4} title={tx('Language of instruction', 'O‘qitish tili')}>
        {isL(lv.language) ? <p>{pick(lv.language)}</p> : <NotConfirmed />}
        {u.languages.length > 0 && <p className="mt-1 text-muted">{u.languages.join(', ')}</p>}
      </Row>
      <Row n={5} title={tx('Academic requirements', 'Akademik talablar')}>
        {isL(lv.academic) ? <p>{pick(lv.academic)}</p> : <NotConfirmed />}
      </Row>
      <Row n={6} title={tx('IELTS and academic entry requirements', 'IELTS va akademik kirish talablari')}>
        {lv.ielts != null ? (
          <p>
            IELTS <span className="font-semibold">{lv.ielts}</span>{' '}
            <Badge tone={lv.ieltsScope === 'general' ? 'ok' : 'warn'}>{lv.ieltsScope === 'general' ? tx('whole university', 'butun universitet') : tx('programme-specific', 'dasturga xos')}</Badge>
            {lv.ieltsScope !== 'general' && <span className="mt-1 block text-muted">{tx('A programme-specific value is shown as published and is not generalised.', 'Dasturga xos qiymat e’lon qilinganidek ko‘rsatiladi va umumlashtirilmaydi.')}</span>}
          </p>
        ) : (
          <p className="text-muted">{tx('No confirmed IELTS minimum.', 'IELTS minimumi tasdiqlanmagan.')}</p>
        )}
        {isL(lv.exams) && <p className="mt-1">{pick(lv.exams)}</p>}
        {exampleOk && (
          <p className="mt-2 text-muted">
            {tx('Example programme', 'Namuna dastur')}: {lv.example!.name}
            {isL(lv.example!.req) && <> — {pick(lv.example!.req)}</>}{' '}
            {lv.example!.url && <ExternalLinkText url={lv.example!.url} />}
          </p>
        )}
      </Row>

      <div className="md:col-span-2">
        <Row n={7} title={tx('Required document list', 'Kerakli hujjatlar ro‘yxati')}>
          {docs.length ? (
            <ul className="divide-y divide-line">
              {docs.map((d, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>{pick(d.label)}</span>
                  <Badge tone={kindTone[d.kind]}>{kindLabel[d.kind]}</Badge>
                </li>
              ))}
            </ul>
          ) : <NotConfirmed />}
          <p className="mt-2 text-xs text-muted">{tx('This is general guidance for the country, not this university’s official list. Check the university’s own document list.', 'Bu davlat uchun umumiy yo‘riqnoma, universitetning rasmiy ro‘yxati emas. Universitetning o‘z hujjat ro‘yxatini tekshiring.')}</p>
        </Row>
      </div>

      <div className="md:col-span-2">
        <Row n={8} title={tx('Application steps', 'Ariza bosqichlari')}>
          {steps.length ? <ol className="list-decimal space-y-1 pl-5">{steps.map((s, i) => <li key={i}>{pick(s)}</li>)}</ol> : <NotConfirmed />}
        </Row>
      </div>

      <Row n={9} title={tx('Deadline and intake', 'Muddat va qabul')}>
        <p>{deadline(lv)}</p>
        {isL(lv.intake) && <p className="mt-1 text-muted">{pick(lv.intake)}</p>}
      </Row>
      <Row n={10} title={tx('Fees', 'To‘lovlar')}>
        <p><span className="font-semibold">{tx('Tuition', 'Kontrakt')}:</span> {tuition(lv)}</p>
        <p className="mt-1">
          <span className="font-semibold">{tx('Application fee', 'Ariza to‘lovi')}:</span>{' '}
          {u.fee?.amount != null ? <>{formatMoney(u.fee.amount, u.fee.currency, 'en')}{isL(u.fee.note) && <span className="block text-muted">{pick(u.fee.note)}</span>}</> : <NotConfirmed />}
        </p>
        <SourceNote urls={[lv.tuition?.source, u.fee?.source]} />
      </Row>

      <div className="md:col-span-2">
        <Row n={11} title={tx('Grants and scholarships', 'Grantlar va stipendiyalar')}>
          {natGrants.length > 0 ? (
            <ul className="space-y-1">
              {natGrants.map((g) => (
                <li key={g.id}>
                  <a href={href('scholarship', g.id)} className="font-semibold">{g.name}</a>
                  <span className="block text-muted">{tx('Whether this university and programme take part is not confirmed — check the official list.', 'Ushbu universitet va dastur ishtirok etishi tasdiqlanmagan — rasmiy ro‘yxatni tekshiring.')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{tx('No national grant for this level was confirmed.', 'Bu daraja uchun milliy grant tasdiqlanmagan.')}</p>
          )}
          <div className="mt-3 border-t border-line pt-2">
            {uniGrants.length > 0 ? (
              <>
                <p className="font-semibold">{tx('{0} university scholarship(s) recorded for international students.', 'Xalqaro talabalar uchun {0} ta universitet stipendiyasi qayd etilgan.', uniGrants.length)}</p>
                <ul className="mt-1 space-y-1">
                  {uniGrants.map((s, i) => (
                    <li key={i}>
                      {isHttp(s.url) ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a> : s.name}
                      {s.coverage && <span className="block text-muted">{String(s.coverage)}</span>}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-muted">{tx('No university scholarship for international students was recorded.', 'Xalqaro talabalar uchun universitet stipendiyasi qayd etilmagan.')}</p>
            )}
          </div>
        </Row>
      </div>

      <div className="md:col-span-2">
        <Row n={12} title={tx('Official links', 'Rasmiy havolalar')}>
          <ul className="space-y-1">
            {u.website && <li><span className="text-muted">{tx('Website', 'Sayt')}: </span><ExternalLinkText url={u.website} /></li>}
            {u.admissions && <li><span className="text-muted">{tx('Open admissions page', 'Qabul sahifasi')}: </span><ExternalLinkText url={u.admissions} /></li>}
            {(lv.apply ?? u.apply) && <li><span className="text-muted">{tx('Apply on the official website', 'Rasmiy saytda ariza topshirish')}: </span><ExternalLinkText url={(lv.apply ?? u.apply)!} /></li>}
          </ul>
          <p className="mt-2 text-xs text-muted">{tx('You apply directly with the university. EduBridge never asks for your application account password — don’t share it with anyone.', 'Siz to‘g‘ridan-to‘g‘ri universitetga ariza topshirasiz. EduBridge ariza akkauntingiz parolini hech qachon so‘ramaydi — uni hech kimga bermang.')}</p>
        </Row>
      </div>

      <div className="md:col-span-2">
        <Row n={13} title={tx('Sources and last check', 'Manbalar va oxirgi tekshiruv')}>
          <ul className="space-y-1">{(lv.sources ?? []).map((s) => <li key={s}><ExternalLinkText url={s} /></li>)}</ul>
          {(lv.sources ?? []).length === 0 && <NotConfirmed />}
          <SourceNote urls={[]} checked={u.lastChecked} />
        </Row>
      </div>
      <span className="sr-only">{levelName}</span>
    </div>
  );
}

export function UniProfile({ id }: { id: string | null }) {
  const { tx, pick, t, lang } = useI18n();
  const subject = useSubjectLabel();
  const { universities, countries } = useCatalog();
  const [level, setLevel] = useState<Level>('bachelor');
  const u = universities.find((x) => x.id === id);
  if (!u) {
    return (
      <div className="space-y-2">
        <p>{tx('Not found', 'Topilmadi')}</p>
        <a href={href('universities')}>← {t('nav.universities')}</a>
      </div>
    );
  }
  const country = countries.find((c) => c.code === u.country);

  return (
    <article className="space-y-5">
      <a href={href('country', u.country)} className="text-sm">← {pick(country?.name)}</a>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <TierBadge tier={u.tier} />
          <Badge>{u.type === 'private' ? tx('private', 'xususiy') : tx('public', 'davlat')}</Badge>
        </div>
        <h1 className="text-[26px] font-extrabold leading-tight md:text-[30px]">{u.name}</h1>
        <p className="text-muted">{u.city}{u.campus && isL(u.campus) ? ` · ${pick(u.campus)}` : ''}</p>
        <div className="flex flex-wrap items-center gap-2"><SaveButton id={u.id} /><CompareButton id={u.id} />{(u.levels[level]?.open === 'yes' || u.levels[level]?.open === 'integrated') && <AddToPlan opp={uniOpp(u, level)} />}</div>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <Row n={1} title={tx('About', 'Haqida')}>
          <p>{u.name}{u.short ? ` (${u.short})` : ''} — {u.city}, {pick(country?.name)}.</p>
          <p className="mt-1">
            {u.ranking?.value != null ? (
              <>
                <QsLine u={u} />{' '}
                {tx('As published by ', 'E’lon qilgan: ')}{u.ranking.source?.name}
                {u.ranking.source?.url && <> (<ExternalLinkText url={u.ranking.source.url} label={tx('source', 'manba')} />)</>}
              </>
            ) : (
              <>
                <QsLine u={u} />. {tx('Not found in the QS 2027 lists EduBridge could check — open the ranking page. ', 'EduBridge tekshirishi mumkin bo‘lgan QS 2027 ro‘yxatlarida topilmadi — reyting sahifasini oching. ')}
                {u.ranking?.url && <ExternalLinkText url={u.ranking.url} label={tx('QS page', 'QS sahifasi')} />}
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-muted">{tx('A general ranking does not mean the same position in a specific subject.', 'Umumiy reyting muayyan fandagi o‘rin shunday ekanini anglatmaydi.')}</p>
          <p className="mt-1 text-xs text-muted">{tx('Groups are EduBridge guidance, not an official classification. Meeting a minimum is not a guarantee.', 'Guruhlar EduBridge maslahati, rasmiy tasnif emas. Minimumga yetish kafolat emas.')}</p>
        </Row>
        <Row n={2} title={tx('Subjects', 'Fanlar')}>
          {u.subjects.length ? (
            <div className="flex flex-wrap gap-1.5">{u.subjects.map((s) => <Badge key={s}>{subject(s)}</Badge>)}</div>
          ) : (
            <p>{tx('Subjects offered were not recorded. Check the programme catalogue.', 'Taklif etiladigan fanlar qayd etilmagan. Dastur katalogini tekshiring.')}</p>
          )}
        </Row>
      </div>

      <Tabs label={tx('Level', 'Daraja')} value={level} onChange={setLevel} tabs={[{ id: 'bachelor', label: t('lvl.bachelor') }, { id: 'master', label: t('lvl.master') }]} />
      <div role="tabpanel" id={`panel-${level}`} aria-labelledby={`tab-${level}`}>
        <LevelPanel u={u} level={level} />
      </div>

      <Notice>
        {tx('Information checked on official pages on {0}. Admission rules change every year — always confirm on the university’s page.', 'Ma’lumot rasmiy sahifalarda {0} da tekshirilgan. Qabul qoidalari har yili o‘zgaradi — doim universitet sahifasida tasdiqlang.', formatDate(u.lastChecked, lang) ?? '—')}
      </Notice>
    </article>
  );
}
