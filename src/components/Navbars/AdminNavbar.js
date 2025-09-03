// src/components/Navbars/AdminNavbar.js

import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
// 1. IMPORTEZ VOTRE INSTANCE 'api'
import api from '../../services/api'; 
import {
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
  DropdownToggle,
  Navbar,
  Nav,
  Container,
  Media,
} from "reactstrap";
import defaultAvatar from "../../assets/img/theme/team-4-800x800.jpg";

const AdminNavbar = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);

  // 2. CORRECTION DU useEffect POUR UTILISER 'api'
  useEffect(() => {
    const fetchProfileData = async () => {
      // On utilise la clé 'userRole' stockée par le composant Login
      const userRole = localStorage.getItem('userRole'); 
      let apiUrl = '';

      if (userRole === 'superadmin' || userRole === 'admin') {
        apiUrl = '/admin/profile';
      } else if (userRole === 'client') {
        apiUrl = '/client/profile';
      } else {
        // Si pas de rôle connu ou si c'est un 'utilisateur' simple sans profil, on arrête ici.
        return;
      }

      try {
        // L'appel passe maintenant par l'intercepteur !
        const response = await api.get(apiUrl);
        setProfile(response.data);
      } catch (error) {
        console.error("Impossible de charger les données du profil pour la navbar:", error);
        // Si l'appel échoue (même après un refresh), l'intercepteur redirigera vers la page de login.
        // On n'a plus besoin de gérer manuellement la déconnexion ici.
      }
    };

    fetchProfileData();
  }, [location.pathname]); // Dépendance correcte pour re-fetch si l'URL change

  // 3. CORRECTION DE LA FONCTION DE DÉCONNEXION
  const handleLogout = async (e) => {
    e?.preventDefault();
    
    const refreshToken = localStorage.getItem('refreshToken');
    try {
        if (refreshToken) {
            // Prévenir le backend pour invalider la session côté serveur
            await api.post('/auth/logout', { token: refreshToken });
        }
    } catch (error) {
        console.error("Erreur lors de la déconnexion côté serveur, nettoyage côté client quand même.", error);
    } finally {
        // Nettoyer TOUTES les clés de session du stockage local
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        
        // La redirection via window.location.href est plus robuste pour forcer un reset complet de l'état
        window.location.href = '/auth/login';
    }
  };

  const userProfileLink = () => {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'superadmin' || userRole === 'admin') {
      return "/admin/profile";
    }
    // Assurez-vous que cette route existe bien dans votre fichier de routes pour le layout client
    return "/client/user-profile"; 
  };

  return (
    <>
      <Navbar className="navbar-top navbar-dark" expand="md" id="navbar-main">
        <Container fluid>
          <Link
            className="h4 mb-0 text-white text-uppercase d-none d-lg-inline-block"
            to={location?.pathname || "/"}
          >
            {props.brandText || "Tableau de bord"}
          </Link>

          <Nav className="align-items-center d-md-flex ml-auto" navbar>
            <UncontrolledDropdown nav>
              <DropdownToggle className="pr-0" nav>
                <Media className="align-items-center">
                  <span className="avatar avatar-sm rounded-circle">
                    <img
                      alt="avatar"
                      // Utilise profile.photo ou profile.profile_image_url selon ce que votre API renvoie
                      src={profile?.photo || profile?.profile_image_url || defaultAvatar}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultAvatar;
                      }}
                    />
                  </span>
                  <Media className="ml-2 d-none d-lg-block">
                    <span className="mb-0 text-sm font-weight-bold">
                      {profile?.nom_utilisateur || 'Utilisateur'}
                    </span>
                  </Media>
                </Media>
              </DropdownToggle>
              <DropdownMenu className="dropdown-menu-arrow" right>
                <DropdownItem className="noti-title" header tag="div">
                  <h6 className="text-overflow m-0">Bienvenue !</h6>
                </DropdownItem>
                <DropdownItem to={userProfileLink()} tag={Link}>
                  <i className="ni ni-single-02" />
                  <span>Mon profil</span>
                </DropdownItem>
                <DropdownItem divider />
                <DropdownItem href="#pablo" onClick={handleLogout}>
                  <i className="ni ni-user-run" />
                  <span>Déconnexion</span>
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          </Nav>
        </Container>
      </Navbar>
    </>
  );
};

export default AdminNavbar;