// src/components/Sidebar/Sidebar.js

import { useState, useEffect } from "react";
import { NavLink as NavLinkRRD, Link, useLocation } from "react-router-dom";
import { PropTypes } from "prop-types";
import {
  Collapse,
  NavbarBrand,
  Navbar,
  NavItem,
  NavLink,
  Nav,
  Container,
  Row,
  Col,
} from "reactstrap";

const Sidebar = (props) => {
  const location = useLocation();
  const [collapseOpen, setCollapseOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const [unreadCount, setUnreadCount] = useState(0);

  // --- VERSION CORRIGÉE DU useEffect ---
  useEffect(() => {
    // On lit directement la nouvelle clé 'userRole'. La valeur est déjà le rôle (ex: "client").
    const roleFromStorage = localStorage.getItem('userRole');
    setUserRole(roleFromStorage);

    if (roleFromStorage === 'client') {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [location]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      // Import dynamique ou axios global si possible, sinon on suppose qu'il est dispo ou on l'importe en haut
      // Comme je ne peux pas ajouter l'import en haut facilement avec replace_file_content sur un bloc, 
      // je vais supposer que je dois ajouter l'import séparément ou utiliser fetch.
      // Je vais utiliser fetch pour éviter les problèmes d'import manquant si je ne remplace pas tout le fichier.
      const res = await fetch("http://localhost:5000/api/subscriptions/unread-count", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Erreur fetchUnreadCount:", error);
    }
  };

  const toggleCollapse = () => setCollapseOpen((data) => !data);
  const closeCollapse = () => setCollapseOpen(false);

  const createLinks = (routes) => {
    if (!userRole) {
      return null;
    }

    let layoutPrefix = '';
    if (userRole === 'superadmin') {
      layoutPrefix = '/super-admin';
    } else if (userRole === 'admin') {
      layoutPrefix = '/admin';
    } else if (userRole === 'client') {
      layoutPrefix = '/client';
    } else if (userRole === 'utilisateur') {
      layoutPrefix = '/user';
    }

    return routes.map((prop, key) => {

      const hasAccess = Array.isArray(prop.role)
        ? prop.role.includes(userRole)
        : prop.role === userRole;

      const layoutTypeMatch =
        (prop.layout === '/admin' && (userRole === 'admin' || userRole === 'superadmin')) ||
        (prop.layout === '/client' && userRole === 'client') ||
        (prop.layout === '/user' && userRole === 'utilisateur');

      if (prop.name && hasAccess && layoutTypeMatch) {
        return (
          <NavItem key={key}>
            <NavLink
              to={layoutPrefix + prop.path}
              tag={NavLinkRRD}
              onClick={closeCollapse}
            >
              <i className={prop.icon} />
              {prop.name}
              {prop.path === '/messagerie' && unreadCount > 0 && (
                <span className="badge badge-success badge-pill ml-2">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          </NavItem>
        );
      }
      return null;
    });
  };

  const { routes, logo } = props;
  let navbarBrandProps;
  if (logo && logo.innerLink) {
    navbarBrandProps = { to: logo.innerLink, tag: Link };
  } else if (logo && logo.outterLink) {
    navbarBrandProps = { href: logo.outterLink, target: "_blank" };
  }

  return (
    <Navbar
      className="navbar-vertical fixed-left navbar-light bg-white"
      expand="md"
      id="sidenav-main"
    >
      <Container fluid>
        <button className="navbar-toggler" type="button" onClick={toggleCollapse}>
          <span className="navbar-toggler-icon" />
        </button>
        {logo ? (
          <NavbarBrand className="pt-0" {...navbarBrandProps}>
            <img alt={logo.imgAlt} className="navbar-brand-img" src={logo.imgSrc} />
          </NavbarBrand>
        ) : null}

        <Nav className="align-items-center d-md-none">
        </Nav>

        <Collapse navbar isOpen={collapseOpen}>
          <div className="navbar-collapse-header d-md-none">
            <Row>
              {logo ? (
                <Col className="collapse-brand" xs="6">
                  {logo.innerLink ? (
                    <Link to={logo.innerLink}><img alt={logo.imgAlt} src={logo.imgSrc} /></Link>
                  ) : (
                    <a href={logo.outterLink}><img alt={logo.imgAlt} src={logo.imgSrc} /></a>
                  )}
                </Col>
              ) : null}
              <Col className="collapse-close" xs="6">
                <button className="navbar-toggler" type="button" onClick={toggleCollapse}>
                  <span /><span />
                </button>
              </Col>
            </Row>
          </div>
          <Nav navbar>{createLinks(routes)}</Nav>
        </Collapse>
      </Container>
    </Navbar>
  );
};

Sidebar.defaultProps = {
  routes: [{}],
};

Sidebar.propTypes = {
  routes: PropTypes.arrayOf(PropTypes.object),
  logo: PropTypes.shape({
    innerLink: PropTypes.string,
    outterLink: PropTypes.string,
    imgSrc: PropTypes.string.isRequired,
    imgAlt: PropTypes.string.isRequired,
  }),
};

export default Sidebar;