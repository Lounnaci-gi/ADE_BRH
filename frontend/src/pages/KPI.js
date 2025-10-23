import React, { useEffect, useState, useRef } from 'react';
import { Calendar, Building2, Save, Plus, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import kpiService from '../services/kpiService';
import authService from '../services/authService';
import { swalSuccess, swalError } from '../utils/swal';
import ModernDatePicker from '../components/ModernDatePicker';

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
  // Toast remplacé par SweetAlert2
  const [formData, setFormData] = useState({
    dateKey: '',
    agenceId: '',
    // Encaissement
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
          // Branchements (Nb seulement)
          nbBranchements: '',
          // Compteurs remplacés (Nb seulement)
          nbCompteursRemplaces: '',
          // Contrôles
          nbControles: '',
          // Observation par catégorie
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

  // Fonction pour charger les données existantes
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
      
      // Réinitialiser les entrées par catégorie
      const init = (sortedCategories || []).reduce((acc, cat) => {
        acc[cat.CategorieId] = {
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
          // Branchements (Nb seulement)
          nbBranchements: '',
          // Compteurs remplacés (Nb seulement)
          nbCompteursRemplaces: '',
          // Contrôles
          nbControles: '',
          // Observation par catégorie
          observation: ''
        };
        return acc;
      }, {});
      
      // Pré-remplir avec les données existantes
      existingData.forEach(item => {
        if (init[item.CategorieId]) {
          init[item.CategorieId] = {
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
            // Branchements (Nb seulement)
            nbBranchements: item.Nb_Branchements || '',
            // Compteurs remplacés (Nb seulement)
            nbCompteursRemplaces: item.Nb_Compteurs_Remplaces || '',
            // Contrôles
            nbControles: item.Nb_Controles || '',
            // Observation par catégorie
            observation: item.Observation || ''
          };
        }
      });
      
      setEntriesByCategory(init);
      
      // Renseigner l'encaissement journalier global unique si disponible (valeur du jour, non sommée)
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
        // Aucune donnée existante - vider les champs
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
    // Pré-remplir la date du jour au chargement
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
    // Réinitialiser les valeurs par catégorie
    const initEmpty = Object.keys(entriesByCategory || {}).reduce((acc, key) => {
      acc[key] = {
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
        // Branchements (Nb seulement)
        nbBranchements: '',
        // Compteurs remplacés (Nb seulement)
        nbCompteursRemplaces: '',
        // Contrôles
        nbControles: '',
        // Observation par catégorie
        observation: ''
      };
      return acc;
    }, {});
    setEntriesByCategory(initEmpty);
    
    loadData();
  }, []);

  // Charger les données existantes quand la date ou l'agence change
  useEffect(() => {
    if (formData.dateKey && formData.agenceId) {
      loadExistingData(formData.dateKey, formData.agenceId);
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

      // Pour chaque catégorie, envoyer une entrée si au moins un champ pertinent est renseigné
      const agenceIdNum = parseInt(formData.agenceId);
      let encaissementGlobalSent = false; // Flag pour s'assurer que l'encaissement global n'est envoyé qu'une fois
      
      const creates = (sortedCategories || []).map(async (cat) => {
        const catId = parseInt(cat.CategorieId);
        const e = entriesByCategory[cat.CategorieId] || {};
        // Considérer TOUTES les familles de champs supportées par le backend
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

        // Déterminer si cette catégorie doit envoyer l'encaissement global
        const shouldSendEncaissementGlobal = !encaissementGlobalSent && formData.encaissementJournalierGlobal;
        if (shouldSendEncaissementGlobal) {
          encaissementGlobalSent = true;
        }

        const payload = {
          dateKey,
          agenceId: agenceIdNum,
          categorieId: catId,
          // Champs supportés par le backend selon FAIT_KPI_ADE
          // Relances
          nbRelancesEnvoyees: parseInt(e.nbRelancesEnvoyees || 0, 10),
          mtRelancesEnvoyees: parseFloat(e.mtRelancesEnvoyees || 0),
          nbRelancesReglees: parseInt(e.nbRelancesReglees || 0, 10),
          mtRelancesReglees: parseFloat(e.mtRelancesReglees || 0),
          // Mises en demeure
          nbMisesEnDemeureEnvoyees: parseInt(e.nbMisesEnDemeureEnvoyees || 0, 10),
          mtMisesEnDemeureEnvoyees: parseFloat(e.mtMisesEnDemeureEnvoyees || 0),
          nbMisesEnDemeureReglees: parseInt(e.nbMisesEnDemeureReglees || 0, 10),
          mtMisesEnDemeureReglees: parseFloat(e.mtMisesEnDemeureReglees || 0),
          // Dossiers juridiques
          nbDossiersJuridiques: parseInt(e.nbDossiersJuridiques || 0, 10),
          mtDossiersJuridiques: parseFloat(e.mtDossiersJuridiques || 0),
          // Coupures
          nbCoupures: parseInt(e.nbCoupures || 0, 10),
          mtCoupures: parseFloat(e.mtCoupures || 0),
          // Rétablissements
          nbRetablissements: parseInt(e.nbRetablissements || 0, 10),
          mtRetablissements: parseFloat(e.mtRetablissements || 0),
          // Branchements (Nb seulement)
          nbBranchements: parseInt(e.nbBranchements || 0, 10),
          // Compteurs remplacés (Nb seulement)
          nbCompteursRemplaces: parseInt(e.nbCompteursRemplaces || 0, 10),
          // Contrôles
          nbControles: parseInt(e.nbControles || 0, 10),
          // Observation par catégorie
          observation: e.observation || '',
          // Encaissement global: envoyé seulement avec la première catégorie qui a des données
          encaissementJournalierGlobal: shouldSendEncaissementGlobal ? parseFloat(formData.encaissementJournalierGlobal || 0) : 0
        };
        return kpiService.create(payload);
      });

      // Filtrer les catégories sans données
      const requests = (await Promise.all(creates)).filter(Boolean);
      if (requests.length === 0) {
        await swalError('Aucune donnée à enregistrer. Remplissez au moins un champ.');
        return;
      }

      await Promise.all(requests);
      await swalSuccess('Données enregistrées avec succès !');
      
      // Réinitialiser le formulaire
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      
      const user = authService.getCurrentUser();
      const isAdmin = (user?.role || '').toString() === 'Administrateur';
      const userAgenceId = user?.agenceId ? Number(user.agenceId) : null;
      
      setFormData({
        dateKey: `${y}-${m}-${d}`,
        agenceId: isAdmin ? '' : (userAgenceId ? userAgenceId.toString() : ''),
        encaissementJournalierGlobal: ''
      });
      // Réinitialiser les valeurs par catégorie
      const initEmpty = Object.keys(entriesByCategory || {}).reduce((acc, key) => {
        acc[key] = {
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
          // Branchements (Nb seulement)
          nbBranchements: '',
          // Compteurs remplacés (Nb seulement)
          nbCompteursRemplaces: '',
          // Contrôles
          nbControles: '',
          // Observation par catégorie
          observation: ''
        };
        return acc;
      }, {});
      setEntriesByCategory(initEmpty);
      
      await loadData();
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 Tableau de Bord KPI</h1>
          <p className="text-gray-600">Saisie et suivi des indicateurs de performance quotidiens</p>
        </div>

        {/* Formulaire de saisie */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 rounded-t-xl border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">📝 Saisie des données</h2>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Informations de base avec style amélioré */}
              <div className="space-y-3">
                {/* Sélecteur d'agence - visible seulement pour les Administrateurs */}
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
                    // For standard users, display the assigned agency as read-only
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

                {/* Champ de date */}
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
                      {/* En-tête de catégorie */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 rounded-t-xl border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-800">{cat.Libelle}</h4>
                      </div>
                      
                      {/* Contenu organisé en sections */}
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
                      value={hasExistingData ? formData.encaissementJournalierGlobal : ''}
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
      </div>
    </div>
  );
}

export default KPI;
