export type AlternativeDraft = {
  localId: string;
  content: string;
  isDefault: boolean;
};

export type InfoboxFieldDraft = {
  id: string;
  key: string;
  label: string;
  value: string;
};

export type InfoboxDraft = {
  title: string;
  subtitle: string;
  fields: InfoboxFieldDraft[];
};

export type PlainBlockKind = 'heading2' | 'heading3' | 'paragraph';

export type PlainEditorBlock = {
  id: string;
  kind: PlainBlockKind;
  content: string;
};

export type VersionedEditorBlock = {
  id: string;
  kind: 'versioned';
  variants: AlternativeDraft[];
};

export type EditorBlock = PlainEditorBlock | VersionedEditorBlock;
