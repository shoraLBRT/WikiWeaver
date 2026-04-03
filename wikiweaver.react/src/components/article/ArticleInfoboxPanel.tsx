import { ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocale } from '../../localization/hooks';
import type { ArticleInfoboxDto } from '../../shared/types/ApiTypes';

type ArticleInfoboxPanelProps = {
  infobox?: ArticleInfoboxDto;
};

const DEFAULT_VISIBLE_ROWS = 5;

export const ArticleInfoboxPanel = ({ infobox }: ArticleInfoboxPanelProps) => {
  const locale = useLocale();
  const t = locale.articleInfobox;
  const [expanded, setExpanded] = useState(false);

  const normalizedInfobox = useMemo(() => {
    if (!infobox) {
      return null;
    }

    const title = infobox.title?.trim();
    const subtitle = infobox.subtitle?.trim();
    const fields = (infobox.fields ?? [])
      .map((field) => ({
        ...field,
        key: field.key.trim(),
        label: field.label.trim(),
        value: field.value.trim(),
      }))
      .filter((field) => field.label && field.value)
      .sort((left, right) => left.order - right.order);

    if (!title && !subtitle && fields.length === 0) {
      return null;
    }

    return {
      title: title || t.defaultTitle,
      subtitle: subtitle || undefined,
      fields,
    };
  }, [infobox, t.defaultTitle]);

  if (!normalizedInfobox) {
    return null;
  }

  const hasOverflow = normalizedInfobox.fields.length > DEFAULT_VISIBLE_ROWS;
  const visibleFields = hasOverflow && !expanded
    ? normalizedInfobox.fields.slice(0, DEFAULT_VISIBLE_ROWS)
    : normalizedInfobox.fields;

  return (
    <aside className="mb-6 w-full overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-sm shadow-sm lg:float-right lg:mb-4 lg:ml-6 lg:w-[320px]">
      <div className="bg-[var(--color-brand-forest)] px-4 py-3 text-white">
        <p className="m-0 text-[15px] font-semibold leading-6">{normalizedInfobox.title}</p>
        {normalizedInfobox.subtitle ? (
          <p className="mb-0 mt-1 text-[12px] leading-5 text-[#cfeedd]">{normalizedInfobox.subtitle}</p>
        ) : null}
      </div>

      {normalizedInfobox.fields.length > 0 ? (
        <div className="divide-y divide-[var(--color-border-mute)]">
          {visibleFields.map((field) => (
            <div key={`${field.key}-${field.order}`} className="flex gap-3 px-4 py-3">
              <span className="w-[104px] shrink-0 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-ink-muted)]">
                {field.label}
              </span>
              <span className="flex-1 whitespace-pre-wrap text-[12px] leading-5 text-[var(--color-ink-strong)]">{field.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-4 text-[12px] leading-6 text-[var(--color-ink-muted)]">{t.noFields}</div>
      )}

      {hasOverflow ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="flex w-full items-center justify-center gap-1 border-t border-[var(--color-border-soft)] py-2 text-[12px] text-[var(--color-brand-forest)] transition-colors hover:bg-[var(--color-brand-forest-soft)]"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? t.collapse : t.expand}
        </button>
      ) : null}
    </aside>
  );
};
