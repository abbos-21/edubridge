import { COUNTRY_CODES, LEVELS, TIERS, type University } from './catalogue';

export type Violation = { rule: string; id: string; message: string };

/** Rules from ToR Part C that can be checked on catalogue data alone. */
export function checkUniversity(u: University): Violation[] {
  const v: Violation[] = [];
  const add = (rule: string, message: string) => v.push({ rule, id: u.id, message });

  // C7: QS value must name the page it came from
  if (u.ranking && u.ranking.value != null && !(u.ranking.source && u.ranking.source.url)) {
    add('C7-qs-source', 'QS value present without a source page');
  }
  for (const lvl of LEVELS) {
    const l = u.levels[lvl];
    if (!l) continue;
    const hasLevelSources = (l.sources?.length ?? 0) > 0;
    // C3: an IELTS number must say whether it is general or programme-specific
    if (l.ielts != null && !l.ieltsScope) add('C3-ielts-scope', `${lvl}: IELTS ${l.ielts} has no ieltsScope`);
    // C1/C2: a tuition amount needs a source (its own or the level's)
    if (l.tuition?.amount != null && !l.tuition.source && !hasLevelSources) {
      add('C1-tuition-source', `${lvl}: tuition amount without any source`);
    }
    // C4: missing is never zero
    if (l.tuition?.amount === 0 && !l.tuition.note) add('C4-zero-amount', `${lvl}: tuition 0 without an explaining note`);
    // C1/C5: a deadline date needs a source
    if (l.deadline?.date && !l.deadline.source && !hasLevelSources) {
      add('C1-deadline-source', `${lvl}: deadline date without any source`);
    }
  }
  if (u.fee?.amount != null && !u.fee.source) add('C1-fee-source', 'application fee without a source');
  return v;
}

export type CatalogueReport = { violations: Violation[]; problems: string[] };

/** Structural rules of the first release: 5 x 10, tiers 3/4/3, unique ids, no uniform IELTS. */
export function checkCatalogue(unis: University[]): CatalogueReport {
  const problems: string[] = [];
  const violations = unis.flatMap(checkUniversity);

  const ids = new Set(unis.map((u) => u.id));
  if (ids.size !== unis.length) problems.push('university ids are not unique');
  const names = new Set(unis.map((u) => u.name));
  if (names.size !== unis.length) problems.push('university names are not unique');

  for (const c of COUNTRY_CODES) {
    const inC = unis.filter((u) => u.country === c);
    if (inC.length !== 10) problems.push(`${c}: expected 10 universities, found ${inC.length}`);
    const orders = new Set(inC.map((u) => u.order));
    if (orders.size !== inC.length) problems.push(`${c}: duplicate order positions`);
    const count = (t: string) => inC.filter((u) => u.tier === t).length;
    const [s, m, a] = [count(TIERS[0]), count(TIERS[1]), count(TIERS[2])];
    if (s !== 3 || m !== 4 || a !== 3) problems.push(`${c}: tiers must be 3/4/3, found ${s}/${m}/${a}`);
  }

  const ielts = unis.flatMap((u) => LEVELS.map((l) => u.levels[l]?.ielts)).filter((x): x is number => x != null);
  if (ielts.length > 1 && new Set(ielts).size === 1) problems.push('every IELTS value is identical (uniform IELTS)');

  return { violations, problems };
}
