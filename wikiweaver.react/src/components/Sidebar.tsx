import React from 'react';
import { Layout, Button, Spin, Alert } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { LoadingOutlined } from '@ant-design/icons';
import { getNavigationTree } from '../services/Article/navigationService';
import { useQuery } from '@tanstack/react-query';
import NavigationTree from './NavigationTree';
import { useSidebar } from '../hooks/useSidebar';
import { APP_CONSTANTS } from '../constants/AppConstants';
import styles from './Sidebar.module.css';

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const { collapsed, toggleCollapsed } = useSidebar();

  // Используем useQuery для получения данных навигации
  const { data: navigationTree, isLoading, error } = useQuery({
    queryKey: [APP_CONSTANTS.QUERY_KEYS.NAVIGATION_TREE],
    queryFn: getNavigationTree,
  });

  return (
    <Sider
      className={styles.sider}
      trigger={null}
      width={APP_CONSTANTS.DIMENSIONS.SIDEBAR_WIDTH}
      collapsible
      collapsed={collapsed}
      onCollapse={toggleCollapsed}
    >
      {collapsed && (
        <Button
          type="text"
          icon={<MenuUnfoldOutlined />}
          onClick={toggleCollapsed}
          className={styles.siderCollapseButton}
        />
      )}
      {!collapsed && (
        <div className={styles.siderButtonExpanded}>
          <Button
            type="text"
            icon={<MenuFoldOutlined />}
            onClick={toggleCollapsed}
            className={styles.siderButton}
          />
        </div>
      )}
      {!collapsed && (
        isLoading ? (
          <div className={styles.loadingContainer}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          </div>
        ) : error ? (
          <Alert
            message={APP_CONSTANTS.ERROR_MESSAGES.LOADING_NAVIGATION}
            description={(error as Error).message}
            type="error"
            showIcon
            className={styles.errorAlert}
          />
        ) : (
          <NavigationTree
            navigationTree={navigationTree}
          />
        )
      )}
    </Sider>
  );
};

export default Sidebar;