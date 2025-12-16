import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; 
import {
  Card, CardHeader, Container, Row, Table, Spinner, Col, CardBody, CardTitle,
  UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, Badge,
  Pagination, PaginationItem, PaginationLink, CardFooter,
  Input, InputGroup, InputGroupAddon, InputGroupText
} from "reactstrap";
import { Bar } from "react-chartjs-2";
import api from '../../services/api';
import { useWebSocket } from "../../contexts/WebSocketContext";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- CORRECTION ICI : Ajout de 'totalRecharged' dans les props ---
const AdminDashboardHeader = ({ stats, wallet, userRole, totalRecharged }) => (
  <div className="header bg-gradient-primary pb-8 pt-5 pt-md-8">
    <Container fluid>
      <div className="header-body">
        <Row>
          {userRole === 'superadmin' && (
            <>
                {/* CARD 1: REVENUS SUPER ADMIN (ID=1) */}
                <Col lg="6" xl="3">
                  <Card className="card-stats mb-4 mb-xl-0">
                    <CardBody>
                      <Row>
                        <div className="col">
                          <CardTitle tag="h5" className="text-uppercase text-muted mb-0">Revenus Super Admin</CardTitle>
                          <span className="h2 font-weight-bold mb-0">
                            {wallet ? `${parseFloat(wallet.solde).toLocaleString('fr-FR')} FCFA` : <Spinner size="sm" />}
                          </span>
                        </div>
                        <Col className="col-auto">
                          <div className="icon icon-shape bg-success text-white rounded-circle shadow">
                            <i className="fas fa-wallet" />
                          </div>
                        </Col>
                      </Row>
                    </CardBody>
                  </Card>
                </Col>

                {/* CARD 2: FONDS DE DISTRIBUTION (ID=2) */}
                <Col lg="6" xl="3">
                  <Card className="card-stats mb-4 mb-xl-0">
                    <CardBody>
                      <Row>
                        <div className="col">
                          <CardTitle tag="h5" className="text-uppercase text-muted mb-0">Solde Distribution</CardTitle>
                          <span className="h2 font-weight-bold mb-0 text-primary">
                             {/* Affiche le solde du portefeuille de distribution */}
                             {totalRecharged !== undefined ? `${parseFloat(totalRecharged).toLocaleString('fr-FR')} FCFA` : <Spinner size="sm" />}
                          </span>
                        </div>
                        <Col className="col-auto">
                          <div className="icon icon-shape bg-blue text-white rounded-circle shadow">
                            <i className="fas fa-hand-holding-usd" />
                          </div>
                        </Col>
                      </Row>
                      <p className="mt-3 mb-0 text-muted text-sm">
                        <span className="text-nowrap">Fonds disponibles</span>
                      </p>
                    </CardBody>
                  </Card>
                </Col>
            </>
          )}
          
          {/* Autres Cards (Promoteurs, Utilisateurs) */}
          <Col lg="6" xl="3">
            <Card className="card-stats mb-4 mb-xl-0">
              <CardBody>
                <Row>
                  <div className="col"><CardTitle tag="h5" className="text-uppercase text-muted mb-0">Promoteurs</CardTitle><span className="h2 font-weight-bold mb-0">{stats?.totalClients ?? 0}</span></div>
                  <Col className="col-auto"><div className="icon icon-shape bg-warning text-white rounded-circle shadow"><i className="fas fa-users" /></div></Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
          <Col lg="6" xl="3">
            <Card className="card-stats mb-4 mb-xl-0">
              <CardBody>
                <Row>
                  <div className="col"><CardTitle tag="h5" className="text-uppercase text-muted mb-0">Utilisateurs</CardTitle><span className="h2 font-weight-bold mb-0">{stats?.totalUtilisateurs ?? 0}</span></div>
                  <Col className="col-auto"><div className="icon icon-shape bg-info text-white rounded-circle shadow"><i className="fas fa-mobile-alt" /></div></Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </Container>
  </div>
);
// --- ONLINE USERS LIST COMPONENT ---
const OnlineUsersList = ({ initialUsers }) => {
  const [onlineUsers, setOnlineUsers] = useState(initialUsers || []);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const socket = useWebSocket();

  useEffect(() => {
    setOnlineUsers(initialUsers);
    setCurrentPage(1);
    if (!socket) return;

    const handleUsersUpdate = (updatedUsers) => {
      setOnlineUsers(updatedUsers);
      setCurrentPage(1);
    };

    socket.on('update_online_users', handleUsersUpdate);
    return () => socket.off('update_online_users', handleUsersUpdate);
  }, [initialUsers, socket]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = onlineUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(onlineUsers.length / itemsPerPage);
  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Card className="shadow">
      <CardHeader className="border-0">
        <h3 className="mb-0">Utilisateurs Connectés ({onlineUsers.length})</h3>
      </CardHeader>
      <Table className="align-items-center table-flush" responsive>
        <thead className="thead-light">
          <tr>
            <th scope="col">Utilisateur</th>
            <th scope="col">Email</th>
            <th scope="col">Dernière Connexion</th>
          </tr>
        </thead>
        <tbody>
          {currentUsers.length > 0 ? (
            currentUsers.map(user => (
              <tr key={user.id}>
                <th scope="row">
                  <div className="d-flex align-items-center">
                    <img alt="..." src={user.photo_profil || require("../../assets/img/theme/team-4-800x800.jpg")} className="avatar rounded-circle mr-3" />
                    <span>{user.nom_utilisateur}</span>
                  </div>
                </th>
                <td>{user.email}</td>
                <td>{new Date(user.derniere_connexion).toLocaleString('fr-FR')}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="3" className="text-center p-4">Aucun utilisateur connecté.</td></tr>
          )}
        </tbody>
      </Table>
      {totalPages > 1 && (
        <CardFooter className="py-4">
          <nav aria-label="...">
            <Pagination className="pagination justify-content-end mb-0" listClassName="justify-content-end mb-0">
              <PaginationItem disabled={currentPage <= 1}>
                <PaginationLink href="#pablo" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}>
                  <i className="fas fa-angle-left" />
                </PaginationLink>
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem active={i + 1 === currentPage} key={i}>
                  <PaginationLink href="#pablo" onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }}>{i + 1}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem disabled={currentPage >= totalPages}>
                <PaginationLink href="#pablo" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}>
                  <i className="fas fa-angle-right" />
                </PaginationLink>
              </PaginationItem>
            </Pagination>
          </nav>
        </CardFooter>
      )}
    </Card>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
