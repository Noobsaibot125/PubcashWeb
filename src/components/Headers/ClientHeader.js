// src/components/Headers/ClientHeader.js
import React, { useState, useEffect } from 'react';
import { Card, CardBody, Container, Row, Col, Spinner } from 'reactstrap';
import api from '../../services/api';

const ClientHeaderComponent = ({ onShowFollowers }) => {
  const [stats, setStats] = useState({ solde: null, vues: null, likes: null, partages: null, followers: null });
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
          followers: statsData.total_followers || 0
        });
      } catch (err) {
        console.error("Erreur de chargement des données du header.", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeaderData();
  }, []);

  return (
    <div className="header pb-8 pt-5 pt-md-8">
      <Container fluid>
        <div className="header-body">
          <Row className="justify-content-center"> 
            
            <Col lg="6" xl="3">
                <Card className="card-stats-solid card-stats-orange mb-4 mb-xl-0">
                    <CardBody>
                        <div className="icon-large"><i className="fas fa-credit-card"></i></div>
                        <div className="content-bottom">
                            <span className="stat-label">Mon Solde</span>
                            <span className="stat-value">
                                {loading ? <Spinner size="sm" color="light" /> : `${parseInt(stats.solde || 0).toLocaleString('fr-FR').replace(/\s/g, ' ')} F`}
                            </span>
                        </div>
                    </CardBody>
                </Card>
            </Col>

            <Col lg="6" xl="2">
                <Card className="card-stats-solid card-stats-blue mb-4 mb-xl-0">
                    <CardBody>
                        <div className="icon-large"><i className="fas fa-eye"></i></div>
                        <div className="content-bottom">
                            <span className="stat-label">Vues</span>
                            <span className="stat-value">
                                {loading ? <Spinner size="sm" color="light" /> : (stats.vues || 0).toLocaleString('fr-FR')}
                            </span>
                        </div>
                    </CardBody>
                </Card>
            </Col>

            <Col lg="6" xl="2">
                <Card className="card-stats-solid card-stats-purple mb-4 mb-xl-0">
                    <CardBody>
                        <div className="icon-large"><i className="fas fa-thumbs-up"></i></div>
                        <div className="content-bottom">
                            <span className="stat-label">Likes</span>
                            <span className="stat-value">
                                {loading ? <Spinner size="sm" color="light" /> : (stats.likes || 0).toLocaleString('fr-FR')}
                            </span>
                        </div>
                    </CardBody>
                </Card>
            </Col>

            <Col lg="6" xl="2">
                <Card className="card-stats-solid card-stats-green mb-4 mb-xl-0">
                    <CardBody>
                        <div className="icon-large"><i className="fas fa-share-alt"></i></div>
                        <div className="content-bottom">
                            <span className="stat-label">Partages</span>
                            <span className="stat-value">
                                {loading ? <Spinner size="sm" color="light" /> : (stats.partages || 0).toLocaleString('fr-FR')}
                            </span>
                        </div>
                    </CardBody>
                </Card>
            </Col>

            {/* --- CARTE ABONNÉS EN ROSE --- */}
            <Col lg="6" xl="3">
                <Card 
                    className="card-stats-solid mb-4 mb-xl-0 shadow"
                    style={{ 
                        cursor: 'pointer',
                        // Utilisation d'un dégradé Rose personnalisé
                        background: 'linear-gradient(87deg, #f5365c 0, #f56036 100%)',
                        border: 'none'
                    }}
                    onClick={onShowFollowers}
                >
                    <CardBody>
                        <div className="icon-large">
                            <i className="fas fa-users"></i>
                        </div>
                        <div className="content-bottom">
                            <span className="stat-label">Abonnés</span>
                            <span className="stat-value">
                                {loading ? <Spinner size="sm" color="light" /> : (stats.followers || 0).toLocaleString('fr-FR')}
                            </span>
                        </div>
                    </CardBody>
                </Card>
            </Col>

          </Row>
        </div>
      </Container>
    </div>
  );
};

const ClientHeader = React.memo(ClientHeaderComponent);
export default ClientHeader;