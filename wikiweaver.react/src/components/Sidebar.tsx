import React, { useMemo, useState } from 'react';
import { Layout, Spin, Alert, Input, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { LoadingOutlined } from '@ant-design/icons';
import { getNavigationTree } from '../services/Article/navigationService';
import { deleteNode } from '../services/adminService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NavigationTree from './NavigationTree';
import { APP_CONSTANTS } from '../constants/AppConstants';
import { locale } from '../localization';
import styles from './Sidebar.module.css';
import type { NavigationNodeDto } from '../shared/types/ApiTypes';
import { isAdminAuthenticated } from '../services/authService';
import { useLocation } from 'react-router-dom';

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
  const queryClient = useQueryClient();
  const location = useLocation();
  const [messageApi, contextHolder] = message.useMessage();

  const isAdminMode =
    isAdminAuthenticated()
    && (location.pathname.startsWith('/admin') || location.pathname.startsWith('/article/edit'));

  const { data: navigationTree, isLoading, error } = useQuery({
    queryKey: [APP_CONSTANTS.QUERY_KEYS.NAVIGATION_TREE],
    queryFn: getNavigationTree,
  });

  const deleteNodeMutation = useMutation({
    mutationFn: deleteNode,
    onSuccess: async () => {
      messageApi.success(locale.adminPage.nodeDeleted);
      await queryClient.invalidateQueries({ queryKey: [APP_CONSTANTS.QUERY_KEYS.NAVIGATION_TREE] });
      await queryClient.invalidateQueries({ queryKey: [APP_CONSTANTS.QUERY_KEYS.ADMIN_NODES] });
    },
    onError: (mutationError) => {
      messageApi.error(`${locale.adminPage.nodeDeleteFailed}: ${(mutationError as Error).message}`);
    },
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
      {contextHolder}
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
            <NavigationTree
              navigationTree={filteredNavigationTree}
              isAdminMode={isAdminMode}
              onDeleteNode={(node) => deleteNodeMutation.mutate(node.id)}
            />
          )}
        </div>
      )}
    </Sider>
  );
};

export default Sidebar;
