import React, { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getArticleContentById } from '../services/Article/articleService';
import { ArticleInfoboxPlaceholder } from '../components/article/ArticleInfoboxPlaceholder';
import { ArticleRightSidebar, type TocItem } from '../components/article/ArticleRightSidebar';
import { VersionedParagraphBlock } from '../components/article/VersionedParagraphBlock';
import MarkdownContent from '../components/MarkdownContent';
import { APP_CONSTANTS } from '../constants/AppConstants';
import { useLocale } from '../localization/hooks';
import {
  ARTICLE_UI_MODE_STORAGE_KEY,
  DEFAULT_ARTICLE_UI_MODE,
  isParagraphUiMode,
  type ParagraphUiMode,
} from '../constants/ArticleUiConstants';
import { getNavigationTree } from '../services/Article/navigationService';
import type { NavigationArticleDto, ParagraphDto } from '../shared/types/ApiTypes';

const findArticlePathById = (
  articles: NavigationArticleDto[],
  targetArticleId: number,
  parentPath: NavigationArticleDto[] = [],
): NavigationArticleDto[] => {
  for (const article of articles) {
    const currentPath = [...parentPath, article];

    if (article.id === targetArticleId && article.hasContent) {
      return currentPath;
    }

    if (article.children && article.children.length > 0) {
      const nestedPath = findArticlePathById(article.children, targetArticleId, currentPath);
      if (nestedPath.length > 0) {
        return nestedPath;
      }
    }
  }

  return [];
};

const getInitialUiMode = (): ParagraphUiMode => {
  const savedMode = localStorage.getItem(ARTICLE_UI_MODE_STORAGE_KEY);
  return isParagraphUiMode(savedMode) ? savedMode : DEFAULT_ARTICLE_UI_MODE;
};

