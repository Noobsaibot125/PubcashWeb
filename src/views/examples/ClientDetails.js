import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import {
  Card, CardHeader, Container, Row, Col, CardBody, 
  Button, Form, FormGroup, Input, Label, Badge, Spinner, Alert, Modal, ModalHeader, ModalBody, ModalFooter
} from "reactstrap";
import api from '../../services/api';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // États pour les modals
  const [rechargeModal, setRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [premiumModal, setPremiumModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("super_promoteur");

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  const fetchClientDetails = async () => {
    try {
      const res = await api.get(`/admin/client/${id}`);
      setClient(res.data);
    } catch (err) {
      setMessage({ type: 'danger', text: "Impossible de charger le client." });
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    try {
      await api.post(`/admin/client/${id}/recharge`, { amount: parseInt(rechargeAmount) });
      setMessage({ type: 'success', text: "Rechargement effectué avec succès !" });
      setRechargeModal(false);
      setRechargeAmount("");
      fetchClientDetails(); 
    } catch (err) {
      alert("Erreur lors du rechargement");
    }
  };

  const handleActivatePremium = async () => {
    try {
      await api.post(`/admin/client/${id}/subscription`, { planType: selectedPlan });
      setMessage({ type: 'success', text: "Abonnement activé !" });
      setPremiumModal(false);
      fetchClientDetails();
    } catch (err) {
      alert("Erreur activation abonnement");
    }
  };

  const handleToggleBlock = async () => {
    if(!window.confirm(client.est_bloque ? "Débloquer ce client ?" : "Êtes-vous sûr de vouloir BLOQUER ce client ? Il ne pourra plus se connecter.")) return;
    try {
      await api.put(`/admin/client/${id}/block`, { est_bloque: !client.est_bloque });
      setMessage({ type: 'warning', text: client.est_bloque ? "Client débloqué." : "Client bloqué." });
      fetchClientDetails();
    } catch (err) {
      alert("Erreur lors du blocage");
    }
  };

  if (loading) return <Container className="p-5 text-center"><Spinner /></Container>;
  if (!client) return <Container className="p-5">Client introuvable</Container>;

  // Gestion de l'affichage de l'image (URL complète ou placeholder par défaut)
  const profileImage = client.profile_image_url 
    ? client.profile_image_url // Supposons que l'API renvoie déjà l'URL complète ou relative correcte
    : require("../../assets/img/theme/team-4-800x800.jpg"); // Image par défaut si pas de photo

  return (
    <>
      <div className="header bg-gradient-info pb-8 pt-5 pt-md-8">
        <Container fluid>
          <div className="header-body">
             <Button color="light" size="sm" onClick={() => navigate(-1)}>
                <i className="fas fa-arrow-left"/> Retour
             </Button>
             <h1 className="text-white mt-3">Détails du compte</h1>
          </div>
        </Container>
      </div>
      
      <Container className="mt--7" fluid>
        {message.text && <Alert color={message.type} toggle={() => setMessage({type:'', text:''})}>{message.text}</Alert>}
        
        <Row>
          <Col xl="8" className="mb-5">
            <Card className="shadow">
              <CardHeader className="bg-transparent border-0">
                <Row className="align-items-center">
                  <Col xs="8">
                    <h3 className="mb-0">Informations Promoteur</h3>
                  </Col>
                  <Col xs="4" className="text-right">
                    <Badge color={client.est_bloque ? "danger" : "success"} pill className="px-3 py-2">
                        {client.est_bloque ? "COMPTE BLOQUÉ" : "ACTIF"}
                    </Badge>
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                {/* --- SECTION PROFIL AVEC PHOTO --- */}
                <div className="text-center mb-4">
                    <img 
                        alt="Profil" 
                        src={profileImage}
                        className="rounded-circle shadow-lg"
                        style={{ width: "150px", height: "150px", objectFit: "cover", border: "4px solid white" }}
                    />
                    <h3 className="mt-3 mb-0">{client.prenom} {client.nom}</h3>
                    <div className="h5 font-weight-300">
                      <i className="ni location_pin mr-2" />
                      {client.commune}
                    </div>
                </div>
                
                <hr className="my-4" />

                <Row>
                    <Col md="6">
                        <div className="form-group">
                            <label className="form-control-label">Nom d'utilisateur</label>
                            <Input className="form-control-alternative" value={client.nom_utilisateur} disabled />
                        </div>
                    </Col>
                    <Col md="6">
                        <div className="form-group">
                            <label className="form-control-label">Email</label>
                            <Input className="form-control-alternative" value={client.email} disabled />
                        </div>
                    </Col>
                    <Col md="6">
                        <div className="form-group">
                            <label className="form-control-label">Téléphone</label>
                            <Input className="form-control-alternative" value={client.telephone || 'Non renseigné'} disabled />
                        </div>
                    </Col>
                    <Col md="6">
                        <div className="form-group">
                            <label className="form-control-label">Type de Compte</label>
                            <Input className="form-control-alternative" value={client.type_compte === 'entreprise' ? 'Entreprise' : 'Particulier'} disabled />
                        </div>
                    </Col>
                    
                    {client.type_compte === 'entreprise' && (
                        <Col md="12">
                             <div className="form-group">
                                <label className="form-control-label">Nom de l'Entreprise</label>
                                <Input className="form-control-alternative" value={client.nom_entreprise} disabled />
                            </div>
                        </Col>
                    )}
                </Row>

                <hr className="my-4" />
                
                {/* Section Finance & Statut */}
                <h6 className="heading-small text-muted mb-4">Finance & Abonnement</h6>
                <Row>
                    <Col md="6">
                         <Card className="bg-gradient-default border-0">
                            <CardBody>
                                <div className="row">
                                    <div className="col">
                                        <h5 className="card-title text-uppercase text-muted mb-0 text-white">Solde Actuel</h5>
                                        <span className="h2 font-weight-bold mb-0 text-white">{parseFloat(client.solde_recharge || 0).toLocaleString('fr-FR')} FCFA</span>
                                    </div>
                                    <div className="col-auto">
                                        <div className="icon icon-shape bg-white text-dark rounded-circle shadow">
                                            <i className="ni ni-money-coins" />
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                         </Card>
                    </Col>
                    <Col md="6">
                        <Card className={`border-0 ${client.abonnement ? "bg-gradient-info" : "bg-secondary"}`}>
                            <CardBody>
                                <div className="row">
                                    <div className="col">
                                        <h5 className={`card-title text-uppercase mb-0 ${client.abonnement ? "text-white" : "text-muted"}`}>Abonnement</h5>
                                        <span className={`h2 font-weight-bold mb-0 ${client.abonnement ? "text-white" : "text-dark"}`}>
                                            {client.abonnement ? client.abonnement.type_abonnement.replace('_', ' ') : "Standard (Gratuit)"}
                                        </span>
                                    </div>
                                    <div className="col-auto">
                                        <div className="icon icon-shape bg-white text-info rounded-circle shadow">
                                            <i className="ni ni-diamond" />
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                         </Card>
                    </Col>
                </Row>

              </CardBody>
            </Card>
          </Col>

          <Col xl="4">
            <Card className="shadow">
               <CardHeader><h3 className="mb-0">Actions Rapides</h3></CardHeader>
               <CardBody>
                  <Button block color="primary" onClick={() => setRechargeModal(true)} className="mb-3">
                     <i className="fas fa-wallet mr-2"/> Recharger le Compte
                  </Button>
                  <Button block color="warning" onClick={() => setPremiumModal(true)} className="mb-3">
                     <i className="fas fa-star mr-2"/> Activer Premium
                  </Button>
                  <hr/>
                  <Button block color={client.est_bloque ? "success" : "danger"} onClick={handleToggleBlock}>
                     <i className={`fas fa-${client.est_bloque ? "check" : "ban"} mr-2`}/>
                     {client.est_bloque ? "Débloquer l'accès" : "Bloquer l'accès"}
                  </Button>
               </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modal Recharge */}
      <Modal isOpen={rechargeModal} toggle={() => setRechargeModal(!rechargeModal)}>
        <ModalHeader>Recharger le compte</ModalHeader>
        <ModalBody>
            <FormGroup>
                <Label>Montant à ajouter (FCFA)</Label>
                <Input type="number" value={rechargeAmount} onChange={e => setRechargeAmount(e.target.value)} placeholder="Ex: 5000" />
            </FormGroup>
        </ModalBody>
        <ModalFooter>
            <Button color="primary" onClick={handleRecharge}>Valider</Button>
            <Button color="secondary" onClick={() => setRechargeModal(false)}>Annuler</Button>
        </ModalFooter>
      </Modal>

      {/* Modal Premium */}
      <Modal isOpen={premiumModal} toggle={() => setPremiumModal(!premiumModal)}>
        <ModalHeader>Activer Mode Premium</ModalHeader>
        <ModalBody>
            <p className="text-muted">Cela activera un abonnement sans paiement pour ce client.</p>
            <FormGroup>
                <Label>Choisir le plan</Label>
                <Input type="select" value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}>
                    <option value="super_promoteur">Super Promoteur (3 mois)</option>
                    <option value="promoteur_ultra">Promoteur Ultra (6 mois)</option>
                </Input>
            </FormGroup>
        </ModalBody>
        <ModalFooter>
            <Button color="warning" onClick={handleActivatePremium}>Activer</Button>
            <Button color="secondary" onClick={() => setPremiumModal(false)}>Annuler</Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default ClientDetails;