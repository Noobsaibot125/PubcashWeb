import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import BlockedAccess from '../../views/BlockedAccess';
import Maintenance from '../../views/Maintenance';

const GeoGuard = ({ children }) => {
    const [isAllowed, setIsAllowed] = useState(null); // null = loading
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkGeo = async () => {
            // Bypass pour les admins (accès URL direct)
            const path = window.location.pathname;
            if (path.startsWith('/super-admin') || path.startsWith('/auth/login-admin')) {
                setIsAllowed(true);
                setLoading(false);
                return;
            }

            try {
                // On tente d'accéder à /health
                // Si le backend renvoie 200 => OK
                // Si le backend renvoie 403 => Bloqué par geoMiddleware
                // Si le backend renvoie 503 => Maintenance
                await api.get('/health');
                setIsAllowed(true);
            } catch (error) {
                if (error.response && error.response.status === 403) {
                    console.warn("Accès bloqué par restriction géographique.");
                    setIsAllowed(false);
                } else if (error.response && error.response.status === 503) {
                    console.warn("Site en maintenance.");
                    setIsMaintenance(true);
                } else {
                    // En cas d'autre erreur (ex: serveur éteint), on laisse passer ou on bloque ?
                    // Pour l'instant, on laisse passer (fail open) pour ne pas bloquer sur des erreurs réseaux,
                    // SAUF si c'est explicitement 403.
                    // Mais si le serveur est inaccessible, l'app ne marchera pas de toute façon.
                    // On peut mettre true pour permettre d'afficher l'interface (qui plantera plus loin)
                    // ou false pour dire "Service indisponible".
                    // Ici le but est la restriction GEO. Donc si pas 403, on assume Allowed (ou on rertry).
                    console.error("Erreur check geo:", error);
                    setIsAllowed(true);
                }
            } finally {
                setLoading(false);
            }
        };

        checkGeo();
    }, []);

    if (loading) {
        // Afficher un loader simple pendant la vérification
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
