import { createContext } from 'react';
import type { Locale, SupportedLocale } from './index';

export type LocalizationContextValue = {
  language: SupportedLocale;
  setLanguage: (language: SupportedLocale) => void;
  locale: Locale;
  supportedLocales: SupportedLocale[];
};

export const LocalizationContext = createContext<LocalizationContextValue | null>(null);
