import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone, Mail, FileText, CreditCard, Hash } from 'lucide-react';

const CentresAddModal = ({ isOpen, onClose, onSubmit, initialValues }) => {
  const [formData, setFormData] = useState({
    nom_centre: '',
    adresse: '',
    telephone: '',
    telephone2: '',
    email: '',
    fax: '',
    nom_banque: '',
    compte_bancaire: '',
    nif: '',
    nis: '',
    rc: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      setFormData({
        nom_centre: initialValues.Nom_Centre || '',
        adresse: initialValues.Adresse || '',
        telephone: initialValues.Telephone || '',
        telephone2: initialValues.Telephone2 || '',
        email: initialValues.Email || '',
        fax: initialValues.Fax || '',
        nom_banque: initialValues.Nom_Banque || '',
        compte_bancaire: initialValues.Compte_Bancaire || '',
        nif: initialValues.NIF || '',
        nis: initialValues.NIS || '',
        rc: initialValues.RC || ''
      });
    } else {
      setFormData({
        nom_centre: '',
        adresse: '',
        telephone: '',
        telephone2: '',
        email: '',
        fax: '',
        nom_banque: '',
        compte_bancaire: '',
        nif: '',
        nis: '',
        rc: ''
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

    if (formData.telephone2 && formData.telephone2.length > 50) {
      newErrors.telephone2 = 'Le téléphone 2 ne peut pas dépasser 50 caractères';
    }

    if (formData.nom_banque && formData.nom_banque.length > 200) {
      newErrors.nom_banque = 'Le nom de la banque ne peut pas dépasser 200 caractères';
    }

    if (formData.compte_bancaire && formData.compte_bancaire.length > 100) {
      newErrors.compte_bancaire = 'Le compte bancaire ne peut pas dépasser 100 caractères';
    }

    if (formData.nif && formData.nif.length > 50) {
      newErrors.nif = 'Le NIF ne peut pas dépasser 50 caractères';
    }

    if (formData.nis && formData.nis.length > 50) {
      newErrors.nis = 'Le NIS ne peut pas dépasser 50 caractères';
    }

    if (formData.rc && formData.rc.length > 50) {
      newErrors.rc = 'Le RC ne peut pas dépasser 50 caractères';
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {initialValues ? 'Modifier le Centre' : 'Nouveau Centre'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-600/50 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Container */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6" id="centre-form">
          {/* Nom du Centre */}
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
              <Building2 className="h-4 w-4 mr-2 text-blue-500" />
              Nom du Centre *
            </label>
            <input
              type="text"
              name="nom_centre"
              value={formData.nom_centre}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ease-in-out bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 hover:border-slate-400 dark:hover:border-slate-500 ${
                errors.nom_centre
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
              placeholder="Entrez le nom du centre"
              maxLength={200}
            />
            {errors.nom_centre && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.nom_centre}
              </p>
            )}
          </div>

          {/* Adresse */}
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-blue-500" />
              Adresse *
            </label>
            <textarea
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              rows={3}
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ease-in-out resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 hover:border-slate-400 dark:hover:border-slate-500 ${
                errors.adresse
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
              placeholder="Entrez l'adresse complète du centre"
              maxLength={400}
            />
            {errors.adresse && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.adresse}
              </p>
            )}
          </div>

          {/* Téléphone */}
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
              <Phone className="h-4 w-4 mr-2 text-blue-500" />
              Téléphone *
            </label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ease-in-out bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 hover:border-slate-400 dark:hover:border-slate-500 ${
                errors.telephone
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
              placeholder="Entrez le numéro de téléphone"
              maxLength={50}
            />
            {errors.telephone && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.telephone}
              </p>
            )}
          </div>

          {/* Téléphone 2 */}
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
              <Phone className="h-4 w-4 mr-2 text-blue-500" />
              Téléphone 2
            </label>
            <input
              type="tel"
              name="telephone2"
              value={formData.telephone2}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ease-in-out bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 hover:border-slate-400 dark:hover:border-slate-500 ${
                errors.telephone2
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
              placeholder="Entrez le numéro de téléphone secondaire (optionnel)"
              maxLength={50}
            />
            {errors.telephone2 && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.telephone2}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
              <Mail className="h-4 w-4 mr-2 text-blue-500" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ease-in-out bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 hover:border-slate-400 dark:hover:border-slate-500 ${
                errors.email
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
              placeholder="Entrez l'adresse email (optionnel)"
              maxLength={200}
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.email}
              </p>
            )}
          </div>

          {/* Fax */}
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-blue-500" />
              Fax
            </label>
            <input
              type="tel"
              name="fax"
              value={formData.fax}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ease-in-out bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 hover:border-slate-400 dark:hover:border-slate-500 ${
                errors.fax
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
              placeholder="Entrez le numéro de fax (optionnel)"
              maxLength={50}
            />
            {errors.fax && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.fax}
              </p>
            )}
          </div>

          {/* Nom de la Banque */}
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
              Nom de la Banque
            </label>
            <input
              type="text"
              name="nom_banque"
              value={formData.nom_banque}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ease-in-out bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 hover:border-slate-400 dark:hover:border-slate-500 ${
                errors.nom_banque
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
              placeholder="Entrez le nom de la banque (optionnel)"
              maxLength={200}
            />
            {errors.nom_banque && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.nom_banque}
              </p>
            )}
          </div>

          {/* Compte Bancaire */}
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
              Compte Bancaire
            </label>
            <input
              type="text"
              name="compte_bancaire"
              value={formData.compte_bancaire}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ease-in-out bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 hover:border-slate-400 dark:hover:border-slate-500 ${
                errors.compte_bancaire
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
              placeholder="Entrez le numéro de compte bancaire (optionnel)"
              maxLength={100}
            />
            {errors.compte_bancaire && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.compte_bancaire}
              </p>
            )}
          </div>

          {/* NIF */}
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
              <Hash className="h-4 w-4 mr-2 text-blue-500" />
              NIF (Numéro d'Identification Fiscale)
            </label>
            <input
              type="text"
              name="nif"
              value={formData.nif}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ease-in-out bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 hover:border-slate-400 dark:hover:border-slate-500 ${
                errors.nif
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
              placeholder="Entrez le NIF (optionnel)"
              maxLength={50}
            />
            {errors.nif && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.nif}
              </p>
            )}
          </div>

          {/* NIS */}
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
              <Hash className="h-4 w-4 mr-2 text-blue-500" />
              NIS (Numéro d'Identification Statistique)
            </label>
            <input
              type="text"
              name="nis"
              value={formData.nis}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ease-in-out bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 hover:border-slate-400 dark:hover:border-slate-500 ${
                errors.nis
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
              placeholder="Entrez le NIS (optionnel)"
              maxLength={50}
            />
            {errors.nis && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.nis}
              </p>
            )}
          </div>

          {/* RC */}
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
              <Hash className="h-4 w-4 mr-2 text-blue-500" />
              RC (Registre du Commerce)
            </label>
            <input
              type="text"
              name="rc"
              value={formData.rc}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ease-in-out bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 hover:border-slate-400 dark:hover:border-slate-500 ${
                errors.rc
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
              placeholder="Entrez le RC (optionnel)"
              maxLength={50}
            />
            {errors.rc && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.rc}
              </p>
            )}
          </div>

          </form>
          </div>

          {/* Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-600/50 rounded-2xl transition-all duration-300 font-semibold border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:scale-105"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="centre-form"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform"
            >
              {initialValues ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CentresAddModal;
