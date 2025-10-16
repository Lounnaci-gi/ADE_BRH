import React, { useState, useEffect } from 'react';
import { X, MapPin, Building2 } from 'lucide-react';
import communesService from '../services/communesService';

const CommunesAddModal = ({ isOpen, onClose, onSubmit, initialValues }) => {
  const [formData, setFormData] = useState({
    Nom_Commune: '',
    FK_Agence: ''
  });
  const [agences, setAgences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      setFormData({
        Nom_Commune: initialValues.Nom_Commune || '',
        FK_Agence: initialValues.AgenceId || ''
      });
    } else {
      setFormData({
        Nom_Commune: '',
        FK_Agence: ''
      });
    }
    setErrors({});
    if (isOpen) {
      loadAgences();
    }
  }, [initialValues, isOpen]);

  const loadAgences = async () => {
    try {
      setLoading(true);
      const data = await communesService.getAgences();
      setAgences(data);
    } catch (error) {
      console.error('Erreur lors du chargement des agences:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.Nom_Commune.trim()) {
      newErrors.Nom_Commune = 'Le nom de la commune est obligatoire';
    } else if (formData.Nom_Commune.length > 200) {
      newErrors.Nom_Commune = 'Le nom ne peut pas dépasser 200 caractères';
    }

    if (!formData.FK_Agence) {
      newErrors.FK_Agence = 'L\'agence est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-water-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-water-200 dark:border-water-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-water-600 rounded-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-water-900 dark:text-white">
              {initialValues ? 'Modifier la Commune' : 'Nouvelle Commune'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-water-500 hover:text-water-700 dark:text-water-400 dark:hover:text-water-200 hover:bg-water-100 dark:hover:bg-water-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Nom de la commune */}
          <div>
            <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
              <MapPin className="inline h-4 w-4 mr-2" />
              Nom de la Commune *
            </label>
            <input
              type="text"
              name="Nom_Commune"
              value={formData.Nom_Commune}
              onChange={(e) => handleChange('Nom_Commune', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                errors.Nom_Commune
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
              placeholder="Entrez le nom de la commune"
              maxLength={200}
              disabled={loading}
            />
            {errors.Nom_Commune && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.Nom_Commune}</p>
            )}
            <p className="mt-1 text-xs text-water-500 dark:text-water-400">
              {formData.Nom_Commune.length}/200 caractères
            </p>
          </div>

          {/* Sélection de l'agence */}
          <div>
            <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
              <Building2 className="inline h-4 w-4 mr-2" />
              Agence *
            </label>
            <select
              name="FK_Agence"
              value={formData.FK_Agence}
              onChange={(e) => handleChange('FK_Agence', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                errors.FK_Agence
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
              required
              disabled={loading}
            >
              <option value="">Sélectionnez une agence</option>
              {agences.map((agence) => (
                <option key={agence.AgenceId} value={agence.AgenceId}>
                  {agence.Nom_Agence}
                </option>
              ))}
            </select>
            {errors.FK_Agence && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.FK_Agence}</p>
            )}
            {loading && (
              <p className="mt-1 text-sm text-water-500 dark:text-water-400">
                Chargement des agences...
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-water-200 dark:border-water-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-water-600 dark:text-water-400 hover:bg-water-100 dark:hover:bg-water-700 rounded-xl transition-colors font-semibold"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-water-600 hover:bg-water-700 text-white rounded-xl transition-colors font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {initialValues ? 'Modification...' : 'Création...'}
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  {initialValues ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommunesAddModal;
