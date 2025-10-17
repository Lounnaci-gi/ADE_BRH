import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone, Mail, FileText, CreditCard, Hash } from 'lucide-react';
import agenceService from '../services/agenceService';

export default function AddAgencyModal({ open, onClose, onSubmit, initialValues }) {
  const [formData, setFormData] = useState({
    FK_Centre: '',
    Nom_Agence: '',
    Adresse: '',
    Telephone: '',
    Email: '',
    Fax: '',
    Nom_Banque: '',
    Compte_Bancaire: '',
    NIF: '',
    NCI: ''
  });
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setFormData({
        FK_Centre: initialValues?.FK_Centre || '',
        Nom_Agence: initialValues?.Nom_Agence || '',
        Adresse: initialValues?.Adresse || '',
        Telephone: initialValues?.Telephone || '',
        Email: initialValues?.Email || '',
        Fax: initialValues?.Fax || '',
        Nom_Banque: initialValues?.Nom_Banque || '',
        Compte_Bancaire: initialValues?.Compte_Bancaire || '',
        NIF: initialValues?.NIF || '',
        NCI: initialValues?.NCI || ''
      });
      setErrors({});
      loadCentres();
    }
  }, [open, initialValues]);

  const loadCentres = async () => {
    try {
      setLoading(true);
      const data = await agenceService.getCentres();
      setCentres(data);
    } catch (error) {
      console.error('Erreur lors du chargement des centres:', error);
    } finally {
      setLoading(false);
    }
  };

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

    if (!formData.FK_Centre) {
      newErrors.FK_Centre = 'Le centre est obligatoire';
    }

    if (!formData.Nom_Agence.trim()) {
      newErrors.Nom_Agence = 'Le nom de l\'agence est obligatoire';
    } else if (formData.Nom_Agence.length > 200) {
      newErrors.Nom_Agence = 'Le nom ne peut pas dépasser 200 caractères';
    }

    if (!formData.Adresse.trim()) {
      newErrors.Adresse = 'L\'adresse est obligatoire';
    } else if (formData.Adresse.length > 400) {
      newErrors.Adresse = 'L\'adresse ne peut pas dépasser 400 caractères';
    }

    if (!formData.Telephone.trim()) {
      newErrors.Telephone = 'Le téléphone est obligatoire';
    } else if (formData.Telephone.length > 50) {
      newErrors.Telephone = 'Le téléphone ne peut pas dépasser 50 caractères';
    }

    if (formData.Email && formData.Email.length > 200) {
      newErrors.Email = 'L\'email ne peut pas dépasser 200 caractères';
    }

    if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      newErrors.Email = 'Format d\'email invalide';
    }

    if (formData.Fax && formData.Fax.length > 50) {
      newErrors.Fax = 'Le fax ne peut pas dépasser 50 caractères';
    }

    if (formData.Nom_Banque && formData.Nom_Banque.length > 200) {
      newErrors.Nom_Banque = 'Le nom de la banque ne peut pas dépasser 200 caractères';
    }

    if (formData.Compte_Bancaire && formData.Compte_Bancaire.length > 50) {
      newErrors.Compte_Bancaire = 'Le compte bancaire ne peut pas dépasser 50 caractères';
    }

    if (formData.NIF && formData.NIF.length > 50) {
      newErrors.NIF = 'Le NIF ne peut pas dépasser 50 caractères';
    }

    if (formData.NCI && formData.NCI.length > 50) {
      newErrors.NCI = 'Le NCI ne peut pas dépasser 50 caractères';
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


  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-water-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-water-200 dark:border-water-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-water-600 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-water-900 dark:text-white">
              {initialValues ? 'Modifier l\'Agence' : 'Nouvelle Agence'}
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
          {/* Centre */}
          <div>
            <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
              <Building2 className="inline h-4 w-4 mr-2" />
              Centre *
            </label>
            <select
              name="FK_Centre"
              value={formData.FK_Centre}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                errors.FK_Centre
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
              required
              disabled={loading}
            >
              <option value="">Sélectionnez un centre</option>
              {centres.map((centre) => (
                <option key={centre.CentreId} value={centre.CentreId}>
                  {centre.Nom_Centre}
                </option>
              ))}
            </select>
            {errors.FK_Centre && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.FK_Centre}</p>
            )}
            {loading && (
              <p className="mt-1 text-sm text-water-500 dark:text-water-400">
                Chargement des centres...
              </p>
            )}
          </div>

          {/* Nom de l'Agence */}
          <div>
            <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
              <Building2 className="inline h-4 w-4 mr-2" />
              Nom de l'Agence *
            </label>
            <input
              type="text"
              name="Nom_Agence"
              value={formData.Nom_Agence}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                errors.Nom_Agence
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
              placeholder="Entrez le nom de l'agence"
              maxLength={80}
            />
            {errors.Nom_Agence && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.Nom_Agence}</p>
            )}
            <p className="mt-1 text-xs text-water-500 dark:text-water-400">
              {formData.Nom_Agence.length}/80 caractères
            </p>
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
              <MapPin className="inline h-4 w-4 mr-2" />
              Adresse *
            </label>
            <textarea
              name="Adresse"
              value={formData.Adresse}
              onChange={handleChange}
              rows={3}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 resize-none ${
                errors.Adresse
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
              placeholder="Entrez l'adresse complète de l'agence"
              maxLength={200}
            />
            {errors.Adresse && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.Adresse}</p>
            )}
            <p className="mt-1 text-xs text-water-500 dark:text-water-400">
              {formData.Adresse.length}/200 caractères
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
              name="Telephone"
              value={formData.Telephone}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                errors.Telephone
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
              placeholder="Entrez le numéro de téléphone"
              maxLength={10}
            />
            {errors.Telephone && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.Telephone}</p>
            )}
            <p className="mt-1 text-xs text-water-500 dark:text-water-400">
              {formData.Telephone.length}/10 caractères
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
              name="Email"
              value={formData.Email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                errors.Email
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
              placeholder="Entrez l'adresse email (optionnel)"
              maxLength={80}
            />
            {errors.Email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.Email}</p>
            )}
            <p className="mt-1 text-xs text-water-500 dark:text-water-400">
              {formData.Email.length}/80 caractères
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
              name="Fax"
              value={formData.Fax}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                errors.Fax
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
              placeholder="Entrez le numéro de fax (optionnel)"
              maxLength={10}
            />
            {errors.Fax && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.Fax}</p>
            )}
            <p className="mt-1 text-xs text-water-500 dark:text-water-400">
              {formData.Fax.length}/10 caractères
            </p>
          </div>

          {/* Nom de la Banque */}
          <div>
            <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
              <CreditCard className="inline h-4 w-4 mr-2" />
              Nom de la Banque
            </label>
            <input
              type="text"
              name="Nom_Banque"
              value={formData.Nom_Banque}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                errors.Nom_Banque
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
              placeholder="Entrez le nom de la banque (optionnel)"
              maxLength={200}
            />
            {errors.Nom_Banque && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.Nom_Banque}</p>
            )}
            <p className="mt-1 text-xs text-water-500 dark:text-water-400">
              {formData.Nom_Banque.length}/200 caractères
            </p>
          </div>

          {/* Compte Bancaire */}
          <div>
            <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
              <Hash className="inline h-4 w-4 mr-2" />
              Compte Bancaire
            </label>
            <input
              type="text"
              name="Compte_Bancaire"
              value={formData.Compte_Bancaire}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                errors.Compte_Bancaire
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
              placeholder="Entrez le numéro de compte bancaire (optionnel)"
              maxLength={50}
            />
            {errors.Compte_Bancaire && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.Compte_Bancaire}</p>
            )}
            <p className="mt-1 text-xs text-water-500 dark:text-water-400">
              {formData.Compte_Bancaire.length}/50 caractères
            </p>
          </div>

          {/* NIF */}
          <div>
            <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
              <Hash className="inline h-4 w-4 mr-2" />
              NIF
            </label>
            <input
              type="text"
              name="NIF"
              value={formData.NIF}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                errors.NIF
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
              placeholder="Entrez le NIF (optionnel)"
              maxLength={50}
            />
            {errors.NIF && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.NIF}</p>
            )}
            <p className="mt-1 text-xs text-water-500 dark:text-water-400">
              {formData.NIF.length}/50 caractères
            </p>
          </div>

          {/* NCI */}
          <div>
            <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
              <Hash className="inline h-4 w-4 mr-2" />
              NCI
            </label>
            <input
              type="text"
              name="NCI"
              value={formData.NCI}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                errors.NCI
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
              placeholder="Entrez le NCI (optionnel)"
              maxLength={50}
            />
            {errors.NCI && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.NCI}</p>
            )}
            <p className="mt-1 text-xs text-water-500 dark:text-water-400">
              {formData.NCI.length}/50 caractères
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
}


