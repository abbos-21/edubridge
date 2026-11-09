import { useState } from 'react';
import type { L } from '@edubridge/shared';
import { useI18n } from '../i18n/I18nProvider';
import { useCatalog } from '../data/CatalogProvider';
import { href } from '../lib/router';
import { formatDate, isHttp, isPast } from '../lib/format';
import type { GrantRecord } from '../lib/types';
import { Badge, Card, Field, Notice, PageHeader, Select, Tabs } from '../components/ui';
import { ExternalLinkText, NotConfirmed, SourceNote } from '../components/common';

/** A localised text object {en, uz}; legacy records may hold {} or other shapes. */
const isL = (x: unknown): x is L => !!x && typeof x === 'object' && typeof (x as L).en === 'string' && (x as L).en.length > 0;

export function useGrantText() {
  const { pick, tx, lang } = useI18n();
  /** Deadline of a national grant is free text; of an older record an object with status and date. */
  const deadlineText = (g: GrantRecord): string | null => {
    const d = g.deadline;
    if (isL(d)) return pick(d);
    if (d && typeof d === 'object') {
      const date = (d as { date?: string }).date;
      const note = (d as { note?: L }).note;
      const parts: string[] = [];
      if (date) {
        const year = date.slice(0, 4);
        parts.push(isPast(date) ? tx('Closed', 'Yopilgan') + ` (${year}): ${formatDate(date, lang)}` : formatDate(date, lang) ?? date);
      }
      if (isL(note)) parts.push(pick(note));
      return parts.length ? parts.join(' — ') : null;
    }
    return null;
  };
  return { deadlineText };
}

export function GrantCard({ g }: { g: GrantRecord }) {
  const { pick, tx, t } = useI18n();
  const { countries } = useCatalog();
  const { deadlineText } = useGrantText();
  const country = countries.find((c) => c.code === g.country);
  const dl = deadlineText(g);
  const who = isL(g.who) ? g.who : isL(g.summary) ? g.summary : null;
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={g.kind === 'national' ? 'brand' : 'neutral'}>{g.kind === 'national' ? tx('National grant', 'Milliy grant') : tx('Other scholarship', 'Boshqa stipendiya')}</Badge>
        {country ? <Badge>{pick(country.name)}</Badge> : <Badge>{g.country}</Badge>}
        {(g.levels as string[] | undefined)?.map((l) => (
          <Badge key={l}>{l === 'bachelor' ? t('lvl.bachelor') : l === 'master' ? t('lvl.master') : 'PhD'}</Badge>
        ))}
      </div>
      <h3 className="font-extrabold leading-snug"><a href={href('scholarship', g.id)} className="text-fg no-underline hover:underline">{g.name}</a></h3>
      {who && <p className="line-clamp-3 text-sm text-muted">{pick(who)}</p>}
      <p className="text-sm">
        <span className="font-semibold">{tx('Deadline', 'Muddat')}: </span>
        {dl ?? <NotConfirmed />}
      </p>
      <a href={href('scholarship', g.id)} className="mt-auto inline-flex min-h-[40px] items-center font-semibold">{tx('View details', 'Batafsil')} →</a>
    </Card>
  );
}

