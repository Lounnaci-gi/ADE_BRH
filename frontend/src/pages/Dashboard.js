import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, Activity, MapPin } from 'lucide-react';
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
  const navigate = useNavigate();


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
          {/* Cartes KPI interactives */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div 
              className="bg-white rounded-xl border border-blue-50 shadow-sm p-5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
              onClick={() => navigate('/users')}
            >
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
              <div className="mt-3 text-xs text-sky-600 font-medium">
                Cliquez pour gérer →
              </div>
            </div>

            <div 
              className="bg-white rounded-xl border border-blue-50 shadow-sm p-5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
              onClick={() => navigate('/centres')}
            >
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
              <div className="mt-3 text-xs text-indigo-600 font-medium">
                Cliquez pour gérer →
              </div>
            </div>

            <div 
              className="bg-white rounded-xl border border-blue-50 shadow-sm p-5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
              onClick={() => navigate('/agences')}
            >
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
              <div className="mt-3 text-xs text-emerald-600 font-medium">
                Cliquez pour gérer →
              </div>
            </div>

            <div 
              className="bg-white rounded-xl border border-blue-50 shadow-sm p-5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
              onClick={() => navigate('/communes')}
            >
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
              <div className="mt-3 text-xs text-amber-600 font-medium">
                Cliquez pour gérer →
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
