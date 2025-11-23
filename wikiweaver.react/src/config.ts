const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5172';

const NAVIGATION_URL = `${API_BASE_URL}/navigationTree`;
const ARTICLES_URL = `${API_BASE_URL}/article`;

export {
    API_BASE_URL,
    ARTICLES_URL,
    NAVIGATION_URL
};