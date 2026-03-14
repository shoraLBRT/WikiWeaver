import React from 'react';
import { EditOutlined } from '@ant-design/icons';
import { Button, Tree } from 'antd';
import type { TreeProps } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import type { NavigationArticleDto } from '../shared/types/ApiTypes';
import { convertToTreeData, type TreeNodeData } from '../utils/navigationHelper';
import styles from './NavigationTree.module.css';

interface NavigationTreeProps {
  navigationTree?: NavigationArticleDto[];
  showArticleEditActions?: boolean;
}

const editArticleLabel = 'Ðåäàêòèðîâàòü ñòàòüþ';

const NavigationTree: React.FC<NavigationTreeProps> = ({
  navigationTree,
  showArticleEditActions = false,
}) => {
  const navigate = useNavigate();

  const handleTreeSelect: TreeProps<TreeNodeData>['onSelect'] = (_, info) => {
    const selectedNode = info.selectedNodes[0] as TreeNodeData | undefined;

    if (!selectedNode?.hasContent) {
      return;
    }

    navigate(`/article/${selectedNode.articleId}`);
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

          const articleTitle = treeNode.hasContent ? (
            <Link className={styles.articleLink} to={`/article/${treeNode.articleId}`}>
              {treeNode.title}
            </Link>
          ) : (
            treeNode.title
          );

          return (
            <div className={styles.treeTitle}>
              {articleTitle}
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
