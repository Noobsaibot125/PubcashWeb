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
    const [settings, setSettings] = useState({
        maintenance: false,      // Global
        maintenance_web: false,  // Web only
        maintenance_api: false   // API/Mobile only
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState({ global: false, web: false, api: false });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings/maintenance');
            if (res.data) {
                setSettings({
                    maintenance: res.data.maintenance || false,
                    maintenance_web: res.data.maintenance_web || false,
                    maintenance_api: res.data.maintenance_api || false
                });
            }
        } catch (error) {
            console.error("Erreur lecture settings:", error);
            toast.error("Impossible de récupérer les paramètres.");
        } finally {
            setLoading(false);
        }
    };

    const toggleMaintenance = async (type) => {
        setUpdating(prev => ({ ...prev, [type]: true }));
        try {
            const currentValue = type === 'global' ? settings.maintenance : settings[`maintenance_${type}`];
            const newState = !currentValue;

            await api.put('/settings/maintenance', { enabled: newState, type });

            if (type === 'global') {
                setSettings(prev => ({ ...prev, maintenance: newState }));
            } else {
                setSettings(prev => ({ ...prev, [`maintenance_${type}`]: newState }));
            }

            const labels = { global: 'globale', web: 'Web', api: 'API/Mobile' };
            toast.success(`Maintenance ${labels[type]} ${newState ? 'activée' : 'désactivée'}.`);
        } catch (error) {
            console.error("Erreur update settings:", error);
            toast.error("Erreur lors de la mise à jour.");
        } finally {
            setUpdating(prev => ({ ...prev, [type]: false }));
        }
    };

    if (loading) return <div className="text-center mt-5"><Spinner color="primary" /></div>;

    const MaintenanceRow = ({ title, description, type, isActive, color }) => (
        <Row className="align-items-center mb-4 py-3" style={{ borderBottom: '1px solid #eee' }}>
            <Col xs="8">
                <h4 className="mb-1">{title}</h4>
                <small className="text-muted">{description}</small>
            </Col>
            <Col xs="4" className="text-right">
                <Button
                    color={isActive ? "danger" : color}
                    onClick={() => toggleMaintenance(type)}
                    disabled={updating[type]}
                    size="sm"
                >
                    {updating[type] ? <Spinner size="sm" /> : (isActive ? "Désactiver" : "Activer")}
                </Button>
            </Col>
        </Row>
    );

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
                                    <p className="text-muted mb-0">Gérez les modes de maintenance du site</p>
                                </div>
                            </CardHeader>
                            <CardBody className="px-lg-5 py-lg-4">

                                <MaintenanceRow
                                    title="🔒 Maintenance Globale"
                                    description="Bloque TOUT le site (Web + Mobile). Utilisez en cas de grosse mise à jour."
                                    type="global"
                                    isActive={settings.maintenance}
                                    color="danger"
                                />

                                <MaintenanceRow
                                    title="🌐 Maintenance Web"
                                    description="Bloque uniquement le site Web (pub-cash.com). Les utilisateurs mobiles peuvent continuer."
                                    type="web"
                                    isActive={settings.maintenance_web}
                                    color="warning"
                                />

                                <MaintenanceRow
                                    title="📱 Maintenance API/Mobile"
                                    description="Bloque uniquement l'API (application mobile). Le site Web reste accessible."
                                    type="api"
                                    isActive={settings.maintenance_api}
                                    color="info"
                                />

                                {/* Alertes actives */}
                                {settings.maintenance && (
                                    <div className="alert alert-danger mt-4">
                                        <strong><i className="fas fa-exclamation-triangle mr-2"></i>Attention!</strong>
                                        <span className="ml-2">Maintenance GLOBALE activée - Tout est bloqué.</span>
                                    </div>
                                )}
                                {settings.maintenance_web && !settings.maintenance && (
                                    <div className="alert alert-warning mt-4">
                                        <strong><i className="fas fa-globe mr-2"></i>Info:</strong>
                                        <span className="ml-2">Le site Web est en maintenance. Mobile OK.</span>
                                    </div>
                                )}
                                {settings.maintenance_api && !settings.maintenance && (
                                    <div className="alert alert-info mt-4">
                                        <strong><i className="fas fa-mobile-alt mr-2"></i>Info:</strong>
                                        <span className="ml-2">L'API Mobile est en maintenance. Web OK.</span>
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
