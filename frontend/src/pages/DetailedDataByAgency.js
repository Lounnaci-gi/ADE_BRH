import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Calendar, Filter, FileText, TrendingUp, AlertCircle, CheckCircle, Shield, Users, Zap, Eye, Wrench, DollarSign, ArrowUp, ArrowDown, Minus, Play } from 'lucide-react';
import kpiService from '../services/kpiService';
import authService from '../services/authService';

function DetailedDataByAgency() {
  const [agences, setAgences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailedData, setDetailedData] = useState([]);
  const [filters, setFilters] = useState({
    selectedAgence: '',
    date1: '', // Start date
    date2: ''  // End date
  });
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const user = authService.getCurrentUser();
  const isAdmin = (user?.role || '').toString() === 'Administrateur';

  // Fonction pour formater la monnaie
  const formatCurrency = (value) => {
    if (!value) return '0,00 DA';
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD'
    }).format(value);
  };

  // Fonction pour formater les pourcentages avec deux décimales
  const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0,00%';
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };

  // Charger les données des agences
  const loadAgences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const agencesData = await kpiService.getAgences();
      console.log('📊 Agences chargées:', agencesData);
      
      setAgences(agencesData);
    } catch (err) {
      console.error('❌ Erreur lors du chargement des agences:', err);
      setError('Erreur lors du chargement des agences');
    } finally {
      setLoading(false);
    }
  };

  // Charger les données détaillées pour l'agence sélectionnée
  const loadDetailedData = async () => {
    if (!filters.selectedAgence || !filters.date1 || !filters.date2) {
      setDetailedData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await kpiService.getDetailedData(
        filters.selectedAgence,
        filters.date1,
        filters.date2
      );
      
      setDetailedData(response.data || []);
      setFiltersApplied(true);
    } catch (err) {
      console.error('❌ Erreur lors du chargement des données détaillées:', err);
      setError('Erreur lors du chargement des données détaillées');
      setDetailedData([]);
    } finally {
      setLoading(false);
    }
  };

  // Gérer les changements de filtres
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setFiltersApplied(false);
  };

  // Chargement automatique des données quand tous les filtres sont remplis
  useEffect(() => {
    if (filters.selectedAgence && filters.date1 && filters.date2) {
      loadDetailedData();
    } else {
      setDetailedData([]);
      setFiltersApplied(false);
    }
  }, [filters.selectedAgence, filters.date1, filters.date2]);

  // Obtenir le nom de l'agence sélectionnée
  const getSelectedAgencyName = () => {
    const selectedAgency = agences.find(agence => agence.AgenceId.toString() === filters.selectedAgence);
    return selectedAgency ? selectedAgency.Nom_Agence : '';
  };

  // Calculer les données paginées
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return detailedData.slice(startIndex, endIndex);
  };

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(detailedData.length / itemsPerPage);

  // Réinitialiser la page quand les données changent
  useEffect(() => {
    setCurrentPage(1);
  }, [detailedData]);

  useEffect(() => {
    loadAgences();
  }, []);

  if (loading && agences.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Erreur</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        {/* En-tête de la page */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Données Détaillées par Agence</h1>
            <p className="text-gray-600">Sélectionnez une agence et un intervalle de dates</p>
          </div>
        </div>

        {/* Section Filtres */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Filtres</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtre par agence */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-purple-500" />
              </div>
              <select
                value={filters.selectedAgence}
                onChange={(e) => handleFilterChange('selectedAgence', e.target.value)}
                className="pl-10 pr-4 py-3 text-sm border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all duration-300 bg-white shadow-sm hover:shadow-md font-medium text-gray-700 w-full appearance-none"
              >
                <option value="">Sélectionner une agence</option>
                {agences.map((agence) => (
                  <option key={agence.AgenceId} value={agence.AgenceId}>
                    {agence.Nom_Agence}
                  </option>
                ))}
              </select>
              <label className="text-xs text-gray-500 mt-1 block">Agence</label>
            </div>

            {/* Filtre par date de début */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-green-500" />
              </div>
              <input
                type="date"
                value={filters.date1}
                onChange={(e) => handleFilterChange('date1', e.target.value)}
                className="pl-10 pr-4 py-3 text-sm border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all duration-300 bg-white shadow-sm hover:shadow-md font-medium text-gray-700 w-full"
                placeholder="Date de début"
              />
              <label className="text-xs text-gray-500 mt-1 block">Date de début</label>
            </div>

            {/* Filtre par date de fin */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-red-500" />
              </div>
              <input
                type="date"
                value={filters.date2}
                onChange={(e) => handleFilterChange('date2', e.target.value)}
                className="pl-10 pr-4 py-3 text-sm border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all duration-300 bg-white shadow-sm hover:shadow-md font-medium text-gray-700 w-full"
                placeholder="Date de fin"
              />
              <label className="text-xs text-gray-500 mt-1 block">Date de fin</label>
            </div>
          </div>
        </motion.div>

        {/* Message si aucun filtre n'est appliqué */}
        {!filtersApplied && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center"
          >
            <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
            <p className="text-yellow-800 font-medium">
              Veuillez sélectionner une agence et un intervalle de dates pour afficher les données.
            </p>
          </motion.div>
        )}

        {/* Contenu principal - Liste détaillée des encaissements */}
        {filtersApplied && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden"
          >
            {/* En-tête du tableau */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Données détaillées - {getSelectedAgencyName()}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Période: {filters.date1} au {filters.date2} ({detailedData.length} jour{detailedData.length > 1 ? 's' : ''})
              </p>
            </div>

            {/* Indicateur de chargement */}
            {loading && (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement des données...</p>
              </div>
            )}

            {/* Tableau des données */}
            {!loading && detailedData.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Aucune donnée disponible</p>
                <p className="text-sm">Aucune donnée disponible pour cette agence et cette période.</p>
              </div>
            ) : !loading && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-700 dark:from-slate-700 dark:to-slate-600 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">Date</th>
                      <th className="px-4 py-4 text-center font-semibold text-xs uppercase tracking-wider">Relances Envoyées</th>
                      <th className="px-4 py-4 text-center font-semibold text-xs uppercase tracking-wider">Relances Encaissées</th>
                      <th className="px-4 py-4 text-center font-semibold text-xs uppercase tracking-wider">Mises en Demeure</th>
                      <th className="px-4 py-4 text-center font-semibold text-xs uppercase tracking-wider">Mises en Demeure Encaissées</th>
                      <th className="px-4 py-4 text-center font-semibold text-xs uppercase tracking-wider">Dossiers Juridiques</th>
                      <th className="px-4 py-4 text-center font-semibold text-xs uppercase tracking-wider">Coupures</th>
                      <th className="px-4 py-4 text-center font-semibold text-xs uppercase tracking-wider">Rétablissements</th>
                      <th className="px-4 py-4 text-center font-semibold text-xs uppercase tracking-wider">Compteurs</th>
                      <th className="px-4 py-4 text-center font-semibold text-xs uppercase tracking-wider">Encaissement Global</th>
                      <th className="px-4 py-4 text-center font-semibold text-xs uppercase tracking-wider">Taux Encaissement (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                    {getPaginatedData().map((day, index) => {
                      // Calculer le taux d'encaissement
                      const totalRelances = (day.Nb_RelancesEnvoyees || 0) + (day.Nb_MisesEnDemeure_Envoyees || 0);
                      const totalEncaisses = (day.Nb_RelancesReglees || 0) + (day.Nb_MisesEnDemeure_Reglees || 0);
                      const tauxEncaissement = totalRelances > 0 ? (totalEncaisses / totalRelances) * 100 : 0;
                      
                      return (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-300 group"
                        >
                          <td className="px-4 py-4 text-gray-700 dark:text-gray-300 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {new Date(day.DateKPI).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors duration-200">
                              <div className="text-blue-700 dark:text-blue-300 font-bold text-sm">{day.Nb_RelancesEnvoyees || 0}</div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">{formatCurrency(day.Mt_RelancesEnvoyees || 0)}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors duration-200">
                              <div className="text-green-700 dark:text-green-300 font-bold text-sm">{day.Nb_RelancesReglees || 0}</div>
                              <div className="text-xs text-green-600 dark:text-green-400">{formatCurrency(day.Mt_RelancesReglees || 0)}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-2 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors duration-200">
                              <div className="text-yellow-700 dark:text-yellow-300 font-bold text-sm">{day.Nb_MisesEnDemeure_Envoyees || 0}</div>
                              <div className="text-xs text-yellow-600 dark:text-yellow-400">{formatCurrency(day.Mt_MisesEnDemeure_Envoyees || 0)}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-2 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors duration-200">
                              <div className="text-orange-700 dark:text-orange-300 font-bold text-sm">{day.Nb_MisesEnDemeure_Reglees || 0}</div>
                              <div className="text-xs text-orange-600 dark:text-orange-400">{formatCurrency(day.Mt_MisesEnDemeure_Reglees || 0)}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-2 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors duration-200">
                              <div className="text-red-700 dark:text-red-300 font-bold text-sm">{day.Nb_Dossiers_Juridiques || 0}</div>
                              <div className="text-xs text-red-600 dark:text-red-400">{formatCurrency(day.Mt_Dossiers_Juridiques || 0)}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-2 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors duration-200">
                              <div className="text-purple-700 dark:text-purple-300 font-bold text-sm">{day.Nb_Coupures || 0}</div>
                              <div className="text-xs text-purple-600 dark:text-purple-400">{formatCurrency(day.Mt_Coupures || 0)}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-2 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors duration-200">
                              <div className="text-indigo-700 dark:text-indigo-300 font-bold text-sm">{day.Nb_Retablissements || 0}</div>
                              <div className="text-xs text-indigo-600 dark:text-indigo-400">{formatCurrency(day.Mt_Retablissements || 0)}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="bg-cyan-100 dark:bg-cyan-900/30 rounded-lg p-2 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-900/50 transition-colors duration-200">
                              <div className="text-cyan-700 dark:text-cyan-300 font-bold text-sm">{day.Nb_Compteurs_Remplaces || 0}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-lg p-3 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors duration-200">
                              <div className="text-emerald-700 dark:text-emerald-300 font-bold text-base">{formatCurrency(day.Encaissement_Journalier_Global || 0)}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className={`rounded-lg p-2 group-hover:scale-105 transition-all duration-200 ${
                              tauxEncaissement >= 100 ? 'bg-green-100 dark:bg-green-900/30' :
                              tauxEncaissement >= 80 ? 'bg-blue-100 dark:bg-blue-900/30' :
                              tauxEncaissement >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                              'bg-red-100 dark:bg-red-900/30'
                            }`}>
                              <div className={`font-bold text-sm ${
                                tauxEncaissement >= 100 ? 'text-green-700 dark:text-green-300' :
                                tauxEncaissement >= 80 ? 'text-blue-700 dark:text-blue-300' :
                                tauxEncaissement >= 60 ? 'text-yellow-700 dark:text-yellow-300' :
                                'text-red-700 dark:text-red-300'
                              }`}>
                                {tauxEncaissement.toFixed(1)}%
                              </div>
                              <div className="flex items-center justify-center gap-1 mt-1">
                                {tauxEncaissement >= 100 ? <ArrowUp className="h-3 w-3 text-green-600" /> :
                                 tauxEncaissement >= 80 ? <ArrowUp className="h-3 w-3 text-blue-600" /> :
                                 tauxEncaissement >= 60 ? <Minus className="h-3 w-3 text-yellow-600" /> :
                                 <ArrowDown className="h-3 w-3 text-red-600" />}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Contrôles de pagination */}
            {!loading && detailedData.length > itemsPerPage && (
              <div className="bg-gray-50 dark:bg-slate-700 px-6 py-4 border-t border-gray-200 dark:border-slate-600">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, detailedData.length)} sur {detailedData.length} résultats
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentPage === 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-105'
                      }`}
                    >
                      Précédent
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        if (pageNum > totalPages) return null;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-blue-50 hover:scale-105'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentPage === totalPages
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-105'
                      }`}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default DetailedDataByAgency;