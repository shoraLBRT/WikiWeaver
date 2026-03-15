import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { APP_CONSTANTS } from '../constants/AppConstants';
import { locale } from '../localization';
import { getNavigationTree } from '../services/Article/navigationService';
import { Input } from '../shared/ui/Input';
import type { NavigationArticleDto } from '../shared/types/ApiTypes';
import NavigationTree from './NavigationTree';

const filterNavigationTree = (articles: NavigationArticleDto[], searchValue: string): NavigationArticleDto[] => {
  const normalizedSearch = searchValue.trim().toLowerCase();

  if (!normalizedSearch) {
    return articles;
  }

  return articles.reduce<NavigationArticleDto[]>((filteredArticles, article) => {
    const filteredChildren = article.children
      ? filterNavigationTree(article.children, normalizedSearch)
      : [];

    const isArticleMatch = article.title.toLowerCase().includes(normalizedSearch);

    if (isArticleMatch || filteredChildren.length > 0) {
      filteredArticles.push({
        ...article,
        children: filteredChildren,
      });
    }

    return filteredArticles;
  }, []);
};

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const [searchValue, setSearchValue] = useState('');
  const location = useLocation();
  const showArticleEditActions =
    location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  const { data: navigationTree, isLoading, error } = useQuery({
    queryKey: [APP_CONSTANTS.QUERY_KEYS.NAVIGATION_TREE],
    queryFn: getNavigationTree,
  });

  const filteredNavigationTree = useMemo(() => {
    if (!navigationTree) {
      return undefined;
    }

    return filterNavigationTree(navigationTree, searchValue);
  }, [navigationTree, searchValue]);

  return (
    <aside
      className="sticky top-[var(--layout-header-height)] hidden h-[calc(100vh-var(--layout-header-height))] shrink-0 border-r border-[var(--color-border-soft)] bg-[var(--color-page-panel)] transition-[width] duration-200 lg:flex lg:flex-col"
      style={{ width: collapsed ? 88 : APP_CONSTANTS.DIMENSIONS.SIDEBAR_WIDTH }}
    >
      {collapsed ? (
        <div className="flex h-full flex-col items-center justify-between px-3 py-4">
          <div className="flex w-full justify-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border-soft)] bg-white text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand-forest)] shadow-sm">
              WW
            </div>
          </div>

          <div className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-ink-subtle)]">
            Navigation
          </div>

          <div className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-forest)] shadow-sm">
            Lib
          </div>
        </div>
      ) : (
        <>
          <div className="border-b border-[var(--color-border-soft)] p-3">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={locale.layout.navigation.searchPlaceholder}
                className="bg-white pl-9"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--color-border-soft)] border-t-[var(--color-brand-forest)]" />
              </div>
            ) : error ? (
              <div className="mx-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p className="m-0 font-semibold">{locale.sidebar.loadError}</p>
                <p className="mb-0 mt-1 text-xs text-red-600">{(error as Error).message}</p>
              </div>
            ) : (
              <NavigationTree
                navigationTree={filteredNavigationTree}
                showArticleEditActions={showArticleEditActions}
              />
            )}
          </div>

          <div className="border-t border-[var(--color-border-soft)] px-4 py-3">
            <p className="m-0 text-[11px] text-[var(--color-ink-subtle)]">
              {locale.app.name} - knowledge workspace
            </p>
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
