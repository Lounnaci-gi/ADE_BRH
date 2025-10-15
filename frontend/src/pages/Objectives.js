import React, { useEffect, useState } from 'react';
import { Building2, Calendar, Plus, Save, X } from 'lucide-react';
import objectivesService from '../services/objectivesService';
import authService from '../services/authService';

function Objectives() {
  const [objectives, setObjectives] = useState([]);
  const [agences, setAgences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Fonction pour obtenir le nom du mois
  const getMonthName = (month) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1] || '';
  };

  // Charger les données
  const loadData = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Charger les agences et les objectifs en parallèle
      const [objectivesData, agencesData] = await Promise.all([
        objectivesService.list(filters),
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
  };

  // Chargement initial
  useEffect(() => {
    loadData();
  }, [isAdmin]);

  // Recharger quand les filtres changent
  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [filters.annee, filters.mois]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: parseInt(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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

      await objectivesService.save(payload);
      
      // Recharger les données
      loadData();
      
      // Fermer le modal et réinitialiser le formulaire
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
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError('Erreur lors de la sauvegarde de l\'objectif');
    }
  };

  const handleEdit = (objective) => {
    setEditingObjective(objective);
    setFormData({
      agenceId: objective.AgenceId.toString(),
      annee: objective.Annee,
      mois: objective.Mois,
      objectif_Coupures: objective.Obj_Coupures?.toString() || '',
      objectif_Dossiers_Juridiques: objective.Obj_Dossiers_Juridiques?.toString() || '',
      objectif_MisesEnDemeure_Envoyees: objective.Obj_MisesEnDemeure_Envoyees?.toString() || '',
      objectif_Relances_Envoyees: objective.Obj_Relances_Envoyees?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (objective) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
      try {
        await objectivesService.remove({
          agenceId: objective.AgenceId,
          annee: objective.Annee,
          mois: objective.Mois
        });
        loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        setError('Erreur lors de la suppression de l\'objectif');
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Accès Refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires.</p>
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
            <p className="text-gray-600">Chargement des objectifs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Erreur</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* En-tête principal */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Objectifs des Agences
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="h-4 w-4" />
          Ajouter un Objectif
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filtres</h3>
        </div>
        
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
            <select
              value={filters.annee}
              onChange={(e) => handleFilterChange('annee', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
            <select
              value={filters.mois}
              onChange={(e) => handleFilterChange('mois', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>{getMonthName(month)}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-gray-600">
          Affichage des objectifs pour <strong>{getMonthName(filters.mois)} {filters.annee}</strong>
        </div>
      </div>

      {/* Liste des objectifs */}
      {objectives.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Aucun objectif trouvé</h3>
          <p className="text-gray-500">
            Aucun objectif n'a été défini pour {getMonthName(filters.mois)} {filters.annee}.
          </p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          {/* En-tête du tableau */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">
              Objectifs pour {getMonthName(filters.mois)} {filters.annee}
            </h3>
            <p className="text-sm text-gray-600">{objectives.length} objectif{objectives.length !== 1 ? 's' : ''} trouvé{objectives.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Tableau des objectifs */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agence
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
                {objectives.map((objective) => (
                  <tr key={`${objective.AgenceId}-${objective.DateKey}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {objective.Nom_Agence}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {objective.AgenceId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {objective.Obj_Coupures || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {objective.Obj_Dossiers_Juridiques || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {objective.Obj_MisesEnDemeure_Envoyees || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {objective.Obj_Relances_Envoyees || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(objective)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Modifier"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(objective)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Supprimer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal d'ajout/modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingObjective ? 'Modifier l\'objectif' : 'Nouvel objectif mensuel'}
                </h2>
                <button
                  onClick={() => {
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
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agence *
                    </label>
                    <select
                      value={formData.agenceId}
                      onChange={(e) => setFormData(prev => ({ ...prev, agenceId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      onChange={(e) => setFormData(prev => ({ ...prev, annee: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mois *
                    </label>
                    <select
                      value={formData.mois}
                      onChange={(e) => setFormData(prev => ({ ...prev, mois: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <option key={month} value={month}>{getMonthName(month)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Objectif Coupures
                    </label>
                    <input
                      type="number"
                      value={formData.objectif_Coupures}
                      onChange={(e) => setFormData(prev => ({ ...prev, objectif_Coupures: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre de coupures"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Objectif Dossiers Juridiques
                    </label>
                    <input
                      type="number"
                      value={formData.objectif_Dossiers_Juridiques}
                      onChange={(e) => setFormData(prev => ({ ...prev, objectif_Dossiers_Juridiques: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre de dossiers"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Objectif Mises en Demeure
                    </label>
                    <input
                      type="number"
                      value={formData.objectif_MisesEnDemeure_Envoyees}
                      onChange={(e) => setFormData(prev => ({ ...prev, objectif_MisesEnDemeure_Envoyees: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre de mises en demeure"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Objectif Relances
                    </label>
                    <input
                      type="number"
                      value={formData.objectif_Relances_Envoyees}
                      onChange={(e) => setFormData(prev => ({ ...prev, objectif_Relances_Envoyees: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre de relances"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
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
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {editingObjective ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Objectives;