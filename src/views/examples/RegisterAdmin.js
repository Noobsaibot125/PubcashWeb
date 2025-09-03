// src/views/examples/RegisterAdmin.js

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // On importe Link pour le retour

// reactstrap components
import {
  Button,
  Card,
  CardBody,
  FormGroup,
  Form,
  Input,
  InputGroupAddon,
  InputGroupText,
  InputGroup,
  Row,
  Col,
} from "reactstrap";

const RegisterAdmin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom_utilisateur: "",
    email: "",
    mot_de_passe: "",
    invitationCode: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false); // Ajout d'un état pour le chargement

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true); // On active le chargement

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL}/auth/admin/register`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la création du compte.");
      }

      setSuccess("Compte Super Admin créé avec succès ! Vous allez être redirigé vers la page de connexion...");

      // --- MODIFICATION ICI ---
      // Redirection vers la page de connexion après 3 secondes
      setTimeout(() => {
        navigate("/auth/login");
      }, 3000); // 3000 millisecondes = 3 secondes

    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false); // On désactive le chargement dans tous les cas
    }
  };

  return (
    <>
      <Col lg="6" md="8">
        <Card className="bg-secondary shadow border-0">
          <CardBody className="px-lg-5 py-lg-5">
            <div className="text-center text-muted mb-4">
              <small>Créer un nouveau compte Super Administrateur</small>
            </div>
            <Form role="form" onSubmit={handleRegister}>
              {/* Les champs du formulaire restent identiques */}
              <FormGroup>
                <InputGroup className="input-group-alternative mb-3">
                  <InputGroupAddon addonType="prepend"><InputGroupText><i className="ni ni-circle-08" /></InputGroupText></InputGroupAddon>
                  <Input placeholder="Nom d'utilisateur" type="text" name="nom_utilisateur" value={formData.nom_utilisateur} onChange={handleChange} required />
                </InputGroup>
              </FormGroup>
              <FormGroup>
                <InputGroup className="input-group-alternative mb-3">
                  <InputGroupAddon addonType="prepend"><InputGroupText><i className="ni ni-email-83" /></InputGroupText></InputGroupAddon>
                  <Input placeholder="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                </InputGroup>
              </FormGroup>
              <FormGroup>
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend"><InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText></InputGroupAddon>
                  <Input placeholder="Mot de passe" type="password" name="mot_de_passe" value={formData.mot_de_passe} onChange={handleChange} required />
                </InputGroup>
              </FormGroup>
              <FormGroup>
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend"><InputGroupText><i className="ni ni-key-25" /></InputGroupText></InputGroupAddon>
                  <Input placeholder="Code d'invitation" type="password" name="invitationCode" value={formData.invitationCode} onChange={handleChange} required />
                </InputGroup>
              </FormGroup>

              {error && <div className="text-center text-danger my-2"><small>{error}</small></div>}
              {success && <div className="text-center text-success my-2"><small>{success}</small></div>}

              <div className="text-center">
                <Button className="mt-4" color="primary" type="submit" disabled={loading}>
                  {loading ? "Création en cours..." : "Créer le compte Admin"}
                </Button>
              </div>
            </Form>
            <Row className="mt-3">
              <Col className="text-center" xs="12">
                <Link to="/auth/login" className="text-light">
                    <small>Retour à la page de connexion</small>
                </Link>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>
    </>
  );
};

export default RegisterAdmin;