// src/views/examples/PublicPromotion.js
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody, Button, Spinner } from 'reactstrap';
import api from 'services/api';

const PublicPromotion = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    
    // 1. Récupération du code depuis l'URL
    const urlRefCode = searchParams.get('ref');
    
    // 2. Gestion intelligente du code parrainage (URL > LocalStorage)
    const [refCode, setRefCode] = useState(null);

    useEffect(() => {
        if (urlRefCode) {
            // Si un code est dans l'URL, on le garde et on le sauvegarde
            setRefCode(urlRefCode);
            localStorage.setItem('parrainCode', urlRefCode);
        } else {
            // Sinon, on regarde si on en avait un en mémoire
            const storedCode = localStorage.getItem('parrainCode');
            if (storedCode) setRefCode(storedCode);
        }
    }, [urlRefCode]);

    const [promotion, setPromotion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPromotion = async () => {
            try {
                const response = await api.get(`/promotions/${id}`);
                setPromotion(response.data);
            } catch (err) {
                console.error("Erreur chargement promotion:", err);
                setError("Impossible de charger la promotion. Elle est peut-être terminée ou n'existe pas.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPromotion();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-gradient-default">
                <Spinner color="light" style={{ width: '3rem', height: '3rem' }} />
            </div>
        );
    }

    if (error || !promotion) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-gradient-default">
                <Card className="shadow border-0">
                    <CardBody className="text-center p-5">
                        <i className="ni ni-fat-remove text-danger display-1 mb-3"></i>
                        <h2 className="text-muted">{error || "Promotion introuvable"}</h2>
                        <Button tag={Link} to="/" color="primary" className="mt-4">
                            Retour à l'accueil
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="main-content bg-gradient-primary min-vh-100 d-flex align-items-center py-5">
            <Container>
                <Row className="justify-content-center">
                    <Col lg="8" md="10">
                        <Card className="bg-secondary shadow border-0">
                            <CardBody className="px-lg-5 py-lg-5">
                                <div className="text-center mb-4">
                                    <h1 className="display-4 text-primary mb-2">{promotion.titre}</h1>
                                    <p className="text-muted">{promotion.description}</p>
                                </div>

                                <div className="rounded overflow-hidden shadow-lg mb-4 position-relative" style={{ minHeight: '300px', backgroundColor: '#000' }}>
                                    {promotion.type_media === 'video' ? (
                                        <video
                                            src={promotion.url_video}
                                            controls
                                            autoPlay
                                            muted
                                            loop
                                            style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '500px' }}
                                        />
                                    ) : (
                                        <img
                                            src={promotion.url_video || promotion.thumbnail_url}
                                            alt={promotion.titre}
                                            className="img-fluid"
                                            style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
                                        />
                                    )}
                                </div>

                                <div className="text-center mt-5">
                                    <h3 className="mb-4">Connectez-vous pour gagner de l'argent en regardant cette pub ! 💸</h3>

                                    <Row className="justify-content-center">
                                        <Col sm="6" className="mb-3">
                                            {/* --- BOUTON S'INSCRIRE AVEC LE LIEN CORRIGÉ --- */}
                                            <Button
                                                tag={Link}
                                                // ICI : On injecte le refCode dans l'URL d'inscription
                                                to={`/auth/register-user${refCode ? `?ref=${refCode}` : ''}`}
                                                color="success"
                                                size="lg"
                                                block
                                                className="btn-icon"
                                            >
                                                <span className="btn-inner--icon"><i className="ni ni-spaceship"></i></span>
                                                <span className="btn-inner--text ml-2">S'inscrire et Gagner</span>
                                            </Button>
                                        </Col>
                                        <Col sm="6" className="mb-3">
                                            <Button
                                                tag={Link}
                                                to="/auth/login-user"
                                                color="white"
                                                size="lg"
                                                block
                                                className="text-primary"
                                            >
                                                <span className="btn-inner--icon"><i className="ni ni-key-25"></i></span>
                                                <span className="btn-inner--text ml-2">Se connecter</span>
                                            </Button>
                                        </Col>
                                    </Row>

                                    {refCode && (
                                        <div className="mt-3 text-muted small">
                                            <i className="ni ni-check-bold text-success mr-1"></i>
                                            Code parrainage appliqué : <strong>{refCode}</strong>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                        <div className="text-center mt-4">
                            <span className="text-white-50">PubCash © {new Date().getFullYear()}</span>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default PublicPromotion;