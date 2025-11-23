import apiClient from '../../shared/api-client/ApiClient'; // Import the axios API client
import type { NavigationNodeDto } from '../../shared/types/ApiTypes'; // Import the specific DTO type

// Fetch navigation tree
export const getNavigationTree = async (): Promise<NavigationNodeDto[]> => {
    try {
        const response = await apiClient.get<NavigationNodeDto[]>(`/navigationTree/tree`);
        console.log('Navigation tree response:', response.data); // Логирование для отладки
        return response.data; // Axios automatically parses JSON and stores it in .data
    } catch (error) {
        console.error('Error fetching navigation tree:', error);
        throw error; // Перебрасываем ошибку для обработки в компоненте
    }
};

// Service object for navigation (aggregation)
export const navigationService = {
    getNavigationTree,
};