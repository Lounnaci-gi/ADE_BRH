import React, { useEffect, useState } from 'react';
import { Target, Plus, Save, X, Trash2, Edit, Calendar, Building2 } from 'lucide-react';
import objectivesService from '../services/objectivesService';
import authService from '../services/authService';
import Toast from '../components/Toast';

function Objectives() {
  const [objectives, setObjectives] = useState([]);
  const [agences, setAgences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ open: false, type: 'success', message: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingObjective, setEditingObjective] = useState(null);
  const [filters, setFilters] = useState({
    annee: new Date().getFullYear(),
    mois: new Date().getMonth() + 1
  });
  const [formData, setFormData] = useState({
    agenceId: '',
    annee: new Date().getFullYear(),
    mois: new Date().getMonth() + 1,
    objectif_Coupures: '',
    objectif_Dossiers_Juridiques: '',
    objectif_MisesEnDemeure_Envoyees: '',
    objectif_Relances_Envoyees: ''
  });

  const user = authService.getCurrentUser();
  const isAdmin = (user?.role || '').toString() === 'Administrateur';

  // Chargement initial
  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les données en parallèle avec filtres
      const [objectivesData, agencesData] = await Promise.all([
        objectivesService.list(filters),
        objectivesService.getAgences()
      ]);
      
      setObjectives(objectivesData);
      setAgences(agencesData);
    } catch (e) {
      console.error('Erreur lors du chargement des données:', e);
      setError('Erreur lors du chargement des données');
      setToast({ open: true, type: 'error', message: 'Erreur lors du chargement des données' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Debounce pour éviter trop de requêtes
  useEffect(() => {
    if (!isAdmin) return;
    
    const timeoutId = setTimeout(() => {
      loadData();
    }, 300); // Attendre 300ms après le dernier changement

    return () => clearTimeout(timeoutId);
  }, [filters.annee, filters.mois]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submission started with data:', formData);
    
    // Validation
    if (!formData.agenceId) {
      setToast({ open: true, type: 'error', message: 'Veuillez sélectionner une agence' });
      return;
    }

    if (!formData.annee || !formData.mois) {
      setToast({ open: true, type: 'error', message: 'Veuillez sélectionner une année et un mois' });
      return;
    }

    try {
      const payload = {
        agenceId: parseInt(formData.agenceId),
        annee: parseInt(formData.annee),
        mois: parseInt(formData.mois),
        objectif_Coupures: formData.objectif_Coupures ? parseInt(formData.objectif_Coupures) : null,
        objectif_Dossiers_Juridiques: formData.objectif_Dossiers_Juridiques ? parseInt(formData.objectif_Dossiers_Juridiques) : null,
        objectif_MisesEnDemeure_Envoyees: formData.objectif_MisesEnDemeure_Envoyees ? parseInt(formData.objectif_MisesEnDemeure_Envoyees) : null,
        objectif_Relances_Envoyees: formData.objectif_Relances_Envoyees ? parseInt(formData.objectif_Relances_Envoyees) : null
      };

      console.log('Sending payload to API:', payload);
      
      const result = await objectivesService.save(payload);
      console.log('API response:', result);
      
      setToast({ open: true, type: 'success', message: 'Objectif sauvegardé avec succès' });
      
      setShowModal(false);
      setEditingObjective(null);
      setFormData({
        agenceId: '',
        annee: new Date().getFullYear(),
        mois: new Date().getMonth() + 1,
        objectif_Coupures: '',
        objectif_Dossiers_Juridiques: '',
        objectif_MisesEnDemeure_Envoyees: '',
        objectif_Relances_Envoyees: ''
      });
      await loadData();
    } catch (e) {
      console.error('Error saving objective:', e);
      const msg = e?.response?.data?.message || 'Une erreur est survenue';
      setToast({ open: true, type: 'error', message: msg });
    }
  };

  const handleEdit = (objective) => {
    setEditingObjective(objective);
    setFormData({
      agenceId: objective.AgenceId.toString(),
      annee: objective.Annee,
      mois: objective.Mois,
      objectif_Coupures: objective.Obj_Coupures || '',
      objectif_Dossiers_Juridiques: objective.Obj_Dossiers_Juridiques || '',
      objectif_MisesEnDemeure_Envoyees: objective.Obj_MisesEnDemeure_Envoyees || '',
      objectif_Relances_Envoyees: objective.Obj_Relances_Envoyees || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (objective) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer les objectifs pour ${objective.Nom_Agence} (${objective.Mois}/${objective.Annee}) ?`)) {
      return;
    }

    try {
      await objectivesService.remove({
        agenceId: objective.AgenceId,
        annee: objective.Annee,
        mois: objective.Mois
      });
      setToast({ open: true, type: 'success', message: 'Objectifs supprimés avec succès' });
      await loadData();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Une erreur est survenue';
      setToast({ open: true, type: 'error', message: msg });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingObjective(null);
    setFormData({
      agenceId: '',
      annee: new Date().getFullYear(),
      mois: new Date().getMonth() + 1,
      objectif_Coupures: '',
      objectif_Dossiers_Juridiques: '',
      objectif_MisesEnDemeure_Envoyees: '',
      objectif_Relances_Envoyees: ''
    });
  };

  const getMonthName = (month) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1] || '';
  };


  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Target className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Accès refusé</h2>
          <p className="text-red-600">Seuls les administrateurs peuvent gérer les objectifs des agences.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Target className="h-6 w-6" />
          🎯 Objectifs Mensuels des Agences
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl shadow-md transition inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvel objectif
        </button>
      </div>

      {/* Filtre temporel moderne */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-800">Filtre Temporel</h3>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Année
            </label>
            <select
              value={filters.annee}
              onChange={(e) => handleFilterChange('annee', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            >
              {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Mois
            </label>
            <select
              value={filters.mois}
              onChange={(e) => handleFilterChange('mois', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                const now = new Date();
                setFilters({
                  annee: now.getFullYear(),
                  mois: now.getMonth() + 1
                });
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg font-medium"
            >
              📅 Période Actuelle
            </button>
          </div>
        </div>

        {/* Indicateur de filtrage actif */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-800">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium">
              Affichage des objectifs pour : <strong>{getMonthName(filters.mois)} {filters.annee}</strong>
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* En-tête avec statistiques */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Objectifs trouvés : <strong className="text-blue-600">{objectives.length}</strong>
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Période : {getMonthName(filters.mois)} {filters.annee}
                </div>
              </div>
              {objectives.length > 0 && (
                <div className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border">
                  📊 Données filtrées
                </div>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Building2 className="h-4 w-4 inline mr-1" />
                    Agence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coupures
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dossiers Juridiques
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mises en Demeure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Relances
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {objectives.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium">
                        Aucun objectif trouvé pour {getMonthName(filters.mois)} {filters.annee}
                      </p>
                      <p className="text-sm text-gray-400 mb-4">
                        Essayez de changer la période ou créez un nouvel objectif
                      </p>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => {
                            const now = new Date();
                            setFilters({
                              annee: now.getFullYear(),
                              mois: now.getMonth() + 1
                            });
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition text-sm"
                        >
                          📅 Période Actuelle
                        </button>
                        <button
                          onClick={() => setShowModal(true)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition text-sm"
                        >
                          ➕ Nouvel Objectif
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  objectives.map((objective) => (
                    <tr key={objective.ObjectifId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {objective.Nom_Agence}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getMonthName(objective.Mois)} {objective.Annee}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {objective.Obj_Coupures || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {objective.Obj_Dossiers_Juridiques || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {objective.Obj_MisesEnDemeure_Envoyees || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {objective.Obj_Relances_Envoyees || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(objective)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(objective)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal pour ajouter/modifier un objectif */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseModal} />
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingObjective ? 'Modifier l\'objectif' : 'Nouvel objectif mensuel'}
              </h3>
              <button onClick={handleCloseModal} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agence *
                  </label>
                  <select
                    value={formData.agenceId}
                    onChange={(e) => setFormData({ ...formData, agenceId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner une agence</option>
                    {agences.map((agence) => (
                      <option key={agence.AgenceId} value={agence.AgenceId}>
                        {agence.Nom_Agence}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Année *
                  </label>
                  <select
                    value={formData.annee}
                    onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mois *
                  </label>
                  <select
                    value={formData.mois}
                    onChange={(e) => setFormData({ ...formData, mois: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {getMonthName(month)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objectif Coupures
                  </label>
                  <input
                    type="number"
                    value={formData.objectif_Coupures}
                    onChange={(e) => setFormData({ ...formData, objectif_Coupures: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objectif Dossiers Juridiques
                  </label>
                  <input
                    type="number"
                    value={formData.objectif_Dossiers_Juridiques}
                    onChange={(e) => setFormData({ ...formData, objectif_Dossiers_Juridiques: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objectif Mises en Demeure
                  </label>
                  <input
                    type="number"
                    value={formData.objectif_MisesEnDemeure_Envoyees}
                    onChange={(e) => setFormData({ ...formData, objectif_MisesEnDemeure_Envoyees: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objectif Relances Envoyées
                  </label>
                  <input
                    type="number"
                    value={formData.objectif_Relances_Envoyees}
                    onChange={(e) => setFormData({ ...formData, objectif_Relances_Envoyees: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg shadow-md transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-lg shadow-md transition inline-flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingObjective ? 'Mettre à jour' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
}

export default Objectives;
