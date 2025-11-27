import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Row, Col, Card, CardBody, Button, Form, FormGroup, Input, Label,
  Spinner, Alert, Modal, ModalHeader, ModalBody, ModalFooter
} from 'reactstrap';
import { io } from "socket.io-client";
import api from 'services/api';
import UserNavbar from 'components/Navbars/UserNavbar.js';
import ShareModal from 'components/Share/ShareModal.js';
import QuizModal from 'components/Modals/QuizModal.js';
import { getMediaUrl } from 'utils/mediaUrl';
import '../assets/css/UserView.css';
import '../assets/css/UserViewDark.css';

// Alias Input as SelectInput for compatibility if needed, or just replace usage
const SelectInput = Input;

const UserView = () => {
  // STATES
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState({});
  const [interactionState, setInteractionState] = useState({});
  const [videoEnded, setVideoEnded] = useState({});
  const [commentSending, setCommentSending] = useState({});
  const [filter, setFilter] = useState('toutes');
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [playbackStarted, setPlaybackStarted] = useState({});
  const [videoPlaying, setVideoPlaying] = useState({});
  const [videoProgress, setVideoProgress] = useState({});
  const [videoMuted, setVideoMuted] = useState({});
  const [videoLoaded, setVideoLoaded] = useState({});
  const [earnings, setEarnings] = useState({ total: 0, per_pack: [] });
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [operator, setOperator] = useState('orange');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [promoToShare, setPromoToShare] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Nouveaux états pour les jeux/points
  const [points, setPoints] = useState(0);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);

  const navigate = useNavigate();
  const videoRefs = useRef({});
  const lastTime = useRef({});
  const playbackStartedRef = useRef({});
  const videoEndedRef = useRef({});
  const socketRef = useRef(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // UTILS
  const openShareModal = (promo) => {
    setPromoToShare(promo);
    setShareModalOpen(true);
  };

  useEffect(() => {
    playbackStartedRef.current = playbackStarted;
    videoEndedRef.current = videoEnded;
  }, [playbackStarted, videoEnded]);

  const compactValue = (value, divideBy = 1000, decimals = 4) => {
    const num = Number(value ?? 0);
    const formatted = (num / divideBy).toFixed(decimals);
    return String(formatted).replace(/[^0-9]/g, '');
  };

  const compactInteger = (value) => {
    return String(Number(value ?? 0).toFixed(0)).replace(/[^0-9]/g, '');
  };

  const fetchPromotions = useCallback(async (currentFilter) => {
    setLoading(true);
    try {
      const res = await api.get(`/promotions?filter=${currentFilter}`);
      const data = res.data || [];
      setPromotions(data);

      const newInteractionState = {}, newVideoEnded = {}, newPlaybackStarted = {}, newVideoPlaying = {}, newVideoMuted = {}, newVideoLoaded = {};
      data.forEach(promo => {
        newInteractionState[promo.id] = { liked: false, shared: false };
        newVideoEnded[promo.id] = false;
        newPlaybackStarted[promo.id] = false;
        newVideoPlaying[promo.id] = false;
        newVideoLoaded[promo.id] = false;
        newVideoMuted[promo.id] = true;
        lastTime.current[promo.id] = 0;
      });

      setInteractionState(newInteractionState);
      setVideoEnded(newVideoEnded);
      setPlaybackStarted(newPlaybackStarted);
      setVideoPlaying(newVideoPlaying);
      setVideoMuted(newVideoMuted);
      setVideoLoaded(newVideoLoaded);
    } catch (err) {
      console.error('Erreur fetchPromotions:', err);
      setError("Impossible de charger les vidéos pour le moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPoints = useCallback(async () => {
    try {
      const res = await api.get('/games/points');
      setPoints(res.data.points || 0);
    } catch (err) {
      console.error('Erreur fetchPoints:', err);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(`${theme}-mode`);
  }, [theme]);

  useEffect(() => {
    fetchPromotions(filter);
  }, [filter, fetchPromotions]);

  const fetchEarnings = useCallback(async () => {
    try {
      const res = await api.get('/promotions/utilisateur/gains');
      setEarnings(res.data || { total: 0, per_pack: [] });
    } catch (err) {
      console.error('fetchEarnings error', err);
    }
  }, []);

  const fetchWithdrawHistory = useCallback(async () => {
    try {
      const response = await api.get('/promotions/utilisateur/historique-retraits');
      setWithdrawHistory(response.data || []);
    } catch (error) {
      console.error('Erreur fetchWithdrawHistory:', error);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
    fetchPoints();
    fetchWithdrawHistory();
    const interval = setInterval(fetchWithdrawHistory, 30000);
    return () => clearInterval(interval);
  }, [fetchEarnings, fetchWithdrawHistory, fetchPoints]);

  const handleWithdraw = async () => {
    const amountToWithdraw = Number(withdrawAmount);
    if (!amountToWithdraw || amountToWithdraw <= 0) {
      setWithdrawError("Veuillez entrer un montant valide.");
      return;
    }
    if (amountToWithdraw < 200) {
      setWithdrawError("Le montant minimum est de 200 XOF.");
      return;
    }
    if (amountToWithdraw > Number(earnings.total)) {
      setWithdrawError("Solde insuffisant.");
      return;
    }
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber.replace(/\D/g, ''))) {
      setWithdrawError("Numéro de téléphone invalide (10 chiffres requis).");
      return;
    }

    setWithdrawing(true);
    setWithdrawError(null);
    setWithdrawSuccess(false);

    try {
      await api.post('/promotions/utilisateur/retrait', {
        amount: amountToWithdraw,
        operator,
        phoneNumber
      });

      setWithdrawSuccess("Votre demande de retrait a été envoyée avec succès !");
      setWithdrawAmount('');
      setWithdrawModalOpen(false); // On ferme le modal après succès

      // Rafraichir les données
      await fetchEarnings();
      await fetchWithdrawHistory();

      setTimeout(() => setWithdrawSuccess(false), 8000);

    } catch (err) {
      const errorMessage = err.response?.data?.message || "Erreur lors du retrait ou solde insuffisant.";
      const errorDetails = err.response?.data?.details ? ` (${err.response.data.details})` : '';

      setWithdrawError(errorMessage + errorDetails);

      await fetchEarnings();
      await fetchWithdrawHistory();

      setTimeout(() => setWithdrawError(null), 8000);
    } finally {
      setWithdrawing(false);
    }
  };

  const swapToPromo = (promoId) => {
    const idx = promotions.findIndex(p => p.id === promoId);
    if (idx <= 0) return;

    const newPromos = promotions.slice();
    const tmp = newPromos[0];
    newPromos[0] = newPromos[idx];
    newPromos[idx] = tmp;

    setPromotions(newPromos);

    const oldMainId = tmp.id;
    const newMainId = promoId;

    setVideoEnded(prev => ({ ...prev, [oldMainId]: false, [newMainId]: false }));
    setPlaybackStarted(prev => ({ ...prev, [oldMainId]: false, [newMainId]: false }));
    setVideoPlaying(prev => ({ ...prev, [oldMainId]: false, [newMainId]: false }));
    setVideoLoaded(prev => ({ ...prev, [newMainId]: false }));

    setActiveVideoId(null);

    setTimeout(() => {
      const v = videoRefs.current[newMainId];
      if (v) {
        try {
          v.pause();
          v.currentTime = 0;
          if (typeof v.load === 'function') v.load();
        } catch (e) { }
      }
    }, 120);
  };

  const handleInteraction = async (promoId, type) => {
    try {
      await api.post(`/promotions/${promoId}/${type}`);
      setInteractionState(prev => ({ ...prev, [promoId]: { ...prev[promoId], [type === 'like' ? 'liked' : 'shared']: true } }));

      if (type === 'partage') {
       setShareModalOpen(false); 

       // On cherche la promo actuelle dans la liste chargée
       const promo = promotions.find(p => p.id === promoId);

       // CORRECTION : Grâce à la modif SQL, 'game_id' existe maintenant dans l'objet promo
       if (promo && promo.game_id) {
             console.log("Quiz détecté, ouverture du modal...", promo); // Debug
             setCurrentQuiz(promo); 
             setQuizModalOpen(true);
             return; 
       }

       // Si pas de quiz, on reload
        await fetchPromotions(filter);
        setTimeout(() => window.location.reload(), 500);
        return;
      }

      if (type !== 'partage') {
        await fetchEarnings();
      }
    } catch (error) {
      console.error(`Erreur lors de l'action '${type}':`, error);
    }
  };

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || !userInfo.id) return;
    const socketUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://pub-cash.com';

    const socket = io(socketUrl);
    socketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('user_online', userInfo.id);
    });
    socket.emit('join-user-room', userInfo.id);
    socket.on('withdrawal-updated', (data) => {
      setWithdrawHistory(prevHistory => prevHistory.map(item => item.id === data.requestId ? { ...item, statut: data.status } : item));
      setWithdrawSuccess(`Votre demande de retrait a été ${data.status === 'traite' ? 'traitée' : 'rejetée'}`);
      setTimeout(() => setWithdrawSuccess(false), 5000);
    });
    return () => {
      try {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      } catch (e) { }
    };
  }, []);

  const onVideoPlay = (id) => {
    setVideoPlaying(prev => ({ ...prev, [id]: true }));
    setPlaybackStarted(prev => ({ ...prev, [id]: true }));
  };

  const onVideoPause = (e, id) => {
    if (!e.target.seeking) {
      setVideoPlaying(prev => ({ ...prev, [id]: false }));
    }
  };

  const onEnded = (id) => {
    setVideoPlaying(prev => ({ ...prev, [id]: false }));
    setVideoEnded(prev => ({ ...prev, [id]: true }));
  };

  const onTimeUpdate = (id, e) => {
    const currentTime = e.target.currentTime;
    setVideoProgress(prev => ({ ...prev, [id]: currentTime }));

    if (currentTime - (lastTime.current[id] || 0) > 1) {
      e.target.currentTime = lastTime.current[id] || 0;
    } else {
      lastTime.current[id] = currentTime;
    }
  };

  const onSeeking = (e, id) => {
    const currentTime = e.target.currentTime;
    if (currentTime > (lastTime.current[id] || 0)) {
      e.target.currentTime = lastTime.current[id] || 0;
    }
  };

  const startPlayback = (id) => {
    const video = videoRefs.current[id];
    if (video) {
      video.play().catch(err => console.error("Erreur lecture:", err));
      setPlaybackStarted(prev => ({ ...prev, [id]: true }));
    }
  };

  const toggleMute = (id) => {
    const video = videoRefs.current[id];
    if (video) {
      video.muted = !video.muted;
      setVideoMuted(prev => ({ ...prev, [id]: video.muted }));
    }
  };

  const handleCommentChange = (id, val) => {
    setCommentText(prev => ({ ...prev, [id]: val }));
  };

  const handleCommentSubmit = async (e, id) => {
    e.preventDefault();
    if (!commentText[id]) return;
    setCommentSending(prev => ({ ...prev, [id]: true }));
    try {
      await api.post(`/promotions/${id}/comment`, { commentaire: commentText[id] });
      setCommentText(prev => ({ ...prev, [id]: '' }));
      // Feedback success?
    } catch (err) {
      console.error("Erreur commentaire:", err);
    } finally {
      setCommentSending(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleLogout = () => {
    try {
      if (videoRefs.current) {
        for (const key in videoRefs.current) {
          const v = videoRefs.current[key];
          if (v) { v.pause(); v.src = ""; }
        }
      }
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (socketRef.current && userInfo && userInfo.id) {
        try {
          socketRef.current.emit('leave-user-room', userInfo.id);
          socketRef.current.disconnect();
        } catch (e) { console.warn('Erreur cleanup socket:', e); }
        socketRef.current = null;
      }
      localStorage.clear();
      navigate('/auth/login-user');
    } catch (error) {
      console.error('Erreur handleLogout:', error);
      localStorage.clear();
      if (socketRef.current) { try { socketRef.current.disconnect(); } catch (e) { } socketRef.current = null; }
      navigate('/auth/login-user');
    }
  };

  const mainVideo = promotions.length > 0 ? promotions[0] : null;
  const recommendedVideos = promotions.slice(1);

  return (
    <>
      <UserNavbar
        handleLogout={handleLogout}
        showFilters={true}
        filter={filter}
        setFilter={setFilter}
        theme={theme}
        toggleTheme={toggleTheme}
        points={points}
      />
      <Container fluid className="user-view-container">
        {loading && <div className="text-center w-100"><Spinner color="primary" style={{ width: '3rem', height: '3rem' }} /></div>}
        {error && <Alert color="danger" className="text-center w-100">{error}</Alert>}

        {!loading && !error && (
          <Row>
            <Col lg="8" className="main-content-col">
              {mainVideo ? (
                <>
                  <div className="video-player-main mb-3" style={{ position: 'relative' }}>
                    <video
                      key={mainVideo.id}
                      ref={el => videoRefs.current[mainVideo.id] = el}
                      controls={false}
                      width="100%"
                      poster={getMediaUrl(mainVideo.thumbnail_url)}
                      className="main-video"
                      onPlay={() => onVideoPlay(mainVideo.id)}
                      onPause={(e) => onVideoPause(e, mainVideo.id)}
                      onEnded={() => onEnded(mainVideo.id)}
                      onTimeUpdate={(e) => onTimeUpdate(mainVideo.id, e)}
                      onLoadedData={() => setVideoLoaded(prev => ({ ...prev, [mainVideo.id]: true }))}
                      muted={videoMuted[mainVideo.id] ?? true}
                      onClick={() => startPlayback(mainVideo.id)}
                      onSeeking={(e) => onSeeking(e, mainVideo.id)}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <source src={getMediaUrl(mainVideo.url_video)} type={'video/mp4'} />
                      Votre navigateur ne supporte pas la lecture de vidéos.
                    </video>

                    {!playbackStarted[mainVideo.id] && !videoPlaying[mainVideo.id] && (
                      <div
                        className="video-overlay play-button-overlay"
                        onClick={() => startPlayback(mainVideo.id)}
                        style={{ zIndex: 40, pointerEvents: 'auto' }}
                      >
                        <i className="fas fa-play fa-3x"></i>
                      </div>
                    )}

                    {videoPlaying[mainVideo.id] && (
                      <>
                        <Button color="light" className="mute-toggle-btn" onClick={() => toggleMute(mainVideo.id)}>
                          <i className={`fas ${videoMuted[mainVideo.id] ?? true ? 'fa-volume-mute' : 'fa-volume-up'}`} />
                        </Button>
                        <div className="progress-bar-container">
                          <div className="progress-bar-inner" style={{ width: `${(videoProgress[mainVideo.id] / (videoRefs.current[mainVideo.id]?.duration || 1)) * 100}%` }} />
                        </div>
                      </>
                    )}

                    {videoEnded[mainVideo.id] && (
                      <div className="video-overlay interaction-overlay" style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)', padding: '12px',
                        display: 'flex', justifyContent: 'center', gap: '12px', zIndex: 20
                      }}>
                        {!interactionState[mainVideo.id]?.liked ? (
                          <Button color="primary" className="interaction-btn" onClick={() => handleInteraction(mainVideo.id, 'like')}>
                            <i className="fas fa-thumbs-up mr-2" /> Liker cette vidéo
                          </Button>
                        ) : (
                          <Button color="success" className="interaction-btn" onClick={() => openShareModal(mainVideo)}>
                            <i className="fas fa-share mr-2" /> Partager maintenant
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <Button color="primary" block className="earn-button">
                    Regarder pour Gagner +{mainVideo.remuneration_pack || '...'} XOF
                  </Button>

                  <div className="comment-section mt-4">
                    <Form onSubmit={(e) => handleCommentSubmit(e, mainVideo.id)}>
                      <Row>
                        <Col>
                          <Input
                            type="textarea" placeholder="Ajouter un commentaire..." rows="1"
                            value={commentText[mainVideo.id] || ''}
                            onChange={(e) => handleCommentChange(mainVideo.id, e.target.value)}
                          />
                        </Col>
                        <Col xs="auto">
                          <Button color="primary" type="submit" disabled={commentSending[mainVideo.id]}>
                            {commentSending[mainVideo.id] ? <Spinner size="sm" /> : 'Envoyer'}
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </div>

                  <hr />

                  <div className="recommended-videos mt-4">
                    <h5>Vidéos Recommandées</h5>
                    <Row>
                      {recommendedVideos.map(promo => (
                        <Col key={promo.id} xs="6" md="4" lg="3">
                          <Card className="recommended-video-card" onClick={() => swapToPromo(promo.id)}>
                            <img src={getMediaUrl(promo.thumbnail_url)} alt={promo.titre} className="img-fluid" />
                            <CardBody className="p-2">
                              <h6 className="mb-1">{promo.titre}</h6>
                              <p className="text-muted small mb-0">{promo.remuneration_pack} XOF</p>
                            </CardBody>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                </>
              ) : (
                <div className="text-center mt-5">
                  <Card className="shadow-lg bg-secondary text-center p-5">
                    <h4>C'est tout pour le moment !</h4>
                    <p className="text-muted">Il n'y a plus de promotions disponibles. Revenez plus tard !</p>
                  </Card>
                </div>
              )}
            </Col>

            <Col lg="4" className="right-sidebar-col">
              <Card className="p-3 shadow-sm mb-4">
                <p className="text-muted mb-1">Mes Gains Actuels</p>
                <h1 className="display-4 font-weight-bold my-0">
                  {compactInteger(earnings.total)}
                  <span className="h4 font-weight-normal"> XOF</span>
                </h1>
                <div className="progress-info my-2">
                  <small>Prochain Palier : {compactValue(5, 1, 4)} XOF</small>
                </div>
                <Button color="primary" block onClick={() => setWithdrawModalOpen(true)} disabled={Number(earnings.total || 0) <= 0}>
                  Retirer mes gains
                </Button>
              </Card>

              <Card className="p-3 shadow-sm">
                <h5>Historique Récent</h5>
                <div className="history-list">
                  {withdrawHistory.length > 0 ? withdrawHistory.slice(0, 5).map((item, index) => (
                    <div key={index} className="history-item">
                      <p className="mb-0 small">
                        Retrait de <strong>{compactInteger(item.montant)} XOF</strong>
                        <span className={`badge ml-2 badge-${item.statut === 'traite' ? 'success' : item.statut === 'rejete' ? 'danger' : 'warning'}`}>
                          {item.statut}
                        </span>
                      </p>
                      <p className="text-muted" style={{ fontSize: '0.7rem' }}>{new Date(item.date).toLocaleDateString()}</p>
                    </div>
                  )) : (
                    <p className="text-muted small">Aucun retrait récent.</p>
                  )}
                </div>
                <Button color="warning" block className="mt-3">
                  Invitez vos amis et gagnez gros !
                </Button>
              </Card>
            </Col>
          </Row>
        )}
      </Container>

      <Modal isOpen={withdrawModalOpen} toggle={() => setWithdrawModalOpen(false)}>
        <ModalHeader toggle={() => setWithdrawModalOpen(false)}>Demander un retrait</ModalHeader>
        <ModalBody>
          <div className="text-center mb-4">
            <p className="text-muted mb-0">Solde disponible</p>
            <h4>{compactInteger(earnings.total)} XOF</h4>
          </div>
          <FormGroup>
            <Label for="withdrawAmount">Montant à retirer</Label>
            <Input id="withdrawAmount" type="number" placeholder="Ex: 200" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} max={earnings.total} min="1" />
          </FormGroup>
          <FormGroup>
            <Label>Opérateur mobile money</Label>
            <SelectInput type="select" value={operator} onChange={(e) => setOperator(e.target.value)}>
              <option value="orange">Orange Money</option>
              <option value="mtn">MTN Mobile Money</option>
              <option value="wave">Wave</option>
              <option value="moov">Moov Money</option>
            </SelectInput>
          </FormGroup>
          <FormGroup>
            <Label>Numéro de téléphone</Label>
            <Input type="tel" placeholder="Ex: 0701020304" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          </FormGroup>
          {withdrawError && <Alert color="danger" className="mt-3">{withdrawError}</Alert>}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setWithdrawModalOpen(false)}>Annuler</Button>
          <Button color="primary" onClick={handleWithdraw} disabled={withdrawing}>
            {withdrawing ? <Spinner size="sm" /> : 'Confirmer la demande'}
          </Button>
        </ModalFooter>
      </Modal>

      {promoToShare && (
        <ShareModal
          isOpen={shareModalOpen}
          toggle={() => setShareModalOpen(false)}
          promotion={promoToShare}
          onShare={() => handleInteraction(promoToShare.id, 'partage')}
        />
      )}

      <QuizModal
        isOpen={quizModalOpen}
        toggle={() => {
          setQuizModalOpen(false);
          window.location.reload();
        }}
        quiz={currentQuiz}
        onSuccess={(points) => {
          setPoints(prev => prev + points);
        }}
      />
    </>
  );
};

export default UserView;
