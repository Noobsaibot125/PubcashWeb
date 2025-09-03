// src/components/Headers/ClientHeader.js
import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardTitle, Container, Row, Col, Spinner } from 'reactstrap';
import api from '../../services/api';
const ClientHeaderComponent = () => {
  const [stats, setStats] = useState({ solde: null, vues: null, likes: null, partages: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        // 2. On utilise 'api.get' pour les appels. Plus besoin de gérer le token ou l'URL de base.
        //    L'intercepteur ajoutera l'accessToken automatiquement.
        const [profileRes, statsRes] = await Promise.all([
          api.get('/client/profile'), 
          api.get('/client/global-stats')
        ]);

        // 3. La réponse d'Axios est directement dans 'response.data'
        const profileData = profileRes.data;
        const statsData = statsRes.data;

        setStats({
          solde: profileData.solde_recharge,
          vues: statsData.total_vues,
          likes: statsData.total_likes,
          partages: statsData.total_partages,
        });
      } catch (err) {
        console.error("Erreur de chargement des données du header.", err);
        // Si le token est expiré, l'intercepteur gèrera le refresh ou la redirection.
        // On peut ajouter ici un message d'erreur à l'utilisateur si besoin.
      } finally {
        setLoading(false);
      }
    };
    fetchHeaderData();
  }, []); // Le tableau de dépendances vide est correct, l'appel se fait une fois au montage.

  const renderStatCard = (title, value, icon, color) => (
    <Col lg="6" xl="3" >
      <Card className="card-stats mb-4 mb-xl-0" >
        <CardBody>
          <Row>
            <div className="col" >
              <CardTitle tag="h5" className="text-uppercase text-muted mb-0">{title}</CardTitle>
              <span className="h2 font-weight-bold mb-0">
                {loading ? <Spinner size="sm" /> : (value || 0).toLocaleString('fr-FR')}
              </span>
            </div>
            <Col className="col-auto" >
              <div className={`icon icon-shape bg-${color} text-white rounded-circle shadow`}>
                <i className={icon} />
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>
    </Col>
  );

  return (
    <div className="header bg-gradient-primary pb-8 pt-5 pt-md-8">
      <Container fluid>
        <div className="header-body">
          <Row>
            {renderStatCard("Mon Solde (FCFA)", stats.solde, "fas fa-wallet", "success")}
            {renderStatCard("Vues Totales", stats.vues, "fas fa-eye", "info")}
            {renderStatCard("Likes Totaux", stats.likes, "fas fa-thumbs-up", "primary")}
            {renderStatCard("Partages Totaux", stats.partages, "fas fa-share", "warning")}
          </Row>
        </div>
      </Container>
    </div>
  );
};

const ClientHeader = React.memo(ClientHeaderComponent);
export default ClientHeader;