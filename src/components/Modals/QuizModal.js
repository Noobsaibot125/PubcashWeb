// src/components/QuizModal.js (ou le chemin approprié)

import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Alert, Row, Col, Card, CardBody } from 'reactstrap';
import api from '../../services/api'; 

const QuizModal = ({ isOpen, toggle, quiz, onSuccess }) => {
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [result, setResult] = useState(null); // 'gagne' | 'perdu'
    const [shuffledAnswers, setShuffledAnswers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (quiz && quiz.reponses && isOpen) {
            setResult(null);
            setSelectedAnswer(null);
            
            let answersArray = [];
            try {
                answersArray = typeof quiz.reponses === 'string' ? JSON.parse(quiz.reponses) : quiz.reponses;
            } catch (e) {
                answersArray = [quiz.bonne_reponse, "Autre 1", "Autre 2"]; 
            }
            
            setShuffledAnswers(answersArray.sort(() => Math.random() - 0.5));
        }
    }, [quiz, isOpen]);

    const handleSubmit = async () => {
        if (!selectedAnswer) return;
        setLoading(true);

        try {
            const gameId = quiz.game_id || quiz.id; 

            const res = await api.post('/games/quiz/submit', {
                gameId: gameId,
                reponse: selectedAnswer
            });

            if (res.data.success) {
                setResult('gagne');
                if (onSuccess) onSuccess(res.data.points);
                
                setTimeout(() => {
                    toggle();
                }, 2500);
            } else {
                setResult('perdu');
            }
        } catch (error) {
            console.error("Erreur quiz", error);
            setResult('error');
        } finally {
            setLoading(false);
        }
    };

    if (!quiz) return null;

    // Styles pour les cartes de réponse
    const getCardStyle = (ans) => {
        const isSelected = selectedAnswer === ans;
        return {
            cursor: result ? 'default' : 'pointer',
            transition: 'all 0.3s ease',
            border: isSelected ? '2px solid #fb6340' : '1px solid #e9ecef', // Orange si sélectionné
            backgroundColor: isSelected ? '#fff5f2' : 'white', // Fond légèrement orange si sélectionné
            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
            boxShadow: isSelected ? '0 4px 6px rgba(50,50,93,.11), 0 1px 3px rgba(0,0,0,.08)' : 'none'
        };
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered backdrop="static" size="lg">
            <ModalHeader toggle={toggle} className={result === 'gagne' ? 'bg-success text-white' : ''}>
                {result === 'gagne' ? 'Félicitations !' : 'Quiz Bonus (+5 Points)'}
            </ModalHeader>
            <ModalBody className="p-4">
                {result === 'gagne' ? (
                    <div className="text-center py-4">
                        <div className="icon icon-shape bg-white text-success rounded-circle shadow mb-4">
                            <i className="ni ni-trophy ni-3x"></i>
                        </div>
                        <h3 className="text-success">Bonne réponse !</h3>
                        <p>Vous avez gagné 5 points.</p>
                    </div>
                ) : (
                    <>
                        {/* Question centrée et plus grosse */}
                        <div className="text-center mb-5">
                            <h3 className="font-weight-bold" style={{ color: '#32325d' }}>
                                {quiz.question}
                            </h3>
                        </div>
                        
                        {/* Affichage Horizontal avec Grid system */}
                        <Row className="justify-content-center">
                            {shuffledAnswers.map((ans, index) => (
                                <Col md="4" sm="6" xs="12" key={index} className="mb-3">
                                    <Card 
                                        className="shadow-sm h-100 mb-0" 
                                        style={getCardStyle(ans)}
                                        onClick={() => !result && setSelectedAnswer(ans)}
                                    >
                                        <CardBody className="d-flex align-items-center justify-content-center text-center p-3">
                                            <span style={{ 
                                                fontWeight: selectedAnswer === ans ? 'bold' : 'normal',
                                                color: selectedAnswer === ans ? '#fb6340' : '#525f7f'
                                            }}>
                                                {ans}
                                            </span>
                                        </CardBody>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        {result === 'perdu' && (
                            <Alert color="danger" className="mt-4 text-center shadow-sm">
                                <i className="ni ni-fat-remove mr-2"></i>
                                <strong>Mauvaise réponse !</strong> Ce n'est pas grave, continuez à regarder des vidéos.
                            </Alert>
                        )}
                    </>
                )}
            </ModalBody>
            <ModalFooter className="justify-content-center border-0 pt-0">
                {!result && (
                    <Button 
                        // Utilisation d'une couleur personnalisée ou "warning" pour l'orange
                        style={{ backgroundColor: '#fb6340', borderColor: '#fb6340', color: 'white', padding: '10px 40px' }} 
                        onClick={handleSubmit} 
                        disabled={!selectedAnswer || loading}
                        className="shadow"
                    >
                        {loading ? 'Vérification...' : 'Valider ma réponse'}
                    </Button>
                )}
                <div className="w-100 text-center mt-3">
                    <button 
                        className="btn btn-link text-muted" 
                        onClick={toggle}
                        style={{ fontSize: '0.9rem' }}
                    >
                        {result ? 'Fermer' : 'Ignorer ce quiz'}
                    </button>
                </div>
            </ModalFooter>
        </Modal>
    );
};

export default QuizModal;