import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, CardHeader, Container, Row, Col, Table, Spinner, Input, InputGroup, InputGroupAddon, InputGroupText, Badge,
  UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, CardFooter, Pagination, PaginationItem, PaginationLink
} from "reactstrap";
import api from '../../services/api';

const AdminManageUser = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 7;

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
                  <Col xs="8"><h3 className="mb-0">Gestion Utilisateurs Mobiles</h3></Col>
                  <Col xs="4" className="text-right">
                    <InputGroup className="input-group-alternative input-group-sm">
                      <InputGroupAddon addonType="prepend">
                        <InputGroupText><i className="fas fa-search" /></InputGroupText>
                      </InputGroupAddon>
                      <Input placeholder="Rechercher..." type="text" onChange={e => {setSearchTerm(e.target.value); setPage(1);}} />
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
                  {loading ? <tr><td colSpan="6" className="text-center"><Spinner/></td></tr> : currentUsers.map(user => (
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
      </Container>
    </>
  );
};

export default AdminManageUser;