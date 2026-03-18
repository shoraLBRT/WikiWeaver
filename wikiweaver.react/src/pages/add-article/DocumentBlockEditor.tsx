import { ArrowDown, ArrowUp, GitBranch, Plus, Trash2 } from 'lucide-react';
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

const VersionChip = ({
  variant,
  index,
  disabled,
  active,
  onSelect,
}: {
  variant: AlternativeDraft;
  index: number;
  disabled: boolean;
  active: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onSelect}
    className="rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50"
    style={{
      borderColor: variant.isDefault || active ? 'var(--color-brand-forest)' : 'var(--color-border-soft)',
      backgroundColor: variant.isDefault || active ? 'var(--color-brand-forest-soft)' : 'white',
      color: variant.isDefault || active ? 'var(--color-brand-forest)' : 'var(--color-ink-muted)',
    }}
  >
    Версия {index + 1}
  </button>
);

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
        <div className="rounded-2xl border border-[#d9ecdf] bg-[#f7fcf9] p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {block.variants.map((variant, variantIndex) => (
                <VersionChip
                  key={variant.localId}
                  variant={variant}
                  index={variantIndex}
                  disabled={disabled}
                  active={activeTarget?.blockId === block.id && activeTarget.localId === variant.localId}
                  onSelect={() => onFocusTarget({ blockId: block.id, localId: variant.localId })}
                />
              ))}
            </div>
            <Button className="px-3 py-1.5 text-xs" onClick={() => onAddVersion(block.id)} disabled={disabled}>
              <Plus size={13} />
              Добавить версию
            </Button>
          </div>

          <div className="space-y-4">
            {block.variants.map((variant, variantIndex) => {
              const isActive = activeTarget?.blockId === block.id && activeTarget.localId === variant.localId;

              return (
                <div key={variant.localId} className={`rounded-2xl border p-3 ${isActive ? 'border-[var(--color-brand-forest)] bg-white' : 'border-[#d9ecdf] bg-white/80'}`}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onSetDefault(block.id, variant.localId)}
                        className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          borderColor: variant.isDefault ? 'var(--color-brand-forest)' : 'var(--color-border-soft)',
                          backgroundColor: variant.isDefault ? 'var(--color-brand-forest-soft)' : 'white',
                          color: variant.isDefault ? 'var(--color-brand-forest)' : 'var(--color-ink-muted)',
                        }}
                      >
                        {variant.isDefault ? 'Версия по умолчанию' : `Сделать версией по умолчанию`}
                      </button>
                    </div>
                    <button type="button" disabled={disabled || block.variants.length <= 1} onClick={() => onRemoveVersion(block.id, variant.localId)} className="rounded-lg p-2 text-[var(--color-ink-muted)] hover:bg-[var(--color-page-panel)] hover:text-red-600 disabled:opacity-30">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <Textarea
                    ref={(node) => editorRef(targetKey(block.id, variant.localId), node)}
                    value={variant.content}
                    disabled={disabled}
                    onFocus={() => onFocusTarget({ blockId: block.id, localId: variant.localId })}
                    onChange={(event) => onChangeVersion(block.id, variant.localId, event.target.value)}
                    className="min-h-[120px] border-0 bg-transparent px-0 py-0 text-[14px] leading-8 shadow-none focus:ring-0"
                    placeholder={`Текст версии ${variantIndex + 1}...`}
                  />
                </div>
              );
            })}
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
