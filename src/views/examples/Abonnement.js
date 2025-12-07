import React, { useState, useEffect } from "react";
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Container,
    Row,
    Col,
    Badge,
    Alert
} from "reactstrap";
import api from "../../services/api";

const Abonnement = () => {
    const [plans, setPlans] = useState({});
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPlans();
        fetchStatus();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await api.get("/subscriptions/plans");
            setPlans(res.data);
        } catch (error) {
            console.error("Erreur fetchPlans:", error);
        }
    };

    const fetchStatus = async () => {
        try {
            const res = await api.get("/subscriptions/status");
            setCurrentSubscription(res.data);
        } catch (error) {
            console.error("Erreur fetchStatus:", error);
        }
    };

    const handleSubscribe = async (planType) => {
        if (!window.confirm(`Confirmer la souscription au plan ${plans[planType].name} ?`)) return;

        setLoading(true);
        try {
            const res = await api.post("/subscriptions/subscribe", { planType });
            alert(res.data.message);
            fetchStatus();
        } catch (error) {
            console.error("Erreur subscribe:", error);
            alert(error.response?.data?.message || "Erreur lors de la souscription");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Header modifié avec le fond orange #f36c21 */}
            <div 
                className="header pb-8 pt-5 pt-md-8" 
                style={{ backgroundColor: '#f36c21' }}
            >
                <Container fluid>
                    <div className="header-body text-center mb-5">
                        <Row className="justify-content-center">
                            <Col lg="8" md="10">
                                <h1 className="text-white display-3">Passez au niveau supérieur</h1>
                                {/* CORRECTION ICI : text-white au lieu de text-white-50 et ajout de 'lead' */}
                                <p className="text-white mt-3 lead">
                                    Débloquez la messagerie, boostez vos promotions et maximisez vos gains sur PubCash.
                                    Choisissez le plan qui correspond à vos ambitions.
                                </p>
                            </Col>
                        </Row>
                    </div>
                </Container>
            </div>

            <Container className="mt--9" fluid>
                {/* SECTION ABONNEMENT ACTUEL (Si existant) */}
                {currentSubscription && currentSubscription.hasSubscription && (
                    <Row className="justify-content-center mb-5">
                        <Col lg="8">
                            <Alert color="success" className="shadow-lg border-0 bg-white text-center p-4">
                                <div className="icon icon-shape bg-gradient-success text-white rounded-circle mb-3 shadow">
                                    <i className="ni ni-check-bold" />
                                </div>
                                <h3 className="text-success mb-1">Abonnement Actif : {currentSubscription.plan?.name}</h3>
                                <p className="text-muted mb-0">
                                    Expire le : <strong>{new Date(currentSubscription.dateFin).toLocaleDateString()}</strong>
                                </p>
                            </Alert>
                        </Col>
                    </Row>
                )}

                {/* GRILLE DES PRIX */}
                <Row className="justify-content-center align-items-center">
                    {Object.entries(plans).map(([key, plan]) => {
                        // On détecte si c'est le plan "premium" pour le mettre en avant
                        const isPremium = key === 'promoteur_ultra';
                        
                        return (
                            <Col lg="4" md="6" xs="12" key={key} className="mb-4">
                                <Card className={`card-pricing border-0 text-center shadow-lg ${isPremium ? 'transform-scale-110 z-index-2' : ''}`}
                                      style={{ transition: 'all 0.3s ease', transform: isPremium ? 'scale(1.05)' : 'scale(1)' }}>
                                    
                                    {isPremium && (
                                        <div className="ribbon-container text-center mt-2">
                                            <Badge color="warning" pill className="text-uppercase px-3 py-1 shadow-sm">Recommandé</Badge>
                                        </div>
                                    )}

                                    <CardHeader className="bg-transparent border-0 pb-0">
                                        <h4 className={`text-uppercase ls-1 py-3 mb-0 ${isPremium ? 'text-warning' : 'text-primary'}`}>
                                            {plan.name}
                                        </h4>
                                    </CardHeader>

                                    <CardBody className="px-lg-7">
                                        <div className="display-2 font-weight-bold">
                                            {new Intl.NumberFormat('fr-FR').format(plan.price)} 
                                            <span className="text-lg text-muted font-weight-normal"> FCFA</span>
                                        </div>
                                        <span className="text-muted text-sm text-uppercase">
                                            / {plan.duration_months > 1 ? `${plan.duration_months} mois` : 'mois'}
                                        </span>
                                        
                                        <div className="my-4 border-top opacity-2"></div>

                                        <ul className="list-unstyled my-4 text-left">
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx} className="d-flex align-items-center mb-3">
                                                    <div className={`icon icon-xs icon-shape rounded-circle shadow-sm mr-3 ${isPremium ? 'bg-gradient-warning text-white' : 'bg-gradient-primary text-white'}`}>
                                                        <i className="ni ni-check-bold" />
                                                    </div>
                                                    <span className="text-sm text-muted">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardBody>

                                    <CardFooter className="bg-transparent border-0 pt-0">
                                        <Button
                                            block
                                            size="lg"
                                            className="btn-round shadow hover-translate-y-n3"
                                            color={isPremium ? "warning" : "primary"}
                                            outline={!isPremium}
                                            onClick={() => handleSubscribe(key)}
                                            disabled={loading || (currentSubscription?.hasSubscription)}
                                        >
                                            {loading ? "Traitement..." : (currentSubscription?.hasSubscription ? "Déjà Abonné" : "Choisir ce plan")}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            </Container>

            {/* Ajout de style inline pour l'effet de scale si non présent dans ton CSS global */}
            <style jsx>{`
                .transform-scale-110 {
                    z-index: 10;
                }
                @media (max-width: 991px) {
                    .transform-scale-110 {
                        transform: scale(1) !important;
                        margin-bottom: 2rem;
                    }
                }
            `}</style>
        </>
    );
};

export default Abonnement;