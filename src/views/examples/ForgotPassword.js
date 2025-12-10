// views/examples/ForgotPassword.js
import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from '../../services/api'; 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Button, Card, CardBody, Form, Input,
  InputGroupAddon, InputGroupText, InputGroup, Row, Col,
} from "reactstrap";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = location.state?.from || "/auth/login-client";
  
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    document.body.classList.add('hide-navbar');
    return () => document.body.classList.remove('hide-navbar');
  }, []);

  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Code envoyé avec succès');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanResetCode = resetCode.replace(/\s/g, '');
      await api.post('/auth/verify-reset-code', { email, resetCode: cleanResetCode });
      toast.success('Code vérifié');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || "Code invalide.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { return toast.error('Minimum 6 caractères'); }
    if (newPassword !== confirmPassword) { return toast.error('Mots de passe différents'); }

    setLoading(true);
    try {
      const cleanResetCode = resetCode.replace(/\s/g, '');
      await api.post('/auth/reset-password', { email, resetCode: cleanResetCode, newPassword });
      toast.success('Mot de passe modifié !');
      setTimeout(() => navigate(returnPath), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
    const formatted = val.length > 3 ? `${val.slice(0, 3)} ${val.slice(3, 6)}` : val;
    setResetCode(formatted);
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} />
      
      <Col lg="5" md="7" className="mx-auto">
        <Card className="auth-card border-0">
          <CardBody className="card-body-auth">
            
            <div className="text-center mb-4">
              <h6 className="auth-header-subtitle">RÉINITIALISATION DU MOT DE PASSE</h6>
              <div className="header-underline"></div>
              
              <p className="text-muted small">
                {step === 1 && "Étape 1 : Saisissez votre email"}
                {step === 2 && "Étape 2 : Saisissez le code reçu"}
                {step === 3 && "Étape 3 : Créez votre nouveau mot de passe"}
              </p>
            </div>

            {/* STEP 1 */}
            {step === 1 && (
              <Form role="form" onSubmit={handleSendCode}>
                <div className="mb-3">
                  <InputGroup className="custom-input-group">
                    <InputGroupAddon addonType="prepend">
                      <InputGroupText><i className="ni ni-email-83" /></InputGroupText>
                    </InputGroupAddon>
                    <Input 
                      placeholder="Votre adresse email" 
                      type="email" value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="form-control-auth" required autoFocus
                    />
                  </InputGroup>
                </div>
                <div className="text-center">
                  <Button className="btn-pubcash mt-4" type="submit" disabled={loading}>
                    {loading ? 'Envoi...' : 'Envoyer le code'}
                  </Button>
                </div>
              </Form>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <Form role="form" onSubmit={handleVerifyCode}>
                <div className="mb-3">
                  <InputGroup className="custom-input-group">
                    <InputGroupAddon addonType="prepend">
                      <InputGroupText><i className="ni ni-key-25" /></InputGroupText>
                    </InputGroupAddon>
                    <Input 
                      placeholder="000 000" 
                      type="text" value={resetCode} 
                      onChange={handleCodeChange}
                      className="form-control-auth" required maxLength="7" autoFocus
                    />
                  </InputGroup>
                  <div className="text-center mt-2">
                    <small className="text-muted">Code envoyé à {email}</small>
                  </div>
                </div>
                <div className="text-center">
                  <Button className="btn-pubcash mt-4" type="submit" disabled={loading}>
                    {loading ? 'Vérification...' : 'Vérifier le code'}
                  </Button>
                </div>
                <div className="text-center mt-3">
                  <button type="button" className="btn btn-link text-muted small p-0" onClick={handleSendCode}>
                    Renvoyer le code
                  </button>
                </div>
              </Form>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <Form role="form" onSubmit={handleResetPassword}>
                <div className="mb-3">
                  <InputGroup className="custom-input-group">
                    <InputGroupAddon addonType="prepend">
                      <InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText>
                    </InputGroupAddon>
                    <Input 
                      placeholder="Nouveau mot de passe" 
                      type={showNewPassword ? "text" : "password"} 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      className="form-control-auth" required minLength="6"
                    />
                    <InputGroupAddon addonType="append">
                      <InputGroupText onClick={toggleNewPasswordVisibility} style={{ cursor: 'pointer' }}>
                        <i className={showNewPassword ? "fa fa-eye-slash" : "fa fa-eye"} />
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </div>

                <div className="mb-3">
                  <InputGroup className="custom-input-group">
                    <InputGroupAddon addonType="prepend">
                      <InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText>
                    </InputGroupAddon>
                    <Input 
                      placeholder="Confirmer le mot de passe" 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      className="form-control-auth" required minLength="6"
                    />
                    <InputGroupAddon addonType="append">
                      <InputGroupText onClick={toggleConfirmPasswordVisibility} style={{ cursor: 'pointer' }}>
                         <i className={showConfirmPassword ? "fa fa-eye-slash" : "fa fa-eye"} />
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </div>

                <div className="text-center">
                  <Button className="btn-pubcash mt-4" type="submit" disabled={loading}>
                    {loading ? 'Modification...' : 'Changer le mot de passe'}
                  </Button>
                </div>
              </Form>
            )}

           <div className="text-center mt-4 separator-line">
                <Link to={returnPath} className="link-create small">
                  Retour à la connexion
                </Link>
            </div>

          </CardBody>
        </Card>
      </Col>
    </>
  );
};

export default ForgotPassword;