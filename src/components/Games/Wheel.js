import React, { useState } from 'react';
import { Button } from 'reactstrap';
import api from 'services/api';
import './Wheel.css';

const Wheel = ({ onFinish }) => {
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState(null);
    const [rotation, setRotation] = useState(0);
    const [showResultModal, setShowResultModal] = useState(false);

    const spin = async () => {
        if (spinning) return;
        setSpinning(true);
        setResult(null);
        setShowResultModal(false);

        try {
            const res = await api.post('/games/wheel');
            const { points_gagnes, message } = res.data;

            // ... (logique de rotation inchangée) ...
            let targetAngle = 0;
            if (points_gagnes === 0) targetAngle = 315;
            else if (points_gagnes === 1) targetAngle = 225;
            else if (points_gagnes === 2) targetAngle = 135;
            else if (points_gagnes === 5) targetAngle = 45;

            const randomOffset = Math.floor(Math.random() * 40) - 20;
            targetAngle += randomOffset;

            const currentRotationMod = rotation % 360;
            const extraSpins = 1800;
            const newRotation = rotation + extraSpins + (360 - currentRotationMod) + targetAngle;

            setRotation(newRotation);

            setTimeout(() => {
                setResult({ points: points_gagnes, message });
                setShowResultModal(true);
                setSpinning(false);
                if (onFinish) onFinish();
            }, 3000);

        } catch (err) {
            console.error('Error spinning wheel:', err);
            setSpinning(false);
            setResult({ error: err.response?.data?.message || "Erreur lors du tour de roue." });
            setShowResultModal(true);
        }
    };

    return (
        <div className="wheel-container">
            <div className="wheel-pointer">▼</div>
            <div className="wheel" style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)' }}>
                <div className="wheel-segment segment-0"><span className="segment-text">Perdu</span></div>
                <div className="wheel-segment segment-1"><span className="segment-text">1 Pt</span></div>
                <div className="wheel-segment segment-2"><span className="segment-text">2 Pts</span></div>
                <div className="wheel-segment segment-5"><span className="segment-text">5 Pts</span></div>
            </div>

            <Button color="warning" size="lg" onClick={spin} disabled={spinning} className="mt-5 shadow btn-block">
                {spinning ? 'La roue tourne...' : 'TOURNER LA ROUE'}
            </Button>

            {/* Modal de Résultat */}
            {result && (
                <div className={`modal fade ${showResultModal ? 'show' : ''}`} style={{ display: showResultModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content bg-white">
                            <div className="modal-header border-0">
                                <h5 className="modal-title">{result.error ? 'Oups !' : (result.points > 0 ? '🎉 Félicitations !' : 'Dommage !')}</h5>
                                <button type="button" className="close" onClick={() => setShowResultModal(false)}>
                                    <span>×</span>
                                </button>
                            </div>
                            <div className="modal-body text-center py-4">
                                {result.error ? (
                                    <div className="text-danger">
                                        <i className="fas fa-exclamation-triangle fa-3x mb-3"></i>
                                        <p>{result.error}</p>
                                    </div>
                                ) : (
                                    <div>
                                        <div className={`icon icon-shape rounded-circle mb-3 ${result.points > 0 ? 'bg-success text-white' : 'bg-secondary text-muted'}`} style={{ width: '80px', height: '80px', fontSize: '2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className={result.points > 0 ? "fas fa-gift" : "fas fa-frown"}></i>
                                        </div>
                                        <h3 className={result.points > 0 ? "text-success" : "text-muted"}>{result.message}</h3>
                                        {result.points > 0 && <p className="lead">Vous avez gagné {result.points} points !</p>}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer border-0 justify-content-center">
                                <Button color="primary" onClick={() => setShowResultModal(false)}>Super !</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wheel;
