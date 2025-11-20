// views/examples/LoginUser.js
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from '../../services/api';
import { jwtDecode } from 'jwt-decode'; 
import FacebookLoginButton from 'components/FacebookLoginButton';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Button, Card, CardBody, FormGroup, Form, Input,
  InputGroupAddon, InputGroupText, InputGroup, Row, Col,
} from "reactstrap";

const LoginUser = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.body.classList.add('hide-navbar');
    return () => document.body.classList.remove('hide-navbar');
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Configuration commune pour le Toast (pour éviter de répéter le code)
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

    // 1. VÉRIFICATION LOCALE : Si les champs sont vides
    if (!identifier.trim() || !password.trim()) {
      toast.error("Email et mot de passe requis.", toastOptions);
      return; // On arrête ici, on n'appelle pas l'API
    }

    try {
      const response = await api.post('/auth/utilisateur/login', { identifier, password });
      const { accessToken, refreshToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      const decodedToken = jwtDecode(accessToken);
      localStorage.setItem('userRole', decodedToken.role); 

      navigate("/user/dashboard", { replace: true });

    } catch (err) {
      // 2. ERREUR API : Si le login échoue (401, 400, etc.)
      // On affiche le message spécifique demandé
      toast.error("Email ou mot de passe incorrect.", toastOptions);
    }
  };

  return (
    <>
      <ToastContainer />
      
      <Col lg="5" md="7">
        <Card className="bg-secondary shadow border-0">
          <CardBody className="px-lg-5 py-lg-5">
            <div className="text-center text-muted mb-4">
              <small className='MM'>Connexion Utilisateur</small>
            </div>
            
            {/* Note: J'ai enlevé 'required' des inputs pour laisser le JS gérer le Toast "Requis" */}
            <Form role="form" onSubmit={handleLogin}>
              <FormGroup className="mb-3">
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText><i className="ni ni-email-83" /></InputGroupText>
                  </InputGroupAddon>
                  <Input 
                    placeholder="Email ou Téléphone" 
                    type="text" 
                    value={identifier} 
                    onChange={(e) => setIdentifier(e.target.value)} 
                  />
                </InputGroup>
              </FormGroup>

              <FormGroup>
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText>
                  </InputGroupAddon>
                  
                  <Input 
                    placeholder="Mot de passe" 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                  
                  <InputGroupAddon addonType="append">
                    <InputGroupText onClick={togglePasswordVisibility} style={{ cursor: 'pointer' }}>
                      <i className={showPassword ? "fa fa-eye-slash" : "fa fa-eye"} />
                    </InputGroupText>
                  </InputGroupAddon>

                </InputGroup>
              </FormGroup>
             
              <div className="text-center">
                <Button className="my-4 btn-pubcash-primary" type="submit">Se connecter</Button>
              </div>
              <div className="text-center mb-2">
                <FacebookLoginButton />
              </div>
            </Form>
            <Row className="mt-3">
              <Col className="text-right" xs="12">
                 <Link to="/auth/register-user" className="link-pubcash-secondary"><small>Créer un compte utilisateur</small></Link>
              </Col>
            </Row>
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

export default LoginUser;