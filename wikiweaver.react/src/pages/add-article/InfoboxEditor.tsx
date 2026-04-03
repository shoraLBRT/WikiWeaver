import { ArrowDown, ArrowUp, Info, Plus, Trash2 } from 'lucide-react';
import type { InfoboxDraft } from './types';
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
  fieldKeyLabel: string;
  fieldKeyPlaceholder: string;
  fieldLabelLabel: string;
  fieldLabelPlaceholder: string;
  fieldValueLabel: string;
  fieldValuePlaceholder: string;
  keyHint: string;
  moveUp: string;
  moveDown: string;
  removeField: string;
};

type InfoboxEditorProps = {
  draft: InfoboxDraft;
  disabled: boolean;
  text: InfoboxEditorText;
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
  onTitleChange,
  onSubtitleChange,
  onAddField,
  onUpdateField,
  onMoveField,
  onRemoveField,
}: InfoboxEditorProps) => (
  <section className="mb-6 rounded-[26px] border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-5 py-5 shadow-sm sm:px-6">
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-ink-subtle)]">
          <Info size={12} />
          {text.title}
        </p>
        <p className="m-0 max-w-2xl text-sm leading-6 text-[var(--color-ink-muted)]">{text.description}</p>
      </div>
      <Button variant="secondary" disabled={disabled} onClick={onAddField}>
        <Plus size={14} />
        {text.addField}
      </Button>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <label className="block">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">{text.titleLabel}</span>
        <Input value={draft.title} disabled={disabled} onChange={(event) => onTitleChange(event.target.value)} placeholder={text.titlePlaceholder} />
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">{text.subtitleLabel}</span>
        <Input value={draft.subtitle} disabled={disabled} onChange={(event) => onSubtitleChange(event.target.value)} placeholder={text.subtitlePlaceholder} />
      </label>
    </div>

    {draft.fields.length > 0 ? (
      <div className="mt-5 space-y-3">
        {draft.fields.map((field, index) => (
          <div key={field.id} className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="m-0 text-sm font-semibold text-[var(--color-ink-strong)]">{text.fieldLabelLabel} {index + 1}</p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" disabled={disabled || index === 0} onClick={() => onMoveField(field.id, -1)} aria-label={text.moveUp}>
                  <ArrowUp size={14} />
                </Button>
                <Button variant="ghost" disabled={disabled || index === draft.fields.length - 1} onClick={() => onMoveField(field.id, 1)} aria-label={text.moveDown}>
                  <ArrowDown size={14} />
                </Button>
                <Button variant="ghost" disabled={disabled} onClick={() => onRemoveField(field.id)} aria-label={text.removeField}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">{text.fieldKeyLabel}</span>
                  <Input value={field.key} disabled={disabled} onChange={(event) => onUpdateField(field.id, { key: event.target.value })} placeholder={text.fieldKeyPlaceholder} />
                  <span className="mt-2 block text-[12px] leading-5 text-[var(--color-ink-subtle)]">{text.keyHint}</span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">{text.fieldLabelLabel}</span>
                  <Input value={field.label} disabled={disabled} onChange={(event) => onUpdateField(field.id, { label: event.target.value })} placeholder={text.fieldLabelPlaceholder} />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">{text.fieldValueLabel}</span>
                <Textarea
                  rows={5}
                  value={field.value}
                  disabled={disabled}
                  onChange={(event) => onUpdateField(field.id, { value: event.target.value })}
                  placeholder={text.fieldValuePlaceholder}
                  className="min-h-[128px]"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="mt-5 rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-white px-4 py-5 text-sm leading-6 text-[var(--color-ink-muted)]">
        {text.emptyState}
      </div>
    )}
  </section>
);
