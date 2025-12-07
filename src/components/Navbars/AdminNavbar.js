import { Link, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
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
import api from '../../services/api';
import defaultAvatar from "../../assets/img/theme/team-4-800x800.jpg";

const AdminNavbar = (props) => {
  const location = useLocation();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      const userRole = localStorage.getItem('userRole');
      let apiUrl = '';

      if (userRole === 'superadmin' || userRole === 'admin') {
        apiUrl = '/admin/profile';
      } else if (userRole === 'client') {
        apiUrl = '/client/profile';
      } else {
        return;
      }

      try {
        const response = await api.get(apiUrl);
        setProfile(response.data);
      } catch (error) {
        console.error("Erreur chargement profil navbar", error);
      }
    };

    fetchProfileData();
  }, [location.pathname]);

  const handleLogout = async (e) => {
    e?.preventDefault();
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) await api.post('/auth/logout', { token: refreshToken });
    } catch (error) {
      console.error(error);
    } finally {
      const userRole = localStorage.getItem('userRole');
      let loginUrl = '/auth/login-client';
      if (userRole === 'superadmin' || userRole === 'admin') loginUrl = '/auth/login-admin';
      else if (userRole === 'utilisateur') loginUrl = '/auth/login-user';

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      window.location.href = loginUrl;
    }
  };

  const userProfileLink = () => {
    const userRole = localStorage.getItem('userRole');
    return (userRole === 'superadmin' || userRole === 'admin') ? "/admin/profile" : "/client/user-profile";
  };

  return (
    <>
      <Navbar className="navbar-top navbar-light header-navbar" expand="md" id="navbar-main">
        <Container fluid>
          {/* MODIFICATION ICI : 
             'd-none' cache l'élément sur TOUS les écrans par défaut.
             'd-lg-inline-block' l'affiche uniquement sur les GRANDS écrans (PC).
          */}
          <Link
            className="h4 mb-0 text-dark text-uppercase d-none d-lg-inline-block"
            to={location?.pathname || "/"}
          >
            {props.brandText || "Tableau de bord"}
          </Link>

          {/* MODIFICATION ICI :
             Ajout de 'justify-content-end' pour s'assurer que sur mobile, 
             le profil soit poussé à l'extrême droite.
          */}
          <Nav className="align-items-center d-flex justify-content-end ml-auto" navbar>
            <UncontrolledDropdown nav>
              <DropdownToggle className="pr-0" nav>
                <Media className="align-items-center">
                  <span className="avatar avatar-sm rounded-circle">
                    <img
                      alt="avatar"
                      src={profile?.photo || profile?.profile_image_url || defaultAvatar}
                      style={{ objectFit: 'cover', width: '36px', height: '36px' }} 
                      onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
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