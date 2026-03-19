import { Hash } from 'lucide-react';
import { locale } from '../../localization';
import type { EditorBlock, PlainEditorBlock } from './types';

type EditorOutlineRailProps = {
  blocks: EditorBlock[];
  onJumpToBlock: (blockId: string) => void;
};

export const EditorOutlineRail = ({ blocks, onJumpToBlock }: EditorOutlineRailProps) => {
  const t = locale.addArticleEditor;
  const outlineItems = blocks.filter(
    (block): block is PlainEditorBlock => block.kind === 'heading2' || block.kind === 'heading3',
  );

  return (
    <aside className="hidden xl:block xl:w-[240px] xl:shrink-0">
      <div className="sticky top-[calc(var(--layout-header-height)+24px)] space-y-6 px-4 pb-6">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">{t.outlineTitle}</p>
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
                  <span className="truncate">{item.content || locale.common.untitled}</span>
                </button>
              ))
            ) : (
              <p className="m-0 px-2 py-2 text-[12px] text-[var(--color-ink-subtle)]">
                {t.outlineEmpty}
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
