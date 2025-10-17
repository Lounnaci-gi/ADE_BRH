import React, { useEffect, useState } from 'react';
import { swalConfirmDelete, swalSuccess, swalError } from '../utils/swal';
import { Pencil, Trash2, Plus, Save, X } from 'lucide-react';
import categoriesService from '../services/categoriesService';

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

  const loadCategories = async () => {
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-blue-600 text-white text-left">
              <th className="p-3">Code</th>
              <th className="p-3">Libellé</th>
              <th className="p-3">Description</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="p-3 text-center" colSpan="4">Chargement...</td>
              </tr>
            )}
            {!loading && categories.map((category, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{category.CodeCategorie}</td>
                <td className="p-3">{category.Libelle}</td>
                <td className="p-3 text-gray-600">{category.Description || '-'}</td>
                <td className="p-3 text-center space-x-2">
                  <button 
                    onClick={() => handleEdit(category)}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-blue-50"
                    title="Modifier"
                  >
                    <Pencil className="h-4 w-4 text-blue-600" />
                  </button>
                  <button 
                    onClick={() => handleDelete(category)}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-red-50"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && categories.length === 0 && (
              <tr>
                <td className="p-3 text-center text-gray-500" colSpan="4">
                  Aucune catégorie trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseModal} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-xl">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h3>
              <button onClick={handleCloseModal} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code catégorie * (max 50 caractères)
                </label>
                <input
                  type="text"
                  value={formData.codeCategorie}
                  onChange={(e) => setFormData({ ...formData, codeCategorie: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={50}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.codeCategorie.length}/50 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Libellé * (max 100 caractères)
                </label>
                <input
                  type="text"
                  value={formData.libelle}
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.libelle.length}/100 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (max 250 caractères)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  maxLength={250}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/250 caractères
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg shadow transition inline-flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingCategory ? 'Mettre à jour' : 'Créer'}
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
