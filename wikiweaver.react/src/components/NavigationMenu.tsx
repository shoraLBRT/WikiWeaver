import React from 'react';
import { Tree, theme } from 'antd';
import type { NavigationNodeDto } from '../shared/types/ApiTypes';
import { convertToTreeData } from '../utils/navigationHelper';
import { useNavigate } from 'react-router-dom';

interface NavigationMenuProps {
  navigationTree?: NavigationNodeDto[];
  isLoading: boolean;
  error?: Error | null;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ navigationTree, isLoading, error }) => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
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
    <div
      style={{
        background: colorBgContainer,
        margin: '16px 0 16px 16px',
        borderRadius: borderRadiusLG,
        overflow: 'auto',
        height: 'calc(100vh - 32px - 64px)', // Вычесть высоту header и margin
        position: 'sticky',
        top: 16,
      }}
    >
      {isLoading ? (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          Loading navigation...
        </div>
      ) : null}
      {error ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'black' }}>
          Error loading navigation: {error.message}
        </div>
      ) : null}
      {navigationTree && (
        <Tree
          treeData={treeData}
          onSelect={handleTreeSelect}
          defaultExpandAll
          style={{ background: colorBgContainer }}
        />
      )}
    </div>
  );
};

export default NavigationMenu;