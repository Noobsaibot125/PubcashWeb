// src/views/examples/VerifyOTP.js
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    Button, Card, CardBody, Form, Input, InputGroup, Col,
    Modal, ModalHeader, ModalBody, InputGroupAddon, InputGroupText 
} from 'reactstrap';

const VerifyOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;
    
    const [otp, setOtp] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    
    if (!email) {
        return (
            <Col lg="6" md="8" className="mx-auto text-center mt-5">
                <div className="alert alert-warning">Erreur : Email non trouvé. Veuillez recommencer l'inscription.</div>
            </Col>
        );
    }

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        navigate('/auth/login-client');
    };

    const handleCloseErrorModal = () => {
        setShowErrorModal(false);
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        try {
            const apiUrl = `${process.env.REACT_APP_API_URL}/auth/verify-otp`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setShowSuccessModal(true);
        } catch (err) {
            setShowErrorModal(true);
        }
    };

    return (
        <>
            <Col lg="5" md="7" className="mx-auto">
                <Card className="auth-card border-0">
                    <CardBody className="card-body-auth text-center">
                        <h6 className="auth-header-subtitle">VÉRIFICATION OTP</h6>
                        <div className="header-underline"></div>
                        
                        <div className="text-muted mb-4">
                            <small>Veuillez entrer le code à 5 chiffres envoyé à <b>{email}</b></small>
                        </div>
                        
                        <Form role="form" onSubmit={handleVerify}>
                            <div className="mb-3">
                                <InputGroup className="custom-input-group justify-content-center">
                                     {/* Input centré pour le code OTP */}
                                    <Input 
                                        placeholder="X X X X X" 
                                        type="text" 
                                        value={otp} 
                                        onChange={(e) => setOtp(e.target.value)} 
                                        maxLength="5" 
                                        required 
                                        className="form-control-auth text-center"
                                        style={{letterSpacing: '5px', fontSize: '1.2rem', fontWeight: 'bold'}}
                                    />
                                </InputGroup>
                            </div>
                            
                            <div className="text-center">
                                <Button className="btn-pubcash mt-4" type="submit">Vérifier mon compte</Button>
                            </div>
                        </Form>
                    </CardBody>
                </Card>
            </Col>

            {/* POPUP SUCCÈS */}
            <Modal isOpen={showSuccessModal} toggle={handleCloseSuccessModal} centered>
                <ModalBody className="text-center pt-5 pb-5">
                    <div className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center mb-3 shadow-lg" style={{width: '60px', height: '60px'}}>
                        <i className="ni ni-check-bold" style={{fontSize: '2rem'}}></i>
                    </div>
                    <h3 className="mt-3 font-weight-bold text-dark">Vérification Réussie !</h3>
                    <p className="text-muted">Votre mail a été confirmé.</p>
                    <Button className="btn-pubcash mt-3 px-5" onClick={handleCloseSuccessModal}>
                        Se connecter
                    </Button>
                </ModalBody>
            </Modal>

            {/* POPUP ERREUR */}
            <Modal isOpen={showErrorModal} toggle={handleCloseErrorModal} centered>
                <ModalBody className="text-center pt-5 pb-5">
                    <div className="rounded-circle bg-danger text-white d-inline-flex align-items-center justify-content-center mb-3 shadow-lg" style={{width: '60px', height: '60px'}}>
                        <i className="ni ni-fat-remove" style={{fontSize: '2rem'}}></i>
                    </div>
                    <h3 className="mt-3 font-weight-bold text-dark">Code Incorrect</h3>
                    <p className="text-muted">Le code est invalide, veuillez vérifier votre boîte mail.</p>
                    <Button color="danger" className="mt-3 px-5" onClick={handleCloseErrorModal}>
                        Réessayer
                    </Button>
                </ModalBody>
            </Modal>
        </>
    );
};

export default VerifyOTP;