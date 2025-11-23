// views/examples/LoginClient.js
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from '../../services/api';
import { jwtDecode } from 'jwt-decode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Button, Card, CardBody, FormGroup, Form, Input,
  InputGroupAddon, InputGroupText, InputGroup, Row, Col,
} from "reactstrap";

const LoginClient = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // --- NOUVEAU : État pour l'œil ---
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.body.classList.add('hide-navbar');
    return () => document.body.classList.remove('hide-navbar');
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // --- Configuration du Popup Stylisé ---
  const toastOptions = {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "colored",
    style: { fontSize: '16px', fontWeight: 'bold' }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // 1. VÉRIFICATION LOCALE
    if (!email.trim() || !password.trim()) {
      toast.error("Email et mot de passe requis.", toastOptions);
      return;
    }

    setLoading(true);

    try {
      // API endpoint pour CLIENT
      const response = await api.post('/auth/client/login', { email, password });
      const { accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      const decodedToken = jwtDecode(accessToken);
      localStorage.setItem('userRole', decodedToken.role);

      // Redirection vers CLIENT
      navigate("/client/index", { replace: true });

    } catch (err) {
      // 2. ERREUR API : Message générique sécurisé
      // Note : Si tu veux garder la logique "Compte non vérifié", tu peux ajouter un if ici.
      // Pour l'instant, je standardise comme demandé :
      toast.error('Email ou mot de passe incorrect.', toastOptions);

    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <Col lg="5" md="7">
        <Card className="bg-secondary shadow border-0">
          <CardBody className="px-lg-5 py-lg-5">
            <div className="text-center text-muted mb-4">
              <small className='MM'>Connexion Promoteur (Client)</small>
            </div>
            <Form role="form" onSubmit={handleLogin}>
              <FormGroup className="mb-3">
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend"><InputGroupText><i className="ni ni-email-83" /></InputGroupText></InputGroupAddon>
                  <Input
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  // "required" retiré pour laisser le Toast gérer l'alerte
                  />
                </InputGroup>
              </FormGroup>
              <FormGroup>
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend"><InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText></InputGroupAddon>

                  {/* --- MODIFIÉ : Gestion Show/Hide Password --- */}
                  <Input
                    placeholder="Mot de passe"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />

                  <InputGroupAddon addonType="append">
                    <InputGroupText onClick={togglePasswordVisibility} style={{ cursor: 'pointer' }}>
                      <i className={showPassword ? "fa fa-eye-slash" : "fa fa-eye"} />
                    </InputGroupText>
                  </InputGroupAddon>

                </InputGroup>
              </FormGroup>

              <div className="text-center">
                <Button
                  className="my-4 btn-pubcash-primary"
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </div>
            </Form>

            <div className="text-center mt-3">
              <Link to="/auth/forgot-password" className="text-muted">
                <small>Mot de passe oublié ?</small>
              </Link>
            </div>

            <Row className="mt-3">
              <Col className="text-right" xs="12">
                <Link to="/auth/register" className="link-pubcash-secondary">
                  <small>Créer un compte promoteur</small>
                </Link>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>
    </>
  );
};
export default LoginClient;