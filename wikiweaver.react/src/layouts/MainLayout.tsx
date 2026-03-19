import React, { useState } from 'react';
import {
  ChevronRight,
  Home,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Shield,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { APP_CONSTANTS } from '../constants/AppConstants';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../hooks/useSidebar';
import { useLocalization } from '../localization/hooks';
import { isAdminAuthenticated } from '../services/authService';
import { clearStoredAdminToken } from '../services/authTokenStorage';
import { Button } from '../shared/ui/Button';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { language, locale, setLanguage, supportedLocales } = useLocalization();
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, toggleCollapsed } = useSidebar();
  const isAdmin = isAdminAuthenticated();
  const currentPath = location.pathname;
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isCreateRoute = location.pathname === '/article/new';
  const [mobileSidebarState, setMobileSidebarState] = useState({ open: false, path: currentPath });
  const [searchFocusRequest, setSearchFocusRequest] = useState(0);
  const isMobileSidebarOpen = mobileSidebarState.open && mobileSidebarState.path === currentPath;

  const handleExpandSidebarSearch = () => {
    if (!collapsed) {
      setSearchFocusRequest((current) => current + 1);
      return;
    }

    toggleCollapsed();
    setSearchFocusRequest((current) => current + 1);
  };

  const logoWidth = collapsed
    ? APP_CONSTANTS.DIMENSIONS.SIDEBAR_COLLAPSED_WIDTH
    : APP_CONSTANTS.DIMENSIONS.SIDEBAR_WIDTH;

  return (
    <div className="min-h-screen bg-page-bg text-ink-default">
      <header className="sticky top-0 z-40 flex h-[var(--layout-header-height)] items-stretch border-b border-[var(--color-border-soft)] bg-[rgba(255,255,255,0.94)] backdrop-blur-md">
        <div
          className="hidden items-center border-r border-[var(--color-border-soft)] px-4 transition-[width] duration-200 lg:flex"
          style={{ width: logoWidth }}
        >
          <Link to="/" className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-[15px] font-bold tracking-[-0.03em] text-[var(--color-ink-strong)]">
              {collapsed ? locale.brand.shortName : locale.brand.name}
            </span>
          </Link>
        </div>

        <div className="flex min-w-0 flex-1 items-stretch">
          <div className="flex items-center border-r border-[var(--color-border-soft)] px-2 sm:px-3">
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-page-panel)] hover:text-[var(--color-ink-strong)] lg:flex"
              title={collapsed ? locale.layout.navigation.open : locale.layout.navigation.close}
              aria-label={collapsed ? locale.layout.navigation.open : locale.layout.navigation.close}
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>

            <Link
              to="/"
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-page-panel)] hover:text-[var(--color-brand-forest)]"
              title={locale.layout.menu.home}
              aria-label={locale.layout.menu.home}
            >
              <Home size={16} />
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-2 px-3 sm:px-4">
            {isAdmin ? (
              <Button
                variant={isCreateRoute ? 'primary' : 'secondary'}
                className="hidden sm:inline-flex"
                onClick={() => navigate('/article/new')}
              >
                <Plus size={14} />
                {locale.layout.menu.addArticle}
              </Button>
            ) : null}

            <Button
              variant={isAdminRoute ? 'primary' : 'secondary'}
              onClick={() => navigate('/admin')}
            >
              <Shield size={14} />
              <span className="hidden sm:inline">{locale.layout.actions.adminPanel}</span>
            </Button>

            <label className="flex items-center gap-2 rounded-xl border border-[var(--color-border-soft)] bg-white px-2.5 py-2 text-sm text-[var(--color-ink-muted)]">
              <span className="hidden sm:inline">{locale.layout.actions.language}</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as typeof language)}
                aria-label={locale.layout.actions.language}
                className="bg-transparent text-sm font-medium text-[var(--color-ink-strong)] outline-none"
              >
                {supportedLocales.map((supportedLocale) => (
                  <option key={supportedLocale} value={supportedLocale}>
                    {supportedLocale.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            {isAdmin ? (
              <Button
                variant="ghost"
                onClick={() => {
                  clearStoredAdminToken();
                  navigate('/');
                }}
                aria-label={locale.layout.actions.logout}
                title={locale.layout.actions.logout}
              >
                <LogOut size={15} />
              </Button>
            ) : null}

              <button
                type="button"
                onClick={() => setMobileSidebarState((current) => ({ open: !current.open, path: currentPath }))}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-page-panel)] hover:text-[var(--color-ink-strong)] lg:hidden"
              title={collapsed ? locale.layout.navigation.open : locale.layout.navigation.close}
              aria-label={collapsed ? locale.layout.navigation.open : locale.layout.navigation.close}
            >
              {isMobileSidebarOpen ? <PanelLeftClose size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-var(--layout-header-height))]">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarState({ open: false, path: currentPath })}
          searchFocusRequest={searchFocusRequest}
          onExpandSidebarSearch={handleExpandSidebarSearch}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
