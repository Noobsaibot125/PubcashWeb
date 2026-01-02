import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, CardHeader, Container, Row, Col, Table, Spinner, Input, InputGroup, InputGroupAddon, InputGroupText, Badge,
  UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, CardFooter, Pagination, PaginationItem, PaginationLink,
  Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Button
} from "reactstrap";
import api from '../../services/api';

const AdminManageUser = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 7;

  // --- NOUVEAU: State pour la modale d'envoi de message ---
  const [modalOpen, setModalOpen] = useState(false);
  const [msgData, setMsgData] = useState({
    titre: "",
    contenu: "",
    target_type: "random", // 'random' ou 'specific' (pour plus tard)
    target_value: 10
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      alert("Erreur chargement utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!msgData.titre || !msgData.contenu) {
      alert("Veuillez remplir le titre et le contenu.");
      return;
    }
    setSending(true);
    try {
      await api.post('/notifications/admin/send', {
        titre: msgData.titre,
        contenu: msgData.contenu,
        target_type: msgData.target_type,
        target_value: parseInt(msgData.target_value)
      });
      alert("Messages envoyés avec succès !");
      setModalOpen(false);
      setMsgData({ titre: "", contenu: "", target_type: "random", target_value: 10 });
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi : " + (err.response?.data?.message || err.message));
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(u =>
    (u.nom_utilisateur || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.contact || "").includes(searchTerm)
  );

  // Pagination
  const indexOfLast = page * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  return (
    <>
      <div className="header bg-gradient-primary pb-8 pt-5 pt-md-8">
        <Container fluid><div className="header-body"></div></Container>
      </div>
      <Container className="mt--7" fluid>
        <Row>
          <Col>
            <Card className="shadow">
              <CardHeader className="border-0">
                <Row className="align-items-center">
                  <Col xs="6"><h3 className="mb-0">Gestion Utilisateurs Mobiles</h3></Col>

                  {/* BOUTON D'ENVOI DE MESSAGE */}
                  <Col xs="6" className="text-right d-flex justify-content-end align-items-center">
                    <Button color="success" size="sm" className="mr-3" onClick={() => setModalOpen(true)}>
                      <i className="ni ni-send mr-1" /> Envoyer Message
                    </Button>

                    <InputGroup className="input-group-alternative input-group-sm" style={{ width: 200 }}>
                      <InputGroupAddon addonType="prepend">
                        <InputGroupText><i className="fas fa-search" /></InputGroupText>
                      </InputGroupAddon>
                      <Input placeholder="Rechercher..." type="text" onChange={e => { setSearchTerm(e.target.value); setPage(1); }} />
                    </InputGroup>
                  </Col>
                </Row>
              </CardHeader>
              <Table className="align-items-center table-flush" responsive>
                <thead className="thead-light">
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email / Contact</th>
                    <th>Commune</th>
                    <th>Solde</th>
                    <th>Statut</th>
                    <th scope="col" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? <tr><td colSpan="6" className="text-center"><Spinner /></td></tr> : currentUsers.map(user => (
                    <tr key={user.id} className={user.est_bloque ? "bg-lighter text-muted" : ""}>
                      <th scope="row">
                        <div className="d-flex align-items-center">
                          <span className="avatar avatar-sm rounded-circle mr-3">
                            <img alt="..." src={user.photo_profil || require("../../assets/img/theme/team-4-800x800.jpg")} />
                          </span>
                          <div className="media-body">
                            <span className="mb-0 text-sm font-weight-bold">{user.nom_utilisateur}</span>
                          </div>
                        </div>
                      </th>
                      <td>{user.email || user.contact}</td>
                      <td>{user.commune_choisie}</td>
                      <td>{user.remuneration_utilisateur} FCFA</td>
                      <td>
                        {user.est_bloque ? <Badge color="danger">Bloqué</Badge> : <Badge color="success">Actif</Badge>}
                      </td>
                      <td className="text-right">
                        <UncontrolledDropdown>
                          <DropdownToggle className="btn-icon-only text-light" role="button" size="sm" color="" onClick={e => e.preventDefault()}>
                            <i className="fas fa-ellipsis-v" />
                          </DropdownToggle>
                          <DropdownMenu className="dropdown-menu-arrow" right>
                            <DropdownItem onClick={() => navigate(`/admin/user-details/${user.id}`)}>
                              Détails / Modifier
                            </DropdownItem>
                          </DropdownMenu>
                        </UncontrolledDropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {/* Pagination simple */}
              {totalPages > 1 && (
                <CardFooter className="py-4">
                  <nav>
                    <Pagination className="justify-content-end mb-0">
                      {[...Array(totalPages)].map((_, i) => (
                        <PaginationItem active={i + 1 === page} key={i}>
                          <PaginationLink onClick={() => setPage(i + 1)}>{i + 1}</PaginationLink>
                        </PaginationItem>
                      ))}
                    </Pagination>
                  </nav>
                </CardFooter>
              )}
            </Card>
          </Col>
        </Row>

        {/* --- MODAL D'ENVOI DE MESSAGE --- */}
        <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
          <ModalHeader toggle={() => setModalOpen(!modalOpen)}>Envoyer une Notification (Aléatoire)</ModalHeader>
          <ModalBody>
            <Form>
              <FormGroup>
                <Label>Titre du message</Label>
                <Input
                  type="text"
                  placeholder="Ex: Bonus Spécial !"
                  value={msgData.titre}
                  onChange={e => setMsgData({ ...msgData, titre: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>Contenu</Label>
                <Input
                  type="textarea"
                  rows="3"
                  placeholder="Votre message ici..."
                  value={msgData.contenu}
                  onChange={e => setMsgData({ ...msgData, contenu: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>Nombre d'utilisateurs (Aléatoire)</Label>
                <Input
                  type="number"
                  value={msgData.target_value}
                  onChange={e => setMsgData({ ...msgData, target_value: e.target.value })}
                />
                <small className="text-muted">Le message sera envoyé à ce nombre d'utilisateurs actifs choisis au hasard.</small>
              </FormGroup>
              <div className="alert alert-warning py-2 small">
                <i className="fas fa-info-circle mr-1"></i>
                Note : Pour l'instant, cela envoie une <strong>Notification Push</strong>. L'option SMS sera disponible plus tard.
              </div>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button color="primary" onClick={handleSendMessage} disabled={sending}>
              {sending ? <Spinner size="sm" /> : <><i className="ni ni-send" /> Envoyer</>}
            </Button>
          </ModalFooter>
        </Modal>

      </Container>
    </>
  );
};

export default AdminManageUser;