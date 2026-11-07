import { useState, type ReactNode } from 'react';
import { TIER_INFO, type Level, type University } from '@edubridge/shared';
import { useI18n } from '../i18n/I18nProvider';
import { useCatalog } from '../data/CatalogProvider';
import { useStore } from '../store/AppStore';
import { href } from '../lib/router';
import { formatMoney } from '../lib/format';
import { Card, Tabs } from '../components/ui';
import { NotConfirmed } from '../components/common';
import { useUniText } from './UniProfile';

type Row = { label: string; cell: (u: University) => ReactNode };

export function UniCompare({ ids }: { ids: string | null }) {
  const { tx, t, pick, lang } = useI18n();
  const { universities } = useCatalog();
  const { compare } = useStore();
  const [level, setLevel] = useState<Level>('bachelor');
  const { openLabel, tuition, deadline } = useUniText();

  const wanted = (ids ? ids.split(',') : compare).filter(Boolean).slice(0, 3);
  const unis = wanted.map((id) => universities.find((u) => u.id === id)).filter((u): u is University => !!u);

  if (unis.length < 2) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-extrabold">{t('nav.compare')}</h1>
        <p>{tx('Nothing to compare yet', 'Hozircha taqqoslash uchun hech narsa yo‘q')}</p>
        <p className="text-muted">{tx('Pick at least 2', 'Kamida 2 tasini tanlang')}. {tx('You can compare up to 3', 'Ko‘pi bilan 3 tasini taqqoslash mumkin')}.</p>
        <a href={href('universities')}>{t('nav.universities')} →</a>
      </div>
    );
  }

  const rows: Row[] = [
    { label: tx('Group', 'Guruh'), cell: (u) => pick(TIER_INFO[u.tier].name) },
    { label: 'QS 2027', cell: (u) => (u.ranking?.value != null ? u.ranking.value : <NotConfirmed />) },
    { label: tx('Open to international students?', 'Xalqaro talabalar uchun ochiqmi?'), cell: (u) => openLabel(u.levels[level]?.open) },
    { label: tx('Language of instruction', 'O‘qitish tili'), cell: (u) => (u.levels[level]?.language ? pick(u.levels[level]!.language) : <NotConfirmed />) },
    { label: 'IELTS', cell: (u) => { const l = u.levels[level]; return l?.ielts != null ? `${l.ielts} (${l.ieltsScope === 'general' ? tx('whole university', 'butun universitet') : tx('programme-specific', 'dasturga xos')})` : <NotConfirmed />; } },
    { label: tx('Tuition', 'Kontrakt'), cell: (u) => tuition(u.levels[level]) },
    { label: tx('Application fee', 'Ariza to‘lovi'), cell: (u) => (u.fee?.amount != null ? formatMoney(u.fee.amount, u.fee.currency, lang) : <NotConfirmed />) },
    { label: tx('Deadline', 'Muddat'), cell: (u) => deadline(u.levels[level]) },
    { label: tx('Grants and scholarships', 'Grantlar va stipendiyalar'), cell: (u) => (u.scholarships.length ? tx('{0} university scholarship(s) recorded for international students.', 'Xalqaro talabalar uchun {0} ta universitet stipendiyasi qayd etilgan.', u.scholarships.length) : tx('No university scholarship for international students was recorded.', 'Xalqaro talabalar uchun universitet stipendiyasi qayd etilmagan.')) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{t('nav.compare')}</h1>
      <Tabs label={tx('Level', 'Daraja')} value={level} onChange={setLevel} tabs={[{ id: 'bachelor', label: t('lvl.bachelor') }, { id: 'master', label: t('lvl.master') }]} />

      {/* desktop: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{t('nav.compare')}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-48 p-3 text-left" />
              {unis.map((u) => (
                <th key={u.id} scope="col" className="p-3 text-left align-top">
                  <a href={href('uni', u.id)} className="font-extrabold">{u.name}</a>
                  <span className="block font-normal text-muted">{u.city}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-line">
                <th scope="row" className="p-3 text-left align-top font-semibold">{r.label}</th>
                {unis.map((u) => <td key={u.id} className="p-3 align-top">{r.cell(u)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile: cards */}
      <div className="space-y-3 md:hidden">
        {unis.map((u) => (
          <Card key={u.id}>
            <a href={href('uni', u.id)} className="text-lg font-extrabold">{u.name}</a>
            <p className="text-sm text-muted">{u.city}</p>
            <dl className="mt-2 divide-y divide-line text-sm">
              {rows.map((r) => (
                <div key={r.label} className="py-2">
                  <dt className="font-semibold">{r.label}</dt>
                  <dd>{r.cell(u)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted">{tx('A blank is never zero or free: it means the value is not confirmed.', 'Bo‘sh joy hech qachon nol yoki bepul degani emas: qiymat tasdiqlanmagan degani.')}</p>
    </div>
  );
}
