import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { InfoboxDraft } from './types';
import { cn } from '../../shared/lib/cn';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Textarea } from '../../shared/ui/Textarea';

type InfoboxEditorText = {
  title: string;
  description: string;
  titleLabel: string;
  titlePlaceholder: string;
  subtitleLabel: string;
  subtitlePlaceholder: string;
  addField: string;
  emptyState: string;
  fieldLabelLabel: string;
  fieldLabelPlaceholder: string;
  fieldValueLabel: string;
  fieldValuePlaceholder: string;
  moveUp: string;
  moveDown: string;
  removeField: string;
};

type InfoboxEditorProps = {
  draft: InfoboxDraft;
  disabled: boolean;
  text: InfoboxEditorText;
  className?: string;
  onTitleChange: (value: string) => void;
  onSubtitleChange: (value: string) => void;
  onAddField: () => void;
  onUpdateField: (fieldId: string, patch: { key?: string; label?: string; value?: string }) => void;
  onMoveField: (fieldId: string, direction: -1 | 1) => void;
  onRemoveField: (fieldId: string) => void;
};

export const InfoboxEditor = ({
  draft,
  disabled,
  text,
  className,
  onTitleChange,
  onSubtitleChange,
  onAddField,
  onUpdateField,
  onMoveField,
  onRemoveField,
}: InfoboxEditorProps) => {
  const hasFields = draft.fields.length > 0;
  const syncFieldRowHeights = (container: HTMLElement | null) => {
    if (!container) {
      return;
    }

    const textareas = Array.from(container.querySelectorAll<HTMLTextAreaElement>('[data-infobox-field-input="true"]'));

    if (textareas.length === 0) {
      return;
    }

    let nextHeight = 0;

    textareas.forEach((textarea) => {
      textarea.style.height = '0px';
      nextHeight = Math.max(nextHeight, textarea.scrollHeight);
    });

    textareas.forEach((textarea) => {
      textarea.style.height = `${nextHeight}px`;
    });
  };

  const syncFieldRowFromInput = (element: HTMLTextAreaElement | null) => {
    if (!element) {
      return;
    }

    syncFieldRowHeights(element.closest('[data-infobox-field-row]'));
  };

  return (
    <section className={cn('w-full', className)}>
      <aside className="mb-6 w-full overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-sm shadow-sm lg:float-right lg:mb-4 lg:ml-6 lg:w-[320px]">
        <div className="bg-[var(--color-brand-forest)] px-4 py-3 text-white">
          <label className="block">
            <span className="sr-only">{text.titleLabel}</span>
            <Input
              value={draft.title}
              maxLength={60}
              disabled={disabled}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder={text.titlePlaceholder}
              className="h-auto border-0 bg-transparent px-0 py-0 text-[15px] font-semibold leading-6 text-white placeholder:text-[#d8efe2] shadow-none focus:ring-0"
            />
          </label>
          <label className="mt-1 block">
            <span className="sr-only">{text.subtitleLabel}</span>
            <Input
              value={draft.subtitle}
              maxLength={80}
              disabled={disabled}
              onChange={(event) => onSubtitleChange(event.target.value)}
              placeholder={text.subtitlePlaceholder}
              className="h-auto border-0 bg-transparent px-0 py-0 text-[12px] leading-5 text-[#cfeedd] placeholder:text-[#b7ddc8] shadow-none focus:ring-0"
            />
          </label>
        </div>

        {hasFields ? (
          <div className="divide-y divide-[var(--color-border-mute)] bg-[var(--color-surface-muted)]">
            {draft.fields.map((field, index) => {
              return (
                <div key={field.id} className="group relative px-4 py-3">
                  <div className="pointer-events-none absolute right-1 top-1 z-10 flex items-center gap-0.5 rounded-full bg-white/92 px-1 py-0.5 shadow-sm opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                    <Button
                      variant="ghost"
                      disabled={disabled || index === 0}
                      onClick={() => onMoveField(field.id, -1)}
                      aria-label={text.moveUp}
                      className="h-5 w-5 rounded-full px-0 py-0 text-[var(--color-ink-subtle)] hover:bg-[var(--color-page-panel)] hover:text-[var(--color-ink-strong)]"
                    >
                      <ArrowUp size={11} />
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={disabled || index === draft.fields.length - 1}
                      onClick={() => onMoveField(field.id, 1)}
                      aria-label={text.moveDown}
                      className="h-5 w-5 rounded-full px-0 py-0 text-[var(--color-ink-subtle)] hover:bg-[var(--color-page-panel)] hover:text-[var(--color-ink-strong)]"
                    >
                      <ArrowDown size={11} />
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={disabled}
                      onClick={() => onRemoveField(field.id)}
                      aria-label={text.removeField}
                      className="h-5 w-5 rounded-full px-0 py-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={11} />
                    </Button>
                  </div>

                  <div data-infobox-field-row className="flex items-start gap-3">
                    <label className="w-[104px] shrink-0 self-stretch">
                      <span className="sr-only">{text.fieldLabelLabel}</span>
                      <Textarea
                        rows={1}
                        value={field.label}
                        maxLength={30}
                        disabled={disabled}
                        onChange={(event) => {
                          onUpdateField(field.id, { label: event.target.value });
                          syncFieldRowFromInput(event.currentTarget);
                        }}
                        onInput={(event) => syncFieldRowFromInput(event.currentTarget)}
                        ref={syncFieldRowFromInput}
                        placeholder={text.fieldLabelPlaceholder}
                        data-infobox-field-input="true"
                        className="min-h-[28px] h-full resize-none overflow-hidden rounded-none border-0 bg-transparent px-0 py-0 text-[12px] font-medium uppercase leading-5 tracking-[0.08em] text-[var(--color-ink-muted)] placeholder:text-[var(--color-ink-subtle)] shadow-none focus:ring-0"
                      />
                    </label>

                    <div className="min-w-0 flex-1 self-stretch">
                      <label className="block">
                        <span className="sr-only">{text.fieldValueLabel}</span>
                        <Textarea
                          rows={1}
                          value={field.value}
                          maxLength={50}
                          disabled={disabled}
                          onChange={(event) => {
                            onUpdateField(field.id, { value: event.target.value });
                            syncFieldRowFromInput(event.currentTarget);
                          }}
                          onInput={(event) => syncFieldRowFromInput(event.currentTarget)}
                          ref={syncFieldRowFromInput}
                          placeholder={text.fieldValuePlaceholder}
                          data-infobox-field-input="true"
                          className="min-h-[28px] h-full resize-none overflow-hidden rounded-none border-0 bg-transparent px-0 py-0 text-[12px] leading-5 text-[var(--color-ink-strong)] placeholder:text-[var(--color-ink-subtle)] shadow-none focus:ring-0"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-4 text-[12px] leading-6 text-[var(--color-ink-muted)]">
            {text.emptyState}
          </div>
        )}

        <div className="flex justify-end border-t border-[var(--color-border-soft)] px-4 py-2">
          <Button variant="ghost" disabled={disabled} onClick={onAddField} className="shrink-0 rounded-full px-2.5 py-1 text-[11px] text-[var(--color-brand-forest)] hover:bg-[var(--color-brand-forest-soft)] hover:text-[var(--color-brand-forest-strong)]">
            <Plus size={12} />
            {text.addField}
          </Button>
        </div>
      </aside>
    </section>
  );
};
