import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ArticlePage from '../pages/ArticlePage';
import AddArticlePage from '../pages/AddArticlePage';
import AdminLoginPage from '../pages/AdminLoginPage';
import AdminPage from '../pages/AdminPage';
import EditArticlePage from '../pages/EditArticlePage';
import WelcomePage from '../pages/WelcomePage';
import { isAdminAuthenticated } from '../services/authService';
import { customTheme } from '../theme/themeConfig';

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
              <Route path="/admin" element={<AdminOnlyRoute><AdminPage /></AdminOnlyRoute>} />
              <Route path="/article/new" element={<AdminOnlyRoute><AddArticlePage /></AdminOnlyRoute>} />
              <Route
                path="/admin/articles/:articleId/edit"
                element={<AdminOnlyRoute><EditArticlePage /></AdminOnlyRoute>}
              />
            </Routes>
          </MainLayout>
        </Router>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
