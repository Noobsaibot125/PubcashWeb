import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Card, CardHeader, CardBody, Container, Row, Col,
    Form, FormGroup, Input, Button, Spinner, Table, Badge
} from 'reactstrap'; // J'ai ajouté Table et Badge ici
import api from '../../services/api';

const MonCompteHeader = ({ profile }) => (
    <div className="header bg-gradient-primary pb-8 pt-5 pt-md-8">
        <Container fluid>
            <div className="header-body">
                <Row>
                    <Col lg="7" md="10">
                        <h1 className="display-2 text-white">Bonjour, {profile?.prenom || 'Promoteur'}</h1>
                        <p className="text-white mt-0 mb-5">
                            Transformez votre solde en résultats, planifiez vos campagnes promotionnelles dès maintenant.
                        </p>
                    </Col>
                </Row>
            </div>
        </Container>
    </div>
);

const MonCompte = () => {
    const [profile, setProfile] = useState(null);
    const [history, setHistory] = useState([]); // Nouvel état pour l'historique
    const [loading, setLoading] = useState(true);
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [sdkLoaded, setSdkLoaded] = useState(false);
    // const [sdkError, setSdkError] = useState(false); // Unused
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

    // Nouvelle fonction pour charger l'historique
    const fetchHistory = useCallback(async () => {
        try {
            const response = await api.get('/client/recharge/history');
            setHistory(response.data);
        } catch (err) {
            console.error("Erreur historique:", err);
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
                // setSdkError(true);
                setError('Impossible de charger le système de paiement');
            };
            document.body.appendChild(script);
        };

        const loadInitialData = async () => {
            try {
                // On charge le profil ET l'historique
                await Promise.all([fetchProfile(), fetchHistory()]);
                loadCinetPay();
            } catch (err) {
                console.error('Erreur initialisation:', err);
                setError('Erreur lors du chargement des données');
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, [fetchProfile, fetchHistory]);

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

        try {
            // ... (Votre code existant d'initialisation CinetPay reste identique)
            console.log('Initialisation du paiement...');
            const initResp = await api.post('/client/recharge', {
                amount: parseFloat(rechargeAmount)
            });

            const initData = initResp.data;
            const transactionId = initData.checkout_data.transaction_id;

            if (!window.CinetPay) throw new Error('SDK CinetPay non chargé');

            window.CinetPay.setConfig({
                ...initData.cinetpay_config,
                mode: 'PRODUCTION'
            });

            window.CinetPay.waitResponse(function (data) {
                if (data.status === "REFUSED" || data.status === "CANCELED") {
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setError("Votre paiement a échoué ou a été annulé.");
                    setIsProcessing(false);
                    fetchHistory(); // Rafraichir l'historique même en cas d'échec
                }
            });

            window.CinetPay.onError(function (data) {
                if (pollingRef.current) clearInterval(pollingRef.current);
                setError("Erreur technique : " + (data.message || 'Inconnue'));
                setIsProcessing(false);
            });

            window.CinetPay.getCheckout(initData.checkout_data);

            pollingRef.current = setInterval(async () => {
                try {
                    const verifyResp = await api.post('/client/recharge/verify', {
                        transaction_id: transactionId
                    });

                    const verifyData = verifyResp.data;

                    if (verifyResp.status === 200 && verifyData.message.includes('confirmé')) {
                        clearInterval(pollingRef.current);
                        setSuccess("Paiement réussi ! Votre solde a été rechargé.");
                        setRechargeAmount(''); // Reset input
                        await fetchProfile(); // Mise à jour du solde
                        await fetchHistory(); // Mise à jour de l'historique
                        setIsProcessing(false);
                    } else if (verifyData.message.includes('REFUSED') || verifyData.message.includes('ECHEC')) {
                        clearInterval(pollingRef.current);
                        setError("Le paiement a été refusé.");
                        setIsProcessing(false);
                        fetchHistory();
                    }
                } catch (pollErr) {
                    console.error("Erreur de polling:", pollErr);
                }
            }, 5000);

            setTimeout(() => {
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    // Ne pas afficher d'erreur ici si déjà réussi, juste arrêter le polling
                    if (!success) setIsProcessing(false);
                }
            }, 600000);

        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Erreur lors du démarrage du paiement';
            setError(`Erreur: ${errorMessage}`);
            setIsProcessing(false);
        }
    };

    // Helper pour formater la date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    // Helper pour le badge de statut
    const getStatusBadge = (status) => {
        switch (status) {
            case 'COMPLETED': return <Badge color="success">Succès</Badge>;
            case 'ACCEPTED': return <Badge color="success">Succès</Badge>;
            case 'PENDING': return <Badge color="warning">En attente</Badge>;
            case 'REFUSED': return <Badge color="danger">Échoué</Badge>;
            default: return <Badge color="secondary">{status}</Badge>;
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
                        <Card className="bg-secondary shadow mb-4">
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
                                                    <small className="form-text text-muted">Minimum: 100 FCFA</small>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                        <p className="small">Moyens de paiement : MTN, Orange, Moov, Wave, Visa...</p>

                                        {error && <div className="alert alert-danger my-2"><small>{error}</small></div>}
                                        {success && <div className="alert alert-success my-2"><small>{success}</small></div>}

                                        <Button
                                            color="primary"
                                            type="submit"
                                            disabled={!sdkLoaded || isProcessing}
                                        >
                                            {isProcessing ? "Traitement en cours..." :
                                                sdkLoaded ? "Recharger" : "Chargement..."}
                                        </Button>
                                    </div>
                                </Form>
                            </CardBody>
                        </Card>

                        {/* --- NOUVELLE SECTION : HISTORIQUE DES RECHARGEMENTS --- */}
                        <Card className="shadow">
                            <CardHeader className="border-0">
                                <Row className="align-items-center">
                                    <Col>
                                        <h3 className="mb-0">Historique des rechargements</h3>
                                    </Col>
                                </Row>
                            </CardHeader>
                            <Table className="align-items-center table-flush" responsive>
                                <thead className="thead-light">
                                    <tr>
                                        <th scope="col">Date</th>
                                        <th scope="col">Transaction ID</th>
                                        <th scope="col">Montant</th>
                                        <th scope="col">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.length > 0 ? (
                                        history.map((item, index) => (
                                            <tr key={index}>
                                                <td>{formatDate(item.created_at)}</td>
                                                <td><small>{item.transaction_id}</small></td>
                                                <td>{parseFloat(item.amount).toLocaleString('fr-FR')} FCFA</td>
                                                <td>{getStatusBadge(item.status)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center">Aucun historique disponible</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default MonCompte;