import React, { useState, useEffect, useRef } from 'react';
import { Button, Alert } from 'reactstrap';
import api from 'services/api';
import './PuzzleGame.css';

const PuzzleGame = ({ game, onFinish }) => {
    const [started, setStarted] = useState(false);
    const [tiles, setTiles] = useState([]);
    const [timeLeft, setTimeLeft] = useState(game.duree_limite);
    const [gameOver, setGameOver] = useState(false);
    const [message, setMessage] = useState('');
    const timerRef = useRef(null);
    const [draggedItem, setDraggedItem] = useState(null);

    // Initialisation des tuiles (0-8)
    useEffect(() => {
        if (started) {
            const initialTiles = [...Array(9).keys()];
            // Mélange simple mais solvable (pas toujours, mais pour un simple swap ça va)
            // Pour un vrai taquin c'est complexe, mais ici c'est du swap libre, donc toujours solvable.
            const shuffled = [...initialTiles].sort(() => Math.random() - 0.5);
            setTiles(shuffled);

            // Démarrer le Timer
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleGameOver(false, "Temps écoulé !");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [started]);

    const startGame = async () => {
        try {
            await api.post('/games/puzzle/start', { gameId: game.id });
            setStarted(true);
        } catch (err) {
            console.error("Erreur start puzzle:", err);
            setMessage("Impossible de démarrer le jeu.");
        }
    };

    const onDragStart = (e, index) => {
        setDraggedItem(index);
    };

    const onDragOver = (e) => {
        e.preventDefault(); // Nécessaire pour permettre le drop
    };

    const onDrop = (e, dropIndex) => {
        if (gameOver) return;
        const newTiles = [...tiles];
        const draggedTile = newTiles[draggedItem];

        // Échange des tuiles
        newTiles[draggedItem] = newTiles[dropIndex];
        newTiles[dropIndex] = draggedTile;

        setTiles(newTiles);
        checkWin(newTiles);
    };

    // Support tactile basique (click to swap)
    const [selectedTileIndex, setSelectedTileIndex] = useState(null);
    const handleTileClick = (index) => {
        if (gameOver) return;
        if (selectedTileIndex === null) {
            setSelectedTileIndex(index);
        } else {
            // Swap
            const newTiles = [...tiles];
            const temp = newTiles[selectedTileIndex];
            newTiles[selectedTileIndex] = newTiles[index];
            newTiles[index] = temp;
            setTiles(newTiles);
            setSelectedTileIndex(null);
            checkWin(newTiles);
        }
    };

    const checkWin = async (currentTiles) => {
        // Vérifie si chaque tuile est à sa place (0 à 0, 1 à 1...)
        const isSolved = currentTiles.every((val, index) => val === index);
        if (isSolved) {
            clearInterval(timerRef.current);
            await submitGame();
        }
    };

 const submitGame = async () => {
    try {
        const res = await api.post('/games/puzzle/submit', { gameId: game.id });
        // CORRECTION : Utiliser res.data.points (comme défini dans GameController.js)
        handleGameOver(true, `Bravo ! Vous avez gagné ${res.data.points} points.`);
    } catch (err) {
        handleGameOver(false, err.response?.data?.message || "Erreur lors de la validation.");
    }
};

    const handleGameOver = (win, msg) => {
        setGameOver(true);
        setMessage(msg);
        setTimeout(() => {
            if (onFinish) onFinish();
        }, 4000);
    };

    if (!started) {
        return (
            <div className="text-center p-4 bg-white rounded shadow-sm">
                <h3 className="mb-3">{game.titre}</h3>
                <p className="text-muted">Reconstituez l'image en moins de {game.duree_limite} secondes.</p>
                <div className="mb-4">
                    <img src={game.image_url} alt="Aperçu" className="img-fluid rounded shadow-sm" style={{ maxHeight: '200px' }} />
                </div>
                <Button color="primary" size="lg" onClick={startGame} className="px-5">Commencer</Button>
                {message && <Alert color="danger" className="mt-3">{message}</Alert>}
            </div>
        );
    }

    return (
        <div className="puzzle-container text-center">
            <div className="d-flex justify-content-between align-items-center mb-3 mx-auto" style={{ maxWidth: '300px' }}>
                <span className={`h5 badge ${timeLeft < 10 ? 'badge-danger' : 'badge-info'}`}>
                    Temps: {timeLeft}s
                </span>
                <Button size="sm" color="secondary" onClick={() => handleGameOver(false, "Abandon")}>Abandonner</Button>
            </div>

            <div className="puzzle-grid mx-auto shadow-lg" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                width: '300px',
                height: '300px',
                border: '2px solid #333',
                backgroundColor: '#eee',
                touchAction: 'none' // Empêche le scroll sur mobile pendant le jeu
            }}>
                {tiles.map((tileNumber, index) => (
                    <div
                        key={index}
                        draggable={!gameOver}
                        onDragStart={(e) => onDragStart(e, index)}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, index)}
                        onClick={() => handleTileClick(index)}
                        className={`puzzle-tile ${selectedTileIndex === index ? 'selected' : ''}`}
                        style={{
                            width: '100%',
                            height: '100%',
                            backgroundImage: `url(${game.image_url})`,
                            backgroundSize: '300px 300px',
                            backgroundPosition: `${(tileNumber % 3) * -100}px ${(Math.floor(tileNumber / 3)) * -100}px`,
                            cursor: gameOver ? 'default' : 'pointer',
                            border: '1px solid rgba(255,255,255,0.5)',
                            transition: 'transform 0.2s',
                            opacity: selectedTileIndex === index ? 0.8 : 1
                        }}
                    />
                ))}
            </div>
            <p className="text-muted mt-2 small">Glissez-déposez ou cliquez sur deux cases pour les échanger.</p>

            {message && (
                <Alert color={gameOver && message.includes('Bravo') ? 'success' : 'danger'} className="mt-3 fade-in">
                    {message}
                </Alert>
            )}
        </div>
    );
};

export default PuzzleGame;
