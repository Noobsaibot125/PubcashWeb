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
 

  useEffect(() => {
    document.body.classList.add('hide-navbar');
    return () => document.body.classList.remove('hide-navbar');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
   

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
      const errorMessage = err.response?.data?.message || err.message || "Une erreur est survenue.";
      toast.error(errorMessage);
    }
  };

  return (
    <>
    {/* AJOUTER LE CONTAINER TOAST */}
    <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
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
                  <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
                </InputGroup>
              </FormGroup>
              <FormGroup>
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend"><InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText></InputGroupAddon>
                  <Input placeholder="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
                </InputGroup>
              </FormGroup>
             
              <div className="text-center">
                <Button className="my-4 btn-pubcash-primary" type="submit">Se connecter</Button>
              </div>
            </Form>
            <Row className="mt-3">
              <Col className="text-right" xs="12">
                {/* Lien vers l'inscription CLIENT */}
                <Link to="/auth/register" className="link-pubcash-secondary"><small>Créer un compte promoteur</small></Link>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>
    </>
  );
};
export default LoginClient;