import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building2, Calendar, Filter, FileText, TrendingUp, AlertCircle, CheckCircle, Shield, Users, Zap, Eye, Wrench, DollarSign, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import kpiService from '../services/kpiService';
import authService from '../services/authService';

function BilansDetailles() {
  const [agences, setAgences] = useState([]);
  const [filteredAgences, setFilteredAgences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryTotals, setSummaryTotals] = useState(null);
  const [encaissementRates, setEncaissementRates] = useState([]); // { agenceId, nom, rate }
  const [ratesLoading, setRatesLoading] = useState(false);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    startDate: '',
    endDate: '',
    selectedAgence: ''
  });
  const [compactMode, setCompactMode] = useState(false);
  const chartRef = useRef(null);

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
  const loadAgencesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const agencesData = await kpiService.getAgences();
      setAgences(agencesData);
      setFilteredAgences(agencesData);
    } catch (err) {
      console.error('Erreur lors du chargement des agences:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les agences
  const filterAgences = () => {
    // Pour l'instant, on retourne toutes les agences
    // Plus tard, on pourra ajouter des filtres par date
    setFilteredAgences(agences);
  };

  // Calculer les totaux pour le résumé
  const calculateSummaryTotals = async () => {
    try {
      const dateStr = filters.date;
      const dateKey = parseInt(
        dateStr.replace(/-/g, '')
      );
      
      // Utiliser le nouvel endpoint global-summary
      const globalData = await kpiService.getGlobalSummary(dateKey);
      
      if (globalData && globalData.global) {
        const global = globalData.global;
        setSummaryTotals({
          totalRelancesEnvoyees: global.Total_RelancesEnvoyees || 0,
          totalMtRelancesEnvoyees: global.Total_Mt_RelancesEnvoyees || 0,
          totalRelancesReglees: global.Total_RelancesReglees || 0,
          totalMtRelancesReglees: global.Total_Mt_RelancesReglees || 0,
          totalMisesEnDemeureEnvoyees: global.Total_MisesEnDemeureEnvoyees || 0,
          totalMtMisesEnDemeureEnvoyees: global.Total_Mt_MisesEnDemeureEnvoyees || 0,
          totalMisesEnDemeureReglees: global.Total_MisesEnDemeureReglees || 0,
          totalMtMisesEnDemeureReglees: global.Total_Mt_MisesEnDemeureReglees || 0,
          totalDossiersJuridiques: global.Total_DossiersJuridiques || 0,
          totalMtDossiersJuridiques: global.Total_Mt_DossiersJuridiques || 0,
          totalCoupures: global.Total_Coupures || 0,
          totalMtCoupures: global.Total_Mt_Coupures || 0,
          totalRetablissements: global.Total_Retablissements || 0,
          totalMtRetablissements: global.Total_Mt_Retablissements || 0,
          totalCompteursRemplaces: global.Total_CompteursRemplaces || 0,
          totalEncaissementGlobal: global.Total_EncaissementGlobal || 0,
          totalAgences: global.Total_Agences || 0,
          agencesAvecDonnees: global.Agences_Avec_Donnees || 0,
          // Ajouter les taux
          tauxRelances: global.Taux_Relances || 0,
          tauxMisesEnDemeure: global.Taux_MisesEnDemeure || 0,
          tauxDossiersJuridiques: global.Taux_DossiersJuridiques || 0,
          tauxCoupures: global.Taux_Coupures || 0,
          tauxControles: global.Taux_Controles || 0,
          tauxCompteursRemplaces: global.Taux_CompteursRemplaces || 0,
          tauxEncaissement: global.Taux_Encaissement || 0,
          // Ajouter les objectifs totaux
          totalObjRelances: global.Total_Obj_Relances || 0,
          totalObjMisesEnDemeure: global.Total_Obj_MisesEnDemeure || 0,
          totalObjDossiersJuridiques: global.Total_Obj_DossiersJuridiques || 0,
          totalObjCoupures: global.Total_Obj_Coupures || 0,
          totalObjControles: global.Total_Obj_Controles || 0,
          totalObjCompteursRemplaces: global.Total_Obj_CompteursRemplaces || 0,
          totalObjEncaissement: global.Total_Obj_Encaissement || 0
        });
      } else {
        setSummaryTotals(null);
          }
        } catch (err) {
      console.error('Erreur lors du calcul des totaux:', err);
      setSummaryTotals(null);
    }
  };

  const ensureHtml2Canvas = () => new Promise((resolve, reject) => {
    if (window.html2canvas) return resolve(window.html2canvas);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.async = true;
    script.onload = () => resolve(window.html2canvas);
    script.onerror = () => reject(new Error('Impossible de charger html2canvas'));
    document.body.appendChild(script);
  });

  const handleExportPng = async () => {
    try {
      const html2canvas = await ensureHtml2Canvas();
      if (!chartRef.current) return;
      const canvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `taux-encaissement-${filters.date}.png`;
      link.click();
    } catch (e) {
      console.error('Erreur export PNG:', e);
      alert("Erreur lors de l'export PNG. Réessayez.");
    }
  };

  // Charger les taux d'encaissement par agence (pour le graphique)
  const loadEncaissementRates = async () => {
    try {
      setRatesLoading(true);
      const dateStr = filters.date;
      const dateKey = parseInt(dateStr.replace(/-/g, ''));
      const agenciesToFetch = filteredAgences.length > 0 ? filteredAgences : agences;
      const results = await Promise.all(
        agenciesToFetch.map(async (a) => {
          try {
            const data = await kpiService.getSummary(a.AgenceId, dateKey);
            const rate = data?.daily?.TauxEncaissementGlobal ?? 0;
            return { agenceId: a.AgenceId, nom: a.Nom_Agence, rate: Number(rate) };
          } catch (e) {
            return { agenceId: a.AgenceId, nom: a.Nom_Agence, rate: 0 };
          }
        })
      );
      // Trier par taux décroissant
      results.sort((a, b) => b.rate - a.rate);
      setEncaissementRates(results);
    } catch (e) {
      console.error('Erreur lors du chargement des taux par agence:', e);
      setEncaissementRates([]);
    } finally {
      setRatesLoading(false);
    }
  };


  // Gestion des changements de filtre
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Chargement initial
  useEffect(() => {
    if (isAdmin) {
      loadAgencesData();
    }
  }, [isAdmin]);

  // Re-filtrer quand les filtres changent
  useEffect(() => {
    filterAgences();
  }, [filters, agences]);

  // Calculer les totaux quand les agences filtrées changent
  useEffect(() => {
    if (filteredAgences.length > 0) {
      calculateSummaryTotals();
    }
  }, [filteredAgences, filters.date]);

  // Recharger les taux quand la liste affichée ou la date change
  useEffect(() => {
    if ((filteredAgences.length > 0 || agences.length > 0) && filters.date) {
      loadEncaissementRates();
    }
  }, [filteredAgences, agences, filters.date]);

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-4">Accès Refusé</h1>
          <p className="text-gray-600 dark:text-slate-300">Vous n'avez pas les permissions nécessaires.</p>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Veuillez vous connecter avec un compte administrateur.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-slate-300">Chargement des bilans détaillés...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-300 font-medium">Erreur</h3>
          <p className="text-red-700 dark:text-red-300">{error}</p>
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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Bilans Liste Détaillés</h1>
            <p className="text-gray-600 dark:text-slate-300">Données détaillées par agence</p>
          </div>
        </div>

        {/* Filtre pour le résumé global */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-gradient-to-r from-white to-blue-50/30 dark:from-slate-900 dark:to-slate-900 border border-blue-200/50 dark:border-slate-700 rounded-2xl p-6 shadow-lg backdrop-blur-sm mb-6"
        >
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-slate-100">Filtre Résumé Global</span>
            </div>
          </div>
            
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4">
            {/* Filtre par date simple (pour le résumé global) */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              </div>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="pl-10 pr-4 py-3 text-sm border-2 border-blue-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-300 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 shadow-sm hover:shadow-md font-medium w-full"
                placeholder="Date pour résumé global"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <label className="text-xs text-gray-500 dark:text-slate-400 mt-1 block">Résumé Global</label>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Tableau des agences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-slate-900 border-2 border-gray-200/50 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg"
      >
        {filteredAgences.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-slate-900">
            <Building2 className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-slate-300 mb-2">Aucune agence trouvée</h3>
            <p className="text-gray-500 dark:text-slate-400">Aucune agence ne correspond aux critères de filtrage.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 text-gray-700 dark:text-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-xs">Agence</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs">Centre</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Relances Envoyées</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Relances Encaissées</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Mises en Demeure Envoyées</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Mises en Demeure Encaissées</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Dossiers Juridiques</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Coupures</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Rétablissements</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Compteurs Remplacés</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Encaissement Global</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Taux Encaissement (%)</th>
                </tr>
              </thead>
              <tbody className="dark:text-slate-100">
                {filteredAgences.map((agence, index) => (
                  <AgencyRow key={agence.AgenceId} agence={agence} index={index} filters={filters} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>


      {/* Section Résumé */}
      {summaryTotals && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-blue-200/50 dark:border-slate-700 shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-2xl font-bold text-white flex items-center gap-3"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <TrendingUp className="h-6 w-6" />
              </motion.div>
              Résumé Global - {filters.date}
              <span className="text-blue-200 ml-2">
                ({summaryTotals.agencesAvecDonnees}/{summaryTotals.totalAgences} agences avec données)
              </span>
            </motion.h2>
          </div>
          
          <div className="p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {/* Relances Envoyées */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-cyan-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
                    <AlertCircle className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">{summaryTotals.totalRelancesEnvoyees}</div>
                    <div className="text-sm text-cyan-600 dark:text-cyan-400">Relances Envoyées</div>
                  </div>
                </div>
                <div className="space-y-2">
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  Montant: {formatCurrency(summaryTotals.totalMtRelancesEnvoyees)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-slate-400">Taux:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-cyan-700 dark:text-cyan-400">{summaryTotals.tauxRelances}%</span>
                      <div className={`w-2 h-2 rounded-full ${summaryTotals.tauxRelances >= 100 ? 'bg-green-500' : summaryTotals.tauxRelances >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-slate-500">
                    Objectif: {summaryTotals.totalObjRelances}
                  </div>
                </div>
              </div>

              {/* Relances Encaissées */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-all duration-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-700">{summaryTotals.totalRelancesReglees}</div>
                    <div className="text-sm text-green-600">Relances Encaissées</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Montant: {formatCurrency(summaryTotals.totalMtRelancesReglees)}
                </div>
              </div>

              {/* Mises en Demeure */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-yellow-200 shadow-sm hover:shadow-md transition-all duration-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Shield className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-700">{summaryTotals.totalMisesEnDemeureEnvoyees}</div>
                    <div className="text-sm text-yellow-600">Mises en Demeure</div>
                  </div>
                </div>
                <div className="space-y-2">
                <div className="text-xs text-gray-500">
                  Montant: {formatCurrency(summaryTotals.totalMtMisesEnDemeureEnvoyees)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Taux:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-yellow-700">{summaryTotals.tauxMisesEnDemeure}%</span>
                      <div className={`w-2 h-2 rounded-full ${summaryTotals.tauxMisesEnDemeure >= 100 ? 'bg-green-500' : summaryTotals.tauxMisesEnDemeure >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Objectif: {summaryTotals.totalObjMisesEnDemeure}
                  </div>
                </div>
              </div>

              {/* Mises en Demeure Encaissées */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-all duration-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-700">{summaryTotals.totalMisesEnDemeureReglees}</div>
                    <div className="text-sm text-orange-600">Mises en Demeure Encaissées</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Montant: {formatCurrency(summaryTotals.totalMtMisesEnDemeureReglees)}
                </div>
              </div>

              {/* Dossiers Juridiques */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-all duration-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-700">{summaryTotals.totalDossiersJuridiques}</div>
                    <div className="text-sm text-orange-600">Dossiers Juridiques</div>
                  </div>
                </div>
                <div className="space-y-2">
                <div className="text-xs text-gray-500">
                  Montant: {formatCurrency(summaryTotals.totalMtDossiersJuridiques)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Taux:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-orange-700">{summaryTotals.tauxDossiersJuridiques}%</span>
                      <div className={`w-2 h-2 rounded-full ${summaryTotals.tauxDossiersJuridiques >= 100 ? 'bg-green-500' : summaryTotals.tauxDossiersJuridiques >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Objectif: {summaryTotals.totalObjDossiersJuridiques}
                  </div>
                </div>
              </div>

              {/* Coupures */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-all duration-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <Zap className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-700">{summaryTotals.totalCoupures}</div>
                    <div className="text-sm text-red-600">Coupures</div>
                  </div>
                </div>
                <div className="space-y-2">
                <div className="text-xs text-gray-500">
                  Montant: {formatCurrency(summaryTotals.totalMtCoupures)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Taux:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-red-700">{summaryTotals.tauxCoupures}%</span>
                      <div className={`w-2 h-2 rounded-full ${summaryTotals.tauxCoupures >= 100 ? 'bg-green-500' : summaryTotals.tauxCoupures >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Objectif: {summaryTotals.totalObjCoupures}
                  </div>
                </div>
              </div>

              {/* Rétablissements */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-700">{summaryTotals.totalRetablissements}</div>
                    <div className="text-sm text-emerald-600">Rétablissements</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Montant: {formatCurrency(summaryTotals.totalMtRetablissements)}
                </div>
              </div>

              {/* Compteurs Remplacés */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-all duration-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Wrench className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-700">{summaryTotals.totalCompteursRemplaces}</div>
                    <div className="text-sm text-purple-600">Compteurs Remplacés</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Taux:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-purple-700">{summaryTotals.tauxCompteursRemplaces}%</span>
                      <div className={`w-2 h-2 rounded-full ${summaryTotals.tauxCompteursRemplaces >= 100 ? 'bg-green-500' : summaryTotals.tauxCompteursRemplaces >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Objectif: {summaryTotals.totalObjCompteursRemplaces}
                  </div>
                </div>
              </div>

              {/* Encaissement Global */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-700">{formatCurrency(summaryTotals.totalEncaissementGlobal)}</div>
                    <div className="text-sm text-emerald-600">Encaissement Global</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Taux:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-emerald-700">{summaryTotals.tauxEncaissement}%</span>
                      <div className={`w-2 h-2 rounded-full ${summaryTotals.tauxEncaissement >= 100 ? 'bg-green-500' : summaryTotals.tauxEncaissement >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Objectif: {formatCurrency(summaryTotals.totalObjEncaissement)}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Graphique: Taux d'encaissement global par agence */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8"
      >
        <div className="bg-white border border-blue-200/50 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-white" />
            <h3 className="text-white font-semibold">Taux d'encaissement global par agence</h3>
            <span className="text-blue-200 text-xs ml-auto">{filters.date}</span>
            <div className="flex items-center gap-3 ml-4">
              <label className="flex items-center gap-2 text-xs text-blue-100">
                <input type="checkbox" className="accent-blue-300" checked={compactMode} onChange={(e) => setCompactMode(e.target.checked)} />
                Mode compact
              </label>
              <button onClick={handleExportPng} className="px-2 py-1 rounded-md text-xs bg-white/15 text-white hover:bg-white/25 transition">
                Exporter PNG
              </button>
            </div>
          </div>
          <div className="p-6" ref={chartRef}>
            {ratesLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : encaissementRates.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">Aucune donnée de taux disponible.</div>
            ) : (
              <div className={compactMode ? 'space-y-2' : 'space-y-3'}>
                {(() => {
                  const maxRate = Math.max(100, ...encaissementRates.map(r => r.rate || 0));
                  return encaissementRates.map((r, idx) => {
                    const widthPct = Math.max(0, Math.min(100, Math.round((r.rate / maxRate) * 100)));
                    return (
                      <div key={r.agenceId} className={compactMode ? 'grid grid-cols-12 items-center gap-2' : 'grid grid-cols-12 items-center gap-3'}>
                        <div className="col-span-3 md:col-span-2 lg:col-span-2 truncate text-[11px] md:text-xs font-medium text-gray-700" title={r.nom}>{r.nom}</div>
                        <div className="col-span-7 md:col-span-8 lg:col-span-9">
                          <div className={compactMode ? 'h-2.5 w-full rounded-full bg-slate-100 overflow-hidden' : 'h-3.5 w-full rounded-full bg-slate-100 overflow-hidden'}>
                            <div
                              className={`h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500`}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                        <div className={compactMode ? 'col-span-2 md:col-span-2 lg:col-span-1 text-right text-[11px] md:text-xs font-semibold text-gray-800' : 'col-span-2 md:col-span-2 lg:col-span-1 text-right text-xs font-semibold text-gray-800'}>
                          {r.rate?.toFixed ? r.rate.toFixed(2) : Number(r.rate || 0).toFixed(2)}%
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Composant pour une ligne d'agence
const AgencyRow = ({ agence, index, filters }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadDetails = async () => {
    setLoading(true);
    try {
      console.log('🔍 DEBUG loadDetails - Filtres reçus:', filters);
      
      // Utiliser les filtres de date sélectionnés
      let dateKey;
      
      if (filters.date) {
        // Format YYYYMMDD pour une date spécifique
        const date = new Date(filters.date);
        dateKey = parseInt(
          date.getFullYear().toString() + 
          String(date.getMonth() + 1).padStart(2, '0') + 
          String(date.getDate()).padStart(2, '0')
        );
        console.log('🔍 DEBUG loadDetails - Date spécifique:', { filtersDate: filters.date, date, dateKey });
      } else if (filters.mois && filters.annee) {
        // Pour un mois spécifique, utiliser le premier jour du mois
        const date = new Date(filters.annee, filters.mois - 1, 1);
        dateKey = parseInt(
          date.getFullYear().toString() + 
          String(date.getMonth() + 1).padStart(2, '0') + 
          String(date.getDate()).padStart(2, '0')
        );
        console.log('🔍 DEBUG loadDetails - Mois spécifique:', { mois: filters.mois, annee: filters.annee, date, dateKey });
      } else if (filters.annee) {
        // Pour une année spécifique, utiliser le premier jour de l'année
        const date = new Date(filters.annee, 0, 1);
        dateKey = parseInt(
          date.getFullYear().toString() + 
          String(date.getMonth() + 1).padStart(2, '0') + 
          String(date.getDate()).padStart(2, '0')
        );
        console.log('🔍 DEBUG loadDetails - Année spécifique:', { annee: filters.annee, date, dateKey });
      } else {
        // Par défaut, utiliser la date d'aujourd'hui
        const today = new Date();
        dateKey = parseInt(
          today.getFullYear().toString() + 
          String(today.getMonth() + 1).padStart(2, '0') + 
          String(today.getDate()).padStart(2, '0')
        );
        console.log('🔍 DEBUG loadDetails - Date par défaut:', { today, dateKey });
      }
      
      console.log('🔍 DEBUG loadDetails - Appel API avec:', { agenceId: agence.AgenceId, dateKey });
      const summaryData = await kpiService.getSummary(agence.AgenceId, dateKey);
      console.log('📊 DEBUG loadDetails - Données reçues:', summaryData);
      
      // Vérifier si on a des données valides
      if (summaryData && summaryData.daily) {
        const hasData = Object.values(summaryData.daily).some(val => val !== null && val !== undefined && val !== 0);
        if (hasData) {
          console.log('✅ Données trouvées pour l\'agence', agence.AgenceId);
          setDetails(summaryData);
        } else {
          console.log('⚠️ Aucune donnée trouvée pour l\'agence', agence.AgenceId);
          setDetails(null);
        }
      } else {
        console.log('⚠️ Réponse API vide pour l\'agence', agence.AgenceId);
        setDetails(null);
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement des détails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [agence.AgenceId, filters.date, filters.mois, filters.annee]);

  const formatCurrency = (value) => {
    if (!value) return '0,00 DA';
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD'
    }).format(value);
  };

  // Fonction pour générer l'indicateur visuel du taux d'encaissement
  const getEncaissementIndicator = (rate) => {
    if (rate >= 100) {
      return {
        icon: ArrowUp,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        text: 'Dépassé'
      };
    } else if (rate >= 80) {
      return {
        icon: ArrowUp,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        text: 'Excellent'
      };
    } else if (rate >= 60) {
      return {
        icon: ArrowUp,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        text: 'Bon'
      };
    } else if (rate >= 40) {
      return {
        icon: Minus,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        text: 'Moyen'
      };
    } else {
      return {
        icon: ArrowDown,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        text: 'Faible'
      };
    }
  };

  return (
    <motion.tr 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-t border-gray-100 hover:bg-blue-50/30 transition-colors duration-200"
    >
      {/* Agence */}
      <td className="px-4 py-3 font-medium text-gray-900">
        <div className="flex items-center gap-1">
          <Building2 className="h-3 w-3 text-blue-600" />
          <span className="font-semibold text-xs">{agence.Nom_Agence}</span>
        </div>
      </td>
      
      {/* Centre */}
      <td className="px-4 py-3 text-gray-600">
        <span className="text-xs">{agence.Nom_Centre || 'Non disponible'}</span>
      </td>
      
      {/* Relances Envoyées */}
      <td className="px-4 py-3 text-center">
        {loading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mx-auto"></div>
        ) : details ? (
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-cyan-700">{details.daily?.Total_RelancesEnvoyees || 0}</div>
            <div className="text-xs text-cyan-600">{formatCurrency(details.daily?.Total_Mt_RelancesEnvoyees || 0)}</div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-xs">Aucune donnée</span>
            <span className="text-gray-300 text-xs">pour cette date</span>
          </div>
        )}
      </td>
      
      {/* Relances Encaissées */}
      <td className="px-4 py-3 text-center">
        {loading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mx-auto"></div>
        ) : details ? (
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-green-700">{details.daily?.Total_RelancesReglees || 0}</div>
            <div className="text-xs text-green-600">{formatCurrency(details.daily?.Total_Mt_RelancesReglees || 0)}</div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-xs">Aucune donnée</span>
            <span className="text-gray-300 text-xs">pour cette date</span>
          </div>
        )}
      </td>
      
      {/* Mises en Demeure */}
      <td className="px-4 py-3 text-center">
        {loading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mx-auto"></div>
        ) : details ? (
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-yellow-700">{details.daily?.Total_MisesEnDemeureEnvoyees || 0}</div>
            <div className="text-xs text-yellow-600">{formatCurrency(details.daily?.Total_Mt_MisesEnDemeureEnvoyees || 0)}</div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-xs">Aucune donnée</span>
            <span className="text-gray-300 text-xs">pour cette date</span>
          </div>
        )}
      </td>
      
      {/* Mises en Demeure Encaissées */}
      <td className="px-4 py-3 text-center">
        {loading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mx-auto"></div>
        ) : details ? (
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-orange-700">{details.daily?.Total_MisesEnDemeureReglees || 0}</div>
            <div className="text-xs text-orange-600">{formatCurrency(details.daily?.Total_Mt_MisesEnDemeureReglees || 0)}</div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-xs">Aucune donnée</span>
            <span className="text-gray-300 text-xs">pour cette date</span>
          </div>
        )}
      </td>
      
      {/* Dossiers Juridiques */}
      <td className="px-4 py-3 text-center">
        {loading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mx-auto"></div>
        ) : details ? (
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-orange-700">{details.daily?.Total_DossiersJuridiques || 0}</div>
            <div className="text-xs text-orange-600">{formatCurrency(details.daily?.Total_Mt_DossiersJuridiques || 0)}</div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-xs">Aucune donnée</span>
            <span className="text-gray-300 text-xs">pour cette date</span>
          </div>
        )}
      </td>
      
      {/* Coupures */}
      <td className="px-4 py-3 text-center">
        {loading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mx-auto"></div>
        ) : details ? (
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-red-700">{details.daily?.Total_Coupures || 0}</div>
            <div className="text-xs text-red-600">{formatCurrency(details.daily?.Total_Mt_Coupures || 0)}</div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-xs">Aucune donnée</span>
            <span className="text-gray-300 text-xs">pour cette date</span>
          </div>
        )}
      </td>
      
      {/* Rétablissements */}
      <td className="px-4 py-3 text-center">
        {loading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mx-auto"></div>
        ) : details ? (
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-emerald-700">{details.daily?.Total_Retablissements || 0}</div>
            <div className="text-xs text-emerald-600">{formatCurrency(details.daily?.Total_Mt_Retablissements || 0)}</div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-xs">Aucune donnée</span>
            <span className="text-gray-300 text-xs">pour cette date</span>
          </div>
        )}
      </td>
      
      
      {/* Compteurs */}
      <td className="px-4 py-3 text-center">
        {loading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mx-auto"></div>
        ) : details ? (
          <div className="text-sm font-bold text-purple-700">{details.daily?.Total_CompteursRemplaces || 0}</div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-xs">Aucune donnée</span>
            <span className="text-gray-300 text-xs">pour cette date</span>
          </div>
        )}
      </td>
      
      {/* Encaissement Global */}
      <td className="px-4 py-3 text-center">
        {loading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mx-auto"></div>
        ) : details ? (
          <div className="text-sm font-bold text-emerald-700">{formatCurrency(details.daily?.Total_EncaissementGlobal || 0)}</div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-xs">Aucune donnée</span>
            <span className="text-gray-300 text-xs">pour cette date</span>
          </div>
        )}
      </td>
      
      {/* Taux Encaissement */}
      <td className="px-4 py-3 text-center">
        {loading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mx-auto"></div>
        ) : details ? (
          <div className="flex flex-col items-center space-y-1">
            <div className="text-sm font-bold text-blue-700">{details.daily?.TauxEncaissementGlobal || 0}%</div>
            {(() => {
              const indicator = getEncaissementIndicator(details.daily?.TauxEncaissementGlobal || 0);
              const IconComponent = indicator.icon;
              return (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${indicator.bgColor}`}>
                  <IconComponent className={`h-3 w-3 ${indicator.color}`} />
                  <span className={`text-xs font-medium ${indicator.color}`}>
                    {indicator.text}
                  </span>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-xs">Aucune donnée</span>
            <span className="text-gray-300 text-xs">pour cette date</span>
          </div>
        )}
      </td>
    </motion.tr>
  );
};

export default BilansDetailles;
