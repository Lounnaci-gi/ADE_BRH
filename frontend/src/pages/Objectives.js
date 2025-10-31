import React, { useEffect, useState, useCallback } from 'react';
import { Building2, Calendar, Pencil, Trash2, Plus, Filter, Target, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import objectivesService from '../services/objectivesService';
import authService from '../services/authService';
import ObjectivesModal from '../components/ObjectivesModal';

function Objectives() {
  const [objectives, setObjectives] = useState([]);
  const [agences, setAgences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({
    annee: new Date().getFullYear(),
    mois: new Date().getMonth() + 1
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

  // Fonction pour vérifier si un objectif est trop ancien pour être modifié (> 3 mois)
  const isObjectiveTooOld = (dateDebut) => {
    const now = new Date();
    const objectiveDate = new Date(dateDebut);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    
    return objectiveDate < threeMonthsAgo;
  };

  // Vérifier si une agence a des objectifs pour la période sélectionnée
  const hasObjectivesForPeriod = (agenceId) => {
    return objectives.some(obj => obj.AgenceId === agenceId && isDateInObjectiveRange(obj));
  };

  // Obtenir les objectifs d'une agence pour la période
  const getObjectivesForAgency = (agenceId) => {
    return objectives.filter(obj => obj.AgenceId === agenceId && isDateInObjectiveRange(obj));
  };

  // Vérifier si la période sélectionnée se trouve dans l'intervalle de l'objectif
  const isDateInObjectiveRange = (objective) => {
    if (!filters.annee || !filters.mois) return true; // Si pas de filtre, afficher tout
    
    // Créer la date de début et fin du mois sélectionné
    const selectedMonthStart = new Date(filters.annee, filters.mois - 1, 1); // 1er jour du mois
    const selectedMonthEnd = new Date(filters.annee, filters.mois, 0); // Dernier jour du mois
    
    const objectiveStart = new Date(objective.DateDebut);
    const objectiveEnd = new Date(objective.DateFin);
    
    // Vérifier si le mois sélectionné se chevauche avec l'intervalle de l'objectif
    // Le mois est dans l'intervalle si :
    // - Le début du mois est avant la fin de l'objectif ET
    // - La fin du mois est après le début de l'objectif
    const isInRange = selectedMonthStart <= objectiveEnd && selectedMonthEnd >= objectiveStart;
    
    
    return isInRange;
  };

  // Charger les données
  const loadData = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    // Vérifier que l'utilisateur est connecté
    const user = authService.getCurrentUser();
    if (!user) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Charger TOUS les objectifs (sans filtre de date) et les agences
      const [objectivesData, agencesData] = await Promise.all([
        objectivesService.list({}), // Pas de filtre pour charger tous les objectifs
        objectivesService.getAgences()
      ]);
      
      
      setObjectives(objectivesData);
      setAgences(agencesData);
    } catch (e) {
      console.error('Erreur:', e);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]); // Retirer 'filters' des dépendances

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (row) => { setEditing(row); setModalOpen(true); };

  const handleSubmitModal = async (payload) => {
    try {
      if (!editing || !editing.ObjectifId) {
        await objectivesService.save(payload);
      } else {
        await objectivesService.update(payload);
      }
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (objective) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer cet objectif pour ${objective.Nom_Agence} ?`)) {
      try {
        await objectivesService.remove({ objectifId: objective.ObjectifId });
        await loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'objectif');
      }
    }
  };

  // Chargement initial
  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]); // Retirer loadData des dépendances pour éviter la boucle infinie

  // Recharger les agences quand les filtres changent (pour mettre à jour l'affichage)
  useEffect(() => {
    if (isAdmin && agences.length > 0) {
      // Forcer le re-render des cartes d'agences avec les nouveaux filtres
    }
  }, [filters, isAdmin, agences.length]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === null || value === '' ? null : parseInt(value)
    }));
  };

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
            <p className="text-gray-600 dark:text-slate-300">Chargement des objectifs...</p>
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
    <>
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-6 flex items-center gap-2">
        <Building2 className="h-6 w-6" />
        Objectifs des Agences
      </h1>


      {/* Filtre moderne et élégant */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 bg-gradient-to-r from-white to-blue-50/30 dark:from-slate-900 dark:to-slate-900 border border-blue-200/50 dark:border-slate-700 rounded-2xl p-4 shadow-lg backdrop-blur-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-slate-100">Filtre par période</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
            <select 
              value={filters.annee || ''} 
              onChange={(e) => handleFilterChange('annee', e.target.value || null)}
                  className="appearance-none bg-white/80 dark:bg-slate-800 backdrop-blur-sm border border-blue-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 hover:bg-white/90 dark:hover:bg-slate-700 shadow-sm"
            >
              <option value="">Toutes les années</option>
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                </div>
              </div>
              
              <div className="relative">
            <select 
              value={filters.mois || ''} 
              onChange={(e) => handleFilterChange('mois', e.target.value || null)}
                  className="appearance-none bg-white/80 dark:bg-slate-800 backdrop-blur-sm border border-blue-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 hover:bg-white/90 dark:hover:bg-slate-700 shadow-sm"
            >
              <option value="">Tous les mois</option>
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
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Calendar className="h-4 w-4 text-blue-500" />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilters({ annee: new Date().getFullYear(), mois: new Date().getMonth() + 1 })}
                className="px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Actuel
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilters({ annee: null, mois: null })}
                className="px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Target className="h-4 w-4" />
                Tous
              </motion.button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {filters.annee && filters.mois && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100/80 backdrop-blur-sm text-blue-800 rounded-xl border border-blue-200"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">
                {objectives.filter(obj => isDateInObjectiveRange(obj)).length} actif(s)
              </span>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Affichage des agences et objectifs */}
      {objectives.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-slate-900 rounded-lg">
          <Building2 className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-slate-300 mb-2">Aucun objectif trouvé</h3>
          <p className="text-gray-500 dark:text-slate-400">
            Aucun objectif n'a été défini pour {getMonthName(filters.mois)} {filters.annee}.
          </p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-slate-900 border-2 border-gray-200/50 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg"
        >
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 text-gray-700 dark:text-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Agence</th>
                  <th className="px-6 py-4 text-left font-semibold">Titre</th>
                  <th className="px-6 py-4 text-left font-semibold">Période</th>
                  <th className="px-6 py-4 text-left font-semibold">Encaissement</th>
                  <th className="px-6 py-4 text-left font-semibold">Coupures</th>
                  <th className="px-6 py-4 text-left font-semibold">Dossiers Juridiques</th>
                  <th className="px-6 py-4 text-left font-semibold">Mises en Demeure</th>
                  <th className="px-6 py-4 text-left font-semibold">Relances</th>
                  <th className="px-6 py-4 text-left font-semibold">Contrôles</th>
                  <th className="px-6 py-4 text-left font-semibold">Compteurs</th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="dark:text-slate-100">
                {objectives.map((o, index) => {
                  const isTooOld = isObjectiveTooOld(o.DateDebut);
                  return (
                    <motion.tr 
                      key={`${o.ObjectifId}`} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-t border-gray-100 dark:border-slate-800 hover:bg-blue-50/30 dark:hover:bg-slate-800 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-slate-100">{o.Nom_Agence}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800 dark:text-slate-100">{o.Titre}</div>
                        {o.Description && (
                          <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">{o.Description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                        {new Date(o.DateDebut).toLocaleDateString('fr-FR')} - {new Date(o.DateFin).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 font-medium text-green-700 dark:text-green-400">
                        {o.Obj_Encaissement ? new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(o.Obj_Encaissement) : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{o.Obj_Coupures ?? '-'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{o.Obj_Dossiers_Juridiques ?? '-'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{o.Obj_MisesEnDemeure ?? '-'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{o.Obj_Relances ?? '-'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{o.Obj_Controles ?? '-'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{o.Obj_Compteurs_Remplaces ?? '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {!isAdmin ? (
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              title="Accès refusé - Seuls les administrateurs peuvent modifier les objectifs" 
                              disabled 
                              className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                            >
                              <Pencil className="h-4 w-4" />
                            </motion.button>
                          ) : (
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => openEdit(o)} 
                              title={isTooOld ? "Modifier l'objectif (ancien - plus de 3 mois)" : "Modifier l'objectif"} 
                              className={`inline-flex items-center justify-center h-9 w-9 rounded-xl border transition-all duration-200 shadow-sm ${
                                isTooOld 
                                  ? 'bg-orange-100 text-orange-600 hover:bg-orange-200 border-orange-200' 
                                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200 border-blue-200'
                              }`}
                            >
                              <Pencil className="h-4 w-4" />
                            </motion.button>
                          )}
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(o)} 
                            title="Supprimer l'objectif" 
                            className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 transition-all duration-200 shadow-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Affichage des agences avec statut des objectifs - Style moderne */}
      {agences.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">
                  Toutes les Agences
          </h3>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  {agences.length} agence{agences.length > 1 ? 's' : ''} au total
                </p>
              </div>
            </div>
            
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agences.map((agence, index) => {
              const hasObjectives = hasObjectivesForPeriod(agence.AgenceId);
              const agencyObjectives = getObjectivesForAgency(agence.AgenceId);
              
              return (
                <motion.div
                  key={agence.AgenceId} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}
                  className={`relative overflow-hidden rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                    hasObjectives 
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800 border-green-200/60 dark:border-green-700/60 hover:border-green-300 dark:hover:border-green-600' 
                      : 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-slate-900 dark:to-slate-900 border-gray-200/60 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  {/* Effet de brillance au survol */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                  />
                  
                  <div className="relative z-10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ rotate: 5, scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                          className={`p-3 rounded-xl ${
                            hasObjectives 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Building2 className="h-5 w-5" />
                        </motion.div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-slate-100 text-lg">{agence.Nom_Agence}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-700">
                              Centre: {agence.Nom_Centre || 'Non disponible'}
                            </div>
                          </div>
                        </div>
                    </div>
                      
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                      hasObjectives 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700' 
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600'
                        }`}
                      >
                        {hasObjectives ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Objectifs définis
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3" />
                            Aucun objectif
                          </>
                        )}
                      </motion.div>
                  </div>
                  
                  {hasObjectives && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="mb-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="h-4 w-4 text-green-600" />
                          <p className="text-sm font-semibold text-gray-700">
                            {agencyObjectives.length} objectif{agencyObjectives.length > 1 ? 's' : ''} défini{agencyObjectives.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          {agencyObjectives.map((obj, objIndex) => {
                          const isInRange = isDateInObjectiveRange(obj);
                          return (
                              <motion.div
                                key={obj.ObjectifId}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: objIndex * 0.1 }}
                                className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                              isInRange 
                                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm' 
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                <div className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                      <h5 className="font-bold text-gray-800 dark:text-slate-100 mb-2">{obj.Titre}</h5>
                                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300 mb-3">
                                    <Calendar className="h-3 w-3" />
                                        <span>
                                    {new Date(obj.DateDebut).toLocaleDateString('fr-FR')} - {new Date(obj.DateFin).toLocaleDateString('fr-FR')}
                                        </span>
                                  </div>
                                  {isInRange && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-semibold border border-green-200 dark:border-green-700"
                                        >
                                          <CheckCircle className="h-3 w-3" />
                                          Période active
                                        </motion.div>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-1 ml-3">
                                      {!isAdmin ? (
                                        <motion.button
                                          whileHover={{ scale: 1.1 }}
                                          disabled
                                          className="p-2 text-gray-400 cursor-not-allowed rounded-lg transition-colors duration-200"
                                          title="Accès refusé - Seuls les administrateurs peuvent modifier les objectifs"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </motion.button>
                                      ) : (
                                        <motion.button
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                    onClick={() => openEdit(obj)}
                                          className={`p-2 rounded-lg transition-colors duration-200 ${
                                            isObjectiveTooOld(obj.DateDebut)
                                              ? 'text-orange-600 hover:bg-orange-50'
                                              : 'text-blue-600 hover:bg-blue-50'
                                          }`}
                                          title={isObjectiveTooOld(obj.DateDebut) ? "Modifier l'objectif (ancien - plus de 3 mois)" : "Modifier"}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </motion.button>
                                      )}
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDelete(obj.ObjectifId)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                    title="Supprimer"
                                  >
                                        <Trash2 className="h-4 w-4" />
                                      </motion.button>
                                </div>
                              </div>
                            </div>
                              </motion.div>
                          );
                        })}
                      </div>
                      </motion.div>
                  )}
                  
                  {!hasObjectives && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center justify-center py-6"
                      >
                        <div className="p-4 bg-gray-100 rounded-2xl mb-3">
                          <AlertCircle className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-slate-300 mb-4 text-center">
                          Aucun objectif défini pour cette agence
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setEditing({ FK_Agence: agence.AgenceId });
                          setModalOpen(true);
                        }}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                        title="Ajouter un objectif"
                      >
                          <Plus className="h-4 w-4" />
                          Ajouter un objectif
                        </motion.button>
                      </motion.div>
                    )}
                </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
    <ObjectivesModal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      onSubmit={handleSubmitModal}
      initialValues={editing}
      agences={agences}
    />
    </>
  );
}

export default Objectives;