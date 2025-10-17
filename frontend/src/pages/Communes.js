import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Printer, MapPin } from 'lucide-react';
import communesService from '../services/communesService';
import CommunesAddModal from '../components/CommunesAddModal';
import { swal, swalConfirmDelete, swalSuccess, swalError } from '../utils/swal';
import authService from '../services/authService';

const Communes = () => {
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCommune, setEditingCommune] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const user = authService.getCurrentUser();
  const isAdmin = (user?.role || '').toString() === 'Administrateur';
  const canEdit = isAdmin; // Seuls les admins peuvent modifier/supprimer

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
      await Swal.fire({ icon: 'error', title: 'Erreur', text: 'Erreur lors du chargement des communes' });
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

  const askDelete = async (commune) => {
    if (!commune?.CommuneId) return;
    setSelectedCommune(commune);
    const result = await swalConfirmDelete({
      title: 'Supprimer cette commune ? ',
      text: `"${commune.Nom_Commune}" sera définitivement supprimée.`,
    });
    if (result.isConfirmed) {
      await handleDelete(commune);
    } else {
      setSelectedCommune(null);
    }
  };

  const handleDelete = async (communeParam) => {
    const commune = communeParam || selectedCommune;
    if (!commune?.CommuneId) {
      return;
    }
    try {
      await communesService.remove(commune.CommuneId);
      await swalSuccess('Commune supprimée avec succès');
      await loadCommunes();
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Erreur lors de la suppression';
      console.error('Erreur lors de la suppression:', message, error);
      await swalError(message);
    } finally {
      setSelectedCommune(null);
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
        await Swal.fire({ icon: 'success', title: 'Succès', text: 'Commune modifiée avec succès' });
      } else {
        await communesService.create(formData);
        await Swal.fire({ icon: 'success', title: 'Succès', text: 'Commune créée avec succès' });
      }
      loadCommunes();
      handleModalClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      await Swal.fire({ icon: 'error', title: 'Erreur', text: error.response?.data?.message || 'Erreur lors de la sauvegarde' });
    }
  };

  return (
    <div className="p-6 text-gray-800 w-full min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Gestion des Communes
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Gérez les communes de votre organisation
                </p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 font-medium"
              disabled={!canEdit}
              style={{ opacity: canEdit ? 1 : 0.5 }}
            >
              <Plus className="h-5 w-5" />
              Nouvelle Commune
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-container bg-white shadow-md rounded-xl border border-blue-100 w-full">
          <table className="w-full border-collapse min-w-full">
            <thead className="bg-blue-100 text-blue-800">
              <tr>
                <th className="py-3 px-6 text-left whitespace-nowrap font-semibold text-sm">N°</th>
                <th className="py-3 px-6 text-left whitespace-nowrap font-semibold text-sm">Commune</th>
                <th className="py-3 px-6 text-left whitespace-nowrap font-semibold text-sm">Agence</th>
                <th className="py-3 px-6 text-left whitespace-nowrap font-semibold text-sm">Date de création</th>
                <th className="py-3 px-6 text-center font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {communes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Aucune commune trouvée</p>
                    <p className="text-sm">Cliquez sur "Nouvelle Commune" pour commencer</p>
                  </td>
                </tr>
              ) : (
                communes.map((commune) => (
                  <tr key={commune.CommuneId} className="border-t hover:bg-blue-50">
                    <td className="py-2 px-6 whitespace-nowrap text-sm">{commune.Numero}</td>
                    <td className="py-2 px-6 whitespace-nowrap text-sm">{commune.Nom_Commune}</td>
                    <td className="py-2 px-6 whitespace-nowrap text-sm">{commune.Nom_Agence}</td>
                    <td className="py-2 px-6 whitespace-nowrap text-sm">
                      {commune.CreatedAt ? new Date(commune.CreatedAt).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="py-2 px-6 text-center space-x-2">
                      {canEdit && (
                        <>
                          <button
                            title="Modifier"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-blue-50"
                            onClick={() => handleEdit(commune)}
                          >
                            <Pencil className="h-3.5 w-3.5 text-blue-600" />
                          </button>
                          <button
                            title="Supprimer"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-50"
                            onClick={() => askDelete(commune)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </button>
                        </>
                      )}
                      <button
                        title="Imprimer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100"
                        onClick={() => window.print()}
                      >
                        <Printer className="h-3.5 w-3.5 text-gray-700" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {modalOpen && (
          <CommunesAddModal
            isOpen={modalOpen}
            onClose={handleModalClose}
            onSubmit={handleModalSubmit}
            initialValues={editingCommune}
          />
        )}

        {/* Confirmation via SweetAlert2 gérée dans askDelete */}
      </div>
    </div>
  );
};

export default Communes;
