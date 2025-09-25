// src/views/examples/CreerPromotion.js

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Card, CardHeader, CardBody, Container, Row, Col, Form, FormGroup, Input, 
  Button, Label, Modal, ModalHeader, ModalBody, ModalFooter, Spinner
} from 'reactstrap';
import ClientHeader from "components/Headers/ClientHeader.js";
import api from '../../services/api';
// On définit les coûts des packs pour les calculs de vues potentielles
const PACK_REMUNERATIONS = { 'Agent': 50, 'Gold': 75, 'Diamant': 100 };

const CreerPromotion = () => {
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
    const fileInputRef = useRef(null);
    const [profile, setProfile] = useState({ solde_recharge: 0 });
    const [videoFile, setVideoFile] = useState(null);
    const videoObjectUrlRef = useRef(null);
    
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // 2. On corrige l'appel pour utiliser 'api.get'
                const response = await api.get('/client/profile');
                setProfile(response.data);
            } catch (err) {
                console.error("Impossible de charger le profil pour le solde.");
            }
        };
        fetchProfile();
    }, []);
    
    // 3. On corrige la fonction d'upload pour utiliser 'api.post'
    const uploadVideoToServer = async (file) => {
        const form = new FormData();
        form.append('video', file);
      
        const res = await api.post('/videos/upload', form, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        return res.data; // Axios renvoie les données directement dans .data
    };
  
    const budgetPourCampagne = useMemo(() => (parseFloat(formData.budget) > 0 ? (parseFloat(formData.budget) * 0.85).toFixed(2) : '0.00'), [formData.budget]);
    const vuesPotentielles = useMemo(() => (parseFloat(budgetPourCampagne) > 0 && PACK_REMUNERATIONS[pack] > 0 ? Math.floor(parseFloat(budgetPourCampagne) / PACK_REMUNERATIONS[pack]) : 0), [budgetPourCampagne, pack]);
    const nouveauSolde = useMemo(() => (parseFloat(formData.budget) > 0 && parseFloat(profile.solde_recharge) >= parseFloat(formData.budget) ? (parseFloat(profile.solde_recharge) - parseFloat(formData.budget)).toFixed(2) : parseFloat(profile.solde_recharge).toFixed(2)), [formData.budget, profile.solde_recharge]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleFileChange = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      setError('');
      setVideoFile(file);
      setFormData(prev => ({...prev, url_video: ''}));
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
    useEffect(() => { return () => { if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current); }; }, []);
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

    const handleConfirmSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!videoFile) return setError('Veuillez importer une vidéo.');
        if (!pack || !duree) return setError('Durée de la vidéo non déterminée. Vérifiez le fichier.');
        if (parseFloat(formData.budget) > parseFloat(profile.solde_recharge)) return setError('Solde insuffisant.');
        setIsModalOpen(true);
    };
    
    // 4. On corrige la fonction de soumission pour utiliser 'api.post'
    const submitPromotion = async () => {
        setIsModalOpen(false);
        setLoading(true);
      
        try {
            let videoFilename = null;
            let thumbFilename = null;
    
            if (videoFile) {
                const uploadResult = await uploadVideoToServer(videoFile);
                videoFilename = uploadResult.videoFilename;
                // --- CORRECTION ICI ---
                // On lit la bonne clé 'thumbFilename' renvoyée par le backend.
                thumbFilename = uploadResult.thumbFilename || null;
            }
    
            const cleanValue = (value) => (value === undefined ? null : value);
            const submissionData = { 
                titre: cleanValue(formData.titre),
                description: cleanValue(formData.description),
                url_video: cleanValue(videoFilename),
                thumbnail_url: cleanValue(thumbFilename), // Maintenant, cette valeur sera correcte !
                budget: parseFloat(formData.budget),
                duree_secondes: parseInt(duree, 10),
                tranche_age: cleanValue(formData.tranche_age),
                ciblage_commune: cleanValue(formData.ciblage_commune)
            };
    
            const response = await api.post('/client/promotions', submissionData);
    
            const data = response.data;
            setSuccess(data.message);
            setProfile(prev => ({ ...prev, solde_recharge: data.newBalance }));
            // Réinitialiser le formulaire
            setFormData({ titre: '', description: '', budget: '', tranche_age: 'tous', ciblage_commune: 'toutes' });
            clearVideoFile();
    
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Une erreur est survenue.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ClientHeader />
            <Container className="mt--7" fluid>
                <Row className="justify-content-center">
                    <Col xl="10">
                        <Card className="shadow">
                            <CardHeader><h3 className="mb-0">Créer une nouvelle promotion</h3></CardHeader>
                            <CardBody>
                                <Form onSubmit={handleConfirmSubmit}>
                                    <h6 className="heading-small text-muted mb-4">Informations sur la publicité</h6>
                                    <Row>
                                        <Col lg="8">
                                            <FormGroup>
                                                <Label for="titre">Titre</Label>
                                                <Input 
                                                    type="text" 
                                                    name="titre" 
                                                    id="titre" 
                                                    placeholder="Ex: Super promo sur les T-shirts" 
                                                    value={formData.titre} 
                                                    onChange={handleChange} 
                                                    required 
                                                />
                                            </FormGroup>
                                            <FormGroup>
                                                <Label for="description">Description</Label>
                                                <Input 
                                                    type="textarea" 
                                                    name="description" 
                                                    id="description" 
                                                    rows="3" 
                                                    placeholder="Une courte description de votre produit ou service." 
                                                    value={formData.description} 
                                                    onChange={handleChange} 
                                                />
                                            </FormGroup>
                                            
                                            {/* Nouveaux champs ajoutés */}
                                            <Row>
                <Col md="6">
                    <FormGroup>
                        <Label for="tranche_age">Tranche d'âge ciblée</Label>
                        <Input 
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
                <Col md="6">
                    <FormGroup>
                        <Label for="ciblage_commune">Ciblage par commune</Label>
                        <Input 
                            type="select" 
                            name="ciblage_commune" 
                            id="ciblage_commune" 
                            value={formData.ciblage_commune} 
                            onChange={handleChange} 
                            required
                        >
                            <option value="toutes">Toutes les communes</option>
                            <option value="ma_commune">Ma commune seulement</option>
                        </Input>
                    </FormGroup>
                </Col>
            </Row>
                                        </Col>
                                        <Col lg="4" className="d-flex flex-column align-items-center justify-content-center border-left-lg mt-4 mt-lg-0">
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                onChange={handleFileChange} 
                                                style={{ display: 'none' }} 
                                                accept="video/*" 
                                            />
                                            {!videoFile ? (
                                                <Button 
                                                    color="secondary" 
                                                    outline 
                                                    onClick={triggerFileSelect} 
                                                    className="btn-icon-clipboard" 
                                                    style={{width: '150px', height: '150px', borderRadius: '50%', borderStyle: 'dashed'}}
                                                >
                                                    <div>
                                                        <i className="ni ni-fat-add" style={{fontSize: '3rem'}} />
                                                        <span className="d-block mt-2">Importer Vidéo</span>
                                                    </div>
                                                </Button>
                                            ) : (
                                                <div className="text-center p-3 border rounded">
                                                    <i className="ni ni-tv-2 text-success" style={{fontSize: '3rem'}} />
                                                    <p className="mt-2 mb-2 text-sm font-weight-bold">{videoFile.name}</p>
                                                    <Button color="danger" size="sm" outline onClick={clearVideoFile}>Changer</Button>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                    <hr className="my-4" />
                                    <h6 className="heading-small text-muted mb-4">Paramètres & Coûts</h6>
                                    <Row>
                                        <Col md="6">
                                            <FormGroup>
                                                <Label>Durée (secondes)</Label>
                                                <Input type="number" value={duree} placeholder="Auto-détectée" disabled />
                                            </FormGroup>
                                        </Col>
                                        <Col md="6">
                                            <FormGroup>
                                                <Label>Pack associé</Label>
                                                <Input type="text" value={pack} placeholder="Auto-détecté" disabled />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md="6">
                                            <FormGroup>
                                                <Label>Montant de la promotion</Label>
                                                <Input 
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
                                                <Label>Budget réel pour les vues (après commission)</Label>
                                                <Input type="text" value={`${budgetPourCampagne} FCFA`} disabled />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col>
                                            <FormGroup>
                                                <Label>Nombre de vue potentielles</Label>
                                                <Input type="text" value={`~ ${vuesPotentielles} personnes`} disabled />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <hr className="my-4" />
                                    {error && <div className="text-danger my-3 text-center"><small>{error}</small></div>}
                                    {success && <div className="text-success my-3 text-center"><small>{success}</small></div>}
                                    <div className="text-right">
                                        <Button color="primary" type="submit" disabled={loading || !formData.budget}>
                                            {loading ? <Spinner size="sm" /> : "Vérifier et Lancer"}
                                        </Button>
                                    </div>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <Modal isOpen={isModalOpen} toggle={() => setIsModalOpen(false)}>
                <ModalHeader toggle={() => setIsModalOpen(false)}>Confirmer la promotion</ModalHeader>
                <ModalBody>
                    <p>Vous êtes sur le point de lancer cette promotion :</p>
                    <ul>
                        <li>Titre : <b>{formData.titre}</b></li>
                        <li>Budget total : <b>{parseFloat(formData.budget).toLocaleString('fr-FR')} FCFA</b></li>
                        <li>Nouveau solde estimé : <b>{parseFloat(nouveauSolde).toLocaleString('fr-FR')} FCFA</b></li>
                        <li>Vues estimées : <b>~ {vuesPotentielles} personnes</b></li>
                        {/* Nouveaux champs dans la confirmation */}
                        <li>Tranche d'âge : <b>
                    {formData.tranche_age === 'tous' ? 'Tout le monde' : 
                     formData.tranche_age === '12-17' ? 'Adolescents (12-17 ans)' : 
                     'Adultes (18 ans et plus)'}
                </b></li>
                        <li>Ciblage : <b>{formData.ciblage_commune === 'toutes' ? 'Toutes les communes' : 'Ma commune seulement'}</b></li>
                    </ul>
                    <p>Êtes-vous sûr de vouloir continuer ? Cette action est irréversible.</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={submitPromotion} disabled={loading}>
                        {loading ? <Spinner size="sm" /> : "Confirmer et Payer"}
                    </Button>{' '}
                    <Button color="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default CreerPromotion;