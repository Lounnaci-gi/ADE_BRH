import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Calendar, Building2, Filter, Trophy, Award } from 'lucide-react';
import kpiService from '../services/kpiService';
import agenceService from '../services/agenceService';
import ModernDatePicker from '../components/ModernDatePicker';

const Statistiques = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Il y a 30 jours par défaut
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agences, setAgences] = useState([]);

  useEffect(() => {
    loadAgences();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadStatistics();
    }
  }, [startDate, endDate]);

  const loadAgences = async () => {
    try {
      const response = await agenceService.list();
      setAgences(Array.isArray(response) ? response : (response?.data || []));
    } catch (err) {
      console.error('Erreur lors du chargement des agences:', err);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les statistiques pour chaque agence
      const promises = agences.map(async (agence) => {
        try {
          const detailedData = await kpiService.getDetailedData(
            agence.AgenceId,
            startDate,
            endDate
          );

          if (detailedData?.data && detailedData.data.length > 0) {
            // Calculer les moyennes de taux pour la période
            const totals = detailedData.data.reduce((acc, day) => {
              const objEncaissement = parseFloat(day.Obj_Encaissement) || 0;
              const realEncaissement = parseFloat(day.Encaissement_Journalier_Global) || 0;
              const tauxEncaissement = objEncaissement > 0 
                ? (realEncaissement / objEncaissement) * 100 
                : 0;

              const objRelances = parseFloat(day.Obj_Relances) || 0;
              const realRelances = parseFloat(day.Nb_RelancesEnvoyees) || 0;
              const tauxRelances = objRelances > 0 
                ? (realRelances / objRelances) * 100 
                : 0;

              const objMisesEnDemeure = parseFloat(day.Obj_MisesEnDemeure) || 0;
              const realMisesEnDemeure = parseFloat(day.Nb_MisesEnDemeure_Envoyees) || 0;
              const tauxMisesEnDemeure = objMisesEnDemeure > 0 
                ? (realMisesEnDemeure / objMisesEnDemeure) * 100 
                : 0;

              const objCompteursRemplaces = parseFloat(day.Obj_Compteurs_Remplaces) || 0;
              const realCompteursRemplaces = parseFloat(day.Nb_Compteurs_Remplaces) || 0;
              const tauxCompteursRemplaces = objCompteursRemplaces > 0 
                ? (realCompteursRemplaces / objCompteursRemplaces) * 100 
                : 0;

              return {
                tauxEncaissement: acc.tauxEncaissement + tauxEncaissement,
                tauxRelances: acc.tauxRelances + tauxRelances,
                tauxMisesEnDemeure: acc.tauxMisesEnDemeure + tauxMisesEnDemeure,
                tauxCompteursRemplaces: acc.tauxCompteursRemplaces + tauxCompteursRemplaces,
                count: acc.count + 1
              };
            }, { tauxEncaissement: 0, tauxRelances: 0, tauxMisesEnDemeure: 0, tauxCompteursRemplaces: 0, count: 0 });

            const avgTauxEncaissement = totals.count > 0 
              ? totals.tauxEncaissement / totals.count 
              : 0;
            const avgTauxRelances = totals.count > 0 
              ? totals.tauxRelances / totals.count 
              : 0;
            const avgTauxMisesEnDemeure = totals.count > 0 
              ? totals.tauxMisesEnDemeure / totals.count 
              : 0;
            const avgTauxCompteursRemplaces = totals.count > 0 
              ? totals.tauxCompteursRemplaces / totals.count 
              : 0;

            return {
              agence: agence.Nom_Agence || agence.nomAgence || 'N/A',
              centre: agence.Nom_Centre || agence.nomCentre || 'N/A',
              tauxEncaissement: Math.round(avgTauxEncaissement * 100) / 100,
              tauxRelances: Math.round(avgTauxRelances * 100) / 100,
              tauxMisesEnDemeure: Math.round(avgTauxMisesEnDemeure * 100) / 100,
              tauxCompteursRemplaces: Math.round(avgTauxCompteursRemplaces * 100) / 100
            };
          }
          return null;
        } catch (err) {
          console.error(`Erreur pour l'agence ${agence.AgenceId}:`, err);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const validData = results.filter(item => item !== null);
      setData(validData);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('La date de début doit être antérieure à la date de fin');
      return;
    }
    loadStatistics();
  };

  // Fonction pour générer une couleur unique pour chaque agence
  const getColorForAgency = (agenceName, index) => {
    const colors = [
      '#20B2AA', '#4682B4', '#9370DB', '#FF6B6B', '#4ECDC4', 
      '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE',
      '#85C1E2', '#F8B739', '#52BE80', '#EC7063', '#5DADE2',
      '#58D68D', '#F1948A', '#85C1E9', '#D7BDE2', '#A3E4D7'
    ];
    // Utiliser un hash basé sur le nom de l'agence pour une couleur cohérente
    let hash = 0;
    for (let i = 0; i < agenceName.length; i++) {
      hash = agenceName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Données pour les graphiques avec couleurs par agence
  const chartDataEncaissement = data.map((item, index) => ({
    name: item.agence.length > 15 ? item.agence.substring(0, 15) + '...' : item.agence,
    'Taux Encaissement (%)': item.tauxEncaissement,
    color: getColorForAgency(item.agence, index)
  }));

  const chartDataRelances = data.map((item, index) => ({
    name: item.agence.length > 15 ? item.agence.substring(0, 15) + '...' : item.agence,
    'Taux Relances (%)': item.tauxRelances,
    color: getColorForAgency(item.agence, index)
  }));

  const chartDataMisesEnDemeure = data.map((item, index) => ({
    name: item.agence.length > 15 ? item.agence.substring(0, 15) + '...' : item.agence,
    'Taux Mises en Demeure (%)': item.tauxMisesEnDemeure,
    color: getColorForAgency(item.agence, index)
  }));

  const chartDataCompteursRemplaces = data.map((item, index) => ({
    name: item.agence.length > 15 ? item.agence.substring(0, 15) + '...' : item.agence,
    'Taux Remplacement Compteurs (%)': item.tauxCompteursRemplaces,
    color: getColorForAgency(item.agence, index)
  }));

  // Top 3 agences par taux d'encaissement
  const top3Agences = [...data]
    .sort((a, b) => b.tauxEncaissement - a.tauxEncaissement)
    .slice(0, 3)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      medal: index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉',
      medalColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' // Or, Argent, Bronze
    }));

  return (
    <div className="p-6 text-gray-800 dark:text-slate-100 w-full min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-water-600 rounded-xl shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-water-900 dark:text-white">
                Statistiques des Agences
              </h1>
              <p className="text-water-600 dark:text-water-300 mt-1">
                Analyse des taux de performance par période
              </p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 bg-white dark:bg-slate-900 shadow-md rounded-xl p-6 border border-blue-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-water-600" />
            <h2 className="text-xl font-semibold text-water-900 dark:text-white">
              Filtres de période
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date de début
              </label>
              <ModernDatePicker
                value={startDate}
                onChange={(date) => setStartDate(date)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date de fin
              </label>
              <ModernDatePicker
                value={endDate}
                onChange={(date) => setEndDate(date)}
              />
            </div>
          </div>
          <button
            onClick={handleFilter}
            className="mt-4 bg-water-600 hover:bg-water-700 text-white px-6 py-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl flex items-center space-x-2"
          >
            <Calendar className="h-5 w-5" />
            <span>Appliquer les filtres</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-water-600"></div>
          </div>
        )}

        {/* Graphiques */}
        {!loading && data.length > 0 && (
          <div className="space-y-6">
            {/* Podium Top 3 Agences */}
            {top3Agences.length > 0 && (
              <div className="bg-white dark:bg-slate-900 shadow-md rounded-xl p-6 border border-blue-100 dark:border-slate-800">
                <div className="flex items-center space-x-2 mb-6">
                  <Trophy className="h-6 w-6 text-water-600" />
                  <h3 className="text-xl font-semibold text-water-900 dark:text-white">
                    Podium - Top 3 Agences (Taux d'Encaissement)
                  </h3>
                </div>
                <div className="flex items-end justify-center space-x-4 md:space-x-8">
                  {/* 2ème place (Argent) */}
                  {top3Agences[1] && (
                    <div className="flex flex-col items-center space-y-3">
                      <div 
                        className="w-24 md:w-32 h-32 md:h-40 bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500 rounded-t-lg shadow-lg flex flex-col items-center justify-start pt-4 border-2 border-gray-400 dark:border-gray-600"
                        style={{ height: '160px' }}
                      >
                        <div className="text-4xl mb-2">🥈</div>
                        <div className="text-lg font-bold text-gray-700 dark:text-gray-200">2ème</div>
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 text-center px-2 mt-2">
                          {top3Agences[1].agence.length > 20 
                            ? top3Agences[1].agence.substring(0, 20) + '...' 
                            : top3Agences[1].agence}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                          {top3Agences[1].tauxEncaissement}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {top3Agences[1].centre}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1ère place (Or) */}
                  {top3Agences[0] && (
                    <div className="flex flex-col items-center space-y-3">
                      <div 
                        className="w-28 md:w-36 h-40 md:h-48 bg-gradient-to-t from-yellow-400 to-yellow-300 dark:from-yellow-600 dark:to-yellow-500 rounded-t-lg shadow-xl flex flex-col items-center justify-start pt-4 border-2 border-yellow-500 dark:border-yellow-600"
                        style={{ height: '200px' }}
                      >
                        <div className="text-5xl mb-2">🥇</div>
                        <div className="text-xl font-bold text-yellow-900 dark:text-yellow-100">1er</div>
                        <div className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 text-center px-2 mt-2">
                          {top3Agences[0].agence.length > 20 
                            ? top3Agences[0].agence.substring(0, 20) + '...' 
                            : top3Agences[0].agence}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                          {top3Agences[0].tauxEncaissement}%
                        </div>
                        <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 font-medium">
                          {top3Agences[0].centre}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3ème place (Bronze) */}
                  {top3Agences[2] && (
                    <div className="flex flex-col items-center space-y-3">
                      <div 
                        className="w-24 md:w-32 h-24 md:h-32 bg-gradient-to-t from-amber-700 to-amber-600 dark:from-amber-800 dark:to-amber-700 rounded-t-lg shadow-lg flex flex-col items-center justify-start pt-4 border-2 border-amber-800 dark:border-amber-900"
                        style={{ height: '120px' }}
                      >
                        <div className="text-4xl mb-2">🥉</div>
                        <div className="text-lg font-bold text-amber-100 dark:text-amber-200">3ème</div>
                        <div className="text-sm font-semibold text-amber-100 dark:text-amber-200 text-center px-2 mt-2">
                          {top3Agences[2].agence.length > 20 
                            ? top3Agences[2].agence.substring(0, 20) + '...' 
                            : top3Agences[2].agence}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                          {top3Agences[2].tauxEncaissement}%
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                          {top3Agences[2].centre}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Graphique Taux d'Encaissement */}
            <div className="bg-white dark:bg-slate-900 shadow-md rounded-xl p-6 border border-blue-100 dark:border-slate-800">
              <h3 className="text-xl font-semibold text-water-900 dark:text-white mb-4">
                Taux d'Encaissement par Agence (%)
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartDataEncaissement}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px' }}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="Taux Encaissement (%)" 
                    radius={[8, 8, 0, 0]}
                  >
                    {chartDataEncaissement.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Graphique Taux de Relances */}
            <div className="bg-white dark:bg-slate-900 shadow-md rounded-xl p-6 border border-blue-100 dark:border-slate-800">
              <h3 className="text-xl font-semibold text-water-900 dark:text-white mb-4">
                Taux de Relances par Agence (%)
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartDataRelances}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px' }}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="Taux Relances (%)" 
                    radius={[8, 8, 0, 0]}
                  >
                    {chartDataRelances.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Graphique Taux de Mises en Demeure */}
            <div className="bg-white dark:bg-slate-900 shadow-md rounded-xl p-6 border border-blue-100 dark:border-slate-800">
              <h3 className="text-xl font-semibold text-water-900 dark:text-white mb-4">
                Taux de Mises en Demeure par Agence (%)
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartDataMisesEnDemeure}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px' }}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="Taux Mises en Demeure (%)" 
                    radius={[8, 8, 0, 0]}
                  >
                    {chartDataMisesEnDemeure.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Graphique Taux de Remplacement de Compteurs */}
            <div className="bg-white dark:bg-slate-900 shadow-md rounded-xl p-6 border border-blue-100 dark:border-slate-800">
              <h3 className="text-xl font-semibold text-water-900 dark:text-white mb-4">
                Taux de Remplacement de Compteurs par Agence (%)
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartDataCompteursRemplaces}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px' }}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="Taux Remplacement Compteurs (%)" 
                    radius={[8, 8, 0, 0]}
                  >
                    {chartDataCompteursRemplaces.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Message si pas de données */}
        {!loading && data.length === 0 && !error && (
          <div className="bg-white dark:bg-slate-900 shadow-md rounded-xl p-12 border border-blue-100 dark:border-slate-800 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-water-500" />
            <p className="text-lg text-water-600 dark:text-water-400">
              Aucune donnée disponible pour la période sélectionnée
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistiques;

