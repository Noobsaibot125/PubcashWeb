// src/services/api.js
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

//const BASE_URL = process.env.REACT_APP_API_URL || 'http://31.97.68.170:5000/api';
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor : ajoute access token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor : gère 401 -> refresh token
api.interceptors.response.use(
  response => response,
  async (error) => {
    const originalConfig = error.config;

    // Protection : si pas de config ou si on est déjà sur /auth/refresh-token -> rejeter
    if (!originalConfig) return Promise.reject(error);
    if (originalConfig.url && originalConfig.url.includes('/auth/refresh-token')) {
      return Promise.reject(error);
    }

    // Cas 401
    if (error.response && error.response.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // pas de refresh -> logout
          localStorage.clear();
          window.location.href = '/auth/login';
          return Promise.reject(new Error('No refresh token'));
        }

        // Utiliser axios (global) avec BASE_URL pour refresh
        const rs = await axios.post(`${BASE_URL}/auth/refresh-token`, { token: refreshToken }, {
          headers: { 'Content-Type': 'application/json' }
        });

        const { accessToken: newAccessToken } = rs.data || {};
        if (!newAccessToken) {
          // refresh non valide
          localStorage.clear();
          window.location.href = '/auth/login';
          return Promise.reject(new Error('Refresh failed'));
        }

        // stocke et met à jour l'instance
        localStorage.setItem('accessToken', newAccessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalConfig.headers = originalConfig.headers || {};
        originalConfig.headers['Authorization'] = `Bearer ${newAccessToken}`;

        // relancer la requête originale
        return api(originalConfig);
      } catch (refreshErr) {
        console.error('Refresh token failed:', refreshErr);
        localStorage.clear();
        window.location.href = '/auth/login';
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
