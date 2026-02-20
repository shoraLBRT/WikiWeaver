import React from 'react';
import { Layout, Spin, Alert, Input, Typography, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { LoadingOutlined } from '@ant-design/icons';
import { getNavigationTree } from '../services/Article/navigationService';
import { useQuery } from '@tanstack/react-query';
import NavigationTree from './NavigationTree';
import { APP_CONSTANTS } from '../constants/AppConstants';
import styles from './Sidebar.module.css';

const { Sider } = Layout;
const { Title } = Typography;

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { data: navigationTree, isLoading, error } = useQuery({
    queryKey: [APP_CONSTANTS.QUERY_KEYS.NAVIGATION_TREE],
    queryFn: getNavigationTree,
  });

  return (
    <Sider
      className={styles.sider}
      trigger={null}
      width={APP_CONSTANTS.DIMENSIONS.SIDEBAR_WIDTH}
      collapsedWidth={APP_CONSTANTS.DIMENSIONS.SIDEBAR_COLLAPSED_WIDTH}
      collapsible
      collapsed={collapsed}
    >
      <div className={styles.sidebarHeader}>
        <Title level={4} className={`${styles.sidebarTitle} ${collapsed ? styles.sidebarTitleCollapsed : ''}`}>
          {APP_CONSTANTS.APP_NAME}
        </Title>
        {!collapsed ? (
          <Input
            className={styles.searchInput}
            prefix={<SearchOutlined />}
            placeholder="Search"
            readOnly
          />
        ) : (
          <Button type="text" icon={<SearchOutlined />} className={styles.searchIconButton} />
        )}
      </div>

      {!collapsed && (
        <div className={styles.navigationSection}>
          {isLoading ? (
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
            <NavigationTree navigationTree={navigationTree} />
          )}
        </div>
      )}
    </Sider>
  );
};

export default Sidebar;
