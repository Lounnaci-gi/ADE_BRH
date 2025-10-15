import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Users, LogOut, Droplets, Building2, Activity, PlusCircle, ShieldCheck, BarChart3, MapPin } from 'lucide-react';
import authService from '../services/authService';
import centresService from '../services/centresService';
import agenceService from '../services/agenceService';
import communesService from '../services/communesService';
import userService from '../services/userService';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    users: 0,
    centres: 0,
    agences: 0,
    communes: 0,
    loading: true
  });
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [usersData, centresCount, agencesCount, communesCount] = await Promise.all([
          userService.list(),
          centresService.getCount(),
          agenceService.getCount(),
          communesService.getCount()
        ]);
        
        setStats({
          users: usersData.length || 0,
          centres: centresCount || 0,
          agences: agencesCount || 0,
          communes: communesCount || 0,
          loading: false
        });
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    loadStats();
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-sky-100 text-gray-800 font-sans">
      {/* === Sidebar === */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white/90 backdrop-blur-md border-r border-blue-100 shadow-lg transform 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          transition-transform duration-300 ease-in-out md:translate-x-0`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-blue-100">
          <div className="flex items-center space-x-2">
            <Droplets className="w-6 h-6 text-sky-600" />
            <h1 className="text-xl font-semibold text-sky-700">ADE BRH</h1>
          </div>
          <button
            className="md:hidden text-gray-600 hover:text-sky-600"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="mt-6 space-y-1">
          <Link
            to="/dashboard/users"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition rounded-lg"
          >
            <Users className="w-5 h-5 mr-3" />
            Gestion des utilisateurs
          </Link>

          <Link
            to="/dashboard/agences"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition rounded-lg"
          >
            <Building2 className="w-5 h-5 mr-3" />
            Gestion des agences commerciales
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 w-full border-t border-blue-100 px-6 py-4 bg-white/80">
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-700 hover:text-red-500 transition"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* === Main content === */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Navbar */}
        <header className="flex items-center justify-between bg-gradient-to-r from-white/70 to-sky-50/70 backdrop-blur-md shadow-sm px-6 py-4 border-b border-blue-100">
          <button
            className="md:hidden text-gray-600 hover:text-sky-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <h2 className="text-lg font-semibold text-sky-700">Tableau de bord</h2>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">{user?.username}</span>
            <img
              src={`https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=38bdf8&color=fff`}
              alt="avatar"
              className="w-8 h-8 rounded-full shadow"
            />
          </div>
        </header>

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto p-6 fade-in space-y-6">
          {/* Bandeau de bienvenue */}
          <div className="relative overflow-hidden bg-white/90 rounded-2xl shadow-md border border-blue-50 p-6 transition hover:shadow-lg">
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-sky-100 -z-10 pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-blue-50 -z-10 pointer-events-none" aria-hidden="true" />
            <h3 className="relative z-10 text-2xl font-semibold text-sky-700 mb-3">
              Bienvenue {user?.username || ''}
            </h3>
            <p className="relative z-10 text-gray-600 leading-relaxed">
              Ce tableau de bord vous permet de gérer efficacement les utilisateurs, les agences commerciales,
              les clients et les opérations liées à la distribution d’eau.
            </p>
          </div>

          {/* Cartes KPI */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-xl border border-blue-50 shadow-sm p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Utilisateurs</p>
                  <p className="mt-1 text-2xl font-semibold text-sky-700">
                    {stats.loading ? '...' : stats.users}
                  </p>
                </div>
                <Users className="w-6 h-6 text-sky-500" />
              </div>
              <div className="mt-3 text-xs text-green-600 inline-flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {stats.loading ? 'Chargement...' : 'Actifs'}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-blue-50 shadow-sm p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Centres</p>
                  <p className="mt-1 text-2xl font-semibold text-sky-700">
                    {stats.loading ? '...' : stats.centres}
                  </p>
                </div>
                <Building2 className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="mt-3 text-xs text-green-600 inline-flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {stats.loading ? 'Chargement...' : 'Opérationnels'}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-blue-50 shadow-sm p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Agences</p>
                  <p className="mt-1 text-2xl font-semibold text-sky-700">
                    {stats.loading ? '...' : stats.agences}
                  </p>
                </div>
                <Building2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="mt-3 text-xs text-green-600 inline-flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {stats.loading ? 'Chargement...' : 'En service'}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-blue-50 shadow-sm p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Communes</p>
                  <p className="mt-1 text-2xl font-semibold text-sky-700">
                    {stats.loading ? '...' : stats.communes}
                  </p>
                </div>
                <MapPin className="w-6 h-6 text-amber-500" />
              </div>
              <div className="mt-3 text-xs text-green-600 inline-flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {stats.loading ? 'Chargement...' : 'Couvrent'}
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="grid gap-6 md:grid-cols-4">
            <Link to="/users" className="group bg-white rounded-xl border border-blue-50 p-5 shadow-sm hover:shadow-md transition relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-sky-50 rounded-full -z-10 pointer-events-none" aria-hidden="true" />
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-sky-600" />
                <h4 className="font-medium text-sky-700">Gérer les utilisateurs</h4>
              </div>
              <p className="mt-2 text-sm text-gray-600">Créer, modifier et gérer les accès.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sky-600 group-hover:gap-3 transition">Accéder <PlusCircle className="w-4 h-4" /></div>
            </Link>

            <Link to="/centres" className="group bg-white rounded-xl border border-blue-50 p-5 shadow-sm hover:shadow-md transition relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full -z-10 pointer-events-none" aria-hidden="true" />
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h4 className="font-medium text-indigo-700">Gérer les centres</h4>
              </div>
              <p className="mt-2 text-sm text-gray-600">Ajouter, mettre à jour et consulter.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-indigo-600 group-hover:gap-3 transition">Accéder <PlusCircle className="w-4 h-4" /></div>
            </Link>

            <Link to="/agences" className="group bg-white rounded-xl border border-blue-50 p-5 shadow-sm hover:shadow-md transition relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full -z-10 pointer-events-none" aria-hidden="true" />
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h4 className="font-medium text-emerald-700">Gérer les agences</h4>
              </div>
              <p className="mt-2 text-sm text-gray-600">Ajouter, mettre à jour et consulter.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-emerald-600 group-hover:gap-3 transition">Accéder <PlusCircle className="w-4 h-4" /></div>
            </Link>

            <Link to="/communes" className="group bg-white rounded-xl border border-blue-50 p-5 shadow-sm hover:shadow-md transition relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 rounded-full -z-10 pointer-events-none" aria-hidden="true" />
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-amber-600" />
                <h4 className="font-medium text-amber-700">Gérer les communes</h4>
              </div>
              <p className="mt-2 text-sm text-gray-600">Ajouter, mettre à jour et consulter.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-amber-600 group-hover:gap-3 transition">Accéder <PlusCircle className="w-4 h-4" /></div>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
