import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Building2, Save, Target, DollarSign, BarChart3, CheckCircle, AlertCircle, Zap, Shield, Users, Wrench, Eye, ChevronDown, ChevronRight, Table, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import kpiService from '../services/kpiService';
import authService from '../services/authService';
import { swalSuccess, swalError, swal } from '../utils/swal';
import { convertDateToYYYYMMDD } from '../utils/dateUtils';
import ModernDatePicker from '../components/ModernDatePicker';
import KpiCard from '../components/KpiCard';

function KPI() {
  const [kpis, setKpis] = useState([]);
  const [agences, setAgences] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortedCategories, setSortedCategories] = useState([]);
  const [entriesByCategory, setEntriesByCategory] = useState({});
  const [collapsedByCategory, setCollapsedByCategory] = useState({});
  const [objectives, setObjectives] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' (Grille Excel) ou 'cards'

  const [formData, setFormData] = useState({
    dateKey: '',
    agenceId: '',
    encaissementJournalierGlobal: ''
  });

  // Helper pour mettre à jour une cellule dans la grille de saisie
  const handleCellChange = (catId, field, value) => {
    setEntriesByCategory(prev => ({
      ...prev,
      [catId]: {
        ...(prev[catId] || {}),
        [field]: value
      }
    }));
  };

  // Helper pour obtenir le libellé formaté selon les vrais codes DB (DOM, COM, IND, ADM)
  const getCategoryLabel = (cat) => {
    const code = (cat?.CodeCategorie || '').toUpperCase().trim();
    switch (code) {
      case 'DOM': return 'Cat 1 (Ménages individuel)';
      case 'ADM': return 'Cat 2 (Administrations)';
      case 'COM': return 'Cat 3 (Artisans et services)';
      case 'IND': return 'Cat 4 (Activités industrielles et Touristiques)';
      default:    return cat?.Libelle || `Catégorie ${cat?.CategorieId}`;
    }
  };

  // Helper pour calculer les totaux dans la grille
  const getSum = (field, isAmount = false) => {
    const total = (sortedCategories || []).reduce((acc, cat) => {
      const val = parseFloat(entriesByCategory[cat.CategorieId]?.[field]) || 0;
      return acc + val;
    }, 0);
    if (isAmount) {
      return total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return total;
  };

  // Trie les catégories : Cat1 DOM (Ménages), Cat2 ADM (Admin), Cat3 COM (Artisans), Cat4 IND (Industriel)
  const sortCategories = (categories) => {
    if (!categories || !Array.isArray(categories)) return [];
    const order = ['DOM', 'ADM', 'COM', 'IND'];
    return [...categories].sort((a, b) => {
      const ia = order.indexOf((a.CodeCategorie || '').toUpperCase().trim());
      const ib = order.indexOf((b.CodeCategorie || '').toUpperCase().trim());
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
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
      
      // Initialise les entrées dans l'ordre trié
      const init = sortedCats.reduce((acc, cat) => {
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

      // Par défaut: catégories dépliées
      const initCollapsed = sortedCats.reduce((acc, cat) => {
        acc[cat.CategorieId] = false;
        return acc;
      }, {});
      setCollapsedByCategory(initCollapsed);
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

  // ❌ SUPPRIMÉ: calculateSummaryFromFormData - Le résumé doit charger depuis la BDD uniquement

  // Charger le résumé des données UNIQUEMENT depuis la base de données
  const loadSummary = async (agenceId, dateKey) => {
    console.log('🔍 DEBUG loadSummary - Paramètres reçus:', { agenceId, dateKey, type: typeof dateKey });
    
    if (!agenceId || !dateKey) {
      console.log('🔍 DEBUG loadSummary - Paramètres manquants, setSummary(null)');
      setSummary(null);
      return;
    }
    
    try {
      // Si dateKey est déjà un nombre (YYYYMMDD), l'utiliser directement
      // Sinon, le convertir en format YYYYMMDD
      const dateKeyInt = typeof dateKey === 'number' ? dateKey : convertDateToYYYYMMDD(dateKey);
      console.log('🔍 DEBUG loadSummary - dateKey final:', { dateKey, dateKeyInt });
      
      console.log('🔍 DEBUG loadSummary - Appel API avec:', { agenceId, dateKeyInt });
      const summaryData = await kpiService.getSummary(agenceId, dateKeyInt);
      console.log('📊 Données de résumé chargées depuis BDD:', summaryData);
      setSummary(summaryData);
    } catch (error) {
      console.error('❌ Erreur lors du chargement du résumé:', error);
      setSummary(null);
    }
  };

  const loadExistingData = async (dateKey, agenceId) => {
    if (!dateKey || !agenceId) {
      setHasExistingData(false);
      return;
    }
    
    try {
      setLoading(true); // Ajouter un indicateur de chargement
      const dateKeyInt = convertDateToYYYYMMDD(dateKey);
      
      console.log(`🔍 Recherche de données existantes pour l'agence ${agenceId} et la date ${dateKeyInt}`);
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
        console.log(`✅ Données existantes trouvées: ${existingData.length} enregistrements chargés`);
        const encVals = existingData
          .map(r => r.Encaissement_Journalier_Global)
          .filter(v => v != null && v !== '');
        if (encVals.length > 0) {
          const uniqueEnc = encVals[0];
          setFormData(prev => ({ ...prev, encaissementJournalierGlobal: uniqueEnc }));
        }
      } else {
        setHasExistingData(false);
        console.log(`ℹ️ Aucune donnée existante trouvée pour cette date et cette agence`);
        setFormData(prev => ({ 
          ...prev, 
          encaissementJournalierGlobal: ''
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données existantes:', error);
      setHasExistingData(false);
    } finally {
      setLoading(false);
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
      
      // Convertir la date au format YYYYMMDD pour loadSummary
      const dateKeyInt = convertDateToYYYYMMDD(formData.dateKey);
      loadSummary(formData.agenceId, dateKeyInt);
    }
  }, [formData.dateKey, formData.agenceId]);

  // ❌ SUPPRIMÉ: useEffect pour recalculer depuis le formulaire - Le résumé charge uniquement depuis la BDD

  // Fonction de réinitialisation complète après enregistrement
  const resetFormAndSummary = () => {
    console.log('🔄 Réinitialisation complète du formulaire et du résumé');
    
    // Réinitialiser le formulaire
    setFormData({
      dateKey: '',
      agenceId: '',
      encaissementJournalierGlobal: ''
    });
    
    // Réinitialiser les données par catégorie
    setEntriesByCategory({});
    
    // Réinitialiser le résumé
    setSummary(null);
    
    // Réinitialiser les indicateurs
    setHasExistingData(false);
    setLoading(false);
    setIsReset(true);
    
    // Masquer l'indicateur de réinitialisation après 3 secondes
    setTimeout(() => {
      setIsReset(false);
    }, 3000);
    
    console.log('✅ Réinitialisation terminée');
  };

  // Fonction pour vérifier si la date est à plus de 7 jours pour les utilisateurs standard
  const isDateOlderThan7Days = (dateStr) => {
    const user = authService.getCurrentUser();
    const isAdmin = (user?.role || '').toString() === 'Administrateur';
    
    // Les administrateurs ne sont pas limités
    if (isAdmin) return false;
    
    if (!dateStr) return false;
    
    const selectedDate = new Date(dateStr);
    const today = new Date();
    
    // Réinitialiser les heures à minuit pour une comparaison précise
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    // Calculer la différence en millisecondes puis en jours
    const diffTime = today.getTime() - selectedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Retourner true si la date est à plus de 7 jours dans le passé
    return diffDays > 7;
  };

  // Vérifier si le formulaire doit être désactivé pour les utilisateurs standard
  const isFormDisabled = isDateOlderThan7Days(formData.dateKey);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.dateKey || !formData.agenceId) {
      await swalError('Veuillez sélectionner une date et une agence');
      return;
    }

    // Vérifier la restriction de 7 jours pour les utilisateurs standard
    if (isDateOlderThan7Days(formData.dateKey)) {
      await swalError('Vous ne pouvez pas ajouter ou modifier des données de plus de 7 jours');
      return;
    }

    try {
      setLoading(true);
      
      const dateKey = convertDateToYYYYMMDD(formData.dateKey);

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
      
      // Vérifier si les données sauvegardées sont pour aujourd'hui
      const user = authService.getCurrentUser();
      const isAdmin = (user?.role || '').toString() === 'Administrateur';
      if (!isAdmin) {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const savedDateStr = formData.dateKey;
        
        // Si on a sauvegardé les données du jour, fermer l'alerte si elle est ouverte
        if (savedDateStr === todayStr && swal.isVisible()) {
          swal.close();
        }
      }
      
      await swalSuccess('Données enregistrées avec succès !');
      
      // ✅ RÉINITIALISATION COMPLÈTE APRÈS ENREGISTREMENT RÉUSSI
      resetFormAndSummary();
      
      // Recharger les données de base
      await loadData();
    } catch (e) {
      console.error('❌ Erreur lors de la sauvegarde KPI:', e);
      
      // Gestion d'erreur spécifique selon le type
      let errorMessage = 'Une erreur est survenue lors de la sauvegarde';
      
      if (e?.response?.status === 400) {
        // Erreur de validation côté serveur
        const errorData = e.response.data;
        errorMessage = errorData.message || 'Données invalides. Vérifiez les champs remplis.';
        
        // Afficher les détails si disponibles
        if (errorData.details) {
          console.error('📊 Détails de l\'erreur:', errorData.details);
        }
      } else if (e?.response?.status === 500) {
        // Erreur serveur
        const errorData = e.response.data;
        errorMessage = errorData.message || 'Erreur serveur. Veuillez réessayer.';
        
        // Log des détails pour le debug
        if (errorData.details) {
          console.error('🔍 Détails de l\'erreur serveur:', errorData.details);
        }
      } else if (e?.response?.status === 409) {
        // Conflit (par exemple, contrainte unique)
        errorMessage = e.response.data.message || 'Conflit de données. Vérifiez que les données ne sont pas déjà enregistrées.';
      } else if (e?.response?.status === 403) {
        const errorData = e.response.data;
        errorMessage = errorData.message || 'Accès refusé. Vérifiez vos permissions.';
        // Message spécifique pour la restriction de 7 jours
        if (errorData.details && errorData.details.limite === 7) {
          errorMessage = `Les utilisateurs standard ne peuvent pas ajouter ou modifier des données de plus de 7 jours. La date demandée (${errorData.details.dateDemandee}) est à ${errorData.details.joursDepuis} jours de la date actuelle (${errorData.details.dateActuelle}).`;
        }
      } else if (e?.response?.status === 404) {
        errorMessage = 'Ressource non trouvée. Vérifiez que l\'agence et la catégorie existent.';
      }
      
      await swalError(errorMessage);
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
    return Math.min(((actual / target) * 100), 200); // Limiter à 200% pour l'animation
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-300">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 dark:bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400 mb-2">
            Tableau de Bord
          </h1>
          <p className="text-gray-600 dark:text-slate-300 text-lg">Saisie et suivi des indicateurs de performance quotidiens</p>
        </motion.div>

        {/* A. Section Objectifs Agence - EN HAUT */}
        {objectives && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-blue-200/50 dark:border-slate-700 shadow-xl mb-8 overflow-hidden"
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
                  {agences.find(a => String(a.AgenceId) === String(formData.agenceId))?.Nom_Agence}
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
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 px-6 py-4 rounded-t-xl border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100">📝 Saisie des données</h2>
              <div className="flex items-center gap-2">
                {hasExistingData && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    <span>Mode édition - Données existantes chargées</span>
                  </div>
                )}
                {isFormDisabled && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
                    <AlertCircle className="h-4 w-4" />
                    <span>Date à plus de 7 jours - Modification non autorisée</span>
                  </div>
                )}
              </div>
            </div>
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
                        <label className="flex items-center text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                          <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded mr-2">
                            <Building2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        Agence *
                      </label>
                      <select
                        value={formData.agenceId}
                        onChange={(e) => setFormData({ ...formData, agenceId: e.target.value })}
                          className="w-full border border-gray-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm hover:shadow-md text-xs max-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                        disabled={isFormDisabled}
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
                        <label className="flex items-center text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                          <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded mr-2">
                            <Building2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        Agence assignée
                      </label>
                        <div className="w-full border border-gray-200 dark:border-slate-700 rounded px-2 py-1 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800 text-gray-700 dark:text-slate-200 shadow-sm text-xs max-w-[200px]">
                        {userAgence ? userAgence.Nom_Agence : 'Chargement...'}
                      </div>
                    </div>
                  );
                }
              })()}

                <div className="space-y-1">
                  <label className="flex items-center text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                    <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded mr-2">
                      <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            </div>
                    Date *
                  </label>
                  <ModernDatePicker
                    value={formData.dateKey}
                    onChange={(date) => setFormData({ ...formData, dateKey: date })}
                    placeholder="Sélectionner une date"
                    disabled={isFormDisabled}
                  />
                </div>
              </div>

              {/* Toggle vue: Grille Excel / Cartes */}
              <div className="flex items-center justify-end gap-2 mb-4">
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Vue :</span>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${viewMode === 'table' ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-300 dark:border-slate-600 hover:border-blue-400'}`}
                >
                  <Table className="h-3.5 w-3.5" />
                  Grille Excel
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${viewMode === 'cards' ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-300 dark:border-slate-600 hover:border-blue-400'}`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Cartes
                </button>
              </div>

              {/* ─────────────── VUE GRILLE EXCEL ─────────────── */}
              {viewMode === 'table' && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                  <table style={{ borderCollapse: 'collapse', minWidth: '1100px', width: '100%', fontSize: '11px' }}>
                    <thead>
                      {/* Ligne 1 : En-têtes de groupes colorés */}
                      <tr>
                        <th rowSpan={2} style={{ background: '#D9E1F2', color: '#1a1a2e', border: '1px solid #b0b8cc', padding: '6px 8px', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '140px' }}>
                          cat
                        </th>
                        <th colSpan={4} style={{ background: '#82C91E', color: '#fff', border: '1px solid #6aab12', padding: '5px 4px', textAlign: 'center', fontWeight: 700 }}>
                          Relances Systématiques
                        </th>
                        <th colSpan={4} style={{ background: '#FFFF00', color: '#333', border: '1px solid #cccc00', padding: '5px 4px', textAlign: 'center', fontWeight: 700 }}>
                          Mise en Demeure
                        </th>
                        <th colSpan={4} style={{ background: '#FFC000', color: '#fff', border: '1px solid #cc9900', padding: '5px 4px', textAlign: 'center', fontWeight: 700 }}>
                          Activité Coupure
                        </th>
                        <th colSpan={2} style={{ background: '#FF0000', color: '#fff', border: '1px solid #cc0000', padding: '5px 4px', textAlign: 'center', fontWeight: 700 }}>
                          Autre Activité
                        </th>
                        <th colSpan={4} style={{ background: '#8EA9DB', color: '#fff', border: '1px solid #6a85b8', padding: '5px 4px', textAlign: 'center', fontWeight: 700 }}>
                          Gestion des Compteurs
                        </th>
                        <th rowSpan={2} style={{ background: '#ED7D31', color: '#fff', border: '1px solid #c4611e', padding: '5px 4px', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          ENCAISSEMENT<br />Global
                        </th>
                      </tr>
                      {/* Ligne 2 : Sous-colonnes */}
                      <tr>
                        {/* Relances Systématiques */}
                        <th style={{ background: '#c5e87a', color: '#1a1a2e', border: '1px solid #82C91E', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>RS Nbre</th>
                        <th style={{ background: '#c5e87a', color: '#1a1a2e', border: '1px solid #82C91E', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>RS Mts</th>
                        <th style={{ background: '#c5e87a', color: '#1a1a2e', border: '1px solid #82C91E', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>Encai ≥RS Nbre</th>
                        <th style={{ background: '#c5e87a', color: '#1a1a2e', border: '1px solid #82C91E', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>Encai ≥RS Mts</th>
                        {/* Mise en Demeure */}
                        <th style={{ background: '#ffffaa', color: '#333', border: '1px solid #cccc00', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>MeD Nbre</th>
                        <th style={{ background: '#ffffaa', color: '#333', border: '1px solid #cccc00', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>MeD Mts</th>
                        <th style={{ background: '#ffffaa', color: '#333', border: '1px solid #cccc00', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>Encai ≥MeD Nbre</th>
                        <th style={{ background: '#ffffaa', color: '#333', border: '1px solid #cccc00', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>Encai ≥MeD Mts</th>
                        {/* Activité Coupure */}
                        <th style={{ background: '#ffe066', color: '#333', border: '1px solid #cc9900', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>Coupures Nbre</th>
                        <th style={{ background: '#ffe066', color: '#333', border: '1px solid #cc9900', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>Coupures Mts</th>
                        <th style={{ background: '#ffe066', color: '#333', border: '1px solid #cc9900', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>Réouv. Nbre</th>
                        <th style={{ background: '#ffe066', color: '#333', border: '1px solid #cc9900', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>Réouv. Mts</th>
                        {/* Autre Activité */}
                        <th style={{ background: '#ff8080', color: '#fff', border: '1px solid #cc0000', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>Dos. Cont. Nbre</th>
                        <th style={{ background: '#ff8080', color: '#fff', border: '1px solid #cc0000', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>Dos. Cont. Mts</th>
                        {/* Gestion des Compteurs */}
                        <th style={{ background: '#b8cce4', color: '#1a1a2e', border: '1px solid #8EA9DB', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>Nouv. Branch.</th>
                        <th style={{ background: '#b8cce4', color: '#1a1a2e', border: '1px solid #8EA9DB', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>Sans Compt.</th>
                        <th style={{ background: '#b8cce4', color: '#1a1a2e', border: '1px solid #8EA9DB', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>Contrôles</th>
                        <th style={{ background: '#b8cce4', color: '#1a1a2e', border: '1px solid #8EA9DB', padding: '4px 3px', textAlign: 'center', whiteSpace: 'nowrap' }}>Observation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(sortedCategories || []).map((cat, idx) => {
                        const e = entriesByCategory[cat.CategorieId] || {};
                        const rowBg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
                        const cellStyle = { border: '1px solid #d1d5db', padding: '2px 2px', background: rowBg };
                        const inputStyle = {
                          width: '100%', border: 'none', background: 'transparent',
                          textAlign: 'center', padding: '3px 2px', fontSize: '11px',
                          outline: 'none', color: 'inherit', minWidth: '52px'
                        };
                        const labelStyle = { border: '1px solid #d1d5db', padding: '5px 6px', background: '#eef2ff', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', fontSize: '11px' };
                        return (
                          <tr key={cat.CategorieId}>
                            <td style={labelStyle}>{getCategoryLabel(cat)}</td>
                            {/* Relances Systématiques */}
                            <td style={cellStyle}><input type="number" min="0" step="1" style={inputStyle} value={e.nbRelancesEnvoyees || ''} onChange={ev => handleCellChange(cat.CategorieId, 'nbRelancesEnvoyees', ev.target.value)} disabled={isFormDisabled} /></td>
                            <td style={cellStyle}><input type="number" min="0" step="0.01" style={inputStyle} value={e.mtRelancesEnvoyees || ''} onChange={ev => handleCellChange(cat.CategorieId, 'mtRelancesEnvoyees', ev.target.value)} disabled={isFormDisabled} /></td>
                            <td style={cellStyle}><input type="number" min="0" step="1" style={inputStyle} value={e.nbRelancesReglees || ''} onChange={ev => handleCellChange(cat.CategorieId, 'nbRelancesReglees', ev.target.value)} disabled={isFormDisabled} /></td>
                            <td style={cellStyle}><input type="number" min="0" step="0.01" style={inputStyle} value={e.mtRelancesReglees || ''} onChange={ev => handleCellChange(cat.CategorieId, 'mtRelancesReglees', ev.target.value)} disabled={isFormDisabled} /></td>
                            {/* Mise en Demeure */}
                            <td style={cellStyle}><input type="number" min="0" step="1" style={inputStyle} value={e.nbMisesEnDemeureEnvoyees || ''} onChange={ev => handleCellChange(cat.CategorieId, 'nbMisesEnDemeureEnvoyees', ev.target.value)} disabled={isFormDisabled} /></td>
                            <td style={cellStyle}><input type="number" min="0" step="0.01" style={inputStyle} value={e.mtMisesEnDemeureEnvoyees || ''} onChange={ev => handleCellChange(cat.CategorieId, 'mtMisesEnDemeureEnvoyees', ev.target.value)} disabled={isFormDisabled} /></td>
                            <td style={cellStyle}><input type="number" min="0" step="1" style={inputStyle} value={e.nbMisesEnDemeureReglees || ''} onChange={ev => handleCellChange(cat.CategorieId, 'nbMisesEnDemeureReglees', ev.target.value)} disabled={isFormDisabled} /></td>
                            <td style={cellStyle}><input type="number" min="0" step="0.01" style={inputStyle} value={e.mtMisesEnDemeureReglees || ''} onChange={ev => handleCellChange(cat.CategorieId, 'mtMisesEnDemeureReglees', ev.target.value)} disabled={isFormDisabled} /></td>
                            {/* Activité Coupure */}
                            <td style={cellStyle}><input type="number" min="0" step="1" style={inputStyle} value={e.nbCoupures || ''} onChange={ev => handleCellChange(cat.CategorieId, 'nbCoupures', ev.target.value)} disabled={isFormDisabled} /></td>
                            <td style={cellStyle}><input type="number" min="0" step="0.01" style={inputStyle} value={e.mtCoupures || ''} onChange={ev => handleCellChange(cat.CategorieId, 'mtCoupures', ev.target.value)} disabled={isFormDisabled} /></td>
                            <td style={cellStyle}><input type="number" min="0" step="1" style={inputStyle} value={e.nbRetablissements || ''} onChange={ev => handleCellChange(cat.CategorieId, 'nbRetablissements', ev.target.value)} disabled={isFormDisabled} /></td>
                            <td style={cellStyle}><input type="number" min="0" step="0.01" style={inputStyle} value={e.mtRetablissements || ''} onChange={ev => handleCellChange(cat.CategorieId, 'mtRetablissements', ev.target.value)} disabled={isFormDisabled} /></td>
                            {/* Autre Activité */}
                            <td style={cellStyle}><input type="number" min="0" step="1" style={inputStyle} value={e.nbDossiersJuridiques || ''} onChange={ev => handleCellChange(cat.CategorieId, 'nbDossiersJuridiques', ev.target.value)} disabled={isFormDisabled} /></td>
                            <td style={cellStyle}><input type="number" min="0" step="0.01" style={inputStyle} value={e.mtDossiersJuridiques || ''} onChange={ev => handleCellChange(cat.CategorieId, 'mtDossiersJuridiques', ev.target.value)} disabled={isFormDisabled} /></td>
                            {/* Gestion des Compteurs */}
                            <td style={cellStyle}><input type="number" min="0" step="1" style={inputStyle} value={e.nbBranchements || ''} onChange={ev => handleCellChange(cat.CategorieId, 'nbBranchements', ev.target.value)} disabled={isFormDisabled} /></td>
                            <td style={cellStyle}><input type="number" min="0" step="1" style={inputStyle} value={e.nbCompteursRemplaces || ''} onChange={ev => handleCellChange(cat.CategorieId, 'nbCompteursRemplaces', ev.target.value)} disabled={isFormDisabled} /></td>
                            <td style={cellStyle}><input type="number" min="0" step="1" style={inputStyle} value={e.nbControles || ''} onChange={ev => handleCellChange(cat.CategorieId, 'nbControles', ev.target.value)} disabled={isFormDisabled} /></td>
                            <td style={{ ...cellStyle, minWidth: '90px' }}><input type="text" style={{ ...inputStyle, textAlign: 'left', minWidth: '80px' }} value={e.observation || ''} onChange={ev => handleCellChange(cat.CategorieId, 'observation', ev.target.value)} maxLength={200} disabled={isFormDisabled} placeholder="obs..." /></td>
                            {/* ENCAISSEMENT colonne vide par ligne (global en bas) */}
                            <td style={{ border: '1px solid #d1d5db', background: '#fff7ed', padding: '4px', textAlign: 'center', color: '#9ca3af', fontSize: '10px' }}>—</td>
                          </tr>
                        );
                      })}
                      {/* Ligne Total */}
                      <tr style={{ background: '#1e3a5f' }}>
                        <td style={{ border: '1px solid #1e3a5f', padding: '5px 8px', color: '#fff', fontWeight: 700, fontSize: '12px' }}>Total</td>
                        {[
                          'nbRelancesEnvoyees','mtRelancesEnvoyees','nbRelancesReglees','mtRelancesReglees',
                          'nbMisesEnDemeureEnvoyees','mtMisesEnDemeureEnvoyees','nbMisesEnDemeureReglees','mtMisesEnDemeureReglees',
                          'nbCoupures','mtCoupures','nbRetablissements','mtRetablissements',
                          'nbDossiersJuridiques','mtDossiersJuridiques',
                          'nbBranchements','nbCompteursRemplaces','nbControles'
                        ].map(field => (
                          <td key={field} style={{ border: '1px solid #2d5a8e', padding: '5px 4px', color: '#fff', fontWeight: 700, textAlign: 'center', background: '#1e3a5f', fontSize: '11px' }}>
                            {getSum(field)}
                          </td>
                        ))}
                        {/* Observation total — vide */}
                        <td style={{ border: '1px solid #2d5a8e', background: '#1e3a5f', padding: '5px 4px' }}></td>
                        {/* Encaissement Global total */}
                        <td style={{ border: '1px solid #c4611e', padding: '5px 4px', color: '#fff', fontWeight: 700, textAlign: 'center', background: '#ED7D31', fontSize: '11px' }}>
                          {formData.encaissementJournalierGlobal
                            ? parseFloat(formData.encaissementJournalierGlobal).toLocaleString('fr-FR', { minimumFractionDigits: 2 })
                            : '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* ─────────────── VUE CARTES ─────────────── */}
              {viewMode === 'cards' && (
                <div className="space-y-6">
                    {(sortedCategories || []).map((cat, index) => {
                      const e = entriesByCategory[cat.CategorieId] || {};
                      return (
                    <div key={cat.CategorieId} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800 px-6 py-4 rounded-t-xl border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-slate-100">{getCategoryLabel(cat)}</h4>
                        <button
                          type="button"
                          onClick={() => setCollapsedByCategory(prev => ({ ...prev, [cat.CategorieId]: !prev[cat.CategorieId] }))}
                          className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 transition-colors"
                        >
                          {collapsedByCategory[cat.CategorieId] ? <><ChevronRight className="h-4 w-4" />Déplier</> : <><ChevronDown className="h-4 w-4" />Plier</>}
                        </button>
                      </div>
                      <div className={collapsedByCategory[cat.CategorieId] ? 'hidden' : 'p-6'}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <h5 className="font-semibold text-cyan-700 dark:text-cyan-400 text-sm border-b border-cyan-100 pb-1">Relances Systématiques</h5>
                            <div className="grid grid-cols-2 gap-3">
                              {[['nbRelancesEnvoyees','RS Nbre','1'],['mtRelancesEnvoyees','RS Montant','0.01'],['nbRelancesReglees','Encai≥RS Nbre','1'],['mtRelancesReglees','Encai≥RS Mts','0.01']].map(([f,l,s])=>(
                                <div key={f}><label className="text-xs text-gray-500 mb-1 block">{l}</label><input type="number" min="0" step={s} value={e[f]||''} onChange={ev=>handleCellChange(cat.CategorieId,f,ev.target.value)} className="w-full border border-cyan-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500" disabled={isFormDisabled} /></div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h5 className="font-semibold text-yellow-700 dark:text-yellow-400 text-sm border-b border-yellow-100 pb-1">Mise en Demeure</h5>
                            <div className="grid grid-cols-2 gap-3">
                              {[['nbMisesEnDemeureEnvoyees','MeD Nbre','1'],['mtMisesEnDemeureEnvoyees','MeD Montant','0.01'],['nbMisesEnDemeureReglees','Encai≥MeD Nbre','1'],['mtMisesEnDemeureReglees','Encai≥MeD Mts','0.01']].map(([f,l,s])=>(
                                <div key={f}><label className="text-xs text-gray-500 mb-1 block">{l}</label><input type="number" min="0" step={s} value={e[f]||''} onChange={ev=>handleCellChange(cat.CategorieId,f,ev.target.value)} className="w-full border border-yellow-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500" disabled={isFormDisabled} /></div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h5 className="font-semibold text-orange-700 dark:text-orange-400 text-sm border-b border-orange-100 pb-1">Activité Coupure</h5>
                            <div className="grid grid-cols-2 gap-3">
                              {[['nbCoupures','Coupures Nbre','1'],['mtCoupures','Coupures Mts','0.01'],['nbRetablissements','Réouv. Nbre','1'],['mtRetablissements','Réouv. Mts','0.01']].map(([f,l,s])=>(
                                <div key={f}><label className="text-xs text-gray-500 mb-1 block">{l}</label><input type="number" min="0" step={s} value={e[f]||''} onChange={ev=>handleCellChange(cat.CategorieId,f,ev.target.value)} className="w-full border border-orange-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500" disabled={isFormDisabled} /></div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h5 className="font-semibold text-red-700 dark:text-red-400 text-sm border-b border-red-100 pb-1">Autre Activité (Contentieux)</h5>
                            <div className="grid grid-cols-2 gap-3">
                              {[['nbDossiersJuridiques','Dossiers Nbre','1'],['mtDossiersJuridiques','Dossiers Mts','0.01']].map(([f,l,s])=>(
                                <div key={f}><label className="text-xs text-gray-500 mb-1 block">{l}</label><input type="number" min="0" step={s} value={e[f]||''} onChange={ev=>handleCellChange(cat.CategorieId,f,ev.target.value)} className="w-full border border-red-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500" disabled={isFormDisabled} /></div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h5 className="font-semibold text-blue-700 dark:text-blue-400 text-sm border-b border-blue-100 pb-1">Gestion des Compteurs</h5>
                            <div className="grid grid-cols-2 gap-3">
                              {[['nbBranchements','Nouv. Branch.','1'],['nbCompteursRemplaces','Sans Compt.','1'],['nbControles','Contrôles','1']].map(([f,l,s])=>(
                                <div key={f}><label className="text-xs text-gray-500 mb-1 block">{l}</label><input type="number" min="0" step={s} value={e[f]||''} onChange={ev=>handleCellChange(cat.CategorieId,f,ev.target.value)} className="w-full border border-blue-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isFormDisabled} /></div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-gray-500 font-medium">Observation</label>
                            <textarea value={e.observation||''} onChange={ev=>handleCellChange(cat.CategorieId,'observation',ev.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none" rows="3" maxLength="200" disabled={isFormDisabled} placeholder="Observation..." />
                            <div className="text-right text-xs text-gray-400">{(e.observation||'').length}/200</div>
                          </div>
                        </div>
                      </div>
                    </div>
                      );
                    })}
                </div>
              )}

              {/* Encaissement Journalier Global */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg mr-3">
                      <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
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
                      className="w-64 border-2 border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm hover:shadow-md"
                  placeholder="Montant de l'encaissement journalier global..."
                  disabled={isFormDisabled}
                />
              </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={isFormDisabled}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2 font-medium text-sm transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
            className="bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-green-200/50 dark:border-slate-700 shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-8 py-6">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-2xl font-bold text-white flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                  >
                    <BarChart3 className="h-6 w-6" />
                  </motion.div>
                  Résumé Détaillé des Données
                </div>
                {hasExistingData && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    <span>Données chargées</span>
                  </div>
                )}
                {isReset && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 dark:bg-green-900/30 text-green-300 dark:text-green-400 rounded-full text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    <span>Formulaire réinitialisé</span>
                  </div>
                )}
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
                  value={summary?.daily?.Total_RelancesEnvoyees || 0}
                  subtitle={formatCurrency(summary?.daily?.Total_Mt_RelancesEnvoyees || 0)}
                  icon={AlertCircle}
                  color="cyan"
                  percentage={objectives?.Obj_Relances ? calculatePercentage(summary?.daily?.Total_RelancesEnvoyees || 0, objectives.Obj_Relances) : undefined}
                  showProgress={!!objectives?.Obj_Relances}
                />

                {/* Relances Encaissées */}
                <KpiCard
                  title="Relances Encaissées"
                  value={summary?.daily?.Total_RelancesReglees || 0}
                  subtitle={formatCurrency(summary?.daily?.Total_Mt_RelancesReglees || 0)}
                  icon={CheckCircle}
                  color="green"
                  percentage={objectives?.Obj_Relances ? calculatePercentage(summary?.daily?.Total_RelancesReglees || 0, objectives.Obj_Relances) : undefined}
                  showProgress={!!objectives?.Obj_Relances}
                />

                {/* Mises en Demeure Envoyées */}
                <KpiCard
                  title="Mises en Demeure Envoyées"
                  value={summary?.daily?.Total_MisesEnDemeureEnvoyees || 0}
                  subtitle={formatCurrency(summary?.daily?.Total_Mt_MisesEnDemeureEnvoyees || 0)}
                  icon={Shield}
                  color="yellow"
                  percentage={objectives?.Obj_MisesEnDemeure ? calculatePercentage(summary?.daily?.Total_MisesEnDemeureEnvoyees || 0, objectives.Obj_MisesEnDemeure) : undefined}
                  showProgress={!!objectives?.Obj_MisesEnDemeure}
                />

                {/* Mises en Demeure Encaissées */}
                <KpiCard
                  title="Mises en Demeure Encaissées"
                  value={summary?.daily?.Total_MisesEnDemeureReglees || 0}
                  subtitle={formatCurrency(summary?.daily?.Total_Mt_MisesEnDemeureReglees || 0)}
                  icon={CheckCircle}
                  color="orange"
                  percentage={objectives?.Obj_MisesEnDemeure ? calculatePercentage(summary?.daily?.Total_MisesEnDemeureReglees || 0, objectives.Obj_MisesEnDemeure) : undefined}
                  showProgress={!!objectives?.Obj_MisesEnDemeure}
                />

                {/* Dossiers Juridiques Transmis */}
                <KpiCard
                  title="Dossiers Juridiques Transmis"
                  value={summary?.daily?.Total_DossiersJuridiques || 0}
                  subtitle={formatCurrency(summary?.daily?.Total_Mt_DossiersJuridiques || 0)}
                  icon={Users}
                  color="orange"
                  percentage={objectives?.Obj_Dossiers_Juridiques ? calculatePercentage(summary?.daily?.Total_DossiersJuridiques || 0, objectives.Obj_Dossiers_Juridiques) : undefined}
                  showProgress={!!objectives?.Obj_Dossiers_Juridiques}
                />

                {/* Coupures Réalisées */}
                <KpiCard
                  title="Coupures Réalisées"
                  value={summary?.daily?.Total_Coupures || 0}
                  subtitle={formatCurrency(summary?.daily?.Total_Mt_Coupures || 0)}
                  icon={Zap}
                  color="red"
                  percentage={objectives?.Obj_Coupures ? calculatePercentage(summary?.daily?.Total_Coupures || 0, objectives.Obj_Coupures) : undefined}
                  showProgress={!!objectives?.Obj_Coupures}
                />

                {/* Rétablissements */}
                <KpiCard
                  title="Rétablissements"
                  value={summary?.daily?.Total_Retablissements || 0}
                  subtitle={formatCurrency(summary?.daily?.Total_Mt_Retablissements || 0)}
                  icon={CheckCircle}
                  color="emerald"
                />

                {/* Branchements Réalisés */}
                <KpiCard
                  title="Branchements Réalisés"
                  value={summary?.daily?.Total_Branchements || 0}
                  icon={Users}
                  color="blue"
                />

                {/* Remplacement de Compteur */}
                <KpiCard
                  title="Remplacement de Compteur"
                  value={summary?.daily?.Total_CompteursRemplaces || 0}
                  icon={Wrench}
                  color="purple"
                  percentage={objectives?.Obj_Compteurs_Remplaces ? calculatePercentage(summary?.daily?.Total_CompteursRemplaces || 0, objectives.Obj_Compteurs_Remplaces) : undefined}
                  showProgress={!!objectives?.Obj_Compteurs_Remplaces}
                />

                {/* Contrôles Effectués */}
                <KpiCard
                  title="Contrôles Effectués"
                  value={summary?.daily?.Total_Controles || 0}
                  icon={Eye}
                  color="indigo"
                  percentage={objectives?.Obj_Controles ? calculatePercentage(summary?.daily?.Total_Controles || 0, objectives.Obj_Controles) : undefined}
                  showProgress={!!objectives?.Obj_Controles}
                />

                {/* Encaissement du jour */}
                <KpiCard
                  title="Encaissement du jour"
                  value={formatCurrency(summary?.daily?.Total_EncaissementGlobal || 0)}
                  icon={DollarSign}
                  color="emerald"
                  percentage={objectives?.Obj_Encaissement ? calculatePercentage(summary?.daily?.Total_EncaissementGlobal || 0, objectives.Obj_Encaissement) : undefined}
                  showProgress={!!objectives?.Obj_Encaissement}
                />
              </motion.div>
                                </div>
          </motion.div>
        )}
        
        {/* Message d'état vide */}
        {!summary && formData.dateKey && formData.agenceId && (
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-br from-slate-50 via-yellow-50 to-orange-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-yellow-200/50 dark:border-slate-700 shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 px-8 py-6">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-2xl font-bold text-white flex items-center gap-3"
              >
                <BarChart3 className="h-6 w-6" />
                Résumé Détaillé des Données
              </motion.h2>
            </div>
            <div className="p-8 text-center">
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-2">Aucune donnée disponible</h3>
                <p className="text-gray-600 dark:text-slate-300 mb-4">
                  Aucune donnée KPI n'a été trouvée pour cette date et cette agence.
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Remplissez le formulaire ci-dessus pour enregistrer des données.
                </p>
              </div>
            </div>
          </motion.div>
        )}
              </div>
    </div>
  );
}

export default KPI;