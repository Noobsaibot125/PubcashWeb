// Profile.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Button, Card, CardBody, FormGroup, Form, Input, Container, Row, Col,
  Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Label
} from 'reactstrap';
import api from '../../services/api';
import { getMediaUrl } from 'utils/mediaUrl';
import { useNavigate } from "react-router-dom";
const Profile = () => {
  // --- Component State ---
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  // Modale de confirmation MDP
  const [isPasswordConfirmModalOpen, setIsPasswordConfirmModalOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);

  const profileImageRef = useRef(null);
  const backgroundImageRef = useRef(null);

  // Modale de Feedback Admin
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackTab, setFeedbackTab] = useState('send'); // 'send' ou 'history'
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState(null);
  const [feedbackMessages, setFeedbackMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [feedbackFile, setFeedbackFile] = useState(null);
  const [replyFile, setReplyFile] = useState(null);
  const feedbackFileRef = useRef(null);
  const replyFileRef = useRef(null);
  // 2. NOUVEAUX STATES pour la suppression
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // State pour le popup de résultat de modification
  const [profileResultModal, setProfileResultModal] = useState(false);
  const [profileResultStatus, setProfileResultStatus] = useState(null); // 'success' | 'error'
  const [profileResultMessage, setProfileResultMessage] = useState('');
  // --- Fetch Logic ---
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/client/profile');
      const data = response.data;

      const profile_image_url = data.profile_image_url ? getMediaUrl(data.profile_image_url) : null;
      const background_image_url = data.background_image_url ? getMediaUrl(data.background_image_url) : null;

      const final = { ...data, profile_image_url, background_image_url };
      setProfile(final);
      setEditData(final);
    } catch (err) {
      console.error("Error fetchProfile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // --- Upload Logic ---
  const uploadImage = async (file, endpoint) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error(`Error upload ${endpoint}:`, error);
      throw error;
    }
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    setUpdateError('');
    setUpdateSuccess('');
    setPasswordData({ currentPassword: '', newPassword: '' });
    setPreviewAvatar(null);
    setPreviewBanner(null);
    if (profile) setEditData(profile);
  };

  const handleInputChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async () => {
    if (!confirmPassword) {
      setUpdateError("Veuillez entrer votre mot de passe actuel pour confirmer.");
      return;
    }

    setUpdateError('');
    setUpdateSuccess('');
    setIsUpdating(true);

    try {
      const updatePayload = {
        ...editData,
        currentPassword: confirmPassword,
        newPassword: passwordData.newPassword || null
      };

      await api.put('/client/profile', updatePayload);

      const profileImageFile = profileImageRef.current?.files[0];
      const backgroundImageFile = backgroundImageRef.current?.files[0];

      if (profileImageFile) {
        await uploadImage(profileImageFile, '/client/upload-profile-image');
      }
      if (backgroundImageFile) {
        await uploadImage(backgroundImageFile, '/client/upload-background-image');
      }

      setUpdateSuccess("Vos informations de profil ont bien été mises à jour ✅");
      await fetchProfile();

      // Fermer les modaux et afficher le popup de succès
      setIsPasswordConfirmModalOpen(false);
      setIsModalOpen(false);
      setConfirmPassword('');
      setPasswordData({ currentPassword: '', newPassword: '' });

      // Afficher le popup de succès
      setProfileResultStatus('success');
      setProfileResultMessage('Vos informations de profil ont bien été mises à jour !');
      setProfileResultModal(true);

      // Recharger la page après 2 secondes
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      const errorMessage = err.response?.data?.message || "Une erreur est survenue lors de la mise à jour.";
      setUpdateError(errorMessage);
      setIsPasswordConfirmModalOpen(false);

      // Afficher le popup d'erreur
      setProfileResultStatus('error');
      setProfileResultMessage(errorMessage);
      setProfileResultModal(true);
    } finally {
      setIsUpdating(false);
    }
  };
  // 3. NOUVELLE FONCTION : Gestion de la suppression
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Veuillez entrer votre mot de passe.");
      return;
    }
    setDeleteLoading(true);
    setDeleteError("");

    try {
      // On envoie l'ID du profil et le mot de passe
      await api.post('/auth/client/delete-account', {
        id: profile.id, // Assure-toi que profile contient l'ID
        password: deletePassword
      });

      // Succès : on ferme la modale et on déconnecte
      setIsDeleteModalOpen(false);
      // Ici tu devrais appeler ta fonction de logout globale ou nettoyer le localStorage
      localStorage.clear();
      navigate("/auth/login-client"); // Redirection vers login

    } catch (err) {
      setDeleteError(err.response?.data?.message || "Erreur lors de la suppression.");
    } finally {
      setDeleteLoading(false);
    }
  };
  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      if (type === 'avatar') setPreviewAvatar(objectUrl);
      if (type === 'banner') setPreviewBanner(objectUrl);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner color="primary" />
        <p className="mt-2">Chargement du profil...</p>
      </div>
    );
  }

  const defaultBanner = require("../../assets/img/theme/profile-cover.jpg");
  const defaultAvatar = require("../../assets/img/theme/team-4-800x800.jpg");

  // --- Gestion Feedback Admin ---
  const toggleFeedbackModal = () => {
    setIsFeedbackModalOpen(!isFeedbackModalOpen);
    setFeedbackMessage('');
    setFeedbackSuccess('');
    setFeedbackError('');
    setFeedbackTab('send');
    setSelectedFeedbackId(null);
    if (!isFeedbackModalOpen) {
      fetchMyFeedbacks();
    }
  };

  const fetchMyFeedbacks = async () => {
    try {
      const response = await api.get('/feedback');
      setMyFeedbacks(response.data || []);
    } catch (err) {
      console.error('Erreur chargement feedbacks:', err);
    }
  };

  const fetchFeedbackMessages = async (feedbackId) => {
    try {
      const response = await api.get(`/feedback/${feedbackId}/messages`);
      setFeedbackMessages(response.data || []);
    } catch (err) {
      console.error('Erreur chargement messages:', err);
    }
  };

  const handleSelectFeedback = (feedbackId) => {
    setSelectedFeedbackId(feedbackId);
    fetchFeedbackMessages(feedbackId);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() && !replyFile) return;
    setFeedbackLoading(true);
    try {
      const formData = new FormData();
      formData.append('message', replyMessage);
      if (replyFile) formData.append('file', replyFile);

      await api.post(`/feedback/${selectedFeedbackId}/reply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setReplyMessage('');
      setReplyFile(null);
      if (replyFileRef.current) replyFileRef.current.value = '';
      fetchFeedbackMessages(selectedFeedbackId);
    } catch (err) {
      console.error('Erreur envoi réponse:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackMessage.trim() && !feedbackFile) {
      setFeedbackError('Veuillez saisir un message ou joindre un fichier.');
      return;
    }
    setFeedbackLoading(true);
    setFeedbackError('');
    try {
      const formData = new FormData();
      formData.append('full_name', profile?.nom_utilisateur || `${profile?.prenom} ${profile?.nom}`);
      formData.append('email', profile?.email || '');
      formData.append('phone', profile?.telephone || '');
      formData.append('message', feedbackMessage);
      if (feedbackFile) formData.append('file', feedbackFile);

      await api.post('/feedback', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFeedbackSuccess('Message envoyé avec succès !');
      setFeedbackMessage('');
      setFeedbackFile(null);
      if (feedbackFileRef.current) feedbackFileRef.current.value = '';
      fetchMyFeedbacks();
      setTimeout(() => {
        setFeedbackTab('history');
        setFeedbackSuccess('');
      }, 1500);
    } catch (err) {
      setFeedbackError(err.response?.data?.message || 'Erreur lors de l\'envoi.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Helper pour savoir si c'est une entreprise
  const isEntreprise = profile?.type_compte === 'entreprise';

  return (
    <>
      <div className="header pt-5 pt-lg-8 d-flex align-items-center" style={{ minHeight: '50px' }}></div>

      <Container className="mt-3" fluid>
        {/* --- 1. Header Card --- */}
        <Card className="profile-header-card shadow">
          <div className="profile-banner-wrapper">
            <img
              alt="Bannière"
              className="profile-banner-img"
              src={profile?.background_image_url || defaultBanner}
            />
          </div>

          <div className="profile-user-info-row d-flex align-items-end">
            <div className="profile-avatar-container">
              <img
                alt="Avatar"
                className="profile-avatar-img"
                src={profile?.profile_image_url || defaultAvatar}
              />
            </div>

            <div className="profile-text-container flex-grow-1">
              <h3 className="profile-name mb-0">
                {isEntreprise
                  ? profile?.nom_entreprise
                  : `${profile?.prenom} ${profile?.nom}`
                }
              </h3>
              <div className="profile-location text-muted small">
                {profile?.commune || 'Localisation non définie'}
              </div>
              {isEntreprise && <span className="badge badge-pill badge-primary text-uppercase mt-1">Entreprise</span>}
            </div>

            {/* --- MODIFICATION ICI : BOUTONS --- */}
            <div className="profile-action-btn d-flex align-items-center">
              {/* Bouton Modifier : Reste Orange */}
              <Button
                className="btn-pubcash mr-2 shadow-sm"
                onClick={toggleModal}
                size="sm"
              >
                Modifier votre profil
              </Button>

              {/* Bouton Premium : Devient Blanc/Gris */}
              <Button
                className="shadow-sm border-0 mr-2"
                style={{ backgroundColor: '#f3f4f6', color: '#1f2937' }}
                href="/client/abonnement"
                size="sm"
              >
                <i className="ni ni-diamond mr-1 text-orange" />
                Premium
              </Button>

              {/* NOUVEAU: Bouton Contacter Admin */}
              <Button
                className="shadow-sm"
                color="info"
                size="sm"
                onClick={toggleFeedbackModal}
              >
                <i className="ni ni-support-16 mr-1" />
                Contacter l'Admin
              </Button>
            </div>
            {/* ---------------------------------- */}
          </div>
        </Card>

        {/* --- 2. Form Card (Read Only View) --- */}
        <Card className="profile-form-card shadow bg-white mt-4">
          <CardBody>
            <Form>
              <h6 className="heading-small text-muted mb-4">Informations Personnelles</h6>
              <div className="pl-lg-4">
                <Row>
                  {isEntreprise ? (
                    <>
                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label">Nom de l'Entreprise</label>
                          <Input
                            className="pubcash-input-readonly"
                            value={profile?.nom_entreprise || ''}
                            type="text"
                            readOnly
                          />
                        </FormGroup>
                      </Col>
                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label">N° RCCM</label>
                          <Input
                            className="pubcash-input-readonly"
                            value={profile?.rccm || ''}
                            type="text"
                            readOnly
                          />
                        </FormGroup>
                      </Col>
                    </>
                  ) : (
                    <>
                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label">Prénom</label>
                          <Input
                            className="pubcash-input-readonly"
                            value={profile?.prenom || ''}
                            type="text"
                            readOnly
                          />
                        </FormGroup>
                      </Col>
                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label">Nom</label>
                          <Input
                            className="pubcash-input-readonly"
                            value={profile?.nom || ''}
                            type="text"
                            readOnly
                          />
                        </FormGroup>
                      </Col>
                    </>
                  )}
                </Row>

                <Row>
                  <Col lg="6">
                    <FormGroup>
                      <label className="form-control-label">Nom d'utilisateur (Pseudo)</label>
                      <Input
                        className="pubcash-input-readonly"
                        value={profile?.nom_utilisateur || ''}
                        type="text"
                        readOnly
                      />
                    </FormGroup>
                  </Col>
                  <Col lg="6">
                    <FormGroup>
                      <label className="form-control-label">Email</label>
                      <Input
                        className="pubcash-input-readonly"
                        value={profile?.email || ''}
                        type="email"
                        readOnly
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col lg="6">
                    <FormGroup>
                      <label className="form-control-label">Téléphone</label>
                      <Input
                        className="pubcash-input-readonly"
                        value={profile?.telephone || 'Non renseigné'}
                        type="text"
                        readOnly
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <hr className="my-4" />
                <div className="d-flex justify-content-end align-items-center">
                  <div className="text-right">

                    <Button
                      color="danger"
                      size="sm"
                      type="button"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="shadow-sm"
                    >
                      <i className="ni ni-fat-remove mr-1" />
                      Supprimer mon compte
                    </Button>
                  </div>
                </div>
              </div>
            </Form>
          </CardBody>
        </Card>
      </Container>
      {/* --- NOUVELLE MODALE : CONFIRMATION SUPPRESSION --- */}
      <Modal
        isOpen={isDeleteModalOpen}
        toggle={() => setIsDeleteModalOpen(!isDeleteModalOpen)}
        className="modal-dialog-centered modal-danger" // 'modal-danger' donne un style rouge si supporté par ton thème, sinon c'est juste une classe
      >
        <div className="modal-header bg-white">
          <h6 className="modal-title text-danger font-weight-bold" id="modal-title-notification">
            Attention : Suppression de compte
          </h6>
          <button
            aria-label="Close"
            className="close"
            data-dismiss="modal"
            type="button"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <span aria-hidden={true}>×</span>
          </button>
        </div>
        <ModalBody className="bg-white">
          <div className="py-3 text-center">
            <i className="ni ni-bell-55 ni-3x text-danger mb-4"></i>

            {/* AJOUT DE 'text-dark' ICI */}
            <h4 className="heading mt-4 text-dark">Êtes-vous sûr ?</h4>

            {/* AJOUT DE 'text-muted' (gris) ou 'text-dark' (noir) ICI */}
            <p className="text-muted mb-4">
              Cette action programmera la suppression de votre compte.<br />
              Vous disposez de <strong>45 jours</strong> pour réactiver votre compte en vous connectant simplement.<br />
              Passé ce délai, vos données seront <strong>définitivement perdues</strong>.
            </p>

            <FormGroup className="mt-4 text-left">
              {/* AJOUT DE 'text-dark' SUR LE LABEL */}
              <Label className="font-weight-bold text-sm text-dark">Entrez votre mot de passe pour confirmer :</Label>
              <Input
                type="password"
                placeholder="Mot de passe"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className={deleteError ? "is-invalid text-dark" : "text-dark"} // Force le texte de l'input en noir aussi
                style={{ color: '#000' }} // Sécurité supplémentaire pour l'input
              />
              {deleteError && <div className="invalid-feedback d-block">{deleteError}</div>}
            </FormGroup>
          </div>
        </ModalBody>
        <ModalFooter className="bg-white">
          <Button
            className="text-white ml-auto"
            color="danger"
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
          >
            {deleteLoading ? <Spinner size="sm" /> : "Oui, supprimer mon compte"}
          </Button>
          <Button
            className="ml-2 text-primary"
            color="link"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Annuler
          </Button>
        </ModalFooter>
      </Modal>
      {/* --- Modale d'Édition --- */}
      <Modal isOpen={isModalOpen} toggle={toggleModal} size="lg" contentClassName="bg-secondary border-0">
        <div className="modal-header bg-white pb-3">
          <h4 className="modal-title mb-0 font-weight-bold text-uppercase ls-1 text-primary">
            Modifier mon profil
          </h4>
          <button aria-label="Close" className="close" type="button" onClick={toggleModal}>
            <span aria-hidden={true}>×</span>
          </button>
        </div>

        <ModalBody className="p-0">
          <div className="position-relative" style={{ height: '200px' }}>
            <input type="file" ref={backgroundImageRef} className="d-none" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
            <input type="file" ref={profileImageRef} className="d-none" accept="image/*" onChange={(e) => handleImageChange(e, 'avatar')} />

            <div
              className="w-100 h-100 position-absolute"
              style={{
                backgroundImage: `url(${previewBanner || editData.background_image_url || defaultBanner})`,
                backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'pointer'
              }}
              onClick={() => backgroundImageRef.current.click()}
            >
              <div className="w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)', opacity: 0, transition: '0.3s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <i className="ni ni-camera-compact text-white fa-2x"></i>
              </div>
            </div>

            <div
              className="position-absolute shadow rounded-circle overflow-hidden bg-white"
              style={{
                width: '120px', height: '120px', bottom: '-60px', left: '50%', transform: 'translateX(-50%)',
                cursor: 'pointer', zIndex: 10, border: '4px solid white'
              }}
              onClick={() => profileImageRef.current.click()}
            >
              <img
                src={previewAvatar || editData.profile_image_url || defaultAvatar}
                alt="avatar" className="w-100 h-100" style={{ objectFit: 'cover' }}
              />
              <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center bg-dark" style={{ top: 0, left: 0, opacity: 0, transition: '0.3s' }} onMouseEnter={e => e.target.style.opacity = 0.6} onMouseLeave={e => e.target.style.opacity = 0}>
                <i className="ni ni-camera-compact text-white"></i>
              </div>
            </div>
          </div>
          <div style={{ height: '70px' }}></div>

          <div className="px-4 py-4">
            <Form onSubmit={(e) => e.preventDefault()}>
              <h6 className="heading-small text-muted mb-4">Informations personnelles</h6>
              <div className="pl-lg-2">
                <Row>
                  {isEntreprise ? (
                    <>
                      <Col lg="6">
                        <FormGroup>
                          <Label className="form-control-label font-weight-bold">Nom de l'Entreprise</Label>
                          <Input
                            type="text"
                            name="nom_entreprise"
                            value={editData.nom_entreprise || ''}
                            onChange={handleInputChange}
                          />
                        </FormGroup>
                      </Col>
                      <Col lg="6">
                        <FormGroup>
                          <Label className="form-control-label font-weight-bold">N° RCCM</Label>
                          <Input
                            type="text"
                            name="rccm"
                            value={editData.rccm || ''}
                            onChange={handleInputChange}
                          />
                        </FormGroup>
                      </Col>
                    </>
                  ) : (
                    <>
                      <Col lg="6">
                        <FormGroup>
                          <Label className="form-control-label font-weight-bold">Prénom</Label>
                          <Input
                            type="text"
                            name="prenom"
                            value={editData.prenom || ''}
                            onChange={handleInputChange}
                          />
                        </FormGroup>
                      </Col>
                      <Col lg="6">
                        <FormGroup>
                          <Label className="form-control-label font-weight-bold">Nom</Label>
                          <Input
                            type="text"
                            name="nom"
                            value={editData.nom || ''}
                            onChange={handleInputChange}
                          />
                        </FormGroup>
                      </Col>
                    </>
                  )}
                </Row>

                <Row>
                  <Col lg="6">
                    <FormGroup>
                      <Label className="form-control-label font-weight-bold">Pseudo / Nom d'utilisateur</Label>
                      <Input
                        type="text"
                        name="nom_utilisateur"
                        value={editData.nom_utilisateur || ''}
                        onChange={handleInputChange}
                      />
                    </FormGroup>
                  </Col>
                  <Col lg="6">
                    <FormGroup>
                      <Label className="form-control-label font-weight-bold">Téléphone</Label>
                      <Input
                        type="tel"
                        name="telephone"
                        value={editData.telephone || ''}
                        onChange={handleInputChange}
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <FormGroup>
                  <Label className="form-control-label font-weight-bold">Bio</Label>
                  <Input
                    type="textarea"
                    name="description"
                    rows="3"
                    value={editData.description || ''}
                    onChange={handleInputChange}
                  />
                </FormGroup>
              </div>

              <hr className="my-4 border-light" />
              <h6 className="heading-small text-muted mb-4">Sécurité <small>(Pour changer le mot de passe)</small></h6>
              <div className="bg-white p-3 rounded shadow-sm border">
                <Row>
                  <Col lg="12">
                    <FormGroup className="mb-0">
                      <Label className="text-xs font-weight-bold text-uppercase">Nouveau mot de passe (Optionnel)</Label>
                      <Input
                        className="form-control-alternative"
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Laisser vide si inchangé"
                        autoComplete="new-password"
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </div>

              {updateError && (
                <div className="alert alert-danger mt-4 text-center">
                  <span className="alert-inner--text">{updateError}</span>
                </div>
              )}
              {updateSuccess && (
                <div className="alert alert-success mt-4 text-center">
                  <span className="alert-inner--text">{updateSuccess}</span>
                </div>
              )}
            </Form>
          </div>
        </ModalBody>

        <ModalFooter className="bg-secondary border-top-0 pt-0 pb-4 justify-content-between px-4">
          <Button color="link" className="text-muted" onClick={toggleModal}>Annuler</Button>
          <Button className="btn-icon shadow" color="primary" onClick={() => setIsPasswordConfirmModalOpen(true)} disabled={isUpdating}>
            <span className="btn-inner--icon"><i className="ni ni-check-bold mr-2"></i></span>
            <span className="btn-inner--text">Enregistrer</span>
          </Button>
        </ModalFooter>
      </Modal>

      {/* --- Modale Confirmation --- */}
      <Modal isOpen={isPasswordConfirmModalOpen} toggle={() => setIsPasswordConfirmModalOpen(!isPasswordConfirmModalOpen)} className="modal-dialog-centered modal-sm">
        <ModalHeader toggle={() => setIsPasswordConfirmModalOpen(false)}>Confirmation requise</ModalHeader>
        <ModalBody>
          <div className="text-center mb-3">
            <i className="ni ni-lock-circle-open fa-3x text-primary"></i>
            <p className="mt-2 text-muted text-sm">Pour valider les modifications, veuillez saisir votre mot de passe <strong>actuel</strong>.</p>
          </div>
          <FormGroup>
            <Input type="password" placeholder="Votre mot de passe actuel" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoFocus />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" size="sm" onClick={() => setIsPasswordConfirmModalOpen(false)}>Annuler</Button>
          <Button color="primary" size="sm" onClick={handleUpdateProfile} disabled={isUpdating || !confirmPassword}>
            {isUpdating ? <Spinner size="sm" /> : "Confirmer"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* --- Modale Feedback Admin avec Onglets --- */}
      <Modal isOpen={isFeedbackModalOpen} toggle={toggleFeedbackModal} className="modal-dialog-centered" size="lg">
        <ModalHeader toggle={toggleFeedbackModal}>
          <i className="ni ni-support-16 mr-2 text-info" />
          Support & Feedback
        </ModalHeader>
        <ModalBody className="p-0">
          {/* Onglets */}
          <div className="d-flex border-bottom">
            <button
              className={`flex-fill py-3 border-0 bg-transparent font-weight-bold ${feedbackTab === 'send' ? 'text-primary border-bottom border-primary' : 'text-muted'}`}
              style={{ borderBottom: feedbackTab === 'send' ? '3px solid' : 'none' }}
              onClick={() => { setFeedbackTab('send'); setSelectedFeedbackId(null); }}
            >
              <i className="ni ni-send mr-1" /> Nouveau message
            </button>
            <button
              className={`flex-fill py-3 border-0 bg-transparent font-weight-bold ${feedbackTab === 'history' ? 'text-primary border-bottom border-primary' : 'text-muted'}`}
              style={{ borderBottom: feedbackTab === 'history' ? '3px solid' : 'none' }}
              onClick={() => { setFeedbackTab('history'); fetchMyFeedbacks(); }}
            >
              <i className="ni ni-archive-2 mr-1" /> Mes conversations
            </button>
          </div>

          {/* Contenu selon l'onglet */}
          <div className="p-4">
            {feedbackTab === 'send' ? (
              /* --- Onglet Envoyer --- */
              <>
                <p className="text-muted mb-3">
                  Une question, un problème ou une suggestion ? Envoyez un message à notre équipe.
                </p>
                <FormGroup>
                  <Label className="form-control-label">Votre message</Label>
                  <Input
                    type="textarea"
                    rows="4"
                    placeholder="Décrivez votre demande en détail..."
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    disabled={feedbackLoading}
                  />
                </FormGroup>
                <FormGroup>
                  <Label className="form-control-label d-flex align-items-center">
                    <i className="ni ni-cloud-upload-96 mr-2" /> Pièce jointe (optionnel)
                  </Label>
                  <div className="custom-file">
                    <input
                      type="file"
                      className="custom-file-input"
                      id="feedbackFileInput"
                      ref={feedbackFileRef}
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => setFeedbackFile(e.target.files[0])}
                      disabled={feedbackLoading}
                    />
                    <label className="custom-file-label" htmlFor="feedbackFileInput">
                      {feedbackFile ? feedbackFile.name : 'Choisir un fichier...'}
                    </label>
                  </div>
                  <small className="text-muted">Images, PDF, Word, Excel (max 10MB)</small>
                </FormGroup>
                {feedbackError && <div className="alert alert-danger py-2"><small>{feedbackError}</small></div>}
                {feedbackSuccess && <div className="alert alert-success py-2"><small>{feedbackSuccess}</small></div>}
                <div className="text-right">
                  <Button color="info" onClick={handleSendFeedback} disabled={feedbackLoading || (!feedbackMessage.trim() && !feedbackFile)}>
                    {feedbackLoading ? <Spinner size="sm" /> : <><i className="ni ni-send mr-1" /> Envoyer</>}
                  </Button>
                </div>
              </>
            ) : (
              /* --- Onglet Historique --- */
              <div className="d-flex" style={{ minHeight: '350px' }}>
                {/* Liste des tickets */}
                <div className="border-right pr-3" style={{ width: '40%', overflowY: 'auto', maxHeight: '350px' }}>
                  {myFeedbacks.length === 0 ? (
                    <p className="text-muted text-center">Aucune conversation</p>
                  ) : (
                    myFeedbacks.map((fb) => (
                      <div
                        key={fb.id}
                        className={`p-2 mb-2 rounded cursor-pointer ${selectedFeedbackId === fb.id ? 'bg-primary text-white' : 'bg-light'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSelectFeedback(fb.id)}
                      >
                        <small className="d-block text-truncate font-weight-bold">{fb.message?.substring(0, 50)}...</small>
                        <small className={selectedFeedbackId === fb.id ? 'text-white-50' : 'text-muted'}>
                          {fb.created_at ? new Date(fb.created_at).toLocaleDateString('fr-FR') : ''}
                        </small>
                      </div>
                    ))
                  )}
                </div>

                {/* Zone de chat */}
                <div className="pl-3 d-flex flex-column" style={{ width: '60%' }}>
                  {selectedFeedbackId ? (
                    <>
                      <div className="flex-grow-1 mb-3" style={{ overflowY: 'auto', maxHeight: '220px', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '10px' }}>
                        {feedbackMessages.map((msg, idx) => {
                          const isAdmin = msg.sender_type === 'admin';
                          return (
                            <div key={idx} className={`mb-2 d-flex ${isAdmin ? 'justify-content-start' : 'justify-content-end'}`}>
                              <div className={`px-3 py-2 rounded shadow-sm ${isAdmin ? 'bg-light text-dark' : 'bg-primary text-white'}`} style={{ maxWidth: '80%' }}>
                                <small className="d-block font-weight-bold mb-1">{isAdmin ? 'Admin' : 'Vous'}</small>
                                {msg.message && <p className="mb-1" style={{ fontSize: '13px' }}>{msg.message}</p>}
                                {msg.file_url && (
                                  <div className="mt-1">
                                    {msg.file_type === 'image' ? (
                                      <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                                        <img src={msg.file_url} alt="Pièce jointe" style={{ maxWidth: '150px', borderRadius: '4px' }} />
                                      </a>
                                    ) : (
                                      <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className={isAdmin ? 'text-primary' : 'text-white-50'}>
                                        <i className="ni ni-single-copy-04 mr-1" />{msg.file_name || 'Fichier'}
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Zone de réponse avec fichier */}
                      <div>
                        {replyFile && (
                          <div className="mb-2 p-2 bg-light rounded d-flex justify-content-between align-items-center">
                            <small><i className="ni ni-attach-87 mr-1" />{replyFile.name}</small>
                            <button className="btn btn-sm btn-link text-danger p-0" onClick={() => { setReplyFile(null); if (replyFileRef.current) replyFileRef.current.value = ''; }}>
                              <i className="ni ni-fat-remove" />
                            </button>
                          </div>
                        )}
                        <div className="d-flex align-items-center">
                          <input
                            type="file"
                            ref={replyFileRef}
                            className="d-none"
                            accept="image/*,.pdf,.doc,.docx"
                            onChange={(e) => setReplyFile(e.target.files[0])}
                          />
                          <Button color="light" size="sm" className="mr-2" onClick={() => replyFileRef.current?.click()} disabled={feedbackLoading}>
                            <i className="ni ni-cloud-upload-96" />
                          </Button>
                          <Input
                            type="text"
                            placeholder="Répondre..."
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                            disabled={feedbackLoading}
                            className="mr-2"
                          />
                          <Button color="primary" size="sm" onClick={handleSendReply} disabled={feedbackLoading || (!replyMessage.trim() && !replyFile)}>
                            <i className="ni ni-send" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                      <div className="text-center">
                        <i className="ni ni-chat-round fa-2x mb-2" />
                        <p>Sélectionnez une conversation</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ModalBody>
      </Modal>

      {/* Modal Popup de résultat de modification du profil */}
      <Modal isOpen={profileResultModal} centered backdrop="static" keyboard={false}>
        <ModalHeader
          className={profileResultStatus === 'success' ? 'bg-success text-white' : 'bg-danger text-white'}
          style={{ borderBottom: 'none' }}
        >
          <i className={`fas ${profileResultStatus === 'success' ? 'fa-check-circle' : 'fa-times-circle'} mr-2`}></i>
          {profileResultStatus === 'success' ? 'Modification réussie !' : 'Erreur de modification'}
        </ModalHeader>
        <ModalBody className="text-center py-4">
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>
            {profileResultStatus === 'success' ? '✅' : '❌'}
          </div>
          <h4 className={profileResultStatus === 'success' ? 'text-success' : 'text-danger'}>
            {profileResultMessage}
          </h4>
          {profileResultStatus === 'success' && (
            <p className="text-muted mt-3">
              La page va se recharger automatiquement...
            </p>
          )}
        </ModalBody>
        <ModalFooter className="justify-content-center border-0">
          <Button
            color={profileResultStatus === 'success' ? 'success' : 'danger'}
            onClick={() => {
              setProfileResultModal(false);
              if (profileResultStatus === 'success') window.location.reload();
            }}
          >
            {profileResultStatus === 'success' ? 'Fermer' : 'Réessayer'}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default Profile;