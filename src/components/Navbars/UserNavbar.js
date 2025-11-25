// src/components/Navbars/UserNavbar.js
import React from 'react';
import {
  Container,
  Navbar,
  Nav,
  NavItem,
  NavLink as RSNavLink,
  Button
} from 'reactstrap';
import { NavLink as RRNavLink } from 'react-router-dom';

const UserNavbar = ({ handleLogout, showFilters = false, filter, setFilter, theme, toggleTheme }) => {
  return (
    <Navbar color="white" light expand="md" className="main-navbar fixed-top shadow-sm">
      <Container fluid>
        <div className="d-flex align-items-center">
          <Nav className="mr-auto" navbar>
            <NavItem>
              <RSNavLink tag={RRNavLink} to="/user/dashboard">Accueil</RSNavLink>
            </NavItem>
            <NavItem>
              <RSNavLink tag={RRNavLink} to="/user/historique-videos">Historique</RSNavLink>
            </NavItem>
            <NavItem>
              <RSNavLink tag={RRNavLink} to="/user/profil">Profil</RSNavLink>
            </NavItem>
          </Nav>
        </div>

        <div className="d-flex align-items-center">
          {/* Les filtres ne s'affichent que si showFilters est true */}
          {showFilters && (
            <>
              <Button
                color={filter === 'ma_commune' ? 'primary' : 'light'}
                onClick={() => setFilter('ma_commune')}
                className="filter-btn mr-2"
                size="sm"
              >
                Ma commune
              </Button>
              <Button
                color={filter === 'toutes' ? 'primary' : 'light'}
                onClick={() => setFilter('toutes')}
                className="filter-btn"
                size="sm"
              >
                Toutes les vidéos
              </Button>
            </>
          )}
          {/* NOUVEAU : Bouton pour changer le thème */}
          <Button
            color="light"
            onClick={toggleTheme}
            className="btn-icon btn-sm rounded-circle ml-4"
          >
            <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`} />
          </Button>
          <Button color="danger" outline onClick={handleLogout} className="ml-4 logout-btn" size="sm">
            Déconnexion
          </Button>
        </div>
      </Container>
    </Navbar>
  );
};

export default UserNavbar;