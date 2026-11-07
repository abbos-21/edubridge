/**
 * Russian lookup. Russian is found by the ENGLISH text (as in the original app).
 * Template entries use {0}, {1} placeholders and are matched with a regex.
 * ru.recovered.json comes from the old build; ru.extra.json holds strings written for v2.
 */
type Dict = Record<string, string>;

let exact: Map<string, string> | null = null;
let patterns: Array<{ re: RegExp; ru: string; order: number[] }> = [];
const missing = new Set<string>();

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function installRu(...dicts: Dict[]) {
  const m = new Map<string, string>();
  const pats: typeof patterns = [];
  for (const d of dicts) {
    for (const [en, ru] of Object.entries(d)) {
      if (typeof ru !== 'string') continue;
      if (/\{\d+\}/.test(en)) {
        const order: number[] = [];
        const src = escapeRe(en).replace(/\\\{(\d+)\\\}/g, (_m, n) => {
          order.push(Number(n));
          return '(.+?)';
        });
        pats.push({ re: new RegExp('^' + src + '$'), ru, order });
      } else {
        m.set(en, ru);
      }
    }
  }
  exact = m;
  patterns = pats;
}

export const isRuInstalled = () => exact !== null;

const fill = (template: string, args: string[]) => template.replace(/\{(\d+)\}/g, (_m, n) => args[Number(n)] ?? '');

/** Returns Russian for an English string, or null when none exists. Templates are filled from `args`. */
export function ruLookup(en: string, args: string[] = []): string | null {
  if (!exact) return null;
  const hit = exact.get(en);
  if (hit != null) return fill(hit, args);
  for (const p of patterns) {
    const m = p.re.exec(en);
    if (m) {
      const vals: string[] = [];
      p.order.forEach((n, i) => (vals[n] = m[i + 1] ?? ''));
      return fill(p.ru, vals);
    }
  }
  if (/[A-Za-z]{3}/.test(en)) missing.add(en);
  return null;
}

/** Strings that had no Russian (for the dev-time gap check). */
export const ruMissing = () => [...missing];
