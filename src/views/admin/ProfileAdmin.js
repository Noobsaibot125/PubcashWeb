// src/views/admin/ProfileAdmin.js

import React, { useState, useEffect,useCallback } from 'react';
import { 
  Button, Card, CardHeader, CardBody, FormGroup, Form, Input, 
  Container, Row, Col, Spinner, Label 
} from 'reactstrap';
import DynamicAdminHeader from "components/Headers/DynamicAdminHeader.js"; // On utilise un Header dynamique
import api from '../../services/api'; // 1. IMPORTER API
const ProfileAdmin = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // États pour le formulaire d'édition
  const [editData, setEditData] = useState({});
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsUpdating(true);
    try {
      const response = await api.put('/admin/profile', { ...editData, ...passwordData });
      setSuccess(response.data.message);
      await fetchProfile(); // Rafraîchir
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="text-center p-5"><Spinner /></div>;

  return (
    <>
      <DynamicAdminHeader />
      <Container className="mt--7" fluid>
        <Row className="justify-content-center">
          <Col xl="8">
            <Card className="bg-secondary shadow">
              <CardHeader className="bg-white border-0">
                <h3 className="mb-0">Profil Super Administrateur</h3>
              </CardHeader>
              <CardBody>
                <Form onSubmit={handleUpdateProfile}>
                  <h6 className="heading-small text-muted mb-4">Informations du Compte</h6>
                  <div className="pl-lg-4">
                    <Row>
                      <Col lg="6">
                        <FormGroup>
                          <Label>Nom d'utilisateur</Label>
                          <Input type="text" name="nom_utilisateur" value={editData.nom_utilisateur || ''} onChange={handleInputChange} required />
                        </FormGroup>
                      </Col>
                      <Col lg="6">
                        <FormGroup>
                          <Label>Email</Label>
                          <Input type="email" name="email" value={editData.email || ''} onChange={handleInputChange} required />
                        </FormGroup>
                      </Col>
                    </Row>
                  </div>
                  <hr className="my-4" />
                  <h6 className="heading-small text-muted mb-4">Changer de Mot de Passe</h6>
                  <div className="pl-lg-4">
                    <Row>
                      <Col lg="6">
                        <FormGroup>
                          <Label>Mot de passe actuel</Label>
                          <Input type="password" name="currentPassword" placeholder="Laisser vide pour ne pas changer" value={passwordData.currentPassword} onChange={handlePasswordChange} />
                        </FormGroup>
                      </Col>
                      <Col lg="6">
                        <FormGroup>
                          <Label>Nouveau mot de passe</Label>
                          <Input type="password" name="newPassword" placeholder="Laisser vide pour ne pas changer" value={passwordData.newPassword} onChange={handlePasswordChange} />
                        </FormGroup>
                      </Col>
                    </Row>
                  </div>
                  {error && <div className="text-danger text-center mt-3"><small>{error}</small></div>}
                  {success && <div className="text-success text-center mt-3"><small>{success}</small></div>}
                  <div className="text-right">
                    <Button color="primary" type="submit" disabled={isUpdating}>
                      {isUpdating ? <Spinner size="sm" /> : "Enregistrer"}
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