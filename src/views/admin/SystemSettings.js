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
            const res = await api.get('/settings/maintenance'); // On utilise l'endpoint public pour lire
            if (res.data) {
                setMaintenance(res.data.maintenance);
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
            await api.put('/settings/maintenance', { enabled: newState });
            setMaintenance(newState);
            toast.success(`Mode maintenance ${newState ? 'activé' : 'désactivé'} avec succès.`);
        } catch (error) {
            console.error("Erreur update settings:", error);
            toast.error("Erreur lors de la mise à jour du mode maintenance.");
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
                            <CardHeader className="bg-transparent pb-5">
                                <div className="text-muted text-center mt-2 mb-3">
                                    <h2 className="text-dark">Paramètres du Système</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="px-lg-5 py-lg-5">
                                <Row className="align-items-center mb-4">
                                    <Col xs="8">
                                        <h3 className="mb-0">Mode Maintenance</h3>
                                        <small className="text-muted">
                                            Si activé, le site sera inaccessible pour tous les utilisateurs (sauf les administrateurs).
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
                                    <div className="alert alert-warning mt-3">
                                        <strong>Attention!</strong> Le site est actuellement fermé au public.
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
