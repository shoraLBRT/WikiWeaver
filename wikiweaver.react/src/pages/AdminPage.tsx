import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Space,
  Switch,
  Table,
  Tabs,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  checkAiConnection,
  cleanupDemoData,
  deleteArticle,
  deleteParagraph,
  getAiProviderSettings,
  getArticles,
  getParagraphs,
  updateAiProviderSettings,
} from '../services/adminService';
import { generateInviteToken } from '../services/authService';
import type { ArticleReadDto, ParagraphReadDto, UpdateAiProviderSettingsDto } from '../shared/types/ApiTypes';
import {
  ARTICLE_UI_MODE_STORAGE_KEY,
  DEFAULT_ARTICLE_UI_MODE,
  isParagraphUiMode,
  type ParagraphUiMode,
} from '../constants/ArticleUiConstants';
import { APP_CONSTANTS } from '../constants/AppConstants';
import { formatMessage, locale } from '../localization';

const { Title, Text } = Typography;

type AiSettingsFormValues = UpdateAiProviderSettingsDto & {
  clearApiKey: boolean;
};

const getInitialUiMode = (): ParagraphUiMode => {
  const savedMode = localStorage.getItem(ARTICLE_UI_MODE_STORAGE_KEY);
  return isParagraphUiMode(savedMode) ? savedMode : DEFAULT_ARTICLE_UI_MODE;
};

