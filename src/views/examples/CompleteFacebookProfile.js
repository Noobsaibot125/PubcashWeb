// src/views/examples/CompleteFacebookProfile.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { jwtDecode } from 'jwt-decode';
import { 
  Form, FormGroup, Label, Input, Button, Container, 
  Card, CardBody, CardTitle, Spinner
} from 'reactstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CompleteFacebookProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ville_id: '', // NOUVEAU: pour stocker l'ID de la ville
    commune_choisie: '',
    date_naissance: '',
    contact: '',
    genre: ''
  });

  // NOUVEAU: États pour les listes déroulantes
  const [villes, setVilles] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [loadingVilles, setLoadingVilles] = useState(true);
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  const accessToken = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!accessToken) {
      navigate('/auth/login-user');
    }
  }, [accessToken, navigate]);

  // NOUVEAU: Charger les villes au montage
  useEffect(() => {
    const fetchVilles = async () => {
      try {
        setLoadingVilles(true);
        const response = await api.get("/villes");
        setVilles(response.data);
      } catch (error) {
        console.error("Erreur chargement villes:", error);
        toast.error("Impossible de charger les villes.");
      } finally {
        setLoadingVilles(false);
      }
    };
    fetchVilles();
  }, []);

  // NOUVEAU: Charger les communes quand la ville change
  useEffect(() => {
    const fetchCommunes = async () => {
      if (!formData.ville_id) {
        setCommunes([]);
        setFormData((f) => ({ ...f, commune_choisie: "" }));
        return;
      }
      try {
        setLoadingCommunes(true);
        // Utilise l'endpoint dynamique de votre Register.js
        const response = await api.get(`/villes/${formData.ville_id}/communes`); 
        setCommunes(response.data);
      } catch (error) {
        console.error("Erreur chargement communes:", error);
        toast.error("Impossible de charger les communes.");
        setCommunes([]);
      } finally {
        setLoadingCommunes(false);
      }
    };

    fetchCommunes();
  }, [formData.ville_id]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // NOUVEAU: Réinitialiser la commune si la ville change
    if (name === "ville_id") {
      setFormData(prev => ({ ...prev, commune_choisie: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation mise à jour
    if (!formData.ville_id || !formData.commune_choisie || !formData.date_naissance || !formData.contact || !formData.genre) {
      toast.error('Tous les champs (Ville, Commune, Date de naissance, Contact et Genre) sont obligatoires.');
      return;
    }

    try {
      // Le backend attend 'commune_choisie', 'date_naissance', 'contact', 'genre'
      // Nous n'envoyons que ce dont le backend a besoin
      const payload = {
        commune_choisie: formData.commune_choisie,
        date_naissance: formData.date_naissance,
        contact: formData.contact,
        genre: formData.genre
      };
      
      const res = await api.patch('/auth/utilisateur/complete-profile', payload);
      const data = res.data;

      localStorage.setItem('accessToken', data.token); 
      const decodedToken = jwtDecode(data.token);
      localStorage.setItem('userRole', decodedToken.role);

      navigate('/user/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} />
      <Container className="mt-5 d-flex justify-content-center">
        <div className="col-lg-6 col-md-8">
          <Card className="bg-secondary shadow border-0">
            <CardBody className="px-lg-5 py-lg-5">
              <CardTitle tag="h4" className="text-center mb-4">Compléter votre profil</CardTitle>
              <p className="text-center text-muted">
                Veuillez remplir ces informations pour finaliser votre compte.
              </p>
              <Form onSubmit={handleSubmit}>
                
                {/* NOUVEAU : Champ Ville */}
                <FormGroup>
                  <Label>Ville *</Label>
                  <Input 
                    type="select" 
                    name="ville_id" 
                    value={formData.ville_id} 
                    onChange={handleChange} 
                    required 
                    disabled={loadingVilles}
                  >
                    <option value="">{loadingVilles ? "Chargement..." : "Sélectionner une ville..."}</option>
                    {villes.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
                  </Input>
                </FormGroup>

                {/* Champ Commune (maintenant dynamique) */}
                <FormGroup>
                  <Label>Commune *</Label>
                  <Input 
                    type="select" 
                    name="commune_choisie" 
                    value={formData.commune_choisie} 
                    onChange={handleChange} 
                    required 
                    disabled={loadingCommunes || !formData.ville_id}
                  >
                    <option value="">{loadingCommunes ? "Chargement..." : "Sélectionner une commune..."}</option>
                    {communes.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)}
                  </Input>
                </FormGroup>
                
                <FormGroup>
                  <Label>Date de naissance *</Label>
                  <Input type="date" name="date_naissance" value={formData.date_naissance} onChange={handleChange} required />
                </FormGroup>
                
                <FormGroup>
                   <Label>Contact *</Label>
                  <Input type="tel" name="contact" placeholder="Ex: 0102030405" value={formData.contact} onChange={handleChange} required />
                </FormGroup>
                
                <FormGroup>
                 <Label>Genre *</Label>
                  <Input type="select" name="genre" value={formData.genre} onChange={handleChange} required>
                    <option value="" disabled>Sélectionner votre genre...</option>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </Input>
                </FormGroup>
                
                <div className="text-center">
                  <Button className="mt-3 btn-pubcash-primary" type="submit">
                    Mettre à jour mon profil
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </div>
      </Container>
    </>
  );
};
export default CompleteFacebookProfile;