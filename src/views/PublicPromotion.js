import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody, Button, Badge, Spinner } from 'reactstrap';

// Assurez-vous que ces imports correspondent à votre structure de projet
import api from '../services/api'; // Ou le chemin vers votre configuration axios
import { getMediaUrl } from 'utils/mediaUrl';
import ShareModal from '../components/Share/ShareModal';

const PublicPromotion = () => {
    // Récupération des paramètres de l'URL (React Router v6)
    const [searchParams] = useSearchParams();
    const { id } = useParams();

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
                // Correction des espaces dans l'URL API
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
            <div className="d-flex justify-content-center align-items-center vh-100 bg-gradient-info">
                <div className="text-center">
                    <Spinner color="light" style={{ width: '4rem', height: '4rem' }} />
                    <h4 className="text-white mt-4">Chargement de la promotion...</h4>
                </div>
            </div>
        );
    }

    if (error || !promotion) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-gradient-danger">
                <Card className="shadow-lg border-0" style={{ maxWidth: '500px' }}>
                    <CardBody className="text-center p-5">
                        <i className="ni ni-fat-remove text-danger display-1 mb-3"></i>
                        <h2 className="text-muted mb-4">{error || "Promotion introuvable"}</h2>
                        <Button tag={Link} to="/" color="primary" size="lg">
                            <i className="ni ni-bold-left mr-2"></i>
                            Retour à l'accueil
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    // CORRECTION : Utiliser getMediaUrl comme dans UserView.js
    const videoUrl = promotion.url_video.startsWith('http') ? promotion.url_video : getMediaUrl(promotion.url_video);
    const thumbnailUrl = promotion.thumbnail_url && promotion.thumbnail_url.startsWith('http') ? promotion.thumbnail_url : getMediaUrl(promotion.thumbnail_url);
