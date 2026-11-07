import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { L, Lang } from '@edubridge/shared';
import { useStore } from '../store/AppStore';
import uiDict from './ui.json';
import { installRu, isRuInstalled, ruLookup } from './ru';

type UiKey = keyof typeof uiDict;

export type I18n = {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Two-language pair written in code: tx('English', 'O‘zbekcha'). Russian is looked up by the English text. */
  tx: (en: string, uz: string, ...args: Array<string | number>) => string;
  /** Shared label by key (src/i18n/ui.json). */
  t: (key: UiKey) => string;
  /** Text of a data record {en, uz, ru?}. A record's own ru wins over the dictionary. */
  pick: (l: L | null | undefined) => string;
  /** Replace the English text of a fixed phrase by its Russian when needed (for strings built from data). */
  ru: (en: string) => string;
};

const Ctx = createContext<I18n | null>(null);

const fillArgs = (s: string, args: Array<string | number>) => s.replace(/\{(\d+)\}/g, (_m, n) => String(args[Number(n)] ?? ''));

export function I18nProvider({ children }: { children: ReactNode }) {
  const { lang, setLang } = useStore();
  const [ruReady, setRuReady] = useState(isRuInstalled());

  useEffect(() => {
    document.documentElement.lang = lang;
    if (lang === 'ru' && !isRuInstalled()) {
      // Russian text is loaded on demand so Uzbek/English users do not download it.
      void Promise.all([import('./ru.recovered.json'), import('./ru.extra.json')]).then(([a, b]) => {
        installRu(a.default as Record<string, string>, b.default as Record<string, string>);
        setRuReady(true);
      });
    }
  }, [lang]);

  const tx = useCallback<I18n['tx']>(
    (en, uz, ...args) => {
      if (lang === 'en') return fillArgs(en, args);
      if (lang === 'uz') return fillArgs(uz, args);
      return ruLookup(en, args.map(String)) ?? fillArgs(en, args);
    },
    // ruReady forces consumers to re-render when the dictionary arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, ruReady],
  );

  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang,
      tx,
      t: (key) => {
        const e = uiDict[key] as L;
        if (lang === 'uz') return e.uz;
        if (lang === 'ru') return ruLookup(e.en) ?? e.en;
        return e.en;
      },
      pick: (l) => {
        if (!l) return '';
        if (lang === 'uz') return l.uz || l.en;
        if (lang === 'ru') return l.ru || ruLookup(l.en) || l.en;
        return l.en;
      },
      ru: (en) => (lang === 'ru' ? ruLookup(en) ?? en : en),
    }),
    [lang, setLang, tx, ruReady], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error('I18nProvider missing');
  return v;
}
