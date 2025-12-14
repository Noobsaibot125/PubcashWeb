import React from "react";
import { Container, Row, Col } from "reactstrap";

const BlockedAccess = () => {
    return (
        <div
            className="main-content"
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(87deg, #f5365c 0, #f56036 100%)'
            }}
        >
            <Container>
                <Row className="justify-content-center">
                    <Col lg="6" md="8">
                        <div className="card bg-secondary shadow border-0">
                            <div className="card-body px-lg-5 py-lg-5 text-center">
                                <div className="text-center text-muted mb-4">
                                    <i className="fas fa-map-marker-alt fa-3x text-danger"></i>
                                </div>
                                <h1 className="text-danger mb-4">Accès Restreint</h1>
                                <p className="description mb-4">
                                    Désolé, ce service est uniquement accessible depuis la <strong>Côte d'Ivoire</strong>.
                                </p>
                                <div className="text-center">
                                    <small className="text-muted">
                                        Si vous êtes en Côte d'Ivoire et que vous voyez ce message, veuillez vérifier votre connexion internet ou désactiver votre VPN.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default BlockedAccess;
