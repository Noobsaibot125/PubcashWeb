// src/services/api.js
import axios from 'axios';

// Correction : Utiliser une URL absolue en production
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'https://votre-domaine.com/api';
  } else {
    return process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  }
};

const BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Augmenter le timeout pour les uploads (5 minutes)
  timeout: 300000,
});

// Ajouter des logs pour le débogage
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');

    console.log('🌐 Requête API:', {
      url: config.url,
      baseURL: config.baseURL,
      hasToken: !!accessToken,
      method: config.method
    });

    if (accessToken && typeof accessToken === 'string' && accessToken.trim() !== '') {
      const cleanToken = accessToken.trim().replace(/^Bearer\s+/i, '');
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${cleanToken}`;
    }

    return config;
  },
  (error) => {
    console.error('❌ Erreur requête API:', error);
    return Promise.reject(error);
  }
);

// Response interceptor avec meilleur logging
api.interceptors.response.use(
  response => {
    console.log('✅ Réponse API réussie:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.error('❌ Erreur réponse API:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    const originalConfig = error.config;
    if (!originalConfig) return Promise.reject(error);
    if (originalConfig.url && originalConfig.url.includes('/auth/refresh-token')) {
      return Promise.reject(error);
    }

    // Cas 401 - Token expiré ou invalide
    if (error.response && error.response.status === 401 && !originalConfig._retry) {
      // IMPORTANT : Ne pas rediriger si l'erreur vient d'une tentative de connexion (login)
      if (originalConfig.url && originalConfig.url.includes('/login')) {
        return Promise.reject(error);
      }

      originalConfig._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        // Déterminer la page de login en fonction du rôle
        const userRole = localStorage.getItem('userRole');
        let loginUrl = '/auth/login-client';
        if (userRole === 'superadmin' || userRole === 'admin') {
          loginUrl = '/auth/login-admin';
        } else if (userRole === 'utilisateur') {
          loginUrl = '/auth/login-user';
        }

        if (!refreshToken) {
          // Pas de refresh token -> déconnexion
          localStorage.clear();
          window.location.href = loginUrl;
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
          window.location.href = loginUrl;
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

        // Redirection basée sur le rôle (même logique)
        const userRole = localStorage.getItem('userRole');
        let loginUrl = '/auth/login-client';
        if (userRole === 'superadmin' || userRole === 'admin') {
          loginUrl = '/auth/login-admin';
        } else if (userRole === 'utilisateur') {
          loginUrl = '/auth/login-user';
        }
        window.location.href = loginUrl;

        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Supprime '/api' de la fin de BASE_URL pour obtenir la racine du serveur
  const rootUrl = BASE_URL.replace(/\/api$/, '');
  return `${rootUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default api;