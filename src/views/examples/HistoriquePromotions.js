// src/views/examples/HistoriquePromotions.js

import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, CardHeader, CardBody, 
  Spinner, Badge, ListGroup, ListGroupItem, Button, Collapse,
  Modal, ModalHeader, ModalBody
} from 'reactstrap';
import ClientHeader from "components/Headers/ClientHeader.js";
import ReactPlayer from 'react-player';
import api from '../../services/api';
// --- COMPOSANT VideoThumbnail (pour la miniature cliquable) ---
const VideoThumbnail = ({ promotion, onClick }) => {
    const getThumbnail = () => {
        if (promotion.thumbnail_url) return promotion.thumbnail_url;
        try {
            if (promotion.url_video) {
                const url = new URL(promotion.url_video);
                if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
                    const videoId = url.searchParams.get('v') || url.pathname.split('/').pop();
                    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                }
            }
        } catch (e) {}
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
            <h4 className="mb-0"  style={{ color: "black" }}>{promotion.titre}</h4>
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
                            <ListGroupItem className="px-0 d-flex justify-content-between"><span><i className="fas fa-eye text-info mr-2"/>Vues</span><Badge color="info" pill>{promotion.vues}</Badge></ListGroupItem>
                            <ListGroupItem className="px-0 d-flex justify-content-between"><span><i className="fas fa-thumbs-up text-primary mr-2"/>Likes</span><Badge color="primary" pill>{promotion.likes}</Badge></ListGroupItem>
                            <ListGroupItem className="px-0 d-flex justify-content-between"><span><i className="fas fa-share text-success mr-2"/>Partages</span><Badge color="success" pill>{promotion.partages}</Badge></ListGroupItem>
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
         {/* --- MODIFICATION ICI --- */}
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

// --- COMPOSANT PRINCIPAL ---
const HistoriquePromotions = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedVideo, setSelectedVideo] = useState(null);
  
    useEffect(() => {
      const fetchHistory = async () => {
        try {
          // 2. On corrige l'appel pour utiliser 'api.get'
          const response = await api.get('/client/promotions/history');
          setHistory(response.data);
        } catch (err) {
          setError(err.message || "Erreur de chargement de l'historique");
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
        <h2 className="mb-4">Historique des Promotions Terminées</h2>
        {loading && <div className="text-center p-5"><Spinner /></div>}
        {error && <p className="text-center text-danger">{error}</p>}
        {!loading && !error && history.length === 0 && (
            <Card className="shadow p-5 text-center"><p className="mb-0">Aucune promotion terminée dans votre historique.</p></Card>
        )}
        {!loading && !error && history.map(promo => (
            <PromotionHistoryItem key={promo.id} promotion={promo} onVideoClick={setSelectedVideo} />
        ))}
      </Container>
      
      <Modal isOpen={!!selectedVideo} toggle={toggleModal} size="lg" centered>
        <ModalHeader toggle={toggleModal}>{selectedVideo?.titre}</ModalHeader>
        <ModalBody>
          <div className="player-wrapper" style={{ borderRadius: '0.375rem', overflow: 'hidden' }}>
            <video 
              controls 
              width="100%" 
              key={selectedVideo?.id}
              style={{ backgroundColor: 'black', display: 'block' }}
              controlsList="nodownload"
            >
              <source src={selectedVideo?.url_video} type="video/mp4" />
              Votre navigateur ne prend pas en charge la lecture de vidéos.
            </video>
          </div>
        </ModalBody>
      </Modal>
    </>
  );
};

export default HistoriquePromotions;