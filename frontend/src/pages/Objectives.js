import React, { useEffect, useState } from 'react';
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
  const isObjectiveTooOld = (annee, mois) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const objectiveDate = new Date(annee, mois - 1, 1);
    const threeMonthsAgo = new Date(currentYear, currentMonth - 4, 1);
    
    return objectiveDate < threeMonthsAgo;
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

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (row) => { setEditing(row); setModalOpen(true); };

  const handleSubmitModal = async (payload) => {
    // Règle: doublon côté client avant POST
    if (!editing) {
      const dup = objectives.some(o => o.AgenceId === payload.agenceId && o.Mois === payload.mois && o.Annee === payload.annee);
      if (dup) {
        throw { response: { data: { message: 'Un objectif existe déjà pour cette agence et cette période.' } } };
      }
      await objectivesService.save(payload);
    } else {
      await objectivesService.update(payload);
    }
    await loadData();
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
    <>
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Building2 className="h-6 w-6" />
        Objectifs des Agences
      </h1>

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

      <div className="mb-4 flex justify-end">
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white">
          <Plus className="h-4 w-4" /> Ajouter
        </button>
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
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Agence</th>
                  <th className="px-4 py-2 text-left">Mois/Année</th>
                  <th className="px-4 py-2 text-left">Coupures</th>
                  <th className="px-4 py-2 text-left">Dossiers Juridiques</th>
                  <th className="px-4 py-2 text-left">Mises en Demeure</th>
                  <th className="px-4 py-2 text-left">Relances</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {objectives.map((o) => {
                  const isTooOld = isObjectiveTooOld(o.Annee, o.Mois);
                  return (
                    <tr key={`${o.AgenceId}-${o.DateKey}`} className="border-t">
                      <td className="px-4 py-2">{o.Nom_Agence}</td>
                      <td className="px-4 py-2">{getMonthName(o.Mois)} {o.Annee}</td>
                      <td className="px-4 py-2">{o.Obj_Coupures ?? 0}</td>
                      <td className="px-4 py-2">{o.Obj_Dossiers_Juridiques ?? 0}</td>
                      <td className="px-4 py-2">{o.Obj_MisesEnDemeure_Envoyees ?? 0}</td>
                      <td className="px-4 py-2">{o.Obj_Relances_Envoyees ?? 0}</td>
                      <td className="px-4 py-2 text-right">
                        {isTooOld ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded border mr-2 bg-gray-100 text-gray-500 cursor-not-allowed">
                            <Pencil className="h-4 w-4" /> Verrouillé
                          </span>
                        ) : (
                          <button onClick={() => openEdit(o)} className="inline-flex items-center gap-1 px-2 py-1 rounded border mr-2 hover:bg-blue-50">
                            <Pencil className="h-4 w-4" /> Modifier
                          </button>
                        )}
                        {/* Suppression logique côté backend déjà disponible via DELETE, à brancher si souhaité */}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Affichage des agences sans objectifs */}
      {agences.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Toutes les Agences ({agences.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agences.map((agence) => {
              const hasObjective = objectives.some(obj => obj.AgenceId === agence.AgenceId);
              return (
                <div 
                  key={agence.AgenceId} 
                  className={`p-3 rounded-lg border ${
                    hasObjective 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <Building2 className={`h-4 w-4 mr-2 ${
                      hasObjective ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <span className={`font-medium ${
                      hasObjective ? 'text-green-800' : 'text-gray-600'
                    }`}>
                      {agence.Nom_Agence}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {hasObjective ? 'Objectifs définis' : 'Aucun objectif'}
                  </div>
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