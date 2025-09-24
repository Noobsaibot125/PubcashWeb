// src/views/UserView.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container, Row, Col, Card, CardBody, Button, Spinner, Form, Input,
  Toast, ToastHeader, ToastBody, Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input as SelectInput, Alert
} from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import api from './../services/api';
import ShareModal from 'components/Share/ShareModal';
import { io } from 'socket.io-client';
import UserNavbar from 'components/Navbars/UserNavbar.js';
import '../assets/css/UserView.css'; 
import '../assets/css/UserViewDark.css';
const UserView = () => {
  // STATES
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
  const [earnings, setEarnings] = useState({ total: 0, per_pack: [] });
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [operator, setOperator] = useState('orange');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [promoToShare, setPromoToShare] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
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
 // 3. AJOUTEZ UNE FONCTION POUR CHANGER LE THÈME
 const toggleTheme = () => {
  const newTheme = theme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  localStorage.setItem('theme', newTheme); // On sauvegarde le choix
};

// 4. UTILISEZ useEffect POUR APPLIQUER LA CLASSE AU BODY
useEffect(() => {
  // On nettoie les classes précédentes et on ajoute la nouvelle
  document.body.classList.remove('light-mode', 'dark-mode');
  document.body.classList.add(`${theme}-mode`);
}, [theme]); // Cet effet se déclenche chaque fois que `theme` change
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
    fetchWithdrawHistory();
    const interval = setInterval(fetchWithdrawHistory, 30000);
    return () => clearInterval(interval);
  }, [fetchEarnings, fetchWithdrawHistory]);

  const handleWithdraw = async () => {
    const amountToWithdraw = Number(withdrawAmount);
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
      await api.post('/promotions/utilisateur/retrait', { amount: amountToWithdraw, operator, phoneNumber });
      setWithdrawSuccess('Votre demande de retrait a été envoyée !');
      fetchEarnings();
      fetchWithdrawHistory();
      setWithdrawModalOpen(false);
      setWithdrawAmount('');
      setTimeout(() => setWithdrawSuccess(false), 8000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Erreur lors du retrait";
      setWithdrawError(errorMessage);
      setTimeout(() => setWithdrawError(null), 5000);
    } finally {
      setWithdrawing(false);
    }
  };

  // ===== FIXED swap function =====
  const swapToPromo = (promoId) => {
    const idx = promotions.findIndex(p => p.id === promoId);
    if (idx <= 0) return; // already main or not found

    // Make a copy and swap first element with the clicked recommended
    const newPromos = promotions.slice();
    const tmp = newPromos[0];
    newPromos[0] = newPromos[idx];
    newPromos[idx] = tmp;

    // update promotions (this will change mainVideo)
    setPromotions(newPromos);

    const oldMainId = tmp.id;
    const newMainId = promoId;

    // reset states for both involved videos (no autoplay)
    setVideoEnded(prev => ({ ...prev, [oldMainId]: false, [newMainId]: false }));
    setPlaybackStarted(prev => ({ ...prev, [oldMainId]: false, [newMainId]: false }));
    setVideoPlaying(prev => ({ ...prev, [oldMainId]: false, [newMainId]: false }));
    setVideoLoaded(prev => ({ ...prev, [newMainId]: false }));

    setActiveVideoId(null);

    // After DOM update, ensure the new <video> is reset (pause, reset time, load)
    // we use a short timeout to wait React -> DOM
    setTimeout(() => {
      const v = videoRefs.current[newMainId];
      if (v) {
        try {
          v.pause();
          v.currentTime = 0;
          // If the <video> element was reused by the browser, load will force it to re-evaluate sources/poster
          if (typeof v.load === 'function') v.load();
        } catch (e) {
          // ignore
        }
      }
    }, 120);
  };
  // ===== end swap fix =====

  const handleInteraction = async (promoId, type) => {
    try {
      await api.post(`/promotions/${promoId}/${type}`);
      setInteractionState(prev => ({ ...prev, [promoId]: { ...prev[promoId], [type === 'like' ? 'liked' : 'shared']: true } }));

      if (type === 'partage') {
        setShareModalOpen(false);
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
    const socket = io('http://31.97.68.170:5000');
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
          socketRef.current.emit('leave-user-room', userInfo.id);
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      } catch (e) {
        console.warn('Erreur lors du cleanup socket:', e);
      }
    };
  }, [fetchPromotions]);

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

  // VIDEO CONTROL LOGIC
  const onVideoPlay = (promoId) => {
    setActiveVideoId(promoId);
    setPlaybackStarted(prev => ({ ...prev, [promoId]: true }));
    setVideoPlaying(prev => ({ ...prev, [promoId]: true }));

    setTimeout(() => {
      const v = videoRefs.current[promoId];
      if (v) {
        try {
          v.controls = false;
          v.style.pointerEvents = 'none';
        } catch (e) {}
      }
    }, 800);
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
    const v = videoRefs.current[promoId];
    if (v) {
      const newMuted = !(videoMuted[promoId] ?? true);
      v.muted = newMuted;
      setVideoMuted(prev => ({ ...prev, [promoId]: newMuted }));
    } else {
      setVideoMuted(prev => ({ ...prev, [promoId]: !(videoMuted[promoId] ?? true) }));
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
    setVideoProgress(prev => ({ ...prev, [promoId]: e.target.currentTime }));
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
    setVideoPlaying(prev => ({ ...prev, [promoId]: false }));
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

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          await api.post('/auth/logout', { token: refreshToken });
        } catch (err) {
          console.warn('API logout failed (continuing):', err?.response?.data || err.message || err);
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
      navigate('/auth/login');
    } catch (error) {
      console.error('Erreur handleLogout:', error);
      localStorage.clear();
      if (socketRef.current) { try { socketRef.current.disconnect(); } catch(e) {} socketRef.current = null; }
      navigate('/auth/login');
    }
  };

  // MAIN / RECOMMENDED split
  const mainVideo = promotions.length > 0 ? promotions[0] : null;
  const recommendedVideos = promotions.slice(1);

  return (
    <>
    {/* 5. PASSEZ LES NOUVELLES PROPS À VOTRE NAVBAR */}
    <UserNavbar 
      handleLogout={handleLogout}
      showFilters={true}
      filter={filter}
      setFilter={setFilter}
      theme={theme}
      toggleTheme={toggleTheme}
    />
      <Container fluid className="user-view-container">
        {loading && <div className="text-center w-100"><Spinner color="primary" style={{ width: '3rem', height: '3rem' }} /></div>}
        {error && <Alert color="danger" className="text-center w-100">{error}</Alert>}
        
        {!loading && !error && !mainVideo && (
          <Row className="justify-content-center">
            <Col xs="12" md="8" className="text-center mt-5">
              <Card className="shadow-lg bg-secondary text-center p-5">
                <h4>C'est tout pour le moment !</h4>
                <p className="text-muted">Il n'y a plus de promotions disponibles. Revenez plus tard !</p>
              </Card>
            </Col>
          </Row>
        )}

        {!loading && !error && mainVideo && (
          <Row>
            {/* MAIN VIDEO COLUMN */}
            <Col lg="8" className="main-content-col">
              <div className="video-player-main mb-3" style={{ position: 'relative' }}>
                {/* <-- IMPORTANT: add key so React remounts the <video> when mainVideo changes */}
                <video
                  key={mainVideo.id}
                  ref={el => videoRefs.current[mainVideo.id] = el}
                  controls={false}
                  width="100%"
                  poster={mainVideo.thumbnail_url}
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
                  <source src={mainVideo.url_video} type={'video/mp4'} />
                  Votre navigateur ne supporte pas la lecture de vidéos.
                </video>

              {/* Play overlay before playback starts */}
{!playbackStarted[mainVideo.id] && !videoPlaying[mainVideo.id] && (
  <div
    className="video-overlay play-button-overlay"
    onClick={() => startPlayback(mainVideo.id)}
    style={{ zIndex: 40, pointerEvents: 'auto' }}
  >
    <i className="fas fa-play fa-3x"></i>
  </div>
)}

                {/* Sound toggle and progress while playing */}
                {videoPlaying[mainVideo.id] && (
                  <>
                    <Button color="light" className="mute-toggle-btn" onClick={() => toggleMute(mainVideo.id)}>
                      <i className={`fas ${videoMuted[mainVideo.id] ?? true ? 'fa-volume-mute' : 'fa-volume-up'}`} />
                    </Button>
                    <div className="progress-bar-container">
                      <div className="progress-bar-inner" style={{ width: `${(videoProgress[mainVideo.id] / (videoRefs.current[mainVideo.id]?.duration || 1)) * 100}%`}} />
                    </div>
                  </>
                )}

                {/* Interaction overlay for MAIN VIDEO when ended */}
                {videoEnded[mainVideo.id] && (
                  <div className="video-overlay interaction-overlay" style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    zIndex: 20
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
                        type="textarea"
                        placeholder="Ajouter un commentaire..."
                        rows="1"
                        value={commentText[mainVideo.id] || ''}
                        onChange={(e) => handleCommentChange(mainVideo.id, e.target.value)}
                      />
                    </Col>
                    <Col xs="auto">
                      <Button color="primary" type="submit" disabled={commentSending[mainVideo.id]}>
                         {commentSending[mainVideo.id] ? <Spinner size="sm"/> : 'Envoyer'}
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
                        <img src={promo.thumbnail_url} alt={promo.titre} className="img-fluid"/>
                        <CardBody className="p-2">
                           <h6 className="mb-1">{promo.titre}</h6>
                           <p className="text-muted small mb-0">{promo.remuneration_pack} XOF</p>
                        </CardBody>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            </Col>

            {/* RIGHT SIDEBAR */}
            <Col lg="4" className="right-sidebar-col">
              <Card className="p-3 shadow-sm mb-4">
                <p className="text-muted mb-1">Mes Gains Actuels</p>
                <h1 className="display-4 font-weight-bold my-0">{Number(earnings.total || 0).toLocaleString()} <span className="h4 font-weight-normal">XOF</span></h1>
                <div className="progress-info my-2">
                    <small>Prochain Palier : 5,000 XOF</small>
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
                        Retrait de <strong>{Number(item.montant).toFixed(0)} XOF</strong>
                        <span className={`badge ml-2 badge-${item.statut === 'traite' ? 'success' : item.statut === 'rejete' ? 'danger' : 'warning'}`}>
                          {item.statut}
                        </span>
                      </p>
                       <p className="text-muted" style={{fontSize: '0.7rem'}}>{new Date(item.date).toLocaleDateString()}</p>
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

      {/* WITHDRAW MODAL */}
      <Modal isOpen={withdrawModalOpen} toggle={() => setWithdrawModalOpen(false)}>
        <ModalHeader toggle={() => setWithdrawModalOpen(false)}>Demander un retrait</ModalHeader>
        <ModalBody>
          <div className="text-center mb-4">
            <p className="text-muted mb-0">Solde disponible</p>
            <h4>{Number(earnings.total || 0).toFixed(2)} XOF</h4>
          </div>
          <FormGroup>
            <Label for="withdrawAmount">Montant à retirer</Label>
            <Input id="withdrawAmount" type="number" placeholder="Ex: 500" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} max={earnings.total} min="1"/>
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

      {/* SHARE MODAL */}
      {promoToShare && (
        <ShareModal
          isOpen={shareModalOpen}
          toggle={() => setShareModalOpen(false)}
          promotion={promoToShare}
          onShare={() => handleInteraction(promoToShare.id, 'partage')}
        />
      )}


    </>
  );
};

export default UserView;
