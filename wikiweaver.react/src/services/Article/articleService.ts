import apiClient from '../../shared/api-client/ApiClient';
import type { ArticleContentCreateDto, ArticleContentDto } from '../../shared/types/ApiTypes';

export const getArticleContentById = async (id: number): Promise<ArticleContentDto> => {
  const response = await apiClient.get<ArticleContentDto>(`/articles/${id}/content`);
  return response.data;
};

export const createArticleContent = async (payload: ArticleContentCreateDto): Promise<ArticleContentDto> => {
  const response = await apiClient.post<ArticleContentDto>('/articles/content', payload);
  return response.data;
};

export const articleService = {
  getArticleContentById,
  createArticleContent,
};
