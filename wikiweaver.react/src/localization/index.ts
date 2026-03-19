type LocaleNamespace = Record<string, unknown>;
type LocaleDictionary = Record<string, LocaleNamespace>;
type LocaleNamespaceModule = { default: LocaleNamespace };

const DEFAULT_LOCALE = 'en' as const;
const REQUIRED_NAMESPACES = ['brand', 'shared', 'pages', 'editor'] as const;

const localeModules = import.meta.glob<LocaleNamespaceModule>('./locales/*/*.json', { eager: true });
const localePathPattern = /^\.\/locales\/([^/]+)\/([^/]+)\.json$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mergeWithFallback = <T extends Record<string, unknown>>(fallback: T, override: Record<string, unknown>): T => {
  const result: Record<string, unknown> = { ...fallback };

  Object.entries(override).forEach(([key, value]) => {
    const fallbackValue = result[key];

    if (isRecord(fallbackValue) && isRecord(value)) {
      result[key] = mergeWithFallback(fallbackValue, value);
      return;
    }

    result[key] = value;
  });

  return result as T;
};

const collectLeafPaths = (value: unknown, prefix = ''): string[] => {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return prefix ? [prefix] : [];
    }

    return value.flatMap((item, index) => collectLeafPaths(item, `${prefix}[${index}]`));
  }

  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, nested]) =>
      collectLeafPaths(nested, prefix ? `${prefix}.${key}` : key),
    );
  }

  return prefix ? [prefix] : [];
};

const hasPath = (value: unknown, path: string): boolean => {
  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
  const segments = normalizedPath.split('.').filter(Boolean);

  let current: unknown = value;
  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return false;
      }

      current = current[index];
      continue;
    }

    if (!isRecord(current) || !(segment in current)) {
      return false;
    }

    current = current[segment];
  }

  return true;
};

const hasLeafValues = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some((item) => hasLeafValues(item));
  }

  if (isRecord(value)) {
    return Object.values(value).some((item) => hasLeafValues(item));
  }

  return value !== null;
};

const buildLocaleNamespaces = () => {
  const byLanguage: Record<string, Partial<Record<(typeof REQUIRED_NAMESPACES)[number], LocaleNamespace>>> = {};
  const topLevelOwners: Record<string, Record<string, string>> = {};

  Object.entries(localeModules).forEach(([path, module]) => {
    const match = path.match(localePathPattern);
    if (!match) {
      return;
    }

    const [, language, namespace] = match;
    byLanguage[language] ??= {};

    if ((byLanguage[language] as Record<string, LocaleNamespace | undefined>)[namespace]) {
      throw new Error(`Duplicate locale namespace detected: ${language}/${namespace}.json`);
    }

    const namespaceData = module.default;
    const languageOwners = (topLevelOwners[language] ??= {});

    Object.keys(namespaceData).forEach((topLevelKey) => {
      const owner = languageOwners[topLevelKey];
      if (owner) {
        throw new Error(
          `Duplicate top-level locale key "${topLevelKey}" detected in ${language}/${owner}.json and ${language}/${namespace}.json.`,
        );
      }

      languageOwners[topLevelKey] = namespace;
    });

    (byLanguage[language] as Record<string, LocaleNamespace>)[namespace] = namespaceData;
  });

  return byLanguage;
};

const getValidatedDefaultLocaleNamespaces = (
  defaultNamespaces: Partial<Record<(typeof REQUIRED_NAMESPACES)[number], LocaleNamespace>> | undefined,
): Record<(typeof REQUIRED_NAMESPACES)[number], LocaleNamespace> => {
  if (!defaultNamespaces) {
    throw new Error(`Default locale "${DEFAULT_LOCALE}" is missing in src/localization/locales.`);
  }

  REQUIRED_NAMESPACES.forEach((namespace) => {
    const namespaceData = defaultNamespaces[namespace];

    if (!namespaceData) {
      throw new Error(`Required default namespace ${DEFAULT_LOCALE}/${namespace}.json is missing.`);
    }

    if (!hasLeafValues(namespaceData)) {
      throw new Error(`Default namespace ${DEFAULT_LOCALE}/${namespace}.json does not contain any translation values.`);
    }
  });

  return defaultNamespaces as Record<(typeof REQUIRED_NAMESPACES)[number], LocaleNamespace>;
};

const createMissingNamespaceWarnings = (
  localeNamespaces: Record<string, Partial<Record<(typeof REQUIRED_NAMESPACES)[number], LocaleNamespace>>>,
): string[] => {
  return Object.entries(localeNamespaces).flatMap(([language, namespaces]) =>
    REQUIRED_NAMESPACES.flatMap((namespace) =>
      namespaces[namespace]
        ? []
        : [`Missing namespace ${language}/${namespace}.json. Falling back to ${DEFAULT_LOCALE}.`],
    ),
  );
};

const createMissingKeyWarnings = (dictionaries: Record<string, LocaleDictionary>): string[] => {
  const defaultDictionary = dictionaries[DEFAULT_LOCALE];
  const requiredPaths = collectLeafPaths(defaultDictionary);

  return Object.entries(dictionaries).flatMap(([language, dictionary]) => {
    if (language === DEFAULT_LOCALE) {
      return [];
    }

    return requiredPaths
      .filter((path) => !hasPath(dictionary, path))
      .map((path) => `Missing locale key "${path}" in ${language}. Falling back to ${DEFAULT_LOCALE}.`);
  });
};

const buildDictionaries = (): Record<string, LocaleDictionary> => {
  const localeNamespaces = buildLocaleNamespaces();
  const defaultNamespaces = getValidatedDefaultLocaleNamespaces(localeNamespaces[DEFAULT_LOCALE]);

  const missingNamespaceWarnings = createMissingNamespaceWarnings(localeNamespaces);

  const dictionaries = Object.fromEntries(
    Object.entries(localeNamespaces).map(([language, namespaces]) => {
      const merged = REQUIRED_NAMESPACES.reduce<LocaleDictionary>((dictionary, namespace) => {
        const fallbackNamespace = defaultNamespaces[namespace];

        const localeNamespace = namespaces[namespace] ?? {};
        return mergeWithFallback(dictionary, mergeWithFallback(fallbackNamespace, localeNamespace));
      }, {});

      return [language, merged];
    }),
  ) as Record<string, LocaleDictionary>;

  const missingKeyWarnings = createMissingKeyWarnings(dictionaries);

  if (import.meta.env.DEV) {
    [...missingNamespaceWarnings, ...missingKeyWarnings].forEach((warning) => {
      console.warn(`[localization] ${warning}`);
    });
  }

  return dictionaries;
};

const loadedDictionaries = buildDictionaries();

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
