import React from 'react';
import { FilePenLine, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '../localization/hooks';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';

const EditArticlePage: React.FC = () => {
  const locale = useLocale();
  const navigate = useNavigate();
  const { articleId } = useParams<{ articleId: string }>();
  const t = locale.editArticlePage;

  return (
    <div className="flex min-h-[calc(100vh-var(--layout-header-height)-3rem)] items-center justify-center px-4 py-8 sm:px-6">
      <Card className="w-full max-w-3xl overflow-hidden border border-[var(--color-border-soft)] bg-[rgba(255,255,255,0.96)] shadow-[0_28px_90px_rgba(28,27,24,0.10)]">
        <div className="border-b border-[var(--color-border-soft)] bg-[linear-gradient(135deg,rgba(45,106,79,0.12),rgba(244,243,238,0.55))] px-6 py-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-forest-soft)] text-[var(--color-brand-forest)]">
              <FilePenLine size={22} />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-forest)]">{t.plannedFeature}</p>
              <h1 className="m-0 text-2xl font-bold tracking-[-0.03em] text-[var(--color-ink-strong)]">{t.title}</h1>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-6 sm:px-8">
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-800">
            {t.description}
          </div>
          <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-4">
            <p className="m-0 text-sm font-semibold text-[var(--color-ink-strong)]">{t.articleId}</p>
            <p className="mb-0 mt-2 font-mono text-sm text-[var(--color-ink-muted)]">{articleId ?? locale.common.unknown}</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white px-4 py-4 text-sm leading-7 text-[var(--color-ink-muted)]">
            {t.implementationNote}
          </div>
          <div>
            <Button onClick={() => navigate('/admin')}>
              <ArrowLeft size={14} />
              {t.backToAdmin}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EditArticlePage;
