// src/views/Register.js
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Button, Card, CardBody, Form, Input,
  InputGroup, InputGroupAddon, InputGroupText,
  Col, Row, Modal, ModalBody, Spinner
} from "reactstrap";
import api from '../../services/api';
// Assurez-vous que Auth.css est bien chargé dans le layout parent

const Register = () => {
  const navigate = useNavigate();
  
  // --- States ---
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Locations States
  const [loadingVilles, setLoadingVilles] = useState(true);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [villes, setVilles] = useState([]);
  const [communesForVille, setCommunesForVille] = useState([]);

  const [error, setError] = useState("");
  const [accountType, setAccountType] = useState('particulier'); // 'particulier' | 'entreprise'

  const [formData, setFormData] = useState({
    nom: "", prenom: "", nom_utilisateur: "",
    nom_entreprise: "", rccm: "",
    email: "", telephone: "",
    mot_de_passe: "", confirmer_mot_de_passe: "",
    ville_id: "", commune: "", genre: "",
  });

  // --- API Calls ---
  useEffect(() => {
    const fetchVilles = async () => {
      try {
        setLoadingVilles(true);
        const res = await api.get('/villes');
        setVilles(res.data || []);
      } catch (err) {
        console.error('Erreur chargement villes:', err);
        setError('Impossible de charger les villes. Réessayez plus tard.');
      } finally {
        setLoadingVilles(false);
      }
    };
    fetchVilles();
  }, []);

  const handleVilleChange = async (e) => {
    const villeId = e.target.value;
    setFormData(prev => ({ ...prev, ville_id: villeId, commune: "" }));
    setCommunesForVille([]);
    
    if (!villeId) return;

    setLoadingCommunes(true);
    try {
      const res = await api.get(`/villes/${villeId}/communes`);
      setCommunesForVille(res.data || []);
    } catch (err) {
      console.warn('Fallback: chargement global des communes...');
      try {
        const all = await api.get('/communes');
        const allData = all.data || [];
        const filtered = allData.filter(c => String(c.id_ville) === String(villeId));
        setCommunesForVille(filtered);
      } catch (err2) {
        console.error('Erreur chargement communes:', err2);
        setError('Impossible de charger les communes.');
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

    if (accountType === 'particulier') {
      if (!formData.nom || !formData.prenom || !formData.nom_utilisateur) {
        return setError("Veuillez remplir tous les champs obligatoires.");
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
        email: formData.email,
        telephone: formData.telephone,
        mot_de_passe: formData.mot_de_passe,
        commune: formData.commune,
        ville_id: formData.ville_id,
        ...(accountType === 'particulier' ? {
            nom: formData.nom,
            prenom: formData.prenom,
            nom_utilisateur: formData.nom_utilisateur,
            genre: formData.genre
        } : {
            nom_entreprise: formData.nom_entreprise,
            rccm: formData.rccm
        })
      };

      await api.post('/auth/client/register', payload);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Erreur inscription:', err);
      setError(err.response?.data?.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Col lg="8" md="10" className="mx-auto">
        {/* DESIGN FIX: auth-card pour le style blanc + ombre */}
        <Card className="auth-card border-0">
          <CardBody className="card-body-auth">
            
            <div className="text-center">
              {/* DESIGN FIX: Titre majuscule style maquette */}
              <h6 className="auth-header-subtitle">
                INSCRIVEZ-VOUS EN TANT QUE PROMOTEUR
              </h6>
              <div className="header-underline"></div>

              {/* Toggle Switch */}
            <div className="account-type-toggle">
  <button
    type="button"
    className={`toggle-btn ${accountType === 'particulier' ? 'active' : ''}`}
    onClick={() => setAccountType('particulier')}
  >
    Particulier
  </button>
  <button
    type="button"
    className={`toggle-btn ${accountType === 'entreprise' ? 'active' : ''}`}
    onClick={() => {
        setAccountType('entreprise');
        // On remet le genre à vide quand on passe en entreprise pour faire propre
        setFormData(prev => ({ ...prev, genre: "" })); 
    }}
  >
    Entreprise / Société
  </button>
</div>
            </div>

            <Form role="form" onSubmit={handleRegister}>
              <Row>
                {/* --- CHAMPS PARTICULIER --- */}
                {accountType === 'particulier' && (
                  <>
                    <Col md="6" className="mb-3">
                      <InputGroup className="custom-input-group">
                        <InputGroupAddon addonType="prepend">
                          <InputGroupText><i className="ni ni-single-02" /></InputGroupText>
                        </InputGroupAddon>
                        <Input placeholder="Prénom" type="text" name="prenom" value={formData.prenom} onChange={handleChange} className="form-control-auth" required />
                      </InputGroup>
                    </Col>
                    <Col md="6" className="mb-3">
                      <InputGroup className="custom-input-group">
                        <InputGroupAddon addonType="prepend">
                          <InputGroupText><i className="ni ni-single-02" /></InputGroupText>
                        </InputGroupAddon>
                        <Input placeholder="Nom" type="text" name="nom" value={formData.nom} onChange={handleChange} className="form-control-auth" required />
                      </InputGroup>
                    </Col>
                    <Col md="12" className="mb-3">
                      <InputGroup className="custom-input-group">
                        <InputGroupAddon addonType="prepend">
                          <InputGroupText><i className="ni ni-circle-08" /></InputGroupText>
                        </InputGroupAddon>
                        <Input placeholder="Nom d'utilisateur" type="text" name="nom_utilisateur" value={formData.nom_utilisateur} onChange={handleChange} className="form-control-auth" required />
                      </InputGroup>
                    </Col>
                  </>
                )}

                {/* --- CHAMPS ENTREPRISE --- */}
                {accountType === 'entreprise' && (
                  <>
                    <Col md="12" className="mb-3">
                      <InputGroup className="custom-input-group">
                        <InputGroupAddon addonType="prepend">
                          <InputGroupText><i className="ni ni-building" /></InputGroupText>
                        </InputGroupAddon>
                        <Input placeholder="Nom de l'entreprise / Société" type="text" name="nom_entreprise" value={formData.nom_entreprise} onChange={handleChange} className="form-control-auth" required />
                      </InputGroup>
                    </Col>
                    <Col md="12" className="mb-3">
                      <InputGroup className="custom-input-group">
                        <InputGroupAddon addonType="prepend">
                          <InputGroupText><i className="ni ni-briefcase-24" /></InputGroupText>
                        </InputGroupAddon>
                        <Input placeholder="Numéro RCCM" type="text" name="rccm" value={formData.rccm} onChange={handleChange} className="form-control-auth" required />
                      </InputGroup>
                    </Col>
                  </>
                )}

                {/* --- CHAMPS COMMUNS --- */}
                <Col md="12" className="mb-3">
                  <InputGroup className="custom-input-group">
                    <InputGroupAddon addonType="prepend">
                      <InputGroupText><i className="ni ni-email-83" /></InputGroupText>
                    </InputGroupAddon>
                    <Input placeholder="Email" type="email" name="email" value={formData.email} onChange={handleChange} className="form-control-auth" required />
                  </InputGroup>
                </Col>

                <Col md="6" className="mb-3">
                  <InputGroup className="custom-input-group">
                    <InputGroupAddon addonType="prepend">
                      <InputGroupText><i className="ni ni-mobile-button" /></InputGroupText>
                    </InputGroupAddon>
                    <Input placeholder="Téléphone" type="tel" name="telephone" value={formData.telephone} onChange={handleChange} className="form-control-auth" required />
                  </InputGroup>
                </Col>

       {accountType === 'particulier' && (
                  <Col md="6" className="mb-3">
                     <InputGroup className="custom-input-group">
                        <InputGroupAddon addonType="prepend">
                            <InputGroupText><i className="ni ni-badge" /></InputGroupText>
                        </InputGroupAddon>
                        <Input 
                          type="select" 
                          name="genre" 
                          value={formData.genre} 
                          onChange={handleChange} 
                          className="form-control-auth"
                          style={{cursor:'pointer', color: formData.genre ? '#1f2937' : '#9ca3af'}}
                        >
                            <option value="">Sélectionner votre genre (Optionnel)</option>
                            <option value="Homme">Homme</option>
                            <option value="Femme">Femme</option>
                        </Input>
                     </InputGroup>
                  </Col>
                )}
                <Col md="6" className="mb-3">
                  <InputGroup className="custom-input-group">
                    <InputGroupAddon addonType="prepend">
                        <InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText>
                    </InputGroupAddon>
                    <Input
                      placeholder="Mot de passe"
                      type={showPassword ? "text" : "password"}
                      name="mot_de_passe"
                      value={formData.mot_de_passe}
                      onChange={handleChange}
                      className="form-control-auth"
                      required
                    />
                    <InputGroupAddon addonType="append">
                      <InputGroupText onClick={() => setShowPassword(!showPassword)} style={{ cursor: "pointer" }}>
                        <i className={showPassword ? "fa fa-eye-slash" : "fa fa-eye"} />
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </Col>

                <Col md="6" className="mb-3">
                  <InputGroup className="custom-input-group">
                    <InputGroupAddon addonType="prepend">
                        <InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText>
                    </InputGroupAddon>
                    <Input
                      placeholder="Confirmer votre mot de passe"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmer_mot_de_passe"
                      value={formData.confirmer_mot_de_passe}
                      onChange={handleChange}
                      className="form-control-auth"
                      required
                    />
                    <InputGroupAddon addonType="append">
                      <InputGroupText onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ cursor: "pointer" }}>
                        <i className={showConfirmPassword ? "fa fa-eye-slash" : "fa fa-eye"} />
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </Col>

                {/* Ville & Commune */}
                <Col md="6" className="mb-3">
                  <InputGroup className="custom-input-group">
                    <InputGroupAddon addonType="prepend">
                      <InputGroupText><i className="ni ni-pin-3" /></InputGroupText>
                    </InputGroupAddon>
                    {loadingVilles ? (
                      <div className="d-flex align-items-center pl-3 text-muted w-100 small">
                          <Spinner size="sm" className="mr-2"/> Chargement...
                      </div>
                    ) : (
                      <Input 
                        type="select" name="ville_id" value={formData.ville_id} 
                        onChange={handleVilleChange} className="form-control-auth" required
                        style={{cursor:'pointer', color: formData.ville_id ? '#1f2937' : '#9ca3af'}}
                      >
                        <option value="">Sélectionner une ville...</option>
                        {villes.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
                      </Input>
                    )}
                  </InputGroup>
                </Col>

                <Col md="6" className="mb-3">
                  <InputGroup className="custom-input-group">
                    <InputGroupAddon addonType="prepend">
                      <InputGroupText><i className="ni ni-map-big" /></InputGroupText>
                    </InputGroupAddon>
                    {loadingCommunes ? (
                      <div className="d-flex align-items-center pl-3 text-muted w-100 small">
                          <Spinner size="sm" className="mr-2"/> Chargement...
                      </div>
                    ) : (
                      <Input 
                          type="select" name="commune" value={formData.commune} 
                          onChange={handleChange} className="form-control-auth" required
                          disabled={!formData.ville_id}
                          style={{cursor:'pointer', color: formData.commune ? '#1f2937' : '#9ca3af'}}
                      >
                        <option value="">Sélectionner une commune...</option>
                        {communesForVille.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)}
                      </Input>
                    )}
                  </InputGroup>
                </Col>
              </Row>

              {error && (
                <div className="alert alert-danger mt-3 text-center py-2 small border-0 bg-danger-light text-danger rounded">
                    <i className="ni ni-fat-remove mr-1"></i> {error}
                </div>
              )}

              <div className="text-center mt-5">
                <Button className="btn-pubcash" type="submit" disabled={loading}>
                  {loading ? <Spinner size="sm" /> : "Créer mon compte"}
                </Button>
              </div>
            </Form>

            <div className="text-center mt-4 separator-line">
               <Link to="/auth/login-client" className="link-create small">
                  J'ai déjà un compte
               </Link>
            </div>

          </CardBody>
        </Card>
      </Col>

      {/* MODAL SUCCESS (Ta logique conservée) */}
      <Modal isOpen={showSuccessModal} toggle={handleCloseModalAndRedirect} centered backdrop="static">
        <ModalBody className="text-center pt-5 pb-5">
          <div className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center mb-3 shadow-lg" style={{width: '80px', height: '80px'}}>
             <i className="ni ni-check-bold" style={{fontSize: '2rem'}}></i>
          </div>
          <h3 className="mt-3 font-weight-bold text-dark">Inscription réussie !</h3>
          <p className="text-muted px-4">
            Veuillez vérifier votre boîte mail (<strong>{formData.email}</strong>) pour valider votre compte.
          </p>
          <Button className="btn-pubcash mt-3 px-5" onClick={handleCloseModalAndRedirect}>
            OK, J'ai compris
          </Button>
        </ModalBody>
      </Modal>
    </>
  );
};

export default Register;