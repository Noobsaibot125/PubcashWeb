/*!

=========================================================
* Argon Dashboard React - v1.2.4
=========================================================
*/
import React, { useState, useEffect } from "react";
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    Container,
    Row,
    Col,
    Badge
} from "reactstrap";
import api from "../../services/api"; // Import centralized API

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
        if (!window.confirm(`Voulez-vous souscrire au plan ${plans[planType].name} pour ${plans[planType].price} FCFA ?`)) return;

        setLoading(true);
        try {
            // NOTE: Ici on simule le paiement direct pour l'instant comme configuré dans le backend
            // Pour la prod, il faudrait rediriger vers CinetPay
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
            <div className="header bg-gradient-info pb-8 pt-5 pt-md-8">
                <Container fluid>
                    <div className="header-body">
                        <h1 className="text-white">Abonnements Premium</h1>
                        <p className="text-white mt-0 mb-5">
                            Débloquez la messagerie et boostez vos promotions avec nos offres exclusives.
                        </p>
                    </div>
                </Container>
            </div>
            <Container className="mt--7" fluid>
                <Row className="justify-content-center">
                    {/* CARTE ABONNEMENT ACTUEL */}
                    {currentSubscription && currentSubscription.hasSubscription && (
                        <Col lg="12" className="mb-4">
                            <Card className="bg-gradient-success shadow">
                                <CardBody className="text-white">
                                    <h3 className="text-white mb-2">Abonnement Actif : {currentSubscription.plan?.name}</h3>
                                    <p>Expire le : {new Date(currentSubscription.dateFin).toLocaleDateString()}</p>
                                    <Badge color="white" className="text-success">En cours</Badge>
                                </CardBody>
                            </Card>
                        </Col>
                    )}

                    {/* LISTE DES PLANS */}
                    {Object.entries(plans).map(([key, plan]) => (
                        <Col lg="4" md="6" key={key}>
                            <Card className="card-pricing border-0 text-center mb-4 shadow">
                                <CardHeader className="bg-transparent">
                                    <h4 className="text-uppercase ls-1 text-primary py-3 mb-0">{plan.name}</h4>
                                </CardHeader>
                                <CardBody className="px-lg-7">
                                    <div className="display-2">{plan.price} FCFA</div>
                                    <span className="text-muted">pour {plan.duration_months} mois</span>
                                    <ul className="list-unstyled my-4">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="align-items-center">
                                                <div className="d-flex align-items-center">
                                                    <span className="badge badge-circle badge-success mr-2">
                                                        <i className="ni ni-check-bold" />
                                                    </span>
                                                    <span className="text-sm">{feature}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        color={key === 'promoteur_ultra' ? "primary" : "info"}
                                        type="button"
                                        className="mb-3"
                                        onClick={() => handleSubscribe(key)}
                                        disabled={loading || (currentSubscription?.hasSubscription)}
                                    >
                                        {loading ? "Traitement..." : (currentSubscription?.hasSubscription ? "Déjà abonné" : "Choisir ce plan")}
                                    </Button>
                                </CardBody>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>
        </>
    );
};

export default Abonnement;
