import apiClient from '../../shared/api-client/ApiClient';
import type { ArticleContentCreateDto, ArticleContentDto } from '../../shared/types/ApiTypes';

export const getArticleContentById = async (id: number): Promise<ArticleContentDto> => {
  const response = await apiClient.get<ArticleContentDto>(`/article/${id}/content`);
  return response.data;
};

export const getArticleContentByNodeId = async (nodeId: number): Promise<ArticleContentDto | null> => {
  const response = await apiClient.get<ArticleContentDto | null>(`/article/node/${nodeId}/content`, {
    validateStatus: (status) => status === 200 || status === 204,
  });

  return response.status === 204 ? null : response.data;
};

export const createArticleContent = async (payload: ArticleContentCreateDto): Promise<ArticleContentDto> => {
  const response = await apiClient.post<ArticleContentDto>('/article/content', payload);
  return response.data;
};

export const updateArticleContent = async (articleId: number, payload: ArticleContentDto): Promise<ArticleContentDto> => {
  const response = await apiClient.put<ArticleContentDto>(`/article/${articleId}/content`, payload);
  return response.data;
};

export const articleService = {
  getArticleContentById,
  getArticleContentByNodeId,
  createArticleContent,
  updateArticleContent,
};
