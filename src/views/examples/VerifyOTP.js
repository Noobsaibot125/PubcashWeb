// src/views/examples/VerifyOTP.js
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, CardBody, FormGroup, Form, Input, InputGroup, Col } from 'reactstrap';

const VerifyOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email; // On récupère l'email passé depuis la page d'inscription
    
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    if (!email) {
        return (
            <Col lg="6" md="8">
                <p>Erreur : Email non trouvé. Veuillez recommencer l'inscription.</p>
            </Col>
        )
    }

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const apiUrl = `${process.env.REACT_APP_API_URL}/auth/verify-otp`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            setSuccess(data.message);
            setTimeout(() => navigate('/auth/login'), 3000);

        } catch (err) {
            setError(err.message || "Une erreur est survenue.");
        }
    };

    return (
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
                        {error && <div className="text-center text-danger my-2"><small>{error}</small></div>}
                        {success && <div className="text-center text-success my-2"><small>{success}</small></div>}
                        <div className="text-center">
                            <Button className="my-4" color="primary" type="submit">Vérifier mon compte</Button>
                        </div>
                    </Form>
                </CardBody>
            </Card>
        </Col>
    );
};

export default VerifyOTP;