import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { COUNTRY_CODES, TIERS, TIER_INFO, searchUniversities, type UniFilter } from '@edubridge/shared';
import { useI18n } from '../i18n/I18nProvider';
import { useCatalog } from '../data/CatalogProvider';
import { href } from '../lib/router';
import { Button, Card, Field, Input, Select } from '../components/ui';
import { UniCard } from '../components/common';

const SUBJECTS = ['business', 'computing', 'engineering', 'medicine', 'humanities', 'law', 'education', 'natural', 'social', 'arts', 'economics', 'agriculture'];

export function Universities({ advanced }: { advanced: boolean }) {
  const { tx, t, pick } = useI18n();
  const data = useCatalog();
  const [f, setF] = useState<UniFilter>({});
  const [ielts, setIelts] = useState('');

  const withGrant = useMemo(() => new Set(data.grants.filter((g) => g.kind === 'national').map((g) => g.country)), [data.grants]);
  const languages = useMemo(() => [...new Set(data.universities.flatMap((u) => u.languages))].sort(), [data.universities]);
  const filter: UniFilter = { ...f, ielts: ielts.trim() !== '' && !Number.isNaN(Number(ielts)) ? Number(ielts) : undefined };
  const hits = useMemo(() => searchUniversities(data.universities, filter, withGrant), [data.universities, f, ielts, withGrant]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (patch: Partial<UniFilter>) => setF((p) => ({ ...p, ...patch }));
  const active = Object.values(f).some((v) => v !== undefined && v !== '' && v !== false) || ielts !== '';

  const subjectLabel = (s: string) => ({ business: tx('Business', 'Biznes'), computing: tx('Computing', 'Kompyuter fanlari'), engineering: tx('Engineering', 'Muhandislik'), medicine: tx('Medicine', 'Tibbiyot'), humanities: tx('Humanities', 'Gumanitar fanlar'), law: tx('Law', 'Huquq'), education: tx('Education', 'Ta’lim'), natural: tx('Natural sciences', 'Tabiiy fanlar'), social: tx('Social sciences', 'Ijtimoiy fanlar'), arts: tx('Arts', 'San’at'), economics: tx('Economics', 'Iqtisodiyot'), agriculture: tx('Agriculture', 'Qishloq xo‘jaligi') })[s] ?? s;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-extrabold">{t('nav.universities')}</h1>
        <a href={advanced ? href('universities', 'finder') : href('universities', 'advanced')}>
          {advanced ? tx('Back', 'Orqaga') : tx('Advanced search with all filters', 'Barcha filtrlar bilan kengaytirilgan qidiruv')}
        </a>
      </div>

      <Card className="space-y-3">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
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
        <div className="flex items-center justify-between gap-3">
          <p role="status" className="text-sm font-semibold">{tx('{0} universities', '{0} ta universitet', hits.length)}</p>
          {active && <Button size="sm" onClick={() => { setF({}); setIelts(''); }}>{tx('Reset filters', 'Filtrlarni tiklash')}</Button>}
        </div>
      </Card>

      {hits.length === 0 ? (
        <p className="py-6 text-center text-muted">{tx('No university matches these filters. Try removing one.', 'Bu filtrlarga mos universitet yo‘q. Birini olib tashlab ko‘ring.')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hits.map((h) => (
            <div key={h.university.id} className="flex flex-col gap-1">
              <UniCard u={h.university} />
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
