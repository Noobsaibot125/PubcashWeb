// src/views/admin/AdminLandingSettings.js
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Spinner, Alert } from "reactstrap";
import api from '../../services/api';
import { getMediaUrl } from 'utils/mediaUrl';

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
      if (logoFile) formData.append('logo', logoFile);
      if (imageFile) formData.append('image', imageFile);
      if (videoFile) formData.append('video', videoFile);

      formData.append('title', title);
      formData.append('subtitle', subtitle);

      const response = await api.post('/admin/info-accueil', formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setInfo(response.data);
      setMessage({ type: 'success', text: 'Mis à jour avec succès !' });
      setLogoFile(null);
      setImageFile(null);
      setVideoFile(null);
      await fetchInfo();

    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors de la sauvegarde.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const renderMediaPreview = (path, alt, type = 'image', width = 120) => {
    if (!path) return null;
    const url = getMediaUrl(path);
    if (type === 'video') {
      return (
        <div className="mt-2">
          <video width={width} controls src={url} />
          <small>URL: {url}</small>
        </div>
      );
    }
    return (
      <div className="mt-2">
        <img src={url} alt={alt} style={{ width }} />
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
                  <Label>Logo</Label>
                  <Input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} />
                  {info?.logo_path && renderMediaPreview(info.logo_path, "Logo actuel")}
                  {logoFile && <div><small>Nouveau logo:</small><br/><img src={URL.createObjectURL(logoFile)} alt="preview" style={{ width: 120 }} /></div>}
                </FormGroup>

                <FormGroup>
                  <Label>Image d'arrière-plan</Label>
                  <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
                  {info?.hero_image_path && renderMediaPreview(info.hero_image_path, "Image hero actuelle", "image", 240)}
                  {imageFile && <div><small>Nouvelle image:</small><br/><img src={URL.createObjectURL(imageFile)} alt="preview" style={{ width: 240 }} /></div>}
                </FormGroup>

                <FormGroup>
                  <Label>Vidéo de fond</Label>
                  <Input type="file" accept="video/mp4,video/webm" onChange={e => setVideoFile(e.target.files[0])} />
                  {info?.hero_video_path && renderMediaPreview(info.hero_video_path, "Vidéo actuelle", "video", 320)}
                  {videoFile && <div><small>Nouvelle vidéo:</small><br/><video width="320" controls src={URL.createObjectURL(videoFile)} /></div>}
                </FormGroup>

                <FormGroup>
                  <Label>Titre principal</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} />
                </FormGroup>

                <FormGroup>
                  <Label>Sous-titre</Label>
                  <Input type="textarea" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
                </FormGroup>

                <div className="text-right">
                  <Button color="primary" type="submit" disabled={loading}>
                    {loading ? <><Spinner size="sm" /> Sauvegarde...</> : "Sauvegarder"}
                  </Button>
                </div>
              </Form>

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
