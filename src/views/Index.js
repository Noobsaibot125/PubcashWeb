// src/views/Index.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, CardBody, Container, Row, Col, Badge,
  Modal, ModalHeader, ModalBody, ListGroup, ListGroupItem, CardHeader, Button
} from 'reactstrap';
import ClientHeader from "components/Headers/ClientHeader.js";
import api from 'services/api'; // <--- AJOUTEZ CETTE LIGNE
import { Line } from "react-chartjs-2";
import { chartOptions, parseOptions, chartExample1 } from "variables/charts.js";
import Chart from "chart.js";
import { getMediaUrl } from 'utils/mediaUrl'; // AJOUT IMPORT
// S'assurer que Chart.js est configuré une seule fois
if (window.Chart) {
  parseOptions(Chart, chartOptions());
}

// --- Petit composant ImageWithPlaceholder ---
// Réserve l'espace et affiche un skeleton tant que l'image n'est pas chargée.
// Assure-toi d'avoir placé un fichier public/img/placeholder-320x180.png
const LOCAL_FALLBACK = `${process.env.PUBLIC_URL}/img/placeholder-320x180.jpg`; // Conserver mais vérifier que le fichier existe

const ImageWithPlaceholder = ({ src, alt, height = 180, style = {}, onErrorFallback }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleError = (e) => {
    if (error) return; // déjà traité => évite boucle
    setError(true);
    // évite boucle de onerror
    e.currentTarget.onerror = null;

    if (typeof onErrorFallback === 'function') {
      onErrorFallback(e);
      return;
    }

    // Si src est déjà notre fallback local, on ne change rien
    if (!e.currentTarget.src || e.currentTarget.src.includes('placeholder-320x180.jpg')) {
      return;
    }

    // Utilise image locale (même origine) pour éviter CORS
    e.currentTarget.src = LOCAL_FALLBACK;
    console.warn('Image load failed, using local fallback for', alt, src);
  };

  return (
    <div style={{ width: '100%', height: `${height}px`, position: 'relative', backgroundColor: '#f0f0f0', overflow: 'hidden', ...style }}>
      {!loaded && !error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb' }}>
          <div style={{ width: '80%', height: '60%', background: 'linear-gradient(90deg,#eee,#f7f7f7,#eee)', borderRadius: 4 }} />
        </div>
      )}
       <img
        alt={alt}
        src={src}
        // IMPORTANT: on retire crossOrigin par défaut, car il force CORS
        onLoad={() => setLoaded(true)}
        onError={handleError}
        style={{
          width: '100%',
          height: `${height}px`,
          objectFit: 'cover',
          display: 'block',
          transition: 'opacity .25s ease-in',
          opacity: loaded && !error ? 1 : 0.001
        }}
      />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <i className="fas fa-play-circle fa-3x text-white" style={{ opacity: 0.85 }} />
      </div>
    </div>
  );
};

  

// --- COMPOSANT PromotionCard (Optimisé) ---
// const normalizeMediaUrl = (url) => {
//   if (!url) return null;
//   if (url.startsWith('http')) return url;
//   const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
//   return url.startsWith('/') ? `${apiBase}${url}` : `${apiBase}/${url}`;
// };
const PromotionCard = React.memo(({ promotion, onClick }) => {
  const getThumbnail = () => {
    // Utilisez la fonction getMediaUrl pour générer l'URL complète
    if (promotion.thumbnail_url) {
      return getMediaUrl(promotion.thumbnail_url); // CORRECTION ICI
    }
    try {
      if (promotion.url_video) {
        const url = new URL(promotion.url_video);
        if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
          const videoId = url.searchParams.get('v') || url.pathname.split('/').pop();
          return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        }
      }
    } catch (e) { /* ignore */ }
    return "https://via.placeholder.com/320x180.png?text=PubCash+Vidéo";
  };

  return (
    <Col xl="3" lg="4" md="6" className="mb-4">
      <Card
        className="shadow border-0 card-lift--hover"
        onClick={() => onClick(promotion)}
        style={{ cursor: 'pointer', minHeight: 320, display: 'flex', flexDirection: 'column' }}
      >
        <div className="card-image-container">
          <ImageWithPlaceholder src={getThumbnail()} alt={promotion.titre} height={180} />
        </div>

        <CardBody style={{ flex: 1 }}>
          <h5 className="card-title text-truncate" title={promotion.titre}>{promotion.titre}</h5>
          <div>
  <Badge 
    pill 
    className="mr-2" 
    style={{ backgroundColor: "#f36c21", color: "white" }}
  >
    {promotion.nom_pack}
  </Badge>

  <Badge 
    pill 
    style={{ 
      backgroundColor: promotion.statut === 'en_cours' ? "green" : "gray", 
      color: "white" 
    }}
  >
    {(promotion.statut || '').replace('_', ' ')}
  </Badge>
</div>  
          <p className="mt-2 mb-0 small">
            Budget restant : <b>{isNaN(parseFloat(promotion.budget_restant)) ? '0' : parseFloat(promotion.budget_restant).toLocaleString('fr-FR')} FCFA</b>
          </p>
        </CardBody>
      </Card>
    </Col>
  );
}, (prevProps, nextProps) => {
  // simple comparaison : si l'objet promotion a la même id et mêmes valeurs clés essentielles, pas de rerender
  return prevProps.promotion.id === nextProps.promotion.id
    && prevProps.promotion.budget_restant === nextProps.promotion.budget_restant
    && prevProps.promotion.statut === nextProps.promotion.statut
    && prevProps.promotion.titre === nextProps.promotion.titre;
});

