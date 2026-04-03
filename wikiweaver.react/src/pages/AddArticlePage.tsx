import React, { useMemo, useRef, useState } from 'react';
import { FileText, X } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import MarkdownContent from '../components/MarkdownContent';
import { APP_CONSTANTS } from '../constants/AppConstants';
import { useLocale } from '../localization/hooks';
import { createArticleContent } from '../services/Article/articleService';
import { getNavigationTree } from '../services/Article/navigationService';
import { getAiProviderSettings, styleMarkdownWithAi } from '../services/adminService';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { Input } from '../shared/ui/Input';
import { Textarea } from '../shared/ui/Textarea';
import type { ArticleContentCreateDto, ArticleInfoboxDto, NavigationArticleDto } from '../shared/types/ApiTypes';
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
  insertBlockAfter,
  moveBlock,
  removeVersionFromBlock,
  setDefaultVersion,
  updatePlainBlockContent,
  updateVersionContent,
} from './add-article/draftHelpers';
import { addInfoboxField, buildInfoboxCreateDto, createEmptyInfoboxDraft, hasIncompleteInfoboxFields, moveInfoboxField, removeInfoboxField, updateInfoboxField } from './add-article/infoboxHelpers';
import type { EditorBlock } from './add-article/types';

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

const cloneBlocks = (blocks: EditorBlock[]): EditorBlock[] =>
  blocks.map((block) =>
    block.kind === 'versioned'
      ? { ...block, variants: block.variants.map((variant) => ({ ...variant })) }
      : { ...block },
  );

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

type ParentOption = {
  id: number;
  title: string;
  path: string;
};

const flattenNavigationTree = (
  nodes: NavigationArticleDto[],
  parentTitles: string[] = [],
): ParentOption[] =>
  nodes.flatMap((node) => {
    const titles = [...parentTitles, node.title];
    const current: ParentOption = {
      id: node.id,
      title: node.title,
      path: titles.join(' / '),
    };

    return [current, ...flattenNavigationTree(node.children ?? [], titles)];
  });

