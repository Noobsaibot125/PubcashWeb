
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Button, Card, CardBody, FormGroup, Form, Input, Container, Row, Col,
  Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Label
} from 'reactstrap';
// Removed DynamicUserHeader as we are building a custom header inside the view
import api from '../../services/api';
import { getMediaUrl } from 'utils/mediaUrl';

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
  const [isPasswordConfirmModalOpen, setIsPasswordConfirmModalOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);
  // Refs for file inputs
  const profileImageRef = useRef(null);
  const backgroundImageRef = useRef(null);

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
    if (profile) setEditData(profile);
  };

  const handleInputChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (password) => {
    setUpdateError('');
    setUpdateSuccess('');
    setIsUpdating(true);

    try {
      const updatePayload = {
        ...editData,
        currentPassword: password,
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

      setTimeout(() => {
        setIsPasswordConfirmModalOpen(false);
        setIsModalOpen(false);
        setConfirmPassword('');
        setPasswordData({ currentPassword: '', newPassword: '' });
        setUpdateSuccess('');
      }, 1500);

    } catch (err) {
      const errorMessage = err.response?.data?.message || "Une erreur est survenue lors de la mise à jour.";
      setUpdateError(errorMessage);
    } finally {
      setIsUpdating(false);
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

  // --- RENDER ---
  // Using default assets if profile data is missing
  const defaultBanner = require("../../assets/img/theme/profile-cover.jpg");
  const defaultAvatar = require("../../assets/img/theme/team-4-800x800.jpg");

  return (
    <>
      {/* --- SOLUTION CORRIGÉE : Espaceur invisible --- */}
      {/* On garde juste un padding pour que le contenu ne passe pas sous la barre de menu */}
      <div className="header pt-5 pt-lg-8 d-flex align-items-center" style={{ minHeight: '50px' }}>
        {/* Pas de background image ici, juste de l'espace */}
      </div>
      {/* ----------------------------- */}

      {/* On enlève le "mt--5" pour que la carte ne remonte pas, on met mt-3 pour un petit espace propre */}
      <Container className="mt-3" fluid>

        {/* --- 1. Header Card (Banner + Avatar + Info) --- */}
        <Card className="profile-header-card shadow">
          <div className="profile-banner-wrapper">
            <img
              alt="Bannière"
              className="profile-banner-img"
              src={profile?.background_image_url || defaultBanner}
            />
          </div>

          <div className="profile-user-info-row">
            <div className="profile-avatar-container">
              <img
                alt="Avatar"
                className="profile-avatar-img"
                src={profile?.profile_image_url || defaultAvatar}
              />
            </div>

            <div className="profile-text-container">
              <h3 className="profile-name">
                {profile?.prenom} {profile?.nom}
              </h3>
              <div className="profile-location">
                {profile?.commune || 'Localisation non définie'}
              </div>
            </div>

            <div className="profile-action-btn">
              <Button
                className="btn-pubcash"
                onClick={toggleModal}
              >
                Modifier votre profil
              </Button>
              <Button
                className="btn-pubcash ml-2"
                color="warning"
                href="/client/abonnement"
              >
                <i className="ni ni-diamond mr-2" />
                Abonnement Premium
              </Button>
            </div>
          </div>
        </Card>

        {/* --- 2. Form Card (Read Only View) --- */}
        <Card className="profile-form-card shadow bg-white">
          <CardBody>
            <Form>
              <h6 className="heading-small text-muted mb-4">Informations Personnelles</h6>
              <div className="pl-lg-4">
                <Row>
                  <Col lg="6">
                    <FormGroup>
                      <label className="form-control-label">Nom d'utilisateur</label>
                      <div className="pubcash-input-group">
                        <Input
                          className="pubcash-input-readonly"
                          value={profile?.nom_utilisateur || ''}
                          type="text"
                          readOnly
                        />

                      </div>
                    </FormGroup>
                  </Col>
                  <Col lg="6">
                    <FormGroup>
                      <label className="form-control-label">Email</label>
                      <div className="pubcash-input-group">
                        <Input
                          className="pubcash-input-readonly"
                          value={profile?.email || ''}
                          type="email"
                          readOnly
                        />

                      </div>
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col lg="6">
                    <FormGroup>
                      <label className="form-control-label">Prénom</label>
                      <div className="pubcash-input-group">
                        <Input
                          className="pubcash-input-readonly"
                          value={profile?.prenom || ''}
                          type="text"
                          readOnly
                        />

                      </div>
                    </FormGroup>
                  </Col>
                  <Col lg="6">
                    <FormGroup>
                      <label className="form-control-label">Nom</label>
                      <div className="pubcash-input-group">
                        <Input
                          className="pubcash-input-readonly"
                          value={profile?.nom || ''}
                          type="text"
                          readOnly
                        />

                      </div>
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col lg="6">
                    <FormGroup>
                      <label className="form-control-label">Téléphone</label>
                      <div className="pubcash-input-group">
                        <Input
                          className="pubcash-input-readonly"
                          value={profile?.telephone || 'Non renseigné'}
                          type="text"
                          readOnly
                        />

                      </div>
                    </FormGroup>
                  </Col>
                  <Col lg="6">
                    {/* Placeholder for Phone Indicator or other field if needed, matching mockup balance */}
                    <FormGroup>
                      <label className="form-control-label">Indicateur téléphonique</label>
                      <div className="pubcash-input-group">
                        <Input
                          className="pubcash-input-readonly"
                          value="225" // Hardcoded for CI or derived
                          type="text"
                          readOnly
                        />

                      </div>
                    </FormGroup>
                  </Col>
                </Row>
              </div>
            </Form>
          </CardBody>
        </Card>

      </Container>

      {/* --- Modale d'Édition Stylisée --- */}
      <Modal
        isOpen={isModalOpen}
        toggle={toggleModal}
        size="lg"
        contentClassName="bg-secondary border-0" // Fond gris clair pour contraste
      >
        <div className="modal-header bg-white pb-3">
          <h4 className="modal-title mb-0 font-weight-bold text-uppercase ls-1 text-primary">
            Modifier mon profil
          </h4>
          <button
            aria-label="Close"
            className="close"
            type="button"
            onClick={toggleModal}
          >
            <span aria-hidden={true}>×</span>
          </button>
        </div>

        <ModalBody className="p-0">
          {/* ZONE 1 : ÉDITION VISUELLE (Bannière + Avatar) */}
          <div className="position-relative" style={{ height: '200px' }}>

            {/* Input cachés pour les fichiers */}
            <input type="file" ref={backgroundImageRef} className="d-none" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
            <input type="file" ref={profileImageRef} className="d-none" accept="image/*" onChange={(e) => handleImageChange(e, 'avatar')} />

            {/* Zone Bannière Cliquable */}
            <div
              className="w-100 h-100 position-absolute"
              style={{
                backgroundImage: `url(${previewBanner || editData.background_image_url || require("../../assets/img/theme/profile-cover.jpg")})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                cursor: 'pointer'
              }}
              onClick={() => backgroundImageRef.current.click()}
              title="Cliquez pour changer la bannière"
            >
              <div className="w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)', opacity: 0, transition: '0.3s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <i className="ni ni-camera-compact text-white fa-2x"></i>
              </div>
            </div>

            {/* Zone Avatar Cliquable (Flottant) */}
            <div
              className="position-absolute shadow rounded-circle overflow-hidden bg-white"
              style={{
                width: '120px',
                height: '120px',
                bottom: '-60px',
                left: '50%',
                transform: 'translateX(-50%)',
                cursor: 'pointer',
                zIndex: 10,
                border: '4px solid white'
              }}
              onClick={() => profileImageRef.current.click()}
              title="Cliquez pour changer la photo"
            >
              <img
                src={previewAvatar || editData.profile_image_url || require("../../assets/img/theme/team-4-800x800.jpg")}
                alt="avatar"
                className="w-100 h-100"
                style={{ objectFit: 'cover' }}
              />
              <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center bg-dark" style={{ top: 0, left: 0, opacity: 0, transition: '0.3s' }} onMouseEnter={e => e.target.style.opacity = 0.6} onMouseLeave={e => e.target.style.opacity = 0}>
                <i className="ni ni-camera-compact text-white"></i>
              </div>
            </div>
          </div>

          {/* Espaceur pour l'avatar qui dépasse */}
          <div style={{ height: '70px' }}></div>

          {/* ZONE 2 : FORMULAIRE */}
          <div className="px-4 py-4">
            <Form onSubmit={(e) => e.preventDefault()}>
              <h6 className="heading-small text-muted mb-4">Informations personnelles</h6>

              <div className="pl-lg-2">
                <Row>
                  <Col lg="6">
                    <FormGroup>
                      <Label className="form-control-label font-weight-bold">Prénom</Label>
                      <div className="input-group input-group-merge input-group-alternative shadow-sm">
                        <div className="input-group-prepend">
                          <span className="input-group-text"><i className="ni ni-single-02"></i></span>
                        </div>
                        <Input
                          type="text"
                          name="prenom"
                          value={editData.prenom || ''}
                          onChange={handleInputChange}
                          placeholder="Prénom"
                        />
                      </div>
                    </FormGroup>
                  </Col>
                  <Col lg="6">
                    <FormGroup>
                      <Label className="form-control-label font-weight-bold">Nom</Label>
                      <div className="input-group input-group-merge input-group-alternative shadow-sm">
                        <div className="input-group-prepend">
                          <span className="input-group-text"><i className="ni ni-single-02"></i></span>
                        </div>
                        <Input
                          type="text"
                          name="nom"
                          value={editData.nom || ''}
                          onChange={handleInputChange}
                          placeholder="Nom"
                        />
                      </div>
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col lg="6">
                    <FormGroup>
                      <Label className="form-control-label font-weight-bold">Pseudo</Label>
                      <div className="input-group input-group-merge input-group-alternative shadow-sm">
                        <div className="input-group-prepend">
                          <span className="input-group-text">@</span>
                        </div>
                        <Input
                          type="text"
                          name="nom_utilisateur"
                          value={editData.nom_utilisateur || ''}
                          onChange={handleInputChange}
                          placeholder="Username"
                        />
                      </div>
                    </FormGroup>
                  </Col>
                  <Col lg="6">
                    <FormGroup>
                      <Label className="form-control-label font-weight-bold">Téléphone</Label>
                      <div className="input-group input-group-merge input-group-alternative shadow-sm">
                        <div className="input-group-prepend">
                          <span className="input-group-text"><i className="ni ni-mobile-button"></i></span>
                        </div>
                        <Input
                          type="tel"
                          name="telephone"
                          value={editData.telephone || ''}
                          onChange={handleInputChange}
                          placeholder="0701020304"
                        />
                      </div>
                    </FormGroup>
                  </Col>
                </Row>

                <FormGroup>
                  <Label className="form-control-label font-weight-bold">Bio</Label>
                  <Input
                    className="form-control-alternative shadow-sm"
                    type="textarea"
                    name="description"
                    rows="3"
                    value={editData.description || ''}
                    onChange={handleInputChange}
                    placeholder="Décrivez-vous en quelques mots..."
                  />
                </FormGroup>
              </div>

              <hr className="my-4 border-light" />

              {/* ZONE 3 : SÉCURITÉ */}
              <h6 className="heading-small text-muted mb-4">Sécurité <small>(Laisser vide si inchangé)</small></h6>
              <div className="bg-white p-3 rounded shadow-sm border">
                <Row>
                  <Col lg="6">
                    <FormGroup className="mb-0">
                      <Label className="text-xs font-weight-bold text-uppercase">Mot de passe actuel</Label>
                      <Input
                        className="form-control-alternative"
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="******"
                        autoComplete="new-password"
                      />
                    </FormGroup>
                  </Col>
                  <Col lg="6">
                    <FormGroup className="mb-0">
                      <Label className="text-xs font-weight-bold text-uppercase">Nouveau mot de passe</Label>
                      <Input
                        className="form-control-alternative"
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="******"
                        autoComplete="new-password"
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </div>

              {/* MESSAGES D'ÉTAT */}
              {updateError && (
                <div className="alert alert-danger mt-4 text-center fade show">
                  <span className="alert-inner--icon"><i className="ni ni-support-16"></i></span>
                  <span className="alert-inner--text ml-2">{updateError}</span>
                </div>
              )}
              {updateSuccess && (
                <div className="alert alert-success mt-4 text-center fade show">
                  <span className="alert-inner--icon"><i className="ni ni-check-bold"></i></span>
                  <span className="alert-inner--text ml-2">{updateSuccess}</span>
                </div>
              )}
              {isUpdating && (
                <div className="text-center mt-3">
                  <Spinner color="primary" size="sm" /> <small className="text-muted ml-2">Mise à jour en cours...</small>
                </div>
              )}

            </Form>
          </div>
        </ModalBody>

        <ModalFooter className="bg-secondary border-top-0 pt-0 pb-4 justify-content-between px-4">
          <Button
            color="link"
            className="text-muted"
            onClick={toggleModal}
          >
            Annuler
          </Button>
          <Button
            className="btn-icon shadow"
            color="primary"
            onClick={() => setIsPasswordConfirmModalOpen(true)}
            disabled={isUpdating}
          >
            <span className="btn-inner--icon"><i className="ni ni-check-bold mr-2"></i></span>
            <span className="btn-inner--text">Enregistrer</span>
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default Profile;