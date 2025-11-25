import React, { useState, useEffect, useCallback } from "react";
import {
  Card, CardHeader, Container, Row, Table, Spinner, Col, CardBody, CardTitle,
  UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, Badge,
  Pagination, PaginationItem, PaginationLink, CardFooter
} from "reactstrap";
import { Bar } from "react-chartjs-2";
import api from '../../services/api';
import { useWebSocket } from "../../contexts/WebSocketContext";

// Chart.js v3+ registration (important)
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// --- HEADER COMPONENT ---
const AdminDashboardHeader = ({ stats, wallet, userRole }) => (
  <div className="header bg-gradient-primary pb-8 pt-5 pt-md-8">
    <Container fluid>
      <div className="header-body">
        {/* Card stats */}
        <Row>
          {userRole === 'superadmin' && (
            <Col lg="6" xl="4">
              <Card className="card-stats mb-4 mb-xl-0">
                <CardBody>
                  <Row>
                    <div className="col">
                      <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                        Revenus Super Admin
                      </CardTitle>
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
          )}

          <Col lg="6" xl="4">
            <Card className="card-stats mb-4 mb-xl-0">
              <CardBody>
                <Row>
                  <div className="col">
                    <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                      Promoteurs Inscrits
                    </CardTitle>
                    <span className="h2 font-weight-bold mb-0">
                      {stats?.totalClients ?? <Spinner size="sm" />}
                    </span>
                  </div>
                  <Col className="col-auto">
                    <div className="icon icon-shape bg-warning text-white rounded-circle shadow">
                      <i className="fas fa-users" />
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>

          <Col lg="6" xl="4">
            <Card className="card-stats mb-4 mb-xl-0">
              <CardBody>
                <Row>
                  <div className="col">
                    <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                      Utilisateurs Mobiles
                    </CardTitle>
                    <span className="h2 font-weight-bold mb-0">
                      {stats?.totalUtilisateurs ?? <Spinner size="sm" />}
                    </span>
                  </div>
                  <Col className="col-auto">
                    <div className="icon icon-shape bg-info text-white rounded-circle shadow">
                      <i className="fas fa-mobile-alt" />
                    </div>
                  </Col>
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
    setCurrentPage(1); // Reset to first page when initialUsers change

    if (!socket) {
      console.warn('Socket non disponible pour OnlineUsersList (attente de connexion)');
      return;
    }

    const handleUsersUpdate = (updatedUsers) => {
      console.log("Événement 'update_online_users' reçu, mise à jour de la liste.", updatedUsers);
      setOnlineUsers(updatedUsers);
      setCurrentPage(1); // Reset to first page on update
    };

    socket.on('update_online_users', handleUsersUpdate);

    return () => {
      socket.off('update_online_users', handleUsersUpdate);
    };
  }, [initialUsers, socket]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = onlineUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(onlineUsers.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

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
            <tr>
              <td colSpan="3" className="text-center p-4">Aucun utilisateur connecté pour le moment.</td>
            </tr>
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
                  <span className="sr-only">Previous</span>
                </PaginationLink>
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem active={i + 1 === currentPage} key={i}>
                  <PaginationLink href="#pablo" onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem disabled={currentPage >= totalPages}>
                <PaginationLink href="#pablo" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}>
                  <i className="fas fa-angle-right" />
                  <span className="sr-only">Next</span>
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
  const [data, setData] = useState({
    clients: [], stats: { totalClients: null, totalUtilisateurs: null },
    activityByCommune: [], wallet: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Pagination state for clients
  const [clientsPage, setClientsPage] = useState(1);
  const clientsPerPage = 5;

  // Retrieve user role from localStorage
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
      setClientsPage(1); // Reset clients pagination to first page on data fetch

    } catch (err) {
      setError(err.message || "Erreur de chargement des données.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteClient = async (clientId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce promoteur ? Cette action est irréversible.")) {
      try {
        await api.delete(`/admin/client/${clientId}`);
        await fetchData();
      } catch (err) {
        const errorMessage = err.response?.data?.message || "Erreur lors de la suppression.";
        setError(errorMessage);
      }
    }
  };

  // Pagination logic for clients
  const indexOfLastClient = clientsPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = data.clients.slice(indexOfFirstClient, indexOfLastClient);
  const totalClientsPages = Math.ceil(data.clients.length / clientsPerPage);

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
      <style>{`
      h1, h2, h3, h4, h5, h6,
      .h1, .h2, .h3, .h4, .h5, .h6 {
        color: black;
        font-weight: 600;
      }
    `}</style>
      <AdminDashboardHeader stats={data.stats} wallet={data.wallet} userRole={userRole} />
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
                <h3 className="mb-0">Liste des Promoteurs</h3>
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
                        <tr key={client.id}>
                          <th scope="row">{client.prenom} {client.nom}</th>
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
                                <DropdownItem onClick={() => alert("Modification à venir")}>Modifier</DropdownItem>
                                <DropdownItem className="text-danger" onClick={() => handleDeleteClient(client.id)}>Bloqué</DropdownItem>
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
                              <span className="sr-only">Previous</span>
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
                              <span className="sr-only">Next</span>
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
            {loading ? (
              <div className="text-center"><Spinner /></div>
            ) : (
              <OnlineUsersList initialUsers={onlineUsers} />
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default DashboardAdmin;