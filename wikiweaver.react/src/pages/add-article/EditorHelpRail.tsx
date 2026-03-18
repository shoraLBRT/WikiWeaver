import { FileText, Layers3, PenLine } from 'lucide-react';

type EditorHelpRailProps = {
  blockCount: number;
  totalTextParts: number;
  characterCount: number;
};

export const EditorHelpRail = ({
  blockCount,
  totalTextParts,
  characterCount,
}: EditorHelpRailProps) => {
  return (
    <aside className="hidden xl:block xl:w-[240px] xl:shrink-0">
      <div className="sticky top-[calc(var(--layout-header-height)+64px)] space-y-6 px-4 py-6">
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
            <Layers3 size={12} />
            Справка
          </p>
          <div className="space-y-3 text-[12px] text-[var(--color-ink-muted)]">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Layers3 size={12} className="text-[var(--color-ink-subtle)]" />
                Блоков
              </span>
              <strong className="text-[var(--color-ink-strong)]">{blockCount}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <FileText size={12} className="text-[var(--color-ink-subtle)]" />
                Текстовых частей
              </span>
              <strong className="text-[var(--color-ink-strong)]">{totalTextParts}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <PenLine size={12} className="text-[var(--color-ink-subtle)]" />
                Символов
              </span>
              <strong className="text-[var(--color-ink-strong)]">{characterCount}</strong>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
