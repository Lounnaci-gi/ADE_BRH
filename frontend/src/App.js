import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users"; // ✅ Import de la page utilisateurs
import authService from "./services/authService";
import Agences from './pages/Agences'; // ✅ importe la page agences
import NavBar from './components/NavBar';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Categories from './pages/Categories';
import KPI from './pages/KPI';
import Objectives from './pages/Objectives';
import BilansDetailles from './pages/BilansDetailles';
import DetailedDataByAgency from './pages/DetailedDataByAgency';
import Centres from './pages/Centres';
import Communes from './pages/Communes';
import Statistiques from './pages/Statistiques';
import DataEntryReminder from './components/DataEntryReminder';

// 🔒 Composant de route protégée
const PrivateRoute = ({ children }) => {
  return authService.isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen water-surface">
        <NavBar />
        {/* Composant global de rappel de saisie des données */}
        <DataEntryReminder />
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-4">
          <Routes>
        {/* 🧠 Page de connexion */}
        <Route path="/login" element={<Login />} />

        {/* 🏠 Tableau de bord */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* 👥 Gestion des utilisateurs */}
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <Users />
            </PrivateRoute>
          }
        />

            {/* Profil & Paramètres */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />

        {/* ✅ Routes pour la gestion des agences */}
        <Route
          path="/dashboard/agences"
          element={
            <PrivateRoute>
              <Agences />
            </PrivateRoute>
          }
        />
        <Route
          path="/agences"
          element={
            <PrivateRoute>
              <Agences />
            </PrivateRoute>
          }
        />

        {/* 📂 Gestion des catégories */}
        <Route
          path="/categories"
          element={
            <PrivateRoute>
              <Categories />
            </PrivateRoute>
          }
        />

        {/* 📊 Gestion des KPIs */}
        <Route
          path="/kpi"
          element={
            <PrivateRoute>
              <KPI />
            </PrivateRoute>
          }
        />

        {/* 📋 Bilans détaillés */}
        <Route
          path="/bilans-detailles"
          element={
            <PrivateRoute>
              <BilansDetailles />
            </PrivateRoute>
          }
        />

        {/* 🏢 Detailed Data by Agency */}
        <Route
          path="/detailed-data-by-agency"
          element={
            <PrivateRoute>
              <DetailedDataByAgency />
            </PrivateRoute>
          }
        />

        {/* 🎯 Gestion des objectifs */}
        <Route
          path="/objectives"
          element={
            <PrivateRoute>
              <Objectives />
            </PrivateRoute>
          }
        />

        {/* 🏢 Gestion des centres */}
        <Route
          path="/centres"
          element={
            <PrivateRoute>
              <Centres />
            </PrivateRoute>
          }
        />

        {/* 🗺️ Gestion des communes */}
        <Route
          path="/communes"
          element={
            <PrivateRoute>
              <Communes />
            </PrivateRoute>
          }
        />

        {/* 📈 Statistiques */}
        <Route
          path="/statistiques"
          element={
            <PrivateRoute>
              <Statistiques />
            </PrivateRoute>
          }
        />

        {/* 🌍 Redirection par défaut */}
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
