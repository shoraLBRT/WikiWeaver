import React from 'react';
import { Layout, Menu, Button, Typography, Tooltip } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LeftOutlined, RightOutlined, SafetyCertificateOutlined, LogoutOutlined } from '@ant-design/icons';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../hooks/useSidebar';
import { APP_CONSTANTS } from '../constants/AppConstants';
import { clearStoredAdminToken } from '../services/authTokenStorage';
import { isAdminAuthenticated } from '../services/authService';
import { locale } from '../localization';
import styles from './MainLayout.module.css';

const { Header, Content } = Layout;
const { Title } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const topMenuItems = [
  { key: '/', label: <Link to="/">{locale.layout.menu.home}</Link> },
  { key: '/article/new', label: <Link to="/article/new">{locale.layout.menu.addArticle}</Link> },
  { key: '/admin', label: <Link to="/admin">{locale.layout.menu.admin}</Link> },
];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { collapsed, toggleCollapsed } = useSidebar();
  const isAdmin = isAdminAuthenticated();

  const sidebarSpaceWidth = collapsed
    ? APP_CONSTANTS.DIMENSIONS.SIDEBAR_COLLAPSED_WIDTH
    : APP_CONSTANTS.DIMENSIONS.SIDEBAR_WIDTH;

  return (
    <Layout className={styles.mainLayout}>
      <Header className={styles.header}>
        <div className={styles.sidebarSpacer} style={{ width: sidebarSpaceWidth }}>
          <Title level={4} className={`${styles.headerTitle} ${collapsed ? styles.headerTitleCollapsed : ''}`}>
            {locale.app.name}
          </Title>
        </div>

        <div className={styles.headerMainStart}>
          <Button
            type="text"
            aria-label={collapsed ? locale.layout.navigation.open : locale.layout.navigation.close}
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

        <div className={styles.headerActions}>
          <Tooltip title="Админ панель">
            <Button
              type="text"
              icon={<SafetyCertificateOutlined />}
              onClick={() => navigate(isAdmin ? '/admin' : '/admin/login')}
            />
          </Tooltip>
          {isAdmin && (
            <Tooltip title="Выйти">
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={() => {
                  clearStoredAdminToken();
                  navigate('/');
                }}
              />
            </Tooltip>
          )}
        </div>
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
