// src/utils/mediaUrl.js

/**
 * Génère l'URL complète pour les médias (images, vidéos)
 * S'adapte automatiquement à l'environnement
 */
export const getMediaUrl = (path) => {
    if (!path) return null;
    
    // Si c'est déjà une URL complète
    if (path.startsWith('http')) return path;
    
    // Déterminer l'URL de base de manière plus fiable
    let baseUrl = process.env.REACT_APP_API_URL || '';
    
    // En production, utiliser le domaine actuel sans le /api
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      // Production - utiliser le domaine principal
      baseUrl = window.location.origin;
      
      // Si le chemin commence par uploads, c'est correct
      if (path.startsWith('/uploads/')) {
        return `${baseUrl}${path}`;
      }
      
      // Pour les chemins relatifs sans /uploads
      if (path.includes('uploads/')) {
        return `${baseUrl}/${path}`;
      }
    }
    
    // En développement ou cas général
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4); // Retirer /api
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