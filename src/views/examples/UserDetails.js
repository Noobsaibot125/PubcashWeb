import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card, CardHeader, Container, Row, Col, CardBody, Button, Form, FormGroup, Input, Label, Badge, Spinner, Alert
} from "reactstrap";
import api from '../../services/api';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  
  // State pour le formulaire d'édition
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const res = await api.get(`/admin/users/${id}`);
      setUser(res.data);
      setFormData(res.data);
    } catch (err) {
      alert("Erreur chargement utilisateur");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/admin/users/${id}`, {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        contact: formData.contact,
        commune_choisie: formData.commune_choisie,
        points: formData.points,
        solde: formData.remuneration_utilisateur
      });
      setMessage({ type: 'success', text: "Informations mises à jour !" });
      fetchUser();
    } catch (err) {
      setMessage({ type: 'danger', text: "Erreur lors de la mise à jour." });
    }
  };

  const handleBlock = async () => {
    if(!window.confirm(user.est_bloque ? "Débloquer ?" : "Bloquer cet utilisateur ?")) return;
    try {
      await api.put(`/admin/users/${id}/block`, { est_bloque: !user.est_bloque });
      fetchUser(); // Rafraichir
    } catch (err) {
      alert("Erreur");
    }
  };

  if (loading) return <div className="text-center mt-5"><Spinner /></div>;
  if (!user) return <div>Utilisateur introuvable</div>;

  return (
    <>
      <div className="header bg-gradient-info pb-8 pt-5 pt-md-8">
        <Container fluid>
          <div className="header-body">
             <Button color="light" size="sm" onClick={() => navigate(-1)}><i className="fas fa-arrow-left"/> Retour</Button>
             <h1 className="text-white mt-3">Détails Utilisateur : {user.nom_utilisateur}</h1>
          </div>
        </Container>
      </div>

      <Container className="mt--7" fluid>
        {message && <Alert color={message.type} toggle={() => setMessage(null)}>{message.text}</Alert>}
        
        <Row>
          {/* COLONNE GAUCHE : INFO & STATS */}
          <Col xl="4" className="mb-4">
            <Card className="shadow mb-4">
               <CardBody className="text-center">
                  <img 
                    src={user.photo_profil || require("../../assets/img/theme/team-4-800x800.jpg")} 
                    className="rounded-circle shadow" style={{width: 120, height: 120, objectFit: 'cover'}} 
                  />
                  <h3 className="mt-3">{user.nom} {user.prenom}</h3>
                  <p className="text-muted">{user.commune_choisie}</p>
                  
                  <Badge color={user.est_bloque ? 'danger' : 'success'} className="p-2">
                    {user.est_bloque ? "BLOQUÉ" : "ACTIF"}
                  </Badge>

                  <hr />
                  <Button block color={user.est_bloque ? 'success' : 'danger'} onClick={handleBlock}>
                    {user.est_bloque ? "Débloquer l'accès" : "Bloquer l'utilisateur"}
                  </Button>
               </CardBody>
            </Card>

            <Card className="shadow">
                <CardHeader><h4 className="mb-0">Statistiques</h4></CardHeader>
                <CardBody>
                    <div className="d-flex justify-content-between mb-3">
                        <span>Solde Actuel:</span>
                        <span className="font-weight-bold text-success">{user.remuneration_utilisateur} FCFA</span>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                        <span>Points:</span>
                        <span className="font-weight-bold text-primary">{user.points} pts</span>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                        <span>Vidéos vues:</span>
                        <span className="font-weight-bold">{user.stats?.videos_vues || 0}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                        <span>Total Gagné (Hist.):</span>
                        <span className="font-weight-bold">{user.stats?.total_gagne_historique || 0} FCFA</span>
                    </div>
                </CardBody>
            </Card>
          </Col>

          {/* COLONNE DROITE : MODIFICATION */}
          <Col xl="8">
            <Card className="shadow">
              <CardHeader className="bg-transparent border-0">
                <h3 className="mb-0">Modifier les informations</h3>
              </CardHeader>
              <CardBody>
                <Form>
                  <h6 className="heading-small text-muted mb-4">Infos Personnelles</h6>
                  <div className="pl-lg-4">
                    <Row>
                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label">Nom d'utilisateur</label>
                          <Input className="form-control-alternative" value={user.nom_utilisateur} disabled />
                        </FormGroup>
                      </Col>
                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label">Email</label>
                          <Input className="form-control-alternative" 
                            value={formData.email || ''} 
                            onChange={e => setFormData({...formData, email: e.target.value})}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label">Nom</label>
                          <Input className="form-control-alternative" 
                            value={formData.nom || ''} 
                            onChange={e => setFormData({...formData, nom: e.target.value})}
                          />
                        </FormGroup>
                      </Col>
                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label">Prénom</label>
                          <Input className="form-control-alternative" 
                            value={formData.prenom || ''} 
                            onChange={e => setFormData({...formData, prenom: e.target.value})}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                        <Col lg="6">
                            <FormGroup>
                            <label className="form-control-label">Contact</label>
                            <Input className="form-control-alternative" 
                                value={formData.contact || ''} 
                                onChange={e => setFormData({...formData, contact: e.target.value})}
                            />
                            </FormGroup>
                        </Col>
                        <Col lg="6">
                            <FormGroup>
                            <label className="form-control-label">Commune</label>
                            <Input className="form-control-alternative" 
                                value={formData.commune_choisie || ''} 
                                onChange={e => setFormData({...formData, commune_choisie: e.target.value})}
                            />
                            </FormGroup>
                        </Col>
                    </Row>
                  </div>
                  
                  <hr className="my-4" />
                  <h6 className="heading-small text-muted mb-4">Gestion Solde & Points (Admin)</h6>
                  <div className="pl-lg-4">
                     <Row>
                        <Col lg="6">
                            <FormGroup>
                                <label className="form-control-label">Solde (FCFA)</label>
                                <Input type="number" className="form-control-alternative" 
                                    value={formData.remuneration_utilisateur || 0} 
                                    onChange={e => setFormData({...formData, remuneration_utilisateur: e.target.value})}
                                />
                            </FormGroup>
                        </Col>
                        <Col lg="6">
                            <FormGroup>
                                <label className="form-control-label">Points</label>
                                <Input type="number" className="form-control-alternative" 
                                    value={formData.points || 0} 
                                    onChange={e => setFormData({...formData, points: e.target.value})}
                                />
                            </FormGroup>
                        </Col>
                     </Row>
                  </div>

                  <div className="text-right">
                     <Button color="primary" onClick={handleUpdate}>Enregistrer les modifications</Button>
                  </div>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default UserDetails;