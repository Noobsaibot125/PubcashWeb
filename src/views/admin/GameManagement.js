import React, { useState, useEffect, useRef } from 'react';
import {
    Container, Row, Col, Card, CardHeader, CardBody, Table, Button,
    Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Input, Label, Alert
} from 'reactstrap';
import api from 'services/api';
import Header from 'components/Headers/Header.js';

const GameManagement = () => {
    const [games, setGames] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        titre: '',
        description: '',
        duree_limite: 60,
        points_recompense: 10,
        statut: 'actif'
    });
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const fetchGames = async () => {
        try {
            const res = await api.get('/games/list');
            // Filtrer seulement les puzzles
            setGames(res.data.filter(g => g.type === 'puzzle') || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchGames();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        if (!imageFile) {
            setError("Veuillez sélectionner une image pour le puzzle");
            setLoading(false);
            return;
        }

        try {
            // 1. Upload l'image d'abord
            const formDataImage = new FormData();
            formDataImage.append('file', imageFile);

            const uploadRes = await api.post('/user/upload-profile-image', formDataImage, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // 2. Créer le jeu avec l'URL de l'image
            const payload = {
                type: 'puzzle',
                titre: formData.titre,
                duree_limite: formData.duree_limite,
                points_recompense: formData.points_recompense,
                statut: formData.statut,
                ciblage_commune: 'toutes',
                image_url: uploadRes.data.imageUrl || uploadRes.data.url
            };

            await api.post('/games/create', payload);

            // Reset
            setFormData({
                titre: '',
                description: '',
                duree_limite: 60,
                points_recompense: 10,
                statut: 'actif'
            });
            setImageFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

            setModalOpen(false);
            fetchGames();
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de la création");
        } finally {
            setLoading(false);
        }
    };
const deletepuzzle = async (gameId) => {
    try {
        await api.delete(`/games/${gameId}`);
        fetchGames();
    } catch (err) {
        console.error(err);
    }
};
    return (
        <>
            <Header />
            <Container className="mt--7" fluid>
                <Row>
                    <Col>
                        <Card className="shadow">
                            <CardHeader className="border-0 d-flex justify-content-between align-items-center">
                                <h3 className="mb-0">Gestion des Puzzles</h3>
                                <Button color="primary" onClick={() => setModalOpen(true)}>Nouveau Puzzle</Button>
                            </CardHeader>
                            <Table className="align-items-center table-flush" responsive>
                                <thead className="thead-light">
                                    <tr>
                                        <th scope="col">Titre</th>
                                        <th scope="col">Points</th>
                                        <th scope="col">Durée (s)</th>
                                        <th scope="col">Statut</th>
                                        <th scope="col">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {games.map(game => (
                                        <tr key={game.id}>
                                            <td>{game.titre}</td>
                                            <td>{game.points_recompense}</td>
                                            <td>{game.duree_limite}</td>
                                            <td>{game.statut}</td>
                                            <td>
                                                <Button size="sm" color="danger" onClick={() => deletepuzzle(game.id)}>Supprimer</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card>
                    </Col>
                </Row>

                <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
                    <ModalHeader toggle={() => setModalOpen(!modalOpen)}>Créer un nouveau puzzle</ModalHeader>
                    <ModalBody>
                        <Form>
                            <FormGroup>
                                <Label>Titre du puzzle</Label>
                                <Input name="titre" value={formData.titre} onChange={handleInputChange} placeholder="Ex: Puzzle facile" />
                            </FormGroup>

                            <FormGroup>
                                <Label>Description</Label>
                                <Input type="textarea" name="description" value={formData.description} onChange={handleInputChange} placeholder="Description du puzzle" />
                            </FormGroup>

                            <FormGroup>
                                <Label>Image du puzzle</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    innerRef={fileInputRef}
                                />
                                <small className="text-muted">Sélectionnez l'image qui sera découpée en puzzle</small>
                            </FormGroup>

                            <FormGroup>
                                <Label>Durée limite (secondes)</Label>
                                <Input type="number" name="duree_limite" value={formData.duree_limite} onChange={handleInputChange} min="30" max="300" />
                            </FormGroup>

                            <FormGroup>
                                <Label>Points de récompense</Label>
                                <Input type="number" name="points_recompense" value={formData.points_recompense} onChange={handleInputChange} min="1" max="100" />
                            </FormGroup>

                            {error && <Alert color="danger">{error}</Alert>}
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Création...' : 'Créer'}
                        </Button>
                        <Button color="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
                    </ModalFooter>
                </Modal>
            </Container>
        </>
    );
};

export default GameManagement;
