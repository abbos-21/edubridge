import { useI18n } from '../i18n/I18nProvider';
import { useStore } from '../store/AppStore';
import { href, navigate } from '../lib/router';
import { normalizeProfile } from '../lib/profile';
import type { L } from '@edubridge/shared';
import personas from '../data/demo-personas.json';
import { Badge, Button, Card, Notice } from '../components/ui';
import { SavedExample, SavedExamplesList } from './SavedExamples';

type Persona = { key: string; label: L; blurb: L; profile: unknown };

/** True when the page was opened with ?present=1 (a presentation: no demo banner, no developer notices). */
export const isPresenting = () => {
  try {
    if (new URLSearchParams(window.location.search).get('present') === '1') sessionStorage.setItem('edubridge:present', '1');
    return sessionStorage.getItem('edubridge:present') === '1';
  } catch {
    return false;
  }
};

/** #demo: three fictional students, to try EduBridge without entering your own data. */
export function Demo({ param }: { param?: string | null }) {
  const { tx, pick } = useI18n();
  const store = useStore();
  if (param?.startsWith('saved-')) return <SavedExample id={param.slice(6)} />;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold">{tx('Try a demo student', 'Namoyish talabasini sinab ko‘ring')}</h1>
      <p className="text-muted">{tx('Create a profile (about 5 minutes) or try a fictional demo student.', 'Profil yarating (taxminan 5 daqiqa) yoki to‘qima namoyish talabasini sinab ko‘ring.')}</p>
      <Notice>{tx('These students are fictional. A demo is kept only in this browser and is never saved to an account.', 'Bu talabalar to‘qima. Namoyish faqat shu brauzerda saqlanadi va hech qachon akkauntga saqlanmaydi.')}</Notice>
      <div className="grid gap-3 md:grid-cols-3">
        {(personas.Fg as Persona[]).map((p) => {
          const active = store.demo === p.key;
          return (
            <Card key={p.key} className="flex flex-col gap-2">
              <Badge tone="warn">{tx('fictional', 'to‘qima')}</Badge>
              <h2 className="font-extrabold">{pick(p.label)}</h2>
              <p className="text-sm text-muted">{pick(p.blurb)}</p>
              <Button className="mt-auto" variant={active ? 'secondary' : 'primary'} onClick={() => { store.startDemo(p.key, normalizeProfile(p.profile)!); navigate('dashboard'); }}>
                {active ? tx('Continue with this student', 'Shu talaba bilan davom etish') : tx('Try demo', 'Namoyishni sinash')}
              </Button>
            </Card>
          );
        })}
      </div>
      <SavedExamplesList />
      <p className="text-sm"><a href={href('onboarding')}>{tx('Build my profile', 'Profilimni yaratish')} →</a></p>
    </div>
  );
}

/** The banner shown while a demo student is in use. */
export function DemoBanner() {
  const { tx } = useI18n();
  const store = useStore();
  if (!store.demo || isPresenting()) return null;
  return (
    <div role="status" className="border-b border-warn/40 bg-warn/10 px-4 py-2 text-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
        <span className="font-semibold">{tx('Demo mode: you are using a fictional student. Nothing is saved to an account.', 'Namoyish rejimi: to‘qima talabadan foydalanyapsiz. Hech narsa akkauntga saqlanmaydi.')}</span>
        <Button size="sm" onClick={() => { store.exitDemo(); navigate('home'); }}>{tx('Exit demo', 'Namoyishdan chiqish')}</Button>
      </div>
    </div>
  );
}
