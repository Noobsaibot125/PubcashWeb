// src/components/Headers/ClientHeader.js
import React, { useState, useEffect } from 'react';
import { Card, CardBody, Container, Row, Col, Spinner } from 'reactstrap';
import api from '../../services/api';

const ClientHeaderComponent = () => {
  const [stats, setStats] = useState({ solde: null, vues: null, likes: null, partages: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          api.get('/client/profile'), 
          api.get('/client/global-stats')
        ]);

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
      } finally {
        setLoading(false);
      }
    };
    fetchHeaderData();
  }, []);

  const renderStatCard = (title, value, icon, variant, isSolde = false) => (
    <Col lg="6" xl="3">
      <Card className={`card-stats-solid card-stats-${variant} mb-4 mb-xl-0`}>
        <CardBody>
          <div className="icon-large">
             <i className={icon}></i>
          </div>
          <div className="content-bottom">
            <span className="stat-label">{title}</span>
            <span className="stat-value">
                {loading ? (
                  <Spinner size="sm" color="light" />
                ) : isSolde ? (
                   // Mockup style: "15 009 F"
                  `${parseInt(value || 0).toLocaleString('fr-FR').replace(/\s/g, ' ')} F`
                ) : (
                  (value || 0).toLocaleString('fr-FR').replace(/\s/g, ' ')
                )}
            </span>
          </div>
        </CardBody>
      </Card>
    </Col>
  );
  

  return (
    <div className="header pb-8 pt-5 pt-md-8">
      {/* Background is transparent to show body grey */}
      <Container fluid>
        <div className="header-body">
          <Row>
            {renderStatCard("Mon Solde (FCFA)", stats.solde, "fas fa-credit-card", "orange", true)}
            {renderStatCard("Vues Totales", stats.vues, "fas fa-eye", "blue")}
            {renderStatCard("Likes Totaux", stats.likes, "fas fa-thumbs-up", "purple")}
            {renderStatCard("Partages Totaux", stats.partages, "fas fa-share-alt", "green")}
          </Row>
        </div>
      </Container>
    </div>
  );
};

const ClientHeader = React.memo(ClientHeaderComponent);
export default ClientHeader;