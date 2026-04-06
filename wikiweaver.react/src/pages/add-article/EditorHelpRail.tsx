import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowUp, BarChart3, Check, ChevronDown, Clock3, FileText, FolderTree, Layers3, PenLine, Search, Tag, Trash2, Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatMessage } from '../../localization';
import { useLocale } from '../../localization/hooks';
import { Input } from '../../shared/ui/Input';
import { Button } from '../../shared/ui/Button';
import { parseTags, type RelatedLinkDraft } from './metadataHelpers';

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
  actions?: ReactNode;
  isLocked: boolean;
  isLoadingParents?: boolean;
  selectedParent?: ParentOption | null;
  parentSearch?: string;
  filteredParentOptions?: ParentOption[];
  isParentDropdownOpen?: boolean;
  onToggleParentDropdown?: () => void;
  onParentSearchChange?: (value: string) => void;
  onSelectParent?: (option: ParentOption | null) => void;
  // Metadata
  summary?: string;
  tags?: string[];
  relatedLinks?: RelatedLinkDraft[];
  articleOptions?: ParentOption[];
  currentArticleId?: number;
  onSummaryChange?: (value: string) => void;
  onTagsChange?: (tags: string[]) => void;
  onAddRelatedLink?: (articleId: number, articleTitle: string) => void;
  onRemoveRelatedLink?: (draftId: string) => void;
  onMoveRelatedLink?: (draftId: string, direction: -1 | 1) => void;
};

const SUMMARY_MAX = 500;

const autoResize = (el: HTMLTextAreaElement | null) => {
  if (!el) return;
  el.style.height = '0px';
  el.style.height = `${el.scrollHeight}px`;
};

