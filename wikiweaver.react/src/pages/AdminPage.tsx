import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Segmented,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cleanupDemoData,
  deleteArticle,
  deleteNode,
  deleteParagraph,
  getAiProviderSettings,
  getArticles,
  getNodes,
  getParagraphs,
  updateAiProviderSettings,
} from '../services/adminService';
import type { AdminNodeDto, ArticleReadDto, ParagraphReadDto, UpdateAiProviderSettingsDto } from '../shared/types/ApiTypes';
import {
  ARTICLE_UI_MODE_STORAGE_KEY,
  DEFAULT_ARTICLE_UI_MODE,
  isParagraphUiMode,
  type ParagraphUiMode,
} from '../constants/ArticleUiConstants';

const { Title, Text } = Typography;

const CONFIRMATION_PHRASE = 'DELETE DEMO DATA';

const getInitialUiMode = (): ParagraphUiMode => {
  const savedMode = localStorage.getItem(ARTICLE_UI_MODE_STORAGE_KEY);
  return isParagraphUiMode(savedMode) ? savedMode : DEFAULT_ARTICLE_UI_MODE;
};

const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [cleanupConfirmation, setCleanupConfirmation] = useState('');
  const [paragraphUiMode, setParagraphUiMode] = useState<ParagraphUiMode>(getInitialUiMode);
  const [aiForm] = Form.useForm<UpdateAiProviderSettingsDto & { clearApiKey: boolean }>();

  const nodesQuery = useQuery({ queryKey: ['admin', 'nodes'], queryFn: getNodes });
  const articlesQuery = useQuery({ queryKey: ['admin', 'articles'], queryFn: getArticles });
  const paragraphsQuery = useQuery({ queryKey: ['admin', 'paragraphs'], queryFn: getParagraphs });
  const aiSettingsQuery = useQuery({
    queryKey: ['admin', 'ai-settings'],
    queryFn: getAiProviderSettings,
  });

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'nodes'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'paragraphs'] }),
      queryClient.invalidateQueries({ queryKey: ['navigationTree'] }),
    ]);
  };

  const nodeDeleteMutation = useMutation({
    mutationFn: deleteNode,
    onSuccess: async () => {
      messageApi.success('Node deleted');
      await refreshAll();
    },
    onError: (error) => messageApi.error(`Failed to delete node: ${(error as Error).message}`),
  });

  const articleDeleteMutation = useMutation({
    mutationFn: deleteArticle,
    onSuccess: async () => {
      messageApi.success('Article deleted');
      await refreshAll();
    },
    onError: (error) => messageApi.error(`Failed to delete article: ${(error as Error).message}`),
  });

  const paragraphDeleteMutation = useMutation({
    mutationFn: deleteParagraph,
    onSuccess: async () => {
      messageApi.success('Paragraph deleted');
      await refreshAll();
    },
    onError: (error) => messageApi.error(`Failed to delete paragraph: ${(error as Error).message}`),
  });

  const cleanupMutation = useMutation({
    mutationFn: cleanupDemoData,
    onSuccess: async (result) => {
      messageApi.success(
        `Cleanup completed. Deleted ${result.deletedNodes} nodes, ${result.deletedArticles} articles and ${result.deletedParagraphs} paragraphs.`,
      );
      setCleanupConfirmation('');
      setIsCleanupModalOpen(false);
      await refreshAll();
    },
    onError: (error) => messageApi.error(`Failed to cleanup demo data: ${(error as Error).message}`),
  });

  const aiSettingsMutation = useMutation({
    mutationFn: updateAiProviderSettings,
    onSuccess: async () => {
      messageApi.success('AI settings updated');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'ai-settings'] });
    },
    onError: (error) => messageApi.error(`Failed to update AI settings: ${(error as Error).message}`),
  });

  const filteredNodes = useMemo(
    () =>
      (nodesQuery.data ?? []).filter((node) =>
        [node.id.toString(), node.title, node.parentId?.toString() ?? '']
          .join(' ')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      ),
    [nodesQuery.data, searchTerm],
  );

  const filteredArticles = useMemo(
    () =>
      (articlesQuery.data ?? []).filter((article) =>
        [article.id.toString(), article.title, article.nodeId?.toString() ?? '']
          .join(' ')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      ),
    [articlesQuery.data, searchTerm],
  );

  const filteredParagraphs = useMemo(
    () =>
      (paragraphsQuery.data ?? []).filter((paragraph) =>
        [paragraph.id.toString(), paragraph.articleId.toString(), paragraph.content]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      ),
    [paragraphsQuery.data, searchTerm],
  );

  const nodeColumns: ColumnsType<AdminNodeDto> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'Parent ID',
      dataIndex: 'parentId',
      key: 'parentId',
      width: 120,
      render: (parentId: number | null) => parentId ?? <Tag>root</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <Popconfirm
          title="Delete node"
          description={`Delete node "${record.title}"?`}
          okText="Delete"
          okButtonProps={{ danger: true }}
          onConfirm={() => nodeDeleteMutation.mutate(record.id)}
        >
          <Button danger size="small">Delete</Button>
        </Popconfirm>
      ),
    },
  ];

  const articleColumns: ColumnsType<ArticleReadDto> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Node ID', dataIndex: 'nodeId', key: 'nodeId', width: 120 },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <Popconfirm
          title="Delete article"
          description={`Delete article "${record.title}"?`}
          okText="Delete"
          okButtonProps={{ danger: true }}
          onConfirm={() => articleDeleteMutation.mutate(record.id)}
        >
          <Button danger size="small">Delete</Button>
        </Popconfirm>
      ),
    },
  ];

  const onParagraphUiModeChange = (value: ParagraphUiMode) => {
    setParagraphUiMode(value);
    localStorage.setItem(ARTICLE_UI_MODE_STORAGE_KEY, value);
    messageApi.success('Article paragraph UI mode updated.');
  };

  const paragraphColumns: ColumnsType<ParagraphReadDto> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
    { title: 'Article ID', dataIndex: 'articleId', key: 'articleId', width: 120 },
    { title: 'Order', dataIndex: 'order', key: 'order', width: 90 },
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      render: (content: string) => <Text ellipsis={{ tooltip: content }}>{content}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <Popconfirm
          title="Delete paragraph"
          description={`Delete paragraph #${record.id}?`}
          okText="Delete"
          okButtonProps={{ danger: true }}
          onConfirm={() => paragraphDeleteMutation.mutate(record.id)}
        >
          <Button danger size="small">Delete</Button>
        </Popconfirm>
      ),
    },
  ];

  const aiSettings = aiSettingsQuery.data;

  const saveAiSettings = async () => {
    const values = await aiForm.validateFields();
    aiSettingsMutation.mutate(values);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {contextHolder}
      <Title level={2}>Admin panel (MVP)</Title>
      <Alert
        type="warning"
        showIcon
        message="Temporary open access"
        description="This admin panel is currently public for MVP. Access restrictions (authentication/roles) must be added in the next iteration."
      />

      <Input.Search
        allowClear
        placeholder="Search by id/title/content"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />

      <Tabs
        defaultActiveKey="nodes"
        items={[
          {
            key: 'nodes',
            label: `Nodes (${filteredNodes.length})`,
            children: (
              <Table
                loading={nodesQuery.isLoading}
                columns={nodeColumns}
                dataSource={filteredNodes}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            ),
          },
          {
            key: 'articles',
            label: `Articles (${filteredArticles.length})`,
            children: (
              <Table
                loading={articlesQuery.isLoading}
                columns={articleColumns}
                dataSource={filteredArticles}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            ),
          },
          {
            key: 'paragraphs',
            label: `Paragraphs (${filteredParagraphs.length})`,
            children: (
              <Table
                loading={paragraphsQuery.isLoading}
                columns={paragraphColumns}
                dataSource={filteredParagraphs}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            ),
          },
          {
            key: 'ai',
            label: 'AI',
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Alert
                  type="info"
                  showIcon
                  message="OpenAI-compatible provider"
                  description="Используется endpoint /v1/chat/completions и системный промпт для стилизации Markdown без изменения порядка слов."
                />
                <Form
                  form={aiForm}
                  layout="vertical"
                  initialValues={{
                    baseUrl: aiSettings?.baseUrl,
                    model: aiSettings?.model,
                    isEnabled: aiSettings?.isEnabled,
                    clearApiKey: false,
                  }}
                  key={`${aiSettings?.baseUrl}-${aiSettings?.model}-${aiSettings?.isEnabled}-${aiSettings?.hasApiKey}`}
                >
                  <Form.Item label="Base URL" name="baseUrl" rules={[{ required: true, message: 'Base URL is required' }]}>
                    <Input placeholder="https://api.openai.com/v1" />
                  </Form.Item>
                  <Form.Item label="Model" name="model" rules={[{ required: true, message: 'Model is required' }]}>
                    <Input placeholder="gpt-4o-mini" />
                  </Form.Item>
                  <Form.Item label="API key (leave empty to keep existing)" name="apiKey">
                    <Input.Password placeholder={aiSettings?.hasApiKey ? 'Configured' : 'sk-...'} />
                  </Form.Item>
                  <Form.Item name="clearApiKey" valuePropName="checked">
                    <Switch checkedChildren="Clear API key" unCheckedChildren="Keep API key" />
                  </Form.Item>
                  <Form.Item name="isEnabled" valuePropName="checked">
                    <Switch checkedChildren="AI enabled" unCheckedChildren="AI disabled" />
                  </Form.Item>
                  <Button type="primary" loading={aiSettingsMutation.isPending} onClick={saveAiSettings}>
                    Save AI settings
                  </Button>
                </Form>
              </Space>
            ),
          },
          {
            key: 'tools',
            label: 'Tools',
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Alert
                  type="info"
                  showIcon
                  message="Article paragraphs UI mode"
                  description="This setting is global and applies to all article pages."
                />
                <Segmented
                  value={paragraphUiMode}
                  onChange={(value) => onParagraphUiModeChange(value as ParagraphUiMode)}
                  options={[
                    { label: 'Стрелки (карусель)', value: 'arrows' },
                    { label: 'Рамка + номера', value: 'numbers' },
                  ]}
                />

                <Alert
                  type="error"
                  showIcon
                  message="Danger zone"
                  description="Use this only to reset demo data. This action deletes all nodes, articles and paragraphs."
                />
                <Button danger type="primary" onClick={() => setIsCleanupModalOpen(true)}>
                  Delete all nodes and articles
                </Button>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title="Delete all demo data"
        open={isCleanupModalOpen}
        onCancel={() => setIsCleanupModalOpen(false)}
        onOk={() => cleanupMutation.mutate()}
        okButtonProps={{
          danger: true,
          disabled: cleanupConfirmation !== CONFIRMATION_PHRASE,
          loading: cleanupMutation.isPending,
        }}
        okText="Delete everything"
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text>
            Type <Text code>{CONFIRMATION_PHRASE}</Text> to confirm that you want to permanently delete all nodes, articles and paragraphs.
          </Text>
          <Input
            value={cleanupConfirmation}
            onChange={(event) => setCleanupConfirmation(event.target.value)}
            placeholder={CONFIRMATION_PHRASE}
          />
        </Space>
      </Modal>
    </Space>
  );
};

export default AdminPage;
