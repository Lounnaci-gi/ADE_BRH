import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building2, Calendar, Filter, FileText, TrendingUp, AlertCircle, CheckCircle, Shield, Users, Zap, Eye, Wrench, DollarSign, ArrowUp, ArrowDown, Minus, Play, Search, ChevronDown, X } from 'lucide-react';
import kpiService from '../services/kpiService';
import authService from '../services/authService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  
  // State for selected metrics in the evolution chart
  const [selectedMetrics, setSelectedMetrics] = useState({
    relancesEnvoyees: true,
    relancesEncaissees: true,
    misesEnDemeureEnvoyees: true,
    misesEnDemeureEncaisses: true,
    dossiersJuridiques: true,
    coupures: true,
    retablissements: true,
    encaissementGlobal: true
  });
  
  // State for objective data
  const [objectiveData, setObjectiveData] = useState(null);
  
  // States for enhanced filter components
  const [isAgencyDropdownOpen, setIsAgencyDropdownOpen] = useState(false);
  const [agencySearchTerm, setAgencySearchTerm] = useState('');
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const agencyButtonRef = useRef(null);

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
      setObjectiveData(null);
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
      
      const data = response.data || [];
      setDetailedData(data);
      
      // Extract objective data from the first row (Obj_Encaissement should be consistent across dates)
      if (data.length > 0 && data[0].Obj_Encaissement) {
        setObjectiveData(data[0]);
      }
      
      setFiltersApplied(true);
    } catch (err) {
      console.error('❌ Erreur lors du chargement des données détaillées:', err);
      setError('Erreur lors du chargement des données détaillées');
      setDetailedData([]);
      setObjectiveData(null);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAgencyDropdownOpen && !event.target.closest('.agency-dropdown-container')) {
        setIsAgencyDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAgencyDropdownOpen]);

  // Auto-reload data when filters change
  useEffect(() => {
    if (filters.selectedAgence && filters.date1 && filters.date2) {
      loadDetailedData();
    }
  }, [filters.selectedAgence, filters.date1, filters.date2]);

  // Toggle metric selection
  const toggleMetric = (metricKey) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metricKey]: !prev[metricKey]
    }));
  };

  // Enhanced filter functions
  const filteredAgencies = agences.filter(agence => 
    agence.Nom_Agence.toLowerCase().includes(agencySearchTerm.toLowerCase())
  );

  const formatDateRange = () => {
    if (filters.date1 && filters.date2) {
      const startDate = new Date(filters.date1).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      const endDate = new Date(filters.date2).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      return `${startDate} - ${endDate}`;
    }
    return 'Sélectionner une période';
  };

  const calculateDropdownPosition = (buttonRef) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

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

        {/* Professional Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtres de Recherche</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sélectionnez une agence et une période pour afficher les données</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
            {/* Agency Selector with Search */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agence
              </label>
              <div className="relative agency-dropdown-container">
                <button
                  ref={agencyButtonRef}
                  onClick={() => {
                    calculateDropdownPosition(agencyButtonRef);
                    setIsAgencyDropdownOpen(!isAgencyDropdownOpen);
                  }}
                  className="w-full px-4 py-3 text-left bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between"
                >
                  <span className={`truncate ${filters.selectedAgence ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    {filters.selectedAgence ? getSelectedAgencyName() : 'Sélectionner une agence'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isAgencyDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isAgencyDropdownOpen && (
                  <div className="fixed z-[9999] bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-xl max-h-80 overflow-hidden" style={{ 
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                    minWidth: '300px',
                    maxWidth: '90vw'
                  }}>
                    <div className="p-3 border-b border-gray-200 dark:border-slate-600">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Rechercher une agence..."
                          value={agencySearchTerm}
                          onChange={(e) => setAgencySearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredAgencies.map((agence) => (
                        <button
                          key={agence.AgenceId}
                          onClick={() => {
                            setFilters(prev => ({ ...prev, selectedAgence: agence.AgenceId.toString() }));
                            setIsAgencyDropdownOpen(false);
                            setAgencySearchTerm('');
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-slate-600 text-sm text-gray-900 dark:text-white transition-colors duration-150"
                        >
                          {agence.Nom_Agence}
                        </button>
                      ))}
                      {filteredAgencies.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          Aucune agence trouvée
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Date Range Picker */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Période
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Date de début</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={filters.date1}
                      onChange={(e) => setFilters(prev => ({ ...prev, date1: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="jj/mm/aaaa"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Date de fin</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={filters.date2}
                      onChange={(e) => setFilters(prev => ({ ...prev, date2: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="jj/mm/aaaa"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Status */}
          {filtersApplied && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span>
                  Filtres appliqués : <strong>{getSelectedAgencyName()}</strong> du {formatDateRange()}
                </span>
              </div>
            </motion.div>
          )}

          {/* Message d'instruction si aucun filtre n'est appliqué */}
          {!filtersApplied && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
            >
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                <AlertCircle className="h-4 w-4" />
                <span>Veuillez sélectionner une agence et une période pour afficher les données.</span>
              </div>
            </motion.div>
          )}
        </motion.div>


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

            {/* Résumé de la période */}
            {!loading && detailedData.length > 0 && objectiveData && (
              <div className="px-6 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 border-b border-gray-200 dark:border-slate-600">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">
                    <strong>Période:</strong> {detailedData.length} jour{detailedData.length > 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Objectif Total:</strong> {formatCurrency(objectiveData?.Obj_Encaissement ? objectiveData.Obj_Encaissement * detailedData.length : 0)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">
                      <strong>Total Encaissement:</strong> {formatCurrency(detailedData.reduce((sum, day) => sum + (day.Encaissement_Journalier_Global || 0), 0))}
                    </span>
                    {(() => {
                      // Calculer le Taux Global pour toute la période
                      // Numerator: Somme totale de tous les Encaissement_Journalier_Global
                      const totalEncaissement = detailedData.reduce((sum, day) => sum + (day.Encaissement_Journalier_Global || 0), 0);
                      
                      // Denominator: Objectif total pour la période entière
                      // L'objectif doit être multiplié par le nombre de jours pour obtenir l'objectif total de la période
                      const objectifEncaissement = objectiveData?.Obj_Encaissement || 0;
                      const totalObjectifPériode = objectifEncaissement * detailedData.length;
                      
                      // Taux Global (%) = (Total Encaissement / Total Objectif Période) × 100
                      const tauxGlobal = totalObjectifPériode > 0 ? (totalEncaissement / totalObjectifPériode) * 100 : 0;
                      return (
                        <span className={`font-bold ${
                          tauxGlobal >= 100 ? 'text-green-700 dark:text-green-300' :
                          tauxGlobal >= 80 ? 'text-blue-700 dark:text-blue-300' :
                          tauxGlobal >= 60 ? 'text-yellow-700 dark:text-yellow-300' :
                          'text-red-700 dark:text-red-300'
                        }`}>
                          <strong>Taux Global:</strong> {tauxGlobal.toFixed(1)}%
                        </span>
                      );
                    })()}
                  </div>
                </div>
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
                <table className="min-w-full text-[0.65rem]">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-700 dark:from-slate-700 dark:to-slate-600 dark:text-gray-300">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold text-[0.65rem] uppercase tracking-wide">Date</th>
                      <th className="px-2 py-2 text-center font-semibold text-[0.65rem] uppercase tracking-wide">Relances</th>
                      <th className="px-2 py-2 text-center font-semibold text-[0.65rem] uppercase tracking-wide">Rel. Encaissées</th>
                      <th className="px-2 py-2 text-center font-semibold text-[0.65rem] uppercase tracking-wide">M.D.</th>
                      <th className="px-2 py-2 text-center font-semibold text-[0.65rem] uppercase tracking-wide">M.D. Encaissées</th>
                      <th className="px-2 py-2 text-center font-semibold text-[0.65rem] uppercase tracking-wide">Juridique</th>
                      <th className="px-2 py-2 text-center font-semibold text-[0.65rem] uppercase tracking-wide">Coupures</th>
                      <th className="px-2 py-2 text-center font-semibold text-[0.65rem] uppercase tracking-wide">Rétablis.</th>
                      <th className="px-2 py-2 text-center font-semibold text-[0.65rem] uppercase tracking-wide">Compteurs</th>
                      <th className="px-2 py-2 text-center font-semibold text-[0.65rem] uppercase tracking-wide">Encaissement</th>
                      <th className="px-2 py-2 text-center font-semibold text-[0.65rem] uppercase tracking-wide">Taux %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                    {getPaginatedData().map((day, index) => {
                      // Calculer le Taux Journalier pour ce jour spécifique
                      // Taux Journalier (%) = (Encaissement_Journalier_Global du jour / Obj_Encaissement) × 100
                      const encaissementJournalier = day.Encaissement_Journalier_Global || 0;
                      const objectifEncaissement = objectiveData?.Obj_Encaissement || 0;
                      const tauxJournalier = objectifEncaissement > 0 
                        ? (encaissementJournalier / objectifEncaissement) * 100 
                        : 0;
                      
                      return (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-300 group"
                        >
                          <td className="px-2 py-2 text-gray-700 dark:text-gray-300 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-[0.7rem]">{new Date(day.DateKPI).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="bg-blue-100 dark:bg-blue-900/30 rounded p-1 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors duration-200">
                              <div className="text-blue-700 dark:text-blue-300 font-semibold text-[0.75rem]">{day.Nb_RelancesEnvoyees || 0}</div>
                              <div className="text-[0.65rem] text-blue-600 dark:text-blue-400 truncate">{formatCurrency(day.Mt_RelancesEnvoyees || 0)}</div>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="bg-green-100 dark:bg-green-900/30 rounded p-1 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors duration-200">
                              <div className="text-green-700 dark:text-green-300 font-semibold text-[0.75rem]">{day.Nb_RelancesReglees || 0}</div>
                              <div className="text-[0.65rem] text-green-600 dark:text-green-400 truncate">{formatCurrency(day.Mt_RelancesReglees || 0)}</div>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded p-1 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors duration-200">
                              <div className="text-yellow-700 dark:text-yellow-300 font-semibold text-[0.75rem]">{day.Nb_MisesEnDemeure_Envoyees || 0}</div>
                              <div className="text-[0.65rem] text-yellow-600 dark:text-yellow-400 truncate">{formatCurrency(day.Mt_MisesEnDemeure_Envoyees || 0)}</div>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="bg-orange-100 dark:bg-orange-900/30 rounded p-1 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors duration-200">
                              <div className="text-orange-700 dark:text-orange-300 font-semibold text-[0.75rem]">{day.Nb_MisesEnDemeure_Reglees || 0}</div>
                              <div className="text-[0.65rem] text-orange-600 dark:text-orange-400 truncate">{formatCurrency(day.Mt_MisesEnDemeure_Reglees || 0)}</div>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="bg-red-100 dark:bg-red-900/30 rounded p-1 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors duration-200">
                              <div className="text-red-700 dark:text-red-300 font-semibold text-[0.75rem]">{day.Nb_Dossiers_Juridiques || 0}</div>
                              <div className="text-[0.65rem] text-red-600 dark:text-red-400 truncate">{formatCurrency(day.Mt_Dossiers_Juridiques || 0)}</div>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="bg-purple-100 dark:bg-purple-900/30 rounded p-1 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors duration-200">
                              <div className="text-purple-700 dark:text-purple-300 font-semibold text-[0.75rem]">{day.Nb_Coupures || 0}</div>
                              <div className="text-[0.65rem] text-purple-600 dark:text-purple-400 truncate">{formatCurrency(day.Mt_Coupures || 0)}</div>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded p-1 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors duration-200">
                              <div className="text-indigo-700 dark:text-indigo-300 font-semibold text-[0.75rem]">{day.Nb_Retablissements || 0}</div>
                              <div className="text-[0.65rem] text-indigo-600 dark:text-indigo-400 truncate">{formatCurrency(day.Mt_Retablissements || 0)}</div>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="bg-cyan-100 dark:bg-cyan-900/30 rounded p-1 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-900/50 transition-colors duration-200">
                              <div className="text-cyan-700 dark:text-cyan-300 font-semibold text-[0.75rem]">{day.Nb_Compteurs_Remplaces || 0}</div>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded p-1 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors duration-200">
                              <div className="text-emerald-700 dark:text-emerald-300 font-bold text-[0.75rem] truncate">{formatCurrency(day.Encaissement_Journalier_Global || 0)}</div>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className={`rounded p-1 group-hover:scale-105 transition-all duration-200 ${
                              tauxJournalier >= 100 ? 'bg-green-100 dark:bg-green-900/30' :
                              tauxJournalier >= 80 ? 'bg-blue-100 dark:bg-blue-900/30' :
                              tauxJournalier >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                              'bg-red-100 dark:bg-red-900/30'
                            }`}>
                              <div className={`font-bold text-[0.7rem] ${
                                tauxJournalier >= 100 ? 'text-green-700 dark:text-green-300' :
                                tauxJournalier >= 80 ? 'text-blue-700 dark:text-blue-300' :
                                tauxJournalier >= 60 ? 'text-yellow-700 dark:text-yellow-300' :
                                'text-red-700 dark:text-red-300'
                              }`}>
                                {tauxJournalier.toFixed(1)}%
                              </div>
                              <div className="flex items-center justify-center gap-0.5 mt-0.5">
                                {tauxJournalier >= 100 ? (
                                  <>
                                    <ArrowUp className="h-2 w-2 text-green-600" />
                                    <span className="text-[0.6rem] text-green-600 font-bold">+{(tauxJournalier - 100).toFixed(1)}</span>
                                  </>
                                ) : tauxJournalier >= 80 ? (
                                  <ArrowUp className="h-2 w-2 text-blue-600" />
                                ) : tauxJournalier >= 60 ? (
                                  <Minus className="h-2 w-2 text-yellow-600" />
                                ) : (
                                  <ArrowDown className="h-2 w-2 text-red-600" />
                                )}
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

        {/* Graphique d'Evolution - Evolution Chart */}
        {filtersApplied && !loading && detailedData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mt-6"
          >
            {/* En-tête du graphique */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-700 dark:to-slate-600 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      Évolution des Indicateurs de Performance
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getSelectedAgencyName()} - {filters.date1} au {filters.date2}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Selector Component for Metrics */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Afficher:</span>
                {Object.entries({
                  relancesEnvoyees: { label: 'Relances Envoyées', color: '#3b82f6' },
                  relancesEncaissees: { label: 'Relances Encaissées', color: '#10b981' },
                  misesEnDemeureEnvoyees: { label: 'Mises en Demeure', color: '#f59e0b' },
                  misesEnDemeureEncaisses: { label: 'MD Encaissées', color: '#ef4444' },
                  dossiersJuridiques: { label: 'Dossiers Juridiques', color: '#8b5cf6' },
                  coupures: { label: 'Coupures', color: '#ec4899' },
                  retablissements: { label: 'Rétablissements', color: '#06b6d4' },
                  encaissementGlobal: { label: 'Encaissement Global', color: '#14b8a6' }
                }).map(([key, { label, color }]) => (
                  <button
                    key={key}
                    onClick={() => toggleMetric(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border-2 ${
                      selectedMetrics[key]
                        ? 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border-current shadow-sm'
                        : 'bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-400 border-transparent'
                    }`}
                    style={selectedMetrics[key] ? { 
                      borderColor: color,
                      color: color 
                    } : {}}
                  >
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: selectedMetrics[key] ? color : '#9ca3af' }}
                      />
                      {label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Graphique */}
            <div className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={detailedData.map(day => ({
                    date: new Date(day.DateKPI).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                    relancesEnvoyees: day.Nb_RelancesEnvoyees || 0,
                    relancesEncaissees: day.Nb_RelancesReglees || 0,
                    misesEnDemeureEnvoyees: day.Nb_MisesEnDemeure_Envoyees || 0,
                    misesEnDemeureEncaisses: day.Nb_MisesEnDemeure_Reglees || 0,
                    dossiersJuridiques: day.Nb_Dossiers_Juridiques || 0,
                    coupures: day.Nb_Coupures || 0,
                    retablissements: day.Nb_Retablissements || 0,
                    encaissementGlobal: (day.Encaissement_Journalier_Global || 0) / 1000
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      padding: '10px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  {selectedMetrics.relancesEnvoyees && (
                    <Line 
                      type="monotone" 
                      dataKey="relancesEnvoyees" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Relances Envoyées"
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                  {selectedMetrics.relancesEncaissees && (
                    <Line 
                      type="monotone" 
                      dataKey="relancesEncaissees" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Relances Encaissées"
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                  {selectedMetrics.misesEnDemeureEnvoyees && (
                    <Line 
                      type="monotone" 
                      dataKey="misesEnDemeureEnvoyees" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Mises en Demeure"
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                  {selectedMetrics.misesEnDemeureEncaisses && (
                    <Line 
                      type="monotone" 
                      dataKey="misesEnDemeureEncaisses" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="MD Encaissées"
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                  {selectedMetrics.dossiersJuridiques && (
                    <Line 
                      type="monotone" 
                      dataKey="dossiersJuridiques" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Dossiers Juridiques"
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                  {selectedMetrics.coupures && (
                    <Line 
                      type="monotone" 
                      dataKey="coupures" 
                      stroke="#ec4899" 
                      strokeWidth={2}
                      name="Coupures"
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                  {selectedMetrics.retablissements && (
                    <Line 
                      type="monotone" 
                      dataKey="retablissements" 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      name="Rétablissements"
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                  {selectedMetrics.encaissementGlobal && (
                    <Line 
                      type="monotone" 
                      dataKey="encaissementGlobal" 
                      stroke="#14b8a6" 
                      strokeWidth={3}
                      name="Encaissement Global (x1000 DA)"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default DetailedDataByAgency;