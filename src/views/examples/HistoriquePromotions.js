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

// --- Composant Interne pour les Stats Quiz ---
const QuizStatsDisplay = ({ promotionId }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get(`/games/stats/promotion/${promotionId}`);
                if (res.data.hasGame) {
                    setStats(res.data.stats);
                }
            } catch (e) {
                console.error("Erreur stats quiz", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [promotionId]);

    if (loading) return <small className="text-muted"><i className="fas fa-circle-notch fa-spin mr-1"></i> Chargement Quiz...</small>;
    if (!stats || stats.total === 0) return null; // Pas de jeu ou pas de joueurs

    // Calcul des pourcentages
    const successRate = stats.total > 0 ? Math.round((stats.bonnes / stats.total) * 100) : 0;

    return (
        <div className="mt-3 p-3 bg-secondary rounded border border-light">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0 text-dark font-weight-bold">
                    <i className="ni ni-controller mr-2 text-primary"></i>
                    Statistiques du Quiz
                </h5>
                <Badge color="primary" pill>{stats.total} Participants</Badge>
            </div>
            
            {/* Barre de succès */}
            <div className="mb-1">
                <div className="d-flex justify-content-between text-xs text-muted mb-1">
                    <span>Bonnes réponses ({stats.bonnes})</span>
                    <span>{successRate}%</span>
                </div>
                <Progress color="success" value={successRate} style={{ height: '8px' }} />
            </div>

            {/* Barre d'échec */}
            {stats.mauvaises > 0 && (
                <div className="mt-2">
                    <div className="d-flex justify-content-between text-xs text-muted mb-1">
                        <span>Mauvaises réponses ({stats.mauvaises})</span>
                        <span>{100 - successRate}%</span>
                    </div>
                    <Progress color="danger" value={100 - successRate} style={{ height: '8px' }} />
                </div>
            )}
            
            <div className="text-center mt-2">
                <small className="text-muted font-italic" style={{fontSize:'0.75rem'}}>
                    {successRate > 50 
                        ? "🎉 La majorité a bien regardé la vidéo !" 
                        : "⚠️ Taux d'erreur élevé, vidéo peut-être complexe."}
                </small>
            </div>
        </div>
    );
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
                                        <div className="campaign-row border-bottom p-4" key={promo.id || index}>
                                            <Row>
                                                {/* Left Column: Video Thumbnail */}
                                                <Col lg="3" md="4" className="mb-4 mb-md-0 d-flex flex-column justify-content-center">
                                                    <div
                                                        className="campaign-video-wrapper position-relative rounded overflow-hidden shadow-sm"
                                                        onClick={() => setSelectedVideo(promo)}
                                                        style={{ cursor: 'pointer', maxHeight: '160px' }}
                                                    >
                                                        <img
                                                            src={getThumbnailUrl(promo)}
                                                            alt={promo.titre}
                                                            className="campaign-video-thumb w-100 h-100"
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                        <div className="campaign-video-overlay position-absolute w-100 h-100 d-flex align-items-center justify-content-center" style={{top:0, left:0, background: 'rgba(0,0,0,0.3)'}}>
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
                                                    <p className="text-sm text-muted mb-3">
                                                        Budget Total: <span className="font-weight-bold text-dark">{parseFloat(promo.budget_initial || 0).toLocaleString('fr-FR')} FCFA</span>
                                                    </p>

                                                    {/* --- VUES --- */}
                                                    <div className="mb-3">
                                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                                            <span className="text-sm text-muted"><i className="fas fa-eye mr-1"></i> Vues</span>
                                                            <span className="text-sm font-weight-bold text-info">{promo.vues || 0}</span>
                                                        </div>
                                                        <Progress value={promo.vues} max={(promo.vues || 0) + 100} color="info" style={{ height: '5px' }} />
                                                    </div>

                                                    {/* --- LIKES --- */}
                                                    <div className="mb-3">
                                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                                            <span className="text-sm text-muted"><i className="fas fa-thumbs-up mr-1"></i> Likes</span>
                                                            <span className="text-sm font-weight-bold" style={{color: '#8965e0'}}>{promo.likes || 0}</span>
                                                        </div>
                                                        <Progress value={promo.likes} max={promo.vues || 100} barClassName="bg-purple" style={{ height: '5px' }} />
                                                    </div>

                                                    {/* --- PARTAGES (RESTAURÉ ICI) --- */}
                                                    <div className="mb-3">
                                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                                            <span className="text-sm text-muted"><i className="fas fa-share mr-1"></i> Partages</span>
                                                            {/* Compteur affiché ici */}
                                                            <span className="text-sm font-weight-bold text-success">{promo.partages || 0}</span>
                                                        </div>
                                                        <Progress value={promo.partages} max={promo.vues || 100} color="success" style={{ height: '5px' }} />
                                                    </div>

                                                    {/* --- STATS QUIZ --- */}
                                                    <QuizStatsDisplay promotionId={promo.id} />
                                                    
                                                </Col>

                                                {/* Right Column: Comments */}
                                                <Col lg="4" className="d-none d-lg-block">
                                                    <span className="text-uppercase text-muted font-weight-bold text-xs mb-3 d-block">
                                                        Commentaires ({promo.commentaires ? promo.commentaires.length : 0})
                                                    </span>
                                                    <div className="custom-scrollbar pr-2" style={{maxHeight: '250px', overflowY: 'auto'}}>
                                                        {promo.commentaires && promo.commentaires.length > 0 ? (
                                                            promo.commentaires.map((comment, i) => (
                                                                <div className="mb-3 pb-2 border-bottom" key={i}>
                                                                    <div className="d-flex justify-content-between">
                                                                        <span className="font-weight-bold text-sm text-dark">{comment.nom_utilisateur || 'Utilisateur'}</span>
                                                                        <span className="text-xs text-muted">{formatDate(comment.date_commentaire)}</span>
                                                                    </div>
                                                                    <p className="text-sm text-muted mt-1 mb-0 font-italic">
                                                                        "{comment.commentaire}"
                                                                    </p>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-center text-muted text-sm py-4 bg-light rounded">
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