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

// 🔒 Composant de route protégée
const PrivateRoute = ({ children }) => {
  return authService.isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
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

        {/* ✅ Route pour la gestion des agences */}
        <Route
          path="/dashboard/agences"
          element={
            <PrivateRoute>
              <Agences />
            </PrivateRoute>
          }
        />

        {/* 🌍 Redirection par défaut */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
