// src/utils/mediaUrl.js

/**
 * Génère l'URL complète pour les médias (images, vidéos)
 * S'adapte automatiquement à l'environnement
 */
export const getMediaUrl = (path) => {
    if (!path) return null;
    
    // Si c'est déjà une URL complète
    if (path.startsWith('http')) return path;
    
    // Déterminer l'URL de base selon l'environnement
    let baseUrl;
    
    // Méthode plus fiable pour détecter l'environnement
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Développement local
      baseUrl = 'http://localhost:5000';
    } else {
      // Production - utilise le domaine actuel
      baseUrl = window.location.origin; // Cela donnera 'https://pub-cash.com'
      
      // Si le backend est sur un port différent, ajustez
      if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.includes(':5000')) {
        baseUrl = process.env.REACT_APP_API_URL.replace('/api', '');
      }
    }
    
    // Gérer les chemins absolus et relatifs
    if (path.startsWith('/')) {
      return `${baseUrl}${path}`;
    } else {
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