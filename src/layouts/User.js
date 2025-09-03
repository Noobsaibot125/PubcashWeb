// src/layouts/User.js
import React from "react";
import { useLocation, Route, Routes, Navigate } from "react-router-dom";
// reactstrap components
import { Container } from "reactstrap";
// core components
import AdminNavbar from "components/Navbars/AdminNavbar.js";
import AdminFooter from "components/Footers/AdminFooter.js";
import Sidebar from "components/Sidebar/Sidebar.js";

import routes from "routes.js";

const User = (props) => {
  const mainContent = React.useRef(null);
  const location = useLocation();

  React.useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    if (mainContent && mainContent.current) mainContent.current.scrollTop = 0;
  }, [location]);

  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      // On charge uniquement les routes qui ont le layout "/user"
      if (prop.layout === "/user") {
        return (
          <Route path={prop.path} element={prop.component} key={key} />
        );
      } else {
        return null;
      }
    });
  };

  const getBrandText = (pathname) => {
    for (let i = 0; i < routes.length; i++) {
      if (pathname.indexOf(routes[i].layout + routes[i].path) !== -1) {
        return routes[i].name;
      }
    }
    return "Brand";
  };

  // --- Déterminer la route active pour vérifier hideNavbar ---
  const currentRoute = React.useMemo(() => {
    // on cherche la route dont layout+path est contenu dans le pathname
    return routes.find(r => location.pathname.indexOf((r.layout || "") + (r.path || "")) !== -1);
  }, [location.pathname]);

  const shouldShowNavbar = !(currentRoute && currentRoute.hideNavbar);

  return (
    <>
      <Sidebar
        {...props}
        routes={routes}
        logo={{
          innerLink: "/user/dashboard",
          imgSrc: require("../assets/img/brand/pub cash.png"),
          imgAlt: "Pub-Cash Logo",
        }}
      />
      <div className="main-content" ref={mainContent}>
        {/* AdminNavbar rendu uniquement si shouldShowNavbar === true */}
        {shouldShowNavbar && (
          <AdminNavbar
            {...props}
            brandText={getBrandText(location.pathname)}
          />
        )}

        <Routes>
          {getRoutes(routes)}
          {/* Redirection par défaut vers le dashboard utilisateur */}
          <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
        </Routes>

        <Container fluid>
          <AdminFooter />
        </Container>
      </div>
    </>
  );
};

export default User;
