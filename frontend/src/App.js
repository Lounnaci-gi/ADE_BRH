import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import authService from "./services/authService";
import Agences from './pages/Agences';
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

const PrivateRoute = ({ children }) => {
  return authService.isAuthenticated() ? children : <Navigate to="/login" />;
};

function AppLayout() {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const showChrome = isAuthenticated && location.pathname !== '/login';

  return (
    <div className="min-h-screen water-surface">
      {showChrome && <NavBar />}
      {showChrome && <DataEntryReminder />}
      <div className={`mx-auto max-w-7xl px-4 pb-8 ${showChrome ? 'pt-4' : ''}`}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/users"
            element={
              <PrivateRoute>
                <Users />
              </PrivateRoute>
            }
          />

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

          <Route
            path="/categories"
            element={
              <PrivateRoute>
                <Categories />
              </PrivateRoute>
            }
          />

          <Route
            path="/kpi"
            element={
              <PrivateRoute>
                <KPI />
              </PrivateRoute>
            }
          />

          <Route
            path="/bilans-detailles"
            element={
              <PrivateRoute>
                <BilansDetailles />
              </PrivateRoute>
            }
          />

          <Route
            path="/detailed-data-by-agency"
            element={
              <PrivateRoute>
                <DetailedDataByAgency />
              </PrivateRoute>
            }
          />

          <Route
            path="/objectives"
            element={
              <PrivateRoute>
                <Objectives />
              </PrivateRoute>
            }
          />

          <Route
            path="/centres"
            element={
              <PrivateRoute>
                <Centres />
              </PrivateRoute>
            }
          />

          <Route
            path="/communes"
            element={
              <PrivateRoute>
                <Communes />
              </PrivateRoute>
            }
          />

          <Route
            path="/statistiques"
            element={
              <PrivateRoute>
                <Statistiques />
              </PrivateRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
