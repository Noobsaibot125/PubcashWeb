// src/views/AjouterCommunes.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container, Row, Col, Card, CardHeader, CardBody, Form, FormGroup, Label, Input, Button, Spinner,
  Modal, ModalHeader, ModalBody, Toast, ToastHeader, ToastBody, Badge, Collapse, ListGroup, ListGroupItem
} from "reactstrap";
import { FaCity, FaMapMarkedAlt, FaPlusCircle, FaListUl } from 'react-icons/fa';
import api from '../../services/api';

const TopToast = ({ visible, setVisible, title, message, color = 'success' }) => {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, [visible, setVisible]);

  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 2000 }}>
      <Toast>
        <ToastHeader icon={color === 'success' ? 'success' : color === 'danger' ? 'danger' : 'primary'}>
          {title}
        </ToastHeader>
        <ToastBody>{message}</ToastBody>
      </Toast>
    </div>
  );
};

const AjouterCommunes = () => {
  const [nomVille, setNomVille] = useState('');
  const [loadingVille, setLoadingVille] = useState(false);

  const [nomCommune, setNomCommune] = useState('');
  const [selectedVille, setSelectedVille] = useState('');
  const [loadingCommune, setLoadingCommune] = useState(false);

  const [villesList, setVillesList] = useState([]);
  const [communesList, setCommunesList] = useState([]);

  // UI
  const [toastVisible, setToastVisible] = useState(false);
  const [toastData, setToastData] = useState({ title: '', message: '', color: 'success' });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ title: '', message: '' });

  const [search, setSearch] = useState('');
  const [openCityId, setOpenCityId] = useState(null); // id of expanded city card

  const showToast = (title, message, color = 'success') => {
    setToastData({ title, message, color });
    setToastVisible(true);
  };

  const showModal = (title, message) => {
    setModalData({ title, message });
    setModalVisible(true);
    setTimeout(() => setModalVisible(false), 2800); // auto dismiss
  };

  const fetchVilles = useCallback(async () => {
    try {
      const res = await api.get('/admin/villes');
      setVillesList(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('Erreur', 'Impossible de récupérer les villes', 'danger');
    }
  }, []);

  const fetchCommunes = useCallback(async () => {
    try {
      const res = await api.get('/admin/communes');
      setCommunesList(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('Erreur', 'Impossible de récupérer les communes', 'danger');
    }
  }, []);

  useEffect(() => {
    fetchVilles();
    fetchCommunes();
  }, [fetchVilles, fetchCommunes]);

  // create city
  const handleVilleSubmit = async (e) => {
    e.preventDefault();
    if (!nomVille.trim()) return showToast('Erreur', 'Nom de ville requis', 'danger');
    setLoadingVille(true);
    try {
      const res = await api.post('/admin/villes', { nom: nomVille });
      showToast('Ville créée', res.data?.message || `${nomVille} ajoutée`, 'success');
      showModal('Ville ajoutée', `${nomVille} a été créée avec succès.`);
      setNomVille('');
      await fetchVilles();
    } catch (err) {
      console.error(err);
      showToast('Erreur', err.response?.data?.message || 'Erreur création ville', 'danger');
    } finally {
      setLoadingVille(false);
    }
  };

  // create commune via main form
  const handleCommuneSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVille) return showToast('Erreur', 'Sélectionnez une ville', 'danger');
    if (!nomCommune.trim()) return showToast('Erreur', 'Nom de commune requis', 'danger');
    setLoadingCommune(true);
    try {
      const res = await api.post('/admin/communes', { nom: nomCommune, id_ville: selectedVille });
      showToast('Commune créée', res.data?.message || `${nomCommune} ajoutée`, 'success');
      showModal('Commune ajoutée', `${nomCommune} a été ajoutée à la ville.`);
      setNomCommune('');
      setSelectedVille('');
      await fetchCommunes();
    } catch (err) {
      console.error(err);
      showToast('Erreur', err.response?.data?.message || 'Erreur création commune', 'danger');
    } finally {
      setLoadingCommune(false);
    }
  };

  const handleDeleteCommune = async (communeId) => {
    if (!window.confirm("Confirmer la suppression de cette commune ?")) return;
    try {
      await api.delete(`/admin/communes/${communeId}`);
      showToast('Supprimée', 'La commune a été supprimée', 'success');
      await fetchCommunes();
    } catch (err) {
      console.error(err);
      showToast('Erreur', 'Impossible de supprimer', 'danger');
    }
  };

  // compute filtered villes and communes by ville
  const filteredVilles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return villesList;
    return villesList.filter(v => {
      const inVilleName = v.nom?.toLowerCase().includes(q);
      const hasCommuneMatch = communesList.some(c => c.id_ville === v.id && c.nom?.toLowerCase().includes(q));
      return inVilleName || hasCommuneMatch;
    });
  }, [villesList, communesList, search]);

  const communesByVille = useMemo(() => {
    return communesList.reduce((acc, c) => {
      acc[c.id_ville] = acc[c.id_ville] || [];
      acc[c.id_ville].push(c);
      return acc;
    }, {});
  }, [communesList]);

  // toggle expand city -> show list of communes
  const toggleCity = (id) => {
    setOpenCityId(prev => (prev === id ? null : id));
  };

  return (
    <>
      <TopToast
        visible={toastVisible}
        setVisible={setToastVisible}
        title={toastData.title}
        message={toastData.message}
        color={toastData.color}
      />

      <Modal isOpen={modalVisible} toggle={() => setModalVisible(!modalVisible)} centered>
        <ModalHeader toggle={() => setModalVisible(false)}>{modalData.title}</ModalHeader>
        <ModalBody>{modalData.message}</ModalBody>
      </Modal>

      <div className="header bg-gradient-primary pb-8 pt-5 pt-md-8">
        <Container fluid>
          <div className="header-body">
            <Row>
              <Col lg="7" xl="8">
                <h1 className="text-white display-3">Gestion des Localisations</h1>
                <p className="text-white">Créer des villes & communes — interface cohérente</p>
              </Col>
            </Row>
          </div>
        </Container>
      </div>

      <Container className="mt--7" fluid>
        <Row>
          {/* Left: forms */}
          <Col xl="4" md="6" className="mb-3">
            <Card className="shadow">
              <CardHeader><h3 className="mb-0"><FaCity /> Ajouter une Ville</h3></CardHeader>
              <CardBody>
                <Form onSubmit={handleVilleSubmit}>
                  <FormGroup>
                    <Label for="nomVille">Nom de la ville</Label>
                    <Input id="nomVille" value={nomVille} onChange={e => setNomVille(e.target.value)} placeholder="Ex: Abidjan" />
                  </FormGroup>
                  <div className="d-flex gap-2">
                    <Button color="primary" type="submit" disabled={loadingVille}>
                      {loadingVille ? <Spinner size="sm" /> : <><FaPlusCircle /> Créer la ville</>}
                    </Button>
                    <Button color="secondary" onClick={() => setNomVille('')}>Réinitialiser</Button>
                  </div>
                </Form>
              </CardBody>
            </Card>

            <Card className="shadow mt-3">
              <CardHeader><h6 className="mb-0"><FaListUl /> Recherche</h6></CardHeader>
              <CardBody>
                <Input placeholder="Rechercher ville/commune..." value={search} onChange={e => setSearch(e.target.value)} />
                <div className="text-muted mt-2 small">{filteredVilles.length} ville(s) affichée(s)</div>
              </CardBody>
            </Card>
          </Col>

          {/* Right: main commune creation + cities grid */}
          <Col xl="8" md="6">
            <Card className="shadow mb-3">
              <CardHeader><h3 className="mb-0"><FaMapMarkedAlt /> Créer une Commune</h3></CardHeader>
              <CardBody>
                <Form inline onSubmit={handleCommuneSubmit} className="mb-3">
                  <FormGroup className="mr-2" style={{ minWidth: 220 }}>
                    <Label for="villeSelect" className="mr-2">Ville</Label>
                    <Input type="select" id="villeSelect" value={selectedVille} onChange={e => setSelectedVille(e.target.value)}>
                      <option value="">Sélectionnez une ville...</option>
                      {villesList.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
                    </Input>
                  </FormGroup>
                  <FormGroup className="mr-2">
                    <Input id="nomCommune" value={nomCommune} onChange={e => setNomCommune(e.target.value)} placeholder="Ex: Cocody" />
                  </FormGroup>
                  <Button color="success" type="submit" disabled={loadingCommune || !villesList.length}>
                    {loadingCommune ? <Spinner size="sm" /> : <FaPlusCircle />} &nbsp;Créer la commune
                  </Button>
                </Form>
              </CardBody>
            </Card>

            {/* Cities grid: clicking header toggles list of communes for that city */}
            <Row>
              {filteredVilles.length ? filteredVilles.map(v => {
                const list = communesByVille[v.id] || [];
                return (
                  <Col lg="6" md="12" className="mb-3" key={v.id}>
                    <Card className="h-100 shadow-sm">
                      <CardHeader
                        onClick={() => toggleCity(v.id)}
                        style={{ cursor: 'pointer' }}
                        aria-expanded={openCityId === v.id}
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <strong>{v.nom}</strong>
                          <div className="small text-muted">{list.length} commune(s)</div>
                        </div>
                        <div className="text-primary" style={{ fontSize: 14 }}>
                          {openCityId === v.id ? 'Fermer' : 'Voir'}
                        </div>
                      </CardHeader>

                      <Collapse isOpen={openCityId === v.id}>
                        <CardBody>
                          {list.length ? (
                            <ListGroup flush>
                              {list.map(c => (
                                <ListGroupItem key={c.id} className="d-flex justify-content-between align-items-center">
                                  <div>{c.nom}</div>
                                  <div>
                                    <Button close size="sm" title="Supprimer" onClick={() => handleDeleteCommune(c.id)} />
                                  </div>
                                </ListGroupItem>
                              ))}
                            </ListGroup>
                          ) : (
                            <div className="text-muted">Aucune commune</div>
                          )}
                        </CardBody>
                      </Collapse>
                    </Card>
                  </Col>
                );
              }) : (
                <Col>
                  <div className="p-4 text-center text-muted">Aucune ville disponible.</div>
                </Col>
              )}
            </Row>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AjouterCommunes;
