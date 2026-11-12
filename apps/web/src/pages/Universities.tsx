import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { COUNTRY_CODES, TIERS, TIER_INFO, searchUniversities, type UniFilter } from '@edubridge/shared';
import { useI18n } from '../i18n/I18nProvider';
import { useCatalog } from '../data/CatalogProvider';
import { href } from '../lib/router';
import { Button, Card, Field, Input, PageHeader, Select } from '../components/ui';
import { UniCard, useSubjectLabel } from '../components/common';
import { useStore } from '../store/AppStore';
import { matchStatus, type MatchStatus } from '../lib/match';
import { confirmedDeadlines } from '../lib/deadlines';
import { Badge } from '../components/ui';

const SUBJECTS = ['business', 'computing', 'engineering', 'medicine', 'humanities', 'law', 'education', 'natural', 'social', 'arts', 'economics', 'agriculture'];

export function Universities({ advanced }: { advanced: boolean }) {
  const { tx, t, pick } = useI18n();
  const data = useCatalog();
  const [f, setF] = useState<UniFilter>({});
  const [ielts, setIelts] = useState('');
  const { profile } = useStore();
  const [sort, setSort] = useState<'default' | 'relevance' | 'deadline'>('default');
  const [hideUnlikely, setHideUnlikely] = useState(false);

  const withGrant = useMemo(() => new Set(data.grants.filter((g) => g.kind === 'national').map((g) => g.country)), [data.grants]);
  const languages = useMemo(() => [...new Set(data.universities.flatMap((u) => u.languages))].sort(), [data.universities]);
  const filter: UniFilter = { ...f, ielts: ielts.trim() !== '' && !Number.isNaN(Number(ielts)) ? Number(ielts) : undefined };
  const hits = useMemo(() => searchUniversities(data.universities, filter, withGrant), [data.universities, f, ielts, withGrant]); // eslint-disable-line react-hooks/exhaustive-deps
  const status = useMemo(() => new Map<string, MatchStatus>(profile ? data.universities.map((u) => [u.id, matchStatus(profile, u)]) : []), [profile, data.universities]);
  const nextDeadline = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of confirmedDeadlines(data.universities, data.universities.map((u) => u.id))) if (!m.has(d.uniId)) m.set(d.uniId, d.date);
    return m;
  }, [data.universities]);
  const rank: Record<MatchStatus, number> = { good: 0, check: 1, add_scores: 2, unlikely: 3 };
  const shown = useMemo(() => {
    let l = hits;
    if (profile && hideUnlikely) l = l.filter((h) => status.get(h.university.id) !== 'unlikely');
    if (profile && sort === 'relevance') l = [...l].sort((a, b) => rank[status.get(a.university.id) ?? 'check'] - rank[status.get(b.university.id) ?? 'check']);
    if (sort === 'deadline') l = [...l].sort((a, b) => (nextDeadline.get(a.university.id) ?? '9999').localeCompare(nextDeadline.get(b.university.id) ?? '9999'));
    return l;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hits, profile, hideUnlikely, sort, status, nextDeadline]);
  const set = (patch: Partial<UniFilter>) => setF((p) => ({ ...p, ...patch }));
  const active = Object.values(f).some((v) => v !== undefined && v !== '' && v !== false) || ielts !== '';

  const subjectLabel = useSubjectLabel();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={tx('Catalogue · {0} universities', 'Katalog · {0} ta universitet', data.universities.length)}
        title={t('nav.universities')}
        actions={
          <a href={advanced ? href('universities', 'finder') : href('universities', 'advanced')} className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-fg no-underline hover:bg-sunken">
            {advanced ? tx('Back', 'Orqaga') : tx('Advanced search with all filters', 'Barcha filtrlar bilan kengaytirilgan qidiruv')}
          </a>
        }
      >
        {tx('Search by full name or abbreviation (e.g. METU, KAIST, TUM), filter by group and compare up to three.', 'To‘liq nomi yoki qisqartmasi (masalan METU, KAIST, TUM) bo‘yicha qidiring, guruh bo‘yicha saralang va uchtagacha universitetni taqqoslang.')}
      </PageHeader>

      <Card className="space-y-3">
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden />
          <Input
            type="search"
            aria-label={tx('Search by name or abbreviation', 'Nomi yoki qisqartmasi bo‘yicha qidirish')}
            placeholder={tx('Search by name or abbreviation (METU, KAIST, TUM…)', 'Nomi yoki qisqartmasi (METU, KAIST, TUM…)')}
            className="pl-10"
            value={f.q ?? ''}
            onChange={(e) => set({ q: e.target.value })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={tx('Country', 'Davlat')}>
            <Select value={f.country ?? ''} onChange={(e) => set({ country: e.target.value || undefined })}>
              <option value="">{tx('All countries', 'Barcha davlatlar')}</option>
              {COUNTRY_CODES.map((c) => <option key={c} value={c}>{pick(data.countries.find((x) => x.code === c)?.name) || c}</option>)}
            </Select>
          </Field>
          <Field label={tx('Group', 'Guruh')}>
            <Select value={f.tier ?? ''} onChange={(e) => set({ tier: e.target.value || undefined })}>
              <option value="">{tx('All', 'Barchasi')}</option>
              {TIERS.map((x) => <option key={x} value={x}>{pick(TIER_INFO[x].name)}</option>)}
            </Select>
          </Field>
          <Field label={tx('Level', 'Daraja')}>
            <Select value={f.level ?? ''} onChange={(e) => set({ level: (e.target.value || undefined) as UniFilter['level'] })}>
              <option value="">{tx('All', 'Barchasi')}</option>
              <option value="bachelor">{t('lvl.bachelor')}</option>
              <option value="master">{t('lvl.master')}</option>
            </Select>
          </Field>
          <Field label={tx('Subjects', 'Fanlar')}>
            <Select value={f.subject ?? ''} onChange={(e) => set({ subject: e.target.value || undefined })}>
              <option value="">{tx('All subjects', 'Barcha yo‘nalishlar')}</option>
              {SUBJECTS.map((s) => <option key={s} value={s}>{subjectLabel(s)}</option>)}
            </Select>
          </Field>
        </div>

        {advanced && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={tx('Language of instruction', 'O‘qitish tili')}>
              <Select value={f.language ?? ''} onChange={(e) => set({ language: e.target.value || undefined })}>
                <option value="">{tx('All', 'Barchasi')}</option>
                {languages.map((l) => <option key={l} value={l}>{l}</option>)}
              </Select>
            </Field>
            <Field label={tx('My IELTS score (optional)', 'Mening IELTS ballim (ixtiyoriy)')}>
              <Input inputMode="decimal" placeholder="6.5" value={ielts} onChange={(e) => setIelts(e.target.value)} />
            </Field>
            <fieldset className="flex flex-col justify-end gap-1 text-sm sm:col-span-2">
              <legend className="sr-only">{tx('Only show', 'Faqat ko‘rsatish')}</legend>
              {[
                { k: 'funding' as const, label: tx('With funding (grant or university scholarship)', 'Moliyalashtirish bilan (grant yoki universitet stipendiyasi)') },
                { k: 'confirmedDeadline' as const, label: tx('With a confirmed deadline', 'Tasdiqlangan muddat bilan') },
                { k: 'confirmedFee' as const, label: tx('With a confirmed application fee', 'Tasdiqlangan ariza to‘lovi bilan') },
              ].map((c) => (
                <label key={c.k} className="flex min-h-[40px] items-center gap-2">
                  <input type="checkbox" className="h-5 w-5" checked={!!f[c.k]} onChange={(e) => set({ [c.k]: e.target.checked || undefined })} />
                  {c.label}
                </label>
              ))}
            </fieldset>
          </div>
        )}
        {ielts !== '' && (
          <p className="text-xs text-muted">
            {tx('IELTS is compared only with minimums confirmed for the whole university. Programme-specific values are shown on the university page, never generalised.', 'IELTS faqat butun universitet uchun tasdiqlangan minimum bilan solishtiriladi. Dasturga xos qiymatlar universitet sahifasida ko‘rsatiladi, umumlashtirilmaydi.')}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={tx('Sort by', 'Saralash')}>
            <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="default">{tx('Catalogue order', 'Katalog tartibi')}</option>
              {profile && <option value="relevance">{tx('Relevance to my profile', 'Profilimga mosligi')}</option>}
              <option value="deadline">{tx('Deadline (soonest confirmed)', 'Muddat (eng yaqin tasdiqlangan)')}</option>
            </Select>
          </Field>
          {profile && (
            <label className="flex min-h-[44px] items-end gap-2 pb-2 text-sm">
              <input type="checkbox" className="h-5 w-5" checked={hideUnlikely} onChange={(e) => setHideUnlikely(e.target.checked)} />
              {tx('Hide those that may not fit my profile', 'Profilimga mos kelmasligi mumkinlarini yashirish')}
            </label>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p role="status" className="text-sm font-semibold">{tx('{0} universities', '{0} ta universitet', shown.length)}</p>
          {(active || hideUnlikely || sort !== 'default') && <Button size="sm" onClick={() => { setF({}); setIelts(''); setHideUnlikely(false); setSort('default'); }}>{tx('Reset filters', 'Filtrlarni tiklash')}</Button>}
        </div>
      </Card>

      {!profile && <p className="text-[13px] text-muted">{tx('You are browsing without a profile. Create one to see which published requirements you appear to meet.', 'Siz profilsiz ko‘ryapsiz. E’lon qilingan talablarning qaysilariga mos ekaningizni ko‘rish uchun profil yarating.')} <a href={href('onboarding')}>{tx('Build my profile', 'Profilimni yaratish')} →</a></p>}
      {shown.length === 0 ? (
        <p className="py-6 text-center text-muted">{tx('No university matches these filters. Try removing one.', 'Bu filtrlarga mos universitet yo‘q. Birini olib tashlab ko‘ring.')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((h) => (
            <div key={h.university.id} className="flex h-full flex-col gap-1">
              <UniCard u={h.university} />
              {profile && <MatchBadge s={status.get(h.university.id) ?? 'check'} />}
              {h.ieltsStatus && (
                <p className="px-1 text-xs text-muted">
                  {h.ieltsStatus === 'meets' && tx('Your IELTS meets the confirmed minimum.', 'IELTS ballingiz tasdiqlangan minimumga mos.')}
                  {h.ieltsStatus === 'below' && tx('Your IELTS is below the confirmed minimum.', 'IELTS ballingiz tasdiqlangan minimumdan past.')}
                  {h.ieltsStatus === 'unconfirmed' && tx('No confirmed general IELTS minimum.', 'Umumiy IELTS minimumi tasdiqlanmagan.')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchBadge({ s }: { s: MatchStatus }) {
  const { tx } = useI18n();
  const map: Record<MatchStatus, { tone: 'ok' | 'neutral' | 'warn' | 'info'; text: string }> = {
    good: { tone: 'ok', text: tx('Good match for you', 'Siz uchun yaxshi moslik') },
    check: { tone: 'info', text: tx('Looks possible — check the requirements', 'Mumkin ko‘rinadi — talablarni tekshiring') },
    add_scores: { tone: 'neutral', text: tx('Add your scores to check', 'Tekshirish uchun ballaringizni kiriting') },
    unlikely: { tone: 'warn', text: tx('May not fit your profile', 'Profilingizga mos kelmasligi mumkin') },
  };
  return <Badge tone={map[s].tone} className="self-start">{map[s].text}</Badge>;
}
