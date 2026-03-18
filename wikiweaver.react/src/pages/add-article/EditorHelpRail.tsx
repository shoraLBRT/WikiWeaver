import { Check, ChevronDown, Clock3, FileText, FolderTree, Info, Layers3, Link2, PenLine, Search, Type } from 'lucide-react';
import { Input } from '../../shared/ui/Input';

type ParentOption = {
  id: number;
  title: string;
  path: string;
};

type EditorHelpRailProps = {
  blockCount: number;
  paragraphCount: number;
  wordCount: number;
  characterCount: number;
  readingTimeMinutes: number;
  isLocked: boolean;
  isLoadingParents: boolean;
  selectedParent: ParentOption | null;
  parentSearch: string;
  filteredParentOptions: ParentOption[];
  isParentDropdownOpen: boolean;
  onToggleParentDropdown: () => void;
  onParentSearchChange: (value: string) => void;
  onSelectParent: (option: ParentOption | null) => void;
};

export const EditorHelpRail = ({
  blockCount,
  paragraphCount,
  wordCount,
  characterCount,
  readingTimeMinutes,
  isLocked,
  isLoadingParents,
  selectedParent,
  parentSearch,
  filteredParentOptions,
  isParentDropdownOpen,
  onToggleParentDropdown,
  onParentSearchChange,
  onSelectParent,
}: EditorHelpRailProps) => {
  return (
    <aside className="hidden xl:block xl:w-[280px] xl:shrink-0">
      <div className="sticky top-[calc(var(--layout-header-height)+64px)] space-y-6 px-4 py-6">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">Свойства статьи</p>
          <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-sm">

            <label className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
              <FolderTree size={11} />
              Родительская статья
            </label>

            <div className="relative">
              <button
                type="button"
                disabled={isLocked || isLoadingParents}
                onClick={onToggleParentDropdown}
                className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2 text-left text-[12px] text-[var(--color-ink-strong)] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="truncate">{selectedParent?.path ?? 'Выберите родительскую статью...'}</span>
                <ChevronDown size={14} className="shrink-0 text-[var(--color-ink-subtle)]" />
              </button>

              {isParentDropdownOpen ? (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[0_20px_50px_rgba(28,27,24,0.12)]">
                  <div className="border-b border-[var(--color-border-soft)] p-3">
                    <div className="relative">
                      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
                      <Input
                        value={parentSearch}
                        disabled={isLocked}
                        onChange={(event) => onParentSearchChange(event.target.value)}
                        placeholder="Поиск статьи..."
                        className="pl-9"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectParent(null)}
                      className="mt-3 text-xs font-medium text-[var(--color-brand-forest)] transition-colors hover:text-[var(--color-brand-forest-strong)]"
                    >
                      Очистить выбор
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto p-2">
                    {filteredParentOptions.length > 0 ? (
                      filteredParentOptions.map((option) => {
                        const isSelected = option.id === selectedParent?.id;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => onSelectParent(option)}
                            className={`flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left transition-colors ${isSelected ? 'bg-[var(--color-brand-forest-soft)]' : 'hover:bg-[var(--color-page-panel)]'}`}
                          >
                            <span className="mt-0.5 shrink-0 text-[var(--color-brand-forest)]">
                              {isSelected ? <Check size={14} /> : <FolderTree size={14} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-[var(--color-ink-strong)]">{option.title}</span>
                              <span className="mt-0.5 block truncate text-xs text-[var(--color-ink-subtle)]">{option.path}</span>
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="m-0 px-3 py-4 text-sm text-[var(--color-ink-subtle)]">Ничего не найдено.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
            <Layers3 size={12} />
            Сводка
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
                Абзацев
              </span>
              <strong className="text-[var(--color-ink-strong)]">{paragraphCount}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Type size={12} className="text-[var(--color-ink-subtle)]" />
                Слов
              </span>
              <strong className="text-[var(--color-ink-strong)]">{wordCount}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <PenLine size={12} className="text-[var(--color-ink-subtle)]" />
                Символов
              </span>
              <strong className="text-[var(--color-ink-strong)]">{characterCount}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Clock3 size={12} className="text-[var(--color-ink-subtle)]" />
                Время чтения
              </span>
              <strong className="text-[var(--color-ink-strong)]">{readingTimeMinutes > 0 ? `~${readingTimeMinutes} мин` : '-'}</strong>
            </div>
          </div>
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
