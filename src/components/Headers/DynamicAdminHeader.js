// src/components/Headers/DynamicUserHeader.js
import React from 'react';
import { Container, Row, Col } from "reactstrap";
import fallbackBg from "../../assets/img/theme/profile-cover.jpg"; // static import for fallback

const DynamicUserHeader = ({ profile = {} }) => {
  // Use either the profile URL (if full URL) or fallback
  const bgUrl = profile.background_image_url && profile.background_image_url.startsWith('http')
    ? profile.background_image_url
    : fallbackBg;

  const headerStyle = {
    minHeight: '260px',          // better responsive default
    height: 'auto',
    backgroundImage: `url(${bgUrl})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    paddingTop: '2.5rem',
    paddingBottom: '2.5rem'
  };

  const overlayStyle = {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(10,23,56,0.45) 0%, rgba(10,23,56,0.55) 100%)',
    zIndex: 0,
  };

  const contentStyle = { zIndex: 2 };

  return (
    <div className="header pb-8 pt-5 pt-lg-8" style={headerStyle}>
      <div style={overlayStyle} aria-hidden="true" />
      <Container fluid style={contentStyle}>
        <Row>
          <Col lg="7" md="10">
            <h1 className="display-3 text-white" style={{ fontWeight: 600 }}>
              Modifier vos informations — {profile.prenom || 'Utilisateur'}
            </h1>
            {profile.description && (
              <p className="text-white mt-2 mb-0" style={{ opacity: 0.95 }}>
                {profile.description}
              </p>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DynamicUserHeader;
