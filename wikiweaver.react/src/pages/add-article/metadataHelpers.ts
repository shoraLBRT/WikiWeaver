import type { ArticleRelatedLinkCreateDto, ArticleRelatedLinkDto } from '../../shared/types/ApiTypes';

export type RelatedLinkDraft = {
  id: string;
  articleId: number;
  articleTitle: string;
};

export function buildRelatedLinkCreateDtos(drafts: RelatedLinkDraft[]): ArticleRelatedLinkCreateDto[] {
  return drafts.map((draft, index) => ({
    relatedArticleId: draft.articleId,
    order: index + 1,
  }));
}

export function importRelatedLinksFromDto(dtos: ArticleRelatedLinkDto[]): RelatedLinkDraft[] {
  return dtos
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((dto) => ({
      id: crypto.randomUUID(),
      articleId: dto.relatedArticleId,
      articleTitle: dto.relatedArticleTitle,
    }));
}

export function addRelatedLink(
  links: RelatedLinkDraft[],
  articleId: number,
  articleTitle: string,
): RelatedLinkDraft[] {
  return [...links, { id: crypto.randomUUID(), articleId, articleTitle }];
}

export function removeRelatedLink(links: RelatedLinkDraft[], draftId: string): RelatedLinkDraft[] {
  return links.filter((l) => l.id !== draftId);
}

export function moveRelatedLink(
  links: RelatedLinkDraft[],
  draftId: string,
  direction: -1 | 1,
): RelatedLinkDraft[] {
  const index = links.findIndex((l) => l.id === draftId);
  if (index === -1) return links;
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= links.length) return links;
  const updated = [...links];
  [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
  return updated;
}

export function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export function serializeTags(tags: string[]): string {
  return tags.join(', ');
}

export function deduplicateTags(tags: string[]): string[] {
  return [...new Set(tags.map((t) => t.toLowerCase()))].map((t) => {
    const original = tags.find((tag) => tag.toLowerCase() === t);
    return original ?? t;
  });
}
