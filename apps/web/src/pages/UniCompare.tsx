import { useState, type ReactNode } from 'react';
import { TIER_INFO, type Level, type University } from '@edubridge/shared';
import { useI18n } from '../i18n/I18nProvider';
import { useCatalog } from '../data/CatalogProvider';
import { useStore } from '../store/AppStore';
import { href } from '../lib/router';
import { formatMoney } from '../lib/format';
import { Button, Card, Field, Input, Tabs, cx } from '../components/ui';
import { useToast } from '../components/Toasts';
import { navigate } from '../lib/router';
import { newId } from '../lib/plans';
import { NotConfirmed } from '../components/common';
import { useUniText } from './UniProfile';

type Row = { label: string; cell: (u: University) => ReactNode; sig: (u: University) => string };

export function UniCompare({ ids }: { ids: string | null }) {
  const { tx, t, pick, lang } = useI18n();
  const { universities } = useCatalog();
  const { compare, workspace, patchWorkspace, clearCompare, toggleCompare } = useStore();
  const notify = useToast();
  const [name, setName] = useState('');
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
    { label: tx('Group', 'Guruh'), cell: (u) => pick(TIER_INFO[u.tier].name), sig: (u) => u.tier },
    { label: 'QS 2027', cell: (u) => (u.ranking?.value != null ? u.ranking.value : <NotConfirmed />), sig: (u) => String(u.ranking?.value ?? '') },
    { label: tx('Open to international students?', 'Xalqaro talabalar uchun ochiqmi?'), cell: (u) => openLabel(u.levels[level]?.open), sig: (u) => String(u.levels[level]?.open ?? '') },
    { label: tx('Language of instruction', 'O‘qitish tili'), cell: (u) => (u.levels[level]?.language ? pick(u.levels[level]!.language) : <NotConfirmed />), sig: (u) => pick(u.levels[level]?.language) },
    { label: 'IELTS', cell: (u) => { const l = u.levels[level]; return l?.ielts != null ? `${l.ielts} (${l.ieltsScope === 'general' ? tx('whole university', 'butun universitet') : tx('programme-specific', 'dasturga xos')})` : <NotConfirmed />; }, sig: (u) => `${u.levels[level]?.ielts ?? ''}|${u.levels[level]?.ieltsScope ?? ''}` },
    { label: tx('Tuition', 'Kontrakt'), cell: (u) => tuition(u.levels[level]), sig: (u) => JSON.stringify(u.levels[level]?.tuition ?? null) },
    { label: tx('Application fee', 'Ariza to‘lovi'), cell: (u) => (u.fee?.amount != null ? formatMoney(u.fee.amount, u.fee.currency, lang) : <NotConfirmed />), sig: (u) => `${u.fee?.amount ?? ''}${u.fee?.currency ?? ''}` },
    { label: tx('Deadline', 'Muddat'), cell: (u) => deadline(u.levels[level]), sig: (u) => JSON.stringify(u.levels[level]?.deadline ?? null) },
    { label: tx('Grants and scholarships', 'Grantlar va stipendiyalar'), cell: (u) => (u.scholarships.length ? tx('{0} university scholarship(s) recorded for international students.', 'Xalqaro talabalar uchun {0} ta universitet stipendiyasi qayd etilgan.', u.scholarships.length) : tx('No university scholarship for international students was recorded.', 'Xalqaro talabalar uchun universitet stipendiyasi qayd etilmagan.')), sig: (u) => String(u.scholarships.length) },
  ];

  const differs = (r: Row) => new Set(unis.map(r.sig)).size > 1;
  const saveCurrent = () => {
    const n = name.trim() || unis.map((u) => u.short ?? u.name).join(' / ');
    patchWorkspace({ comparisons: [{ id: newId(), name: n.slice(0, 80), ids: unis.map((u) => u.id), level }, ...workspace.comparisons].slice(0, 30) });
    setName('');
    notify(tx('Comparison saved', 'Taqqoslash saqlandi'));
  };
  const load = (ids: string[], lv: Level) => {
    clearCompare();
    for (const id of ids) toggleCompare(id);
    setLevel(lv);
    navigate('unicompare');
    notify(tx('Comparison loaded', 'Taqqoslash yuklandi'));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{t('nav.compare')}</h1>
      <p className="text-[13.5px] text-muted">{tx('Rows with a tinted background differ between the options. EduBridge does not pick a “best” option — that depends on your priorities.', 'Fon rangi o‘zgargan qatorlar variantlar orasida farq qiladi. EduBridge “eng yaxshi”ni tanlamaydi — bu sizning ustuvorliklaringizga bog‘liq.')}</p>
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
              <tr key={r.label} className={cx('border-t border-line', differs(r) && 'bg-sunken')}>
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
                <div key={r.label} className={cx('py-2', differs(r) && 'bg-sunken px-2')}>
                  <dt className="font-semibold">{r.label}</dt>
                  <dd>{r.cell(u)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Field label={tx('Name this comparison', 'Taqqoslashga nom bering')}><Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder={tx('e.g. Funded options', 'masalan, Grantli variantlar')} /></Field>
        <Button variant="primary" onClick={saveCurrent}>{tx('Save comparison', 'Taqqoslashni saqlash')}</Button>
      </div>
      {workspace.comparisons.length > 0 && (
        <section>
          <h2 className="mb-2 font-bold">{tx('Saved comparisons', 'Saqlangan taqqoslashlar')}</h2>
          <ul className="flex flex-col gap-1.5 text-sm">
            {workspace.comparisons.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                <span className="font-semibold">{c.name}</span>
                <span className="flex gap-1"><Button size="sm" onClick={() => load(c.ids, c.level)}>{tx('Open', 'Ochish')}</Button><Button size="sm" variant="ghost" onClick={() => patchWorkspace({ comparisons: workspace.comparisons.filter((x) => x.id !== c.id) })}>{tx('Delete', 'O‘chirish')}</Button></span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-xs text-muted">{tx('A blank is never zero or free: it means the value is not confirmed.', 'Bo‘sh joy hech qachon nol yoki bepul degani emas: qiymat tasdiqlanmagan degani.')}</p>
    </div>
  );
}
