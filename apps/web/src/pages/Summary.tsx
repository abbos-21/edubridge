import { useMemo, useRef, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { LEVELS, TIER_INFO, type Tier } from '@edubridge/shared';
import { useI18n } from '../i18n/I18nProvider';
import { useStore } from '../store/AppStore';
import { useCatalog } from '../data/CatalogProvider';
import { formatDate } from '../lib/format';
import { href } from '../lib/router';
import { checkProfile } from '../lib/growth/check';
import { IDEAS, type Group } from '../lib/growth/ideas';
import { Button, Card, Notice } from '../components/ui';

/**
 * #summary: a one-page A4 summary, built and exported entirely in the browser (nothing is sent anywhere).
 * The student chooses what goes on it. The name is off by default.
 */
const CAP = { perGroup: 4, gaps: 6, plan: 8, deadlines: 6 };
const today = () => new Date().toISOString().slice(0, 10);

export function Summary() {
  const { tx, pick, lang } = useI18n();
  const store = useStore();
  const cat = useCatalog();
  const p = store.profile;
  const sheet = useRef<HTMLDivElement>(null);
  const [inc, setInc] = useState({ name: false, targets: true, gaps: true, plan: true, deadlines: true });
  const [group, setGroup] = useState<Group>('middle');
  const [busy, setBusy] = useState(false);
  const level: 'bachelor' | 'master' = p?.targetLevel === 'bachelor' ? 'bachelor' : 'master';

  const saved = useMemo(() => cat.universities.filter((u) => store.saved.includes(u.id)), [cat, store.saved]);
  const byTier = (['selective', 'middle', 'accessible'] as Tier[]).map((t) => ({ tier: t, list: saved.filter((u) => u.tier === t) })).filter((g) => g.list.length);
  const gaps = useMemo(() => (p ? checkProfile(p, group, level).filter((c) => c.status === 'gap') : []), [p, group, level]);
  const plan = store.growth.items.map((i) => ({ idea: IDEAS.find((x) => x.id === i.ideaId), start: i.start })).filter((x) => x.idea).sort((a, b) => a.start - b.start);
  const deadlines = useMemo(() => {
    const t = today();
    return saved
      .flatMap((u) => LEVELS.map((l) => ({ u, l, lv: u.levels[l] })))
      .filter(({ lv }) => lv && lv.open !== 'no' && lv.deadline?.date && /^\d{4}-\d{2}-\d{2}$/.test(lv.deadline.date) && lv.deadline.date >= t && (lv.deadline.source || lv.sources?.length))
      .map(({ u, l, lv }) => ({ name: u.name, level: l, date: lv!.deadline!.date! }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [saved]);

  const png = async () => {
    if (!sheet.current) return;
    setBusy(true);
    try {
      const { toPng } = await import('html-to-image');
      const url = await toPng(sheet.current, { pixelRatio: 2, backgroundColor: '#ffffff' });
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edubridge-summary.png';
      a.click();
    } finally {
      setBusy(false);
    }
  };

  const flags: Array<[keyof typeof inc, string]> = [
    ['name', tx('My name', 'Ismim')],
    ['targets', tx('My saved universities by group', 'Saqlangan universitetlarim guruhlar bo‘yicha')],
    ['gaps', tx('Profile gaps', 'Profildagi bo‘shliqlar')],
    ['plan', tx('Plan steps', 'Reja qadamlari')],
    ['deadlines', tx('Next confirmed deadlines', 'Keyingi tasdiqlangan muddatlar')],
  ];
  const lvl = (l: string) => (l === 'bachelor' ? tx('Bachelor', 'Bakalavr') : tx('Master', 'Magistratura'));

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <style>{PRINT_CSS}</style>
      <div className="no-print space-y-3">
        <h1 className="text-2xl font-extrabold">{tx('My one-page summary', 'Mening bir sahifalik xulosam')}</h1>
        <p className="text-sm text-muted">{tx('Choose what to include, then save it as a PDF (Print → Save as PDF) or an image. It is made on this device; nothing is uploaded.', 'Nimalar kiritilishini tanlang, so‘ng PDF (Chop etish → PDF sifatida saqlash) yoki rasm qilib saqlang. U shu qurilmada yaratiladi; hech narsa yuklanmaydi.')}</p>
        {!p && <Notice>{tx('Without a profile the summary shows only your saved universities and dates.', 'Profilsiz xulosada faqat saqlangan universitetlaringiz va sanalaringiz chiqadi.')} <a href={href('onboarding')}>{tx('Build my profile', 'Profilimni yaratish')}</a></Notice>}
        <Card className="space-y-2">
          <fieldset className="flex flex-wrap gap-x-5 gap-y-1">
            <legend className="mb-1 font-bold">{tx('Include', 'Kiritish')}</legend>
            {flags.map(([k, label]) => (
              <label key={k} className="flex min-h-[40px] items-center gap-2">
                <input type="checkbox" className="h-5 w-5" checked={inc[k]} disabled={k === 'name' && !p?.name} onChange={(e) => setInc({ ...inc, [k]: e.target.checked })} /> {label}
              </label>
            ))}
          </fieldset>
          {p && inc.gaps && (
            <label className="flex flex-wrap items-center gap-2 text-sm">{tx('Compare my profile with the group', 'Profilimni guruh bilan solishtirish')}
              <select className="min-h-[40px] rounded-xl border border-line bg-surface px-2" value={group} onChange={(e) => setGroup(e.target.value as Group)}>
                {(['selective', 'middle', 'accessible'] as Tier[]).map((t) => <option key={t} value={t}>{pick(TIER_INFO[t].name)}</option>)}
              </select>
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => window.print()}><Printer size={16} aria-hidden /> {tx('Print / save as PDF', 'Chop etish / PDF saqlash')}</Button>
            <Button disabled={busy} onClick={() => void png()}><Download size={16} aria-hidden /> {tx('Download image (PNG)', 'Rasmni yuklab olish (PNG)')}</Button>
          </div>
        </Card>
      </div>

      <div className="summary-frame">
        <div ref={sheet} id="summary-sheet" data-testid="summary-sheet" className="summary-sheet">
          <header className="border-b border-neutral-300 pb-2">
            <h2 className="text-[18px] font-extrabold">EduBridge — {tx('study abroad summary', 'chet elda o‘qish xulosasi')}</h2>
            <p className="text-[11px] text-neutral-600">
              {inc.name && p?.name ? `${p.name} · ` : ''}
              {p ? `${tx('Target level', 'Maqsad darajasi')}: ${lvl(level)}${p.applicationYear ? ` · ${tx('Apply in', 'Topshirish yili')} ${p.applicationYear}` : ''} · ` : ''}
              {tx('Made on {0}', '{0} da tuzilgan', formatDate(today(), lang) ?? '')}
            </p>
          </header>
          {inc.targets && (
            <section>
              <h3>{tx('My saved universities', 'Saqlangan universitetlarim')}</h3>
              {byTier.length === 0 ? <p className="muted">{tx('No universities saved yet.', 'Hali universitet saqlanmagan.')}</p> : byTier.map((g) => (
                <p key={g.tier}><b>{pick(TIER_INFO[g.tier].name)}:</b> {g.list.slice(0, CAP.perGroup).map((u) => u.name).join('; ')}{g.list.length > CAP.perGroup ? ` (+${g.list.length - CAP.perGroup})` : ''}</p>
              ))}
            </section>
          )}
          {inc.gaps && p && (
            <section>
              <h3>{tx('Profile gaps to work on', 'Ustida ishlash kerak bo‘lgan bo‘shliqlar')} ({pick(TIER_INFO[group].name)})</h3>
              {gaps.length === 0 ? <p className="muted">{tx('No clear gaps found with the information entered.', 'Kiritilgan ma’lumotlar bo‘yicha aniq bo‘shliq topilmadi.')}</p> : (
                <ul>{gaps.slice(0, CAP.gaps).map((c) => <li key={c.id}><b>{pick(c.title)}:</b> {pick(c.now)} → {pick(c.target)}</li>)}</ul>
              )}
            </section>
          )}
          {inc.plan && (
            <section>
              <h3>{tx('My plan', 'Mening rejam')}</h3>
              {plan.length === 0 ? <p className="muted">{tx('No activities in the plan yet.', 'Rejada hali faoliyat yo‘q.')}</p> : (
                <ul>{plan.slice(0, CAP.plan).map((x) => <li key={x.idea!.id}>{tx('Month {0}', '{0}-oy', x.start)}: {pick(x.idea!.title)}</li>)}</ul>
              )}
            </section>
          )}
          {inc.deadlines && (
            <section>
              <h3>{tx('Next confirmed deadlines', 'Keyingi tasdiqlangan muddatlar')}</h3>
              {deadlines.length === 0 ? <p className="muted">{tx('No confirmed open deadlines among your saved universities.', 'Saqlangan universitetlaringizda tasdiqlangan ochiq muddat yo‘q.')}</p> : (
                <ul>{deadlines.slice(0, CAP.deadlines).map((d, i) => <li key={i}><b>{formatDate(d.date, lang)}</b> — {d.name} ({lvl(d.level)})</li>)}</ul>
              )}
            </section>
          )}
          <footer className="mt-auto border-t border-neutral-300 pt-2 text-[10px] text-neutral-600">
            {tx('This summary is guidance, not a prediction of admission. Always check the official university page before you apply.', 'Bu xulosa yo‘l-yo‘riq, qabulni bashorat qilish emas. Topshirishdan oldin har doim universitetning rasmiy sahifasini tekshiring.')}
          </footer>
        </div>
      </div>
    </div>
  );
}

const PRINT_CSS = `
.summary-frame { overflow-x: auto; }
.summary-sheet { width: 210mm; height: 296mm; box-sizing: border-box; padding: 12mm; margin: 0 auto; background: #fff; color: #171717; display: flex; flex-direction: column; gap: 6px; overflow: hidden; border: 1px solid #d4d4d4; font-size: 11.5px; line-height: 1.35; }
.summary-sheet h3 { font-size: 13px; font-weight: 800; margin: 6px 0 2px; }
.summary-sheet ul { list-style: disc; padding-left: 16px; }
.summary-sheet .muted { color: #525252; }
@page { size: A4; margin: 0; }
@media print {
  body { background: #fff !important; }
  #root > div > :not(main) { display: none !important; }
  .no-print { display: none !important; }
  main { padding: 0 !important; max-width: none !important; }
  .summary-frame { overflow: visible; margin: 0 !important; }
  .summary-sheet { border: 0; margin: 0; }
  #root > div { min-height: 0 !important; }
}
`;
