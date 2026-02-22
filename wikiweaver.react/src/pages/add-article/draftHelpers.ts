import type { ParagraphDto } from '../../shared/types/ApiTypes';
import type { ParagraphGroupDraft } from './types';

export const createEmptyGroup = (order: number): ParagraphGroupDraft => ({
  order,
  alternatives: [{ localId: crypto.randomUUID(), content: '', isDefault: true }],
});

export const setAlternativeContentInGroups = (
  groups: ParagraphGroupDraft[],
  groupOrder: number,
  localId: string,
  content: string,
): ParagraphGroupDraft[] =>
  groups.map((group) =>
    group.order !== groupOrder
      ? group
      : {
          ...group,
          alternatives: group.alternatives.map((alternative) =>
            alternative.localId === localId ? { ...alternative, content } : alternative,
          ),
        },
  );

export const setDefaultAlternativeInGroups = (
  groups: ParagraphGroupDraft[],
  groupOrder: number,
  localId: string,
): ParagraphGroupDraft[] =>
  groups.map((group) =>
    group.order !== groupOrder
      ? group
      : {
          ...group,
          alternatives: group.alternatives.map((alternative) => ({
            ...alternative,
            isDefault: alternative.localId === localId,
          })),
        },
  );

export const addAlternativeToGroups = (
  groups: ParagraphGroupDraft[],
  groupOrder: number,
): ParagraphGroupDraft[] =>
  groups.map((group) =>
    group.order !== groupOrder
      ? group
      : {
          ...group,
          alternatives: [
            ...group.alternatives,
            { localId: crypto.randomUUID(), content: '', isDefault: false },
          ],
        },
  );

export const removeAlternativeFromGroups = (
  groups: ParagraphGroupDraft[],
  groupOrder: number,
  localId: string,
): ParagraphGroupDraft[] =>
  groups.map((group) => {
    if (group.order !== groupOrder || group.alternatives.length <= 1) {
      return group;
    }

    const alternatives = group.alternatives.filter(
      (alternative) => alternative.localId !== localId,
    );

    if (!alternatives.some((alternative) => alternative.isDefault)) {
      alternatives[0].isDefault = true;
    }

    return { ...group, alternatives };
  });

export const collectAiImprovementQueue = (groups: ParagraphGroupDraft[]) =>
  groups.flatMap((group) =>
    group.alternatives
      .filter((alternative) => alternative.content.trim())
      .map((alternative) => ({
        groupOrder: group.order,
        localId: alternative.localId,
        content: alternative.content,
      })),
  );

export const buildParagraphDtos = (groups: ParagraphGroupDraft[]): ParagraphDto[] =>
  groups.flatMap((group) =>
    group.alternatives
      .filter((alternative) => alternative.content.trim())
      .map((alternative) => ({
        id: 0,
        content: alternative.content.trim(),
        order: group.order,
        isDefault: alternative.isDefault,
      })),
  );

export const hasGroupWithoutFilledDefault = (groups: ParagraphGroupDraft[]): boolean =>
  groups.some(
    (group) =>
      !group.alternatives.some(
        (alternative) => alternative.isDefault && alternative.content.trim(),
      ),
  );

export const importGroupsFromMarkdown = (importText: string): ParagraphGroupDraft[] => {
  const parts = importText
    .split(/\n\s*\n/g)
    .map((value) => value.trim())
    .filter(Boolean);

  return parts.map((content, index) => ({
    order: index + 1,
    alternatives: [{ localId: crypto.randomUUID(), content, isDefault: true }],
  }));
};
