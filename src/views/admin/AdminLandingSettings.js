import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Spinner } from "reactstrap";
import api from '../../services/api'; // 1. IMPORTER API
const AdminLandingSettings = () => {
  const [info, setInfo] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [loading, setLoading] = useState(false);
  const apiBase = process.env.REACT_APP_API_URL;

  useEffect(() => {
    // Note: Cet appel ne nécessite pas d'authentification, on peut laisser fetch
    // mais pour la cohérence on peut aussi créer une instance 'publicApi' sans intercepteur
    fetch(`${process.env.REACT_APP_API_URL}/admin/info-accueil`)
      .then(r => r.json())
      .then(data => {
        if (data) {
          setInfo(data);
          setTitle(data.title || "");
          setSubtitle(data.subtitle || "");
        }
      })
      .catch(err => console.error(err));
  }, []);

  const assetUrl = (relativePath) => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;
    const apiBaseUrl = process.env.REACT_APP_API_URL || "";
    const serverBaseUrl = apiBaseUrl.replace('/api', '');
    return `${serverBaseUrl}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
  };

  // 3. CORRIGER handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData();
      if (logoFile) form.append('logo', logoFile);
      if (imageFile) form.append('image', imageFile);
      if (videoFile) form.append('video', videoFile);
      form.append('title', title);
      form.append('subtitle', subtitle);

      const res = await api.post('/admin/info-accueil', form);

      setInfo(res.data);
      alert('Mis à jour avec succès');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la sauvegarde.';
      console.error(err);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col md="8" className="mx-auto">
          <Card>
            <CardBody>
              <h4>Paramètres de la page d'accueil</h4>
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label>Logo (PNG / JPG)</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} />
                  <div className="mt-2">
                    {/* **ÉTAPE 2 : Utiliser `assetUrl` pour l'aperçu** */}
                    {info?.logo_path && <img src={assetUrl(info.logo_path)} alt="logo" style={{ width: 120 }} />}
                    {logoFile && <div className="mt-2"><small>Prévisualisation : </small><br/><img src={URL.createObjectURL(logoFile)} alt="preview" style={{ width: 120 }} /></div>}
                  </div>
                </FormGroup>

                <FormGroup>
                  <Label>Image d'arrière-plan (fallback)</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
                  <div className="mt-2">
                    {/* **ÉTAPE 2 : Utiliser `assetUrl` pour l'aperçu** */}
                    {info?.hero_image_path && <img src={assetUrl(info.hero_image_path)} alt="hero" style={{ width: 240 }} />}
                    {imageFile && <div className="mt-2"><img src={URL.createObjectURL(imageFile)} alt="preview" style={{ width: 240 }} /></div>}
                  </div>
                </FormGroup>

                <FormGroup>
                  <Label>Vidéo (mp4 / webm)</Label>
                  <Input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} />
                  <div className="mt-2">
                     {/* **ÉTAPE 2 : Utiliser `assetUrl` pour l'aperçu** */}
                    {info?.hero_video_path && (
                      <video width="320" controls src={assetUrl(info.hero_video_path)} />
                    )}
                    {videoFile && (
                      <div className="mt-2">
                        <small>Prévisualisation locale :</small><br />
                        <video width="320" controls src={URL.createObjectURL(videoFile)} />
                      </div>
                    )}
                  </div>
                </FormGroup>

                <FormGroup>
                  <Label>Titre</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </FormGroup>

                <FormGroup>
                  <Label>Sous-titre</Label>
                  <Input type="textarea" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                </FormGroup>

                <div className="text-right">
                  <Button color="primary" type="submit" disabled={loading}>
                    {loading ? <><Spinner size="sm" /> Sauvegarde...</> : "Sauvegarder"}
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminLandingSettings;