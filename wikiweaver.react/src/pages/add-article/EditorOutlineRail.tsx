import { FileText, Hash, Info, Link2 } from 'lucide-react';
import type { EditorBlock, PlainEditorBlock } from './types';

type EditorOutlineRailProps = {
  blocks: EditorBlock[];
  parentArticleId: number | null;
  onJumpToBlock: (blockId: string) => void;
};

export const EditorOutlineRail = ({ blocks, parentArticleId, onJumpToBlock }: EditorOutlineRailProps) => {
  const outlineItems = blocks.filter(
    (block): block is PlainEditorBlock => block.kind === 'heading2' || block.kind === 'heading3',
  );

  return (
    <aside className="hidden xl:block xl:w-[240px] xl:shrink-0">
      <div className="sticky top-[calc(var(--layout-header-height)+64px)] space-y-6 px-4 py-6">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">Структура</p>
          <div className="space-y-1 rounded-2xl border border-[var(--color-border-soft)] bg-white p-2 shadow-sm">
            {outlineItems.length > 0 ? (
              outlineItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onJumpToBlock(item.id)}
                  className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[12px] transition-colors hover:bg-[var(--color-page-panel)] ${item.kind === 'heading3' ? 'pl-6 text-[var(--color-ink-muted)]' : 'text-[var(--color-ink-strong)]'}`}
                >
                  <Hash size={12} className="shrink-0 text-[var(--color-ink-subtle)]" />
                  <span className="truncate">{item.content || 'Без названия'}</span>
                </button>
              ))
            ) : (
              <p className="m-0 px-2 py-2 text-[12px] text-[var(--color-ink-subtle)]">Добавьте H2 или H3, чтобы структура появилась здесь.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-sm">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
            <FileText size={12} />
            Статья
          </p>
          <p className="m-0 text-[12px] text-[var(--color-ink-muted)]">Parent article id: {parentArticleId ?? 'не задан'}</p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-sm">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
            <Info size={12} />
            Инфобокс
          </p>
          <p className="m-0 text-[12px] leading-5 text-[var(--color-ink-muted)]">
            В первой итерации это placeholder. Реализация описана в `docs/todo/frontend-infobox.md`.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-sm">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
            <Link2 size={12} />
            Метаданные
          </p>
          <p className="m-0 text-[12px] leading-5 text-[var(--color-ink-muted)]">
            Здесь останутся заглушки под metadata и related links до следующей итерации.
          </p>
        </div>
      </div>
    </aside>
  );
};
