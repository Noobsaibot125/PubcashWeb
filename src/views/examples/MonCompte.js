import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Card, CardBody, CardHeader, Container, Row, Col,
    Form, FormGroup, Input, Button, Spinner, Table, Badge
} from 'reactstrap';
import api from '../../services/api';

const PaymentIcon = ({ color, letter, name }) => (
    <div
        title={name}
        style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: color,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            marginRight: '10px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            cursor: 'pointer'
        }}
    >
        {letter}
    </div>
);

const MonCompte = () => {
    const [profile, setProfile] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [sdkLoaded, setSdkLoaded] = useState(false);
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
            script.onload = () => setSdkLoaded(true);
            script.onerror = () => setError('Impossible de charger le système de paiement');
            document.body.appendChild(script);
        };

        const loadInitialData = async () => {
            try {
                await Promise.all([fetchProfile(), fetchHistory()]);
                loadCinetPay();
            } catch (err) {
                setError('Erreur lors du chargement des données');
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();

        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
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
            const initResp = await api.post('/client/recharge', { amount: parseFloat(rechargeAmount) });
            const initData = initResp.data;
            const transactionId = initData.checkout_data.transaction_id;

            if (!window.CinetPay) throw new Error('SDK CinetPay non chargé');

            window.CinetPay.setConfig({ ...initData.cinetpay_config, mode: 'PRODUCTION' });

            window.CinetPay.waitResponse((data) => {
                if (data.status === "REFUSED" || data.status === "CANCELED") {
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setError("Votre paiement a échoué ou a été annulé.");
                    setIsProcessing(false);
                    fetchHistory();
                }
            });

            window.CinetPay.onError((data) => {
                if (pollingRef.current) clearInterval(pollingRef.current);
                setError("Erreur technique : " + (data.message || 'Inconnue'));
                setIsProcessing(false);
            });

            window.CinetPay.getCheckout(initData.checkout_data);

            pollingRef.current = setInterval(async () => {
                try {
                    const verifyResp = await api.post('/client/recharge/verify', { transaction_id: transactionId });
                    if (verifyResp.status === 200 && verifyResp.data.message.includes('confirmé')) {
                        clearInterval(pollingRef.current);
                        setSuccess("Paiement réussi ! Votre solde a été rechargé.");
                        setRechargeAmount('');
                        await fetchProfile();
                        await fetchHistory();
                        setIsProcessing(false);
                    } else if (verifyResp.data.message.includes('REFUSED') || verifyResp.data.message.includes('ECHEC')) {
                        clearInterval(pollingRef.current);
                        setError("Le paiement a été refusé.");
                        setIsProcessing(false);
                        fetchHistory();
                    }
                } catch (pollErr) { console.error("Polling error", pollErr); }
            }, 5000);

            setTimeout(() => {
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    if (!success) setIsProcessing(false);
                }
            }, 600000);

        } catch (err) {
            setError(`Erreur: ${err.response?.data?.message || err.message}`);
            setIsProcessing(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    if (loading) return <div className="text-center p-5"><Spinner color="primary" /></div>;
    if (error && !profile) return <div className="text-center p-5 text-danger">Erreur : {error}</div>;

    return (
        <>
            {/* Header Section as a Card */}
            <div className="header pb-6 pt-5 pt-md-8">
                <Container fluid>
                    <Card className="bg-pubcash-orange-solid border-0 shadow card-rounded-lg mb-4">
                        <CardBody className="py-5 px-4">
                            <h6 className="text-uppercase ls-1 mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                Mon Compte PubCash
                            </h6>
                            <h1 className="display-3 text-white mb-2">
                                Bonjour, {profile.prenom || 'User'}
                            </h1>
                            <p className="text-white mt-0 mb-0" style={{ maxWidth: '600px', opacity: 0.9 }}>
                                Transformez votre solde en résultats, planifiez vos campagnes promotionnelles dès maintenant.
                            </p>
                        </CardBody>
                    </Card>
                </Container>
            </div>

            <Container className="mt--6" fluid>
                {/* Main Recharge & Info Card */}
                <Card className="shadow card-rounded-lg border-0 mb-4">
                    <CardHeader className="bg-white border-0 pt-4 pb-2">
                        <h3 className="mb-0 text-dark font-weight-800">Recharger mon compte</h3>
                    </CardHeader>
                    <CardBody className="px-lg-5 py-lg-4">
                        <Row>
                            {/* Left Column: Recharge Form (Green) */}
                            <Col lg="7" className="mb-4 mb-lg-0">
                                <div className="bg-pubcash-light-green p-4 rounded h-100">
                                    <Form onSubmit={handleRecharge}>
                                        <FormGroup className="mb-3">
                                            <label className="form-control-label-pubcash mb-2 d-block">
                                                Montant à recharger (FCFA)
                                            </label>
                                            <Input
                                                className="form-control-pubcash"
                                                placeholder="Ex: 5000"
                                                type="number"
                                                min="100"
                                                step="100"
                                                value={rechargeAmount}
                                                onChange={(e) => setRechargeAmount(e.target.value)}
                                                required
                                                disabled={isProcessing}
                                            />
                                            <div className="text-muted small mt-2">Minimum: 100 FCFA</div>
                                        </FormGroup>

                                        {error && <div className="alert alert-danger my-2 py-2 small">{error}</div>}
                                        {success && <div className="alert alert-success my-2 py-2 small">{success}</div>}

                                        <Button
                                            className="btn-pubcash-green btn-block mb-4 mt-3"
                                            type="submit"
                                            disabled={!sdkLoaded || isProcessing}
                                        >
                                            {isProcessing ? <Spinner size="sm" /> : "Recharger votre compte"}
                                        </Button>

                                        <div className="d-flex align-items-center">
                                            <span className="mr-3 font-weight-600 text-sm">Moyens de rechargement :</span>
                                            <div className="d-flex">
                                               <img src={require('assets/img/theme/Orange.png')} alt="Orange Money" style={{ width: '30px', height: '30px', margin: '0 5px' }} />
                                               <img src={require('assets/img/theme/MTN.png')} alt="MTN Money" style={{ width: '30px', height: '30px', margin: '0 5px' }} />
                                              <img src={require('assets/img/theme/Moov.png')} alt="Moov Money" style={{ width: '30px', height: '30px', margin: '0 5px' }} />
                                                <img src={require('assets/img/theme/Wave.png')} alt="Wave" style={{ width: '30px', height: '30px', margin: '0 5px' }} />
                                            </div>
                                        </div>
                                    </Form>
                                </div>
                            </Col>

                            {/* Right Column: Profile Info (Peach) */}
                            <Col lg="5">
                                <div className="bg-pubcash-light-peach p-4 rounded h-100 d-flex flex-column justify-content-center">
                                    <h3 className="font-weight-bold mb-1">
                                        {profile.prenom} {profile.nom}
                                        {profile.commune && <span className="font-weight-light">, {profile.commune}</span>}
                                    </h3>
                                    <div className="text-muted small mb-4">
                                        {profile.email}
                                    </div>

                                    <hr className="my-4" style={{ borderColor: 'rgba(0,0,0,0.1)' }} />

                                    <div className="text-center">
                                        <div className="text-uppercase text-muted font-weight-bold small mb-2">
                                            Mon solde PubCash
                                        </div>
                                        <div className="text-balance-big">
                                            {parseFloat(profile.solde_recharge).toLocaleString('fr-FR')} Fcfa
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* History Section */}
                <Card className="shadow card-rounded-lg border-0">
                    <CardHeader className="bg-white border-0">
                        <h3 className="mb-0 text-dark font-weight-800">Historique des rechargements</h3>
                    </CardHeader>
                    <Table className="align-items-center table-flush table-history" responsive>
                        <thead className="thead-light">
                            <tr>
                                <th scope="col">DATE</th>
                                <th scope="col">MONTANT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length > 0 ? (
                                history.map((item, index) => (
                                    <tr key={index}>
                                        <td className="font-weight-bold">{formatDate(item.created_at)}</td>
                                        <td className="font-weight-bold text-dark">
                                            {parseFloat(item.amount).toLocaleString('fr-FR')} FCFA
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="2" className="text-center py-4">Aucun rechargement effectué</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card>
            </Container>
        </>
    );
};

export default MonCompte;