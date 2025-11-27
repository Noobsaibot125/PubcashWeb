// src/views/examples/UserProfile.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button, Card, CardHeader, CardBody, FormGroup, Form, Input, Container, Row, Col,
  Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Label, UncontrolledTooltip
} from 'reactstrap';
import DynamicUserHeader from "components/Headers/DynamicUserHeader.js";
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import UserNavbar from 'components/Navbars/UserNavbar.js';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // États pour les modales
  const [isModalOpen, setIsModalOpen] = useState(false); // Modale édition profil
  const [isShareModalOpen, setIsShareModalOpen] = useState(false); // Modale partage (NOUVEAU)
  const [isPasswordConfirmModalOpen, setIsPasswordConfirmModalOpen] = useState(false); // Modale confirmation mdp

  const [editData, setEditData] = useState({});
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
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

  // --- NOUVEAU : Toggle pour la modale de partage ---
  const toggleShareModal = () => {
    setIsShareModalOpen(!isShareModalOpen);
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

  const handleTriggerSave = (e) => {
    e.preventDefault();
    setUpdateError('');
    setIsPasswordConfirmModalOpen(true);
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

      await api.put('/user/profile', updatePayload);

      const profileImageFile = profileImageRef.current?.files[0];
      const backgroundImageFile = backgroundImageRef.current?.files[0];

      if (profileImageFile) await uploadImage(profileImageFile, '/user/upload-profile-image');
      if (backgroundImageFile) await uploadImage(backgroundImageFile, '/user/upload-background-image');

      setUpdateSuccess("Vos informations de profil ont bien été mises à jour ✅");
      await fetchProfile();

      setTimeout(() => {
        setIsPasswordConfirmModalOpen(false);
        setIsModalOpen(false);
        setConfirmPassword('');
        setPasswordData({ currentPassword: '', newPassword: '' });
        setUpdateSuccess('');
      }, 1700);

    } catch (err) {
      const message = err.response?.data?.message || "Une erreur est survenue lors de la mise à jour.";
      setUpdateError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) await api.post('/auth/logout', { token: refreshToken });
      localStorage.clear();
      navigate('/auth/login');
    } catch (error) {
      localStorage.clear();
      navigate('/auth/login');
    }
  };

  // --- LOGIQUE DE PARTAGE VIA RESEAUX SOCIAUX ---
 const shareToNetwork = async (network) => {
    if (!profile.code_parrainage) return;

    // 1. L'URL doit être PROPRE (juste le lien, pas de texte avant)
    const cleanUrl = `${window.location.origin}/auth/register-user?ref=${profile.code_parrainage}`;
    
    // 2. Le texte d'accroche
    const message = `Rejoins PubCash et gagne de l'argent en regardant des vidéos ! Inscris-toi avec mon code : ${profile.code_parrainage}`;
    
    // 3. On combine pour WhatsApp (Texte + Saut de ligne + Lien)
    // Le \n\n permet de bien séparer le lien pour qu'il soit cliquable
    const whatsappText = `${message}\n\nLien de l'application : ${cleanUrl}`;

    let targetUrl = '';

    switch (network) {
      case 'whatsapp':
        targetUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;
        window.open(targetUrl, '_blank');
        break;
      
      case 'facebook':
        // Facebook prend uniquement l'URL propre
        targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(cleanUrl)}`;
        window.open(targetUrl, '_blank');
        break;

      case 'telegram':
        targetUrl = `https://t.me/share/url?url=${encodeURIComponent(cleanUrl)}&text=${encodeURIComponent(message)}`;
        window.open(targetUrl, '_blank');
        break;

      case 'instagram':
      case 'tiktok':
      case 'copy':
        try {
          // Pour le presse-papier, on met tout le texte
          await navigator.clipboard.writeText(`${message}\n\nLien : ${cleanUrl}`);
          alert(`Lien copié ! Vous pouvez maintenant le coller sur ${network === 'copy' ? 'vos réseaux' : network}.`);
          
          if (network === 'instagram') window.open('https://www.instagram.com/', '_blank');
          if (network === 'tiktok') window.open('https://www.tiktok.com/', '_blank');
          
        } catch (err) {
          console.error("Erreur copie", err);
        }
        break;

      default:
        break;
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
                  <div className="h5 mt-4">
                    <i className="ni ni-trophy text-warning mr-2" />
                    Points Bonus : {profile.points || 0} pts
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

            {/* Section Parrainage */}
            <Card className="bg-gradient-secondary shadow mt-4 border-0">
              <CardHeader className="bg-transparent border-0">
                <Row className="align-items-center">
                  <Col xs="8"><h3 className="mb-0 text-primary"><i className="ni ni-spaceship mr-2"></i>Mon Espace Parrainage</h3></Col>
                </Row>
              </CardHeader>
              <CardBody>
                <div className="text-center mb-4">
                  <h4 className="text-muted">Partagez votre code et gagnez !</h4>
                  <div className="p-3 my-3 bg-white rounded shadow-sm d-inline-block">
                    <h2 className="display-4 text-primary font-weight-bold mb-0" style={{ letterSpacing: '2px' }}>
                        {profile.code_parrainage || '...'}
                    </h2>
                  </div>
                  <p className="small text-muted mb-4">
                      Invitez un ami : vous recevez <strong>30 Crédits</strong>.<br/>
                      Si votre filleul partage une vidéo Diamant, vous gagnez <strong>5 Points</strong> !
                  </p>
                  
                  <div className="d-flex justify-content-center">
                      {/* BOUTON MODIFIÉ ICI : Ouvre la modale toggleShareModal */}
                      <Button color="success" size="lg" className="mr-3" onClick={toggleShareModal}>
                        <i className="ni ni-send mr-2"></i>Inviter des amis
                      </Button>
                      
                      <Button 
                        color="secondary" 
                        outline 
                        size="lg" 
                        onClick={() => shareToNetwork('copy')}
                      >
                        <i className="ni ni-single-copy-04"></i>
                      </Button>
                  </div>
                </div>
                
                <hr className="my-4" />
                <h6 className="heading-small text-muted mb-4">
                    <i className="ni ni-circle-08 mr-2"></i>Mes Filleuls ({profile.referrals ? profile.referrals.length : 0})
                </h6>
                {profile.referrals && profile.referrals.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table align-items-center table-flush table-hover">
                      <thead className="thead-light">
                        <tr>
                          <th scope="col">Utilisateur</th>
                          <th scope="col">Date d'inscription</th>
                          <th scope="col">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.referrals.map((ref, index) => (
                          <tr key={index}>
                            <td className="font-weight-bold">{ref.nom_utilisateur}</td>
                            <td>{new Date(ref.date_inscription).toLocaleDateString()}</td>
                            <td><span className="badge badge-dot"><i className="bg-success"></i> Actif</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-secondary text-center" role="alert">
                    <span className="alert-inner--icon"><i className="ni ni-notification-70"></i></span>
                    <span className="alert-inner--text ml-2">Vous n'avez pas encore de filleuls. Commencez à inviter !</span>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* --- NOUVELLE MODALE DE PARTAGE --- */}
      <Modal isOpen={isShareModalOpen} toggle={toggleShareModal} size="sm" centered>
        <ModalHeader toggle={toggleShareModal} className="bg-secondary">
            Inviter via...
        </ModalHeader>
        <ModalBody className="p-4 bg-secondary">
            <Row className="justify-content-center">
                <Col xs="6" className="mb-3 text-center">
                    <Button 
                        className="btn-icon rounded-circle mb-2" 
                        style={{ backgroundColor: '#25D366', color: 'white', width: '60px', height: '60px' }}
                        onClick={() => shareToNetwork('whatsapp')}
                    >
                        <i className="fab fa-whatsapp fa-2x"></i>
                    </Button>
                    <div className="small font-weight-bold">WhatsApp</div>
                </Col>
                
                <Col xs="6" className="mb-3 text-center">
                    <Button 
                        className="btn-icon rounded-circle mb-2" 
                        style={{ backgroundColor: '#1877F2', color: 'white', width: '60px', height: '60px' }}
                        onClick={() => shareToNetwork('facebook')}
                    >
                        <i className="fab fa-facebook-f fa-2x"></i>
                    </Button>
                    <div className="small font-weight-bold">Facebook</div>
                </Col>

                <Col xs="6" className="mb-3 text-center">
                    <Button 
                        className="btn-icon rounded-circle mb-2" 
                        style={{ backgroundColor: '#0088cc', color: 'white', width: '60px', height: '60px' }}
                        onClick={() => shareToNetwork('telegram')}
                    >
                        <i className="fab fa-telegram-plane fa-2x"></i>
                    </Button>
                    <div className="small font-weight-bold">Telegram</div>
                </Col>

                <Col xs="6" className="mb-3 text-center">
                    <Button 
                        className="btn-icon rounded-circle mb-2" 
                        style={{ background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)', color: 'white', width: '60px', height: '60px' }}
                        onClick={() => shareToNetwork('instagram')}
                    >
                        <i className="fab fa-instagram fa-2x"></i>
                    </Button>
                    <div className="small font-weight-bold">Instagram</div>
                </Col>

                 <Col xs="6" className="mb-3 text-center">
                    <Button 
                        className="btn-icon rounded-circle mb-2" 
                        style={{ backgroundColor: '#000000', color: 'white', width: '60px', height: '60px' }}
                        onClick={() => shareToNetwork('tiktok')}
                    >
                        <i className="fab fa-tiktok fa-2x"></i>
                    </Button>
                    <div className="small font-weight-bold">TikTok</div>
                </Col>

                <Col xs="6" className="mb-3 text-center">
                    <Button 
                        className="btn-icon rounded-circle mb-2" 
                        color="secondary"
                        style={{ border: '2px solid #ddd', width: '60px', height: '60px' }}
                        onClick={() => shareToNetwork('copy')}
                    >
                        <i className="ni ni-single-copy-04 fa-2x text-muted"></i>
                    </Button>
                    <div className="small font-weight-bold">Copier</div>
                </Col>
            </Row>
        </ModalBody>
      </Modal>

      {/* --- MODALE EDIT PROFIL (Inchangée) --- */}
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
                <Col md="6"><FormGroup><Label>Image de profil</Label><Input type="file" accept="image/*" innerRef={profileImageRef} /></FormGroup></Col>
                <Col md="6"><FormGroup><Label>Image de fond</Label><Input type="file" accept="image/*" innerRef={backgroundImageRef} /></FormGroup></Col>
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
            <Button color="primary" onClick={handleTriggerSave} disabled={isUpdating}>
              {isUpdating ? <><Spinner size="sm" /> Enregistrement...</> : "Enregistrer"}
            </Button>
            <Button color="secondary" onClick={toggleModal}>Annuler</Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* --- MODALE CONFIRMATION PASSWORD (Inchangée) --- */}
      <Modal isOpen={isPasswordConfirmModalOpen} toggle={() => setIsPasswordConfirmModalOpen(false)}>
         <ModalHeader toggle={() => setIsPasswordConfirmModalOpen(false)}>Confirmation requise</ModalHeader>
        <ModalBody>
          <p>Veuillez entrer votre mot de passe pour confirmer les modifications :</p>
          <Input type="password" placeholder="Mot de passe" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoFocus />
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