import React, { useEffect, useState } from 'react';
import { Calendar, Building2, Tag, DollarSign, Target, Save, Plus } from 'lucide-react';
import kpiService from '../services/kpiService';
import authService from '../services/authService';
import { swalSuccess, swalError } from '../utils/swal';

function KPI() {
  const [kpis, setKpis] = useState([]);
  const [agences, setAgences] = useState([]);
  const [categories, setCategories] = useState([]);
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
    objCoupures: '',
    objDossiersJuridiques: '',
    objMisesEnDemeureEnvoyees: '',
    objRelancesEnvoyees: ''
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
    } catch (e) {
      console.error(e);
      await swalError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.dateKey || !formData.agenceId || !formData.categorieId) {
      await swalError('Date, Agence et Catégorie sont requis', 'Validation');
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

      const payload = {
        ...formData,
        dateKey,
        agenceId: parseInt(formData.agenceId),
        categorieId: parseInt(formData.categorieId)
      };

      await kpiService.create(payload);
      await swalSuccess('KPI sauvegardé avec succès');
      
      // Réinitialiser le formulaire
      setFormData({
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
        objCoupures: '',
        objDossiersJuridiques: '',
        objMisesEnDemeureEnvoyees: '',
        objRelancesEnvoyees: ''
      });
      
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
        <h1 className="text-2xl font-bold text-gray-800">📊 Gestion des KPIs</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Saisir un KPI
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="inline h-4 w-4 mr-1" />
                  Catégorie *
                </label>
                <select
                  value={formData.categorieId}
                  onChange={(e) => setFormData({ ...formData, categorieId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(category => (
                    <option key={category.CategorieId} value={category.CategorieId}>
                      {category.Libelle}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Encaissements */}
            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Encaissements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Encaissement journalier global
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.encaissementJournalierGlobal}
                    onChange={(e) => setFormData({ ...formData, encaissementJournalierGlobal: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Coupures */}
            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-800 mb-3">Coupures</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de coupures
                  </label>
                  <input
                    type="number"
                    value={formData.nbCoupures}
                    onChange={(e) => setFormData({ ...formData, nbCoupures: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant des coupures
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.mtCoupures}
                    onChange={(e) => setFormData({ ...formData, mtCoupures: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="inline h-4 w-4 mr-1" />
                    Objectif coupures
                  </label>
                  <input
                    type="number"
                    value={formData.objCoupures}
                    onChange={(e) => setFormData({ ...formData, objCoupures: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Dossiers juridiques */}
            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-800 mb-3">Dossiers juridiques</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de dossiers
                  </label>
                  <input
                    type="number"
                    value={formData.nbDossiersJuridiques}
                    onChange={(e) => setFormData({ ...formData, nbDossiersJuridiques: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant des dossiers
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.mtDossiersJuridiques}
                    onChange={(e) => setFormData({ ...formData, mtDossiersJuridiques: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="inline h-4 w-4 mr-1" />
                    Objectif dossiers
                  </label>
                  <input
                    type="number"
                    value={formData.objDossiersJuridiques}
                    onChange={(e) => setFormData({ ...formData, objDossiersJuridiques: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Mises en demeure */}
            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-800 mb-3">Mises en demeure</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre envoyées
                  </label>
                  <input
                    type="number"
                    value={formData.nbMisesEnDemeureEnvoyees}
                    onChange={(e) => setFormData({ ...formData, nbMisesEnDemeureEnvoyees: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant envoyées
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.mtMisesEnDemeureEnvoyees}
                    onChange={(e) => setFormData({ ...formData, mtMisesEnDemeureEnvoyees: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="inline h-4 w-4 mr-1" />
                    Objectif mises en demeure
                  </label>
                  <input
                    type="number"
                    value={formData.objMisesEnDemeureEnvoyees}
                    onChange={(e) => setFormData({ ...formData, objMisesEnDemeureEnvoyees: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Relances */}
            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-800 mb-3">Relances</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre envoyées
                  </label>
                  <input
                    type="number"
                    value={formData.nbRelancesEnvoyees}
                    onChange={(e) => setFormData({ ...formData, nbRelancesEnvoyees: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant envoyées
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.mtRelancesEnvoyees}
                    onChange={(e) => setFormData({ ...formData, mtRelancesEnvoyees: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="inline h-4 w-4 mr-1" />
                    Objectif relances
                  </label>
                  <input
                    type="number"
                    value={formData.objRelancesEnvoyees}
                    onChange={(e) => setFormData({ ...formData, objRelancesEnvoyees: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Relances réglées */}
            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-800 mb-3">Relances réglées</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre réglées
                  </label>
                  <input
                    type="number"
                    value={formData.nbRelancesReglees}
                    onChange={(e) => setFormData({ ...formData, nbRelancesReglees: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant réglées
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.mtRelancesReglees}
                    onChange={(e) => setFormData({ ...formData, mtRelancesReglees: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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

        {/* Section "KPIs récents" supprimée pour désencombrer la page */}
      </div>

      {/* Notifications gérées via SweetAlert2 */}
    </div>
  );
}

export default KPI;
