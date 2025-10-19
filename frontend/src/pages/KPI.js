import React, { useEffect, useState } from 'react';
import { Calendar, Building2, Save, Plus } from 'lucide-react';
import kpiService from '../services/kpiService';
import authService from '../services/authService';
import { swalSuccess, swalError } from '../utils/swal';

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
  // Toast remplacé par SweetAlert2
  const [formData, setFormData] = useState({
    dateKey: '',
    agenceId: '',
    categorieId: '',
    // Encaissement
    encaissementJournalierGlobal: '',
    // Coupures
    nbCoupures: '',
    mtCoupures: '',
    // Rétablissements
    nbRetablissements: '',
    mtRetablissements: '',
    // Branchements
    nbBranchements: '',
    mtBranchements: '',
    // Compteurs remplacés
    nbCompteursRemplaces: '',
    mtCompteursRemplaces: '',
    // Dossiers juridiques
    nbDossiersJuridiques: '',
    mtDossiersJuridiques: '',
    // Contrôles
    nbControles: '',
    // Mises en demeure
    nbMisesEnDemeureEnvoyees: '',
    mtMisesEnDemeureEnvoyees: '',
    nbMisesEnDemeureReglees: '',
    mtMisesEnDemeureReglees: '',
    // Relances
    nbRelancesEnvoyees: '',
    mtRelancesEnvoyees: '',
    nbRelancesReglees: '',
    mtRelancesReglees: '',
    // Observation
    observation: ''
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
        // Pour les utilisateurs Standard, pré-sélectionner leur agence
        setFormData(prev => ({ ...prev, agenceId: userAgenceId.toString() }));
      }
      setKpis(kpisData || []);
      setAgences(agencesData || []);
      setCategories(categoriesData || []);
      
      // Trier les catégories dans l'ordre souhaité
      const sortedCats = sortCategories(categoriesData || []);
      setSortedCategories(sortedCats);
      // Initialiser les valeurs par catégorie selon FAIT_KPI_ADE
      const init = (categoriesData || []).reduce((acc, cat) => {
        acc[cat.CategorieId] = {
          // Coupures
          nbCoupures: '', mtCoupures: '',
          // Rétablissements
          nbRetablissements: '', mtRetablissements: '',
          // Branchements
          nbBranchements: '', mtBranchements: '',
          // Compteurs remplacés
          nbCompteursRemplaces: '', mtCompteursRemplaces: '',
          // Dossiers juridiques
          nbDossiersJuridiques: '', mtDossiersJuridiques: '',
          // Contrôles
          nbControles: '',
          // Mises en demeure
          nbMisesEnDemeureEnvoyees: '', mtMisesEnDemeureEnvoyees: '',
          nbMisesEnDemeureReglees: '', mtMisesEnDemeureReglees: '',
          // Relances
          nbRelancesEnvoyees: '', mtRelancesEnvoyees: '',
          nbRelancesReglees: '', mtRelancesReglees: ''
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

  // Fonction pour charger les données existantes
  const loadExistingData = async (dateKey, agenceId) => {
    if (!dateKey || !agenceId) return;
    
    try {
      const date = new Date(dateKey);
      const dateKeyInt = parseInt(
        date.getFullYear().toString() + 
        (date.getMonth() + 1).toString().padStart(2, '0') + 
        date.getDate().toString().padStart(2, '0')
      );
      
      const existingData = await kpiService.getExistingData(dateKeyInt, parseInt(agenceId, 10));
      
      console.log('🔍 Données existantes reçues:', existingData);
      
      // Réinitialiser les entrées par catégorie
      const init = (sortedCategories || []).reduce((acc, cat) => {
        acc[cat.CategorieId] = {
          // Encaissement
          encaissementJournalierGlobal: '',
          // Relances
          nbRelancesEnvoyees: '', mtRelancesEnvoyees: '',
          nbRelancesReglees: '', mtRelancesReglees: '',
          // Mises en demeure
          nbMisesEnDemeureEnvoyees: '', mtMisesEnDemeureEnvoyees: '',
          nbMisesEnDemeureReglees: '', mtMisesEnDemeureReglees: '',
          // Dossiers juridiques
          nbDossiersJuridiques: '', mtDossiersJuridiques: '',
          // Coupures
          nbCoupures: '', mtCoupures: '',
          // Rétablissements
          nbRetablissements: '', mtRetablissements: '',
          // Branchements
          nbBranchements: '', mtBranchements: '',
          // Compteurs remplacés
          nbCompteursRemplaces: '', mtCompteursRemplaces: '',
          // Contrôles
          nbControles: '',
          // Observation
          observation: ''
        };
        return acc;
      }, {});
      
      // Pré-remplir avec les données existantes
      existingData.forEach(item => {
        console.log(`📊 Traitement des données pour catégorie ${item.CategorieId}:`, item);
        if (init[item.CategorieId]) {
          init[item.CategorieId] = {
            // Encaissement
            encaissementJournalierGlobal: item.Encaissement_Journalier_Global || '',
            // Relances
            nbRelancesEnvoyees: item.Nb_RelancesEnvoyees || '',
            mtRelancesEnvoyees: item.Mt_RelancesEnvoyees || '',
            nbRelancesReglees: item.Nb_RelancesReglees || '',
            mtRelancesReglees: item.Mt_RelancesReglees || '',
            // Mises en demeure
            nbMisesEnDemeureEnvoyees: item.Nb_MisesEnDemeure_Envoyees || '',
            mtMisesEnDemeureEnvoyees: item.Mt_MisesEnDemeure_Envoyees || '',
            nbMisesEnDemeureReglees: item.Nb_MisesEnDemeure_Reglees || '',
            mtMisesEnDemeureReglees: item.Mt_MisesEnDemeure_Reglees || '',
            // Dossiers juridiques
            nbDossiersJuridiques: item.Nb_Dossiers_Juridiques || '',
            mtDossiersJuridiques: item.Mt_Dossiers_Juridiques || '',
            // Coupures
            nbCoupures: item.Nb_Coupures || '',
            mtCoupures: item.Mt_Coupures || '',
            // Rétablissements
            nbRetablissements: item.Nb_Retablissements || '',
            mtRetablissements: item.Mt_Retablissements || '',
            // Branchements
            nbBranchements: item.Nb_Branchements || '',
            mtBranchements: item.Mt_Branchements || '',
            // Compteurs remplacés
            nbCompteursRemplaces: item.Nb_Compteurs_Remplaces || '',
            mtCompteursRemplaces: item.Mt_Compteurs_Remplaces || '',
            // Contrôles
            nbControles: item.Nb_Controles || '',
            // Observation
            observation: item.Observation || ''
          };
        }
      });
      
      console.log('📝 Données mappées pour le formulaire:', init);
      setEntriesByCategory(init);
      
      // Charger l'observation si elle existe
      if (existingData.length > 0 && existingData[0].Observation) {
        setFormData(prev => ({ ...prev, observation: existingData[0].Observation }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données existantes:', error);
    }
  };

  useEffect(() => {
    // Pré-remplir la date du jour au chargement
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setFormData(prev => ({ ...prev, dateKey: `${yyyy}-${mm}-${dd}` }));
    loadData();
  }, []); // Remove loadData from dependencies to prevent infinite loop

  // Fonction pour charger les objectifs
  const loadObjectives = async (agenceId, date) => {
    if (!agenceId || !date) return;
    
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const objectivesData = await kpiService.getObjectives(agenceId, year, month);
      setObjectives(objectivesData);
    } catch (error) {
      console.error('Erreur lors du chargement des objectifs:', error);
      setObjectives(null);
    }
  };

  // Fonction pour charger tous les objectifs de l'agence
  const loadAllObjectives = async (agenceId) => {
    if (!agenceId) return;
    
    try {
      const allObjectivesData = await kpiService.getAllObjectives(agenceId);
      setAllObjectives(allObjectivesData);
    } catch (error) {
      console.error('Erreur lors du chargement de tous les objectifs:', error);
      setAllObjectives([]);
    }
  };

  // Fonction pour charger le résumé des données
  const loadSummary = async (agenceId, dateKey) => {
    if (!agenceId || !dateKey) return;
    
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

  // Charger les données existantes quand la date ou l'agence change
  useEffect(() => {
    if (formData.dateKey && formData.agenceId && sortedCategories && sortedCategories.length > 0) {
      console.log('🔄 Chargement des données existantes pour:', { dateKey: formData.dateKey, agenceId: formData.agenceId, categoriesCount: sortedCategories.length });
      loadExistingData(formData.dateKey, formData.agenceId);
      loadObjectives(formData.agenceId, new Date(formData.dateKey));
      loadSummary(formData.agenceId, formData.dateKey);
    }
  }, [formData.dateKey, formData.agenceId, sortedCategories]);

  // Charger tous les objectifs quand l'agence change
  useEffect(() => {
    if (formData.agenceId) {
      loadAllObjectives(formData.agenceId);
    }
  }, [formData.agenceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.dateKey || !formData.agenceId) {
      await swalError('Date et Agence sont requis', 'Validation');
      return;
    }

    try {
      // Convertir la date en DateKey (format YYYYMMDD)
      const date = new Date(formData.dateKey);
      const dateKey = parseInt(
        date.getFullYear().toString() + 
        (date.getMonth() + 1).toString().padStart(2, '0') + 
        date.getDate().toString().padStart(2, '0')
      );

      // Pour chaque catégorie, envoyer une entrée si au moins un champ pertinent est renseigné
      const agenceIdNum = parseInt(formData.agenceId);
      const creates = (sortedCategories || []).map(async (cat) => {
        const catId = parseInt(cat.CategorieId);
        const e = entriesByCategory[cat.CategorieId] || {};
        const hasData = [
          e.nbRelancesEnvoyees, e.mtRelancesEnvoyees,
          e.nbRelancesReglees, e.mtRelancesReglees,
          e.nbMisesEnDemeureEnvoyees, e.mtMisesEnDemeureEnvoyees,
          e.nbMisesEnDemeureReglees, e.mtMisesEnDemeureReglees,
          e.nbDossiersJuridiques, e.mtDossiersJuridiques
        ].some((v) => v !== '' && v != null);
        if (!hasData) return null;
        const payload = {
          dateKey,
          agenceId: agenceIdNum,
          categorieId: catId,
          // Champs supportés par le backend
          nbRelancesEnvoyees: parseInt(e.nbRelancesEnvoyees || 0, 10),
          mtRelancesEnvoyees: parseFloat(e.mtRelancesEnvoyees || 0),
          nbRelancesReglees: parseInt(e.nbRelancesReglees || 0, 10),
          mtRelancesReglees: parseFloat(e.mtRelancesReglees || 0),
          nbMisesEnDemeureEnvoyees: parseInt(e.nbMisesEnDemeureEnvoyees || 0, 10),
          mtMisesEnDemeureEnvoyees: parseFloat(e.mtMisesEnDemeureEnvoyees || 0),
          nbMisesEnDemeureReglees: parseInt(e.nbMisesEnDemeureReglees || 0, 10),
          mtMisesEnDemeureReglees: parseFloat(e.mtMisesEnDemeureReglees || 0),
          nbDossiersJuridiques: parseInt(e.nbDossiersJuridiques || 0, 10),
          mtDossiersJuridiques: parseFloat(e.mtDossiersJuridiques || 0)
        };
        return kpiService.create(payload);
      });

      await Promise.all(creates);
      await swalSuccess('Données sauvegardées avec succès');
      
      // Réinitialiser le formulaire (date du jour conservée, agence préservée pour Standard)
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      
      const user = authService.getCurrentUser();
      const isAdmin = (user?.role || '').toString() === 'Administrateur';
      const userAgenceId = user?.agenceId ? Number(user.agenceId) : null;
      
      setFormData({
        dateKey: `${y}-${m}-${d}`,
        agenceId: isAdmin ? '' : (userAgenceId ? userAgenceId.toString() : ''),
        encaissementJournalierGlobal: '',
        nbCoupures: '',
        mtCoupures: '',
        nbDossiersJuridiques: '',
        mtDossiersJuridiques: '',
        nbMisesEnDemeureEnvoyees: '',
        mtMisesEnDemeureEnvoyees: '',
        nbRelancesEnvoyees: '',
        mtRelancesEnvoyees: '',
        nbRelancesReglees: '',
        mtRelancesReglees: '',
        nbMisesEnDemeureReglees: '',
        mtMisesEnDemeureReglees: '',
        nbRetablissements: '',
        mtRetablissements: '',
        nbPoseCompteurs: '',
        nbRemplacementCompteurs: ''
      });
      // Réinitialiser les valeurs par catégorie
      const initEmpty = Object.keys(entriesByCategory || {}).reduce((acc, key) => {
        acc[key] = {
          nbRelancesEnvoyees: '', mtRelancesEnvoyees: '',
          nbRelancesReglees: '', mtRelancesReglees: '',
          nbMisesEnDemeureEnvoyees: '', mtMisesEnDemeureEnvoyees: '',
          nbMisesEnDemeureReglees: '', mtMisesEnDemeureReglees: '',
          nbDossiersJuridiques: '', mtDossiersJuridiques: '',
          nbPoseCompteurs: '', nbRemplacementCompteurs: ''
        };
        return acc;
      }, {});
      setEntriesByCategory(initEmpty);
      
      await loadData();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Une erreur est survenue';
      await swalError(msg);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD'
    }).format(value);
  };


  // Fonction pour calculer le taux de réalisation
  const calculateCompletionRate = (actual, objective) => {
    if (!objective || objective === 0) return null;
    const rate = (actual / objective) * 100;
    return Math.round(rate * 100) / 100; // Arrondir à 2 décimales
  };

  // Fonction pour obtenir la couleur du taux de réalisation
  const getCompletionRateColor = (rate) => {
    if (rate === null) return 'text-gray-500';
    if (rate >= 100) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    if (rate >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };


  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📊 Saisie des Données Quotidiennes</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Objectifs de l'agence */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-sky-50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-sky-800">Objectifs de l'agence</h3>
            {allObjectives.length > 0 && (
              <span className="text-sm text-sky-600 bg-sky-100 px-3 py-1 rounded-full">
                {allObjectives.length} objectif{allObjectives.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {allObjectives.length > 0 ? (
            <div className="space-y-4">
              {allObjectives.map((objective, index) => (
                <div key={objective.ObjectifId || index} className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800">{objective.Titre || `Objectif ${index + 1}`}</h4>
                      {objective.Description && (
                        <p className="text-sm text-gray-600 mt-1">{objective.Description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Période</div>
                      <div className="text-sm font-medium text-gray-700">
                        {formatDate(objective.DateDebut)} - {formatDate(objective.DateFin)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                      <div className="text-xs text-emerald-600 font-medium mb-1">Encaissement</div>
                      <div className="text-lg font-bold text-emerald-800">
                        {objective.Obj_Encaissement ? `${objective.Obj_Encaissement.toLocaleString('fr-FR')} DA` : '0 DA'}
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="text-xs text-blue-600 font-medium mb-1">Relances</div>
                      <div className="text-lg font-bold text-blue-800">{objective.Obj_Relances || 0}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="text-xs text-green-600 font-medium mb-1">Mises en demeure</div>
                      <div className="text-lg font-bold text-green-800">{objective.Obj_MisesEnDemeure || 0}</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <div className="text-xs text-purple-600 font-medium mb-1">Dossiers juridiques</div>
                      <div className="text-lg font-bold text-purple-800">{objective.Obj_Dossiers_Juridiques || 0}</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <div className="text-xs text-orange-600 font-medium mb-1">Coupures</div>
                      <div className="text-lg font-bold text-orange-800">{objective.Obj_Coupures || 0}</div>
                    </div>
                    <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
                      <div className="text-xs text-cyan-600 font-medium mb-1">Contrôles</div>
                      <div className="text-lg font-bold text-cyan-800">{objective.Obj_Controles || 0}</div>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                      <div className="text-xs text-pink-600 font-medium mb-1">Compteurs remplacés</div>
                      <div className="text-lg font-bold text-pink-800">{objective.Obj_Compteurs_Remplaces || 0}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sky-600">
              <div className="text-sm">Aucun objectif défini pour cette agence</div>
              <div className="text-xs text-gray-500 mt-1">Les objectifs sont définis dans la section Objectifs</div>
            </div>
          )}
        </div>

        {/* Formulaire élargi avec style élégant */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 rounded-3xl shadow-xl p-8 border border-blue-100/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Saisie des données</h2>
              <p className="text-sm text-gray-600">Enregistrez les indicateurs quotidiens par catégorie</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Informations de base avec style amélioré */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.dateKey}
                  onChange={(e) => setFormData({ ...formData, dateKey: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                  required
                />
              </div>

              {/* Sélecteur d'agence - visible seulement pour les Administrateurs */}
              {(() => {
                const user = authService.getCurrentUser();
                const isAdmin = (user?.role || '').toString() === 'Administrateur';
                
                if (isAdmin) {
                  return (
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg mr-3">
                          <Building2 className="h-4 w-4 text-green-600" />
                        </div>
                        Agence *
                      </label>
                      <select
                        value={formData.agenceId}
                        onChange={(e) => setFormData({ ...formData, agenceId: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
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
                  // Pour les utilisateurs Standard, afficher l'agence en lecture seule
                  const userAgence = agences.find(a => Number(a.AgenceId) === Number(formData.agenceId));
                  return (
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg mr-3">
                          <Building2 className="h-4 w-4 text-green-600" />
                        </div>
                        Agence assignée
                      </label>
                      <div className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 shadow-sm">
                        {userAgence ? userAgence.Nom_Agence : 'Chargement...'}
                      </div>
                    </div>
                  );
                }
              })()}

            </div>

            {/* Saisie par catégorie avec style élégant */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Saisie par catégorie</h3>
              </div>
              <div className="overflow-auto rounded-2xl border-2 border-gray-200 shadow-lg bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-4 py-4 text-left font-bold text-gray-800 border-r border-gray-200">Catégorie</th>
                      {/* Coupures */}
                      <th className="px-3 py-4 text-center font-semibold text-red-700">Coupures (Nb)</th>
                      <th className="px-3 py-4 text-center font-semibold text-red-700">Coupures (Mt)</th>
                      {/* Rétablissements */}
                      <th className="px-3 py-4 text-center font-semibold text-green-700">Rétablissements (Nb)</th>
                      <th className="px-3 py-4 text-center font-semibold text-green-700">Rétablissements (Mt)</th>
                      {/* Branchements */}
                      <th className="px-3 py-4 text-center font-semibold text-blue-700">Branchements (Nb)</th>
                      <th className="px-3 py-4 text-center font-semibold text-blue-700">Branchements (Mt)</th>
                      {/* Compteurs remplacés */}
                      <th className="px-3 py-4 text-center font-semibold text-purple-700">Compteurs Remplacés (Nb)</th>
                      <th className="px-3 py-4 text-center font-semibold text-purple-700">Compteurs Remplacés (Mt)</th>
                      {/* Dossiers juridiques */}
                      <th className="px-3 py-4 text-center font-semibold text-orange-700">Dossiers Juridiques (Nb)</th>
                      <th className="px-3 py-4 text-center font-semibold text-orange-700">Dossiers Juridiques (Mt)</th>
                      {/* Contrôles */}
                      <th className="px-3 py-4 text-center font-semibold text-indigo-700">Contrôles (Nb)</th>
                      {/* Mises en demeure */}
                      <th className="px-3 py-4 text-center font-semibold text-yellow-700">Mises en Demeure Envoyées (Nb)</th>
                      <th className="px-3 py-4 text-center font-semibold text-yellow-700">Mises en Demeure Envoyées (Mt)</th>
                      <th className="px-3 py-4 text-center font-semibold text-yellow-600">Mises en Demeure Réglées (Nb)</th>
                      <th className="px-3 py-4 text-center font-semibold text-yellow-600">Mises en Demeure Réglées (Mt)</th>
                      {/* Relances */}
                      <th className="px-3 py-4 text-center font-semibold text-cyan-700">Relances Envoyées (Nb)</th>
                      <th className="px-3 py-4 text-center font-semibold text-cyan-700">Relances Envoyées (Mt)</th>
                      <th className="px-3 py-4 text-center font-semibold text-cyan-600">Relances Réglées (Nb)</th>
                      <th className="px-3 py-4 text-center font-semibold text-cyan-600">Relances Réglées (Mt)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sortedCategories || []).map((cat, index) => {
                      const e = entriesByCategory[cat.CategorieId] || {};
                      return (
                        <tr key={cat.CategorieId} className={`border-t border-gray-100 hover:bg-gray-50/50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-800 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                            {cat.Libelle}
                          </td>
                          {/* Coupures */}
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="1"
                              value={e.nbCoupures || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbCoupures: ev.target.value } }))} 
                              className="w-20 border-2 border-red-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              value={e.mtCoupures || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtCoupures: ev.target.value } }))} 
                              className="w-20 border-2 border-red-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          {/* Rétablissements */}
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="1"
                              value={e.nbRetablissements || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbRetablissements: ev.target.value } }))} 
                              className="w-20 border-2 border-green-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              value={e.mtRetablissements || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtRetablissements: ev.target.value } }))} 
                              className="w-20 border-2 border-green-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          {/* Branchements */}
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="1"
                              value={e.nbBranchements || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbBranchements: ev.target.value } }))} 
                              className="w-20 border-2 border-blue-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              value={e.mtBranchements || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtBranchements: ev.target.value } }))} 
                              className="w-20 border-2 border-blue-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          {/* Compteurs remplacés */}
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="1"
                              value={e.nbCompteursRemplaces || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbCompteursRemplaces: ev.target.value } }))} 
                              className="w-20 border-2 border-purple-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              value={e.mtCompteursRemplaces || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtCompteursRemplaces: ev.target.value } }))} 
                              className="w-20 border-2 border-purple-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          {/* Dossiers juridiques */}
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="1"
                              value={e.nbDossiersJuridiques || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbDossiersJuridiques: ev.target.value } }))} 
                              className="w-20 border-2 border-orange-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              value={e.mtDossiersJuridiques || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtDossiersJuridiques: ev.target.value } }))} 
                              className="w-20 border-2 border-orange-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          {/* Contrôles */}
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="1"
                              value={e.nbControles || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbControles: ev.target.value } }))} 
                              className="w-20 border-2 border-indigo-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          {/* Mises en demeure envoyées */}
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="1"
                              value={e.nbMisesEnDemeureEnvoyees || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbMisesEnDemeureEnvoyees: ev.target.value } }))} 
                              className="w-20 border-2 border-yellow-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              value={e.mtMisesEnDemeureEnvoyees || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtMisesEnDemeureEnvoyees: ev.target.value } }))} 
                              className="w-20 border-2 border-yellow-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          {/* Mises en demeure réglées */}
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="1"
                              value={e.nbMisesEnDemeureReglees || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbMisesEnDemeureReglees: ev.target.value } }))} 
                              className="w-20 border-2 border-yellow-300 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              value={e.mtMisesEnDemeureReglees || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtMisesEnDemeureReglees: ev.target.value } }))} 
                              className="w-20 border-2 border-yellow-300 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          {/* Relances envoyées */}
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="1"
                              value={e.nbRelancesEnvoyees || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbRelancesEnvoyees: ev.target.value } }))} 
                              className="w-20 border-2 border-cyan-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              value={e.mtRelancesEnvoyees || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtRelancesEnvoyees: ev.target.value } }))} 
                              className="w-20 border-2 border-cyan-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          {/* Relances réglées */}
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="1"
                              value={e.nbRelancesReglees || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbRelancesReglees: ev.target.value } }))} 
                              className="w-20 border-2 border-cyan-300 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              value={e.mtRelancesReglees || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtRelancesReglees: ev.target.value } }))} 
                              className="w-20 border-2 border-cyan-300 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Champ Observation */}
            <div className="border-t border-gray-200 pt-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <div className="p-2 bg-gray-100 rounded-lg mr-3">
                    <Calendar className="h-4 w-4 text-gray-600" />
                  </div>
                  Observation (optionnel)
                </label>
                <textarea
                  value={formData.observation}
                  onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md resize-none"
                  rows="3"
                  placeholder="Ajoutez une observation sur les données saisies..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500">
                  {(formData.observation || '').length}/500 caractères
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2 font-medium text-sm transform hover:scale-105"
              >
                <Save className="h-4 w-4" />
                Sauvegarder
              </button>
            </div>
          </form>
        </div>

        {/* Données du jour */}
        <div className="bg-white rounded-2xl shadow p-6 border border-blue-50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Données du {formData.dateKey ? new Date(formData.dateKey).toLocaleDateString('fr-FR') : 'jour'}
          </h2>
          {loading ? (
            <div className="text-center py-6">Chargement...</div>
          ) : (
            <div className="space-y-3">
              {(() => {
                // Filtrer les KPIs selon la date sélectionnée
                const selectedDate = formData.dateKey ? new Date(formData.dateKey) : new Date();
                const dateKeyFilter = parseInt(
                  selectedDate.getFullYear().toString() + 
                  (selectedDate.getMonth() + 1).toString().padStart(2, '0') + 
                  selectedDate.getDate().toString().padStart(2, '0')
                );
                
                const filteredKpis = (kpis || []).filter(k => k.DateKey === dateKeyFilter);
                
                if (filteredKpis.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Aucune donnée saisie pour cette date.</p>
                    </div>
                  );
                }
                
                return filteredKpis.map((kpi, index) => (
                  <div key={index} className="rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-800">{kpi.Nom_Agence}</div>
                      <div className="text-sm text-gray-500 bg-blue-100 px-2 py-1 rounded-full">
                        {kpi.CategorieLibelle || 'KPI'}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div className="bg-blue-50 p-2 rounded">
                        <span className="text-blue-600 font-medium">Relances:</span>
                        <span className="ml-1">{kpi.Nb_RelancesEnvoyees || 0}</span>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <span className="text-green-600 font-medium">Mises en demeure:</span>
                        <span className="ml-1">{kpi.Nb_MisesEnDemeure_Envoyees || 0}</span>
                      </div>
                      <div className="bg-purple-50 p-2 rounded">
                        <span className="text-purple-600 font-medium">Dossiers juridiques:</span>
                        <span className="ml-1">{kpi.Nb_Dossiers_Juridiques || 0}</span>
                      </div>
                      <div className="bg-orange-50 p-2 rounded">
                        <span className="text-orange-600 font-medium">Coupures:</span>
                        <span className="ml-1">{kpi.Nb_Coupures || 0}</span>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* Résumé des données de l'agence */}
        {formData.agenceId && formData.dateKey && (
          <div className="bg-white rounded-2xl shadow p-6 border border-blue-50">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Résumé des données - {agences.find(a => Number(a.AgenceId) === Number(formData.agenceId))?.Nom_Agence || 'Agence'}
            </h2>
            
            {summary && summary.daily ? (
              <div className="space-y-6">
                {/* Données du jour */}
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Données du {new Date(formData.dateKey).toLocaleDateString('fr-FR')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Relances */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="text-sm text-blue-600 font-medium mb-2 flex items-center justify-between">
                        <span>Relances</span>
                        {summary.objectives && (
                          <span className={`text-xs font-bold ${getCompletionRateColor(calculateCompletionRate(summary.daily.Total_RelancesEnvoyees, summary.objectives.Obj_Relances_Envoyees))}`}>
                            {calculateCompletionRate(summary.daily.Total_RelancesEnvoyees, summary.objectives.Obj_Relances_Envoyees) !== null 
                              ? `${calculateCompletionRate(summary.daily.Total_RelancesEnvoyees, summary.objectives.Obj_Relances_Envoyees)}%`
                              : 'N/A'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Envoyées:</span>
                          <span className="font-semibold">{summary.daily.Total_RelancesEnvoyees || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Réglées:</span>
                          <span className="font-semibold">{summary.daily.Total_RelancesReglees || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Montant envoyé:</span>
                          <span>{formatCurrency(summary.daily.Total_Mt_RelancesEnvoyees || 0)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Montant réglé:</span>
                          <span>{formatCurrency(summary.daily.Total_Mt_RelancesReglees || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Mises en demeure */}
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="text-sm text-green-600 font-medium mb-2 flex items-center justify-between">
                        <span>Mises en demeure</span>
                        {summary.objectives && (
                          <span className={`text-xs font-bold ${getCompletionRateColor(calculateCompletionRate(summary.daily.Total_MisesEnDemeureEnvoyees, summary.objectives.Obj_MisesEnDemeure_Envoyees))}`}>
                            {calculateCompletionRate(summary.daily.Total_MisesEnDemeureEnvoyees, summary.objectives.Obj_MisesEnDemeure_Envoyees) !== null 
                              ? `${calculateCompletionRate(summary.daily.Total_MisesEnDemeureEnvoyees, summary.objectives.Obj_MisesEnDemeure_Envoyees)}%`
                              : 'N/A'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Envoyées:</span>
                          <span className="font-semibold">{summary.daily.Total_MisesEnDemeureEnvoyees || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Réglées:</span>
                          <span className="font-semibold">{summary.daily.Total_MisesEnDemeureReglees || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Montant envoyé:</span>
                          <span>{formatCurrency(summary.daily.Total_Mt_MisesEnDemeureEnvoyees || 0)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Montant réglé:</span>
                          <span>{formatCurrency(summary.daily.Total_Mt_MisesEnDemeureReglees || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dossiers juridiques */}
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="text-sm text-purple-600 font-medium mb-2 flex items-center justify-between">
                        <span>Dossiers juridiques</span>
                        {summary.objectives && (
                          <span className={`text-xs font-bold ${getCompletionRateColor(calculateCompletionRate(summary.daily.Total_DossiersJuridiques, summary.objectives.Obj_Dossiers_Juridiques))}`}>
                            {calculateCompletionRate(summary.daily.Total_DossiersJuridiques, summary.objectives.Obj_Dossiers_Juridiques) !== null 
                              ? `${calculateCompletionRate(summary.daily.Total_DossiersJuridiques, summary.objectives.Obj_Dossiers_Juridiques)}%`
                              : 'N/A'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Nombre:</span>
                          <span className="font-semibold">{summary.daily.Total_DossiersJuridiques || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Montant:</span>
                          <span>{formatCurrency(summary.daily.Total_Mt_DossiersJuridiques || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Coupures */}
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <div className="text-sm text-orange-600 font-medium mb-2 flex items-center justify-between">
                        <span>Coupures</span>
                        {summary.objectives && (
                          <span className={`text-xs font-bold ${getCompletionRateColor(calculateCompletionRate(summary.daily.Total_Coupures, summary.objectives.Obj_Coupures))}`}>
                            {calculateCompletionRate(summary.daily.Total_Coupures, summary.objectives.Obj_Coupures) !== null 
                              ? `${calculateCompletionRate(summary.daily.Total_Coupures, summary.objectives.Obj_Coupures)}%`
                              : 'N/A'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Nombre:</span>
                          <span className="font-semibold">{summary.daily.Total_Coupures || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Montant:</span>
                          <span>{formatCurrency(summary.daily.Total_Mt_Coupures || 0)}</span>
                        </div>
                      </div>
                    </div>


                    {/* Encaissement global */}
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                      <div className="text-sm text-emerald-600 font-medium mb-2">Encaissement</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Journalier global:</span>
                          <span className="font-semibold text-emerald-700">{formatCurrency(summary.daily.Total_EncaissementGlobal || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Objectifs mensuels */}
                {summary.objectives && (
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      Objectifs mensuels ({new Date(formData.dateKey).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-100 rounded-lg p-3 border border-blue-300">
                        <div className="text-sm text-blue-700 font-medium">Relances</div>
                        <div className="text-lg font-bold text-blue-800">{summary.objectives.Obj_Relances_Envoyees || 0}</div>
                      </div>
                      <div className="bg-green-100 rounded-lg p-3 border border-green-300">
                        <div className="text-sm text-green-700 font-medium">Mises en demeure</div>
                        <div className="text-lg font-bold text-green-800">{summary.objectives.Obj_MisesEnDemeure_Envoyees || 0}</div>
                      </div>
                      <div className="bg-purple-100 rounded-lg p-3 border border-purple-300">
                        <div className="text-sm text-purple-700 font-medium">Dossiers juridiques</div>
                        <div className="text-lg font-bold text-purple-800">{summary.objectives.Obj_Dossiers_Juridiques || 0}</div>
                      </div>
                      <div className="bg-orange-100 rounded-lg p-3 border border-orange-300">
                        <div className="text-sm text-orange-700 font-medium">Coupures</div>
                        <div className="text-lg font-bold text-orange-800">{summary.objectives.Obj_Coupures || 0}</div>
                      </div>
                  </div>
                </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Aucune donnée enregistrée pour cette agence à cette date.</p>
              </div>
              )}
            </div>
          )}
      </div>

      {/* Notifications gérées via SweetAlert2 */}
    </div>
  );
}

export default KPI;
