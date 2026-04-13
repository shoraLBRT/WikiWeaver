import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import MarkdownContent from '../components/MarkdownContent';
import { APP_CONSTANTS } from '../constants/AppConstants';
import { useLocale } from '../localization/hooks';
import { getArticleContentById, updateArticleContent } from '../services/Article/articleService';
import { getNavigationTree } from '../services/Article/navigationService';
import { deleteArticle, getAiProviderSettings, styleMarkdownWithAi } from '../services/adminService';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { Input } from '../shared/ui/Input';
import { Textarea } from '../shared/ui/Textarea';
import type { ArticleContentDto, ArticleInfoboxDto, NavigationArticleDto } from '../shared/types/ApiTypes';
import { ArticleInfoboxPanel } from '../components/article/ArticleInfoboxPanel';
import { DocumentBlockEditor } from './add-article/DocumentBlockEditor';
import { EditorBottomToolbar, type FormatAction } from './add-article/EditorBottomToolbar';
import { EditorHelpRail } from './add-article/EditorHelpRail';
import { InfoboxEditor } from './add-article/InfoboxEditor';
import { EditorOutlineRail } from './add-article/EditorOutlineRail';
import { EditorToolbar } from './add-article/EditorToolbar';
import {
  addVersionToBlock,
  buildDocumentPreviewMarkdown,
  buildParagraphDtosFromBlocks,
  collectWholeArticleAiTargets,
  convertParagraphToVersioned,
  convertVersionedToParagraph,
  createEmptyBlock,
  deleteBlock,
  hasAnyFilledContent,
  hasVersionedBlockWithoutFilledDefault,
  importBlocksFromMarkdown,
  importBlocksFromParagraphs,
  insertBlockAfter,
  moveBlock,
  removeVersionFromBlock,
  setDefaultVersion,
  updatePlainBlockContent,
  updateVersionContent,
} from './add-article/draftHelpers';
import {
  addInfoboxField,
  buildInfoboxCreateDto,
  createEmptyInfoboxDraft,
  hasIncompleteInfoboxFields,
  importInfoboxFromDto,
  moveInfoboxField,
  removeInfoboxField,
  updateInfoboxField,
} from './add-article/infoboxHelpers';
import { addRelatedLink, importRelatedLinksFromDto, moveRelatedLink, removeRelatedLink, type RelatedLinkDraft } from './add-article/metadataHelpers';
import type { EditorBlock } from './add-article/types';

type ArticleOption = {
  id: number;
  title: string;
  path: string;
};

const flattenNavigationTree = (
  nodes: NavigationArticleDto[],
  parentTitles: string[] = [],
): ArticleOption[] =>
  nodes.flatMap((node) => {
    const titles = [...parentTitles, node.title];
    return [
      { id: node.id, title: node.title, path: titles.join(' / ') },
      ...flattenNavigationTree(node.children ?? [], titles),
    ];
  });

type Notice = {
  tone: 'success' | 'warning' | 'error';
  message: string;
};

type EditorTarget = {
  blockId: string;
  localId: string | null;
};

const noticeClasses: Record<Notice['tone'], string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-800',
};

const targetKey = (blockId: string, localId: string | null) => `${blockId}:${localId ?? 'plain'}`;

const getTargetValue = (blocks: EditorBlock[], target: EditorTarget): string | null => {
  const block = blocks.find((item) => item.id === target.blockId);
  if (!block) {
    return null;
  }

  if (block.kind === 'versioned') {
    return block.variants.find((variant) => variant.localId === target.localId)?.content ?? null;
  }

  return block.content;
};

