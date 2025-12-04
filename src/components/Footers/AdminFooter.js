// Adminfooter.js

import React from "react";
import { Container, Row, Col, Nav, NavItem, NavLink } from "reactstrap";

const Footer = () => {
  return (
    // AJOUT DE: 
    // "mt-5" -> Marge importante au-dessus du footer (pour décoller du contenu)
    // "py-4" -> Padding (espace interne) en haut et en bas pour aérer le texte
    <footer className="footer mt-5 py-4" style={{ backgroundColor: '#f8f9fe', borderTop: '1px solid #e9ecef' }}>
      <Container fluid>
        <Row className="align-items-center justify-content-lg-between">
          <Col lg="6">
            <div className="copyright text-center text-lg-left text-muted">
              © {new Date().getFullYear()}{" "}
              <a
                className="font-weight-bold ml-1"
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#f36c21' }}
              >
                KKS-TECHNOLOGIES
              </a>
            </div>
          </Col>

          <Col lg="6">
            <Nav className="nav-footer justify-content-center justify-content-lg-end">
              <NavItem>
                <NavLink
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted"
                >
                  PubCash
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted"
                >
                  À propos
                </NavLink>
              </NavItem>
            </Nav>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;