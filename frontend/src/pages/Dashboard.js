import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, Activity, PlusCircle, MapPin } from 'lucide-react';
import authService from '../services/authService';
import centresService from '../services/centresService';
import agenceService from '../services/agenceService';
import communesService from '../services/communesService';
import userService from '../services/userService';

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    centres: 0,
    agences: 0,
    communes: 0,
    loading: true
  });
  const user = authService.getCurrentUser();


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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 text-gray-800 font-sans">
      {/* === Main content === */}
      <div className="w-full">
        {/* Navbar */}
        <header className="flex items-center justify-between bg-gradient-to-r from-white/70 to-sky-50/70 backdrop-blur-md shadow-sm px-6 py-4 border-b border-blue-100">
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
        <main className="p-6 fade-in space-y-6">
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
