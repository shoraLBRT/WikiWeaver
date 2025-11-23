import { useState, useEffect } from 'react';

// Хук для управления состоянием collapsible sidebar
export const useSidebar = (defaultCollapsed = false) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  // Опционально: сохранение состояния в localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed !== null) {
      setCollapsed(savedCollapsed === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed.toString());
  }, [collapsed]);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return {
    collapsed,
    toggleCollapsed,
    setCollapsed,
  };
};