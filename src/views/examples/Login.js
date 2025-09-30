// src/views/auth/Login.js
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
// Importez votre instance Axios personnalisée
import api from '../../services/api'; // Ajustez le chemin si nécessaire
import { jwtDecode } from 'jwt-decode'; // Pour décoder l'accessToken après connexion

import FacebookLoginButton from 'components/FacebookLoginButton';
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

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.classList.add('hide-navbar');
    return () => {
      document.body.classList.remove('hide-navbar');
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Utilisez votre instance 'api' au lieu de 'fetch' directement
      const response = await api.post('/auth/login', { email, password });

      const { accessToken, refreshToken, role, user } = response.data;
      
      // Stocker les tokens. accessToken est le token principal pour les requêtes API.
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Stockez les infos utilisateur si nécessaire, mais le rôle est déjà dans l'accessToken.
      // Vous pouvez décoder l'accessToken si vous avez besoin des infos du payload
      const decodedToken = jwtDecode(accessToken);
      localStorage.setItem('userRole', decodedToken.role); // Stockez le rôle pour une récupération facile
      // Optionnel : stocker plus d'infos si nécessaire
      // localStorage.setItem('userId', decodedToken.id); 

      // Rediriger en fonction du rôle
      if (role === 'superadmin') navigate("/super-admin/dashboard", { replace: true });
      else if (role === 'admin') navigate("/admin/dashboard", { replace: true });
      else if (role === 'client') navigate("/client/index", { replace: true });
      else if (role === 'utilisateur') navigate("/user/dashboard", { replace: true });
      else throw new Error("Rôle utilisateur non reconnu.");

    } catch (err) {
      // Gérer les erreurs d'Axios (err.response.data.message)
      const errorMessage = err.response?.data?.message || err.message || "Une erreur est survenue.";
      setError(errorMessage);
    }
  };

  return (
    <>
      <Col lg="5" md="7">
        <Card className="bg-secondary shadow border-0">
          <CardBody className="px-lg-5 py-lg-5">
            <div className="text-center text-muted mb-4">
              <small className='MM'>Connectez-vous pour continuer</small>
            </div>
            <Form role="form" onSubmit={handleLogin}>
              <FormGroup className="mb-3">
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText><i className="ni ni-email-83" /></InputGroupText>
                  </InputGroupAddon>
                  <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
                </InputGroup>
              </FormGroup>
              <FormGroup>
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText>
                  </InputGroupAddon>
                  <Input placeholder="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
                </InputGroup>
              </FormGroup>
              {error && (
                <div className="text-center text-muted my-4"><small className="text-danger">{error}</small></div>
              )}
              <div className="text-center">
                <Button className="my-4 btn-pubcash-primary" type="submit">Se connecter</Button>
              </div>
              <div className="text-center mb-2">
                <FacebookLoginButton />
              </div>
            </Form>
            <Row className="mt-3">
              <Col className="text-right" xs="12">
              <Link to="/auth/register" className="link-pubcash-secondary"><small>Créer un nouveau compte</small></Link>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>
    </>
  );
};

export default Login;