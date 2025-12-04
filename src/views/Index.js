import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  NavItem,
  NavLink,
  Nav,
  Progress,
  Table,
  Container,
  Row,
  Col,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ListGroup,
  ListGroupItem
} from "reactstrap";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import ClientHeader from "components/Headers/ClientHeader.js";
import api, { getMediaUrl } from 'services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// --- CONSTANTES & STYLES ---
const CHART_COLORS = {
  orange: '#f36c21',
  orangeLight: 'rgba(243, 108, 33, 0.2)',
  white: '#ffffff',
  whiteLight: 'rgba(255, 255, 255, 0.2)',
  grid: 'rgba(0, 0, 0, 0.05)',
  text: '#2d3748'
};

const CUSTOM_STYLES = {};

// --- Petit composant ImageWithPlaceholder ---
const LOCAL_FALLBACK = `${process.env.PUBLIC_URL}/img/placeholder-320x180.jpg`;

const ImageWithPlaceholder = ({ src, alt, height = 180, style = {}, onErrorFallback }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleError = (e) => {
    if (error) return;
    setError(true);
    e.currentTarget.onerror = null;

    if (typeof onErrorFallback === 'function') {
      onErrorFallback(e);
      return;
    }

    if (!e.currentTarget.src || e.currentTarget.src.includes('placeholder-320x180.jpg')) {
      return;
    }

    e.currentTarget.src = LOCAL_FALLBACK;
    console.warn('Image load failed, using local fallback for', alt, src);
  };

  return (
    <div style={{ width: '100%', height: `${height}px`, position: 'relative', backgroundColor: '#1a202c', overflow: 'hidden', ...style }}>
      {!loaded && !error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568' }}>
          <div style={{ width: '80%', height: '60%', background: 'linear-gradient(90deg,#2d3748,#4a5568,#2d3748)', borderRadius: 4 }} />
        </div>
      )}
      <img
        alt={alt}
        src={src}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        style={{
          width: '100%',
          height: `${height}px`,
          objectFit: 'cover',
          display: 'block',
          transition: 'opacity .3s ease-in',
          opacity: loaded && !error ? 1 : 0.001
        }}
      />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <i className="fas fa-play-circle fa-3x text-white" style={{ opacity: 0.85, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }} />
      </div>
    </div>
  );
};

