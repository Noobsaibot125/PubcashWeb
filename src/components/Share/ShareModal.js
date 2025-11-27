// src/components/Share/ShareModal.js
import React from 'react';
import { Modal, ModalHeader, ModalBody, Row, Col } from 'reactstrap';
import {
  FacebookShareButton, WhatsappShareButton, TwitterShareButton, TelegramShareButton,
  FacebookIcon, WhatsappIcon, TwitterIcon, TelegramIcon,
} from 'react-share';

const ShareModal = ({ isOpen, toggle, promotion, onShare, user }) => {
  const baseUrl = window.location.origin;

  // VERIFICATION : On s'assure que user existe et a un code
  const userCode = user && user.code_parrainage ? user.code_parrainage : '';
  
  // CONSTRUCTION DE L'URL : Si le code existe, on ajoute ?ref=CODE
  const refParam = userCode ? `?ref=${userCode}` : '';
  
  // URL FINALE : ex: https://pub-cash.com/promo/12?ref=TOTO1234
  const shareUrl = `${baseUrl}/promo/${promotion.id}${refParam}`;

  const title = `Regarde ça et gagne de l'argent ! : ${promotion.titre}`;

  const handleShare = () => {
    if (onShare) onShare();
    toggle();
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered>
      <ModalHeader toggle={toggle}>Partager la promotion</ModalHeader>
      <ModalBody className="text-center">
        <p>Partagez cette promotion avec vos amis !</p>
        
        {/* --- AJOUT POUR AFFICHER LE CODE EN GRAND --- */}
        {userCode ? (
            <div className="my-4">
                <p className="text-muted mb-1 small">Votre Code Parrainage est :</p>
                <strong style={{ fontSize: '1.5rem', color: '#FF7F00' }}>
                    {userCode}
                </strong>
            </div>
        ) : (
            <p className="small text-danger my-3">
                Aucun code parrainage détecté. Assurez-vous d'être connecté.
            </p>
        )}
        {/* ------------------------------------------- */}
        
        <Row className="justify-content-center py-3">
          <Col xs="3">
            <FacebookShareButton url={shareUrl} quote={title} onShareWindowClose={handleShare}>
              <FacebookIcon size={48} round />
            </FacebookShareButton>
          </Col>
          <Col xs="3">
            <WhatsappShareButton url={shareUrl} title={title} onShareWindowClose={handleShare}>
              <WhatsappIcon size={48} round />
            </WhatsappShareButton>
          </Col>
          <Col xs="3">
            <TwitterShareButton url={shareUrl} title={title} onShareWindowClose={handleShare}>
              <TwitterIcon size={48} round />
            </TwitterShareButton>
          </Col>
          <Col xs="3">
            <TelegramShareButton url={shareUrl} title={title} onShareWindowClose={handleShare}>
              <TelegramIcon size={48} round />
            </TelegramShareButton>
          </Col>
        </Row>
      </ModalBody>
    </Modal>
  );
};

export default ShareModal;