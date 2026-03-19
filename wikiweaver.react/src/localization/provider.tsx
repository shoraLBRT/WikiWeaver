import React, { useEffect, useMemo, useState } from 'react';
import { LocalizationContext, type LocalizationContextValue } from './context';
import { dictionaries, type Locale, type SupportedLocale } from './index';

const LANGUAGE_STORAGE_KEY = 'wikiweaver.locale';

const supportedLocales = Object.keys(dictionaries) as SupportedLocale[];

const normalizeLanguage = (value: string | null | undefined): SupportedLocale | null => {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase().split('-')[0] as SupportedLocale;
  return supportedLocales.includes(normalized) ? normalized : null;
};

const getInitialLanguage = (): SupportedLocale => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const storedLanguage = normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  if (storedLanguage) {
    return storedLanguage;
  }

  const browserLanguage =
    window.navigator.languages.map((language) => normalizeLanguage(language)).find(Boolean)
    ?? normalizeLanguage(window.navigator.language);

  return browserLanguage ?? 'en';
};

export const LocalizationProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<SupportedLocale>(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LocalizationContextValue>(
    () => ({
      language,
      setLanguage,
      locale: dictionaries[language] as Locale,
      supportedLocales,
    }),
    [language],
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
};
