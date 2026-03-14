import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Input, InputNumber, Modal, Space, Typography, message } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createArticleContent } from '../services/Article/articleService';
import { styleMarkdownWithAi } from '../services/adminService';
import type { ArticleContentCreateDto } from '../shared/types/ApiTypes';
import { locale } from '../localization';
import ParagraphGroupEditor from './add-article/ParagraphGroupEditor';
import {
  addAlternativeToGroups,
  buildParagraphDtos,
  collectAiImprovementQueue,
  createEmptyGroup,
  hasGroupWithoutFilledDefault,
  importGroupsFromMarkdown,
  removeAlternativeFromGroups,
  setAlternativeContentInGroups,
  setDefaultAlternativeInGroups,
} from './add-article/draftHelpers';
import type { ParagraphGroupDraft } from './add-article/types';

const { Title, Text } = Typography;

type ActiveEditor = {
  groupOrder: number;
  localId: string;
};

const AddArticlePage: React.FC = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [title, setTitle] = useState('');
  const [parentArticleId, setParentArticleId] = useState<number | null>(null);
  const [groups, setGroups] = useState<ParagraphGroupDraft[]>([createEmptyGroup(1)]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [activeEditor, setActiveEditor] = useState<ActiveEditor | null>(null);

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
    setGroups((current) => setAlternativeContentInGroups(current, groupOrder, localId, content));
  };

  const setDefaultAlternative = (groupOrder: number, localId: string) => {
    setGroups((current) => setDefaultAlternativeInGroups(current, groupOrder, localId));
  };

  const applyMarkdownSnippet = (updater: (content: string) => string) => {
    if (!activeEditor) {
      messageApi.warning(t.warnings.selectParagraphForFormatting);
      return;
    }

    const group = groups.find((item) => item.order === activeEditor.groupOrder);
    const alternative = group?.alternatives.find((item) => item.localId === activeEditor.localId);

    if (!alternative) {
      messageApi.warning(t.warnings.selectParagraphForFormatting);
      return;
    }

    setAlternativeContent(activeEditor.groupOrder, activeEditor.localId, updater(alternative.content));
  };

  const addParagraphGroup = () => {
    setGroups((current) => [...current, createEmptyGroup(current.length + 1)]);
  };

  const addAlternative = (groupOrder: number) => {
    setGroups((current) => addAlternativeToGroups(current, groupOrder));
  };

  const removeAlternative = (groupOrder: number, localId: string) => {
    setGroups((current) => removeAlternativeFromGroups(current, groupOrder, localId));

    if (activeEditor?.groupOrder === groupOrder && activeEditor.localId === localId) {
      setActiveEditor(null);
    }
  };

  const improveAllWithAi = async () => {
    const queue = collectAiImprovementQueue(groups);

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

    const paragraphs = buildParagraphDtos(groups);

    if (paragraphs.length === 0) {
      messageApi.warning(t.warnings.paragraphRequired);
      return;
    }

    const emptyDefaults = hasGroupWithoutFilledDefault(groups);

    if (emptyDefaults) {
      messageApi.warning(t.warnings.defaultRequired);
      return;
    }

    mutation.mutate({
      title: title.trim(),
      parentArticleId: parentArticleId ?? undefined,
      paragraphs,
    });
  };

  const importMarkdownAsParagraphs = () => {
    const importedGroups = importGroupsFromMarkdown(importText);

    if (importedGroups.length === 0) {
      messageApi.warning(t.warnings.importEmpty);
      return;
    }

    setGroups(importedGroups);
    setActiveEditor(null);
    setIsImportOpen(false);
    setImportText('');
    messageApi.success(`${t.importedParagraphs}: ${importedGroups.length}`);
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
            value={parentArticleId ?? undefined}
            onChange={(value) => setParentArticleId(value ?? null)}
            placeholder={t.parentArticleIdPlaceholder}
            style={{ width: 240 }}
            min={1}
          />
          <Space wrap>
            <Button onClick={() => setIsImportOpen(true)}>{t.importDraft}</Button>
            <Button onClick={() => applyMarkdownSnippet((value) => `${value}**${locale.markdownEditor.insertText}**`)}>{locale.markdownEditor.bold}</Button>
            <Button onClick={() => applyMarkdownSnippet((value) => `${value}_${locale.markdownEditor.insertText}_`)}>{locale.markdownEditor.italic}</Button>
            <Button onClick={() => applyMarkdownSnippet((value) => `${value}\n## ${locale.markdownEditor.headingSnippet}`)}>{locale.markdownEditor.heading}</Button>
            <Button onClick={() => applyMarkdownSnippet((value) => `${value}\n- ${locale.markdownEditor.listSnippet}`)}>{locale.markdownEditor.list}</Button>
            <Button onClick={() => applyMarkdownSnippet((value) => `${value}\n> ${locale.markdownEditor.quoteSnippet}`)}>{locale.markdownEditor.quote}</Button>
            <Button loading={styleMutation.isPending} onClick={improveAllWithAi}>{t.improveAllAi}</Button>
          </Space>
          <Text type="secondary">{t.toolbarHint}</Text>
          <Text type="secondary">{t.paragraphStats}: {groups.length} · {t.versionsStats}: {totalAlternatives}</Text>
        </Space>
      </Card>

      {groups.map((group) => (
        <ParagraphGroupEditor
          key={group.order}
          group={group}
          onAddAlternative={addAlternative}
          onSetDefault={setDefaultAlternative}
          onRemoveAlternative={removeAlternative}
          onContentChange={setAlternativeContent}
          onActivateEditor={(groupOrder, localId) => setActiveEditor({ groupOrder, localId })}
        />
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
