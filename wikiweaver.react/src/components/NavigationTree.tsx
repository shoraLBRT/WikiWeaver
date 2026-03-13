import React from 'react';
import { EditOutlined } from '@ant-design/icons';
import { Button, Tree } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import type { NavigationNodeDto } from '../shared/types/ApiTypes';
import { convertToTreeData, type TreeNodeData } from '../utils/navigationHelper';
import styles from './NavigationTree.module.css';

interface NavigationTreeProps {
  navigationTree?: NavigationNodeDto[];
  showArticleEditActions?: boolean;
}

const editArticleLabel = 'Редактировать статью';

const NavigationTree: React.FC<NavigationTreeProps> = ({
  navigationTree,
  showArticleEditActions = false,
}) => {
  const navigate = useNavigate();

  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    const key = selectedKeys[0] as string | undefined;

    if (!key?.startsWith('article-')) {
      return;
    }

    const articleId = key.split('article-')[1];
    navigate(`/article/${articleId}`);
  };

  const treeData = navigationTree ? convertToTreeData(navigationTree) : [];

  return (
    <div className={styles.navigationTreeContainer}>
      <Tree
        className={styles.treeContainer}
        treeData={treeData}
        onSelect={handleTreeSelect}
        defaultExpandAll
        titleRender={(node) => {
          const treeNode = node as TreeNodeData;

          if (!treeNode.articleId) {
            return treeNode.title;
          }

          return (
            <div className={styles.treeTitle}>
              <Link className={styles.articleLink} to={`/article/${treeNode.articleId}`}>
                {treeNode.title}
              </Link>
              {showArticleEditActions ? (
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  aria-label={editArticleLabel}
                  title={editArticleLabel}
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/admin/articles/${treeNode.articleId}/edit`);
                  }}
                />
              ) : null}
            </div>
          );
        }}
      />
    </div>
  );
};

export default NavigationTree;