// --- COMPOSANT PRINCIPAL Index (Avec Graphique) ---
const Index = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [filter, setFilter] = useState('toutes_mes_promotions'); 

  const fetchPromotions = useCallback(async (currentFilter) => {
    setLoading(true);
    setError(''); // Réinitialiser l'erreur à chaque nouvel appel

    try {
        // C'est tout ! On utilise 'api.get'. Pas de token, pas d'URL complète.
        const response = await api.get(`/client/promotions?filter=${currentFilter}`);
      
        // La réponse d'Axios a les données directement dans .data
        const data = response.data;
        setPromotions(Array.isArray(data) ? data : []);

    } catch (err) {
        // L'intercepteur aura déjà essayé de rafraîchir le token.
        // Si on arrive ici, c'est que même le refresh a échoué.
        const errorMessage = err.response?.data?.message || "Une erreur critique est survenue. Le rafraîchissement de votre session a peut-être échoué.";
        console.error("Erreur fetchPromotions:", err);
        setError(errorMessage);
        setPromotions([]); // Vider les promotions en cas d'erreur
    } finally {
        setLoading(false);
    }
}, []); // Le tableau de dépendances reste le même

  useEffect(() => {
    fetchPromotions(filter);
  }, [filter, fetchPromotions]);

  const handlePromoClick = useCallback((promo) => setSelectedPromo(promo), []);
  const toggleModal = useCallback(() => setSelectedPromo(null), []);

  // Données démo pour le graphique
  const chartData = {
    labels: ["Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"],
    datasets: [{
      label: "Vues",
      data: [0, 20, 10, 30, 15, 40, 20, 60],
    }],
  };

  // Placeholder grid lorsque loading pour éviter jump layout — on affiche des cartes vides avec même taille
  const renderLoadingGrid = () => {
    const placeholders = new Array(4).fill(0);
    return placeholders.map((_, i) => (
      <Col xl="3" lg="4" md="6" className="mb-4" key={`ph-${i}`}>
        <Card className="shadow-sm" style={{ minHeight: 320 }}>
          <div style={{ width: '100%', height: 180, backgroundColor: '#f0f0f0' }} />
          <CardBody>
            <div style={{ height: 16, backgroundColor: '#eee', width: '60%', borderRadius: 4, marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 80, height: 28, backgroundColor: '#eee', borderRadius: 14 }} />
              <div style={{ width: 80, height: 28, backgroundColor: '#eee', borderRadius: 14 }} />
            </div>
            <div style={{ height: 12, backgroundColor: '#eee', width: '40%', borderRadius: 4 }} />
          </CardBody>
        </Card>
      </Col>
    ));
  };

  return (
    <>
      <ClientHeader />
      <Container className="mt--7" fluid>
        {/* Section du Graphique d'Activité */}
        <Row className="mb-4">
          <Col>
            <Card className="shadow">
              <CardHeader className="bg-transparent">
                <h3 className="mb-0"  style={{ color: "White" }}>Activité Globale de vos Promotions</h3>
              </CardHeader>
              <CardBody>
                <div className="chart">
                  <Line data={chartData} options={chartExample1.options} />
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
 {/* --- NOUVELLE SECTION POUR LES FILTRES --- */}
 <Row className="align-items-center">
        <Col>
          <h2 className="mb-4"  style={{ color: "White" }} >Mes Promotions</h2>
        </Col>
        <Col className="text-right d-flex justify-content-end">
          <Button
            color={filter === 'toutes_mes_promotions' ? 'primary' : 'secondary'}
            onClick={() => setFilter('toutes_mes_promotions')}
            className="mr-2"
            size="sm"
          >
            Toutes mes promotionsXXX
          </Button>
          <Button
            color={filter === 'ma_commune' ? 'primary' : 'secondary'}
            onClick={() => setFilter('ma_commune')}
            className="mr-2"
            size="sm"
          >
            Pour ma commune
          </Button>
          <Button
            color={filter === 'toutes_communes' ? 'primary' : 'secondary'}
            onClick={() => setFilter('toutes_communes')}
            size="sm"
          >
            Pour toutes les communes
          </Button>
        </Col>
      </Row>
        {/* Section "Mes Promotions" */}
     

        <Row>
          {loading && (
            // on réserve de l'espace avec des placeholders identiques aux cartes réelles
            <div className="w-100 d-flex flex-wrap">
              {renderLoadingGrid()}
            </div>
          )}

          {!loading && error && (
            <div className="text-center w-100 p-5 text-danger">{error}</div>
          )}

          {!loading && !error && promotions.length === 0 && (
            <Col>
              <Card className="shadow-sm p-5 text-center">
                <p className="mb-0">Vous n'avez pas encore créé de promotion.</p>
                <p className="small text-muted">Cliquez sur "Créer une Promotion" dans le menu pour commencer.</p>
              </Card>
            </Col>
          )}

          {!loading && !error && promotions.length > 0 && promotions.map(promo => (
            <PromotionCard key={promo.id} promotion={promo} onClick={handlePromoClick} />
          ))}
        </Row>
      </Container>

     {/* --- FENÊTRE MODALE MISE À JOUR --- */}
     <Modal isOpen={!!selectedPromo} toggle={toggleModal} size="lg" centered>
        <ModalHeader toggle={toggleModal} className="border-bottom pb-2">
          <h4 className="mb-0">{selectedPromo?.titre}</h4>
        </ModalHeader>
        <ModalBody>
          {selectedPromo && (
            <Row>
              <Col md="8">
                <div className="player-wrapper mb-3 mb-md-0" style={{ borderRadius: '0.375rem', overflow: 'hidden' }}>
              {/* À la place de ReactPlayer */}
<div className="player-wrapper mb-3 mb-md-0" style={{ minHeight: 200 }}>
  <video 
    controls 
    width="100%" 
    height="100%"
    key={selectedPromo.url_video} // Important pour forcer le re-render
    style={{ backgroundColor: 'black' }}
  >
   <source src={getMediaUrl(selectedPromo.url_video)} type="video/mp4" />
    Votre navigateur ne prend pas en charge la lecture de vidéos.
  </video>
</div>
                </div>
              </Col>
              <Col md="4">
                <h5 className="mb-3 font-weight-bold">Statistiques</h5>
                
                {/* Liste des statistiques avec le nouveau style */}
                <ListGroup flush>
                  <ListGroupItem className="px-0 py-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="icon icon-shape icon-sm text-info bg-neutral-info rounded-circle mr-3">
                        <i className="fas fa-eye" />
                      </div>
                      <span>Vues</span>
                    </div>
                    <Badge color="neutral" className="text-info" pill>{selectedPromo.vues ?? 0}</Badge>
                  </ListGroupItem>
                  <ListGroupItem className="px-0 py-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                       <div className="icon icon-shape icon-sm text-primary bg-neutral-primary rounded-circle mr-3">
                        <i className="fas fa-thumbs-up" />
                      </div>
                      <span>Likes</span>
                    </div>
                    <Badge color="neutral" className="text-primary" pill>{selectedPromo.likes ?? 0}</Badge>
                  </ListGroupItem>
                  <ListGroupItem className="px-0 py-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                       <div className="icon icon-shape icon-sm text-success bg-neutral-success rounded-circle mr-3">
                        <i className="fas fa-share" />
                      </div>
                      <span>Partages</span>
                    </div>
                    <Badge color="neutral" className="text-success" pill>{selectedPromo.partages ?? 0}</Badge>
                  </ListGroupItem>
                  <ListGroupItem className="px-0 py-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                       <div className="icon icon-shape icon-sm text-warning bg-neutral-warning rounded-circle mr-3">
                        <i className="fas fa-wallet" />
                      </div>
                      <span>Budget Restant</span>
                    </div>
                    <Badge color="warning" pill>
                      {parseFloat(selectedPromo.budget_restant || 0).toLocaleString('fr-FR')} FCFA
                    </Badge>
                  </ListGroupItem>
                </ListGroup>
              </Col>
            </Row>
          )}
        </ModalBody>
      </Modal>
    </>
  );
};

export default Index;
