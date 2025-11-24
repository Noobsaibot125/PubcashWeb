// src/views/examples/Landing.js
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Button,
  Spinner
} from 'reactstrap';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Float,
  Sphere,
  MeshDistortMaterial,
  Torus,
  Box,
  Environment,
  Stars,
  OrbitControls
} from '@react-three/drei';
import { jwtDecode } from 'jwt-decode';
import { getMediaUrl } from 'utils/mediaUrl';

// CSS Import
import 'assets/css/Landing.css';

// CORRECTION 1 : Renommez votre fichier en 'pub_cash.png' dans le dossier public !
const logoFallback = `${process.env.PUBLIC_URL}/img/brand/pub_cash.png`;

// --- 3D COMPONENTS ---
const AnimatedSphere = () => {
  const sphereRef = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (sphereRef.current) {
      sphereRef.current.rotation.x = t * 0.2;
      sphereRef.current.rotation.y = t * 0.3;
    }
  });
  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <Sphere visible args={[1, 100, 200]} scale={2.2} ref={sphereRef}>
        <MeshDistortMaterial color="#F36C21" attach="material" distort={0.4} speed={2} roughness={0.2} metalness={0.8} />
      </Sphere>
    </Float>
  );
};

const FloatingCoin = ({ position }) => {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime();
      ref.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 2) * 0.1;
    }
  });
  return (
    <group position={position} ref={ref}>
      <Torus args={[0.6, 0.2, 16, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.1} />
      </Torus>
      <Box args={[0.8, 0.1, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.1} />
      </Box>
    </group>
  );
};

const FloatingGraph = ({ position }) => {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.2;
    }
  });
  return (
    <group position={position} ref={ref}>
      <Box args={[0.2, 1, 0.2]} position={[-0.4, 0, 0]}><meshStandardMaterial color="#00C853" /></Box>
      <Box args={[0.2, 1.5, 0.2]} position={[0, 0.25, 0]}><meshStandardMaterial color="#00E676" /></Box>
      <Box args={[0.2, 2, 0.2]} position={[0.4, 0.5, 0]}><meshStandardMaterial color="#69F0AE" /></Box>
    </group>
  )
}

const BackgroundScene = () => {
  return (
    <Canvas className="canvas-container" camera={{ position: [0, 0, 5] }}>
      <Suspense fallback={null}>
        <Environment preset="city" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <AnimatedSphere />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Suspense>
    </Canvas>
  );
};

