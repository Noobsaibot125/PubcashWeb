import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Button, Card, CardHeader, CardBody, FormGroup, Form, Input, Container, Row, Col,
  Spinner, Label, Modal, ModalHeader, ModalBody, ModalFooter, Badge, Nav, NavItem, NavLink,
  TabContent, TabPane, Table, InputGroup, InputGroupAddon, InputGroupText
} from 'reactstrap';
import {
  FaCity, FaMapMarkedAlt, FaPlusCircle, FaSearch, FaEdit, FaTrash, FaBox,
  FaFileImport, FaUpload, FaClock, FaMoneyBillWave, FaCheckCircle, FaTimes,
  FaChevronDown, FaChevronUp, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import api from 'services/api';
import '../../assets/css/AjouterCommune.css';

// Toast notification component
const Toast = ({ visible, type, message, onClose }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, x: 50 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={`toast-notification toast-${type}`}
    >
      <span className="toast-icon">
        {type === 'success' ? <FaCheckCircle /> : <FaTimes />}
      </span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}><FaTimes /></button>
    </motion.div>
  );
};

const CommunesEtPacks = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('communes');

  // Toast state
  const [toast, setToast] = useState({ visible: false, type: 'success', message: '' });
  const showToast = (type, message) => setToast({ visible: true, type, message });

  // Communes & Villes state
  const [nomVille, setNomVille] = useState('');
  const [nomCommune, setNomCommune] = useState('');
  const [selectedVille, setSelectedVille] = useState('');
  const [villesList, setVillesList] = useState([]);
  const [communesList, setCommunesList] = useState([]);
  const [loadingVille, setLoadingVille] = useState(false);
  const [loadingCommune, setLoadingCommune] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedVilles, setExpandedVilles] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Edit commune modal state
  const [editModal, setEditModal] = useState({ open: false, commune: null });
  const [editNom, setEditNom] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Import state
  const [importModal, setImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const fileInputRef = useRef(null);

  // Packs state
  const [packsList, setPacksList] = useState([]);
  const [loadingPacks, setLoadingPacks] = useState(false);
  const [packModal, setPackModal] = useState({ open: false, mode: 'create', pack: null });
  const [packForm, setPackForm] = useState({ nom_pack: '', duree_min_secondes: '', duree_max_secondes: '', remuneration: '' });
  const [packLoading, setPackLoading] = useState(false);

  // Fetch functions
  const fetchVilles = useCallback(async () => {
    try {
      const res = await api.get('/admin/villes');
      setVillesList(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('error', 'Impossible de récupérer les villes');
    }
  }, []);

  const fetchCommunes = useCallback(async () => {
    try {
      const res = await api.get('/admin/communes');
      setCommunesList(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('error', 'Impossible de récupérer les communes');
    }
  }, []);

  const fetchPacks = useCallback(async () => {
    setLoadingPacks(true);
    try {
      const res = await api.get('/admin/packs');
      setPacksList(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('error', 'Impossible de récupérer les packs');
    } finally {
      setLoadingPacks(false);
    }
  }, []);

  useEffect(() => {
    fetchVilles();
    fetchCommunes();
    fetchPacks();
  }, [fetchVilles, fetchCommunes, fetchPacks]);

  // Create ville
  const handleVilleSubmit = async (e) => {
    e.preventDefault();
    if (!nomVille.trim()) return showToast('error', 'Nom de ville requis');
    setLoadingVille(true);
    try {
      await api.post('/admin/villes', { nom: nomVille });
      showToast('success', `Ville "${nomVille}" créée avec succès`);
      setNomVille('');
      await fetchVilles();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Erreur création ville');
    } finally {
      setLoadingVille(false);
    }
  };

  // Create commune
  const handleCommuneSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVille) return showToast('error', 'Sélectionnez une ville');
    if (!nomCommune.trim()) return showToast('error', 'Nom de commune requis');
    setLoadingCommune(true);
    try {
      await api.post('/admin/communes', { nom: nomCommune, id_ville: selectedVille });
      showToast('success', `Commune "${nomCommune}" créée avec succès`);
      setNomCommune('');
      setSelectedVille('');
      await fetchCommunes();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Erreur création commune');
    } finally {
      setLoadingCommune(false);
    }
  };

  // Delete commune
  const handleDeleteCommune = async (commune) => {
    if (!window.confirm(`Supprimer la commune "${commune.nom}" ?`)) return;
    try {
      await api.delete(`/admin/communes/${commune.id}`);
      showToast('success', 'Commune supprimée');
      await fetchCommunes();
    } catch (err) {
      showToast('error', 'Impossible de supprimer');
    }
  };

  // Edit commune modal handlers
  const openEditModal = (commune) => {
    setEditModal({ open: true, commune });
    setEditNom(commune.nom);
  };

  const handleEditCommune = async () => {
    if (!editNom.trim()) return showToast('error', 'Le nom est requis');
    setEditLoading(true);
    try {
      await api.put(`/admin/communes/${editModal.commune.id}`, { nom: editNom.trim() });
      showToast('success', `Commune renommée en "${editNom.trim()}"`);
      setEditModal({ open: false, commune: null });
      await fetchCommunes();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Erreur lors du renommage');
    } finally {
      setEditLoading(false);
    }
  };

  // Import functions
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        let communes = [];

        // Handle different formats
        if (data.regions) {
          data.regions.forEach(region => {
            region.communes?.forEach(commune => {
              communes.push({ nom: commune, nom_ville: region.nom });
            });
          });
        } else if (Array.isArray(data)) {
          communes = data;
        } else if (data.communes) {
          communes = data.communes;
        }

        setImportPreview(communes);
        setImportModal(true);
      } catch (err) {
        showToast('error', 'Fichier JSON invalide');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = async () => {
    if (!window.confirm('⚠️ ATTENTION ! Cette action va supprimer TOUTES les villes et communes de la base de données. Cette action est irréversible. Continuer ?')) return;
    if (!window.confirm('Êtes-vous vraiment sûr ? Tapez OK pour confirmer.')) return;

    try {
      await api.delete('/admin/communes/clear-all');
      showToast('success', 'Toutes les villes et communes ont été supprimées');
      setCurrentPage(1);
      await Promise.all([fetchVilles(), fetchCommunes()]);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const executeImport = async () => {
    if (importPreview.length === 0) return;
    setImportLoading(true);
    try {
      const res = await api.post('/admin/communes/bulk-import', { communes: importPreview });
      showToast('success', res.data.message);
      setImportModal(false);
      setImportPreview([]);
      await Promise.all([fetchVilles(), fetchCommunes()]);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Erreur lors de l\'import');
    } finally {
      setImportLoading(false);
    }
  };

  // Pack CRUD handlers
  const openPackModal = (mode, pack = null) => {
    setPackModal({ open: true, mode, pack });
    if (pack) {
      setPackForm({
        nom_pack: pack.nom_pack,
        duree_min_secondes: pack.duree_min_secondes.toString(),
        duree_max_secondes: pack.duree_max_secondes.toString(),
        remuneration: pack.remuneration.toString()
      });
    } else {
      setPackForm({ nom_pack: '', duree_min_secondes: '', duree_max_secondes: '', remuneration: '' });
    }
  };

  const handlePackSubmit = async () => {
    const { nom_pack, duree_min_secondes, duree_max_secondes, remuneration } = packForm;
    if (!nom_pack || !duree_min_secondes || !duree_max_secondes || !remuneration) {
      return showToast('error', 'Tous les champs sont requis');
    }

    setPackLoading(true);
    try {
      const payload = {
        nom_pack,
        duree_min_secondes: parseInt(duree_min_secondes),
        duree_max_secondes: parseInt(duree_max_secondes),
        remuneration: parseInt(remuneration)
      };

      if (packModal.mode === 'create') {
        await api.post('/admin/packs', payload);
        showToast('success', `Pack "${nom_pack}" créé`);
      } else {
        await api.put(`/admin/packs/${packModal.pack.id}`, payload);
        showToast('success', `Pack "${nom_pack}" modifié`);
      }

      setPackModal({ open: false, mode: 'create', pack: null });
      await fetchPacks();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Erreur');
    } finally {
      setPackLoading(false);
    }
  };

  const handleDeletePack = async (pack) => {
    if (!window.confirm(`Supprimer le pack "${pack.nom_pack}" ?`)) return;
    try {
      await api.delete(`/admin/packs/${pack.id}`);
      showToast('success', 'Pack supprimé');
      await fetchPacks();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Impossible de supprimer');
    }
  };

  // Computed values
  const filteredVilles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return villesList;
    return villesList.filter(v => {
      const inVilleName = v.nom?.toLowerCase().includes(q);
      const hasCommuneMatch = communesList.some(c => c.id_ville === v.id && c.nom?.toLowerCase().includes(q));
      return inVilleName || hasCommuneMatch;
    });
  }, [villesList, communesList, search]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Paginated villes
  const totalPages = Math.ceil(filteredVilles.length / ITEMS_PER_PAGE);
  const paginatedVilles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVilles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVilles, currentPage]);

  const communesByVille = useMemo(() => {
    return communesList.reduce((acc, c) => {
      acc[c.id_ville] = acc[c.id_ville] || [];
      acc[c.id_ville].push(c);
      return acc;
    }, {});
  }, [communesList]);

  const totalCommunes = communesList.length;

  const toggleVille = (id) => {
    setExpandedVilles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        <Toast
          visible={toast.visible}
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(prev => ({ ...prev, visible: false }))}
        />
      </AnimatePresence>

      {/* Header */}
      <div className="header bg-gradient-primary pb-8 pt-5 pt-md-8">
        <Container fluid>
          <div className="header-body">
            <Row className="align-items-center">
              <Col lg="8">
                <h1 className="text-white display-3 mb-0">Communes et Packs</h1>
                <p className="text-white-50 mt-2 mb-0">
                  Gérez les localisations ivoiriennes et les configurations de packs
                </p>
              </Col>
              <Col lg="4" className="text-right">
                <div className="stats-cards">
                  <div className="stat-item">
                    <span className="stat-value">{totalCommunes}</span>
                    <span className="stat-label">Communes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{villesList.length}</span>
                    <span className="stat-label">Villes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{packsList.length}</span>
                    <span className="stat-label">Packs</span>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </div>

      <Container className="mt--7" fluid>
        {/* Tabs */}
        <Card className="shadow mb-4">
          <CardBody className="pb-0">
            <Nav tabs className="nav-tabs-modern">
              <NavItem>
                <NavLink
                  className={activeTab === 'communes' ? 'active' : ''}
                  onClick={() => setActiveTab('communes')}
                >
                  <FaMapMarkedAlt className="mr-2" />
                  Communes & Villes
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={activeTab === 'packs' ? 'active' : ''}
                  onClick={() => setActiveTab('packs')}
                >
                  <FaBox className="mr-2" />
                  Packs
                </NavLink>
              </NavItem>
            </Nav>
          </CardBody>
        </Card>

        <TabContent activeTab={activeTab}>
          {/* Communes Tab */}
          <TabPane tabId="communes">
            <Row>
              {/* Left side - Forms */}
              <Col xl="4" lg="5" className="mb-4">
                {/* Add Ville Card */}
                <Card className="shadow-modern mb-4">
                  <CardHeader className="bg-transparent border-0">
                    <h4 className="mb-0"><FaCity className="mr-2 text-primary" />Ajouter une Ville</h4>
                  </CardHeader>
                  <CardBody>
                    <Form onSubmit={handleVilleSubmit}>
                      <FormGroup>
                        <Label>Nom de la ville</Label>
                        <Input
                          value={nomVille}
                          onChange={e => setNomVille(e.target.value)}
                          placeholder="Ex: Abidjan"
                        />
                      </FormGroup>
                      <Button color="primary" block disabled={loadingVille}>
                        {loadingVille ? <Spinner size="sm" /> : <><FaPlusCircle className="mr-2" />Créer</>}
                      </Button>
                    </Form>
                  </CardBody>
                </Card>

                {/* Add Commune Card */}
                <Card className="shadow-modern mb-4">
                  <CardHeader className="bg-transparent border-0">
                    <h4 className="mb-0"><FaMapMarkedAlt className="mr-2 text-success" />Ajouter une Commune</h4>
                  </CardHeader>
                  <CardBody>
                    <Form onSubmit={handleCommuneSubmit}>
                      <FormGroup>
                        <Label>Ville</Label>
                        <Input
                          type="select"
                          value={selectedVille}
                          onChange={e => setSelectedVille(e.target.value)}
                        >
                          <option value="">-- Sélectionner --</option>
                          {villesList.map(v => (
                            <option key={v.id} value={v.id}>{v.nom}</option>
                          ))}
                        </Input>
                      </FormGroup>
                      <FormGroup>
                        <Label>Nom de la commune</Label>
                        <Input
                          value={nomCommune}
                          onChange={e => setNomCommune(e.target.value)}
                          placeholder="Ex: Cocody"
                        />
                      </FormGroup>
                      <Button color="success" block disabled={loadingCommune}>
                        {loadingCommune ? <Spinner size="sm" /> : <><FaPlusCircle className="mr-2" />Créer</>}
                      </Button>
                    </Form>
                  </CardBody>
                </Card>

                {/* Import Card */}
                <Card className="shadow-modern">
                  <CardHeader className="bg-transparent border-0">
                    <h4 className="mb-0"><FaFileImport className="mr-2 text-info" />Import en masse</h4>
                  </CardHeader>
                  <CardBody>
                    <input
                      type="file"
                      accept=".json"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <Button
                      color="info"
                      outline
                      block
                      className="mb-3"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FaUpload className="mr-2" />
                      Importer un fichier JSON
                    </Button>
                    <Button
                      color="danger"
                      outline
                      block
                      onClick={handleClearAll}
                    >
                      <FaTrash className="mr-2" />
                      Vider toutes les villes/communes
                    </Button>
                    <small className="text-muted d-block mt-2">
                      ⚠️ Cette action supprimera toutes les données
                    </small>
                  </CardBody>
                </Card>
              </Col>

              {/* Right side - List */}
              <Col xl="8" lg="7">
                {/* Search */}
                <Card className="shadow-modern mb-4">
                  <CardBody>
                    <InputGroup>
                      <InputGroupAddon addonType="prepend">
                        <InputGroupText><FaSearch /></InputGroupText>
                      </InputGroupAddon>
                      <Input
                        placeholder="Rechercher une ville ou commune..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                      />
                    </InputGroup>
                    <small className="text-muted mt-2 d-block">
                      {filteredVilles.length} ville(s) • {totalCommunes} commune(s) au total
                      {filteredVilles.length > ITEMS_PER_PAGE && ` • Page ${currentPage}/${totalPages}`}
                    </small>
                  </CardBody>
                </Card>

                {/* Villes & Communes List */}
                <div className="villes-list">
                  {paginatedVilles.length > 0 ? paginatedVilles.map(ville => {
                    const communes = communesByVille[ville.id] || [];
                    const isExpanded = expandedVilles[ville.id];

                    return (
                      <motion.div
                        key={ville.id}
                        className="ville-card shadow-modern"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div
                          className="ville-header"
                          onClick={() => toggleVille(ville.id)}
                        >
                          <div className="ville-info">
                            <FaCity className="ville-icon" />
                            <div>
                              <h5 className="mb-0">{ville.nom}</h5>
                              <small className="text-muted">{communes.length} commune(s)</small>
                            </div>
                          </div>
                          <div className="ville-actions">
                            <Badge color="primary" pill>{communes.length}</Badge>
                            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="communes-list"
                            >
                              {communes.length > 0 ? communes.map(c => (
                                <div key={c.id} className="commune-item">
                                  <span className="commune-name">{c.nom}</span>
                                  <div className="commune-actions">
                                    <Button
                                      size="sm"
                                      color="warning"
                                      outline
                                      onClick={(e) => { e.stopPropagation(); openEditModal(c); }}
                                    >
                                      <FaEdit />
                                    </Button>
                                    <Button
                                      size="sm"
                                      color="danger"
                                      outline
                                      onClick={(e) => { e.stopPropagation(); handleDeleteCommune(c); }}
                                    >
                                      <FaTrash />
                                    </Button>
                                  </div>
                                </div>
                              )) : (
                                <div className="text-muted text-center py-3">
                                  Aucune commune dans cette ville
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  }) : (
                    <div className="text-center text-muted py-5">
                      <FaMapMarkedAlt size={48} className="mb-3 opacity-50" />
                      <p>Aucune ville trouvée</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {filteredVilles.length > ITEMS_PER_PAGE && (
                  <div className="pagination-container mt-4">
                    <Button
                      color="primary"
                      outline
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="pagination-btn"
                    >
                      <FaChevronLeft /> Précédent
                    </Button>

                    <div className="pagination-info">
                      {/* Show max 5 page numbers with ellipses */}
                      {(() => {
                        const pages = [];
                        const maxVisible = 5;
                        let start = Math.max(1, currentPage - 2);
                        let end = Math.min(totalPages, start + maxVisible - 1);

                        if (end - start < maxVisible - 1) {
                          start = Math.max(1, end - maxVisible + 1);
                        }

                        if (start > 1) {
                          pages.push(
                            <Button key={1} size="sm" color="secondary" outline onClick={() => setCurrentPage(1)} className="pagination-number">1</Button>
                          );
                          if (start > 2) {
                            pages.push(<span key="ellipsis-start" className="px-2">...</span>);
                          }
                        }

                        for (let i = start; i <= end; i++) {
                          pages.push(
                            <Button
                              key={i}
                              size="sm"
                              color={i === currentPage ? 'primary' : 'secondary'}
                              outline={i !== currentPage}
                              onClick={() => setCurrentPage(i)}
                              className="pagination-number"
                            >
                              {i}
                            </Button>
                          );
                        }

                        if (end < totalPages) {
                          if (end < totalPages - 1) {
                            pages.push(<span key="ellipsis-end" className="px-2">...</span>);
                          }
                          pages.push(
                            <Button key={totalPages} size="sm" color="secondary" outline onClick={() => setCurrentPage(totalPages)} className="pagination-number">{totalPages}</Button>
                          );
                        }

                        return pages;
                      })()}
                    </div>

                    <Button
                      color="primary"
                      outline
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="pagination-btn"
                    >
                      Suivant <FaChevronRight />
                    </Button>
                  </div>
                )}
              </Col>
            </Row>
          </TabPane>

          {/* Packs Tab */}
          <TabPane tabId="packs">
            <Row>
              <Col lg="12">
                <Card className="shadow-modern">
                  <CardHeader className="bg-transparent d-flex justify-content-between align-items-center">
                    <h4 className="mb-0"><FaBox className="mr-2 text-primary" />Gestion des Packs</h4>
                    <Button color="primary" onClick={() => openPackModal('create')}>
                      <FaPlusCircle className="mr-2" />Nouveau Pack
                    </Button>
                  </CardHeader>
                  <CardBody>
                    {loadingPacks ? (
                      <div className="text-center py-5">
                        <Spinner color="primary" />
                      </div>
                    ) : (
                      <Table responsive className="table-modern">
                        <thead>
                          <tr>
                            <th>Nom</th>
                            <th><FaClock className="mr-1" />Durée Min (s)</th>
                            <th><FaClock className="mr-1" />Durée Max (s)</th>
                            <th><FaMoneyBillWave className="mr-1" />Rémunération (FCFA)</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {packsList.map(pack => (
                            <motion.tr
                              key={pack.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <td>
                                <Badge
                                  color={
                                    pack.nom_pack === 'Agent' ? 'secondary' :
                                      pack.nom_pack === 'Gold' ? 'warning' :
                                        pack.nom_pack === 'Diamant' ? 'info' : 'primary'
                                  }
                                  className="pack-badge"
                                >
                                  {pack.nom_pack}
                                </Badge>
                              </td>
                              <td>{pack.duree_min_secondes}s</td>
                              <td>{pack.duree_max_secondes}s</td>
                              <td className="font-weight-bold text-success">
                                {pack.remuneration.toLocaleString('fr-FR')} FCFA
                              </td>
                              <td>
                                <Button
                                  size="sm"
                                  color="warning"
                                  className="mr-2"
                                  onClick={() => openPackModal('edit', pack)}
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  size="sm"
                                  color="danger"
                                  onClick={() => handleDeletePack(pack)}
                                >
                                  <FaTrash />
                                </Button>
                              </td>
                            </motion.tr>
                          ))}
                          {packsList.length === 0 && (
                            <tr>
                              <td colSpan="5" className="text-center text-muted py-4">
                                Aucun pack configuré
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    )}
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </TabContent>
      </Container>

      {/* Edit Commune Modal */}
      <Modal isOpen={editModal.open} toggle={() => setEditModal({ open: false, commune: null })} centered>
        <ModalHeader toggle={() => setEditModal({ open: false, commune: null })}>
          <FaEdit className="mr-2" />Renommer la Commune
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label>Nouveau nom</Label>
            <Input
              value={editNom}
              onChange={e => setEditNom(e.target.value)}
              placeholder="Entrez le nouveau nom..."
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setEditModal({ open: false, commune: null })}>
            Annuler
          </Button>
          <Button color="primary" onClick={handleEditCommune} disabled={editLoading}>
            {editLoading ? <Spinner size="sm" /> : 'Enregistrer'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={importModal} toggle={() => setImportModal(false)} size="lg" centered>
        <ModalHeader toggle={() => setImportModal(false)}>
          <FaFileImport className="mr-2" />Aperçu de l'import
        </ModalHeader>
        <ModalBody style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <p className="mb-3">
            <strong>{importPreview.length}</strong> commune(s) à importer. Les doublons seront ignorés.
          </p>
          <Table size="sm" striped>
            <thead>
              <tr>
                <th>Commune</th>
                <th>Ville/Région</th>
              </tr>
            </thead>
            <tbody>
              {importPreview.slice(0, 100).map((c, i) => (
                <tr key={i}>
                  <td>{c.nom}</td>
                  <td>{c.nom_ville || `ID: ${c.id_ville}`}</td>
                </tr>
              ))}
              {importPreview.length > 100 && (
                <tr>
                  <td colSpan="2" className="text-center text-muted">
                    ... et {importPreview.length - 100} autres
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setImportModal(false)}>Annuler</Button>
          <Button color="success" onClick={executeImport} disabled={importLoading}>
            {importLoading ? <Spinner size="sm" /> : <><FaCheckCircle className="mr-2" />Importer</>}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Pack Modal */}
      <Modal isOpen={packModal.open} toggle={() => setPackModal({ open: false, mode: 'create', pack: null })} centered>
        <ModalHeader toggle={() => setPackModal({ open: false, mode: 'create', pack: null })}>
          <FaBox className="mr-2" />
          {packModal.mode === 'create' ? 'Nouveau Pack' : 'Modifier le Pack'}
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label>Nom du pack</Label>
            <Input
              value={packForm.nom_pack}
              onChange={e => setPackForm({ ...packForm, nom_pack: e.target.value })}
              placeholder="Ex: Premium"
            />
          </FormGroup>
          <Row>
            <Col md="6">
              <FormGroup>
                <Label>Durée min (secondes)</Label>
                <Input
                  type="number"
                  value={packForm.duree_min_secondes}
                  onChange={e => setPackForm({ ...packForm, duree_min_secondes: e.target.value })}
                  placeholder="0"
                />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label>Durée max (secondes)</Label>
                <Input
                  type="number"
                  value={packForm.duree_max_secondes}
                  onChange={e => setPackForm({ ...packForm, duree_max_secondes: e.target.value })}
                  placeholder="60"
                />
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <Label>Rémunération (FCFA)</Label>
            <Input
              type="number"
              value={packForm.remuneration}
              onChange={e => setPackForm({ ...packForm, remuneration: e.target.value })}
              placeholder="100"
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setPackModal({ open: false, mode: 'create', pack: null })}>
            Annuler
          </Button>
          <Button color="primary" onClick={handlePackSubmit} disabled={packLoading}>
            {packLoading ? <Spinner size="sm" /> : (packModal.mode === 'create' ? 'Créer' : 'Enregistrer')}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default CommunesEtPacks;
