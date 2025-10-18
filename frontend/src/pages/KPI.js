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
      const [loading, setLoading] = useState(false);
  // Toast remplacé par SweetAlert2
  const [formData, setFormData] = useState({
    dateKey: '',
    agenceId: '',
    categorieId: '',
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
    // Nouveaux champs (frontend uniquement pour l'instant)
    nbMisesEnDemeureReglees: '',
    mtMisesEnDemeureReglees: '',
    nbRetablissements: '',
    mtRetablissements: '',
    nbPoseCompteurs: '',
    nbRemplacementCompteurs: ''
  });

  // Fonction pour trier les catégories dans l'ordre souhaité
  const sortCategories = (categories) => {
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
      setKpis(kpisData);
      setAgences(agencesData);
      setCategories(categoriesData);
      
      // Trier les catégories dans l'ordre souhaité
      const sortedCats = sortCategories(categoriesData || []);
      setSortedCategories(sortedCats);
      // Initialiser les valeurs par catégorie
      const init = (categoriesData || []).reduce((acc, cat) => {
        acc[cat.CategorieId] = {
          nbRelancesEnvoyees: '', mtRelancesEnvoyees: '',
          nbRelancesReglees: '', mtRelancesReglees: '',
          nbMisesEnDemeureEnvoyees: '', mtMisesEnDemeureEnvoyees: '',
          nbMisesEnDemeureReglees: '', mtMisesEnDemeureReglees: '',
          nbDossiersJuridiques: '', mtDossiersJuridiques: '',
          nbPoseCompteurs: '', nbRemplacementCompteurs: ''
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
      
      // Réinitialiser les entrées par catégorie
      const init = (sortedCategories || []).reduce((acc, cat) => {
        acc[cat.CategorieId] = {
          nbRelancesEnvoyees: '', mtRelancesEnvoyees: '',
          nbRelancesReglees: '', mtRelancesReglees: '',
          nbMisesEnDemeureEnvoyees: '', mtMisesEnDemeureEnvoyees: '',
          nbMisesEnDemeureReglees: '', mtMisesEnDemeureReglees: '',
          nbDossiersJuridiques: '', mtDossiersJuridiques: '',
          nbPoseCompteurs: '', nbRemplacementCompteurs: ''
        };
        return acc;
      }, {});
      
      // Pré-remplir avec les données existantes
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
            nbPoseCompteurs: '', // Pas encore dans la DB
            nbRemplacementCompteurs: '' // Pas encore dans la DB
          };
        }
      });
      
      setEntriesByCategory(init);
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
  }, []);

  // Charger les données existantes quand la date ou l'agence change
  useEffect(() => {
    if (formData.dateKey && formData.agenceId && categories.length > 0) {
      loadExistingData(formData.dateKey, formData.agenceId);
    }
  }, [formData.dateKey, formData.agenceId, categories]);

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

  const formatDate = (dateKey) => {
    if (!dateKey) return '';
    const dateStr = dateKey.toString();
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📊 Saisie des Données Quotidiennes</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Bandeau (placeholder objectifs - à alimenter avec la BDD si dispo) */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-sky-50 p-4 shadow-sm">
          <div className="text-sm text-sky-700">Objectifs mensuels</div>
          <div className="text-xs text-sky-600">Affichage des objectifs et progression (à connecter aux données)</div>
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
                      <th className="px-3 py-4 text-center font-semibold text-blue-700">Nbr Relances Envoyées</th>
                      <th className="px-3 py-4 text-center font-semibold text-blue-700">Mt Relances Envoyées</th>
                      <th className="px-3 py-4 text-center font-semibold text-green-700">Relances réglées (Nb)</th>
                      <th className="px-3 py-4 text-center font-semibold text-green-700">Relances réglées (Mt)</th>
                      <th className="px-3 py-4 text-center font-semibold text-orange-700">Mises en demeure (Nb)</th>
                      <th className="px-3 py-4 text-center font-semibold text-orange-700">Mises en demeure (Mt)</th>
                      <th className="px-3 py-4 text-center font-semibold text-red-700">Mises en demeure réglées (Nb)</th>
                      <th className="px-3 py-4 text-center font-semibold text-red-700">Mises en demeure réglées (Mt)</th>
                      <th className="px-3 py-4 text-center font-semibold text-purple-700">Dossiers juridiques (Nb)</th>
                      <th className="px-3 py-4 text-center font-semibold text-purple-700">Dossiers juridiques (Mt)</th>
                      <th className="px-3 py-4 text-center font-semibold text-indigo-700">Branchement (Nb)</th>
                      <th className="px-3 py-4 text-center font-semibold text-indigo-700">Rempl. compteurs (Nb)</th>
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
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="1"
                              value={e.nbRelancesEnvoyees || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbRelancesEnvoyees: ev.target.value } }))} 
                              className="w-24 border-2 border-blue-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              value={e.mtRelancesEnvoyees || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtRelancesEnvoyees: ev.target.value } }))} 
                              className="w-24 border-2 border-blue-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="1"
                              value={e.nbRelancesReglees || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbRelancesReglees: ev.target.value } }))} 
                              className="w-24 border-2 border-green-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              value={e.mtRelancesReglees || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtRelancesReglees: ev.target.value } }))} 
                              className="w-24 border-2 border-green-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="1"
                              value={e.nbMisesEnDemeureEnvoyees || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbMisesEnDemeureEnvoyees: ev.target.value } }))} 
                              className="w-24 border-2 border-orange-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              value={e.mtMisesEnDemeureEnvoyees || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtMisesEnDemeureEnvoyees: ev.target.value } }))} 
                              className="w-24 border-2 border-orange-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="1"
                              value={e.nbMisesEnDemeureReglees || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbMisesEnDemeureReglees: ev.target.value } }))} 
                              className="w-24 border-2 border-red-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              value={e.mtMisesEnDemeureReglees || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtMisesEnDemeureReglees: ev.target.value } }))} 
                              className="w-24 border-2 border-red-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="1"
                              value={e.nbDossiersJuridiques || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbDossiersJuridiques: ev.target.value } }))} 
                              className="w-24 border-2 border-purple-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              value={e.mtDossiersJuridiques || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtDossiersJuridiques: ev.target.value } }))} 
                              className="w-24 border-2 border-purple-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="1"
                              value={e.nbPoseCompteurs || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbPoseCompteurs: ev.target.value } }))} 
                              className="w-24 border-2 border-indigo-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              step="1"
                              value={e.nbRemplacementCompteurs || ''} 
                              onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbRemplacementCompteurs: ev.target.value } }))} 
                              className="w-24 border-2 border-indigo-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md" 
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-8">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-3 font-semibold text-lg transform hover:scale-105"
              >
                <div className="p-1 bg-white/20 rounded-lg">
                  <Save className="h-5 w-5" />
                </div>
                Sauvegarder les données
              </button>
            </div>
          </form>
        </div>

        {/* Données du jour */}
        <div className="bg-white rounded-2xl shadow p-6 border border-blue-50">
          <h2 className="text-lg font-semibold mb-4">Données du jour</h2>
          {loading ? (
            <div className="text-center py-6">Chargement...</div>
          ) : (
            <div className="grid gap-3">
              {kpis.filter(k => String(k.DateKey || '').slice(0,8) === (
                String(new Date().getFullYear()) + String(new Date().getMonth()+1).padStart(2,'0') + String(new Date().getDate()).padStart(2,'0')
              )).map((kpi, index) => (
                <div key={index} className="rounded-xl border border-gray-100 p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-800">{kpi.Nom_Agence} · {kpi.CategorieLibelle || 'KPI'}</div>
                    <div className="text-sm text-gray-500">{formatDate(kpi.DateKey)}</div>
                  </div>
                </div>
              ))}
              {kpis.length === 0 && (
                <div className="text-center py-6 text-gray-500">Aucune donnée saisie aujourd'hui.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notifications gérées via SweetAlert2 */}
    </div>
  );
}

export default KPI;
