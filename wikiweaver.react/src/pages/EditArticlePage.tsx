import React from 'react';
import { Alert, Button, Card, Space, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

const { Title, Text } = Typography;

const editPageTitle = 'Редактирование статьи';
const editPageDescription = 'Страница редактирования статьи пока не реализована.';
const backToAdminLabel = 'Вернуться в админ-панель';

const EditArticlePage: React.FC = () => {
  const navigate = useNavigate();
  const { articleId } = useParams<{ articleId: string }>();

  return (
    <Card>
      <Space direction="vertical" size="middle">
        <Title level={2}>{editPageTitle}</Title>
        <Alert type="info" showIcon message={editPageDescription} />
        <Text>ID статьи: {articleId ?? 'unknown'}</Text>
        <Button onClick={() => navigate('/admin')}>{backToAdminLabel}</Button>
      </Space>
    </Card>
  );
};

export default EditArticlePage;
