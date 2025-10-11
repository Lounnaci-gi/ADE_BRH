import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Printer, MapPin } from 'lucide-react';
import communesService from '../services/communesService';
import CommunesAddModal from '../components/CommunesAddModal';
import { toast } from 'react-hot-toast';

const Communes = () => {
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCommune, setEditingCommune] = useState(null);
  const [columns, setColumns] = useState([]);

  // Charger la liste des communes
  const loadCommunes = async () => {
    try {
      setLoading(true);
      const data = await communesService.list();
      // Ajouter un numéro d'ordre à chaque commune
      const communesWithNumber = data.map((commune, index) => ({
        ...commune,
        Numero: index + 1
      }));
      setCommunes(communesWithNumber);
      
      // Déduire dynamiquement les colonnes à partir des objets retournés
      const keys = Array.from(
        communesWithNumber.reduce((acc, row) => {
          Object.keys(row || {}).forEach((k) => acc.add(k));
          return acc;
        }, new Set())
      );
      
      // Ordonner: champs principaux d'abord, puis le reste trié alpha
      const preferred = [
        'Numero',
        'Nom_Commune',
        'Nom_Agence',
        'CreatedAt'
      ];
      const preferredSet = new Set(preferred);
      const orderedAll = [
        ...preferred.filter((k) => keys.includes(k)),
        ...keys.filter((k) => !preferredSet.has(k)).sort((a, b) => a.localeCompare(b))
      ];
      
      // Masquer certains champs
      const hidden = new Set(['CommuneId', 'AgenceId']);
      const ordered = orderedAll.filter((k) => !hidden.has(k));
      setColumns(ordered);
    } catch (error) {
      console.error('Erreur lors du chargement des communes:', error);
      toast.error('Erreur lors du chargement des communes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunes();
  }, []);

  const handleCreate = () => {
    setEditingCommune(null);
    setModalOpen(true);
  };

  const handleEdit = (commune) => {
    setEditingCommune(commune);
    setModalOpen(true);
  };

  const handleDelete = async (commune) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la commune "${commune.Nom_Commune}" ?`)) {
      try {
        await communesService.remove(commune.CommuneId);
        toast.success('Commune supprimée avec succès');
        loadCommunes();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingCommune(null);
  };

  const handleModalSubmit = async (formData) => {
    try {
      if (editingCommune) {
        await communesService.update(editingCommune.CommuneId, formData);
        toast.success('Commune modifiée avec succès');
      } else {
        await communesService.create(formData);
        toast.success('Commune créée avec succès');
      }
      loadCommunes();
      handleModalClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <div className="p-6 text-gray-800 w-full min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-blue-600" />
          Gestion des Communes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez les communes de votre organisation
        </p>
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-xl border border-blue-100 w-full">
        <div className="p-4 border-b border-blue-100">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Liste des Communes ({communes.length})
            </h2>
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouvelle Commune
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        ) : communes.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune commune trouvée</p>
            <p className="text-sm">Cliquez sur "Ajouter une commune" pour commencer</p>
          </div>
        ) : (
          <table className="w-full border-collapse min-w-full">
            <thead className="bg-blue-100 text-blue-800">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="py-3 px-6 text-left whitespace-nowrap font-semibold text-sm">
                    {col}
                  </th>
                ))}
                <th className="py-3 px-6 text-center font-semibold text-sm">Actions</th>
              </tr>
            </thead>
              <tbody>
                {communes.map((row) => (
                  <tr key={row.CommuneId || JSON.stringify(row)} className="border-t hover:bg-blue-50">
                    {columns.map((col) => (
                      <td key={col} className="py-2 px-6 whitespace-nowrap text-sm">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                    <td className="py-2 px-6 text-center space-x-2">
                      <button
                        title="Modifier"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-blue-50"
                        onClick={() => handleEdit(row)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-blue-600" />
                      </button>
                      <button
                        title="Supprimer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-50"
                        onClick={() => handleDelete(row)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </button>
                      <button
                        title="Imprimer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100"
                        onClick={() => window.print()}
                      >
                        <Printer className="h-3.5 w-3.5 text-gray-700" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        )}
      </div>

      {modalOpen && (
        <CommunesAddModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          initialValues={editingCommune}
        />
      )}
    </div>
  );
};

export default Communes;
