// src/components/Share/ShareModal.js

import React from 'react';
import { Modal, ModalHeader, ModalBody, Row, Col } from 'reactstrap';
import {
  FacebookShareButton,
  WhatsappShareButton,
  TwitterShareButton,
  TelegramShareButton,
  FacebookIcon,
  WhatsappIcon,
  TwitterIcon,
  TelegramIcon,
} from 'react-share';

const ShareModal = ({ isOpen, toggle, promotion, onShare }) => {
  // Le lien à partager. Il pourrait pointer vers une page publique de la promo si elle existe,
  // sinon on peut utiliser l'URL du site.
  const shareUrl = `https://www.pub-cash.com/promo/${promotion.id}`; // Exemple d'URL
  const title = `Découvrez cette promotion incroyable : ${promotion.titre}`;

  const handleShare = () => {
    // Appelle la fonction onShare passée en props pour enregistrer l'interaction
    onShare();
    // Ferme la modale
    toggle();
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered>
      <ModalHeader toggle={toggle}>Partager la promotion</ModalHeader>
      <ModalBody className="text-center">
        <p>Partagez cette promotion avec vos amis !</p>
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