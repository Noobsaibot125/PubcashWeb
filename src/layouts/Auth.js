import React from "react";
import { useLocation, Route, Routes, Navigate } from "react-router-dom";
import { Container, Row, Col } from "reactstrap";
import routes from "routes.js";
import "assets/css/auth.css"; 

const Auth = (props) => {
  const location = useLocation();

  React.useEffect(() => {
    document.body.classList.add("bg-default");
    return () => {
      document.body.classList.remove("bg-default");
    };
  }, []);

  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/auth") {
        return (
          <Route path={prop.path.replace(/^\//, "")} element={prop.component} key={key} exact />
        );
      } else {
        return null;
      }
    });
  };

  return (
    <div className="main-content-auth">
        
        {/* --- FOND SVG VAGUE --- */}
        <svg 
          className="wave-bg"
          viewBox="0 0 1440 320" 
          preserveAspectRatio="none"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M0,160 C320,300 420,100 1440,220 L1440,260 C800,100 600,320 0,220 Z" 
            fill="#ea580c" opacity="0.9"
          />
          <path 
            d="M-100,200 C200,350 500,150 1500,250 L1500,260 C600,180 400,380 -100,240 Z" 
            fill="#c2410c" opacity="0.8"
          />
        </svg>

        {/* --- HEADER TEXT CENTRÉ --- */}
        <div className="text-center mb-5 w-100" style={{zIndex: 2, position: 'relative'}}>
           <Container>
             <Row className="justify-content-center">
                <Col md="8" lg="6">
                  {/* Titre Principal */}
                  <h1 className="font-weight-bold mb-3 text-dark display-4">
                    Bienvenue Sur Pubcash
                  </h1>
                  {/* Sous-titre */}
                  <p className="text-muted mb-0" style={{fontSize: '1.1rem'}}>
                    Veuillez vous connecter en tant que promoteur ou Client ou créez un nouveau compte.
                  </p>
                </Col>
             </Row>
           </Container>
        </div>

        {/* --- CONTENU DE LA PAGE (Login/Register) --- */}
        <Container style={{zIndex: 2, position: 'relative'}}>
          <Row className="justify-content-center">
            <Routes>
              {getRoutes(routes)}
              <Route index element={<Navigate to="/auth/login-client" replace />} />
            </Routes>
          </Row>
        </Container>
        
        {/* --- FOOTER COPYRIGHT --- */}
        <div className="mt-5 text-center text-muted small" style={{zIndex: 2, position:'relative'}}>
            &copy; {new Date().getFullYear()} PubCash. Tous droits réservés.
        </div>
    </div>
  );
};

export default Auth;