export type AlternativeDraft = {
  localId: string;
  content: string;
  isDefault: boolean;
};

export type ParagraphGroupDraft = {
  order: number;
  alternatives: AlternativeDraft[];
};