const AddArticlePage: React.FC = () => {
  const locale = useLocale();
  const navigate = useNavigate();
  const t = locale.addArticlePage;
  const editorText = locale.addArticleEditor;
  const [title, setTitle] = useState('');
  const [parentArticleId, setParentArticleId] = useState<number | null>(null);
  const [infobox, setInfobox] = useState(createEmptyInfoboxDraft);
  const [blocks, setBlocks] = useState<EditorBlock[]>([createEmptyBlock('paragraph')]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [activeTarget, setActiveTarget] = useState<EditorTarget | null>(null);
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false);
  const [parentSearch, setParentSearch] = useState('');

  const editorRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const blockRefs = useRef<Record<string, HTMLElement | null>>({});

  const aiSettingsQuery = useQuery({
    queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_AI_SETTINGS],
    queryFn: getAiProviderSettings,
  });

  const navigationTreeQuery = useQuery({
    queryKey: [APP_CONSTANTS.QUERY_KEYS.NAVIGATION_TREE],
    queryFn: getNavigationTree,
  });

  const canUseAi = Boolean(aiSettingsQuery.data?.isEnabled && aiSettingsQuery.data?.hasApiKey);
  const isLocked = isAiRunning;
  const parentOptions = useMemo(
    () => flattenNavigationTree(navigationTreeQuery.data ?? []),
    [navigationTreeQuery.data],
  );
  const selectedParent = useMemo(
    () => parentOptions.find((option) => option.id === parentArticleId) ?? null,
    [parentArticleId, parentOptions],
  );
  const filteredParentOptions = useMemo(() => {
    const query = parentSearch.trim().toLowerCase();
    if (!query) {
      return parentOptions;
    }

    return parentOptions.filter(
      (option) =>
        option.title.toLowerCase().includes(query) ||
        option.path.toLowerCase().includes(query) ||
        option.id.toString().includes(query),
    );
  }, [parentOptions, parentSearch]);

  const showNotice = (tone: Notice['tone'], message: string) => {
    setNotice({ tone, message });
  };

  const mutation = useMutation({
    mutationFn: (payload: ArticleContentCreateDto) => createArticleContent(payload),
    onSuccess: (created) => {
      showNotice('success', t.saved);
      navigate(`/article/${created.id}`);
    },
    onError: (error) => showNotice('error', `${t.saveError}: ${(error as Error).message}`),
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
      .trim();

    if (!normalized) {
      return 0;
    }

    return normalized.split(/\s+/).length;
  }, [previewMarkdown]);
  const readingTimeMinutes = useMemo(() => {
    if (wordCount === 0) {
      return 0;
    }

    return Math.max(1, Math.ceil(wordCount / 180));
  }, [wordCount]);

  const updateSelection = (
    target: EditorTarget,
    nextValue: string,
    selectionStart: number,
    selectionEnd: number,
  ) => {
    setBlocks((current) =>
      target.localId
        ? updateVersionContent(current, target.blockId, target.localId, nextValue)
        : updatePlainBlockContent(current, target.blockId, nextValue),
    );

    requestAnimationFrame(() => {
      const textarea = editorRefs.current[targetKey(target.blockId, target.localId)];
      textarea?.focus();
      textarea?.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const applyFormat = (action: FormatAction) => {
    if (!activeTarget || isLocked) {
      return;
    }

    const textarea = editorRefs.current[targetKey(activeTarget.blockId, activeTarget.localId)];
    const currentValue = getTargetValue(blocks, activeTarget);

    if (!textarea || currentValue === null) {
      return;
    }

    const start = textarea.selectionStart ?? currentValue.length;
    const end = textarea.selectionEnd ?? currentValue.length;
    const selected = currentValue.slice(start, end);

    const withWrap = (prefix: string, suffix = prefix, fallback: string = editorText.markdown.insertText) => {
      const text = selected || fallback;
      const nextValue = `${currentValue.slice(0, start)}${prefix}${text}${suffix}${currentValue.slice(end)}`;
      const nextStart = start + prefix.length;
      const nextEnd = nextStart + text.length;
      updateSelection(activeTarget, nextValue, nextStart, nextEnd);
    };

    const withLinePrefix = (prefixFactory: (index: number) => string, fallback: string) => {
      const text = selected || fallback;
      const lines = text.split('\n');
      const nextText = lines.map((line, index) => `${prefixFactory(index)}${line}`).join('\n');
      const nextValue = `${currentValue.slice(0, start)}${nextText}${currentValue.slice(end)}`;
      updateSelection(activeTarget, nextValue, start, start + nextText.length);
    };

    switch (action) {
      case 'bold':
        withWrap('**');
        return;
      case 'italic':
        withWrap('_');
        return;
      case 'link':
        withWrap('[', '](https://example.com)', editorText.markdown.linkSnippet);
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
      showNotice('warning', t.warnings.titleRequired);
      return;
    }

    if (!hasAnyFilledContent(blocks)) {
      showNotice('warning', t.warnings.paragraphRequired);
      return;
    }

    if (hasVersionedBlockWithoutFilledDefault(blocks)) {
      showNotice('warning', t.warnings.defaultRequired);
      return;
    }

    if (hasIncompleteInfoboxFields(infobox)) {
      showNotice('warning', t.warnings.infoboxFieldIncomplete);
      return;
    }

    mutation.mutate({
      title: title.trim(),
      parentArticleId: parentArticleId ?? undefined,
      paragraphs: buildParagraphDtosFromBlocks(blocks),
      infobox: buildInfoboxCreateDto(infobox),
    });
  };

  const improveWholeArticleWithAi = async () => {
    if (isLocked || !canUseAi) {
      return;
    }

    const targets = collectWholeArticleAiTargets(blocks);
    if (targets.length === 0) {
      showNotice('warning', t.warnings.noParagraphsForAi);
      return;
    }

    setIsAiRunning(true);

    try {
      let nextBlocks = cloneBlocks(blocks);

      for (const target of targets) {
        const result = await styleMarkdownWithAi({ text: target.content });
        nextBlocks = target.localId
          ? updateVersionContent(nextBlocks, target.blockId, target.localId, result.styledText)
          : updatePlainBlockContent(nextBlocks, target.blockId, result.styledText);
      }

      setBlocks(nextBlocks);
      showNotice('success', `${t.styledVersions}: ${targets.length}`);
    } catch (error) {
      showNotice('error', `${t.aiStyleFailed}: ${(error as Error).message}`);
    } finally {
      setIsAiRunning(false);
    }
  };

  const importMarkdownAsBlocks = () => {
    const importedBlocks = importBlocksFromMarkdown(importText);

    if (importedBlocks.length === 0) {
      showNotice('warning', t.warnings.importEmpty);
      return;
    }

    setBlocks(importedBlocks);
    setIsImportOpen(false);
    setImportText('');
    setIsPreview(false);
    showNotice('success', `${t.importedParagraphs}: ${importedBlocks.length}`);
  };

  const selectParentArticle = (option: ParentOption | null) => {
    setParentArticleId(option?.id ?? null);
    setParentSearch(option?.path ?? '');
    setIsParentDropdownOpen(false);
  };

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
                      {t.articleTitleLabel}
                    </label>
                    <Input
                      value={title}
                      disabled={isLocked}
                      onFocus={() => setActiveTarget(null)}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder={t.articleTitlePlaceholder}
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
                      {t.previewTitle}
                    </div>
                    <h1 className="mb-6 text-3xl font-bold tracking-[-0.03em] text-[var(--color-ink-strong)]">{title || locale.common.untitled}</h1>
                    <ArticleInfoboxPanel infobox={previewInfobox} />
                    <div className="article-markdown">
                      <MarkdownContent content={previewMarkdown || t.previewEmpty} />
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto max-w-[720px]">
                    <InfoboxEditor
                      draft={infobox}
                      disabled={isLocked}
                      text={editorText.infobox}
                      onTitleChange={(value) => setInfobox((current) => ({ ...current, title: value }))}
                      onSubtitleChange={(value) => setInfobox((current) => ({ ...current, subtitle: value }))}
                      onAddField={() => setInfobox((current) => ({ ...current, fields: addInfoboxField(current.fields) }))}
                      onUpdateField={(fieldId, patch) => setInfobox((current) => ({
                        ...current,
                        fields: updateInfoboxField(current.fields, fieldId, patch),
                      }))}
                      onMoveField={(fieldId, direction) => setInfobox((current) => ({
                        ...current,
                        fields: moveInfoboxField(current.fields, fieldId, direction),
                      }))}
                      onRemoveField={(fieldId) => setInfobox((current) => ({
                        ...current,
                        fields: removeInfoboxField(current.fields, fieldId),
                      }))}
                    />

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
            />
          )}
          isLocked={isLocked}
          isLoadingParents={navigationTreeQuery.isLoading}
          selectedParent={selectedParent}
          parentSearch={parentSearch}
          filteredParentOptions={filteredParentOptions}
          isParentDropdownOpen={isParentDropdownOpen}
          onToggleParentDropdown={() => {
            setActiveTarget(null);
            setIsParentDropdownOpen((current) => !current);
            setParentSearch(selectedParent?.path ?? '');
          }}
          onParentSearchChange={setParentSearch}
          onSelectParent={selectParentArticle}
        />
        </div>
      </div>

      {isImportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,20,18,0.35)] p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-[var(--color-border-soft)] bg-white shadow-[0_30px_80px_rgba(28,27,24,0.18)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-6 py-5">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">{t.importModalEyebrow}</p>
                <h2 className="m-0 text-xl font-semibold text-[var(--color-ink-strong)]">{t.importModalTitle}</h2>
              </div>
              <button type="button" onClick={() => setIsImportOpen(false)} className="rounded-lg p-2 text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-page-panel)] hover:text-[var(--color-ink-strong)]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <p className="m-0 text-sm leading-6 text-[var(--color-ink-muted)]">
                {t.importModalDescription}
              </p>
              <Textarea
                rows={10}
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                placeholder={t.importPlaceholder}
                className="min-h-[240px] rounded-2xl font-mono text-[13px] leading-6"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-[var(--color-border-soft)] px-6 py-4">
              <Button variant="ghost" onClick={() => setIsImportOpen(false)}>{locale.common.cancel}</Button>
              <Button variant="primary" onClick={importMarkdownAsBlocks}>{t.importing}</Button>
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
                <p className="m-0 text-sm font-semibold text-[var(--color-ink-strong)]">{t.aiOverlayTitle}</p>
                <p className="mb-0 mt-1 text-sm text-[var(--color-ink-muted)]">{t.aiOverlayDescription}</p>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default AddArticlePage;
