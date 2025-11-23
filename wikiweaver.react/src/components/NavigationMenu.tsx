import React from 'react';
import { Tree } from 'antd';
import type { NavigationNodeDto } from '../shared/types/ApiTypes';
import { convertToTreeData } from '../utils/navigationHelper';
import { useNavigate } from 'react-router-dom';
import styles from './NavigationMenu.module.css';

interface NavigationMenuProps {
  navigationTree?: NavigationNodeDto[];
  isLoading: boolean;
  error?: Error | null;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ navigationTree, isLoading, error }) => {
  const navigate = useNavigate();

  // Обработка клика по элементу дерева
  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    const key = selectedKeys[0] as string;
    if (key.startsWith('article-')) {
      const articleId = key.split('article-')[1];
      navigate(`/article/${articleId}`);
    }
  };

  const treeData = navigationTree ? convertToTreeData(navigationTree) : [];

  return (
    <div className={styles.navigationMenuContainer}>
      {isLoading && (
        <div className={styles.navigationMenuLoading}>
          Loading navigation...
        </div>
      )}
      {error && (
        <div className={styles.navigationMenuError}>
          Error loading navigation: {error.message}
        </div>
      )}
      {navigationTree && (
        <Tree
          className={styles.treeContainer}
          treeData={treeData}
          onSelect={handleTreeSelect}
          defaultExpandAll
        />
      )}
    </div>
  );
};

export default NavigationMenu;