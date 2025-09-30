// src/views/examples/VerifyOTP.js
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    Button, Card, CardBody, FormGroup, Form, Input, InputGroup, Col,
    // --- MODIFICATION : Importer les composants pour le popup ---
    Modal, ModalHeader, ModalBody 
} from 'reactstrap';

const VerifyOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;
    
    const [otp, setOtp] = useState('');
    // --- MODIFICATION : Remplacer les états 'error' et 'success' par des états pour les popups ---
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    
    // Si l'email n'est pas trouvé, on affiche une erreur.
    if (!email) {
        return (
            <Col lg="6" md="8">
                <p>Erreur : Email non trouvé. Veuillez recommencer l'inscription.</p>
            </Col>
        );
    }

    // --- MODIFICATION : Fonctions pour gérer la fermeture des popups ---
    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        navigate('/auth/login');
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

            // --- MODIFICATION : Afficher le popup de succès ---
            setShowSuccessModal(true);

        } catch (err) {
            // --- MODIFICATION : Afficher le popup d'erreur ---
            setShowErrorModal(true);
        }
    };

    return (
        <>
            <Col lg="5" md="7">
                <Card className="bg-secondary shadow border-0">
                    <CardBody className="px-lg-5 py-lg-5">
                        <div className="text-center text-muted mb-4">
                            <small>Veuillez entrer le code à 5 chiffres envoyé à <b>{email}</b></small>
                        </div>
                        <Form role="form" onSubmit={handleVerify}>
                            <FormGroup>
                                <InputGroup className="input-group-alternative">
                                    <Input placeholder="Code OTP" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="5" required />
                                </InputGroup>
                            </FormGroup>
                            {/* --- MODIFICATION : Les anciens messages d'erreur et de succès sont retirés --- */}
                            <div className="text-center">
                                <Button className="my-4" color="primary" type="submit">Vérifier mon compte</Button>
                            </div>
                        </Form>
                    </CardBody>
                </Card>
            </Col>

            {/* --- MODIFICATION : Le code du Popup de SUCCÈS --- */}
            <Modal isOpen={showSuccessModal} toggle={handleCloseSuccessModal} centered>
                <ModalHeader toggle={handleCloseSuccessModal} className="text-success">
                    <span style={{ fontWeight: 'bold' }}>Vérification Réussie !</span>
                </ModalHeader>
                <ModalBody>
                    <div className="text-center">
                        <i className="ni ni-check-bold ni-3x text-success mb-3"></i>
                        <p style={{ color: 'black' }}>
                            Votre mail a été confirmé, vous pouvez vous connecter dès à présent.
                        </p>
                        <Button color="success" onClick={handleCloseSuccessModal}>
                            Se connecter
                        </Button>
                    </div>
                </ModalBody>
            </Modal>

            {/* --- MODIFICATION : Le code du Popup d'ERREUR --- */}
            <Modal isOpen={showErrorModal} toggle={handleCloseErrorModal} centered>
                <ModalHeader toggle={handleCloseErrorModal} className="text-danger">
                    <span style={{ fontWeight: 'bold' }}>Code Incorrect</span>
                </ModalHeader>
                <ModalBody>
                    <div className="text-center">
                        <i className="ni ni-fat-remove ni-3x text-danger mb-3"></i>
                        <p style={{ color: 'black' }}>
                            Mauvais code entré, veuillez rentrer le code envoyé dans votre boite mail.
                        </p>
                        <Button color="danger" onClick={handleCloseErrorModal}>
                            Réessayer
                        </Button>
                    </div>
                </ModalBody>
            </Modal>
        </>
    );
};

export default VerifyOTP;