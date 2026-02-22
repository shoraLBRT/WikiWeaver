import apiClient from '../../shared/api-client/ApiClient';
import type { NavigationNodeDto } from '../../shared/types/ApiTypes';

export const getNavigationTree = async (): Promise<NavigationNodeDto[]> => {
  const response = await apiClient.get<NavigationNodeDto[]>('/navigationTree/tree');
  return response.data;
};

export const navigationService = {
  getNavigationTree,
};
