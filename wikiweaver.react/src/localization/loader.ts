import {
  createMissingKeyWarnings,
  createMissingNamespaceWarnings,
  DEFAULT_LOCALE,
  getValidatedDefaultLocaleNamespaces,
  REQUIRED_NAMESPACES,
  validateNamespaceOwnership,
  type LocaleDictionary,
  type LocaleNamespace,
  type LocaleNamespaceName,
  type LocaleNamespacesByLanguage,
} from './validation';

type LocaleNamespaceModule = { default: LocaleNamespace };

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

const buildLocaleNamespaces = (): LocaleNamespacesByLanguage => {
  const byLanguage: LocaleNamespacesByLanguage = {};
  const topLevelOwners: Record<string, Record<string, string>> = {};

  Object.entries(localeModules).forEach(([path, module]) => {
    const match = path.match(localePathPattern);
    if (!match) {
      return;
    }

    const [, language, namespace] = match;
    const namespaceName = namespace as LocaleNamespaceName;
    byLanguage[language] ??= {};

    if (byLanguage[language][namespaceName]) {
      throw new Error(`Duplicate locale namespace detected: ${language}/${namespace}.json`);
    }

    const namespaceData = module.default;
    const languageOwners = (topLevelOwners[language] ??= {});
    validateNamespaceOwnership(language, namespace, namespaceData, languageOwners);

    byLanguage[language][namespaceName] = namespaceData;
  });

  return byLanguage;
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

  if (import.meta.env.DEV) {
    const warnings = [...missingNamespaceWarnings, ...createMissingKeyWarnings(dictionaries)];
    warnings.forEach((warning) => {
      console.warn(`[localization] ${warning}`);
    });
  }

  return dictionaries;
};

export const dictionaries = buildDictionaries();
