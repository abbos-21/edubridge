import { useState } from 'react';
import { useStore } from '../store/AppStore';
import { Check } from 'lucide-react';
import type { L } from '@edubridge/shared';
import { useI18n } from '../i18n/I18nProvider';
import { Card, Notice, PageHeader, Tabs, cx } from '../components/ui';

const l = (en: string, uz: string): L => ({ en, uz });

/** The glossary and the preparation roadmap of the original EduBridge (same wording). */
export const TERMS: Array<{ term: string; def: L }> = [
  { term: 'Foundation', def: l('A one-year preparatory programme before a bachelor’s degree. It is often needed when your school certificate is not equivalent to the country’s entry level (e.g. 11 vs 12 years).', 'Bakalavrdan oldingi bir yillik tayyorlov dasturi. Maktab attestatingiz davlatning kirish darajasiga teng bo‘lmasa (masalan, 11 va 12 yil) ko‘pincha kerak bo‘ladi.') },
  { term: 'Studienkolleg', def: l('A German preparatory college for international applicants whose certificate does not give direct entry. It ends with the Feststellungsprüfung (assessment exam).', 'Attestati to‘g‘ridan-to‘g‘ri kirish huquqini bermaydigan xorijiy abituriyentlar uchun Germaniyadagi tayyorlov kolleji. U Feststellungsprüfung (baholash imtihoni) bilan tugaydi.') },
  { term: 'GPA', def: l('Grade point average — the average of your grades, often on a 4.0 scale. Scales differ by country, so a GPA is not simply converted into a percentage.', 'Baholarning o‘rtacha ko‘rsatkichi, ko‘pincha 4.0 shkalada. Shkalalar davlatga qarab farq qiladi, shuning uchun GPA oddiy foizga almashtirilmaydi.') },
  { term: 'ECTS', def: l('The European credit system. One academic year is usually 60 ECTS; a bachelor’s is often 180 or 240 ECTS.', 'Yevropa kredit tizimi. Bir o‘quv yili odatda 60 ECTS; bakalavr ko‘pincha 180 yoki 240 ECTS.') },
  { term: 'SOP / motivation letter', def: l('A letter explaining why you chose the programme, what prepared you for it and what you plan to do. Write it yourself, specifically for each programme.', 'Nega shu dasturni tanlaganingiz, sizni unga nima tayyorlagani va nima qilmoqchi ekaningizni tushuntiruvchi xat. Uni o‘zingiz, har bir dastur uchun alohida yozing.') },
  { term: 'Research proposal', def: l('A short plan for research: the question, why it matters, the method and a timeline. Usually needed for research master’s and PhD programmes.', 'Tadqiqotning qisqa rejasi: savol, ahamiyati, usul va vaqt jadvali. Odatda research magistratura va PhD dasturlari uchun kerak.') },
  { term: 'Conditional offer', def: l('An offer that becomes final only when you meet stated conditions — for example, sending a language certificate or your final diploma by a date.', 'Ko‘rsatilgan shartlarni bajarganingizdagina yakuniy bo‘ladigan taklif — masalan, til sertifikati yoki yakuniy diplomni belgilangan sanagacha yuborish.') },
  { term: 'Tuition waiver', def: l('A full or partial reduction of tuition. It does not pay your living costs — rent, food and insurance still need funding.', 'Kontrakt to‘lovining to‘liq yoki qisman kamaytirilishi. U yashash xarajatlarini to‘lamaydi — ijara, oziq-ovqat va sug‘urta uchun baribir mablag‘ kerak.') },
  { term: 'One-tier master', def: l('An integrated programme that runs straight from school to a master’s-level degree without a separate bachelor’s (e.g. General Medicine at Semmelweis).', 'Maktabdan keyin alohida bakalavrsiz to‘g‘ridan-to‘g‘ri magistr darajasigacha davom etadigan uzluksiz dastur (masalan, Semmelweis’dagi General Medicine).') },
];

export function Glossary() {
  const { tx, pick } = useI18n();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={tx('Glossary', 'Lug‘at')} title={tx('Words you will meet when applying', 'Ariza jarayonida uchraydigan so‘zlar')} />
      <dl className="grid gap-3">
        {TERMS.map((t) => (
          <Card key={t.term}>
            <dt className="text-[16px] font-extrabold">{t.term}</dt>
            <dd className="mt-1 text-[14px] text-muted">{pick(t.def)}</dd>
          </Card>
        ))}
      </dl>
    </div>
  );
}

