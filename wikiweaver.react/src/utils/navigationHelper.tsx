import type { NavigationNodeDto } from '../shared/types/ApiTypes';

export interface TreeNodeData {
  key: string;
  title: string;
  articleId?: number;
  children?: TreeNodeData[];
}

export const convertToTreeData = (nodes: NavigationNodeDto[]): TreeNodeData[] =>
  nodes.map((node) => ({
    articleId: node.article?.id,
    key: node.article ? `article-${node.article.id}` : `node-${node.id}`,
    title: node.title,
    children: node.children ? convertToTreeData(node.children) : [],
  }));
