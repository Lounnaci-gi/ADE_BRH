import React, { useEffect, useState, useRef } from 'react';
import { Calendar, Building2, Save, Target, TrendingUp, DollarSign, BarChart3, CheckCircle, AlertCircle, Zap, Shield, Users, Wrench, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import kpiService from '../services/kpiService';
import authService from '../services/authService';
import { swalSuccess, swalError } from '../utils/swal';
import ModernDatePicker from '../components/ModernDatePicker';
import KpiCard from '../components/KpiCard';

function KPI() {
  const [kpis, setKpis] = useState([]);
  const [agences, setAgences] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortedCategories, setSortedCategories] = useState([]);
  const [entriesByCategory, setEntriesByCategory] = useState({});
  const [objectives, setObjectives] = useState(null);
  const [allObjectives, setAllObjectives] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);
  
  const [formData, setFormData] = useState({
    dateKey: '',
    agenceId: '',
    encaissementJournalierGlobal: ''
  });

  // Fonction pour trier les catégories dans l'ordre souhaité
  const sortCategories = (categories) => {
    if (!categories || !Array.isArray(categories)) return [];
    const order = ['MENAGE', 'ADMIN', 'ARTCOM', 'IND'];
    return categories.sort((a, b) => {
      const indexA = order.indexOf(a.CodeCategorie);
      const indexB = order.indexOf(b.CodeCategorie);
      return indexA - indexB;
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const user = authService.getCurrentUser();
      const isAdmin = (user?.role || '').toString() === 'Administrateur';
      const userAgenceId = user?.agenceId ? Number(user.agenceId) : null;

      const [kpisData, categoriesData] = await Promise.all([
        kpiService.list(),
        kpiService.getCategories()
      ]);

      let agencesData = await kpiService.getAgences();
      if (!isAdmin && userAgenceId) {
        agencesData = agencesData.filter(a => Number(a.AgenceId) === userAgenceId);
        setFormData(prev => ({ ...prev, agenceId: userAgenceId.toString() }));
      }
      
      setKpis(kpisData || []);
      setAgences(agencesData || []);
      setCategories(categoriesData || []);
      
      const sortedCats = sortCategories(categoriesData || []);
      setSortedCategories(sortedCats);
      
      const init = (categoriesData || []).reduce((acc, cat) => {
        acc[cat.CategorieId] = {
          nbRelancesEnvoyees: '', mtRelancesEnvoyees: '',
          nbRelancesReglees: '', mtRelancesReglees: '',
          nbMisesEnDemeureEnvoyees: '', mtMisesEnDemeureEnvoyees: '',
          nbMisesEnDemeureReglees: '', mtMisesEnDemeureReglees: '',
          nbDossiersJuridiques: '', mtDossiersJuridiques: '',
          nbCoupures: '', mtCoupures: '',
          nbRetablissements: '', mtRetablissements: '',
          nbBranchements: '',
          nbCompteursRemplaces: '',
          nbControles: '',
          observation: ''
        };
        return acc;
      }, {});
      setEntriesByCategory(init);
    } catch (e) {
      console.error(e);
      await swalError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Charger les objectifs de l'agence sélectionnée
  const loadObjectives = async (agenceId) => {
    if (!agenceId) {
      setObjectives(null);
      return;
    }
    
    try {
      const date = new Date(formData.dateKey);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const objectivesData = await kpiService.getObjectives(agenceId, year, month);
      setObjectives(objectivesData);
    } catch (error) {
      console.error('Erreur lors du chargement des objectifs:', error);
      setObjectives(null);
    }
  };

  // Charger le résumé des données
  const loadSummary = async (agenceId, dateKey) => {
    if (!agenceId || !dateKey) {
      setSummary(null);
      return;
    }
    
    try {
      const date = new Date(dateKey);
      const dateKeyInt = parseInt(
        date.getFullYear().toString() + 
        (date.getMonth() + 1).toString().padStart(2, '0') + 
        date.getDate().toString().padStart(2, '0')
      );
      
      const summaryData = await kpiService.getSummary(agenceId, dateKeyInt);
      setSummary(summaryData);
    } catch (error) {
      console.error('Erreur lors du chargement du résumé:', error);
      setSummary(null);
    }
  };

  const loadExistingData = async (dateKey, agenceId) => {
    if (!dateKey || !agenceId) {
      setHasExistingData(false);
      return;
    }
    
    try {
      const date = new Date(dateKey);
      const dateKeyInt = parseInt(
        date.getFullYear().toString() + 
        (date.getMonth() + 1).toString().padStart(2, '0') + 
        date.getDate().toString().padStart(2, '0')
      );
      
      const existingData = await kpiService.getExistingData(dateKeyInt, parseInt(agenceId, 10));
      
      const init = (sortedCategories || []).reduce((acc, cat) => {
        acc[cat.CategorieId] = {
          nbRelancesEnvoyees: '', mtRelancesEnvoyees: '',
          nbRelancesReglees: '', mtRelancesReglees: '',
          nbMisesEnDemeureEnvoyees: '', mtMisesEnDemeureEnvoyees: '',
          nbMisesEnDemeureReglees: '', mtMisesEnDemeureReglees: '',
          nbDossiersJuridiques: '', mtDossiersJuridiques: '',
          nbCoupures: '', mtCoupures: '',
          nbRetablissements: '', mtRetablissements: '',
          nbBranchements: '',
          nbCompteursRemplaces: '',
          nbControles: '',
          observation: ''
        };
        return acc;
      }, {});
      
      existingData.forEach(item => {
        if (init[item.CategorieId]) {
          init[item.CategorieId] = {
            nbRelancesEnvoyees: item.Nb_RelancesEnvoyees || '',
            mtRelancesEnvoyees: item.Mt_RelancesEnvoyees || '',
            nbRelancesReglees: item.Nb_RelancesReglees || '',
            mtRelancesReglees: item.Mt_RelancesReglees || '',
            nbMisesEnDemeureEnvoyees: item.Nb_MisesEnDemeure_Envoyees || '',
            mtMisesEnDemeureEnvoyees: item.Mt_MisesEnDemeure_Envoyees || '',
            nbMisesEnDemeureReglees: item.Nb_MisesEnDemeure_Reglees || '',
            mtMisesEnDemeureReglees: item.Mt_MisesEnDemeure_Reglees || '',
            nbDossiersJuridiques: item.Nb_Dossiers_Juridiques || '',
            mtDossiersJuridiques: item.Mt_Dossiers_Juridiques || '',
            nbCoupures: item.Nb_Coupures || '',
            mtCoupures: item.Mt_Coupures || '',
            nbRetablissements: item.Nb_Retablissements || '',
            mtRetablissements: item.Mt_Retablissements || '',
            nbBranchements: item.Nb_Branchements || '',
            nbCompteursRemplaces: item.Nb_Compteurs_Remplaces || '',
            nbControles: item.Nb_Controles || '',
            observation: item.Observation || ''
          };
        }
      });
      
      setEntriesByCategory(init);
      
      if (existingData && existingData.length > 0) {
        setHasExistingData(true);
        const encVals = existingData
          .map(r => r.Encaissement_Journalier_Global)
          .filter(v => v != null && v !== '');
        if (encVals.length > 0) {
          const uniqueEnc = encVals[0];
          setFormData(prev => ({ ...prev, encaissementJournalierGlobal: uniqueEnc }));
        }
      } else {
        setHasExistingData(false);
        setFormData(prev => ({ 
          ...prev, 
          encaissementJournalierGlobal: ''
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données existantes:', error);
    }
  };

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    const user = authService.getCurrentUser();
    const isAdmin = (user?.role || '').toString() === 'Administrateur';
    const userAgenceId = user?.agenceId ? Number(user.agenceId) : null;
    
    setFormData({
      dateKey: `${yyyy}-${mm}-${dd}`,
      agenceId: isAdmin ? '' : (userAgenceId ? userAgenceId.toString() : ''),
      encaissementJournalierGlobal: ''
    });
    
    loadData();
  }, []);

  useEffect(() => {
    if (formData.dateKey && formData.agenceId) {
      loadExistingData(formData.dateKey, formData.agenceId);
      loadObjectives(formData.agenceId);
      loadSummary(formData.agenceId, formData.dateKey);
    }
  }, [formData.dateKey, formData.agenceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.dateKey || !formData.agenceId) {
      await swalError('Veuillez sélectionner une date et une agence');
      return;
    }

    try {
      setLoading(true);
      
      const date = new Date(formData.dateKey);
      const dateKey = parseInt(
        date.getFullYear().toString() + 
        (date.getMonth() + 1).toString().padStart(2, '0') + 
        date.getDate().toString().padStart(2, '0')
      );

      const agenceIdNum = parseInt(formData.agenceId);
      let encaissementGlobalSent = false;
      
      const creates = (sortedCategories || []).map(async (cat) => {
        const catId = parseInt(cat.CategorieId);
        const e = entriesByCategory[cat.CategorieId] || {};
        
        const hasData = [
          e.nbRelancesEnvoyees, e.mtRelancesEnvoyees,
          e.nbRelancesReglees, e.mtRelancesReglees,
          e.nbMisesEnDemeureEnvoyees, e.mtMisesEnDemeureEnvoyees,
          e.nbMisesEnDemeureReglees, e.mtMisesEnDemeureReglees,
          e.nbDossiersJuridiques, e.mtDossiersJuridiques,
          e.nbCoupures, e.mtCoupures,
          e.nbRetablissements, e.mtRetablissements,
          e.nbBranchements,
          e.nbCompteursRemplaces,
          e.nbControles
        ].some((v) => v !== '' && v != null);
        
        if (!hasData) return null;

        const shouldSendEncaissementGlobal = !encaissementGlobalSent && formData.encaissementJournalierGlobal;
        if (shouldSendEncaissementGlobal) {
          encaissementGlobalSent = true;
        }

        const payload = {
          dateKey,
          agenceId: agenceIdNum,
          categorieId: catId,
          nbRelancesEnvoyees: parseInt(e.nbRelancesEnvoyees || 0, 10),
          mtRelancesEnvoyees: parseFloat(e.mtRelancesEnvoyees || 0),
          nbRelancesReglees: parseInt(e.nbRelancesReglees || 0, 10),
          mtRelancesReglees: parseFloat(e.mtRelancesReglees || 0),
          nbMisesEnDemeureEnvoyees: parseInt(e.nbMisesEnDemeureEnvoyees || 0, 10),
          mtMisesEnDemeureEnvoyees: parseFloat(e.mtMisesEnDemeureEnvoyees || 0),
          nbMisesEnDemeureReglees: parseInt(e.nbMisesEnDemeureReglees || 0, 10),
          mtMisesEnDemeureReglees: parseFloat(e.mtMisesEnDemeureReglees || 0),
          nbDossiersJuridiques: parseInt(e.nbDossiersJuridiques || 0, 10),
          mtDossiersJuridiques: parseFloat(e.mtDossiersJuridiques || 0),
          nbCoupures: parseInt(e.nbCoupures || 0, 10),
          mtCoupures: parseFloat(e.mtCoupures || 0),
          nbRetablissements: parseInt(e.nbRetablissements || 0, 10),
          mtRetablissements: parseFloat(e.mtRetablissements || 0),
          nbBranchements: parseInt(e.nbBranchements || 0, 10),
          nbCompteursRemplaces: parseInt(e.nbCompteursRemplaces || 0, 10),
          nbControles: parseInt(e.nbControles || 0, 10),
          observation: e.observation || '',
          encaissementJournalierGlobal: shouldSendEncaissementGlobal ? parseFloat(formData.encaissementJournalierGlobal || 0) : 0
        };
        return kpiService.create(payload);
      });

      const requests = (await Promise.all(creates)).filter(Boolean);
      if (requests.length === 0) {
        await swalError('Aucune donnée à enregistrer. Remplissez au moins un champ.');
        return;
      }

      await Promise.all(requests);
      await swalSuccess('Données enregistrées avec succès !');
      
      // Recharger les données
      await loadData();
      if (formData.agenceId) {
        await loadObjectives(formData.agenceId);
        await loadSummary(formData.agenceId, formData.dateKey);
      }
    } catch (e) {
      const msg = e?.response?.data?.message || 'Une erreur est survenue';
      await swalError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD'
    }).format(value);
  };

  const calculatePercentage = (actual, target) => {
    if (!target || target === 0) return 0;
    return ((actual / target) * 100).toFixed(2).replace('.', ',');
  };

  const createProgressBar = (percentage, color = 'blue') => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      indigo: 'bg-indigo-500'
    };
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${colorClasses[color]}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Tableau de Bord
          </h1>
          <p className="text-gray-600 text-lg">Saisie et suivi des indicateurs de performance quotidiens</p>
        </motion.div>

        {/* A. Section Objectifs Agence - EN HAUT */}
        {objectives && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50 shadow-xl mb-8 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-2xl font-bold text-white flex items-center gap-3"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Target className="h-6 w-6" />
                </motion.div>
                Objectifs de l'Agence
                <span className="text-blue-200 ml-2">
                  {agences.find(a => a.AgenceId == formData.agenceId)?.Nom_Agence}
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
                {objectives.Obj_Encaissement && (
                  <KpiCard
                    title="Encaissement"
                    value={formatCurrency(objectives.Obj_Encaissement)}
                    icon={DollarSign}
                    color="emerald"
                    size="compact"
                  />
                )}
                {objectives.Obj_Relances && (
                  <KpiCard
                    title="Relances"
                    value={objectives.Obj_Relances}
                    icon={AlertCircle}
                    color="cyan"
                    size="compact"
                  />
                )}
                {objectives.Obj_MisesEnDemeure && (
                  <KpiCard
                    title="Mises en demeure"
                    value={objectives.Obj_MisesEnDemeure}
                    icon={Shield}
                    color="yellow"
                    size="compact"
                  />
                )}
                {objectives.Obj_Dossiers_Juridiques && (
                  <KpiCard
                    title="Dossiers juridiques"
                    value={objectives.Obj_Dossiers_Juridiques}
                    icon={Users}
                    color="orange"
                    size="compact"
                  />
                )}
                {objectives.Obj_Coupures && (
                  <KpiCard
                    title="Coupures"
                    value={objectives.Obj_Coupures}
                    icon={Zap}
                    color="red"
                    size="compact"
                  />
                )}
                {objectives.Obj_Controles && (
                  <KpiCard
                    title="Contrôles"
                    value={objectives.Obj_Controles}
                    icon={Eye}
                    color="indigo"
                    size="compact"
                  />
                )}
                {objectives.Obj_Compteurs_Remplaces && (
                  <KpiCard
                    title="Compteurs remplacés"
                    value={objectives.Obj_Compteurs_Remplaces}
                    icon={Wrench}
                    color="purple"
                    size="compact"
                  />
                )}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Formulaire de saisie */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 rounded-t-xl border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">📝 Saisie des données</h2>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Informations de base */}
              <div className="space-y-3">
                {(() => {
                  const user = authService.getCurrentUser();
                  const isAdmin = (user?.role || '').toString() === 'Administrateur';
                  
                  if (isAdmin) {
                    return (
                      <div className="space-y-1">
                        <label className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                          <div className="p-1 bg-green-100 rounded mr-2">
                            <Building2 className="h-3 w-3 text-green-600" />
                          </div>
                          Agence *
                        </label>
                        <select
                          value={formData.agenceId}
                          onChange={(e) => setFormData({ ...formData, agenceId: e.target.value })}
                          className="w-full border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md text-xs max-w-[200px]"
                          required
                        >
                          <option value="">Sélectionner une agence</option>
                          {agences.map(agence => (
                            <option key={agence.AgenceId} value={agence.AgenceId}>
                              {agence.Nom_Agence}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  } else {
                    const userAgence = agences.find(a => Number(a.AgenceId) === Number(formData.agenceId));
                    return (
                      <div className="space-y-1">
                        <label className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                          <div className="p-1 bg-green-100 rounded mr-2">
                            <Building2 className="h-3 w-3 text-green-600" />
                          </div>
                          Agence assignée
                        </label>
                        <div className="w-full border border-gray-200 rounded px-2 py-1 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 shadow-sm text-xs max-w-[200px]">
                          {userAgence ? userAgence.Nom_Agence : 'Chargement...'}
                        </div>
                      </div>
                    );
                  }
                })()}

                <div className="space-y-1">
                  <label className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                    <div className="p-1 bg-blue-100 rounded mr-2">
                      <Calendar className="h-3 w-3 text-blue-600" />
                    </div>
                    Date *
                  </label>
                  <ModernDatePicker
                    value={formData.dateKey}
                    onChange={(date) => setFormData({ ...formData, dateKey: date })}
                    placeholder="Sélectionner une date"
                  />
                </div>
              </div>

              {/* Design en cartes groupées par type d'opération */}
              <div className="space-y-6">
                {(sortedCategories || []).map((cat, index) => {
                  const e = entriesByCategory[cat.CategorieId] || {};
                  return (
                    <div key={cat.CategorieId} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 rounded-t-xl border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-800">{cat.Libelle}</h4>
                      </div>
                      
                      <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                          
                          {/* Section Relances */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                              <h5 className="font-semibold text-cyan-700 text-sm">Relances</h5>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Envoyées (Nb)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="1"
                                  value={e.nbRelancesEnvoyees || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbRelancesEnvoyees: ev.target.value } }))} 
                                  className="w-full border border-cyan-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Envoyées (Mt)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  value={e.mtRelancesEnvoyees || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtRelancesEnvoyees: ev.target.value } }))} 
                                  className="w-full border border-cyan-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Réglées (Nb)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="1"
                                  value={e.nbRelancesReglees || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbRelancesReglees: ev.target.value } }))} 
                                  className="w-full border border-cyan-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Réglées (Mt)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  value={e.mtRelancesReglees || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtRelancesReglees: ev.target.value } }))} 
                                  className="w-full border border-cyan-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section Mises en demeure */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                              <h5 className="font-semibold text-yellow-700 text-sm">Mises en demeure</h5>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Envoyées (Nb)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="1"
                                  value={e.nbMisesEnDemeureEnvoyees || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbMisesEnDemeureEnvoyees: ev.target.value } }))} 
                                  className="w-full border border-yellow-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Envoyées (Mt)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  value={e.mtMisesEnDemeureEnvoyees || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtMisesEnDemeureEnvoyees: ev.target.value } }))} 
                                  className="w-full border border-yellow-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Réglées (Nb)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="1"
                                  value={e.nbMisesEnDemeureReglees || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbMisesEnDemeureReglees: ev.target.value } }))} 
                                  className="w-full border border-yellow-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Réglées (Mt)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  value={e.mtMisesEnDemeureReglees || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtMisesEnDemeureReglees: ev.target.value } }))} 
                                  className="w-full border border-yellow-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section Activité Juridique */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                              <h5 className="font-semibold text-orange-700 text-sm">Activité Juridique</h5>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Dossiers juridiques (Nb)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="1"
                                  value={e.nbDossiersJuridiques || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbDossiersJuridiques: ev.target.value } }))} 
                                  className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Dossiers juridiques (Mt)</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  value={e.mtDossiersJuridiques || ''} 
                                  onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtDossiersJuridiques: ev.target.value } }))} 
                                  className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200" 
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section Activité Coupure & Rétablissement */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                              <h5 className="font-semibold text-red-700 text-sm">Activité Coupure & Rétablissement</h5>
                            </div>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Coupures (Nb)</label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="1"
                                    value={e.nbCoupures || ''} 
                                    onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbCoupures: ev.target.value } }))} 
                                    className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" 
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Coupures (Mt)</label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="0.01" 
                                    value={e.mtCoupures || ''} 
                                    onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtCoupures: ev.target.value } }))} 
                                    className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" 
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Rétablissements (Nb)</label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="1"
                                    value={e.nbRetablissements || ''} 
                                    onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbRetablissements: ev.target.value } }))} 
                                    className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Rétablissements (Mt)</label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="0.01" 
                                    value={e.mtRetablissements || ''} 
                                    onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtRetablissements: ev.target.value } }))} 
                                    className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Section Gestion des Compteurs */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                              <h5 className="font-semibold text-purple-700 text-sm">Gestion des Compteurs</h5>
                            </div>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Branchements</label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="1"
                                    value={e.nbBranchements || ''} 
                                    onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbBranchements: ev.target.value } }))} 
                                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Compteurs remplacés</label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="1"
                                    value={e.nbCompteursRemplaces || ''} 
                                    onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbCompteursRemplaces: ev.target.value } }))} 
                                    className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200" 
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                <div>
                                  <label className="text-xs text-gray-600 mb-1 block">Contrôles</label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="1"
                                    value={e.nbControles || ''} 
                                    onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbControles: ev.target.value } }))} 
                                    className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" 
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Champ Observation par catégorie */}
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <h6 className="font-medium text-gray-600 text-xs">Observation</h6>
                            </div>
                            <textarea
                              value={e.observation || ''}
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], observation: ev.target.value } }))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent transition-all duration-200 resize-none"
                              rows="2"
                              placeholder="Ajoutez une observation pour cette catégorie..."
                              maxLength="200"
                            />
                            <div className="text-right mt-1">
                              <span className="text-xs text-gray-400">
                                {(e.observation || '').length}/200 caractères
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Encaissement Journalier Global */}
              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                    </div>
                    Encaissement Journalier Global
                  </label>
                  <div className="flex justify-start">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.encaissementJournalierGlobal}
                      onChange={(e) => setFormData({ ...formData, encaissementJournalierGlobal: e.target.value })}
                      className="w-64 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                      placeholder="Montant de l'encaissement journalier global..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2 font-medium text-sm transform hover:scale-105"
                >
                  <Save className="h-4 w-4" />
                  Enregistrer les données
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* B. Section Résumé Détaillé des Données - EN BAS */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 rounded-2xl border border-green-200/50 shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-8 py-6">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-2xl font-bold text-white flex items-center gap-3"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                >
                  <BarChart3 className="h-6 w-6" />
                </motion.div>
                Résumé Détaillé des Données
              </motion.h2>
            </div>
            <div className="p-8">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {/* Relances Envoyées */}
                <KpiCard
                  title="Relances Envoyées"
                  value={summary.daily?.Total_RelancesEnvoyees || 0}
                  subtitle={formatCurrency(summary.daily?.Total_Mt_RelancesEnvoyees || 0)}
                  icon={AlertCircle}
                  color="cyan"
                  percentage={objectives?.Obj_Relances ? calculatePercentage(summary.daily?.Total_RelancesEnvoyees || 0, objectives.Obj_Relances) : undefined}
                  showProgress={!!objectives?.Obj_Relances}
                />

                {/* Relances Encaissées */}
                <KpiCard
                  title="Relances Encaissées"
                  value={summary.daily?.Total_RelancesReglees || 0}
                  subtitle={formatCurrency(summary.daily?.Total_Mt_RelancesReglees || 0)}
                  icon={CheckCircle}
                  color="green"
                  percentage={objectives?.Obj_Relances ? calculatePercentage(summary.daily?.Total_RelancesReglees || 0, objectives.Obj_Relances) : undefined}
                  showProgress={!!objectives?.Obj_Relances}
                />

                {/* Mises en Demeure Envoyées */}
                <KpiCard
                  title="Mises en Demeure Envoyées"
                  value={summary.daily?.Total_MisesEnDemeureEnvoyees || 0}
                  subtitle={formatCurrency(summary.daily?.Total_Mt_MisesEnDemeureEnvoyees || 0)}
                  icon={Shield}
                  color="yellow"
                  percentage={objectives?.Obj_MisesEnDemeure ? calculatePercentage(summary.daily?.Total_MisesEnDemeureEnvoyees || 0, objectives.Obj_MisesEnDemeure) : undefined}
                  showProgress={!!objectives?.Obj_MisesEnDemeure}
                />

                {/* Mises en Demeure Encaissées */}
                <KpiCard
                  title="Mises en Demeure Encaissées"
                  value={summary.daily?.Total_MisesEnDemeureReglees || 0}
                  subtitle={formatCurrency(summary.daily?.Total_Mt_MisesEnDemeureReglees || 0)}
                  icon={CheckCircle}
                  color="orange"
                  percentage={objectives?.Obj_MisesEnDemeure ? calculatePercentage(summary.daily?.Total_MisesEnDemeureReglees || 0, objectives.Obj_MisesEnDemeure) : undefined}
                  showProgress={!!objectives?.Obj_MisesEnDemeure}
                />

                {/* Dossiers Juridiques Transmis */}
                <KpiCard
                  title="Dossiers Juridiques Transmis"
                  value={summary.daily?.Total_DossiersJuridiques || 0}
                  subtitle={formatCurrency(summary.daily?.Total_Mt_DossiersJuridiques || 0)}
                  icon={Users}
                  color="orange"
                  percentage={objectives?.Obj_Dossiers_Juridiques ? calculatePercentage(summary.daily?.Total_DossiersJuridiques || 0, objectives.Obj_Dossiers_Juridiques) : undefined}
                  showProgress={!!objectives?.Obj_Dossiers_Juridiques}
                />

                {/* Coupures Réalisées */}
                <KpiCard
                  title="Coupures Réalisées"
                  value={summary.daily?.Total_Coupures || 0}
                  subtitle={formatCurrency(summary.daily?.Total_Mt_Coupures || 0)}
                  icon={Zap}
                  color="red"
                  percentage={objectives?.Obj_Coupures ? calculatePercentage(summary.daily?.Total_Coupures || 0, objectives.Obj_Coupures) : undefined}
                  showProgress={!!objectives?.Obj_Coupures}
                />

                {/* Rétablissements */}
                <KpiCard
                  title="Rétablissements"
                  value={summary.daily?.Total_Retablissements || 0}
                  subtitle={formatCurrency(summary.daily?.Total_Mt_Retablissements || 0)}
                  icon={CheckCircle}
                  color="emerald"
                />

                {/* Branchements Réalisés */}
                <KpiCard
                  title="Branchements Réalisés"
                  value={summary.daily?.Total_Branchements || 0}
                  icon={Users}
                  color="blue"
                />

                {/* Remplacement de Compteur */}
                <KpiCard
                  title="Remplacement de Compteur"
                  value={summary.daily?.Total_CompteursRemplaces || 0}
                  icon={Wrench}
                  color="purple"
                  percentage={objectives?.Obj_Compteurs_Remplaces ? calculatePercentage(summary.daily?.Total_CompteursRemplaces || 0, objectives.Obj_Compteurs_Remplaces) : undefined}
                  showProgress={!!objectives?.Obj_Compteurs_Remplaces}
                />

                {/* Contrôles Effectués */}
                <KpiCard
                  title="Contrôles Effectués"
                  value={summary.daily?.Total_Controles || 0}
                  icon={Eye}
                  color="indigo"
                  percentage={objectives?.Obj_Controles ? calculatePercentage(summary.daily?.Total_Controles || 0, objectives.Obj_Controles) : undefined}
                  showProgress={!!objectives?.Obj_Controles}
                />

                {/* Encaissement du jour */}
                <KpiCard
                  title="Encaissement du jour"
                  value={formatCurrency(summary.daily?.Total_EncaissementGlobal || 0)}
                  icon={DollarSign}
                  color="emerald"
                  percentage={objectives?.Obj_Encaissement ? calculatePercentage(summary.daily?.Total_EncaissementGlobal || 0, objectives.Obj_Encaissement) : undefined}
                  showProgress={!!objectives?.Obj_Encaissement}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default KPI;