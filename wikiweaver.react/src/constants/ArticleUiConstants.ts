export type ParagraphUiMode = 'arrows' | 'numbers';

export const ARTICLE_UI_MODE_STORAGE_KEY = 'articleParagraphUiMode';
export const DEFAULT_ARTICLE_UI_MODE: ParagraphUiMode = 'arrows';

export const isParagraphUiMode = (value: string | null): value is ParagraphUiMode =>
  value === 'arrows' || value === 'numbers';
