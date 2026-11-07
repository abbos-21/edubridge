/** Small text/number helpers shared by the AI validators and checks. */

export class SchemaError extends Error {}

export const isObj = (x: unknown): x is Record<string, any> => !!x && typeof x === 'object' && !Array.isArray(x);
export const arr = (x: unknown): any[] => (Array.isArray(x) ? x : []);
/** Trimmed, length-capped string ('' for anything that is not text or a number). */
export const str = (x: unknown, max = 4000): string => (typeof x === 'string' ? x.trim().slice(0, max) : typeof x === 'number' ? String(x) : '');
export const strList = (x: unknown, max = 20): string[] => arr(x).map((t) => str(t, 1200)).filter(Boolean).slice(0, max);
export const num = (x: unknown): number | null => {
  const n = typeof x === 'number' ? x : typeof x === 'string' ? Number(x) : NaN;
  return Number.isFinite(n) ? n : null;
};
/** Scores are 1..10 integers or null. */
export const score = (x: unknown): number | null => {
  const n = num(x);
  return n === null ? null : Math.max(1, Math.min(10, Math.round(n)));
};

/** Normalises text so a quote matches despite curly quotes, dashes, bullets, whitespace and [L1]/[P1] markers. */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/[•●▪◦·]/g, ' ')
    .replace(/\[(?:p|l)\d+\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type Quote = { quote: string; found: boolean };

/**
 * Checks that a quote the model returned really appears in the student's document.
 * Ellipses split the quote into parts that must each appear; for long quotes the start and the end must appear.
 * Quotes that are not found are flagged in the UI — never silently trusted.
 */
export function quoteIn(doc: string, quote: string): Quote {
  const q = norm(quote).replace(/^["']|["']$/g, '').replace(/\.\.\.|…/g, ' … ');
  const d = norm(doc);
  if (!q) return { quote, found: false };
  if (q.split(' … ').every((part) => !part.trim() || d.includes(part.trim()))) return { quote, found: true };
  if (q.length > 60 && d.includes(q.slice(0, 30)) && d.includes(q.slice(-30))) return { quote, found: true };
  return { quote, found: false };
}

/** A quote field that may be empty (an absence has no quote). */
export const optQuote = (doc: string, x: unknown): Quote | null => {
  const t = str(x, 1500);
  return t ? quoteIn(doc, t) : null;
};

export type LinkFlag = { url: string; verified: boolean };

const cleanUrl = (u: string) => u.replace(/[.,;:!?)\]>'"]+$/, '');
const canon = (u: string) => {
  try {
    const x = new URL(u);
    return `${x.hostname.replace(/^www\./, '').toLowerCase()}${x.pathname.replace(/\/+$/, '')}${x.search}`;
  } catch {
    return u.toLowerCase();
  }
};

/** Every link in an AI answer that is not in the official records given to it is flagged "unverified". */
export function checkLinks(answer: string, allowed: ReadonlySet<string>): LinkFlag[] {
  const ok = new Set([...allowed].map(canon));
  const seen = new Set<string>();
  const out: LinkFlag[] = [];
  for (const m of answer.matchAll(/https?:\/\/[^\s)\]>"']+/g)) {
    const url = cleanUrl(m[0]);
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ url, verified: ok.has(canon(url)) });
  }
  return out;
}

/** Extracts the first top-level JSON object from a model reply (tolerates ```json fences and surrounding prose). */
export function parseJsonObject(text: string): unknown {
  const t = text.trim();
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(t);
  const candidates = [fenced?.[1], t];
  for (const c of candidates) {
    if (!c) continue;
    const start = c.indexOf('{');
    if (start < 0) continue;
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = start; i < c.length; i++) {
      const ch = c[i]!;
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}' && --depth === 0) {
        try {
          return JSON.parse(c.slice(start, i + 1));
        } catch {
          break;
        }
      }
    }
  }
  throw new SchemaError('no JSON object in the reply');
}

/** Lines numbered [L1]… (CV) and paragraphs numbered [P1]… (letters), as the prompts expect. */
export const numberLines = (t: string) => t.replace(/\r/g, '').split('\n').map((l, i) => `[L${i + 1}] ${l}`).join('\n');
export const numberParagraphs = (t: string) =>
  t.replace(/\r/g, '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p, i) => `[P${i + 1}] ${p}`).join('\n\n');
export const wordCount = (t: string) => (t.trim().match(/\S+/g) ?? []).length;
