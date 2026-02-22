import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getArticleContentById } from '../services/Article/articleService';
import { Spin, Alert, Empty, Button, Space, Breadcrumb } from 'antd';
import MarkdownContent from '../components/MarkdownContent';
import styles from './ArticlePage.module.css';
import { LoadingOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { APP_CONSTANTS } from '../constants/AppConstants';
import { locale } from '../localization';
import {
  ARTICLE_UI_MODE_STORAGE_KEY,
  DEFAULT_ARTICLE_UI_MODE,
  isParagraphUiMode,
  type ParagraphUiMode,
} from '../constants/ArticleUiConstants';
import { getNavigationTree } from '../services/Article/navigationService';
import type { NavigationNodeDto, ParagraphDto } from '../shared/types/ApiTypes';

const findNodePathByArticleId = (
  nodes: NavigationNodeDto[],
  targetArticleId: number,
  parentPath: NavigationNodeDto[] = [],
): NavigationNodeDto[] => {
  for (const node of nodes) {
    const currentPath = [...parentPath, node];

    if (node.article?.id === targetArticleId) {
      return currentPath;
    }

    if (node.children && node.children.length > 0) {
      const nestedPath = findNodePathByArticleId(node.children, targetArticleId, currentPath);
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

const ArticlePage: React.FC = () => {
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

  const nodePath = useMemo(
    () => (navigationTree ? findNodePathByArticleId(navigationTree, articleId) : []),
    [navigationTree, articleId],
  );

  const breadcrumbItems = useMemo(
    () =>
      nodePath.map((node) => ({
        title: node.article ? <Link to={`/article/${node.article.id}`}>{node.title}</Link> : node.title,
      })),
    [nodePath],
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Alert
          message={locale.articlePage.loadError}
          description={(error as Error).message}
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (!articleContent) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Empty description={locale.articlePage.articleNotFound} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {breadcrumbItems.length > 0 && (
        <div className={styles.breadcrumb}>
          <Breadcrumb items={breadcrumbItems} />
        </div>
      )}

      <div>
        {groupedParagraphs.length > 0 ? (
          groupedParagraphs.map(({ order, paragraphs }) => {
            const defaultIndex = paragraphs.findIndex((paragraph) => paragraph.isDefault);
            const selectedIndex = selectedAlternatives[order] ?? (defaultIndex >= 0 ? defaultIndex : 0);
            const selectedParagraph = paragraphs[selectedIndex] ?? paragraphs[0];
            const hasAlternatives = paragraphs.length > 1;

            if (!hasAlternatives) {
              return (
                <div key={order} className={`${styles.markdown} ${styles.plainParagraph}`}>
                  <MarkdownContent content={selectedParagraph.content} />
                </div>
              );
            }

            if (uiMode === 'arrows') {
              return (
                <div key={order} className={styles.arrowsWrapper}>
                  <Button
                    type="text"
                    size="small"
                    icon={<LeftOutlined />}
                    className={`${styles.arrowButton} ${styles.arrowLeft}`}
                    aria-label={locale.articlePage.previousAlternative}
                    onClick={() => moveAlternative(order, selectedIndex, -1, paragraphs.length)}
                  />

                  <div className={`${styles.paragraphContainer} ${styles.carouselParagraphContainer}`}>
                    <div className={styles.markdown}>
                      <MarkdownContent content={selectedParagraph.content} />
                    </div>
                  </div>

                  <Button
                    type="text"
                    size="small"
                    icon={<RightOutlined />}
                    className={`${styles.arrowButton} ${styles.arrowRight}`}
                    aria-label={locale.articlePage.nextAlternative}
                    onClick={() => moveAlternative(order, selectedIndex, 1, paragraphs.length)}
                  />
                </div>
              );
            }

            return (
              <div key={order} className={styles.paragraphContainer}>
                <div className={styles.markdown}>
                  <MarkdownContent content={selectedParagraph.content} />
                </div>

                <div className={styles.controls}>
                  <Space>
                    {paragraphs.map((_, index) => (
                      <Button
                        key={`${order}-num-${index}`}
                        shape="circle"
                        size="small"
                        type={index === selectedIndex ? 'primary' : 'default'}
                        onClick={() => selectAlternative(order, index, paragraphs.length)}
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </Space>
                </div>
              </div>
            );
          })
        ) : (
          <Empty description={locale.articlePage.noContent} />
        )}
      </div>
    </div>
  );
};

export default ArticlePage;
