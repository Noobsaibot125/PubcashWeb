// src/views/auth/Login.js
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from '../../services/api';
import { jwtDecode } from 'jwt-decode';
import FacebookLoginButton from 'components/FacebookLoginButton';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add('hide-navbar');
    return () => {
      document.body.classList.remove('hide-navbar');
    };
  }, []);

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

    if (!email.trim() || !password.trim()) {
      toast.error("Email et mot de passe requis.", toastOptions);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });

      const { accessToken, refreshToken, role } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      const decodedToken = jwtDecode(accessToken);
      localStorage.setItem('userRole', decodedToken.role);

      if (role === 'superadmin') navigate("/super-admin/dashboard", { replace: true });
      else if (role === 'admin') navigate("/admin/dashboard", { replace: true });
      else if (role === 'client') navigate("/client/index", { replace: true });
      else if (role === 'utilisateur') navigate("/user/dashboard", { replace: true });
      else throw new Error("Rôle utilisateur non reconnu.");

    } catch (err) {
      const errorMessage = err.response?.data?.message || "Email ou mot de passe incorrect.";
      toast.error(errorMessage, toastOptions);
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
              <small className='MM'>Connectez-vous pour continuer</small>
            </div>
            <Form role="form" onSubmit={handleLogin}>
              <FormGroup className="mb-3">
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText><i className="ni ni-email-83" /></InputGroupText>
                  </InputGroupAddon>
                  <Input
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  // required removed to use toast validation
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
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  // required removed to use toast validation
                  />
                </InputGroup>
              </FormGroup>

              <div className="text-center">
                <Button className="my-4 btn-pubcash-primary" type="submit" disabled={loading}>
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
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