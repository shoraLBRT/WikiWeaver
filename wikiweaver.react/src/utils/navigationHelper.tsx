import type { NavigationArticleDto } from '../shared/types/ApiTypes';

export interface TreeNodeData {
  key: string;
  title: string;
  articleId: number;
  hasContent: boolean;
  selectable: boolean;
  children?: TreeNodeData[];
}

export const convertToTreeData = (articles: NavigationArticleDto[]): TreeNodeData[] =>
  articles.map((article) => ({
    articleId: article.id,
    key: `article-${article.id}`,
    hasContent: article.hasContent,
    selectable: article.hasContent,
    title: article.title,
    children: article.children ? convertToTreeData(article.children) : [],
  }));
