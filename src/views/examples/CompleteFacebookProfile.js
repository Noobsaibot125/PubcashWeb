import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  FormGroup,
  Form,
  Input,
  InputGroupAddon,
  InputGroupText,
  InputGroup,
  Container,
  Label
} from "reactstrap";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from 'services/api';
import { jwtDecode } from "jwt-decode";

const CompleteFacebookProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ville_id: "",
    commune_choisie: "",
    date_naissance: "",
    contact: "",
    genre: "M"
  });

  const [villes, setVilles] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [loadingVilles, setLoadingVilles] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  const accessToken = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!accessToken) {
      navigate('/auth/login-user');
    }
  }, [accessToken, navigate]);

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

  useEffect(() => {
    const fetchCommunes = async () => {
      if (!formData.ville_id) {
        setCommunes([]);
        setFormData((f) => ({ ...f, commune_choisie: "" }));
        return;
      }
      try {
        setLoadingCommunes(true);
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

    if (name === "ville_id") {
      setFormData(prev => ({ ...prev, commune_choisie: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.ville_id || !formData.commune_choisie || !formData.date_naissance || !formData.contact || !formData.genre) {
      toast.error('Tous les champs sont obligatoires.');
      return;
    }

    try {
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
              <div className="text-center text-muted mb-4">
                <small>Complétez votre profil pour continuer</small>
              </div>
              <Form role="form" onSubmit={handleSubmit}>
                <FormGroup>
                  <Label>Ville</Label>
                  <Input
                    type="select"
                    name="ville_id"
                    value={formData.ville_id}
                    onChange={handleChange}
                    disabled={loadingVilles}
                  >
                    <option value="">Sélectionnez une ville</option>
                    {villes.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nom_ville}
                      </option>
                    ))}
                  </Input>
                </FormGroup>

                <FormGroup>
                  <Label>Commune</Label>
                  <Input
                    type="select"
                    name="commune_choisie"
                    value={formData.commune_choisie}
                    onChange={handleChange}
                    disabled={!formData.ville_id || loadingCommunes}
                  >
                    <option value="">Sélectionnez une commune</option>
                    {communes.map((c) => (
                      <option key={c.id} value={c.nom_commune}>
                        {c.nom_commune}
                      </option>
                    ))}
                  </Input>
                </FormGroup>

                <FormGroup>
                  <Label>Date de Naissance</Label>
                  <InputGroup className="input-group-alternative">
                    <InputGroupAddon addonType="prepend">
                      <InputGroupText><i className="ni ni-calendar-grid-58" /></InputGroupText>
                    </InputGroupAddon>
                    <Input
                      placeholder="Date de naissance"
                      type="date"
                      name="date_naissance"
                      value={formData.date_naissance}
                      onChange={handleChange}
                    />
                  </InputGroup>
                </FormGroup>

                <FormGroup>
                  <Label>Contact (Téléphone)</Label>
                  <InputGroup className="input-group-alternative">
                    <InputGroupAddon addonType="prepend">
                      <InputGroupText><i className="ni ni-mobile-button" /></InputGroupText>
                    </InputGroupAddon>
                    <Input
                      placeholder="Votre numéro de téléphone"
                      type="text"
                      name="contact"
                      value={formData.contact}
                      onChange={handleChange}
                    />
                  </InputGroup>
                </FormGroup>

                <FormGroup>
                  <Label>Genre</Label>
                  <div className="d-flex">
                    <div className="custom-control custom-radio mb-3 mr-3">
                      <input
                        className="custom-control-input"
                        id="customRadio1"
                        name="genre"
                        type="radio"
                        value="M"
                        checked={formData.genre === "M"}
                        onChange={handleChange}
                      />
                      <label className="custom-control-label" htmlFor="customRadio1">Homme</label>
                    </div>
                    <div className="custom-control custom-radio mb-3">
                      <input
                        className="custom-control-input"
                        id="customRadio2"
                        name="genre"
                        type="radio"
                        value="F"
                        checked={formData.genre === "F"}
                        onChange={handleChange}
                      />
                      <label className="custom-control-label" htmlFor="customRadio2">Femme</label>
                    </div>
                  </div>
                </FormGroup>

                <div className="text-center">
                  <Button className="my-4" color="primary" type="submit">
                    Enregistrer et Continuer
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