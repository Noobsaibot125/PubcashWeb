import React, { useState, useEffect } from "react";
import {
    Card,
    CardHeader,
    CardBody,
    Container,
    Row,
    Col,
    Badge,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ListGroup,
    ListGroupItem,
    Collapse,
    Spinner
} from "reactstrap";
import ClientHeader from "components/Headers/ClientHeader.js";
import api from 'services/api';
import { getMediaUrl } from "../../services/api"; // Assurez-vous que cette fonction est exportée

// --- COMPOSANT VideoThumbnail ---
const VideoThumbnail = ({ promotion, onClick }) => {
    const getThumbnail = () => {
        try {
            if (promotion.thumbnail_url) return getMediaUrl(promotion.thumbnail_url);
            if (promotion.url_video) {
                const url = new URL(promotion.url_video);
                if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
                    const videoId = url.searchParams.get('v') || url.pathname.split('/').pop();
                    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                }
            }
        } catch (e) { }
        return "https://via.placeholder.com/150x84.png?text=Vidéo";
    };

    return (
        <div onClick={onClick} style={{ cursor: 'pointer', position: 'relative', width: '150px', height: '84px', borderRadius: '0.25rem', overflow: 'hidden' }}>
            <img
                src={getThumbnail()}
                alt={promotion.titre}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div className="card-img-overlay d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <i className="fas fa-play text-white fa-lg"></i>
            </div>
        </div>
    );
};

// --- COMPOSANT PromotionHistoryItem (pour chaque ligne de l'historique) ---
const PromotionHistoryItem = ({ promotion, onVideoClick }) => {
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const toggleComments = () => setIsCommentsOpen(!isCommentsOpen);

    const formatEndDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    return (
        <Card className="shadow-sm mb-4">
            <CardHeader>
                <Row className="align-items-center">
                    <Col>
                        <h4 className="mb-0" style={{ color: "black" }}>{promotion.titre}</h4>
                        <small className="text-muted">
                            Campagne terminée le: {formatEndDate(promotion.date_fin)}
                        </small>
                    </Col>
                    <Col className="text-right">
                        <Badge
                            pill
                            style={{ backgroundColor: "green", color: "white" }}
                        >
                            Terminé
                        </Badge>
                    </Col>
                </Row>
            </CardHeader>
            <CardBody>
                <Row>
                    <Col md="3" className="d-flex flex-column align-items-center mb-4 mb-md-0">
                        <h6 className="text-muted text-uppercase small">Vidéo</h6>
                        <VideoThumbnail promotion={promotion} onClick={() => onVideoClick(promotion)} />
                    </Col>
                    <Col md="4" className="border-left-md border-right-md px-md-4 mb-4 mb-md-0">
                        <h6 className="text-muted text-uppercase small">Résumé de la campagne</h6>
                        <ListGroup flush>
                            <ListGroupItem className="px-0 d-flex justify-content-between"><span>Budget Initial</span><strong>{parseFloat(promotion.budget_initial).toLocaleString('fr-FR')} FCFA</strong></ListGroupItem>
                            <ListGroupItem className="px-0 d-flex justify-content-between"><span><i className="fas fa-eye text-info mr-2" />Vues</span><Badge color="info" pill>{promotion.vues}</Badge></ListGroupItem>
                            <ListGroupItem className="px-0 d-flex justify-content-between"><span><i className="fas fa-thumbs-up text-primary mr-2" />Likes</span><Badge color="primary" pill>{promotion.likes}</Badge></ListGroupItem>
                            <ListGroupItem className="px-0 d-flex justify-content-between"><span><i className="fas fa-share text-success mr-2" />Partages</span><Badge color="success" pill>{promotion.partages}</Badge></ListGroupItem>
                        </ListGroup>
                    </Col>
                    <Col md="5">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="text-muted text-uppercase small mb-0">
                                COMMENTAIRES ({promotion.commentaires?.length || 0})
                            </h6>
                            {promotion.commentaires && promotion.commentaires.length > 0 && (
                                <Button color="secondary" size="sm" outline onClick={toggleComments}>
                                    {isCommentsOpen ? "Masquer" : "Afficher"}
                                </Button>
                            )}
                        </div>

                        {promotion.commentaires && promotion.commentaires.length > 0 ? (
                            <Collapse isOpen={isCommentsOpen}>
                                <ListGroup
                                    flush
                                    className="list-group-comments"
                                    style={{
                                        maxHeight: '150px', // Hauteur maximale avant que le scroll n'apparaisse
                                        overflowY: 'auto'   // Ajoute une barre de défilement verticale si nécessaire
                                    }}
                                >
                                    {promotion.commentaires.map(comment => (
                                        <ListGroupItem key={comment.id} className="px-0 py-2">
                                            <div className="d-flex justify-content-between">
                                                <strong>{comment.nom_utilisateur}</strong>
                                                <small className="text-muted">
                                                    {new Date(comment.date_commentaire).toLocaleDateString()}
                                                </small>
                                            </div>
                                            <p className="mb-0 text-sm">{comment.commentaire}</p>
                                        </ListGroupItem>
                                    ))}
                                </ListGroup>
                            </Collapse>
                        ) : (
                            <p className="text-muted font-italic mt-4 text-center">
                                *Aucun commentaire pour cette promotion.*
                            </p>
                        )}
                    </Col>
                </Row>
            </CardBody>
        </Card>
    );
};

// --- COMPOSANT PRINCIPAL HistoriquePromotions ---
const HistoriquePromotions = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // On suppose un endpoint pour l'historique
                const response = await api.get('/client/promotions/history');
                setHistory(response.data);
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

    return (
        <>
            <ClientHeader />
            <Container className="mt--7" fluid>
                <Row>
                    <Col className="mb-5 mb-xl-0" xl="12">
                        <Card className="shadow bg-secondary border-0">
                            <CardHeader className="bg-white border-0">
                                <Row className="align-items-center">
                                    <Col xs="8">
                                        <h3 className="mb-0">Historique des Campagnes</h3>
                                    </Col>
                                </Row>
                            </CardHeader>
                            <CardBody>
                                {loading ? (
                                    <div className="text-center py-5">
                                        <Spinner color="primary" />
                                        <p className="mt-2">Chargement de l'historique...</p>
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-5 text-danger">
                                        <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
                                        <p>{error}</p>
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <i className="fas fa-history fa-3x mb-3"></i>
                                        <p>Aucune campagne terminée dans l'historique.</p>
                                    </div>
                                ) : (
                                    history.map(promo => (
                                        <PromotionHistoryItem
                                            key={promo.id}
                                            promotion={promo}
                                            onVideoClick={setSelectedVideo}
                                        />
                                    ))
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* MODAL VIDÉO */}
            <Modal isOpen={!!selectedVideo} toggle={toggleModal} size="lg" centered>
                <ModalHeader toggle={toggleModal}>
                    {selectedVideo?.titre}
                </ModalHeader>
                <ModalBody className="p-0 bg-black d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                    {selectedVideo && (
                        <video
                            controls
                            autoPlay
                            style={{ maxWidth: '100%', maxHeight: '80vh' }}
                            poster={getMediaUrl(selectedVideo.thumbnail_url)}
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