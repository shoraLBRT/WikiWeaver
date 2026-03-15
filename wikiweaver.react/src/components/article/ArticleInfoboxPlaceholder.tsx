import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const placeholderRows = [
  ['Тип', 'Появится после внедрения metadata'],
  ['Шаблон', 'Будет настраиваться для каждой wiki'],
  ['Содержимое', 'Гибкие поля статьи'],
  ['Статус', 'Пока не настроено'],
  ['Источник', 'См. TODO по infobox'],
  ['Хранение', 'Потребует расширения API'],
];

export const ArticleInfoboxPlaceholder = () => {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded ? placeholderRows : placeholderRows.slice(0, 4);

  return (
    <aside className="mb-6 w-full overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-sm shadow-sm lg:float-right lg:mb-4 lg:ml-6 lg:w-[280px]">
      <div className="bg-[var(--color-brand-forest)] px-4 py-3 text-center text-white">
        <p className="mb-1 font-serif text-[26px] leading-none">⌘</p>
        <p className="text-[13px] font-semibold text-[#d6f2e2]">Infobox placeholder</p>
        <p className="mt-0.5 text-[11px] text-[#9fe0bd]">Первая итерация дизайна</p>
      </div>

      <div className="divide-y divide-[var(--color-border-mute)]">
        {visibleRows.map(([label, value]) => (
          <div key={label} className="flex gap-2 px-3 py-2">
            <span className="w-[96px] shrink-0 text-[11px] leading-5 text-[var(--color-ink-muted)]">
              {label}
            </span>
            <span className="flex-1 text-[12px] leading-5 text-[var(--color-ink-strong)]">{value}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--color-border-soft)] px-3 py-2">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
          Next step
        </p>
        <p className="m-0 text-[11px] leading-5 text-[var(--color-ink-muted)]">
          Подробности описаны в `docs/todo/frontend-infobox.md`.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-center gap-1 border-t border-[var(--color-border-soft)] py-2 text-[12px] text-[var(--color-brand-forest)] transition-colors hover:bg-[var(--color-brand-forest-soft)]"
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? 'Свернуть' : 'Подробнее'}
      </button>
    </aside>
  );
};