export function Scholarships() {
  const { tx, pick } = useI18n();
  const { grants, countries } = useCatalog();
  const [tab, setTab] = useState<'national' | 'other'>('national');
  const [country, setCountry] = useState('');
  const [level, setLevel] = useState('');
  const { t } = useI18n();

  const list = grants.filter((g) => g.kind === tab && (!country || g.country === country) && (!level || (g.levels as string[] | undefined)?.includes(level)));
  const codes = [...new Set(grants.filter((g) => g.kind === tab).map((g) => g.country))];

  return (
    <div className="space-y-4">
      <PageHeader eyebrow={tx('Scholarship directory', 'Stipendiyalar katalogi')} title={tx('Grants and scholarships', 'Grantlar va stipendiyalar')} />
      <Notice>
        {tx('These are grant conditions, separate from university entry requirements.', 'Bu grant shartlari, universitetga kirish talablaridan alohida.')}
      </Notice>
      <Tabs
        label={tx('Grants and scholarships', 'Grantlar va stipendiyalar')}
        value={tab}
        onChange={(v) => { setTab(v); setCountry(''); }}
        tabs={[{ id: 'national', label: tx('National grants', 'Milliy grantlar') }, { id: 'other', label: tx('Other scholarships', 'Boshqa stipendiyalar') }]}
      />
      {tab === 'other' && (
        <p className="text-sm text-muted">
          {tx('Other scholarships come from an earlier import and are less complete than the national grants. Check each one on its official page.', 'Boshqa stipendiyalar avvalgi importdan olingan va milliy grantlarga qaraganda to‘liqroq emas. Har birini rasmiy sahifada tekshiring.')}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 md:max-w-xl">
        <Field label={tx('Country', 'Davlat')}>
          <Select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">{tx('All countries', 'Barcha davlatlar')}</option>
            {codes.map((c) => <option key={c} value={c}>{pick(countries.find((x) => x.code === c)?.name) || c}</option>)}
          </Select>
        </Field>
        <Field label={tx('Level', 'Daraja')}>
          <Select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">{tx('All', 'Barchasi')}</option>
            <option value="bachelor">{t('lvl.bachelor')}</option>
            <option value="master">{t('lvl.master')}</option>
          </Select>
        </Field>
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {list.map((g) => <GrantCard key={g.id} g={g} />)}
      </div>
      {!list.length && <p className="text-muted">{tx('No matches for these filters', 'Bu filtrlarga mos natija yo‘q')}</p>}
    </div>
  );
}

const COVER_KEYS = ['tuition', 'stipend', 'living', 'accommodation', 'insurance', 'travel'] as const;

export function GrantDetail({ id }: { id: string | null }) {
  const { tx, pick, t } = useI18n();
  const { grants, countries } = useCatalog();
  const { deadlineText } = useGrantText();
  const g = grants.find((x) => x.id === id);
  if (!g) {
    return (
      <div className="space-y-2">
        <p>{tx('Not found', 'Topilmadi')}</p>
        <a href={href('scholarships')}>← {tx('Grants and scholarships', 'Grantlar va stipendiyalar')}</a>
      </div>
    );
  }
  const country = countries.find((c) => c.code === g.country);
  const coverLabel = (v: string) =>
    v === 'yes' ? tx('Yes', 'Ha') : v === 'partial' ? tx('Partial', 'Qisman') : v === 'no' ? tx('No', 'Yo‘q') : tx('Check the official page', 'Rasmiy sahifani tekshiring');
  const covers = (g.covers ?? g.coverage) as Record<string, string> | undefined;
  const dl = deadlineText(g);
  const src = g.source as { source_url?: string } | undefined;
  const urls = [g.url, g.infoUrl, g.applyUrl, src?.source_url, ...((g.sources as string[] | undefined) ?? [])];
  const checked = (g.checked as string | undefined) ?? (src as { last_verified_at?: string } | undefined)?.last_verified_at ?? null;

  const blocks: Array<{ title: string; value: unknown }> = [
    { title: tx('Who can apply', 'Kim ariza topshirishi mumkin'), value: g.who ?? g.summary },
    { title: tx('Grant criteria', 'Grant mezonlari'), value: isL(g.criteria) ? g.criteria : null },
    { title: tx('Academic requirements', 'Akademik talablar'), value: isL(g.academic) ? g.academic : null },
    { title: tx('Language requirements', 'Til talablari'), value: isL(g.languageReq) ? g.languageReq : null },
    { title: tx('Funding', 'Moliyalashtirish'), value: g.stipendText ?? g.coverageDetail },
    { title: tx('Not covered', 'Qoplanmaydi'), value: g.notCovered },
    { title: tx('Tracks', 'Yo‘nalishlar'), value: g.tracks },
    { title: tx('Good to know', 'Bilish foydali'), value: g.extras },
    { title: tx('Participating universities', 'Ishtirokchi universitetlar'), value: g.universities },
  ];

  return (
    <article className="space-y-5">
      <a href={href('scholarships')} className="text-sm">← {tx('Grants and scholarships', 'Grantlar va stipendiyalar')}</a>
      <header>
        <div className="flex flex-wrap gap-2">
          <Badge tone={g.kind === 'national' ? 'brand' : 'neutral'}>{g.kind === 'national' ? tx('National grant', 'Milliy grant') : tx('Other scholarship', 'Boshqa stipendiya')}</Badge>
          {country && <Badge>{pick(country.name)}</Badge>}
          {(g.levels as string[] | undefined)?.map((l) => <Badge key={l}>{l === 'bachelor' ? t('lvl.bachelor') : l === 'master' ? t('lvl.master') : 'PhD'}</Badge>)}
        </div>
        <h1 className="mt-2 text-[26px] font-extrabold leading-tight md:text-[30px]">{g.name}</h1>
        {isL(g.provider) && <p className="text-muted">{pick(g.provider)}</p>}
      </header>

      <Notice>{tx('These are grant conditions, separate from university entry requirements.', 'Bu grant shartlari, universitetga kirish talablaridan alohida.')}</Notice>

      {covers && (
        <Card>
          <h2 className="mb-2 font-extrabold">{tx('What it covers', 'Nimani qoplaydi')}</h2>
          <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {COVER_KEYS.filter((k) => covers[k] != null).map((k) => (
              <div key={k} className="flex justify-between gap-3 border-b border-line py-1 text-sm">
                <dt className="capitalize">{k === 'tuition' ? tx('Tuition', 'Kontrakt') : k === 'stipend' || k === 'living' ? tx('Monthly allowance', 'Oylik nafaqa') : k === 'accommodation' ? tx('Accommodation', 'Yotoqxona') : k === 'insurance' ? tx('Insurance', 'Sug‘urta') : tx('Travel', 'Yo‘l')}</dt>
                <dd className="font-semibold">{coverLabel(String(covers[k]))}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      <Card>
        <h2 className="font-extrabold">{tx('Deadline', 'Muddat')}</h2>
        <p className="mt-1 text-sm">{dl ?? <NotConfirmed />}</p>
      </Card>

      {blocks.filter((b) => isL(b.value)).map((b) => (
        <Card key={b.title}>
          <h2 className="font-extrabold">{b.title}</h2>
          <p className="mt-1 whitespace-pre-line text-sm">{pick(b.value as L)}</p>
        </Card>
      ))}

      {Array.isArray(g.uncertainties) && g.uncertainties.length > 0 && (
        <Card>
          <h2 className="font-extrabold">{tx('Not confirmed', 'Tasdiqlanmagan')}</h2>
          <ul className="mt-1 list-disc pl-5 text-sm">{(g.uncertainties as L[]).filter(isL).map((u, i) => <li key={i}>{pick(u)}</li>)}</ul>
        </Card>
      )}

      <Card>
        <h2 className="font-extrabold">{tx('Official links', 'Rasmiy havolalar')}</h2>
        <ul className="mt-1 space-y-1 text-sm">
          {[...new Set(urls.filter(isHttp))].map((u) => <li key={u}><ExternalLinkText url={u} /></li>)}
        </ul>
        <SourceNote urls={[]} checked={checked} />
        <p className="mt-2 text-xs text-muted">{tx('You apply directly with the university. EduBridge never asks for your application account password — don’t share it with anyone.', 'Siz to‘g‘ridan-to‘g‘ri universitetga ariza topshirasiz. EduBridge ariza akkauntingiz parolini hech qachon so‘ramaydi — uni hech kimga bermang.')}</p>
      </Card>
    </article>
  );
}
