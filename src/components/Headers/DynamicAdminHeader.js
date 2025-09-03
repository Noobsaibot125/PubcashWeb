// src/components/Headers/DynamicUserHeader.js
import React from 'react';
import { Button, Container, Row, Col } from "reactstrap";

const DynamicUserHeader = ({ profile }) => {
  const headerStyle = {
    minHeight: '500px',
    backgroundImage: `url(${profile?.background_image_url || require("../../assets/img/theme/profile-cover.jpg")})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center top'
  };

  return (
    <div className="header pb-8 pt-5 pt-lg-8 d-flex align-items-center" style={headerStyle}>
      <span className="mask bg-gradient-default opacity-8" />
      <Container className="d-flex align-items-center" fluid>
        <Row>
          <Col lg="7" md="10">
            <h1 className="display-2 text-white">Modifier Vos informations de profil ici {profile?.prenom}</h1>
            <p className="text-white mt-0 mb-5">
            {profile?.description}
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DynamicUserHeader;