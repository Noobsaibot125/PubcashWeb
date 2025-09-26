// src/views/examples/UserProfile.js  (remplace le fichier entier par ceci)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button, Card, CardHeader, CardBody, FormGroup, Form, Input, Container, Row, Col,
  Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Label
} from 'reactstrap';
import DynamicUserHeader from "components/Headers/DynamicUserHeader.js";
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import UserNavbar from 'components/Navbars/UserNavbar.js';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // confirmation modal state
  const [isPasswordConfirmModalOpen, setIsPasswordConfirmModalOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const profileImageRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setUpdateError('');
    try {
      const response = await api.get('/user/profile');

      const profileData = {
        ...response.data,
        profile_image_url: response.data.profile_image_url || (response.data.photo_profil ? `${process.env.REACT_APP_API_URL || ''}/uploads/profile/${response.data.photo_profil}` : null),
        background_image_url: response.data.background_image_url || (response.data.image_background ? `${process.env.REACT_APP_API_URL || ''}/uploads/background/${response.data.image_background}` : null)
      };

      setProfile(profileData);
      setEditData(profileData);
    } catch (err) {
      console.error("Erreur lors de la récupération du profil", err);
      if (err.response) {
        if (err.response.status === 401 || err.response.status === 403) {
          setUpdateError("Accès refusé. Veuillez vous reconnecter.");
        } else {
          setUpdateError(err.response.data.message || "Impossible de charger les informations du profil.");
        }
      } else {
        setUpdateError("Erreur de connexion au serveur. Vérifiez que le backend est en cours d'exécution.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    setUpdateError('');
    setUpdateSuccess('');
    setPasswordData({ currentPassword: '', newPassword: '' });
    setConfirmPassword('');
    if (profile) setEditData(profile);
  };

  const handleInputChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

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
      console.error(`Erreur upload ${endpoint}:`, error);
      throw error;
    }
  };

  // NOTE: on n'utilise plus le onSubmit du form pour lancer l'update.
  // Quand l'utilisateur clique "Enregistrer", on ouvre la modale de confirmation.
  const handleTriggerSave = (e) => {
    e.preventDefault();
    setUpdateError('');
    setIsPasswordConfirmModalOpen(true);
  };

  // Cette fonction effectue la mise à jour réelle: elle reçoit confirmPassword (string)
  const handleUpdateProfile = async (password) => {
    setUpdateError('');
    setUpdateSuccess('');
    setIsUpdating(true);

    try {
      // Construire le payload: inclure currentPassword pour vérification côté serveur
      const updatePayload = {
        ...editData,
        currentPassword: password,
        newPassword: passwordData.newPassword || null
      };

      // Appel backend
      await api.put('/user/profile', updatePayload);

      // Upload images si présents
      const profileImageFile = profileImageRef.current?.files[0];
      const backgroundImageFile = backgroundImageRef.current?.files[0];

      if (profileImageFile) {
        await uploadImage(profileImageFile, '/user/upload-profile-image');
      }
      if (backgroundImageFile) {
        await uploadImage(backgroundImageFile, '/user/upload-background-image');
      }

      // Succès
      setUpdateSuccess("Vos informations de profil ont bien été mises à jour ✅");
      await fetchProfile();

      // fermer les modales après un délai court pour laisser voir le message
      setTimeout(() => {
        setIsPasswordConfirmModalOpen(false);
        setIsModalOpen(false);
        setConfirmPassword('');
        setPasswordData({ currentPassword: '', newPassword: '' });
        setUpdateSuccess('');
      }, 1700);

    } catch (err) {
      // afficher le message d'erreur dans la modale de confirmation
      const message = err.response?.data?.message || "Une erreur est survenue lors de la mise à jour.";
      setUpdateError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  // logout helper
  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) await api.post('/auth/logout', { token: refreshToken });
      localStorage.clear();
      navigate('/auth/login');
    } catch (error) {
      console.error('Erreur handleLogout:', error);
      localStorage.clear();
      navigate('/auth/login');
    }
  };

  if (loading) return <div className="text-center p-5"><Spinner /></div>;
  if (!profile) return <div className="text-center p-5 text-warning">{updateError || "Profil non trouvé."}</div>;

  const dateNaissance = profile.date_naissance ? new Date(profile.date_naissance).toLocaleDateString() : '';

  return (
    <>
      <UserNavbar handleLogout={handleLogout} />
      <DynamicUserHeader profile={profile} />
      <Container className="mt--7" fluid>
        <Row>
          <Col className="order-xl-2 mb-5 mb-xl-0" xl="4">
            <Card className="card-profile shadow">
              <Row className="justify-content-center">
                <Col className="order-lg-2" lg="3">
                  <div className="card-profile-image">
                    <img alt="Profil" className="rounded-circle" src={profile.profile_image_url || require("assets/img/theme/team-4-800x800.jpg")} />
                  </div>
                </Col>
              </Row>
              <CardHeader className="text-center border-0 pt-8 pt-md-4 pb-0 pb-md-4" />
              <CardBody className="pt-0 pt-md-4">
                <div className="text-center mt-md-5">
                  <h3>{profile.nom_utilisateur}</h3>
                  <div className="h5 font-weight-300">
                    <i className="ni location_pin mr-2" />{profile.commune_choisie || 'Non renseignée'}
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col className="order-xl-1" xl="8">
            <Card className="bg-secondary shadow">
              <CardHeader className="bg-white border-0">
                <Row className="align-items-center">
                  <Col xs="8"><h3 className="mb-0">Mon Profil</h3></Col>
                  <Col className="text-right" xs="4">
                    <Button color="primary" onClick={toggleModal} size="sm">Modifier le profil</Button>
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                <Form onSubmit={(e) => e.preventDefault()}>
                  <h6 className="heading-small text-muted mb-4">Informations Personnelles</h6>
                  <div className="pl-lg-4">
                    <Row>
                      <Col lg="6"><FormGroup><label className="form-control-label">Prénom</label><Input value={profile?.prenom || ''} type="text" disabled /></FormGroup></Col>
                      <Col lg="6"><FormGroup><label className="form-control-label">Nom</label><Input value={profile?.nom || ''} type="text" disabled /></FormGroup></Col>
                    </Row>
                    <Row>
                      <Col lg="6"><FormGroup><label className="form-control-label">Nom d'utilisateur</label><Input value={profile.nom_utilisateur || ''} type="text" disabled /></FormGroup></Col>
                      <Col lg="6"><FormGroup><label className="form-control-label">Email</label><Input value={profile.email || ''} type="email" disabled /></FormGroup></Col>
                    </Row>
                    <Row>
                      <Col lg="6"><FormGroup><label className="form-control-label">Contact</label><Input value={profile.contact || 'Non renseigné'} type="text" disabled /></FormGroup></Col>
                      <Col lg="6"><FormGroup><label className="form-control-label">Commune</label><Input value={profile.commune_choisie || 'Non renseignée'} type="text" disabled /></FormGroup></Col>
                    </Row>
                    <Row>
                      <Col lg="6"><FormGroup><label className="form-control-label">Date de Naissance</label><Input value={dateNaissance} type="text" disabled /></FormGroup></Col>
                    </Row>
                  </div>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modal d'édition */}
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
                <Col lg="6"><FormGroup><Label>Numéro de téléphone</Label><Input type="tel" name="contact" value={editData.contact || ''} onChange={handleInputChange} placeholder="Ex: 0701020304" required /></FormGroup></Col>
              </Row>
            </div>

            <hr className="my-4" />
            <h6 className="heading-small text-muted mb-4">Changer les Images</h6>
            <div className="pl-lg-4">
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label>Image de profil</Label>
                    <Input type="file" accept="image/*" innerRef={profileImageRef} />
                    <small className="text-muted">Format recommandé: JPG/PNG, 500x500px</small>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>Image de fond</Label>
                    <Input type="file" accept="image/*" innerRef={backgroundImageRef} />
                    <small className="text-muted">Format recommandé: JPG/PNG, 1200x400px</small>
                  </FormGroup>
                </Col>
              </Row>
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
          </ModalBody>

          <ModalFooter>
            {/* n'utilise plus type="submit" pour empêcher update involontaire */}
            <Button color="primary" onClick={handleTriggerSave} disabled={isUpdating}>
              {isUpdating ? <><Spinner size="sm" /> Enregistrement...</> : "Enregistrer"}
            </Button>
            <Button color="secondary" onClick={toggleModal}>Annuler</Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Modale de confirmation du mot de passe */}
      <Modal isOpen={isPasswordConfirmModalOpen} toggle={() => setIsPasswordConfirmModalOpen(false)}>
        <ModalHeader toggle={() => setIsPasswordConfirmModalOpen(false)}>Confirmation requise</ModalHeader>
        <ModalBody>
          <p>Veuillez entrer votre mot de passe pour confirmer les modifications :</p>
          <Input
            type="password"
            placeholder="Mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoFocus
          />
          {updateError && <div className="text-danger mt-2"><small>{updateError}</small></div>}
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={() => handleUpdateProfile(confirmPassword)} disabled={isUpdating}>
            {isUpdating ? <><Spinner size="sm" /> Vérification...</> : "Confirmer"}
          </Button>
          <Button color="secondary" onClick={() => setIsPasswordConfirmModalOpen(false)}>Annuler</Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default UserProfile;