// --- SECTIONS ---
const FeatureSection = ({ title, description, features, align = "left", icon3d, imagePath }) => {
  return (
    <div className={`feature-section ${align === "right" ? "feature-right" : ""}`}>
      <Container>
        <Row className="align-items-center">
          <Col lg="6" className={align === "right" ? "order-lg-2" : ""}>
            <motion.div
              initial={{ opacity: 0, x: align === "left" ? -100 : 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <motion.h2
                className="section-title"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                {title}
              </motion.h2>
              <motion.p
                className="section-desc"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                {description}
              </motion.p>
              <ul className="feature-list">
                {features.map((feat, idx) => (
                  <motion.li
                    key={idx}
                    className="feature-item"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + (idx * 0.1) }}
                    viewport={{ once: true }}
                  >
                    <span className="feature-icon">✓</span> {feat}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </Col>
          <Col lg="6" className={align === "right" ? "order-lg-1" : ""}>
            <motion.div
              initial={{ opacity: 0, x: align === "left" ? 100 : -100, scale: 0.8 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              viewport={{ once: true, amount: 0.3 }}
              className="feature-visual"
            >
              <div className="visual-placeholder">
                {imagePath ? (
                  <img src={getMediaUrl(imagePath)} alt={title} className="img-fluid rounded shadow" />
                ) : (
                  <>
                    {icon3d === 'graph' && (
                      <Canvas>
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[5, 5, 5]} />
                        <FloatingGraph position={[0, 0, 0]} />
                        <OrbitControls enableZoom={false} />
                      </Canvas>
                    )}
                    {icon3d === 'coin' && (
                      <Canvas>
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[5, 5, 5]} />
                        <FloatingCoin position={[0, 0, 0]} />
                        <OrbitControls enableZoom={false} />
                      </Canvas>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </Col>
        </Row>
      </Container>

    </div>
  );
};

// --- MAIN COMPONENT ---
const Landing = () => {
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');

    if (accessToken && userRole) {
      try {
        const decodedToken = jwtDecode(accessToken);
        if (decodedToken.exp * 1000 > Date.now()) {
          const routes = {
            superadmin: "/admin/dashboard",
            admin: "/admin/dashboard",
            client: "/client/index",
            utilisateur: "/user/dashboard"
          };
          if (routes[userRole]) {
            navigate(routes[userRole], { replace: true });
            setIsCheckingAuth(false);
            return;
          }
        } else {
          localStorage.clear();
        }
      } catch (error) {
        localStorage.clear();
      }
    }
    setIsCheckingAuth(false);

    const fetchInfo = async () => {
      setLoadingInfo(true);
      try {
        const apiBase = process.env.REACT_APP_API_URL || "";
        const res = await fetch(`${apiBase}/admin/info-accueil`);
        if (res.ok) {
          const data = await res.json();
          setInfo(data);
        }
      } catch (err) {
        console.warn("Info fetch error:", err);
      } finally {
        setLoadingInfo(false);
      }
    };
    fetchInfo();
  }, [navigate]);

  const getLogoSource = () => {
    if (!loadingInfo && info?.logo_path) {
      return getMediaUrl(info.logo_path);
    }
    return logoFallback;
  };

  if (isCheckingAuth) {
    return (
      <div className="landing-loader">
        <Spinner color="primary" />
      </div>
    );
  }

  return (
    <div className="landing-page-modern" style={{ position: 'relative', isolation: 'isolate' }}> 
      
      {/* CORRECTION 2: Gestion du Loading State pour le fond */}
      <div className="landing-3d-bg" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        backgroundColor: '#000' // Fond noir pour éviter flash blanc
      }}>
        {loadingInfo ? (
            // Affiche rien (fond noir) tant qu'on ne sait pas si on a une vidéo
            null 
        ) : info?.hero_video_path ? (
          <video
            className="landing-video-bg"
            autoPlay
            loop
            muted
            playsInline
            // Affiche l'image preview si dispo en attendant que la vidéo démarre
            poster={info?.image_preview_url || ""}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          >
            <source src={getMediaUrl(info.hero_video_path)} type="video/mp4" />
          </video>
        ) : (
          <BackgroundScene />
        )}
      </div>

      <div className="landing-overlay" style={{
          position: 'fixed',
          top: 0, 
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
      }} />

      <div className="landing-scroll-container" style={{ 
          position: 'relative', 
          zIndex: 10 
      }}>
        {/* HERO SECTION */}
        <section className="landing-hero">
          <Container className="landing-container">
            <Row className="align-items-center justify-content-center text-center" style={{ minHeight: '100vh' }}>
              <Col lg="10" md="12" className="z-index-2">

                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="mb-4"
                >
                  {/* CORRECTION 3 : Anti-boucle infinie sur l'image */}
                  <img
                    src={getLogoSource()}
                    alt="PubCash Logo"
                    className="landing-logo-modern"
                    onError={(e) => { 
                        if (e.target.src.includes(logoFallback)) {
                             // Si ça échoue encore, on arrête
                             e.target.style.display = 'none';
                        } else {
                             // Premier échec, on tente le fallback
                             e.target.src = logoFallback; 
                        }
                    }}
                  />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="landing-title-modern"
                >
                  {info?.title || "PubCash — La pub qui rapporte"}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="landing-subtitle-modern"
                >
                  {info?.subtitle || "La plateforme Watch-to-Earn qui connecte annonceurs et utilisateurs."}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="landing-ctas-modern mt-5"
                >
                  <Link to="/auth/login-client">
                    <Button className="btn-modern-primary btn-lg mx-2">
                      Se connecter
                    </Button>
                  </Link>
                  <Link to="/auth/register">
                    <Button className="btn-modern-outline btn-lg mx-2">
                      S'inscrire
                    </Button>
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5, duration: 1, repeat: Infinity, repeatType: "reverse" }}
                  className="scroll-indicator"
                >
                  <span className="ni ni-bold-down"></span>
                </motion.div>

              </Col>
            </Row>
          </Container>
        </section>

        {/* Le reste des sections reste identique... */}
        <section className="landing-section ecosystem-section">
          <Container>
            <Row className="justify-content-center text-center">
              <Col lg="8">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <h2 className="section-title-center">{info?.ecosystem_title || "L'Écosystème PubCash"}</h2>
                  <p className="section-desc-center">
                    {info?.ecosystem_description || "Une plateforme innovante où tout le monde est gagnant. Les annonceurs obtiennent de la visibilité, et les utilisateurs sont récompensés pour leur attention."}
                  </p>
                </motion.div>
              </Col>
            </Row>
          </Container>
        </section>

        <FeatureSection
          title={info?.advertisers_title || "Pour les Annonceurs"}
          description={info?.advertisers_description || "Maximisez votre impact avec des campagnes ciblées et des statistiques détaillées."}
          align="left"
          icon3d="graph"
          imagePath={info?.advertisers_image_path}
          features={info?.advertisers_features || [
            "Créez des campagnes vidéo et bannières en quelques clics.",
            "Suivez vos performances en temps réel (Vues, Likes, Partages).",
            "Accédez à des rapports détaillés pour optimiser votre ROI.",
            "Rechargez votre compte simplement et gérez votre budget."
          ]}
        />

        <FeatureSection
          title={info?.users_title || "Pour les Utilisateurs"}
          description={info?.users_description || "Transformez votre temps libre en gains réels. Regardez, interagissez, gagnez."}
          align="right"
          icon3d="coin"
          imagePath={info?.users_image_path}
          features={info?.users_features || [
            "Gagnez de l'argent en regardant des publicités.",
            "Augmentez vos gains en likant et partageant.",
            "Suivez votre solde et l'historique de vos gains.",
            "Retraits rapides vers Mobile Money via CinetPay."
          ]}
        />

        <section className="landing-footer-section">
          <Container>
            <Row className="justify-content-center">
              <Col lg="8" className="text-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 1 }}
                  className="testimonial-box mb-5"
                >
                  <p className="testimonial-text">
                    "{info?.testimonial_text || "J'ai simplement donné une consigne indiquant qu'il devait utiliser des modèles 3D, des animations, etc. L'interface utilisateur et l'expérience utilisateur sont parfaites et entièrement réactives."}"
                  </p>
                  <div className="testimonial-author">- {info?.testimonial_author || "Client Satisfait"}</div>
                </motion.div>

                <div className="final-cta mb-5">
                  <h3>Prêt à commencer ?</h3>
                  <div className="mt-4">
                    <Link to="/auth/register">
                      <Button className="btn-modern-primary btn-lg">Créer un compte maintenant</Button>
                    </Link>
                  </div>
                </div>

                <footer className="simple-footer">
                  <small>© {new Date().getFullYear()} PubCash — Tous droits réservés</small>
                </footer>
              </Col>
            </Row>
          </Container>
        </section>
      </div>
    </div>
  );
};

export default Landing;