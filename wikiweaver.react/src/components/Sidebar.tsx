import React, { useMemo, useState } from 'react';
import { Layout, Spin, Alert, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { LoadingOutlined } from '@ant-design/icons';
import { getNavigationTree } from '../services/Article/navigationService';
import { useQuery } from '@tanstack/react-query';
import NavigationTree from './NavigationTree';
import { APP_CONSTANTS } from '../constants/AppConstants';
import { locale } from '../localization';
import styles from './Sidebar.module.css';
import type { NavigationNodeDto } from '../shared/types/ApiTypes';

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
      {!collapsed && (
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
      )}

      {!collapsed && (
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
            <NavigationTree navigationTree={filteredNavigationTree} />
          )}
        </div>
      )}
    </Sider>
  );
};

export default Sidebar;
