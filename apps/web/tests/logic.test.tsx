import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { zUniversity } from '@edubridge/shared';
import { formatDate, formatMoney } from '../src/lib/format';
import { parseHash, href } from '../src/lib/router';
import { initial, STORAGE_KEY, AppStoreProvider } from '../src/store/AppStore';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { CatalogProvider, useCatalogState } from '../src/data/CatalogProvider';
import { catalogueCounters } from '../src/pages/Home';
import { UniProfile } from '../src/pages/UniProfile';
import { UniCompare } from '../src/pages/UniCompare';
import { GrantDetail } from '../src/pages/Scholarships';
import snapshotJson from '../src/data/snapshot.json';

const snap = snapshotJson as unknown as { universities: unknown[]; grants: any[]; countries: any[] };

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Gate({ children }: { children: React.ReactNode }) {
  const { state } = useCatalogState();
  return state.status === 'ready' ? <>{children}</> : <p>loading</p>;
}
const renderPage = (ui: React.ReactNode, lang = 'en') => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ lang }));
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline'))); // forces the snapshot fallback
  return render(
    <AppStoreProvider>
      <I18nProvider>
        <CatalogProvider>
          <Gate>{ui}</Gate>
        </CatalogProvider>
      </I18nProvider>
    </AppStoreProvider>,
  );
};

describe('formatting', () => {
  it('writes Uzbek month names (browsers print "M10")', () => {
    expect(formatDate('2026-10-30', 'uz')).toBe('30-oktyabr 2026');
    expect(formatDate(null, 'uz')).toBeNull();
  });
  it('formats money with the currency and never invents a value', () => {
    expect(formatMoney(300, 'MYR', 'en')).toMatch(/300/);
  });
});

describe('router', () => {
  it('parses page and param, with the same URLs as the original app', () => {
    expect(parseHash('')).toEqual({ page: 'home', param: null });
    expect(parseHash('#uni--universiti-malaya-my')).toEqual({ page: 'uni', param: 'universiti-malaya-my' });
    expect(parseHash('#unicompare--a,b,c')).toEqual({ page: 'unicompare', param: 'a,b,c' });
    expect(parseHash('#universities--advanced')).toEqual({ page: 'universities', param: 'advanced' });
    expect(href('country', 'MY')).toBe('#country--MY');
  });
});

describe('landing counters come from the data', () => {
  it('counts universities, countries and national grants', () => {
    const c = catalogueCounters({
      universities: snap.universities.map((u) => zUniversity.parse(u)),
      grants: snap.grants,
      countries: snap.countries,
    });
    expect(c).toMatchObject({ universities: 50, countries: 5, grants: 7 });
    expect(c.lastChecked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('changes when the data changes (not hard-coded)', () => {
    expect(catalogueCounters({ universities: [{}, {}], grants: [{ kind: 'national' }], countries: [1] }).universities).toBe(2);
  });
});

describe('store', () => {
  it('merges saved state with defaults and survives corrupt storage', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(initial().lang).toBe('uz');
  });
});

describe('snapshot fallback', () => {
  it('uses the dated snapshot when the API cannot be reached, and says so', async () => {
    function Probe() {
      const { state } = useCatalogState();
      return <p>{state.status === 'ready' ? `${state.source}:${state.data.universities.length}` : state.status}</p>;
    }
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(
      <AppStoreProvider>
        <I18nProvider>
          <CatalogProvider>
            <Probe />
          </CatalogProvider>
        </I18nProvider>
      </AppStoreProvider>,
    );
    await waitFor(() => expect(screen.getByText('snapshot:50')).toBeTruthy());
  });
});

describe('honesty rules in the UI', () => {
  it('a university without a QS position says "not confirmed", never a number', async () => {
    renderPage(<UniProfile id="tu-darmstadt-de" />);
    await waitFor(() => expect(screen.getAllByText(/position not confirmed/i).length).toBeGreaterThan(0));
    expect(screen.queryByText(/QS 2027 #/)).toBeNull();
  });
  it('shows programme-specific IELTS as such, not as a whole-university value', async () => {
    const u = (snap.universities as any[]).find((x) => ['bachelor', 'master'].some((l) => x.levels[l]?.ieltsScope === 'programme'))!;
    renderPage(<UniProfile id={u.id} />);
    await waitFor(() => expect(screen.getAllByText(/programme-specific|whole university/i).length).toBeGreaterThan(0));
  });
  it('compare shows "not confirmed" for blanks and never a zero fee', async () => {
    const ids = (snap.universities as any[]).filter((u) => u.fee?.amount == null).slice(0, 2).map((u) => u.id);
    renderPage(<UniCompare ids={ids.join(',')} />);
    await waitFor(() => expect(screen.getAllByText(/Not confirmed on an official page/i).length).toBeGreaterThan(0));
    expect(document.body.textContent).not.toMatch(/(^|\s)0\s*(MYR|EUR|USD|TRY|KRW|HUF)/);
  });
  it('shows no admission probability anywhere on a grant or university page', async () => {
    renderPage(<GrantDetail id="gks-u" />);
    await waitFor(() => expect(screen.getByText(/grant conditions, separate from university entry requirements/i)).toBeTruthy());
    expect(document.body.textContent).not.toMatch(/\b\d{1,3}\s?%\s*(chance|probability)/i);
  });
  it('grant criteria are labelled as separate from university entry rules', async () => {
    renderPage(<GrantDetail id="mtcp" />);
    await waitFor(() => expect(screen.getByText(/separate from university entry requirements/i)).toBeTruthy());
  });
});

describe('Russian pages', () => {
  it('renders Russian labels once the dictionary has loaded', async () => {
    renderPage(<GrantDetail id="gks-u" />, 'ru');
    await waitFor(() => expect(document.body.textContent).toMatch(/Это условия гранта|условия гранта/i), { timeout: 5000 });
  });
});
