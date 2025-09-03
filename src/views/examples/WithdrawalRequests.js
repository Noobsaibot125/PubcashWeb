import React, { useState, useEffect,useCallback } from 'react';
import {
  Card, CardHeader, CardBody, Table, Button, Badge,
  Row, Col, FormGroup, Input, Spinner
} from 'reactstrap';
import { useNavigate } from 'react-router-dom'; // Changé useHistory en useNavigate
import api from '../../services/api'; // 1. IMPORTER API
const WithdrawalRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('en_attente');
  const [processing, setProcessing] = useState({});

  const navigate = useNavigate(); // Changé history en navigate

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

  useEffect(() => {
    fetchRequests(filter);
  }, [filter, fetchRequests]);

  // 3. CORRIGER handleProcess
  const handleProcess = async (requestId, status) => {
    setProcessing(prev => ({ ...prev, [requestId]: true }));
    try {
      await api.put(`/admin/withdrawal-requests/${requestId}`, { status });
      
      // 2. CORRECTION : On supprime l'appel à la fonction qui n'existe pas.
      // await fetchWithdrawHistory(); // <-- LIGNE SUPPRIMÉE

      // Maintenant, cette ligne va s'exécuter correctement pour rafraîchir le tableau.
      await fetchRequests(filter);

    } catch (error) {
      console.error("Erreur lors du traitement de la demande:", error);
      // L'alerte ne s'affichera que pour de vraies erreurs API maintenant.
      alert(error.response?.data?.message || 'Erreur lors du traitement');
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'en_attente': return <Badge color="warning">En attente</Badge>;
      case 'traite': return <Badge color="success">Traitée</Badge>;
      case 'rejete': return <Badge color="danger">Rejetée</Badge>;
      default: return <Badge color="secondary">Inconnu</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="header bg-gradient-primary pb-8 pt-5 pt-md-8">
    <div className="content">
      <Row>
        <Col md="12">
          <Card>
            <CardHeader>
              <h4 className="title">Demandes de retrait</h4>
              <p className="category">Gestion des demandes de retrait des utilisateurs</p>
            </CardHeader>
            <CardBody>
              <Row>
                <Col md="4">
                  <FormGroup>
                    <Input
                      type="select"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="en_attente">En attente</option>
                      <option value="traite">Traitée</option>
                      <option value="rejete">Rejetée</option>
                      <option value="">Toutes</option>
                    </Input>
                  </FormGroup>
                </Col>
              </Row>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner color="primary" />
                </div>  
              ) : requests.length === 0 ? (
                <div className="text-center py-5">
                  <p>Aucune demande de retrait</p>
                </div>
              ) : (
                <Table responsive>
                  <thead className="text-primary">
                    <tr>
                      <th>ID</th>
                      <th>Utilisateur</th>
                      <th>Opérateur</th>
                      <th>Montant (FCFA)</th>
                      <th>Date demande</th>
                      <th>Statut</th>
                      <th>Traité par</th>
                      <th>Date traitement</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(request => (
                      <tr key={request.id}>
                        <td>{request.id}</td>
                        <td>
                          <div>{request.utilisateur}</div>
                          <small className="text-muted">{request.email}</small>
                          <div>{request.telephone}</div>
                        </td>
                        <td>{request.operateur_mobile || '-'}</td> {/* NOUVELLE CELLULE */}
                        <td>{parseFloat(request.montant).toFixed(2)}</td>
                        <td>{formatDate(request.date_demande)}</td>
                        <td>{getStatusBadge(request.statut)}</td>
                        <td>{request.admin_processor || '-'}</td> {/* NOUVELLE CELLULE */}
                        <td>{formatDate(request.date_traitement)}</td>
                        <td>
                          {request.statut === 'en_attente' && (
                            <div className="btn-group">
                              <Button
                                color="success"
                                size="sm"
                                onClick={() => handleProcess(request.id, 'traite')}
                                disabled={processing[request.id]}
                              >
                                {processing[request.id] ? <Spinner size="sm" /> : 'Valider'}
                              </Button>
                              <Button
                                color="danger"
                                size="sm"
                                onClick={() => handleProcess(request.id, 'rejete')}
                                disabled={processing[request.id]}
                              >
                                {processing[request.id] ? <Spinner size="sm" /> : 'Rejeter'}
                              </Button>
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
    </div>
    </div>
  );
};

export default WithdrawalRequests;