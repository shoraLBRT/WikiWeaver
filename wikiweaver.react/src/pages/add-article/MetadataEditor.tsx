import { ArrowDown, ArrowUp, Check, Search, Tag, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Textarea } from '../../shared/ui/Textarea';
import { parseTags, type RelatedLinkDraft } from './metadataHelpers';

type ArticleOption = {
  id: number;
  title: string;
  path: string;
};

type MetadataEditorText = {
  summaryLabel: string;
  summaryPlaceholder: string;
  tagsLabel: string;
  tagsPlaceholder: string;
  relatedLinksTitle: string;
  relatedLinksSearchPlaceholder: string;
  noRelatedLinksYet: string;
  noSearchResults: string;
  removeTag: string;
  removeRelatedLink: string;
  moveUp: string;
  moveDown: string;
};

type MetadataEditorProps = {
  summary: string;
  tags: string[];
  relatedLinks: RelatedLinkDraft[];
  disabled: boolean;
  text: MetadataEditorText;
  articleOptions: ArticleOption[];
  currentArticleId?: number;
  onSummaryChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
  onAddRelatedLink: (articleId: number, articleTitle: string) => void;
  onRemoveRelatedLink: (draftId: string) => void;
  onMoveRelatedLink: (draftId: string, direction: -1 | 1) => void;
};

const SUMMARY_MAX = 500;

export const MetadataEditor = ({
  summary,
  tags,
  relatedLinks,
  disabled,
  text,
  articleOptions,
  currentArticleId,
  onSummaryChange,
  onTagsChange,
  onAddRelatedLink,
  onRemoveRelatedLink,
  onMoveRelatedLink,
}: MetadataEditorProps) => {
  const [tagInput, setTagInput] = useState('');
  const [relatedSearch, setRelatedSearch] = useState('');
  const [isRelatedDropdownOpen, setIsRelatedDropdownOpen] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

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

  const commitTagInput = () => {
    const newTags = parseTags(tagInput);
    if (newTags.length === 0) return;
    const merged = [...new Set([...tags, ...newTags.map((t) => t.toLowerCase() === t ? t : t)])];
    onTagsChange(merged);
    setTagInput('');
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commitTagInput();
    } else if (event.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      onTagsChange(tags.slice(0, -1));
    }
  };

  const selectRelatedArticle = (option: ArticleOption) => {
    onAddRelatedLink(option.id, option.title);
    setRelatedSearch('');
    setIsRelatedDropdownOpen(false);
  };

  return (
    <div className="mb-6 w-full overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-sm shadow-sm">
      <div className="space-y-5 px-5 py-5">
        {/* Summary */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
            {text.summaryLabel}
          </label>
          <Textarea
            rows={3}
            value={summary}
            maxLength={SUMMARY_MAX}
            disabled={disabled}
            onChange={(event) => onSummaryChange(event.target.value)}
            placeholder={text.summaryPlaceholder}
            className="resize-none rounded-xl text-[13px] leading-6"
          />
          <p className={`mt-1 text-right text-[11px] ${summary.length >= SUMMARY_MAX ? 'text-amber-500' : 'text-[var(--color-ink-subtle)]'}`}>
            {summary.length}/{SUMMARY_MAX}
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
            {text.tagsLabel}
          </label>
          <div
            className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-xl border border-[var(--color-border-soft)] bg-white px-3 py-2 focus-within:border-[var(--color-brand-forest)] focus-within:ring-1 focus-within:ring-[var(--color-focus-ring)] cursor-text"
            onClick={() => tagInputRef.current?.focus()}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-[var(--color-brand-forest-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-brand-forest)]"
              >
                <Tag size={9} />
                {tag}
                {!disabled && (
                  <button
                    type="button"
                    aria-label={`${text.removeTag} ${tag}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onTagsChange(tags.filter((t) => t !== tag));
                    }}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-[var(--color-brand-forest)] hover:text-white transition-colors"
                  >
                    <X size={8} />
                  </button>
                )}
              </span>
            ))}
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              disabled={disabled}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={commitTagInput}
              placeholder={tags.length === 0 ? text.tagsPlaceholder : ''}
              className="min-w-[120px] flex-1 border-0 bg-transparent px-0 py-0 text-[13px] text-[var(--color-ink-strong)] placeholder:text-[var(--color-ink-subtle)] outline-none focus:ring-0"
            />
          </div>
        </div>

        {/* Related Links */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
            {text.relatedLinksTitle}
          </label>

          {relatedLinks.length > 0 && (
            <div className="mb-2 divide-y divide-[var(--color-border-mute)] overflow-hidden rounded-xl border border-[var(--color-border-soft)] bg-white">
              {relatedLinks.map((link, index) => (
                <div key={link.id} className="group flex items-center gap-2 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--color-ink-strong)]">
                    {link.articleTitle}
                  </span>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      disabled={disabled || index === 0}
                      onClick={() => onMoveRelatedLink(link.id, -1)}
                      aria-label={text.moveUp}
                      className="h-6 w-6 rounded-full px-0 py-0 text-[var(--color-ink-subtle)] hover:bg-[var(--color-page-panel)] hover:text-[var(--color-ink-strong)]"
                    >
                      <ArrowUp size={11} />
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={disabled || index === relatedLinks.length - 1}
                      onClick={() => onMoveRelatedLink(link.id, 1)}
                      aria-label={text.moveDown}
                      className="h-6 w-6 rounded-full px-0 py-0 text-[var(--color-ink-subtle)] hover:bg-[var(--color-page-panel)] hover:text-[var(--color-ink-strong)]"
                    >
                      <ArrowDown size={11} />
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={disabled}
                      onClick={() => onRemoveRelatedLink(link.id)}
                      aria-label={text.removeRelatedLink}
                      className="h-6 w-6 rounded-full px-0 py-0 text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={11} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <div className="relative">
              <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
              <Input
                value={relatedSearch}
                disabled={disabled}
                onChange={(event) => {
                  setRelatedSearch(event.target.value);
                  setIsRelatedDropdownOpen(true);
                }}
                onFocus={() => setIsRelatedDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsRelatedDropdownOpen(false), 150)}
                placeholder={text.relatedLinksSearchPlaceholder}
                className="pl-9 text-[13px]"
              />
            </div>

            {isRelatedDropdownOpen && (filteredArticleOptions.length > 0 || relatedSearch.trim()) && (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-52 overflow-y-auto rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[0_20px_50px_rgba(28,27,24,0.12)]">
                {filteredArticleOptions.length > 0 ? (
                  filteredArticleOptions.slice(0, 30).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        selectRelatedArticle(option);
                      }}
                      className="flex w-full items-start gap-2 px-4 py-2.5 text-left transition-colors hover:bg-[var(--color-page-panel)]"
                    >
                      <Check size={13} className="mt-0.5 shrink-0 text-transparent" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-[var(--color-ink-strong)]">{option.title}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-[var(--color-ink-subtle)]">{option.path}</span>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="m-0 px-4 py-4 text-[13px] text-[var(--color-ink-subtle)]">{text.noSearchResults}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
