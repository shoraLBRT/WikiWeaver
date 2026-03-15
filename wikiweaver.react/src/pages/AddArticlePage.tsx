import React, { useMemo, useState } from 'react';
import { Sparkles, Upload, Plus, Save, X } from 'lucide-react';
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
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { Input } from '../shared/ui/Input';
import { Textarea } from '../shared/ui/Textarea';

type Notice = {
  tone: 'success' | 'warning' | 'error';
  message: string;
};

const noticeClasses: Record<Notice['tone'], string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-800',
};

const AddArticlePage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [parentArticleId, setParentArticleId] = useState<number | null>(null);
  const [groups, setGroups] = useState<ParagraphGroupDraft[]>([createEmptyGroup(1)]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);

  const t = locale.addArticlePage;

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
    const group = groups.find((item) => item.order === groupOrder);
    const alternative = group?.alternatives.find((item) => item.localId === localId);

    if (!alternative || !alternative.content.trim()) {
      showNotice('warning', t.warnings.fillBeforeAi);
      return;
    }

    try {
      const result = await styleMutation.mutateAsync(alternative.content);
      setAlternativeContent(groupOrder, localId, result.styledText);
      showNotice('success', `${t.aiStyledParagraph}: ${groupOrder}`);
    } catch (error) {
      showNotice('error', `${t.aiStyleFailed}: ${(error as Error).message}`);
    }
  };

  const improveAllWithAi = async () => {
    const queue = collectAiImprovementQueue(groups);

    if (queue.length === 0) {
      showNotice('warning', t.warnings.noParagraphsForAi);
      return;
    }

    try {
      for (const item of queue) {
        const result = await styleMutation.mutateAsync(item.content);
        setAlternativeContent(item.groupOrder, item.localId, result.styledText);
      }

      showNotice('success', `${t.styledVersions}: ${queue.length}`);
    } catch (error) {
      showNotice('error', `${t.aiStyleFailed}: ${(error as Error).message}`);
    }
  };

  const saveArticle = () => {
    if (!title.trim()) {
      showNotice('warning', t.warnings.titleRequired);
      return;
    }

    const paragraphs = buildParagraphDtos(groups);

    if (paragraphs.length === 0) {
      showNotice('warning', t.warnings.paragraphRequired);
      return;
    }

    const emptyDefaults = hasGroupWithoutFilledDefault(groups);

    if (emptyDefaults) {
      showNotice('warning', t.warnings.defaultRequired);
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
      showNotice('warning', t.warnings.importEmpty);
      return;
    }

    setGroups(importedGroups);
    setIsImportOpen(false);
    setImportText('');
    showNotice('success', `${t.importedParagraphs}: ${importedGroups.length}`);
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-[var(--color-border-soft)] bg-[linear-gradient(135deg,rgba(45,106,79,0.12),rgba(255,255,255,0.8))] shadow-[0_28px_80px_rgba(28,27,24,0.08)]">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:px-8">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-forest)]">Editor workspace</p>
            <h1 className="m-0 text-3xl font-bold tracking-[-0.03em] text-[var(--color-ink-strong)]">{t.title}</h1>
            <p className="mb-0 mt-3 max-w-3xl text-sm leading-7 text-[var(--color-ink-muted)]">{t.modelDescription}</p>
          </div>

          <div className="rounded-[24px] border border-[var(--color-border-soft)] bg-[rgba(255,255,255,0.85)] p-5 shadow-sm">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">Document stats</p>
            <div className="space-y-2 text-sm text-[var(--color-ink-default)]">
              <div className="flex items-center justify-between">
                <span>{t.paragraphStats}</span>
                <strong>{groups.length}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>{t.versionsStats}</span>
                <strong>{totalAlternatives}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>AI</span>
                <strong>{styleMutation.isPending ? 'busy' : 'ready'}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {notice ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${noticeClasses[notice.tone]}`}>
          <div className="flex items-start justify-between gap-3">
            <p className="m-0">{notice.message}</p>
            <button type="button" onClick={() => setNotice(null)} className="rounded-md p-1 opacity-70 transition-opacity hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        </div>
      ) : null}

      <Card className="overflow-hidden border border-[var(--color-border-soft)] bg-white shadow-[0_24px_80px_rgba(28,27,24,0.06)]">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:px-8">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
                {locale.common.title}
              </label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t.articleTitlePlaceholder}
                className="h-12 rounded-2xl text-base"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
                Parent article id
              </label>
              <Input
                type="number"
                min={1}
                value={parentArticleId ?? ''}
                onChange={(event) => {
                  const value = event.target.value.trim();
                  setParentArticleId(value ? Number(value) : null);
                }}
                placeholder={t.parentArticleIdPlaceholder}
                className="h-11 max-w-xs rounded-2xl"
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">Quick actions</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <Button onClick={() => setIsImportOpen(true)}>
                <Upload size={14} />
                {t.importDraft}
              </Button>
              <Button onClick={improveAllWithAi} disabled={styleMutation.isPending}>
                <Sparkles size={14} />
                {t.improveAllAi}
              </Button>
              <Button variant="primary" onClick={saveArticle} disabled={mutation.isPending}>
                <Save size={14} />
                {mutation.isPending ? '...' : t.saveArticle}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        {groups.map((group) => (
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
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap gap-3 rounded-2xl border border-[var(--color-border-soft)] bg-[rgba(255,255,255,0.9)] p-3 shadow-[0_18px_48px_rgba(28,27,24,0.08)] backdrop-blur-sm">
        <Button onClick={addParagraphGroup}>
          <Plus size={14} />
          {t.addParagraph}
        </Button>
        <Button variant="primary" onClick={saveArticle} disabled={mutation.isPending}>
          <Save size={14} />
          {mutation.isPending ? '...' : t.saveArticle}
        </Button>
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
              <p className="m-0 text-sm leading-6 text-[var(--color-ink-muted)]">{t.importHint}</p>
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
              <Button variant="primary" onClick={importMarkdownAsParagraphs}>{t.importButton}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AddArticlePage;
