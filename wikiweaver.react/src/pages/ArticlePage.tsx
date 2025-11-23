import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getArticleContentById } from '../services/Article/articleService';
import { Typography, Spin, Alert, Empty } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const ArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const articleId = parseInt(id || '0', 10);

  // Используем useQuery для получения данных статьи
  const { data: articleContent, isLoading, error } = useQuery({
    queryKey: ['articleContent', articleId],
    queryFn: () => getArticleContentById(articleId),
    enabled: !isNaN(articleId) && articleId > 0,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error loading article"
        description={(error as Error).message}
        type="error"
        showIcon
      />
    );
  }

  if (!articleContent) {
    return (
      <Empty
        description="Article not found"
        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}
      />
    );
  }

  return (
    <div style={{ height: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>{articleContent.title}</Title>
      </div>
      <div>
        {articleContent.paragraphs.length > 0 ? (
          articleContent.paragraphs.map((paragraph, index) => (
            <Paragraph key={paragraph.id || index} style={{ fontSize: '16px', lineHeight: '1.8' }}>
              {paragraph.content}
            </Paragraph>
          ))
        ) : (
          <Empty description="No content available" />
        )}
      </div>
    </div>
  );
};

export default ArticlePage;