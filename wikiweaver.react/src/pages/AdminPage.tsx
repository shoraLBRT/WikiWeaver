import React, { useMemo, useState } from 'react';
import { Bot, Check, ChevronLeft, ChevronRight, Copy, Database, FileText, GitBranch, HelpCircle, KeyRound, Settings2, Sparkles, Trash2, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  checkAiConnection,
  cleanupDemoData,
  getAiProviderSettings,
  getArticles,
  getParagraphs,
  updateAiProviderSettings,
} from '../services/adminService';
import { generateInviteToken } from '../services/authService';
import {
  ARTICLE_UI_MODE_STORAGE_KEY,
  DEFAULT_ARTICLE_UI_MODE,
  isParagraphUiMode,
  type ParagraphUiMode,
} from '../constants/ArticleUiConstants';
import { APP_CONSTANTS } from '../constants/AppConstants';
import { formatMessage } from '../localization';
import { useLocale } from '../localization/hooks';
import { cn } from '../shared/lib/cn';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { Input } from '../shared/ui/Input';
import { Textarea } from '../shared/ui/Textarea';

type AdminSection = 'articles' | 'displayMode' | 'aiProvider' | 'adminAccess' | 'cleanup';
type Notice = { tone: 'success' | 'warning' | 'error'; message: string };
type AiSettingsState = {
  baseUrl: string;
  model: string;
  isEnabled: boolean;
  apiKey: string;
  clearApiKey: boolean;
  markdownStylingSystemPrompt: string;
};

const noticeClasses: Record<Notice['tone'], string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-800',
};

const getInitialUiMode = (): ParagraphUiMode => {
  const savedMode = localStorage.getItem(ARTICLE_UI_MODE_STORAGE_KEY);
  return isParagraphUiMode(savedMode) ? savedMode : DEFAULT_ARTICLE_UI_MODE;
};

