import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Checkbox, Input, Modal, Select, Space, Spin, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createArticleContent,
  getArticleContentById,
  getArticleContentByNodeId,
  updateArticleContent,
} from '../services/Article/articleService';
import { styleMarkdownWithAi, createNode, getNodes } from '../services/adminService';
import type {
  ArticleContentCreateDto,
  ArticleContentDto,
  NavigationNodeDto,
} from '../shared/types/ApiTypes';
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
import { APP_CONSTANTS } from '../constants/AppConstants';
import { getNavigationTree } from '../services/Article/navigationService';

const { Title, Text } = Typography;

const mapArticleToDraftGroups = (article: ArticleContentDto): ParagraphGroupDraft[] => {
  const groupsMap = new Map<number, ParagraphGroupDraft>();

  article.paragraphs
    .sort((left, right) => left.order - right.order)
    .forEach((paragraph) => {
      const existingGroup = groupsMap.get(paragraph.order);
      const alternative = {
        localId: crypto.randomUUID(),
        content: paragraph.content,
        isDefault: paragraph.isDefault,
      };

      if (existingGroup) {
        existingGroup.alternatives.push(alternative);
        return;
      }

      groupsMap.set(paragraph.order, {
        order: paragraph.order,
        alternatives: [alternative],
      });
    });

  return Array.from(groupsMap.values());
};


const findNodeArticleId = (nodes: NavigationNodeDto[] | undefined, nodeId: number): number | null => {
  if (!nodes) {
    return null;
  }

  for (const node of nodes) {
    if (node.id === nodeId) {
      return node.article?.id ?? null;
    }

    const childArticleId = findNodeArticleId(node.children, nodeId);
    if (childArticleId) {
      return childArticleId;
    }
  }

  return null;
};

const AddArticlePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { nodeId: nodeIdParam } = useParams();
  const editNodeId = nodeIdParam ? Number(nodeIdParam) : null;
  const isEditMode = Number.isFinite(editNodeId) && editNodeId !== null;

  const [messageApi, contextHolder] = message.useMessage();
  const [title, setTitle] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [isRootNode, setIsRootNode] = useState(false);
  const [groups, setGroups] = useState<ParagraphGroupDraft[]>([createEmptyGroup(1)]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');

  const t = locale.addArticlePage;

  const nodesQuery = useQuery({
    queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_NODES],
    queryFn: getNodes,
  });

  const existingNodeArticleQuery = useQuery({
    queryKey: ['article-content-by-node', editNodeId],
    queryFn: async () => {
      const nodeId = editNodeId as number;
      const articleByNode = await getArticleContentByNodeId(nodeId);

      if (articleByNode) {
        return articleByNode;
      }

      const navigationTree = await getNavigationTree();
      const articleId = findNodeArticleId(navigationTree, nodeId);

      if (!articleId) {
        return null;
      }

      return getArticleContentById(articleId);
    },
    enabled: isEditMode,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: ArticleContentCreateDto) => createArticleContent(payload),
    onSuccess: async (created) => {
      messageApi.success(t.saved);
      await queryClient.invalidateQueries({ queryKey: [APP_CONSTANTS.QUERY_KEYS.NAVIGATION_TREE] });
      navigate(`/article/${created.id}`);
    },
    onError: (error) => messageApi.error(`${t.saveError}: ${(error as Error).message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ articleId, payload }: { articleId: number; payload: ArticleContentDto }) =>
      updateArticleContent(articleId, payload),
    onSuccess: async (updated) => {
      messageApi.success(t.saved);
      await queryClient.invalidateQueries({ queryKey: [APP_CONSTANTS.QUERY_KEYS.NAVIGATION_TREE] });
      navigate(`/article/${updated.id}`);
    },
    onError: (error) => messageApi.error(`${t.saveError}: ${(error as Error).message}`),
  });

  const createNodeMutation = useMutation({
    mutationFn: createNode,
  });

  const styleMutation = useMutation({
    mutationFn: (text: string) => styleMarkdownWithAi({ text }),
  });

  const articleFromNode = existingNodeArticleQuery.data;
  const resolvedTitle = title || articleFromNode?.title || '';
  const resolvedGroups = groups.length === 1 && !groups[0].alternatives[0].content.trim() && articleFromNode
    ? mapArticleToDraftGroups(articleFromNode)
    : groups;

  const totalAlternatives = useMemo(
    () => resolvedGroups.reduce((sum, group) => sum + group.alternatives.length, 0),
    [resolvedGroups],
  );


  const setAlternativeContent = (groupOrder: number, localId: string, content: string) => {
    setGroups((current) => setAlternativeContentInGroups(current, groupOrder, localId, content));
  };

  const setDefaultAlternative = (groupOrder: number, localId: string) => {
    setGroups((current) => setDefaultAlternativeInGroups(current, groupOrder, localId));
  };

  const addParagraphGroup = () => {
    setGroups((current) => [...current, createEmptyGroup(current.length + 1)]);
  };

  const addAlternative = (groupOrder: number) => {
    setGroups((current) => addAlternativeToGroups(current, groupOrder));
  };

  const removeAlternative = (groupOrder: number, localId: string) => {
    setGroups((current) => removeAlternativeFromGroups(current, groupOrder, localId));
  };

  const improveSingleAlternativeWithAi = async (groupOrder: number, localId: string) => {
    const group = resolvedGroups.find((item) => item.order === groupOrder);
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
    const queue = collectAiImprovementQueue(resolvedGroups);

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

  const saveArticle = async () => {
    if (!resolvedTitle.trim()) {
      messageApi.warning(t.warnings.titleRequired);
      return;
    }

    const paragraphs = buildParagraphDtos(resolvedGroups);

    if (paragraphs.length === 0) {
      messageApi.warning(t.warnings.paragraphRequired);
      return;
    }

    const emptyDefaults = hasGroupWithoutFilledDefault(resolvedGroups);

    if (emptyDefaults) {
      messageApi.warning(t.warnings.defaultRequired);
      return;
    }

    if (!isEditMode && !isRootNode && !selectedParentId) {
      messageApi.warning(t.warnings.parentNodeRequired);
      return;
    }

    if (isEditMode) {
      const existing = existingNodeArticleQuery.data;

      if (existing) {
        updateMutation.mutate({
          articleId: existing.id,
          payload: {
            id: existing.id,
            title: resolvedTitle.trim(),
            paragraphs,
          },
        });
        return;
      }

      createMutation.mutate({
        title: resolvedTitle.trim(),
        nodeId: editNodeId as number,
        paragraphs,
      });
      return;
    }

    try {
      const createdNode = await createNodeMutation.mutateAsync({
        title: resolvedTitle.trim(),
        parentId: isRootNode ? undefined : selectedParentId ?? undefined,
        isRoot: isRootNode,
      });

      createMutation.mutate({
        title: resolvedTitle.trim(),
        nodeId: createdNode.id,
        paragraphs,
      });
    } catch (error) {
      messageApi.error(`${t.saveError}: ${(error as Error).message}`);
    }
  };

  const importMarkdownAsParagraphs = () => {
    const importedGroups = importGroupsFromMarkdown(importText);

    if (importedGroups.length === 0) {
      messageApi.warning(t.warnings.importEmpty);
      return;
    }

    setGroups(importedGroups);
    setIsImportOpen(false);
    setImportText('');
    messageApi.success(`${t.importedParagraphs}: ${importedGroups.length}`);
  };

  if (isEditMode && existingNodeArticleQuery.isLoading) {
    return <Spin />;
  }

  if (isEditMode && existingNodeArticleQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message={t.saveError}
        description={(existingNodeArticleQuery.error as Error).message}
      />
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {contextHolder}
      <Title level={2}>{isEditMode ? t.editTitle : t.title}</Title>
      <Alert type="info" showIcon message={t.modelTitle} description={t.modelDescription} />

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input value={resolvedTitle} onChange={(event) => setTitle(event.target.value)} placeholder={t.articleTitlePlaceholder} />

          {!isEditMode && (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <label>{t.parentNodeLabel}</label>
              <Select<number>
                showSearch
                placeholder={t.parentNodePlaceholder}
                disabled={isRootNode}
                value={selectedParentId ?? undefined}
                onChange={(value) => setSelectedParentId(value)}
                allowClear
                optionFilterProp="label"
                options={(nodesQuery.data ?? []).map((node) => ({
                  value: node.id,
                  label: `${node.title} (#${node.id})`,
                }))}
              />
              <Checkbox checked={isRootNode} onChange={(event) => setIsRootNode(event.target.checked)}>
                {t.rootNodeLabel}
              </Checkbox>
            </Space>
          )}

          <Space>
            <Button onClick={() => setIsImportOpen(true)}>{t.importDraft}</Button>
            <Button loading={styleMutation.isPending} onClick={improveAllWithAi}>{t.improveAllAi}</Button>
          </Space>
          <Text type="secondary">{t.paragraphStats}: {resolvedGroups.length} · {t.versionsStats}: {totalAlternatives}</Text>
        </Space>
      </Card>

      {resolvedGroups.map((group) => (
        <ParagraphGroupEditor
          key={group.order}
          group={group}
          isAiBusy={styleMutation.isPending}
          onAddAlternative={addAlternative}
          onSetDefault={setDefaultAlternative}
          onImproveWithAi={improveSingleAlternativeWithAi}
          onRemoveAlternative={removeAlternative}
          onContentChange={setAlternativeContent}
        />
      ))}

      <Space>
        <Button onClick={addParagraphGroup}>{t.addParagraph}</Button>
        <Button
          type="primary"
          loading={createMutation.isPending || updateMutation.isPending || createNodeMutation.isPending}
          onClick={saveArticle}
        >
          {isEditMode ? t.saveChanges : t.saveArticle}
        </Button>
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
