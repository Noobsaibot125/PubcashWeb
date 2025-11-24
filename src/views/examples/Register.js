// src/views/Register.js
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Button, Card, CardBody, FormGroup, Form, Input,
  InputGroupAddon, InputGroupText, InputGroup, Row, Col,
  Modal, ModalHeader, ModalBody, Spinner
} from "reactstrap";
import api from '../../services/api'; // ton axios instance

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [accountType, setAccountType] = useState('particulier'); // 'particulier' ou 'entreprise'
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    nom_utilisateur: "",
    nom_entreprise: "", // Nouveau champ
    rccm: "",           // Nouveau champ
    email: "",
    telephone: "",
    mot_de_passe: "",
    confirmer_mot_de_passe: "",
    ville_id: "",
    commune: "",
    genre: "",
  });

  const [villes, setVilles] = useState([]);
  const [communesForVille, setCommunesForVille] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingVilles, setLoadingVilles] = useState(true);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVilles = async () => {
      try {
        setLoadingVilles(true);
        const res = await api.get('/villes'); // => baseURL + /villes
        setVilles(res.data || []);
        console.log('Villes reçues:', res.data);
      } catch (err) {
        console.error('Impossible de charger les villes', err?.response?.status, err?.response?.data || err.message);
        setError('Impossible de charger les villes. Réessaye plus tard.');
      } finally {
        setLoadingVilles(false);
      }
    };
    fetchVilles();
  }, []);

  // Lorsqu'on sélectionne une ville : on charge les communes correspondantes
  const handleVilleChange = async (e) => {
    const villeId = e.target.value;
    setFormData(prev => ({ ...prev, ville_id: villeId, commune: "" }));
    setCommunesForVille([]);
    if (!villeId) return;

    setLoadingCommunes(true);
    try {
      // Endpoint attendu : GET /villes/:id/communes (public)
      const res = await api.get(`/villes/${villeId}/communes`);
      setCommunesForVille(res.data || []);
      console.log(`Communes pour ville ${villeId}:`, res.data);
    } catch (err) {
      console.warn('GET /villes/:id/communes failed -> fallback to /communes', err?.response?.status);
      // fallback: si la route /villes/:id/communes n'existe pas, on prend /communes et on filtre
      try {
        const all = await api.get('/communes');
        const allData = all.data || [];
        const filtered = allData.filter(c => String(c.id_ville) === String(villeId));
        setCommunesForVille(filtered);
        console.log('Fallback communes filtrées:', filtered);
      } catch (err2) {
        console.error('Impossible de charger les communes (fallback échoué):', err2?.response?.status, err2?.message);
        setError('Impossible de charger les communes pour cette ville.');
      }
    } finally {
      setLoadingCommunes(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCloseModalAndRedirect = () => {
    setShowSuccessModal(false);
    navigate("/auth/verify-otp", { state: { email: formData.email } });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.mot_de_passe !== formData.confirmer_mot_de_passe) {
      return setError("Les mots de passe ne correspondent pas.");
    }
    if (!formData.ville_id) return setError("Veuillez sélectionner une ville.");
    if (!formData.commune) return setError("Veuillez sélectionner une commune.");

    // Validation spécifique
    if (accountType === 'particulier') {
      if (!formData.nom || !formData.prenom || !formData.nom_utilisateur) {
        return setError("Veuillez remplir tous les champs obligatoires (Nom, Prénom, Nom d'utilisateur).");
      }
    } else {
      if (!formData.nom_entreprise || !formData.rccm) {
        return setError("Veuillez remplir le nom de l'entreprise et le RCCM.");
      }
    }

    setLoading(true);
    try {
      const payload = {
        type_compte: accountType,
        // Champs communs
        email: formData.email,
        telephone: formData.telephone,
        mot_de_passe: formData.mot_de_passe,
        commune: formData.commune,
        ville_id: formData.ville_id,

        // Champs conditionnels
        nom: accountType === 'particulier' ? formData.nom : null,
        prenom: accountType === 'particulier' ? formData.prenom : null,
        nom_utilisateur: accountType === 'particulier' ? formData.nom_utilisateur : null,
        genre: accountType === 'particulier' ? formData.genre : null,

        nom_entreprise: accountType === 'entreprise' ? formData.nom_entreprise : null,
        rccm: accountType === 'entreprise' ? formData.rccm : null,
      };

      const res = await api.post('/auth/client/register', payload);
      console.log('Inscription réussie:', res.data);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Erreur inscription:', err?.response?.status, err?.response?.data || err.message);
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription.');
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

              {/* Toggle Particulier / Entreprise */}
              <div className="text-center mb-4">
                <div className="btn-group btn-group-toggle" data-toggle="buttons">
                  <Button
                    color={accountType === 'particulier' ? "primary" : "secondary"}
                    onClick={() => setAccountType('particulier')}
                    size="sm"
                    active={accountType === 'particulier'}
                  >
                    Particulier
                  </Button>
                  <Button
                    color={accountType === 'entreprise' ? "primary" : "secondary"}
                    onClick={() => setAccountType('entreprise')}
                    size="sm"
                    active={accountType === 'entreprise'}
                  >
                    Entreprise / Société
                  </Button>
                </div>
              </div>

              {/* Champs pour Particulier */}
              {accountType === 'particulier' && (
                <>
                  {/* Prénom */}
                  <FormGroup>
                    <InputGroup className="input-group-alternative mb-3">
                      <InputGroupAddon addonType="prepend">
                        <InputGroupText><i className="ni ni-single-02" /></InputGroupText>
                      </InputGroupAddon>
                      <Input placeholder="Prénom" type="text" name="prenom" value={formData.prenom} onChange={handleChange} required />
                    </InputGroup>
                  </FormGroup>

                  {/* Nom */}
                  <FormGroup>
                    <InputGroup className="input-group-alternative mb-3">
                      <InputGroupAddon addonType="prepend">
                        <InputGroupText><i className="ni ni-single-02" /></InputGroupText>
                      </InputGroupAddon>
                      <Input placeholder="Nom" type="text" name="nom" value={formData.nom} onChange={handleChange} required />
                    </InputGroup>
                  </FormGroup>

                  {/* Nom utilisateur */}
                  <FormGroup>
                    <InputGroup className="input-group-alternative mb-3">
                      <InputGroupAddon addonType="prepend">
                        <InputGroupText><i className="ni ni-circle-08" /></InputGroupText>
                      </InputGroupAddon>
                      <Input placeholder="Nom d'utilisateur" type="text" name="nom_utilisateur" value={formData.nom_utilisateur} onChange={handleChange} required />
                    </InputGroup>
                  </FormGroup>
                </>
              )}

              {/* Champs pour Entreprise */}
              {accountType === 'entreprise' && (
                <>
                  {/* Nom de l'entreprise */}
                  <FormGroup>
                    <InputGroup className="input-group-alternative mb-3">
                      <InputGroupAddon addonType="prepend">
                        <InputGroupText><i className="ni ni-building" /></InputGroupText>
                      </InputGroupAddon>
                      <Input placeholder="Nom de l'entreprise / Société" type="text" name="nom_entreprise" value={formData.nom_entreprise} onChange={handleChange} required />
                    </InputGroup>
                  </FormGroup>

                  {/* RCCM */}
                  <FormGroup>
                    <InputGroup className="input-group-alternative mb-3">
                      <InputGroupAddon addonType="prepend">
                        <InputGroupText><i className="ni ni-briefcase-24" /></InputGroupText>
                      </InputGroupAddon>
                      <Input placeholder="Numéro RCCM" type="text" name="rccm" value={formData.rccm} onChange={handleChange} required />
                    </InputGroup>
                  </FormGroup>
                </>
              )}

              {/* Email */}
              <FormGroup>
                <InputGroup className="input-group-alternative mb-3">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText><i className="ni ni-email-83" /></InputGroupText>
                  </InputGroupAddon>
                  <Input placeholder="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                </InputGroup>
              </FormGroup>

              {/* Téléphone */}
              <FormGroup>
                <InputGroup className="input-group-alternative mb-3">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText><i className="ni ni-mobile-button" /></InputGroupText>
                  </InputGroupAddon>
                  <Input placeholder="Téléphone" type="tel" name="telephone" value={formData.telephone} onChange={handleChange} required />
                </InputGroup>
              </FormGroup>
              {/* genre - Optionnel pour entreprise ? On le laisse pour l'instant ou on le cache si entreprise */}
              {accountType === 'particulier' && (
                <FormGroup>
                  <InputGroup className="input-group-alternative mb-3">
                    <InputGroupAddon addonType="prepend">
                      <InputGroupText><i className="ni ni-badge" /></InputGroupText>
                    </InputGroupAddon>
                    <Input type="select" name="genre" value={formData.genre} onChange={handleChange}>
                      <option value="">Sélectionner votre genre (Optionnel)</option>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                    </Input>
                  </InputGroup>
                </FormGroup>
              )}

              {/* Mot de passe */}
              <FormGroup>
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend"><InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText></InputGroupAddon>
                  <Input
                    placeholder="Mot de passe"
                    type={showPassword ? "text" : "password"}
                    name="mot_de_passe"
                    value={formData.mot_de_passe}
                    onChange={handleChange}
                    required
                  />
                  <InputGroupAddon addonType="append">
                    <InputGroupText onClick={() => setShowPassword(!showPassword)} style={{ cursor: "pointer" }}>
                      <i className={showPassword ? "ni ni-eye-17" : "ni ni-fat-remove"} />
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </FormGroup>

              {/* Confirmer mot de passe */}
              <FormGroup>
                <InputGroup className="input-group-alternative mb-3">
                  <InputGroupAddon addonType="prepend"><InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText></InputGroupAddon>
                  <Input
                    placeholder="Confirmer votre mot de passe"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmer_mot_de_passe"
                    value={formData.confirmer_mot_de_passe}
                    onChange={handleChange}
                    required
                  />
                  <InputGroupAddon addonType="append">
                    <InputGroupText onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ cursor: "pointer" }}>
                      <i className={showConfirmPassword ? "ni ni-eye-17" : "ni ni-fat-remove"} />
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </FormGroup>

              {/* Ville */}
              <FormGroup>
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText><i className="ni ni-pin-3" /></InputGroupText>
                  </InputGroupAddon>
                  {loadingVilles ? (
                    <div style={{ padding: '8px 12px' }}><Spinner size="sm" /></div>
                  ) : (
                    <Input type="select" name="ville" value={formData.ville_id} onChange={handleVilleChange} required>
                      <option value="">Sélectionner une ville...</option>
                      {villes.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
                    </Input>
                  )}
                </InputGroup>
              </FormGroup>

              {/* Commune */}
              <FormGroup>
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText><i className="ni ni-pin-3" /></InputGroupText>
                  </InputGroupAddon>
                  {loadingCommunes ? (
                    <div style={{ padding: '8px 12px' }}><Spinner size="sm" /></div>
                  ) : (
                    <Input type="select" name="commune" value={formData.commune} onChange={handleChange} required>
                      <option value="">Sélectionner une commune...</option>
                      {communesForVille.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)}
                    </Input>
                  )}
                </InputGroup>
              </FormGroup>

              {error && <div className="text-center text-danger my-2"><small>{error}</small></div>}

              <div className="text-center">
                <Button className="mt-4 btn-pubcash-primary" type="submit" disabled={loading}>
                  {loading ? "Création..." : "Créer mon compte"}
                </Button>
              </div>
            </Form>

            <Row className="mt-3">
              <Col className="text-right" xs="12">
                <Link to="/auth/login" className="link-pubcash-secondary"><small>J'ai déjà un compte</small></Link>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>

      <Modal isOpen={showSuccessModal} toggle={handleCloseModalAndRedirect} centered>
        <ModalHeader toggle={handleCloseModalAndRedirect} className="text-success">
          <span style={{ fontWeight: 'bold' }}>Inscription réussie !</span>
        </ModalHeader>
        <ModalBody>
          <div className="text-center">
            <i className="ni ni-send ni-3x text-success mb-3"></i>
            <p style={{ color: 'black' }}>
              Veuillez confirmer votre compte avec le code que nous vous avons envoyé sur votre mail.
            </p>
            <Button color="success" onClick={handleCloseModalAndRedirect}>
              J'ai compris
            </Button>
          </div>
        </ModalBody>
      </Modal>
    </>
  );
};

export default Register;
