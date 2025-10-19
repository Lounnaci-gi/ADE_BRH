import React, { useEffect, useState, useCallback } from 'react';
import { Building2, Calendar, Pencil, Trash2, Plus } from 'lucide-react';
import objectivesService from '../services/objectivesService';
import authService from '../services/authService';
import ObjectivesModal from '../components/ObjectivesModal';

function Objectives() {
  const [objectives, setObjectives] = useState([]);
  const [agences, setAgences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({
    annee: new Date().getFullYear(),
    mois: new Date().getMonth() + 1
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

  // Fonction pour vérifier si un objectif est trop ancien pour être modifié (> 3 mois)
  const isObjectiveTooOld = (dateDebut) => {
    const now = new Date();
    const objectiveDate = new Date(dateDebut);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    
    return objectiveDate < threeMonthsAgo;
  };

  // Vérifier si une agence a des objectifs pour la période sélectionnée
  const hasObjectivesForPeriod = (agenceId) => {
    return objectives.some(obj => obj.AgenceId === agenceId && isDateInObjectiveRange(obj));
  };

  // Obtenir les objectifs d'une agence pour la période
  const getObjectivesForAgency = (agenceId) => {
    return objectives.filter(obj => obj.AgenceId === agenceId && isDateInObjectiveRange(obj));
  };

  // Vérifier si la période sélectionnée se trouve dans l'intervalle de l'objectif
  const isDateInObjectiveRange = (objective) => {
    if (!filters.annee || !filters.mois) return true; // Si pas de filtre, afficher tout
    
    // Créer la date de début et fin du mois sélectionné
    const selectedMonthStart = new Date(filters.annee, filters.mois - 1, 1); // 1er jour du mois
    const selectedMonthEnd = new Date(filters.annee, filters.mois, 0); // Dernier jour du mois
    
    const objectiveStart = new Date(objective.DateDebut);
    const objectiveEnd = new Date(objective.DateFin);
    
    // Vérifier si le mois sélectionné se chevauche avec l'intervalle de l'objectif
    // Le mois est dans l'intervalle si :
    // - Le début du mois est avant la fin de l'objectif ET
    // - La fin du mois est après le début de l'objectif
    const isInRange = selectedMonthStart <= objectiveEnd && selectedMonthEnd >= objectiveStart;
    
    
    return isInRange;
  };

  // Charger les données
  const loadData = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    // Vérifier que l'utilisateur est connecté
    const user = authService.getCurrentUser();
    if (!user) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Charger TOUS les objectifs (sans filtre de date) et les agences
      const [objectivesData, agencesData] = await Promise.all([
        objectivesService.list({}), // Pas de filtre pour charger tous les objectifs
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
  }, [isAdmin]); // Retirer 'filters' des dépendances

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (row) => { setEditing(row); setModalOpen(true); };

  const handleSubmitModal = async (payload) => {
    try {
      if (!editing || !editing.ObjectifId) {
        await objectivesService.save(payload);
      } else {
        await objectivesService.update(payload);
      }
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (objective) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer cet objectif pour ${objective.Nom_Agence} ?`)) {
      try {
        await objectivesService.remove({ objectifId: objective.ObjectifId });
        await loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'objectif');
      }
    }
  };

  // Chargement initial
  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]); // Retirer loadData des dépendances pour éviter la boucle infinie

  // Recharger les agences quand les filtres changent (pour mettre à jour l'affichage)
  useEffect(() => {
    if (isAdmin && agences.length > 0) {
      // Forcer le re-render des cartes d'agences avec les nouveaux filtres
    }
  }, [filters, isAdmin, agences.length]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === null || value === '' ? null : parseInt(value)
    }));
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Accès Refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires.</p>
          <p className="text-sm text-gray-500 mt-2">Veuillez vous connecter avec un compte administrateur.</p>
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
    <>
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Building2 className="h-6 w-6" />
        Objectifs des Agences
      </h1>


      {/* Filtre compact */}
      <div className="mb-4 bg-white border rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Filtre par période:</span>
            </div>
            <select 
              value={filters.annee || ''} 
              onChange={(e) => handleFilterChange('annee', e.target.value || null)}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Toutes les années</option>
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
            <select 
              value={filters.mois || ''} 
              onChange={(e) => handleFilterChange('mois', e.target.value || null)}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tous les mois</option>
              <option value={1}>Janvier</option>
              <option value={2}>Février</option>
              <option value={3}>Mars</option>
              <option value={4}>Avril</option>
              <option value={5}>Mai</option>
              <option value={6}>Juin</option>
              <option value={7}>Juillet</option>
              <option value={8}>Août</option>
              <option value={9}>Septembre</option>
              <option value={10}>Octobre</option>
              <option value={11}>Novembre</option>
              <option value={12}>Décembre</option>
            </select>
            <div className="flex gap-1">
              <button 
                onClick={() => setFilters({ annee: new Date().getFullYear(), mois: new Date().getMonth() + 1 })}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Actuel
              </button>
              <button 
                onClick={() => setFilters({ annee: null, mois: null })}
                className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Tous
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {filters.annee && filters.mois && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {objectives.filter(obj => isDateInObjectiveRange(obj)).length} actif(s)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Affichage des agences et objectifs */}
      {objectives.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Aucun objectif trouvé</h3>
          <p className="text-gray-500">
            Aucun objectif n'a été défini pour {getMonthName(filters.mois)} {filters.annee}.
          </p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Agence</th>
                  <th className="px-4 py-2 text-left">Titre</th>
                  <th className="px-4 py-2 text-left">Période</th>
                  <th className="px-4 py-2 text-left">Encaissement</th>
                  <th className="px-4 py-2 text-left">Coupures</th>
                  <th className="px-4 py-2 text-left">Dossiers Juridiques</th>
                  <th className="px-4 py-2 text-left">Mises en Demeure</th>
                  <th className="px-4 py-2 text-left">Relances</th>
                  <th className="px-4 py-2 text-left">Contrôles</th>
                  <th className="px-4 py-2 text-left">Compteurs</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {objectives.map((o) => {
                  const isTooOld = isObjectiveTooOld(o.DateDebut);
                  return (
                    <tr key={`${o.ObjectifId}`} className="border-t">
                      <td className="px-4 py-2">{o.Nom_Agence}</td>
                      <td className="px-4 py-2">
                        <div className="font-medium">{o.Titre}</div>
                        {o.Description && (
                          <div className="text-xs text-gray-500 mt-1">{o.Description}</div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {new Date(o.DateDebut).toLocaleDateString('fr-FR')} - {new Date(o.DateFin).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-2">{o.Obj_Encaissement ? new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(o.Obj_Encaissement) : '-'}</td>
                      <td className="px-4 py-2">{o.Obj_Coupures ?? '-'}</td>
                      <td className="px-4 py-2">{o.Obj_Dossiers_Juridiques ?? '-'}</td>
                      <td className="px-4 py-2">{o.Obj_MisesEnDemeure ?? '-'}</td>
                      <td className="px-4 py-2">{o.Obj_Relances ?? '-'}</td>
                      <td className="px-4 py-2">{o.Obj_Controles ?? '-'}</td>
                      <td className="px-4 py-2">{o.Obj_Compteurs_Remplaces ?? '-'}</td>
                      <td className="px-4 py-2 text-center space-x-2">
                        {isTooOld ? (
                          <button title="Verrouillé" disabled className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => openEdit(o)} title="Modifier" className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-blue-50">
                            <Pencil className="h-3.5 w-3.5 text-blue-600" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(o)} title="Supprimer" className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Affichage des agences avec statut des objectifs */}
      {agences.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Toutes les Agences ({agences.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agences.map((agence) => {
              const hasObjectives = hasObjectivesForPeriod(agence.AgenceId);
              const agencyObjectives = getObjectivesForAgency(agence.AgenceId);
              
              return (
                <div 
                  key={agence.AgenceId} 
                  className={`p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow ${
                    hasObjectives 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-900">{agence.Nom_Agence}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      hasObjectives 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {hasObjectives ? '✓ Objectifs définis' : '⚠ Aucun objectif'}
                    </span>
                  </div>
                  
                  {hasObjectives && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">
                        {agencyObjectives.length} objectif{agencyObjectives.length > 1 ? 's' : ''} défini{agencyObjectives.length > 1 ? 's' : ''} :
                      </p>
                      <div className="space-y-1">
                        {agencyObjectives.map((obj) => {
                          const isInRange = isDateInObjectiveRange(obj);
                          return (
                            <div key={obj.ObjectifId} className={`text-sm bg-white p-3 rounded-lg border-2 transition-all ${
                              isInRange 
                                ? 'border-green-200 bg-green-50' 
                                : 'border-gray-200'
                            }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-800">{obj.Titre}</div>
                                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(obj.DateDebut).toLocaleDateString('fr-FR')} - {new Date(obj.DateFin).toLocaleDateString('fr-FR')}
                                  </div>
                                  {isInRange && (
                                    <div className="mt-2 inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                      ✓ Période active
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                  <button
                                    onClick={() => openEdit(obj)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    title="Modifier"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(obj.ObjectifId)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {!hasObjectives && (
                    <div className="flex justify-center">
                      <button
                        onClick={() => {
                          setEditing({ FK_Agence: agence.AgenceId });
                          setModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                        title="Ajouter un objectif"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                  
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
    <ObjectivesModal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      onSubmit={handleSubmitModal}
      initialValues={editing}
      agences={agences}
    />
    </>
  );
}

export default Objectives;