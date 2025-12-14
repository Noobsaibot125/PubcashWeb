import React from "react";
import { Container, Row, Col } from "reactstrap";
import { Link } from "react-router-dom";

const Maintenance = () => {
    return (
        <div
            className="main-content"
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(87deg, #2dce89 0, #2dcecc 100%)'
            }}
        >
            <Container>
                <Row className="justify-content-center">
                    <Col lg="6" md="8">
                        <div className="card bg-secondary shadow border-0">
                            <div className="card-body px-lg-5 py-lg-5 text-center">
                                <div className="text-center text-muted mb-4">
                                    <i className="fas fa-tools fa-3x text-info"></i>
                                </div>
                                <h1 className="text-info mb-4">Maintenance en cours</h1>
                                <p className="description mb-4">
                                    Notre site est actuellement en cours de maintenance pour améliorer nos services.
                                    Nous serons de retour très bientôt !
                                </p>
                                <div className="text-center">
                                    <small className="text-muted">
                                        Nos équipes techniques travaillent activement. Merci de votre patience.
                                    </small>
                                </div>
                                <div className="text-center mt-5">
                                    {/* <Link to="/auth/login-admin" className="text-muted small">
                                        <i className="ni ni-key-25 mr-1"></i> Accès Administrateur
                                    </Link> */}
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Maintenance;
