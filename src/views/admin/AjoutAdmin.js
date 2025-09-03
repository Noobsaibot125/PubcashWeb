// src/views/admin/AjoutAdmin.js

import React, { useState, useEffect,useCallback } from 'react';
import {
  Card, CardHeader, CardBody, Table, Button, Badge,
  Row, Col, FormGroup, Input, Spinner, Form, Alert
} from 'reactstrap';
import api from '../../services/api'; // 1. IMPORTER API
const AjoutAdmin = () => {
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState({ nom_utilisateur: '', email: '', mot_de_passe: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAdmins = useCallback(async () => {
    try {
      if (!loading) setLoading(true);
      const response = await api.get('/admin/admins');
      setAdmins(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. CORRIGER handleAddAdmin
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/admin/admins', formData);
      setSuccess(response.data.message);
      setFormData({ nom_utilisateur: '', email: '', mot_de_passe: '' });
      await fetchAdmins(); // Recharger la liste
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. CORRIGER handleDeleteAdmin
  const handleDeleteAdmin = async (adminId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet administrateur ?')) {
      setError('');
      setSuccess('');
      try {
        const response = await api.delete(`/admin/admins/${adminId}`);
        setSuccess(response.data.message);
        await fetchAdmins(); // Recharger la liste
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className="content">
      <Row>
        <Col md="12">
          {/* Formulaire de création */}
          <Card>
            <CardHeader><h4 className="title">Créer un nouvel Administrateur</h4></CardHeader>
            <CardBody>
              <Form onSubmit={handleAddAdmin}>
                <Row>
                  <Col md="4">
                    <FormGroup>
                      <label>Nom d'utilisateur</label>
                      <Input name="nom_utilisateur" value={formData.nom_utilisateur} onChange={handleInputChange} required />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <label>Email</label>
                      <Input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <label>Mot de passe</label>
                      <Input type="password" name="mot_de_passe" value={formData.mot_de_passe} onChange={handleInputChange} required />
                    </FormGroup>
                  </Col>
                </Row>
                {error && <Alert color="danger">{error}</Alert>}
                {success && <Alert color="success">{success}</Alert>}
                <Button type="submit" color="primary" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner size="sm" /> : 'Créer l\'administrateur'}
                </Button>
              </Form>
            </CardBody>
          </Card>

          {/* Liste des administrateurs */}
          <Card>
            <CardHeader><h4 className="title">Liste des Administrateurs</h4></CardHeader>
            <CardBody>
              {loading ? <Spinner /> : (
                <Table responsive>
                  <thead className="text-primary">
                    <tr>
                      <th>ID</th>
                      <th>Nom d'utilisateur</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(admin => (
                      <tr key={admin.id}>
                        <td>{admin.id}</td>
                        <td>{admin.nom_utilisateur}</td>
                        <td>{admin.email}</td>
                        <td>
                          <Badge color={admin.role === 'superadmin' ? 'danger' : 'info'}>
                            {admin.role}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <Button color="danger" size="sm" onClick={() => handleDeleteAdmin(admin.id)}>
                            Supprimer
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AjoutAdmin;