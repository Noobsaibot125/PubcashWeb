import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  Container,
  Row,
  Col
} from "reactstrap";
import api from "../../services/api";

const Abonnement = () => {
  const [plans, setPlans] = useState({});
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchStatus();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get("/subscriptions/plans");
      setPlans(res.data);
    } catch (e) {
      console.error(e);
      // MOCK DATA (A SUPPRIMER EN PROD)
      setPlans({
        super_promoteur: { 
          name: "Super Promoteur", 
          price: 1000, 
          features: ["Discussions avec les abonnés", "Discussions avec les abonnés", "Discussions avec les abonnés"] 
        },
        promoteur_ultra: { 
          name: "Ultra Promoteur", 
          price: 1500, 
          features: ["Discussions avec les abonnés", "Discussions avec les abonnés", "Discussions avec les abonnés"] 
        }
      });
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await api.get("/subscriptions/status");
      setCurrentSubscription(res.data);
    } catch (e) {
      console.error(e);
      // MOCK DATA (A SUPPRIMER EN PROD)
      setCurrentSubscription({ hasSubscription: true, plan: { name: "Super Promoteur" }, dateFin: "2026-03-05" });
    }
  };

  const handleSubscribe = async (planType) => {
    if (!window.confirm(`Confirmer l'abonnement ?`)) return;

    setLoading(true);
    try {
      const res = await api.post("/subscriptions/subscribe", { planType });
      alert(res.data.message);
      fetchStatus();
    } catch (e) {
      alert("Erreur lors de la souscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#eef2f5", minHeight: "100vh", paddingBottom: "50px" }}>
      <Container fluid className="pt-4 px-4">
        
        {/* --- 1. EN-TÊTE SÉPARÉ (Titre Vert) --- */}
        <div className="d-flex justify-content-between align-items-center mb-5">
          <h2 style={{ 
            color: "#006837", 
            fontWeight: "900", 
            textTransform: "uppercase", 
            margin: 0,
            letterSpacing: "0.5px"
          }}>
            Abonnement Premium
          </h2>
          {/* Section Profil / Notif (Simulation) */}
          <div className="d-flex align-items-center">
             <i className="fa fa-bell text-warning mr-3" style={{fontSize: '1.5rem', cursor: 'pointer'}}></i>
             {/* Avatar ou Nom ici si nécessaire */}
          </div>
        </div>

        {/* --- 2. HERO BLOCK ORANGE (Indépendant) --- */}
        <div 
          style={{
            background: "linear-gradient(135deg, #ff9f00 0%, #ff6a00 100%)", // Dégradé Orange
            borderRadius: "20px",
            padding: "40px 20px", // Padding réduit pour être moins "gros"
            color: "#ffffff",
            textAlign: "center",
            marginBottom: "50px", 
            boxShadow: "0 10px 25px rgba(255, 106, 0, 0.2)"
          }}
        >
          <h2 className="font-weight-bold mb-3" style={{ color: "#fff" }}>
            Passez au niveau supérieur
          </h2>
          <p style={{ maxWidth: "800px", margin: "0 auto 30px", fontSize: "1.05rem", opacity: 0.95, lineHeight: "1.6" }}>
            Débloquez la messagerie, boostez vos promotions et maximisez vos gains sur
            PubCash. Choisissez le plan qui correspond à vos ambitions.
          </p>

          {/* Carte Blanche Interne (Abonnement Actif) */}
          {currentSubscription?.hasSubscription && (
            <div 
              className="bg-white shadow"
              style={{
                maxWidth: "450px",
                margin: "0 auto",
                borderRadius: "20px",
                padding: "25px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {/* Cercle Vert avec Coche */}
              <div style={{
                width: "55px",
                height: "55px",
                background: "linear-gradient(135deg, #2dce89 0%, #2dcecc 100%)", // Dégradé Vert
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "15px",
                boxShadow: "0 4px 10px rgba(45, 206, 137, 0.3)"
              }}>
                <span style={{ color: "white", fontSize: "28px", fontWeight: "bold" }}>✓</span>
              </div>
              
              <h5 style={{ color: "#00c851", fontWeight: "bold", margin: "5px 0" }}>
                Abonnement Actif : {currentSubscription.plan?.name}
              </h5>
              <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                Expire le : {new Date(currentSubscription.dateFin).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* --- 3. CARTES DE PRIX (PRICING) --- */}
        <Row className="justify-content-center">
          {Object.entries(plans).map(([key, plan]) => {
            const isUltra = key.includes("ultra") || plan.name.toLowerCase().includes("ultra");
            
            // DÉGRADÉS POUR LES CARTES
            const gradientBlue = "linear-gradient(135deg, #2b589f 0%, #5a8dee 100%)";
            const gradientRed = "linear-gradient(135deg, #e71212ff 0%, #ff4c4cff 100%)";
            
            const currentGradient = isUltra ? gradientRed : gradientBlue;
            const themeColor = isUltra ? "#ff4c4c" : "#5a8dee";

            const isCurrentPlan = currentSubscription?.plan?.name === plan.name;

            return (
              <Col md="6" lg="4" key={key} className="mb-4">
                <Card 
                  className="border-0 shadow"
                  style={{
                    borderRadius: "20px",
                    overflow: "hidden",
                    height: "100%",
                    transition: "transform 0.2s",
                  }}
                >
                  {/* EN-TÊTE AVEC DÉGRADÉ */}
                  <div style={{
                    background: currentGradient,
                    color: "white",
                    padding: "20px",
                    textAlign: "center",
                    fontWeight: "800",
                    fontSize: "1.2rem",
                    textTransform: "uppercase",
                    letterSpacing: "1px"
                  }}>
                    {plan.name}
                  </div>

                  <CardBody className="text-center p-4 d-flex flex-column">
                    
                    {/* PRIX SOULIGNÉ */}
                    <div className="mb-4 mt-2">
                      <h1 style={{ 
                        fontWeight: "bold", 
                        display: "inline-block", 
                        borderBottom: "3px solid #1f2937", 
                        paddingBottom: "5px",
                        fontSize: "2.5rem",
                        color: "#1f2937"
                      }}>
                        {new Intl.NumberFormat("fr-FR").format(plan.price)} <span style={{fontSize: "1.2rem"}}>FCFA</span>
                      </h1>
                      <div className="text-muted font-weight-bold" style={{ fontSize: "1rem" }}>/Mois</div>
                    </div>

                    {/* LISTE DES AVANTAGES */}
                    <div className="flex-grow-1 px-2">
                      <ul className="list-unstyled text-left">
                        {plan.features.map((f, i) => (
                          <li key={i} className="d-flex align-items-center mb-3">
                            <div style={{
                              minWidth: "28px",
                              height: "28px",
                              background: currentGradient, // Puce colorée dégradée
                              borderRadius: "50%",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: "12px",
                              fontWeight: "bold",
                              fontSize: "14px"
                            }}>
                              ✓
                            </div>
                            <span style={{ fontSize: "1rem", color: "#525f7f" }}>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* BOUTON D'ACTION */}
                    <div className="mt-4">
                      {isCurrentPlan ? (
                         <Button
                         block
                         style={{
                           backgroundColor: "transparent",
                           color: "#5a8dee",
                           border: "2px solid #5a8dee",
                           borderRadius: "30px",
                           fontWeight: "bold",
                           padding: "12px",
                           fontSize: "1rem"
                         }}
                         disabled
                       >
                         Déjà abonné
                       </Button>
                      ) : (
                        <Button
                          block
                          onClick={() => handleSubscribe(key)}
                          disabled={loading}
                          style={{
                            background: currentGradient, // Bouton avec dégradé
                            border: "none",
                            color: "white",
                            borderRadius: "30px",
                            fontWeight: "bold",
                            padding: "12px",
                            fontSize: "1rem",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.15)"
                          }}
                        >
                          S'abonner
                        </Button>
                      )}
                    </div>

                  </CardBody>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </div>
  );
};

export default Abonnement;