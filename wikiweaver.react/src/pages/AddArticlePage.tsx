import React, { useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, FileText, FolderTree, Info, Save, Search, X } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import MarkdownContent from '../components/MarkdownContent';
import { APP_CONSTANTS } from '../constants/AppConstants';
import { locale } from '../localization';
import { createArticleContent } from '../services/Article/articleService';
import { getNavigationTree } from '../services/Article/navigationService';
import { getAiProviderSettings, styleMarkdownWithAi } from '../services/adminService';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { Input } from '../shared/ui/Input';
import { Textarea } from '../shared/ui/Textarea';
import type { ArticleContentCreateDto, NavigationArticleDto } from '../shared/types/ApiTypes';
import { DocumentBlockEditor } from './add-article/DocumentBlockEditor';
import { EditorHelpRail } from './add-article/EditorHelpRail';
import { EditorOutlineRail } from './add-article/EditorOutlineRail';
import { EditorToolbar } from './add-article/EditorToolbar';
import {
  addVersionToBlock,
  buildDocumentPreviewMarkdown,
  buildParagraphDtosFromBlocks,
  collectWholeArticleAiTargets,
  convertParagraphToVersioned,
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
  const navigate = useNavigate();
  const t = locale.addArticlePage;
  const [title, setTitle] = useState('');
  const [parentArticleId, setParentArticleId] = useState<number | null>(null);
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
  const totalVersions = useMemo(
    () =>
      blocks.reduce(
        (sum, block) => sum + (block.kind === 'versioned' ? block.variants.length : block.content.trim() ? 1 : 0),
        0,
      ),
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

  const applyFormat = (action: 'bold' | 'italic' | 'link' | 'bulletList' | 'orderedList' | 'quote') => {
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

    const withWrap = (prefix: string, suffix = prefix, fallback: string = locale.markdownEditor.insertText) => {
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
        withWrap('[', '](https://example.com)', 'ссылка');
        return;
      case 'bulletList':
        withLinePrefix(() => '- ', locale.markdownEditor.listSnippet);
        return;
      case 'orderedList':
        withLinePrefix((index) => `${index + 1}. `, locale.markdownEditor.listSnippet);
        return;
      case 'quote':
        withLinePrefix(() => '> ', locale.markdownEditor.quoteSnippet);
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

    mutation.mutate({
      title: title.trim(),
      parentArticleId: parentArticleId ?? undefined,
      paragraphs: buildParagraphDtosFromBlocks(blocks),
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
      <EditorToolbar
        disabled={isLocked || mutation.isPending}
        isPreview={isPreview}
        canImproveWithAi={canUseAi}
        isAiRunning={isAiRunning}
        isSaving={mutation.isPending}
        onFormat={applyFormat}
        onAddBlock={(kind) => setBlocks((current) => insertBlockAfter(current, activeTarget?.blockId ?? null, kind))}
        onTogglePreview={() => setIsPreview((current) => !current)}
        onImproveAll={improveWholeArticleWithAi}
        onSave={saveArticle}
      />

      <div className="mx-auto flex max-w-[1420px] gap-0 px-4 py-6 sm:px-6 lg:px-8">
        <EditorOutlineRail
          blocks={blocks}
          parentArticleId={parentArticleId}
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
                      Заголовок статьи
                    </label>
                    <Input
                      value={title}
                      disabled={isLocked}
                      onFocus={() => setActiveTarget(null)}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Название статьи..."
                      className="h-auto border-0 bg-transparent px-0 py-0 text-3xl font-bold tracking-[-0.03em] text-[var(--color-ink-strong)] shadow-none focus:ring-0"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_320px]">
                    <div />
                    <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
                      <label className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                        <FolderTree size={12} />
                        Родительская статья
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          disabled={isLocked || navigationTreeQuery.isLoading}
                          onClick={() => {
                            setActiveTarget(null);
                            setIsParentDropdownOpen((current) => !current);
                            setParentSearch(selectedParent?.path ?? '');
                          }}
                          className="flex w-full items-center justify-between rounded-xl border border-[var(--color-border-soft)] bg-white px-3 py-2 text-left text-sm text-[var(--color-ink-strong)] transition-colors hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="truncate">
                            {selectedParent?.path ?? 'Выберите родительскую статью...'}
                          </span>
                          <ChevronDown size={16} className="shrink-0 text-[var(--color-ink-subtle)]" />
                        </button>

                        {isParentDropdownOpen ? (
                          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[0_20px_50px_rgba(28,27,24,0.12)]">
                            <div className="border-b border-[var(--color-border-soft)] p-3">
                              <div className="relative">
                                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
                                <Input
                                  value={parentSearch}
                                  disabled={isLocked}
                                  onChange={(event) => setParentSearch(event.target.value)}
                                  placeholder="Поиск статьи..."
                                  className="pl-9"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => selectParentArticle(null)}
                                className="mt-3 text-xs font-medium text-[var(--color-brand-forest)] transition-colors hover:text-[var(--color-brand-forest-strong)]"
                              >
                                Очистить выбор
                              </button>
                            </div>

                            <div className="max-h-72 overflow-y-auto p-2">
                              {filteredParentOptions.length > 0 ? (
                                filteredParentOptions.map((option) => {
                                  const isSelected = option.id === parentArticleId;

                                  return (
                                    <button
                                      key={option.id}
                                      type="button"
                                      onClick={() => selectParentArticle(option)}
                                      className={`flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left transition-colors ${isSelected ? 'bg-[var(--color-brand-forest-soft)]' : 'hover:bg-[var(--color-page-panel)]'}`}
                                    >
                                      <span className="mt-0.5 shrink-0 text-[var(--color-brand-forest)]">
                                        {isSelected ? <Check size={14} /> : <FolderTree size={14} />}
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium text-[var(--color-ink-strong)]">{option.title}</span>
                                        <span className="mt-0.5 block truncate text-xs text-[var(--color-ink-subtle)]">{option.path}</span>
                                      </span>
                                    </button>
                                  );
                                })
                              ) : (
                                <p className="m-0 px-3 py-4 text-sm text-[var(--color-ink-subtle)]">Ничего не найдено.</p>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-6 sm:px-6 lg:px-8">
                {isPreview ? (
                  <div className="mx-auto max-w-[720px] rounded-[26px] border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-6 py-8 shadow-sm">
                    <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
                      <FileText size={12} />
                      Предпросмотр статьи
                    </div>
                    <h1 className="mb-6 text-3xl font-bold tracking-[-0.03em] text-[var(--color-ink-strong)]">{title || 'Без названия'}</h1>
                    <div className="article-markdown">
                      <MarkdownContent content={previewMarkdown || 'Пока нет контента для предпросмотра.'} />
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto max-w-[720px] space-y-2">
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
                        onAddAfter={(blockId, kind) => setBlocks((current) => insertBlockAfter(current, blockId, kind))}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-6 py-6 sm:px-8">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white px-4 py-4">
                    <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
                      <Info size={12} />
                      Инфобокс
                    </p>
                    <p className="m-0 text-sm leading-6 text-[var(--color-ink-muted)]">
                      Placeholder в стиле `react2`. Реальные поля появятся после реализации `docs/todo/frontend-infobox.md`.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white px-4 py-4">
                    <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
                      <FolderTree size={12} />
                      Метаданные и связанные статьи
                    </p>
                    <p className="m-0 text-sm leading-6 text-[var(--color-ink-muted)]">
                      На этой итерации сохраняется только основной контент статьи. Metadata и related links остаются заглушками.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-4 z-10 mt-6 rounded-2xl border border-[var(--color-border-soft)] bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_18px_48px_rgba(28,27,24,0.08)] backdrop-blur-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="m-0 text-sm font-semibold text-[var(--color-ink-strong)]">Готово к сохранению?</p>
                  <p className="mb-0 mt-1 text-sm text-[var(--color-ink-muted)]">
                    Пока сохраняются только title, parentArticleId и контент блоков. Infobox и metadata останутся placeholder-элементами.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setIsImportOpen(true)} disabled={isLocked || mutation.isPending}>
                    Импорт Markdown
                  </Button>
                  <Button variant="primary" onClick={saveArticle} disabled={isLocked || mutation.isPending}>
                    <Save size={14} />
                    {mutation.isPending ? 'Сохранение...' : 'Сохранить статью'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <EditorHelpRail
          blockCount={blocks.length}
          totalTextParts={totalVersions}
          characterCount={characterCount}
        />
      </div>

      {isImportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,20,18,0.35)] p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-[var(--color-border-soft)] bg-white shadow-[0_30px_80px_rgba(28,27,24,0.18)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-6 py-5">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">Import</p>
                <h2 className="m-0 text-xl font-semibold text-[var(--color-ink-strong)]">{t.importModalTitle}</h2>
              </div>
              <button type="button" onClick={() => setIsImportOpen(false)} className="rounded-lg p-2 text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-page-panel)] hover:text-[var(--color-ink-strong)]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <p className="m-0 text-sm leading-6 text-[var(--color-ink-muted)]">
                Заголовки `##` и `###` будут импортированы как отдельные блоки. Остальной текст станет обычными параграфами.
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
              <Button variant="ghost" onClick={() => setIsImportOpen(false)}>Отмена</Button>
              <Button variant="primary" onClick={importMarkdownAsBlocks}>Импортировать</Button>
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
                <p className="m-0 text-sm font-semibold text-[var(--color-ink-strong)]">ИИ улучшает всю статью</p>
                <p className="mb-0 mt-1 text-sm text-[var(--color-ink-muted)]">Редактирование временно заблокировано до завершения обработки.</p>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default AddArticlePage;