const AdminPage: React.FC = () => {
  const t = locale.adminPage;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [cleanupConfirmation, setCleanupConfirmation] = useState('');
  const [paragraphUiMode, setParagraphUiMode] = useState<ParagraphUiMode>(getInitialUiMode);
  const [aiForm] = Form.useForm<AiSettingsFormValues>();
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const confirmationPhrase = t.cleanupConfirmationPhrase;
  const articlesQuery = useQuery({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_ARTICLES], queryFn: getArticles });
  const paragraphsQuery = useQuery({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_PARAGRAPHS], queryFn: getParagraphs });
  const aiSettingsQuery = useQuery({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_AI_SETTINGS], queryFn: getAiProviderSettings });
  const isAiEnabled = Form.useWatch('isEnabled', aiForm) ?? false;

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_ARTICLES] }),
      queryClient.invalidateQueries({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_PARAGRAPHS] }),
      queryClient.invalidateQueries({ queryKey: [APP_CONSTANTS.QUERY_KEYS.NAVIGATION_TREE] }),
    ]);
  };

  const articleDeleteMutation = useMutation({
    mutationFn: deleteArticle,
    onSuccess: async () => {
      messageApi.success(t.articleDeleted);
      await refreshAll();
    },
    onError: (error) => messageApi.error(`${t.articleDeleteFailed}: ${(error as Error).message}`),
  });

  const paragraphDeleteMutation = useMutation({
    mutationFn: deleteParagraph,
    onSuccess: async () => {
      messageApi.success(t.paragraphDeleted);
      await refreshAll();
    },
    onError: (error) => messageApi.error(`${t.paragraphDeleteFailed}: ${(error as Error).message}`),
  });

  const cleanupMutation = useMutation({
    mutationFn: cleanupDemoData,
    onSuccess: async (result) => {
      messageApi.success(
        formatMessage(t.cleanupDone, {
          articles: result.deletedArticles,
          paragraphs: result.deletedParagraphs,
        }),
      );
      setCleanupConfirmation('');
      setIsCleanupModalOpen(false);
      await refreshAll();
    },
    onError: (error) => messageApi.error(`${t.cleanupFailed}: ${(error as Error).message}`),
  });

  const aiSettingsMutation = useMutation({
    mutationFn: updateAiProviderSettings,
    onSuccess: async () => {
      messageApi.success(t.aiSettingsUpdated);
      await queryClient.invalidateQueries({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_AI_SETTINGS] });
    },
    onError: (error) => messageApi.error(`${t.aiSettingsUpdateFailed}: ${(error as Error).message}`),
  });

  const inviteTokenMutation = useMutation({
    mutationFn: generateInviteToken,
    onSuccess: (result) => {
      setInviteToken(result.token);
      messageApi.success(t.inviteTokenGenerated);
    },
    onError: (error) => messageApi.error(`${t.inviteTokenGenerateFailed}: ${(error as Error).message}`),
  });

  const aiConnectionCheckMutation = useMutation({
    mutationFn: checkAiConnection,
    onSuccess: (result) => {
      messageApi.success(result.message);
      Modal.info({
        title: t.aiCheckResultTitle,
        content: (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text>{result.message}</Text>
            <Text type="secondary">{t.aiModelExample}</Text>
            <Input.TextArea value={result.styledText} autoSize={{ minRows: 4, maxRows: 8 }} readOnly />
          </Space>
        ),
      });
    },
    onError: (error) => messageApi.error(`${t.aiCheckFailed}: ${(error as Error).message}`),
  });

  const filteredArticles = useMemo(
    () =>
      (articlesQuery.data ?? []).filter((article) =>
        [article.id.toString(), article.title, article.parentArticleId?.toString() ?? '']
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

  const articleColumns: ColumnsType<ArticleReadDto> = [
    { title: locale.common.id, dataIndex: 'id', key: 'id', width: 90 },
    { title: locale.common.title, dataIndex: 'title', key: 'title' },
    { title: t.parentId, dataIndex: 'parentArticleId', key: 'parentArticleId', width: 140 },
    {
      title: locale.common.actions,
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <Popconfirm
          title={t.deleteArticle}
          description={`${t.deleteArticle}: "${record.title}"?`}
          okText={locale.common.delete}
          okButtonProps={{ danger: true }}
          onConfirm={() => articleDeleteMutation.mutate(record.id)}
        >
          <Button danger size="small">{locale.common.delete}</Button>
        </Popconfirm>
      ),
    },
  ];

  const paragraphColumns: ColumnsType<ParagraphReadDto> = [
    { title: locale.common.id, dataIndex: 'id', key: 'id', width: 90 },
    { title: t.articleId, dataIndex: 'articleId', key: 'articleId', width: 120 },
    { title: t.order, dataIndex: 'order', key: 'order', width: 90 },
    {
      title: t.content,
      dataIndex: 'content',
      key: 'content',
      render: (content: string) => <Text ellipsis={{ tooltip: content }}>{content}</Text>,
    },
    {
      title: locale.common.actions,
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <Popconfirm
          title={t.deleteParagraph}
          description={`${t.deleteParagraph} #${record.id}?`}
          okText={locale.common.delete}
          okButtonProps={{ danger: true }}
          onConfirm={() => paragraphDeleteMutation.mutate(record.id)}
        >
          <Button danger size="small">{locale.common.delete}</Button>
        </Popconfirm>
      ),
    },
  ];

  const onParagraphUiModeChange = (value: ParagraphUiMode) => {
    setParagraphUiMode(value);
    localStorage.setItem(ARTICLE_UI_MODE_STORAGE_KEY, value);
    messageApi.success(locale.articlePage.uiModeUpdated);
  };

  const saveAiSettings = async () => {
    const values = await aiForm.validateFields();
    aiSettingsMutation.mutate({ ...values, clearApiKey: values.clearApiKey ?? false });
  };

  const aiSettings = aiSettingsQuery.data;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {contextHolder}
      <Title level={2} style={{ marginTop: 0 }}>{t.title}</Title>
      <Input.Search allowClear placeholder={t.searchPlaceholder} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />

      <Tabs
        defaultActiveKey="content"
        items={[
          {
            key: 'content',
            label: t.contentTab,
            children: (
              <Tabs
                defaultActiveKey="articles"
                items={[
                  {
                    key: 'articles',
                    label: `${t.articlesTab} (${filteredArticles.length})`,
                    children: <Table loading={articlesQuery.isLoading} columns={articleColumns} dataSource={filteredArticles} rowKey="id" />,
                  },
                  {
                    key: 'paragraphs',
                    label: `${t.paragraphsTab} (${filteredParagraphs.length})`,
                    children: <Table loading={paragraphsQuery.isLoading} columns={paragraphColumns} dataSource={filteredParagraphs} rowKey="id" />,
                  },
                  {
                    key: 'create-article',
                    label: t.createArticleTab,
                    children: <Button type="primary" onClick={() => navigate('/article/new')}>{t.createArticleAction}</Button>,
                  },
                  {
                    key: 'cleanup',
                    label: t.cleanupTab,
                    children: <Button danger type="primary" onClick={() => setIsCleanupModalOpen(true)}>{t.deleteAll}</Button>,
                  },
                ]}
              />
            ),
          },
          {
            key: 'settings',
            label: locale.common.settings,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form
                  form={aiForm}
                  layout="vertical"
                  initialValues={{
                    baseUrl: aiSettings?.baseUrl,
                    model: aiSettings?.model,
                    isEnabled: aiSettings?.isEnabled,
                    clearApiKey: false,
                  }}
                >
                  <Form.Item name="isEnabled" valuePropName="checked" extra={t.aiDisabledHint}><Switch /></Form.Item>
                  <Form.Item label={t.baseUrl} name="baseUrl" rules={[{ required: true, message: t.baseUrlRequired }]}><Input disabled={!isAiEnabled} /></Form.Item>
                  <Form.Item label={t.model} name="model" rules={[{ required: true, message: t.modelRequired }]}><Input disabled={!isAiEnabled} /></Form.Item>
                  <Form.Item label={t.apiKey} name="apiKey"><Input.Password disabled={!isAiEnabled} /></Form.Item>
                  <Space>
                    <Button type="primary" onClick={saveAiSettings} loading={aiSettingsMutation.isPending}>{t.saveAiSettings}</Button>
                    <Button onClick={() => aiConnectionCheckMutation.mutate()} loading={aiConnectionCheckMutation.isPending}>{t.checkAiConnection}</Button>
                  </Space>
                </Form>

                <Alert message={t.inviteTokenTitle} type="info" showIcon />
                <Space>
                  <Button onClick={() => inviteTokenMutation.mutate()} loading={inviteTokenMutation.isPending}>{t.generateInviteToken}</Button>
                  {inviteToken ? <Text copyable>{inviteToken}</Text> : null}
                </Space>

                <Space>
                  <Text>{locale.articlePage.uiModeUpdated}</Text>
                  <Segmented value={paragraphUiMode} onChange={onParagraphUiModeChange} options={[{ label: t.uiModeArrows, value: 'arrows' }, { label: t.uiModeNumbers, value: 'numbers' }]} />
                </Space>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={t.cleanupModalTitle}
        open={isCleanupModalOpen}
        onCancel={() => setIsCleanupModalOpen(false)}
        onOk={() => cleanupMutation.mutate()}
        okButtonProps={{
          danger: true,
          loading: cleanupMutation.isPending,
          disabled: cleanupConfirmation !== confirmationPhrase,
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>{formatMessage(t.cleanupModalHint, { phrase: confirmationPhrase })}</Text>
          <Input value={cleanupConfirmation} onChange={(event) => setCleanupConfirmation(event.target.value)} />
        </Space>
      </Modal>
    </Space>
  );
};

export default AdminPage;
