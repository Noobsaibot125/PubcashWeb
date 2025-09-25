// src/views/examples/Landing.js
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Spinner } from "reactstrap";
import { Link, useNavigate } from "react-router-dom"; // Importez useNavigate
import { jwtDecode } from 'jwt-decode'; // Installez avec : npm install jwt-decode
import { getMediaUrl } from 'utils/mediaUrl'; // AJOUT IMPORT
import "../../assets/css/Landing.css";

// Fichiers de secours locaux
import logoFallback from "../../assets/img/brand/pub cash.png";
import posterFallback from "../../assets/img/brand/pub cash.png";

const Landing = () => {
  const navigate = useNavigate(); // Initialisez useNavigate
  const [showVideo, setShowVideo] = useState(true);
  const [info, setInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Nouveau state pour le chargement de l'auth

  useEffect(() => {
    // --- NOUVELLE LOGIQUE DE REDIRECTION AU DÉBUT DE L'EFFECT ---
    const accessToken = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole'); // Récupère le rôle stocké lors du login

    if (accessToken && userRole) {
        try {
            const decodedToken = jwtDecode(accessToken);
            // Vérifier si le token n'est pas expiré avant de rediriger
            if (decodedToken.exp * 1000 > Date.now()) {
                if (userRole === 'superadmin' || userRole === 'admin') {
                    navigate("/admin/dashboard", { replace: true });
                } else if (userRole === 'client') {
                    navigate("/client/index", { replace: true });
                } else if (userRole === 'utilisateur') {
                    navigate("/user/dashboard", { replace: true });
                }
                setIsCheckingAuth(false); // La vérification est terminée
                return; // Stoppe l'exécution du reste de l'useEffect
            } else {
                // Le token est expiré, le supprimer et continuer l'affichage normal
                console.warn("Access Token expiré à la Landing page.");
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userRole');
            }
        } catch (error) {
            console.error("Token invalide lors de la vérification à la Landing page:", error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userRole');
        }
    }
    setIsCheckingAuth(false); // La vérification est terminée, si pas de redirection
    // --- FIN NOUVELLE LOGIQUE ---

    const isMobile = window.innerWidth <= 768;
    setShowVideo(!isMobile);

    const fetchInfo = async () => {
      setLoadingInfo(true);
      try {
        const apiBase = process.env.REACT_APP_API_URL || "";
        // Assurez-vous que l'endpoint /admin/info-accueil est bien public et ne nécessite pas d'authentification
        const res = await fetch(`${apiBase}/admin/info-accueil`); 
        setInfo(res.ok ? await res.json() : {});
      } catch (err) {
        console.warn("Impossible de charger les informations de l'accueil :", err);
        setInfo({});
      } finally {
        setLoadingInfo(false);
      }
    };

    fetchInfo();
  }, [navigate]); // navigate est une dépendance stable, pas de risque de bouclage

  const assetUrl = (relativePath) => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;
    const apiBaseUrl = process.env.REACT_APP_API_URL || "";
    // Supprime '/api' de l'URL de base pour obtenir la racine du serveur
    const serverBaseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl.slice(0, -4) : apiBaseUrl;
    const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${serverBaseUrl}${cleanPath}`;
  };

  const logoSrc = !loadingInfo && info?.logo_path ? getMediaUrl(info.logo_path) : logoFallback;
  const posterSrc = !loadingInfo && info?.hero_image_path ? getMediaUrl(info.hero_image_path) : posterFallback;
  const videoSrc = !loadingInfo && info?.hero_video_path ? getMediaUrl(info.hero_video_path) : (process.env.PUBLIC_URL + "/videos/landing-hero.mp4");

  // Affichez un spinner si l'authentification est en cours de vérification OU si les infos de la page chargent
  if (isCheckingAuth || loadingInfo) {
    return (
      <div className="landing-page d-flex justify-content-center align-items-center">
        <Spinner color="light" />
      </div>
    );
  }

  // Si on arrive ici, cela signifie qu'il n'y a pas de token valide ou que l'utilisateur n'est pas connecté,
  // donc on affiche la Landing Page
  return (
    <div className="landing-page">
      {showVideo && (
        <video
          key={videoSrc}
          className="landing-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={posterSrc}
          onError={(e) => console.error('Erreur de chargement de la vidéo:', e.target.error)}
        >
          <source src={videoSrc} type="video/mp4" />
          Votre navigateur ne supporte pas la vidéo de fond.
        </video>
      )}

      <div className="landing-video-overlay" aria-hidden="true" />
      <div className="landing-bg gradient-bg" aria-hidden="true" />

      <div className="landing-content-wrapper">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg="8" md="10">
              <div className="landing-card">
                <div className="logo-wrap mb-4">
                  <img
                      key={logoSrc}
                      src={logoSrc}
                      alt="PubCash logo"
                      className="landing-logo"
                  />
                </div>

                <h1 className="landing-title">{info?.title || "PubCash — La pub qui rapporte"}</h1>
                <p className="landing-subtitle">
                  {info?.subtitle || "Promoteurs : publiez vos vidéos. Utilisateurs : likez, partagez et gagnez."}
                </p>

                <div className="landing-ctas mt-4">
                  <Link to="/auth/login">
                    <Button size="lg" className="mr-3 btn-cta-primary">Se connecter</Button>
                  </Link>
                  <Link to="/auth/register">
                    <Button outline size="lg" className="btn-cta-outline">S'inscrire</Button>
                  </Link>
                </div>

                <div className="landing-info mt-4 text-muted small">
                  <span>Promoteur ? Créez des campagnes.</span> &nbsp;•&nbsp;
                  <span>Annonceur ? Contactez-nous pour plus d'infos.</span>
                </div>
              </div>

              <div className="promo-strip mt-5">
                <div className="promo-text">Ex : Campagne Diamant — 120k vues en 7 jours</div>
                <div className="promo-badge">Découvrir</div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <footer className="landing-footer text-center">
        <small>© {new Date().getFullYear()} PubCash — Tous droits réservés</small>
      </footer>
    </div>
  );
};

export default Landing;