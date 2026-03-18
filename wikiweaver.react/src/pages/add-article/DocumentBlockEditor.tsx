import { ArrowDown, ArrowUp, GitBranch, Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import { Textarea } from '../../shared/ui/Textarea';
import type { AlternativeDraft, EditorBlock } from './types';

type EditorTarget = {
  blockId: string;
  localId: string | null;
};

type DocumentBlockEditorProps = {
  block: EditorBlock;
  index: number;
  total: number;
  disabled: boolean;
  activeTarget: EditorTarget | null;
  blockRef: (blockId: string, node: HTMLElement | null) => void;
  editorRef: (targetKey: string, node: HTMLTextAreaElement | null) => void;
  onFocusTarget: (target: EditorTarget) => void;
  onChangePlain: (blockId: string, content: string) => void;
  onChangeVersion: (blockId: string, localId: string, content: string) => void;
  onSetDefault: (blockId: string, localId: string) => void;
  onAddVersion: (blockId: string) => void;
  onRemoveVersion: (blockId: string, localId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: -1 | 1) => void;
  onConvertToVersioned: (blockId: string) => void;
  onAddAfter: (blockId: string, kind: 'paragraph' | 'heading2' | 'heading3' | 'versioned') => void;
};

const targetKey = (blockId: string, localId: string | null) => `${blockId}:${localId ?? 'plain'}`;

const getDefaultVariant = (variants: AlternativeDraft[]) =>
  variants.find((variant) => variant.isDefault) ?? variants[0];

export const DocumentBlockEditor = ({
  block,
  index,
  total,
  disabled,
  activeTarget,
  blockRef,
  editorRef,
  onFocusTarget,
  onChangePlain,
  onChangeVersion,
  onSetDefault,
  onAddVersion,
  onRemoveVersion,
  onDeleteBlock,
  onMoveBlock,
  onConvertToVersioned,
  onAddAfter,
}: DocumentBlockEditorProps) => {
  const blockKindLabel =
    block.kind === 'heading2' ? 'Heading H2' : block.kind === 'heading3' ? 'Heading H3' : block.kind === 'versioned' ? 'Versioned block' : 'Paragraph';

  const headingClasses =
    block.kind === 'heading2'
      ? 'min-h-[52px] text-[24px] font-bold tracking-[-0.03em]'
      : block.kind === 'heading3'
        ? 'min-h-[44px] text-[18px] font-semibold'
        : 'min-h-[90px] text-[14px] leading-8';

  return (
    <section
      ref={(node) => blockRef(block.id, node)}
      className="group rounded-[24px] border border-transparent px-5 py-4 transition-colors hover:border-[var(--color-border-soft)] hover:bg-[rgba(250,250,248,0.65)]"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
          {block.kind === 'versioned' ? <GitBranch size={12} /> : null}
          <span>{blockKindLabel}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button type="button" disabled={disabled || index === 0} onClick={() => onMoveBlock(block.id, -1)} className="rounded-lg p-2 text-[var(--color-ink-muted)] hover:bg-white disabled:opacity-30">
            <ArrowUp size={14} />
          </button>
          <button type="button" disabled={disabled || index === total - 1} onClick={() => onMoveBlock(block.id, 1)} className="rounded-lg p-2 text-[var(--color-ink-muted)] hover:bg-white disabled:opacity-30">
            <ArrowDown size={14} />
          </button>
          {block.kind === 'paragraph' ? (
            <Button className="px-3 py-1.5 text-xs" onClick={() => onConvertToVersioned(block.id)} disabled={disabled}>
              <GitBranch size={13} />
              Версионный
            </Button>
          ) : null}
          <button type="button" disabled={disabled} onClick={() => onDeleteBlock(block.id)} className="rounded-lg p-2 text-[var(--color-ink-muted)] hover:bg-white hover:text-red-600 disabled:opacity-30">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {block.kind === 'versioned' ? (
        <div className="rounded-xl border border-[#d9ecdf] bg-[#f7fcf9] px-4 py-3 transition-colors">
          {(() => {
            const selectedVariant =
              block.variants.find((variant) => activeTarget?.blockId === block.id && activeTarget.localId === variant.localId) ??
              getDefaultVariant(block.variants);
            const selectedIndex = block.variants.findIndex((variant) => variant.localId === selectedVariant.localId);

            return (
              <>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onSetDefault(block.id, selectedVariant.localId)}
                    className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold transition-colors disabled:opacity-40"
                    style={{
                      backgroundColor: selectedVariant.isDefault ? 'var(--color-brand-forest-soft)' : 'white',
                      color: 'var(--color-brand-forest)',
                      borderColor: selectedVariant.isDefault ? 'var(--color-brand-forest)' : '#cfe3d6',
                    }}
                  >
                    <Star size={11} className={selectedVariant.isDefault ? 'fill-current' : ''} />
                    По умолчанию
                  </button>
                  <button
                    type="button"
                    disabled={disabled || block.variants.length <= 1}
                    onClick={() => {
                      const currentIndex = block.variants.findIndex((variant) => variant.localId === selectedVariant.localId);
                      const nextVariant =
                        block.variants[currentIndex + 1] ?? block.variants[currentIndex - 1] ?? getDefaultVariant(block.variants);

                      if (nextVariant && nextVariant.localId !== selectedVariant.localId) {
                        onFocusTarget({ blockId: block.id, localId: nextVariant.localId });
                      }

                      onRemoveVersion(block.id, selectedVariant.localId);
                    }}
                    className="rounded-lg p-2 text-[var(--color-ink-muted)] hover:bg-white hover:text-red-600 disabled:opacity-30"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <Textarea
                  ref={(node) => editorRef(targetKey(block.id, selectedVariant.localId), node)}
                  value={selectedVariant.content}
                  disabled={disabled}
                  onFocus={() => onFocusTarget({ blockId: block.id, localId: selectedVariant.localId })}
                  onChange={(event) => onChangeVersion(block.id, selectedVariant.localId, event.target.value)}
                  className="min-h-[120px] border-0 bg-transparent px-0 py-1 text-[14px] leading-8 shadow-none focus:ring-0"
                  placeholder={`Текст версии ${selectedIndex + 1}...`}
                />
              </>
            );
          })()}
          <div className="mt-2 flex flex-wrap items-center justify-end gap-1.5 px-1">
            <span className="mr-1 ml-1 text-[10px] text-[var(--color-ink-subtle)]">Версии:</span>
            {block.variants.map((variant, variantIndex) => {
              const defaultVariant = getDefaultVariant(block.variants);
              const isActive = activeTarget?.blockId === block.id
                ? activeTarget.localId === variant.localId
                : defaultVariant.localId === variant.localId;
              const isDefault = defaultVariant.localId === variant.localId;

              return (
                <button
                  key={`footer-${variant.localId}`}
                  type="button"
                  onClick={() => onFocusTarget({ blockId: block.id, localId: variant.localId })}
                  disabled={disabled}
                  className="rounded border px-2 py-0.5 text-[11px] font-semibold transition-colors disabled:opacity-40"
                  style={{
                    backgroundColor: isActive
                      ? 'var(--color-brand-forest)'
                      : isDefault
                        ? 'var(--color-brand-forest-soft)'
                        : 'white',
                    color: isActive ? 'white' : 'var(--color-brand-forest)',
                    borderColor: isActive || isDefault ? 'var(--color-brand-forest)' : '#cfe3d6',
                  }}
                  title={isDefault ? 'Версия по умолчанию' : `Версия ${variantIndex + 1}`}
                >
                  {variantIndex + 1}
                </button>
              );
            })}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAddVersion(block.id)}
              className="inline-flex h-[22px] w-[22px] items-center justify-center rounded border border-[#cfe3d6] bg-white text-[var(--color-brand-forest)] transition-colors hover:bg-[var(--color-brand-forest-soft)] disabled:opacity-40"
              title="Добавить версию"
              aria-label="Добавить версию"
            >
              <Plus size={11} />
            </button>
          </div>
        </div>
      ) : (
        <Textarea
          ref={(node) => editorRef(targetKey(block.id, null), node)}
          value={block.content}
          disabled={disabled}
          onFocus={() => onFocusTarget({ blockId: block.id, localId: null })}
          onChange={(event) => onChangePlain(block.id, event.target.value)}
          className={`border-0 bg-transparent px-0 py-0 shadow-none focus:ring-0 ${headingClasses}`}
          placeholder={
            block.kind === 'heading2'
              ? 'Заголовок раздела...'
              : block.kind === 'heading3'
                ? 'Подзаголовок...'
                : 'Введите текст параграфа...'
          }
        />
      )}

      <div className="mt-4 flex flex-wrap gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Button className="px-3 py-1.5 text-xs" onClick={() => onAddAfter(block.id, 'paragraph')} disabled={disabled}>
          <Plus size={12} /> Параграф
        </Button>
        <Button className="px-3 py-1.5 text-xs" onClick={() => onAddAfter(block.id, 'heading2')} disabled={disabled}>
          <Plus size={12} /> H2
        </Button>
        <Button className="px-3 py-1.5 text-xs" onClick={() => onAddAfter(block.id, 'heading3')} disabled={disabled}>
          <Plus size={12} /> H3
        </Button>
        <Button className="px-3 py-1.5 text-xs" onClick={() => onAddAfter(block.id, 'versioned')} disabled={disabled}>
          <Plus size={12} /> Версионный
        </Button>
      </div>
    </section>
  );
};
