import React from 'react';
import { Layout, Button, theme } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { getNavigationTree } from '../services/Article/navigationService';
import { useQuery } from '@tanstack/react-query';
import NavigationMenu from '../components/NavigationMenu';
import styles from './MainLayout.module.css';
import { useSidebar } from '../hooks/useSidebar';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { collapsed, toggleCollapsed } = useSidebar();
    const { token } = theme.useToken();

    // Используем useQuery для получения данных навигации
    const { data: navigationTree, isLoading, error } = useQuery({
        queryKey: ['navigationTree'],
        queryFn: getNavigationTree,
    });

    return (
        <Layout className={styles.mainLayout}>
            <Header className={styles.header}>
                <div className={styles.headerBrandSection}>
                    <Link to="/" className={styles.headerBrandLink}>
                        <h1>WikiWeaver</h1>
                    </Link>
                </div>
            </Header>
            <Layout hasSider>
                <Sider
                    className={styles.sider}
                    trigger={null}
                    width={300}
                    collapsible
                    collapsed={collapsed}
                    onCollapse={toggleCollapsed}
                >
                    {collapsed && (
                        <Button
                            type="text"
                            icon={<MenuUnfoldOutlined />}
                            onClick={toggleCollapsed}
                            className={styles.siderButton}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                left: '16px',
                                zIndex: 1,
                            }}
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
                        <NavigationMenu
                            navigationTree={navigationTree}
                            isLoading={isLoading}
                            error={error as Error}
                        />
                    )}
                </Sider>
                <Layout style={{ margin: '16px 16px 16px 0' }}>
                    <Content className={styles.content}>
                        <div className={styles.contentWrapper}>
                            {children}
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    );
};

export default MainLayout;