import React, { useState } from 'react';
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { APP_CONSTANTS } from '../constants/AppConstants';
import { locale } from '../localization';
import { adminLogin, adminRegister, getAuthStatus } from '../services/authService';
import { setStoredAdminToken } from '../services/authTokenStorage';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { Input } from '../shared/ui/Input';

type FormValues = {
  email: string;
  password: string;
  inviteToken: string;
};

const AdminLoginPage: React.FC = () => {
  const t = locale.adminLoginPage;
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>({ email: '', password: '', inviteToken: '' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: [APP_CONSTANTS.QUERY_KEYS.AUTH_STATUS],
    queryFn: getAuthStatus,
  });

  const loginMutation = useMutation({
    mutationFn: adminLogin,
    onSuccess: (result) => {
      setStoredAdminToken(result.accessToken);
      navigate('/admin');
    },
    onError: (error) => setErrorMessage((error as Error).message),
  });

  const registerMutation = useMutation({
    mutationFn: adminRegister,
    onSuccess: (result) => {
      setStoredAdminToken(result.accessToken);
      navigate('/admin');
    },
    onError: (error) => setErrorMessage((error as Error).message),
  });

  const requiresInvite = !statusQuery.data?.requiresBootstrapAdmin;
  const isBusy = loginMutation.isPending || registerMutation.isPending;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!formValues.email.trim() || !formValues.password.trim()) {
      setErrorMessage('Заполните email и пароль.');
      return;
    }

    if (isRegisterMode) {
      if (requiresInvite && !formValues.inviteToken.trim()) {
        setErrorMessage('Укажите invite token.');
        return;
      }

      registerMutation.mutate({
        email: formValues.email.trim(),
        password: formValues.password,
        inviteToken: formValues.inviteToken.trim() || undefined,
      });
      return;
    }

    loginMutation.mutate({
      email: formValues.email.trim(),
      password: formValues.password,
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-var(--layout-header-height)-3rem)] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full max-w-5xl overflow-hidden border border-[var(--color-border-soft)] bg-[rgba(255,255,255,0.96)] shadow-[0_28px_90px_rgba(28,27,24,0.10)]">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="border-b border-[var(--color-border-soft)] bg-[linear-gradient(135deg,rgba(45,106,79,0.13),rgba(244,243,238,0.5))] px-6 py-8 lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-forest)]">Admin access</p>
            <h1 className="m-0 text-3xl font-bold tracking-[-0.03em] text-[var(--color-ink-strong)]">
              {isRegisterMode ? t.registerTitle : t.loginTitle}
            </h1>
            <p className="mb-0 mt-4 max-w-md text-sm leading-7 text-[var(--color-ink-muted)]">
              Управляйте контентом, AI-настройками и служебными функциями платформы в единой админ-панели.
            </p>

            <div className="mt-8 space-y-3">
              {[
                ['Content', 'Управление статьями и параграфами'],
                ['AI', 'Проверка и настройка AI-провайдера'],
                ['Access', 'Invite token и bootstrap admin flow'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-[var(--color-border-soft)] bg-[rgba(255,255,255,0.78)] px-4 py-3">
                  <p className="m-0 text-sm font-semibold text-[var(--color-ink-strong)]">{title}</p>
                  <p className="mb-0 mt-1 text-sm text-[var(--color-ink-muted)]">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-8 lg:px-8 lg:py-10">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-brand-forest-soft)] text-[var(--color-brand-forest)]">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="m-0 text-sm font-semibold text-[var(--color-ink-strong)]">
                  {isRegisterMode ? t.registerAction : t.loginAction}
                </p>
                <p className="mb-0 mt-1 text-xs text-[var(--color-ink-subtle)]">JWT session for admin actions</p>
              </div>
            </div>

            {isRegisterMode && !requiresInvite ? (
              <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                {t.firstAdminHint}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={submit}>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
                  <Input
                    autoComplete="email"
                    value={formValues.email}
                    onChange={(event) => setFormValues((current) => ({ ...current, email: event.target.value }))}
                    className="h-12 pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
                  {t.passwordLabel}
                </label>
                <div className="relative">
                  <LockKeyhole size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
                  <Input
                    type="password"
                    autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                    value={formValues.password}
                    onChange={(event) => setFormValues((current) => ({ ...current, password: event.target.value }))}
                    className="h-12 pl-10"
                  />
                </div>
              </div>

              {isRegisterMode && requiresInvite ? (
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
                    {t.inviteTokenLabel}
                  </label>
                  <Input
                    value={formValues.inviteToken}
                    onChange={(event) => setFormValues((current) => ({ ...current, inviteToken: event.target.value }))}
                    className="h-12"
                  />
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="primary" type="submit" disabled={isBusy}>
                  {isBusy ? '...' : isRegisterMode ? t.registerAction : t.loginAction}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setIsRegisterMode((state) => !state);
                  }}
                >
                  {isRegisterMode ? t.haveAccount : t.createAccount}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminLoginPage;
