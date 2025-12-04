
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
      <div className="header pb-6 pt-5 pt-md-8 bg-white" style={{ minHeight: '100px' }}>
        {/* Helper spacer if needed, or remove completely if using fluid container directly */}
      </div>

      <Container className="mt--5" fluid>
        
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
                         <i className="fa fa-pencil pubcash-input-icon" />
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
                         <i className="fa fa-pencil pubcash-input-icon" />
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
                         <i className="fa fa-pencil pubcash-input-icon" />
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
                         <i className="fa fa-pencil pubcash-input-icon" />
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
                         <i className="fa fa-pencil pubcash-input-icon" />
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
                         <i className="fa fa-pencil pubcash-input-icon" />
                       </div>
                     </FormGroup>
                   </Col>
                 </Row>
               </div>
             </Form>
          </CardBody>
        </Card>

      </Container>

      {/* --- Modale d'Édition (Original Functional Modal) --- */}
      <Modal isOpen={isModalOpen} toggle={toggleModal} size="lg">
        <ModalHeader toggle={toggleModal}>Modifier mon profil</ModalHeader>
        <Form onSubmit={(e) => e.preventDefault()}>
          <ModalBody>
            <h6 className="heading-small text-muted mb-4">Informations Utilisateur</h6>
            <div className="pl-lg-4">
              <Row>
                <Col lg="6"><FormGroup><Label>Prénom</Label><Input type="text" name="prenom" value={editData.prenom || ''} onChange={handleInputChange} required /></FormGroup></Col>
                <Col lg="6"><FormGroup><Label>Nom</Label><Input type="text" name="nom" value={editData.nom || ''} onChange={handleInputChange} required /></FormGroup></Col>
              </Row>
              <Row>
                <Col lg="6"><FormGroup><Label>Nom d'utilisateur</Label><Input type="text" name="nom_utilisateur" value={editData.nom_utilisateur || ''} onChange={handleInputChange} required /></FormGroup></Col>
                <Col lg="6">
                  <FormGroup>
                    <Label>Numéro de téléphone</Label>
                    <Input
                      type="tel"
                      name="telephone"
                      value={editData.telephone || ''}
                      onChange={handleInputChange}
                      placeholder="Ex: 0701020304"
                      required
                    />
                  </FormGroup>
                </Col>
              </Row>
            </div>
            <hr className="my-4" />
            <h6 className="heading-small text-muted mb-4">Description</h6>
            <div className="pl-lg-4">
              <FormGroup><Input type="textarea" name="description" rows="4" placeholder="Quelques mots sur vous..." value={editData.description || ''} onChange={handleInputChange} /></FormGroup>
            </div>
            <hr className="my-4" />
            <h6 className="heading-small text-muted mb-4">Changer les Images</h6>
            <div className="pl-lg-4">
              <FormGroup>
                <Label>Image de profil</Label>
                <Input type="file" name="profileImage" accept="image/*" innerRef={profileImageRef} />
              </FormGroup>
              <FormGroup>
                <Label>Image de bannière</Label>
                <Input type="file" name="backgroundImage" accept="image/*" innerRef={backgroundImageRef} />
              </FormGroup>
            </div>
            <hr className="my-4" />
            <h6 className="heading-small text-muted mb-4">Changer de Mot de Passe</h6>
            <div className="pl-lg-4">
              <Row>
                <Col lg="6"><FormGroup><Label>Mot de passe actuel</Label><Input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} autoComplete="current-password" /></FormGroup></Col>
                <Col lg="6"><FormGroup><Label>Nouveau mot de passe</Label><Input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} autoComplete="new-password" /></FormGroup></Col>
              </Row>
            </div>
            {updateError && <div className="text-danger text-center mt-3"><small>{updateError}</small></div>}
            {updateSuccess && <div className="text-success text-center mt-3"><small>{updateSuccess}</small></div>}
            {isUpdating && (
            <div className="text-center mb-3">
              <Spinner size="sm" className="mr-2" />
              <small>Mise à jour en cours...</small>
            </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onClick={() => setIsPasswordConfirmModalOpen(true)}
              disabled={isUpdating}
            >
              {isUpdating ? <><Spinner size="sm" /> Enregistrement...</> : "Enregistrer"}
            </Button>
            <Button color="secondary" onClick={toggleModal}>Annuler</Button>
          </ModalFooter>
        </Form>
        <Modal isOpen={isPasswordConfirmModalOpen} toggle={() => setIsPasswordConfirmModalOpen(false)}>
            <ModalHeader toggle={() => setIsPasswordConfirmModalOpen(false)}>
            Confirmation requise
            </ModalHeader>
            <ModalBody>
            <p>Veuillez entrer votre mot de passe pour confirmer les modifications :</p>
            <Input
                type="password"
                placeholder="Mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoFocus
            />
            {updateError && <div className="text-danger mt-2"><small>{updateError}</small></div>}
            </ModalBody>
            <ModalFooter>
            <Button
                color="primary"
                onClick={() => handleUpdateProfile(confirmPassword)}
                disabled={isUpdating}
            >
                {isUpdating ? <><Spinner size="sm" /> Vérification...</> : "Confirmer"}
            </Button>
            <Button color="secondary" onClick={() => setIsPasswordConfirmModalOpen(false)}>Annuler</Button>
            </ModalFooter>
        </Modal>
      </Modal>
    </>
  );
};

export default Profile;