export const LANGS = ['uz', 'ru', 'en'] as const;
export type Lang = (typeof LANGS)[number];

/** Localised text. `en` and `uz` are required in records; `ru` is optional (looked up in the Russian dictionary). */
export type L = { en: string; uz: string; ru?: string };

/** Never write l[lang] — Russian may be absent. Falls back to English. */
export function pick(l: L | null | undefined, lang: Lang): string {
  if (!l) return '';
  if (lang === 'uz') return l.uz || l.en;
  if (lang === 'ru') return l.ru || l.en;
  return l.en;
}

export function say(lang: Lang, en: string, uz: string, ru?: string): string {
  return pick({ en, uz, ru }, lang);
}

export const isLang = (v: unknown): v is Lang => typeof v === 'string' && (LANGS as readonly string[]).includes(v);
