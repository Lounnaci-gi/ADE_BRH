import React, { useEffect, useState } from 'react';
import { X, Building2, Target, Calendar, DollarSign, Zap, Wrench, FileText, AlertTriangle, RotateCcw, CheckCircle, Hash } from 'lucide-react';
import ModernDatePicker from './ModernDatePicker';
import '../pages/Login.css';

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
      <div className="login-card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="login-header">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h1>{initialValues ? 'Modifier l\'Objectif' : 'Nouvel Objectif'}</h1>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p>Remplissez les informations ci-dessous</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Agence */}
          <div className="form-group">
            <label htmlFor="agenceId">
              <Building2 className="inline h-4 w-4 mr-1" />
              Agence *
            </label>
            <select
              id="agenceId"
              name="agenceId"
              value={formData.agenceId}
              onChange={handleChange}
              className={errors.agenceId ? 'error-input' : ''}
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
          <div className="form-group">
            <label htmlFor="titre">
              <Target className="inline h-4 w-4 mr-1" />
              Titre de l'objectif *
            </label>
            <input
              type="text"
              id="titre"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              className={errors.titre ? 'error-input' : ''}
              placeholder="Ex: Objectifs mensuels - Janvier 2025"
              required
            />
            {errors.titre && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.titre}</p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="description">
              <FileText className="inline h-4 w-4 mr-1" />
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              placeholder="Description détaillée de l'objectif..."
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.description.length}/500 caractères
            </p>
          </div>

          {/* Période - Date de début et Date de fin sur la même ligne */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>
                <Calendar className="inline h-4 w-4 mr-1" />
                Date de début *
              </label>
              <div className={errors.dateDebut ? 'error-input' : ''} style={{ border: 'none', padding: 0 }}>
                <ModernDatePicker
                  value={formData.dateDebut}
                  onChange={(date) => setFormData(prev => ({ ...prev, dateDebut: date }))}
                  placeholder="Sélectionner la date de début"
                />
              </div>
              {errors.dateDebut && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dateDebut}</p>
              )}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>
                <Calendar className="inline h-4 w-4 mr-1" />
                Date de fin *
              </label>
              <div className={errors.dateFin ? 'error-input' : ''} style={{ border: 'none', padding: 0 }}>
                <ModernDatePicker
                  value={formData.dateFin}
                  onChange={(date) => setFormData(prev => ({ ...prev, dateFin: date }))}
                  placeholder="Sélectionner la date de fin"
                />
              </div>
              {errors.dateFin && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dateFin}</p>
              )}
            </div>
          </div>

          {/* Objectifs financiers */}
          <div className="form-group">
            <label htmlFor="obj_Encaissement">
              <DollarSign className="inline h-4 w-4 mr-1" />
              Encaissement (DZD)
            </label>
            <input
              type="number"
              step="0.01"
              id="obj_Encaissement"
              name="obj_Encaissement"
              value={formData.obj_Encaissement}
              onChange={handleChange}
              placeholder="Montant d'encaissement"
            />
          </div>
          {/* Coupures et Contrôles sur la même ligne */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="obj_Coupures">
                <Zap className="inline h-4 w-4 mr-1" />
                Coupures
              </label>
              <input
                type="number"
                id="obj_Coupures"
                name="obj_Coupures"
                value={formData.obj_Coupures}
                onChange={handleChange}
                step="1"
                min="0"
                placeholder="Nombre de coupures"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="obj_Controles">
                <CheckCircle className="inline h-4 w-4 mr-1" />
                Contrôles
              </label>
              <input
                type="number"
                id="obj_Controles"
                name="obj_Controles"
                value={formData.obj_Controles}
                onChange={handleChange}
                step="1"
                min="0"
                placeholder="Nombre de contrôles"
              />
            </div>
          </div>

          {/* Mises en Demeure et Relances sur la même ligne */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="obj_MisesEnDemeure">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                Mises en Demeure
              </label>
              <input
                type="number"
                id="obj_MisesEnDemeure"
                name="obj_MisesEnDemeure"
                value={formData.obj_MisesEnDemeure}
                onChange={handleChange}
                step="1"
                min="0"
                placeholder="Nombre de mises en demeure"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="obj_Relances">
                <CheckCircle className="inline h-4 w-4 mr-1" />
                Relances
              </label>
              <input
                type="number"
                id="obj_Relances"
                name="obj_Relances"
                value={formData.obj_Relances}
                onChange={handleChange}
                step="1"
                min="0"
                placeholder="Nombre de relances"
              />
            </div>
          </div>

          {/* Dossiers Juridiques et Compteurs Remplacés sur la même ligne */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="obj_Dossiers_Juridiques">
                <FileText className="inline h-4 w-4 mr-1" />
                Dossiers Juridiques
              </label>
              <input
                type="number"
                id="obj_Dossiers_Juridiques"
                name="obj_Dossiers_Juridiques"
                value={formData.obj_Dossiers_Juridiques}
                onChange={handleChange}
                step="1"
                min="0"
                placeholder="Nombre de dossiers"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="obj_Compteurs_Remplaces">
                <Wrench className="inline h-4 w-4 mr-1" />
                Compteurs Remplacés
              </label>
              <input
                type="number"
                id="obj_Compteurs_Remplaces"
                name="obj_Compteurs_Remplaces"
                value={formData.obj_Compteurs_Remplaces}
                onChange={handleChange}
                step="1"
                min="0"
                placeholder="Nombre de compteurs remplacés"
              />
            </div>
          </div>


          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? 'Enregistrement...' : (initialValues ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


