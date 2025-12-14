// views/examples/LoginClient.js
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from '../../services/api'; 
import { jwtDecode } from 'jwt-decode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Button, Card, CardBody, FormGroup, Form, Input,
  InputGroupAddon, InputGroupText, InputGroup, Col, Spinner
} from "reactstrap";
// Assurez-vous que Auth.css est importé dans le layout parent (Auth.js)

const LoginClient = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const toastOptions = {
    position: "top-center",
    autoClose: 5000, // Augmenté un peu pour laisser le temps de lire les messages longs (ex: blocage)
    theme: "colored",
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validation basique
    if (!email.trim() || !password.trim()) {
      toast.error("Veuillez remplir tous les champs.", toastOptions);
      return;
    }
    
    setLoading(true);

    try {
      const response = await api.post('/auth/client/login', { email, password });
      const { accessToken, refreshToken } = response.data;

      // Stockage des tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Décodage et stockage du rôle
      try {
        const decodedToken = jwtDecode(accessToken);
        localStorage.setItem('userRole', decodedToken.role);
      } catch (e) {
        console.error("Erreur décodage token", e);
      }

      // Redirection
      toast.success("Connexion réussie !", { ...toastOptions, autoClose: 1500 });
      setTimeout(() => {
          navigate("/client/index", { replace: true });
      }, 1000);

    } catch (err) {
      console.error("Erreur login:", err);

      // --- CORRECTION MAJEURE ICI ---
      // On vérifie si le backend a renvoyé un message spécifique (ex: Compte bloqué, Non vérifié)
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(err.response.data.message, toastOptions);
      } else {
        // Message par défaut si le serveur est éteint ou erreur inconnue
        toast.error('Email ou mot de passe incorrect, ou erreur serveur.', toastOptions);
      }
      // -----------------------------

    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <Col lg="5" md="7" className="mx-auto">
        <Card className="auth-card border-0">
          <CardBody className="card-body-auth">
            
            {/* --- HEADER --- */}
            <div className="text-center">
              <h6 className="login-header-subtitle">
                CONNEXION PROMOTEUR (CLIENT)
              </h6>
              <div className="header-underline"></div>
            </div>

            <Form role="form" onSubmit={handleLogin}>
              <FormGroup className="mb-3">
                <InputGroup className="custom-input-group">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText><i className="ni ni-email-83" /></InputGroupText>
                  </InputGroupAddon>
                  <Input
                    placeholder="Email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control-auth"
                  />
                </InputGroup>
              </FormGroup>

              <FormGroup className="mb-4">
                <InputGroup className="custom-input-group">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText>
                  </InputGroupAddon>
                  <Input
                    placeholder="Mot de passe"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control-auth"
                  />
                  <InputGroupAddon addonType="append">
                    <InputGroupText 
                      onClick={togglePasswordVisibility} 
                      style={{ cursor: 'pointer' }}
                    >
                      <i className={showPassword ? "fa fa-eye-slash" : "fa fa-eye"} />
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </FormGroup>

              <div className="text-center">
                <Button
                  className="btn-pubcash my-2"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" color="light" /> : 'Se connecter'}
                </Button>
              </div>
            </Form>

            <div className="text-center mt-3">
              <Link 
                to="/auth/forgot-password" 
                className="link-forgot"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* --- FOOTER --- */}
            <div className="text-center separator-line">
               <Link to="/auth/register" className="link-create">
                  Créer un compte promoteur
               </Link>
            </div>

          </CardBody>
        </Card>
      </Col>
    </>
  );
};

export default LoginClient;