import type { ParagraphDto } from '../../shared/types/ApiTypes';
import type { AlternativeDraft, EditorBlock, PlainBlockKind } from './types';

const createVariant = (isDefault: boolean): AlternativeDraft => ({
  localId: crypto.randomUUID(),
  content: '',
  isDefault,
});

export const createEmptyBlock = (kind: PlainBlockKind | 'versioned'): EditorBlock => {
  if (kind === 'versioned') {
    return {
      id: crypto.randomUUID(),
      kind: 'versioned',
      variants: [createVariant(true)],
    };
  }

  return {
    id: crypto.randomUUID(),
    kind,
    content: '',
  };
};

export const updatePlainBlockContent = (
  blocks: EditorBlock[],
  blockId: string,
  content: string,
): EditorBlock[] =>
  blocks.map((block) =>
    block.id === blockId && block.kind !== 'versioned' ? { ...block, content } : block,
  );

export const updateVersionContent = (
  blocks: EditorBlock[],
  blockId: string,
  localId: string,
  content: string,
): EditorBlock[] =>
  blocks.map((block) =>
    block.id !== blockId || block.kind !== 'versioned'
      ? block
      : {
          ...block,
          variants: block.variants.map((variant) =>
            variant.localId === localId ? { ...variant, content } : variant,
          ),
        },
  );

export const setDefaultVersion = (
  blocks: EditorBlock[],
  blockId: string,
  localId: string,
): EditorBlock[] =>
  blocks.map((block) =>
    block.id !== blockId || block.kind !== 'versioned'
      ? block
      : {
          ...block,
          variants: block.variants.map((variant) => ({
            ...variant,
            isDefault: variant.localId === localId,
          })),
        },
  );

export const addVersionToBlock = (blocks: EditorBlock[], blockId: string): EditorBlock[] =>
  blocks.map((block) =>
    block.id !== blockId || block.kind !== 'versioned'
      ? block
      : {
          ...block,
          variants: [...block.variants, createVariant(false)],
        },
  );

export const removeVersionFromBlock = (
  blocks: EditorBlock[],
  blockId: string,
  localId: string,
): EditorBlock[] =>
  blocks.map((block) => {
    if (block.id !== blockId || block.kind !== 'versioned' || block.variants.length <= 1) {
      return block;
    }

    const variants = block.variants.filter((variant) => variant.localId !== localId);
    if (!variants.some((variant) => variant.isDefault) && variants[0]) {
      variants[0] = { ...variants[0], isDefault: true };
    }

    return { ...block, variants };
  });

export const deleteBlock = (blocks: EditorBlock[], blockId: string): EditorBlock[] =>
  blocks.filter((block) => block.id !== blockId);

export const moveBlock = (blocks: EditorBlock[], blockId: string, direction: -1 | 1): EditorBlock[] => {
  const index = blocks.findIndex((block) => block.id === blockId);
  const targetIndex = index + direction;

  if (index < 0 || targetIndex < 0 || targetIndex >= blocks.length) {
    return blocks;
  }

  const next = [...blocks];
  const [block] = next.splice(index, 1);
  next.splice(targetIndex, 0, block);
  return next;
};

export const insertBlockAfter = (
  blocks: EditorBlock[],
  afterBlockId: string | null,
  kind: PlainBlockKind | 'versioned',
): EditorBlock[] => {
  const newBlock = createEmptyBlock(kind);
  if (!afterBlockId) {
    return [...blocks, newBlock];
  }

  const index = blocks.findIndex((block) => block.id === afterBlockId);
  if (index < 0) {
    return [...blocks, newBlock];
  }

  const next = [...blocks];
  next.splice(index + 1, 0, newBlock);
  return next;
};

export const convertParagraphToVersioned = (blocks: EditorBlock[], blockId: string): EditorBlock[] =>
  blocks.map((block) => {
    if (block.id !== blockId || block.kind === 'versioned') {
      return block;
    }

    return {
      id: block.id,
      kind: 'versioned',
      variants: [
        {
          localId: crypto.randomUUID(),
          content: block.content,
          isDefault: true,
        },
      ],
    };
  });

