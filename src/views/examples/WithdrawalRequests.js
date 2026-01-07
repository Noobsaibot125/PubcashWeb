import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, CardHeader, CardBody, Table, Button, Badge,
  Row, Col, FormGroup, Input, Label, Spinner, Container, Form,
  Pagination, PaginationItem, PaginationLink,
  Modal, ModalHeader, ModalBody, ModalFooter
} from 'reactstrap';
import api from '../../services/api';

const WithdrawalRequests = () => {
  // --- States existants ---
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('en_attente');
  const [processing, setProcessing] = useState({});

  // --- Nouveaux States pour le SuperAdmin ---
  const [currentUser, setCurrentUser] = useState(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargePhone, setRechargePhone] = useState('');
  const [rechargeLoading, setRechargeLoading] = useState(false);

  // --- Historique & Pagination ---
  const [rechargeHistory, setRechargeHistory] = useState([]);
  const [showRechargeHistory, setShowRechargeHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1); // Page courante
  const itemsPerPage = 10; // 10 éléments par page

  // State pour vérifier si le script CinetPay est prêt
  const [isCinetPayReady, setIsCinetPayReady] = useState(false);

  // Références et états pour le popup de paiement
  const pollingRef = useRef(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  // 1. Récupérer le profil via l'API
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/admin/profile');
        setCurrentUser(response.data);
      } catch (error) {
        console.error("❌ Impossible de récupérer le profil admin:", error);
        const userStr = localStorage.getItem('user');
        if (userStr) setCurrentUser(JSON.parse(userStr));
      }
    };
    fetchUserProfile();
  }, []);

  // 2. CHARGEMENT DU SCRIPT CINETPAY
  useEffect(() => {
    if (document.getElementById('cinetpay-script')) {
      setIsCinetPayReady(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'cinetpay-script';
    script.src = 'https://cdn.cinetpay.com/seamless/main.js';
    script.async = true;
    script.onload = () => { console.log("✅ CinetPay chargé"); setIsCinetPayReady(true); };
    script.onerror = () => { console.error("❌ Erreur CinetPay"); };
    document.body.appendChild(script);
  }, []);

  // Vérifier au chargement s'il y a un résultat de paiement à afficher
  useEffect(() => {
    const savedResult = localStorage.getItem('pendingAdminPaymentResult');
    if (savedResult) {
      try {
        const result = JSON.parse(savedResult);
        if (Date.now() - result.timestamp < 60000) {
          setPaymentStatus(result.status);
          setPaymentMessage(result.message);
          setPaymentModal(true);
          setCountdown(5);
          let count = 5;
          const countdownInterval = setInterval(() => {
            count--;
            setCountdown(count);
            if (count <= 0) {
              clearInterval(countdownInterval);
              setPaymentModal(false);
            }
          }, 1000);
        }
      } catch (e) {
        console.error('Erreur parsing payment result:', e);
      }
      localStorage.removeItem('pendingAdminPaymentResult');
    }
  }, []);

  // Helper robuste pour vérifier le rôle
  const isSuperAdmin = useCallback(() => {
    if (!currentUser || !currentUser.role) return false;
    return currentUser.role.toLowerCase() === 'superadmin';
  }, [currentUser]);

  const fetchRequests = useCallback(async (currentFilter) => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/withdrawal-requests?status=${currentFilter}`);
      setRequests(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction pour récupérer l'historique
  const fetchRechargeHistory = useCallback(async () => {
    if (!currentUser || currentUser.role.toLowerCase() !== 'superadmin') return;
    try {
      const res = await api.get('/admin/recharge-history');
      setRechargeHistory(res.data);
    } catch (error) {
      console.error("Erreur historique recharge:", error);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchRequests(filter);
    if (isSuperAdmin()) {
      fetchRechargeHistory();
    }
  }, [filter, fetchRequests, fetchRechargeHistory, isSuperAdmin]);

  const handleProcess = async (requestId, status) => {
    setProcessing(prev => ({ ...prev, [requestId]: true }));
    try {
      await api.put(`/admin/withdrawal-requests/${requestId}`, { status });
      await fetchRequests(filter);
    } catch (error) {
      console.error("Erreur:", error);
      alert(error.response?.data?.message || 'Erreur lors du traitement');
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
    }
  };

  // Fonctions pour le popup
  const showPaymentResult = useCallback((status, message, amount = null) => {
    setPaymentStatus(status);
    if (status === 'success' && amount) {
      setPaymentMessage(`Rechargement réussi : ${parseFloat(amount).toLocaleString('fr-FR')} FCFA`);
    } else {
      setPaymentMessage(message);
    }
    setPaymentModal(true);
    setCountdown(5);
    let count = 5;
    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownInterval);
        window.location.reload();
      }
    }, 1000);
  }, []);

  const savePaymentResultForReload = useCallback((status, message, amount = null) => {
    const result = {
      status,
      message: status === 'success' && amount
        ? `Rechargement réussi : ${parseFloat(amount).toLocaleString('fr-FR')} FCFA`
        : message,
      timestamp: Date.now()
    };
    localStorage.setItem('pendingAdminPaymentResult', JSON.stringify(result));
  }, []);

  const handleAdminRecharge = async (e) => {
    if (e) e.preventDefault();
    if (!isCinetPayReady) {
      alert("Le module de paiement est en cours de chargement...");
      return;
    }
    if (!rechargeAmount || !rechargePhone) {
      alert("Veuillez entrer un montant et un numéro de téléphone.");
      return;
    }

    const currentAmount = rechargeAmount;
    setRechargeLoading(true);

    try {
      const response = await api.post('/admin/recharge', {
        amount: currentAmount,
        phone: rechargePhone
      });
      const { cinetpay_config, checkout_data } = response.data;
      const transactionId = checkout_data.transaction_id;

      if (window.CinetPay) {
        window.CinetPay.setConfig({
          apikey: cinetpay_config.apikey,
          site_id: cinetpay_config.site_id,
          notify_url: cinetpay_config.notify_url,
          mode: cinetpay_config.mode,
        });

        window.CinetPay.waitResponse(async function (data) {
          console.log("CinetPay Admin Response:", data);
          if (data.status === "ACCEPTED") {
            try {
              await api.post('/admin/recharge/verify', { transaction_id: transactionId });
              setRechargeAmount('');
              setRechargePhone('');
              setRechargeLoading(false);
              savePaymentResultForReload('success', '', currentAmount);
              showPaymentResult('success', '', currentAmount);
            } catch (err) {
              console.error("Erreur validation backend:", err);
              setRechargeLoading(false);
              savePaymentResultForReload('error', 'Erreur de validation côté serveur.');
              showPaymentResult('error', 'Erreur de validation côté serveur.');
            }
          } else if (data.status === "REFUSED" || data.status === "CANCELED") {
            setRechargeLoading(false);
            savePaymentResultForReload('error', 'Paiement échoué ou annulé.');
            showPaymentResult('error', 'Paiement échoué ou annulé.');
          }
        });

        window.CinetPay.onError(function (data) {
          console.error("CinetPay Error:", data);
          setRechargeLoading(false);
          savePaymentResultForReload('error', 'Erreur technique lors du paiement.');
          showPaymentResult('error', 'Erreur technique lors du paiement.');
        });

        // Callback quand l'utilisateur ferme le modal CinetPay
        window.CinetPay.onClose = async (data) => {
          console.log("CinetPay Admin Modal Closed:", data);
          await new Promise(resolve => setTimeout(resolve, 1000));

          try {
            const verifyResp = await api.post('/admin/recharge/verify', { transaction_id: transactionId });
            const message = verifyResp.data.message || '';

            if (message.includes('validé') || message.includes('Déjà')) {
              setRechargeAmount('');
              setRechargePhone('');
              setRechargeLoading(false);
              savePaymentResultForReload('success', '', currentAmount);
              showPaymentResult('success', '', currentAmount);
            } else {
              setRechargeLoading(false);
            }
          } catch (err) {
            console.error("Erreur vérification après fermeture:", err);
            setRechargeLoading(false);
          }
        };

        window.CinetPay.getCheckout(checkout_data);
      }
    } catch (error) {
      console.error("Erreur init paiement:", error);
      alert(error.response?.data?.message || "Erreur lors de l'initialisation.");
      setRechargeLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'en_attente': case 'PENDING': return <Badge color="warning">En attente</Badge>;
      case 'traite': case 'ACCEPTED': return <Badge color="success">Validé</Badge>;
      case 'rejete': case 'FAILED': return <Badge color="danger">Échoué</Badge>;
      default: return <Badge color="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // --- LOGIQUE PAGINATION ---
  const indexOfLastHistory = historyPage * itemsPerPage;
  const indexOfFirstHistory = indexOfLastHistory - itemsPerPage;
  const currentHistory = rechargeHistory.slice(indexOfFirstHistory, indexOfLastHistory);
  const totalHistoryPages = Math.ceil(rechargeHistory.length / itemsPerPage);

  return (
    <div className="header bg-gradient-primary pb-8 pt-5 pt-md-8">
      <div className="content">
        <Container fluid>

          {/* --- SECTION RESERVÉE SUPERADMIN : RECHARGEMENT --- */}
          {isSuperAdmin() && (
            <Row className="mb-4">
              <Col md="12">
                <Card className="shadow card-rounded-lg border-0">
                  <CardHeader className="bg-white border-0 pt-4 pb-2">
                    <Row className="align-items-center">
                      <Col>
                        <h3 className="mb-0 text-dark font-weight-800">Recharger le Portefeuille Admin</h3>
                      </Col>
                    </Row>
                  </CardHeader>
                  <CardBody className="px-lg-5 py-lg-4">
                    <Row>
                      <Col lg="7" className="mb-4 mb-lg-0">
                        <div className="bg-secondary p-4 rounded h-100">
                          <Form>
                            <Row>
                              <Col md="6">
                                <FormGroup className="mb-3">
                                  <Label className="form-control-label mb-2">Montant (FCFA)</Label>
                                  <Input type="number" placeholder="Ex: 5000" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} min="100" />
                                </FormGroup>
                              </Col>
                              <Col md="6">
                                <FormGroup className="mb-3">
                                  <Label className="form-control-label mb-2">Tél. Paiement</Label>
                                  <Input type="text" placeholder="Ex: 0707070707" value={rechargePhone} onChange={(e) => setRechargePhone(e.target.value)} />
                                </FormGroup>
                              </Col>
                            </Row>
                            <Button color="success" onClick={handleAdminRecharge} disabled={rechargeLoading || !isCinetPayReady} block className="mb-4 mt-2">
                              {rechargeLoading ? <Spinner size="sm" /> : "Procéder au paiement"}
                            </Button>
                            <div className="d-flex align-items-center">
                              <span className="mr-3 font-weight-600 text-sm text-muted">Moyens acceptés :</span>
                              <div className="d-flex">
                                <img src={require('assets/img/theme/Orange.png')} alt="OM" style={{ width: '30px', height: '30px', margin: '0 5px' }} />
                                <img src={require('assets/img/theme/MTN.png')} alt="Momo" style={{ width: '30px', height: '30px', margin: '0 5px' }} />
                                <img src={require('assets/img/theme/Moov.png')} alt="Moov" style={{ width: '30px', height: '30px', margin: '0 5px' }} />
                                <img src={require('assets/img/theme/Wave.png')} alt="Wave" style={{ width: '30px', height: '30px', margin: '0 5px' }} />
                              </div>
                            </div>

                            {/* Note informative sur l'email */}
                            <div className="alert alert-info py-2 mt-3 mb-0 small">
                              <i className="ni ni-email-83 mr-2"></i>
                              Un email de confirmation vous sera envoyé une fois le rechargement effectué.
                            </div>
                          </Form>
                        </div>
                      </Col>
                      <Col lg="5">
                        <div className="bg-light p-4 rounded h-100 d-flex flex-column justify-content-center border">
                          <h3 className="font-weight-bold mb-1">Administration</h3>
                          <div className="text-muted small mb-4">Compte connecté : {currentUser.nom_utilisateur}<br /><Badge color="primary">{currentUser.role}</Badge></div>
                          <hr className="my-4" />
                          <div className="text-center">
                            <Button color="info" outline onClick={() => setShowRechargeHistory(!showRechargeHistory)}>
                              {showRechargeHistory ? "Masquer l'historique" : "Voir l'historique des recharges"}
                            </Button>
                          </div>
                        </div>
                      </Col>
                    </Row>

                    {/* TABLEAU HISTORIQUE AVEC PAGINATION */}
                    {showRechargeHistory && (
                      <div className="mt-4 table-responsive">
                        <h4 className="text-muted mb-3">Historique des transactions admin</h4>
                        <Table className="align-items-center table-flush" responsive>
                          <thead className="thead-light">
                            <tr>
                              <th>ID Trans.</th>
                              <th>Admin</th>
                              <th>Montant</th>
                              <th>Tél utilisé</th>
                              <th>Date</th>
                              <th>Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentHistory.length > 0 ? (
                              currentHistory.map((recharge) => (
                                <tr key={recharge.id}>
                                  <td>{recharge.transaction_id}</td>
                                  <td>{recharge.nom_utilisateur}</td>
                                  <td className="font-weight-bold">{recharge.montant} FCFA</td>
                                  <td>{recharge.telephone_utilisé || '-'}</td>
                                  <td>{formatDate(recharge.date_recharge)}</td>
                                  <td>{getStatusBadge(recharge.statut)}</td>
                                </tr>
                              ))
                            ) : (
                              <tr><td colSpan="6" className="text-center">Aucun historique.</td></tr>
                            )}
                          </tbody>
                        </Table>

                        {/* --- PAGINATION CONTROLS --- */}
                        {totalHistoryPages > 1 && (
                          <nav aria-label="Page navigation" className="mt-3">
                            <Pagination className="justify-content-center">
                              <PaginationItem disabled={historyPage <= 1}>
                                <PaginationLink previous onClick={() => setHistoryPage(historyPage - 1)} />
                              </PaginationItem>
                              {[...Array(totalHistoryPages)].map((_, i) => (
                                <PaginationItem active={i + 1 === historyPage} key={i}>
                                  <PaginationLink onClick={() => setHistoryPage(i + 1)}>
                                    {i + 1}
                                  </PaginationLink>
                                </PaginationItem>
                              ))}
                              <PaginationItem disabled={historyPage >= totalHistoryPages}>
                                <PaginationLink next onClick={() => setHistoryPage(historyPage + 1)} />
                              </PaginationItem>
                            </Pagination>
                          </nav>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}

          {/* --- SECTION DEMANDES DE RETRAIT (EXISTANT) --- */}
          <Row>
            <Col md="12">
              <Card className="shadow">
                <CardHeader className="bg-white border-0"><h3 className="mb-0">Demandes de retrait Utilisateurs</h3></CardHeader>
                <CardBody>
                  <Row><Col md="4"><FormGroup><Input type="select" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="en_attente">En attente</option><option value="traite">Traitée</option><option value="rejete">Rejetée</option><option value="">Toutes</option></Input></FormGroup></Col></Row>
                  {loading ? (<div className="text-center py-5"><Spinner color="primary" /></div>) : requests.length === 0 ? (<div className="text-center py-5"><p>Aucune demande de retrait</p></div>) : (
                    <Table responsive className="align-items-center table-flush">
                      <thead className="thead-light"><tr><th>ID</th><th>Utilisateur</th><th>Opérateur</th><th>Montant</th><th>Date</th><th>Statut</th><th>Traité par</th><th>Traitement</th><th>Actions</th></tr></thead>
                      <tbody>
                        {requests.map(request => (
                          <tr key={request.id}>
                            <td>{request.id}</td>
                            <td><div className="font-weight-bold">{request.utilisateur}</div><small className="text-muted">{request.email}</small><div>{request.telephone}</div></td>
                            <td>{request.operateur_mobile || '-'}</td>
                            <td className="font-weight-bold">{parseFloat(request.montant).toFixed(2)}</td>
                            <td>{formatDate(request.date_demande)}</td>
                            <td>{getStatusBadge(request.statut)}</td>
                            <td>{request.admin_processor || '-'}</td>
                            <td>{formatDate(request.date_traitement)}</td>
                            <td>
                              {request.statut === 'en_attente' && (
                                <div className="btn-group">
                                  <Button color="success" size="sm" onClick={() => handleProcess(request.id, 'traite')} disabled={processing[request.id]}>{processing[request.id] ? <Spinner size="sm" /> : 'Valider'}</Button>
                                  <Button color="danger" size="sm" onClick={() => handleProcess(request.id, 'rejete')} disabled={processing[request.id]}>{processing[request.id] ? <Spinner size="sm" /> : 'Rejeter'}</Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Modal Popup de résultat de paiement */}
      <Modal isOpen={paymentModal} centered backdrop="static" keyboard={false}>
        <ModalHeader
          className={paymentStatus === 'success' ? 'bg-success text-white' : 'bg-danger text-white'}
          style={{ borderBottom: 'none' }}
        >
          <i className={`fas ${paymentStatus === 'success' ? 'fa-check-circle' : 'fa-times-circle'} mr-2`}></i>
          {paymentStatus === 'success' ? 'Rechargement Réussi !' : 'Échec du Rechargement'}
        </ModalHeader>
        <ModalBody className="text-center py-4">
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>
            {paymentStatus === 'success' ? '✅' : '❌'}
          </div>
          <h4 className={paymentStatus === 'success' ? 'text-success' : 'text-danger'}>
            {paymentMessage}
          </h4>
          <p className="text-muted mt-3">
            La page se rechargera dans <strong>{countdown}</strong> seconde{countdown > 1 ? 's' : ''}...
          </p>
        </ModalBody>
        <ModalFooter className="justify-content-center border-0">
          <Button
            color={paymentStatus === 'success' ? 'success' : 'danger'}
            onClick={() => window.location.reload()}
          >
            Rafraîchir maintenant
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default WithdrawalRequests;