const EditArticlePage: React.FC = () => {
  const locale = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { articleId } = useParams<{ articleId: string }>();
  const numericId = Number(articleId);

  const t = locale.editArticlePage;
  const addT = locale.addArticlePage;
  const editorText = locale.addArticleEditor;

  const [title, setTitle] = useState('');
  const [infobox, setInfobox] = useState(createEmptyInfoboxDraft);
  const [blocks, setBlocks] = useState<EditorBlock[]>([createEmptyBlock('paragraph')]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [activeTarget, setActiveTarget] = useState<EditorTarget | null>(null);
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [relatedLinks, setRelatedLinks] = useState<RelatedLinkDraft[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const editorRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const blockRefs = useRef<Record<string, HTMLElement | null>>({});

  const articleQuery = useQuery({
    queryKey: [APP_CONSTANTS.QUERY_KEYS.ARTICLE_CONTENT, numericId],
    queryFn: () => getArticleContentById(numericId),
    enabled: !Number.isNaN(numericId),
  });

  const aiSettingsQuery = useQuery({
    queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_AI_SETTINGS],
    queryFn: getAiProviderSettings,
  });

  const navigationTreeQuery = useQuery({
    queryKey: [APP_CONSTANTS.QUERY_KEYS.NAVIGATION_TREE],
    queryFn: getNavigationTree,
  });

  const articleOptions = useMemo(
    () => flattenNavigationTree(navigationTreeQuery.data ?? []),
    [navigationTreeQuery.data],
  );

  useEffect(() => {
    if (articleQuery.data && !isInitialized) {
      const data = articleQuery.data;
      setTitle(data.title);
      const imported = importBlocksFromParagraphs(data.paragraphs);
      setBlocks(imported.length > 0 ? imported : [createEmptyBlock('paragraph')]);
      if (data.infobox) {
        setInfobox(importInfoboxFromDto(data.infobox));
      }
      setSummary(data.summary ?? '');
      setTags(data.tags ?? []);
      setRelatedLinks(data.relatedLinks ? importRelatedLinksFromDto(data.relatedLinks) : []);
      setIsInitialized(true);
    }
  }, [articleQuery.data, isInitialized]);

  const canUseAi = Boolean(aiSettingsQuery.data?.isEnabled && aiSettingsQuery.data?.hasApiKey);
  const isLocked = isAiRunning;

  const showNotice = (tone: Notice['tone'], message: string) => {
    setNotice({ tone, message });
  };

  const mutation = useMutation({
    mutationFn: (payload: ArticleContentDto) => updateArticleContent(numericId, payload),
    onSuccess: () => {
      showNotice('success', t.saved);
      navigate(`/article/${numericId}`);
    },
    onError: (error) => showNotice('error', `${t.saveError}: ${(error as Error).message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteArticle(numericId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APP_CONSTANTS.QUERY_KEYS.NAVIGATION_TREE] });
      queryClient.invalidateQueries({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ARTICLE_CONTENT] });
      navigate('/');
    },
    onError: (error) => {
      setIsDeleteModalOpen(false);
      showNotice('error', `${t.deleteError}: ${(error as Error).message}`);
    },
  });

  const previewMarkdown = useMemo(() => buildDocumentPreviewMarkdown(blocks), [blocks]);
  const previewInfobox = useMemo<ArticleInfoboxDto | undefined>(() => {
    const dto = buildInfoboxCreateDto(infobox);
    if (!dto) {
      return undefined;
    }

    return {
      title: dto.title,
      subtitle: dto.subtitle,
      fields: dto.fields.map((field) => ({ ...field, id: field.order })),
    };
  }, [infobox]);
  const paragraphCount = useMemo(
    () =>
      blocks.reduce((sum, block) => {
        if (block.kind === 'versioned') {
          return sum + (block.variants.some((variant) => variant.content.trim()) ? 1 : 0);
        }

        return sum + (block.kind === 'paragraph' && block.content.trim() ? 1 : 0);
      }, 0),
    [blocks],
  );
  const characterCount = useMemo(
    () =>
      blocks.reduce((sum, block) => {
        if (block.kind === 'versioned') {
          return sum + block.variants.reduce((variantSum, variant) => variantSum + variant.content.length, 0);
        }

        return sum + block.content.length;
      }, 0),
    [blocks],
  );
  const wordCount = useMemo(() => {
    const normalized = previewMarkdown
      .replace(/[#>*_`~[\]()!-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return normalized ? normalized.split(' ').length : 0;
  }, [previewMarkdown]);
  const readingTimeMinutes = useMemo(() => Math.max(1, Math.round(wordCount / 200)), [wordCount]);

  const applyFormat = (action: FormatAction) => {
    if (!activeTarget) {
      return;
    }

    const key = targetKey(activeTarget.blockId, activeTarget.localId);
    const textarea = editorRefs.current[key];
    if (!textarea) {
      return;
    }

    const { selectionStart, selectionEnd } = textarea;
    const currentValue = getTargetValue(blocks, activeTarget);
    if (currentValue === null) {
      return;
    }

    const before = currentValue.slice(0, selectionStart);
    const selected = currentValue.slice(selectionStart, selectionEnd);
    const after = currentValue.slice(selectionEnd);

    const withInlineWrap = (mark: string, placeholder: string) => {
      const inner = selected || placeholder;
      const next = `${before}${mark}${inner}${mark}${after}`;
      updateTarget(next);
      focus(key, before.length + mark.length, before.length + mark.length + inner.length);
    };

    const withLinePrefix = (prefix: (index: number) => string, placeholder: string) => {
      const lines = (selected || placeholder).split('\n');
      const formatted = lines.map((line, index) => `${prefix(index)}${line}`).join('\n');
      const next = `${before}${formatted}${after}`;
      updateTarget(next);
      focus(key, before.length, before.length + formatted.length);
    };

    const updateTarget = (value: string) => {
      if (activeTarget.localId) {
        setBlocks((current) => updateVersionContent(current, activeTarget.blockId, activeTarget.localId!, value));
      } else {
        setBlocks((current) => updatePlainBlockContent(current, activeTarget.blockId, value));
      }
    };

    const focus = (focusKey: string, start: number, end: number) => {
      requestAnimationFrame(() => {
        const el = editorRefs.current[focusKey];
        if (el) {
          el.focus();
          el.setSelectionRange(start, end);
        }
      });
    };

    switch (action) {
      case 'bold':
        withInlineWrap('**', editorText.markdown.insertText);
        return;
      case 'italic':
        withInlineWrap('_', editorText.markdown.insertText);
        return;
      case 'link':
        {
          const label = selected || editorText.markdown.linkSnippet;
          const next = `${before}[${label}](url)${after}`;
          updateTarget(next);
          focus(key, before.length + 1, before.length + 1 + label.length);
        }
        return;
      case 'bulletList':
        withLinePrefix(() => '- ', editorText.markdown.listSnippet);
        return;
      case 'orderedList':
        withLinePrefix((index) => `${index + 1}. `, editorText.markdown.listSnippet);
        return;
      case 'quote':
        withLinePrefix(() => '> ', editorText.markdown.quoteSnippet);
    }
  };

  const saveArticle = () => {
    if (isLocked || mutation.isPending) {
      return;
    }

    if (!title.trim()) {
      showNotice('warning', addT.warnings.titleRequired);
      return;
    }

    if (!hasAnyFilledContent(blocks)) {
      showNotice('warning', addT.warnings.paragraphRequired);
      return;
    }

    if (hasVersionedBlockWithoutFilledDefault(blocks)) {
      showNotice('warning', addT.warnings.defaultRequired);
      return;
    }

    if (hasIncompleteInfoboxFields(infobox)) {
      showNotice('warning', addT.warnings.infoboxFieldIncomplete);
      return;
    }

    const infoboxCreateDto = buildInfoboxCreateDto(infobox);
    const infoboxDto = infoboxCreateDto
      ? {
          title: infoboxCreateDto.title,
          subtitle: infoboxCreateDto.subtitle,
          fields: infoboxCreateDto.fields.map((field) => ({ ...field, id: 0 })),
        }
      : undefined;

    mutation.mutate({
      id: numericId,
      title: title.trim(),
      paragraphs: buildParagraphDtosFromBlocks(blocks),
      infobox: infoboxDto,
      summary: summary.trim() || undefined,
      tags,
      relatedLinks: relatedLinks.map((link, index) => ({
        id: 0,
        relatedArticleId: link.articleId,
        relatedArticleTitle: link.articleTitle,
        order: index + 1,
      })),
    });
  };

  const infoboxEditorProps = {
    draft: infobox,
    disabled: isLocked,
    text: editorText.infobox,
    onTitleChange: (value: string) => setInfobox((current) => ({ ...current, title: value })),
    onSubtitleChange: (value: string) => setInfobox((current) => ({ ...current, subtitle: value })),
    onAddField: () => setInfobox((current) => ({ ...current, fields: addInfoboxField(current.fields) })),
    onUpdateField: (fieldId: string, patch: { key?: string; label?: string; value?: string }) => setInfobox((current) => ({
      ...current,
      fields: updateInfoboxField(current.fields, fieldId, patch),
    })),
    onMoveField: (fieldId: string, direction: -1 | 1) => setInfobox((current) => ({
      ...current,
      fields: moveInfoboxField(current.fields, fieldId, direction),
    })),
    onRemoveField: (fieldId: string) => setInfobox((current) => ({
      ...current,
      fields: removeInfoboxField(current.fields, fieldId),
    })),
  };

  const improveWholeArticleWithAi = async () => {
    if (isLocked || !canUseAi) {
      return;
    }

    const targets = collectWholeArticleAiTargets(blocks);
    if (targets.length === 0) {
      showNotice('warning', addT.warnings.noParagraphsForAi);
      return;
    }

    setIsAiRunning(true);
    let styledCount = 0;

    try {
      for (const target of targets) {
        const result = await styleMarkdownWithAi({ text: target.content });
        if (result.styledText && result.styledText !== target.content) {
          if (target.localId) {
            setBlocks((current) => addVersionToBlock(current, target.blockId));
            setBlocks((current) => {
              const block = current.find((b) => b.id === target.blockId);
              if (block?.kind === 'versioned') {
                const lastVariant = block.variants[block.variants.length - 1];
                return updateVersionContent(current, target.blockId, lastVariant.localId, result.styledText);
              }
              return current;
            });
          } else {
            setBlocks((current) => convertParagraphToVersioned(current, target.blockId));
            setBlocks((current) => {
              const block = current.find((b) => b.id === target.blockId);
              if (block?.kind === 'versioned') {
                const lastVariant = block.variants[block.variants.length - 1];
                return updateVersionContent(current, target.blockId, lastVariant.localId, result.styledText);
              }
              return current;
            });
          }
          styledCount++;
        }
      }

      if (styledCount > 0) {
        showNotice('success', `${addT.styledVersions}: ${styledCount}`);
      }
    } catch {
      showNotice('error', addT.aiStyleFailed);
    } finally {
      setIsAiRunning(false);
    }
  };

  const importMarkdownAsBlocks = () => {
    const imported = importBlocksFromMarkdown(importText);
    if (imported.length === 0) {
      showNotice('warning', addT.warnings.importEmpty);
      return;
    }

    setBlocks((current) => [...current, ...imported]);
    showNotice('success', `${addT.importedParagraphs}: ${imported.length}`);
    setImportText('');
    setIsImportOpen(false);
  };

  if (articleQuery.isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-var(--layout-header-height))] items-center justify-center">
        <p className="text-sm text-[var(--color-ink-muted)]">{locale.common.loading}</p>
      </div>
    );
  }

  if (articleQuery.isError || !articleQuery.data) {
    return (
      <div className="flex min-h-[calc(100vh-var(--layout-header-height))] items-center justify-center">
        <Card className="px-6 py-5">
          <p className="text-sm text-red-600">{t.loadError}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-var(--layout-header-height))] bg-[linear-gradient(180deg,#f9f8f5_0%,#f3f2ed_100%)]">
      <div className="mx-auto max-w-[1420px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-0">
        <EditorOutlineRail
          blocks={blocks}
          onJumpToBlock={(blockId) => blockRefs.current[blockId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
        />

        <main className="min-w-0 flex-1 xl:px-6">
          <div className="mx-auto max-w-[840px]">
            {notice ? (
              <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm shadow-sm ${noticeClasses[notice.tone]}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="m-0">{notice.message}</p>
                  <button type="button" onClick={() => setNotice(null)} className="rounded-md p-1 opacity-70 transition-opacity hover:opacity-100">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-[30px] border border-[var(--color-border-soft)] bg-white shadow-[0_28px_90px_rgba(28,27,24,0.07)]">
              <div className="border-b border-[var(--color-border-soft)] px-6 py-5 sm:px-8">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
                      {addT.articleTitleLabel}
                    </label>
                    <Input
                      value={title}
                      disabled={isLocked}
                      onFocus={() => setActiveTarget(null)}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder={addT.articleTitlePlaceholder}
                      className="h-auto border-0 bg-transparent px-0 py-0 text-3xl font-bold tracking-[-0.03em] text-[var(--color-ink-strong)] shadow-none focus:ring-0"
                    />
                  </div>
                </div>
              </div>

              <div className="px-4 py-6 sm:px-6 lg:px-8">
                {isPreview ? (
                  <div className="mx-auto max-w-[720px] rounded-[26px] border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-6 py-8 shadow-sm">
                    <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
                      <FileText size={12} />
                      {addT.previewTitle}
                    </div>
                    <h1 className="mb-6 text-3xl font-bold tracking-[-0.03em] text-[var(--color-ink-strong)]">{title || locale.common.untitled}</h1>
                    <ArticleInfoboxPanel infobox={previewInfobox} />
                    <div className="article-markdown">
                      <MarkdownContent content={previewMarkdown || addT.previewEmpty} />
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto max-w-[720px]">
                    <InfoboxEditor {...infoboxEditorProps} />

                    <div className="space-y-0.5">
                      {blocks.map((block, index) => (
                        <DocumentBlockEditor
                          key={block.id}
                          block={block}
                          index={index}
                          total={blocks.length}
                          disabled={isLocked}
                          activeTarget={activeTarget}
                          blockRef={(blockId, node) => {
                            blockRefs.current[blockId] = node;
                          }}
                          editorRef={(key, node) => {
                            editorRefs.current[key] = node;
                          }}
                          onFocusTarget={setActiveTarget}
                          onChangePlain={(blockId, content) => setBlocks((current) => updatePlainBlockContent(current, blockId, content))}
                          onChangeVersion={(blockId, localId, content) => setBlocks((current) => updateVersionContent(current, blockId, localId, content))}
                          onSetDefault={(blockId, localId) => setBlocks((current) => setDefaultVersion(current, blockId, localId))}
                          onAddVersion={(blockId) => setBlocks((current) => addVersionToBlock(current, blockId))}
                          onRemoveVersion={(blockId, localId) => setBlocks((current) => removeVersionFromBlock(current, blockId, localId))}
                          onDeleteBlock={(blockId) => setBlocks((current) => (current.length > 1 ? deleteBlock(current, blockId) : current))}
                          onMoveBlock={(blockId, direction) => setBlocks((current) => moveBlock(current, blockId, direction))}
                          onConvertToVersioned={(blockId) => setBlocks((current) => convertParagraphToVersioned(current, blockId))}
                          onConvertToParagraph={(blockId) => setBlocks((current) => convertVersionedToParagraph(current, blockId))}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

          <EditorBottomToolbar
            disabled={isLocked || mutation.isPending}
            onFormat={applyFormat}
            onAddBlock={(kind) => setBlocks((current) => insertBlockAfter(current, activeTarget?.blockId ?? null, kind))}
          />
        </main>

        <EditorHelpRail
          blockCount={blocks.length}
          paragraphCount={paragraphCount}
          wordCount={wordCount}
          characterCount={characterCount}
          readingTimeMinutes={readingTimeMinutes}
          actions={(
            <EditorToolbar
              disabled={isLocked || mutation.isPending}
              isPreview={isPreview}
              canImproveWithAi={canUseAi}
              isAiRunning={isAiRunning}
              isSaving={mutation.isPending}
              onTogglePreview={() => setIsPreview((current) => !current)}
              onImport={() => setIsImportOpen(true)}
              onImproveAll={improveWholeArticleWithAi}
              onSave={saveArticle}
              showDelete
              isDeleting={deleteMutation.isPending}
              onDelete={() => setIsDeleteModalOpen(true)}
            />
          )}
          isLocked={isLocked}
          summary={summary}
          tags={tags}
          relatedLinks={relatedLinks}
          articleOptions={articleOptions}
          currentArticleId={numericId}
          onSummaryChange={setSummary}
          onTagsChange={setTags}
          onAddRelatedLink={(articleId, articleTitle) => setRelatedLinks((current) => addRelatedLink(current, articleId, articleTitle))}
          onRemoveRelatedLink={(draftId) => setRelatedLinks((current) => removeRelatedLink(current, draftId))}
          onMoveRelatedLink={(draftId, direction) => setRelatedLinks((current) => moveRelatedLink(current, draftId, direction))}
        />
        </div>
      </div>

      {isImportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,20,18,0.35)] p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-[var(--color-border-soft)] bg-white shadow-[0_30px_80px_rgba(28,27,24,0.18)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-6 py-5">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">{addT.importModalEyebrow}</p>
                <h2 className="m-0 text-xl font-semibold text-[var(--color-ink-strong)]">{addT.importModalTitle}</h2>
              </div>
              <button type="button" onClick={() => setIsImportOpen(false)} className="rounded-lg p-2 text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-page-panel)] hover:text-[var(--color-ink-strong)]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <p className="m-0 text-sm leading-6 text-[var(--color-ink-muted)]">
                {addT.importModalDescription}
              </p>
              <Textarea
                rows={10}
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                placeholder={addT.importPlaceholder}
                className="min-h-[240px] rounded-2xl font-mono text-[13px] leading-6"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-[var(--color-border-soft)] px-6 py-4">
              <Button variant="ghost" onClick={() => setIsImportOpen(false)}>{locale.common.cancel}</Button>
              <Button variant="primary" onClick={importMarkdownAsBlocks}>{addT.importing}</Button>
            </div>
          </div>
        </div>
      ) : null}

      {isAiRunning ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,20,18,0.18)] backdrop-blur-[2px]">
          <Card className="border border-[var(--color-border-soft)] bg-white px-6 py-5 shadow-[0_24px_80px_rgba(28,27,24,0.14)]">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border-soft)] border-t-[var(--color-brand-forest)]" />
              <div>
                <p className="m-0 text-sm font-semibold text-[var(--color-ink-strong)]">{addT.aiOverlayTitle}</p>
                <p className="mb-0 mt-1 text-sm text-[var(--color-ink-muted)]">{addT.aiOverlayDescription}</p>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {isDeleteModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,20,18,0.35)] p-4 backdrop-blur-sm">
          <Card className="w-full max-w-xl">
            <div className="border-b border-[var(--color-border-soft)] px-6 py-5">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-red-500">{t.deleteModalEyebrow}</p>
              <h2 className="m-0 text-xl font-semibold text-[var(--color-ink-strong)]">{t.deleteModalTitle}</h2>
            </div>
            <div className="space-y-4 px-6 py-5">
              <p className="m-0 text-sm leading-7 text-[var(--color-ink-muted)]">
                {t.deleteModalDescription.replace('{title}', title)}
              </p>
              <Input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder={title}
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-[var(--color-border-soft)] px-6 py-4">
              <Button variant="ghost" onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmation(''); }}>
                {locale.common.cancel}
              </Button>
              <Button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteConfirmation !== title || deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? '...' : t.deleteModalConfirm}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default EditArticlePage;
