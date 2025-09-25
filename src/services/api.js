// src/services/api.js
import axios from 'axios';

// URL de base intelligente qui s'adapte à l'environnement
const BASE_URL = process.env.REACT_APP_API_URL || '/api';

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
    
    // Validation robuste du token
    if (accessToken && typeof accessToken === 'string' && accessToken.trim() !== '') {
      // Nettoyer le token (supprimer 'Bearer ' s'il est déjà présent)
      const cleanToken = accessToken.trim().replace(/^Bearer\s+/i, '');
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${cleanToken}`;
      
      // Log pour debug (à supprimer en production)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Token envoyé:', cleanToken.substring(0, 20) + '...');
      }
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

    // Cas 401 - Token expiré ou invalide
    if (error.response && error.response.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // Pas de refresh token -> déconnexion
          localStorage.clear();
          window.location.href = '/auth/login';
          return Promise.reject(new Error('No refresh token'));
        }

        // Utiliser l'URL complète pour le refresh
        const refreshUrl = `${BASE_URL}/auth/refresh-token`;
        const rs = await axios.post(refreshUrl, { token: refreshToken }, {
          headers: { 'Content-Type': 'application/json' }
        });

        const { accessToken: newAccessToken } = rs.data || {};
        if (!newAccessToken) {
          // Refresh non valide
          localStorage.clear();
          window.location.href = '/auth/login';
          return Promise.reject(new Error('Refresh failed'));
        }

        // Stocker et mettre à jour l'instance
        localStorage.setItem('accessToken', newAccessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalConfig.headers = originalConfig.headers || {};
        originalConfig.headers['Authorization'] = `Bearer ${newAccessToken}`;

        // Relancer la requête originale
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