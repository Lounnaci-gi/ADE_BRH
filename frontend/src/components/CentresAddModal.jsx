import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone, Mail, FileText } from 'lucide-react';

const CentresAddModal = ({ isOpen, onClose, onSubmit, initialValues }) => {
  const [formData, setFormData] = useState({
    nom_centre: '',
    adresse: '',
    telephone: '',
    email: '',
    fax: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      setFormData({
        nom_centre: initialValues.Nom_Centre || '',
        adresse: initialValues.Adresse || '',
        telephone: initialValues.Telephone || '',
        email: initialValues.Email || '',
        fax: initialValues.Fax || ''
      });
    } else {
      setFormData({
        nom_centre: '',
        adresse: '',
        telephone: '',
        email: '',
        fax: ''
      });
    }
    setErrors({});
  }, [initialValues, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom_centre.trim()) {
      newErrors.nom_centre = 'Le nom du centre est obligatoire';
    } else if (formData.nom_centre.length > 200) {
      newErrors.nom_centre = 'Le nom du centre ne peut pas dépasser 200 caractères';
    }

    if (!formData.adresse.trim()) {
      newErrors.adresse = 'L\'adresse est obligatoire';
    } else if (formData.adresse.length > 400) {
      newErrors.adresse = 'L\'adresse ne peut pas dépasser 400 caractères';
    }

    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le téléphone est obligatoire';
    } else if (formData.telephone.length > 50) {
      newErrors.telephone = 'Le téléphone ne peut pas dépasser 50 caractères';
    }

    if (formData.email && formData.email.length > 200) {
      newErrors.email = 'L\'email ne peut pas dépasser 200 caractères';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (formData.fax && formData.fax.length > 50) {
      newErrors.fax = 'Le fax ne peut pas dépasser 50 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-water-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-water-200 dark:border-water-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-water-600 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-water-900 dark:text-white">
              {initialValues ? 'Modifier le Centre' : 'Nouveau Centre'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom du Centre */}
          <div>
            <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
              <Building2 className="inline h-4 w-4 mr-2" />
              Nom du Centre *
            </label>
            <input
              type="text"
              name="nom_centre"
              value={formData.nom_centre}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                errors.nom_centre
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
              placeholder="Entrez le nom du centre"
              maxLength={200}
            />
            {errors.nom_centre && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nom_centre}</p>
            )}
            <p className="mt-1 text-xs text-water-500 dark:text-water-400">
              {formData.nom_centre.length}/200 caractères
            </p>
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
              <MapPin className="inline h-4 w-4 mr-2" />
              Adresse *
            </label>
            <textarea
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              rows={3}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 resize-none ${
                errors.adresse
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
              placeholder="Entrez l'adresse complète du centre"
              maxLength={400}
            />
            {errors.adresse && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.adresse}</p>
            )}
            <p className="mt-1 text-xs text-water-500 dark:text-water-400">
              {formData.adresse.length}/400 caractères
            </p>
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
              <Phone className="inline h-4 w-4 mr-2" />
              Téléphone *
            </label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                errors.telephone
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
              placeholder="Entrez le numéro de téléphone"
              maxLength={50}
            />
            {errors.telephone && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.telephone}</p>
            )}
            <p className="mt-1 text-xs text-water-500 dark:text-water-400">
              {formData.telephone.length}/50 caractères
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
              <Mail className="inline h-4 w-4 mr-2" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                errors.email
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
              placeholder="Entrez l'adresse email (optionnel)"
              maxLength={200}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
            <p className="mt-1 text-xs text-water-500 dark:text-water-400">
              {formData.email.length}/200 caractères
            </p>
          </div>

          {/* Fax */}
          <div>
            <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
              <FileText className="inline h-4 w-4 mr-2" />
              Fax
            </label>
            <input
              type="tel"
              name="fax"
              value={formData.fax}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                errors.fax
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
              placeholder="Entrez le numéro de fax (optionnel)"
              maxLength={50}
            />
            {errors.fax && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fax}</p>
            )}
            <p className="mt-1 text-xs text-water-500 dark:text-water-400">
              {formData.fax.length}/50 caractères
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-water-200 dark:border-water-700">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 text-water-600 dark:text-water-400 hover:bg-water-100 dark:hover:bg-water-700 rounded-xl transition-colors font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-water-600 hover:bg-water-700 text-white rounded-xl transition-colors font-semibold shadow-lg hover:shadow-xl"
            >
              {initialValues ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CentresAddModal;
