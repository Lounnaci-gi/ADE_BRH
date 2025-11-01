import React, { useEffect, useState } from 'react';
import { swalConfirmDelete, swalSuccess, swalError } from '../utils/swal';
import { Pencil, Trash2, Plus, Save, X } from 'lucide-react';
import categoriesService from '../services/categoriesService';
import authService from '../services/authService';
import './Login.css';

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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-4">Accès Refusé</h1>
          <p className="text-gray-600 dark:text-slate-300">Vous n'avez pas les permissions nécessaires.</p>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Veuillez vous connecter avec un compte administrateur.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">📂 Gestion des catégories</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl shadow-md transition inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvelle catégorie
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-100">
              <tr>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Libellé</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="dark:text-slate-100">
              {loading && (
                <tr>
                  <td className="px-4 py-2 text-center" colSpan="4">Chargement...</td>
                </tr>
              )}
              {!loading && categories.map((category, index) => (
                <tr key={index} className="border-t dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800">
                  <td className="px-4 py-2 font-medium">{category.CodeCategorie}</td>
                  <td className="px-4 py-2">{category.Libelle}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-slate-300">{category.Description || '-'}</td>
                  <td className="px-4 py-2 text-center space-x-2">
                    <button 
                      onClick={() => handleEdit(category)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700"
                      title="Modifier"
                    >
                      <Pencil className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </button>
                    <button 
                      onClick={() => handleDelete(category)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && categories.length === 0 && (
                <tr>
                  <td className="px-4 py-2 text-center text-gray-500 dark:text-slate-400" colSpan="4">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="login-card" style={{ maxWidth: '450px', width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header avec style login */}
            <div className="login-header">
              <div className="flex items-center justify-between">
                <div>
                  <h1 style={{ fontSize: '20px', marginBottom: '4px' }}>
                    {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                  </h1>
                  <p style={{ fontSize: '12px', margin: 0 }}>
                    {editingCategory ? 'Mise à jour des informations' : 'Création d\'une nouvelle catégorie'}
                  </p>
                </div>
                <button 
                  onClick={handleCloseModal} 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors duration-200"
                  aria-label="Fermer"
                  style={{ color: 'inherit' }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Form avec style login */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
              <form onSubmit={handleSubmit} className="login-form" style={{ gap: '12px' }}>
                {/* Code catégorie */}
                <div className="form-group">
                  <label htmlFor="codeCategorie">Code catégorie</label>
                  <input
                    type="text"
                    id="codeCategorie"
                    value={formData.codeCategorie}
                    onChange={(e) => setFormData({ ...formData, codeCategorie: e.target.value })}
                    placeholder="Entrez le code catégorie"
                    maxLength={50}
                    required
                  />
                </div>

                {/* Libellé */}
                <div className="form-group">
                  <label htmlFor="libelle">Libellé</label>
                  <input
                    type="text"
                    id="libelle"
                    value={formData.libelle}
                    onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                    placeholder="Entrez le libellé"
                    maxLength={100}
                    required
                  />
                </div>

                {/* Description */}
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Entrez la description (optionnel)"
                    rows={3}
                    maxLength={250}
                  />
                </div>

                {/* Bouton de soumission */}
                <button 
                  type="submit" 
                  className="login-button"
                >
                  {editingCategory ? 'Modifier' : 'Créer la catégorie'}
                </button>
              </form>
            </div>

            {/* Footer avec style login */}
            <div className="login-footer">
              <p>Remplissez tous les champs requis (*)</p>
            </div>
          </div>
        </div>
      )}

      {/* Notifications gérées via SweetAlert2 */}
    </div>
  );
}

export default Categories;