// --- COMPOSANT PromotionCard ---
const PromotionCard = React.memo(({ promotion, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getThumbnail = () => {
    if (promotion.thumbnail_url) {
      return getMediaUrl(promotion.thumbnail_url);
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
        className="promo-card-custom"
        onClick={() => onClick(promotion)}
      >
        <div className="card-image-container">
          <ImageWithPlaceholder src={getThumbnail()} alt={promotion.titre} height={180} />
        </div>

        <CardBody style={{ flex: 1, padding: '1.25rem' }}>
          {/* MODIFIÉ: Couleur du texte changée pour être visible sur fond blanc */}
          <h5 className="card-title text-truncate" title={promotion.titre} style={{ color: '#1a202c', marginBottom: '0.75rem', fontWeight: '600' }}>
            {promotion.titre || "Titre de la promotion"}
          </h5>
          <div style={{ marginBottom: '0.75rem' }}>
            <Badge
              pill
              className="mr-2"
              style={{
                background: 'linear-gradient(45deg, #f36c21, #ff8c42)',
                color: "white",
                border: 'none',
                fontWeight: '600'
              }}
            >
              {promotion.nom_pack}
            </Badge>

            <Badge
              pill
              style={{
                background: promotion.statut === 'en_cours' ? 'linear-gradient(45deg, #48bb78, #68d391)' : 'linear-gradient(45deg, #a0aec0, #cbd5e0)',
                color: "white",
                border: 'none',
                fontWeight: '600'
              }}
            >
              {(promotion.statut || '').replace('_', ' ')}
            </Badge>
          </div>
          {/* MODIFIÉ: Couleur du texte changée pour être visible sur fond blanc */}
          <p className="mt-2 mb-0 small" style={{ color: '#4a5568' }}>
            Budget restant : <b style={{ color: '#f36c21' }}>
              {isNaN(parseFloat(promotion.budget_restant)) ? '0' : parseFloat(promotion.budget_restant).toLocaleString('fr-FR')} FCFA
            </b>
          </p>
          {/* MODIFIÉ: Couleur du texte changée pour être visible sur fond blanc */}
          <p className="mt-1 mb-0 small" style={{ color: '#718096' }}>
            Vues: {promotion.vues || 0} | Likes: {promotion.likes || 0} | Partages: {promotion.partages || 0}
          </p>
        </CardBody>
      </Card>
    </Col>
  );
});

// --- COMPOSANT PRINCIPAL Index ---
const Index = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [filter, setFilter] = useState('toutes_mes_promotions');
  const [chartData, setChartData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    total_vues: 0,
    total_likes: 0,
    total_partages: 0,
    total_promotions: 0,
    total_budget: 0,
    performance_moyenne: 0
  });
  const [activeChart, setActiveChart] = useState('tous');

  // Fonction pour formater les dates en noms de mois français
  const getFrenchMonthName = (monthNumber) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthNumber - 1] || '';
  };

  // Fonction pour récupérer les statistiques détaillées AVEC interactions
  const fetchDetailedStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await api.get('/client/detailed-stats');
      const data = response.data;

      if (data.monthlyStats) { // Modifié pour s'exécuter même si les stats sont vides
        // Préparer les données pour l'année civile en cours
        const currentYear = new Date().getFullYear();
        const monthlyData = [];

        // Créer un tableau pour les 12 mois de l'année en cours (Janvier à Décembre)
        for (let month = 1; month <= 12; month++) {
          const existingData = data.monthlyStats.find(stat =>
            stat.annee === currentYear && stat.mois === month
          );

          monthlyData.push({
            annee: currentYear,
            mois: month,
            nom_mois: getFrenchMonthName(month).substring(0, 3),
            total_vues: existingData?.total_vues || 0,
            total_likes: existingData?.total_likes || 0,
            total_partages: existingData?.total_partages || 0,
            nombre_promotions: existingData?.nombre_promotions || 0
          });
        }

        // L'année est maintenant toujours la même, on peut l'afficher de manière plus concise
        const labels = monthlyData.map(item => `${item.nom_mois}`); // On retire l'année du label mensuel

        // Données pour chaque métrique
        const vuesData = monthlyData.map(item => item.total_vues);
        const likesData = monthlyData.map(item => item.total_likes);
        const partagesData = monthlyData.map(item => item.total_partages);

        // MODIFIÉ: Configuration des datasets avec les couleurs et remplissages souhaités
        setChartData({
          labels: labels,
          datasets: [
            {
              label: "Vues",
              data: vuesData,
              borderColor: CHART_COLORS.white,
              backgroundColor: CHART_COLORS.whiteLight, // Remplissage blanc transparent
              pointBackgroundColor: CHART_COLORS.white,
              pointBorderColor: CHART_COLORS.white,
              pointHoverBackgroundColor: CHART_COLORS.orange,
              pointHoverBorderColor: CHART_COLORS.white,
              pointRadius: 4,
              pointHoverRadius: 6,
              tension: 0.4,
              fill: true, // Activation du remplissage
              borderWidth: 3,
              yAxisID: 'y'
            },
            {
              label: "Likes",
              data: likesData,
              borderColor: CHART_COLORS.orange,
              backgroundColor: CHART_COLORS.orangeLight, // Remplissage orange transparent
              pointBackgroundColor: CHART_COLORS.orange,
              pointBorderColor: CHART_COLORS.white,
              pointHoverBackgroundColor: CHART_COLORS.white,
              pointHoverBorderColor: CHART_COLORS.orange,
              pointRadius: 3,
              pointHoverRadius: 5,
              tension: 0.4,
              fill: true, // Activation du remplissage
              borderWidth: 2,
              yAxisID: 'y'
            },
            {
              label: "Partages",
              data: partagesData,
              borderColor: '#ff8c42', // Couleur orange clair pour la ligne
              backgroundColor: 'rgba(255, 140, 66, 0.1)', // Remplissage associé
              pointBackgroundColor: '#ff8c42',
              pointBorderColor: CHART_COLORS.white,
              pointRadius: 3,
              pointHoverRadius: 5,
              tension: 0.4,
              fill: true, // Activation du remplissage
              borderWidth: 2,
              yAxisID: 'y',
              hidden: activeChart !== 'tous' && activeChart !== 'partages'
            }
          ]
        });

        // Mettre à jour les statistiques globales
        if (data.globalStats) {
          setGlobalStats({
            total_vues: data.globalStats.total_vues || 0,
            total_likes: data.globalStats.total_likes || 0,
            total_partages: data.globalStats.total_partages || 0,
            total_promotions: data.globalStats.total_promotions || 0,
            total_budget: data.globalStats.total_budget_depense || 0,
            performance_moyenne: data.globalStats.performance_moyenne || 0
          });
        }
      }
    } catch (err) {
      console.error("Erreur fetchDetailedStats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [activeChart]);

  const fetchPromotions = useCallback(async (currentFilter) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/client/promotions?filter=${currentFilter}`);
      setPromotions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Une erreur est survenue.";
      setError(errorMessage);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions(filter);
    fetchDetailedStats();
  }, [filter, fetchPromotions, fetchDetailedStats]);

  // Options PERSONNALISÉES pour le graphique (sans conflit CSS)
  const customChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: CHART_COLORS.text,
          font: {
            size: 12,
            weight: 'bold',
            family: "'Inter', sans-serif"
          },
          usePointStyle: true,
          padding: 15,
          boxWidth: 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(26, 32, 44, 0.95)',
        titleColor: CHART_COLORS.white,
        bodyColor: CHART_COLORS.white,
        borderColor: CHART_COLORS.orange,
        borderWidth: 2,
        cornerRadius: 8,
        usePointStyle: true,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('fr-FR').format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: CHART_COLORS.grid,
          drawBorder: false,
          borderDash: [3, 3]
        },
        ticks: {
          color: CHART_COLORS.text,
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          }
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          color: CHART_COLORS.grid,
          drawBorder: false,
          borderDash: [3, 3]
        },
        ticks: {
          color: CHART_COLORS.text,
          callback: function (value) {
            return new Intl.NumberFormat('fr-FR').format(value);
          },
          font: {
            family: "'Inter', sans-serif"
          }
        }
      }
    },
    elements: {
      point: {
        hoverBorderWidth: 3,
        hoverRadius: 8
      },
      line: {
        tension: 0.4
      }
    }
  };

  // Fonction pour filtrer les datasets affichés
  const filterDatasets = (chartType) => {
    if (!chartData) return chartData;

    const filteredData = {
      ...chartData,
      datasets: chartData.datasets.map(dataset => ({
        ...dataset,
        hidden: chartType === 'tous' ? false : dataset.label.toLowerCase() !== chartType
      }))
    };

    return filteredData;
  };

  const handlePromoClick = useCallback((promo) => setSelectedPromo(promo), []);
  const toggleModal = useCallback(() => setSelectedPromo(null), []);

  const renderLoadingGrid = () => {
    const placeholders = new Array(4).fill(0);
    return placeholders.map((_, i) => (
      <Col xl="3" lg="4" md="6" className="mb-4" key={`ph-${i}`}>
        <Card style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          minHeight: 320
        }}>
          <div style={{ width: '100%', height: 180, background: '#E2E8F0' }} />
          <CardBody>
            <div style={{ height: 16, background: '#E2E8F0', width: '60%', borderRadius: 4, marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 80, height: 28, background: '#E2E8F0', borderRadius: 14 }} />
              <div style={{ width: 80, height: 28, background: '#E2E8F0', borderRadius: 14 }} />
            </div>
            <div style={{ height: 12, background: '#E2E8F0', width: '40%', borderRadius: 4 }} />
          </CardBody>
        </Card>
      </Col>
    ));
  };


  return (
    <>
      <ClientHeader />
      <Container className="mt--7" fluid>

        {/* Section Analytics (Split) */}
        <div className="analytics-container mb-4">
            <div className="analytics-header">
                <h3>Analytics Détaillées</h3>
                <p className="text-muted">Performance complète de vos campagnes publicitaires sur 12 mois</p>
            </div>
            <Row>
                <Col lg="8" className="mb-4 mb-lg-0">
                    <div className="chart-box">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="chart-box-title mb-0">Vue d'ensemble</h4>
                            <div>
                                <Button size="sm" onClick={() => setActiveChart('tous')} className={`btn-filter-custom ${activeChart === 'tous' ? 'active' : ''}`}>Tous</Button>
                                <Button size="sm" onClick={() => setActiveChart('vues')} className={`btn-filter-custom ${activeChart === 'vues' ? 'active' : ''}`}>Vues</Button>
                                <Button size="sm" onClick={() => setActiveChart('likes')} className={`btn-filter-custom ${activeChart === 'likes' ? 'active' : ''}`}>Likes</Button>
                                <Button size="sm" onClick={() => setActiveChart('partages')} className={`btn-filter-custom ${activeChart === 'partages' ? 'active' : ''}`}>Partages</Button>
                            </div>
                        </div>
                        <div className="chart-big-number">
                             {statsLoading ? "..." : (activeChart === 'likes' ? globalStats.total_likes : activeChart === 'partages' ? globalStats.total_partages : globalStats.total_vues).toLocaleString('fr-FR')}
                        </div>
                        <div style={{ height: '300px' }}>
                             {statsLoading ? <div className="text-center py-5">Chargement...</div> :
                              chartData ? <Line data={filterDatasets(activeChart)} options={customChartOptions} /> :
                              <div className="text-center">Aucune donnée</div>}
                        </div>
                    </div>
                </Col>
                <Col lg="4">
                    <div className="chart-box">
                        <h4 className="chart-box-title">Répartition</h4>
                         <div className="chart-big-number">
                            {(globalStats.total_vues + globalStats.total_likes + globalStats.total_partages).toLocaleString('fr-FR')}
                        </div>
                        <div style={{ height: '250px', position: 'relative' }}>
                            <Doughnut
                                data={{
                                    labels: ['Vues', 'Likes', 'Partages'],
                                    datasets: [{
                                        data: [globalStats.total_vues, globalStats.total_likes, globalStats.total_partages],
                                        backgroundColor: ['#0076bd', '#5e0080', '#00c853'],
                                        borderWidth: 0
                                    }]
                                }}
                                options={{
                                    cutout: '70%',
                                    plugins: { legend: { position: 'right' } },
                                    maintainAspectRatio: false
                                }}
                            />
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
        {/* Section Filtres et Promotions */}
        <Row className="align-items-center mb-4">
          <Col>
            <h2 className="mb-0 text-dark">Mes Promotions</h2>
            <p className="text-muted mb-0">Gérez et suivez vos campagnes publicitaires</p>
          </Col>
          <Col className="text-right d-flex justify-content-end">
            <Button
              color={filter === 'toutes_mes_promotions' ? 'primary' : 'secondary'}
              onClick={() => setFilter('toutes_mes_promotions')}
              className="mr-2"
              size="sm"
              style={{
                backgroundColor: filter === 'toutes_mes_promotions' ? CHART_COLORS.orange : '#6c757d',
                borderColor: filter === 'toutes_mes_promotions' ? CHART_COLORS.orange : '#6c757d'
              }}
            >
              Toutes mes promotions
            </Button>
            <Button
              color={filter === 'ma_commune' ? 'primary' : 'secondary'}
              onClick={() => setFilter('ma_commune')}
              className="mr-2"
              size="sm"
              style={{
                backgroundColor: filter === 'ma_commune' ? CHART_COLORS.orange : '#6c757d',
                borderColor: filter === 'ma_commune' ? CHART_COLORS.orange : '#6c757d'
              }}
            >
              Pour ma commune
            </Button>
            <Button
              color={filter === 'toutes_communes' ? 'primary' : 'secondary'}
              onClick={() => setFilter('toutes_communes')}
              size="sm"
              style={{
                backgroundColor: filter === 'toutes_communes' ? CHART_COLORS.orange : '#6c757d',
                borderColor: filter === 'toutes_communes' ? CHART_COLORS.orange : '#6c757d'
              }}
            >
              Pour toutes les communes
            </Button>
          </Col>
        </Row>

        {/* Grille des Promotions */}
        <Row>
          {loading && (
            <div className="w-100 d-flex flex-wrap">
              {renderLoadingGrid()}
            </div>
          )}

          {!loading && error && (
            <Col xs="12">
              <Card className="shadow-sm p-5 text-center bg-danger text-white">
                <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
                <h5>Erreur de chargement</h5>
                <p className="mb-0">{error}</p>
                <Button color="light" className="mt-3" onClick={() => fetchPromotions(filter)}>
                  <i className="fas fa-redo mr-2"></i> Réessayer
                </Button>
              </Card>
            </Col>
          )}

          {!loading && !error && promotions.length === 0 && (
            <Col xs="12">
              <Card className="shadow-sm p-5 text-center" style={{ background: '#FFFFFF' }}>
                <i className="fas fa-video fa-3x text-muted mb-3"></i>
                <h4 className="text-dark">Aucune promotion trouvée</h4>
                <p className="text-secondary mb-3">Vous n'avez pas encore créé de promotion ou aucune ne correspond aux filtres sélectionnés.</p>
                <p className="small text-muted">Cliquez sur "Créer une Promotion" dans le menu pour commencer.</p>
              </Card>
            </Col>
          )}

          {!loading && !error && promotions.length > 0 && promotions.map(promo => (
            <PromotionCard key={promo.id} promotion={promo} onClick={handlePromoClick} />
          ))}
        </Row>
      </Container>

      {/* Modal de détail de promotion (Aucune modification ici) */}
      <Modal isOpen={!!selectedPromo} toggle={toggleModal} size="lg" centered>
        <ModalHeader toggle={toggleModal} className="border-bottom pb-2" style={{ background: 'linear-gradient(45deg, #2d3748, #4a5568)', color: 'white' }}>
          <div>
            <h4 className="mb-0">{selectedPromo?.titre}</h4>
            <small className="text-light">{selectedPromo?.description}</small>
          </div>
        </ModalHeader>
        <ModalBody style={{ backgroundColor: '#f8f9fa' }}>
          {selectedPromo && (
            <Row>
              <Col md="8">
                <div className="player-wrapper mb-3 mb-md-0" style={{ borderRadius: '0.375rem', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <div className="player-wrapper mb-3 mb-md-0" style={{ minHeight: 200 }}>
                    <video
                      controls
                      width="100%"
                      height="100%"
                      key={selectedPromo.url_video}
                      style={{ backgroundColor: 'black', borderRadius: '0.375rem' }}
                      poster={getMediaUrl(selectedPromo.thumbnail_url)}
                    >
                      <source src={getMediaUrl(selectedPromo.url_video)} type="video/mp4" />
                      Votre navigateur ne prend pas en charge la lecture de vidéos.
                    </video>
                  </div>
                </div>

                <Card className="mt-3 shadow-sm">
                  <CardBody>
                    <h6 className="text-uppercase text-muted mb-3">Informations de la campagne</h6>
                    <Row>
                      <Col sm="6">
                        <p className="mb-1"><strong>Pack:</strong> {selectedPromo.nom_pack}</p>
                        <p className="mb-1"><strong>Statut:</strong>
                          <Badge color={selectedPromo.statut === 'en_cours' ? 'success' : 'secondary'} className="ml-2">
                            {selectedPromo.statut?.replace('_', ' ') || 'Inconnu'}
                          </Badge>
                        </p>
                      </Col>
                      <Col sm="6">
                        <p className="mb-1"><strong>Budget initial:</strong> {parseFloat(selectedPromo.budget_initial || 0).toLocaleString('fr-FR')} FCFA</p>
                        <p className="mb-1"><strong>Budget restant:</strong> {parseFloat(selectedPromo.budget_restant || 0).toLocaleString('fr-FR')} FCFA</p>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
              </Col>

              <Col md="4">
                <h5 className="mb-3 font-weight-bold text-dark">Statistiques détaillées</h5>

                <ListGroup flush>
                  {/* --- NOUVEAU : CIBLAGE COMMUNE --- */}
  <ListGroupItem className="px-0 py-3 d-flex justify-content-between align-items-center">
    <div className="d-flex align-items-center">
      {/* J'utilise un style inline pour le violet car bg-neutral-purple n'existe peut-être pas dans votre CSS */}
      <div className="icon icon-shape icon-sm text-white rounded-circle mr-3" style={{ backgroundColor: '#9b59b6' }}>
        <i className="fas fa-map-marker-alt" />
      </div>
      <span className="font-weight-bold">Zone Ciblée</span>
    </div>
    <Badge color="dark" pill className="px-3 py-2">
      {selectedPromo.ciblage_commune === 'toutes' 
        ? 'Toutes les communes' 
        : selectedPromo.ciblage_commune}
    </Badge>
  </ListGroupItem>

  {/* --- NOUVEAU : CIBLAGE AGE --- */}
  <ListGroupItem className="px-0 py-3 d-flex justify-content-between align-items-center">
    <div className="d-flex align-items-center">
      <div className="icon icon-shape icon-sm text-white rounded-circle mr-3" style={{ backgroundColor: '#34495e' }}>
        <i className="fas fa-users" />
      </div>
      <span className="font-weight-bold">Tranche d'âge</span>
    </div>
    <Badge color="secondary" pill className="px-3 py-2">
      {selectedPromo.tranche_age === 'tous' 
        ? 'Tout public' 
        : `${selectedPromo.tranche_age} ans`}
    </Badge>
  </ListGroupItem>
                  <ListGroupItem className="px-0 py-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="icon icon-shape icon-sm text-info bg-neutral-info rounded-circle mr-3">
                        <i className="fas fa-eye" />
                      </div>
                      <span className="font-weight-bold">Vues totales</span>
                    </div>
                    <Badge color="info" pill className="px-3 py-2">{selectedPromo.vues ?? 0}</Badge>
                  </ListGroupItem>

                  <ListGroupItem className="px-0 py-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="icon icon-shape icon-sm text-primary bg-neutral-primary rounded-circle mr-3">
                        <i className="fas fa-thumbs-up" />
                      </div>
                      <span className="font-weight-bold">Likes</span>
                    </div>
                    <Badge color="primary" pill className="px-3 py-2">{selectedPromo.likes ?? 0}</Badge>
                  </ListGroupItem>

                  <ListGroupItem className="px-0 py-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="icon icon-shape icon-sm text-success bg-neutral-success rounded-circle mr-3">
                        <i className="fas fa-share" />
                      </div>
                      <span className="font-weight-bold">Partages</span>
                    </div>
                    <Badge color="success" pill className="px-3 py-2">{selectedPromo.partages ?? 0}</Badge>
                  </ListGroupItem>

                  <ListGroupItem className="px-0 py-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="icon icon-shape icon-sm text-warning bg-neutral-warning rounded-circle mr-3">
                        <i className="fas fa-wallet" />
                      </div>
                      <span className="font-weight-bold">Budget Restant</span>
                    </div>
                    <Badge color="warning" pill className="px-3 py-2">
                      {parseFloat(selectedPromo.budget_restant || 0).toLocaleString('fr-FR')} FCFA
                    </Badge>
                  </ListGroupItem>

                  <ListGroupItem className="px-0 py-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="icon icon-shape icon-sm text-danger bg-neutral-danger rounded-circle mr-3">
                        <i className="fas fa-chart-line" />
                      </div>
                      <span className="font-weight-bold">Taux d'engagement</span>
                    </div>
                    <Badge color="danger" pill className="px-3 py-2">
                      {selectedPromo.vues ?
                        Math.round(((selectedPromo.likes + selectedPromo.partages) / selectedPromo.vues) * 100) : 0
                      }%
                    </Badge>
                  </ListGroupItem>
                </ListGroup>

                <Card className="mt-3 shadow-sm border-0">
                  <CardBody className="text-center">
                    <h6 className="text-uppercase text-muted mb-2">Performance</h6>
                    <div className="d-flex justify-content-center align-items-center">
                      <div className={`rounded-circle p-3 ${selectedPromo.vues > 50 ? 'bg-success' : selectedPromo.vues > 10 ? 'bg-warning' : 'bg-danger'}`}>
                        <i className={`fas ${selectedPromo.vues > 50 ? 'fa-fire' : selectedPromo.vues > 10 ? 'fa-trend-up' : 'fa-trend-down'} text-white fa-2x`}></i>
                      </div>
                    </div>
                    <p className="mt-2 mb-0 small">
                      {selectedPromo.vues > 50 ? 'Excellente performance' :
                        selectedPromo.vues > 10 ? 'Performance moyenne' :
                          'Démarrage lent'}
                    </p>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}
        </ModalBody>
      </Modal>
    </>
  );
};

export default Index;