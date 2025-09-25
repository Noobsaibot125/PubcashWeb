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
    
    if (process.env.NODE_ENV === 'development') {
      // En développement : backend sur localhost:5000
      baseUrl = 'http://localhost:5000';
    } else {
      // En production : utiliser le domaine principal
      baseUrl = 'https://pub-cash.com';
    }
    
    // Gérer les chemins absolus et relatifs
    if (path.startsWith('/')) {
      return `${baseUrl}${path}`;
    } else {
      return `${baseUrl}/${path}`;
    }
  };
  
  /**
   * Version spécifique pour les uploads (videos, thumbnails)
   */
  export const getUploadUrl = (filename) => {
    if (!filename) return null;
    return getMediaUrl(`/uploads/${filename}`);
  };