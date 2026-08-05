import React, { useEffect, useState } from 'react';
import { Calendar, Building2, Save, Target, DollarSign, BarChart3, CheckCircle, AlertCircle, Zap, Shield, Users, Wrench, Eye, ChevronDown, ChevronRight, Table, LayoutGrid, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import kpiService from '../services/kpiService';
import authService from '../services/authService';
import { swalSuccess, swalError, swal } from '../utils/swal';
import { convertDateToYYYYMMDD } from '../utils/dateUtils';
import ModernDatePicker from '../components/ModernDatePicker';
import KpiCard from '../components/KpiCard';

function KPI() {
  const [agences, setAgences] = useState([]);
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

  const NUMERIC_FIELDS = [
    'nbRelancesEnvoyees', 'mtRelancesEnvoyees', 'nbRelancesReglees', 'mtRelancesReglees',
    'nbMisesEnDemeureEnvoyees', 'mtMisesEnDemeureEnvoyees', 'nbMisesEnDemeureReglees', 'mtMisesEnDemeureReglees',
    'nbCoupures', 'mtCoupures', 'nbRetablissements', 'mtRetablissements',
    'nbDossiersJuridiques', 'mtDossiersJuridiques',
    'nbBranchements', 'nbCompteursRemplaces', 'nbControles'
  ];

  const categoryHasData = (catId) => {
    const e = entriesByCategory[catId] || {};
    return NUMERIC_FIELDS.some((f) => e[f] !== '' && e[f] != null);
  };

  const filledCategoriesCount = (sortedCategories || []).filter((c) => categoryHasData(c.CategorieId)).length;

  const setToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setFormData((prev) => ({ ...prev, dateKey: `${yyyy}-${mm}-${dd}` }));
  };

  const GridInput = ({ value, onChange, step = '1', type = 'number', placeholder = '', className = '', disabled = false, maxLength }) => (
    <input
      type={type}
      min={type === 'number' ? '0' : undefined}
      step={type === 'number' ? step : undefined}
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full min-w-[3.25rem] rounded-md border-0 bg-transparent px-1.5 py-1.5 text-center text-[11px] text-slate-800 outline-none transition focus:bg-water-50 focus:ring-2 focus:ring-water-400/50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-100 dark:focus:bg-slate-800 ${className}`}
    />
  );

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
      
      setAgences(agencesData || []);
      
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
            Saisie KPI
          </h1>
          <p className="text-gray-600 dark:text-slate-300">Indicateurs de performance quotidiens par agence et catégorie</p>
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
        <div className="mb-8 overflow-hidden rounded-2xl border border-water-200/60 bg-white shadow-[0_8px_30px_-12px_rgba(2,132,199,0.2)] dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-water-100/80 bg-gradient-to-r from-water-50 via-white to-sky-50 px-5 py-4 dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-water-500 to-water-700 text-white shadow-md shadow-water-500/25">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Saisie des données</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {filledCategoriesCount}/{sortedCategories.length || 0} catégorie(s) renseignée(s)
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {hasExistingData && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Édition
                  </span>
                )}
                {isFormDisabled && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Lecture seule (&gt; 7 jours)
                  </span>
                )}
                {isReset && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-water-100 px-3 py-1 text-xs font-semibold text-water-700 dark:bg-water-900/30 dark:text-water-300">
                    Formulaire réinitialisé
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-water-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-water-500 to-sky-400 transition-all duration-500"
                style={{ width: `${sortedCategories.length ? (filledCategoriesCount / sortedCategories.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            <div className="grid gap-4 rounded-2xl border border-water-100 bg-water-50/40 p-4 dark:border-slate-700 dark:bg-slate-800/40 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  <Calendar className="h-3.5 w-3.5 text-water-600" />
                  Date de saisie
                </label>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <ModernDatePicker
                      value={formData.dateKey}
                      onChange={(date) => setFormData({ ...formData, dateKey: date })}
                      placeholder="Sélectionner une date"
                      disabled={false}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={setToday}
                    className="shrink-0 rounded-xl border border-water-200 bg-white px-3 py-2 text-xs font-semibold text-water-700 transition hover:bg-water-50 dark:border-slate-600 dark:bg-slate-800 dark:text-water-300 dark:hover:bg-slate-700"
                  >
                    Aujourd&apos;hui
                  </button>
                </div>
              </div>

              {(() => {
                const user = authService.getCurrentUser();
                const isAdmin = (user?.role || '').toString() === 'Administrateur';
                if (isAdmin) {
                  return (
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                        <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                        Agence
                      </label>
                      <select
                        value={formData.agenceId}
                        onChange={(e) => setFormData({ ...formData, agenceId: e.target.value })}
                        className="w-full rounded-xl border-2 border-water-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-water-400 focus:ring-2 focus:ring-water-400/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        required
                      >
                        <option value="">Sélectionner une agence</option>
                        {agences.map((agence) => (
                          <option key={agence.AgenceId} value={agence.AgenceId}>{agence.Nom_Agence}</option>
                        ))}
                      </select>
                    </div>
                  );
                }
                const userAgence = agences.find((a) => Number(a.AgenceId) === Number(formData.agenceId));
                return (
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                      Agence assignée
                    </label>
                    <div className="rounded-xl border-2 border-water-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                      {userAgence ? userAgence.Nom_Agence : 'Chargement...'}
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-end">
                <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-water-200/70 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Affichage</span>
                  <div className="inline-flex rounded-lg bg-water-50 p-0.5 dark:bg-slate-700">
                    <button type="button" onClick={() => setViewMode('table')} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${viewMode === 'table' ? 'bg-water-600 text-white shadow-sm' : 'text-slate-600 hover:text-water-700 dark:text-slate-300'}`}>
                      <Table className="h-3.5 w-3.5" /> Grille
                    </button>
                    <button type="button" onClick={() => setViewMode('cards')} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${viewMode === 'cards' ? 'bg-water-600 text-white shadow-sm' : 'text-slate-600 hover:text-water-700 dark:text-slate-300'}`}>
                      <LayoutGrid className="h-3.5 w-3.5" /> Cartes
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {!formData.agenceId && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300">
                <AlertCircle className="h-5 w-5 shrink-0" />
                Sélectionnez une agence pour commencer la saisie.
              </div>
            )}

            {viewMode === 'table' && formData.agenceId && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full min-w-[1100px] border-collapse text-[11px]">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th rowSpan={2} className="border border-slate-200 bg-slate-100 px-3 py-2 text-center font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200" style={{ minWidth: 150 }}>Catégorie</th>
                      <th colSpan={4} className="border border-emerald-500/40 bg-emerald-500 px-2 py-2 text-center font-bold text-white">Relances</th>
                      <th colSpan={4} className="border border-amber-400/40 bg-amber-400 px-2 py-2 text-center font-bold text-amber-950">Mise en demeure</th>
                      <th colSpan={4} className="border border-orange-500/40 bg-orange-500 px-2 py-2 text-center font-bold text-white">Coupures</th>
                      <th colSpan={2} className="border border-rose-500/40 bg-rose-500 px-2 py-2 text-center font-bold text-white">Contentieux</th>
                      <th colSpan={4} className="border border-sky-500/40 bg-sky-500 px-2 py-2 text-center font-bold text-white">Compteurs</th>
                    </tr>
                    <tr>
                      {['RS Nb', 'RS Mt', 'Enc. Nb', 'Enc. Mt'].map((h) => (
                        <th key={h} className="border border-emerald-200 bg-emerald-50 px-1.5 py-1.5 text-center font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">{h}</th>
                      ))}
                      {['MeD Nb', 'MeD Mt', 'Enc. Nb', 'Enc. Mt'].map((h) => (
                        <th key={`m-${h}`} className="border border-amber-200 bg-amber-50 px-1.5 py-1.5 text-center font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{h}</th>
                      ))}
                      {['Coup. Nb', 'Coup. Mt', 'Réouv. Nb', 'Réouv. Mt'].map((h) => (
                        <th key={h} className="border border-orange-200 bg-orange-50 px-1.5 py-1.5 text-center font-semibold text-orange-900 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200">{h}</th>
                      ))}
                      {['Dos. Nb', 'Dos. Mt'].map((h) => (
                        <th key={h} className="border border-rose-200 bg-rose-50 px-1.5 py-1.5 text-center font-semibold text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">{h}</th>
                      ))}
                      {['Branch.', 'Rempl.', 'Contrôles', 'Obs.'].map((h) => (
                        <th key={h} className="border border-sky-200 bg-sky-50 px-1.5 py-1.5 text-center font-semibold text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(sortedCategories || []).map((cat, idx) => {
                      const e = entriesByCategory[cat.CategorieId] || {};
                      const filled = categoryHasData(cat.CategorieId);
                      const rowBg = idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/80 dark:bg-slate-800/40';
                      const td = `border border-slate-200 p-0.5 dark:border-slate-700 ${rowBg}`;
                      return (
                        <tr key={cat.CategorieId}>
                          <td className="border border-slate-200 bg-water-50 px-3 py-2 text-left font-semibold text-slate-700 dark:border-slate-700 dark:bg-water-950/30 dark:text-slate-200">
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 shrink-0 rounded-full ${filled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                              {getCategoryLabel(cat)}
                            </div>
                          </td>
                          <td className={td}><GridInput disabled={isFormDisabled} value={e.nbRelancesEnvoyees} onChange={(ev) => handleCellChange(cat.CategorieId, 'nbRelancesEnvoyees', ev.target.value)} /></td>
                          <td className={td}><GridInput disabled={isFormDisabled} value={e.mtRelancesEnvoyees} step="0.01" onChange={(ev) => handleCellChange(cat.CategorieId, 'mtRelancesEnvoyees', ev.target.value)} /></td>
                          <td className={td}><GridInput disabled={isFormDisabled} value={e.nbRelancesReglees} onChange={(ev) => handleCellChange(cat.CategorieId, 'nbRelancesReglees', ev.target.value)} /></td>
                          <td className={td}><GridInput disabled={isFormDisabled} value={e.mtRelancesReglees} step="0.01" onChange={(ev) => handleCellChange(cat.CategorieId, 'mtRelancesReglees', ev.target.value)} /></td>
                          <td className={td}><GridInput disabled={isFormDisabled} value={e.nbMisesEnDemeureEnvoyees} onChange={(ev) => handleCellChange(cat.CategorieId, 'nbMisesEnDemeureEnvoyees', ev.target.value)} /></td>
                          <td className={td}><GridInput disabled={isFormDisabled} value={e.mtMisesEnDemeureEnvoyees} step="0.01" onChange={(ev) => handleCellChange(cat.CategorieId, 'mtMisesEnDemeureEnvoyees', ev.target.value)} /></td>
                          <td className={td}><GridInput disabled={isFormDisabled} value={e.nbMisesEnDemeureReglees} onChange={(ev) => handleCellChange(cat.CategorieId, 'nbMisesEnDemeureReglees', ev.target.value)} /></td>
                          <td className={td}><GridInput disabled={isFormDisabled} value={e.mtMisesEnDemeureReglees} step="0.01" onChange={(ev) => handleCellChange(cat.CategorieId, 'mtMisesEnDemeureReglees', ev.target.value)} /></td>
                          <td className={td}><GridInput disabled={isFormDisabled} value={e.nbCoupures} onChange={(ev) => handleCellChange(cat.CategorieId, 'nbCoupures', ev.target.value)} /></td>
                          <td className={td}><GridInput disabled={isFormDisabled} value={e.mtCoupures} step="0.01" onChange={(ev) => handleCellChange(cat.CategorieId, 'mtCoupures', ev.target.value)} /></td>
                          <td className={td}><GridInput disabled={isFormDisabled} value={e.nbRetablissements} onChange={(ev) => handleCellChange(cat.CategorieId, 'nbRetablissements', ev.target.value)} /></td>
                          <td className={td}><GridInput disabled={isFormDisabled} value={e.mtRetablissements} step="0.01" onChange={(ev) => handleCellChange(cat.CategorieId, 'mtRetablissements', ev.target.value)} /></td>
                          <td className={td}><GridInput disabled={isFormDisabled} value={e.nbDossiersJuridiques} onChange={(ev) => handleCellChange(cat.CategorieId, 'nbDossiersJuridiques', ev.target.value)} /></td>
                          <td className={td}><GridInput disabled={isFormDisabled} value={e.mtDossiersJuridiques} step="0.01" onChange={(ev) => handleCellChange(cat.CategorieId, 'mtDossiersJuridiques', ev.target.value)} /></td>
                          <td className={td}><GridInput disabled={isFormDisabled} value={e.nbBranchements} onChange={(ev) => handleCellChange(cat.CategorieId, 'nbBranchements', ev.target.value)} /></td>
                          <td className={td}><GridInput disabled={isFormDisabled} value={e.nbCompteursRemplaces} onChange={(ev) => handleCellChange(cat.CategorieId, 'nbCompteursRemplaces', ev.target.value)} /></td>
                          <td className={td}><GridInput disabled={isFormDisabled} value={e.nbControles} onChange={(ev) => handleCellChange(cat.CategorieId, 'nbControles', ev.target.value)} /></td>
                          <td className={`${td} min-w-[90px]`}>
                            <GridInput disabled={isFormDisabled} type="text" value={e.observation} placeholder="…" maxLength={200} className="!text-left" onChange={(ev) => handleCellChange(cat.CategorieId, 'observation', ev.target.value)} />
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-800 text-white dark:bg-slate-950">
                      <td className="border border-slate-700 px-3 py-2.5 font-bold">Total</td>
                      {NUMERIC_FIELDS.map((field) => (
                        <td key={field} className="border border-slate-700 px-1 py-2.5 text-center font-bold tabular-nums">{getSum(field)}</td>
                      ))}
                      <td className="border border-slate-700" />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === 'cards' && formData.agenceId && (
              <div className="space-y-4">
                {(sortedCategories || []).map((cat) => {
                  const e = entriesByCategory[cat.CategorieId] || {};
                  const filled = categoryHasData(cat.CategorieId);
                  const sections = [
                    { title: 'Relances', color: 'emerald', fields: [['nbRelancesEnvoyees', 'RS Nb', '1'], ['mtRelancesEnvoyees', 'RS Mt', '0.01'], ['nbRelancesReglees', 'Enc. Nb', '1'], ['mtRelancesReglees', 'Enc. Mt', '0.01']] },
                    { title: 'Mise en demeure', color: 'amber', fields: [['nbMisesEnDemeureEnvoyees', 'MeD Nb', '1'], ['mtMisesEnDemeureEnvoyees', 'MeD Mt', '0.01'], ['nbMisesEnDemeureReglees', 'Enc. Nb', '1'], ['mtMisesEnDemeureReglees', 'Enc. Mt', '0.01']] },
                    { title: 'Coupures', color: 'orange', fields: [['nbCoupures', 'Coup. Nb', '1'], ['mtCoupures', 'Coup. Mt', '0.01'], ['nbRetablissements', 'Réouv. Nb', '1'], ['mtRetablissements', 'Réouv. Mt', '0.01']] },
                    { title: 'Contentieux', color: 'rose', fields: [['nbDossiersJuridiques', 'Dos. Nb', '1'], ['mtDossiersJuridiques', 'Dos. Mt', '0.01']] },
                    { title: 'Compteurs', color: 'sky', fields: [['nbBranchements', 'Branch.', '1'], ['nbCompteursRemplaces', 'Rempl.', '1'], ['nbControles', 'Contrôles', '1']] },
                  ];
                  const colorMap = {
                    emerald: 'border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300',
                    amber: 'border-amber-200 bg-amber-50/50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300',
                    orange: 'border-orange-200 bg-orange-50/50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/20 dark:text-orange-300',
                    rose: 'border-rose-200 bg-rose-50/50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-300',
                    sky: 'border-sky-200 bg-sky-50/50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/20 dark:text-sky-300',
                  };
                  return (
                    <div key={cat.CategorieId} className={`overflow-hidden rounded-2xl border transition ${filled ? 'border-water-300 shadow-sm dark:border-water-700' : 'border-slate-200 dark:border-slate-700'}`}>
                      <button
                        type="button"
                        onClick={() => setCollapsedByCategory((prev) => ({ ...prev, [cat.CategorieId]: !prev[cat.CategorieId] }))}
                        className="flex w-full items-center justify-between bg-slate-50 px-5 py-3.5 text-left transition hover:bg-water-50/60 dark:bg-slate-800 dark:hover:bg-slate-800/80"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`h-2.5 w-2.5 rounded-full ${filled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{getCategoryLabel(cat)}</h4>
                          {filled && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">OK</span>}
                        </div>
                        {collapsedByCategory[cat.CategorieId] ? <ChevronRight className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </button>
                      {!collapsedByCategory[cat.CategorieId] && (
                        <div className="space-y-4 p-5">
                          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                            {sections.map((sec) => (
                              <div key={sec.title} className={`rounded-xl border p-3 ${colorMap[sec.color]}`}>
                                <h5 className="mb-2 text-xs font-bold uppercase tracking-wide">{sec.title}</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  {sec.fields.map(([f, l, s]) => (
                                    <div key={f}>
                                      <label className="mb-1 block text-[10px] font-medium opacity-80">{l}</label>
                                      <input
                                        type="number"
                                        min="0"
                                        step={s}
                                        value={e[f] || ''}
                                        onChange={(ev) => handleCellChange(cat.CategorieId, f, ev.target.value)}
                                        disabled={isFormDisabled}
                                        className="w-full rounded-lg border border-white/60 bg-white/90 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-water-400/40 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/40 lg:col-span-2 xl:col-span-1">
                              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Observation</label>
                              <textarea
                                value={e.observation || ''}
                                onChange={(ev) => handleCellChange(cat.CategorieId, 'observation', ev.target.value)}
                                rows={4}
                                maxLength={200}
                                disabled={isFormDisabled}
                                placeholder="Notes..."
                                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-water-400/40 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900"
                              />
                              <div className="mt-1 text-right text-[10px] text-slate-400">{(e.observation || '').length}/200</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border border-water-200/80 bg-white/95 p-4 shadow-lg backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 flex-1 space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  Encaissement journalier global
                </label>
                <div className="relative max-w-sm">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.encaissementJournalierGlobal}
                    onChange={(e) => setFormData({ ...formData, encaissementJournalierGlobal: e.target.value })}
                    disabled={isFormDisabled}
                    placeholder="0,00"
                    className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/30 py-2.5 pl-3 pr-14 text-base font-semibold tabular-nums text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-slate-100"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600/80">DA</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={isFormDisabled || !formData.agenceId || !formData.dateKey || loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-water-600 to-sky-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-water-500/25 transition hover:from-water-700 hover:to-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Enregistrement…' : hasExistingData ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </form>
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