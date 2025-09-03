// src/views/UserView.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container, Row, Col, Card, CardBody, Button, Spinner, Form, Input,
  Toast, ToastHeader, ToastBody, Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input as SelectInput,Alert
} from 'reactstrap';
import api from './../services/api';
import { useNavigate } from 'react-router-dom';

import ShareModal from 'components/Share/ShareModal'; // Adapte le chemin si besoin
import { io } from 'socket.io-client';
const UserView = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState({});
  const [interactionState, setInteractionState] = useState({});
  const [videoEnded, setVideoEnded] = useState({});
  const [commentSending, setCommentSending] = useState({});
  const [commentSuccess, setCommentSuccess] = useState({});
  const [commentError, setCommentError] = useState({});
  const [filter, setFilter] = useState('ma_commune');
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [playbackStarted, setPlaybackStarted] = useState({});
  const [videoPlaying, setVideoPlaying] = useState({});
  const [videoProgress, setVideoProgress] = useState({});
  const [videoMuted, setVideoMuted] = useState({});
  const [videoLoaded, setVideoLoaded] = useState({});
  // États pour le retrait des gains
  const [earnings, setEarnings] = useState({ total: 0, per_pack: [] });
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [operator, setOperator] = useState('orange');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [promoToShare, setPromoToShare] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState(''); 
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const videoRefs = useRef({});
  const lastTime = useRef({});
  const observers = useRef([]);
  const playbackStartedRef = useRef({});
  const videoEndedRef = useRef({});
  const socketRef = useRef(null);
  // Fonction pour ouvrir la modale de partage
  const openShareModal = (promo) => {
    setPromoToShare(promo);
    setShareModalOpen(true);
  };

  useEffect(() => {
    playbackStartedRef.current = playbackStarted;
    videoEndedRef.current = videoEnded;
  }, [playbackStarted, videoEnded]);

  // fetchPromotions
  const fetchPromotions = useCallback(async (currentFilter) => {
    try {
      const res = await api.get(`/promotions?filter=${currentFilter}`);
      const data = res.data || [];

      setPromotions(data);

      // Réinitialiser états vidéos / interactions
      const newInteractionState = {}, newVideoEnded = {}, newPlaybackStarted = {}, newVideoPlaying = {}, newVideoMuted = {}, newVideoLoaded = {};
      data.forEach(promo => {
        newInteractionState[promo.id] = { liked: false, shared: false };
        newVideoEnded[promo.id] = false;
        newPlaybackStarted[promo.id] = false;
        newVideoPlaying[promo.id] = false;
        newVideoLoaded[promo.id] = false;
        newVideoMuted[promo.id] = true; // par défaut muet
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

  useEffect(() => {
    setLoading(true);
    fetchPromotions(filter);
    return () => { observers.current.forEach(o => o.disconnect && o.disconnect()); };
  }, [filter, fetchPromotions]);

  // fetchEarnings
  const fetchEarnings = useCallback(async () => {
    try {
      const res = await api.get('/promotions/utilisateur/gains');
      setEarnings(res.data || { total: 0, per_pack: [] });
    } catch (err) {
      console.error('fetchEarnings error', err);
    }
  }, []);

  // fetchWithdrawHistory
  const fetchWithdrawHistory = useCallback(async () => {
    try {
      const response = await api.get('/promotions/utilisateur/historique-retraits');
      setWithdrawHistory(response.data || []);
    } catch (error) {
      console.error('Erreur fetchWithdrawHistory:', error);
    }
  }, [refreshTrigger]);
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWithdrawHistory();
    }, 30000); // Rafraîchir toutes les 30 secondes
  
    return () => clearInterval(interval);
  }, [fetchWithdrawHistory]);
  useEffect(() => {
    if (!loading && !error) {
      fetchEarnings();
      fetchWithdrawHistory();
    }
  }, [loading, error, fetchEarnings, fetchWithdrawHistory]);

  // handleWithdraw
  const handleWithdraw = async () => {
    const amountToWithdraw = Number(withdrawAmount);

    // Validation
    if (!amountToWithdraw || amountToWithdraw <= 0) {
      setWithdrawError('Veuillez entrer un montant valide.');
      return;
    }
    if (amountToWithdraw > earnings.total) {
      setWithdrawError('Le montant ne peut pas dépasser vos gains totaux.');
      return;
    }
    if (!operator || !phoneNumber) {
      setWithdrawError('Veuillez sélectionner un opérateur et entrer votre numéro');
      return;
    }
    
    setWithdrawing(true);
    setWithdrawError(null);
    setWithdrawSuccess(false);

    try {
      // On envoie le montant spécifié
      await api.post('/promotions/utilisateur/retrait', {
        amount: amountToWithdraw, 
        operator, 
        phoneNumber
      });

      setWithdrawSuccess('Votre demande de retrait a été envoyée !');
      
      // Mettre à jour les gains locaux
      fetchEarnings(); 
      fetchWithdrawHistory();
      
      setWithdrawModalOpen(false);
      setWithdrawAmount(''); // Réinitialiser le champ
      
      setTimeout(() => setWithdrawSuccess(false), 8000);

    } catch (err) {
      const errorMessage = err.response?.data?.message || "Erreur lors du retrait";
      setWithdrawError(errorMessage);
      setTimeout(() => setWithdrawError(null), 5000);
    } finally {
      setWithdrawing(false);
    }
  };

  // handleInteraction
  const handleInteraction = async (promoId, type) => {
    try {
      await api.post(`/promotions/${promoId}/${type}`);
      setInteractionState(prev => ({ ...prev, [promoId]: { ...prev[promoId], [type === 'like' ? 'liked' : 'shared']: true } }));
      if (type === 'partage') {
        setTimeout(() => setPromotions(current => current.filter(p => p.id !== promoId)), 800);
      }
      await fetchEarnings();
    } catch (error) {
      console.error(`Erreur lors de l'action '${type}':`, error);
    }
  };
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || !userInfo.id) return;
  
    const socket = io('http://localhost:5000');
    socketRef.current = socket;
  
    socket.on('connect', () => {
      socket.emit('user_online', userInfo.id);
    });
    // Rejoindre la room utilisateur
    socket.emit('join-user-room', userInfo.id);
    
    // Écouter les mises à jour des retraits
    socket.on('withdrawal-updated', (data) => {
      setWithdrawHistory(prevHistory => 
        prevHistory.map(item => 
          item.id === data.requestId ? { ...item, statut: data.status } : item
        )
      );
      
      // Afficher une notification
      setWithdrawSuccess(`Votre demande de retrait a été ${data.status === 'traite' ? 'traitée' : 'rejetée'}`);
      setTimeout(() => setWithdrawSuccess(false), 5000);
    });
    
    return () => {
      // lorsqu'on démonte la vue, prévenir le serveur puis déconnecter
      try {
        if (socketRef.current) {
          socketRef.current.emit('leave-user-room', userInfo.id);
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      } catch (e) {
        console.warn('Erreur lors du cleanup socket:', e);
      }
    };
  }, []);
  // handleCommentSubmit
  const handleCommentSubmit = async (e, promoId) => {
    e.preventDefault();
    const commentaire = commentText[promoId];
    if (!commentaire || commentaire.trim() === '') return;

    setCommentSending(prev => ({ ...prev, [promoId]: true }));
    setCommentError(prev => ({ ...prev, [promoId]: null }));
    try {
      await api.post(`/promotions/${promoId}/comment`, { commentaire });
      setCommentText(prev => ({ ...prev, [promoId]: '' }));
      setCommentSuccess(prev => ({ ...prev, [promoId]: true }));
      setTimeout(() => setCommentSuccess(prev => ({ ...prev, [promoId]: false })), 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'envoi';
      console.error("Erreur lors de l'envoi du commentaire:", error);
      setCommentError(prev => ({ ...prev, [promoId]: errorMessage }));
      setTimeout(() => setCommentError(prev => ({ ...prev, [promoId]: null })), 4000);
    } finally {
      setCommentSending(prev => ({ ...prev, [promoId]: false }));
    }
  };

  const handleCommentChange = (promoId, text) => {
    setCommentText(prev => ({ ...prev, [promoId]: text }));
  };

  const onVideoPlay = (promoId) => {
    setActiveVideoId(promoId);
    setPlaybackStarted(prev => ({ ...prev, [promoId]: true }));
    setVideoPlaying(prev => ({ ...prev, [promoId]: true }));

    // Désactiver les contrôles après 1 seconde
    setTimeout(() => {
      const v = videoRefs.current[promoId];
      if (v) {
        v.controls = false;
        v.style.pointerEvents = 'none';
      }
    }, 1000);
  };

  const startPlayback = (promoId) => {
    const v = videoRefs.current[promoId];
    if (v) {
      v.play().catch(() => {});
      setVideoPlaying(prev => ({ ...prev, [promoId]: true }));
      onVideoPlay(promoId);
    }
  };

  const toggleMute = (promoId) => {
    setVideoMuted(prev => ({
      ...prev,
      [promoId]: !prev[promoId]
    }));

    const v = videoRefs.current[promoId];
    // IMPORTANT: use nullish coalescing when reading (to avoid always-true bug)
    if (v) {
      v.muted = !(videoMuted[promoId] ?? true);
    }
  };

  const onVideoPause = (e, promoId) => {
    const ended = videoEndedRef.current[promoId];
    const started = playbackStartedRef.current[promoId];
    if (!ended && started) {
      setTimeout(() => {
        const v = videoRefs.current[promoId];
        if (v && v.paused && !videoEndedRef.current[promoId]) {
          v.play().catch(() => {});
        }
      }, 50);
    } else {
      setActiveVideoId(null);
    }
  };

  const onTimeUpdate = (promoId, e) => {
    lastTime.current[promoId] = e.target.currentTime;
    setVideoProgress(prev => ({
      ...prev,
      [promoId]: e.target.currentTime
    }));
  };

  const onSeeking = (e, promoId) => {
    const ended = videoEndedRef.current[promoId];
    const started = playbackStartedRef.current[promoId];
    if (!ended && started) {
      const v = videoRefs.current[promoId];
      if (v) {
        v.currentTime = Math.max(0, lastTime.current[promoId] || 0);
      }
    }
  };

  const onEnded = (promoId) => {
    setVideoEnded(prev => ({ ...prev, [promoId]: true }));
    setActiveVideoId(null);
  };

  useEffect(() => {
    const handler = (e) => {
      const active = document.activeElement;
      if (active && active.tagName === 'VIDEO') {
        if ([32, 37, 39].includes(e.keyCode)) {
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleMouseEnter = (promoId) => {
    const v = videoRefs.current[promoId];
    if (v && !videoEnded[promoId] && videoPlaying[promoId]) {
      v.play().catch(() => {});
    }
  };

  // Nouvelle fonction de déconnexion
  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      // 1) Appeler l'endpoint logout pour que le serveur efface le refresh_token et set est_en_ligne = 0
      if (refreshToken) {
        try {
          await api.post('/auth/logout', { token: refreshToken });
        } catch (err) {
          console.warn('API logout failed (continuing):', err?.response?.data || err.message || err);
          // On continue quand même le nettoyage côté client
        }
      }
  
      // 2) Informer le socket (leave) puis déconnecter
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (socketRef.current && userInfo && userInfo.id) {
        try {
          socketRef.current.emit('leave-user-room', userInfo.id);
        } catch (e) {
          console.warn('Erreur en émettant leave-user-room:', e);
        }
        try {
          socketRef.current.disconnect();
        } catch (e) {
          console.warn('Erreur lors de socket.disconnect():', e);
        }
        socketRef.current = null;
      }
  
      // 3) Nettoyage local
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('refreshToken');
  
      // 4) Redirection
      navigate('/auth/login');
    } catch (error) {
      console.error('Erreur handleLogout:', error);
      // En cas d'erreur, forcer le nettoyage et la redirection
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('refreshToken');
      if (socketRef.current) {
        try { 
          socketRef.current.disconnect(); 
        } catch(e) {}
        socketRef.current = null;
      }
      navigate('/auth/login');
    }
  };
  

  return (
    <>
   <Container className="mt-4" fluid style={{ paddingTop: 20 /* ajuster si besoin */ }}>
        {/* ---------- Header / Barre de filtres (nouvelle mise en page) ---------- */}
        <Row className="align-items-center mb-4">
          <Col md="6" xs="12">
            <h1 className="mb-0">Vidéos disponibles</h1>
            <p className="text-muted small mb-0">Regarde, aime et partage pour gagner.</p>
          </Col>

          <Col md="6" xs="12" className="text-md-right text-center mt-3 mt-md-0">
            <div className="d-inline-flex align-items-center filter-bar">
              <Button
                color={filter === 'ma_commune' ? 'primary' : 'outline-secondary'}
                onClick={() => setFilter('ma_commune')}
                className="filter-btn"
                size="sm"
              >
                Ma commune
              </Button>
              <Button
                color={filter === 'toutes' ? 'primary' : 'outline-secondary'}
                onClick={() => setFilter('toutes')}
                className="filter-btn ml-2"
                size="sm"
              >
                Toutes les communes
              </Button>

              {/* (Optionnel) bouton Déconnexion à droite sur grand écran */}
              <Button
                color="danger"
                onClick={handleLogout}
                className="ml-3 d-none d-md-inline-block"
                size="sm"
              >
                <i className="fas fa-sign-out-alt mr-2" /> Déconnexion
              </Button>
            </div>
          </Col>
        </Row>

        {/* Bouton déconnexion visible sur mobile en bas du header */}
        <Row className="d-md-none mb-3">
          <Col xs="12" className="text-center">
            <Button color="danger" size="sm" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt mr-2" /> Déconnexion
            </Button>
          </Col>
        </Row>

        {/* ---------- Fin header ---------- */}

        {loading && <div className="text-center"><Spinner color="primary" /></div>}
        {error && <p className="text-center text-warning">{error}</p>}
        {!loading && !error && promotions.length === 0 && (
          <Card className="shadow-lg bg-secondary text-center p-5">
            <h4>C'est tout pour le moment !</h4>
            <p className="text-muted">Il n'y a plus de promotions disponibles. Revenez plus tard !</p>
          </Card>
        )}

        <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 1060 }}>
          {promotions.map(promo => (
            <React.Fragment key={promo.id}>
              {commentSuccess[promo.id] && (
                <Toast className="mb-2">
                  <ToastHeader>
                    Commentaire envoyé
                  </ToastHeader>
                  <ToastBody>
                    Ton commentaire pour « {promo.titre} » a bien été envoyé.
                  </ToastBody>
                </Toast>
              )}
              {commentError[promo.id] && (
                <Toast className="mb-2">
                  <ToastHeader>
                    Erreur
                  </ToastHeader>
                  <ToastBody>
                    {commentError[promo.id]}
                  </ToastBody>
                </Toast>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Section des gains et retrait */}
        <div style={{ position: 'fixed', top: 130, right: 20, zIndex: 1070, width: 220 }}>
          <Card className="p-2 shadow-sm">
            <div className="text-right">
              <small className="text-muted">Mes gains</small>
              <h5 className="mb-0">{Number(earnings.total || 0).toFixed(2)} XOF</h5>
            </div>
            <hr />
            <div style={{ maxHeight: 160, overflowY: 'auto' }}>
              {earnings.per_pack && earnings.per_pack.length > 0 ? (
                earnings.per_pack.map(p => (
                  <div key={p.pack_id} style={{ fontSize: 12, marginBottom: 6 }}>
                    <strong>{p.nom_pack || 'Pack inconnu'}</strong>
                    <div>{Number(p.total_gagne).toFixed(2)} XOF</div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12 }}>Aucun gain pour l'instant</div>
              )}
            </div>
            <Button
              color="success"
              size="sm"
              block
              onClick={() => setWithdrawModalOpen(true)}
              disabled={Number(earnings.total || 0) <= 0}
            >
              Retirer mes gains
            </Button>
            <Button
              color="link"
              size="sm"
              block
              onClick={() => setShowHistory(!showHistory)}
              className="mt-2"
            >
              {showHistory ? 'Masquer l\'historique' : 'Voir l\'historique'}
            </Button>
          </Card>

          {showHistory && withdrawHistory.length > 0 && (
            <Card className="mt-2 p-2 shadow-sm">
              <h6>Historique des retraits</h6>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {withdrawHistory.map((item, index) => (
                  <div key={index} className="mb-2 p-2 border-bottom">
                    <div className="d-flex justify-content-between">
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                      <strong>{Number(item.montant).toFixed(2)} XOF</strong>
                    </div>
                    <div className="small text-muted">
                      {item.operator} - {item.phone}
                    </div>
                    <div className={`badge ${item.statut === 'traite' ? 'badge-success' : item.statut === 'rejete' ? 'badge-danger' : 'badge-warning'}`}>
  {item.statut === 'traite' ? 'Traité' : item.statut === 'rejete' ? 'Rejeté' : 'En attente'}
</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {withdrawSuccess && (
            <Toast className="mt-2">
              <ToastHeader icon="success">Succès</ToastHeader>
              <ToastBody>{withdrawSuccess}</ToastBody>
            </Toast>
          )}

          {withdrawError && (
            <Toast className="mt-2">
              <ToastHeader icon="danger">Erreur</ToastHeader>
              <ToastBody>{withdrawError}</ToastBody>
            </Toast>
          )}
        </div>

        {!loading && !error && promotions.length > 0 && (
          <Row className="justify-content-center">
            {promotions.map(promo => {
              const interactions = interactionState[promo.id] || {};
              const isEnded = videoEnded[promo.id] || false;
              const isActive = activeVideoId === promo.id;
              const showCustomPlayButton =
                !playbackStarted[promo.id] &&
                !isEnded &&
                videoLoaded[promo.id] &&
                videoRefs.current[promo.id]?.paused;

              return (
                <Col lg="8" key={promo.id} className="mb-5">
                  <Card className="shadow-lg">
                    <div
                      id={`player-wrapper-${promo.id}`}
                      className="player-wrapper"
                      style={{
                        borderRadius: '0.375rem 0.375rem 0 0',
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: 'black'
                      }}
                      onMouseEnter={() => handleMouseEnter(promo.id)}
                    >
                      {showCustomPlayButton && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 10
                        }}>
                          <Button
                            color="primary"
                            style={{
                              borderRadius: '50%',
                              width: '70px',
                              height: '70px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              border: 'none'
                            }}
                            onClick={() => startPlayback(promo.id)}
                          >
                            <i className="fas fa-play fa-2x" style={{ color: '#000' }} />
                          </Button>
                        </div>
                      )}

                      <video
                        ref={el => videoRefs.current[promo.id] = el}
                        controls={false}
                        width="100%"
                        poster={promo.thumbnail_url}
                        style={{
                          display: 'block',
                          maxHeight: '500px',
                          width: '100%',
                          opacity: videoPlaying[promo.id] ? 1 : 0.7
                        }}
                        controlsList="nodownload noremoteplayback"
                        onPlay={() => onVideoPlay(promo.id)}
                        onPause={(e) => onVideoPause(e, promo.id)}
                        onEnded={() => onEnded(promo.id)}
                        onError={(e) => console.error('Erreur de chargement vidéo:', e.target.error, 'pour URL:', promo.url_video)}
                        onTimeUpdate={(e) => onTimeUpdate(promo.id, e)}
                        onSeeking={(e) => onSeeking(e, promo.id)}
                        onLoadedData={() => setVideoLoaded(prev => ({ ...prev, [promo.id]: true }))}
                        onContextMenu={(e) => e.preventDefault()}
                        muted={videoMuted[promo.id] ?? true}
                        tabIndex={-1}
                      >
                        <source
                          src={promo.url_video}
                          type={'video/mp4'}
                        />
                        Votre navigateur ne supporte pas la lecture de vidéos.
                      </video>

                      {/* Bouton pour contrôler le son */}
                      {videoPlaying[promo.id] && (
                        <Button
                          color="light"
                          style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            zIndex: 10,
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => toggleMute(promo.id)}
                        >
                          <i className={`fas ${videoMuted[promo.id] ? 'fa-volume-mute' : 'fa-volume-up'}`} />
                        </Button>
                      )}

                      {/* Barre de progression personnalisée */}
                      {videoPlaying[promo.id] && !isEnded && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          backgroundColor: 'rgba(255,255,255,0.3)',
                          zIndex: 5
                        }}>
                          <div style={{
                            width: `${(videoProgress[promo.id] / (videoRefs.current[promo.id]?.duration || 1)) * 100}%`,
                            height: '100%',
                            backgroundColor: '#007bff'
                          }} />
                        </div>
                      )}

                      {/* Overlay pour boutons d'interaction - seulement après la fin */}
                      {isEnded && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          padding: '10px',
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '10px',
                          transition: 'opacity 0.3s ease'
                        }}>
                          {!interactions.liked ? (
                            <Button
                              color="primary"
                              className="interaction-btn"
                              onClick={() => handleInteraction(promo.id, 'like')}
                            >
                              <i className="fas fa-thumbs-up mr-2" /> Liker cette vidéo
                            </Button>
                          ) : (
                            <Button
                              color="success"
                              className="interaction-btn"
                              onClick={() => openShareModal(promo)}
                            >
                              <i className="fas fa-share mr-2" /> Partager maintenant
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <CardBody>
                      <h4>{promo.titre}</h4>
                      <p>{promo.description}</p>

                      {interactionState[promo.id] && interactionState[promo.id].shared && (
                        <div className="alert alert-success mt-3">
                          <i className="fas fa-check-circle mr-2"></i>
                          Merci d'avoir partagé cette vidéo ! Elle disparaîtra bientôt.
                        </div>
                      )}

                      <hr />
 {/* 4. AFFICHER LE PRIX DU PACK */}
 {promo.remuneration_pack && (
                        <Alert color="info" className="text-center small py-2">
                          <i className="fas fa-coins mr-2"></i>
                          Cette promotion vous rapporte <strong>{promo.remuneration_pack} FCFA</strong>.
                        </Alert>
                      )}
                      <Form onSubmit={(e) => handleCommentSubmit(e, promo.id)}>
                        <Input
                          type="textarea"
                          placeholder="Ajouter un commentaire..."
                          rows="2"
                          value={commentText[promo.id] || ''}
                          onChange={(e) => handleCommentChange(promo.id, e.target.value)}
                          disabled={interactionState[promo.id] && interactionState[promo.id].shared}
                        />
                        <Button
                          color="default"
                          size="sm"
                          className="mt-2"
                          type="submit"
                          disabled={commentSending[promo.id] || (interactionState[promo.id] && interactionState[promo.id].shared)}
                        >
                          {commentSending[promo.id] ?
                            <><Spinner size="sm" /> Envoi...</> :
                            'Envoyer le commentaire'
                          }
                        </Button>
                      </Form>
                    </CardBody>
                  </Card>
                </Col>
              );
            })}

            {/* Share modal */}
            {promoToShare && (
              <ShareModal
                isOpen={shareModalOpen}
                toggle={() => setShareModalOpen(false)}
                promotion={promoToShare}
                onShare={() => handleInteraction(promoToShare.id, 'partage')}
              />
            )}
          </Row>
        )}
      </Container>

      {/* 2. MODIFIER LA MODALE DE RETRAIT */}
      <Modal isOpen={withdrawModalOpen} toggle={() => setWithdrawModalOpen(false)}>
        <ModalHeader toggle={() => setWithdrawModalOpen(false)}>
          Demander un retrait
        </ModalHeader>
        <ModalBody>
          <div className="text-center mb-4">
            <p className="text-muted mb-0">Solde disponible</p>
            <h4>{Number(earnings.total || 0).toFixed(2)} XOF</h4>
          </div>

          <FormGroup>
            <Label for="withdrawAmount">Montant à retirer</Label>
            <Input
              id="withdrawAmount"
              type="number"
              placeholder="Ex: 500"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              max={earnings.total} // Ajoute une validation HTML5
              min="1"
            />
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

          {withdrawError && (
            <div className="alert alert-danger mt-3">
              {withdrawError}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setWithdrawModalOpen(false)}>
            Annuler
          </Button>
          <Button color="primary" onClick={handleWithdraw} disabled={withdrawing}>
            {withdrawing ? <Spinner size="sm" /> : 'Confirmer la demande'}
          </Button>
        </ModalFooter>
      </Modal>

      <style>
        {`
          /* Filter bar */
          .filter-bar { gap: 8px; }
          .filter-btn { min-width: 120px; }
          .filter-btn.active, .filter-btn:focus { box-shadow: 0 4px 12px rgba(0,123,255,0.15); }

          /* Interaction buttons */
          .interaction-btn {
            padding: 8px 20px;
            font-weight: bold;
            border-radius: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .interaction-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }

          .player-wrapper { transition: all 0.3s ease; }
          .player-wrapper:hover { box-shadow: 0 5px 15px rgba(0,0,0,0.3); }

          video {
            border-radius: 8px;
            overflow: hidden;
            transition: transform 0.3s;
          }
          video:focus { outline: none; }

          /* Désactiver les contrôles vidéo */
          video::-webkit-media-controls { display: none !important; }
          video::-webkit-media-controls-play-button { display: none !important; }
          video::-webkit-media-controls-start-playback-button { display: none !important; }
        `}
      </style>
    </>
  );
};

export default UserView;
