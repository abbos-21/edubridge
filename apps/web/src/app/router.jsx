import * as jsxRuntime from 'react/jsx-runtime';
import { useStore } from '../store/store';
import { AppLayout, CmpCS, PublicLayout } from '../components/layout';
import { HomePage } from '../pages/home';
import { OnboardingPage } from '../pages/onboarding';
import { DashboardPage } from '../pages/dashboard';
import { DiscoveryPage, FinderPage } from '../pages/discovery';
import { OpportunityPage } from '../pages/opportunity';
import { PlanPage, PlansPage } from '../pages/plans';
import { CalendarPage } from '../pages/calendar';
import { DocumentsPage } from '../pages/documents';
import { WritingPage } from '../pages/writing';
import { AdviserPage } from '../pages/adviser';
import { AssistantPage } from '../pages/assistant';
import { ComparePage } from '../pages/compare';
import { BudgetPage } from '../pages/budget';
import { SettingsPage } from '../pages/settings';
import { Cmp$q, CmpAE, CmpEE, DataReviewPage } from '../pages/data-review';
import {
  CmpKE,
  CmpWE,
  CountriesPage,
  CountryPage,
  GlossaryPage,
  RoadmapPage,
  UniversitiesPage,
  UniversityComparePage,
  UniversityPage,
  xE,
} from '../pages/catalogue';

export function AppRouter() {
  const { route: e, state: a } = useStore(),
    t = e.page;
  let n,
    s = a.profile ? 'app' : 'public';
  if (xE.has(t) && !a.profile) n = <CmpWE />;
  else
    switch (t) {
      case 'home':
        ((n = <HomePage />), (s = 'public'));
        break;
      case 'signin':
        ((n = <CmpEE />), (s = 'public'));
        break;
      case 'demo':
        ((n = <CmpAE />), (s = 'public'));
        break;
      case 'onboarding':
        ((n = <OnboardingPage />), (s = 'bare'));
        break;
      case 'info':
        ((n = <Cmp$q id={e.id ?? 'about'} />), (s = 'public'));
        break;
      case 'dashboard':
        n = <DashboardPage />;
        break;
      case 'universities':
        n =
          e.id === 'advanced' ? (
            <DiscoveryPage kind="program" />
          ) : e.id === 'finder' ? (
            <FinderPage />
          ) : (
            <UniversitiesPage />
          );
        break;
      case 'countries':
        n = <CountriesPage />;
        break;
      case 'country':
        n = <CountryPage code={e.id ?? ''} />;
        break;
      case 'uni':
        n = <UniversityPage id={e.id ?? ''} />;
        break;
      case 'unicompare':
        n = <UniversityComparePage ids={e.id ?? ''} />;
        break;
      case 'glossary':
        n = <GlossaryPage />;
        break;
      case 'roadmap':
        n = <RoadmapPage />;
        break;
      case 'scholarships':
        n = <DiscoveryPage kind="scholarship" />;
        break;
      case 'university':
      case 'scholarship':
        n = <OpportunityPage id={e.id ?? ''} />;
        break;
      case 'plans':
        n = <PlansPage />;
        break;
      case 'plan':
        n = <PlanPage id={e.id ?? ''} />;
        break;
      case 'calendar':
        n = <CalendarPage />;
        break;
      case 'documents':
        n = <DocumentsPage />;
        break;
      case 'writing':
        n = <WritingPage />;
        break;
      case 'adviser':
        n = <AdviserPage />;
        break;
      case 'assistant':
        n = <AssistantPage />;
        break;
      case 'compare':
        n = <ComparePage />;
        break;
      case 'budget':
        n = <BudgetPage />;
        break;
      case 'settings':
        n = <SettingsPage />;
        break;
      case 'data':
        n = (
          <CmpKE>
            <DataReviewPage />
          </CmpKE>
        );
        break;
      default:
        ((n = <HomePage />), (s = 'public'));
    }
  const r = (o) => (t === 'home' ? o : <div className="gutter mx-auto max-w-6xl py-8">{o}</div>);
  return (
    <>
      {s === 'bare' ? n : s === 'app' ? <AppLayout>{n}</AppLayout> : <PublicLayout>{r(n)}</PublicLayout>}
      <CmpCS />
    </>
  );
}
