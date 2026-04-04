import type { ArticleInfoboxCreateDto, ArticleInfoboxDto, ArticleInfoboxFieldCreateDto } from '../../shared/types/ApiTypes';
import type { InfoboxDraft, InfoboxFieldDraft } from './types';

const slugifySegment = (value: string): string =>
  value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

export const createEmptyInfoboxField = (): InfoboxFieldDraft => ({
  id: crypto.randomUUID(),
  key: '',
  label: '',
  value: '',
});

export const createEmptyInfoboxDraft = (): InfoboxDraft => ({
  title: '',
  subtitle: '',
  fields: [],
});

export const updateInfoboxField = (
  fields: InfoboxFieldDraft[],
  fieldId: string,
  patch: Partial<Omit<InfoboxFieldDraft, 'id'>>,
): InfoboxFieldDraft[] =>
  fields.map((field) => (field.id === fieldId ? { ...field, ...patch } : field));

export const addInfoboxField = (fields: InfoboxFieldDraft[]): InfoboxFieldDraft[] => [
  ...fields,
  createEmptyInfoboxField(),
];

export const removeInfoboxField = (fields: InfoboxFieldDraft[], fieldId: string): InfoboxFieldDraft[] =>
  fields.filter((field) => field.id !== fieldId);

export const moveInfoboxField = (fields: InfoboxFieldDraft[], fieldId: string, direction: -1 | 1): InfoboxFieldDraft[] => {
  const index = fields.findIndex((field) => field.id === fieldId);
  const nextIndex = index + direction;

  if (index < 0 || nextIndex < 0 || nextIndex >= fields.length) {
    return fields;
  }

  const nextFields = [...fields];
  const [field] = nextFields.splice(index, 1);
  nextFields.splice(nextIndex, 0, field);
  return nextFields;
};

const normalizeInfoboxFieldKey = (key: string, label: string, index: number): string => {
  const normalizedKey = slugifySegment(key);
  if (normalizedKey) {
    return normalizedKey;
  }

  const normalizedLabel = slugifySegment(label);
  if (normalizedLabel) {
    return normalizedLabel;
  }

  return `field-${index + 1}`;
};

const normalizeInfoboxFields = (fields: InfoboxFieldDraft[]): ArticleInfoboxFieldCreateDto[] =>
  fields
    .map((field) => ({
      key: field.key.trim(),
      label: field.label.trim(),
      value: field.value.trim(),
    }))
    .filter((field) => field.label || field.value)
    .map((field, index) => ({
      order: index + 1,
      key: normalizeInfoboxFieldKey(field.key, field.label, index),
      label: field.label,
      value: field.value,
    }));

export const buildInfoboxCreateDto = (draft: InfoboxDraft): ArticleInfoboxCreateDto | undefined => {
  const title = draft.title.trim();
  const subtitle = draft.subtitle.trim();
  const fields = normalizeInfoboxFields(draft.fields);

  if (!title && !subtitle && fields.length === 0) {
    return undefined;
  }

  return {
    title: title || undefined,
    subtitle: subtitle || undefined,
    fields,
  };
};

export const hasIncompleteInfoboxFields = (draft: InfoboxDraft): boolean =>
  draft.fields.some((field) => {
    const hasLabel = Boolean(field.label.trim());
    const hasValue = Boolean(field.value.trim());
    return hasLabel !== hasValue;
  });

export const importInfoboxFromDto = (dto: ArticleInfoboxDto): InfoboxDraft => ({
  title: dto.title ?? '',
  subtitle: dto.subtitle ?? '',
  fields: dto.fields.map((f) => ({
    id: crypto.randomUUID(),
    key: f.key,
    label: f.label,
    value: f.value,
  })),
});
