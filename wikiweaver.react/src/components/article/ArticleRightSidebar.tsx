import { Link as LinkIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export type TocItem = {
  id: string;
  label: string;
};

type ArticleRightSidebarProps = {
  tocItems: TocItem[];
};

const metadataItems = [
  ['Категория', 'Заглушка до внедрения metadata'],
  ['Последнее изменение', 'Будет доступно позже'],
  ['Правок', 'После реализации edit content'],
];

export const ArticleRightSidebar = ({ tocItems }: ArticleRightSidebarProps) => {
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
    <aside className="hidden xl:block xl:w-[220px] xl:shrink-0">
      <div className="sticky top-[calc(var(--layout-header-height)+24px)] max-h-[calc(100vh-var(--layout-header-height)-48px)] overflow-y-auto border-l border-[var(--color-border-soft)] bg-[rgba(255,255,255,0.92)] px-4 py-4 backdrop-blur-sm">
        <div className="mb-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
            На этой странице
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
            Связанные статьи
          </p>
          <div className="space-y-1">
            <div className="rounded-xl border border-dashed border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-3 text-[12px] leading-5 text-[var(--color-ink-muted)]">
              Блок будет подключен позже. См. `docs/todo/frontend-related-links.md`.
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-brand-forest)] opacity-70">
              <LinkIcon size={10} /> placeholder
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-[var(--color-border-soft)] pt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
            Информация
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
