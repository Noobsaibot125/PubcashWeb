import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Card, CardBody, CardHeader, Container, Row, Col,
    Form, FormGroup, Input, Button, Spinner, Table, Badge,
    Modal, ModalHeader, ModalBody, ModalFooter,
    Pagination, PaginationItem, PaginationLink
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

    // États pour le popup de paiement
    const [paymentModal, setPaymentModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null); // 'success' | 'error'
    const [paymentMessage, setPaymentMessage] = useState('');
    const [countdown, setCountdown] = useState(3);

    // État pour la pagination de l'historique
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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

    // Fonction pour afficher le popup et recharger la page
    const showPaymentResult = useCallback((status, message, amount = null) => {
        setPaymentStatus(status);
        if (status === 'success' && amount) {
            setPaymentMessage(`Vous avez rechargé : ${parseFloat(amount).toLocaleString('fr-FR')} FCFA`);
        } else {
            setPaymentMessage(message);
        }
        setPaymentModal(true);
        setCountdown(3);

        // Compte à rebours et rechargement automatique
        let count = 3;
        const countdownInterval = setInterval(() => {
            count--;
            setCountdown(count);
            if (count <= 0) {
                clearInterval(countdownInterval);
                window.location.reload();
            }
        }, 1000);
    }, []);

    // Sauvegarder le résultat dans localStorage avant que CinetPay ne recharge la page
    const savePaymentResultForReload = useCallback((status, message, amount = null) => {
        const result = {
            status,
            message: status === 'success' && amount
                ? `Vous avez rechargé : ${parseFloat(amount).toLocaleString('fr-FR')} FCFA`
                : message,
            timestamp: Date.now()
        };
        localStorage.setItem('pendingPaymentResult', JSON.stringify(result));
    }, []);

    // Vérifier au chargement s'il y a un résultat de paiement à afficher
    useEffect(() => {
        const savedResult = localStorage.getItem('pendingPaymentResult');
        if (savedResult) {
            try {
                const result = JSON.parse(savedResult);
                // Vérifier que le résultat n'est pas trop vieux (moins de 60 secondes)
                if (Date.now() - result.timestamp < 60000) {
                    setPaymentStatus(result.status);
                    setPaymentMessage(result.message);
                    setPaymentModal(true);
                    setCountdown(5); // Plus de temps pour lire

                    // Compte à rebours pour fermer le popup
                    let count = 5;
                    const countdownInterval = setInterval(() => {
                        count--;
                        setCountdown(count);
                        if (count <= 0) {
                            clearInterval(countdownInterval);
                            setPaymentModal(false);
                        }
                    }, 1000);
                }
            } catch (e) {
                console.error('Erreur parsing payment result:', e);
            }
            // Supprimer le résultat après lecture
            localStorage.removeItem('pendingPaymentResult');
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

        const currentAmount = rechargeAmount; // Sauvegarder le montant

        if (!currentAmount || Number(currentAmount) < 100) {
            setError("Veuillez entrer un montant valide (minimum 100 FCFA).");
            setIsProcessing(false);
            return;
        }

        try {
            const initResp = await api.post('/client/recharge', { amount: parseFloat(currentAmount) });
            const initData = initResp.data;
            const transactionId = initData.checkout_data.transaction_id;

            if (!window.CinetPay) throw new Error('SDK CinetPay non chargé');

            window.CinetPay.setConfig({ ...initData.cinetpay_config, mode: 'PRODUCTION' });

            window.CinetPay.waitResponse((data) => {
                console.log("CinetPay Response:", data);
                if (data.status === "REFUSED" || data.status === "CANCELED") {
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setIsProcessing(false);
                    savePaymentResultForReload('error', 'Votre rechargement a échoué. Veuillez vérifier votre solde mobile.');
                    showPaymentResult('error', 'Votre rechargement a échoué. Veuillez vérifier votre solde mobile.');
                } else if (data.status === "ACCEPTED") {
                    // Le paiement est accepté, on attend la confirmation via le polling
                    console.log("Paiement accepté, en attente de confirmation...");
                }
            });

            window.CinetPay.onError((data) => {
                console.log("CinetPay Error:", data);
                if (pollingRef.current) clearInterval(pollingRef.current);
                setIsProcessing(false);
                savePaymentResultForReload('error', 'Erreur technique lors du paiement. Veuillez réessayer.');
                showPaymentResult('error', 'Erreur technique lors du paiement. Veuillez réessayer.');
            });

            // Callback quand l'utilisateur ferme le modal CinetPay
            window.CinetPay.onClose = async (data) => {
                console.log("CinetPay Modal Closed:", data);
                // Attendre un peu pour laisser le temps à CinetPay de traiter
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Vérifier le statut final de la transaction
                try {
                    const verifyResp = await api.post('/client/recharge/verify', { transaction_id: transactionId });
                    const message = verifyResp.data.message || '';

                    if (message.includes('confirmé') || message.includes('déjà validée') || message.includes('déjà traitée')) {
                        if (pollingRef.current) clearInterval(pollingRef.current);
                        setRechargeAmount('');
                        setIsProcessing(false);
                        // Sauvegarder le résultat avant que CinetPay ne recharge la page
                        savePaymentResultForReload('success', '', currentAmount);
                        showPaymentResult('success', '', currentAmount);
                    } else if (message.includes('REFUSED') || message.includes('FAILED') || message.includes('CANCELLED')) {
                        if (pollingRef.current) clearInterval(pollingRef.current);
                        setIsProcessing(false);
                        savePaymentResultForReload('error', 'Votre rechargement a échoué. Veuillez vérifier votre solde mobile.');
                        showPaymentResult('error', 'Votre rechargement a échoué. Veuillez vérifier votre solde mobile.');
                    } else if (message.includes('PENDING')) {
                        // Encore en attente, laisser le polling continuer
                        console.log("Transaction toujours en attente...");
                    } else {
                        // Statut inconnu, on réinitialise et laisse l'utilisateur réessayer
                        if (pollingRef.current) clearInterval(pollingRef.current);
                        setIsProcessing(false);
                    }
                } catch (err) {
                    console.error("Erreur vérification après fermeture:", err);
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setIsProcessing(false);
                }
            };

            window.CinetPay.getCheckout(initData.checkout_data);

            pollingRef.current = setInterval(async () => {
                try {
                    const verifyResp = await api.post('/client/recharge/verify', { transaction_id: transactionId });
                    const msg = verifyResp.data.message || '';
                    // Vérifier les différents messages de succès
                    if (verifyResp.status === 200 && (msg.includes('confirmé') || msg.includes('déjà validée') || msg.includes('déjà traitée'))) {
                        clearInterval(pollingRef.current);
                        setRechargeAmount('');
                        setIsProcessing(false);
                        savePaymentResultForReload('success', '', currentAmount);
                        showPaymentResult('success', '', currentAmount);
                    } else if (msg.includes('REFUSED') || msg.includes('FAILED') || msg.includes('CANCELLED')) {
                        clearInterval(pollingRef.current);
                        setIsProcessing(false);
                        savePaymentResultForReload('error', 'Votre rechargement a échoué. Veuillez vérifier votre solde mobile.');
                        showPaymentResult('error', 'Votre rechargement a échoué. Veuillez vérifier votre solde mobile.');
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

                                        {/* Note informative sur l'email */}
                                        <div className="alert alert-info py-2 mt-3 mb-0 small">
                                            <i className="ni ni-email-83 mr-2"></i>
                                            Un email de confirmation vous sera envoyé une fois le rechargement effectué.
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
                    <CardHeader className="bg-white border-0 d-flex justify-content-between align-items-center">
                        <h3 className="mb-0 text-dark font-weight-800">Historique des rechargements</h3>
                        {history.length > itemsPerPage && (
                            <small className="text-muted">
                                Page {currentPage} sur {Math.ceil(history.length / itemsPerPage)} ({history.length} transactions)
                            </small>
                        )}
                    </CardHeader>
                    <Table className="align-items-center table-flush table-history" responsive>
                        <thead className="thead-light">
                            <tr>
                                <th scope="col">ID TRANSACTION</th>
                                <th scope="col">MONTANT</th>
                                <th scope="col">DATE</th>
                                <th scope="col">STATUT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length > 0 ? (
                                history
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((item, index) => (
                                        <tr key={index}>
                                            <td className="text-primary">{item.transaction_id}</td>
                                            <td className="font-weight-bold text-dark">
                                                {parseFloat(item.amount).toLocaleString('fr-FR')} FCFA
                                            </td>
                                            <td>{formatDate(item.created_at)}</td>
                                            <td>
                                                {item.status === 'COMPLETED' ? (
                                                    <Badge color="success">Validé</Badge>
                                                ) : item.status === 'PENDING' ? (
                                                    <Badge color="warning">En attente</Badge>
                                                ) : (
                                                    <Badge color="danger">Échoué</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-4">Aucun rechargement effectué</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>

                    {/* Pagination - apparait seulement si plus de 5 éléments */}
                    {history.length > itemsPerPage && (
                        <div className="d-flex justify-content-center py-3">
                            <Pagination>
                                <PaginationItem disabled={currentPage === 1}>
                                    <PaginationLink
                                        previous
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                    />
                                </PaginationItem>

                                {[...Array(Math.ceil(history.length / itemsPerPage))].map((_, i) => (
                                    <PaginationItem key={i} active={currentPage === i + 1}>
                                        <PaginationLink onClick={() => setCurrentPage(i + 1)}>
                                            {i + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}

                                <PaginationItem disabled={currentPage === Math.ceil(history.length / itemsPerPage)}>
                                    <PaginationLink
                                        next
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                    />
                                </PaginationItem>
                            </Pagination>
                        </div>
                    )}
                </Card>
            </Container>

            {/* Modal Popup de résultat de paiement */}
            <Modal isOpen={paymentModal} centered backdrop="static" keyboard={false}>
                <ModalHeader
                    className={paymentStatus === 'success' ? 'bg-success text-white' : 'bg-danger text-white'}
                    style={{ borderBottom: 'none' }}
                >
                    <i className={`fas ${paymentStatus === 'success' ? 'fa-check-circle' : 'fa-times-circle'} mr-2`}></i>
                    {paymentStatus === 'success' ? 'Rechargement Réussi !' : 'Échec du Rechargement'}
                </ModalHeader>
                <ModalBody className="text-center py-4">
                    <div style={{ fontSize: '60px', marginBottom: '20px' }}>
                        {paymentStatus === 'success' ? '✅' : '❌'}
                    </div>
                    <h4 className={paymentStatus === 'success' ? 'text-success' : 'text-danger'}>
                        {paymentMessage}
                    </h4>
                    <p className="text-muted mt-3">
                        La page se rechargera automatiquement dans <strong>{countdown}</strong> seconde{countdown > 1 ? 's' : ''}...
                    </p>
                </ModalBody>
                <ModalFooter className="justify-content-center border-0">
                    <Button
                        color={paymentStatus === 'success' ? 'success' : 'danger'}
                        onClick={() => window.location.reload()}
                    >
                        Rafraîchir maintenant
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default MonCompte;