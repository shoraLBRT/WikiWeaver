import { Link as LinkIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocale } from '../../localization/hooks';

export type TocItem = {
  id: string;
  label: string;
};

type ArticleRightSidebarProps = {
  tocItems: TocItem[];
};

export const ArticleRightSidebar = ({ tocItems }: ArticleRightSidebarProps) => {
  const locale = useLocale();
  const t = locale.articleRightSidebar;
  const metadataItems = t.metadataItems as Array<[string, string]>;
  const [activeId, setActiveId] = useState<string>(tocItems[0]?.id ?? 'intro');

  useEffect(() => {
    if (tocItems.length === 0) {
      return;
    }

    const handler = () => {
      const sections = tocItems
        .map((item) => document.getElementById(item.id))
        .filter((element): element is HTMLElement => Boolean(element));

      for (let index = sections.length - 1; index >= 0; index -= 1) {
        const element = sections[index];
        if (element.getBoundingClientRect().top <= 120) {
          setActiveId(element.id);
          break;
        }
      }
    };

    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [tocItems]);

  return (
    <aside className="hidden xl:sticky xl:top-0 xl:block xl:h-screen xl:w-[220px] xl:shrink-0 xl:overflow-y-auto">
      <div className="py-4 px-4">
        <div className="mb-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
            {t.onThisPage}
          </p>
          <nav className="space-y-0.5">
            {tocItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={[
                  'block rounded px-2 py-1 text-[12.5px] transition-colors',
                  activeId === item.id
                    ? 'bg-[var(--color-brand-forest-soft)] text-[var(--color-brand-forest)]'
                    : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-page-panel)] hover:text-[var(--color-ink-strong)]',
                ].join(' ')}
                onClick={() => setActiveId(item.id)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="border-t border-[var(--color-border-soft)] pt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
            {t.relatedArticles}
          </p>
          <div className="space-y-1">
            <div className="rounded-xl border border-dashed border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-3 text-[12px] leading-5 text-[var(--color-ink-muted)]">
              {t.relatedPlaceholder}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-brand-forest)] opacity-70">
              <LinkIcon size={10} /> {t.relatedPlaceholderStatus}
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-[var(--color-border-soft)] pt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
            {t.information}
          </p>
          <div className="space-y-1">
            {metadataItems.map(([label, value]) => (
              <div key={label}>
                <span className="text-[11px] text-[var(--color-ink-subtle)]">{label}: </span>
                <span className="text-[11px] text-[var(--color-ink-default)]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
