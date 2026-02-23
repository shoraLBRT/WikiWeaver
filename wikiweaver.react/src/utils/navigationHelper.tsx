import type { NavigationNodeDto } from '../shared/types/ApiTypes';
import { Link } from 'react-router-dom';

export interface TreeNodeData {
  key: string;
  title: React.ReactNode;
  children?: TreeNodeData[];
}

interface ConvertToTreeDataOptions {
  isAdminMode: boolean;
  renderNodeTitle?: (node: NavigationNodeDto) => React.ReactNode;
}

export const convertToTreeData = (
  nodes: NavigationNodeDto[],
  options: ConvertToTreeDataOptions,
): TreeNodeData[] => {
  const { isAdminMode, renderNodeTitle } = options;

  return nodes.map((node) => {
    const title = renderNodeTitle
      ? renderNodeTitle(node)
      : node.article && !isAdminMode
        ? <Link to={`/article/${node.article.id}`}>{node.title}</Link>
        : node.title;

    return {
      key: `node-${node.id}`,
      title,
      children: node.children ? convertToTreeData(node.children, options) : [],
    };
  });
};
