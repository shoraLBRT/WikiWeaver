import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FilePenLine } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { NavigationArticleDto } from '../shared/types/ApiTypes';

interface NavigationTreeProps {
  navigationTree?: NavigationArticleDto[];
  showArticleEditActions?: boolean;
  onNavigate?: () => void;
}

type NavigationItemProps = {
  article: NavigationArticleDto;
  depth: number;
  activeArticleId?: number;
  showArticleEditActions: boolean;
  onNavigate?: () => void;
};

const editArticleLabel = 'Редактировать статью';

const NavigationItem: React.FC<NavigationItemProps> = ({
  article,
  depth,
  activeArticleId,
  showArticleEditActions,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const hasChildren = (article.children?.length ?? 0) > 0;
  const [expanded, setExpanded] = useState(true);
  const isActive = article.id === activeArticleId;
  const isClickable = article.hasContent;

  return (
    <div>
      <div
        className={[
          'group flex items-center gap-0.5 rounded-lg px-1.5 py-1 transition-colors',
          isActive
            ? 'bg-[var(--color-brand-forest-soft)] text-[var(--color-brand-forest)]'
            : 'text-[var(--color-ink-default)] hover:bg-[rgba(255,255,255,0.75)] hover:text-[var(--color-ink-strong)]',
        ].join(' ')}
        style={{ paddingLeft: `${6 + depth * 12}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md text-[var(--color-ink-subtle)] transition-colors hover:bg-white hover:text-[var(--color-ink-default)]"
            aria-label={expanded ? 'Свернуть раздел' : 'Развернуть раздел'}
          >
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
        ) : (
          <span className="block h-[18px] w-[18px] shrink-0" />
        )}

        {isClickable ? (
          <Link
            to={`/article/${article.id}`}
            className={`min-w-0 flex-1 truncate text-[12px] leading-5 ${isActive ? 'font-medium' : ''}`}
            onClick={onNavigate}
          >
            {article.title}
          </Link>
        ) : (
          <span className="min-w-0 flex-1 truncate text-[12px] leading-5 text-[var(--color-ink-muted)]">{article.title}</span>
        )}

        {showArticleEditActions && article.hasContent ? (
          <button
            type="button"
            aria-label={editArticleLabel}
            title={editArticleLabel}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              navigate(`/admin/articles/${article.id}/edit`);
              onNavigate?.();
            }}
            className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--color-ink-subtle)] transition-colors hover:bg-white hover:text-[var(--color-brand-forest)] group-hover:flex"
          >
            <FilePenLine size={12} />
          </button>
        ) : null}
      </div>

      {hasChildren && expanded ? (
        <div className="mt-0.5 space-y-px">
          {article.children?.map((child) => (
            <NavigationItem
              key={child.id}
              article={child}
              depth={depth + 1}
              activeArticleId={activeArticleId}
              showArticleEditActions={showArticleEditActions}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

const NavigationTree: React.FC<NavigationTreeProps> = ({
  navigationTree,
  showArticleEditActions = false,
  onNavigate,
}) => {
  const location = useLocation();

  const activeArticleId = useMemo(() => {
    const match = location.pathname.match(/^\/article\/(\d+)$/);
    return match ? Number(match[1]) : undefined;
  }, [location.pathname]);

  return (
    <div className="space-y-px">
      {navigationTree?.map((article) => (
        <NavigationItem
          key={article.id}
          article={article}
          depth={0}
          activeArticleId={activeArticleId}
          showArticleEditActions={showArticleEditActions}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
};

export default NavigationTree;
