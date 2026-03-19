import React, { useMemo, useState } from 'react';
import { Bot, Check, Copy, Database, FileText, KeyRound, Settings2, Sparkles, Trash2, X } from 'lucide-react';
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

type AdminTab = 'content' | 'settings';
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

type OverviewCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent?: 'brand' | 'danger';
};

const OverviewCard: React.FC<OverviewCardProps> = ({ icon, label, value, hint, accent = 'brand' }) => (
  <div
    className={cn(
      'rounded-[24px] border p-5 shadow-sm',
      accent === 'danger'
        ? 'border-red-200 bg-[linear-gradient(180deg,rgba(255,245,245,0.95),rgba(255,255,255,0.98))]'
        : 'border-[var(--color-border-soft)] bg-[linear-gradient(180deg,rgba(248,247,243,0.96),rgba(255,255,255,0.98))]',
    )}
  >
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-brand-forest-soft)] text-[var(--color-brand-forest)]">
      {icon}
    </div>
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">{label}</p>
    <p className="m-0 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink-strong)]">{value}</p>
    <p className="mb-0 mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">{hint}</p>
  </div>
);

const AdminPage: React.FC = () => {
  const locale = useLocale();
  const t = locale.adminPage;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('content');
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [cleanupConfirmation, setCleanupConfirmation] = useState('');
  const [paragraphUiMode, setParagraphUiMode] = useState<ParagraphUiMode>(getInitialUiMode);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [aiCheckResult, setAiCheckResult] = useState<{ message: string; styledText: string } | null>(null);
  const [aiSettingsFormOverride, setAiSettingsFormOverride] = useState<AiSettingsState | null>(null);

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
    });
  };

  const articleCount = articlesQuery.data?.length ?? 0;
  const paragraphCount = paragraphsQuery.data?.length ?? 0;
  const articlesValue = articlesQuery.isLoading ? locale.common.loading : String(articleCount);
  const paragraphsValue = paragraphsQuery.isLoading ? locale.common.loading : String(paragraphCount);
  const aiStatusValue = aiSettingsQuery.isLoading
    ? locale.common.loading
    : aiSettingsQuery.data?.isEnabled
      ? locale.common.enabled
      : locale.common.disabled;
  const aiStatusHint = aiSettingsQuery.isLoading
    ? t.aiConfigurationDescription
    : !aiSettingsQuery.data?.isEnabled
      ? t.aiStatusOff
      : aiSettingsQuery.data.hasApiKey
        ? t.aiStatusReady
        : t.aiStatusNeedsKey;
  const currentUiModeLabel = paragraphUiMode === 'arrows' ? t.uiModeArrows : t.uiModeNumbers;

  return (
    <div className="min-h-[calc(100vh-var(--layout-header-height))] bg-[linear-gradient(180deg,#f8f7f2_0%,#f2f1eb_100%)]">
      <div className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[30px] border border-[var(--color-border-soft)] bg-[linear-gradient(135deg,rgba(247,245,238,0.98),rgba(255,255,255,0.92)_52%,rgba(232,239,231,0.9)_100%)] shadow-[0_28px_90px_rgba(28,27,24,0.08)]">
            <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-forest)]">{t.heroEyebrow}</p>
                <h1 className="m-0 text-3xl font-bold tracking-[-0.03em] text-[var(--color-ink-strong)]">{t.title}</h1>
                <p className="mb-0 mt-4 max-w-3xl text-sm leading-7 text-[var(--color-ink-muted)]">{t.description}</p>
              </div>

              <div className="rounded-[26px] border border-[var(--color-border-soft)] bg-[rgba(255,255,255,0.82)] p-5 shadow-sm backdrop-blur-sm">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">{t.quickStats}</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3">
                    <span className="text-sm text-[var(--color-ink-muted)]">{t.articlesTab}</span>
                    <strong className="text-sm text-[var(--color-ink-strong)]">{articlesValue}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3">
                    <span className="text-sm text-[var(--color-ink-muted)]">{t.paragraphsTab}</span>
                    <strong className="text-sm text-[var(--color-ink-strong)]">{paragraphsValue}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3">
                    <span className="text-sm text-[var(--color-ink-muted)]">{t.aiTab}</span>
                    <strong className="text-sm text-[var(--color-ink-strong)]">{aiStatusValue}</strong>
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

          <div className="rounded-[26px] border border-[var(--color-border-soft)] bg-white/80 p-2 shadow-sm backdrop-blur-sm">
            <div className="inline-flex w-full flex-wrap gap-2 lg:w-auto">
              {[
                { key: 'content', label: t.contentTab, icon: Database },
                { key: 'settings', label: locale.common.settings, icon: Settings2 },
              ].map(({ key, label, icon: Icon }) => {
                const isActive = activeTab === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key as AdminTab)}
                    className={cn(
                      'inline-flex min-w-[148px] items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[var(--color-brand-forest)] text-white shadow-[0_12px_28px_rgba(45,106,79,0.2)]'
                        : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink-strong)]',
                    )}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === 'content' ? (
            <Card className="overflow-hidden border border-[var(--color-border-soft)] bg-white/95 shadow-[0_24px_80px_rgba(28,27,24,0.06)]">
              <div className="border-b border-[var(--color-border-soft)] px-6 py-5 sm:px-8">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">{t.contentTab}</p>
                <h2 className="m-0 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink-strong)]">{t.contentFlowTitle}</h2>
                <p className="mb-0 mt-3 max-w-3xl text-sm leading-7 text-[var(--color-ink-muted)]">{t.contentDescription}</p>
              </div>

              <div className="grid gap-5 p-6 sm:p-8 xl:grid-cols-[minmax(0,1.1fr)_360px]">
                <div className="grid gap-5 md:grid-cols-2">
                  <OverviewCard
                    icon={<Database size={20} />}
                    label={t.articlesTab}
                    value={articlesValue}
                    hint={t.contentDescription}
                  />
                  <OverviewCard
                    icon={<FileText size={20} />}
                    label={t.paragraphsTab}
                    value={paragraphsValue}
                    hint={t.contentFlowDescription}
                  />

                  <div className="rounded-[26px] border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-6 shadow-sm md:col-span-2">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-2xl">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">{t.contentFlowTitle}</p>
                        <p className="m-0 text-lg font-semibold text-[var(--color-ink-strong)]">{t.contentFlowDescription}</p>
                        <p className="mb-0 mt-2 text-sm leading-7 text-[var(--color-ink-muted)]">{t.maintenanceDescription}</p>
                      </div>

                      <div className="rounded-[22px] border border-[var(--color-border-soft)] bg-white px-4 py-3 text-sm text-[var(--color-ink-muted)] shadow-sm">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">{locale.common.settings}</span>
                        <strong className="mt-1 block text-[var(--color-ink-strong)]">{aiStatusHint}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-red-200 bg-[linear-gradient(180deg,rgba(255,245,245,0.96),rgba(255,255,255,1))] p-6 shadow-sm">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-red-500">{t.cleanupDangerZone}</p>
                  <h3 className="m-0 text-xl font-semibold text-red-900">{t.maintenanceTitle}</h3>
                  <p className="mb-0 mt-3 text-sm leading-7 text-red-800/85">{t.maintenanceDescription}</p>
                  <p className="mb-0 mt-4 rounded-2xl border border-red-200 bg-white/80 px-4 py-3 text-sm text-red-800">
                    {formatMessage(t.cleanupModalHint, { phrase: confirmationPhrase })}
                  </p>
                  <div className="mt-5">
                    <Button variant="ghost" className="text-red-700 hover:bg-red-100 hover:text-red-800" onClick={() => setIsCleanupModalOpen(true)}>
                      <Trash2 size={14} />
                      {t.deleteAll}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          {activeTab === 'settings' ? (
            <Card className="overflow-hidden border border-[var(--color-border-soft)] bg-white/95 shadow-[0_24px_80px_rgba(28,27,24,0.06)]">
              <div className="border-b border-[var(--color-border-soft)] px-6 py-5 sm:px-8">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">{locale.common.settings}</p>
                <h2 className="m-0 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink-strong)]">{locale.common.settings}</h2>
                <p className="mb-0 mt-3 max-w-3xl text-sm leading-7 text-[var(--color-ink-muted)]">{t.settingsDescription}</p>
              </div>

              <div className="space-y-6 p-6 sm:p-8">
                <div className="grid gap-4 xl:grid-cols-3">
                  <OverviewCard icon={<Bot size={20} />} label={t.aiTab} value={aiStatusValue} hint={aiStatusHint} />
                  <OverviewCard icon={<Settings2 size={20} />} label={t.uiTab} value={currentUiModeLabel} hint={t.uiDescription} />
                  <OverviewCard
                    icon={<KeyRound size={20} />}
                    label={t.inviteTokenTitle}
                    value={inviteToken ? locale.common.enabled : locale.common.disabled}
                    hint={t.inviteTokenHint}
                  />
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
                  <div className="rounded-[28px] border border-[var(--color-border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,247,243,0.88))] p-6 shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-[var(--color-border-soft)] pb-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-brand-forest-soft)] text-[var(--color-brand-forest)]">
                          <Bot size={22} />
                        </div>
                        <div>
                          <p className="m-0 text-lg font-semibold text-[var(--color-ink-strong)]">{t.aiTab}</p>
                          <p className="mb-0 mt-1 text-sm leading-6 text-[var(--color-ink-muted)]">{t.aiConfigurationDescription}</p>
                        </div>
                      </div>

                      <div className="rounded-full border border-[var(--color-border-soft)] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                        {aiStatusHint}
                      </div>
                    </div>

                    <div className="mt-5 rounded-[22px] border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--color-ink-muted)]">
                      {t.aiDisabledHint}
                    </div>

                    <div className="mt-5 space-y-4">
                      <label className="flex items-center justify-between rounded-[22px] border border-[var(--color-border-soft)] bg-white px-4 py-3 shadow-sm">
                        <span className="text-sm font-medium text-[var(--color-ink-strong)]">{t.aiEnabled}</span>
                        <input
                          type="checkbox"
                          checked={aiSettingsForm.isEnabled}
                          onChange={(event) => updateAiSettingsForm((current) => ({ ...current, isEnabled: event.target.checked }))}
                          className="h-4 w-4 accent-[var(--color-brand-forest)]"
                        />
                      </label>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">{t.baseUrl}</label>
                          <Input
                            value={aiSettingsForm.baseUrl}
                            onChange={(event) => updateAiSettingsForm((current) => ({ ...current, baseUrl: event.target.value }))}
                            disabled={!aiSettingsForm.isEnabled}
                            placeholder={t.baseUrlPlaceholder}
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">{t.model}</label>
                          <Input
                            value={aiSettingsForm.model}
                            onChange={(event) => updateAiSettingsForm((current) => ({ ...current, model: event.target.value }))}
                            disabled={!aiSettingsForm.isEnabled}
                            placeholder={t.modelPlaceholder}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">{t.apiKey}</label>
                        <Input
                          type="password"
                          value={aiSettingsForm.apiKey}
                          onChange={(event) => updateAiSettingsForm((current) => ({ ...current, apiKey: event.target.value }))}
                          disabled={!aiSettingsForm.isEnabled}
                          placeholder={t.apiKeyPlaceholder}
                        />
                        <p className="mb-0 mt-2 text-xs leading-6 text-[var(--color-ink-subtle)]">{t.apiKeyHint}</p>
                      </div>

                      <label className="flex items-center gap-2 text-sm text-[var(--color-ink-muted)]">
                        <input
                          type="checkbox"
                          checked={aiSettingsForm.clearApiKey}
                          onChange={(event) => updateAiSettingsForm((current) => ({ ...current, clearApiKey: event.target.checked }))}
                          className="h-4 w-4 accent-[var(--color-brand-forest)]"
                        />
                        {t.deleteApiKey}
                      </label>

                      <div className="flex flex-wrap gap-3 pt-1">
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
                      <div className="mt-6 rounded-[24px] border border-[var(--color-border-soft)] bg-white p-4 shadow-sm">
                        <p className="m-0 text-sm font-semibold text-[var(--color-ink-strong)]">{t.aiCheckResultTitle}</p>
                        <p className="mb-0 mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">{aiCheckResult.message}</p>
                        <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">{t.aiModelExample}</p>
                        <Textarea readOnly value={aiCheckResult.styledText} rows={6} className="font-mono text-[13px] leading-6" />
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[28px] border border-[var(--color-border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,247,243,0.88))] p-6 shadow-sm">
                      <div className="mb-4 flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-brand-forest-soft)] text-[var(--color-brand-forest)]">
                          <KeyRound size={18} />
                        </div>
                        <div>
                          <p className="m-0 text-base font-semibold text-[var(--color-ink-strong)]">{t.inviteTokenTitle}</p>
                          <p className="mb-0 mt-1 text-sm leading-6 text-[var(--color-ink-muted)]">{t.inviteTokenDescription}</p>
                        </div>
                      </div>

                      <p className="mb-4 text-sm leading-6 text-[var(--color-ink-muted)]">{t.inviteTokenHint}</p>

                      <Button onClick={() => inviteTokenMutation.mutate()} disabled={inviteTokenMutation.isPending}>
                        <KeyRound size={14} />
                        {inviteTokenMutation.isPending ? '...' : t.generateInviteToken}
                      </Button>

                      {inviteToken ? (
                        <div className="mt-4 rounded-[22px] border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">{t.inviteTokenValueLabel}</p>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <code className="break-all text-sm text-[var(--color-ink-strong)]">{inviteToken}</code>
                            <Button
                              className="px-3 py-1.5 text-xs"
                              onClick={async () => {
                                await navigator.clipboard.writeText(inviteToken);
                                showNotice('success', t.inviteTokenCopied);
                              }}
                            >
                              <Copy size={13} />
                              {locale.common.copy}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-[28px] border border-[var(--color-border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,247,243,0.88))] p-6 shadow-sm">
                      <div className="mb-4 flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-brand-forest-soft)] text-[var(--color-brand-forest)]">
                          <Settings2 size={18} />
                        </div>
                        <div>
                          <p className="m-0 text-base font-semibold text-[var(--color-ink-strong)]">{t.uiTab}</p>
                          <p className="mb-0 mt-1 text-sm leading-6 text-[var(--color-ink-muted)]">{t.uiDescription}</p>
                        </div>
                      </div>

                      <div className="mb-4 rounded-[22px] border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-ink-muted)]">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">{t.currentMode}</span>
                        <strong className="mt-1 block text-[var(--color-ink-strong)]">{currentUiModeLabel}</strong>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant={paragraphUiMode === 'arrows' ? 'primary' : 'secondary'} onClick={() => onParagraphUiModeChange('arrows')}>
                          {t.uiModeArrows}
                        </Button>
                        <Button variant={paragraphUiMode === 'numbers' ? 'primary' : 'secondary'} onClick={() => onParagraphUiModeChange('numbers')}>
                          {t.uiModeNumbers}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          {isCleanupModalOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,20,18,0.35)] p-4 backdrop-blur-sm">
              <div className="w-full max-w-xl rounded-[28px] border border-[var(--color-border-soft)] bg-white shadow-[0_30px_80px_rgba(28,27,24,0.18)]">
                <div className="border-b border-[var(--color-border-soft)] px-6 py-5">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-red-500">{t.cleanupDangerZone}</p>
                  <h2 className="m-0 text-xl font-semibold text-[var(--color-ink-strong)]">{t.cleanupModalTitle}</h2>
                </div>
                <div className="space-y-4 px-6 py-5">
                  <p className="m-0 text-sm leading-7 text-[var(--color-ink-muted)]">
                    {formatMessage(t.cleanupModalHint, { phrase: confirmationPhrase })}
                  </p>
                  <Input value={cleanupConfirmation} onChange={(event) => setCleanupConfirmation(event.target.value)} />
                </div>
                <div className="flex justify-end gap-3 border-t border-[var(--color-border-soft)] px-6 py-4">
                  <Button variant="ghost" onClick={() => setIsCleanupModalOpen(false)}>{locale.common.cancel}</Button>
                  <Button
                    variant="primary"
                    onClick={() => cleanupMutation.mutate()}
                    disabled={cleanupConfirmation !== confirmationPhrase || cleanupMutation.isPending}
                    className="border-red-600 bg-red-600 hover:border-red-700 hover:bg-red-700"
                  >
                    {cleanupMutation.isPending ? '...' : t.cleanupModalOk}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
