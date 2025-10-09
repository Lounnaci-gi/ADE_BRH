import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Users, LogOut, Droplets, Building2 } from 'lucide-react';
import authService from '../services/authService';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

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
        <header className="flex items-center justify-between bg-white/70 backdrop-blur-md shadow-sm px-6 py-4 border-b border-blue-100">
          <button
            className="md:hidden text-gray-600 hover:text-sky-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <h2 className="text-lg font-medium text-sky-700">Tableau de bord</h2>
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
        <main className="flex-1 overflow-y-auto p-6 fade-in">
          <div className="bg-white/90 rounded-2xl shadow-md border border-blue-50 p-6 transition hover:shadow-lg">
            <h3 className="text-2xl font-semibold text-sky-700 mb-3">
              Bienvenue {user?.username || ''}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Ce tableau de bord vous permet de gérer efficacement les utilisateurs, les agences commerciales,
              les clients et les opérations liées à la distribution d’eau.
            </p>
          </div>

          {/* Section décorative */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-sky-100 to-blue-50 p-5 rounded-xl shadow-inner text-center border border-blue-100">
              <h4 className="text-sky-700 font-medium mb-2">Qualité</h4>
              <p className="text-gray-600 text-sm">Gestion rigoureuse et transparente</p>
            </div>

            <div className="bg-gradient-to-br from-sky-100 to-blue-50 p-5 rounded-xl shadow-inner text-center border border-blue-100">
              <h4 className="text-sky-700 font-medium mb-2">Fiabilité</h4>
              <p className="text-gray-600 text-sm">Suivi des performances en temps réel</p>
            </div>

            <div className="bg-gradient-to-br from-sky-100 to-blue-50 p-5 rounded-xl shadow-inner text-center border border-blue-100">
              <h4 className="text-sky-700 font-medium mb-2">Innovation</h4>
              <p className="text-gray-600 text-sm">Interface moderne et évolutive</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
