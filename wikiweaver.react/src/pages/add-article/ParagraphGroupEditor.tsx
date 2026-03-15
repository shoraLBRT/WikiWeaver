import React from 'react';
import { Sparkles, Star, Trash2 } from 'lucide-react';
import SimpleMarkdownEditor from '../../components/SimpleMarkdownEditor';
import { locale } from '../../localization';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import type { ParagraphGroupDraft } from './types';

type ParagraphGroupEditorProps = {
  group: ParagraphGroupDraft;
  isAiBusy: boolean;
  onAddAlternative: (groupOrder: number) => void;
  onSetDefault: (groupOrder: number, localId: string) => void;
  onImproveWithAi: (groupOrder: number, localId: string) => void;
  onRemoveAlternative: (groupOrder: number, localId: string) => void;
  onContentChange: (groupOrder: number, localId: string, content: string) => void;
};

const ParagraphGroupEditor: React.FC<ParagraphGroupEditorProps> = ({
  group,
  isAiBusy,
  onAddAlternative,
  onSetDefault,
  onImproveWithAi,
  onRemoveAlternative,
  onContentChange,
}) => {
  const t = locale.addArticlePage;

  return (
    <Card
      className="overflow-hidden border border-[var(--color-border-soft)] bg-[rgba(255,255,255,0.94)] shadow-[0_24px_80px_rgba(28,27,24,0.06)]"
    >
      <div className="border-b border-[var(--color-border-soft)] bg-[linear-gradient(135deg,rgba(45,106,79,0.12),rgba(244,243,238,0.45))] px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-forest)]">Section block</p>
            <h2 className="m-0 text-xl font-semibold text-[var(--color-ink-strong)]">{t.paragraphTitle} #{group.order}</h2>
          </div>
          <Button onClick={() => onAddAlternative(group.order)}>
            {t.addAlternative}
          </Button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {group.alternatives.map((alternative, index) => (
          <div key={alternative.localId} className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSetDefault(group.order, alternative.localId)}
                  className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
                  style={{
                    borderColor: alternative.isDefault ? 'var(--color-brand-forest)' : 'var(--color-border-soft)',
                    backgroundColor: alternative.isDefault ? 'var(--color-brand-forest-soft)' : 'white',
                    color: alternative.isDefault ? 'var(--color-brand-forest)' : 'var(--color-ink-muted)',
                  }}
                >
                  <Star size={12} className={alternative.isDefault ? 'fill-current' : ''} />
                  {t.version} {index + 1}
                </button>
                {alternative.isDefault ? (
                  <span className="rounded-full bg-[#eaf7ef] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-brand-forest)]">
                    {t.defaultLabel}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  className="px-3 py-1.5 text-xs"
                  onClick={() => onImproveWithAi(group.order, alternative.localId)}
                  disabled={isAiBusy}
                >
                  <Sparkles size={13} />
                  {isAiBusy ? '...' : t.aiStyle}
                </Button>
                <Button
                  variant="ghost"
                  className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => onRemoveAlternative(group.order, alternative.localId)}
                  disabled={group.alternatives.length <= 1}
                >
                  <Trash2 size={13} />
                  {t.remove}
                </Button>
              </div>
            </div>

            <SimpleMarkdownEditor
              value={alternative.content}
              onChange={(content) => onContentChange(group.order, alternative.localId, content)}
              placeholder={t.editorPlaceholder}
            />
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ParagraphGroupEditor;
