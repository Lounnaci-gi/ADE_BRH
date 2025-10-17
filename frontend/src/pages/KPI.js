import React, { useEffect, useState } from 'react';
import { Calendar, Building2, Save, Plus } from 'lucide-react';
import kpiService from '../services/kpiService';
import authService from '../services/authService';
import { swalSuccess, swalError } from '../utils/swal';

function KPI() {
  const [kpis, setKpis] = useState([]);
  const [agences, setAgences] = useState([]);
  const [categories, setCategories] = useState([]);
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
      }
      setKpis(kpisData);
      setAgences(agencesData);
      setCategories(categoriesData);
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

  useEffect(() => {
    // Pré-remplir la date du jour au chargement
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setFormData(prev => ({ ...prev, dateKey: `${yyyy}-${mm}-${dd}` }));
    loadData();
  }, []);

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
      const creates = (categories || []).map(async (cat) => {
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
          // Le backend ne gère pas explicitement "reglées" pour MED: on n'envoie pas si non supporté
          nbDossiersJuridiques: parseInt(e.nbDossiersJuridiques || 0, 10),
          mtDossiersJuridiques: parseFloat(e.mtDossiersJuridiques || 0)
        };
        return kpiService.create(payload);
      });

      await Promise.all(creates);
      await swalSuccess('Données sauvegardées avec succès');
      
      // Réinitialiser le formulaire (date du jour conservée)
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      setFormData({
        dateKey: `${y}-${m}-${d}`,
        agenceId: '',
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

        {/* Formulaire élargi */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-sky-800">
            <Plus className="h-5 w-5" />
            Saisie des données
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.dateKey}
                  onChange={(e) => setFormData({ ...formData, dateKey: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Agence *
                </label>
                <select
                  value={formData.agenceId}
                  onChange={(e) => setFormData({ ...formData, agenceId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            </div>

            {/* Saisie par catégorie */}
            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-800 mb-3">Saisie par catégorie</h3>
              <div className="overflow-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold">Catégorie</th>
                      <th className="px-3 py-3 text-left">Relances (Nb)</th>
                      <th className="px-3 py-3 text-left">Relances (Mt)</th>
                      <th className="px-3 py-3 text-left">Relances réglées (Nb)</th>
                      <th className="px-3 py-3 text-left">Relances réglées (Mt)</th>
                      <th className="px-3 py-3 text-left">Mises en demeure (Nb)</th>
                      <th className="px-3 py-3 text-left">Mises en demeure (Mt)</th>
                      <th className="px-3 py-3 text-left">Dossiers juridiques (Nb)</th>
                      <th className="px-3 py-3 text-left">Dossiers juridiques (Mt)</th>
                      <th className="px-3 py-3 text-left">Branchement (Nb)</th>
                      <th className="px-3 py-3 text-left">Rempl. compteurs (Nb)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(categories || []).map((cat) => {
                      const e = entriesByCategory[cat.CategorieId] || {};
                      return (
                        <tr key={cat.CategorieId} className="border-t">
                          <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{cat.Libelle}</td>
                          <td className="px-3 py-2"><input type="number" value={e.nbRelancesEnvoyees || ''} onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbRelancesEnvoyees: ev.target.value } }))} className="w-28 border border-gray-300 rounded px-2 py-1" /></td>
                          <td className="px-3 py-2"><input type="number" step="0.01" value={e.mtRelancesEnvoyees || ''} onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtRelancesEnvoyees: ev.target.value } }))} className="w-28 border border-gray-300 rounded px-2 py-1" /></td>
                          <td className="px-3 py-2"><input type="number" value={e.nbRelancesReglees || ''} onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbRelancesReglees: ev.target.value } }))} className="w-28 border border-gray-300 rounded px-2 py-1" /></td>
                          <td className="px-3 py-2"><input type="number" step="0.01" value={e.mtRelancesReglees || ''} onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtRelancesReglees: ev.target.value } }))} className="w-28 border border-gray-300 rounded px-2 py-1" /></td>
                          <td className="px-3 py-2"><input type="number" value={e.nbMisesEnDemeureEnvoyees || ''} onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbMisesEnDemeureEnvoyees: ev.target.value } }))} className="w-28 border border-gray-300 rounded px-2 py-1" /></td>
                          <td className="px-3 py-2"><input type="number" step="0.01" value={e.mtMisesEnDemeureEnvoyees || ''} onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtMisesEnDemeureEnvoyees: ev.target.value } }))} className="w-28 border border-gray-300 rounded px-2 py-1" /></td>
                          <td className="px-3 py-2"><input type="number" value={e.nbDossiersJuridiques || ''} onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbDossiersJuridiques: ev.target.value } }))} className="w-28 border border-gray-300 rounded px-2 py-1" /></td>
                          <td className="px-3 py-2"><input type="number" step="0.01" value={e.mtDossiersJuridiques || ''} onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], mtDossiersJuridiques: ev.target.value } }))} className="w-28 border border-gray-300 rounded px-2 py-1" /></td>
                          <td className="px-3 py-2"><input type="number" value={e.nbPoseCompteurs || ''} onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbPoseCompteurs: ev.target.value } }))} className="w-28 border border-gray-300 rounded px-2 py-1" /></td>
                          <td className="px-3 py-2"><input type="number" value={e.nbRemplacementCompteurs || ''} onChange={(ev) => setEntriesByCategory(prev => ({ ...prev, [cat.CategorieId]: { ...prev[cat.CategorieId], nbRemplacementCompteurs: ev.target.value } }))} className="w-28 border border-gray-300 rounded px-2 py-1" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg shadow transition inline-flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Sauvegarder
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
