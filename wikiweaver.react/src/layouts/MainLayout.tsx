import React from 'react';
import { Layout } from 'antd';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { APP_CONSTANTS } from '../constants/AppConstants';
import styles from './MainLayout.module.css';

const { Header, Content } = Layout;

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {

    return (
        <Layout className={styles.mainLayout}>
            <Header className={styles.header}>
                <div className={styles.headerBrandSection}>
                    <Link to="/" className={styles.headerBrandLink}>
                        <h1>{APP_CONSTANTS.APP_NAME}</h1>
                    </Link>
                </div>
                <div className={styles.headerActions}>
                    <Link to="/admin" className={styles.adminLink}>Admin panel</Link>
                </div>
            </Header>
            <Layout hasSider>
                <Sidebar />
                <Layout style={{
                  margin: `${APP_CONSTANTS.MARGINS.SIDEBAR}px ${APP_CONSTANTS.MARGINS.SIDEBAR}px ${APP_CONSTANTS.MARGINS.SIDEBAR}px 0`
                }}>
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
