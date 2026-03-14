import type { NavigationArticleDto } from '../shared/types/ApiTypes';

export interface TreeNodeData {
  key: string;
  title: string;
  articleId?: number;
  selectable?: boolean;
  children?: TreeNodeData[];
}

export const convertToTreeData = (articles: NavigationArticleDto[]): TreeNodeData[] =>
  articles.map((article) => ({
    articleId: article.hasContent ? article.id : undefined,
    key: `article-${article.id}`,
    selectable: article.hasContent,
    title: article.title,
    children: article.children ? convertToTreeData(article.children) : [],
  }));
