import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getArticleContentById } from '../services/Article/articleService';
import { Typography, Spin, Alert, Empty, Button, Space, Segmented, Tag } from 'antd';
import { LoadingOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { APP_CONSTANTS } from '../constants/AppConstants';
import {
  ARTICLE_UI_MODE_STORAGE_KEY,
  DEFAULT_ARTICLE_UI_MODE,
  isParagraphUiMode,
  type ParagraphUiMode,
} from '../constants/ArticleUiConstants';
import type { ParagraphDto } from '../shared/types/ApiTypes';

const { Title, Paragraph } = Typography;

type ParagraphUiMode = 'arrows' | 'numbers';

const paragraphContainerStyle: React.CSSProperties = {
  marginBottom: 24,
  border: '1px solid #d9d9d9',
  borderRadius: 8,
  padding: 16,
  position: 'relative',
};

const plainParagraphStyle: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '1.8',
  marginBottom: 24,
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

  const updateSelectedAlternative = (order: number, index: number, total: number) => {
    const boundedIndex = Math.max(0, Math.min(index, total - 1));
    setSelectedAlternatives((current) => ({ ...current, [order]: boundedIndex }));
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
          message={APP_CONSTANTS.ERROR_MESSAGES.LOADING_ARTICLE}
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
        <Empty description={APP_CONSTANTS.PLACEHOLDER_TEXT.ARTICLE_NOT_FOUND} />
      </div>
    );
  }

  return (
    <div style={{ height: '100%' }}>
      <div style={{ marginBottom: APP_CONSTANTS.MARGINS.CONTENT }}>
        <Title level={2}>{articleContent.title}</Title>
      </div>

      <div>
        {groupedParagraphs.length > 0 ? (
          groupedParagraphs.map(({ order, paragraphs }) => {
            const defaultIndex = paragraphs.findIndex((paragraph) => paragraph.isDefault);
            const selectedIndex = selectedAlternatives[order] ?? (defaultIndex >= 0 ? defaultIndex : 0);
            const selectedParagraph = paragraphs[selectedIndex] ?? paragraphs[0];
            const hasAlternatives = paragraphs.length > 1;

            if (!hasAlternatives) {
              return (
                <Paragraph key={order} style={plainParagraphStyle}>
                  {selectedParagraph.content}
                </Paragraph>
              );
            }

            if (uiMode === 'arrows') {
              return (
                <div key={order} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Button
                      type="text"
                      size="small"
                      icon={<LeftOutlined />}
                      aria-label="Предыдущая альтернатива"
                      onClick={() => updateSelectedAlternative(order, selectedIndex - 1, paragraphs.length)}
                    />

                    <div style={{ ...paragraphContainerStyle, marginBottom: 0, flex: 1 }}>
                      <Paragraph style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: 0 }}>
                        {selectedParagraph.content}
                      </Paragraph>
                    </div>

                    <Button
                      type="text"
                      size="small"
                      icon={<RightOutlined />}
                      aria-label="Следующая альтернатива"
                      onClick={() => updateSelectedAlternative(order, selectedIndex + 1, paragraphs.length)}
                    />
                  </div>
                </div>
              );
            }

            return (
              <div key={order} style={paragraphContainerStyle}>
                <Paragraph style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: 24 }}>
                  {selectedParagraph.content}
                </Paragraph>

                <div style={{ position: 'absolute', right: 12, bottom: 10 }}>
                  <Space>
                    {paragraphs.map((_, index) => (
                      <Button
                        key={`${order}-num-${index}`}
                        shape="circle"
                        size="small"
                        type={index === selectedIndex ? 'primary' : 'default'}
                        onClick={() => updateSelectedAlternative(order, index, paragraphs.length)}
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
          <Empty description={APP_CONSTANTS.PLACEHOLDER_TEXT.NO_CONTENT_AVAILABLE} />
        )}
      </div>
    </div>
  );
};

export default ArticlePage;
