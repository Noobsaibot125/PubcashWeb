import React, { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    CardHeader,
    CardBody,
    Button,
    Spinner
} from "reactstrap";
import Header from "components/Headers/Header.js";
import api from "services/api";
import { toast } from 'react-toastify';

const SystemSettings = () => {
    const [maintenance, setMaintenance] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings/maintenance');
            if (res.data) {
                setMaintenance(res.data.maintenance || false);
            }
        } catch (error) {
            console.error("Erreur lecture settings:", error);
            toast.error("Impossible de récupérer les paramètres.");
        } finally {
            setLoading(false);
        }
    };

    const toggleMaintenance = async () => {
        setUpdating(true);
        try {
            const newState = !maintenance;
            await api.put('/settings/maintenance', { enabled: newState, type: 'global' });
            setMaintenance(newState);
            toast.success(`Mode maintenance ${newState ? 'activé' : 'désactivé'} avec succès.`);
        } catch (error) {
            console.error("Erreur update settings:", error);
            toast.error("Erreur lors de la mise à jour.");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="text-center mt-5"><Spinner color="primary" /></div>;

    return (
        <>
            <Header />
            <Container className="mt--7" fluid>
                <Row className="justify-content-center">
                    <Col lg="8">
                        <Card className="bg-secondary shadow border-0">
                            <CardHeader className="bg-transparent pb-4">
                                <div className="text-muted text-center mt-2 mb-2">
                                    <h2 className="text-dark">Paramètres du Système</h2>
                                    <p className="text-muted mb-0">Gérez le mode de maintenance du site</p>
                                </div>
                            </CardHeader>
                            <CardBody className="px-lg-5 py-lg-4">

                                <Row className="align-items-center py-4">
                                    <Col xs="8">
                                        <h4 className="mb-1">🔒 Mode Maintenance</h4>
                                        <small className="text-muted">
                                            Bloque l'accès à tout le site (Web + Mobile).
                                            Utilisez en cas de mise à jour importante.
                                        </small>
                                    </Col>
                                    <Col xs="4" className="text-right">
                                        <Button
                                            color={maintenance ? "danger" : "success"}
                                            onClick={toggleMaintenance}
                                            disabled={updating}
                                        >
                                            {updating ? <Spinner size="sm" /> : (maintenance ? "Désactiver" : "Activer")}
                                        </Button>
                                    </Col>
                                </Row>

                                {maintenance && (
                                    <div className="alert alert-danger mt-4">
                                        <strong><i className="fas fa-exclamation-triangle mr-2"></i>Attention!</strong>
                                        <span className="ml-2">Le mode maintenance est activé. Personne ne peut accéder au site.</span>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default SystemSettings;
