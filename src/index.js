import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import "assets/plugins/nucleo/css/nucleo.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./assets/scss/argon-dashboard-react-light.scss";
import "./assets/css/pubcash-custom.css";
// import "./assets/scss/argon-dashboard-react.scss";
import AdminLayout from "layouts/Admin.js";
import ClientLayout from "layouts/Client.js";
import AuthLayout from "layouts/Auth.js";
import { GoogleOAuthProvider } from '@react-oauth/google';
import UserLayout from "layouts/User.js";
import CompleteFacebookProfile from "views/examples/CompleteFacebookProfile.js";
import Landing from "views/examples/Landing.js";
import { AuthProvider } from "./contexts/AuthContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";

import PublicPromotion from "views/PublicPromotion";
import GeoGuard from "components/GeoGuard/GeoGuard";

const root = ReactDOM.createRoot(document.getElementById("root"));

// Un seul render — providers autour de AppContent
root.render(
  <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
    <AuthProvider>
      <WebSocketProvider>
        <BrowserRouter>
          <GeoGuard>
            <Routes>
              {/* Page d'accueil publique */}
              <Route path="/" element={<Landing />} />

              {/* Layouts pour chaque rôle */}
              <Route path="/super-admin/*" element={<AdminLayout />} />
              <Route path="/admin/*" element={<AdminLayout />} />
              <Route path="/client/*" element={<ClientLayout />} />
              <Route path="/auth/*" element={<AuthLayout />} />

              {/* Route publique pour les promotions */}
              <Route path="/promo/:id" element={<PublicPromotion />} />

              {/* Utilisateurs */}
              <Route path="/user/*" element={<UserLayout />} />

              {/* Route spécifique en dehors des layouts principaux */}
              <Route path="/auth/complete-profile" element={<CompleteFacebookProfile />} />

              {/* Redirection par défaut */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </GeoGuard>
        </BrowserRouter>
      </WebSocketProvider>
    </AuthProvider>
  </GoogleOAuthProvider>
);