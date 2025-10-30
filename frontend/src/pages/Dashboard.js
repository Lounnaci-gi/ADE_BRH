import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, Activity, MapPin, Trophy, TrendingUp } from 'lucide-react';
import authService from '../services/authService';
import centresService from '../services/centresService';
import agenceService from '../services/agenceService';
import communesService from '../services/communesService';
import userService from '../services/userService';
import kpiService from '../services/kpiService';

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    centres: 0,
    agences: 0,
    communes: 0,
    loading: true
  });
  const [highestDailyRate, setHighestDailyRate] = useState({
    taux: 0,
    agence: '',
    loading: true
  });
  const [highestCentreDailyRate, setHighestCentreDailyRate] = useState({
    taux: 0,
    centre: '',
    loading: true
  });
  const [highestMonthlyAvgRate, setHighestMonthlyAvgRate] = useState({
    taux: 0,
    agence: '',
    loading: true
  });
  const [highestMonthlyCentreAvgRate, setHighestMonthlyCentreAvgRate] = useState({
    taux: 0,
    centre: '',
    loading: true
  });
  const user = authService.getCurrentUser();
  const navigate = useNavigate();


  useEffect(() => {
    const loadStats = async () => {
      try {
        const results = await Promise.allSettled([
          userService.list(),
          centresService.getCount(),
          agenceService.getCount(),
          communesService.getCount(),
          kpiService.getHighestDailyRate(),
          kpiService.getHighestDailyRateByCentre(),
          kpiService.getHighestMonthlyAverageRate(),
          kpiService.getHighestMonthlyAverageRateByCentre()
        ]);

        const [usersRes, centresCountRes, agencesCountRes, communesCountRes, highestRateRes, highestCentreRateRes, highestMonthlyAvgRes, highestMonthlyCentreAvgRes] = results;

        // Users count
        let usersCount = 0;
        if (usersRes.status === 'fulfilled') {
          const usersData = usersRes.value || [];
          usersCount = Array.isArray(usersData) ? usersData.length : (usersData?.data?.length || 0);
        }

        // Centres count with fallback to list length
        let centresCount = 0;
        if (centresCountRes.status === 'fulfilled') {
          centresCount = centresCountRes.value || 0;
        } else {
          try {
            const centresList = await centresService.list();
            const centresData = centresList?.data ?? centresList ?? [];
            centresCount = Array.isArray(centresData) ? centresData.length : 0;
          } catch (_) {}
        }

        // Agences count with fallback to list length
        let agencesCount = 0;
        if (agencesCountRes.status === 'fulfilled') {
          agencesCount = agencesCountRes.value || 0;
        } else {
          try {
            const agencesData = await agenceService.list();
            agencesCount = Array.isArray(agencesData) ? agencesData.length : 0;
          } catch (_) {}
        }

        // Communes count with fallback to list length
        let communesCount = 0;
        if (communesCountRes.status === 'fulfilled') {
          communesCount = communesCountRes.value || 0;
        } else {
          try {
            const communesData = await communesService.list();
            communesCount = Array.isArray(communesData) ? communesData.length : 0;
          } catch (_) {}
        }

        setStats({
          users: usersCount,
          centres: centresCount,
          agences: agencesCount,
          communes: communesCount,
          loading: false
        });

        const highestRate = highestRateRes.status === 'fulfilled' ? highestRateRes.value : null;
        if (highestRate && highestRate.Taux_Journalier) {
          setHighestDailyRate({
            taux: highestRate.Taux_Journalier,
            agence: highestRate.Nom_Agence || '',
            loading: false
          });
        } else {
          console.log('⚠️ Dashboard - Aucun meilleur taux trouvé');
          setHighestDailyRate({
            taux: null,
            agence: '',
            loading: false
          });
        }

        const highestCentreRate = highestCentreRateRes.status === 'fulfilled' ? highestCentreRateRes.value : null;
        if (highestCentreRate && highestCentreRate.Taux_Journalier) {
          setHighestCentreDailyRate({
            taux: highestCentreRate.Taux_Journalier,
            centre: highestCentreRate.Nom_Centre || '',
            loading: false
          });
        } else if (highestCentreRate && highestCentreRate.Taux_Journalier_Centre) {
          // Compatibilité si backend renvoie Taux_Journalier_Centre
          setHighestCentreDailyRate({
            taux: highestCentreRate.Taux_Journalier_Centre,
            centre: highestCentreRate.Nom_Centre || '',
            loading: false
          });
        } else {
          console.log('⚠️ Dashboard - Aucun meilleur centre trouvé');
          setHighestCentreDailyRate({
            taux: null,
            centre: '',
            loading: false
          });
        }

        const highestMonthlyAvg = highestMonthlyAvgRes.status === 'fulfilled' ? highestMonthlyAvgRes.value : null;
        if (highestMonthlyAvg && (highestMonthlyAvg.Taux_Moyen != null || highestMonthlyAvg.Taux_Moyen_MTD != null)) {
          const taux = highestMonthlyAvg.Taux_Moyen ?? highestMonthlyAvg.Taux_Moyen_MTD;
          setHighestMonthlyAvgRate({
            taux,
            agence: highestMonthlyAvg.Nom_Agence || '',
            loading: false
          });
        } else {
          console.log('⚠️ Dashboard - Aucun taux moyen mensuel trouvé');
          setHighestMonthlyAvgRate({ taux: null, agence: '', loading: false });
        }

        const highestMonthlyCentreAvg = highestMonthlyCentreAvgRes.status === 'fulfilled' ? highestMonthlyCentreAvgRes.value : null;
        if (highestMonthlyCentreAvg && (highestMonthlyCentreAvg.Taux_Mensuel != null || highestMonthlyCentreAvg.Taux_Mensuel_Centre != null)) {
          const tauxCentre = highestMonthlyCentreAvg.Taux_Mensuel ?? highestMonthlyCentreAvg.Taux_Mensuel_Centre;
          setHighestMonthlyCentreAvgRate({
            taux: tauxCentre,
            centre: highestMonthlyCentreAvg.Nom_Centre || '',
            loading: false
          });
        } else {
          console.log('⚠️ Dashboard - Aucun centre taux moyen mensuel trouvé');
          setHighestMonthlyCentreAvgRate({ taux: null, centre: '', loading: false });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        setStats(prev => ({ ...prev, loading: false }));
        setHighestDailyRate({ taux: null, agence: '', loading: false });
        setHighestCentreDailyRate({ taux: null, centre: '', loading: false });
        setHighestMonthlyAvgRate({ taux: null, agence: '', loading: false });
        setHighestMonthlyCentreAvgRate({ taux: null, centre: '', loading: false });
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
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Carte Taux moyen le plus fort depuis le début du mois (Agence) - GOLD */}
          <div className="w-full min-h-[160px] p-5 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-2xl shadow-xl border-4 border-white hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-white/90 text-xs uppercase tracking-wide font-semibold mb-1">Meilleur Taux Moyen (Mois en cours)</p>
                {highestMonthlyAvgRate.loading ? (
                  <p className="text-3xl font-bold text-white mb-1">...</p>
                ) : highestMonthlyAvgRate.taux !== null ? (
                  <>
                    <p className="text-3xl font-bold text-white mb-1">
                      {highestMonthlyAvgRate.taux.toFixed(2)}%
                    </p>
                    {highestMonthlyAvgRate.agence && (
                      <p className="text-white/80 text-xs font-medium">
                        {highestMonthlyAvgRate.agence}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-base font-semibold text-white/90 mb-1">Aucune donnée</p>
                    <p className="text-white/70 text-xs">
                      Aucune agence avec taux moyen pour ce mois
                    </p>
                  </>
                )}
              </div>
              <div className="bg-white/20 rounded-full p-3 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-white" />
              </div>
            </div>
            {highestMonthlyAvgRate.taux !== null && !highestMonthlyAvgRate.loading && (
              <div className="mt-4 flex items-center gap-2 text-white/90 text-xs">
                <TrendingUp className="w-4 h-4" />
                <span>Depuis le 1er du mois</span>
              </div>
            )}
          </div>

          {/* Carte Taux moyen centre le plus élevé (Mois en cours) */}
          <div className="w-full min-h-[160px] p-5 bg-gradient-to-br from-indigo-500 via-sky-600 to-cyan-600 rounded-2xl shadow-xl border-4 border-white hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-white/90 text-xs uppercase tracking-wide font-semibold mb-1">Meilleur Taux Moyen Centre (Mois en cours)</p>
                {highestMonthlyCentreAvgRate.loading ? (
                  <p className="text-3xl font-bold text-white mb-1">...</p>
                ) : highestMonthlyCentreAvgRate.taux !== null ? (
                  <>
                    <p className="text-3xl font-bold text-white mb-1">
                      {highestMonthlyCentreAvgRate.taux.toFixed(2)}%
                    </p>
                    {highestMonthlyCentreAvgRate.centre && (
                      <p className="text-white/80 text-xs font-medium">
                        {highestMonthlyCentreAvgRate.centre}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-base font-semibold text-white/90 mb-1">Aucune donnée</p>
                    <p className="text-white/70 text-xs">
                      Aucun centre avec taux moyen pour ce mois
                    </p>
                  </>
                )}
              </div>
              <div className="bg-white/20 rounded-full p-3 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-white" />
              </div>
            </div>
            {highestMonthlyCentreAvgRate.taux !== null && !highestMonthlyCentreAvgRate.loading && (
              <div className="mt-4 flex items-center gap-2 text-white/90 text-xs">
                <TrendingUp className="w-4 h-4" />
                <span>Depuis le 1er du mois</span>
              </div>
            )}
          </div>

          {/* Carte Taux le plus élevé (Agence) - journée */}
          <div className="w-full min-h-[160px] p-5 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-2xl shadow-xl border-4 border-white hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-white/90 text-xs uppercase tracking-wide font-semibold mb-1">Meilleur Taux du Jour</p>
                {highestDailyRate.loading ? (
                  <p className="text-3xl font-bold text-white mb-1">...</p>
                ) : highestDailyRate.taux !== null ? (
                  <>
                    <p className="text-3xl font-bold text-white mb-1">
                      {highestDailyRate.taux.toFixed(2)}%
                    </p>
                    {highestDailyRate.agence && (
                      <p className="text-white/80 text-xs font-medium">
                        {highestDailyRate.agence}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-base font-semibold text-white/90 mb-1">Aucune donnée</p>
                    <p className="text-white/70 text-xs">
                      Aucune agence avec données aujourd'hui
                    </p>
                  </>
                )}
              </div>
              <div className="bg-white/20 rounded-full p-3 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-white" />
              </div>
            </div>
            {highestDailyRate.taux !== null && !highestDailyRate.loading && (
              <div className="mt-4 flex items-center gap-2 text-white/90 text-xs">
                <TrendingUp className="w-4 h-4" />
                <span>Performance exceptionnelle</span>
              </div>
            )}
          </div>

          {/* Carte Taux le plus élevé (Centre) - journée */}
          <div className="w-full min-h-[160px] p-5 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-2xl shadow-xl border-4 border-white hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-white/90 text-xs uppercase tracking-wide font-semibold mb-1">Meilleur Taux Centre du Jour</p>
                {highestCentreDailyRate.loading ? (
                  <p className="text-3xl font-bold text-white mb-1">...</p>
                ) : highestCentreDailyRate.taux !== null ? (
                  <>
                    <p className="text-3xl font-bold text-white mb-1">
                      {highestCentreDailyRate.taux.toFixed(2)}%
                    </p>
                    {highestCentreDailyRate.centre && (
                      <p className="text-white/80 text-xs font-medium">
                        {highestCentreDailyRate.centre}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-base font-semibold text-white/90 mb-1">Aucune donnée</p>
                    <p className="text-white/70 text-xs">
                      Aucun centre avec données aujourd'hui
                    </p>
                  </>
                )}
              </div>
              <div className="bg-white/20 rounded-full p-3 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-white" />
              </div>
            </div>
            {highestCentreDailyRate.taux !== null && !highestCentreDailyRate.loading && (
              <div className="mt-4 flex items-center gap-2 text-white/90 text-xs">
                <TrendingUp className="w-4 h-4" />
                <span>Centre le plus performant</span>
              </div>
            )}
          </div>
          </div>

          {/* Cartes KPI interactives */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div 
              className="w-full min-h-[160px] p-5 bg-gradient-to-br from-emerald-400 via-sky-200 to-cyan-100 rounded-2xl shadow-xl border-4 border-white hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between cursor-pointer"
              onClick={() => navigate('/users')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-700/90">Utilisateurs</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    {stats.loading ? '...' : stats.users}
                  </p>
                </div>
                <div className="bg-sky-300/60 rounded-full p-3 flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600/90 inline-flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {stats.loading ? 'Chargement...' : 'Actifs'}
              </div>
              <div className="mt-3 text-xs text-sky-700 font-medium">Cliquez pour gérer →</div>
            </div>

            <div 
              className="w-full min-h-[160px] p-5 bg-gradient-to-br from-emerald-400 via-sky-200 to-cyan-100 rounded-2xl shadow-xl border-4 border-white hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between cursor-pointer"
              onClick={() => navigate('/centres')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-700/90">Centres</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    {stats.loading ? '...' : stats.centres}
                  </p>
                </div>
                <div className="bg-sky-300/60 rounded-full p-3 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600/90 inline-flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {stats.loading ? 'Chargement...' : 'Opérationnels'}
              </div>
              <div className="mt-3 text-xs text-sky-700 font-medium">Cliquez pour gérer →</div>
            </div>

            <div 
              className="w-full min-h-[160px] p-5 bg-gradient-to-br from-emerald-400 via-sky-200 to-cyan-100 rounded-2xl shadow-xl border-4 border-white hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between cursor-pointer"
              onClick={() => navigate('/agences')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-700/90">Agences</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    {stats.loading ? '...' : stats.agences}
                  </p>
                </div>
                <div className="bg-sky-300/60 rounded-full p-3 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600/90 inline-flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {stats.loading ? 'Chargement...' : 'En service'}
              </div>
              <div className="mt-3 text-xs text-sky-700 font-medium">Cliquez pour gérer →</div>
            </div>

            <div 
              className="w-full min-h-[160px] p-5 bg-gradient-to-br from-emerald-400 via-sky-200 to-cyan-100 rounded-2xl shadow-xl border-4 border-white hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between cursor-pointer"
              onClick={() => navigate('/communes')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-700/90">Communes</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    {stats.loading ? '...' : stats.communes}
                  </p>
                </div>
                <div className="bg-sky-300/60 rounded-full p-3 flex items-center justify-center">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600/90 inline-flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {stats.loading ? 'Chargement...' : 'Couvrent'}
              </div>
              <div className="mt-3 text-xs text-sky-700 font-medium">Cliquez pour gérer →</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
