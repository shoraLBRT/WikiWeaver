import axios, { type AxiosInstance } from 'axios';
import { API_BASE_URL } from '../../config';
import { clearStoredAdminToken, getStoredAdminToken, notifyAdminSessionExpired } from '../../services/authTokenStorage';
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
  (error: unknown) => {
    const apiError = toApiError(error);

    if (apiError.status === 401) {
      clearStoredAdminToken();

      if (import.meta.env.DEV) {
        const traceSuffix = apiError.traceId ? ` TraceId: ${apiError.traceId}` : '';
        console.warn(`[auth] Admin session expired.${traceSuffix}`);
      }

      notifyAdminSessionExpired();
    }

    return Promise.reject(apiError);
  },
);

export default apiClient;
