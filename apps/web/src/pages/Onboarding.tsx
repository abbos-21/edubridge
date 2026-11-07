import { useMemo, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import type { L } from '@edubridge/shared';
import { useI18n } from '../i18n/I18nProvider';
import { useCatalog } from '../data/CatalogProvider';
import { useStore } from '../store/AppStore';
import { href, navigate } from '../lib/router';
import { DEFAULT_PROFILE, EXPERIENCE_KEYS, SCALE_MAX, STEPS, num, validateStep, type ErrorKey, type StudentProfile } from '../lib/profile';
import fields from '../data/fields.json';
import { Button, Card, Input, Notice, Select, cx } from '../components/ui';

const FIELD_LABELS = fields as unknown as Record<string, L>;

function FormField({ label, hint, error, optional, children }: { label: string; hint?: string; error?: string; optional?: boolean; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold">
        {label} {optional && <span className="font-normal text-muted">· {t('m.optional')}</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
      {error && <span role="alert" className="text-xs font-semibold text-bad">{error}</span>}
    </label>
  );
}

function Check2({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex min-h-[44px] items-center gap-2 text-sm">
      <input type="checkbox" className="h-5 w-5" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

const Area = ({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string }) => (
  <textarea aria-label={label} className="min-h-[88px] w-full rounded-xl border border-line bg-surface p-3 text-sm" value={value} placeholder={placeholder} maxLength={2000} onChange={(e) => onChange(e.target.value)} />
);

/** #onboarding: the profile wizard (7 steps). #onboarding--edit opens a saved profile at the review step. */
export function Onboarding({ edit }: { edit: boolean }) {
  const { tx, t, pick, lang } = useI18n();
  const { countries } = useCatalog();
  const store = useStore();
  const editing = edit && !!store.profile;
  const [d, setD] = useState<StudentProfile>(() => ({ ...DEFAULT_PROFILE(), ...(editing ? store.profile : store.onboardingDraft) }));
  const [step, setStep] = useState(editing ? 6 : 0);
  const [errors, setErrors] = useState<Partial<Record<string, ErrorKey>>>({});
  const [note, setNote] = useState<string | null>(null);

  const set = (patch: Partial<StudentProfile>) => {
    const next = { ...d, ...patch };
    setD(next);
    if (!editing) store.saveDraft(next); // progress is kept, so a refresh never loses the answers
  };

  const names = [tx('Basics', 'Asosiy'), tx('Academics', 'O‘qish'), tx('Language', 'Til'), tx('Finances', 'Moliya'), tx('Destinations', 'Davlatlar'), tx('Experience', 'Tajriba'), tx('Review', 'Ko‘rib chiqish')];
  const intros = [
    tx('Salom! Let’s start with the basics. A nickname is fine — this stays in your browser.', 'Salom! Asosiy ma’lumotlardan boshlaymiz. Taxallus ham bo‘laveradi — bu faqat brauzeringizda qoladi.'),
    tx('Enter your grades exactly as they appear on your documents. We never convert between grading systems.', 'Baholaringizni hujjatdagidek kiriting. Biz baholash tizimlarini bir-biriga aylantirmaymiz.'),
    tx('No certificate yet? That’s okay. We’ll mark it as missing information, not as a “no”.', 'Hali sertifikat yo‘qmi? Hechqisi yo‘q. Biz uni “mos emas” emas, “ma’lumot yetishmaydi” deb belgilaymiz.'),
    tx('Tuition is only part of the cost. Rent, food, insurance and travel count too.', 'O‘qish to‘lovi xarajatning faqat bir qismi. Ijara, ovqat, sug‘urta va yo‘l ham hisobga kiradi.'),
    tx('Pick a few countries you’re curious about. You can change them any time.', 'Qiziqqan bir nechta davlatni tanlang. Ularni istalgan vaqtda o‘zgartirishingiz mumkin.'),
    tx('Real experiences beat impressive words. Leave blank anything that doesn’t apply.', 'Chiroyli so‘zlardan ko‘ra haqiqiy tajriba muhimroq. Tegishli bo‘lmaganini bo‘sh qoldiring.'),
    tx('Check everything once. You can edit any section before saving.', 'Hammasini bir marta tekshiring. Saqlashdan oldin istalgan bo‘limni tahrirlashingiz mumkin.'),
  ];

  const msg = (k: ErrorKey | undefined): string | undefined => {
    if (!k) return undefined;
    return {
      name: tx('Enter a name or nickname.', 'Ism yoki taxallus kiriting.'),
      citizenship: tx('Enter your citizenship.', 'Fuqaroligingizni kiriting.'),
      year: tx('Check the year.', 'Yilni tekshiring.'),
      score: tx('Enter a number between 0 and {0} for this scale.', 'Bu tizim uchun 0 va {0} oralig‘idagi son kiriting.', SCALE_MAX[d.scale]),
      ielts: tx('IELTS scores run from 0 to 9 in steps of 0.5.', 'IELTS ballari 0 dan 9 gacha, 0.5 qadam bilan.'),
      toefl: tx('TOEFL iBT runs from 0 to 120.', 'TOEFL iBT 0 dan 120 gacha.'),
      sat: tx('SAT runs from 400 to 1600.', 'SAT 400 dan 1600 gacha.'),
      money: tx('Enter a positive number or leave blank.', 'Musbat son kiriting yoki bo‘sh qoldiring.'),
      total: tx('Total budget should include tuition, so it cannot be smaller.', 'Umumiy byudjet o‘qish to‘lovini ham o‘z ichiga oladi, shuning uchun kichik bo‘lmaydi.'),
      work: tx('Enter years of work between 0 and 50.', '0 dan 50 gacha bo‘lgan ish yillarini kiriting.'),
    }[k];
  };

  const goto = (to: number) => {
    if (to > step) {
      const e = validateStep(step, d);
      setErrors(e);
      if (Object.keys(e).length) { setNote(tx('Please fix the highlighted fields', 'Belgilangan maydonlarni tuzating')); return; }
    } else setErrors({});
    setNote(null);
    setStep(to);
    window.scrollTo?.({ top: 0 });
  };

  const finish = () => {
    for (let s = 0; s < 6; s++) {
      const e = validateStep(s, d);
      if (Object.keys(e).length) { setErrors(e); setStep(s); setNote(tx('Some answers need fixing', 'Ayrim javoblarni tuzatish kerak')); return; }
    }
    store.setProfile(d);
    navigate('adviser');
  };

  const toggleCountry = (key: 'preferredCountries' | 'avoidCountries', code: string) => {
    const other = key === 'preferredCountries' ? 'avoidCountries' : 'preferredCountries';
    const has = d[key].includes(code);
    set({ [key]: has ? d[key].filter((c) => c !== code) : [...d[key], code], [other]: d[other].filter((c) => c !== code) } as Partial<StudentProfile>);
  };

  const expLabels: Record<string, string> = useMemo(
    () => ({ leadership: tx('Leadership', 'Yetakchilik'), teamwork: tx('Teamwork', 'Jamoada ishlash'), volunteering: tx('Volunteering', 'Ko‘ngillilik'), competitions: tx('Competitions & olympiads', 'Tanlov va olimpiadalar'), internships: tx('Internships', 'Amaliyot'), employment: tx('Employment', 'Ish'), projects: tx('Independent projects', 'Mustaqil loyihalar'), research: tx('Research', 'Tadqiqot'), academic: tx('Academic achievements', 'Akademik yutuqlar'), community: tx('Community involvement', 'Jamoat faoliyati') }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang],
  );
  const year = new Date().getFullYear();
  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) => (
    <button type="button" aria-pressed={active} onClick={onClick} className={cx('min-h-[44px] rounded-full border px-4 text-sm font-semibold', active ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface')}>
      {active && <Check size={14} className="mr-1 inline" aria-hidden />}
      {children}
    </button>
  );

  let body: ReactNode = null;
  if (step === 0) {
    body = (
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={tx('Name or preferred display name', 'Ism yoki ko‘rsatiladigan ism')} error={msg(errors.name)}><Input value={d.name} autoComplete="given-name" onChange={(e) => set({ name: e.target.value })} /></FormField>
        <FormField label={tx('Citizenship', 'Fuqarolik')} hint={tx('Used for scholarship eligibility.', 'Grant talablarini tekshirish uchun.')} error={msg(errors.citizenship)}>
          <Input value={d.citizenship} list="cit-list" onChange={(e) => set({ citizenship: e.target.value })} />
          <datalist id="cit-list">{['Uzbekistan', 'Kazakhstan', 'Tajikistan', 'Kyrgyzstan', 'Turkmenistan'].map((c) => <option key={c} value={c} />)}</datalist>
        </FormField>
        <FormField label={tx('Country of residence', 'Yashash davlati')}><Input value={d.residence} onChange={(e) => set({ residence: e.target.value })} /></FormField>
        <FormField label={tx('Current education level', 'Hozirgi ta’lim darajasi')}>
          <Select value={d.currentEducation} onChange={(e) => set({ currentEducation: e.target.value as StudentProfile['currentEducation'] })}>
            <option value="school">{tx('School student / graduate', 'Maktab o‘quvchisi / bitiruvchisi')}</option>
            <option value="lyceum_college">{tx('Academic lyceum or college', 'Akademik litsey yoki kollej')}</option>
            <option value="bachelor_student">{tx('Bachelor’s student', 'Bakalavr talabasi')}</option>
            <option value="bachelor_grad">{tx('Bachelor’s graduate', 'Bakalavr bitiruvchisi')}</option>
            <option value="master_grad">{tx('Master’s graduate', 'Magistr bitiruvchisi')}</option>
            <option value="working">{tx('Working professional', 'Ishlayotgan mutaxassis')}</option>
          </Select>
        </FormField>
        <FormField label={tx('Degree you want to study', 'O‘qimoqchi bo‘lgan daraja')}>
          <Select value={d.targetLevel} onChange={(e) => set({ targetLevel: e.target.value as StudentProfile['targetLevel'] })}>
            <option value="bachelor">{t('lvl.bachelor')}</option><option value="master">{t('lvl.master')}</option><option value="phd">{t('lvl.phd')}</option>
          </Select>
        </FormField>
        <FormField label={tx('Field of study', 'Ta’lim yo‘nalishi')}>
          <Select value={d.field} onChange={(e) => set({ field: e.target.value })}>{Object.keys(FIELD_LABELS).map((f) => <option key={f} value={f}>{pick(FIELD_LABELS[f])}</option>)}</Select>
        </FormField>
        <FormField label={tx('Expected application year', 'Taxminiy ariza yili')}>
          <Select value={d.applicationYear} onChange={(e) => set({ applicationYear: Number(e.target.value) })}>{[0, 1, 2, 3].map((n) => <option key={n} value={year + n}>{year + n}</option>)}</Select>
        </FormField>
        <FormField label={tx('Preferred intake', 'Afzal qabul davri')} optional><Input value={d.intake} placeholder={tx('e.g. September 2027', 'masalan, 2027-yil sentabr')} onChange={(e) => set({ intake: e.target.value })} /></FormField>
        <FormField label={tx('Year of birth', 'Tug‘ilgan yil')} optional hint={tx('Only used to check age limits some scholarships publish.', 'Faqat ayrim grantlardagi yosh chegarasini tekshirish uchun.')} error={msg(errors.birthYear)}>
          <Input inputMode="numeric" value={d.birthYear ?? ''} onChange={(e) => set({ birthYear: num(e.target.value) })} />
        </FormField>
      </div>
    );
  } else if (step === 1) {
    body = (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={tx('Current or highest qualification', 'Hozirgi yoki eng yuqori ma’lumot')}><Input value={d.qualification} placeholder={tx('e.g. School leaving certificate', 'masalan, Umumiy o‘rta ta’lim attestati')} onChange={(e) => set({ qualification: e.target.value })} /></FormField>
          <FormField label={tx('School, college or university', 'Maktab, kollej yoki universitet')}><Input value={d.institution} onChange={(e) => set({ institution: e.target.value })} /></FormField>
          <FormField label={tx('Grading scale', 'Baholash tizimi')} hint={tx('We never convert between systems — institutions decide equivalence.', 'Biz tizimlarni bir-biriga aylantirmaymiz — tenglikni muassasalar belgilaydi.')}>
            <Select value={d.scale} onChange={(e) => set({ scale: e.target.value as StudentProfile['scale'] })}>
              <option value="percent">{tx('Percentage (0–100)', 'Foiz (0–100)')}</option>
              <option value="five_point_uz">{tx('Uzbek 5-point scale', 'O‘zbekiston 5 ballik tizimi')}</option>
              <option value="gpa4">{tx('GPA out of 4', '4 ballik GPA')}</option>
              <option value="gpa5">{tx('GPA out of 5', '5 ballik GPA')}</option>
              <option value="other">{tx('Other (describe)', 'Boshqa (tavsiflang)')}</option>
            </Select>
          </FormField>
          <FormField label={tx('GPA or academic score', 'GPA yoki o‘rtacha baho')} optional error={msg(errors.score)}><Input inputMode="decimal" value={d.score ?? ''} onChange={(e) => set({ score: num(e.target.value) })} /></FormField>
          {d.scale === 'other' && <FormField label={tx('Describe your grading system', 'Baholash tizimingizni tavsiflang')}><Input value={d.scaleOther ?? ''} onChange={(e) => set({ scaleOther: e.target.value })} /></FormField>}
          <FormField label={tx('Graduation year', 'Bitirish yili')} optional><Input inputMode="numeric" value={d.graduationYear ?? ''} onChange={(e) => set({ graduationYear: num(e.target.value) })} /></FormField>
          <FormField label={tx('Intended major', 'Rejalashtirilgan mutaxassislik')} optional><Input value={d.major} onChange={(e) => set({ major: e.target.value })} /></FormField>
        </div>
        <FormField label={tx('Relevant academic achievements', 'Tegishli akademik yutuqlar')} optional><Area value={d.achievements} onChange={(v) => set({ achievements: v })} /></FormField>
      </div>
    );
  } else if (step === 2) {
    body = (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label={tx('IELTS overall', 'IELTS umumiy')} optional error={msg(errors.ielts)}><Input inputMode="decimal" value={d.ielts ?? ''} onChange={(e) => set({ ielts: num(e.target.value) })} /></FormField>
          <FormField label="TOEFL iBT" optional error={msg(errors.toefl)}><Input inputMode="numeric" value={d.toefl ?? ''} onChange={(e) => set({ toefl: num(e.target.value) })} /></FormField>
          <FormField label="SAT" optional error={msg(errors.sat)}><Input inputMode="numeric" value={d.sat ?? ''} onChange={(e) => set({ sat: num(e.target.value) })} /></FormField>
        </div>
        {d.ielts !== undefined && (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{tx('IELTS components (if available)', 'IELTS bo‘limlari (bo‘lsa)')}</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(['l', 'r', 'w', 's'] as const).map((k) => (
                <FormField key={k} label={{ l: tx('Listening', 'Tinglash'), r: tx('Reading', 'O‘qish'), w: tx('Writing', 'Yozish'), s: tx('Speaking', 'Gapirish') }[k]}>
                  <Input inputMode="decimal" value={d.ieltsParts?.[k] ?? ''} onChange={(e) => set({ ieltsParts: { ...d.ieltsParts, [k]: num(e.target.value) } })} />
                </FormField>
              ))}
            </div>
          </fieldset>
        )}
        <FormField label={tx('Other language qualifications', 'Boshqa til sertifikatlari')} optional hint={tx('e.g. TOPIK 3, JLPT N3, Goethe B1, Duolingo English Test', 'masalan, TOPIK 3, JLPT N3, Goethe B1, Duolingo English Test')}><Input value={d.otherLanguage} onChange={(e) => set({ otherLanguage: e.target.value })} /></FormField>
        <Check2 checked={d.planningExam} onChange={(v) => set({ planningExam: v })} label={tx('I plan to take a language test', 'Til imtihonini topshirishni rejalashtiryapman')} />
        <Notice>{tx('No certificate yet? That is fine. Many students apply after taking a test. EduBridge will mark language checks as “missing information” rather than “not eligible”.', 'Hali sertifikat yo‘qmi? Hechqisi yo‘q. Ko‘p talabalar imtihondan keyin ariza beradi. EduBridge til tekshiruvini “mos emas” emas, “ma’lumot yetishmaydi” deb belgilaydi.')}</Notice>
      </div>
    );
  } else if (step === 3) {
    body = (
      <div className="space-y-4">
        <FormField label={tx('Currency for your budget', 'Byudjet valyutasi')}>
          <Select value={d.currency} onChange={(e) => set({ currency: e.target.value as StudentProfile['currency'] })}><option value="USD">USD ($)</option><option value="UZS">UZS (so‘m)</option></Select>
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={tx('Maximum tuition per year', 'Yiliga maksimal o‘qish to‘lovi')} optional hint={tx('Tuition only — fees paid to the university.', 'Faqat o‘qish to‘lovi — universitetga to‘lanadigan summa.')} error={msg(errors.tuitionBudget)}><Input inputMode="numeric" value={d.tuitionBudget ?? ''} onChange={(e) => set({ tuitionBudget: num(e.target.value) })} /></FormField>
          <FormField label={tx('Maximum total cost per year', 'Yiliga maksimal umumiy xarajat')} optional hint={tx('Tuition plus rent, food, transport, insurance and travel.', 'O‘qish, ijara, ovqat, transport, sug‘urta va yo‘l xarajatlari birga.')} error={msg(errors.totalBudget)}><Input inputMode="numeric" value={d.totalBudget ?? ''} onChange={(e) => set({ totalBudget: num(e.target.value) })} /></FormField>
        </div>
        <Check2 checked={d.needsFullFunding} onChange={(v) => set({ needsFullFunding: v })} label={tx('I need full funding to study abroad', 'Xorijda o‘qish uchun to‘liq moliyalashtirish kerak')} />
        <Check2 checked={d.partialOk} onChange={(v) => set({ partialOk: v })} label={tx('Partial scholarships are acceptable', 'Qisman grantlar ham ma’qul')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={tx('Can you afford application fees?', 'Ariza to‘lovlarini to‘lay olasizmi?')}>
            <Select value={d.feesAffordable} onChange={(e) => set({ feesAffordable: e.target.value as StudentProfile['feesAffordable'] })}><option value="yes">{t('m.yes')}</option><option value="some">{tx('A few', 'Bir nechtasini')}</option><option value="no">{t('m.no')}</option></Select>
          </FormField>
          <FormField label={tx('Can you show proof of funds if required?', 'Kerak bo‘lsa, mablag‘ borligini isbotlay olasizmi?')}>
            <Select value={d.canShowFunds} onChange={(e) => set({ canShowFunds: e.target.value as StudentProfile['canShowFunds'] })}><option value="yes">{t('m.yes')}</option><option value="partly">{t('m.partial')}</option><option value="no">{t('m.no')}</option><option value="unsure">{tx('Not sure', 'Bilmayman')}</option></Select>
          </FormField>
        </div>
      </div>
    );
  } else if (step === 4) {
    body = (
      <div className="space-y-5">
        <div><p className="mb-2 text-sm font-semibold">{tx('Countries you are interested in', 'Qiziqqan davlatlaringiz')}</p><div className="flex flex-wrap gap-2">{countries.map((c) => <Chip key={c.code} active={d.preferredCountries.includes(c.code)} onClick={() => toggleCountry('preferredCountries', c.code)}>{pick(c.name)}</Chip>)}</div></div>
        <div><p className="mb-2 text-sm font-semibold">{tx('Countries you want to avoid', 'Istamagan davlatlaringiz')} <span className="font-normal text-muted">· {t('m.optional')}</span></p><div className="flex flex-wrap gap-2">{countries.map((c) => <Chip key={c.code} active={d.avoidCountries.includes(c.code)} onClick={() => toggleCountry('avoidCountries', c.code)}>{pick(c.name)}</Chip>)}</div></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={tx('Language of instruction', 'O‘qitish tili')}><Select value={d.instructionPref} onChange={(e) => set({ instructionPref: e.target.value as StudentProfile['instructionPref'] })}><option value="English">{tx('English only', 'Faqat ingliz tili')}</option><option value="any">{tx('Open to other languages', 'Boshqa tillar ham mumkin')}</option></Select></FormField>
          <FormField label={tx('Public or private', 'Davlat yoki xususiy')}><Select value={d.sectorPref} onChange={(e) => set({ sectorPref: e.target.value as StudentProfile['sectorPref'] })}><option value="any">{t('m.any')}</option><option value="public">{tx('Public', 'Davlat')}</option><option value="private">{tx('Private', 'Xususiy')}</option></Select></FormField>
          <FormField label={tx('Programme length', 'Dastur davomiyligi')}><Select value={d.durationPref} onChange={(e) => set({ durationPref: e.target.value as StudentProfile['durationPref'] })}><option value="any">{t('m.any')}</option><option value="short">{tx('As short as possible', 'Imkon qadar qisqa')}</option><option value="standard">{tx('Standard length', 'Standart')}</option></Select></FormField>
          <FormField label={tx('Programme focus', 'Dastur yo‘nalganligi')}><Select value={d.orientationPref} onChange={(e) => set({ orientationPref: e.target.value as StudentProfile['orientationPref'] })}><option value="any">{t('m.any')}</option><option value="research">{tx('Research-oriented', 'Ilmiy yo‘nalishda')}</option><option value="employment">{tx('Employment-oriented', 'Ishga yo‘naltirilgan')}</option></Select></FormField>
        </div>
        <FormField label={tx('Anything else that matters to you', 'Siz uchun muhim boshqa jihatlar')} optional hint={tx('e.g. small classes, Muslim-friendly campus, internships, city size. Rankings are not used as a measure of quality.', 'masalan, kichik guruhlar, amaliyot imkoniyati, shahar kattaligi. Reytinglar sifat o‘lchovi sifatida ishlatilmaydi.')}><Area value={d.characteristics} onChange={(v) => set({ characteristics: v })} /></FormField>
      </div>
    );
  } else if (step === 5) {
    body = (
      <div className="space-y-4">
        <Notice>{tx('Describe real experiences in your own words. Leave anything blank that does not apply — not every university asks for extracurricular activities.', 'Haqiqiy tajribangizni o‘z so‘zlaringiz bilan yozing. Tegishli bo‘lmaganini bo‘sh qoldiring — har bir universitet darsdan tashqari faoliyatni so‘ramaydi.')}</Notice>
        <FormField label={tx('Years of work experience', 'Ish tajribasi (yil)')} optional hint={tx('Some master’s scholarships require work experience.', 'Ayrim magistratura grantlari ish tajribasini talab qiladi.')} error={msg(errors.workYears)}><Input inputMode="decimal" value={d.workYears ?? ''} onChange={(e) => set({ workYears: num(e.target.value) })} /></FormField>
        <div className="grid gap-4 md:grid-cols-2">
          {EXPERIENCE_KEYS.map((k) => (
            <FormField key={k} label={expLabels[k]!} optional>
              <Area value={d.experiences[k] ?? ''} placeholder={tx('What did you do, when, and what happened?', 'Nima qildingiz, qachon va natija qanday bo‘ldi?')} onChange={(v) => set({ experiences: { ...d.experiences, [k]: v } })} />
            </FormField>
          ))}
        </div>
      </div>
    );
  } else {
    const row = (k: string, v: ReactNode) => (
      <div key={k} className="flex justify-between gap-3 border-b border-line py-1 text-sm"><dt className="text-muted">{k}</dt><dd className="text-right font-semibold">{v === undefined || v === '' ? '—' : v}</dd></div>
    );
    const section = (title: string, s: number, rows: ReactNode[]) => (
      <Card key={title}>
        <div className="mb-1 flex items-center justify-between"><h3 className="font-extrabold">{title}</h3><Button size="sm" variant="ghost" onClick={() => goto(s)}>{t('a.edit')}</Button></div>
        <dl>{rows}</dl>
      </Card>
    );
    const unit = { percent: '%', gpa4: '/ 4', gpa5: '/ 5', five_point_uz: tx('/ 5 (Uzbek scale)', '/ 5 (O‘zb. tizimi)'), other: d.scaleOther ?? '' }[d.scale];
    body = (
      <div className="grid gap-3 md:grid-cols-2">
        {section(names[0]!, 0, [row(tx('Name', 'Ism'), d.name), row(tx('Citizenship', 'Fuqarolik'), d.citizenship), row(tx('Degree', 'Daraja'), t(d.targetLevel === 'bachelor' ? 'lvl.bachelor' : d.targetLevel === 'master' ? 'lvl.master' : 'lvl.phd')), row(tx('Field', 'Yo‘nalish'), pick(FIELD_LABELS[d.field])), row(tx('Application year', 'Ariza yili'), `${d.applicationYear}${d.intake ? ` · ${d.intake}` : ''}`)])}
        {section(names[1]!, 1, [row(tx('Qualification', 'Ma’lumot'), d.qualification), row(tx('Institution', 'Muassasa'), d.institution), row(tx('Score', 'Baho'), d.score !== undefined ? `${d.score} ${unit}` : ''), row(tx('Graduation', 'Bitirish'), d.graduationYear)])}
        {section(names[2]!, 2, [row('IELTS', d.ielts), row('TOEFL', d.toefl), row('SAT', d.sat), row(tx('Other', 'Boshqa'), d.otherLanguage), row(tx('Planning a test', 'Imtihon rejasi'), d.planningExam ? t('m.yes') : t('m.no'))])}
        {section(names[3]!, 3, [row(tx('Tuition budget / year', 'O‘qish byudjeti / yil'), d.tuitionBudget !== undefined ? `${d.tuitionBudget.toLocaleString()} ${d.currency}` : ''), row(tx('Total budget / year', 'Umumiy byudjet / yil'), d.totalBudget !== undefined ? `${d.totalBudget.toLocaleString()} ${d.currency}` : ''), row(tx('Needs full funding', 'To‘liq moliyalashtirish kerak'), d.needsFullFunding ? t('m.yes') : t('m.no'))])}
        {section(names[4]!, 4, [row(tx('Interested in', 'Qiziqadi'), d.preferredCountries.map((c) => pick(countries.find((x) => x.code === c)?.name)).join(', ')), row(tx('Avoid', 'Istamaydi'), d.avoidCountries.map((c) => pick(countries.find((x) => x.code === c)?.name)).join(', '))])}
        {section(names[5]!, 5, [row(tx('Years of work experience', 'Ish tajribasi (yil)'), d.workYears), row(tx('Experiences recorded', 'Qayd etilgan tajribalar'), Object.values(d.experiences).filter((v) => v.trim()).length)])}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold">{editing ? tx('Edit your profile', 'Profilingizni tahrirlash') : tx('Build your profile', 'Profilingizni yarating')}</h1>
      <ol className="flex flex-wrap gap-1" aria-label={tx('Steps', 'Bosqichlar')}>
        {names.map((n, i) => (
          <li key={n}>
            <button type="button" onClick={() => goto(i)} aria-current={i === step ? 'step' : undefined} className={cx('min-h-[40px] rounded-lg px-3 text-sm font-semibold', i === step ? 'bg-brand text-brand-fg' : i < step ? 'bg-brand-soft text-brand' : 'bg-sunken text-muted')}>
              {i + 1}. {n}
            </button>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted">{intros[step]}</p>
      <Card className="space-y-4">
        <h2 className="text-lg font-extrabold">{names[step]}</h2>
        {body}
      </Card>
      {note && <p role="alert" className="text-sm font-semibold text-bad">{note}</p>}
      <div className="flex flex-wrap gap-2">
        {step > 0 && <Button onClick={() => goto(step - 1)}>{t('a.back')}</Button>}
        {step < STEPS.length - 1 ? <Button variant="primary" onClick={() => goto(step + 1)}>{t('a.next')}</Button> : <Button variant="primary" onClick={finish}>{editing ? tx('Save changes', 'O‘zgarishlarni saqlash') : tx('Save my profile', 'Profilimni saqlash')}</Button>}
        <a href={href('home')} className="inline-flex min-h-[44px] items-center text-sm">{t('a.cancel')}</a>
      </div>
      <p className="text-xs text-muted">{tx('Your profile stays in this browser. If you sign in, it is saved to your account so you can use it on every device.', 'Profilingiz shu brauzerda saqlanadi. Kirsangiz, u akkauntingizga saqlanadi va barcha qurilmalarda ishlatishingiz mumkin.')}</p>
    </div>
  );
}
