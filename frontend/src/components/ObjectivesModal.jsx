import React, { useEffect, useState } from 'react';
import { X, Building2, Target, Calendar, DollarSign, Zap, Wrench, FileText, AlertTriangle, RotateCcw, CheckCircle, Hash } from 'lucide-react';

export default function ObjectivesModal({ open, onClose, onSubmit, initialValues, agences = [] }) {
  const [formData, setFormData] = useState({
    agenceId: '',
    dateDebut: '',
    dateFin: '',
    titre: '',
    description: '',
    obj_Encaissement: '',
    obj_Coupures: '',
    obj_Dossiers_Juridiques: '',
    obj_MisesEnDemeure: '',
    obj_Relances: '',
    obj_Controles: '',
    obj_Compteurs_Remplaces: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setError('');
      setErrors({});
      if (initialValues) {
        setFormData({
          agenceId: initialValues.AgenceId || '',
          dateDebut: initialValues.DateDebut ? new Date(initialValues.DateDebut).toISOString().split('T')[0] : '',
          dateFin: initialValues.DateFin ? new Date(initialValues.DateFin).toISOString().split('T')[0] : '',
          titre: initialValues.Titre || '',
          description: initialValues.Description || '',
          obj_Encaissement: initialValues.Obj_Encaissement ?? '',
          obj_Coupures: initialValues.Obj_Coupures ?? '',
          obj_Dossiers_Juridiques: initialValues.Obj_Dossiers_Juridiques ?? '',
          obj_MisesEnDemeure: initialValues.Obj_MisesEnDemeure ?? '',
          obj_Relances: initialValues.Obj_Relances ?? '',
          obj_Controles: initialValues.Obj_Controles ?? '',
          obj_Compteurs_Remplaces: initialValues.Obj_Compteurs_Remplaces ?? ''
        });
      } else {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        setFormData({
          agenceId: '',
          dateDebut: firstDay.toISOString().split('T')[0],
          dateFin: lastDay.toISOString().split('T')[0],
          titre: '',
          description: '',
          obj_Encaissement: '',
          obj_Coupures: '',
          obj_Dossiers_Juridiques: '',
          obj_MisesEnDemeure: '',
          obj_Relances: '',
          obj_Controles: '',
          obj_Compteurs_Remplaces: ''
        });
      }
    }
  }, [open, initialValues]);

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

    if (!formData.agenceId) {
      newErrors.agenceId = 'L\'agence est obligatoire';
    }

    if (!formData.titre) {
      newErrors.titre = 'Le titre est obligatoire';
    }

    if (!formData.dateDebut) {
      newErrors.dateDebut = 'La date de début est obligatoire';
    }

    if (!formData.dateFin) {
      newErrors.dateFin = 'La date de fin est obligatoire';
    }

    if (formData.dateDebut && formData.dateFin && new Date(formData.dateFin) < new Date(formData.dateDebut)) {
      newErrors.dateFin = 'La date de fin doit être postérieure à la date de début';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
    try {
      setLoading(true);
        const payload = {
        agenceId: parseInt(formData.agenceId, 10),
          dateDebut: formData.dateDebut,
          dateFin: formData.dateFin,
          titre: formData.titre,
          description: formData.description || null,
          obj_Encaissement: formData.obj_Encaissement ? parseFloat(formData.obj_Encaissement) : null,
          obj_Coupures: formData.obj_Coupures ? parseInt(formData.obj_Coupures, 10) : null,
          obj_Dossiers_Juridiques: formData.obj_Dossiers_Juridiques ? parseInt(formData.obj_Dossiers_Juridiques, 10) : null,
          obj_MisesEnDemeure: formData.obj_MisesEnDemeure ? parseInt(formData.obj_MisesEnDemeure, 10) : null,
          obj_Relances: formData.obj_Relances ? parseInt(formData.obj_Relances, 10) : null,
          obj_Controles: formData.obj_Controles ? parseInt(formData.obj_Controles, 10) : null,
          obj_Compteurs_Remplaces: formData.obj_Compteurs_Remplaces ? parseInt(formData.obj_Compteurs_Remplaces, 10) : null
        };

        if (initialValues) {
          payload.objectifId = initialValues.ObjectifId;
        }

        await onSubmit(payload);
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur lors de l\'enregistrement';
      setError(msg);
    } finally {
      setLoading(false);
    }
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white dark:bg-water-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-water-200 dark:border-water-700">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-water-600 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-water-900 dark:text-white">
              {initialValues ? 'Modifier l\'Objectif' : 'Nouvel Objectif'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-water-500 hover:text-water-700 dark:text-water-400 dark:hover:text-water-200 hover:bg-water-100 dark:hover:bg-water-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="m-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3 space-y-3">
          {/* Agence */}
            <div>
            <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
              <Building2 className="inline h-4 w-4 mr-2" />
              Agence *
            </label>
              <select
              name="agenceId"
                value={formData.agenceId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                errors.agenceId
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
              }`}
                required
              >
              <option value="">Sélectionnez une agence</option>
                {agences.map((a) => (
                  <option key={a.AgenceId} value={a.AgenceId}>{a.Nom_Agence}</option>
                ))}
              </select>
            {errors.agenceId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.agenceId}</p>
            )}
            </div>

          {/* Titre et Description */}
          <div className="grid grid-cols-1 gap-3">
              <div>
              <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
                <Target className="inline h-4 w-4 mr-2" />
                Titre de l'objectif *
              </label>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                  errors.titre
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
                }`}
                placeholder="Ex: Objectifs mensuels - Janvier 2025"
                  required
              />
              {errors.titre && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.titre}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
                <FileText className="inline h-4 w-4 mr-2" />
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 resize-none border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white"
                placeholder="Description détaillée de l'objectif..."
                maxLength={500}
              />
              <p className="mt-1 text-xs text-water-500 dark:text-water-400">
                {formData.description.length}/500 caractères
              </p>
            </div>
          </div>

          {/* Période */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-2" />
                Date de début *
              </label>
              <input
                type="date"
                name="dateDebut"
                value={formData.dateDebut}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                  errors.dateDebut
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
                }`}
                required
              />
              {errors.dateDebut && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dateDebut}</p>
                )}
              </div>
              <div>
              <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-2" />
                Date de fin *
              </label>
              <input
                type="date"
                name="dateFin"
                value={formData.dateFin}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 ${
                  errors.dateFin
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white'
                }`}
                  required
              />
              {errors.dateFin && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dateFin}</p>
              )}
              </div>
          </div>

          {/* Objectifs financiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
                <DollarSign className="inline h-4 w-4 mr-2" />
                Encaissement (DZD)
              </label>
              <input
                type="number"
                step="0.01"
                name="obj_Encaissement"
                value={formData.obj_Encaissement}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white"
                placeholder="Montant d'encaissement"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
                <Zap className="inline h-4 w-4 mr-2" />
                Coupures
              </label>
              <input
                type="number"
                name="obj_Coupures"
                value={formData.obj_Coupures}
                onChange={handleChange}
                step="1"
                min="0"
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white"
                placeholder="Nombre de coupures"
              />
            </div>
          </div>


          {/* Objectifs juridiques et administratifs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
                <FileText className="inline h-4 w-4 mr-2" />
                Dossiers Juridiques
              </label>
              <input
                type="number"
                name="obj_Dossiers_Juridiques"
                value={formData.obj_Dossiers_Juridiques}
                onChange={handleChange}
                step="1"
                min="0"
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white"
                placeholder="Nombre de dossiers"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
                <AlertTriangle className="inline h-4 w-4 mr-2" />
                Mises en Demeure
              </label>
              <input
                type="number"
                name="obj_MisesEnDemeure"
                value={formData.obj_MisesEnDemeure}
                onChange={handleChange}
                step="1"
                min="0"
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white"
                placeholder="Nombre de mises en demeure"
              />
            </div>
            </div>

          {/* Objectifs de suivi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
                <CheckCircle className="inline h-4 w-4 mr-2" />
                Relances
              </label>
              <input
                type="number"
                name="obj_Relances"
                value={formData.obj_Relances}
                onChange={handleChange}
                step="1"
                min="0"
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white"
                placeholder="Nombre de relances"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
                <CheckCircle className="inline h-4 w-4 mr-2" />
                Contrôles
              </label>
              <input
                type="number"
                name="obj_Controles"
                value={formData.obj_Controles}
                onChange={handleChange}
                step="1"
                min="0"
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white"
                placeholder="Nombre de contrôles"
              />
            </div>
          </div>

          {/* Compteurs */}
          <div>
            <label className="block text-sm font-semibold text-water-700 dark:text-water-300 mb-2">
              <Wrench className="inline h-4 w-4 mr-2" />
              Compteurs Remplacés
            </label>
            <input
              type="number"
              name="obj_Compteurs_Remplaces"
              value={formData.obj_Compteurs_Remplaces}
              onChange={handleChange}
              step="1"
              min="0"
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-water-500 focus:border-transparent transition-all duration-200 border-water-300 dark:border-water-600 bg-white dark:bg-water-700 text-water-900 dark:text-white"
              placeholder="Nombre de compteurs remplacés"
            />
          </div>


          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-water-200 dark:border-water-700">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-water-600 dark:text-water-400 hover:bg-water-100 dark:hover:bg-water-700 rounded-xl transition-colors font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-water-600 hover:bg-water-700 text-white rounded-xl transition-colors font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : (initialValues ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


