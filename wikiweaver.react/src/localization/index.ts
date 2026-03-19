import enBrand from './locales/en/brand.json';
import enEditor from './locales/en/editor.json';
import enPages from './locales/en/pages.json';
import enShared from './locales/en/shared.json';
import ruBrand from './locales/ru/brand.json';
import ruEditor from './locales/ru/editor.json';
import ruPages from './locales/ru/pages.json';
import ruShared from './locales/ru/shared.json';

export const dictionaries = {
  ru: {
    ...ruBrand,
    ...ruShared,
    ...ruPages,
    ...ruEditor,
  },
  en: {
    ...enBrand,
    ...enShared,
    ...enPages,
    ...enEditor,
  },
} as const;

export type SupportedLocale = keyof typeof dictionaries;
export type Locale = (typeof dictionaries)[SupportedLocale];

export const locale = dictionaries.ru;

export const formatMessage = (template: string, params: Record<string, string | number>): string =>
  Object.entries(params).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template,
  );