const AdminPage: React.FC = () => {
  const locale = useLocale();
  const t = locale.adminPage;
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<AdminSection>('articles');
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [cleanupConfirmation, setCleanupConfirmation] = useState('');
  const [paragraphUiMode, setParagraphUiMode] = useState<ParagraphUiMode>(getInitialUiMode);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [aiCheckResult, setAiCheckResult] = useState<{ message: string; styledText: string } | null>(null);
  const [aiSettingsFormOverride, setAiSettingsFormOverride] = useState<AiSettingsState | null>(null);
  const [previewAlternativeIndex, setPreviewAlternativeIndex] = useState(0);
  const [isDefaultPromptModalOpen, setIsDefaultPromptModalOpen] = useState(false);

  const confirmationPhrase = t.cleanupConfirmationPhrase;
  const articlesQuery = useQuery({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_ARTICLES], queryFn: getArticles });
  const paragraphsQuery = useQuery({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_PARAGRAPHS], queryFn: getParagraphs });
  const aiSettingsQuery = useQuery({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_AI_SETTINGS], queryFn: getAiProviderSettings });

  const aiSettingsDefaults = useMemo<AiSettingsState>(
    () => ({
      baseUrl: aiSettingsQuery.data?.baseUrl ?? '',
      model: aiSettingsQuery.data?.model ?? '',
      isEnabled: aiSettingsQuery.data?.isEnabled ?? false,
      apiKey: '',
      clearApiKey: false,
      markdownStylingSystemPrompt: aiSettingsQuery.data?.markdownStylingSystemPrompt ?? '',
    }),
    [aiSettingsQuery.data],
  );

  const aiSettingsForm = aiSettingsFormOverride ?? aiSettingsDefaults;

  const updateAiSettingsForm = (updater: (current: AiSettingsState) => AiSettingsState) => {
    setAiSettingsFormOverride((current) => updater(current ?? aiSettingsDefaults));
  };

  const showNotice = (tone: Notice['tone'], message: string) => {
    setNotice({ tone, message });
  };

  const refreshContentQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_ARTICLES] }),
      queryClient.invalidateQueries({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_PARAGRAPHS] }),
      queryClient.invalidateQueries({ queryKey: [APP_CONSTANTS.QUERY_KEYS.NAVIGATION_TREE] }),
    ]);
  };

  const cleanupMutation = useMutation({
    mutationFn: cleanupDemoData,
    onSuccess: async (result) => {
      showNotice(
        'success',
        formatMessage(t.cleanupDone, {
          articles: result.deletedArticles,
          paragraphs: result.deletedParagraphs,
        }),
      );
      setCleanupConfirmation('');
      setIsCleanupModalOpen(false);
      await refreshContentQueries();
    },
    onError: (error) => showNotice('error', `${t.cleanupFailed}: ${(error as Error).message}`),
  });

  const aiSettingsMutation = useMutation({
    mutationFn: updateAiProviderSettings,
    onSuccess: async () => {
      showNotice('success', t.aiSettingsUpdated);
      setAiSettingsFormOverride(null);
      await queryClient.invalidateQueries({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_AI_SETTINGS] });
    },
    onError: (error) => showNotice('error', `${t.aiSettingsUpdateFailed}: ${(error as Error).message}`),
  });

  const inviteTokenMutation = useMutation({
    mutationFn: generateInviteToken,
    onSuccess: (result) => {
      setInviteToken(result.token);
      showNotice('success', t.inviteTokenGenerated);
    },
    onError: (error) => showNotice('error', `${t.inviteTokenGenerateFailed}: ${(error as Error).message}`),
  });

  const aiConnectionCheckMutation = useMutation({
    mutationFn: checkAiConnection,
    onSuccess: (result) => {
      setAiCheckResult(result);
      showNotice('success', result.message);
    },
    onError: (error) => showNotice('error', `${t.aiCheckFailed}: ${(error as Error).message}`),
  });

  const onParagraphUiModeChange = (value: ParagraphUiMode) => {
    setParagraphUiMode(value);
    localStorage.setItem(ARTICLE_UI_MODE_STORAGE_KEY, value);
    showNotice('success', locale.articlePage.uiModeUpdated);
  };

  const saveAiSettings = () => {
    if (!aiSettingsForm.baseUrl.trim()) {
      showNotice('warning', t.baseUrlRequired);
      return;
    }

    if (!aiSettingsForm.model.trim()) {
      showNotice('warning', t.modelRequired);
      return;
    }

    aiSettingsMutation.mutate({
      baseUrl: aiSettingsForm.baseUrl.trim(),
      model: aiSettingsForm.model.trim(),
      isEnabled: aiSettingsForm.isEnabled,
      apiKey: aiSettingsForm.apiKey.trim() || undefined,
      clearApiKey: aiSettingsForm.clearApiKey,
      markdownStylingSystemPrompt: aiSettingsForm.markdownStylingSystemPrompt.trim() || null,
    });
  };

  // Article statistics
  const articles = useMemo(() => articlesQuery.data ?? [], [articlesQuery.data]);
  const articleCount = articles.length;
  const articlesWithContent = articles.filter((a) => a.hasContent).length;
  const emptyArticles = articleCount - articlesWithContent;

  // Article to paragraph count mapping
  const articleParagraphCount = useMemo(() => {
    const paragraphs = paragraphsQuery.data ?? [];
    const countByArticle = new Map<number, number>();
    articles.forEach((article) => {
      countByArticle.set(article.id, 0);
    });
    paragraphs.forEach((para) => {
      countByArticle.set(para.articleId, (countByArticle.get(para.articleId) ?? 0) + 1);
    });
    return countByArticle;
  }, [articles, paragraphsQuery.data]);

  // Top articles by paragraph count
  const topArticlesByParagraphs = useMemo(() => {
    return articles
      .map((article) => ({
        article,
        paragraphCount: articleParagraphCount.get(article.id) ?? 0,
      }))
      .sort((a, b) => b.paragraphCount - a.paragraphCount)
      .slice(0, 5);
  }, [articles, articleParagraphCount]);
  const aiStatusHint = aiSettingsQuery.isLoading
    ? t.aiConfigurationDescription
    : !aiSettingsQuery.data?.isEnabled
      ? t.aiStatusOff
      : aiSettingsQuery.data.hasApiKey
        ? t.aiStatusReady
        : t.aiStatusNeedsKey;
  const currentUiModeLabel = paragraphUiMode === 'arrows' ? t.uiModeArrows : t.uiModeNumbers;

  const navItems: { id: AdminSection; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: 'articles',
      label: t.articlesTab,
      icon: <Database size={18} />,
      description: 'View and manage articles',
    },
    {
      id: 'displayMode',
      label: t.uiTab,
      icon: <Settings2 size={18} />,
      description: 'Display settings',
    },
    {
      id: 'aiProvider',
      label: t.aiTab,
      icon: <Bot size={18} />,
      description: 'AI configuration',
    },
    {
      id: 'adminAccess',
      label: t.inviteTokenTitle,
      icon: <KeyRound size={18} />,
      description: 'Admin invitations',
    },
    {
      id: 'cleanup',
      label: t.maintenanceTitle,
      icon: <Trash2 size={18} />,
      description: 'Danger zone',
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-var(--layout-header-height))] bg-[var(--color-page-bg)]">
      {/* Sidebar */}
      <div className="w-[var(--layout-sidebar-width)] border-r border-[var(--color-border-soft)] bg-[var(--color-surface)]">
        <div className="sticky top-[var(--layout-header-height)] space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                'w-full text-left rounded-xl px-4 py-3 transition-all duration-200 flex items-start gap-3 border',
                activeSection === item.id
                  ? 'bg-[var(--color-brand-forest-soft)] border-[var(--color-brand-forest)] text-[var(--color-brand-forest)]'
                  : 'bg-transparent border-transparent text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink-strong)]',
              )}
            >
              <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="text-xs opacity-75">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8 sm:px-8">
          <div className="space-y-6">
            {/* Notice */}
          {notice ? (
            <div className={`rounded-xl border px-4 py-3 text-sm ${noticeClasses[notice.tone]}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="m-0">{notice.message}</p>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : null}

          {/* Articles Section */}
          {activeSection === 'articles' ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink-strong)]">{t.articlesTab}</h1>
                <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Overview of your article structure and content distribution.</p>
              </div>

              {/* Metrics Grid */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-subtle)]">
                        Total Articles
                      </p>
                      <p className="mt-2 text-3xl font-bold text-[var(--color-ink-strong)]">
                        {articlesQuery.isLoading ? '...' : articleCount}
                      </p>
                    </div>
                    <Database size={32} className="text-[var(--color-brand-forest)] opacity-30" />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-subtle)]">
                        With Content
                      </p>
                      <p className="mt-2 text-3xl font-bold text-[var(--color-brand-forest)]">
                        {articlesQuery.isLoading ? '...' : articlesWithContent}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                        {articleCount > 0 ? `${Math.round((articlesWithContent / articleCount) * 100)}%` : '0%'}
                      </p>
                    </div>
                    <Check size={32} className="text-[var(--color-brand-forest)] opacity-30" />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-subtle)]">
                        Empty (Placeholders)
                      </p>
                      <p className="mt-2 text-3xl font-bold text-[var(--color-ink-muted)]">
                        {articlesQuery.isLoading ? '...' : emptyArticles}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                        {articleCount > 0 ? `${Math.round((emptyArticles / articleCount) * 100)}%` : '0%'}
                      </p>
                    </div>
                    <FileText size={32} className="text-[var(--color-ink-muted)] opacity-30" />
                  </div>
                </Card>
              </div>

              {/* Top Articles by Paragraphs */}
              <Card className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-[var(--color-ink-strong)]">Top Articles by Paragraph Count</h3>
                {paragraphsQuery.isLoading ? (
                  <p className="text-sm text-[var(--color-ink-muted)]">Loading...</p>
                ) : topArticlesByParagraphs.length === 0 ? (
                  <p className="text-sm text-[var(--color-ink-muted)]">No articles yet.</p>
                ) : (
                  <div className="space-y-2">
                    {topArticlesByParagraphs.map(({ article, paragraphCount }, index) => (
                      <div key={article.id} className="flex items-center justify-between rounded-lg bg-[var(--color-surface-muted)] p-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-forest)] text-xs font-semibold text-white">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--color-ink-strong)]">{article.title}</p>
                            <p className="text-xs text-[var(--color-ink-muted)]">{article.hasContent ? 'Published' : 'Placeholder'}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-lg font-bold text-[var(--color-brand-forest)]">{paragraphCount}</p>
                          <p className="text-xs text-[var(--color-ink-muted)]">paragraph{paragraphCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          ) : null}

          {/* Display Mode Section */}
          {activeSection === 'displayMode' ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink-strong)]">{t.uiTab}</h1>
                <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Choose how paragraph alternatives are displayed.</p>
              </div>

              {/* Preview Example - Styled like VersionedParagraphBlock */}
              <section className="my-4 rounded-2xl border border-[#d9ecdf] bg-[#f7fcf9] transition-colors duration-200">
                {/* Header with label */}
                <div className="px-4 pt-3 pb-2">
                  <div className="mb-2 flex items-center gap-1.5">
                    <GitBranch size={11} className="text-[var(--color-brand-forest)]" />
                    <span className="text-[10.5px] font-semibold tracking-[0.03em] text-[var(--color-brand-forest)]">
                      Versioned block: set 1
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="text-[14.5px] leading-7 text-[var(--color-ink-strong)] px-4">
                  <p>
                    Wikipedia is a free online encyclopedia,{' '}
                    {previewAlternativeIndex === 0 ? (
                      <span className="font-medium text-[var(--color-brand-forest)]">
                        created and edited by volunteers
                      </span>
                    ) : (
                      <span className="font-medium text-[var(--color-brand-forest)]">
                        created collaboratively by communities
                      </span>
                    )}
                    , around the world.
                  </p>
                </div>

                {/* Controls - Arrows Mode */}
                {paragraphUiMode === 'arrows' ? (
                  <div className="flex items-center justify-end gap-1.5 px-3 pb-3 pt-1">
                    <span className="mr-1 text-[10px] text-[var(--color-ink-subtle)]">Versions:</span>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#cfe3d6] bg-white text-[var(--color-brand-forest)] transition-colors hover:bg-[#eef7f2]"
                      onClick={() => setPreviewAlternativeIndex((prev) => (prev === 0 ? 1 : 0))}
                      title="Previous version"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="min-w-12 text-center text-[11px] font-semibold text-[var(--color-ink-muted)]">
                      {previewAlternativeIndex + 1} / 2
                    </span>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#cfe3d6] bg-white text-[var(--color-brand-forest)] transition-colors hover:bg-[#eef7f2]"
                      onClick={() => setPreviewAlternativeIndex((prev) => (prev === 0 ? 1 : 0))}
                      title="Next version"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-1.5 px-3 pb-3 pt-1">
                    <span className="mr-1 text-[10px] text-[var(--color-ink-subtle)]">Versions:</span>
                    {[0, 1].map((index) => (
                      <button
                        key={index}
                        className="rounded border px-2 py-0.5 text-[11px] font-semibold transition-colors"
                        style={{
                          backgroundColor: previewAlternativeIndex === index ? 'var(--color-brand-forest)' : 'white',
                          color: previewAlternativeIndex === index ? 'white' : 'var(--color-brand-forest)',
                          borderColor: previewAlternativeIndex === index ? 'var(--color-brand-forest)' : '#cfe3d6',
                        }}
                        onClick={() => setPreviewAlternativeIndex(index)}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Mode Selection */}
              <Card className="p-6">
                <div className="mb-6 rounded-lg bg-[var(--color-surface-muted)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-subtle)]">
                    Active Mode
                  </p>
                  <p className="mt-1 text-xl font-bold text-[var(--color-ink-strong)]">{currentUiModeLabel}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="mode-arrows"
                      name="ui-mode"
                      checked={paragraphUiMode === 'arrows'}
                      onChange={() => onParagraphUiModeChange('arrows')}
                      className="h-4 w-4 accent-[var(--color-brand-forest)]"
                    />
                    <label htmlFor="mode-arrows" className="flex-1 cursor-pointer text-sm font-medium text-[var(--color-ink-strong)]">
                      {t.uiModeArrows} <span className="ml-2 text-xs text-[var(--color-ink-muted)]">Show alternatives with arrows</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="mode-numbers"
                      name="ui-mode"
                      checked={paragraphUiMode === 'numbers'}
                      onChange={() => onParagraphUiModeChange('numbers')}
                      className="h-4 w-4 accent-[var(--color-brand-forest)]"
                    />
                    <label htmlFor="mode-numbers" className="flex-1 cursor-pointer text-sm font-medium text-[var(--color-ink-strong)]">
                      {t.uiModeNumbers} <span className="ml-2 text-xs text-[var(--color-ink-muted)]">Show alternatives with numbers</span>
                    </label>
                  </div>
                </div>
              </Card>
            </div>
          ) : null}

          {/* AI Provider Section */}
          {activeSection === 'aiProvider' ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink-strong)]">{t.aiTab}</h1>
                <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Configure your AI provider connection and customize the markdown styling behavior.</p>
              </div>

              <Card className="border-[var(--color-brand-forest-soft)] bg-[var(--color-brand-forest-soft)]/20 p-6">
                <div className="flex gap-4">
                  <Bot size={24} className="flex-shrink-0 text-[var(--color-brand-forest)]" />
                  <div>
                    <h3 className="font-semibold text-[var(--color-ink-strong)]">{t.aiCapabilitiesTitle}</h3>
                    <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                      {t.aiCapabilitiesDescription}
                    </p>
                    <ul className="mt-3 space-y-1 text-sm text-[var(--color-ink-muted)]">
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--color-brand-forest)] font-bold">•</span>
                        <span>{t.aiCapability1}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--color-brand-forest)] font-bold">•</span>
                        <span>{t.aiCapability2}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--color-brand-forest)] font-bold">•</span>
                        <span>{t.aiCapability3}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--color-brand-forest)] font-bold">•</span>
                        <span>{t.aiCapability4}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="mb-6 rounded-lg bg-[var(--color-surface-muted)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-subtle)]">Status</p>
                  <p className="mt-1 text-base font-semibold text-[var(--color-ink-strong)]">{aiStatusHint}</p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={aiSettingsForm.isEnabled}
                      onChange={(event) => updateAiSettingsForm((current) => ({ ...current, isEnabled: event.target.checked }))}
                      className="h-4 w-4 accent-[var(--color-brand-forest)]"
                    />
                    <span className="text-sm font-medium text-[var(--color-ink-strong)]">{t.aiEnabled}</span>
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-subtle)]">
                        {t.baseUrl}
                      </label>
                      <Input
                        value={aiSettingsForm.baseUrl}
                        onChange={(event) => updateAiSettingsForm((current) => ({ ...current, baseUrl: event.target.value }))}
                        disabled={!aiSettingsForm.isEnabled}
                        placeholder={t.baseUrlPlaceholder}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-subtle)]">
                        {t.model}
                      </label>
                      <Input
                        value={aiSettingsForm.model}
                        onChange={(event) => updateAiSettingsForm((current) => ({ ...current, model: event.target.value }))}
                        disabled={!aiSettingsForm.isEnabled}
                        placeholder={t.modelPlaceholder}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-subtle)]">
                      {t.apiKey}
                    </label>
                    <Input
                      type="password"
                      value={aiSettingsForm.apiKey}
                      onChange={(event) => updateAiSettingsForm((current) => ({ ...current, apiKey: event.target.value }))}
                      disabled={!aiSettingsForm.isEnabled}
                      placeholder={t.apiKeyPlaceholder}
                    />
                    <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">{t.apiKeyHint}</p>
                  </div>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={aiSettingsForm.clearApiKey}
                      onChange={(event) => updateAiSettingsForm((current) => ({ ...current, clearApiKey: event.target.checked }))}
                      className="h-4 w-4 accent-[var(--color-brand-forest)]"
                    />
                    <span className="text-sm text-[var(--color-ink-muted)]">{t.deleteApiKey}</span>
                  </label>

                  <div className="border-t border-[var(--color-border-soft)] pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-subtle)]">
                        {t.markdownStylingPromptLabel}
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsDefaultPromptModalOpen(true)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[var(--color-brand-forest)] transition-colors hover:bg-[var(--color-brand-forest-soft)]"
                        title={t.viewDefaultPrompt}
                      >
                        <HelpCircle size={14} />
                        {t.viewDefaultPrompt}
                      </button>
                    </div>
                    <Textarea
                      value={aiSettingsForm.markdownStylingSystemPrompt}
                      onChange={(event) => updateAiSettingsForm((current) => ({ ...current, markdownStylingSystemPrompt: event.target.value }))}
                      disabled={!aiSettingsForm.isEnabled}
                      placeholder={t.markdownStylingPromptPlaceholder}
                      rows={6}
                      className="font-mono text-[13px] leading-5"
                    />
                    <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
                      {t.markdownStylingPromptHint}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button variant="primary" onClick={saveAiSettings} disabled={aiSettingsMutation.isPending}>
                      <Check size={14} />
                      {aiSettingsMutation.isPending ? '...' : t.saveAiSettings}
                    </Button>
                    <Button onClick={() => aiConnectionCheckMutation.mutate()} disabled={aiConnectionCheckMutation.isPending}>
                      <Sparkles size={14} />
                      {aiConnectionCheckMutation.isPending ? '...' : t.checkAiConnection}
                    </Button>
                  </div>
                </div>

                {aiCheckResult ? (
                  <div className="mt-6 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
                    <p className="font-semibold text-[var(--color-ink-strong)]">{t.aiCheckResultTitle}</p>
                    <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{aiCheckResult.message}</p>
                    <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-subtle)]">
                      {t.aiModelExample}
                    </p>
                    <Textarea readOnly value={aiCheckResult.styledText} rows={6} className="font-mono text-[13px] leading-6" />
                  </div>
                ) : null}
              </Card>
            </div>
          ) : null}

          {/* Default Prompt Modal */}
          {isDefaultPromptModalOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,20,18,0.35)] p-4 backdrop-blur-sm">
              <Card className="w-full max-w-2xl">
                <div className="border-b border-[var(--color-border-soft)] px-6 py-5">
                  <h2 className="m-0 text-xl font-semibold text-[var(--color-ink-strong)]">{t.defaultPromptModalTitle}</h2>
                </div>
                <div className="space-y-6 px-6 py-5">
                  <div className="rounded-lg bg-[var(--color-brand-forest-soft)] p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-brand-forest)]">
                      <HelpCircle size={16} />
                      {t.currentPrompt}
                    </p>
                    <div className="rounded bg-white p-3">
                      <p className="m-0 text-xs text-[var(--color-ink-muted)]">
                        {aiSettingsForm.markdownStylingSystemPrompt
                          ? `${t.customPrompt} — ${aiSettingsForm.markdownStylingSystemPrompt.substring(0, 100)}...`
                          : t.defaultPrompt}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-subtle)]">
                      {t.defaultPrompt}
                    </p>
                    <Textarea
                      readOnly
                      value={t.defaultMarkdownPrompt}
                      rows={8}
                      className="font-mono text-[12px] leading-5 bg-[var(--color-surface-muted)]"
                    />
                  </div>

                  <p className="m-0 text-xs text-[var(--color-ink-muted)]">
                    💡 {t.promptReplacementWarning}
                  </p>
                </div>
                <div className="flex justify-end gap-3 border-t border-[var(--color-border-soft)] px-6 py-4">
                  <Button variant="ghost" onClick={() => setIsDefaultPromptModalOpen(false)}>
                    {locale.common.cancel}
                  </Button>
                </div>
              </Card>
            </div>
          ) : null}

          {/* Admin Access Section */}
          {activeSection === 'adminAccess' ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink-strong)]">{t.inviteTokenTitle}</h1>
                <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Generate tokens to invite new administrators.</p>
              </div>
              <Card className="p-6">
                <p className="mb-4 text-sm text-[var(--color-ink-muted)]">{t.inviteTokenHint}</p>

                <Button onClick={() => inviteTokenMutation.mutate()} disabled={inviteTokenMutation.isPending} variant="primary">
                  <KeyRound size={14} />
                  {inviteTokenMutation.isPending ? '...' : t.generateInviteToken}
                </Button>

                {inviteToken ? (
                  <div className="mt-6 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-subtle)]">
                      {t.inviteTokenValueLabel}
                    </p>
                    <code className="mb-3 block break-all text-sm text-[var(--color-ink-strong)]">{inviteToken}</code>
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        await navigator.clipboard.writeText(inviteToken);
                        showNotice('success', t.inviteTokenCopied);
                      }}
                    >
                      <Copy size={14} />
                      {locale.common.copy}
                    </Button>
                  </div>
                ) : null}
              </Card>
            </div>
          ) : null}

          {/* Cleanup Section */}
          {activeSection === 'cleanup' ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-red-700">{t.maintenanceTitle}</h1>
                <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                  This action is permanent and cannot be undone.
                </p>
              </div>
              <Card className="border-red-200 bg-red-50 p-6">
                <div className="mb-4 rounded-lg bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-red-600">Warning</p>
                  <p className="mt-2 text-sm text-red-900">{t.maintenanceDescription}</p>
                </div>

                <Button onClick={() => setIsCleanupModalOpen(true)} className="bg-red-600 hover:bg-red-700">
                  <Trash2 size={14} />
                  {t.deleteAll}
                </Button>
              </Card>
            </div>
          ) : null}
          </div>
        </div>

        {/* Cleanup Modal */}
        {isCleanupModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,20,18,0.35)] p-4 backdrop-blur-sm">
            <Card className="w-full max-w-xl">
              <div className="border-b border-[var(--color-border-soft)] px-6 py-5">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-red-500">{t.cleanupDangerZone}</p>
                <h2 className="m-0 text-xl font-semibold text-[var(--color-ink-strong)]">{t.cleanupModalTitle}</h2>
              </div>
              <div className="space-y-4 px-6 py-5">
                <p className="m-0 text-sm leading-7 text-[var(--color-ink-muted)]">
                  {formatMessage(t.cleanupModalHint, { phrase: confirmationPhrase })}
                </p>
                <Input
                  value={cleanupConfirmation}
                  onChange={(event) => setCleanupConfirmation(event.target.value)}
                  placeholder={confirmationPhrase}
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-[var(--color-border-soft)] px-6 py-4">
                <Button variant="ghost" onClick={() => setIsCleanupModalOpen(false)}>
                  {locale.common.cancel}
                </Button>
                <Button
                  onClick={() => cleanupMutation.mutate()}
                  disabled={cleanupConfirmation !== confirmationPhrase || cleanupMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {cleanupMutation.isPending ? '...' : t.cleanupModalOk}
                </Button>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminPage;
