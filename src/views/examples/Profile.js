import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Button, Card, CardBody, FormGroup, Form, Input, Container, Row, Col,
  Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Label
} from 'reactstrap';
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
  
  // Modale de confirmation MDP
  const [isPasswordConfirmModalOpen, setIsPasswordConfirmModalOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);
  
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
      setIsPasswordConfirmModalOpen(false);
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

  const defaultBanner = require("../../assets/img/theme/profile-cover.jpg");
  const defaultAvatar = require("../../assets/img/theme/team-4-800x800.jpg");

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
                {/* AFFICHER NOM ENTREPRISE SI ENTREPRISE, SINON PRENOM NOM */}
                {isEntreprise 
                    ? profile?.nom_entreprise 
                    : `${profile?.prenom} ${profile?.nom}`
                }
              </h3>
              <div className="profile-location">
                {profile?.commune || 'Localisation non définie'}
              </div>
              {/* Petit badge pour indiquer le type */}
              {isEntreprise && <span className="badge badge-pill badge-primary text-uppercase mt-1">Entreprise</span>}
            </div>

            <div className="profile-action-btn">
              <Button className="btn-pubcash" onClick={toggleModal}>
                Modifier votre profil
              </Button>
              <Button className="btn-pubcash ml-2" color="warning" href="/client/abonnement">
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
                  {/* Affichage conditionnel selon le type de compte */}
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
              </div>
            </Form>
          </CardBody>
        </Card>
      </Container>

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
          {/* Images Upload (Pas de changement ici) */}
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

          {/* Formulaire Édition */}
          <div className="px-4 py-4">
            <Form onSubmit={(e) => e.preventDefault()}>
              <h6 className="heading-small text-muted mb-4">Informations personnelles</h6>
              <div className="pl-lg-2">
                <Row>
                  {/* AFFICHAGE CONDITIONNEL DANS LA MODALE AUSSI */}
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
                                // Si tu ne veux pas qu'ils modifient le RCCM, ajoute readOnly
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
                {isUpdating ? <Spinner size="sm"/> : "Confirmer"}
            </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default Profile;