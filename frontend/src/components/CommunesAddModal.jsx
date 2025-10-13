import React, { useState, useEffect } from 'react';
import { MapPin, Building2 } from 'lucide-react';
import communesService from '../services/communesService';
import FormDialog from './FormDialog';

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
    <FormDialog
      isOpen={isOpen}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitting={loading}
      title={initialValues ? 'Modifier la commune' : 'Ajouter une commune'}
      icon={<MapPin className="h-5 w-5 text-blue-600" />}
      submitLabel={initialValues ? 'Modifier' : 'Créer'}
      description={initialValues ? 'Mettez à jour les informations de la commune.' : 'Renseignez les informations pour créer une nouvelle commune.'}
    >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom de la commune */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="inline h-4 w-4 mr-2" />
                Nom de la commune *
              </label>
              <input
                type="text"
                className={`w-full border rounded-lg p-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.Nom_Commune ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                }`}
                value={formData.Nom_Commune}
                onChange={(e) => handleChange('Nom_Commune', e.target.value)}
                placeholder="Ex: Abidjan"
                maxLength={200}
                disabled={loading}
              />
              {errors.Nom_Commune && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.Nom_Commune}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.Nom_Commune.length}/200 caractères
              </p>
            </div>

            {/* Sélection de l'agence */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Building2 className="inline h-4 w-4 mr-2" />
                Agence *
              </label>
              <select
                className={`w-full border rounded-lg p-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.FK_Agence ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                }`}
                value={formData.FK_Agence}
                onChange={(e) => handleChange('FK_Agence', e.target.value)}
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
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Chargement des agences...
                </p>
              )}
            </div>
          </div>
    </FormDialog>
  );
};

export default CommunesAddModal;
