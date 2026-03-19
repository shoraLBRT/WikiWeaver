import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { APP_CONSTANTS } from '../constants/AppConstants';
import { useLocale } from '../localization/hooks';
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
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  searchFocusRequest?: number;
  onExpandSidebarSearch?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  mobileOpen = false,
  onCloseMobile,
  searchFocusRequest = 0,
  onExpandSidebarSearch,
}) => {
  const locale = useLocale();
  const [searchValue, setSearchValue] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (collapsed) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [collapsed, searchFocusRequest]);

  const expandedContent = (
    <>
      <div className="border-b border-[var(--color-border-soft)] p-2.5">
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
          <Input
            ref={searchInputRef}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={locale.layout.navigation.searchPlaceholder}
            className="bg-white py-1.5 pl-8 text-[13px]"
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
            onNavigate={onCloseMobile}
          />
        )}
      </div>

        <div className="border-t border-[var(--color-border-soft)] px-4 py-3">
          <p className="m-0 text-[11px] text-[var(--color-ink-subtle)]">
            {locale.brand.sidebarCaption}
          </p>
        </div>
    </>
  );

  return (
    <>
        <aside
          className="sticky top-[var(--layout-header-height)] hidden h-[calc(100vh-var(--layout-header-height))] shrink-0 border-r border-[var(--color-border-soft)] bg-[var(--color-page-panel)] transition-[width] duration-200 lg:flex lg:flex-col"
          style={{
            width: collapsed
              ? APP_CONSTANTS.DIMENSIONS.SIDEBAR_COLLAPSED_WIDTH
              : APP_CONSTANTS.DIMENSIONS.SIDEBAR_WIDTH,
          }}
        >
        {collapsed ? (
          <div className="flex h-full flex-col items-center justify-between px-3 py-4">
            <div className="flex w-full justify-center">
              <button
                type="button"
                onClick={onExpandSidebarSearch}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-border-soft)] bg-white text-[var(--color-brand-forest)] shadow-sm transition-colors hover:bg-[var(--color-brand-forest-soft)]"
                title={locale.layout.navigation.searchPlaceholder}
                aria-label={locale.layout.navigation.searchPlaceholder}
              >
                <Search size={15} />
              </button>
            </div>

            <div className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-ink-subtle)]">
              {locale.layout.navigation.label}
            </div>

            <div className="h-10 w-10" />
          </div>
        ) : expandedContent}
      </aside>

      <div className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}>
        <button
          type="button"
          aria-label={locale.layout.navigation.mobileClose}
          onClick={onCloseMobile}
          className={`absolute inset-0 bg-[rgba(20,20,18,0.35)] backdrop-blur-sm transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[min(82vw,300px)] border-r border-[var(--color-border-soft)] bg-[var(--color-page-panel)] shadow-[0_24px_80px_rgba(28,27,24,0.16)] transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex h-[var(--layout-header-height)] items-center border-b border-[var(--color-border-soft)] px-4">
            <div>
              <p className="m-0 text-[15px] font-bold tracking-[-0.03em] text-[var(--color-ink-strong)]">{locale.brand.name}</p>
              <p className="mb-0 mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-forest)]">{locale.layout.navigation.label}</p>
            </div>
          </div>
          <div className="flex h-[calc(100%-var(--layout-header-height))] flex-col">{expandedContent}</div>
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
