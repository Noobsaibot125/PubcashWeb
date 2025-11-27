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

const UserNavbar = ({ handleLogout, showFilters = false, filter, setFilter, theme, toggleTheme, points }) => {
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
            {/* Lien vers le Hub de Jeux */}
            <NavItem>
              <RSNavLink tag={RRNavLink} to="/user/games">Jeux & Bonus</RSNavLink>
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

          {/* Affichage des points */}
          <div className="d-flex align-items-center mr-3 bg-light rounded-pill px-3 py-1 border ml-3">
            <i className="fas fa-coins text-warning mr-2"></i>
            <span className="font-weight-bold text-dark">{points !== undefined ? points : 0} pts</span>
          </div>

          {/* Bouton pour changer le thème */}
          <Button
            color="light"
            onClick={toggleTheme}
            className="btn-icon btn-sm rounded-circle ml-2"
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