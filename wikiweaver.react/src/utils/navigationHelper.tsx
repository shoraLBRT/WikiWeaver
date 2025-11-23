import type { NavigationNodeDto } from '../shared/types/ApiTypes';
import { Link } from 'react-router-dom';

// Тип для данных, которые использует компонент Tree
export interface TreeNodeData {
  key: string;
  title: React.ReactNode;
  children?: TreeNodeData[];
}

export const convertToTreeData = (nodes: NavigationNodeDto[]): TreeNodeData[] => {
  return nodes.map(node => {
    const title = node.article ? (
      <Link to={`/article/${node.article.id}`}>{node.title}</Link>
    ) : (
      node.title
    );

    return {
      key: node.article ? `article-${node.article.id}` : `node-${node.id}`,
      title,
      children: node.children ? convertToTreeData(node.children) : [],
    };
  });
};