export const EditorHelpRail = ({
  blockCount,
  paragraphCount,
  wordCount,
  characterCount,
  readingTimeMinutes,
  actions,
  isLocked,
  isLoadingParents,
  selectedParent,
  parentSearch,
  filteredParentOptions,
  isParentDropdownOpen,
  onToggleParentDropdown,
  onParentSearchChange,
  onSelectParent,
  summary = '',
  tags = [],
  relatedLinks = [],
  articleOptions = [],
  currentArticleId,
  onSummaryChange,
  onTagsChange,
  onAddRelatedLink,
  onRemoveRelatedLink,
  onMoveRelatedLink,
}: EditorHelpRailProps) => {
  const locale = useLocale();
  const t = locale.addArticleEditor;
  const tm = t.metadata;

  const [tagInput, setTagInput] = useState('');
  const [relatedSearch, setRelatedSearch] = useState('');
  const [isRelatedDropdownOpen, setIsRelatedDropdownOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);

  const tagInputRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const relatedSearchWrapRef = useRef<HTMLDivElement>(null);

  // Keep summary textarea height in sync with content
  useEffect(() => {
    autoResize(summaryRef.current);
  }, [summary]);

  const alreadyLinkedIds = new Set([
    ...(currentArticleId != null ? [currentArticleId] : []),
    ...relatedLinks.map((l) => l.articleId),
  ]);

  const filteredArticleOptions = articleOptions.filter((option) => {
    if (alreadyLinkedIds.has(option.id)) return false;
    if (!relatedSearch.trim()) return true;
    const q = relatedSearch.trim().toLowerCase();
    return option.title.toLowerCase().includes(q) || option.path.toLowerCase().includes(q);
  });

  const openRelatedDropdown = () => {
    if (relatedSearchWrapRef.current) {
      setDropdownRect(relatedSearchWrapRef.current.getBoundingClientRect());
    }
    setIsRelatedDropdownOpen(true);
  };

  const closeRelatedDropdown = () => {
    setTimeout(() => {
      setIsRelatedDropdownOpen(false);
      setDropdownRect(null);
    }, 150);
  };

  const commitTagInput = () => {
    const newTags = parseTags(tagInput);
    if (newTags.length === 0) return;
    onTagsChange?.([...new Set([...tags, ...newTags])]);
    setTagInput('');
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commitTagInput();
    } else if (event.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      onTagsChange?.(tags.slice(0, -1));
    }
  };

  const hasMetadata = onSummaryChange != null;

  const relatedDropdown = isRelatedDropdownOpen && dropdownRect && (filteredArticleOptions.length > 0 || relatedSearch.trim())
    ? createPortal(
        <div
          style={{
            position: 'fixed',
            top: dropdownRect.bottom + 4,
            left: dropdownRect.left,
            width: dropdownRect.width,
            zIndex: 9999,
          }}
          className="max-h-48 overflow-y-auto rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[0_16px_40px_rgba(28,27,24,0.14)]"
        >
          {filteredArticleOptions.length > 0 ? (
            filteredArticleOptions.slice(0, 20).map((option) => (
              <button
                key={option.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onAddRelatedLink?.(option.id, option.title);
                  setRelatedSearch('');
                  setIsRelatedDropdownOpen(false);
                  setDropdownRect(null);
                }}
                className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--color-page-panel)]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-medium text-[var(--color-ink-strong)]">{option.title}</span>
                  <span className="block truncate text-[10px] text-[var(--color-ink-subtle)]">{option.path}</span>
                </span>
              </button>
            ))
          ) : (
            <p className="m-0 px-3 py-3 text-[12px] text-[var(--color-ink-subtle)]">{tm.noSearchResults}</p>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <aside className="hidden xl:block xl:w-[280px] xl:shrink-0">
      <div className="sticky top-[calc(var(--layout-header-height)+24px)] max-h-[calc(100vh-var(--layout-header-height)-48px)] overflow-y-auto space-y-4 px-4 pb-6">
        {actions ? <div>{actions}</div> : null}

        {onToggleParentDropdown ? (
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">{t.articleProperties}</p>
            <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-sm">
              <label className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
                <FolderTree size={11} />
                {t.parentArticle}
              </label>
              <div className="relative">
                <button
                  type="button"
                  disabled={isLocked || isLoadingParents}
                  onClick={onToggleParentDropdown}
                  className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2 text-left text-[12px] text-[var(--color-ink-strong)] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="truncate">{selectedParent?.path ?? t.selectParentArticle}</span>
                  <ChevronDown size={14} className="shrink-0 text-[var(--color-ink-subtle)]" />
                </button>

                {isParentDropdownOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[0_20px_50px_rgba(28,27,24,0.12)]">
                    <form autoComplete="off" className="border-b border-[var(--color-border-soft)] p-3">
                      <div className="relative">
                        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
                        <Input
                          value={parentSearch ?? ''}
                          disabled={isLocked}
                          onChange={(event) => onParentSearchChange?.(event.target.value)}
                          placeholder={t.parentSearchPlaceholder}
                          className="pl-9"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectParent?.(null)}
                        className="mt-3 text-xs font-medium text-[var(--color-brand-forest)] transition-colors hover:text-[var(--color-brand-forest-strong)]"
                      >
                        {t.clearParentSelection}
                      </button>
                    </form>
                    <div className="max-h-60 overflow-y-auto p-2">
                      {(filteredParentOptions ?? []).length > 0 ? (
                        (filteredParentOptions ?? []).map((option) => {
                          const isSelected = option.id === selectedParent?.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => onSelectParent?.(option)}
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
                        <p className="m-0 px-3 py-4 text-sm text-[var(--color-ink-subtle)]">{t.noParentResults}</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* Statistics */}
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
            <BarChart3 size={12} />
            {t.summaryTitle}
          </p>
          <div className="space-y-3 text-[12px] text-[var(--color-ink-muted)]">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2"><Layers3 size={12} className="text-[var(--color-ink-subtle)]" />{t.blocks}</span>
              <strong className="text-[var(--color-ink-strong)]">{blockCount}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2"><FileText size={12} className="text-[var(--color-ink-subtle)]" />{t.paragraphs}</span>
              <strong className="text-[var(--color-ink-strong)]">{paragraphCount}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2"><Type size={12} className="text-[var(--color-ink-subtle)]" />{t.words}</span>
              <strong className="text-[var(--color-ink-strong)]">{wordCount}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2"><PenLine size={12} className="text-[var(--color-ink-subtle)]" />{t.characters}</span>
              <strong className="text-[var(--color-ink-strong)]">{characterCount}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2"><Clock3 size={12} className="text-[var(--color-ink-subtle)]" />{t.readingTime}</span>
              <strong className="text-[var(--color-ink-strong)]">{readingTimeMinutes > 0 ? formatMessage(t.readingTimeMinutes, { minutes: readingTimeMinutes }) : '-'}</strong>
            </div>
          </div>
        </div>

        {/* Metadata: Summary + Tags + Related links */}
        {hasMetadata && (
          <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-sm">
            <div className="border-b border-[var(--color-border-soft)] px-4 py-3">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
                <Tag size={11} />
                {tm.summaryLabel}
              </p>
            </div>

            <div className="space-y-4 p-4">

              {/* Summary — auto-resize, no border, no bg */}
              <div>
                <textarea
                  ref={(el) => {
                    (summaryRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
                    autoResize(el);
                  }}
                  value={summary}
                  maxLength={SUMMARY_MAX}
                  disabled={isLocked}
                  rows={1}
                  onChange={(e) => {
                    onSummaryChange?.(e.target.value);
                    autoResize(e.currentTarget);
                  }}
                  placeholder={tm.summaryPlaceholder}
                  className="block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-[12px] leading-5 text-[var(--color-ink-strong)] placeholder:text-[var(--color-ink-subtle)] outline-none focus:ring-0 disabled:opacity-60"
                />
                {summary.length > 0 && (
                  <p className={`mt-1 text-right text-[10px] ${summary.length >= SUMMARY_MAX ? 'text-amber-500' : 'text-[var(--color-ink-subtle)]'}`}>
                    {summary.length}/{SUMMARY_MAX}
                  </p>
                )}
              </div>

              {/* Tags — borderless pill input */}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">{tm.tagsLabel}</p>
                <div
                  className="flex flex-wrap items-center gap-1 cursor-text"
                  onClick={() => tagInputRef.current?.focus()}
                >
                  {tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-0.5 rounded-full bg-[var(--color-brand-forest-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-brand-forest)]">
                      {tag}
                      {!isLocked && (
                        <button
                          type="button"
                          aria-label={`${tm.removeTag} ${tag}`}
                          onClick={(e) => { e.stopPropagation(); onTagsChange?.(tags.filter((tt) => tt !== tag)); }}
                          className="ml-0.5 rounded-full p-0.5 leading-none hover:bg-[var(--color-brand-forest)] hover:text-white transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={tagInput}
                    disabled={isLocked}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={commitTagInput}
                    placeholder={tags.length === 0 ? tm.tagsPlaceholder : ''}
                    className="min-w-[80px] flex-1 border-0 bg-transparent p-0 text-[12px] text-[var(--color-ink-strong)] placeholder:text-[var(--color-ink-subtle)] outline-none focus:ring-0"
                  />
                </div>
              </div>

              {/* Related links — portal dropdown */}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">{tm.relatedLinksTitle}</p>

                {relatedLinks.length > 0 && (
                  <div className="mb-2 divide-y divide-[var(--color-border-mute)] overflow-hidden rounded-xl border border-[var(--color-border-soft)]">
                    {relatedLinks.map((link, index) => (
                      <div key={link.id} className="group flex items-center gap-1 px-2.5 py-1.5">
                        <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--color-ink-strong)]">{link.articleTitle}</span>
                        <div className="flex shrink-0 items-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                          <Button variant="ghost" disabled={isLocked || index === 0} onClick={() => onMoveRelatedLink?.(link.id, -1)} aria-label={tm.moveUp} className="h-5 w-5 rounded-full px-0 py-0 text-[var(--color-ink-subtle)] hover:bg-[var(--color-page-panel)]">
                            <ArrowUp size={10} />
                          </Button>
                          <Button variant="ghost" disabled={isLocked || index === relatedLinks.length - 1} onClick={() => onMoveRelatedLink?.(link.id, 1)} aria-label={tm.moveDown} className="h-5 w-5 rounded-full px-0 py-0 text-[var(--color-ink-subtle)] hover:bg-[var(--color-page-panel)]">
                            <ArrowDown size={10} />
                          </Button>
                          <Button variant="ghost" disabled={isLocked} onClick={() => onRemoveRelatedLink?.(link.id)} aria-label={tm.removeRelatedLink} className="h-5 w-5 rounded-full px-0 py-0 text-red-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 size={10} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search input — portal dropdown renders into document.body */}
                <div ref={relatedSearchWrapRef} className="relative">
                  <Search size={12} className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
                  <input
                    type="text"
                    value={relatedSearch}
                    disabled={isLocked}
                    onChange={(e) => { setRelatedSearch(e.target.value); openRelatedDropdown(); }}
                    onFocus={openRelatedDropdown}
                    onBlur={closeRelatedDropdown}
                    placeholder={tm.relatedLinksSearchPlaceholder}
                    className="w-full border-0 bg-transparent py-0.5 pl-5 pr-0 text-[12px] text-[var(--color-ink-strong)] placeholder:text-[var(--color-ink-subtle)] outline-none focus:ring-0"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {relatedDropdown}
    </aside>
  );
};
