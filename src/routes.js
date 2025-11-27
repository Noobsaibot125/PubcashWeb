/*!

=========================================================
* Argon Dashboard React - v1.2.4
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-react
* Copyright 2024 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/argon-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import Index from "views/Index.js";
import DashboardAdmin from "views/admin/DashboardAdmin.js";
import ProfileAdmin from "views/admin/ProfileAdmin.js";
import Profile from "views/examples/Profile.js";
import VerifyOTP from "views/examples/VerifyOTP.js";
import Register from "views/examples/Register.js";
import RegisterAdmin from "views/examples/RegisterAdmin.js";
// import Login from "views/examples/Login.js";
import LoginClient from "views/examples/LoginClient.js";
import LoginAdmin from "views/examples/LoginAdmin.js";
import LoginUser from "views/examples/LoginUser.js";
import CreerPromotion from "views/examples/CreerPromotion.js"; // Exemple de page future
import MonCompte from "views/examples/MonCompte.js"; // Exemple de page future
import HistoriquePromotions from "views/examples/HistoriquePromotions.js";
import AjouterCommune from "views/admin/AjouterCommune.js";
import RegisterUser from "views/examples/RegisterUser.js";
import HistoriqueDesVideos from "views/HistoriqueDesVideos.js";
import WithdrawalRequests from "views/examples/WithdrawalRequests.js";
import AjoutAdmin from "views/admin/AjoutAdmin.js";
import AdminLandingSettings from "views/admin/AdminLandingSettings.js";
import UserView from "views/UserView.js";
import UserProfile from "views/UserProfile.js";
import ForgotPassword from "views/examples/ForgotPassword.js";
import Choice from "views/examples/Choice.js";
import GameHub from "views/Games/GameHub.js";
import GameManagement from "views/admin/GameManagement.js";
var routes = [
  {
    path: "/index",
    name: "Mon Tableau de Bord",
    icon: "ni ni-tv-2 text-primary",
    component: <Index />,
    layout: "/client", // IMPORTANT : Le layout est maintenant /client
    role: "client",
  },
  {
    path: "/creer-promotion",
    name: "Créer une Promotion",
    icon: "ni ni-send text-blue",
    component: <CreerPromotion />,
    layout: "/client",
    role: "client",
  },
  {
    path: "/forgot-password",
    name: "Mot de passe oublié",
    component: <ForgotPassword />,
    layout: "/auth", // C'EST ICI QUE LE BACKGROUND EST DÉFINI
  },
  {
    path: "/dashboard",
    name: "Dashboard Admin",
    icon: "ni ni-tv-2 text-primary",
    component: <DashboardAdmin />,
    layout: "/admin",
    role: ["superadmin", "admin"],
  },
  {
    path: "/mon-compte",
    name: "Mon Compte",
    icon: "ni ni-money-coins text-yellow",
    component: <MonCompte />,
    layout: "/client",
    role: "client",
  },
  {
    path: "/communes",
    name: "Ajouter une commune",
    icon: "ni ni-pin-3 text-orange",
    component: <AjouterCommune />,
    layout: "/admin",
    role: "superadmin",
  },
  {
    path: "/WithdrawalRequests",
    name: "Retrait",
    icon: "ni ni-tv-2 text-primary",
    component: <WithdrawalRequests />,
    layout: "/admin",
    role: ["superadmin", "admin"],
  },

  {
    path: "/historique",
    name: "Historique des Promotions",
    icon: "ni ni-archive-2 text-info",
    component: <HistoriquePromotions />,
    layout: "/client",
    role: "client",
  },

  {
    path: "/user-profile",
    name: "Mon Profil",
    icon: "ni ni-single-02 text-yellow",
    component: <Profile />,
    // Le layout est déterminé dynamiquement dans la Sidebar. On peut omettre ici
    // ou spécifier les deux. Pour la sidebar, le rôle est plus important.
    layout: "/client",
    role: "client",
  },
  {
    path: "/profile",
    name: "Mon Profil",
    icon: "ni ni-single-02 text-yellow",
    component: <ProfileAdmin />,
    layout: "/admin",
    role: ["superadmin", "admin"],
  },
  // AJOUTEZ CES TROIS NOUVELLES ROUTES
  {
    path: "/login-client",
    name: "Login Client",
    component: <LoginClient />,
    layout: "/auth",
  },
  {
    path: "/login-admin",
    name: "Login Admin",
    component: <LoginAdmin />,
    layout: "/auth",
  },
  {
    path: "/login-user",
    name: "Login Utilisateur",
    component: <LoginUser />,
    layout: "/auth",
  },
  {
    path: "/choice",
    name: "User Choice",
    icon: "ni ni-ui-04 text-info", // Choisissez une icône si nécessaire
    component: <Choice />,
    layout: "/auth", // Important: ce layout correspond à l'URL /auth/choice
  },
  {
    path: "/register",
    name: "Register",
    icon: "ni ni-circle-08 text-pink",
    component: <Register />,
    layout: "/auth",
  },
  {
    path: "/register-admin",
    // PAS DE PROPRIÉTÉ "name", donc invisible dans les menus
    component: <RegisterAdmin />, // Le composant que nous avons créé
    layout: "/auth",
    // Pas besoin de rôle, car c'est une page publique (mais cachée)
  },
  {
    path: "/verify-otp",
    component: <VerifyOTP />,
    layout: "/auth",
  },
  {
    path: "/ajout-admin",
    name: "Gérer les Admins",
    icon: "ni ni-badge text-info",
    component: <AjoutAdmin />,
    layout: "/admin",
    role: "superadmin", // Reste une simple chaîne
  },
  {
    path: "/register-user",
    component: <RegisterUser />,
    layout: "/auth",
  },

  {
    path: "/landing-settings",
    name: "Landing Page",
    icon: "ni ni-planet text-info",
    component: <AdminLandingSettings />,
    layout: "/admin",
    role: "superadmin",
  },
  // --- NOUVELLES ROUTES POUR L'UTILISATEUR ---
  {
    path: "/dashboard",
    name: "Accueil",
    icon: "ni ni-tv-2 text-primary",
    component: <UserView />,
    layout: "/user",
    role: "utilisateur",
    // hideNavbar: true, // <- ajoute ceci pour cacher la navbar sur cette route
  },
  {
    path: "/historique-videos",
    name: "Historique des vidéos",
    icon: "ni ni-bullet-list-67 text-red",
    component: <HistoriqueDesVideos />,
    layout: "/user",
    role: "utilisateur",
  },
  {
    path: "/profil",
    name: "Profil",
    icon: "ni ni-single-02 text-yellow",
    component: <UserProfile />,
    layout: "/user",
    role: "utilisateur",
  },
  {
    path: "/games",
    name: "Jeux & Bonus",
    icon: "ni ni-trophy text-success",
    component: <GameHub />,
    layout: "/user",
    role: "utilisateur",
  },
  {
    path: "/game-management",
    name: "Gestion des Jeux",
    icon: "ni ni-controller text-info",
    component: <GameManagement />,
    layout: "/admin",
    role: ["superadmin", "admin"],
  },
  // {
  //   path: "/historique",
  //   name: "Historique des vidéos",
  //   icon: "ni ni-archive-2 text-info",
  //   component: <HistoriqueDesVideos />,
  //   layout: "/client",
  //   role: "client",
  // },
];
export default routes;
