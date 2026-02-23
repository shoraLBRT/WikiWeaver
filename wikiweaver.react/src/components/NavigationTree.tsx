import React from 'react';
import { Button, Popconfirm, Space, Tree, Typography } from 'antd';
import type { NavigationNodeDto } from '../shared/types/ApiTypes';
import { convertToTreeData } from '../utils/navigationHelper';
import { useNavigate } from 'react-router-dom';
import { locale } from '../localization';
import styles from './NavigationTree.module.css';

interface NavigationTreeProps {
  navigationTree?: NavigationNodeDto[];
  isAdminMode?: boolean;
  onDeleteNode?: (node: NavigationNodeDto) => void;
}

const NavigationTree: React.FC<NavigationTreeProps> = ({
  navigationTree,
  isAdminMode = false,
  onDeleteNode,
}) => {
  const navigate = useNavigate();

  const nodeLookup = React.useMemo(() => {
    const map = new Map<number, NavigationNodeDto>();

    const visit = (nodes: NavigationNodeDto[]) => {
      nodes.forEach((node) => {
        map.set(node.id, node);
        if (node.children?.length) {
          visit(node.children);
        }
      });
    };

    if (navigationTree) {
      visit(navigationTree);
    }

    return map;
  }, [navigationTree]);

  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    const key = selectedKeys[0] as string | undefined;
    if (!key?.startsWith('node-')) {
      return;
    }

    const nodeId = Number(key.slice('node-'.length));
    const selectedNode = nodeLookup.get(nodeId);
    if (!selectedNode) {
      return;
    }

    if (isAdminMode) {
      navigate(`/article/edit/node/${nodeId}`);
      return;
    }

    if (selectedNode.article) {
      navigate(`/article/${selectedNode.article.id}`);
    }
  };

  const treeData = navigationTree
    ? convertToTreeData(navigationTree, {
      isAdminMode,
      renderNodeTitle: isAdminMode
        ? (node) => (
            <Space size="small">
              <span>{node.title}</span>
              <Typography.Text type="secondary">#{node.id}</Typography.Text>
              <span onClick={(event) => event.stopPropagation()}>
              <Popconfirm
                title={locale.adminPage.deleteNode}
                description={`${locale.adminPage.deleteNode}: "${node.title}"?`}
                okText={locale.common.delete}
                okButtonProps={{ danger: true }}
                onConfirm={() => onDeleteNode?.(node)}
              >
                <Button size="small" danger>{locale.common.delete}</Button>
              </Popconfirm>
              </span>
            </Space>
          )
        : undefined,
    })
    : [];

  return (
    <div className={styles.navigationTreeContainer}>
      <Tree
        className={styles.treeContainer}
        treeData={treeData}
        onSelect={handleTreeSelect}
        defaultExpandAll
      />
    </div>
  );
};

export default NavigationTree;
