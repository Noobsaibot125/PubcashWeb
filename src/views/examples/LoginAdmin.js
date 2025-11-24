// views/examples/LoginAdmin.js
import React, { useState, useEffect } from "react";
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
  Col
} from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jwtDecode } from "jwt-decode";
import api from 'services/api';

const LoginAdmin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // --- NOUVEAU : État pour l'œil ---
  const [showPassword, setShowPassword] = useState(false);

  // --- NOUVEAU : État pour le code d'accès ---
  const [accessCode, setAccessCode] = useState("");
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);

  useEffect(() => {
    document.body.classList.add('hide-navbar');
    return () => document.body.classList.remove('hide-navbar');
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleAccessCodeVisibility = () => {
    setShowAccessCode(!showAccessCode);
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

  const handleAccessCodeSubmit = (e) => {
    e.preventDefault();
    // CODE SECRET HARDCODÉ (À changer si besoin)
    if (accessCode === "*.ADMIN@2025KKStechnologies2022@#.*") {
      setIsAccessGranted(true);
      toast.success("Accès autorisé.", toastOptions);
    } else {
      toast.error("Code d'accès incorrect.", toastOptions);
    }
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
      // API endpoint pour ADMIN
      const response = await api.post('/auth/admin/login', { email, password });
      const { accessToken, refreshToken, role } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      const decodedToken = jwtDecode(accessToken);
      localStorage.setItem('userRole', decodedToken.role);

      // Redirection vers ADMIN (en fonction du rôle exact)
      if (role === 'superadmin') navigate("/super-admin/dashboard", { replace: true });
      else navigate("/admin/dashboard", { replace: true });

    } catch (err) {
      // 2. ERREUR API : Message générique sécurisé
      toast.error('Email ou mot de passe incorrect.', toastOptions);
    } finally {
      setLoading(false);
    }
  };

  if (!isAccessGranted) {
    return (
      <>
        <ToastContainer />
        <Col lg="5" md="7">
          <Card className="bg-secondary shadow border-0">
            <CardBody className="px-lg-5 py-lg-5">
              <div className="text-center text-muted mb-4">
                <small className='MM'>Sécurité Admin</small>
                <p className="text-muted mt-2"><small>Veuillez entrer le code d'accès pour continuer.</small></p>
              </div>
              <Form role="form" onSubmit={handleAccessCodeSubmit}>
                <FormGroup className="mb-3">
                  <InputGroup className="input-group-alternative">
                    <InputGroupAddon addonType="prepend"><InputGroupText><i className="ni ni-key-25" /></InputGroupText></InputGroupAddon>
                    <Input
                      placeholder="Code d'accès"
                      type={showAccessCode ? "text" : "password"}
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                    />
                    <InputGroupAddon addonType="append">
                      <InputGroupText onClick={toggleAccessCodeVisibility} style={{ cursor: 'pointer' }}>
                        <i className={showAccessCode ? "fa fa-eye-slash" : "fa fa-eye"} />
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </FormGroup>
                <div className="text-center">
                  <Button className="my-4 btn-pubcash-primary" type="submit">Valider</Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </>
    );
  }

  return (
    <>
      <ToastContainer />
      <Col lg="5" md="7">
        <Card className="bg-secondary shadow border-0">
          <CardBody className="px-lg-5 py-lg-5">
            <div className="text-center text-muted mb-4">
              <small className='MM'>Connexion Administrateur</small>
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
                  // "required" retiré
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
          </CardBody>
        </Card>
      </Col>
    </>
  );
};
export default LoginAdmin;