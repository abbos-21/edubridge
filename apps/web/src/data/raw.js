/**
 * The catalogue data the app is built on (universities, scholarships, programmes, country texts).
 * It is NOT bundled here any more: `boot.js` fills these containers from `GET /api/v1/catalog` (or from the bundled
 * offline snapshot when the API cannot be reached) BEFORE the rest of the app is loaded, because other modules
 * derive their lists from them when they start.
 */
/** the 7 national grants and other scholarships */
export const Kb = [];
/** programmes */
export const yh = [];
export const Yb = [];
export const Wb = [];
/** date the catalogue was last checked */
export let Vb = '';
/** per-country selection texts */
export const Qb = {};
/** the curated 5 x 10 university catalogue */
export const Xb = [];
export const Jb = [];
/** staff decisions shared by every student: { [recordId]: { inactive?, reviewedAt? } } */
export const Overrides = {};

export function fillCatalog(c) {
  for (const [target, source] of [[Kb, c.scholarships], [yh, c.programs], [Yb, c.legacyUniversities], [Wb, c.legacyScholarships], [Xb, c.universities], [Jb, c.grants]]) {
    target.length = 0;
    target.push(...(source ?? []));
  }
  for (const k of Object.keys(Qb)) delete Qb[k];
  Object.assign(Qb, c.selection ?? {});
  for (const k of Object.keys(Overrides)) delete Overrides[k];
  Object.assign(Overrides, c.overrides ?? {});
  Vb = c.checked ?? '';
}
