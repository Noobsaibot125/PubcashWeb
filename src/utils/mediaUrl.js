// src/utils/mediaUrl.js

/**
 * Génère l'URL complète pour les médias (images, vidéos)
 * S'adapte automatiquement à l'environnement
 */
export const getMediaUrl = (path) => {
  if (!path) return null;
  
  // Si c'est déjà une URL complète
  if (path.startsWith('http')) return path;
  
  // Déterminer l'URL de base
  let baseUrl = process.env.REACT_APP_API_URL || '';
  
  // Si on est en production et que l'URL de base contient /api, on le retire
  if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.slice(0, -4);
  }
  
  // Si on n'a pas d'URL de base définie, utiliser l'origine actuelle
  if (!baseUrl) {
    baseUrl = window.location.origin;
  }
  
  // Gérer les différents formats de chemins
  if (path.startsWith('/uploads/')) {
    // Chemin absolu commençant par /uploads/
    return `${baseUrl}${path}`;
  } else if (path.startsWith('uploads/')) {
    // Chemin relatif commençant par uploads/
    return `${baseUrl}/${path}`;
  } else if (path.startsWith('/')) {
    // Autre chemin absolu
    return `${baseUrl}${path}`;
  } else {
    // Chemin relatif simple
    return `${baseUrl}/${path}`;
  }
};
  
  /**
   * Version de debug qui loggue les URLs
   */
  export const getMediaUrlDebug = (path, context = '') => {
    const url = getMediaUrl(path);
    console.log(`🖼️ Media URL [${context}]:`, { path, finalUrl: url });
    return url;
  };