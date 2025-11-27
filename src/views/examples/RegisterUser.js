// src/views/examples/RegisterUser.js

import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom"; // <--- 1. AJOUT DE useSearchParams
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
  Spinner,
} from "reactstrap";
import api from "services/api";
import { useGoogleLogin } from '@react-oauth/google';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jwtDecode } from 'jwt-decode';
import './RegisterUser.css'; // Import du fichier CSS pour les styles
const RegisterUser = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // <--- 2. INITIALISATION DU HOOK
  const [formData, setFormData] = useState({
    nom_utilisateur: "",
    email: "",
    mot_de_passe: "",
    ville: "",
    commune: "",
    date_naissance: "",
    contact: "",
    genre: "",
    code_parrainage: "", // <--- 3. AJOUT DU CHAMP DANS LE STATE
  });

 const [confirmPassword, setConfirmPassword] = useState("");
  const [villes, setVilles] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [loadingVilles, setLoadingVilles] = useState(true);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [fbSDKLoaded, setFbSDKLoaded] = useState(false);

  // --- 4. NOUVEAU USEFFECT POUR RECUPERER LE CODE ---
  useEffect(() => {
    const refCode = searchParams.get('ref'); // Récupère ?ref=XYZ123
    if (refCode) {
      console.log("Code parrainage détecté:", refCode);
      setFormData(prev => ({ ...prev, code_parrainage: refCode }));
    }
  }, [searchParams]);
  // ---------------------------------------------------

  // Charger le SDK Facebook
  useEffect(() => {
    const loadFbSDK = () => {
      if (window.FB) {
        setFbSDKLoaded(true);
        return;
      }

      window.fbAsyncInit = function() {
        window.FB.init({
          appId: process.env.REACT_APP_FB_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v12.0'
        });
        setFbSDKLoaded(true);
        console.log('Facebook SDK loaded');
      };

      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/fr_FR/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    };

    loadFbSDK();
  }, []);

  // Charger les villes au montage
  useEffect(() => {
    const fetchVilles = async () => {
      try {
        setLoadingVilles(true);
        const response = await api.get("/villes");
        setVilles(response.data);
      } catch (error) {
        console.error("Erreur chargement villes:", error);
        toast.error("Impossible de charger les villes.");
      } finally {
        setLoadingVilles(false);
      }
    };
    fetchVilles();
  }, []);

  // Charger les communes quand la ville change
  useEffect(() => {
    const fetchCommunes = async () => {
      if (!formData.ville) {
        setCommunes([]);
        setFormData((f) => ({ ...f, commune: "" }));
        return;
      }
      try {
        setLoadingCommunes(true);
        const response = await api.get("/communes", { params: { ville: formData.ville } });
        setCommunes(response.data);
      } catch (error) {
        console.error("Erreur chargement communes:", error);
        toast.error("Impossible de charger les communes.");
        setCommunes([]);
      } finally {
        setLoadingCommunes(false);
      }
    };

    fetchCommunes();
  }, [formData.ville]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- GESTION DES LOGINS SOCIAUX ---

  const handleSocialLogin = (response) => {
    const { accessToken, refreshToken, profileCompleted } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    const decodedToken = jwtDecode(accessToken);
    localStorage.setItem('userRole', decodedToken.role);
    
    if (profileCompleted) {
      navigate("/user/dashboard", { replace: true });
    } else {
      navigate("/auth/complete-profile");
    }
  };
  const getFacebookAppId = () => {
    // En production, utilisez l'App ID de production
    if (window.location.hostname === 'pub-cash.com' || 
        window.location.hostname === 'www.pub-cash.com') {
      return process.env.REACT_APP_FB_APP_ID_PROD || process.env.REACT_APP_FB_APP_ID;
    }
    // En développement
    return process.env.REACT_APP_FB_APP_ID;
  };
 const handleGoogleSuccess = async (tokenResponse) => {
    try {
      // AJOUT : on envoie formData.code_parrainage
      const response = await api.post('/auth/google', { 
        accessToken: tokenResponse.access_token,
        code_parrainage: formData.code_parrainage 
      });
      handleSocialLogin(response);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Erreur lors de la connexion Google.";
      toast.error(errorMessage);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => toast.error("La connexion Google a échoué. Veuillez réessayer."),
  });

  // NOUVELLE APPROCHE FACEBOOK AVEC SDK DIRECT
  const loginWithFacebook = () => {
    if (!fbSDKLoaded) {
      toast.error("Facebook SDK n'est pas encore chargé. Veuillez réessayer.");
      return;
    }

    window.FB.login(function(response) {
      if (response.authResponse) {
        console.log("Facebook auth response:", response);
        handleFacebookResponse(response);
      } else {
        toast.warn('Connexion Facebook annulée.');
      }
    }, {
      scope: 'public_profile,email',
      return_scopes: true
    });
  };

  const handleFacebookResponse = async (response) => {
    if (response.authResponse && response.authResponse.accessToken) {
      try {
        // AJOUT : on envoie formData.code_parrainage
        const resApi = await api.post('/auth/facebook', { 
          accessToken: response.authResponse.accessToken,
          code_parrainage: formData.code_parrainage
        });
        handleSocialLogin(resApi);
      } catch (err) {
        const errorMessage = err.response?.data?.message || "Erreur lors de la connexion Facebook.";
        toast.error(errorMessage);
      }
    } else {
      toast.warn('Connexion Facebook annulée ou échouée.');
    }
  };

 // --- GESTION INSCRIPTION MANUELLE ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); 
    
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
      return;
    }
    if (formData.mot_de_passe !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (formData.mot_de_passe.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);
    try {
      // formData contient maintenant 'code_parrainage' grâce au useEffect
      await api.post("/auth/utilisateur/register", formData);
      setShowSuccessModal(true);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Erreur serveur lors de la création du compte";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModalAndRedirect = () => {
    setShowSuccessModal(false);
    navigate("/auth/login-user");
  };

  return (
    <Col lg="6" md="8">
      <ToastContainer position="top-right" autoClose={5000} />
      <Card className="bg-secondary shadow border-0">
        <CardBody className="px-lg-5 py-lg-5">
          <div className="text-center text-muted mb-4">
            <small>Inscription Utilisateur</small>
          </div>

          <div className="text-center mb-3">
            {/* BOUTON FACEBOOK - APPROCHE ALTERNATIVE */}
            <Button 
              className="social-btn facebook-btn"
              onClick={loginWithFacebook}
              disabled={!fbSDKLoaded}
            >
              <i className="fab fa-facebook-f" />
            </Button>

            {/* BOUTON GOOGLE - MÊME STYLE */}
            <Button 
              className="social-btn google-btn"
              onClick={() => googleLogin()}
            >
              <i className="fab fa-google" />
            </Button>

            <div className="small mt-2 text-muted">ou créez votre compte manuellement</div>
          </div>

          <Form onSubmit={handleRegister}>
            {/* Reste du formulaire inchangé */}
            <FormGroup>
              <InputGroup className="input-group-alternative mb-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-circle-08" /></InputGroupText>
                </InputGroupAddon>
                <Input name="nom_utilisateur" placeholder="Nom d'utilisateur *" value={formData.nom_utilisateur} onChange={handleChange} required />
              </InputGroup>
            </FormGroup>

            <FormGroup>
              <InputGroup className="input-group-alternative mb-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-email-83" /></InputGroupText>
                </InputGroupAddon>
                <Input type="email" name="email" placeholder="Email *" value={formData.email} onChange={handleChange} required />
              </InputGroup>
            </FormGroup>

            <FormGroup>
              <InputGroup className="input-group-alternative">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText>
                </InputGroupAddon>
                <Input type="password" name="mot_de_passe" placeholder="Mot de passe *" value={formData.mot_de_passe} onChange={handleChange} required minLength={6} />
              </InputGroup>
            </FormGroup>

            <FormGroup>
              <InputGroup className="input-group-alternative mt-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText>
                </InputGroupAddon>
                <Input 
                  type="password" 
                  name="confirmer_mot_de_passe" 
                  placeholder="Confirmer mot de passe *" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                />
              </InputGroup>
            </FormGroup>

            <FormGroup>
              <InputGroup className="input-group-alternative mt-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-calendar-grid-58" /></InputGroupText>
                </InputGroupAddon>
                <Input type="date" name="date_naissance" value={formData.date_naissance} onChange={handleChange} required />
              </InputGroup>
            </FormGroup>

            <FormGroup>
              <InputGroup className="input-group-alternative mt-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-mobile-button" /></InputGroupText>
                </InputGroupAddon>
                <Input type="tel" name="contact" placeholder="Contact" value={formData.contact} onChange={handleChange} />
              </InputGroup>
            </FormGroup>

            <FormGroup>
              <InputGroup className="input-group-alternative mt-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-badge" /></InputGroupText>
                </InputGroupAddon>
                <Input type="select" name="genre" value={formData.genre} onChange={handleChange}>
                  <option value="">Sélectionner votre genre</option>
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                </Input>
              </InputGroup>
            </FormGroup>

            <FormGroup>
              <InputGroup className="input-group-alternative mt-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-building" /></InputGroupText>
                </InputGroupAddon>
                <Input type="select" name="ville" value={formData.ville} onChange={handleChange} disabled={loadingVilles}>
                  <option value="">{loadingVilles ? "Chargement..." : "Choisir une ville"}</option>
                  {villes.map((ville) => (
                    <option key={ville.id} value={ville.nom}>{ville.nom}</option>
                  ))}
                </Input>
              </InputGroup>
            </FormGroup>

            <FormGroup>
              <InputGroup className="input-group-alternative mt-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-pin-3" /></InputGroupText>
                </InputGroupAddon>
                <Input type="select" name="commune" value={formData.commune} onChange={handleChange} required disabled={loadingCommunes || !formData.ville}>
                  <option value="">{loadingCommunes ? "Chargement..." : (formData.ville ? "Choisir une commune *" : "Sélectionnez d'abord une ville")}</option>
                  {communes.map((commune) => (
                    <option key={commune.id} value={commune.nom}>{commune.nom}</option>
                  ))}
                </Input>
              </InputGroup>
            </FormGroup>
 {/* --- 5. AJOUT DU CHAMP VISIBLE CODE PARRAINAGE (OPTIONNEL MAIS RECOMMANDÉ) --- */}
            <FormGroup>
              <InputGroup className="input-group-alternative mt-3">
                <InputGroupAddon addonType="prepend">
                  <InputGroupText><i className="ni ni-diamond" /></InputGroupText>
                </InputGroupAddon>
                <Input 
                    type="text" 
                    name="code_parrainage" 
                    placeholder="Code Parrainage (Optionnel)" 
                    value={formData.code_parrainage} 
                    onChange={handleChange}
                    // Tu peux le laisser éditable ou le désactiver si rempli par URL
                  // readOnly={!!searchParams.get('ref')} 
                />
              </InputGroup>
            </FormGroup>
            {error && (
              <div className="alert alert-danger text-center my-3 py-2">
                <small>{error}</small>
              </div>
            )}

            <div className="text-center">
              <Button color="primary" className="mt-4" type="submit" disabled={loading}>
                {loading ? <Spinner size="sm" /> : "Créer mon compte"}
              </Button>
            </div>
          </Form>

          <Row className="mt-3">
            <Col className="text-right" xs="12">
              <Link to="/auth/login-user" className="link-pubcash-secondary">
                <small>J'ai déjà un compte</small>
              </Link>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Modale de succès */}
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