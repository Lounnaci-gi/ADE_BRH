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
  const [top3Agences, setTop3Agences] = useState({
    data: [],
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
          kpiService.getHighestMonthlyAverageRateByCentre(),
          kpiService.getTop3AgencesMonth()
        ]);

        const [usersRes, centresCountRes, agencesCountRes, communesCountRes, highestRateRes, highestCentreRateRes, highestMonthlyAvgRes, highestMonthlyCentreAvgRes, top3AgencesRes] = results;

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

        const top3AgencesData = top3AgencesRes.status === 'fulfilled' ? top3AgencesRes.value : null;
        if (top3AgencesRes.status === 'rejected') {
          console.error('❌ Erreur lors du chargement du top 3:', top3AgencesRes.reason);
        }
        if (top3AgencesData && Array.isArray(top3AgencesData)) {
          console.log('✅ Dashboard - Top 3 agences reçues:', top3AgencesData);
          setTop3Agences({
            data: top3AgencesData,
            loading: false
          });
        } else {
          console.log('⚠️ Dashboard - Aucun top 3 agences trouvé, données reçues:', top3AgencesData);
          setTop3Agences({ data: [], loading: false });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        setStats(prev => ({ ...prev, loading: false }));
        setHighestDailyRate({ taux: null, agence: '', loading: false });
        setHighestCentreDailyRate({ taux: null, centre: '', loading: false });
        setHighestMonthlyAvgRate({ taux: null, agence: '', loading: false });
        setHighestMonthlyCentreAvgRate({ taux: null, centre: '', loading: false });
        setTop3Agences({ data: [], loading: false });
      }
    };

    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 dark:from-slate-900 dark:to-slate-950 text-gray-800 dark:text-slate-100 font-sans">
      {/* === Main content === */}
      <div className="w-full">
        {/* Navbar */}
        <header className="flex items-center justify-between bg-gradient-to-r from-white/70 to-sky-50/70 dark:from-slate-900/70 dark:to-slate-900/40 backdrop-blur-md shadow-sm px-6 py-4 border-b border-blue-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-sky-700 dark:text-water-300">Tableau de bord</h2>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 dark:text-slate-200 font-medium">{user?.username}</span>
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
          <div className="w-full min-h-[160px] p-5 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 dark:!bg-slate-800 dark:[background-image:none] dark:border-yellow-500/50 rounded-2xl shadow-xl border-4 border-white dark:border-2 hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-white/90 text-xs uppercase tracking-wide font-semibold mb-1">Meilleur Agence du mois courant</p>
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
              <div className="bg-white/20 dark:bg-yellow-500/20 rounded-full p-3 flex items-center justify-center">
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
          <div className="w-full min-h-[160px] p-5 bg-gradient-to-br from-indigo-500 via-sky-600 to-cyan-600 dark:!bg-slate-800 dark:[background-image:none] dark:border-indigo-500/50 rounded-2xl shadow-xl border-4 border-white dark:border-2 hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-white/90 text-xs uppercase tracking-wide font-semibold mb-1">Meilleur Centre du Mois courant</p>
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
              <div className="bg-white/20 dark:bg-indigo-500/20 rounded-full p-3 flex items-center justify-center">
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
          <div className="w-full min-h-[160px] p-5 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 dark:!bg-slate-800 dark:[background-image:none] dark:border-emerald-500/50 rounded-2xl shadow-xl border-4 border-white dark:border-2 hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-white/90 text-xs uppercase tracking-wide font-semibold mb-1">Meilleur Agence du Jour</p>
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
              <div className="bg-white/20 dark:bg-emerald-500/20 rounded-full p-3 flex items-center justify-center">
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
          <div className="w-full min-h-[160px] p-5 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 dark:!bg-slate-800 dark:[background-image:none] dark:border-emerald-500/50 rounded-2xl shadow-xl border-4 border-white dark:border-2 hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-white/90 text-xs uppercase tracking-wide font-semibold mb-1">Meilleur Centre du Jour</p>
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
              <div className="bg-white/20 dark:bg-emerald-500/20 rounded-full p-3 flex items-center justify-center">
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

          {/* Grille 3 lignes × 4 colonnes */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Podium Top 3 Agences - Carte agrandie (2 colonnes) */}
            <div className="w-full col-span-1 sm:col-span-2 lg:col-span-2 min-h-[160px] p-1 bg-gradient-to-br from-emerald-400 via-sky-200 to-cyan-100 dark:!bg-slate-800 dark:[background-image:none] dark:border-sky-500/50 rounded-2xl shadow-xl border-4 border-white dark:border-2 hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-700/90 dark:text-slate-200 p-1">Top 3 Agences</p>
                  <p className="mt-1 text-xs font-medium text-gray-600/90 dark:text-slate-300 p-1">
                    {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="bg-sky-300/60 dark:bg-sky-700/60 rounded-full p-2 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
              </div>
              {top3Agences.loading ? (
                <div className="flex items-center justify-center py-4">
                  <p className="text-xs text-gray-600/90 dark:text-slate-300">Chargement...</p>
                </div>
              ) : (
                <div className="flex items-end justify-center space-x-4 md:space-x-8">
                  {/* 2ème place (Argent) */}
                  <div className="flex flex-col items-center space-y-2">
                    <div 
                      className="w-28 h-36 bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500 rounded-t-xl shadow-xl flex flex-col items-center justify-center border-2 border-gray-400 dark:border-gray-600"
                    >
                      <div className="text-4xl mb-1">🥈</div>
                      <div className="text-sm font-bold text-gray-700 dark:text-gray-200">2ème</div>
                    </div>
                    {top3Agences.data[1] ? (
                      <>
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 text-center px-1 max-w-[120px] truncate">
                          {top3Agences.data[1].Nom_Agence || 'N/A'}
                        </div>
                        <div className="text-base font-bold text-gray-600 dark:text-gray-300">
                          {typeof top3Agences.data[1].Taux_Mensuel === 'number' ? top3Agences.data[1].Taux_Mensuel.toFixed(2) + '%' : '-'}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400 italic">-</div>
                    )}
                  </div>

                  {/* 1ère place (Or) */}
                  <div className="flex flex-col items-center space-y-2">
                    <div 
                      className="w-32 h-40 bg-gradient-to-t from-yellow-400 to-yellow-300 dark:from-yellow-600 dark:to-yellow-500 rounded-t-xl shadow-2xl flex flex-col items-center justify-center border-2 border-yellow-500 dark:border-yellow-600"
                    >
                      <div className="text-5xl mb-1">🥇</div>
                      <div className="text-base font-bold text-yellow-900 dark:text-yellow-100">1er</div>
                    </div>
                    {top3Agences.data[0] ? (
                      <>
                        <div className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 text-center px-1 max-w-[130px] truncate">
                          {top3Agences.data[0].Nom_Agence || 'N/A'}
                        </div>
                        <div className="text-base font-bold text-yellow-600 dark:text-yellow-400">
                          {typeof top3Agences.data[0].Taux_Mensuel === 'number' ? top3Agences.data[0].Taux_Mensuel.toFixed(2) + '%' : '-'}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-yellow-800 dark:text-yellow-200 italic">-</div>
                    )}
                  </div>

                  {/* 3ème place (Bronze) */}
                  <div className="flex flex-col items-center space-y-2">
                    <div 
                      className="w-24 h-32 bg-gradient-to-t from-amber-700 to-amber-600 dark:from-amber-800 dark:to-amber-700 rounded-t-xl shadow-xl flex flex-col items-center justify-center border-2 border-amber-800 dark:border-amber-900"
                    >
                      <div className="text-3xl mb-1">🥉</div>
                      <div className="text-sm font-bold text-amber-100 dark:text-amber-200">3ème</div>
                    </div>
                    {top3Agences.data[2] ? (
                      <>
                        <div className="text-sm font-semibold text-amber-10 dark:text-amber-200 text-center px-1 max-w-[120px] truncate">
                          {top3Agences.data[2].Nom_Agence || 'N/A'}
                        </div>
                        <div className="text-base font-bold text-amber-700 dark:text-amber-400">
                          {typeof top3Agences.data[2].Taux_Mensuel === 'number' ? top3Agences.data[2].Taux_Mensuel.toFixed(2) + '%' : '-'}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-amber-200 dark:text-amber-300 italic">-</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Carte vide 1 */}
            <div className="w-full min-h-[160px] p-5 bg-gradient-to-br from-emerald-400 via-sky-200 to-cyan-100 dark:!bg-slate-800 dark:[background-image:none] dark:border-sky-500/50 rounded-2xl shadow-xl border-4 border-white dark:border-2 hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-700/90 dark:text-slate-200">Carte vide</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600/90 dark:text-slate-300">
                Prête à être remplie
              </div>
            </div>

            {/* Carte vide 2 */}
            <div className="w-full min-h-[160px] p-5 bg-gradient-to-br from-emerald-400 via-sky-200 to-cyan-100 dark:!bg-slate-800 dark:[background-image:none] dark:border-sky-500/50 rounded-2xl shadow-xl border-4 border-white dark:border-2 hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-700/90 dark:text-slate-200">Carte vide</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600/90 dark:text-slate-300">
                Prête à être remplie
              </div>
            </div>
          </div>

          {/* Cartes KPI interactives */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div 
              className="w-full min-h-[160px] p-5 bg-gradient-to-br from-emerald-400 via-sky-200 to-cyan-100 dark:!bg-slate-800 dark:[background-image:none] dark:border-sky-500/50 rounded-2xl shadow-xl border-4 border-white dark:border-2 hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between cursor-pointer"
              onClick={() => navigate('/users')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-700/90 dark:text-slate-200">Utilisateurs</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.loading ? '...' : stats.users}
                  </p>
                </div>
                <div className="bg-sky-300/60 dark:bg-sky-700/60 rounded-full p-3 flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600/90 dark:text-slate-300 inline-flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {stats.loading ? 'Chargement...' : 'Actifs'}
              </div>
              <div className="mt-3 text-xs text-sky-700 dark:text-sky-300 font-medium">Cliquez pour gérer →</div>
            </div>

            <div 
              className="w-full min-h-[160px] p-5 bg-gradient-to-br from-emerald-400 via-sky-200 to-cyan-100 dark:!bg-slate-800 dark:[background-image:none] dark:border-sky-500/50 rounded-2xl shadow-xl border-4 border-white dark:border-2 hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between cursor-pointer"
              onClick={() => navigate('/centres')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-700/90 dark:text-slate-200">Centres</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.loading ? '...' : stats.centres}
                  </p>
                </div>
                <div className="bg-sky-300/60 dark:bg-sky-700/60 rounded-full p-3 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600/90 dark:text-slate-300 inline-flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {stats.loading ? 'Chargement...' : 'Opérationnels'}
              </div>
              <div className="mt-3 text-xs text-sky-700 dark:text-sky-300 font-medium">Cliquez pour gérer →</div>
            </div>

            <div 
              className="w-full min-h-[160px] p-5 bg-gradient-to-br from-emerald-400 via-sky-200 to-cyan-100 dark:!bg-slate-800 dark:[background-image:none] dark:border-sky-500/50 rounded-2xl shadow-xl border-4 border-white dark:border-2 hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between cursor-pointer"
              onClick={() => navigate('/agences')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-700/90 dark:text-slate-200">Agences</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.loading ? '...' : stats.agences}
                  </p>
                </div>
                <div className="bg-sky-300/60 dark:bg-sky-700/60 rounded-full p-3 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600/90 dark:text-slate-300 inline-flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {stats.loading ? 'Chargement...' : 'En service'}
              </div>
              <div className="mt-3 text-xs text-sky-700 dark:text-sky-300 font-medium">Cliquez pour gérer →</div>
            </div>

            <div 
              className="w-full min-h-[160px] p-5 bg-gradient-to-br from-emerald-400 via-sky-200 to-cyan-100 dark:!bg-slate-800 dark:[background-image:none] dark:border-sky-500/50 rounded-2xl shadow-xl border-4 border-white dark:border-2 hover:shadow-2xl hover:scale-105 transition-all duration-200 flex flex-col justify-between cursor-pointer"
              onClick={() => navigate('/communes')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-700/90 dark:text-slate-200">Communes</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.loading ? '...' : stats.communes}
                  </p>
                </div>
                <div className="bg-sky-300/60 dark:bg-sky-700/60 rounded-full p-3 flex items-center justify-center">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600/90 dark:text-slate-300 inline-flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {stats.loading ? 'Chargement...' : 'Couvrent'}
              </div>
              <div className="mt-3 text-xs text-sky-700 dark:text-sky-300 font-medium">Cliquez pour gérer →</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
