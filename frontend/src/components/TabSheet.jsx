import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Calendar, Filter, TrendingUp, AlertCircle, CheckCircle, Shield, Users, Zap, Wrench, DollarSign, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import kpiService from '../services/kpiService';

const TabSheet = ({ 
  agences = [], 
  onFiltersChange = () => {},
  className = "" 
}) => {
  const [selectedAgence, setSelectedAgence] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [detailedData, setDetailedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Charger les données détaillées pour l'agence sélectionnée et l'intervalle de dates
  const loadDetailedData = async () => {
    if (!selectedAgence || !dateRange.startDate || !dateRange.endDate) {
      setDetailedData([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await kpiService.getDetailedData(
        selectedAgence,
        dateRange.startDate,
        dateRange.endDate
      );
      
      setDetailedData(response.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des données détaillées:', err);
      setError('Erreur lors du chargement des données détaillées');
      setDetailedData([]);
    } finally {
      setLoading(false);
    }
  };

  // Gérer les changements de filtres
  const handleFilterChange = (field, value) => {
    if (field === 'selectedAgence') {
      setSelectedAgence(value);
    } else if (field === 'startDate' || field === 'endDate') {
      setDateRange(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Notifier le composant parent des changements
    onFiltersChange({
      selectedAgence: field === 'selectedAgence' ? value : selectedAgence,
      startDate: field === 'startDate' ? value : dateRange.startDate,
      endDate: field === 'endDate' ? value : dateRange.endDate
    });
  };

  // Charger les données quand les filtres changent
  useEffect(() => {
    if (selectedAgence && dateRange.startDate && dateRange.endDate) {
      loadDetailedData();
    }
  }, [selectedAgence, dateRange.startDate, dateRange.endDate]);

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

  if (agences.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">Aucune agence disponible</h3>
        <p className="text-gray-500">Aucune agence n'a été trouvée pour afficher les données.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden ${className}`}>
      {/* En-tête avec titre et filtres */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200/50">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Données Détaillées par Agence</h2>
              <p className="text-sm text-gray-600">Sélectionnez une agence et un intervalle de dates</p>
            </div>
          </div>
          
          {/* Filtres */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-gradient-to-r from-white to-blue-50/30 border border-blue-200/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Filter className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Filtres</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtre par agence */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-purple-500" />
                </div>
                <select
                  value={selectedAgence}
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
                  value={dateRange.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
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
                  value={dateRange.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="pl-10 pr-4 py-3 text-sm border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all duration-300 bg-white shadow-sm hover:shadow-md font-medium text-gray-700 w-full"
                  placeholder="Date de fin"
                />
                <label className="text-xs text-gray-500 mt-1 block">Date de fin</label>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contenu principal - Liste détaillée */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des données détaillées...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Erreur</h3>
            <p className="text-red-700">{error}</p>
          </div>
        ) : detailedData.length > 0 ? (
          <DetailedDataList 
            data={detailedData}
            selectedAgence={selectedAgence}
            agences={agences}
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
            getEncaissementIndicator={getEncaissementIndicator}
          />
        ) : selectedAgence && dateRange.startDate && dateRange.endDate ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Aucune donnée trouvée</h3>
            <p className="text-gray-500">
              Aucune donnée n'a été trouvée pour l'agence sélectionnée dans cette période.
            </p>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Sélectionnez des filtres</h3>
            <p className="text-gray-500">
              Veuillez sélectionner une agence et un intervalle de dates pour afficher les données.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant pour afficher la liste détaillée des données
const DetailedDataList = ({ data, selectedAgence, agences, formatCurrency, formatPercentage, getEncaissementIndicator }) => {
  const selectedAgencyData = agences.find(a => a.AgenceId == selectedAgence);
  
  return (
    <div className="space-y-6">
      {/* En-tête de l'agence */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <Building2 className="h-6 w-6" />
              {selectedAgencyData?.Nom_Agence || 'Agence sélectionnée'}
            </h3>
            <p className="text-blue-100 mt-1">
              Centre: {selectedAgencyData?.Nom_Centre || 'Non disponible'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Période sélectionnée</div>
            <div className="text-lg font-semibold">
              {data.length > 0 ? `${data.length} jour(s)` : 'Aucune donnée'}
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des données détaillées */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-xs">Date</th>
                <th className="px-3 py-2 text-center font-semibold text-xs">Relances Envoyées</th>
                <th className="px-3 py-2 text-center font-semibold text-xs">Relances Encaissées</th>
                <th className="px-3 py-2 text-center font-semibold text-xs">Mises en Demeure</th>
                <th className="px-3 py-2 text-center font-semibold text-xs">Mises en Demeure Encaissées</th>
                <th className="px-3 py-2 text-center font-semibold text-xs">Dossiers Juridiques</th>
                <th className="px-3 py-2 text-center font-semibold text-xs">Coupures</th>
                <th className="px-3 py-2 text-center font-semibold text-xs">Rétablissements</th>
                <th className="px-3 py-2 text-center font-semibold text-xs">Compteurs</th>
                <th className="px-3 py-2 text-center font-semibold text-xs">Encaissement Global</th>
                <th className="px-3 py-2 text-center font-semibold text-xs">Taux Encaissement (%)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((record, index) => (
                <motion.tr 
                  key={record.DateKPI}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-t border-gray-100 hover:bg-blue-50/30 transition-colors duration-200"
                >
                  <td className="px-3 py-2 font-medium text-gray-900 text-xs">
                    {new Date(record.DateKPI).toLocaleDateString('fr-FR')}
                  </td>
                  
                  {/* Relances Envoyées */}
                  <td className="px-3 py-2 text-center">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-cyan-700">{record.Nb_RelancesEnvoyees || 0}</div>
                      <div className="text-xs text-cyan-600">{formatCurrency(record.Mt_RelancesEnvoyees || 0)}</div>
                    </div>
                  </td>
                  
                  {/* Relances Encaissées */}
                  <td className="px-3 py-2 text-center">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-green-700">{record.Nb_RelancesReglees || 0}</div>
                      <div className="text-xs text-green-600">{formatCurrency(record.Mt_RelancesReglees || 0)}</div>
                    </div>
                  </td>
                  
                  {/* Mises en Demeure */}
                  <td className="px-3 py-2 text-center">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-yellow-700">{record.Nb_MisesEnDemeure_Envoyees || 0}</div>
                      <div className="text-xs text-yellow-600">{formatCurrency(record.Mt_MisesEnDemeure_Envoyees || 0)}</div>
                    </div>
                  </td>
                  
                  {/* Mises en Demeure Encaissées */}
                  <td className="px-3 py-2 text-center">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-yellow-700">{record.Nb_MisesEnDemeure_Reglees || 0}</div>
                      <div className="text-xs text-yellow-600">{formatCurrency(record.Mt_MisesEnDemeure_Reglees || 0)}</div>
                    </div>
                  </td>
                  
                  {/* Dossiers Juridiques */}
                  <td className="px-3 py-2 text-center">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-orange-700">{record.Nb_Dossiers_Juridiques || 0}</div>
                      <div className="text-xs text-orange-600">{formatCurrency(record.Mt_Dossiers_Juridiques || 0)}</div>
                    </div>
                  </td>
                  
                  {/* Coupures */}
                  <td className="px-3 py-2 text-center">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-red-700">{record.Nb_Coupures || 0}</div>
                      <div className="text-xs text-red-600">{formatCurrency(record.Mt_Coupures || 0)}</div>
                    </div>
                  </td>
                  
                  {/* Rétablissements */}
                  <td className="px-3 py-2 text-center">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-emerald-700">{record.Nb_Retablissements || 0}</div>
                      <div className="text-xs text-emerald-600">{formatCurrency(record.Mt_Retablissements || 0)}</div>
                    </div>
                  </td>
                  
                  {/* Compteurs */}
                  <td className="px-3 py-2 text-center">
                    <div className="text-sm font-bold text-purple-700">{record.Nb_Compteurs_Remplaces || 0}</div>
                  </td>
                  
                  {/* Encaissement Global */}
                  <td className="px-3 py-2 text-center">
                    <div className="text-sm font-bold text-emerald-700">{formatCurrency(record.Encaissement_Journalier_Global || 0)}</div>
                  </td>
                  
                  {/* Taux Encaissement (%) */}
                  <td className="px-3 py-2 text-center">
                    <div className="text-sm font-bold text-emerald-600">
                      {record.Obj_Encaissement > 0 ? 
                        formatPercentage((record.Encaissement_Journalier_Global / record.Obj_Encaissement) * 100) : 
                        '0,00%'
                      }
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TabSheet;
