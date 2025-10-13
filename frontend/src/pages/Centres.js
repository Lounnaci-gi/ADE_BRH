import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Printer, Plus, Building2, MapPin, Phone, Mail, FileText } from 'lucide-react';
import centresService from '../services/centresService';
import CentresAddModal from '../components/CentresAddModal';

const Centres = () => {
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCentre, setEditingCentre] = useState(null);

  useEffect(() => {
    loadCentres();
  }, []);

  const loadCentres = async () => {
    try {
      setLoading(true);
      const response = await centresService.list();
      setCentres(response.data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des centres:', err);
      setError('Erreur de chargement des centres');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCentre(null);
    setIsModalOpen(true);
  };

  const handleEdit = (centre) => {
    setEditingCentre(centre);
    setIsModalOpen(true);
  };

  const handleDelete = async (centre) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le centre "${centre.Nom_Centre}" ?`)) {
      try {
        await centresService.remove(centre.CentreId);
        await loadCentres();
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        alert('Erreur lors de la suppression du centre');
      }
    }
  };

  const handlePrint = (centre) => {
    // Fonctionnalité d'impression à implémenter
    console.log('Impression du centre:', centre);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCentre(null);
  };

  const handleModalSubmit = async (centreData) => {
    try {
      if (editingCentre) {
        await centresService.update(editingCentre.CentreId, centreData);
      } else {
        await centresService.create(centreData);
      }
      await loadCentres();
      handleModalClose();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      alert('Erreur lors de la sauvegarde du centre');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="page-shell">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-water-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-gray-800 w-full">
      <div className="page-shell">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-water-600 rounded-xl shadow-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-water-900 dark:text-white">
                  Gestion des Centres
                </h1>
                <p className="text-water-600 dark:text-water-300 mt-1">
                  Gérez les centres de l'entreprise
                </p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center space-x-2 bg-water-600 hover:bg-water-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span>Nouveau Centre</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="page-content">
          <table className="w-full border-collapse min-w-full">
              <thead className="bg-blue-100 text-blue-800">
                <tr>
                  <th className="py-3 px-6 text-left whitespace-nowrap font-semibold text-sm">Centre</th>
                  <th className="py-3 px-6 text-left whitespace-nowrap font-semibold text-sm">Agences</th>
                  <th className="py-3 px-6 text-left whitespace-nowrap font-semibold text-sm">Adresse</th>
                  <th className="py-3 px-6 text-left whitespace-nowrap font-semibold text-sm">Téléphone</th>
                  <th className="py-3 px-6 text-left whitespace-nowrap font-semibold text-sm">Fax</th>
                  <th className="py-3 px-6 text-center font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {centres.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-water-500 dark:text-water-400">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Aucun centre trouvé</p>
                      <p className="text-sm">Cliquez sur "Nouveau Centre" pour commencer</p>
                    </td>
                  </tr>
                ) : (
                  centres.map((centre) => (
                    <tr key={centre.CentreId} className="border-t hover:bg-blue-50">
                      <td className="py-2 px-6 whitespace-nowrap text-sm">{centre.Nom_Centre}</td>
                      <td className="py-2 px-6 whitespace-nowrap text-sm">{centre.Nombre_Agences || 0}</td>
                      <td className="py-2 px-6 whitespace-nowrap text-sm">{centre.Adresse}</td>
                      <td className="py-2 px-6 whitespace-nowrap text-sm">{centre.Telephone}</td>
                      <td className="py-2 px-6 whitespace-nowrap text-sm">{centre.Fax || '-'}</td>
                      <td className="py-2 px-6 text-center space-x-2">
                        <button
                          title="Modifier"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-blue-50"
                          onClick={() => handleEdit(centre)}
                        >
                          <Pencil className="h-3.5 w-3.5 text-blue-600" />
                        </button>
                        <button
                          title="Supprimer"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-50"
                          onClick={() => handleDelete(centre)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </button>
                        <button
                          title="Imprimer"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100"
                          onClick={() => handlePrint(centre)}
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
        </div>

        {/* Modal */}
        {isModalOpen && (
          <CentresAddModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            onSubmit={handleModalSubmit}
            initialValues={editingCentre}
          />
        )}
    </div>
  );
};

export default Centres;
