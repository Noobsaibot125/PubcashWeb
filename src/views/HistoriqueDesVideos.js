import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, CardBody, Button, Spinner,
  Input, Form, ListGroup, ListGroupItem, Badge, Collapse
} from 'reactstrap';
import api from './../services/api';
import { useNavigate } from 'react-router-dom';
import UserNavbar from 'components/Navbars/UserNavbar.js';

const HistoriqueDesVideos = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [sending, setSending] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const navigate = useNavigate();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const response = await api.get('/promotions/utilisateur/historique-videos');
      setHistory(response.data || []);
    } catch (err) {
      console.error("Erreur lors du chargement de l'historique:", err);
      // More specific error handling could be added here based on err.response.status
      // For example, if (err.response && err.response.status === 401) navigate('/auth/login');
      setError("Impossible de charger l'historique. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const toggleComments = (id) => {
    setExpandedComments(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleComment = async (e, promoId) => {
    e.preventDefault();
    const texte = commentText[promoId];
    if (!texte || texte.trim() === '') return;
    setSending(prev => ({ ...prev, [promoId]: true }));
    try {
      await api.post(`/promotions/${promoId}/comment`, { commentaire: texte });
      await fetchHistory(); // Refresh history to show new comment
      setCommentText(prev => ({ ...prev, [promoId]: '' }));
    } catch (err) {
      console.error("Erreur lors de l'envoi du commentaire:", err);
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi du commentaire. Veuillez réessayer.');
    } finally {
      setSending(prev => ({ ...prev, [promoId]: false }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { token: refreshToken });
      }
      localStorage.clear();
      navigate('/auth/login');
    } catch (error) {
      console.error('Erreur handleLogout:', error);
      // Even if logout API fails, clear local storage and redirect
      localStorage.clear();
      navigate('/auth/login');
    }
  };

  return (
    <>
      <UserNavbar handleLogout={handleLogout} />
      <Container className="mt-5 pt-4">
        <h2 className="mb-4">Historique des vidéos</h2>

        {loading && <div className="text-center"><Spinner color="primary" /></div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && history.length === 0 && (
          <div className="text-center py-5">
            <i className="fas fa-history fa-3x mb-3 text-muted" />
            <p>Aucune vidéo dans votre historique</p>
            <Button color="primary" onClick={fetchHistory} className="mt-3">
              Recharger l'historique
            </Button>
          </div>
        )}

        <Row>
          {history.map(p => (
            <Col lg="6" key={p.id} className="mb-4">
              <Card className="shadow-sm">
                <div className="position-relative">
                  <video
                    controls
                    width="100%"
                    poster={p.thumbnail_url}
                    style={{ maxHeight: 300, backgroundColor: '#000' }}
                  >
                    <source src={p.url_video} type="video/mp4" />
                    Votre navigateur ne supporte pas la balise vidéo.
                  </video>
                </div>

                <CardBody>
                  <h5>{p.titre}</h5>
                  <p className="text-muted">{p.description}</p>

                  <div className="d-flex justify-content-between mb-3">
                    <Badge color="info" pill>
                      <i className="fas fa-eye mr-1" /> {p.vues || 0} vues
                    </Badge>
                    <Badge color="primary" pill>
                      <i className="fas fa-thumbs-up mr-1" /> {p.likes || 0} likes
                    </Badge>
                    <Badge color="success" pill>
                      <i className="fas fa-share mr-1" /> {p.partages || 0} partages
                    </Badge>
                  </div>

                  <div className="border-top pt-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6>
                        Commentaires
                        <Badge color="secondary" pill className="ml-2">
                          {p.commentaires?.length || 0}
                        </Badge>
                      </h6>

                      {p.commentaires && p.commentaires.length > 0 && (
                        <Button
                          color="link"
                          size="sm"
                          onClick={() => toggleComments(p.id)}
                        >
                          {expandedComments[p.id] ? "Réduire" : "Voir tout"}
                        </Button>
                      )}
                    </div>

                    {p.commentaires && p.commentaires.length > 0 && (
                      <Collapse isOpen={expandedComments[p.id]}>
                        <ListGroup flush>
                          {p.commentaires.map((comment, index) => (
                            <ListGroupItem key={index} className="px-0">
                              <div className="d-flex justify-content-between">
                                <strong>{comment.nom_utilisateur}</strong>
                                <small className="text-muted">
                                  {formatDate(comment.date_commentaire)}
                                </small>
                              </div>
                              <p className="mb-0">{comment.commentaire}</p>
                            </ListGroupItem>
                          ))}
                        </ListGroup>
                      </Collapse>
                    )}

                    <Form onSubmit={(e) => handleComment(e, p.id)} className="mt-3">
                      <Input
                        type="textarea"
                        rows="2"
                        value={commentText[p.id] || ''}
                        onChange={(e) => setCommentText(prev => ({
                          ...prev,
                          [p.id]: e.target.value
                        }))}
                        placeholder="Ajouter un commentaire..."
                        disabled={sending[p.id]}
                      />
                      <Button
                        type="submit"
                        color="primary"
                        size="sm"
                        className="mt-2"
                        disabled={sending[p.id] || !commentText[p.id]?.trim()}
                      >
                        {sending[p.id] ? (
                          <>
                            <Spinner size="sm" /> Envoi...
                          </>
                        ) : (
                          'Envoyer'
                        )}
                      </Button>
                    </Form>
                  </div>
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default HistoriqueDesVideos;