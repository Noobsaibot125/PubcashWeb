import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  Modal,
  ModalHeader,
  ModalBody,
} from "reactstrap";
import FacebookLoginButton from "components/FacebookLoginButton";
import api from "services/api"; // Utilisation de l'instance Axios centralisée

const RegisterUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom_utilisateur: "",
    email: "",
    mot_de_passe: "",
    ville: "",
    commune: "",
    date_naissance: "",
    contact: "",
  });

  const [villes, setVilles] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Nouvel état pour gérer l'affichage de la modale de succès
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Charger les villes au montage du composant
  useEffect(() => {
    fetchVilles();
  }, []);

  // Charger les communes quand la ville change
  useEffect(() => {
    if (formData.ville) {
      fetchCommunes(formData.ville);
    } else {
      setCommunes([]);
      setFormData((f) => ({ ...f, commune: "" }));
    }
  }, [formData.ville]);

  const fetchVilles = async () => {
    try {
      const response = await api.get("/villes");
      setVilles(response.data);
    } catch (error) {
      console.error("Erreur chargement villes:", error);
      // En cas d'erreur, on peut afficher un message à l'utilisateur si nécessaire
    }
  };

  const fetchCommunes = async (ville) => {
    try {
      const response = await api.get("/communes", { params: { ville } });
      setCommunes(response.data);
    } catch (error) {
      console.error("Erreur chargement communes:", error);
      setCommunes([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation des champs obligatoires
    const requiredFields = {
      nom_utilisateur: "Nom d'utilisateur",
      email: "Email",
      mot_de_passe: "Mot de passe",
      commune: "Commune",
      date_naissance: "Date de naissance",
    };

    const missingFields = Object.keys(requiredFields).filter(key => !formData[key]);

    if (missingFields.length > 0) {
      setError(`Champs obligatoires manquants: ${missingFields.map(key => requiredFields[key]).join(', ')}`);
      setLoading(false);
      return;
    }

    if (formData.mot_de_passe.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/utilisateur/register", formData);
      // Afficher la modale de succès
      setShowSuccessModal(true);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Erreur serveur lors de la création du compte";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour fermer la modale et rediriger l'utilisateur
  const handleCloseModalAndRedirect = () => {
    setShowSuccessModal(false);
    navigate("/auth/login");
  };

  return (
    <Col lg="6" md="8">
      <Card className="bg-secondary shadow border-0">
        <CardBody className="px-lg-5 py-lg-5">
          <div className="text-center text-muted mb-4">
            <small>Inscription Utilisateur</small>
          </div>
          <div className="text-center mb-3">
            <FacebookLoginButton />
            <div className="small mt-2 text-muted">ou créez votre compte manuellement</div>
          </div>

          <Form onSubmit={handleRegister}>
            {/* Nom utilisateur */}
            <FormGroup>
              <InputGroup className="input-group-alternative mb-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-circle-08" /></InputGroupText>
                </InputGroupAddon>
                <Input name="nom_utilisateur" placeholder="Nom d'utilisateur *" value={formData.nom_utilisateur} onChange={handleChange} required />
              </InputGroup>
            </FormGroup>

            {/* Email */}
            <FormGroup>
              <InputGroup className="input-group-alternative mb-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-email-83" /></InputGroupText>
                </InputGroupAddon>
                <Input type="email" name="email" placeholder="Email *" value={formData.email} onChange={handleChange} required />
              </InputGroup>
            </FormGroup>

            {/* Mot de passe */}
            <FormGroup>
              <InputGroup className="input-group-alternative">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText>
                </InputGroupAddon>
                <Input type="password" name="mot_de_passe" placeholder="Mot de passe *" value={formData.mot_de_passe} onChange={handleChange} required minLength={6} />
              </InputGroup>
            </FormGroup>

            {/* Date de naissance */}
            <FormGroup>
              <InputGroup className="input-group-alternative mt-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-calendar-grid-58" /></InputGroupText>
                </InputGroupAddon>
                <Input type="date" name="date_naissance" value={formData.date_naissance} onChange={handleChange} required />
              </InputGroup>
            </FormGroup>

            {/* Contact */}
            <FormGroup>
              <InputGroup className="input-group-alternative mt-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-mobile-button" /></InputGroupText>
                </InputGroupAddon>
                <Input type="tel" name="contact" placeholder="Contact (optionnel)" value={formData.contact} onChange={handleChange} />
              </InputGroup>
            </FormGroup>

            {/* Ville */}
            <FormGroup>
              <InputGroup className="input-group-alternative mt-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-building" /></InputGroupText>
                </InputGroupAddon>
                <Input type="select" name="ville" value={formData.ville} onChange={handleChange}>
                  <option value="">Choisir une ville (optionnel)</option>
                  {villes.map((ville) => (
                    <option key={ville.id} value={ville.nom}>{ville.nom}</option>
                  ))}
                </Input>
              </InputGroup>
            </FormGroup>

            {/* Commune (OBLIGATOIRE) */}
            <FormGroup>
              <InputGroup className="input-group-alternative mt-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-pin-3" /></InputGroupText>
                </InputGroupAddon>
                <Input type="select" name="commune" value={formData.commune} onChange={handleChange} required disabled={!formData.ville || !communes.length}>
                  <option value="">{formData.ville ? "Choisir une commune *" : "Sélectionnez d'abord une ville"}</option>
                  {communes.map((commune) => (
                    <option key={commune.id} value={commune.nom}>{commune.nom}</option>
                  ))}
                </Input>
              </InputGroup>
              {formData.ville && !communes.length && (
                <small className="text-warning mt-1 d-block">Chargement des communes...</small>
              )}
            </FormGroup>

            {error && (
              <div className="alert alert-danger text-center my-3 py-2">
                <small>{error}</small>
              </div>
            )}

            <div className="text-center">
              <Button color="primary" className="mt-4" type="submit" disabled={loading}>
                {loading ? "Création en cours..." : "Créer mon compte"}
              </Button>
            </div>
          </Form>

          <Row className="mt-3">
            <Col className="text-right" xs="12">
              <Link to="/auth/login" className="text-light">
                <small>J'ai déjà un compte</small>
              </Link>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Modale de succès stylisée */}
      <Modal isOpen={showSuccessModal} toggle={handleCloseModalAndRedirect} centered>
        <ModalHeader toggle={handleCloseModalAndRedirect} className="text-success border-0 pb-0">
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Inscription Réussie !</span>
        </ModalHeader>
        <ModalBody className="text-center pt-0">
            <i className="ni ni-check-bold ni-4x text-success my-3"></i> 
            <p style={{ color: 'black', fontSize: '1.1rem' }}>
              Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.
            </p>
            <Button color="success" onClick={handleCloseModalAndRedirect} className="mt-2 mb-3">
              Aller à la connexion
            </Button>
        </ModalBody>
      </Modal>
    </Col>
  );
};

export default RegisterUser;