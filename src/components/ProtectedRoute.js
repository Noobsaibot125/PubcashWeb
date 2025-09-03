// src/components/ProtectedRoute.js

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // On vérifie si le token existe dans le localStorage
  const token = localStorage.getItem('adminToken');

  // Si le token existe, on affiche le contenu de la route (le layout Admin)
  // Outlet est un composant de react-router-dom qui affiche le composant enfant de la route
  if (token) {
    return <Outlet />;
  }
  
  // Sinon, on redirige l'utilisateur vers la page de connexion
  return <Navigate to="/auth/login" replace />;
};

export default ProtectedRoute;