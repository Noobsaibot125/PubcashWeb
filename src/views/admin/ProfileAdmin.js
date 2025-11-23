import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  FormGroup,
  Form,
  Input,
  Container,
  Row,
  Col,
  Alert,
  Spinner
} from "reactstrap";
import UserHeader from "components/Headers/UserHeader.js";
import api from 'services/api';

const ProfileAdmin = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // États pour l'édition
  const [editData, setEditData] = useState({
    nom: '',
    prenom: '',
    email: '',
    contact: ''
  });

  // États pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/admin/profile');
      setProfile(response.data);
      setEditData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  // 3. CORRIGER handleUpdateProfile
  const handleUpdateProfile = async (password) => {
    setError('');
    setSuccess('');
    try {
      await api.put('/admin/profile', { ...editData, password }); // On envoie le mot de passe pour confirmation
      setSuccess('Profil mis à jour avec succès');
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleUpdatePassword = async () => {
    setError('');
    setSuccess('');
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    try {
      await api.put('/admin/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setSuccess('Mot de passe modifié avec succès');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
    }
  };

  if (loading) return <div className="text-center mt-5"><Spinner color="primary" /></div>;

  return (
    <>
      <UserHeader />
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
                        src={require("../../assets/img/theme/team-4-800x800.jpg")}
                      />
                    </a>
                  </div>
                </Col>
              </Row>
              <CardHeader className="text-center border-0 pt-8 pt-md-4 pb-0 pb-md-4">
                <div className="d-flex justify-content-between">
                </div>
              </CardHeader>
              <CardBody className="pt-0 pt-md-4">
                <div className="text-center mt-md-5">
                  <h3>
                    {profile?.prenom} {profile?.nom}
                  </h3>
                  <div className="h5 font-weight-300">
                    <i className="ni location_pin mr-2" />
                    {profile?.email}
                  </div>
                  <div className="h5 mt-4">
                    <i className="ni business_briefcase-24 mr-2" />
                    Administrateur - PubCash
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col className="order-xl-1" xl="8">
            <Card className="bg-secondary shadow">
              <CardHeader className="bg-white border-0">
                <Row className="align-items-center">
                  <Col xs="8">
                    <h3 className="mb-0">Mon Compte</h3>
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                {error && <Alert color="danger">{error}</Alert>}
                {success && <Alert color="success">{success}</Alert>}

                <Form>
                  <h6 className="heading-small text-muted mb-4">Informations utilisateur</h6>
                  <div className="pl-lg-4">
                    <Row>
                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label" htmlFor="input-username">Nom</label>
                          <Input
                            className="form-control-alternative"
                            id="input-username"
                            placeholder="Nom"
                            type="text"
                            name="nom"
                            value={editData.nom}
                            onChange={handleInputChange}
                          />
                        </FormGroup>
                      </Col>
                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label" htmlFor="input-email">Prénom</label>
                          <Input
                            className="form-control-alternative"
                            id="input-email"
                            placeholder="Prénom"
                            type="text"
                            name="prenom"
                            value={editData.prenom}
                            onChange={handleInputChange}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label" htmlFor="input-first-name">Email</label>
                          <Input
                            className="form-control-alternative"
                            id="input-first-name"
                            placeholder="Email"
                            type="email"
                            name="email"
                            value={editData.email}
                            onChange={handleInputChange}
                            disabled // Email non modifiable souvent
                          />
                        </FormGroup>
                      </Col>
                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label" htmlFor="input-last-name">Contact</label>
                          <Input
                            className="form-control-alternative"
                            id="input-last-name"
                            placeholder="Contact"
                            type="text"
                            name="contact"
                            value={editData.contact}
                            onChange={handleInputChange}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                    <Button color="primary" onClick={() => {
                      const pwd = prompt("Veuillez confirmer votre mot de passe actuel pour enregistrer les modifications :");
                      if (pwd) handleUpdateProfile(pwd);
                    }}>
                      Enregistrer les modifications
                    </Button>
                  </div>
                  <hr className="my-4" />
                  {/* Address */}
                  <h6 className="heading-small text-muted mb-4">Sécurité</h6>
                  <div className="pl-lg-4">
                    <Row>
                      <Col md="12">
                        <FormGroup>
                          <label className="form-control-label" htmlFor="input-address">Mot de passe actuel</label>
                          <Input
                            className="form-control-alternative"
                            id="input-address"
                            placeholder="Mot de passe actuel"
                            type="password"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label" htmlFor="input-city">Nouveau mot de passe</label>
                          <Input
                            className="form-control-alternative"
                            id="input-city"
                            placeholder="Nouveau mot de passe"
                            type="password"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                          />
                        </FormGroup>
                      </Col>
                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label" htmlFor="input-country">Confirmer le nouveau mot de passe</label>
                          <Input
                            className="form-control-alternative"
                            id="input-country"
                            placeholder="Confirmer"
                            type="password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                    <Button color="warning" onClick={handleUpdatePassword}>
                      Changer le mot de passe
                    </Button>
                  </div>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ProfileAdmin;