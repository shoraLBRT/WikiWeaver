import React, { useState } from 'react';
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Segmented,
  Space,
  Switch,
  Tabs,
  Typography,
  message,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  checkAiConnection,
  cleanupDemoData,
  getAiProviderSettings,
  updateAiProviderSettings,
} from '../services/adminService';
import { generateInviteToken } from '../services/authService';
import type { UpdateAiProviderSettingsDto } from '../shared/types/ApiTypes';
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
  const confirmationPhrase = t.cleanupConfirmationPhrase;
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [cleanupConfirmation, setCleanupConfirmation] = useState('');
  const [paragraphUiMode, setParagraphUiMode] = useState<ParagraphUiMode>(getInitialUiMode);
  const [aiForm] = Form.useForm<AiSettingsFormValues>();
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const aiSettingsQuery = useQuery({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_AI_SETTINGS], queryFn: getAiProviderSettings });

  const isAiEnabled = Form.useWatch('isEnabled', aiForm) ?? false;

  const cleanupMutation = useMutation({
    mutationFn: cleanupDemoData,
    onSuccess: async (result) => {
      messageApi.success(
        formatMessage(t.cleanupDone, {
          nodes: result.deletedNodes,
          articles: result.deletedArticles,
          paragraphs: result.deletedParagraphs,
        }),
      );
      setCleanupConfirmation('');
      setIsCleanupModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: [APP_CONSTANTS.QUERY_KEYS.NAVIGATION_TREE] });
      await queryClient.invalidateQueries({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_NODES] });
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

  const onParagraphUiModeChange = (value: ParagraphUiMode) => {
    setParagraphUiMode(value);
    localStorage.setItem(ARTICLE_UI_MODE_STORAGE_KEY, value);
    messageApi.success(locale.articlePage.uiModeUpdated);
  };

  const saveAiSettings = async () => {
    const values = await aiForm.validateFields();
    aiSettingsMutation.mutate({ ...values, clearApiKey: values.clearApiKey ?? false });
  };

  const deleteStoredApiKey = async () => {
    const values = await aiForm.validateFields(['baseUrl', 'model', 'isEnabled']);
    aiForm.setFieldValue('apiKey', '');
    aiForm.setFieldValue('clearApiKey', true);

    aiSettingsMutation.mutate(
      {
        baseUrl: values.baseUrl,
        model: values.model,
        isEnabled: values.isEnabled,
        clearApiKey: true,
      },
      {
        onSuccess: async () => {
          messageApi.success(t.apiKeyDeleted);
          await queryClient.invalidateQueries({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_AI_SETTINGS] });
        },
      },
    );
  };

  const aiSettings = aiSettingsQuery.data;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {contextHolder}
      <Title level={2} style={{ marginTop: 0 }}>{t.title}</Title>

      <Tabs
        defaultActiveKey="content"
        items={[
          {
            key: 'content',
            label: t.contentTab,
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Alert type="info" showIcon message={t.createArticleTitle} description={t.createArticleDescription} />
                <Space>
                  <Button type="primary" onClick={() => navigate('/article/new')}>
                    {t.createArticleAction}
                  </Button>
                  <Button danger type="primary" onClick={() => setIsCleanupModalOpen(true)}>
                    {t.deleteAll}
                  </Button>
                </Space>
              </Space>
            ),
          },
          {
            key: 'settings',
            label: locale.common.settings,
            children: (
              <Tabs
                defaultActiveKey="ai"
                items={[
                  {
                    key: 'ai',
                    label: t.aiTab,
                    children: (
                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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
                          <Form.Item name="isEnabled" valuePropName="checked" extra={t.aiDisabledHint}>
                            <Switch />
                          </Form.Item>

                          <Form.Item label={t.baseUrl} name="baseUrl" rules={[{ required: true, message: t.baseUrlRequired }]}>
                            <Input placeholder={t.baseUrlPlaceholder} disabled={!isAiEnabled} />
                          </Form.Item>
                          <Form.Item label={t.model} name="model" rules={[{ required: true, message: t.modelRequired }]}>
                            <Input placeholder={t.modelPlaceholder} disabled={!isAiEnabled} />
                          </Form.Item>
                          <Form.Item label={t.apiKey} name="apiKey" extra={t.apiKeyHint}>
                            <Input.Password placeholder={aiSettings?.hasApiKey ? t.apiConfigured : t.apiKeyPlaceholder} disabled={!isAiEnabled} />
                          </Form.Item>

                          <Space wrap>
                            <Button type="primary" loading={aiSettingsMutation.isPending} onClick={saveAiSettings}>
                              {t.saveAiSettings}
                            </Button>
                            <Button danger onClick={deleteStoredApiKey} loading={aiSettingsMutation.isPending}>
                              {t.deleteApiKey}
                            </Button>
                            <Button
                              loading={aiConnectionCheckMutation.isPending}
                              onClick={() => aiConnectionCheckMutation.mutate()}
                              disabled={!isAiEnabled}
                            >
                              {t.checkAiConnection}
                            </Button>
                          </Space>
                        </Form>
                      </Space>
                    ),
                  },
                  {
                    key: 'ui',
                    label: t.uiTab,
                    children: (
                      <Segmented
                        value={paragraphUiMode}
                        onChange={(value) => onParagraphUiModeChange(value as ParagraphUiMode)}
                        options={[
                          { label: t.uiModeArrows, value: 'arrows' },
                          { label: t.uiModeNumbers, value: 'numbers' },
                        ]}
                      />
                    ),
                  },
                  {
                    key: 'users',
                    label: t.usersTab,
                    children: (
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>{t.inviteTokenTitle}</Text>
                        <Space>
                          <Button onClick={() => inviteTokenMutation.mutate()} loading={inviteTokenMutation.isPending}>
                            {t.generateInviteToken}
                          </Button>
                          {inviteToken && <Text code>{inviteToken}</Text>}
                        </Space>
                      </Space>
                    ),
                  },
                ]}
              />
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
          disabled: cleanupConfirmation !== confirmationPhrase,
          loading: cleanupMutation.isPending,
        }}
        okText={t.cleanupModalOk}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text>{formatMessage(t.cleanupModalHint, { phrase: confirmationPhrase })}</Text>
          <Input
            value={cleanupConfirmation}
            onChange={(event) => setCleanupConfirmation(event.target.value)}
            placeholder={confirmationPhrase}
          />
        </Space>
      </Modal>
    </Space>
  );
};

export default AdminPage;
