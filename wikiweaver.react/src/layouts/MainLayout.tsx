import React, { useState } from 'react';
import { Layout, Button, theme } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { getNavigationTree } from '../services/Article/navigationService';
import { useQuery } from '@tanstack/react-query';
import NavigationMenu from '../components/NavigationMenu';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    // Используем useQuery для получения данных навигации
    const { data: navigationTree, isLoading, error } = useQuery({
        queryKey: ['navigationTree'],
        queryFn: getNavigationTree,
    });

    return (
        <Layout style={{ minHeight: '100vh', background: '#ffffff' }}>
            <Header className="header" style={{
                margin: '0 0px',
                padding: '0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
                width: '100%',
                height: 64,
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: 300,
                    borderRight: '2px solid #000000',
                    borderBottom: '2px solid #000000'
                }}>
                    <Link to="/">
                        <h1 style={{ color: 'black', paddingInline: 20, fontSize: '24px', width:300 }}>WikiWeaver</h1>
                    </Link>
                </div>
            </Header>
            <Layout hasSider>
                <Sider
                    trigger={null}
                    width={300}
                    collapsible
                    style={{
                        backgroundColor: 'white',
                        position: 'relative',
                        borderRight: '2px solid #000000'
                    }}
                    collapsed={collapsed}
                    onCollapse={(value) => setCollapsed(value)}
                >
                    {collapsed && (
                        <Button
                            type="text"
                            icon={<MenuUnfoldOutlined />}
                            onClick={() => setCollapsed(false)}
                            style={{
                                color: 'black',
                                fontSize: '16px',
                                position: 'absolute',
                                top: '16px',
                                left: '16px',
                                zIndex: 1,
                            }}
                        />
                    )}
                    {!collapsed && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px' }}>
                            <Button
                                type="text"
                                icon={<MenuFoldOutlined />}
                                onClick={() => setCollapsed(true)}
                                style={{
                                    color: 'black',
                                    fontSize: '16px',
                                }}
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
                    <Content
                        style={{
                            padding: 24,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                            minHeight: 'calc(100vh - 32px - 32px - 64px)', // Вычесть высоту header, margin и padding
                        }}
                    >
                        <div style={{ height: '100%' }}>
                            {children}
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    );
};

export default MainLayout;