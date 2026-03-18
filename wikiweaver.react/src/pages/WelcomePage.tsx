import React from 'react';
import { locale } from '../localization';
import { Card } from '../shared/ui/Card';

const WelcomePage: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-6 py-12 sm:px-8 lg:px-12">
      <Card className="w-full max-w-3xl overflow-hidden border border-[var(--color-border-soft)] bg-[rgba(255,255,255,0.9)] shadow-[0_24px_80px_rgba(28,27,24,0.08)] backdrop-blur-sm">
        <div className="border-b border-[var(--color-border-soft)] bg-[linear-gradient(135deg,rgba(45,106,79,0.14),rgba(244,243,238,0.5))] px-6 py-8 sm:px-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-forest)]">
            WikiWeaver
          </p>
          <h1 className="m-0 text-3xl font-bold tracking-[-0.03em] text-[var(--color-ink-strong)] sm:text-4xl">
            {locale.welcomePage.title}
          </h1>
        </div>

        <div className="px-6 py-8 sm:px-8">
          <p className="m-0 max-w-2xl text-base leading-8 text-[var(--color-ink-muted)] sm:text-lg">
            <span>{locale.app.name} — {locale.app.description}.</span>
            <br />
            <span>{locale.welcomePage.selectArticleMessage}</span>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default WelcomePage;
