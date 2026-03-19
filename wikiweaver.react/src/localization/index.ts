import { dictionaries as loadedDictionaries } from './loader';

export const dictionaries = loadedDictionaries as typeof loadedDictionaries & {
  en: typeof import('./locales/en/brand.json')
    & typeof import('./locales/en/shared.json')
    & typeof import('./locales/en/pages.json')
    & typeof import('./locales/en/editor.json');
};

export type SupportedLocale = keyof typeof dictionaries;
export type Locale = (typeof dictionaries)['en'];

export const locale: Locale = dictionaries.en;

export const formatMessage = (template: string, params: Record<string, string | number>): string =>
  Object.entries(params).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template,
  );
