// src/views/examples/Choice.js
import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';

// Assurez-vous que le chemin vers vos images est correct depuis ce fichier
// Le chemin '../../assets/img/theme/' est probable si votre dossier 'assets' est dans 'src'
import watcherImage from '../../assets/img/theme/watcher.png'; 
import publisherImage from '../../assets/img/theme/Publisher.png';

// Importez le fichier CSS que nous allons créer à l'étape 2
import '../../assets/scss/Choice.css';
const Choice = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('hide-navbar');
    return () => {
      document.body.classList.remove('hide-navbar');
    };
  }, []);

  // Ces chemins d'URL sont gérés par votre routeur, ils sont indépendants de la structure des fichiers
  const handleNavigateToUserRegister = () => navigate('/auth/register-user');
  const handleNavigateToPromoterRegister = () => navigate('/auth/register');

  return (
    <Container className="mt-lg--7 pb-5">
      <Row className="justify-content-center">
        <Col lg="10" md="10" className="px-0">
          <div className="text-center text-muted mb-4">
            <h1 className="font-weight-bold" style={{color: '#444'}}>Comment voulez-vous utiliser PubCash ?</h1>
          </div>
          <Row className="no-gutters">
            {/* --- Option 1: Je veux regarder (MODIFIÉ ICI) --- */}
            <Col md="6" className="p-2">
              <div 
                className="choice-card" 
                onClick={handleNavigateToUserRegister} 
                style={{ 
                  backgroundImage: `url(${watcherImage})`,
                  backgroundPosition: 'center 25%' // <--- AJOUTE CETTE LIGNE
                }}
              >
                <div className="choice-overlay">
                  <div className="choice-text">
                  <h2 style={{ color: 'white' }}>JE VEUX REGARDER DES VIDÉOS</h2>
                    <p>Découvrez des vidéos captives et gagnez des récompenses.</p>
                  </div>
                </div>
              </div>
            </Col>

            {/* --- Option 2: Je veux publier des vidéos (INCHANGÉ) --- */}
            <Col md="6" className="p-2">
              <div 
                className="choice-card" 
                onClick={handleNavigateToPromoterRegister} 
                style={{ 
                  backgroundImage: `url(${publisherImage})` 
                }}
              >
                <div className="choice-overlay">
                  <div className="choice-text">
                  <h2 style={{ color: 'white' }}>JE VEUX PUBLIER DES VIDÉOS</h2>
                    <p>Partagez vos créations et touchez une large audience.</p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
          <Row className="mt-4">
            <Col className="text-center" xs="12">
              <Link to="/auth/login" className="link-pubcash-secondary">
                <small>Retour à la connexion</small>
              </Link>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default Choice;