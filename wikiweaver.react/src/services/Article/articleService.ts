import apiClient from '../../shared/api-client/ApiClient'; // Import the axios API client
import type { ArticleContentDto } from '../../shared/types/ApiTypes'; // Import the specific DTO type

// Fetch article content by ID
export const getArticleContentById = async (id: number): Promise<ArticleContentDto> => {
    const response = await apiClient.get<ArticleContentDto>(`/article/${id}/content`);
    return response.data; // Axios automatically parses JSON and stores it in .data
};

// Service object for article content (aggregation)
export const articleService = {
    getArticleContentById,
};