type Level = 'bachelor' | 'master';
export function steps(level: Level): Array<{ id: string; when: L; items: Array<{ id: string; text: L }> }> {
  const a = level === 'bachelor';
  const t = (n: string, en: string, uz: string) => ({ id: `${level}-${n}`, text: l(en, uz) });
  return [
    { id: '12', when: l('9–12 months before', '9–12 oy oldin'), items: [
      t('a', 'Choose countries, subjects and the language of instruction', 'Davlat, yo‘nalish va ta’lim tilini tanlang'),
      t('b', a ? 'Check whether your school certificate is accepted (equivalence, foundation, Studienkolleg)' : 'Check that your bachelor’s degree and credits match the programmes', a ? 'Attestatingiz qabul qilinishini tekshiring (ekvivalentlik, foundation, Studienkolleg)' : 'Bakalavr diplomingiz va kreditlaringiz dasturlarga mosligini tekshiring'),
      t('c', 'Estimate a rough budget: tuition, living costs, insurance, travel', 'Taxminiy budjetni hisoblang: kontrakt, yashash, sug‘urta, yo‘l'),
    ] },
    { id: '9', when: l('6–9 months before', '6–9 oy oldin'), items: [
      t('d', 'Prepare for the language test or academic exam the programmes accept', 'Dasturlar qabul qiladigan til testi yoki akademik imtihonga tayyorlaning'),
      t('e', 'Shortlist programmes and note each official deadline and time zone', 'Dasturlarni saralang va har birining rasmiy muddati va vaqt zonasini yozib qo‘ying'),
      t('f', 'Check grant calls and their own deadlines', 'Grant tanlovlari va ularning o‘z muddatlarini tekshiring'),
    ] },
    { id: '6', when: l('3–6 months before', '3–6 oy oldin'), items: [
      t('g', 'Get transcripts and certified translations', 'Transkript va tasdiqlangan tarjimalarni oling'),
      t('h', a ? 'Ask teachers for recommendation letters if needed' : 'Ask referees for recommendation letters', a ? 'Kerak bo‘lsa o‘qituvchilardan tavsiyanoma so‘rang' : 'Tavsiya beruvchilardan tavsiyanoma so‘rang'),
      t('i', a ? 'Draft your motivation letter' : 'Draft your motivation letter / SOP and research proposal', a ? 'Motivatsion xat qoralamasini yozing' : 'Motivatsion xat / SOP va tadqiqot rejasi qoralamasini yozing'),
    ] },
    { id: '0', when: l('Before the deadline', 'Muddatdan oldin'), items: [
      t('j', 'Check every form field, uploaded document and reference submission', 'Har bir ariza maydoni, yuklangan hujjat va tavsiyanoma yuborilganini tekshiring'),
      t('k', 'Pay the application fee and keep the receipt', 'Ariza to‘lovini to‘lang va kvitansiyani saqlang'),
      t('l', 'Submit university and grant applications on their own portals', 'Universitet va grant arizalarini o‘z portallarida yuboring'),
    ] },
    { id: 'after', when: l('After the result', 'Natijadan keyin'), items: [
      t('m', 'Read the offer conditions and deadlines for accepting it', 'Taklif (offer) shartlari va uni qabul qilish muddatini o‘qing'),
      t('n', 'Confirm funding and any documents the university still needs', 'Moliyalashtirish va universitet hali so‘rayotgan hujjatlarni tasdiqlang'),
      t('o', 'Arrange the visa and housing through official sources', 'Viza va turar joyni rasmiy manbalar orqali hal qiling'),
    ] },
  ];
}

/** A general timeline. It does not use any deadline from the catalogue and is not an official calendar. */
export function Roadmap() {
  const { tx, pick } = useI18n();
  const [level, setLevel] = useState<Level>('bachelor');
  const { workspace, patchWorkspace } = useStore();
  const done = workspace.roadmap;
  const toggle = (id: string) => patchWorkspace({ roadmap: { ...done, [id]: !done[id] } });
  const groups = steps(level);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const count = groups.reduce((n, g) => n + g.items.filter((i) => done[i.id]).length, 0);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={tx('Approximate preparation plan', 'Taxminiy tayyorgarlik rejasi')} title={tx('Preparation roadmap', 'Qabulga tayyorlanish yo‘l xaritasi')}>
        {tx('A suggested timeline counted back from your deadline. It is not an official admission calendar.', 'Muddatdan orqaga hisoblangan tavsiya etilgan vaqt rejasi. Bu rasmiy qabul kalendari emas.')}
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs<Level> label={tx('Level', 'Daraja')} value={level} onChange={setLevel} tabs={[{ id: 'bachelor', label: tx('Bachelor', 'Bakalavr') }, { id: 'master', label: tx('Master', 'Magistr') }]} />
        <p className="tabular text-[13.5px] font-semibold text-muted">{count}/{total} {tx('done', 'bajarildi')}</p>
      </div>
      <ol className="flex flex-col gap-3">
        {groups.map((g) => (
          <li key={g.id}>
            <Card>
              <h2 className="text-[15.5px] font-extrabold">{pick(g.when)}</h2>
              <ul className="mt-2 flex flex-col gap-1.5">
                {g.items.map((i) => (
                  <li key={i.id}>
                    <button type="button" role="checkbox" aria-checked={!!done[i.id]} onClick={() => toggle(i.id)} className="flex w-full items-start gap-2.5 rounded-lg px-1 py-1 text-left hover:bg-sunken">
                      <span className={cx('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border-2', done[i.id] ? 'border-teal bg-teal text-white' : 'border-line')}>{done[i.id] && <Check size={13} strokeWidth={3} aria-hidden />}</span>
                      <span className={cx('text-[14px]', done[i.id] && 'text-muted line-through')}>{pick(i.text)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ))}
      </ol>
      <div className="mt-4">
        <Notice tone="warn">{tx('No promises here: a good IELTS alone is not enough, a grant is never certain, and meeting a minimum does not guarantee admission. A high language score does not replace missing subjects or credits.', 'Bu yerda va’da yo‘q: faqat yaxshi IELTS yetarli emas, grant hech qachon aniq emas, minimal ballga yetish qabulni kafolatlamaydi. Yuqori til bali yetishmayotgan fan yoki kreditlarni avtomatik qoplamaydi.')}</Notice>
      </div>
    </div>
  );
}
