import React, { useState, useEffect } from "react";
import {
    Card,
    CardHeader,
    CardBody,
    Container,
    Row,
    Col,
    Progress,
    Spinner,
    Modal,
    ModalHeader,
    ModalBody,
    Badge
} from "reactstrap";
import ClientHeader from "components/Headers/ClientHeader.js";
import api, { getMediaUrl } from 'services/api';

// --- Helper Functions ---
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// --- Main Component ---
const HistoriquePromotions = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);

    // Fetch History Data
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get('/client/promotions/history');
                setHistory(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                console.error("Erreur chargement historique:", err);
                setError("Impossible de charger l'historique.");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const toggleModal = () => setSelectedVideo(null);

    const getThumbnailUrl = (promo) => {
        if (promo.thumbnail_url) return getMediaUrl(promo.thumbnail_url);
        // Basic YouTube Fallback
        if (promo.url_video && (promo.url_video.includes('youtube') || promo.url_video.includes('youtu.be'))) {
             try {
                 const url = new URL(promo.url_video);
                 const v = url.searchParams.get('v') || url.pathname.slice(1);
                 return `https://img.youtube.com/vi/${v}/mqdefault.jpg`;
             } catch(e) {}
        }
        return "https://via.placeholder.com/150x84.png?text=Vidéo";
    };

    return (
        <>
            <ClientHeader />
            <Container className="mt--7" fluid>
                <Row>
                    <Col className="mb-5 mb-xl-0" xl="12">
                        <Card className="shadow campaign-list-card bg-white">
                            <CardHeader className="bg-white border-0 pt-4 pb-2 pl-4">
                                <h3 className="mb-0 text-dark font-weight-800">Historique des Campagnes</h3>
                            </CardHeader>

                            <CardBody className="p-0">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <Spinner color="primary" />
                                        <p className="mt-2 text-muted">Chargement de l'historique...</p>
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-5 text-danger">
                                        <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
                                        <p>{error}</p>
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <i className="fas fa-history fa-3x mb-3 text-light"></i>
                                        <p>Aucune campagne terminée pour le moment.</p>
                                    </div>
                                ) : (
                                    history.map((promo, index) => (
                                        <div className="campaign-row" key={promo.id || index}>
                                            <Row>
                                                {/* Left Column: Video Thumbnail */}
                                                <Col lg="3" md="4" className="mb-4 mb-md-0 d-flex flex-column justify-content-center">
                                                    <div
                                                        className="campaign-video-wrapper"
                                                        onClick={() => setSelectedVideo(promo)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <img
                                                            src={getThumbnailUrl(promo)}
                                                            alt={promo.titre}
                                                            className="campaign-video-thumb"
                                                        />
                                                        <div className="campaign-video-overlay">
                                                            <i className="fas fa-play-circle fa-3x text-white"></i>
                                                        </div>
                                                    </div>
                                                    <div className="text-center mt-2">
                                                        <Badge color="success" pill>Terminé</Badge>
                                                        <small className="text-muted d-block mt-1">
                                                            Fin le: {formatDate(promo.date_fin)}
                                                        </small>
                                                    </div>
                                                </Col>

                                                {/* Middle Column: Info & Stats */}
                                                <Col lg="5" md="8" className="mb-4 mb-lg-0 px-lg-4 border-right-lg">
                                                    <h3 className="mb-1 text-dark text-truncate" title={promo.titre}>
                                                        {promo.titre || "Campagne Sans Titre"}
                                                    </h3>
                                                    <p className="text-sm text-muted mb-4">
                                                        Budget Total: <span className="font-weight-bold text-dark">{parseFloat(promo.budget_initial || 0).toLocaleString('fr-FR')} FCFA</span>
                                                    </p>

                                                    {/* Progress Bars for Stats */}
                                                    <div className="stat-row">
                                                        <span className="stat-label-text">Vues</span>
                                                        <div className="stat-progress-wrapper">
                                                            <Progress
                                                                max={(promo.vues || 0) + 100}
                                                                value={promo.vues}
                                                                color="info"
                                                                style={{ height: '6px', marginBottom: 0 }}
                                                            />
                                                        </div>
                                                        <span className="stat-value-text text-info">{promo.vues || 0}</span>
                                                    </div>

                                                    <div className="stat-row">
                                                        <span className="stat-label-text">Likes</span>
                                                        <div className="stat-progress-wrapper">
                                                            <Progress
                                                                max={promo.vues || 100}
                                                                value={promo.likes}
                                                                barClassName="bg-purple"
                                                                style={{ height: '6px', marginBottom: 0 }}
                                                            />
                                                        </div>
                                                        <span className="stat-value-text" style={{color: '#8965e0'}}>{promo.likes || 0}</span>
                                                    </div>

                                                    <div className="stat-row">
                                                        <span className="stat-label-text">Partages</span>
                                                        <div className="stat-progress-wrapper">
                                                            <Progress
                                                                max={promo.vues || 100}
                                                                value={promo.partages}
                                                                color="success"
                                                                style={{ height: '6px', marginBottom: 0 }}
                                                            />
                                                        </div>
                                                        <span className="stat-value-text text-success">{promo.partages || 0}</span>
                                                    </div>
                                                </Col>

                                                {/* Right Column: Comments */}
                                                <Col lg="4" className="d-none d-lg-block">
                                                    <span className="comments-section-title">
                                                        Commentaires ({promo.commentaires ? promo.commentaires.length : 0})
                                                    </span>
                                                    <div className="comments-box custom-scrollbar">
                                                        {promo.commentaires && promo.commentaires.length > 0 ? (
                                                            promo.commentaires.map((comment, i) => (
                                                                <div className="comment-item" key={i}>
                                                                    <div className="comment-header">
                                                                        <span className="comment-author">{comment.nom_utilisateur || 'Utilisateur'}</span>
                                                                        <span className="comment-date">{formatDate(comment.date_commentaire)}</span>
                                                                    </div>
                                                                    <p className="comment-text">
                                                                        {comment.commentaire}
                                                                    </p>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="h-100 d-flex align-items-center justify-content-center text-muted text-sm font-italic">
                                                                Aucun commentaire
                                                            </div>
                                                        )}
                                                    </div>
                                                </Col>
                                            </Row>

                                            {/* Mobile View for Comments */}
                                            <Row className="d-lg-none mt-3">
                                                 <Col>
                                                    <span className="comments-section-title">
                                                        Commentaires ({promo.commentaires ? promo.commentaires.length : 0})
                                                    </span>
                                                     <div className="comments-box">
                                                         {promo.commentaires && promo.commentaires.length > 0 ? (
                                                            promo.commentaires.map((comment, i) => (
                                                                <div className="comment-item" key={i}>
                                                                    <div className="comment-header">
                                                                        <span className="comment-author">{comment.nom_utilisateur || 'Utilisateur'}</span>
                                                                        <span className="comment-date">{formatDate(comment.date_commentaire)}</span>
                                                                    </div>
                                                                    <p className="comment-text">
                                                                        {comment.commentaire}
                                                                    </p>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="h-100 d-flex align-items-center justify-content-center text-muted text-sm font-italic">
                                                                Aucun commentaire
                                                            </div>
                                                        )}
                                                     </div>
                                                 </Col>
                                            </Row>
                                        </div>
                                    ))
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* Video Modal */}
            <Modal isOpen={!!selectedVideo} toggle={toggleModal} size="lg" centered>
                <ModalHeader toggle={toggleModal} className="border-0 pb-0 bg-secondary">
                    <span className="heading-small text-muted text-uppercase">{selectedVideo?.titre}</span>
                </ModalHeader>
                <ModalBody className="p-0 bg-black d-flex align-items-center justify-content-center" style={{ minHeight: '400px', backgroundColor: '#000' }}>
                    {selectedVideo && (
                        <video
                            controls
                            autoPlay
                            style={{ maxWidth: '100%', maxHeight: '80vh', display: 'block' }}
                            poster={getThumbnailUrl(selectedVideo)}
                        >
                            <source src={getMediaUrl(selectedVideo.url_video)} type="video/mp4" />
                            Votre navigateur ne supporte pas la lecture de vidéos.
                        </video>
                    )}
                </ModalBody>
            </Modal>
        </>
    );
};

export default HistoriquePromotions;