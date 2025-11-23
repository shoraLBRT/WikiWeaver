import axios, { type AxiosInstance } from 'axios';
import { API_BASE_URL } from '../../config'; // Path to config.ts from shared/api-client/

// Create an axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL, // Base URL for all requests
  timeout: 10000, // Request timeout (10 seconds)
  headers: {
    'Content-Type': 'application/json', // Set default Content-Type header
  },
});

export default apiClient;