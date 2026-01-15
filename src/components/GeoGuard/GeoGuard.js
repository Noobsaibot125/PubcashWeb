import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import BlockedAccess from '../../views/BlockedAccess';
import Maintenance from '../../views/Maintenance';

const GeoGuard = ({ children }) => {
    const [isAllowed, setIsAllowed] = useState(null); // null = loading
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            // Bypass pour les admins (accès URL direct)
            const path = window.location.pathname;
            if (path.startsWith('/super-admin') || path.startsWith('/admin') || path.startsWith('/auth/login-admin')) {
                setIsAllowed(true);
                setLoading(false);
                return;
            }

            try {
                // 1. Vérification GeoIP via /health
                await api.get('/health');

                // 2. Vérification maintenance Web spécifique
                const maintenanceRes = await api.get('/settings/maintenance');
                const { maintenance, maintenance_web } = maintenanceRes.data;

                // Si maintenance globale OU maintenance Web activée -> afficher page maintenance
                if (maintenance || maintenance_web) {
                    setIsMaintenance(true);
                } else {
                    setIsAllowed(true);
                }
            } catch (error) {
                if (error.response && error.response.status === 403) {
                    console.warn("Accès bloqué par restriction géographique.");
                    setIsAllowed(false);
                } else if (error.response && error.response.status === 503) {
                    console.warn("Site en maintenance (503).");
                    setIsMaintenance(true);
                } else {
                    // Fail open si erreur réseau
                    console.error("Erreur check access:", error);
                    setIsAllowed(true);
                }
            } finally {
                setLoading(false);
            }
        };

        checkAccess();
    }, []);

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8f9fe'
            }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Chargement...</span>
                </div>
            </div>
        );
    }

    if (isMaintenance) {
        return <Maintenance />;
    }

    if (isAllowed === false) {
        return <BlockedAccess />;
    }

    return children;
};

export default GeoGuard;
