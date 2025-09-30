// src/views/admin/AjoutAdmin.js
import React, { useState, useEffect, useCallback } from "react";
import {
  Card, CardHeader, CardBody, CardTitle,
  Container, Row, Col, Table,
  Button, Form, FormGroup, Input,
  Spinner, Alert, Badge
} from "reactstrap";
import api from "../../services/api";

// ---- HEADER INSPIRÉ DU DASHBOARD ----
const AdminAddHeader = () => (
  <div className="header bg-gradient-primary pb-8 pt-5 pt-md-8">
    <Container fluid>
      <div className="header-body">
        <Row>
          <Col lg="12">
            <Card className="card-stats mb-4 mb-xl-0 shadow">
              <CardBody>
                <Row>
                  <div className="col">
                    <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                      Gestion des Administrateurs
                    </CardTitle>
                    <span className="h1 font-weight-bold mb-0">
                      Créez et gérez les administrateurs de la plateforme
                    </span>
                  </div>
                  <Col className="col-auto">
                    <div className="icon icon-shape bg-info text-white rounded-circle shadow">
                      <i className="fas fa-user-shield" />
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </Container>
  </div>
);

// ---- PAGE PRINCIPALE ----
const AjoutAdmin = () => {
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState({ nom_utilisateur: "", email: "", mot_de_passe: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger la liste des admins
  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/admins");
      setAdmins(data);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Mise à jour formulaire
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Créer un admin
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.post("/admin/admins", formData);
      setSuccess(res.data.message || "Administrateur créé");
      setFormData({ nom_utilisateur: "", email: "", mot_de_passe: "" });
      await fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Supprimer un admin
  const handleDeleteAdmin = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet administrateur ?")) {
      try {
        const res = await api.delete(`/admin/admins/${id}`);
        setSuccess(res.data.message || "Administrateur supprimé");
        await fetchAdmins();
      } catch (err) {
        setError(err.response?.data?.message || "Erreur lors de la suppression");
      }
    }
  };

  return (
    <>
      <style>{`
        h1,h2,h3,h4,h5,h6,.h1,.h2,.h3,.h4,.h5,.h6 {
          color: black;
          font-weight: 600;
        }
      `}</style>

      <AdminAddHeader />

      <Container className="mt--7" fluid>
        <Row className="mb-4">
          <Col xl="12">
            <Card className="shadow">
              <CardHeader>
                <h3 className="mb-0">Créer un nouvel Administrateur</h3>
              </CardHeader>
              <CardBody>
                <Form onSubmit={handleAddAdmin}>
                  <Row>
                    <Col md="4">
                      <FormGroup>
                        <label>Nom d'utilisateur</label>
                        <Input
                          name="nom_utilisateur"
                          value={formData.nom_utilisateur}
                          onChange={handleInputChange}
                          required
                        />
                      </FormGroup>
                    </Col>
                    <Col md="4">
                      <FormGroup>
                        <label>Email</label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </FormGroup>
                    </Col>
                    <Col md="4">
                      <FormGroup>
                        <label>Mot de passe</label>
                        <Input
                          type="password"
                          name="mot_de_passe"
                          value={formData.mot_de_passe}
                          onChange={handleInputChange}
                          required
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  {error && <Alert color="danger">{error}</Alert>}
                  {success && <Alert color="success">{success}</Alert>}
                  <Button type="submit" color="primary" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner size="sm" /> : "Créer l'administrateur"}
                  </Button>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col xl="12">
            <Card className="shadow">
              <CardHeader>
                <h3 className="mb-0">Liste des Administrateurs</h3>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <div className="text-center p-4"><Spinner /></div>
                ) : (
                  <Table className="align-items-center table-flush" responsive>
                    <thead className="thead-light">
                      <tr>
                        <th>ID</th>
                        <th>Nom d'utilisateur</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr key={admin.id}>
                          <td>{admin.id}</td>
                          <td>{admin.nom_utilisateur}</td>
                          <td>{admin.email}</td>
                          <td>
                            <Badge color={admin.role === "superadmin" ? "danger" : "info"}>
                              {admin.role}
                            </Badge>
                          </td>
                          <td className="text-right">
                            <Button
                              color="danger"
                              size="sm"
                              onClick={() => handleDeleteAdmin(admin.id)}
                            >
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
      </Container>
    </>
  );
};

export default AjoutAdmin;
