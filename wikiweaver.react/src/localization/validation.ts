export type LocaleNamespace = Record<string, unknown>;
export type LocaleDictionary = Record<string, LocaleNamespace>;
export type LocaleNamespaceName = 'brand' | 'shared' | 'pages' | 'editor';
export type LocaleNamespacesByLanguage = Record<string, Partial<Record<LocaleNamespaceName, LocaleNamespace>>>;

export const DEFAULT_LOCALE = 'en' as const;
export const REQUIRED_NAMESPACES: LocaleNamespaceName[] = ['brand', 'shared', 'pages', 'editor'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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

export const validateNamespaceOwnership = (
  language: string,
  namespace: string,
  namespaceData: LocaleNamespace,
  languageOwners: Record<string, string>,
) => {
  Object.keys(namespaceData).forEach((topLevelKey) => {
    const owner = languageOwners[topLevelKey];
    if (owner) {
      throw new Error(
        `Duplicate top-level locale key "${topLevelKey}" detected in ${language}/${owner}.json and ${language}/${namespace}.json.`,
      );
    }

    languageOwners[topLevelKey] = namespace;
  });
};

export const getValidatedDefaultLocaleNamespaces = (
  defaultNamespaces: Partial<Record<LocaleNamespaceName, LocaleNamespace>> | undefined,
): Record<LocaleNamespaceName, LocaleNamespace> => {
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

  return defaultNamespaces as Record<LocaleNamespaceName, LocaleNamespace>;
};

export const createMissingNamespaceWarnings = (localeNamespaces: LocaleNamespacesByLanguage): string[] => {
  return Object.entries(localeNamespaces).flatMap(([language, namespaces]) =>
    REQUIRED_NAMESPACES.flatMap((namespace) =>
      namespaces[namespace]
        ? []
        : [`Missing namespace ${language}/${namespace}.json. Falling back to ${DEFAULT_LOCALE}.`],
    ),
  );
};

export const createMissingKeyWarnings = (dictionaries: Record<string, LocaleDictionary>): string[] => {
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
