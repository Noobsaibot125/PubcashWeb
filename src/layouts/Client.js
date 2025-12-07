import React from "react";
import { useLocation, Route, Routes, Navigate } from "react-router-dom";
import { Container } from "reactstrap";
import AdminNavbar from "components/Navbars/AdminNavbar.js";
import AdminFooter from "components/Footers/AdminFooter.js";
import Sidebar from "components/Sidebar/Sidebar.js";
import routes from "routes.js";

const Client = (props) => {
  const mainContent = React.useRef(null);
  const location = useLocation();

  React.useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    mainContent.current.scrollTop = 0;
  }, [location]);

  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/client") {
        return (
          <Route
            path={prop.path.replace(/^\//, "")}
            element={prop.component}
            key={key}
            exact
          />
        );
      } else {
        return null;
      }
    });
  };

  const getBrandText = () => {
    for (let i = 0; i < routes.length; i++) {
      if (location.pathname.indexOf(routes[i].layout + routes[i].path) !== -1) {
        return routes[i].name;
      }
    }
    return "PubCash";
  };

  return (
    <>
      <Sidebar
        {...props}
        routes={routes}
        logo={{
          innerLink: "/client/index",
          imgSrc: require("../assets/img/brand/pub_cash.png"),
          imgAlt: "...",
        }}
      />
      
      <div className="main-content" ref={mainContent}>
        {/* AdminNavbar gère l'affichage du titre (caché sur mobile) et du profil */}
        <AdminNavbar
          {...props}
          brandText={getBrandText()}
        />
        
        <Routes>
          {getRoutes(routes)}
          <Route path="*" element={<Navigate to="/client/index" replace />} />
        </Routes>
        
        <Container fluid>
          <AdminFooter />
        </Container>
      </div>
    </>
  );
};

export default Client;