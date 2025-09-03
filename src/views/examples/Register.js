// src/views/examples/Register.js

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

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

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    nom_utilisateur: "",
    email: "",
    mot_de_passe: "",
    commune: "plateau",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Pour désactiver le bouton

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
    setLoading(true);

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL}/auth/client/register`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'inscription.");
      }

      // --- CORRECTION MAJEURE ---
      // Si l'inscription réussit, on redirige vers la page de vérification
      // en passant l'email dans l'état de la navigation. C'est la SEULE action à faire.
      navigate("/auth/verify-otp", { state: { email: formData.email } });

    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Col lg="6" md="8">
        <Card className="bg-secondary shadow border-0">
          <CardBody className="px-lg-5 py-lg-5">
            <div className="text-center text-muted mb-4">
              <small>Inscrivez-vous en tant que Promoteur</small>
            </div>
            <Form role="form" onSubmit={handleRegister}>
              {/* Le formulaire est bon, on le garde tel quel */}
              <FormGroup>
                <InputGroup className="input-group-alternative mb-3"><InputGroupAddon addonType="prepend"><InputGroupText><i className="ni ni-hat-3" /></InputGroupText></InputGroupAddon>
                  <Input placeholder="Prénom" type="text" name="prenom" value={formData.prenom} onChange={handleChange} required />
                </InputGroup>
              </FormGroup>
               <FormGroup>
                <InputGroup className="input-group-alternative mb-3"><InputGroupAddon addonType="prepend"><InputGroupText><i className="ni ni-hat-3" /></InputGroupText></InputGroupAddon>
                  <Input placeholder="Nom" type="text" name="nom" value={formData.nom} onChange={handleChange} required />
                </InputGroup>
              </FormGroup>
               <FormGroup>
                <InputGroup className="input-group-alternative mb-3"><InputGroupAddon addonType="prepend"><InputGroupText><i className="ni ni-circle-08" /></InputGroupText></InputGroupAddon>
                  <Input placeholder="Nom d'utilisateur" type="text" name="nom_utilisateur" value={formData.nom_utilisateur} onChange={handleChange} required />
                </InputGroup>
              </FormGroup>
              <FormGroup>
                <InputGroup className="input-group-alternative mb-3"><InputGroupAddon addonType="prepend"><InputGroupText><i className="ni ni-email-83" /></InputGroupText></InputGroupAddon>
                  <Input placeholder="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                </InputGroup>
              </FormGroup>
              <FormGroup>
                <InputGroup className="input-group-alternative"><InputGroupAddon addonType="prepend"><InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText></InputGroupAddon>
                  <Input placeholder="Mot de passe" type="password" name="mot_de_passe" value={formData.mot_de_passe} onChange={handleChange} required />
                </InputGroup>
              </FormGroup>
              <FormGroup>
                <InputGroup className="input-group-alternative"><InputGroupAddon addonType="prepend"><InputGroupText><i className="ni ni-pin-3" /></InputGroupText></InputGroupAddon>
                    <Input type="select" name="commune" value={formData.commune} onChange={handleChange} required>
                        <option value="plateau">Plateau</option>
                        <option value="yopougon">Yopougon</option>
                        <option value="cocody">Cocody</option>
                        <option value="abobo">Abobo</option>
                        <option value="koumassi">Koumassi</option>
                        <option value="marcory">Marcory</option>
                        <option value="portbouet">Port-Bouët</option>
                    </Input>
                </InputGroup>
              </FormGroup>
              
              {error && <div className="text-center text-danger my-2"><small>{error}</small></div>}
              
              <div className="text-center">
                {/* MODIFICATION: Remplacement de "color" par la nouvelle classe */}
                <Button className="mt-4 btn-pubcash-primary" type="submit" disabled={loading}>
                  {loading ? "Création..." : "Créer mon compte"}
                </Button>
              </div>
            </Form>
             <Row className="mt-3">
              <Col className="text-right" xs="12">
                {/* MODIFICATION: Utilisation de la nouvelle classe pour le lien */}
                <Link to="/auth/login" className="link-pubcash-secondary"><small>J'ai déjà un compte</small></Link>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>
    </>
  );
};

export default Register;