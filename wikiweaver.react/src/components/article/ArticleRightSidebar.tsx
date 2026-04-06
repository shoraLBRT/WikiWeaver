import { Tag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../localization/hooks';
import type { ArticleRelatedLinkDto } from '../../shared/types/ApiTypes';

export type TocItem = {
  id: string;
  label: string;
};

type ArticleRightSidebarProps = {
  tocItems: TocItem[];
  summary?: string;
  tags?: string[];
  relatedLinks?: ArticleRelatedLinkDto[];
};

export const ArticleRightSidebar = ({ tocItems, summary, tags, relatedLinks }: ArticleRightSidebarProps) => {
  const locale = useLocale();
  const t = locale.articleRightSidebar;
  const [activeId, setActiveId] = useState<string>(tocItems[0]?.id ?? 'intro');

  useEffect(() => {
    if (tocItems.length === 0) {
      return;
    }

    const handler = () => {
      const sections = tocItems
        .map((item) => document.getElementById(item.id))
        .filter((element): element is HTMLElement => Boolean(element));

      for (let index = sections.length - 1; index >= 0; index -= 1) {
        const element = sections[index];
        if (element.getBoundingClientRect().top <= 120) {
          setActiveId(element.id);
          break;
        }
      }
    };

    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [tocItems]);

  const hasTags = tags && tags.length > 0;
  const hasRelatedLinks = relatedLinks && relatedLinks.length > 0;
  const hasSummary = Boolean(summary?.trim());

  return (
    <aside className="hidden xl:block xl:w-[220px] xl:shrink-0">
      <div className="flex-1 overflow-y-auto py-4 px-4">
        <div className="mb-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
            {t.onThisPage}
          </p>
          <nav className="space-y-0.5">
            {tocItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={[
                  'block rounded px-2 py-1 text-[12.5px] transition-colors',
                  activeId === item.id
                    ? 'bg-[var(--color-brand-forest-soft)] text-[var(--color-brand-forest)]'
                    : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-page-panel)] hover:text-[var(--color-ink-strong)]',
                ].join(' ')}
                onClick={() => setActiveId(item.id)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {(hasSummary || hasTags) && (
          <div className="mb-4 border-t border-[var(--color-border-soft)] pt-4 space-y-3">
            {hasSummary && (
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
                  {t.summaryTitle}
                </p>
                <p className="m-0 text-[12px] leading-5 text-[var(--color-ink-default)]">{summary}</p>
              </div>
            )}
            {hasTags && (
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
                  {t.tagsTitle}
                </p>
                <div className="flex flex-wrap gap-1">
                  {tags!.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded-full bg-[var(--color-brand-forest-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-brand-forest)]"
                    >
                      <Tag size={8} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-[var(--color-border-soft)] pt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
            {t.relatedArticles}
          </p>
          {hasRelatedLinks ? (
            <nav className="space-y-0.5">
              {relatedLinks!.map((link) => (
                <Link
                  key={link.id}
                  to={`/article/${link.relatedArticleId}`}
                  className="block rounded px-2 py-1 text-[12.5px] text-[var(--color-brand-forest)] transition-colors hover:bg-[var(--color-brand-forest-soft)]"
                >
                  {link.relatedArticleTitle}
                </Link>
              ))}
            </nav>
          ) : (
            <p className="m-0 text-[12px] leading-5 text-[var(--color-ink-subtle)]">{t.noRelatedArticles}</p>
          )}
        </div>
      </div>
    </aside>
  );
};
