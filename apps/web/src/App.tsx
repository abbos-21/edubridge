import { Component, Suspense, lazy, useEffect, type ReactNode } from 'react';
import { I18nProvider, useI18n } from './i18n/I18nProvider';
import { AppStoreProvider, useStore } from './store/AppStore';
import { CatalogProvider } from './data/CatalogProvider';
import { AuthProvider } from './auth/AuthProvider';
import { CloudSyncProvider } from './sync/CloudSync';
import { Settings, SignIn } from './pages/Account';
import { useRoute } from './lib/router';
import { Layout } from './components/Layout';
import { CatalogGate } from './components/common';
import { Home } from './pages/Home';
import { CountryPage, Countries } from './pages/Countries';
import { Universities } from './pages/Universities';
import { UniProfile } from './pages/UniProfile';
import { UniCompare } from './pages/UniCompare';
import { GrantDetail, Scholarships } from './pages/Scholarships';
import { Info } from './pages/Info';
import { DemoBanner } from './pages/Demo';

// The advisor, profile wizard and profile builder are loaded on demand to keep the first download small.
const Assistant = lazy(() => import('./pages/assistant/Assistant').then((m) => ({ default: m.Assistant })));
const Onboarding = lazy(() => import('./pages/Onboarding').then((m) => ({ default: m.Onboarding })));
const Adviser = lazy(() => import('./pages/Adviser').then((m) => ({ default: m.Adviser })));
const Summary = lazy(() => import('./pages/Summary').then((m) => ({ default: m.Summary })));
const Admin = lazy(() => import('./admin/Admin'));
const Demo = lazy(() => import('./pages/Demo').then((m) => ({ default: m.Demo })));

function useTheme() {
  const { theme } = useStore();
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && !!mq?.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    mq?.addEventListener?.('change', apply);
    return () => mq?.removeEventListener?.('change', apply);
  }, [theme]);
}

function Pages() {
  const { page, param } = useRoute();
  const { tx } = useI18n();
  switch (page) {
    case 'home': return <Home />;
    case 'countries': return <Countries />;
    case 'country': return <CountryPage code={param} />;
    case 'universities': return <Universities advanced={param === 'advanced'} />;
    case 'uni': return <UniProfile key={param} id={param} />;
    case 'unicompare': return <UniCompare ids={param} />;
    case 'scholarships': return <Scholarships />;
    case 'scholarship': return <GrantDetail id={param} />;
    case 'info': return <Info topic={param} />;
    case 'assistant': return <Assistant tab={param} />;
    case 'onboarding': return <Onboarding key={param ?? 'new'} edit={param === 'edit'} />;
    case 'adviser': return <Adviser />;
    case 'demo': return <Demo param={param} />;
    case 'summary': return <Summary />;
    case 'admin': return <Admin tab={param} />;
    case 'signin': return <SignIn />;
    case 'settings': return <Settings />;
    default:
      return (
        <div className="space-y-2 py-10 text-center">
          <h1 className="text-2xl font-extrabold">404</h1>
          <p>{tx('Not found', 'Topilmadi')}</p>
          <a href="#home">{tx('Home', 'Bosh sahifa')}</a>
        </div>
      );
  }
}

function Shell() {
  useTheme();
  return (
    <Layout banner={<DemoBanner />}>
      <CatalogGate>
        <Suspense fallback={<p role="status" className="py-10 text-center text-muted">…</p>}>
          <Pages />
        </Suspense>
      </CatalogGate>
    </Layout>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
        <h1>EduBridge</h1>
        <p>Something went wrong. Reload the page. / Xatolik yuz berdi. Sahifani qayta yuklang.</p>
        <button onClick={() => location.reload()}>Reload</button>
      </div>
    );
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppStoreProvider>
        <I18nProvider>
          <AuthProvider>
            <CloudSyncProvider>
              <CatalogProvider>
                <Shell />
              </CatalogProvider>
            </CloudSyncProvider>
          </AuthProvider>
        </I18nProvider>
      </AppStoreProvider>
    </ErrorBoundary>
  );
}
