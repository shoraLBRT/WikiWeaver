import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { customTheme } from '../theme/themeConfig';
import MainLayout from '../layouts/MainLayout';
import WelcomePage from '../pages/WelcomePage';
import ArticlePage from '../pages/ArticlePage';
import AdminPage from '../pages/AdminPage';

// Создаем экземпляр QueryClient
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={customTheme}>
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/article/:id" element={<ArticlePage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </MainLayout>
        </Router>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
