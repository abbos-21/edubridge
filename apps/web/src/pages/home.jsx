import * as jsxRuntime from 'react/jsx-runtime';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ClipboardList,
  Compass,
  FileStack,
  FlaskConical,
  GraduationCap,
  Layers,
  PenLine,
  Scale,
  SearchX,
  Wallet,
} from 'lucide-react';
import { useStore } from '../store/store';
import { useI18n } from '../lib/derived';
import { Button } from '../components/ui';
import { FS, Mascot, SpeechBubble, Xs } from '../components/mascot';

export function HomePage() {
  const { navigate: e, state: a } = useStore(),
    t = Xs(),
    { tx: n } = useI18n(),
    s = [
      {
        icon: <Layers size={20} />,
        t: n('Information overload', 'Ma’lumotlar ko‘pligi'),
        b: n(
          'Requirements are spread across dozens of university and government websites.',
          'Talablar o‘nlab universitet va davlat saytlarida tarqalib ketgan.',
        ),
      },
      {
        icon: <CalendarClock size={20} />,
        t: n('Missed deadlines', 'O‘tkazib yuborilgan muddatlar'),
        b: n(
          'Calls open once a year, and preparation has to start months earlier.',
          'Qabullar yiliga bir marta ochiladi, tayyorgarlik esa oylar oldin boshlanishi kerak.',
        ),
      },
      {
        icon: <SearchX size={20} />,
        t: n('Unclear eligibility', 'Noaniq talablar'),
        b: n(
          'Grading systems, language tests and age rules differ between countries.',
          'Baholash tizimlari, til testlari va yosh qoidalari davlatlarda farq qiladi.',
        ),
      },
      {
        icon: <Wallet size={20} />,
        t: n('Expensive consulting', 'Qimmat konsalting'),
        b: n(
          'Many families cannot pay agencies for basic guidance.',
          'Ko‘p oilalar oddiy maslahat uchun agentliklarga pul to‘lay olmaydi.',
        ),
      },
      {
        icon: <FileStack size={20} />,
        t: n('Complicated documents', 'Murakkab hujjatlar'),
        b: n(
          'Transcripts, translations, references and statements all need time.',
          'Transkript, tarjima, tavsiyanoma va motivatsion xat — barchasi vaqt talab qiladi.',
        ),
      },
    ],
    r = [
      {
        icon: <Compass size={20} />,
        t: n('Personalised university matching', 'Shaxsiy universitet tanlovi'),
        b: n(
          'Each recommendation lists which requirements appear met, which are not, and which need checking.',
          'Har bir tavsiya qaysi talablar bajarilgan, qaysilari yo‘q va qaysilarini tekshirish kerakligini ko‘rsatadi.',
        ),
      },
      {
        icon: <GraduationCap size={20} />,
        t: n('Scholarship discovery', 'Grantlarni topish'),
        b: n(
          'Government, merit, need-based and foundation funding, with exactly what each covers.',
          'Davlat, merit, ehtiyojga asoslangan va jamg‘arma grantlari — har biri nimani qoplashi aniq ko‘rsatilgan.',
        ),
      },
      {
        icon: <CalendarClock size={20} />,
        t: n('Deadline tracking', 'Muddatlarni kuzatish'),
        b: n(
          'Verified, unverified and unannounced dates are kept apart, never mixed.',
          'Tasdiqlangan, tasdiqlanmagan va e’lon qilinmagan sanalar alohida saqlanadi.',
        ),
      },
      {
        icon: <ClipboardList size={20} />,
        t: n('Step-by-step preparation', 'Bosqichma-bosqich tayyorgarlik'),
        b: n(
          'A checklist built from each opportunity’s own requirements, timed back from its deadline.',
          'Har bir imkoniyat talablaridan tuzilgan va muddatidan orqaga hisoblangan ro‘yxat.',
        ),
      },
      {
        icon: <PenLine size={20} />,
        t: n('Personal statement guidance', 'Motivatsion xat bo‘yicha yordam'),
        b: n(
          'Questions and feedback that help you write your own statement, not a ghost-written one.',
          'O‘zingiz yozishingizga yordam beradigan savollar va fikr-mulohazalar — siz uchun yozib berilmaydi.',
        ),
      },
      {
        icon: <Scale size={20} />,
        t: n('Application progress', 'Ariza jarayoni'),
        b: n(
          'Track every application from research to decision, with costs compared side by side.',
          'Har bir arizani o‘rganishdan qarorgacha kuzating, xarajatlarni yonma-yon solishtiring.',
        ),
      },
    ],
    o = [
      [
        n('Build your profile', 'Profilingizni yarating'),
        n(
          'Grades, language scores, budget and the countries you are considering.',
          'Baholar, til natijalari, byudjet va ko‘rib chiqayotgan davlatlaringiz.',
        ),
      ],
      [
        n('Discover suitable opportunities', 'Mos imkoniyatlarni toping'),
        n(
          'Universities and scholarships checked against published criteria.',
          'E’lon qilingan mezonlar bilan tekshirilgan universitet va grantlar.',
        ),
      ],
      [
        n('Prepare your application', 'Arizangizni tayyorlang'),
        n(
          'Documents, references and your statement, step by step.',
          'Hujjatlar, tavsiyanomalar va motivatsion xat — bosqichma-bosqich.',
        ),
      ],
      [
        n('Track deadlines and progress', 'Muddat va jarayonni kuzating'),
        n(
          'A calendar and in-app reminders that use your own plan.',
          'O‘z rejangizdan foydalanadigan taqvim va ilova ichidagi eslatmalar.',
        ),
      ],
    ];
  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="gutter mx-auto grid max-w-6xl items-center gap-10 py-12 md:py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal-soft px-3 py-1 text-[12.5px] font-bold text-teal-ink">
              <BadgeCheck size={14} aria-hidden={!0} />
              {n(
                'For students from Uzbekistan · O‘zbekcha, Русский, English',
                'O‘zbekistonlik talabalar uchun · O‘zbekcha, Русский, English',
              )}
            </p>
            <h1 className="text-[34px] font-extrabold leading-[1.08] md:text-[48px]">
              {n(
                'Your Journey to Studying Abroad Starts Here.',
                'Xorijda o‘qish sari yo‘lingiz shu yerdan boshlanadi.',
              )}
            </h1>
            <p className="mt-4 max-w-xl text-[17px] text-muted">
              {n(
                'Discover universities, find scholarships, understand your eligibility, and prepare your applications with personalized AI guidance.',
                'Universitetlarni toping, grantlarni qidiring, talablarga mosligingizni tushuning va arizalaringizni shaxsiy SI yo‘l-yo‘rig‘i bilan tayyorlang.',
              )}
            </p>
            <button
              type="button"
              onClick={() => e('countries')}
              className="mt-3 text-left text-[14px] font-semibold text-teal-ink hover:underline dark:text-teal"
            >
              {n(
                '5 countries · 50 universities: Malaysia · Hungary · Germany · Türkiye · South Korea →',
                '5 davlat · 50 universitet: Malayziya · Vengriya · Germaniya · Turkiya · Janubiy Koreya →',
              )}
            </button>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                variant="primary"
                className="h-11 px-5 text-[15px]"
                onClick={() => e(a.profile ? 'dashboard' : 'onboarding')}
              >
                {a.profile
                  ? n('Open my dashboard', 'Boshqaruv panelimni ochish')
                  : n('Build My Student Profile', 'Talaba profilimni yaratish')}{' '}
                <ArrowRight size={17} />
              </Button>
              <Button className="h-11 px-5 text-[15px]" onClick={() => e('countries')}>
                {n('Explore countries', 'Davlatlarni ko‘rish')}
              </Button>
            </div>
            <button
              type="button"
              onClick={() => e('demo')}
              className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-fg"
            >
              <FlaskConical size={15} aria-hidden={!0} />
              {n(
                'Or try a demo with a fictional student — no sign-up',
                'Yoki xayoliy talaba bilan namoyishni sinang — ro‘yxatdan o‘tishsiz',
              )}
            </button>
          </div>
          <div className="relative mx-auto flex w-full max-w-[480px] flex-col items-center">
            <div
              aria-hidden={!0}
              className="pointer-events-none absolute left-1/2 top-[56%] h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--teal-soft))_0%,rgb(var(--teal-soft)/0.55)_42%,transparent_70%)] sm:h-[380px] sm:w-[380px]"
            />
            <svg
              aria-hidden={!0}
              viewBox="0 0 200 200"
              className="pointer-events-none absolute left-1/2 top-[56%] h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 text-teal opacity-[0.16] sm:h-[340px] sm:w-[340px]"
            >
              <g fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="42" y="42" width="116" height="116" />
                <rect x="42" y="42" width="116" height="116" transform="rotate(45 100 100)" />
                <rect x="62" y="62" width="76" height="76" />
                <rect x="62" y="62" width="76" height="76" transform="rotate(45 100 100)" />
                <circle cx="100" cy="100" r="96" />
              </g>
            </svg>
            <SpeechBubble tail="bottom" className="relative z-10 max-w-[260px] self-start sm:ml-4">
              {n(
                'Salom! I’ll help you find your path to studying abroad.',
                'Salom! Xorijda o‘qish yo‘lingizni topishga yordam beraman.',
              )}
            </SpeechBubble>
            <Mascot
              className={
                t === 'duo'
                  ? 'relative -mt-1 h-[260px] w-full max-w-[360px] sm:h-[380px] sm:max-w-[460px] lg:h-[420px] lg:max-w-[480px]'
                  : 'relative -mt-1 h-[290px] w-[240px] sm:h-[400px] sm:w-[330px] lg:h-[440px] lg:w-[360px]'
              }
              action="wave"
              interactive={!0}
              followPointer={!0}
              turn={-0.22}
              label={
                t === 'female'
                  ? n(
                      'EduBridge guide: a smiling Uzbek girl in a hijab and embroidered doppi, waving',
                      'EduBridge yo‘lboshchisi: ro‘mol va kashtali doppi kiygan, qo‘l silkitayotgan o‘zbek qiz',
                    )
                  : t === 'male'
                    ? n(
                        'EduBridge guide: a smiling Uzbek boy in a doppi and hoodie, waving',
                        'EduBridge yo‘lboshchisi: doppi va xudi kiygan, qo‘l silkitayotgan o‘zbek yigit',
                      )
                    : n(
                        'EduBridge guides: an Uzbek boy in a doppi and an Uzbek girl in a hijab and doppi, waving',
                        'EduBridge yo‘lboshchilari: doppi kiygan o‘zbek yigit va ro‘mol hamda doppi kiygan o‘zbek qiz, qo‘l silkitmoqda',
                      )
              }
            />
          </div>
        </div>
      </section>
      <section className="gutter mx-auto grid max-w-6xl items-center gap-8 pt-14 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="eyebrow mb-2">{n('Your dashboard', 'Boshqaruv panelingiz')}</p>
          <h2 className="max-w-md text-[26px] font-extrabold md:text-[32px]">
            {n('Built from your own plan, not generic tips', 'Umumiy maslahatlardan emas, o‘z rejangizdan tuzilgan')}
          </h2>
          <p className="mt-3 max-w-md text-muted">
            {n(
              'Deadlines, tasks and recommendations come from the opportunities you save and the profile you build. Unverified dates are always marked.',
              'Muddatlar, vazifalar va tavsiyalar siz saqlagan imkoniyatlar va yaratgan profilingizdan olinadi. Tasdiqlanmagan sanalar doim belgilanadi.',
            )}
          </p>
        </div>
        <FS />
      </section>
      <section className="gutter mx-auto max-w-6xl py-14">
        <p className="eyebrow mb-2">{n('The problem', 'Muammo')}</p>
        <h2 className="max-w-2xl text-[26px] font-extrabold md:text-[32px]">
          {n('Applying abroad is hard to navigate alone', 'Xorijga hujjat topshirishni yolg‘iz uddalash qiyin')}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {s.map((u) => (
            <div className="rounded-xl border border-line bg-surface p-4" key={u.t}>
              <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-bad-soft text-bad">{u.icon}</div>
              <p className="font-bold">{u.t}</p>
              <p className="mt-1 text-[13.5px] text-muted">{u.b}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="border-y border-line bg-surface">
        <div className="gutter mx-auto max-w-6xl py-14">
          <p className="eyebrow mb-2">{n('What EduBridge does', 'EduBridge nima qiladi')}</p>
          <h2 className="max-w-2xl text-[26px] font-extrabold md:text-[32px]">
            {n('One place to plan, prepare and track', 'Rejalashtirish, tayyorlanish va kuzatish uchun yagona joy')}
          </h2>
          <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {r.map((u) => (
              <div className="flex gap-3" key={u.t}>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-soft text-teal-ink">
                  {u.icon}
                </div>
                <div>
                  <p className="font-bold">{u.t}</p>
                  <p className="mt-1 text-[14px] text-muted">{u.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="how" className="gutter mx-auto max-w-6xl scroll-mt-20 py-14">
        <p className="eyebrow mb-2">{n('How it works', 'Qanday ishlaydi')}</p>
        <h2 className="text-[26px] font-extrabold md:text-[32px]">
          {n(
            'Four steps from “where do I start?” to a clear plan',
            '“Nimadan boshlay?” savolidan aniq rejagacha to‘rt qadam',
          )}
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {o.map(([u, l], c) => (
            <li className="relative rounded-xl border border-line bg-surface p-5" key={u}>
              <span className="tabular mb-3 grid h-8 w-8 place-items-center rounded-full bg-navy text-[14px] font-bold text-navy-ink">
                {c + 1}
              </span>
              <p className="font-bold">{u}</p>
              <p className="mt-1 text-[14px] text-muted">{l}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="bg-navy text-navy-ink">
        <div className="gutter mx-auto grid max-w-6xl gap-8 py-14 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.08em] opacity-70">
              {n('Our information policy', 'Ma’lumot siyosatimiz')}
            </p>
            <h2 className="text-[26px] font-extrabold md:text-[32px]">
              {n(
                'Transparent recommendations, built on official sources',
                'Rasmiy manbalarga asoslangan shaffof tavsiyalar',
              )}
            </h2>
            <p className="mt-3 max-w-xl text-[15.5px] opacity-85">
              {n(
                'Every record shows where its facts come from and when they were last checked. If we could not verify a date, fee or requirement, we say so instead of guessing. Demonstration records are labelled as fictional.',
                'Har bir yozuv ma’lumot qayerdan olingani va oxirgi marta qachon tekshirilganini ko‘rsatadi. Sana, to‘lov yoki talabni tekshira olmasak, taxmin qilish o‘rniga buni ochiq aytamiz. Namoyish yozuvlari xayoliy deb belgilangan.',
              )}
            </p>
          </div>
          <ul className="flex flex-col gap-3 text-[14.5px]">
            {[
              n(
                'No invented deadlines, fees or admission chances',
                'O‘ylab topilgan muddat, to‘lov yoki qabul ehtimoli yo‘q',
              ),
              n(
                '“Not verified” and “Not announced” shown plainly',
                '“Tekshirilmagan” va “E’lon qilinmagan” ochiq ko‘rsatiladi',
              ),
              n(
                'Your statement stays yours — the tutor coaches, it does not ghost-write',
                'Motivatsion xat sizniki — yordamchi o‘rgatadi, yozib bermaydi',
              ),
              n(
                'Your data stays in your browser unless you sign in',
                'Kirmasangiz, ma’lumotlaringiz brauzeringizda qoladi',
              ),
            ].map((u) => (
              <li className="flex gap-2.5" key={u}>
                <BadgeCheck size={18} className="mt-0.5 shrink-0" aria-hidden={!0} />
                {u}
              </li>
            ))}
            <li className="mt-2">
              <Button className="border-transparent" onClick={() => e('info', 'sources')}>
                {n('Read the official information policy', 'Rasmiy ma’lumotlar siyosatini o‘qish')}
              </Button>
            </li>
          </ul>
        </div>
      </section>
      <section className="gutter mx-auto max-w-6xl py-14 text-center">
        <h2 className="text-[24px] font-extrabold md:text-[28px]">
          {n('Start with what you know today', 'Bugun bilganlaringizdan boshlang')}
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-muted">
          {n(
            'You can leave fields blank and come back later. Nothing is shared.',
            'Maydonlarni bo‘sh qoldirib, keyin qaytishingiz mumkin. Hech narsa uchinchi shaxslarga berilmaydi.',
          )}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="primary" onClick={() => e('onboarding')}>
            {n('Build My Student Profile', 'Talaba profilimni yaratish')}
          </Button>
          <Button icon={<FlaskConical size={16} />} onClick={() => e('demo')}>
            {n('Try Demo', 'Namoyishni sinash')}
          </Button>
        </div>
      </section>
    </>
  );
}
