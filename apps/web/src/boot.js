/**
 * Start-up: load the catalogue first (the app derives its lists from it when its modules start), then load the app.
 * If the API cannot be reached the bundled snapshot is used, so the public pages still work offline.
 */
import { fillCatalog } from './data/raw';
import { api } from './lib/api';

const root = document.getElementById('root');

async function loadCatalog() {
  try {
    const data = await api('/catalog');
    fillCatalog(data);
    return 'api';
  } catch {
    const snapshot = (await import('./data/catalog.snapshot.json')).default;
    fillCatalog(snapshot);
    return 'snapshot';
  }
}

try {
  window.__catalogSource = await loadCatalog();
  await import('./main.jsx');
} catch (e) {
  console.error(e);
  root.textContent = 'EduBridge could not start. Please reload the page.';
}
