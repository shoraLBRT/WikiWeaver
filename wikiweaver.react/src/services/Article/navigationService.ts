import apiClient from '../../shared/api-client/ApiClient';
import type { NavigationArticleDto } from '../../shared/types/ApiTypes';

export const getNavigationTree = async (): Promise<NavigationArticleDto[]> => {
  const response = await apiClient.get<NavigationArticleDto[]>('/navigationTree/tree');
  return response.data;
};

export const navigationService = {
  getNavigationTree,
};
