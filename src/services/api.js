// src/services/api.js - VERSION CORRIGÉE POUR LA PRODUCTION
import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // MODIFICATION 1 : L'URL de base est maintenant TOUJOURS relative
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

    if (!originalConfig || (originalConfig.url && originalConfig.url.includes('/auth/refresh-token'))) {
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          localStorage.clear();
          window.location.href = '/auth/login';
          return Promise.reject(new Error('No refresh token'));
        }

        // MODIFICATION 2 : Utiliser axios avec un chemin relatif pour le refresh
        const rs = await axios.post('/api/auth/refresh-token', { token: refreshToken }, {
          headers: { 'Content-Type': 'application/json' }
        });

        const { accessToken: newAccessToken } = rs.data || {};
        if (!newAccessToken) {
          localStorage.clear();
          window.location.href = '/auth/login';
          return Promise.reject(new Error('Refresh failed'));
        }

        localStorage.setItem('accessToken', newAccessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalConfig.headers = originalConfig.headers || {};
        originalConfig.headers['Authorization'] = `Bearer ${newAccessToken}`;

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