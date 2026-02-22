import axios, { type AxiosInstance } from 'axios';
import { API_BASE_URL } from '../../config';
import { getStoredAdminToken } from '../../services/authTokenStorage';
import { toApiError } from './apiError';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);

export default apiClient;
