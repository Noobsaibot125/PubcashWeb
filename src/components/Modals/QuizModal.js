import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Alert } from 'reactstrap';
import api from '../../services/api'; // Assurez-vous que le chemin est bon

const QuizModal = ({ isOpen, toggle, quiz, onSuccess }) => {
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [result, setResult] = useState(null); // 'gagne' | 'perdu'
    const [shuffledAnswers, setShuffledAnswers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (quiz && quiz.reponses && isOpen) {
            // Réinitialiser
            setResult(null);
            setSelectedAnswer(null);
            
            // Parser les réponses (si c'est du JSON string) ou utiliser tel quel
            let answersArray = [];
            try {
                answersArray = typeof quiz.reponses === 'string' ? JSON.parse(quiz.reponses) : quiz.reponses;
            } catch (e) {
                // Fallback si ce n'est pas un JSON valide, on prend juste la bonne réponse pour afficher qqchose
                answersArray = [quiz.bonne_reponse, "Autre 1", "Autre 2"]; 
            }
            
            // Mélanger les réponses
            setShuffledAnswers(answersArray.sort(() => Math.random() - 0.5));
        }
    }, [quiz, isOpen]);

    const handleSubmit = async () => {
        if (!selectedAnswer) return;
        setLoading(true);

        try {
            // Ici on suppose que le 'gameId' est soit quiz.game_id soit quiz.id selon votre structure SQL jointe
            const gameId = quiz.game_id || quiz.id; 

            const res = await api.post('/games/quiz/submit', {
                gameId: gameId,
                reponse: selectedAnswer
            });

            if (res.data.success) {
                setResult('gagne');
                if (onSuccess) onSuccess(res.data.points); // Mettre à jour les points dans UserView
                
                // Fermeture auto après 2 secondes si gagné
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

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered backdrop="static">
            <ModalHeader toggle={toggle} className={result === 'gagne' ? 'bg-success text-white' : ''}>
                {result === 'gagne' ? 'Félicitations !' : 'Quiz Bonus (+5 Points)'}
            </ModalHeader>
            <ModalBody>
                {result === 'gagne' ? (
                    <div className="text-center py-4">
                        <i className="ni ni-trophy ni-3x text-white mb-3"></i>
                        <h3>Bonne réponse !</h3>
                        <p>Vous avez gagné 5 points.</p>
                    </div>
                ) : (
                    <>
                        <p className="lead font-weight-bold text-center mb-4">{quiz.question}</p>
                        
                        <div className="d-flex flex-column gap-2">
                            {shuffledAnswers.map((ans, index) => (
                                <Button
                                    key={index}
                                    color={selectedAnswer === ans ? "primary" : "secondary"}
                                    outline={selectedAnswer !== ans}
                                    className="mb-2 text-left"
                                    onClick={() => !result && setSelectedAnswer(ans)}
                                    disabled={!!result} // Désactiver après réponse
                                >
                                    {ans}
                                </Button>
                            ))}
                        </div>

                        {result === 'perdu' && (
                            <Alert color="danger" className="mt-3 text-center">
                                <strong>Mauvaise réponse !</strong><br/>
                                Ce n'est pas grave, continuez à regarder des vidéos.
                            </Alert>
                        )}
                    </>
                )}
            </ModalBody>
            <ModalFooter>
                {!result && (
                    <Button color="primary" onClick={handleSubmit} disabled={!selectedAnswer || loading}>
                        {loading ? 'Vérification...' : 'Valider'}
                    </Button>
                )}
                <Button color="link" onClick={toggle}>
                    {result ? 'Fermer' : 'Ignorer ce quiz'}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default QuizModal;