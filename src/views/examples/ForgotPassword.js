// views/examples/ForgotPassword.js
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from '../../services/api'; 
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

const ForgotPassword = () => {
  const navigate = useNavigate();
  // États
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // --- NOUVEAUX ÉTATS : Visibilité des mots de passe ---
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Effet pour nettoyer les classes du body si nécessaire
  useEffect(() => {
    document.body.classList.add('hide-navbar');
    return () => document.body.classList.remove('hide-navbar');
  }, []);

  // --- NOUVELLES FONCTIONS : Basculer la visibilité ---
  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);


  // ÉTAPE 1 : Envoyer le code
  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Code envoyé avec succès à votre email');
      setStep(2);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Erreur lors de l'envoi du code.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ÉTAPE 2 : Vérifier le code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanResetCode = resetCode.replace(/\s/g, '');
      await api.post('/auth/verify-reset-code', { email, resetCode: cleanResetCode });
      toast.success('Code vérifié avec succès');
      setStep(3);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Code invalide ou expiré.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ÉTAPE 3 : Réinitialiser le mot de passe
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const cleanResetCode = resetCode.replace(/\s/g, '');
      await api.post('/auth/reset-password', { 
        email, 
        resetCode: cleanResetCode, 
        newPassword 
      });
      toast.success('Mot de passe réinitialisé avec succès !');
      
      // Redirection après 2 secondes
      setTimeout(() => {
        navigate('/auth/login-client'); 
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Erreur lors de la réinitialisation.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Utilitaires pour le formatage du code (ex: 123 456)
  const formatResetCode = (value) => {
    const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`;
  };

  const handleCodeChange = (e) => {
    const formattedCode = formatResetCode(e.target.value);
    setResetCode(formattedCode);
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} />
      
      <Col lg="5" md="7">
        <Card className="bg-secondary shadow border-0">
          <CardBody className="px-lg-5 py-lg-5">
            <div className="text-center text-muted mb-4">
              <small className='MM' style={{fontWeight: 'bold', fontSize: '1rem'}}>
                Réinitialisation du mot de passe
              </small>
            </div>

            <div className="text-center mb-4">
              <small className="text-muted">
                {step === 1 && "Étape 1 : Saisissez votre email"}
                {step === 2 && "Étape 2 : Saisissez le code reçu"}
                {step === 3 && "Étape 3 : Créez votre nouveau mot de passe"}
              </small>
            </div>

            {/* --- FORMULAIRE ÉTAPE 1 --- */}
            {step === 1 && (
              <Form role="form" onSubmit={handleSendCode}>
                <FormGroup className="mb-3">
                  <InputGroup className="input-group-alternative">
                    <InputGroupAddon addonType="prepend">
                      <InputGroupText><i className="ni ni-email-83" /></InputGroupText>
                    </InputGroupAddon>
                    <Input 
                      placeholder="Votre adresse email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required
                      autoFocus
                    />
                  </InputGroup>
                </FormGroup>
                <div className="text-center">
                  <Button className="my-4 btn-pubcash-primary" type="submit" disabled={loading} style={{width: '100%'}}>
                    {loading ? 'Envoi...' : 'Envoyer le code'}
                  </Button>
                </div>
              </Form>
            )}

            {/* --- FORMULAIRE ÉTAPE 2 --- */}
            {step === 2 && (
              <Form role="form" onSubmit={handleVerifyCode}>
                <FormGroup className="mb-3">
                  <InputGroup className="input-group-alternative">
                    <InputGroupAddon addonType="prepend">
                      <InputGroupText><i className="ni ni-key-25" /></InputGroupText>
                    </InputGroupAddon>
                    <Input 
                      placeholder="000 000" 
                      type="text" 
                      value={resetCode} 
                      onChange={handleCodeChange}
                      required
                      maxLength="7"
                      autoFocus
                    />
                  </InputGroup>
                  <div className="text-center mt-2">
                    <small className="text-muted">Code envoyé à {email}</small>
                  </div>
                </FormGroup>
                <div className="text-center">
                  <Button className="my-4 btn-pubcash-primary" type="submit" disabled={loading} style={{width: '100%'}}>
                    {loading ? 'Vérification...' : 'Vérifier le code'}
                  </Button>
                </div>
                <div className="text-center">
                  <button type="button" className="btn btn-link text-muted" onClick={handleSendCode}>
                    <small>Renvoyer le code</small>
                  </button>
                </div>
              </Form>
            )}

            {/* --- FORMULAIRE ÉTAPE 3 (MODIFIÉ) --- */}
            {step === 3 && (
              <Form role="form" onSubmit={handleResetPassword}>
                
                {/* Champ: Nouveau mot de passe */}
                <FormGroup className="mb-3">
                  <InputGroup className="input-group-alternative">
                    <InputGroupAddon addonType="prepend">
                      <InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText>
                    </InputGroupAddon>
                    <Input 
                      placeholder="Nouveau mot de passe" 
                      type={showNewPassword ? "text" : "password"} 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      required
                      minLength="6"
                    />
                    <InputGroupAddon addonType="append">
                      <InputGroupText onClick={toggleNewPasswordVisibility} style={{ cursor: 'pointer' }}>
                         <i className={showNewPassword ? "fa fa-eye-slash" : "fa fa-eye"} />
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </FormGroup>

                {/* Champ: Confirmer mot de passe */}
                <FormGroup>
                  <InputGroup className="input-group-alternative">
                    <InputGroupAddon addonType="prepend">
                      <InputGroupText><i className="ni ni-lock-circle-open" /></InputGroupText>
                    </InputGroupAddon>
                    <Input 
                      placeholder="Confirmer le mot de passe" 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      required
                      minLength="6"
                    />
                    <InputGroupAddon addonType="append">
                      <InputGroupText onClick={toggleConfirmPasswordVisibility} style={{ cursor: 'pointer' }}>
                         <i className={showConfirmPassword ? "fa fa-eye-slash" : "fa fa-eye"} />
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </FormGroup>

                <div className="text-center">
                  <Button className="my-4 btn-pubcash-primary" type="submit" disabled={loading} style={{width: '100%'}}>
                    {loading ? 'Modification...' : 'Changer le mot de passe'}
                  </Button>
                </div>
              </Form>
            )}

            <Row className="mt-3">
              <Col xs="12" className="text-center">
                <Link to="/auth/login-client" className="text-muted">
                  <small>Retour à la connexion</small>
                </Link>
              </Col>
            </Row>

          </CardBody>
        </Card>
      </Col>
    </>
  );
};

export default ForgotPassword;