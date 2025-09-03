  // src/views/examples/Profile.js

  import React, { useState, useEffect, useRef, useCallback } from 'react';
  import {
    Button, Card, CardHeader, CardBody, FormGroup, Form, Input, Container, Row, Col,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Label
  } from 'reactstrap';
  import DynamicUserHeader from "components/Headers/DynamicUserHeader.js"; // On utilise un Header dynamique
  import api from '../../services/api';
  const Profile = () => {
    // --- États du composant ---
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState({}); // Pour les champs de texte
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
    const [updateError, setUpdateError] = useState('');
    const [updateSuccess, setUpdateSuccess] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Références aux champs de type "fichier"
    const profileImageRef = useRef(null);
    const backgroundImageRef = useRef(null);

    // --- Fonctions de récupération et de gestion ---
    const fetchProfile = useCallback(async () => {
      try {
        if (!loading) setLoading(true);
        const response = await api.get('/client/profile');
        const data = response.data;
    
        // Base API (fallback)
        const baseApi = process.env.REACT_APP_API_URL || window.location.origin;
    
        const profile_image_url = data.profile_image_url
          ? (data.profile_image_url.startsWith('http') ? data.profile_image_url : `${baseApi}/uploads/profile/${encodeURIComponent(data.profile_image_url)}`)
          : null;
    
        const background_image_url = data.background_image_url
          ? (data.background_image_url.startsWith('http') ? data.background_image_url : `${baseApi}/uploads/background/${encodeURIComponent(data.background_image_url)}`)
          : null;
    
        const final = { ...data, profile_image_url, background_image_url };
        setProfile(final);
        setEditData(final);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, [loading]);

    useEffect(() => {
      fetchProfile();
    }, [fetchProfile]); // Utilisation de la fonction useCallback

    const toggleModal = () => {
      setIsModalOpen(!isModalOpen);
      setUpdateError('');
      setUpdateSuccess('');
      setPasswordData({ currentPassword: '', newPassword: '' });
      if (profile) setEditData(profile);
    };
    const handleInputChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });
    const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

    // 3. On corrige la fonction de mise à jour pour utiliser 'api.put' et 'api.post'
    const handleUpdateProfile = async (e) => {
      e.preventDefault();
      setUpdateError('');
      setUpdateSuccess('');
      setIsUpdating(true);

      try {
        // Mise à jour des informations textuelles
        await api.put('/client/profile', { ...editData, ...passwordData });

        // Upload de l'image de profil
        const profileImageFile = profileImageRef.current?.files[0];
        if (profileImageFile) {
          const formData = new FormData();
          formData.append('profileImage', profileImageFile);
          await api.post('/client/upload-profile-image', formData);
        }

        // Upload de l'image de bannière
        const backgroundImageFile = backgroundImageRef.current?.files[0];
        if (backgroundImageFile) {
          const formData = new FormData();
          formData.append('backgroundImage', backgroundImageFile);
          await api.post('/client/upload-background-image', formData);
        }
        
        setUpdateSuccess("Profil mis à jour avec succès !");
        await fetchProfile();
        setTimeout(() => toggleModal(), 2000);

      } catch (err) {
        const errorMessage = err.response?.data?.message || "Une erreur est survenue.";
        setUpdateError(errorMessage);
      } finally {
        setIsUpdating(false);
      }
    };
    
    if (loading) return <div className="text-center p-5"><Spinner /></div>;

    return (
      <>
        <DynamicUserHeader profile={profile} />
        <Container className="mt--7" fluid>
          <Row>
            <Col className="order-xl-2 mb-5 mb-xl-0" xl="4">
              <Card className="card-profile shadow">
                <Row className="justify-content-center">
                  <Col className="order-lg-2" lg="3">
                    <div className="card-profile-image">
                      <a href="#pablo" onClick={(e) => e.preventDefault()}>
                        <img
                          alt="..."
                          className="rounded-circle"
                          src={profile?.profile_image_url || require("../../assets/img/theme/team-4-800x800.jpg")}
                        />
                      </a>
                    </div>
                  </Col>
                </Row>
                <CardHeader className="text-center border-0 pt-8 pt-md-4 pb-0 pb-md-4" />
                <CardBody className="pt-0 pt-md-4">
                  <div className="text-center mt-md-5">
                    <h3>{profile?.prenom} {profile?.nom}</h3>
                    <div className="h5 font-weight-300">
                      <i className="ni location_pin mr-2" />{profile?.commune}
                    </div>
                    <hr className="my-4" />
                    <p>{profile?.description || "Cliquez sur 'Modifier' pour ajouter une description."}</p>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col className="order-xl-1" xl="8">
              <Card className="bg-secondary shadow">
                <CardHeader className="bg-white border-0">
                  <Row className="align-items-center">
                    <Col xs="8"><h3 className="mb-0">Mon Compte</h3></Col>
                    <Col className="text-right" xs="4">
                      <Button color="primary" onClick={toggleModal} size="sm">Modifier le profil</Button>
                    </Col>
                  </Row>
                </CardHeader>
                <CardBody>
                  <Form>
                    <h6 className="heading-small text-muted mb-4">Informations Utilisateur</h6>
                    <div className="pl-lg-4">
                      <Row>
                        <Col lg="6"><FormGroup><label className="form-control-label">Nom d'utilisateur</label><Input value={profile?.nom_utilisateur || ''} type="text" disabled /></FormGroup></Col>
                        <Col lg="6"><FormGroup><label className="form-control-label">Email</label><Input value={profile?.email || ''} type="email" disabled /></FormGroup></Col>
                      </Row>
                      <Row>
                        <Col lg="6"><FormGroup><label className="form-control-label">Prénom</label><Input value={profile?.prenom || ''} type="text" disabled /></FormGroup></Col>
                        <Col lg="6"><FormGroup><label className="form-control-label">Nom</label><Input value={profile?.nom || ''} type="text" disabled /></FormGroup></Col>
                      </Row>
                      {/* --- AJOUT : Affichage du numéro de téléphone --- */}
                      <Row>
                        <Col lg="6">
                          <FormGroup>
                            <label className="form-control-label">Téléphone</label>
                            <Input value={profile?.telephone || 'Non renseigné'} type="text" disabled />
                          </FormGroup>
                        </Col>
                      </Row>
                    </div>
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
        
        {/* --- Modale d'Édition --- */}
        <Modal isOpen={isModalOpen} toggle={toggleModal} size="lg">
          <ModalHeader toggle={toggleModal}>Modifier mon profil</ModalHeader>
          <Form onSubmit={handleUpdateProfile}>
            <ModalBody>
              <h6 className="heading-small text-muted mb-4">Informations Utilisateur</h6>
              <div className="pl-lg-4">
                <Row>
                  <Col lg="6"><FormGroup><Label>Prénom</Label><Input type="text" name="prenom" value={editData.prenom || ''} onChange={handleInputChange} required /></FormGroup></Col>
                  <Col lg="6"><FormGroup><Label>Nom</Label><Input type="text" name="nom" value={editData.nom || ''} onChange={handleInputChange} required /></FormGroup></Col>
                </Row>
                <Row>
                  <Col lg="6"><FormGroup><Label>Nom d'utilisateur</Label><Input type="text" name="nom_utilisateur" value={editData.nom_utilisateur || ''} onChange={handleInputChange} required /></FormGroup></Col>
                  {/* --- AJOUT : Champ de saisie pour le téléphone --- */}
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
                      <small className="form-text text-muted">Requis pour les recharges.</small>
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
                  <small className="text-muted">Laissez vide pour ne pas changer.</small>
                </FormGroup>
                <FormGroup>
                  <Label>Image de bannière</Label>
                  <Input type="file" name="backgroundImage" accept="image/*" innerRef={backgroundImageRef} />
                  <small className="text-muted">Laissez vide pour ne pas changer.</small>
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
            </ModalBody>
            <ModalFooter>
              <Button color="primary" type="submit" disabled={isUpdating}>
                {isUpdating ? <><Spinner size="sm" /> Enregistrement...</> : "Enregistrer"}
              </Button>
              <Button color="secondary" onClick={toggleModal}>Annuler</Button>
            </ModalFooter>
          </Form>
        </Modal>
      </>
    );
  };

  export default Profile;