const headingPattern = /^(#{1,6})\s+(.+)$/gm;

const extractHeadingTitle = (content: string): string | null => {
  const match = headingPattern.exec(content);
  headingPattern.lastIndex = 0;
  return match?.[2]?.trim() ?? null;
};

const ArticlePage: React.FC = () => {
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const articleId = parseInt(id || '0', 10);
  const [uiMode] = useState<ParagraphUiMode>(getInitialUiMode);
  const [selectedAlternatives, setSelectedAlternatives] = useState<Record<number, number>>({});

  const { data: articleContent, isLoading, error } = useQuery({
    queryKey: [APP_CONSTANTS.QUERY_KEYS.ARTICLE_CONTENT, articleId],
    queryFn: () => getArticleContentById(articleId),
    enabled: !isNaN(articleId) && articleId > 0,
  });

  const { data: navigationTree } = useQuery({
    queryKey: [APP_CONSTANTS.QUERY_KEYS.NAVIGATION_TREE],
    queryFn: getNavigationTree,
  });

  const articlePath = useMemo(
    () => (navigationTree ? findArticlePathById(navigationTree, articleId) : []),
    [navigationTree, articleId],
  );

  const breadcrumbItems = useMemo(
    () =>
      articlePath.map((article) => ({
        id: article.id,
        title: article.title,
        hasContent: article.hasContent,
      })),
    [articlePath],
  );

  const groupedParagraphs = useMemo(() => {
    const grouped = new Map<number, ParagraphDto[]>();

    articleContent?.paragraphs.forEach((paragraph) => {
      const paragraphsAtOrder = grouped.get(paragraph.order) ?? [];
      paragraphsAtOrder.push(paragraph);
      grouped.set(paragraph.order, paragraphsAtOrder);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([order, paragraphs]) => ({ order, paragraphs }));
  }, [articleContent]);

  const renderedParagraphs = useMemo(
    () =>
      groupedParagraphs.map(({ order, paragraphs }) => {
        const defaultIndex = paragraphs.findIndex((paragraph) => paragraph.isDefault);
        const activeIndex = selectedAlternatives[order] ?? (defaultIndex >= 0 ? defaultIndex : 0);
        const activeParagraph = paragraphs[activeIndex] ?? paragraphs[0];
        const title = extractHeadingTitle(activeParagraph.content);

        return {
          order,
          paragraphs,
          activeIndex,
          activeParagraph,
          hasAlternatives: paragraphs.length > 1,
          anchorId: title ? `section-${order}` : `paragraph-${order}`,
          title,
        };
      }),
    [groupedParagraphs, selectedAlternatives],
  );

  const tocItems = useMemo<TocItem[]>(() => {
    const items: TocItem[] = [{ id: 'article-overview', label: locale.articlePage.overview }];

    renderedParagraphs.forEach((paragraph) => {
      if (paragraph.title) {
        items.push({ id: paragraph.anchorId, label: paragraph.title });
      }
    });

    return items;
  }, [locale.articlePage.overview, renderedParagraphs]);

  const normalizeAlternativeIndex = (index: number, total: number) => {
    if (total <= 0) return 0;
    return ((index % total) + total) % total;
  };

  const selectAlternative = (order: number, index: number, total: number) => {
    const boundedIndex = Math.max(0, Math.min(index, total - 1));
    setSelectedAlternatives((current) => ({ ...current, [order]: boundedIndex }));
  };

  const moveAlternative = (order: number, currentIndex: number, direction: -1 | 1, total: number) => {
    const nextIndex = normalizeAlternativeIndex(currentIndex + direction, total);
    setSelectedAlternatives((current) => ({ ...current, [order]: nextIndex }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-border-soft)] border-t-[var(--color-brand-forest)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-xl rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-red-700 shadow-sm">
          <p className="m-0 text-base font-semibold">{locale.articlePage.loadError}</p>
          <p className="mb-0 mt-2 text-sm text-red-600">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!articleContent) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-3xl border border-[var(--color-border-soft)] bg-white px-8 py-10 text-center shadow-sm">
          <p className="m-0 text-lg font-semibold text-[var(--color-ink-strong)]">{locale.articlePage.articleNotFound}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="xl:flex xl:gap-0">
      <main className="min-w-0 flex-1 overflow-hidden border-right border-[var(--color-border-soft)] bg-white shadow-[0_24px_80px_rgba(28,27,24,0.05)] xl:rounded-r-none xl:border-r xl:border-[var(--color-border-soft)]">
        <div className="mx-auto max-w-[760px] px-4 py-6 pb-24 sm:px-6 lg:px-8 xl:px-10">
          {breadcrumbItems.length > 0 ? (
            <nav className="mb-5 flex flex-wrap items-center gap-1 text-[12.5px]">
              {breadcrumbItems.map((item, index) => (
                <React.Fragment key={`${item.id}-${index}`}>
                  <span className={index === breadcrumbItems.length - 1 ? 'text-[var(--color-ink-strong)]' : 'text-[var(--color-brand-forest)]'}>
                    {item.hasContent ? <Link to={`/article/${item.id}`}>{item.title}</Link> : item.title}
                  </span>
                  {index < breadcrumbItems.length - 1 ? (
                    <ChevronRight size={12} className="shrink-0 text-[#bebdb8]" />
                  ) : null}
                </React.Fragment>
              ))}
            </nav>
          ) : null}

          <h1 className="mb-4 text-[28px] font-bold tracking-[-0.03em] text-[var(--color-ink-strong)]">
            {articleContent.title}
          </h1>

          <div id="article-overview" className="scroll-mt-24">
            <ArticleInfoboxPlaceholder />
          </div>

          {renderedParagraphs.length > 0 ? (
            renderedParagraphs.map((paragraph) => {
              if (!paragraph.hasAlternatives) {
                return (
                  <section key={paragraph.order} id={paragraph.anchorId} className="scroll-mt-24 py-0.5">
                    <div className="article-markdown text-[14.5px] leading-8 text-[var(--color-ink-default)]">
                      <MarkdownContent content={paragraph.activeParagraph.content} />
                    </div>
                  </section>
                );
              }

              return (
                <div key={paragraph.order} id={paragraph.anchorId} className="scroll-mt-24">
                  <VersionedParagraphBlock
                    order={paragraph.order}
                    activeIndex={paragraph.activeIndex}
                    total={paragraph.paragraphs.length}
                    mode={uiMode}
                    onSelect={(index) => selectAlternative(paragraph.order, index, paragraph.paragraphs.length)}
                    onMove={(direction) => moveAlternative(paragraph.order, paragraph.activeIndex, direction, paragraph.paragraphs.length)}
                  >
                    <div className="article-markdown">
                      <MarkdownContent content={paragraph.activeParagraph.content} />
                    </div>
                  </VersionedParagraphBlock>
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-8 py-10 text-center text-[var(--color-ink-muted)] shadow-sm">
              {locale.articlePage.noContent}
            </div>
          )}
        </div>
      </main>

      <ArticleRightSidebar tocItems={tocItems} />
    </div>
  );
};

export default ArticlePage;
