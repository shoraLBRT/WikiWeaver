import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react';
import { ArrowDown, ArrowUp, GitBranch, Pilcrow, Plus, Star, Trash2 } from 'lucide-react';
import { formatMessage } from '../../localization';
import { useLocale } from '../../localization/hooks';
import { cn } from '../../shared/lib/cn';
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
  onConvertToParagraph: (blockId: string) => void;
};

const targetKey = (blockId: string, localId: string | null) => `${blockId}:${localId ?? 'plain'}`;

const getDefaultVariant = (variants: AlternativeDraft[]) =>
  variants.find((variant) => variant.isDefault) ?? variants[0];

type AutoResizingTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  textareaRef: (node: HTMLTextAreaElement | null) => void;
};

const AutoResizingTextarea = ({ textareaRef, className, value, ...props }: AutoResizingTextareaProps) => {
  const localRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const textarea = localRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return (
    <Textarea
      {...props}
      ref={(node) => {
        localRef.current = node;
        textareaRef(node);
      }}
      rows={1}
      value={value}
      className={cn('resize-none overflow-hidden', className)}
    />
  );
};

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
  onConvertToParagraph,
}: DocumentBlockEditorProps) => {
  const locale = useLocale();
  const t = locale.addArticleEditor;
  const headingClasses =
    block.kind === 'heading2'
      ? 'min-h-[36px] text-[24px] font-bold tracking-[-0.03em]'
      : block.kind === 'heading3'
        ? 'min-h-[30px] text-[18px] font-semibold'
        : 'min-h-[32px] text-[15px] leading-8';

  const blockKindLabel =
    block.kind === 'heading2'
      ? t.blockKinds.heading2
      : block.kind === 'heading3'
        ? t.blockKinds.heading3
        : block.kind === 'versioned'
          ? t.blockKinds.versioned
          : t.blockKinds.paragraph;

  return (
    <section
      ref={(node) => blockRef(block.id, node)}
      className="group rounded-[24px] border border-transparent px-5 py-2.5 transition-colors hover:border-[var(--color-border-soft)] hover:bg-[rgba(250,250,248,0.65)]"
    >
      <div className="mb-0.5 flex min-h-0 items-start justify-between gap-3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <div className="flex min-h-0 items-center gap-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
          {block.kind === 'versioned' ? <GitBranch size={12} /> : null}
          <span>{blockKindLabel}</span>
        </div>
        <div className="flex items-center gap-1 py-0">
          {block.kind === 'paragraph' ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onConvertToVersioned(block.id)}
              className="rounded-lg p-1.5 text-[var(--color-ink-muted)] hover:bg-white hover:text-[var(--color-ink-strong)] disabled:opacity-30"
              title={t.toggleToVersioned}
              aria-label={t.toggleToVersioned}
            >
              <GitBranch size={14} />
            </button>
          ) : null}
          {block.kind === 'versioned' ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onConvertToParagraph(block.id)}
              className="rounded-lg p-1.5 text-[var(--color-ink-muted)] hover:bg-white hover:text-[var(--color-ink-strong)] disabled:opacity-30"
              title={t.toggleToParagraph}
              aria-label={t.toggleToParagraph}
            >
              <Pilcrow size={14} />
            </button>
          ) : null}
          <button type="button" disabled={disabled || index === 0} onClick={() => onMoveBlock(block.id, -1)} className="rounded-lg p-1.5 text-[var(--color-ink-muted)] hover:bg-white disabled:opacity-30">
            <ArrowUp size={14} />
          </button>
          <button type="button" disabled={disabled || index === total - 1} onClick={() => onMoveBlock(block.id, 1)} className="rounded-lg p-1.5 text-[var(--color-ink-muted)] hover:bg-white disabled:opacity-30">
            <ArrowDown size={14} />
          </button>
          <button type="button" disabled={disabled} onClick={() => onDeleteBlock(block.id)} className="rounded-lg p-1.5 text-[var(--color-ink-muted)] hover:bg-white hover:text-red-600 disabled:opacity-30">
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
                    {t.defaultVersion}
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

                <AutoResizingTextarea
                  textareaRef={(node) => editorRef(targetKey(block.id, selectedVariant.localId), node)}
                  value={selectedVariant.content}
                  disabled={disabled}
                  onFocus={() => onFocusTarget({ blockId: block.id, localId: selectedVariant.localId })}
                  onChange={(event) => onChangeVersion(block.id, selectedVariant.localId, event.target.value)}
                  className="min-h-[32px] border-0 bg-transparent px-0 py-1 text-[14px] leading-8 shadow-none focus:ring-0"
                  placeholder={formatMessage(t.versionTextPlaceholder, { index: selectedIndex + 1 })}
                />
              </>
            );
          })()}
          <div className="mt-2 flex flex-wrap items-center justify-end gap-1.5 px-1">
            <span className="mr-1 ml-1 text-[10px] text-[var(--color-ink-subtle)]">{t.versions}</span>
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
                  title={isDefault ? t.defaultVersionTitle : formatMessage(t.versionTitle, { index: variantIndex + 1 })}
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
              title={t.addVersion}
              aria-label={t.addVersion}
            >
              <Plus size={11} />
            </button>
          </div>
        </div>
      ) : (
        <AutoResizingTextarea
          textareaRef={(node) => editorRef(targetKey(block.id, null), node)}
          value={block.content}
          disabled={disabled}
          onFocus={() => onFocusTarget({ blockId: block.id, localId: null })}
          onChange={(event) => onChangePlain(block.id, event.target.value)}
          className={`border-0 bg-transparent px-0 py-0 shadow-none focus:ring-0 ${headingClasses}`}
            placeholder={
              block.kind === 'heading2'
                ? t.sectionTitlePlaceholder
                : block.kind === 'heading3'
                  ? t.subsectionTitlePlaceholder
                  : t.paragraphPlaceholder
            }
          />
      )}

    </section>
  );
};