const DashboardAdmin = () => {
  const navigate = useNavigate(); 
  
  const [data, setData] = useState({
    clients: [], 
    stats: { totalClients: null, totalUtilisateurs: null },
    activityByCommune: [], 
    wallet: null,
    totalRecharged: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [clientsPage, setClientsPage] = useState(1);
  const clientsPerPage = 5;
  const userRole = localStorage.getItem('userRole');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardRes, onlineUsersRes] = await Promise.all([
        api.get('/admin/dashboard-data'),
        api.get('/admin/online-users')
      ]);
      setData(dashboardRes.data);
      setOnlineUsers(onlineUsersRes.data);
      setClientsPage(1);
    } catch (err) {
      setError(err.message || "Erreur de chargement des données.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredClients = data.clients.filter(client =>
    client.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.nom_entreprise?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClient = async (clientId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce promoteur ?")) {
      try {
        await api.delete(`/admin/client/${clientId}`);
        await fetchData();
      } catch (err) {
        setError(err.response?.data?.message || "Erreur lors de la suppression.");
      }
    }
  };

  const handleEditClick = (clientId) => {
    navigate(`/admin/client-details/${clientId}`);
  };

  const indexOfLastClient = clientsPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);
  const totalClientsPages = Math.ceil(filteredClients.length / clientsPerPage);

  const handleClientsPageChange = (pageNumber) => {
    setClientsPage(pageNumber);
  };

  const chartData = {
    labels: data.activityByCommune.map((item) => item.commune),
    datasets: [{
      label: "Nombre de Promotions",
      data: data.activityByCommune.map((item) => item.activity_count),
      backgroundColor: "#5e72e4"
    }]
  };

  return (
    <>
      <style>{` h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6 { color: black; font-weight: 600; } `}</style>
      
      {/* On passe totalRecharged au composant Header */}
    <AdminDashboardHeader 
          stats={data.stats} 
          wallet={data.wallet} 
          totalRecharged={data.totalRecharged} // C'est ici que la donnée passe
          userRole={userRole} 
      />
      
      <Container className="mt--7" fluid>
        <Row className="mb-4">
          <Col>
            <Card className="shadow">
              <CardHeader><h3 className="mb-0">Activité par Commune</h3></CardHeader>
              <CardBody>
                {loading ? <Spinner /> : <Bar data={chartData} options={{ responsive: true }} />}
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col className="mb-5 mb-xl-0" xl="12">
            <Card className="shadow">
              <CardHeader className="border-0">
                <Row className="align-items-center">
                  <Col xs="8">
                    <h3 className="mb-0">Liste des Promoteurs</h3>
                  </Col>
                  <Col xs="4" className="text-right">
                    <InputGroup className="input-group-alternative input-group-sm">
                      <InputGroupAddon addonType="prepend">
                        <InputGroupText>
                          <i className="fas fa-search" />
                        </InputGroupText>
                      </InputGroupAddon>
                      <Input
                        placeholder="Rechercher..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setClientsPage(1); }}
                      />
                    </InputGroup>
                  </Col>
                </Row>
              </CardHeader>
              {loading ? (
                <div className="text-center p-4"><Spinner /></div>
              ) : error ? (
                <div className="text-center p-4 text-danger">{error}</div>
              ) : (
                <>
                  <Table className="align-items-center table-flush" responsive>
                    <thead className="thead-light">
                      <tr>
                        <th scope="col">Nom Complet</th>
                        <th scope="col">Email</th>
                        <th scope="col">Commune</th>
                        <th scope="col">Solde</th>
                        <th scope="col">Statut</th>
                        <th scope="col" />
                      </tr>
                    </thead>
                    <tbody>
                      {currentClients.map((client) => (
                        <tr key={client.id} className={client.est_bloque ? "bg-lighter text-muted" : ""}>
                          <th scope="row">
                            {client.prenom} {client.nom}
                            {client.est_bloque && <Badge color="danger" className="ml-2">Bloqué</Badge>}
                          </th>
                          <td>{client.email}</td>
                          <td>{client.commune}</td>
                          <td>{parseFloat(client.solde_recharge || 0).toLocaleString("fr-FR")} FCFA</td>
                          <td>
                            <Badge color={client.est_verifie ? "success" : "warning"} pill>
                              {client.est_verifie ? "Vérifié" : "Non vérifié"}
                            </Badge>
                          </td>
                          <td className="text-right">
                            <UncontrolledDropdown>
                              <DropdownToggle className="btn-icon-only text-light" role="button" size="sm" color="" onClick={(e) => e.preventDefault()}>
                                <i className="fas fa-ellipsis-v" />
                              </DropdownToggle>
                              <DropdownMenu className="dropdown-menu-arrow" right>
                                <DropdownItem onClick={() => handleEditClick(client.id)}>Modifier / Détails</DropdownItem>
                                <DropdownItem className="text-danger" onClick={() => handleDeleteClient(client.id)}>Supprimer</DropdownItem>
                              </DropdownMenu>
                            </UncontrolledDropdown>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  {totalClientsPages > 1 && (
                    <CardFooter className="py-4">
                      <nav aria-label="...">
                        <Pagination className="pagination justify-content-end mb-0" listClassName="justify-content-end mb-0">
                          <PaginationItem disabled={clientsPage <= 1}>
                            <PaginationLink href="#pablo" onClick={(e) => { e.preventDefault(); handleClientsPageChange(clientsPage - 1); }}>
                              <i className="fas fa-angle-left" />
                            </PaginationLink>
                          </PaginationItem>
                          {[...Array(totalClientsPages)].map((_, i) => (
                            <PaginationItem active={i + 1 === clientsPage} key={i}>
                              <PaginationLink href="#pablo" onClick={(e) => { e.preventDefault(); handleClientsPageChange(i + 1); }}>
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem disabled={clientsPage >= totalClientsPages}>
                            <PaginationLink href="#pablo" onClick={(e) => { e.preventDefault(); handleClientsPageChange(clientsPage + 1); }}>
                              <i className="fas fa-angle-right" />
                            </PaginationLink>
                          </PaginationItem>
                        </Pagination>
                      </nav>
                    </CardFooter>
                  )}
                </>
              )}
            </Card>
          </Col>
        </Row>

        <Row className="mt-5">
          <Col className="mb-5 mb-xl-0" xl="12">
            {loading ? <div className="text-center"><Spinner /></div> : <OnlineUsersList initialUsers={onlineUsers} />}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default DashboardAdmin;