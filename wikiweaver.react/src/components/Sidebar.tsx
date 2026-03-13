import React, { useMemo, useState } from 'react';
import { LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Input, Layout, Spin } from 'antd';
import { useLocation } from 'react-router-dom';
import { APP_CONSTANTS } from '../constants/AppConstants';
import { locale } from '../localization';
import { getNavigationTree } from '../services/Article/navigationService';
import type { NavigationNodeDto } from '../shared/types/ApiTypes';
import NavigationTree from './NavigationTree';
import styles from './Sidebar.module.css';

const { Sider } = Layout;

const filterNavigationTree = (nodes: NavigationNodeDto[], searchValue: string): NavigationNodeDto[] => {
  const normalizedSearch = searchValue.trim().toLowerCase();

  if (!normalizedSearch) {
    return nodes;
  }

  return nodes.reduce<NavigationNodeDto[]>((filteredNodes, node) => {
    const filteredChildren = node.children
      ? filterNavigationTree(node.children, normalizedSearch)
      : [];

    const isNodeMatch = node.title.toLowerCase().includes(normalizedSearch);
    const isArticleMatch = node.article?.title.toLowerCase().includes(normalizedSearch) ?? false;

    if (isNodeMatch || isArticleMatch || filteredChildren.length > 0) {
      filteredNodes.push({
        ...node,
        children: filteredChildren,
      });
    }

    return filteredNodes;
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
    <Sider
      className={styles.sider}
      trigger={null}
      width={APP_CONSTANTS.DIMENSIONS.SIDEBAR_WIDTH}
      collapsedWidth={APP_CONSTANTS.DIMENSIONS.SIDEBAR_COLLAPSED_WIDTH}
      collapsible
      collapsed={collapsed}
    >
      {!collapsed ? (
        <div className={styles.sidebarHeader}>
          <Input
            className={styles.searchInput}
            prefix={<SearchOutlined />}
            placeholder={locale.layout.navigation.searchPlaceholder}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            allowClear
          />
        </div>
      ) : null}

      {!collapsed ? (
        <div className={styles.navigationSection}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            </div>
          ) : error ? (
            <Alert
              message={locale.sidebar.loadError}
              description={(error as Error).message}
              type="error"
              showIcon
              className={styles.errorAlert}
            />
          ) : (
            <NavigationTree
              navigationTree={filteredNavigationTree}
              showArticleEditActions={showArticleEditActions}
            />
          )}
        </div>
      ) : null}
    </Sider>
  );
};

export default Sidebar;
