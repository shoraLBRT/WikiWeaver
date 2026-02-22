import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Input, InputNumber, Modal, Radio, Space, Typography, message } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createArticleContent } from '../services/Article/articleService';
import { styleMarkdownWithAi } from '../services/adminService';
import type { ArticleContentCreateDto, ParagraphDto } from '../shared/types/ApiTypes';
import SimpleMarkdownEditor from '../components/SimpleMarkdownEditor';
import { locale } from '../localization';

const { Title, Text } = Typography;

type AlternativeDraft = {
  localId: string;
  content: string;
  isDefault: boolean;
};

type ParagraphGroupDraft = {
  order: number;
  alternatives: AlternativeDraft[];
};

const createEmptyGroup = (order: number): ParagraphGroupDraft => ({
  order,
  alternatives: [{ localId: crypto.randomUUID(), content: '', isDefault: true }],
});

const AddArticlePage: React.FC = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [title, setTitle] = useState('');
  const [nodeId, setNodeId] = useState<number | null>(null);
  const [groups, setGroups] = useState<ParagraphGroupDraft[]>([createEmptyGroup(1)]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');

  const t = locale.addArticlePage;

  const mutation = useMutation({
    mutationFn: (payload: ArticleContentCreateDto) => createArticleContent(payload),
    onSuccess: (created) => {
      messageApi.success(t.saved);
      navigate(`/article/${created.id}`);
    },
    onError: (error) => messageApi.error(`${t.saveError}: ${(error as Error).message}`),
  });

  const styleMutation = useMutation({
    mutationFn: (text: string) => styleMarkdownWithAi({ text }),
  });

  const totalAlternatives = useMemo(
    () => groups.reduce((sum, group) => sum + group.alternatives.length, 0),
    [groups],
  );

  const setAlternativeContent = (groupOrder: number, localId: string, content: string) => {
    setGroups((current) =>
      current.map((group) =>
        group.order !== groupOrder
          ? group
          : {
              ...group,
              alternatives: group.alternatives.map((alternative) =>
                alternative.localId === localId ? { ...alternative, content } : alternative,
              ),
            },
      ),
    );
  };

  const setDefaultAlternative = (groupOrder: number, localId: string) => {
    setGroups((current) =>
      current.map((group) =>
        group.order !== groupOrder
          ? group
          : {
              ...group,
              alternatives: group.alternatives.map((alternative) => ({
                ...alternative,
                isDefault: alternative.localId === localId,
              })),
            },
      ),
    );
  };

  const addParagraphGroup = () => {
    setGroups((current) => [...current, createEmptyGroup(current.length + 1)]);
  };

  const addAlternative = (groupOrder: number) => {
    setGroups((current) =>
      current.map((group) =>
        group.order !== groupOrder
          ? group
          : {
              ...group,
              alternatives: [...group.alternatives, { localId: crypto.randomUUID(), content: '', isDefault: false }],
            },
      ),
    );
  };

  const removeAlternative = (groupOrder: number, localId: string) => {
    setGroups((current) =>
      current.map((group) => {
        if (group.order !== groupOrder || group.alternatives.length <= 1) return group;

        const alternatives = group.alternatives.filter((alternative) => alternative.localId !== localId);
        if (!alternatives.some((alternative) => alternative.isDefault)) {
          alternatives[0].isDefault = true;
        }

        return { ...group, alternatives };
      }),
    );
  };

  const improveSingleAlternativeWithAi = async (groupOrder: number, localId: string) => {
    const group = groups.find((item) => item.order === groupOrder);
    const alternative = group?.alternatives.find((item) => item.localId === localId);

    if (!alternative || !alternative.content.trim()) {
      messageApi.warning(t.warnings.fillBeforeAi);
      return;
    }

    try {
      const result = await styleMutation.mutateAsync(alternative.content);
      setAlternativeContent(groupOrder, localId, result.styledText);
      messageApi.success(`${t.aiStyledParagraph}: ${groupOrder}`);
    } catch (error) {
      messageApi.error(`${t.aiStyleFailed}: ${(error as Error).message}`);
    }
  };

  const improveAllWithAi = async () => {
    const queue = groups
      .flatMap((group) =>
        group.alternatives
          .filter((alternative) => alternative.content.trim())
          .map((alternative) => ({ groupOrder: group.order, localId: alternative.localId, content: alternative.content })),
      );

    if (queue.length === 0) {
      messageApi.warning(t.warnings.noParagraphsForAi);
      return;
    }

    try {
      for (const item of queue) {
        const result = await styleMutation.mutateAsync(item.content);
        setAlternativeContent(item.groupOrder, item.localId, result.styledText);
      }
      messageApi.success(`${t.styledVersions}: ${queue.length}`);
    } catch (error) {
      messageApi.error(`${t.aiStyleFailed}: ${(error as Error).message}`);
    }
  };

  const saveArticle = () => {
    if (!title.trim()) {
      messageApi.warning(t.warnings.titleRequired);
      return;
    }

    const paragraphs: ParagraphDto[] = groups.flatMap((group) =>
      group.alternatives
        .filter((alternative) => alternative.content.trim())
        .map((alternative) => ({
          id: 0,
          content: alternative.content.trim(),
          order: group.order,
          isDefault: alternative.isDefault,
        })),
    );

    if (paragraphs.length === 0) {
      messageApi.warning(t.warnings.paragraphRequired);
      return;
    }

    const emptyDefaults = groups.some(
      (group) => !group.alternatives.some((alternative) => alternative.isDefault && alternative.content.trim()),
    );

    if (emptyDefaults) {
      messageApi.warning(t.warnings.defaultRequired);
      return;
    }

    mutation.mutate({
      title: title.trim(),
      nodeId: nodeId ?? undefined,
      paragraphs,
    });
  };

  const importMarkdownAsParagraphs = () => {
    const parts = importText
      .split(/\n\s*\n/g)
      .map((value) => value.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      messageApi.warning(t.warnings.importEmpty);
      return;
    }

    setGroups(parts.map((content, index) => ({
      order: index + 1,
      alternatives: [{ localId: crypto.randomUUID(), content, isDefault: true }],
    })));
    setIsImportOpen(false);
    setImportText('');
    messageApi.success(`${t.importedParagraphs}: ${parts.length}`);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {contextHolder}
      <Title level={2}>{t.title}</Title>
      <Alert type="info" showIcon message={t.modelTitle} description={t.modelDescription} />

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.articleTitlePlaceholder} />
          <InputNumber
            value={nodeId ?? undefined}
            onChange={(value) => setNodeId(value ?? null)}
            placeholder={t.nodeIdPlaceholder}
            style={{ width: 240 }}
            min={1}
          />
          <Space>
            <Button onClick={() => setIsImportOpen(true)}>{t.importDraft}</Button>
            <Button loading={styleMutation.isPending} onClick={improveAllWithAi}>{t.improveAllAi}</Button>
          </Space>
          <Text type="secondary">{t.paragraphStats}: {groups.length} · {t.versionsStats}: {totalAlternatives}</Text>
        </Space>
      </Card>

      {groups.map((group) => (
        <Card
          key={group.order}
          title={`${t.paragraphTitle} #${group.order}`}
          extra={<Button onClick={() => addAlternative(group.order)}>{t.addAlternative}</Button>}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Radio.Group
              value={group.alternatives.find((alternative) => alternative.isDefault)?.localId}
              onChange={(event) => setDefaultAlternative(group.order, event.target.value)}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {group.alternatives.map((alternative, index) => (
                  <Card
                    key={alternative.localId}
                    size="small"
                    title={
                      <Space>
                        <Radio value={alternative.localId}>{t.version} {index + 1}</Radio>
                        {alternative.isDefault && <Text type="success">{t.defaultLabel}</Text>}
                      </Space>
                    }
                    extra={
                      <Space>
                        <Button size="small" loading={styleMutation.isPending} onClick={() => improveSingleAlternativeWithAi(group.order, alternative.localId)}>
                          {t.aiStyle}
                        </Button>
                        <Button size="small" danger onClick={() => removeAlternative(group.order, alternative.localId)}>
                          {t.remove}
                        </Button>
                      </Space>
                    }
                  >
                    <SimpleMarkdownEditor
                      value={alternative.content}
                      onChange={(content) => setAlternativeContent(group.order, alternative.localId, content)}
                      placeholder={t.editorPlaceholder}
                    />
                  </Card>
                ))}
              </Space>
            </Radio.Group>
          </Space>
        </Card>
      ))}

      <Space>
        <Button onClick={addParagraphGroup}>{t.addParagraph}</Button>
        <Button type="primary" loading={mutation.isPending} onClick={saveArticle}>{t.saveArticle}</Button>
      </Space>

      <Modal
        title={t.importModalTitle}
        open={isImportOpen}
        onCancel={() => setIsImportOpen(false)}
        onOk={importMarkdownAsParagraphs}
        okText={t.importButton}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>{t.importHint}</Text>
          <Input.TextArea
            rows={10}
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder={t.importPlaceholder}
          />
        </Space>
      </Modal>
    </Space>
  );
};

export default AddArticlePage;
