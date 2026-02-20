import { useEffect, useState } from 'react';

const SIDEBAR_COLLAPSE_STORAGE_KEY = 'sidebarCollapsed';

export const useSidebar = (defaultCollapsed = false) => {
  const [collapsed, setCollapsed] = useState(() => {
    const savedCollapsed = localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY);
    if (savedCollapsed === null) {
      return defaultCollapsed;
    }

    return savedCollapsed === 'true';
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, collapsed.toString());
  }, [collapsed]);

  const toggleCollapsed = () => {
    setCollapsed((prevCollapsed) => !prevCollapsed);
  };

  return {
    collapsed,
    toggleCollapsed,
    setCollapsed,
  };
};
