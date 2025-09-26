import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardBody, Container, Row, Col, Form, FormGroup, Input, Button, Spinner } from 'reactstrap';
import api from '../../services/api';

const MonCompteHeader = ({ profile }) => (
  <div className="header bg-gradient-primary pb-8 pt-5 pt-md-8">
    <Container fluid>
      <div className="header-body">
        <Row>
          <Col lg="7" md="10">
            <h1 className="display-2 text-white">Bonjour, {profile?.prenom || 'Promoteur'}</h1>
            <p className="text-white mt-0 mb-5">
              C'est votre espace personnel. Gérez votre solde et préparez vos prochaines campagnes de promotion.
            </p>
          </Col>
        </Row>
      </div>
    </Container>
  </div>
);

const MonCompte = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const [sdkError, setSdkError] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const scriptAddedRef = useRef(false);
    const pollingRef = useRef(null);

    const fetchProfile = useCallback(async () => {
        try {
            const response = await api.get('/client/profile');
            setProfile(response.data);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Erreur de chargement du profil');
        }
    }, []);

    useEffect(() => {
        const loadCinetPay = () => {
            if (scriptAddedRef.current || window.CinetPay) {
                setSdkLoaded(true);
                return;
            }
            
            scriptAddedRef.current = true;
            
            const script = document.createElement('script');
            script.src = 'https://cdn.cinetpay.com/seamless/main.js';
            script.async = true;
            script.id = 'cinetpay-sdk';
            script.onload = () => { 
                console.log('SDK CinetPay chargé avec succès');
                setSdkLoaded(true); 
            };
            script.onerror = (err) => { 
                console.error('Erreur chargement SDK CinetPay:', err);
                setSdkError(true); 
                setError('Impossible de charger le système de paiement'); 
            };
            document.body.appendChild(script);
        };

        const loadInitialData = async () => {
            try {
                await fetchProfile();
                loadCinetPay();
            } catch (err) {
                console.error('Erreur initialisation:', err);
                setError('Erreur lors du chargement des données');
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();

        // Nettoyage
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, [fetchProfile]);

    const handleRecharge = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsProcessing(true);
    
        if (!rechargeAmount || Number(rechargeAmount) < 100) {
            setError("Veuillez entrer un montant valide (minimum 100 FCFA).");
            setIsProcessing(false);
            return;
        }
    
        // Test de diagnostic
        console.log('=== DIAGNOSTIC PAIEMENT ===');
        console.log('Montant:', rechargeAmount);
        console.log('SDK chargé:', !!window.CinetPay);
        
        try {
            console.log('Initialisation du paiement...');
            const initResp = await api.post('/client/recharge', { 
                amount: parseFloat(rechargeAmount) 
            });
    
            const initData = initResp.data;
            console.log('Réponse initialisation:', initData);
    
            if (!initData.checkout_data || !initData.cinetpay_config) {
                throw new Error('Données de paiement incomplètes');
            }
    
            const transactionId = initData.checkout_data.transaction_id;
            console.log('Transaction ID:', transactionId);
            console.log('Numéro de téléphone envoyé:', initData.checkout_data.customer_phone_number);
    
            // Vérification que CinetPay est bien chargé
            if (!window.CinetPay) {
                throw new Error('SDK CinetPay non chargé');
            }
    
            // Configuration CinetPay
            window.CinetPay.setConfig({ 
                ...initData.cinetpay_config,
                mode: 'PRODUCTION'
            });
    
            // Gestion des réponses
            window.CinetPay.waitResponse(function(data) {
                console.log('Réponse CinetPay waitResponse:', data);
                if (data.status === "REFUSED" || data.status === "CANCELED") {
                    if (pollingRef.current) {
                        clearInterval(pollingRef.current);
                    }
                    setError("Votre paiement a échoué ou a été annulé.");
                    setIsProcessing(false);
                } else if (data.status === "ACCEPTED") {
                    console.log('Paiement accepté, vérification en cours...');
                }
            });
    
            window.CinetPay.onError(function(data) {
                console.error('Erreur CinetPay onError:', data);
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                }
                setError("Erreur lors du traitement du paiement: " + (data.message || 'Erreur inconnue'));
                setIsProcessing(false);
            });
    
            // Démarrer le processus de paiement
            console.log('Lancement de CinetPay.getCheckout...');
            window.CinetPay.getCheckout(initData.checkout_data);
    
            // Polling de vérification
            pollingRef.current = setInterval(async () => {
                try {
                    console.log('Vérification du statut...');
                    const verifyResp = await api.post('/client/recharge/verify', { 
                        transaction_id: transactionId 
                    });
                    
                    const verifyData = verifyResp.data;
                    console.log('Résultat vérification:', verifyData);
                    
                    if (verifyResp.status === 200 && verifyData.message.includes('confirmé et solde mis à jour')) {
                        clearInterval(pollingRef.current);
                        setSuccess("Paiement réussi ! Votre solde a été rechargé.");
                        await fetchProfile();
                        setIsProcessing(false);
                    } else if (verifyData.message.includes('REFUSED') || verifyData.message.includes('ECHEC')) {
                        clearInterval(pollingRef.current);
                        setError("Le paiement a été refusé. Veuillez réessayer.");
                        setIsProcessing(false);
                    }
    
                } catch (pollErr) {
                    console.error("Erreur de polling:", pollErr);
                }
            }, 5000);
    
            // Arrêter le polling après 10 minutes
            setTimeout(() => {
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    setError("Délai de paiement dépassé. Veuillez réessayer.");
                    setIsProcessing(false);
                }
            }, 600000);
    
        } catch (err) {
            console.error('❌ Erreur handleRecharge détaillée:', err);
            console.error('Response error data:', err.response?.data);
            
            const errorMessage = err.response?.data?.message || err.message || 'Erreur lors du démarrage du paiement';
            setError(`Erreur: ${errorMessage}`);
            setIsProcessing(false);
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner color="primary" /></div>;
    if (error && !profile) return <div className="text-center p-5 text-danger">Erreur : {error}</div>

    return (
        <>
            <MonCompteHeader profile={profile} />
            <Container className="mt--7" fluid>
                <Row>
                    <Col className="order-xl-2 mb-5 mb-xl-0" xl="4">
                        <Card className="card-profile shadow">
                            <CardBody className="pt-0 pt-md-4">
                                <div className="text-center mt-5">
                                    <h3>
                                        {profile.prenom} {profile.nom}
                                        <span className="font-weight-light">, {profile.commune}</span>
                                    </h3>
                                    <div className="h5 font-weight-300">
                                        <i className="ni location_pin mr-2" />{profile.email}
                                    </div>
                                    <hr className="my-4" />
                                    <div className="d-flex justify-content-center">
                                        <div className="pl-lg-4">
                                            <div className="h1 font-weight-300">
                                                {parseFloat(profile.solde_recharge).toLocaleString('fr-FR')} FCFA
                                            </div>
                                            <span className="description">Solde PubCash</span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>

                    <Col className="order-xl-1" xl="8">
                        <Card className="bg-secondary shadow">
                            <CardHeader className="bg-white border-0">
                                <Row className="align-items-center">
                                    <Col xs="8"><h3 className="mb-0" style={{ color: "black" }}>Mon Compte PubCash</h3></Col>
                                </Row>
                            </CardHeader>
                            <CardBody>
                                <Form onSubmit={handleRecharge}>
                                    <h6 className="heading-small text-muted mb-4">Recharger mon compte</h6>
                                    <div className="pl-lg-4">
                                        <Row>
                                            <Col lg="6">
                                                <FormGroup>
                                                    <label className="form-control-label" htmlFor="input-recharge">
                                                        Montant à recharger (FCFA)
                                                    </label>
                                                    <Input
                                                        className="form-control-alternative"
                                                        id="input-recharge"
                                                        placeholder="Ex: 5000"
                                                        type="number"
                                                        min="100"
                                                        step="100"
                                                        value={rechargeAmount}
                                                        onChange={(e) => setRechargeAmount(e.target.value)}
                                                        required
                                                        disabled={isProcessing}
                                                    />
                                                    <small className="form-text text-muted">
                                                        Minimum: 100 FCFA
                                                    </small>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                        <p className="small">Moyens de paiement : MTN, Orange, Moov, Wave, Visa...</p>
                                        
                                        {error && (
                                            <div className="alert alert-danger my-2">
                                                <small>{error}</small>
                                            </div>
                                        )}
                                        {success && (
                                            <div className="alert alert-success my-2">
                                                <small>{success}</small>
                                            </div>
                                        )}
                                        
                                        {sdkError ? (
                                            <div className="alert alert-warning">
                                                <small>
                                                    Le système de paiement est actuellement indisponible. 
                                                    Veuillez réessayer plus tard ou contacter le support.
                                                </small>
                                            </div>
                                        ) : (
                                            <Button 
                                                color="primary" 
                                                type="submit" 
                                                disabled={!sdkLoaded || isProcessing}
                                            >
                                                {isProcessing ? "Traitement en cours..." : 
                                                 sdkLoaded ? "Recharger" : "Chargement du système de paiement..."}
                                            </Button>
                                        )}
                                    </div>
                                </Form>
                                <hr className="my-4" />
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default MonCompte;