export const convertVersionedToParagraph = (blocks: EditorBlock[], blockId: string): EditorBlock[] =>
  blocks.map((block) => {
    if (block.id !== blockId || block.kind !== 'versioned') {
      return block;
    }

    const defaultVariant = block.variants.find((variant) => variant.isDefault) ?? block.variants[0];

    return {
      id: block.id,
      kind: 'paragraph',
      content: defaultVariant?.content ?? '',
    };
  });

const toStoredMarkdown = (block: EditorBlock): string[] => {
  if (block.kind === 'versioned') {
    return block.variants
      .filter((variant) => variant.content.trim())
      .map((variant) => variant.content.trim());
  }

  if (block.kind === 'heading2') {
    return block.content.trim() ? [`## ${block.content.trim()}`] : [];
  }

  if (block.kind === 'heading3') {
    return block.content.trim() ? [`### ${block.content.trim()}`] : [];
  }

  if (block.kind === 'paragraph') {
    return block.content.trim() ? [block.content.trim()] : [];
  }

  return [];
};

export const buildParagraphDtosFromBlocks = (blocks: EditorBlock[]): ParagraphDto[] => {
  const paragraphs: ParagraphDto[] = [];

  blocks.forEach((block, index) => {
    const order = index + 1;

    if (block.kind === 'versioned') {
      block.variants
        .filter((variant) => variant.content.trim())
        .forEach((variant) => {
          paragraphs.push({
            id: 0,
            content: variant.content.trim(),
            order,
            isDefault: variant.isDefault,
          });
        });

      return;
    }

    const [content] = toStoredMarkdown(block);
    if (!content) {
      return;
    }

    paragraphs.push({
      id: 0,
      content,
      order,
      isDefault: true,
    });
  });

  return paragraphs;
};

export const hasVersionedBlockWithoutFilledDefault = (blocks: EditorBlock[]): boolean =>
  blocks.some(
    (block) =>
      block.kind === 'versioned' &&
      !block.variants.some((variant) => variant.isDefault && variant.content.trim()),
  );

export const hasAnyFilledContent = (blocks: EditorBlock[]): boolean =>
  blocks.some((block) => {
    if (block.kind === 'versioned') {
      return block.variants.some((variant) => variant.content.trim());
    }

    return Boolean(block.content.trim());
  });

export const importBlocksFromMarkdown = (importText: string): EditorBlock[] => {
  const parts = importText
    .split(/\n\s*\n/g)
    .map((value) => value.trim())
    .filter(Boolean);

  return parts.map((content) => {
    if (content.startsWith('## ')) {
      return {
        id: crypto.randomUUID(),
        kind: 'heading2' as const,
        content: content.replace(/^##\s+/, ''),
      };
    }

    if (content.startsWith('### ')) {
      return {
        id: crypto.randomUUID(),
        kind: 'heading3' as const,
        content: content.replace(/^###\s+/, ''),
      };
    }

    return {
      id: crypto.randomUUID(),
      kind: 'paragraph' as const,
      content,
    };
  });
};

export const buildDocumentPreviewMarkdown = (blocks: EditorBlock[]): string =>
  blocks
    .flatMap((block) => {
      if (block.kind === 'versioned') {
        const defaultVariant = block.variants.find((variant) => variant.isDefault) ?? block.variants[0];
        return defaultVariant?.content?.trim() ? [defaultVariant.content.trim()] : [];
      }

      return toStoredMarkdown(block);
    })
    .join('\n\n');

export const collectWholeArticleAiTargets = (
  blocks: EditorBlock[],
): Array<{ blockId: string; localId: string | null; content: string }> => {
  const targets: Array<{ blockId: string; localId: string | null; content: string }> = [];

  blocks.forEach((block) => {
    if (block.kind === 'versioned') {
      block.variants
        .filter((variant) => variant.content.trim())
        .forEach((variant) => {
          targets.push({ blockId: block.id, localId: variant.localId, content: variant.content });
        });
      return;
    }

    if (block.kind === 'paragraph' && block.content.trim()) {
      targets.push({ blockId: block.id, localId: null, content: block.content });
    }
  });

  return targets;
};
