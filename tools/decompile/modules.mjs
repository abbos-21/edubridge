/**
 * Where each part of the original bundle goes. Entries are [offset in the original script, module path];
 * a declaration belongs to the last entry whose offset is not above it. Edit this file, run the tool again.
 */
export const DATA_START = 185753; // everything before this is bundled React and icons
export const ENTRY_START = 2093555; // the final `createRoot(...).render(...)`

export default [
  [185753, 'data/raw'],
  [549838, 'i18n/ru-dictionary'],
  [913538, 'lib/core'],
  [961335, 'lib/catalog'],
  [970955, 'lib/eligibility'],
  [984382, 'lib/plan-tasks'],
  [1001726, 'store/store'],
  [1007400, 'i18n/labels'],
  [1014413, 'lib/derived'],
  [1019643, 'components/ui'],
  [1031236, 'components/layout'],
  [1523093, 'components/mascot'],
  [1528940, 'pages/home'],
  [1542851, 'pages/onboarding'],
  [1572427, 'components/shared'],
  [1581147, 'pages/dashboard'],
  [1593790, 'pages/discovery'],
  [1618987, 'pages/opportunity'],
  [1638190, 'pages/plans'],
  [1661473, 'pages/calendar'],
  [1672905, 'pages/documents'],
  [1690246, 'lib/writing'],
  [1704164, 'lib/ai'],
  [1708126, 'pages/writing'],
  [1727618, 'data/growth-ideas'],
  [1798702, 'pages/adviser'],
  [1887708, 'pages/assistant'],
  [1980403, 'pages/compare'],
  [1989732, 'pages/budget'],
  [2002497, 'pages/settings'],
  [2015999, 'pages/data-review'],
  [2040349, 'pages/catalogue'],
  [2090542, 'app/router'],
  [2092106, 'app/error-boundary'],
  [2093555, 'main'],
];
