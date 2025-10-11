import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Printer, Plus, Building2, MapPin, Phone, Mail, FileText } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-water-50 to-water-100 dark:from-water-900 dark:to-water-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-water-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-water-50 to-water-100 dark:from-water-900 dark:to-water-800 p-6">
      <div className="max-w-7xl mx-auto">
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
        <div className="bg-white dark:bg-water-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-water-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Nom du Centre</th>
                  <th className="px-6 py-4 text-left font-semibold">Adresse</th>
                  <th className="px-6 py-4 text-left font-semibold">Téléphone</th>
                  <th className="px-6 py-4 text-left font-semibold">Email</th>
                  <th className="px-6 py-4 text-left font-semibold">Fax</th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-water-200 dark:divide-water-700">
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
                    <tr key={centre.CentreId} className="hover:bg-water-50 dark:hover:bg-water-700 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-water-100 dark:bg-water-600 rounded-lg">
                            <Building2 className="h-5 w-5 text-water-600 dark:text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-water-900 dark:text-white">
                              {centre.Nom_Centre}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-water-700 dark:text-water-300">
                          <MapPin className="h-4 w-4" />
                          <span className="max-w-xs truncate">{centre.Adresse}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-water-700 dark:text-water-300">
                          <Phone className="h-4 w-4" />
                          <span>{centre.Telephone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {centre.Email ? (
                          <div className="flex items-center space-x-2 text-water-700 dark:text-water-300">
                            <Mail className="h-4 w-4" />
                            <span className="max-w-xs truncate">{centre.Email}</span>
                          </div>
                        ) : (
                          <span className="text-water-400 dark:text-water-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {centre.Fax ? (
                          <div className="flex items-center space-x-2 text-water-700 dark:text-water-300">
                            <FileText className="h-4 w-4" />
                            <span>{centre.Fax}</span>
                          </div>
                        ) : (
                          <span className="text-water-400 dark:text-water-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(centre)}
                            className="p-2 text-water-600 hover:bg-water-100 dark:hover:bg-water-700 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(centre)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePrint(centre)}
                            className="p-2 text-water-600 hover:bg-water-100 dark:hover:bg-water-700 rounded-lg transition-colors"
                            title="Imprimer"
                          >
                            <Printer className="h-4 w-4" />
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
    </div>
  );
};

export default Centres;
