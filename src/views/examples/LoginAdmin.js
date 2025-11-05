// views/examples/LoginAdmin.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from '../../services/api';
import { jwtDecode } from 'jwt-decode'; 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Button, Card, CardBody, FormGroup, Form, Input,
  InputGroupAddon, InputGroupText, InputGroup, Row, Col,
} from "reactstrap";

const LoginAdmin = () => {
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
              <small className='MM'>Connexion Administrateur</small>
            </div>
            <Form role="form" onSubmit={handleLogin}>
        _       <FormGroup className="mb-3">
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
            _ </FormGroup>
             
              <div className="text-center">
                <Button className="my-4 btn-pubcash-primary" type="submit">Se connecter</Button>
              </div>
            </Form>
            {/* PAS DE LIENS D'INSCRIPTION */}
          </CardBody>
        </Card>
      </Col>
    </>
  );
};
export default LoginAdmin;