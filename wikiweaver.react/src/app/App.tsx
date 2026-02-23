import type { ReactElement } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { customTheme } from '../theme/themeConfig';
import MainLayout from '../layouts/MainLayout';
import WelcomePage from '../pages/WelcomePage';
import ArticlePage from '../pages/ArticlePage';
import AdminPage from '../pages/AdminPage';
import AddArticlePage from '../pages/AddArticlePage';
import AdminLoginPage from '../pages/AdminLoginPage';
import { isAdminAuthenticated } from '../services/authService';

const queryClient = new QueryClient();

const AdminOnlyRoute = ({ children }: { children: ReactElement }) => {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={customTheme}>
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/article/:id" element={<ArticlePage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/article/new" element={<AdminOnlyRoute><AddArticlePage /></AdminOnlyRoute>} />
              <Route path="/article/edit/node/:nodeId" element={<AdminOnlyRoute><AddArticlePage /></AdminOnlyRoute>} />
            </Routes>
          </MainLayout>
        </Router>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