const isVideo = (promotion.type_media === 'video') || 
                    (promotion.url_video && promotion.url_video.toLowerCase().endsWith('.mp4')) ||
                    (promotion.url_video && promotion.url_video.toLowerCase().endsWith('.mov')) ||
                    (promotion.url_video && promotion.url_video.toLowerCase().endsWith('.webm'));
    return (
        <div
            className="min-vh-100 d-flex align-items-center py-5"
            style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Animated background circles */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-10%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'float 6s ease-in-out infinite'
            }}></div>
            <div style={{
                position: 'absolute',
                bottom: '-15%',
                left: '-10%',
                width: '50%',
                height: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'float 8s ease-in-out infinite reverse'
            }}></div>

            <Container style={{ position: 'relative', zIndex: 1 }}>
                <Row className="justify-content-center">
                    <Col lg="10" xl="9">
                        {/* Header Section */}
                        <div className="text-center mb-4 animate__animated animate__fadeInDown">
                            <Badge color="light" className="mb-3 px-4 py-2" style={{ fontSize: '0.9rem' }}>
                                <i className="ni ni-money-coins mr-2"></i>
                                Promo Sponsorisée
                            </Badge>
                            <h1 className="display-3 text-white font-weight-bold mb-3" style={{
                                textShadow: '0 2px 20px rgba(0,0,0,0.2)'
                            }}>
                                {promotion.titre}
                            </h1>
                            {promotion.nom_pack && (
                                <Badge color="success" className="px-3 py-2" style={{ fontSize: '1rem' }}>
                                    Pack {promotion.nom_pack}
                                </Badge>
                            )}
                        </div>

                        {/* Main Card */}
                        <Card className="shadow-2xl border-0 animate__animated animate__fadeInUp" style={{
                            borderRadius: '20px',
                            overflow: 'hidden',
                            backdropFilter: 'blur(10px)',
                            background: 'rgba(255, 255, 255, 0.95)'
                        }}>
                            <CardBody className="p-0">
                              {/* Video/Image Section */}
                                <div className="position-relative" style={{
                                    backgroundColor: '#000',
                                    minHeight: '400px',
                                    display: 'flex',       // Centrer le contenu
                                    alignItems: 'center',  // Centrer verticalement
                                    justifyContent: 'center' // Centrer horizontalement
                                }}>
                                    {isVideo ? (
                                        <video
                                            src={videoUrl}
                                            controls
                                            controlsList="nodownload"
                                            playsInline
                                            crossOrigin="anonymous"
                                            style={{
                                                width: '100%',
                                                maxHeight: '600px',
                                                objectFit: 'contain', // Important pour ne pas déformer la vidéo
                                                display: 'block'
                                            }}
                                            poster={thumbnailUrl}
                                        >
                                            Votre navigateur ne supporte pas la lecture de vidéos.
                                        </video>
                                    ) : (
                                        <img
                                            src={videoUrl || thumbnailUrl} // Fallback si c'est une image
                                            alt={promotion.titre}
                                            className="img-fluid"
                                            style={{
                                                width: '100%',
                                                maxHeight: '600px',
                                                objectFit: 'contain',
                                                display: 'block'
                                            }}
                                        />
                                    )}

                                    {/* Gradient overlay at bottom */}

                                    
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: '100px',
                                        background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                                        pointerEvents: 'none'
                                    }}></div>
                                </div>

                                {/* Content Section */}
                                <div className="px-4 px-lg-5 py-5">
                                    {promotion.description && (
                                        <div className="mb-4">
                                            <p className="text-muted lead mb-0" style={{ fontSize: '1.1rem' }}>
                                                {promotion.description}
                                            </p>
                                        </div>
                                    )}

                                    <hr className="my-4" />

                                    {/* Call to Action */}
                                    <div className="text-center">
                                        <div className="mb-4">
                                            <i className="fas fa-coins text-warning" style={{ fontSize: '3rem' }}></i>
                                            <h2 className="mt-3 mb-2 font-weight-bold text-primary">
                                                Gagnez de l'argent en regardant !
                                            </h2>
                                            <p className="text-muted mb-4">
                                                Inscrivez-vous gratuitement et commencez à gagner de l'argent en regardant des publicités comme celle-ci
                                            </p>
                                        </div>

                                        <Row className="justify-content-center">
                                            <Col md="6" className="mb-3">
                                                <Button
                                                    tag={Link}
                                                    to={`/auth/register-user${refCode ? `?ref=${refCode}` : ''}`}
                                                    color="success"
                                                    size="lg"
                                                    block
                                                    className="btn-icon shadow-lg"
                                                    style={{
                                                        borderRadius: '50px',
                                                        padding: '12px 24px',
                                                        fontSize: '1.1rem',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    <span className="btn-inner--icon">
                                                        <i className="ni ni-spaceship"></i>
                                                    </span>
                                                    <span className="btn-inner--text ml-2">
                                                        S'inscrire Gratuitement
                                                    </span>
                                                </Button>
                                            </Col>
                                            <Col md="6" className="mb-3">
                                                <Button
                                                    tag={Link}
                                                    to="/auth/login-user"
                                                    color="white"
                                                    size="lg"
                                                    block
                                                    className="shadow"
                                                    style={{
                                                        borderRadius: '50px',
                                                        padding: '12px 24px',
                                                        fontSize: '1.1rem',
                                                        border: '2px solid #5e72e4',
                                                        color: '#5e72e4',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    <span className="btn-inner--icon">
                                                        <i className="ni ni-key-25"></i>
                                                    </span>
                                                    <span className="btn-inner--text ml-2">
                                                        Déjà membre ? Connexion
                                                    </span>
                                                </Button>
                                            </Col>
                                        </Row>

                                        {refCode && (
                                            <div className="mt-4 p-3" style={{
                                                background: 'linear-gradient(135deg, #e0ffe0 0%, #d0f0d0 100%)',
                                                borderRadius: '12px',
                                                border: '2px solid #2dce89'
                                            }}>
                                                <i className="fas fa-check-circle text-success mr-2" style={{ fontSize: '1.2rem' }}></i>
                                                <strong className="text-success">Code parrainage activé :</strong>
                                                <Badge color="success" className="ml-2 px-3 py-2" style={{ fontSize: '1rem' }}>
                                                    {refCode}
                                                </Badge>
                                                <p className="text-muted small mb-0 mt-2">
                                                    <i className="fas fa-gift mr-1"></i>
                                                    Bonus de parrainage inclus à l'inscription !
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Features Section */}
                                    <div className="mt-5">
                                        <Row className="text-center">
                                            <Col md="4" className="mb-4">
                                                <div className="icon icon-shape bg-gradient-primary text-white rounded-circle shadow mb-3 mx-auto" style={{ width: '64px', height: '64px' }}>
                                                    <i className="ni ni-money-coins" style={{ fontSize: '24px', lineHeight: '64px' }}></i>
                                                </div>
                                                <h5 className="font-weight-bold">Gagnez de l'argent</h5>
                                                <p className="text-muted small">Regardez des vidéos et gagnez de l'argent réel</p>
                                            </Col>
                                            <Col md="4" className="mb-4">
                                                <div className="icon icon-shape bg-gradient-success text-white rounded-circle shadow mb-3 mx-auto" style={{ width: '64px', height: '64px' }}>
                                                    <i className="ni ni-credit-card" style={{ fontSize: '24px', lineHeight: '64px' }}></i>
                                                </div>
                                                <h5 className="font-weight-bold">Retrait facile</h5>
                                                <p className="text-muted small">Retirez vos gains via Mobile Money</p>
                                            </Col>
                                            <Col md="4" className="mb-4">
                                                <div className="icon icon-shape bg-gradient-warning text-white rounded-circle shadow mb-3 mx-auto" style={{ width: '64px', height: '64px' }}>
                                                    <i className="ni ni-trophy" style={{ fontSize: '24px', lineHeight: '64px' }}></i>
                                                </div>
                                                <h5 className="font-weight-bold">Bonus quotidiens</h5>
                                                <p className="text-muted small">Débloquez des bonus et jeux chaque jour</p>
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Footer */}
                        <div className="text-center mt-5 animate__animated animate__fadeIn">
                            <p className="text-white-50 mb-2">
                                <i className="ni ni-lock-circle-open mr-2"></i>
                                100% Gratuit • 100% Sécurisé
                            </p>
                            <p className="text-white-50 small">
                                PubCash © {new Date().getFullYear()} • Tous droits réservés
                            </p>
                        </div>
                    </Col>
                </Row>
            </Container>

            {/* CSS Animation */}
            <style jsx>{`
            @keyframes float {
                0 %, 100 % { transform: translateY(0px); }
                50 % { transform: translateY(-20px); }
            }
                            
            .shadow-2xl {
                box-shadow: 0 25px 50px - 12px rgba(0, 0, 0, 0.25)!important;
            }

            button:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2)!important;
            }
            `}</style>
        </div>
    );
};

export default PublicPromotion;