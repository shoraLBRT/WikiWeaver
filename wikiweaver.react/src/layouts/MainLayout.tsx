import React from 'react';
import { Layout, Menu, Space, Tag, Button } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { GithubOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../hooks/useSidebar';
import { APP_CONSTANTS } from '../constants/AppConstants';
import styles from './MainLayout.module.css';

const { Header, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const topMenuItems = [
  { key: '/', label: <Link to="/">Lib</Link> },
  { key: '/article/new', label: <Link to="/article/new">Blog</Link> },
  { key: '/admin', label: <Link to="/admin">Q&amp;A</Link> },
];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { collapsed, toggleCollapsed } = useSidebar();

  const sidebarSpaceWidth = collapsed
    ? APP_CONSTANTS.DIMENSIONS.SIDEBAR_COLLAPSED_WIDTH
    : APP_CONSTANTS.DIMENSIONS.SIDEBAR_WIDTH;

  return (
    <Layout className={styles.mainLayout}>
      <Header className={styles.header}>
        <div className={styles.sidebarSpacer} style={{ width: sidebarSpaceWidth }} />

        <div className={styles.headerMainStart}>
          <Button
            type="text"
            aria-label={collapsed ? 'Open navigation panel' : 'Close navigation panel'}
            icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
            onClick={toggleCollapsed}
            className={styles.navToggleButton}
          />
        </div>

        <div className={styles.headerCenter}>
          <Menu
            mode="horizontal"
            className={styles.topMenu}
            items={topMenuItems}
            selectedKeys={[location.pathname]}
          />
        </div>

        <Space size={12} className={styles.headerRight}>
          <Tag bordered={false} className={styles.versionTag}>0.20.1</Tag>
          <Button size="small">RTL</Button>
          <Button type="text" icon={<GithubOutlined />} />
        </Space>
      </Header>

      <Layout className={styles.pageLayout}>
        <Sidebar collapsed={collapsed} />
        <Content className={styles.content}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
