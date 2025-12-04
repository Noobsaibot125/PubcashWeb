// src/views/examples/CreerPromotion.js

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Card, CardBody, Container, Row, Col, Form, FormGroup, Input,
    Button, Label, Modal, ModalHeader, ModalBody, ModalFooter, Spinner
} from 'reactstrap';
// Removing ClientHeader to match the clean mockup look
// import ClientHeader from "components/Headers/ClientHeader.js";
import api from '../../services/api';

// On définit les coûts des packs pour les calculs de vues potentielles
const PACK_REMUNERATIONS = { 'Agent': 50, 'Gold': 75, 'Diamant': 100 };

const CreerPromotion = () => {
    // --- ETATS INITIAUX ---
    const [formData, setFormData] = useState({
        titre: '', description: '', budget: '',
        tranche_age: 'tous', ciblage_commune: 'toutes'
    });
    const [duree, setDuree] = useState('');
    const [pack, setPack] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const fileInputRef = useRef(null);
    const [profile, setProfile] = useState({ solde_recharge: 0 });
    const [videoFile, setVideoFile] = useState(null);

    // --- NOUVEAUX ETATS (Pour le Quiz et le Wizard) ---
    const [step, setStep] = useState(1); // 1 = Promo, 2 = Quiz
    const [includeQuiz, setIncludeQuiz] = useState(false);
    const [quizData, setQuizData] = useState({
        question: '',
        mauvaiseReponse1: '',
        mauvaiseReponse2: '',
        bonneReponse: ''
    });

    // --- EFFETS ET API ---
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/client/profile');
                setProfile(response.data);
            } catch (err) {
                console.error("Impossible de charger le profil pour le solde.");
            }
        };
        fetchProfile();
    }, []);

    const uploadVideoToServer = async (file) => {
        const form = new FormData();
        form.append('video', file);

        const res = await api.post('/videos/upload', form, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return res.data; 
    };

    // --- CALCULS ---
    const budgetPourCampagne = useMemo(() => (parseFloat(formData.budget) > 0 ? (parseFloat(formData.budget) * 0.85).toFixed(2) : '0.00'), [formData.budget]);
    const vuesPotentielles = useMemo(() => (parseFloat(budgetPourCampagne) > 0 && PACK_REMUNERATIONS[pack] > 0 ? Math.floor(parseFloat(budgetPourCampagne) / PACK_REMUNERATIONS[pack]) : 0), [budgetPourCampagne, pack]);
    const nouveauSolde = useMemo(() => (parseFloat(formData.budget) > 0 && parseFloat(profile.solde_recharge) >= parseFloat(formData.budget) ? (parseFloat(profile.solde_recharge) - parseFloat(formData.budget)).toFixed(2) : parseFloat(profile.solde_recharge).toFixed(2)), [formData.budget, profile.solde_recharge]);

    // --- HANDLERS ---
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleQuizChange = (e) => setQuizData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setError('');
        setVideoFile(file);
        setFormData(prev => ({ ...prev, url_video: '' }));
        const videoElement = document.createElement('video');
        videoElement.style.display = 'none';
        document.body.appendChild(videoElement);
        const objectUrl = URL.createObjectURL(file);
        videoElement.src = objectUrl;
        videoElement.onloadedmetadata = () => {
            const duration = Math.round(videoElement.duration);
            setDuree(duration);
            determinePack(duration);
            videoElement.pause();
            videoElement.removeAttribute('src');
            videoElement.load();
            document.body.removeChild(videoElement);
            URL.revokeObjectURL(objectUrl);
        };
        videoElement.onerror = () => {
            setError("Erreur de lecture vidéo");
            document.body.removeChild(videoElement);
            URL.revokeObjectURL(objectUrl);
        };
    };

    const determinePack = (duration) => {
        if (duration >= 0 && duration <= 11) setPack('Agent');
        else if (duration >= 12 && duration <= 30) setPack('Gold');
        else if (duration >= 31 && duration <= 60) setPack('Diamant');
        else {
            setPack(''); setDuree('');
            setError('La durée de la vidéo doit être entre 0 et 60 secondes.');
        }
    };
    const triggerFileSelect = () => {
        if (fileInputRef.current) fileInputRef.current.value = null;
        fileInputRef.current.click();
    };
    const clearVideoFile = () => { setVideoFile(null); setDuree(''); setPack(''); };

    // --- NAVIGATION ET VALIDATION ---
    const handleStep1Submit = (e) => {
        e.preventDefault();
        setError('');
        if (!videoFile) return setError('Veuillez importer une vidéo.');
        if (!pack || !duree) return setError('Durée de la vidéo non déterminée. Vérifiez le fichier.');
        if (parseFloat(formData.budget) > parseFloat(profile.solde_recharge)) return setError('Solde insuffisant.');
        setStep(2);
    };

    const handleFinalPreSubmit = (withQuiz) => {
        setIncludeQuiz(withQuiz);
        setError('');
        if (withQuiz) {
            if (!quizData.question || !quizData.bonneReponse || !quizData.mauvaiseReponse1 || !quizData.mauvaiseReponse2) {
                setError("Veuillez remplir tous les champs du quiz pour continuer.");
                return;
            }
        }
        setIsModalOpen(true);
    };

    const submitPromotion = async () => {
        setIsModalOpen(false);
        setLoading(true);
        try {
            let videoFilename = null;
            let thumbFilename = null;
            if (videoFile) {
                const uploadResult = await uploadVideoToServer(videoFile);
                videoFilename = uploadResult.videoFilename;
                thumbFilename = uploadResult.thumbFilename || null;
            }
            const cleanValue = (value) => (value === undefined ? null : value);
            const submissionData = {
                titre: cleanValue(formData.titre),
                description: cleanValue(formData.description),
                url_video: cleanValue(videoFilename),
                thumbnail_url: cleanValue(thumbFilename),
                budget: parseFloat(formData.budget),
                duree_secondes: parseInt(duree, 10),
                tranche_age: cleanValue(formData.tranche_age),
                ciblage_commune: cleanValue(formData.ciblage_commune)
            };
            const response = await api.post('/client/promotions', submissionData);
            const data = response.data;
            const promoId = data.promotionId;

            if (includeQuiz && promoId) {
                const reponsesPossibles = JSON.stringify([
                    quizData.bonneReponse, 
                    quizData.mauvaiseReponse1, 
                    quizData.mauvaiseReponse2
                ]);
                await api.post('/games/create', {
                    type: 'quiz',
                    titre: `Quiz: ${formData.titre}`,
                    question: quizData.question,
                    reponses: reponsesPossibles,
                    bonne_reponse: quizData.bonneReponse,
                    points_recompense: 5,
                    promotion_id: promoId,
                    statut: 'actif'
                });
            }
            setShowSuccessModal(true);
            setProfile(prev => ({ ...prev, solde_recharge: data.newBalance }));
            setFormData({ titre: '', description: '', budget: '', tranche_age: 'tous', ciblage_commune: 'toutes' });
            setQuizData({ question: '', bonneReponse: '', mauvaiseReponse1: '', mauvaiseReponse2: '' });
            clearVideoFile();
            setStep(1);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Une erreur est survenue.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Simple spacer instead of ClientHeader to keep it clean */}
            <div className="header pt-5 pt-md-8 pb-4"></div>

            <Container fluid>
                <Row className="justify-content-center">
                    <Col xl="11">
                        <Card className="pubcash-form-card bg-white shadow">
                            <CardBody className="p-4 p-md-5">
                                <h2 className="pubcash-form-title mb-5">
                                    {step === 1 ? "Créer une nouvelle promotion" : "Ajouter un Quiz (Optionnel)"}
                                </h2>

                                {error && <div className="alert alert-danger rounded-lg">{error}</div>}
                                {success && <div className="alert alert-success rounded-lg">{success}</div>}

                                {/* ==================== ÉTAPE 1 : PROMOTION ==================== */}
                                <div style={{ display: step === 1 ? 'block' : 'none' }}>
                                    <Form onSubmit={handleStep1Submit}>

                                        {/* --- Section 1: Informations --- */}
                                        <h6 className="section-title-orange">INFORMATIONS SUR LA PUBLICITÉ</h6>
                                        <Row>
                                            <Col md="6">
                                                <FormGroup>
                                                    <Label className="form-control-label-pubcash" for="titre">Titre</Label>
                                                    <Input
                                                        className="form-control-pubcash"
                                                        type="text"
                                                        name="titre"
                                                        id="titre"
                                                        placeholder="Ex: Promo T-shirt"
                                                        value={formData.titre}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="6">
                                                <FormGroup>
                                                    <Label className="form-control-label-pubcash" for="tranche_age">Tranche d'âge ciblée</Label>
                                                    <Input
                                                        className="form-control-pubcash"
                                                        type="select"
                                                        name="tranche_age"
                                                        id="tranche_age"
                                                        value={formData.tranche_age}
                                                        onChange={handleChange}
                                                        required
                                                    >
                                                        <option value="tous">Tout le monde</option>
                                                        <option value="12-17">Adolescents (12-17 ans)</option>
                                                        <option value="18+">Adultes (18 ans et plus)</option>
                                                    </Input>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md="6">
                                                <FormGroup>
                                                    <Label className="form-control-label-pubcash" for="description">Description</Label>
                                                    <Input
                                                        className="form-control-pubcash"
                                                        type="text"
                                                        name="description"
                                                        id="description"
                                                        placeholder="Courte description ..."
                                                        value={formData.description}
                                                        onChange={handleChange}
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="6">
                                                <FormGroup>
                                                    <Label className="form-control-label-pubcash" for="ciblage_commune">Ciblage par commune</Label>
                                                    <Input
                                                        className="form-control-pubcash"
                                                        type="select"
                                                        name="ciblage_commune"
                                                        id="ciblage_commune"
                                                        value={formData.ciblage_commune}
                                                        onChange={handleChange}
                                                        required
                                                    >
                                                        <option value="toutes">Toutes les communes</option>
                                                        <option value="ma_commune">
                                                            {`Ma commune seulement ${profile.commune ? `(${profile.commune})` : ''}`}
                                                        </option>
                                                    </Input>
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        {/* --- Section 2: Upload Video --- */}
                                        <div className="my-5">
                                            <div className="text-center mb-3">
                                                <Label className="form-control-label-pubcash" style={{ fontSize: '1rem' }}>Importer la vidéo</Label>
                                            </div>

                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                style={{ display: 'none' }}
                                                accept="video/*"
                                            />

                                            {!videoFile ? (
                                                <div className="upload-zone" onClick={triggerFileSelect}>
                                                    <div className="upload-icon-circle">
                                                        <i className="ni ni-fat-add"></i>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="upload-zone" style={{ borderColor: 'var(--pubcash-green)' }}>
                                                    <div className="text-center">
                                                        <div className="upload-icon-circle mb-3 mx-auto" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
                                                            <i className="ni ni-check-bold"></i>
                                                        </div>
                                                        <p className="font-weight-bold mb-2">{videoFile.name}</p>
                                                        <Button size="sm" color="danger" outline onClick={(e) => { e.stopPropagation(); clearVideoFile(); }}>
                                                            Supprimer
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* --- Section 3: Paramètres & Coûts --- */}
                                        <h6 className="section-title-green">PARAMÈTRES & COÛTS</h6>
                                        <Row>
                                            <Col md="6">
                                                <FormGroup>
                                                    <Label className="form-control-label-pubcash">Durée (secondes)</Label>
                                                    <Input className="form-control-pubcash" type="text" value={duree || ''} placeholder="Auto-détectée" disabled />
                                                </FormGroup>
                                            </Col>
                                            <Col md="6">
                                                <FormGroup>
                                                    <Label className="form-control-label-pubcash">Pack associé</Label>
                                                    <Input className="form-control-pubcash" type="text" value={pack || ''} placeholder="Auto-détectée" disabled />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md="6">
                                                <FormGroup>
                                                    <Label className="form-control-label-pubcash">Montant de la promotion (FCFA)</Label>
                                                    <Input
                                                        className="form-control-pubcash"
                                                        type="number"
                                                        name="budget"
                                                        placeholder="Ex: 10000"
                                                        value={formData.budget}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="6">
                                                <FormGroup>
                                                    <Label className="form-control-label-pubcash">Budget réel pour les vues ...</Label>
                                                    <div className="position-relative">
                                                        <Input className="form-control-pubcash" type="text" value={`${budgetPourCampagne} FCFA`} disabled />
                                                        <i className="ni ni-bold-down position-absolute" style={{ right: '15px', top: '15px', color: '#a0aec0' }}></i>
                                                    </div>
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                         {/* Added Potential Views Field */}
                                         <Row>
                                            <Col md="12">
                                                <FormGroup>
                                                    <Label className="form-control-label-pubcash text-primary">Nombre de vues potentielles estimées</Label>
                                                    <Input
                                                        className="form-control-pubcash"
                                                        style={{ fontWeight: 'bold', color: 'var(--pubcash-blue)' }}
                                                        type="text"
                                                        value={vuesPotentielles > 0 ? `~ ${vuesPotentielles} Personnes` : '-'}
                                                        disabled
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>


                                        <div className="text-right mt-5">
                                            <Button
                                                className="btn-lg px-5"
                                                style={{ backgroundColor: 'var(--pubcash-orange)', borderColor: 'var(--pubcash-orange)', color: 'white', borderRadius: '10px' }}
                                                type="submit"
                                                disabled={loading || !formData.budget}
                                            >
                                                Suivant <i className="ni ni-bold-right ml-2"></i>
                                            </Button>
                                        </div>
                                    </Form>
                                </div>

                                {/* ==================== ÉTAPE 2 : QUIZ ==================== */}
                                <div style={{ display: step === 2 ? 'block' : 'none' }}>
                                    <div className="text-center mb-5">
                                        <div className="icon icon-shape bg-gradient-success text-white rounded-circle shadow mb-4" style={{ width: '80px', height: '80px' }}>
                                            <i className="ni ni-hat-3" style={{ fontSize: '2rem' }}></i>
                                        </div>
                                        <h3 className="text-dark">Engagez votre audience avec un Quiz !</h3>
                                        <p className="text-muted">Si l'utilisateur répond correctement après avoir partagé, il gagne 5 points bonus.</p>
                                    </div>

                                    <FormGroup>
                                        <Label className="form-control-label-pubcash">La Question</Label>
                                        <Input 
                                            className="form-control-pubcash"
                                            type="text" 
                                            placeholder="Ex: Quelle est la couleur du t-shirt dans la vidéo ?" 
                                            name="question"
                                            value={quizData.question}
                                            onChange={handleQuizChange}
                                        />
                                    </FormGroup>

                                    <Row>
                                        <Col md="4">
                                            <FormGroup>
                                                <Label className="form-control-label-pubcash text-success">Bonne Réponse</Label>
                                                <Input 
                                                    className="form-control-pubcash"
                                                    type="text" 
                                                    placeholder="La réponse correcte" 
                                                    name="bonneReponse"
                                                    value={quizData.bonneReponse}
                                                    onChange={handleQuizChange}
                                                    style={{ borderColor: '#48bb78' }}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md="4">
                                            <FormGroup>
                                                <Label className="form-control-label-pubcash text-danger">Mauvaise Réponse 1</Label>
                                                <Input 
                                                    className="form-control-pubcash"
                                                    type="text" 
                                                    name="mauvaiseReponse1"
                                                    value={quizData.mauvaiseReponse1}
                                                    onChange={handleQuizChange}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md="4">
                                            <FormGroup>
                                                <Label className="form-control-label-pubcash text-danger">Mauvaise Réponse 2</Label>
                                                <Input 
                                                    className="form-control-pubcash"
                                                    type="text" 
                                                    name="mauvaiseReponse2"
                                                    value={quizData.mauvaiseReponse2}
                                                    onChange={handleQuizChange}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <div className="d-flex justify-content-between mt-5 pt-4 border-top">
                                        <Button
                                            color="secondary"
                                            outline
                                            className="px-4"
                                            onClick={() => handleFinalPreSubmit(false)}
                                            style={{ borderRadius: '10px' }}
                                        >
                                            Ignorer le Quiz et Lancer
                                        </Button>
                                        <div className="d-flex">
                                             <Button
                                                color="secondary"
                                                className="mr-3"
                                                onClick={() => setStep(1)}
                                                style={{ borderRadius: '10px' }}
                                            >
                                                Retour
                                            </Button>
                                            <Button
                                                className="px-4"
                                                onClick={() => handleFinalPreSubmit(true)}
                                                style={{ backgroundColor: 'var(--pubcash-green)', color: 'white', borderRadius: '10px', border: 'none' }}
                                            >
                                                Valider et Lancer
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* --- CONFIRMATION MODAL --- */}
            <Modal isOpen={isModalOpen} toggle={() => setIsModalOpen(false)} size="lg">
                <ModalHeader toggle={() => setIsModalOpen(false)}>Confirmer la promotion</ModalHeader>
                <ModalBody>
                    <div className="py-3">
                         <Row>
                             <Col md="6">
                                 <p className="text-sm text-muted mb-1">Titre de la promotion</p>
                                 <h4 className="mb-3">{formData.titre}</h4>

                                 <p className="text-sm text-muted mb-1">Budget Total</p>
                                 <h4 className="mb-3 text-primary">{parseFloat(formData.budget).toLocaleString('fr-FR')} FCFA</h4>

                                 <p className="text-sm text-muted mb-1">Vues Estimées</p>
                                 <h4 className="mb-3">~ {vuesPotentielles} personnes</h4>
                             </Col>
                             <Col md="6">
                                 <p className="text-sm text-muted mb-1">Ciblage</p>
                                 <h5 className="mb-3">
                                     {formData.tranche_age === 'tous' ? 'Tout le monde' : 'Ciblé par âge'} <br/>
                                     {formData.ciblage_commune === 'toutes' ? 'Toutes les communes' : profile.commune}
                                 </h5>

                                 {includeQuiz && (
                                    <div className="p-3 bg-secondary rounded">
                                        <i className="ni ni-check-bold text-success mr-2"></i>
                                        <span className="font-weight-bold">Quiz Inclus</span>
                                    </div>
                                 )}
                             </Col>
                         </Row>
                         <hr/>
                         <p className="text-center font-weight-bold mt-2">
                             Votre solde actuel : {parseFloat(profile.solde_recharge).toLocaleString('fr-FR')} FCFA <br/>
                             Nouveau solde après opération : <span className="text-warning">{parseFloat(nouveauSolde).toLocaleString('fr-FR')} FCFA</span>
                         </p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                    <Button color="success" onClick={submitPromotion} disabled={loading}>
                        {loading ? <Spinner size="sm" /> : "Confirmer et Payer"}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* --- SUCCESS MODAL --- */}
            <Modal isOpen={showSuccessModal} toggle={() => window.location.reload()} centered contentClassName="bg-white">
                <div className="modal-header border-0 pb-0 d-flex justify-content-end">
                    <button className="close" onClick={() => window.location.reload()}><span>×</span></button>
                </div>
                <ModalBody className="px-5 pb-5">
                    <div className="text-center">
                        <div className="icon icon-shape bg-success text-white rounded-circle mb-4" style={{ width: '70px', height: '70px' }}>
                             <i className="ni ni-check-bold" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <h3 className="text-success mb-3">Promotion créée avec succès !</h3>
                        <p className="text-muted mb-4">
                            Votre campagne publicitaire est maintenant active. Vous pouvez suivre ses performances depuis le tableau de bord.
                        </p>
                        <Button style={{ backgroundColor: 'var(--pubcash-orange)', border: 'none' }} block onClick={() => window.location.reload()}>
                            Continuer
                        </Button>
                    </div>
                </ModalBody>
            </Modal>
        </>
    );
};

export default CreerPromotion;
