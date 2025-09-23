// src/layouts/User.js
import React from "react";
import { useLocation, Route, Routes, Navigate } from "react-router-dom";
import routes from "routes.js";

const User = () => {
  const mainContent = React.useRef(null);
  const location = useLocation();

  React.useEffect(() => {
    document.documentElement.scrollTop = 0;
    if (document.scrollingElement) {
      document.scrollingElement.scrollTop = 0;
    }
    if (mainContent.current) {
      mainContent.current.scrollTop = 0;
    }
  }, [location]);

  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/user") {
        return <Route path={prop.path} element={prop.component} key={key} />;
      } else {
        return null;
      }
    });
  };

  // Ce layout devient un simple conteneur qui rend la vue active.
  // La barre de navigation et le footer seront gérés directement dans les vues si nécessaire.
  return (
    <div className="main-content" ref={mainContent}>
      <Routes>
        {getRoutes(routes)}
        <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default User;