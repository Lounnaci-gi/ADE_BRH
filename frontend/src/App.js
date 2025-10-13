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
import Sidebar from './components/Sidebar';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Categories from './pages/Categories';
import KPI from './pages/KPI';
import Objectives from './pages/Objectives';
import Centres from './pages/Centres';
import Communes from './pages/Communes';

// 🔒 Composant de route protégée
const PrivateRoute = ({ children }) => {
  return authService.isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen water-surface">
        <NavBar />
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-4 md:max-w-none md:px-0">
          <div className="md:flex md:items-stretch md:gap-0">
            <Sidebar />
            <main className="flex-1 min-h-[calc(100vh-64px)] overflow-auto px-4 md:px-6 py-4 md:py-6">
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

        {/* ✅ Route pour la gestion des agences */}
        <Route
          path="/dashboard/agences"
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

        {/* 🌍 Redirection par défaut */}
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
            </main>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
