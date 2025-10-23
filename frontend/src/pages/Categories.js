import React, { useEffect, useState } from 'react';
import { swalConfirmDelete, swalSuccess, swalError } from '../utils/swal';
import { Pencil, Trash2, Plus, Save, X } from 'lucide-react';
import categoriesService from '../services/categoriesService';
import authService from '../services/authService';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    codeCategorie: '',
    libelle: '',
    description: ''
  });

  const user = authService.getCurrentUser();
  const isAdmin = (user?.role || '').toString() === 'Administrateur';

  const loadCategories = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Chargement des catégories...');
      const data = await categoriesService.list();
      console.log('Données reçues:', data);
      setCategories(data);
    } catch (e) {
      console.error('Erreur lors du chargement:', e);
      await swalError('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation côté client
    if (!formData.codeCategorie.trim()) {
      await swalError('Le code catégorie est requis', 'Validation');
      return;
    }
    
    if (!formData.libelle.trim()) {
      await swalError('Le libellé est requis', 'Validation');
      return;
    }
    
    if (formData.codeCategorie.length > 50) {
      await swalError('Le code catégorie ne peut pas dépasser 50 caractères', 'Validation');
      return;
    }
    
    if (formData.libelle.length > 100) {
      await swalError('Le libellé ne peut pas dépasser 100 caractères', 'Validation');
      return;
    }
    
    if (formData.description && formData.description.length > 250) {
      await swalError('La description ne peut pas dépasser 250 caractères', 'Validation');
      return;
    }
    
    try {
      if (editingCategory) {
        await categoriesService.update(editingCategory.CategorieId, formData);
        await swalSuccess('Catégorie mise à jour avec succès');
      } else {
        await categoriesService.create(formData);
        await swalSuccess('Catégorie créée avec succès');
      }
      
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ codeCategorie: '', libelle: '', description: '' });
      await loadCategories();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Une erreur est survenue';
      await swalError(msg);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      codeCategorie: category.CodeCategorie || '',
      libelle: category.Libelle || '',
      description: category.Description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (category) => {
    const result = await swalConfirmDelete({
      title: 'Supprimer la catégorie ? ',
      text: `"${category.Libelle}" sera définitivement supprimée.`,
    });

    if (!result.isConfirmed) return;
    try {
      await categoriesService.remove(category.CategorieId);
      await swalSuccess('Catégorie supprimée avec succès');
      await loadCategories();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Erreur lors de la suppression';
      await swalError(msg);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ codeCategorie: '', libelle: '', description: '' });
  };

  console.log('Categories component render - categories:', categories, 'loading:', loading);

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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📂 Gestion des catégories</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl shadow-md transition inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvelle catégorie
        </button>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Libellé</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-2 text-center" colSpan="4">Chargement...</td>
                </tr>
              )}
              {!loading && categories.map((category, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2 font-medium">{category.CodeCategorie}</td>
                  <td className="px-4 py-2">{category.Libelle}</td>
                  <td className="px-4 py-2 text-gray-600">{category.Description || '-'}</td>
                  <td className="px-4 py-2 text-center space-x-2">
                    <button 
                      onClick={() => handleEdit(category)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-blue-50"
                      title="Modifier"
                    >
                      <Pencil className="h-3.5 w-3.5 text-blue-600" />
                    </button>
                    <button 
                      onClick={() => handleDelete(category)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && categories.length === 0 && (
                <tr>
                  <td className="px-4 py-2 text-center text-gray-500" colSpan="4">
                    Aucune catégorie trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-water-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="text-lg font-semibold text-water-800 dark:text-water-200">
                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-water-600 hover:bg-water-100 dark:hover:bg-water-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-3 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
                  Code catégorie *
                </label>
                <input
                  type="text"
                  value={formData.codeCategorie}
                  onChange={(e) => setFormData({ ...formData, codeCategorie: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white"
                  maxLength={50}
                  required
                />
                <p className="mt-1 text-xs text-water-500 dark:text-water-400">
                  {formData.codeCategorie.length}/50 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
                  Libellé *
                </label>
                <input
                  type="text"
                  value={formData.libelle}
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white"
                  maxLength={100}
                  required
                />
                <p className="mt-1 text-xs text-water-500 dark:text-water-400">
                  {formData.libelle.length}/100 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 resize-none border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white"
                  rows="3"
                  maxLength={250}
                />
                <p className="mt-1 text-xs text-water-500 dark:text-water-400">
                  {formData.description.length}/250 caractères
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-water-200 dark:border-water-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-water-600 hover:bg-water-50 dark:hover:bg-water-700 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-water-600 hover:bg-water-700 text-white rounded-xl transition-colors inline-flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingCategory ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications gérées via SweetAlert2 */}
    </div>
  );
}

export default Categories;
