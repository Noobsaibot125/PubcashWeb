// src/views/admin/AdminLandingSettings.js
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Spinner, Alert } from "reactstrap";
import api from '../../services/api';
import { getMediaUrl } from 'utils/mediaUrl'; // IMPORT CORRIGÉ

const AdminLandingSettings = () => {
  const [info, setInfo] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchInfo();
  }, []);

  const fetchInfo = async () => {
    try {
      const response = await api.get('/admin/info-accueil');
      const data = response.data;
      
      console.log('Données reçues:', data);
      
      if (data) {
        setInfo(data);
        setTitle(data.title || "");
        setSubtitle(data.subtitle || "");
      }
    } catch (err) {
      console.error("Erreur chargement infos:", err);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des données' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      
      // Ajouter les fichiers seulement s'ils sont sélectionnés
      if (logoFile) formData.append('logo', logoFile);
      if (imageFile) formData.append('image', imageFile);
      if (videoFile) formData.append('video', videoFile);
      
      // Toujours envoyer le titre et le subtitle
      formData.append('title', title);
      formData.append('subtitle', subtitle);

      console.log('Envoi des données:', {
        title,
        subtitle,
        logoFile: logoFile ? logoFile.name : 'none',
        imageFile: imageFile ? imageFile.name : 'none',
        videoFile: videoFile ? videoFile.name : 'none'
      });

      const response = await api.post('/admin/info-accueil', formData);

      setInfo(response.data);
      setMessage({ type: 'success', text: 'Mis à jour avec succès !' });
      
      // Réinitialiser les sélections de fichiers
      setLogoFile(null);
      setImageFile(null);
      setVideoFile(null);
      
      // Recharger les infos
      await fetchInfo();

    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors de la sauvegarde.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour afficher un média avec gestion d'erreur
  const renderMediaPreview = (path, alt, type = 'image', width = 120) => {
    if (!path) return null;
    
    const url = getMediaUrl(path);
    
    if (type === 'video') {
      return (
        <div className="mt-2">
          <video 
            width={width} 
            controls 
            src={url}
            onError={(e) => {
              console.error('Erreur chargement vidéo preview:', url);
              e.target.style.display = 'none';
            }}
          />
          <small>URL: {url}</small>
        </div>
      );
    }
    
    return (
      <div className="mt-2">
        <img 
          src={url} 
          alt={alt} 
          style={{ width }} 
          onError={(e) => {
            console.error('Erreur chargement image preview:', url);
            e.target.style.display = 'none';
          }}
        />
        <br />
        <small>URL: {url}</small>
      </div>
    );
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col md="8" className="mx-auto">
          <Card>
            <CardBody>
              <h4>Paramètres de la page d'accueil</h4>
              
              {message.text && (
                <Alert color={message.type === 'success' ? 'success' : 'danger'}>
                  {message.text}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label>Logo (PNG / JPG)</Label>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setLogoFile(e.target.files[0])} 
                  />
                  <div className="mt-2">
                    {info?.logo_path && renderMediaPreview(info.logo_path, 'Logo actuel')}
                    {logoFile && (
                      <div className="mt-2">
                        <small>Nouveau logo:</small>
                        <br />
                        <img src={URL.createObjectURL(logoFile)} alt="preview" style={{ width: 120 }} />
                      </div>
                    )}
                  </div>
                </FormGroup>

                <FormGroup>
                  <Label>Image d'arrière-plan (fallback)</Label>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setImageFile(e.target.files[0])} 
                  />
                  <div className="mt-2">
                    {info?.hero_image_path && renderMediaPreview(info.hero_image_path, 'Image hero actuelle', 'image', 240)}
                    {imageFile && (
                      <div className="mt-2">
                        <small>Nouvelle image:</small>
                        <br />
                        <img src={URL.createObjectURL(imageFile)} alt="preview" style={{ width: 240 }} />
                      </div>
                    )}
                  </div>
                </FormGroup>

                <FormGroup>
                  <Label>Vidéo de fond (mp4)</Label>
                  <Input 
                    type="file" 
                    accept="video/mp4,video/webm" 
                    onChange={(e) => setVideoFile(e.target.files[0])} 
                  />
                  <div className="mt-2">
                    {info?.hero_video_path && renderMediaPreview(info.hero_video_path, 'Vidéo hero actuelle', 'video', 320)}
                    {videoFile && (
                      <div className="mt-2">
                        <small>Nouvelle vidéo:</small>
                        <br />
                        <video width="320" controls src={URL.createObjectURL(videoFile)} />
                      </div>
                    )}
                  </div>
                </FormGroup>

                <FormGroup>
                  <Label>Titre principal</Label>
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="PubCash — La pub qui rapporte"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Sous-titre</Label>
                  <Input 
                    type="textarea" 
                    value={subtitle} 
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Promoteurs : publiez vos vidéos. Utilisateurs : likez, partagez et gagnez."
                  />
                </FormGroup>

                <div className="text-right">
                  <Button color="primary" type="submit" disabled={loading}>
                    {loading ? <><Spinner size="sm" /> Sauvegarde...</> : "Sauvegarder"}
                  </Button>
                </div>
              </Form>

              {/* Section debug */}
              <div className="mt-4 p-3 bg-light rounded">
                <h6>Debug Info:</h6>
                <pre>{JSON.stringify(info, null, 2)}</pre>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminLandingSettings;