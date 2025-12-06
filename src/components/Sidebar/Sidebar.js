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

// 1. IMPORTANT : On importe ton instance API configurée
import api from "../../services/api";

const Sidebar = (props) => {
  const location = useLocation();
  const [collapseOpen, setCollapseOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const roleFromStorage = localStorage.getItem('userRole');
    setUserRole(roleFromStorage);

    // Si c'est un client, on lance le compteur
    if (roleFromStorage === 'client') {
      fetchUnreadCount();
      // Rafraîchir toutes les 30 secondes
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [location]);

  // 2. VERSION CORRIGÉE : Utilise api.get au lieu de fetch
  const fetchUnreadCount = async () => {
    try {
      // Pas besoin de mettre l'URL complète ni le header Authorization manuellement.
      // api.js le fait déjà pour toi grâce aux interceptors.
      // NOTE : J'ai corrigé la route vers '/messages/unread-count' car c'est celle définie dans ton messageRoutes.js
      const res = await api.get("/messages/unread-count");
      
      if (res.data && res.data.unreadCount !== undefined) {
        setUnreadCount(res.data.unreadCount);
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
              activeClassName="active"
            >
              <i className={prop.icon} />
              {prop.name}
              
              {/* Badge pour la messagerie */}
              {prop.path === '/messagerie' && unreadCount > 0 && (
                <span className="badge badge-danger badge-pill ml-2" style={{ backgroundColor: '#f5365c', color: 'white' }}>
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