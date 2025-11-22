// src/views/admin/AdminLandingSettings.js
import React, { useEffect, useState, useCallback } from "react";
import {
  Card, CardHeader, CardBody, Container, Row, Col,
  Form, FormGroup, Label, Input, Button, Spinner, Alert
} from "reactstrap";
import api from "../../services/api";
import { getMediaUrl } from "../../utils/mediaUrl";

// --- HEADER STYLE IDENTIQUE AU DASHBOARD ---
const AdminLandingHeader = ({ title }) => (
  <div className="header bg-gradient-primary pb-8 pt-5 pt-md-8">
    <Container fluid>
      <div className="header-body text-white">
        <h1 className="display-4 font-weight-bold">
          {title || "Paramètres de la page d'accueil"}
        </h1>
      </div>
    </Container>
  </div>
);

const AdminLandingSettings = () => {
  const [info, setInfo] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  // Nouveaux champs
  const [ecosystemTitle, setEcosystemTitle] = useState("");
  const [ecosystemDescription, setEcosystemDescription] = useState("");

  const [advertisersTitle, setAdvertisersTitle] = useState("");
  const [advertisersDescription, setAdvertisersDescription] = useState("");
  const [advertisersFeatures, setAdvertisersFeatures] = useState("");
  const [advertisersImageFile, setAdvertisersImageFile] = useState(null);

  const [usersTitle, setUsersTitle] = useState("");
  const [usersDescription, setUsersDescription] = useState("");
  const [usersFeatures, setUsersFeatures] = useState("");
  const [usersImageFile, setUsersImageFile] = useState(null);

  const [testimonialText, setTestimonialText] = useState("");
  const [testimonialAuthor, setTestimonialAuthor] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // --- Récupération initiale ---
  const fetchInfo = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/info-accueil");
      if (data) {
        setInfo(data);
        setTitle(data.title || "");
        setSubtitle(data.subtitle || "");

        setEcosystemTitle(data.ecosystem_title || "");
        setEcosystemDescription(data.ecosystem_description || "");

        setAdvertisersTitle(data.advertisers_title || "");
        setAdvertisersDescription(data.advertisers_description || "");
        setAdvertisersFeatures(JSON.stringify(data.advertisers_features || [], null, 2));

        setUsersTitle(data.users_title || "");
        setUsersDescription(data.users_description || "");
        setUsersFeatures(JSON.stringify(data.users_features || [], null, 2));

        setTestimonialText(data.testimonial_text || "");
        setTestimonialAuthor(data.testimonial_author || "");
      }
    } catch (err) {
      console.error("Erreur chargement infos:", err);
      setMessage({ type: "error", text: "Erreur lors du chargement des données" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  // --- Soumission formulaire ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      if (logoFile) formData.append("logo", logoFile);
      if (imageFile) formData.append("image", imageFile);
      if (videoFile) formData.append("video", videoFile);
      if (advertisersImageFile) formData.append("advertisers_image", advertisersImageFile);
      if (usersImageFile) formData.append("users_image", usersImageFile);

      formData.append("title", title);
      formData.append("subtitle", subtitle);

      formData.append("ecosystem_title", ecosystemTitle);
      formData.append("ecosystem_description", ecosystemDescription);

      formData.append("advertisers_title", advertisersTitle);
      formData.append("advertisers_description", advertisersDescription);
      formData.append("advertisers_features", advertisersFeatures);

      formData.append("users_title", usersTitle);
      formData.append("users_description", usersDescription);
      formData.append("users_features", usersFeatures);

      formData.append("testimonial_text", testimonialText);
      formData.append("testimonial_author", testimonialAuthor);

      const { data } = await api.post("/admin/info-accueil", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setInfo(data);
      setLogoFile(null);
      setImageFile(null);
      setVideoFile(null);
      setAdvertisersImageFile(null);
      setUsersImageFile(null);

      setMessage({ type: "success", text: "Mise à jour réussie !" });
      await fetchInfo();
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      const errorMessage = err.response?.data?.message || "Erreur lors de la sauvegarde.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  // --- Prévisualisation média ---
  const MediaPreview = ({ path, alt, type = "image", width = 200 }) => {
    if (!path) return null;
    const url = getMediaUrl(path);
    return type === "video" ? (
      <video width={width} controls src={url} className="mt-2 rounded shadow" />
    ) : (
      <img src={url} alt={alt} width={width} className="mt-2 rounded shadow" />
    );
  };

  return (
    <>
      <AdminLandingHeader title="Paramètres Accueil" />
      <Container className="mt--7" fluid>
        <Row>
          <Col xl="8" className="mx-auto">
            <Card className="shadow">
              <CardHeader>
                <h3 className="mb-0">Configuration de la page d'accueil</h3>
              </CardHeader>
              <CardBody>
                {message.text && (
                  <Alert color={message.type === "success" ? "success" : "danger"}>
                    {message.text}
                  </Alert>
                )}

                {loading ? (
                  <div className="text-center p-5">
                    <Spinner color="primary" />
                  </div>
                ) : (
                  <Form onSubmit={handleSubmit}>
                    <h6 className="heading-small text-muted mb-4">Héro (Haut de page)</h6>
                    <div className="pl-lg-4">
                      <FormGroup>
                        <Label>Logo</Label>
                        <Input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} />
                        {info?.logo_path && <MediaPreview path={info.logo_path} alt="Logo actuel" />}
                        {logoFile && <MediaPreview path={URL.createObjectURL(logoFile)} alt="Nouveau logo" />}
                      </FormGroup>

                      <FormGroup>
                        <Label>Image d'arrière-plan</Label>
                        <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
                        {info?.hero_image_path && <MediaPreview path={info.hero_image_path} alt="Image actuelle" width={300} />}
                        {imageFile && <MediaPreview path={URL.createObjectURL(imageFile)} alt="Nouvelle image" width={300} />}
                      </FormGroup>

                      <FormGroup>
                        <Label>Vidéo de fond</Label>
                        <Input type="file" accept="video/mp4,video/webm" onChange={e => setVideoFile(e.target.files[0])} />
                        {info?.hero_video_path && <MediaPreview path={info.hero_video_path} alt="Vidéo actuelle" type="video" width={320} />}
                        {videoFile && <MediaPreview path={URL.createObjectURL(videoFile)} alt="Nouvelle vidéo" type="video" width={320} />}
                      </FormGroup>

                      <FormGroup>
                        <Label>Titre principal</Label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} />
                      </FormGroup>

                      <FormGroup>
                        <Label>Sous-titre</Label>
                        <Input type="textarea" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
                      </FormGroup>
                    </div>

                    <hr className="my-4" />
                    <h6 className="heading-small text-muted mb-4">Section Écosystème</h6>
                    <div className="pl-lg-4">
                      <FormGroup>
                        <Label>Titre Écosystème</Label>
                        <Input value={ecosystemTitle} onChange={e => setEcosystemTitle(e.target.value)} />
                      </FormGroup>
                      <FormGroup>
                        <Label>Description Écosystème</Label>
                        <Input type="textarea" rows="3" value={ecosystemDescription} onChange={e => setEcosystemDescription(e.target.value)} />
                      </FormGroup>
                    </div>

                    <hr className="my-4" />
                    <h6 className="heading-small text-muted mb-4">Section Annonceurs</h6>
                    <div className="pl-lg-4">
                      <FormGroup>
                        <Label>Titre Annonceurs</Label>
                        <Input value={advertisersTitle} onChange={e => setAdvertisersTitle(e.target.value)} />
                      </FormGroup>
                      <FormGroup>
                        <Label>Description Annonceurs</Label>
                        <Input type="textarea" rows="3" value={advertisersDescription} onChange={e => setAdvertisersDescription(e.target.value)} />
                      </FormGroup>
                      <FormGroup>
                        <Label>Fonctionnalités (Format JSON : ["Feature 1", "Feature 2"])</Label>
                        <Input type="textarea" rows="5" value={advertisersFeatures} onChange={e => setAdvertisersFeatures(e.target.value)} />
                        <small className="text-muted">Entrez une liste de textes entre guillemets, séparés par des virgules, le tout entre crochets.</small>
                      </FormGroup>
                      <FormGroup>
                        <Label>Image Annonceurs (Remplace le graphique 3D)</Label>
                        <Input type="file" accept="image/*" onChange={e => setAdvertisersImageFile(e.target.files[0])} />
                        {info?.advertisers_image_path && <MediaPreview path={info.advertisers_image_path} alt="Image Annonceurs" width={300} />}
                        {advertisersImageFile && <MediaPreview path={URL.createObjectURL(advertisersImageFile)} alt="Nouvelle image" width={300} />}
                      </FormGroup>
                    </div>

                    <hr className="my-4" />
                    <h6 className="heading-small text-muted mb-4">Section Utilisateurs</h6>
                    <div className="pl-lg-4">
                      <FormGroup>
                        <Label>Titre Utilisateurs</Label>
                        <Input value={usersTitle} onChange={e => setUsersTitle(e.target.value)} />
                      </FormGroup>
                      <FormGroup>
                        <Label>Description Utilisateurs</Label>
                        <Input type="textarea" rows="3" value={usersDescription} onChange={e => setUsersDescription(e.target.value)} />
                      </FormGroup>
                      <FormGroup>
                        <Label>Fonctionnalités (Format JSON : ["Feature 1", "Feature 2"])</Label>
                        <Input type="textarea" rows="5" value={usersFeatures} onChange={e => setUsersFeatures(e.target.value)} />
                        <small className="text-muted">Entrez une liste de textes entre guillemets, séparés par des virgules, le tout entre crochets.</small>
                      </FormGroup>
                      <FormGroup>
                        <Label>Image Utilisateurs (Remplace la pièce 3D)</Label>
                        <Input type="file" accept="image/*" onChange={e => setUsersImageFile(e.target.files[0])} />
                        {info?.users_image_path && <MediaPreview path={info.users_image_path} alt="Image Utilisateurs" width={300} />}
                        {usersImageFile && <MediaPreview path={URL.createObjectURL(usersImageFile)} alt="Nouvelle image" width={300} />}
                      </FormGroup>
                    </div>

                    <hr className="my-4" />
                    <h6 className="heading-small text-muted mb-4">Témoignage</h6>
                    <div className="pl-lg-4">
                      <FormGroup>
                        <Label>Texte du témoignage</Label>
                        <Input type="textarea" rows="3" value={testimonialText} onChange={e => setTestimonialText(e.target.value)} />
                      </FormGroup>
                      <FormGroup>
                        <Label>Auteur</Label>
                        <Input value={testimonialAuthor} onChange={e => setTestimonialAuthor(e.target.value)} />
                      </FormGroup>
                    </div>

                    <div className="text-right">
                      <Button color="primary" type="submit" disabled={saving}>
                        {saving ? <><Spinner size="sm" /> Sauvegarde…</> : "Sauvegarder"}
                      </Button>
                    </div>
                  </Form>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AdminLandingSettings;
