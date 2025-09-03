// src/views/examples/RegisterUser.js
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Button, Card, CardBody, FormGroup, Form, Input,
  InputGroupAddon, InputGroupText, InputGroup, Row, Col
} from "reactstrap";

// Import du bouton Facebook (assure-toi d'avoir créé ce composant)
import FacebookLoginButton from "components/FacebookLoginButton";

const RegisterUser = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom_utilisateur: "",
    email: "",
    mot_de_passe: "",
    commune_choisie: "Choisir une commune",
    date_naissance: "",
    contact: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.date_naissance) {
      setError("La date de naissance est obligatoire");
      return;
    }

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL}/auth/utilisateur/register`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setSuccess("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
      setTimeout(() => navigate("/auth/login"), 3000);

    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    }
  };

  return (
    <Col lg="6" md="8">
      <Card className="bg-secondary shadow border-0">
        <CardBody className="px-lg-5 py-lg-5">
          <div className="text-center text-muted mb-4">
            <small>Inscription Utilisateur</small>
          </div>

          {/* BOUTON FACEBOOK - s'inscrire / se connecter via FB */}
          <div className="text-center mb-3">
            <FacebookLoginButton />
            <div className="small mt-2 text-muted">ou créez votre compte manuellement</div>
          </div>

          <Form role="form" onSubmit={handleRegister}>
            {/* ... le reste du formulaire identique ... */}
            <FormGroup>
              <InputGroup className="input-group-alternative mb-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-circle-08" /></InputGroupText>
                </InputGroupAddon>
                <Input 
                  placeholder="Nom d'utilisateur" 
                  type="text" 
                  name="nom_utilisateur" 
                  value={formData.nom_utilisateur} 
                  onChange={handleChange} 
                  required 
                />
              </InputGroup>
            </FormGroup>

            {/* Email */}
            <FormGroup>
              <InputGroup className="input-group-alternative mb-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-email-83" /></InputGroupText>
                </InputGroupAddon>
                <Input 
                  placeholder="Email" 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                />
              </InputGroup>
            </FormGroup>

            {/* Mot de passe */}
            <FormGroup>
              <InputGroup className="input-group-alternative">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText>
                </InputGroupAddon>
                <Input 
                  placeholder="Mot de passe" 
                  type="password" 
                  name="mot_de_passe" 
                  value={formData.mot_de_passe} 
                  onChange={handleChange} 
                  required 
                />
              </InputGroup>
            </FormGroup>

            {/* Date de naissance */}
            <FormGroup>
              <InputGroup className="input-group-alternative mt-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-calendar-grid-58" /></InputGroupText>
                </InputGroupAddon>
                <Input 
                  placeholder="Date de naissance" 
                  type="date" 
                  name="date_naissance" 
                  value={formData.date_naissance} 
                  onChange={handleChange} 
                  required 
                />
              </InputGroup>
            </FormGroup>

            {/* Contact */}
            <FormGroup>
              <InputGroup className="input-group-alternative mt-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-mobile-button" /></InputGroupText>
                </InputGroupAddon>
                <Input 
                  placeholder="Contact (optionnel)" 
                  type="tel" 
                  name="contact" 
                  value={formData.contact} 
                  onChange={handleChange} 
                />
              </InputGroup>
            </FormGroup>

            {/* Commune */}
            <FormGroup>
              <InputGroup className="input-group-alternative mt-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-pin-3" /></InputGroupText>
                </InputGroupAddon>
                <Input 
                  type="select" 
                  name="commune_choisie" 
                  value={formData.commune_choisie} 
                  onChange={handleChange} 
                  required
                >
                  <option value="Choisir une commune" disabled>Choisir une commune</option>
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
            {success && <div className="text-center text-success my-2"><small>{success}</small></div>}
            
            <div className="text-center">
              <Button className="mt-4" color="primary" type="submit">Créer mon compte</Button>
            </div>
          </Form>
          
          <Row className="mt-3">
            <Col className="text-right" xs="12">
              <Link to="/auth/login" className="text-light"><small>J'ai déjà un compte</small></Link>
            </Col>
          </Row>
        </CardBody>
      </Card>
    </Col>
  );
};

export default RegisterUser;
