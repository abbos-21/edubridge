import type { Lang } from '@edubridge/shared';

const LOCALE: Record<Lang, string> = { uz: 'uz-Latn-UZ', ru: 'ru-RU', en: 'en-GB' };

const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];

export function formatDate(iso: string | null | undefined, lang: Lang): string | null {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso);
  if (Number.isNaN(d.getTime())) return iso;
  if (lang === 'uz') {
    // Browsers have no Latin Uzbek month names (they print "M10"), so they are written out here.
    return `${d.getUTCDate()}-${UZ_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }
  try {
    return new Intl.DateTimeFormat(LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
  } catch {
    return iso;
  }
}

/** A missing amount is NEVER shown as zero or "free": callers must handle null before calling. */
export function formatMoney(amount: number, currency: string | null | undefined, lang: Lang): string {
  try {
    return new Intl.NumberFormat(LOCALE[lang], { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toLocaleString(LOCALE[lang])} ${currency ?? ''}`.trim();
  }
}

export const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const isHttp = (u: unknown): u is string => typeof u === 'string' && /^https?:\/\//i.test(u);

/** True when the date is before today (UTC). Past deadlines show as closed, with their year. */
export const isPast = (iso: string): boolean => new Date(iso.length === 10 ? iso + 'T23:59:59Z' : iso).getTime() < Date.now();
