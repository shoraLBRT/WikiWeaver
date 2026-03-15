import React, { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Check,
  Copy,
  Database,
  FileText,
  KeyRound,
  RefreshCcw,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from 'lucide-react';
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
import type { ArticleReadDto, ParagraphReadDto } from '../shared/types/ApiTypes';
import {
  ARTICLE_UI_MODE_STORAGE_KEY,
  DEFAULT_ARTICLE_UI_MODE,
  isParagraphUiMode,
  type ParagraphUiMode,
} from '../constants/ArticleUiConstants';
import { APP_CONSTANTS } from '../constants/AppConstants';
import { formatMessage, locale } from '../localization';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { Input } from '../shared/ui/Input';
import { Textarea } from '../shared/ui/Textarea';

type AdminTab = 'content' | 'settings';
type ContentTab = 'articles' | 'paragraphs' | 'create-article' | 'cleanup';
type Notice = { tone: 'success' | 'warning' | 'error'; message: string };
type AiSettingsState = {
  baseUrl: string;
  model: string;
  isEnabled: boolean;
  apiKey: string;
  clearApiKey: boolean;
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
  const t = locale.adminPage;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('content');
  const [activeContentTab, setActiveContentTab] = useState<ContentTab>('articles');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [cleanupConfirmation, setCleanupConfirmation] = useState('');
  const [paragraphUiMode, setParagraphUiMode] = useState<ParagraphUiMode>(getInitialUiMode);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [aiCheckResult, setAiCheckResult] = useState<{ message: string; styledText: string } | null>(null);
  const [aiSettingsForm, setAiSettingsForm] = useState<AiSettingsState>({
    baseUrl: '',
    model: '',
    isEnabled: false,
    apiKey: '',
    clearApiKey: false,
  });

  const confirmationPhrase = t.cleanupConfirmationPhrase;
  const articlesQuery = useQuery({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_ARTICLES], queryFn: getArticles });
  const paragraphsQuery = useQuery({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_PARAGRAPHS], queryFn: getParagraphs });
  const aiSettingsQuery = useQuery({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_AI_SETTINGS], queryFn: getAiProviderSettings });

  useEffect(() => {
    if (!aiSettingsQuery.data) {
      return;
    }

    setAiSettingsForm({
      baseUrl: aiSettingsQuery.data.baseUrl,
      model: aiSettingsQuery.data.model,
      isEnabled: aiSettingsQuery.data.isEnabled,
      apiKey: '',
      clearApiKey: false,
    });
  }, [aiSettingsQuery.data]);

  const showNotice = (tone: Notice['tone'], message: string) => {
    setNotice({ tone, message });
  };

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
      showNotice('success', t.articleDeleted);
      await refreshAll();
    },
    onError: (error) => showNotice('error', `${t.articleDeleteFailed}: ${(error as Error).message}`),
  });

  const paragraphDeleteMutation = useMutation({
    mutationFn: deleteParagraph,
    onSuccess: async () => {
      showNotice('success', t.paragraphDeleted);
      await refreshAll();
    },
    onError: (error) => showNotice('error', `${t.paragraphDeleteFailed}: ${(error as Error).message}`),
  });

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
      await refreshAll();
    },
    onError: (error) => showNotice('error', `${t.cleanupFailed}: ${(error as Error).message}`),
  });

  const aiSettingsMutation = useMutation({
    mutationFn: updateAiProviderSettings,
    onSuccess: async () => {
      showNotice('success', t.aiSettingsUpdated);
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
    });
  };

  const renderArticlesTable = (rows: ArticleReadDto[]) => {
    if (articlesQuery.isLoading) {
      return <div className="py-10 text-center text-sm text-[var(--color-ink-subtle)]">Загрузка...</div>;
    }

    return (
      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border-soft)] bg-white">
        <table className="min-w-[640px] w-full border-collapse text-left text-sm">
          <thead className="bg-[var(--color-page-panel)] text-[var(--color-ink-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">{locale.common.id}</th>
              <th className="px-4 py-3 font-medium">{locale.common.title}</th>
              <th className="px-4 py-3 font-medium">{t.parentId}</th>
              <th className="px-4 py-3 font-medium">{locale.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((record) => (
              <tr key={record.id} className="border-t border-[var(--color-border-soft)]">
                <td className="px-4 py-3">{record.id}</td>
                <td className="px-4 py-3 font-medium text-[var(--color-ink-strong)]">{record.title}</td>
                <td className="px-4 py-3 text-[var(--color-ink-muted)]">{record.parentArticleId ?? t.root}</td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      if (window.confirm(`${t.deleteArticle}: "${record.title}"?`)) {
                        articleDeleteMutation.mutate(record.id);
                      }
                    }}
                  >
                    <Trash2 size={13} />
                    {locale.common.delete}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderParagraphsTable = (rows: ParagraphReadDto[]) => {
    if (paragraphsQuery.isLoading) {
      return <div className="py-10 text-center text-sm text-[var(--color-ink-subtle)]">Загрузка...</div>;
    }

    return (
      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border-soft)] bg-white">
        <table className="min-w-[760px] w-full border-collapse text-left text-sm">
          <thead className="bg-[var(--color-page-panel)] text-[var(--color-ink-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">{locale.common.id}</th>
              <th className="px-4 py-3 font-medium">{t.articleId}</th>
              <th className="px-4 py-3 font-medium">{t.order}</th>
              <th className="px-4 py-3 font-medium">{t.content}</th>
              <th className="px-4 py-3 font-medium">{locale.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((record) => (
              <tr key={record.id} className="border-t border-[var(--color-border-soft)]">
                <td className="px-4 py-3">{record.id}</td>
                <td className="px-4 py-3">{record.articleId}</td>
                <td className="px-4 py-3">{record.order}</td>
                <td className="max-w-xl px-4 py-3 text-[var(--color-ink-muted)]">{record.content}</td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      if (window.confirm(`${t.deleteParagraph} #${record.id}?`)) {
                        paragraphDeleteMutation.mutate(record.id);
                      }
                    }}
                  >
                    <Trash2 size={13} />
                    {locale.common.delete}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-[var(--color-border-soft)] bg-[linear-gradient(135deg,rgba(45,106,79,0.12),rgba(255,255,255,0.82))] shadow-[0_28px_90px_rgba(28,27,24,0.09)]">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-forest)]">Admin workspace</p>
            <h1 className="m-0 text-3xl font-bold tracking-[-0.03em] text-[var(--color-ink-strong)]">{t.title}</h1>
            <p className="mb-0 mt-4 max-w-3xl text-sm leading-7 text-[var(--color-ink-muted)]">Контент, очистка, AI-конфигурация и системные действия собраны в одном интерфейсе.</p>
          </div>

          <div className="rounded-[24px] border border-[var(--color-border-soft)] bg-[rgba(255,255,255,0.85)] p-5 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">Quick stats</p>
            <div className="space-y-2 text-sm text-[var(--color-ink-default)]">
              <div className="flex items-center justify-between"><span>{t.articlesTab}</span><strong>{articlesQuery.data?.length ?? 0}</strong></div>
              <div className="flex items-center justify-between"><span>{t.paragraphsTab}</span><strong>{paragraphsQuery.data?.length ?? 0}</strong></div>
              <div className="flex items-center justify-between"><span>AI</span><strong>{aiSettingsQuery.data?.isEnabled ? 'enabled' : 'disabled'}</strong></div>
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

      <div className="flex flex-wrap gap-3">
        {[
          { key: 'content', label: t.contentTab, icon: Database },
          { key: 'settings', label: locale.common.settings, icon: Settings2 },
        ].map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={activeTab === key ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(key as AdminTab)}
          >
            <Icon size={14} />
            {label}
          </Button>
        ))}
      </div>

      {activeTab === 'content' ? (
        <Card className="overflow-hidden border border-[var(--color-border-soft)] bg-white shadow-[0_24px_70px_rgba(28,27,24,0.06)]">
          <div className="border-b border-[var(--color-border-soft)] px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'articles', label: `${t.articlesTab} (${filteredArticles.length})`, icon: FileText },
                  { key: 'paragraphs', label: `${t.paragraphsTab} (${filteredParagraphs.length})`, icon: Database },
                  { key: 'create-article', label: t.createArticleTab, icon: WandSparkles },
                  { key: 'cleanup', label: t.cleanupTab, icon: RefreshCcw },
                ].map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={activeContentTab === key ? 'primary' : 'secondary'}
                    className="px-3 py-2 text-xs"
                    onClick={() => setActiveContentTab(key as ContentTab)}
                  >
                    <Icon size={13} />
                    {label}
                  </Button>
                ))}
              </div>

              <div className="relative w-full lg:max-w-sm">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            {activeContentTab === 'articles' ? renderArticlesTable(filteredArticles) : null}
            {activeContentTab === 'paragraphs' ? renderParagraphsTable(filteredParagraphs) : null}
            {activeContentTab === 'create-article' ? (
              <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-6">
                <p className="m-0 text-lg font-semibold text-[var(--color-ink-strong)]">{t.createArticleTitle}</p>
                <p className="mb-0 mt-2 text-sm leading-7 text-[var(--color-ink-muted)]">{t.createArticleDescription}</p>
                <div className="mt-5">
                  <Button variant="primary" onClick={() => navigate('/article/new')}>
                    <WandSparkles size={14} />
                    {t.createArticleAction}
                  </Button>
                </div>
              </div>
            ) : null}
            {activeContentTab === 'cleanup' ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <p className="m-0 text-lg font-semibold text-red-800">{t.cleanupModalTitle}</p>
                <p className="mb-0 mt-2 text-sm leading-7 text-red-700">{formatMessage(t.cleanupModalHint, { phrase: confirmationPhrase })}</p>
                <div className="mt-5">
                  <Button variant="ghost" className="text-red-700 hover:bg-red-100 hover:text-red-800" onClick={() => setIsCleanupModalOpen(true)}>
                    <Trash2 size={14} />
                    {t.deleteAll}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {activeTab === 'settings' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="border border-[var(--color-border-soft)] bg-white p-6 shadow-[0_24px_70px_rgba(28,27,24,0.06)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-brand-forest-soft)] text-[var(--color-brand-forest)]">
                <Bot size={22} />
              </div>
              <div>
                <p className="m-0 text-lg font-semibold text-[var(--color-ink-strong)]">{t.aiTab}</p>
                <p className="mb-0 mt-1 text-sm text-[var(--color-ink-muted)]">Параметры AI-провайдера и проверка подключения.</p>
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-ink-muted)]">
              {t.aiDisabledHint}
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-3">
                <span className="text-sm font-medium text-[var(--color-ink-strong)]">AI enabled</span>
                <input
                  type="checkbox"
                  checked={aiSettingsForm.isEnabled}
                  onChange={(event) => setAiSettingsForm((current) => ({ ...current, isEnabled: event.target.checked }))}
                  className="h-4 w-4 accent-[var(--color-brand-forest)]"
                />
              </label>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">{t.baseUrl}</label>
                <Input
                  value={aiSettingsForm.baseUrl}
                  onChange={(event) => setAiSettingsForm((current) => ({ ...current, baseUrl: event.target.value }))}
                  disabled={!aiSettingsForm.isEnabled}
                  placeholder={t.baseUrlPlaceholder}
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">{t.model}</label>
                <Input
                  value={aiSettingsForm.model}
                  onChange={(event) => setAiSettingsForm((current) => ({ ...current, model: event.target.value }))}
                  disabled={!aiSettingsForm.isEnabled}
                  placeholder={t.modelPlaceholder}
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">{t.apiKey}</label>
                <Input
                  type="password"
                  value={aiSettingsForm.apiKey}
                  onChange={(event) => setAiSettingsForm((current) => ({ ...current, apiKey: event.target.value }))}
                  disabled={!aiSettingsForm.isEnabled}
                  placeholder={t.apiKeyPlaceholder}
                />
                <p className="mb-0 mt-2 text-xs text-[var(--color-ink-subtle)]">{t.apiKeyHint}</p>
              </div>

              <label className="flex items-center gap-2 text-sm text-[var(--color-ink-muted)]">
                <input
                  type="checkbox"
                  checked={aiSettingsForm.clearApiKey}
                  onChange={(event) => setAiSettingsForm((current) => ({ ...current, clearApiKey: event.target.checked }))}
                  className="h-4 w-4 accent-[var(--color-brand-forest)]"
                />
                {t.deleteApiKey}
              </label>

              <div className="flex flex-wrap gap-3">
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
              <div className="mt-6 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
                <p className="m-0 text-sm font-semibold text-[var(--color-ink-strong)]">{t.aiCheckResultTitle}</p>
                <p className="mb-0 mt-2 text-sm text-[var(--color-ink-muted)]">{aiCheckResult.message}</p>
                <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">{t.aiModelExample}</p>
                <Textarea readOnly value={aiCheckResult.styledText} rows={6} className="font-mono text-[13px] leading-6" />
              </div>
            ) : null}
          </Card>

          <div className="space-y-6">
            <Card className="border border-[var(--color-border-soft)] bg-white p-6 shadow-[0_24px_70px_rgba(28,27,24,0.06)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-brand-forest-soft)] text-[var(--color-brand-forest)]">
                  <KeyRound size={18} />
                </div>
                <div>
                  <p className="m-0 text-base font-semibold text-[var(--color-ink-strong)]">{t.inviteTokenTitle}</p>
                  <p className="mb-0 mt-1 text-sm text-[var(--color-ink-muted)]">Создание нового invite token для администратора.</p>
                </div>
              </div>

              <Button onClick={() => inviteTokenMutation.mutate()} disabled={inviteTokenMutation.isPending}>
                <KeyRound size={14} />
                {inviteTokenMutation.isPending ? '...' : t.generateInviteToken}
              </Button>

              {inviteToken ? (
                <div className="mt-4 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">Token</p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <code className="break-all text-sm text-[var(--color-ink-strong)]">{inviteToken}</code>
                    <Button
                      className="px-3 py-1.5 text-xs"
                      onClick={async () => {
                        await navigator.clipboard.writeText(inviteToken);
                        showNotice('success', t.inviteTokenGenerated);
                      }}
                    >
                      <Copy size={13} />
                      Copy
                    </Button>
                  </div>
                </div>
              ) : null}
            </Card>

            <Card className="border border-[var(--color-border-soft)] bg-white p-6 shadow-[0_24px_70px_rgba(28,27,24,0.06)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-brand-forest-soft)] text-[var(--color-brand-forest)]">
                  <Settings2 size={18} />
                </div>
                <div>
                  <p className="m-0 text-base font-semibold text-[var(--color-ink-strong)]">{t.uiTab}</p>
                  <p className="mb-0 mt-1 text-sm text-[var(--color-ink-muted)]">Режим отображения альтернатив на странице статьи.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant={paragraphUiMode === 'arrows' ? 'primary' : 'secondary'} onClick={() => onParagraphUiModeChange('arrows')}>
                  {t.uiModeArrows}
                </Button>
                <Button variant={paragraphUiMode === 'numbers' ? 'primary' : 'secondary'} onClick={() => onParagraphUiModeChange('numbers')}>
                  {t.uiModeNumbers}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {isCleanupModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,20,18,0.35)] p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] border border-[var(--color-border-soft)] bg-white shadow-[0_30px_80px_rgba(28,27,24,0.18)]">
            <div className="border-b border-[var(--color-border-soft)] px-6 py-5">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-red-500">Danger zone</p>
              <h2 className="m-0 text-xl font-semibold text-[var(--color-ink-strong)]">{t.cleanupModalTitle}</h2>
            </div>
            <div className="space-y-4 px-6 py-5">
              <p className="m-0 text-sm leading-7 text-[var(--color-ink-muted)]">
                {formatMessage(t.cleanupModalHint, { phrase: confirmationPhrase })}
              </p>
              <Input value={cleanupConfirmation} onChange={(event) => setCleanupConfirmation(event.target.value)} />
            </div>
            <div className="flex justify-end gap-3 border-t border-[var(--color-border-soft)] px-6 py-4">
              <Button variant="ghost" onClick={() => setIsCleanupModalOpen(false)}>Отмена</Button>
              <Button
                variant="primary"
                onClick={() => cleanupMutation.mutate()}
                disabled={cleanupConfirmation !== confirmationPhrase || cleanupMutation.isPending}
                className="bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700"
              >
                {cleanupMutation.isPending ? '...' : t.cleanupModalOk}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminPage;
