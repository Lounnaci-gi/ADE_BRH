import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Calendar, Filter, FileText, TrendingUp, AlertCircle, CheckCircle, Shield, Users, Zap, Eye, Wrench, DollarSign } from 'lucide-react';
import kpiService from '../services/kpiService';
import authService from '../services/authService';

function BilansDetailles() {
  const [agences, setAgences] = useState([]);
  const [filteredAgences, setFilteredAgences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear()
  });

  const user = authService.getCurrentUser();
  const isAdmin = (user?.role || '').toString() === 'Administrateur';

  // Fonction pour obtenir le nom du mois
  const getMonthName = (month) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1] || '';
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

  // Charger les données détaillées pour une agence
  const loadAgencyDetails = async (agenceId) => {
    try {
      const dateStr = filters.date;
      const summaryData = await kpiService.getSummary(agenceId, dateStr);
      return summaryData;
    } catch (err) {
      console.error('Erreur lors du chargement des détails:', err);
      return null;
    }
  };

  // Filtrer les agences
  const filterAgences = () => {
    // Pour l'instant, on retourne toutes les agences
    // Plus tard, on pourra ajouter des filtres par date/mois/année
    setFilteredAgences(agences);
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

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Accès Refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires.</p>
          <p className="text-sm text-gray-500 mt-2">Veuillez vous connecter avec un compte administrateur.</p>
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
            <p className="text-gray-600">Chargement des bilans détaillés...</p>
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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bilans Liste Détaillés</h1>
            <p className="text-gray-600">Données détaillées par agence</p>
          </div>
        </div>

        {/* Filtres */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-gradient-to-r from-white to-blue-50/30 border border-blue-200/50 rounded-2xl p-4 shadow-lg backdrop-blur-sm mb-6"
        >
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Filtres</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                  className="px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={filters.mois}
                  onChange={(e) => handleFilterChange('mois', parseInt(e.target.value))}
                  className="px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                >
                  <option value={1}>Janvier</option>
                  <option value={2}>Février</option>
                  <option value={3}>Mars</option>
                  <option value={4}>Avril</option>
                  <option value={5}>Mai</option>
                  <option value={6}>Juin</option>
                  <option value={7}>Juillet</option>
                  <option value={8}>Août</option>
                  <option value={9}>Septembre</option>
                  <option value={10}>Octobre</option>
                  <option value={11}>Novembre</option>
                  <option value={12}>Décembre</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={filters.annee}
                  onChange={(e) => handleFilterChange('annee', parseInt(e.target.value))}
                  className="px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Tableau des agences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white border-2 border-gray-200/50 rounded-2xl overflow-hidden shadow-lg"
      >
        {filteredAgences.length === 0 ? (
          <div className="text-center py-12 bg-gray-50">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Aucune agence trouvée</h3>
            <p className="text-gray-500">Aucune agence ne correspond aux critères de filtrage.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-xs">Agence</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs">Centre</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Relances Envoyées</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Relances Encaissées</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Mises en Demeure</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Dossiers Juridiques</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Coupures</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Rétablissements</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Contrôles</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Compteurs</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs">Encaissement Global</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgences.map((agence, index) => (
                  <AgencyRow key={agence.AgenceId} agence={agence} index={index} filters={filters} />
                ))}
              </tbody>
            </table>
          </div>
        )}
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
      // Utiliser les filtres de date sélectionnés
      let dateKey;
      
      if (filters.date) {
        // Format YYYYMMDD pour une date spécifique
        const date = new Date(filters.date);
        dateKey = date.getFullYear().toString() + 
                 String(date.getMonth() + 1).padStart(2, '0') + 
                 String(date.getDate()).padStart(2, '0');
      } else if (filters.month && filters.year) {
        // Pour un mois spécifique, utiliser le premier jour du mois
        const date = new Date(filters.year, filters.month - 1, 1);
        dateKey = date.getFullYear().toString() + 
                 String(date.getMonth() + 1).padStart(2, '0') + 
                 String(date.getDate()).padStart(2, '0');
      } else if (filters.year) {
        // Pour une année spécifique, utiliser le premier jour de l'année
        const date = new Date(filters.year, 0, 1);
        dateKey = date.getFullYear().toString() + 
                 String(date.getMonth() + 1).padStart(2, '0') + 
                 String(date.getDate()).padStart(2, '0');
      } else {
        // Par défaut, utiliser la date d'aujourd'hui
        const today = new Date();
        dateKey = today.getFullYear().toString() + 
                 String(today.getMonth() + 1).padStart(2, '0') + 
                 String(today.getDate()).padStart(2, '0');
      }
      
      const summaryData = await kpiService.getSummary(agence.AgenceId, dateKey);
      setDetails(summaryData);
    } catch (err) {
      console.error('Erreur lors du chargement des détails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [agence.AgenceId, filters.date, filters.month, filters.year]);

  const formatCurrency = (value) => {
    if (!value) return '0,00 DA';
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD'
    }).format(value);
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
          <span className="text-gray-400 text-xs">-</span>
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
          <span className="text-gray-400 text-xs">-</span>
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
          <span className="text-gray-400 text-xs">-</span>
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
          <span className="text-gray-400 text-xs">-</span>
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
          <span className="text-gray-400 text-xs">-</span>
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
          <span className="text-gray-400 text-xs">-</span>
        )}
      </td>
      
      {/* Contrôles */}
      <td className="px-4 py-3 text-center">
        {loading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mx-auto"></div>
        ) : details ? (
          <div className="text-sm font-bold text-indigo-700">{details.daily?.Total_Controles || 0}</div>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </td>
      
      {/* Compteurs */}
      <td className="px-4 py-3 text-center">
        {loading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mx-auto"></div>
        ) : details ? (
          <div className="text-sm font-bold text-purple-700">{details.daily?.Total_CompteursRemplaces || 0}</div>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </td>
      
      {/* Encaissement Global */}
      <td className="px-4 py-3 text-center">
        {loading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mx-auto"></div>
        ) : details ? (
          <div className="text-sm font-bold text-emerald-700">{formatCurrency(details.daily?.Total_EncaissementGlobal || 0)}</div>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </td>
    </motion.tr>
  );
};

export default BilansDetailles;
