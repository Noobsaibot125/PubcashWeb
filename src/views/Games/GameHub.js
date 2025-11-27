import React, { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, CardBody, CardTitle, CardText, Button,
    Badge, Modal, ModalHeader, ModalBody
} from 'reactstrap';
import { motion, AnimatePresence } from 'framer-motion';
import UserNavbar from 'components/Navbars/UserNavbar.js';
import Wheel from 'components/Games/Wheel';
import PuzzleGame from 'components/Games/PuzzleGame';
import api from 'services/api';

// --- STYLES & VARIANTS ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 100 }
    }
};

const cardHover = {
    rest: { scale: 1, rotateX: 0, rotateY: 0, boxShadow: "0px 10px 30px rgba(0,0,0,0.1)" },
    hover: {
        scale: 1.02,
        rotateX: 5,
        rotateY: 5,
        boxShadow: "0px 20px 40px rgba(0,0,0,0.2)",
        transition: { type: "spring", stiffness: 300, damping: 20 }
    }
};

const GameHub = () => {
    const [points, setPoints] = useState(0);
    const [games, setGames] = useState([]);
    const [activeGame, setActiveGame] = useState(null); // 'wheel', 'puzzle', etc.
    const [selectedPuzzle, setSelectedPuzzle] = useState(null);

    useEffect(() => {
        fetchPoints();
        fetchGames();
    }, []);

    const fetchPoints = async () => {
        try {
            const res = await api.get('/games/points');
            setPoints(res.data.points);
        } catch (err) {
            console.error("Erreur points:", err);
        }
    };

    const fetchGames = async () => {
        try {
            const res = await api.get('/games/list?type=puzzle');
            setGames(res.data);
        } catch (err) {
            console.error("Erreur jeux:", err);
        }
    };

    const handleGameFinish = () => {
        fetchPoints();
        fetchGames();
    };

    return (
        <>
            <UserNavbar points={points} />

            {/* --- HEADER ANIMÉ --- */}
            <div className="header pb-8 pt-5 pt-md-8" style={{
                background: 'linear-gradient(135deg, #fb6340 0%, #fbb140 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Effet de grain/particules (simulé par CSS) */}
                <div className="absolute-bg-grain" />

                <Container fluid>
                    <div className="header-body">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <Row className="justify-content-center text-center">
                                <Col lg="8">
                                    <h1 className="display-2 text-white font-weight-bold mb-2" style={{ fontFamily: '"Orbitron", sans-serif', letterSpacing: '2px' }}>
                                        ESPACE JEUX & BONUS <span role="img" aria-label="game">🎮</span>
                                    </h1>
                                    <p className="text-light lead mt-3" style={{ opacity: 0.8 }}>
                                        Jouez, cumulez des points et convertissez-les en cash réel.
                                    </p>
                                </Col>
                            </Row>
                        </motion.div>
                    </div>
                </Container>
            </div >

            <Container className="mt--7" fluid>
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <Row>
                        {/* --- ZONE GAUCHE : ROUE DE LA FORTUNE --- */}
                        <Col lg="4" md="12" className="mb-4">
                            <motion.div variants={itemVariants} className="h-100">
                                <motion.div
                                    className="card-3d-wrapper h-100"
                                    initial="rest"
                                    whileHover="hover"
                                    animate="rest"
                                >
                                    <Card className="card-stats border-0 h-100 bg-gradient-default shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                                        <CardBody className="d-flex flex-column justify-content-center align-items-center p-5 text-center relative">
                                            {/* Background Glow */}
                                            <div style={{
                                                position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                                                background: 'radial-gradient(circle, rgba(255,165,0,0.1) 0%, rgba(0,0,0,0) 70%)',
                                                zIndex: 0
                                            }} />

                                            <motion.div
                                                className="icon icon-shape bg-gradient-orange text-white rounded-circle shadow mb-4"
                                                style={{ width: '100px', height: '100px', fontSize: '3rem', zIndex: 1 }}
                                                variants={{
                                                    hover: { rotate: 180, scale: 1.1 }
                                                }}
                                            >
                                                <i className="fas fa-dharmachakra" />
                                            </motion.div>

                                            <CardTitle tag="h2" className="text-white text-uppercase mb-2" style={{ zIndex: 1, fontWeight: 800 }}>
                                                Roue de la Fortune
                                            </CardTitle>

                                            <p className="text-white-50 mb-5" style={{ zIndex: 1 }}>
                                                Tournez chaque jour pour gagner jusqu'à <span className="text-warning font-weight-bold">5 points</span> !
                                            </p>

                                            <motion.button
                                                className="btn btn-warning btn-lg shadow-lg"
                                                style={{ zIndex: 1, borderRadius: '50px', padding: '15px 40px', fontWeight: 'bold', letterSpacing: '1px' }}
                                                whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(255, 165, 0, 0.6)" }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setActiveGame('wheel')}
                                            >
                                                JOUER MAINTENANT
                                            </motion.button>
                                        </CardBody>
                                    </Card>
                                </motion.div>
                            </motion.div>
                        </Col>

                        {/* --- ZONE DROITE : GRILLE PUZZLES --- */}
                        <Col lg="8" md="12">
                            <div className="d-flex align-items-center mb-4">
                                <h3 className="text-white mb-0 mr-3">Puzzles Disponibles</h3>
                                <Badge color="info" pill className="px-3 py-2">Nouveaux défis</Badge>
                            </div>

                            <Row>
                                {games.length > 0 ? (
                                    games.map((game, index) => {
                                        const isDisabled = game.deja_joue;
                                        return (
                                            <Col lg="4" md="6" sm="6" key={game.id} className="mb-4">
                                                <motion.div variants={itemVariants}>
                                                    <motion.div
                                                        whileHover={!isDisabled ? { y: -10, transition: { duration: 0.2 } } : {}}
                                                        className="h-100"
                                                    >
                                                        <Card
                                                            className={`border-0 shadow h-100 ${isDisabled ? 'bg-secondary' : 'bg-white'}`}
                                                            style={{
                                                                borderRadius: '15px',
                                                                overflow: 'hidden',
                                                                opacity: isDisabled ? 0.7 : 1,
                                                                filter: isDisabled ? 'grayscale(90%)' : 'none'
                                                            }}
                                                        >
                                                            <div style={{
                                                                height: '160px',
                                                                backgroundImage: `url(${game.image_url || 'https://via.placeholder.com/300?text=Puzzle'})`,
                                                                backgroundSize: 'cover',
                                                                backgroundPosition: 'center',
                                                                position: 'relative'
                                                            }}>
                                                                {isDisabled && (
                                                                    <div className="d-flex justify-content-center align-items-center h-100" style={{ background: 'rgba(0,0,0,0.5)' }}>
                                                                        <Badge color="success" className="p-2">
                                                                            <i className="fas fa-check mr-1"></i> Complété
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <CardBody className="d-flex flex-column">
                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                    <CardTitle tag="h5" className="font-weight-bold mb-0 text-truncate" style={{ maxWidth: '70%' }}>
                                                                        {game.titre}
                                                                    </CardTitle>
                                                                    <Badge color={isDisabled ? "secondary" : "primary"} pill>
                                                                        {game.points_recompense} pts
                                                                    </Badge>
                                                                </div>

                                                                <CardText className="small text-muted mb-4 flex-grow-1">
                                                                    {isDisabled
                                                                        ? "Revenez demain !"
                                                                        : `⏱️ ${game.duree_limite}s pour résoudre`
                                                                    }
                                                                </CardText>

                                                                <Button
                                                                    color={isDisabled ? "secondary" : "outline-primary"}
                                                                    block
                                                                    size="sm"
                                                                    disabled={isDisabled}
                                                                    onClick={() => {
                                                                        if (!isDisabled) {
                                                                            setSelectedPuzzle(game);
                                                                            setActiveGame('puzzle');
                                                                        }
                                                                    }}
                                                                    style={{ borderRadius: '20px' }}
                                                                >
                                                                    {isDisabled ? 'Terminé' : 'Commencer'}
                                                                </Button>
                                                            </CardBody>
                                                        </Card>
                                                    </motion.div>
                                                </motion.div>
                                            </Col>
                                        );
                                    })
                                ) : (
                                    <Col lg="12">
                                        <Card className="bg-transparent border-0 text-center">
                                            <CardBody>
                                                <h4 className="text-white-50">Aucun puzzle disponible pour le moment.</h4>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                )}
                            </Row>
                        </Col>
                    </Row>
                </motion.div>
            </Container>

            {/* --- MODALS GLASSMORPHISM --- */}
            <style>{`
                .modal-glass .modal-content {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(15px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                    border-radius: 20px;
                }
                .absolute-bg-grain {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
                    pointer-events: none;
                    z-index: 0;
                }
            `}</style>

            {/* Modal Roue */}
            <Modal
                isOpen={activeGame === 'wheel'}
                toggle={() => setActiveGame(null)}
                centered
                size="lg"
                className="modal-glass"
            >
                <ModalHeader toggle={() => setActiveGame(null)} className="border-0 pb-0">
                    <span className="font-weight-bold text-uppercase text-warning">🎡 Roue de la Fortune</span>
                </ModalHeader>
                <ModalBody className="p-5 d-flex justify-content-center">
                    <Wheel onFinish={handleGameFinish} />
                </ModalBody>
            </Modal>

            {/* Modal Puzzle */}
            <Modal
                isOpen={activeGame === 'puzzle'}
                toggle={() => setActiveGame(null)}
                centered
                size="lg"
                backdrop="static"
                className="modal-glass"
            >
                <ModalHeader toggle={() => setActiveGame(null)} className="border-0 pb-0">
                    <span className="font-weight-bold text-primary">🧩 {selectedPuzzle?.titre}</span>
                </ModalHeader>
                <ModalBody className="p-0">
                    {selectedPuzzle && (
                        <PuzzleGame
                            game={selectedPuzzle}
                            onFinish={() => {
                                handleGameFinish();
                                // setActiveGame(null); // Optionnel
                            }}
                        />
                    )}
                </ModalBody>
            </Modal>
        </>
    );
};

export default GameHub;
